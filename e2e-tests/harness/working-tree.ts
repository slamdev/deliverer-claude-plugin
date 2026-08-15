/**
 * What the working tree holds, and what a directory holds, in the one form the two can be compared
 * in (end-to-end-tests ticket 01).
 *
 * The working tree is what `git` can see and nothing else: tracked files plus untracked files it is
 * not ignoring. That is the same set a contributor means by "my working tree" — uncommitted edits
 * included, which is the whole point of the staged copy — and it leaves `plugin/mcp/node_modules`
 * behind, which is ignored, 300 MB, and installed on the far side of the install by the plugin's
 * own hook anyway.
 *
 * One listing serves both callers, and that is deliberate: the copy that stages the plugin and the
 * comparison that checks what was installed have to mean the same thing by "the working tree", or
 * the comparison would pass on the copy's own blind spot.
 *
 * Contents are hashed rather than compared byte-for-byte at the call site, so a difference names
 * the file it is in instead of arriving as a wall of text — and the executable bit rides beside the
 * digest, because `hooks/install-mcp-server.sh` is executable and a copy that dropped that bit
 * would leave a session quietly taking the launcher's `bash` recovery path instead of the path a
 * user's install takes. A comparison that only hashed contents would report the two as identical.
 */
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { execute } from "./command.ts";
import { PLUGIN_DIR, REPOSITORY_ROOT } from "./repository.ts";
import { runEnvironment, type RunDirectory } from "./run-directory.ts";

// `--cached` is the tracked files, `--others --exclude-standard` the untracked ones git is not
// ignoring, and `--deduplicate` stops a file that is both from arriving twice. `-z` because a path
// may contain anything, including a newline.
const LS_FILES = ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate", "-z"];

/** One file of the working tree: where it is, and what it is. */
export interface WorkingTreeFile {
  /** relative to the repository root, which is how git names it and how a copy recreates it */
  readonly path: string;
  readonly mode: number;
}

/** What a file IS, for the one question asked of it: are these two copies the same file? */
export interface FileFingerprint {
  readonly digest: string;
  readonly executable: boolean;
}

/**
 * Every file git can see under `paths`.
 *
 * A tracked file that has been DELETED from the working tree is listed by `--cached` and is not
 * there. The working tree is what this reports, so it is left out — of the copy and of the
 * comparison alike.
 */
export async function listWorkingTree(
  runDirectory: RunDirectory,
  paths: readonly string[],
  purpose: string,
): Promise<WorkingTreeFile[]> {
  const listed = await execute("git", [...LS_FILES, "--", ...paths], {
    cwd: REPOSITORY_ROOT,
    env: runEnvironment(runDirectory),
    purpose,
  });
  const files: WorkingTreeFile[] = [];
  for (const path of listed.stdout.split("\0")) {
    if (path === "") continue;
    const mode = await fileMode(join(REPOSITORY_ROOT, path));
    if (mode !== null) files.push({ path, mode });
  }
  return files;
}

/**
 * Every file the working tree's plugin directory has, keyed by its path INSIDE that directory —
 * the shape an installed copy is compared against.
 */
export async function workingTreePluginContents(
  runDirectory: RunDirectory,
): Promise<Map<string, FileFingerprint>> {
  const files = await listWorkingTree(
    runDirectory,
    ["plugin"],
    "listing the working tree's plugin directory",
  );
  const contents = new Map<string, FileFingerprint>();
  for (const file of files) {
    const absolute = join(REPOSITORY_ROOT, file.path);
    const fingerprint = await fingerprintOf(absolute);
    if (fingerprint !== null) contents.set(relative(PLUGIN_DIR, absolute), fingerprint);
  }
  return contents;
}

/** Every file under a directory, keyed the same way, so the two maps can be compared directly. */
export async function directoryContents(root: string): Promise<Map<string, FileFingerprint>> {
  const contents = new Map<string, FileFingerprint>();
  for (const entry of await readdir(root, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    const fingerprint = await fingerprintOf(path);
    if (fingerprint !== null) contents.set(relative(root, path), fingerprint);
  }
  return contents;
}

/** The file's mode, or null when there is no file there. */
async function fileMode(path: string): Promise<number | null> {
  try {
    const stats = await stat(path);
    return stats.isFile() ? stats.mode : null;
  } catch {
    return null;
  }
}

async function fingerprintOf(path: string): Promise<FileFingerprint | null> {
  try {
    const stats = await stat(path);
    if (!stats.isFile()) return null;
    return {
      digest: createHash("sha256").update(await readFile(path)).digest("hex"),
      // The owner's bit is the one git records and the one an archive drops.
      executable: (stats.mode & 0o100) !== 0,
    };
  } catch {
    return null;
  }
}
