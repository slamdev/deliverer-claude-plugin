/**
 * The staged copy: the working tree committed into a temporary repository, which is what a run
 * installs from (ADR-0016, end-to-end-tests ticket 01).
 *
 * An install takes what a marketplace's source has committed, and a test that covered the last
 * commit rather than the change in front of the contributor would be worse than no test. So each
 * run builds its own marketplace out of the plugin as it is ON DISK — uncommitted edits included —
 * and installs that.
 *
 * What is copied is what git can see, which `./working-tree.ts` defines once for the copy and for
 * the comparison that checks it afterwards.
 *
 * File modes are carried across deliberately. `hooks/install-mcp-server.sh` is executable, and a
 * copy that dropped that bit would silently exercise the launcher's `bash` recovery path instead of
 * the path a user's install takes.
 */
import { chmod, copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { execute } from "./command.ts";
import { REPOSITORY_ROOT } from "./repository.ts";
import { runEnvironment, type RunDirectory } from "./run-directory.ts";
import { listWorkingTree } from "./working-tree.ts";

/** The two directories a marketplace needs: its manifest, and the plugin the manifest publishes. */
const STAGED_PATHS = ["plugin", ".claude-plugin"];

/**
 * The identity the staged commit is made under. Named for the harness rather than taken from the
 * contributor's git configuration, because a contributor who has none would otherwise meet a
 * failing commit instead of a running test — and nobody reads this author but the next `git log`
 * in a directory nothing pushes.
 */
const STAGED_AUTHOR = ["-c", "user.name=deliverer e2e", "-c", "user.email=e2e@deliverer.invalid"];

export interface StagedCopy {
  /** the marketplace source a run adds: the temporary repository's root */
  readonly marketplaceSource: string;
  /** the commit an install resolves the plugin at */
  readonly commit: string;
  /** how many files were staged, so a copy that staged nothing cannot look like one that worked */
  readonly fileCount: number;
}

export async function stageWorkingTree(runDirectory: RunDirectory): Promise<StagedCopy> {
  const environment = runEnvironment(runDirectory);
  const files = await listWorkingTree(
    runDirectory,
    STAGED_PATHS,
    "listing the working tree to stage",
  );
  if (files.length === 0) {
    throw new Error(
      `nothing was staged: git listed no files under ${STAGED_PATHS.join(" ")} in ` +
        `${REPOSITORY_ROOT}. A run installing an empty plugin would assert nothing.`,
    );
  }
  for (const file of files) {
    const destination = join(runDirectory.stagedCopyDir, file.path);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(REPOSITORY_ROOT, file.path), destination);
    await chmod(destination, file.mode);
  }

  const git = (args: readonly string[], purpose: string): Promise<{ stdout: string }> =>
    execute("git", args, { cwd: runDirectory.stagedCopyDir, env: environment, purpose });
  await git(["init", "--quiet", "--initial-branch=main"], "creating the staged copy's repository");
  await git(["add", "--all"], "staging the working tree");
  await git(
    // `commit.gpgsign=false` because this commit is signed by nobody and read by nothing: a
    // contributor whose global configuration signs every commit would otherwise fail here, waiting
    // on a key nobody is going to use.
    [
      ...STAGED_AUTHOR,
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "--message",
      "staged copy of the working tree",
    ],
    "committing the staged copy",
  );
  const commit = await git(["rev-parse", "HEAD"], "reading the staged copy's commit");

  return {
    marketplaceSource: runDirectory.stagedCopyDir,
    commit: commit.stdout.trim(),
    fileCount: files.length,
  };
}
