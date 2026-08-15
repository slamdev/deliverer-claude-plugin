/**
 * A fixture is a directory (end-to-end-tests ticket 02).
 *
 * Adding one is adding a directory — never an edit here, and never a test that has to be disturbed
 * to make room for it. Four things are read out of it, always under the same names:
 *
 *  - `repository/` — the codebase a run is driven against: its unit tests, its typecheck, its CI
 *    workflow and the `CLAUDE.md` declaring the conventions both skills publish by. It is what the
 *    standing repo carries (`./standing-repo.ts`).
 *  - `idea.md` — the **idea** a refinement is handed, as its argument.
 *  - `brief.md` — the **brief** the **responder** answers a grilling out of.
 *  - `fixture.json` — where the repository's conventions put an epic, and what they call the
 *    **triage label** for work ready for an agent. That is what lets a matcher name a location and
 *    a label exactly rather than search for either. A fixture that names no label vocabulary is
 *    owed no label, which is what the two writers already say about a project that names none.
 *
 * **`brief.md` is the fixture's and stays here.** Refinement writes a brief of its own to the
 * operating system's temporary directory and treats one it finds there as proof that stage 1
 * already ran, so a harness that staged this file under that name would skip the grilling on the
 * FIRST run rather than the second — the trap with two mouths, and this is the second one. Nothing
 * here writes it anywhere: it is read from the fixture directory and handed to the responder as
 * text.
 */
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Every fixture, one directory each, beside the harness that loads them. */
export const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

export interface Fixture {
  /** the directory's name, which is half of what the standing repo is named for */
  readonly name: string;
  readonly root: string;
  /** the codebase, and everything a repository declares about itself */
  readonly repositoryDir: string;
  /** where this repository's conventions put an epic, relative to its root */
  readonly trackerRoot: string;
  /** what its conventions call work that is ready for an agent, or null where they name nothing */
  readonly readyForAgentLabel: string | null;
  /** the idea a refinement is handed — one line, because it is a command's argument */
  readonly idea: string;
  /** the brief the responder answers from, verbatim */
  readonly brief: string;
}

/** What `fixture.json` is allowed to say. Everything else in it is documentation. */
interface FixtureManifest {
  readonly trackerRoot?: unknown;
  readonly readyForAgentLabel?: unknown;
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
  const trackerRoot = manifest.trackerRoot;
  if (typeof trackerRoot !== "string" || trackerRoot === "") {
    throw new Error(
      `the fixture ${name} declares no string "trackerRoot" in fixture.json. That is where its ` +
        `repository's conventions put an epic, and without it no matcher can name where one ` +
        `landed.`,
    );
  }

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
    trackerRoot,
    readyForAgentLabel: typeof label === "string" && label !== "" ? label : null,
    idea,
    brief: await read(root, "brief.md", name),
  };
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
