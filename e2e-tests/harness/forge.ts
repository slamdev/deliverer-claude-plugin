/**
 * The forge, and the git plumbing every repository the harness owns is built with
 * (end-to-end-tests ticket 03).
 *
 * Every repository the harness drives a run against is a **throwaway repo** made from one
 * **fixture**, created per run and destroyed when the test passes. Everything under that — what a
 * fixture's repository is, which branch it lands on, how git authenticates, who the fixture's
 * commit is authored by — lives here, once. So do the issues a throwaway repo carries, where a
 * fixture's tracker is the forge's own (refine-commits-its-vocabulary ticket 03).
 *
 * **Credentials never land in a file.** `gh` already holds the forge token, and
 * `gh auth git-credential` is what it offers git for exactly this; the empty helper ahead of it
 * clears whatever the contributor's own configuration would otherwise have contributed. So nothing
 * here writes a token into a clone's `.git/config`, which outlives the run in the run directory.
 */
import { chmod, copyFile, mkdir, writeFile } from "node:fs/promises";
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
 * The fixture's `repository/` built into a git repository of its own, with whatever the caller
 * seeds into the tree before the fixture's one commit is made.
 *
 * The file list comes from git rather than from a directory walk, exactly as the staged copy does,
 * so `node_modules/` and anything else the fixture ignores stays out — and so the two ideas of
 * "what is in the fixture" cannot drift apart.
 *
 * **What the seed is, is the caller's.** A delivery against an in-repository tracker seeds its
 * **epic** here, so it is on the default branch from the moment the repository exists; a
 * refinement seeds nothing, because one already sitting under the tracker root is one it can
 * publish on top of. Which tracker kind wants what is decided in `./epic.ts` and nowhere here.
 */
export async function buildFixtureRepository(
  runDirectory: RunDirectory,
  fixture: Fixture,
  seedTree?: (fixtureRepoDir: string) => Promise<void>,
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
  if (seedTree !== undefined) await seedTree(runDirectory.fixtureRepoDir);

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

/** The fixture pushed over whatever the forge had, which may be nothing at all. */
export async function forcePushFixture(runDirectory: RunDirectory, url: string): Promise<void> {
  await git(runDirectory, runDirectory.fixtureRepoDir)(
    [...GIT_CREDENTIALS, "push", "--quiet", "--force", url, `HEAD:refs/heads/${DEFAULT_BRANCH}`],
    "pushing the fixture",
  );
}

/** One file a seeded commit carries: where it lands in the repository, and its fixture copy. */
export interface SeededFile {
  /** slash-separated, relative to the repository's root */
  readonly path: string;
  readonly source: string;
}

/**
 * A branch pushed to the forge carrying one commit on top of the fixture's, and the commit's SHA
 * (refine-commits-its-vocabulary ticket 05).
 *
 * Made in the fixture's own repository, which is switched back to the default branch before this
 * returns: `readBranch` reads a branch's commits as those beyond that repository's HEAD, so HEAD
 * has to stay the fixture's commit. The clone is not touched, so a run fetches the branch as it
 * would fetch one a refinement pushed from somewhere else.
 */
export async function pushSeededBranch(
  runDirectory: RunDirectory,
  url: string,
  branch: string,
  files: readonly SeededFile[],
  message: string,
): Promise<string> {
  const inFixture = git(runDirectory, runDirectory.fixtureRepoDir);
  await inFixture(["switch", "--quiet", "--create", branch], `creating ${branch} to seed`);
  for (const file of files) {
    const destination = join(runDirectory.fixtureRepoDir, ...file.path.split("/"));
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(file.source, destination);
  }
  const paths = files.map((file) => file.path);
  await inFixture(["add", "--", ...paths], `staging what ${branch} is seeded with`);
  await inFixture(
    [...FIXTURE_AUTHOR, "commit", "--quiet", "--message", message, "--", ...paths],
    `committing what ${branch} is seeded with`,
  );
  const head = await inFixture(["rev-parse", "HEAD"], `reading the commit ${branch} is at`);
  await inFixture(
    [...GIT_CREDENTIALS, "push", "--quiet", url, `HEAD:refs/heads/${branch}`],
    `pushing ${branch}`,
  );
  await inFixture(["switch", "--quiet", DEFAULT_BRANCH], `switching back to ${DEFAULT_BRANCH}`);
  return head.stdout.trim();
}

/** What a draft change request is opened with. */
export interface NewDraft {
  readonly head: string;
  readonly title: string;
  readonly body: string;
}

/**
 * A **draft** change request opened from a branch onto the default one, its description passed
 * through a file in the run directory so that nothing in it is read by a shell.
 */
export async function openDraftChangeRequest(
  runDirectory: RunDirectory,
  fullName: string,
  draft: NewDraft,
): Promise<{ readonly number: number; readonly url: string }> {
  const bodyFile = join(runDirectory.root, `seeded-draft-${draft.head.replace(/\W+/g, "-")}.md`);
  await writeFile(bodyFile, draft.body);
  const opened = await gh(runDirectory)(
    ["pr", "create", "--repo", fullName, "--draft", "--head", draft.head, "--base", DEFAULT_BRANCH,
      "--title", draft.title, "--body-file", bodyFile],
    `opening a draft from ${draft.head} on ${fullName}`,
  );
  const url = opened.stdout.trim().split("\n").at(-1)?.trim() ?? "";
  const number = /\/pull\/(\d+)$/.exec(url)?.[1];
  if (number === undefined) {
    throw new Error(`opening a draft from ${draft.head} answered no URL: ${opened.stdout}`);
  }
  return { number: Number(number), url };
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

/**
 * Every branch the forge carries, by name, with the commit it is at.
 *
 * Asked of the forge for the same reason `remoteHead` is: what a refinement published is what the
 * forge has, and a branch that exists only in the clone was published nowhere.
 */
export async function remoteBranches(
  runDirectory: RunDirectory,
  url: string,
): Promise<ReadonlyMap<string, string>> {
  const listed = await execute("git", [...GIT_CREDENTIALS, "ls-remote", "--heads", url], {
    cwd: runDirectory.root,
    env: runEnvironment(runDirectory),
    purpose: "listing the branches the forge carries",
  });
  const branches = new Map<string, string>();
  for (const line of listed.stdout.split("\n")) {
    const [commit, ref] = line.trim().split(/\s+/);
    if (commit !== undefined && ref?.startsWith("refs/heads/") === true) {
      branches.set(ref.slice("refs/heads/".length), commit);
    }
  }
  return branches;
}

/** One commit a branch carries beyond the fixture's own. */
export interface BranchCommit {
  readonly sha: string;
  readonly message: string;
  /** every path it changed, relative to the repository's root */
  readonly files: readonly string[];
  /**
   * Every line it added, across every path it changed — so a matcher can say a commit carries a
   * term without fetching the file it landed in (refine-commits-its-vocabulary ticket 04).
   */
  readonly added: readonly string[];
}

/** What one branch on the forge carries: every file, and every commit beyond the fixture's. */
export interface BranchContents {
  readonly files: readonly string[];
  readonly commits: readonly BranchCommit[];
}

/**
 * Every file one branch on the forge carries, as paths relative to the repository's root, and every
 * commit it carries beyond the fixture's own — which is where the repository was created at.
 *
 * Fetched into the fixture's own repository rather than the clone, so the clone is left exactly as
 * the run left it for whoever reads the run directory afterwards.
 */
export async function readBranch(
  runDirectory: RunDirectory,
  url: string,
  branch: string,
): Promise<BranchContents> {
  const inFixture = git(runDirectory, runDirectory.fixtureRepoDir);
  await inFixture(
    [...GIT_CREDENTIALS, "fetch", "--quiet", url, `refs/heads/${branch}`],
    `fetching ${branch} from the forge`,
  );
  const listed = await inFixture(
    ["ls-tree", "-r", "--name-only", "-z", "FETCH_HEAD"],
    `listing what ${branch} carries`,
  );
  const files = listed.stdout.split("\0").filter((path) => path !== "");
  const revisions = await inFixture(
    ["rev-list", "--reverse", "HEAD..FETCH_HEAD"],
    `listing the commits ${branch} carries beyond the fixture's`,
  );
  const commits: BranchCommit[] = [];
  for (const sha of revisions.stdout.split("\n").filter((line) => line !== "")) {
    const message = await inFixture(["log", "-1", "--format=%B", sha], `reading ${sha}'s message`);
    const changed = await inFixture(
      ["diff-tree", "--no-commit-id", "--name-only", "-r", "-m", "-z", sha],
      `listing what ${sha} changed`,
    );
    const patch = await inFixture(
      ["show", "--format=", "--unified=0", "--no-color", "--no-ext-diff", sha],
      `reading what ${sha} added`,
    );
    commits.push({
      sha,
      message: message.stdout,
      files: [...new Set(changed.stdout.split("\0").filter((path) => path !== ""))],
      added: patch.stdout
        .split("\n")
        .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
        .map((line) => line.slice(1)),
    });
  }
  return { files, commits };
}

/**
 * One issue on a **throwaway repo**, as the forge holds it (refine-commits-its-vocabulary
 * ticket 03).
 *
 * The parent and the blocking edges are the forge's own mechanisms rather than lines in the body:
 * what `tickets-writer` is told to use on a real tracker "where it has them", and this forge has
 * both. The body is kept whole beside them, because a writer that puts a `Blocked by:` line there
 * as well is one a reader of the epic may want to see.
 */
export interface ForgeIssue {
  readonly number: number;
  /** where a human opens it, which is also what a delivery is handed as an epic's location */
  readonly url: string;
  readonly title: string;
  readonly body: string;
  readonly state: "OPEN" | "CLOSED";
  /** every label it carries, the **triage label** among them where it has one */
  readonly labels: readonly string[];
  /** the issue it is a sub-issue of, or null */
  readonly parent: number | null;
  /** every issue that blocks it — its declared **blocking edges** — by number, ascending */
  readonly blockedBy: readonly number[];
}

/** What an issue is created with. The parent and the edges name issues that already exist. */
export interface NewIssue {
  readonly title: string;
  readonly body: string;
  readonly labels?: readonly string[];
  readonly parent?: number;
  readonly blockedBy?: readonly number[];
}

/** The issue as the REST API returns it, narrowed to what `ForgeIssue` is read from. */
interface RestIssue {
  readonly id: number;
  readonly number: number;
  readonly html_url: string;
  readonly title: string;
  readonly body: string | null;
  readonly state: string;
  readonly labels: readonly { readonly name: string }[];
  readonly parent_issue_url?: string | null;
  readonly issue_dependencies_summary?: { readonly blocked_by: number } | null;
  readonly pull_request?: unknown;
}

/**
 * An issue created on the repository, then made a sub-issue of its parent and blocked by each issue
 * it names, in that order — so a failure partway leaves an issue that says how far it got.
 *
 * A label the repository does not carry yet is created by the forge with the issue, so a throwaway
 * repo needs no label set up beforehand.
 */
export async function createIssue(
  runDirectory: RunDirectory,
  fullName: string,
  issue: NewIssue,
): Promise<ForgeIssue> {
  const forge = gh(runDirectory);
  const labels = (issue.labels ?? []).flatMap((label) => ["-f", `labels[]=${label}`]);
  const created = await forge(
    ["api", `repos/${fullName}/issues`, "-f", `title=${issue.title}`, "-f", `body=${issue.body}`,
      ...labels],
    `creating the issue "${issue.title}" on ${fullName}`,
  );
  const { id, number } = JSON.parse(created.stdout) as RestIssue;
  if (issue.parent !== undefined) {
    await forge(
      ["api", `repos/${fullName}/issues/${issue.parent}/sub_issues`, "-F", `sub_issue_id=${id}`],
      `making #${number} a sub-issue of #${issue.parent} on ${fullName}`,
    );
  }
  for (const blocking of issue.blockedBy ?? []) {
    const blocker = await restIssue(runDirectory, fullName, blocking);
    await forge(
      ["api", `repos/${fullName}/issues/${number}/dependencies/blocked_by`,
        "-F", `issue_id=${blocker.id}`],
      `marking #${number} blocked by #${blocking} on ${fullName}`,
    );
  }
  return readIssue(runDirectory, fullName, number);
}

/**
 * Every issue the repository carries, open or closed, in ascending number — and never a change
 * request, which this forge's issues endpoint lists among them.
 */
export async function listIssues(
  runDirectory: RunDirectory,
  fullName: string,
): Promise<ForgeIssue[]> {
  const listed = await gh(runDirectory)(
    ["api", "--paginate", `repos/${fullName}/issues?state=all&per_page=100`, "--jq", ".[]"],
    `listing the issues on ${fullName}`,
  );
  const issues: ForgeIssue[] = [];
  for (const line of listed.stdout.split("\n")) {
    if (line.trim() === "") continue;
    const rest = JSON.parse(line) as RestIssue;
    if (rest.pull_request !== undefined && rest.pull_request !== null) continue;
    issues.push(await forgeIssue(runDirectory, fullName, rest));
  }
  return issues.sort((left, right) => left.number - right.number);
}

/** One issue, by number. */
export async function readIssue(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<ForgeIssue> {
  return forgeIssue(runDirectory, fullName, await restIssue(runDirectory, fullName, number));
}

async function restIssue(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<RestIssue> {
  const read = await gh(runDirectory)(
    ["api", `repos/${fullName}/issues/${number}`],
    `reading issue #${number} on ${fullName}`,
  );
  return JSON.parse(read.stdout) as RestIssue;
}

/**
 * The REST issue read into a `ForgeIssue`.
 *
 * The parent rides on the issue itself; the blocking edges do not, only their count, so they are
 * asked for only where the count says there are some.
 */
async function forgeIssue(
  runDirectory: RunDirectory,
  fullName: string,
  rest: RestIssue,
): Promise<ForgeIssue> {
  const parent = /\/issues\/(\d+)$/.exec(rest.parent_issue_url ?? "")?.[1];
  let blockedBy: number[] = [];
  if ((rest.issue_dependencies_summary?.blocked_by ?? 0) > 0) {
    const listed = await gh(runDirectory)(
      ["api", "--paginate", `repos/${fullName}/issues/${rest.number}/dependencies/blocked_by`,
        "--jq", ".[].number"],
      `reading what blocks #${rest.number} on ${fullName}`,
    );
    blockedBy = listed.stdout
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map(Number)
      .sort((left, right) => left - right);
  }
  return {
    number: rest.number,
    url: rest.html_url,
    title: rest.title,
    body: rest.body ?? "",
    state: rest.state === "closed" ? "CLOSED" : "OPEN",
    labels: rest.labels.map((label) => label.name),
    parent: parent === undefined ? null : Number(parent),
    blockedBy,
  };
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
