/**
 * The **brief** a refinement leaves behind, and why the run directory has to go and fetch it
 * (end-to-end-tests ticket 02).
 *
 * **The run's own temporary directory does not hold it, and that was measured rather than
 * assumed.** The skill tells its orchestrator to write the brief to "the temporary directory of the
 * user's OS", and what an orchestrator does with that is write `/tmp/<slug>-brief.md` — a path it
 * knows, not the variable the harness set. So the per-run temporary directory binds everything that
 * READS `TMPDIR` and misses the one writer the isolation was for.
 *
 * Left there, that file is a **run** the next one takes its bearings from: refinement treats a
 * brief on disk as proof that stage 1 already ran, and a stable **slug** means the second run of
 * this test skips the grilling, never invokes the **responder**, and reaches stage 3 in ninety
 * seconds. That is not a theory either — it is what the first full run of this test did.
 *
 * So a run collects its own brief out of the shared directory when it finishes: the evidence moves
 * into the **run directory**, where a run's leavings belong and where a contributor can read it,
 * and the next run finds nothing to resume from. **A brief it did not write is never touched** —
 * only files as new as the run itself are collected, so a contributor's own refinement, on another
 * project on the same machine, is left exactly where they left it.
 *
 * Prevention is not the whole of it, because a run killed by a ceiling never gets to collect. What
 * it left is listed before the next run starts, so the matcher that catches a skipped stage 1 can
 * name the file that caused it instead of leaving a contributor to guess.
 */
import { readdir, rename, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunDirectory } from "./run-directory.ts";

/** What refinement calls the file: the epic's slug and this suffix. */
const BRIEF = /-brief\.md$/;

/**
 * Where to look. `os.tmpdir()` is what the platform says, and `/tmp` is what an orchestrator
 * writes — the same directory on Linux and two different ones elsewhere, so both are swept and a
 * file seen twice is collected once.
 */
const OS_TEMPORARY_DIRECTORIES = [tmpdir(), "/tmp"];

/** What a run found on the way in, and what it took away with it. */
export interface Briefs {
  /** briefs already in the operating system's temporary directory when this run started */
  readonly beforeRun: readonly string[];
  /** briefs this run wrote there, now in the run directory */
  readonly collected: readonly string[];
}

/** Every brief already sitting in the operating system's temporary directory. */
export async function briefsBeforeRun(): Promise<string[]> {
  const found = new Set<string>();
  for (const directory of OS_TEMPORARY_DIRECTORIES) {
    for (const path of await briefsIn(directory)) found.add(path);
  }
  return [...found].sort();
}

/**
 * The briefs this run wrote, moved into the run directory.
 *
 * `since` is when the run started: a brief older than that belongs to somebody else and stays where
 * it is. A move that fails is not a failure of the test — the run has already happened — so it is
 * reported by its absence from the list rather than by a throw.
 */
export async function collectBriefs(
  runDirectory: RunDirectory,
  since: number,
): Promise<string[]> {
  const collected: string[] = [];
  const seen = new Set<string>();
  for (const directory of OS_TEMPORARY_DIRECTORIES) {
    for (const path of await briefsIn(directory)) {
      if (seen.has(path)) continue;
      seen.add(path);
      const written = await writtenAt(path);
      if (written === null || written < since) continue;
      const destination = join(runDirectory.root, briefName(path));
      try {
        await rename(path, destination);
        collected.push(destination);
      } catch {
        // Left where it is. The next run lists it on the way in, and the matcher names it.
      }
    }
  }
  return collected.sort();
}

/** The file's own name, which carries the epic's slug and is what makes it worth keeping. */
function briefName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

async function briefsIn(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && BRIEF.test(entry.name))
      .map((entry) => join(directory, entry.name));
  } catch {
    return [];
  }
}

async function writtenAt(path: string): Promise<number | null> {
  try {
    return (await stat(path)).mtimeMs;
  } catch {
    return null;
  }
}
