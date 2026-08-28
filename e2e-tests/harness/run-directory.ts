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
 *
 *    **This binds everything that reads `TMPDIR`, and the brief's writer is not one of them.** An
 *    orchestrator told to use the temporary directory of the user's OS writes
 *    `/tmp/<slug>-brief.md` — measured, ticket 02, on a run that skipped its own grilling because
 *    of exactly that. So the run directory goes and collects the brief out of the shared directory
 *    afterwards, which is `./brief.ts`, and this variable covers the rest.
 *  - **an empty directory for the session to run in.** A run with no clone puts its session here
 *    rather than in this repository, whose project settings deliberately withhold `deliverer` from
 *    `enabledPlugins` under the no-dogfooding rule — indistinguishable, from inside a session, from
 *    the failure the smoke test exists to catch. A run WITH a clone puts the harness's own two
 *    agents here, so the responder's and the verifier's session records stay out of the clone's.
 *  - **the staged copy**, which is the plugin the run installs (`./staged-copy.ts`).
 *  - **the fixture built into a repository, and the clone taken back off the forge**
 *    (`./standing-repo.ts`, ticket 02). The first is what the standing repo is synced from; the
 *    second is the working tree a run publishes into, and the only one a session ever sees.
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
import { readEnvFileWhole } from "./env-file.ts";
import { REPOSITORY_ENV_FILE } from "./repository.ts";

/** Where run directories are made. Outside the repository, so no run is ever a change to it. */
const RUN_ROOT = join(tmpdir(), "deliverer-e2e");

/**
 * The scripted review double's two knobs, kept OUT of everything a run starts (ticket 03).
 *
 * The real delegated review is the default and the double is opt-in, so nothing in the harness need
 * select it — and that is exactly how it would arrive by accident rather than by choice.
 * CONTRIBUTING teaches `DELIVERER_REVIEW_BACKEND=scripted` as the way to exercise the lifecycle,
 * and the harness hands the repository's environment file to the session WHOLE and never reads it.
 * Left in that file or in the contributor's shell it reaches the session, from there the tools
 * server the session starts, and every **round** replays a canned timeline: all eight stages pass
 * having reviewed nothing.
 *
 * So it is kept from arriving rather than trusted to be absent. The selector is the one that
 * decides; the script beside it is inert without one and goes with it, because a knob for a backend
 * nobody selected is a knob nobody meant to leave behind either.
 */
export const SCRIPTED_BACKEND_VARIABLES = ["DELIVERER_REVIEW_BACKEND", "DELIVERER_REVIEW_SCRIPT"];

/**
 * The test runner's own two variables, kept out for a reason it took a **run** to find (ticket 03).
 *
 * These tests run under `node --test`, which marks its children with `NODE_TEST_CONTEXT` and
 * `NODE_TEST_WORKER_ID`. The harness hands the session the environment it inherited, so both reach
 * every process a run starts — including the **fixture**'s own `npm test`, which is `node --test`
 * again. It sees the mark, decides it is being run recursively, **skips every test file and exits
 * zero**: measured, and reported by an orchestrator that met it in every implementer, reviewer and
 * fix wave of a delivery.
 *
 * A **gate** that is green because nothing ran is the worst kind of green. It is what an
 * implementer reads before committing, and this fixture's gates are the whole reason its codebase
 * carries unit tests. The forge's **checks** run in an environment of their own and were green
 * throughout, so nothing broken was delivered — but the gate was not being asked the question.
 */
export const RUNNER_VARIABLES = ["NODE_TEST_CONTEXT", "NODE_TEST_WORKER_ID"];

/**
 * The two host settings a **run** is required to have, pinned rather than inherited (README §
 * Claude Code's own settings).
 *
 * These are what the plugin asks a user to set, and neither of them makes it here on its own:
 *
 *  - **the todo tools**, which Claude Code leaves off by default. Without them an **orchestrator**
 *    has no task list to keep, and a run whose progress is invisible is not the run these tests are
 *    written against — the contracts about who writes to the task list, and about a signal that
 *    needs no message because progress goes there instead, all assume it exists.
 *  - **agent teams**, which change how the agents a session **dispatches** are run, and with them
 *    the one-stage-one-dispatch arrangement both commands are built on.
 *
 * Pinned ABOVE the environment file and the contributor's shell because of where the wrong value
 * comes from: this repository's own `.claude/settings.json` turns agent teams ON for the
 * contribution flow, and Claude Code hands its settings' environment to every command a session
 * runs — so `npm test` from inside a contribution session inherits `1` for the one that must be `0`
 * and nothing at all for the one that must be `1`. What would arrive otherwise is whatever the
 * machine running the tests happens to believe, which is nobody's choice about a run.
 */
export const HOST_SETTINGS: Record<string, string> = {
  CLAUDE_CODE_ENABLE_TODO_TOOLS: "1",
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "0",
};

export interface RunDirectory {
  /** the directory itself, named for the test and the moment it was made */
  readonly root: string;
  /** `CLAUDE_CONFIG_DIR`: the marketplaces, the install, the options and the session records */
  readonly configDir: string;
  /** `TMPDIR`: the run's own temporary directory, reachable by no other run */
  readonly tempDir: string;
  /** the working tree committed into a temporary repository — the marketplace a run installs */
  readonly stagedCopyDir: string;
  /** the empty directory a session with no clone runs in, and the harness's own agents always do */
  readonly sessionDir: string;
  /** the fixture built into a repository, which the standing repo is brought into step with */
  readonly fixtureRepoDir: string;
  /** the clone of the standing repo: the working tree a run publishes into */
  readonly cloneDir: string;
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
    fixtureRepoDir: join(root, "fixture-repo"),
    cloneDir: join(root, "clone"),
  };
  const inside = [
    runDirectory.configDir,
    runDirectory.tempDir,
    runDirectory.stagedCopyDir,
    runDirectory.sessionDir,
    runDirectory.fixtureRepoDir,
    // `cloneDir` is deliberately absent: `git clone` is what makes it, and a run with no clone
    // should not leave an empty directory suggesting it had one.
  ];
  await Promise.all(inside.map((path) => mkdir(path, { recursive: true })));
  return runDirectory;
}

/**
 * The environment every process a run starts is given, in four layers: the contributor's own, then
 * whatever the caller layers over it, then the two host settings above, then the run's two
 * directories. Nothing overrides the last two.
 *
 * The inherited environment is kept rather than replaced. `PATH`, `HOME` and the rest are what let
 * `git`, `claude` and `npm` start at all, and a bare map would leave a session unable to run the
 * install hook it is being tested for.
 *
 * The second layer is the repository's environment file, handed to a session whole
 * (`./env-file.ts`). It sits ABOVE the inherited environment, exactly as the `./claude` wrapper
 * puts the same file above the same shell, and BELOW the host settings and the two directories, so
 * no line in it can move a run out of its own configuration directory and into another run's, or
 * give it a host it is not meant to run under.
 *
 * `TMP` and `TEMP` ride along beside `TMPDIR` because they are the same fact under different names
 * on different platforms, and the brief must land in the run's own directory whichever one a
 * tool reads.
 */
export function runEnvironment(
  runDirectory: RunDirectory,
  layered: Record<string, string> = {},
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    ...layered,
    ...HOST_SETTINGS,
    CLAUDE_CONFIG_DIR: runDirectory.configDir,
    TMPDIR: runDirectory.tempDir,
    TMP: runDirectory.tempDir,
    TEMP: runDirectory.tempDir,
  };
  // Deleted rather than emptied: an empty value is a value, and both of the things that read these
  // read the variable rather than asking whether it is worth reading. The scripted backend's two
  // come from the contributor — their environment file or their shell — and the runner's two from
  // the process this harness is itself running inside.
  for (const variable of [...SCRIPTED_BACKEND_VARIABLES, ...RUNNER_VARIABLES]) {
    delete environment[variable];
  }
  return environment;
}

/**
 * What a contributor's own environment would have selected, before it was kept out.
 *
 * Read for the diagnostic and for the matcher, so a run that would have reviewed nothing says so
 * out loud rather than passing quietly on a variable nobody remembered leaving set.
 */
export async function scriptedBackendKeptOut(): Promise<Record<string, string>> {
  const contributors: NodeJS.ProcessEnv = {
    ...process.env,
    ...(await readEnvFileWhole(REPOSITORY_ENV_FILE)),
  };
  const found: Record<string, string> = {};
  for (const variable of SCRIPTED_BACKEND_VARIABLES) {
    const value = contributors[variable];
    if (value !== undefined) found[variable] = value;
  }
  return found;
}

/**
 * The environment every SESSION a run starts is given: the above, with the repository's own
 * environment file layered in.
 *
 * Every session needs it and for the same reason — the run under test, the **responder** answering
 * its questions and the **verifier** judging what it produced all have to reach a model, and the
 * credentials that let them are in that file. A session started without it comes back reporting
 * that it is not logged in, which reads as a broken plugin from every direction (measured, ticket
 * 02: the responder answered nothing and every question fell back to the recommended option).
 *
 * The file is never inspected on the way through: `./env-file.ts` says why that matters.
 */
export async function sessionEnvironment(
  runDirectory: RunDirectory,
): Promise<NodeJS.ProcessEnv> {
  return runEnvironment(runDirectory, await readEnvFileWhole(REPOSITORY_ENV_FILE));
}
