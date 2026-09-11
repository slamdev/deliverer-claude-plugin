/**
 * Where a **trace** lives, and what it looks like as a file (run-observation ticket 02; D18, D19
 * and D20).
 *
 * **It refuses forwarding in two places of its own**: its file name, which is what somebody
 * attaching a file reads, and its own first line, which is what somebody opening it reads. The
 * trace carries no bound — it holds whatever the run touched, the repository's contents and the
 * human's own words among it — and it is not the document to send. The **debrief** is, and the
 * debrief's mention of the trace is the third refusal (ticket 03's).
 *
 * **It stands in the plugin's data directory and never in a repository** — the same directory the
 * dependencies and the published source already go to (ADR-0002). Outside every repository by
 * construction, and it survives a reboot. Keyed by the epic's **slug** and the RUN's own timestamp,
 * so re-distilling a run rewrites its own trace and removes nothing else: nothing is ever pruned
 * (D19).
 */
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { formatDuration, tokenDetail, UNKNOWN_STAMP, type Trace, type TraceLine } from "./trace.ts";

/** Read by a human attaching a file, who reads the name and nothing else. */
export const TRACE_FILE_NAME = "DO-NOT-FORWARD-trace.txt";

/** Where every observation of every run goes, under the plugin's data directory. */
export const OBSERVATIONS_DIRECTORY = "observations";

/** Read by a human who opened it. First line of the file, before anything else. */
export const TRACE_REFUSAL =
  "DO NOT FORWARD — this is one deliverer run's raw trace, distilled from the host's own session " +
  "records. It is bounded by nothing: it carries whatever the run touched, including your " +
  "repository's contents and your own words. The document to send is the debrief beside it.";

/**
 * The directory this run's observation lives in: `<data>/observations/<slug>/<run timestamp>`.
 *
 * The timestamp is the RUN's own, off its first entry, and never the moment of distillation —
 * replaying the same records has to land on the same path and write the same bytes. `:` and `.`
 * become `-` because a Windows path cannot carry a colon and a trace nobody can write is worth
 * less than an ugly directory name.
 */
export function observationDirectory(dataDirectory: string, trace: Trace): string {
  const stamp =
    trace.startedAt === undefined ? UNKNOWN_STAMP : trace.startedAt.replace(/[:.]/g, "-");
  return join(dataDirectory, OBSERVATIONS_DIRECTORY, trace.slug, stamp);
}

export function traceFilePath(dataDirectory: string, trace: Trace): string {
  return join(observationDirectory(dataDirectory, trace), TRACE_FILE_NAME);
}

/* ───────────────────────────── the trace as half of a pair ───────────────────────────── */

/**
 * A **trace** on disk under a staging name, waiting to be renamed into place
 * (the-observation-reports-the-whole-run ticket 04; D9).
 *
 * **The window this closes was minutes wide.** `./debrief.ts` wrote the trace, then ran judging — a
 * whole-run synthesis, minutes of model call — and only then wrote the **debrief**, so anything that
 * stopped the process in between left a newer trace beside an older debrief, and both are what a
 * human forwards. The artefacts this epic was measured on show exactly that: a trace ending
 * 11:23:52 beside a debrief whose own **hunch** says the trace it read "run[s] to `[09:24:42]`",
 * with the **identity file** still saying `finalised: yes`. The debrief spent one of its three
 * hunches noticing that and being unable to resolve it.
 *
 * **`path` is the final one from the first moment, and that is the whole trap.** The debrief embeds
 * it (`./debrief-file.ts`'s `tracePath`) and a maintainer follows it, so a staging name reaching
 * either document would be worse than the inconsistency this fixes — it would point a reader at a
 * file that never exists. The staging name is known in this function and nowhere else.
 *
 * **Placed or discarded, and there is no third answer.** A caller that returns without doing either
 * leaves this run with no trace and a file nothing will ever place.
 */
export interface StagedTrace {
  /** where the trace will be, which is what both documents carry — before it is there */
  readonly path: string;
  /** rename it into place: the moment the pair exists */
  readonly place: () => Promise<void>;
  /** remove it, leaving whatever pair is already on disk exactly as it was */
  readonly discard: () => Promise<void>;
}

/**
 * Renders the trace, writes it under its staging name, and removes nothing (ticket 04; D9).
 *
 * **A different suffix from `writeFileAtomically`'s below, on purpose.** That function's window is
 * one write wide; this one is held open across a whole debrief write, judging and all, and two
 * windows that could take the same name would have one truncate the other. Both carry the pid, for
 * the reason that function gives: two observers in one data directory are routine.
 *
 * The live **observer** rewrites this run's trace on every reading, so the same process stages under
 * the same name each time — a leftover from a reading that died mid-write is overwritten here rather
 * than accumulating, and `sweepStaged` takes the ones no live process owns.
 */
export async function stageTrace(dataDirectory: string, trace: Trace): Promise<StagedTrace> {
  const path = traceFilePath(dataDirectory, trace);
  const directory = observationDirectory(dataDirectory, trace);
  const staged = join(directory, `${TRACE_FILE_NAME}.staging.${process.pid}`);
  await mkdir(directory, { recursive: true });
  await sweepStaged(directory);
  const discard = async (): Promise<void> => {
    // This process's own file, so removing it undoes nobody else's work — and failing to remove it
    // is never worth reporting over whatever failure asked for the discard.
    await rm(staged, { force: true }).catch(() => undefined);
  };
  try {
    await writeFile(staged, renderTrace(trace), "utf8");
  } catch (error) {
    await discard();
    throw error;
  }
  return {
    path,
    place: async () => {
      try {
        // Within one directory, so it is atomic: a reader sees the previous whole trace or this one.
        await rename(staged, path);
      } catch (error) {
        // The debrief is already on disk by now and it names `path`, so a rename that failed leaves
        // it naming a trace that is not there — which the failure the caller reports says. A
        // `.staging.` file nothing will ever place would say nothing to anybody, so it goes.
        await discard();
        throw error;
      }
    },
    discard,
  };
}

/**
 * Staged traces left by a process that is gone (ticket 04; D9).
 *
 * A discard covers every failure the code can see. What it cannot see is the process being killed
 * outright — a terminal closed on a replay, a machine shut down while an observer was judging — and
 * that leaves a staged trace nothing will ever place or remove. So each staging sweeps the ones
 * whose holder is gone, by the same liveness rule `../observe.mjs` uses for its lock and
 * `../../hooks/install-mcp-server.sh` for the install's: a pid that no longer exists holds nothing.
 *
 * Never throws and never reports: a directory that cannot be listed, or a file that will not be
 * removed, costs one stale file and nothing else.
 */
async function sweepStaged(directory: string): Promise<void> {
  const prefix = `${TRACE_FILE_NAME}.staging.`;
  let names: readonly string[];
  try {
    names = await readdir(directory);
  } catch {
    return;
  }
  for (const name of names) {
    if (!name.startsWith(prefix)) continue;
    const pid = Number(name.slice(prefix.length));
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid || alive(pid)) continue;
    await rm(join(directory, name), { force: true }).catch(() => undefined);
  }
}

/** Whether a pid still exists. `EPERM` — somebody else's process — counts as alive. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as { code?: unknown }).code === "EPERM";
  }
}

/**
 * Write a file so that nothing ever reads it half-written (run-observation ticket 04).
 *
 * **Staged and renamed, never written over in situ.** The live **observer** rewrites this run's
 * trace and its **debrief** as each stage lands, so "a readable one exists at every moment" (D23)
 * includes the moments something is reading it — and a document caught half-written is one nobody
 * can tell apart from one the observer got wrong. `rename(2)` within a directory is atomic, so a
 * reader sees the previous whole file or the new whole file and never a prefix of either.
 *
 * The staging name carries the pid, for the reason `hooks/install-mcp-server.sh` publishes under a
 * per-process name: two observers in one data directory are routine (two sessions, two runs), and
 * a fixed staging name would have one truncate the file the other is mid-write into.
 *
 * It lives here rather than in a module of its own because this file is already where an
 * observation's files are placed, and `./debrief-file.ts` — the only other writer — already reads
 * its layout from here.
 */
export async function writeFileAtomically(path: string, text: string): Promise<void> {
  const staged = `${path}.staged.${process.pid}`;
  try {
    await writeFile(staged, text, "utf8");
    await rename(staged, path);
  } catch (error) {
    // The staging file is this process's own, so removing it is never somebody else's work being
    // undone. Failing to remove it is not worth reporting over the failure that got us here.
    await rm(staged, { force: true }).catch(() => undefined);
    throw error;
  }
}

/* ─────────────────────────────────────── the text ─────────────────────────────────────── */

/** How wide the kind column is: the longest kind is `dispatched`. */
const KIND_WIDTH = 10;

/**
 * The trace as its file, and the whole of what determinism is measured on.
 *
 * Every character here derives from the records. Nothing reads a clock, an environment variable, a
 * locale or a random source — `toLocaleString` is deliberately absent for the last of those
 * reasons, which is why every figure below is bare digits.
 */
export function renderTrace(trace: Trace): string {
  const out: string[] = [TRACE_REFUSAL, ""];

  out.push("== the run ==");
  out.push(row("skill", trace.skills.length === 0 ? "none recorded" : trace.skills.join(", ")));
  out.push(row("slug", trace.slugRead ? trace.slug : `${trace.slug} (no task update carried one)`));
  out.push(row("session", trace.sessionId ?? "unknown"));
  out.push(row("record", trace.recordPath));
  out.push(row("started", trace.startedAt ?? "unknown"));
  out.push(row("last entry", trace.endedAt ?? "unknown"));
  out.push(row("wall clock", formatDuration(trace.durationMs)));
  out.push("");

  out.push("== what it did ==");
  out.push(
    row(
      "entries",
      `${trace.counts.entries} (${trace.counts.ownEntries} in the run's own record, ` +
        `${trace.counts.dispatchEntries} across ${trace.dispatches.length} dispatch records)`,
    ),
  );
  out.push(row("dispatches", String(trace.counts.dispatches)));
  out.push(row("question rounds", String(trace.counts.questionRounds)));
  out.push(
    row(
      "review tool calls",
      `${trace.counts.reviewPolls} (a round's polls are in the code-reviewer dispatch that made ` +
        `them)`,
    ),
  );
  out.push(row("task updates", String(trace.counts.taskUpdates)));
  out.push(
    row(
      "tool calls",
      `${trace.counts.toolCalls} in the run's own record, ` +
        `${trace.counts.dispatchToolCalls} across its dispatches`,
    ),
  );
  out.push("");

  out.push("== tokens, per API request and never per entry ==");
  out.push(row("whole run", tokenDetail(trace.tokens) || "none recorded"));
  out.push(row("the run's own", tokenDetail(trace.ownTokens) || "none recorded"));
  for (const dispatch of trace.dispatches) {
    out.push(
      row(
        `#${dispatch.ordinal} ${dispatch.agentType}`,
        tokenDetail(dispatch.tokens) || "none recorded",
      ),
    );
  }
  out.push("");

  out.push("== how this was capped ==");
  out.push(
    row(
      "excerpt cap",
      `${trace.excerptCap} characters per entry, ${trace.elidedChars} characters elided in all. ` +
        `Nothing is dropped by kind: every entry is here, and the cap bounds volume alone.`,
    ),
  );
  out.push("");

  out.push("== what could not be read ==");
  if (trace.losses.length === 0) out.push("  nothing: every record this run left was read whole.");
  for (const loss of trace.losses) out.push(`  - ${loss}`);
  out.push("");

  out.push("== the run, in order ==");
  out.push(
    "  [time] kind label detail | excerpt. Times are UTC, under the date marker above them. A " +
      "dispatch opens its own record's",
  );
  out.push(
    "  slice, every line of which is prefixed `#n`, and the `dispatched` line after the slice " +
      "closes it. `req <id>` names the API",
  );
  out.push("  request an entry belongs to; its token figures are in the section above.");
  out.push("");

  let day = "";
  for (const line of trace.lines) {
    day = emitDay(out, line, day);
    out.push(renderLine(line, ""));
    if (line.dispatch === undefined) continue;
    const dispatch = trace.dispatches[line.dispatch - 1];
    if (dispatch === undefined) continue;
    const prefix = `  #${dispatch.ordinal} `;
    out.push(
      `${prefix}record ${dispatch.recordPath ?? "none"} — ${dispatch.entryCount} entries · ` +
        `${tokenDetail(dispatch.tokens) || "no tokens recorded"}`,
    );
    for (const inner of dispatch.lines) {
      day = emitDay(out, inner, day);
      out.push(renderLine(inner, prefix));
    }
  }

  return `${out.join("\n")}\n`;
}

/**
 * The date marker a line sits under, emitted when the day changes.
 *
 * Exported for `./notes.ts` alongside `renderLine` below, and for the same reason: a **dispatch
 * note** reads one dispatch's slice, and a line it points at has to be the line a maintainer finds
 * in the trace. One renderer is what makes that true rather than merely likely.
 */
export function emitDay(out: string[], line: TraceLine, day: string): string {
  const date = line.at?.slice(0, 10);
  if (date === undefined || date === day) return day;
  out.push(`--- ${date} ---`);
  return date;
}

/** One traced line as its text. Exported for the reason `emitDay` above is. */
export function renderLine(line: TraceLine, prefix: string): string {
  const at = line.at === undefined ? "            " : timeOf(line.at);
  const head = `${prefix}[${at}] ${line.kind.padEnd(KIND_WIDTH)}`;
  const middle = [line.label, line.detail].filter((it) => it !== "").join(" ");
  const body = line.excerpt === "" ? "" : ` | ${line.excerpt}`;
  return `${head}${middle === "" ? "" : ` ${middle}`}${body}`;
}

/** `2026-08-24T19:02:13.586Z` → `19:02:13.586`; anything else rides along as it came. */
function timeOf(timestamp: string): string {
  return /^\d{4}-\d{2}-\d{2}T/.test(timestamp) ? timestamp.slice(11, 23) : timestamp;
}

/** A header row. The pad is a floor, never a truncation: a long label pushes its value right. */
function row(label: string, value: string): string {
  return `  ${label.padEnd(17)} ${value}`;
}
