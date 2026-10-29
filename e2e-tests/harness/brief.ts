/**
 * The **brief** a refinement leaves behind, and why the run directory has to go and fetch it
 * (end-to-end-tests ticket 02).
 *
 * **Which temporary directory holds it is not something a run gets to know in advance, and both
 * readings have been measured.** The skill tells its orchestrator to write the brief to "the
 * temporary directory of the user's OS", and one run wrote `/tmp/<slug>-brief.md` — a path it
 * knows, not the variable the harness set — while the next run of the same fixture wrote it under
 * `TMPDIR`, which is the run's own. So the per-run temporary directory cannot be relied on to bind
 * the one writer the isolation was for, and all three directories are swept.
 *
 * Left there, that file is a **run** the next one takes its bearings from: refinement treats a
 * brief on disk as proof that stage 1 already ran, and a stable **slug** means the second run of
 * this test skips the grilling, never invokes the **responder**, and reaches stage 3 in ninety
 * seconds. That is not a theory either — it is what the first full run of this test did.
 *
 * So a run collects its own brief out of the shared directory when it finishes: the evidence moves
 * into the **run directory**, where a run's leavings belong and where a contributor can read it,
 * and the next run finds nothing to resume from. **A brief it did not write is never touched.**
 * Out of a shared directory, a file is collected only where the run's own **session record**s
 * show a tool call writing a file of that name, and only where the file is as new as the run. The
 * age alone was the rule once, and it did not hold: a contribution session elsewhere on the same
 * machine wrote `repo-linters-brief.md` to `/tmp` while a refinement was running, so it was as
 * new as the run, and the run took it (refine-commits-its-vocabulary ticket 06). A name the run
 * merely READ — a listing of the directory it took its bearings from — is no write, so a foreign
 * brief the run saw is left where it is. The record is the signal, and not the epic's **slug**:
 * on a forge-issue tracker the brief's filename is where the slug is read from (`./refine-run.ts`),
 * so the slug cannot also be what picks the file.
 *
 * The run's own temporary directory is collected from for the second of those reasons alone: no
 * other run can reach it, so there is nothing there to prevent, but the brief still belongs at the
 * run directory's ROOT, which is where CONTRIBUTING § What a run leaves behind sends a contributor
 * to read it. It took a run to notice that it was missing, and that is the shape of the miss: a
 * sweep that finds nothing writes no diagnostic and nothing asserts on what it collected, so the
 * brief was absent from where it was documented to be and the test passed anyway.
 *
 * Prevention is not the whole of it, because a run killed by a ceiling never gets to collect. What
 * it left is listed before the next run starts, so the matcher that catches a skipped stage 1 can
 * name the file that caused it instead of leaving a contributor to guess.
 */
import { readFile, readdir, rename, stat } from "node:fs/promises";
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

/**
 * The same two, and the run's own — which is what `TMPDIR` names, and what an orchestrator that
 * reads the variable rather than a path it knows writes to.
 *
 * Only the collection sweeps it. `briefsBeforeRun` runs against the shared directories on purpose:
 * the run's own is made fresh for the run and can hold nothing a previous one left, and it is a
 * PREVIOUS run's brief that the listing is there to name.
 */
function temporaryDirectories(runDirectory: RunDirectory): string[] {
  return [...OS_TEMPORARY_DIRECTORIES, runDirectory.tempDir];
}

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
 * it is, and so does one in a shared directory that the run's own records never show it writing,
 * however new. A move that fails is not a failure of the test — the run has already happened — so
 * it is reported by its absence from the list rather than by a throw.
 */
export async function collectBriefs(
  runDirectory: RunDirectory,
  since: number,
): Promise<string[]> {
  const collected: string[] = [];
  const seen = new Set<string>();
  const ownNames = await briefNamesWritten(runDirectory);
  for (const directory of temporaryDirectories(runDirectory)) {
    // The run's own temporary directory is reachable by no other run, so whatever is there is the
    // run's; a shared one holds everybody's, and only a name the run wrote is taken out of it.
    const shared = directory !== runDirectory.tempDir;
    for (const path of await briefsIn(directory)) {
      if (seen.has(path)) continue;
      seen.add(path);
      if (shared && !ownNames.has(briefName(path))) continue;
      const written = await writtenAt(path);
      if (written === null || written < since) continue;
      // Two of the swept directories can hold the same NAME — the shared one and the run's own —
      // and one destination would mean the second move overwrote the first with nothing said. Both
      // files are evidence, so a name already taken by this collection gets a number in front.
      let destination = join(runDirectory.root, briefName(path));
      for (let copy = 2; collected.includes(destination); copy += 1) {
        destination = join(runDirectory.root, `${copy}-${briefName(path)}`);
      }
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

/** The tools whose `file_path` is a file they write. */
const WRITING_TOOLS = new Set(["Write", "Edit", "MultiEdit"]);

/** A shell command writing a brief: a redirection into it, or `tee` onto it. */
const SHELL_WRITE = /(?:>>?|\btee(?:[ \t]+-a)?)[ \t]*['"]?([^\s'"]*-brief\.md)/g;

/**
 * The name of every brief the run's own session records show it writing, whichever session or
 * dispatch wrote it: a `Write` or an `Edit` naming the file, or a shell command redirected into
 * it. Names and not paths, because the same file is reached as `/tmp/<slug>-brief.md` by one
 * orchestrator and under `TMPDIR` by another, and the directory is the sweep's to say. A record
 * that cannot be read gives nothing, so a run whose records are gone collects only out of its own
 * temporary directory and leaves a shared one alone: the next run lists what was left.
 */
async function briefNamesWritten(runDirectory: RunDirectory): Promise<Set<string>> {
  const names = new Set<string>();
  const root = join(runDirectory.configDir, "projects");
  let entries: string[];
  try {
    entries = await readdir(root, { recursive: true });
  } catch {
    return names;
  }
  for (const entry of entries) {
    if (!entry.endsWith(".jsonl")) continue;
    let text: string;
    try {
      text = await readFile(join(root, entry), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      if (!line.includes("-brief.md")) continue;
      for (const path of briefPathsWrittenBy(line)) names.add(briefName(path));
    }
  }
  return names;
}

/** The brief paths one session record line's tool calls write. */
function briefPathsWrittenBy(line: string): string[] {
  let record: unknown;
  try {
    record = JSON.parse(line);
  } catch {
    return [];
  }
  const content = (record as { message?: { content?: unknown } }).message?.content;
  if (!Array.isArray(content)) return [];
  const paths: string[] = [];
  for (const block of content as unknown[]) {
    const call = block as { type?: unknown; name?: unknown; input?: Record<string, unknown> };
    if (call.type !== "tool_use" || typeof call.name !== "string") continue;
    const input = call.input ?? {};
    const filePath = input["file_path"];
    if (WRITING_TOOLS.has(call.name) && typeof filePath === "string" && BRIEF.test(filePath)) {
      paths.push(filePath);
    }
    const command = input["command"];
    if (call.name === "Bash" && typeof command === "string") {
      for (const match of command.matchAll(SHELL_WRITE)) {
        if (match[1] !== undefined) paths.push(match[1]);
      }
    }
  }
  return paths;
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
