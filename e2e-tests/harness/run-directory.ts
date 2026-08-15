/**
 * The run directory: everything one run touches, in one place outside the repository
 * (end-to-end-tests ticket 01).
 *
 * It carries four things, and each of them is here for a reason that has already bitten somebody:
 *
 *  - **its own plugin configuration directory.** `CLAUDE_CONFIG_DIR` is where the two marketplaces
 *    are added, where the plugin is installed, where its three options are written at USER scope,
 *    where the tools server's dependencies are installed, and where the session records land. One
 *    per run is what makes runs independent, and it is what makes user scope the harness's own
 *    scope rather than the contributor's (ADR-0016).
 *  - **its own temporary directory.** Not hygiene: refinement writes the brief to the operating
 *    system's temporary directory under a name derived from the epic's slug, and treats a brief on
 *    disk as proof that the grilling already ran. A stable slug plus a shared temporary directory
 *    means the second run skips stage 1 entirely — a pass that tested nothing.
 *  - **an empty directory for the session to run in.** A run with no clone puts its session here
 *    rather than in this repository, whose project settings deliberately withhold `deliverer` from
 *    `enabledPlugins` under the no-dogfooding rule — indistinguishable, from inside a session, from
 *    the failure the smoke test exists to catch.
 *  - **the staged copy**, which is the plugin the run installs (`./staged-copy.ts`).
 *
 * NOTHING IS EVER REMOVED. A run that went wrong is only readable afterwards, so the directory
 * outlives the test whether it passed or failed, and the test names the path it is at. That is
 * paid in disk — roughly 350 MB a run, nearly all of it the tools server's installed dependencies
 * and the official marketplace's clone — under the operating system's own temporary directory,
 * which is the one place a machine already knows how to reclaim.
 */
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Where run directories are made. Outside the repository, so no run is ever a change to it. */
const RUN_ROOT = join(tmpdir(), "deliverer-e2e");

export interface RunDirectory {
  /** the directory itself, named for the test and the moment it was made */
  readonly root: string;
  /** `CLAUDE_CONFIG_DIR`: the marketplaces, the install, the options and the session records */
  readonly configDir: string;
  /** `TMPDIR`: the run's own temporary directory, reachable by no other run */
  readonly tempDir: string;
  /** the working tree committed into a temporary repository — the marketplace a run installs */
  readonly stagedCopyDir: string;
  /** the empty directory a session with no clone runs in */
  readonly sessionDir: string;
}

export async function createRunDirectory(testName: string): Promise<RunDirectory> {
  await mkdir(RUN_ROOT, { recursive: true });
  // The timestamp is for the reader — it is what makes a directory listing tell a contributor which
  // run is which — and `mkdtemp`'s suffix is what makes two runs in the same second impossible to
  // confuse. Colons are stripped because a path is easier to paste without them.
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\..*$/, "");
  const root = await mkdtemp(join(RUN_ROOT, `${testName}-${stamp}-`));
  const runDirectory: RunDirectory = {
    root,
    configDir: join(root, "config"),
    tempDir: join(root, "tmp"),
    stagedCopyDir: join(root, "staged-plugin"),
    sessionDir: join(root, "session"),
  };
  const inside = [
    runDirectory.configDir,
    runDirectory.tempDir,
    runDirectory.stagedCopyDir,
    runDirectory.sessionDir,
  ];
  await Promise.all(inside.map((path) => mkdir(path, { recursive: true })));
  return runDirectory;
}

/**
 * The environment every process a run starts is given, in three layers: the contributor's own,
 * then whatever the caller layers over it, then the run's two directories, which nothing overrides.
 *
 * The inherited environment is kept rather than replaced. `PATH`, `HOME` and the rest are what let
 * `git`, `claude` and `npm` start at all, and a bare map would leave a session unable to run the
 * install hook it is being tested for.
 *
 * The middle layer is the repository's environment file, handed to a session whole
 * (`./env-file.ts`). It sits ABOVE the inherited environment, exactly as the `./claude` wrapper
 * puts the same file above the same shell, and BELOW the two directories, so no line in it can
 * move a run out of its own configuration directory and into another run's.
 *
 * `TMP` and `TEMP` ride along beside `TMPDIR` because they are the same fact under different names
 * on different platforms, and the brief must land in the run's own directory whichever one a
 * tool reads.
 */
export function runEnvironment(
  runDirectory: RunDirectory,
  layered: Record<string, string> = {},
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...layered,
    CLAUDE_CONFIG_DIR: runDirectory.configDir,
    TMPDIR: runDirectory.tempDir,
    TMP: runDirectory.tempDir,
    TEMP: runDirectory.tempDir,
  };
}
