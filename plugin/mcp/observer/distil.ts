/**
 * The observer's first entry point: point it at a session record and it writes that **run**'s
 * **trace** (run-observation ticket 02).
 *
 * Two callers, and the second is why the first is a module and not a script:
 *
 *  - **A contributor, by hand.** `CLAUDE_PLUGIN_DATA=<dir> node plugin/mcp/observer/distil.ts
 *    <record>.jsonl`. Nothing here needs a host, a model or a network — replay is a capability in
 *    its own right (D24), and it is what lets the rest of this epic be verified against a record
 *    already on disk instead of by spending a run.
 *  - **The observer**, once it exists. `distil()` returns the trace as an object as well as writing
 *    the file, so what judges a run reads the same distillation a contributor can produce by hand
 *    rather than a second one.
 *
 * `CLAUDE_PLUGIN_DATA` is REQUIRED, exactly the way `../launch.mjs` requires it: the plugin's data
 * directory is the host's to name, and inventing a second notion of where it is would put a trace
 * somewhere no observer looks. Absent, this refuses and names the variable.
 *
 * **A record carrying no deliverer attribution produces no trace**, and says so. That is not a
 * failure: a mention of the plugin is not a run, and eight sessions on the machine this was
 * measured against match the word `deliverer` while being nothing of the kind (see
 * `./records.ts`). An empty trace would be worse than none, because ticket 03's debrief would then
 * be about a session that never ran the plugin.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { attributionOf, readDispatchRecords, readRecordFile } from "./records.ts";
import { buildTrace, formatDuration, lineCount, tokenDetail, type Trace } from "./trace.ts";
import { writeTrace } from "./trace-file.ts";

/** The host names the plugin's persistent directory here, and nothing else may. */
export const DATA_DIRECTORY_ENV = "CLAUDE_PLUGIN_DATA";

export type Distillation =
  /** a run was found and its trace is on disk */
  | { readonly kind: "traced"; readonly trace: Trace; readonly path: string }
  /** a run was found and `writeWhen` said not yet, so nothing was put on disk */
  | { readonly kind: "held"; readonly trace: Trace; readonly reason: string }
  /** the record was read and holds no deliverer run — an answer, not a failure */
  | { readonly kind: "no-run"; readonly reason: string }
  /** nothing could be distilled: the record, or where to put the trace, is not there */
  | { readonly kind: "refused"; readonly reason: string };

export interface DistilOptions {
  readonly recordPath: string;
  readonly dataDirectory: string;
  /**
   * Asked with the finished trace, just before it would be written (run-observation ticket 04).
   * `false` keeps it — and everything downstream of it — off disk entirely.
   *
   * **It exists because where an observation lives is decided by the trace itself**: the directory
   * is keyed by the epic's **slug**, and a run that has not yet created a task carries the
   * stand-in. The live **observer** reads a run WHILE it happens, so its first readings land in
   * that window — and without this gate each of them would leave a whole observation under
   * `unknown-slug/` that nothing ever comes back to. Replay never passes one: a record on disk has
   * whatever slug it is ever going to have.
   */
  readonly writeWhen?: (trace: Trace) => boolean;
}

export async function distil(options: DistilOptions): Promise<Distillation> {
  const record = await readRecordFile(options.recordPath);
  if (record.unreadable !== undefined) {
    return {
      kind: "refused",
      reason: `${options.recordPath} could not be read (${record.unreadable})`,
    };
  }
  if (record.entries.length === 0) {
    return {
      kind: "no-run",
      reason:
        `${options.recordPath} holds no readable entries` +
        (record.unreadableLines.length === 0
          ? ""
          : `, though ${lineCount(record.unreadableLines.length)} of it could not be read as JSON`),
    };
  }

  const dispatched = await readDispatchRecords(options.recordPath);
  // Attribution is looked for in the dispatch records too. A run resumed into a fresh session that
  // then fell over inside its first dispatch is still a run, and the entries that say so may all be
  // below the orchestrator.
  const skills = [
    ...attributionOf(record.entries),
    ...dispatched.records.flatMap((it) => attributionOf(it.file.entries)),
  ];
  if (skills.length === 0) {
    return {
      kind: "no-run",
      reason:
        `no entry in ${options.recordPath} carries the plugin and skill a deliverer run stamps ` +
        `on its own entries, so this session is not one. A record that merely NAMES the plugin — ` +
        `because the host listed the agent types an install added, or because a human was asking ` +
        `about it — is not a run, and neither is one that called the plugin's own tools.`,
    };
  }

  const trace = buildTrace({
    record,
    dispatchRecords: dispatched.records,
    losses: dispatched.losses,
  });
  if (options.writeWhen !== undefined && !options.writeWhen(trace)) {
    return {
      kind: "held",
      trace,
      reason: `the caller held this trace back rather than writing it under "${trace.slug}"`,
    };
  }
  return { kind: "traced", trace, path: await writeTrace(options.dataDirectory, trace) };
}

/**
 * One line summarising a trace, for whoever asked for it.
 *
 * The figures are the ones the cap was chosen against, so a contributor moving the cap can read
 * what it cost without opening the file.
 */
export function summarise(trace: Trace, bytes: number): string {
  return (
    `${trace.skills.join(", ")} · slug ${trace.slug} · ${formatDuration(trace.durationMs)} · ` +
    `${trace.counts.dispatches} dispatches · ${trace.counts.questionRounds} question rounds · ` +
    `${trace.counts.reviewPolls} review polls\n` +
    `  ${trace.counts.entries} entries traced at a ${trace.excerptCap}-character cap → ` +
    `${bytes} bytes\n` +
    `  ${tokenDetail(trace.tokens) || "no tokens recorded"}\n` +
    `  ${trace.losses.length} loss(es) recorded in the trace`
  );
}

/* ────────────────────────────────── run by hand ────────────────────────────────── */

const USAGE =
  `usage: ${DATA_DIRECTORY_ENV}=<the plugin's data directory> node observer/distil.ts ` +
  `<path to a session record.jsonl>`;

async function main(argv: readonly string[]): Promise<number> {
  const recordPath = argv[0];
  if (recordPath === undefined || argv.length > 1) {
    process.stderr.write(`deliverer observer: one record path, and only one.\n${USAGE}\n`);
    return 1;
  }
  const dataDirectory = process.env[DATA_DIRECTORY_ENV];
  if (dataDirectory === undefined || dataDirectory.trim() === "") {
    // Says nothing about a default, because there is none. The host names this directory; a second
    // notion of where it is would put traces where no observer looks.
    process.stderr.write(
      `deliverer observer: ${DATA_DIRECTORY_ENV} is not set, so the plugin's data directory ` +
        `cannot be resolved and there is nowhere to write a trace. It is where the host puts ` +
        `this plugin's dependencies and published source.\n${USAGE}\n`,
    );
    return 1;
  }

  const result = await distil({ recordPath: resolve(recordPath), dataDirectory });
  if (result.kind === "refused") {
    process.stderr.write(`deliverer observer: ${result.reason}\n`);
    return 1;
  }
  if (result.kind === "no-run") {
    // Not an error the caller did anything about, and not a trace either. Said plainly, and given
    // an exit code that tells a script no trace was written.
    process.stdout.write(
      `no deliverer run in this record, so no trace was written.\n  ${result.reason}\n`,
    );
    return 2;
  }
  if (result.kind === "held") {
    // Unreachable from here and kept anyway: `writeWhen` belongs to the live observer and this
    // command passes none, so the only way to arrive is a future caller that forgot. Falling
    // through to read a file that was deliberately not written would report that as a missing
    // trace, which is the wrong diagnosis for the right symptom.
    process.stderr.write(`deliverer observer: ${result.reason}\n`);
    return 1;
  }
  const bytes = Buffer.byteLength(await readBack(result.path), "utf8");
  process.stdout.write(`${result.path}\n  ${summarise(result.trace, bytes)}\n`);
  return 0;
}

async function readBack(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}

// Only when this file IS the command. `distil()` is imported by the observer, which must not have a
// process exit code decided for it here.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
