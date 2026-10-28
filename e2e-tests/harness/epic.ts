/**
 * An **epic**, read where a refinement published it and seeded where a delivery is handed it
 * (end-to-end-tests ticket 02; refine-commits-its-vocabulary ticket 03).
 *
 * This reads; `./matchers.ts` judges. The split is what keeps a failure able to say what was there
 * instead of only what was not.
 *
 * **Where to look is the fixture's to say, and what to find there is the plugin's.** Where the
 * fixture's tracker is files in the repository, the tracker root, the spec's filename and the
 * directory the tickets go in are all a repository's own conventions, so they are read off the
 * fixture (`./fixture.ts`) rather than written down here — that is what keeps a fixture which lays
 * its tracker out differently a directory rather than a harness edit. What the plugin promises
 * whatever those paths are — one **ticket** per slice, each declaring its **blocking edges** — is
 * asserted in `./matchers.ts`.
 *
 * **This is the one place the tracker kind branches.** An in-repository epic is read off the clone
 * and seeded into the fixture's tree before its one commit; a forge-issue epic is read off the
 * **throwaway repo**'s issues and seeded onto them once the repository exists. Every caller asks
 * the same three questions — which epics are there, what does one hold, where is the one a
 * delivery is handed — and gets the same answer shape whichever kind it is.
 */
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, sep } from "node:path";
import type { Fixture, FixtureEpic, InRepositoryTracker } from "./fixture.ts";
import { listIssues, type ForgeIssue } from "./forge.ts";
import type { RunDirectory } from "./run-directory.ts";

/** Where a ticket declares what blocks it, in either shape the writer's templates use. */
const BLOCKING_EDGES =
  /^[ \t]*(?:[*_]{0,2}Blocked[ \t]by[*_]{0,2}[ \t]*:|#{1,6}[ \t]*Blocked[ \t]by\b)/im;

/**
 * The `Status:` line the conventions put a triage label on.
 *
 * Both templates are read, because both are written: a bare `Status: ready-for-agent` and the
 * `**Status:** ready-for-agent` a writer emphasises. What is between the colon and the label is
 * whitespace and emphasis in any order, and none of it is the label.
 */
const TRIAGE_LABEL = /^[ \t]*[*_]{0,2}Status[*_]{0,2}[ \t]*:[ \t*_`]*([a-z][a-z-]*)/im;

/** A ticket file's number, which delivery records a ticket by and which starts at `01`. */
const TICKET_NUMBER = /^(\d{1,3})[-_]/;

/** Where an epic can be: the run's directories, and the throwaway repo a run was driven against. */
export interface EpicSource {
  readonly runDirectory: RunDirectory;
  /** the throwaway repo, `owner/name` on the forge */
  readonly fullName: string;
}

export interface PublishedTicket {
  /**
   * Where a contributor opens it: relative to the clone for a file, the issue's URL for an issue.
   */
  readonly path: string;
  /** the file's name, or the issue's title */
  readonly file: string;
  /**
   * The number delivery records it by: the one its filename carries, or the issue's own number,
   * which the forge assigns. Null where a file carries none.
   */
  readonly number: number | null;
  readonly declaresBlockingEdges: boolean;
  readonly triageLabel: string | null;
  /** what it says: the file's text, or the issue's body */
  readonly text: string;
}

export interface PublishedEpic {
  /**
   * What `listEpics` names it by: the directory's name under an in-repository tracker's root, and
   * the spec issue's number on a forge-issue tracker.
   */
  readonly slug: string;
  /** relative to the clone, or the throwaway repo's issues page on a forge-issue tracker */
  readonly directory: string;
  /** relative to the clone, or the spec issue's URL */
  readonly specPath: string | null;
  readonly specText: string;
  readonly specTriageLabel: string | null;
  readonly tickets: readonly PublishedTicket[];
  /** everything else the run left beside the epic, which a failure is worth quoting */
  readonly otherFiles: readonly string[];
}

/** Every epic the fixture's tracker holds, by what `readEpic` takes. Taken before a run and after. */
export async function listEpics(source: EpicSource, fixture: Fixture): Promise<string[]> {
  if (fixture.tracker.kind === "forge-issues") {
    const issues = await listIssues(source.runDirectory, source.fullName);
    return issues.filter((issue) => !isTicket(issue)).map((issue) => String(issue.number));
  }
  return listEpicDirectories(source.runDirectory.cloneDir, fixture.tracker);
}

/** One epic, by what `listEpics` named it — an empty one, read as such, where nothing is there. */
export async function readEpic(
  source: EpicSource,
  fixture: Fixture,
  slug: string,
): Promise<PublishedEpic> {
  if (fixture.tracker.kind === "forge-issues") {
    const issues = await listIssues(source.runDirectory, source.fullName);
    return readIssueEpic(source, fixture, issues, slug);
  }
  return readEpicDirectory(source.runDirectory.cloneDir, fixture.tracker, slug);
}

/**
 * What a delivery's epic seeds into the fixture's tree before its one commit, or nothing.
 *
 * An in-repository epic is copied to the location its tracker conventions put one, so it is on the
 * default branch from the moment the repository exists. A forge-issue epic is not in the tree at
 * all, and is seeded onto the forge instead (`seedEpicOnForge`).
 */
export function seedEpicInTree(
  fixture: Fixture,
  epic: FixtureEpic,
): ((fixtureRepoDir: string) => Promise<void>) | undefined {
  const location = epic.location;
  if (fixture.tracker.kind === "forge-issues" || location === null) return undefined;
  return (fixtureRepoDir) => copyEpic(fixtureRepoDir, fixture, epic, location);
}

/**
 * The delivery's epic seeded onto the throwaway repo once it exists, and the location the delivery
 * is handed.
 *
 * An in-repository epic is already there — `seedEpicInTree` put it on the default branch — so its
 * location is the path it landed at. A forge-issue epic is published from `epic/` as issues here:
 * that is ticket 05 of refine-commits-its-vocabulary, together with the branch and draft a
 * refinement would have left, and until it lands this says so rather than handing a delivery
 * nothing.
 */
export async function seedEpicOnForge(
  source: EpicSource,
  fixture: Fixture,
  epic: FixtureEpic,
): Promise<string> {
  if (fixture.tracker.kind === "in-repository" && epic.location !== null) return epic.location;
  throw new Error(
    `the fixture ${fixture.name} keeps its tracker on the forge's issues, and publishing its ` +
      `epic/ as issues on ${source.fullName} is not built yet, so a delivery has nothing to be ` +
      `handed (refine-commits-its-vocabulary ticket 05).`,
  );
}

/**
 * The epic where something that reads files can open it — the **verifier**, whose tools are
 * `Read`, `Glob` and `Grep` and nothing that reaches the forge (refine-commits-its-vocabulary
 * ticket 04).
 *
 * An in-repository epic already is: its paths are the clone's. A forge-issue epic is written out
 * into the run directory, one file per issue carrying its title, its URL and its body, and handed
 * back with those files' absolute paths where the URLs were — so the verifier reads the issues
 * first-hand, as the forge had them when the run returned, and a failing run keeps them beside
 * everything else it left. Nothing is written into the clone, which stays as the run left it.
 */
export async function epicForReading(
  runDirectory: RunDirectory,
  fixture: Fixture,
  epic: PublishedEpic,
): Promise<PublishedEpic> {
  if (fixture.tracker.kind === "in-repository") return epic;
  const directory = join(runDirectory.root, "epic-issues");
  await mkdir(directory, { recursive: true });
  const written = async (name: string, title: string, url: string, body: string) => {
    const path = join(directory, `${name}.md`);
    await writeFile(path, `# ${title}\n\n${url}\n\n${body}\n`);
    return path;
  };
  const specPath =
    epic.specPath === null
      ? null
      : await written(`spec-${epic.slug}`, "the spec", epic.specPath, epic.specText);
  const tickets: PublishedTicket[] = [];
  for (const ticket of epic.tickets) {
    const path = await written(
      `ticket-${ticket.number ?? tickets.length + 1}`,
      ticket.file,
      ticket.path,
      ticket.text,
    );
    tickets.push({ ...ticket, path });
  }
  return { ...epic, directory, specPath, tickets };
}

// --- in the repository -------------------------------------------------------------------------

async function listEpicDirectories(
  cloneDir: string,
  tracker: InRepositoryTracker,
): Promise<string[]> {
  try {
    const entries = await readdir(join(cloneDir, tracker.root), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

async function readEpicDirectory(
  cloneDir: string,
  tracker: InRepositoryTracker,
  slug: string,
): Promise<PublishedEpic> {
  const directory = posix.join(tracker.root, slug);
  const absolute = join(cloneDir, tracker.root, slug);
  const files = await filesUnder(absolute);
  const inTickets = `${tracker.ticketsDirectory}/`;

  const specPath = files.includes(tracker.specFile)
    ? posix.join(directory, tracker.specFile)
    : null;
  const specText = specPath === null ? "" : await readFile(join(cloneDir, specPath), "utf8");

  const tickets: PublishedTicket[] = [];
  const otherFiles: string[] = [];
  for (const file of files) {
    if (file === tracker.specFile) continue;
    if (!file.startsWith(inTickets)) {
      otherFiles.push(posix.join(directory, file));
      continue;
    }
    const name = file.slice(inTickets.length);
    if (name.includes("/") || !name.endsWith(".md")) {
      otherFiles.push(posix.join(directory, file));
      continue;
    }
    const text = await readFile(join(absolute, tracker.ticketsDirectory, name), "utf8");
    const number = TICKET_NUMBER.exec(name)?.[1];
    tickets.push({
      path: posix.join(directory, tracker.ticketsDirectory, name),
      file: name,
      number: number === undefined ? null : Number(number),
      declaresBlockingEdges: BLOCKING_EDGES.test(text),
      triageLabel: TRIAGE_LABEL.exec(text)?.[1] ?? null,
      text,
    });
  }

  return {
    slug,
    directory,
    specPath,
    specText,
    specTriageLabel: TRIAGE_LABEL.exec(specText)?.[1] ?? null,
    tickets: tickets.sort((left, right) => left.file.localeCompare(right.file)),
    otherFiles: otherFiles.sort(),
  };
}

/** The epic, at the location the fixture's own tracker conventions put one. */
async function copyEpic(
  fixtureRepoDir: string,
  fixture: Fixture,
  epic: FixtureEpic,
  location: string,
): Promise<void> {
  const entries = await readdir(epic.directory, { withFileTypes: true, recursive: true });
  const files = entries.filter((entry) => entry.isFile());
  if (files.length === 0) {
    throw new Error(`the fixture ${fixture.name} has an empty epic/ at ${epic.directory}`);
  }
  for (const entry of files) {
    const source = join(entry.parentPath, entry.name);
    const inEpic = relative(epic.directory, source).split(sep).join("/");
    const destination = join(fixtureRepoDir, ...location.split("/"), inEpic);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

/** Every file under a directory, in slash-separated paths relative to it. */
async function filesUnder(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true, recursive: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"))
      .sort();
  } catch {
    return [];
  }
}

// --- on the forge's issues ---------------------------------------------------------------------

/**
 * Whether an issue is a ticket rather than a spec.
 *
 * A ticket is a sub-issue of its spec, or declares its blocking edges — by the forge's own
 * mechanism or by a `Blocked by:` line, since `tickets-writer` keeps the line where the forge has no
 * way to say "None — can start immediately". A spec is neither: it has no parent and nothing
 * blocks it.
 */
function isTicket(issue: ForgeIssue): boolean {
  return issue.parent !== null || issue.blockedBy.length > 0 || BLOCKING_EDGES.test(issue.body);
}

/**
 * The epic whose spec is the issue numbered `slug`: its tickets are every ticket that is its
 * sub-issue or nobody's, since a throwaway repo carries one epic and a writer that published no
 * parent link is still a writer that published tickets. A ticket parented on some other issue is
 * someone else's, and is quoted rather than counted.
 */
function readIssueEpic(
  source: EpicSource,
  fixture: Fixture,
  issues: readonly ForgeIssue[],
  slug: string,
): PublishedEpic {
  const directory = `https://github.com/${source.fullName}/issues`;
  const spec = issues.find((issue) => String(issue.number) === slug && !isTicket(issue));
  const tickets: PublishedTicket[] = [];
  const otherFiles: string[] = [];
  for (const issue of issues) {
    if (issue === spec) continue;
    const ours = isTicket(issue) && (issue.parent === null || issue.parent === spec?.number);
    if (!ours) {
      otherFiles.push(issue.url);
      continue;
    }
    tickets.push({
      path: issue.url,
      file: issue.title,
      number: issue.number,
      declaresBlockingEdges: issue.blockedBy.length > 0 || BLOCKING_EDGES.test(issue.body),
      triageLabel: issueTriageLabel(issue, fixture),
      text: issue.body,
    });
  }
  return {
    slug,
    directory,
    specPath: spec?.url ?? null,
    specText: spec?.body ?? "",
    specTriageLabel: spec === undefined ? null : issueTriageLabel(spec, fixture),
    tickets: tickets.sort((left, right) => (left.number ?? 0) - (right.number ?? 0)),
    otherFiles: otherFiles.sort(),
  };
}

/**
 * The triage label an issue carries: the forge's label the fixture names for work ready for an
 * agent where it is there, else whatever a `Status:` line in the body says, else the issue's first
 * label — so a failure can say what was there instead.
 */
function issueTriageLabel(issue: ForgeIssue, fixture: Fixture): string | null {
  const ready = fixture.readyForAgentLabel;
  if (ready !== null && issue.labels.includes(ready)) return ready;
  return TRIAGE_LABEL.exec(issue.body)?.[1] ?? issue.labels[0] ?? null;
}
