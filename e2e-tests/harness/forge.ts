/**
 * The forge, and the git plumbing every repository the harness owns is built with
 * (end-to-end-tests ticket 03).
 *
 * Two repositories are made from one **fixture** and they differ only in their lifetime: the
 * **standing repo** a refinement clones outlives every run, and the **throwaway repo** a delivery
 * is driven against is created per run and destroyed when the test passes. Everything under
 * that — what a fixture's repository is, which branch it lands on, how git authenticates, who the
 * fixture's commit is authored by — is the same for both and lives here, once.
 *
 * **Credentials never land in a file.** `gh` already holds the forge token, and
 * `gh auth git-credential` is what it offers git for exactly this; the empty helper ahead of it
 * clears whatever the contributor's own configuration would otherwise have contributed. So nothing
 * here writes a token into a clone's `.git/config`, which outlives the run in the run directory.
 */
import { chmod, copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { execute } from "./command.ts";
import type { Fixture, FixtureEpic } from "./fixture.ts";
import { REPOSITORY_ROOT } from "./repository.ts";
import { runEnvironment, type RunDirectory } from "./run-directory.ts";
import { listWorkingTree } from "./working-tree.ts";

/** The forge's own client, taken from the path. It is what holds the token and the account. */
const GH_CLI = "gh";

/**
 * The branch a fixture lands on. Named rather than discovered: a repository this harness created is
 * empty until the first push, so there is no default branch to read before there is a branch.
 */
export const DEFAULT_BRANCH = "main";

/**
 * One command, bound to one directory. Declared once so its shape is not respelled at every call.
 *
 * Not `Run`: a **run** is one invocation of `/deliverer:refine` or `/deliverer:build`, which is
 * what the rest of the harness spends the word on.
 */
type Command = (args: readonly string[], purpose: string) => Promise<{ stdout: string }>;

const boundTo = (command: string, cwd: string, env: NodeJS.ProcessEnv): Command =>
  (args, purpose) => execute(command, args, { cwd, env, purpose });

/** The forge's client, run from the run directory so nothing of this repository reaches it. */
export function gh(runDirectory: RunDirectory): Command {
  return boundTo(GH_CLI, runDirectory.root, runEnvironment(runDirectory));
}

/** git, in whichever directory the caller is working in. */
export function git(runDirectory: RunDirectory, cwd: string): Command {
  return boundTo("git", cwd, runEnvironment(runDirectory));
}

/** What git is given so a private clone, a fetch and a force-push authenticate as the token. */
export const GIT_CREDENTIALS = [
  "-c",
  "credential.helper=",
  "-c",
  `credential.helper=!${GH_CLI} auth git-credential`,
];

/**
 * The identity the fixture's commit is made under, and no signing.
 *
 * Nobody reads this author, and a contributor whose git configuration signs every commit would
 * otherwise meet a fixture build waiting on a key nobody is going to use.
 */
const FIXTURE_AUTHOR = [
  "-c",
  "user.name=deliverer e2e",
  "-c",
  "user.email=e2e@deliverer.invalid",
  "-c",
  "commit.gpgsign=false",
];

/** Which account the token authenticates as — the account every repository is created under. */
export async function forgeAccount(runDirectory: RunDirectory): Promise<string> {
  const login = await gh(runDirectory)(
    ["api", "user", "--jq", ".login"],
    "asking the forge which account the token is",
  );
  return login.stdout.trim();
}

/**
 * The fixture's `repository/` built into a git repository of its own, with the **epic** in it where
 * the caller asked for one.
 *
 * The file list comes from git rather than from a directory walk, exactly as the staged copy does,
 * so `node_modules/` and anything else the fixture ignores stays out — and so the two ideas of
 * "what is in the fixture" cannot drift apart. The epic is copied off disk instead: it lands
 * inside the repository being built rather than being one of the fixture's own files, and a fixture
 * whose epic is untracked is still a fixture.
 *
 * **The epic is what tells the two repositories apart**, and the caller passes it rather than
 * asking for it: a delivery is handed one that was on the default branch from the moment the
 * repository existed, while a refinement publishes its own into an empty tracker root and one
 * already sitting there is one it can publish on top of.
 */
export async function buildFixtureRepository(
  runDirectory: RunDirectory,
  fixture: Fixture,
  epic: FixtureEpic | null,
): Promise<void> {
  const inRepository = relative(REPOSITORY_ROOT, fixture.repositoryDir);
  const files = await listWorkingTree(
    runDirectory,
    [inRepository],
    `listing the ${fixture.name} fixture's repository`,
  );
  if (files.length === 0) {
    throw new Error(
      `the fixture ${fixture.name} has no files git can see under ${inRepository}. A run against ` +
        `an empty repository would assert nothing.`,
    );
  }
  for (const file of files) {
    const destination = join(runDirectory.fixtureRepoDir, relative(inRepository, file.path));
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(REPOSITORY_ROOT, file.path), destination);
    // Modes are carried across for the same reason the staged copy carries them: a fixture whose
    // gates are a shell script would otherwise reach the forge unable to run them.
    await chmod(destination, file.mode);
  }
  if (epic !== null) await copyEpic(runDirectory, fixture, epic);

  const inFixture = git(runDirectory, runDirectory.fixtureRepoDir);
  await inFixture(
    ["init", "--quiet", `--initial-branch=${DEFAULT_BRANCH}`],
    "creating the fixture's repository",
  );
  await inFixture(["add", "--all"], "staging the fixture");
  await inFixture(
    [...FIXTURE_AUTHOR, "commit", "--quiet", "--message", `the ${fixture.name} fixture`],
    "committing the fixture",
  );
}

/** The epic, at the location the fixture's own tracker conventions put one. */
async function copyEpic(
  runDirectory: RunDirectory,
  fixture: Fixture,
  epic: FixtureEpic,
): Promise<void> {
  const entries = await readdir(epic.directory, { withFileTypes: true, recursive: true });
  const files = entries.filter((entry) => entry.isFile());
  if (files.length === 0) {
    throw new Error(`the fixture ${fixture.name} has an empty epic/ at ${epic.directory}`);
  }
  for (const entry of files) {
    const source = join(entry.parentPath, entry.name);
    const inEpic = relative(epic.directory, source).split(sep).join("/");
    const destination = join(runDirectory.fixtureRepoDir, ...epic.location.split("/"), inEpic);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

/** The tree the fixture repository is at: the content alone, so a rebuild of it is not drift. */
export async function fixtureTree(runDirectory: RunDirectory): Promise<string> {
  const tree = await git(runDirectory, runDirectory.fixtureRepoDir)(
    ["rev-parse", "HEAD^{tree}"],
    "reading the fixture's tree",
  );
  return tree.stdout.trim();
}

/** The fixture pushed over whatever the forge had, which may be nothing at all. */
export async function forcePushFixture(runDirectory: RunDirectory, url: string): Promise<void> {
  await git(runDirectory, runDirectory.fixtureRepoDir)(
    [...GIT_CREDENTIALS, "push", "--quiet", "--force", url, `HEAD:refs/heads/${DEFAULT_BRANCH}`],
    "pushing the fixture",
  );
}

/** The repository cloned into the run directory: the working tree a run is driven in. */
export async function cloneRepository(
  runDirectory: RunDirectory,
  url: string,
  fullName: string,
): Promise<void> {
  const clone = ["clone", "--quiet", "--branch", DEFAULT_BRANCH, url, runDirectory.cloneDir];
  await execute("git", [...GIT_CREDENTIALS, ...clone], {
    cwd: runDirectory.root,
    env: runEnvironment(runDirectory),
    purpose: `cloning ${fullName}`,
  });
}

/**
 * What the forge has the default branch at.
 *
 * Asked of the FORGE rather than of the clone, because what a criterion is about is what was
 * published — and a clone whose own HEAD moved would say nothing about that.
 */
export async function remoteHead(runDirectory: RunDirectory, url: string): Promise<string> {
  const ask = ["ls-remote", url, `refs/heads/${DEFAULT_BRANCH}`];
  const listed = await execute("git", [...GIT_CREDENTIALS, ...ask], {
    cwd: runDirectory.root,
    env: runEnvironment(runDirectory),
    purpose: `reading what the forge has ${DEFAULT_BRANCH} at`,
  });
  return (listed.stdout.split(/\s/)[0] ?? "").trim();
}

/** How the forge describes a repository's visibility, or null when there is no such repository. */
export async function repositoryVisibility(
  runDirectory: RunDirectory,
  fullName: string,
): Promise<string | null> {
  try {
    const viewed = await gh(runDirectory)(
      ["repo", "view", fullName, "--json", "visibility", "--jq", ".visibility"],
      `confirming ${fullName} exists`,
    );
    return viewed.stdout.trim().toUpperCase();
  } catch (error) {
    // A repository that is not there reads differently from a forge that cannot be reached, and
    // treating the second as absence would turn a network failure into a repository nobody wanted.
    if (/could not resolve to a repository|not found|404/i.test(String(error))) return null;
    throw error;
  }
}

export async function createPrivateRepository(
  runDirectory: RunDirectory,
  fullName: string,
): Promise<void> {
  await gh(runDirectory)(
    ["repo", "create", fullName, "--private"],
    `creating ${fullName} as a private repository`,
  );
}

/** The repository removed. Only ever a **throwaway repo**, and only ever after a test passed. */
export async function deleteRepository(
  runDirectory: RunDirectory,
  fullName: string,
): Promise<void> {
  await gh(runDirectory)(["repo", "delete", fullName, "--yes"], `deleting ${fullName}`);
}
