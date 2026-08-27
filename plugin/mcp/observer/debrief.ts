/**
 * **Replay**: point this at a finished **run**'s records and it writes that run's **debrief**
 * (run-observation ticket 03; D13, D15, D16, D17 and D24).
 *
 * ```
 * CLAUDE_PLUGIN_DATA=<the plugin's data directory> node plugin/mcp/observer/debrief.ts <record>.jsonl
 * ```
 *
 * **This is the seam every ticket after it is verified at, and it is what the scripted backend is
 * to the review**: no model, no host, no forge and no money, the same answer every time. With
 * nothing judging — which is the whole of what is built here — one command exercises ticket 02's
 * distillation and its cap, this ticket's extent and header, D15's footer, D20's third refusal and
 * the debrief writer, for free. CONTRIBUTING § What CI does not check carries the procedure beside
 * the scripted backend's.
 *
 * **It writes beside what is already there and removes nothing** (D19). A second replay of one run
 * lands as `debrief-2.md`, byte for byte identical to the first: the content is deterministic and
 * only the name moves. That determinism holds on THIS path, where nothing judges. Ticket 06 writes
 * a **dispatch note** per dispatch, so a replay there calls a cheap model up to thirteen times and
 * no debrief carrying notes can reproduce byte for byte — and no option turns notes off by
 * themselves. The criterion is this path's, and the ticket after this one does not break it.
 *
 * Two callers, exactly as `./distil.ts` has two: a contributor at a terminal, and the **observer**
 * once it exists, which imports `debriefRun` so that what a user gets and what a contributor can
 * reproduce are the same code rather than two renderings of one idea.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readDispatchRecords, readRecordFile } from "./records.ts";
import { formatDuration, type Trace } from "./trace.ts";
import { DATA_DIRECTORY_ENV, distil } from "./distil.ts";
import { resolvePluginCommit } from "./plugin-commit.ts";
import { runFactsOf, type RunFacts } from "./run-facts.ts";
import {
  NOTHING_JUDGED,
  writeDebrief,
  type Judging,
  type WrittenDebrief,
} from "./debrief-file.ts";

export type DebriefOutcome =
  /** the run was found, its trace is on disk and its debrief is beside it */
  | {
      readonly kind: "written";
      readonly trace: Trace;
      readonly facts: RunFacts;
      readonly tracePath: string;
      readonly written: WrittenDebrief;
    }
  /** the record holds no deliverer run, so there is no trace and no debrief — an answer, not a
   *  failure */
  | { readonly kind: "no-run"; readonly reason: string }
  /** nothing could be read, or there is nowhere to write */
  | { readonly kind: "refused"; readonly reason: string };

export interface DebriefOptions {
  readonly recordPath: string;
  readonly dataDirectory: string;
  /** what the judging half contributed; the default is the facts-only path D17 settles */
  readonly judging?: Judging;
}

/**
 * One run's records in, one debrief out.
 *
 * The trace is written first and by the same code `./distil.ts` runs, so what a debrief rests on
 * is the distillation a contributor can produce by hand rather than a second one — and the debrief
 * lands in the same per-run directory, beside it.
 *
 * **Records that produce no trace produce no debrief**, and the caller is told why. An empty
 * debrief about a session that never ran the plugin would be worse than none.
 */
export async function debriefRun(options: DebriefOptions): Promise<DebriefOutcome> {
  const distilled = await distil(options);
  if (distilled.kind !== "traced") return distilled;

  // Read a second time, deliberately. A **trace** is bounded by nothing while a debrief's every
  // figure is bounded by the run, and the excerpt cap is what makes the second read necessary: a
  // round's poll payload and the skill preamble naming the plugin's commit are both longer than a
  // large run's cap, so neither survives into the trace. Reading a file twice is cheaper than a
  // distillation that has to keep two shapes.
  const record = await readRecordFile(options.recordPath);
  const dispatched = await readDispatchRecords(options.recordPath);
  const facts = runFactsOf({
    record,
    dispatchRecords: dispatched.records,
    trace: distilled.trace,
  });
  const commit = await resolvePluginCommit({
    inRecords: facts.commitInRecords,
    dataDirectory: options.dataDirectory,
  });
  const written = await writeDebrief(options.dataDirectory, {
    trace: distilled.trace,
    facts,
    commit,
    judging: options.judging ?? NOTHING_JUDGED,
    tracePath: distilled.path,
  });
  return { kind: "written", trace: distilled.trace, facts, tracePath: distilled.path, written };
}

/** One line summarising what was written, for whoever asked for it. */
export function summariseDebrief(outcome: Extract<DebriefOutcome, { kind: "written" }>): string {
  const { facts, trace } = outcome;
  return (
    `${trace.skills.join(", ") || "unknown skill"} · slug ${trace.slug} · ` +
    `${formatDuration(facts.extent.durationMs)} · ${facts.dispatches.length} dispatches · ` +
    `${facts.rounds.length} rounds ` +
    `(${facts.rounds.map((it) => it.status ?? "unreported").join(", ") || "none"})\n` +
    `  ${facts.ending.kind} · ${facts.human.questionRounds} question rounds · ` +
    `${formatDuration(facts.human.totalWaitMs)} waited on the human\n` +
    `  entries ${facts.extent.firstEntry}–${facts.extent.lastEntry} of the session's record are ` +
    `the run; ${facts.extent.entriesOutside} lie outside it`
  );
}

/* ────────────────────────────────── run by hand ────────────────────────────────── */

const USAGE =
  `usage: ${DATA_DIRECTORY_ENV}=<the plugin's data directory> node observer/debrief.ts ` +
  `<path to a session record.jsonl>`;

async function main(argv: readonly string[]): Promise<number> {
  const recordPath = argv[0];
  if (recordPath === undefined || argv.length > 1) {
    process.stderr.write(`deliverer observer: one record path, and only one.\n${USAGE}\n`);
    return 1;
  }
  const dataDirectory = process.env[DATA_DIRECTORY_ENV];
  if (dataDirectory === undefined || dataDirectory.trim() === "") {
    // Required exactly as `./distil.ts` and `../launch.mjs` require it, and for the same reason:
    // the host names this directory, and a second notion of where it is would put a debrief where
    // no observer looks.
    process.stderr.write(
      `deliverer observer: ${DATA_DIRECTORY_ENV} is not set, so the plugin's data directory ` +
        `cannot be resolved and there is nowhere to write a debrief. It is where the host puts ` +
        `this plugin's dependencies and published source.\n${USAGE}\n`,
    );
    return 1;
  }

  const outcome = await debriefRun({ recordPath: resolve(recordPath), dataDirectory });
  if (outcome.kind === "refused") {
    process.stderr.write(`deliverer observer: ${outcome.reason}\n`);
    return 1;
  }
  if (outcome.kind === "no-run") {
    process.stdout.write(
      `no deliverer run in this record, so no trace and no debrief were written.\n` +
        `  ${outcome.reason}\n`,
    );
    return 2;
  }
  process.stdout.write(
    `${outcome.written.debriefPath}\n  ${summariseDebrief(outcome)}\n` +
      `  trace ${outcome.tracePath}\n` +
      `  identity ${outcome.written.identityPath} (never forwarded)\n` +
      (outcome.written.ordinal === 1
        ? ""
        : `  replay ${outcome.written.ordinal}: written beside the ${outcome.written.ordinal - 1} ` +
          `already there, none of which was touched\n`),
  );
  return 0;
}

// Only when this file IS the command. `debriefRun()` is imported by the observer, which must not
// have a process exit code decided for it here.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
