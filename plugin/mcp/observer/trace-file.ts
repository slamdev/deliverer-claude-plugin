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
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
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

/** Writes the trace and removes nothing. Returns where it went. */
export async function writeTrace(dataDirectory: string, trace: Trace): Promise<string> {
  const path = traceFilePath(dataDirectory, trace);
  await mkdir(observationDirectory(dataDirectory, trace), { recursive: true });
  await writeFileAtomically(path, renderTrace(trace));
  return path;
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
