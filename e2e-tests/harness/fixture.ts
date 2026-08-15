/**
 * A fixture is a directory (end-to-end-tests ticket 02).
 *
 * Adding one is adding a directory — never an edit here, and never a test that has to be disturbed
 * to make room for it. Five things are read out of it, always under the same names, and the last of
 * them is optional:
 *
 *  - `repository/` — the codebase a run is driven against: its unit tests, its typecheck, its CI
 *    workflow and the `CLAUDE.md` declaring the conventions both skills publish by. It is what the
 *    standing repo carries (`./standing-repo.ts`).
 *  - `idea.md` — the **idea** a refinement is handed, as its argument.
 *  - `brief.md` — the **brief** the **responder** answers a grilling out of.
 *  - `fixture.json` — the same conventions the repository declares in prose, in the form a matcher
 *    can read: where an epic's directory sits, what the spec inside it is called, where its tickets
 *    go, and what the repository calls the **triage label** for work ready for an agent. That is
 *    what lets a matcher name a location and a label exactly rather than search for either, and it
 *    is why a fixture that lays its tracker out differently is still only a directory. A fixture
 *    that names no label vocabulary is owed no label, which is what the two writers already say
 *    about a project that names none.
 *  - `epic/` — the **epic** a delivery is handed: a spec and its **tickets**, laid out the way the
 *    tracker conventions above lay one out. It is copied into the repository at
 *    `<tracker.root>/<epicSlug>/` when the **throwaway repo** is built, so it is on the default
 *    branch from the moment that repository exists rather than seeded by a test afterwards
 *    (`./forge.ts`).
 *
 * **Only a delivery gets the epic.** The **standing repo** a refinement clones is built from the
 * same fixture without it: a tracker root that already carries an epic is one a refinement can
 * publish its own on top of, and two epics under one slug are indistinguishable from a refinement
 * that published nothing. A fixture that carries no `epic/` is a fixture no delivery can be driven
 * against, which is the builder's to say and not this module's.
 *
 * **`brief.md` is the fixture's and stays here.** Refinement writes a brief of its own to the
 * operating system's temporary directory and treats one it finds there as proof that stage 1
 * already ran, so a harness that staged this file under that name would skip the grilling on the
 * FIRST run rather than the second — the trap with two mouths, and this is the second one. Nothing
 * here writes it anywhere: it is read from the fixture directory and handed to the responder as
 * text.
 */
import { readFile, stat } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Every fixture, one directory each, beside the harness that loads them. */
export const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

/**
 * Where a repository's conventions put an **epic**.
 *
 * The fixture's, not the plugin's. What the plugin promises is one file per **ticket**, numbered
 * from `01`, each declaring its **blocking edges** — and that is asserted in `./matchers.ts`
 * whatever a fixture calls its directories.
 */
export interface TrackerConventions {
  /** where an epic's directory sits, relative to the repository's root */
  readonly root: string;
  /** what the spec is called inside it */
  readonly specFile: string;
  /** where the tickets sit inside it */
  readonly ticketsDirectory: string;
}

/** The **epic** a delivery is handed, and where it lands in the repository the fixture builds. */
export interface FixtureEpic {
  /** the directory in the fixture holding the spec and the tickets, laid out as the tracker does */
  readonly directory: string;
  /** the epic's **slug**: the directory it lands at under the tracker's root */
  readonly slug: string;
  /** where a delivery is told to find it, relative to the repository's root */
  readonly location: string;
}

export interface Fixture {
  /** the directory's name, which is half of what the standing repo is named for */
  readonly name: string;
  readonly root: string;
  /** the codebase, and everything a repository declares about itself */
  readonly repositoryDir: string;
  readonly tracker: TrackerConventions;
  /** the epic a delivery is driven against, or null where the fixture carries none */
  readonly epic: FixtureEpic | null;
  /** what its conventions call work that is ready for an agent, or null where they name nothing */
  readonly readyForAgentLabel: string | null;
  /** the idea a refinement is handed — one line, because it is a command's argument */
  readonly idea: string;
  /** the brief the responder answers from, verbatim */
  readonly brief: string;
}

/** What `fixture.json` is allowed to say. Everything else in it is documentation. */
interface FixtureManifest {
  readonly tracker?: Record<string, unknown>;
  readonly readyForAgentLabel?: unknown;
  readonly epicSlug?: unknown;
}

export async function loadFixture(name: string): Promise<Fixture> {
  const root = join(FIXTURES_DIR, name);
  if (!(await isDirectory(root))) {
    throw new Error(
      `there is no fixture called ${name}: ${root} is not a directory. A fixture is a directory ` +
        `under ${FIXTURES_DIR} carrying repository/, idea.md, brief.md and fixture.json.`,
    );
  }
  const repositoryDir = join(root, "repository");
  if (!(await isDirectory(repositoryDir))) {
    throw new Error(
      `the fixture ${name} carries no repository/ directory at ${repositoryDir}, so there is ` +
        `nothing for a run to be driven against.`,
    );
  }

  const manifest = JSON.parse(await read(root, "fixture.json", name)) as FixtureManifest;
  const tracker = {
    root: declared(manifest.tracker, "root", name),
    specFile: declared(manifest.tracker, "specFile", name),
    ticketsDirectory: declared(manifest.tracker, "ticketsDirectory", name),
  };

  // Collapsed to one line because it is handed to `/deliverer:refine` as its argument, and a
  // newline in the middle of a command would end it there.
  const idea = (await read(root, "idea.md", name)).replace(/\s+/g, " ").trim();
  if (idea === "") {
    throw new Error(
      `the fixture ${name} has an empty idea.md, so a refinement has nothing to run on.`,
    );
  }

  const label = manifest.readyForAgentLabel;
  return {
    name,
    root,
    repositoryDir,
    tracker,
    epic: await loadEpic(root, name, manifest.epicSlug, tracker),
    readyForAgentLabel: typeof label === "string" && label !== "" ? label : null,
    idea,
    brief: await read(root, "brief.md", name),
  };
}

/**
 * The epic in `epic/`, or null when the fixture carries none.
 *
 * The two have to arrive together: a directory with no slug lands nowhere, and a slug with no
 * directory names an epic that is not there. Either on its own is a fixture half-edited, which is
 * worth saying here rather than leaving a delivery to be handed a location holding nothing.
 */
async function loadEpic(
  root: string,
  name: string,
  slug: unknown,
  tracker: TrackerConventions,
): Promise<FixtureEpic | null> {
  const directory = join(root, "epic");
  const present = await isDirectory(directory);
  const named = typeof slug === "string" && slug !== "";
  if (!present && !named) return null;
  if (!present || !named) {
    throw new Error(
      `the fixture ${name} carries ${present ? `an epic/ directory and no "epicSlug"` : `an ` +
        `"epicSlug" and no epic/ directory`} in fixture.json. An epic is both — the directory is ` +
        `the spec and its tickets, and the slug is where they land under ${tracker.root}/.`,
    );
  }
  return {
    directory,
    slug: slug as string,
    location: posix.join(tracker.root, slug as string),
  };
}

/** One of the three paths a fixture's tracker conventions are made of. */
function declared(tracker: Record<string, unknown> | undefined, key: string, name: string): string {
  const value = tracker?.[key];
  if (typeof value !== "string" || value === "") {
    throw new Error(
      `the fixture ${name} declares no string "tracker.${key}" in fixture.json. The three of ` +
        `them are where its repository's conventions put an epic, and without them no matcher ` +
        `can name where one landed.`,
    );
  }
  return value;
}

async function read(root: string, file: string, name: string): Promise<string> {
  try {
    return await readFile(join(root, file), "utf8");
  } catch {
    throw new Error(
      `the fixture ${name} is missing ${file}. Every fixture carries repository/, idea.md, ` +
        `brief.md and fixture.json under the same names, which is what makes adding one a matter ` +
        `of adding a directory.`,
    );
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}
