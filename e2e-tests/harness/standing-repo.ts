/**
 * The standing repo: one private repository the refine test clones and never writes back to
 * (end-to-end-tests ticket 02).
 *
 * It can be standing at all because refinement's two **writers** were checked and neither commits
 * nor pushes. Everything a run produces stays in the working tree it cloned, so no two runs can
 * reach each other and no repository needs creating or destroying per run — which is the whole
 * difference from the **throwaway repo** a delivery needs.
 *
 * **The harness owns its contents.** Each run confirms it exists and that it matches the fixture on
 * disk, creating it when it is absent and force-pushing the fixture when it has drifted. Nobody
 * provisions anything by hand, and no test can run against a fixture somebody changed months ago.
 * The comparison is between TREES and not commits: a tree hash is the content and nothing else, so
 * a rebuild of the same files is not drift, and a run does not rewrite history for a timestamp.
 *
 * **It is named for the test and the fixture, never for the run.** A repository that outlives every
 * run cannot take the run-identifying name a throwaway one will, and two fixtures under one test
 * get one repository each.
 *
 * Credentials never land in a file. `gh` already holds the forge token, and
 * `gh auth git-credential` is what it offers git for exactly this; the empty helper ahead of it
 * clears whatever the contributor's own configuration would otherwise have contributed. So nothing
 * here writes a token into the clone's `.git/config`, which outlives the run in the run directory.
 */
import { chmod, copyFile, mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { execute } from "./command.ts";
import type { Fixture } from "./fixture.ts";
import { REPOSITORY_ROOT } from "./repository.ts";
import { runEnvironment, type RunDirectory } from "./run-directory.ts";
import { listWorkingTree } from "./working-tree.ts";

/** The forge's own client, taken from the path. It is what holds the token and the account. */
const GH_CLI = "gh";

/**
 * The branch a fixture lands on. Named rather than discovered: a repository this harness created is
 * empty until the first push, so there is no default branch to read before there is a branch.
 */
const DEFAULT_BRANCH = "main";

/** What git is given so a private clone and a force-push authenticate as the forge token does. */
const GIT_CREDENTIALS = [
  "-c",
  "credential.helper=",
  "-c",
  `credential.helper=!${GH_CLI} auth git-credential`,
];

/**
 * The identity the fixture's commit is made under, and no signing.
 *
 * Nobody reads this author, and a contributor whose git configuration signs every commit would
 * otherwise meet a fixture sync waiting on a key nobody is going to use.
 */
const FIXTURE_AUTHOR = [
  "-c",
  "user.name=deliverer e2e",
  "-c",
  "user.email=e2e@deliverer.invalid",
  "-c",
  "commit.gpgsign=false",
];

export interface StandingRepo {
  /** `owner/name` on the forge */
  readonly fullName: string;
  readonly url: string;
  readonly branch: string;
  /** where it was cloned, inside the run directory: the working tree a run publishes into */
  readonly clonePath: string;
  /** the commit the branch was at when the run started — half of the "pushes nothing" bar */
  readonly headBeforeRun: string;
  /** whether this run had to create it, and whether it had drifted from the fixture */
  readonly created: boolean;
  readonly forcePushed: boolean;
}

/**
 * The standing repo for one test and one fixture: confirmed, brought into step with the fixture on
 * disk, and cloned into the run directory.
 *
 * `testName` is the test's half of the name and never the run's — `refine`, not a timestamp.
 */
export async function cloneStandingRepo(
  runDirectory: RunDirectory,
  fixture: Fixture,
  testName: string,
): Promise<StandingRepo> {
  const environment = runEnvironment(runDirectory);
  const gh = (args: readonly string[], purpose: string): Promise<{ stdout: string }> =>
    execute(GH_CLI, args, { cwd: runDirectory.root, env: environment, purpose });

  const owner = (
    await gh(["api", "user", "--jq", ".login"], "asking the forge which account the token is")
  ).stdout.trim();
  const fullName = `${owner}/deliverer-e2e-${testName}-${fixture.name}`;
  const url = `https://github.com/${fullName}.git`;

  await buildFixtureRepository(runDirectory, fixture);
  const created = await confirmRepository(gh, fullName);
  const forcePushed = await syncFixture(runDirectory, environment, url);

  await execute(
    "git",
    [
      ...GIT_CREDENTIALS,
      "clone",
      "--quiet",
      "--branch",
      DEFAULT_BRANCH,
      url,
      runDirectory.cloneDir,
    ],
    { cwd: runDirectory.root, env: environment, purpose: `cloning ${fullName}` },
  );

  return {
    fullName,
    url,
    branch: DEFAULT_BRANCH,
    clonePath: runDirectory.cloneDir,
    headBeforeRun: await remoteHead(runDirectory, url),
    created,
    forcePushed,
  };
}

/**
 * What the forge has the branch at.
 *
 * Asked of the FORGE rather than of the clone, before and after a run, because what the criterion
 * forbids is a run pushing — and a clone whose own HEAD moved would say nothing about that.
 */
export async function remoteHead(runDirectory: RunDirectory, url: string): Promise<string> {
  const listed = await execute(
    "git",
    [...GIT_CREDENTIALS, "ls-remote", url, `refs/heads/${DEFAULT_BRANCH}`],
    {
      cwd: runDirectory.root,
      env: runEnvironment(runDirectory),
      purpose: `reading what the forge has ${DEFAULT_BRANCH} at`,
    },
  );
  return (listed.stdout.split(/\s/)[0] ?? "").trim();
}

/**
 * The fixture's `repository/` built into a git repository of its own.
 *
 * The file list comes from git rather than from a directory walk, exactly as the staged copy's
 * does, so `node_modules/` and anything else the fixture ignores stays out — and so the two ideas
 * of "what is in the fixture" cannot drift apart.
 */
async function buildFixtureRepository(
  runDirectory: RunDirectory,
  fixture: Fixture,
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

  const environment = runEnvironment(runDirectory);
  const git = (args: readonly string[], purpose: string): Promise<{ stdout: string }> =>
    execute("git", args, { cwd: runDirectory.fixtureRepoDir, env: environment, purpose });
  await git(
    ["init", "--quiet", `--initial-branch=${DEFAULT_BRANCH}`],
    "creating the fixture's repository",
  );
  await git(["add", "--all"], "staging the fixture");
  await git(
    [...FIXTURE_AUTHOR, "commit", "--quiet", "--message", `the ${fixture.name} fixture`],
    "committing the fixture",
  );
}

/** The repository on the forge, created private when it is absent. */
async function confirmRepository(
  gh: (args: readonly string[], purpose: string) => Promise<{ stdout: string }>,
  fullName: string,
): Promise<boolean> {
  let visibility: string;
  try {
    visibility = (
      await gh(
        ["repo", "view", fullName, "--json", "visibility", "--jq", ".visibility"],
        `confirming ${fullName} exists`,
      )
    ).stdout.trim();
  } catch (error) {
    // A repository that is not there reads differently from a forge that cannot be reached, and
    // creating one over the second would turn a network failure into a repository nobody wanted.
    if (!/could not resolve to a repository|not found|404/i.test(String(error))) throw error;
    await gh(
      ["repo", "create", fullName, "--private"],
      `creating ${fullName} as a private repository`,
    );
    return true;
  }
  if (visibility.toUpperCase() !== "PRIVATE") {
    throw new Error(
      `${fullName} is ${visibility} and the standing repo must be private. This harness will not ` +
        `force a fixture onto a public repository, and it will not change the visibility of one ` +
        `somebody else made — decide which of the two this is and say so on the forge.`,
    );
  }
  return false;
}

/**
 * The fixture pushed, if what the forge has is not the fixture on disk.
 *
 * A repository that has just been created has no branch to fetch, which is drift of the widest
 * kind and takes the same push.
 */
async function syncFixture(
  runDirectory: RunDirectory,
  environment: NodeJS.ProcessEnv,
  url: string,
): Promise<boolean> {
  const git = (args: readonly string[], purpose: string): Promise<{ stdout: string }> =>
    execute("git", args, { cwd: runDirectory.fixtureRepoDir, env: environment, purpose });

  const fixtureTree = await git(["rev-parse", "HEAD^{tree}"], "reading the fixture's tree");
  const onDisk = fixtureTree.stdout.trim();
  let onForge: string;
  try {
    await git(
      [...GIT_CREDENTIALS, "fetch", "--quiet", url, DEFAULT_BRANCH],
      "fetching what the forge has",
    );
    onForge = (
      await git(["rev-parse", "FETCH_HEAD^{tree}"], "reading the tree the forge has")
    ).stdout.trim();
  } catch {
    onForge = "";
  }
  if (onForge === onDisk) return false;

  await git(
    [...GIT_CREDENTIALS, "push", "--quiet", "--force", url, `HEAD:refs/heads/${DEFAULT_BRANCH}`],
    "force-pushing the fixture over what the forge had",
  );
  return true;
}
