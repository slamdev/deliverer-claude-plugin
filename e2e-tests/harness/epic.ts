/**
 * What a refinement published, read off the working tree it published into (end-to-end-tests
 * ticket 02).
 *
 * This reads; `./matchers.ts` judges. The split is what keeps a failure able to say what was there
 * instead of only what was not.
 *
 * Where to look comes from the **fixture**, which declares the tracker root its repository's
 * conventions name. The shape inside it is the plugin's own contract and not the fixture's: one
 * directory per **epic**, the **spec** at `spec.md`, and one file per **ticket** under `issues/`,
 * numbered from `01`. A fixture that put its epics somewhere else changes the first and none of the
 * rest.
 */
import { readFile, readdir } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";

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

export interface PublishedTicket {
  /** relative to the clone, so a failure names the path a contributor would open */
  readonly path: string;
  readonly file: string;
  /** the number its filename carries, or null when it carries none */
  readonly number: number | null;
  readonly declaresBlockingEdges: boolean;
  readonly triageLabel: string | null;
}

export interface PublishedEpic {
  readonly slug: string;
  /** relative to the clone */
  readonly directory: string;
  readonly specPath: string | null;
  readonly specText: string;
  readonly specTriageLabel: string | null;
  readonly tickets: readonly PublishedTicket[];
  /** everything else the run left in the epic's directory, which a failure is worth quoting */
  readonly otherFiles: readonly string[];
}

/** Every epic in the working tree, by slug. Taken before a run and after it. */
export async function listEpics(cloneDir: string, trackerRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(join(cloneDir, trackerRoot), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function readEpic(
  cloneDir: string,
  trackerRoot: string,
  slug: string,
): Promise<PublishedEpic> {
  const directory = posix.join(trackerRoot, slug);
  const absolute = join(cloneDir, trackerRoot, slug);
  const files = await filesUnder(absolute);

  const specPath = files.includes("spec.md") ? posix.join(directory, "spec.md") : null;
  const specText = specPath === null ? "" : await readFile(join(cloneDir, specPath), "utf8");

  const tickets: PublishedTicket[] = [];
  const otherFiles: string[] = [];
  for (const file of files) {
    if (file === "spec.md") continue;
    if (!file.startsWith("issues/")) {
      otherFiles.push(posix.join(directory, file));
      continue;
    }
    const name = file.slice("issues/".length);
    if (name.includes("/") || !name.endsWith(".md")) {
      otherFiles.push(posix.join(directory, file));
      continue;
    }
    const text = await readFile(join(absolute, "issues", name), "utf8");
    const number = TICKET_NUMBER.exec(name)?.[1];
    tickets.push({
      path: posix.join(directory, "issues", name),
      file: name,
      number: number === undefined ? null : Number(number),
      declaresBlockingEdges: BLOCKING_EDGES.test(text),
      triageLabel: TRIAGE_LABEL.exec(text)?.[1] ?? null,
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
