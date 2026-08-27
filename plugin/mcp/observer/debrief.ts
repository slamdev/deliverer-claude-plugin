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
 * nothing judging — which is what this command does unless it is asked otherwise — one command
 * exercises ticket 02's distillation and its cap, this ticket's extent and header, D15's footer,
 * D20's third refusal and the debrief writer, for free. CONTRIBUTING § What CI does not check
 * carries the procedure beside the scripted backend's.
 *
 * **`--judge` runs the other half** (run-observation tickets 05 and 06), and it is the one thing
 * here that spends money: a **dispatch note** per dispatch on a cheap tier — up to thirteen of them
 * — and then one long-context reading of the whole **trace** and every note together, on whatever
 * account the terminal authenticates, producing the **defect**s a maintainer actually wants. That
 * answers the only question the judging half has — whether the observer finds what a human found by
 * hand — and it is a deliberate paid run rather than something a contributor reaches by accident.
 * The two paths are the same code and the same document; what differs is whether anything read it.
 * There is no flag for the notes alone: D9 keeps depth out of the owner's hands, so the split is
 * between judging and not judging and nothing finer.
 *
 * **It writes beside what is already there and removes nothing** (D19). A second replay of one run
 * lands as `debrief-2.md`, byte for byte identical to the first: the content is deterministic and
 * only the name moves. **That determinism holds on the path where nothing judges**, which is the
 * one tickets 02 and 03 are verified at. A judging replay calls a cheap model per dispatch and a
 * long-context one once, so no debrief it writes can reproduce byte for byte — and its notes land
 * beside any earlier set rather than on top of them, under an ordinal of their own that the debrief
 * names by path.
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
import { synthesisJudge } from "./judge.ts";
import { runFactsOf, type RunFacts } from "./run-facts.ts";
import {
  NOTHING_JUDGED,
  writeDebrief,
  type DebriefStatus,
  type DebriefWriter,
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
      /** what the judging half contributed, so a caller can report it without re-reading the file */
      readonly judging: Judging;
    }
  /** the record holds no deliverer run, so there is no trace and no debrief — an answer, not a
   *  failure */
  | { readonly kind: "no-run"; readonly reason: string }
  /** the caller's `writeWhen` held this reading back, so nothing was put on disk */
  | { readonly kind: "held"; readonly trace: Trace; readonly reason: string }
  /** nothing could be read, or there is nowhere to write */
  | { readonly kind: "refused"; readonly reason: string };

/** What a judge is handed: the whole run, mechanically read, and nothing else. */
export interface JudgingInput {
  readonly trace: Trace;
  readonly facts: RunFacts;
}

/**
 * What the judging half contributed, either as an answer or as the thing that produces one.
 *
 * **The function form is the seam tickets 05 and 06 land on**, and it exists because a judge needs
 * the trace and the facts — which are built here — before it can say anything. Passing an answer
 * is what replay does, since replay's answer is D17's and needs no input at all.
 */
export type JudgingSource = Judging | ((input: JudgingInput) => Promise<Judging>);

export interface DebriefOptions {
  readonly recordPath: string;
  readonly dataDirectory: string;
  /** what the judging half contributed; the default is the facts-only path D17 settles */
  readonly judging?: JudgingSource;
  /**
   * How the pair of files is put on disk (run-observation ticket 04). The default is replay's —
   * beside whatever is already there, rewriting nothing — and the live **observer** passes
   * `refreshDebrief`, which keeps exactly one current for the run it is watching.
   */
  readonly write?: DebriefWriter;
  /** absent means the run is over, which is what a replay always looks at (D23) */
  readonly status?: DebriefStatus;
  /** `./distil.ts`'s gate: `false` puts nothing on disk and answers `held` */
  readonly writeWhen?: (trace: Trace) => boolean;
  /** what the OBSERVER itself lost, as against what the records lost (D29) */
  readonly observationLosses?: readonly string[];
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
  const source = options.judging ?? NOTHING_JUDGED;
  const judging =
    typeof source === "function" ? await source({ trace: distilled.trace, facts }) : source;
  const written = await (options.write ?? writeDebrief)(options.dataDirectory, {
    trace: distilled.trace,
    facts,
    commit,
    judging,
    tracePath: distilled.path,
    status: options.status,
    observationLosses: options.observationLosses,
  });
  return {
    kind: "written",
    trace: distilled.trace,
    facts,
    tracePath: distilled.path,
    written,
    judging,
  };
}

/** What the judging half did, for the line the command prints. */
function judgingLine(outcome: Extract<DebriefOutcome, { kind: "written" }>): string {
  const { judging } = outcome;
  const dollars =
    judging.cost.costUsd === undefined ? "spend unknown" : `$${judging.cost.costUsd.toFixed(2)}`;
  // Printed on BOTH paths, because the notes are written before the synthesis runs: a run whose
  // synthesis was refused still had thirteen cheap calls made for it, and a contributor watching
  // this command needs to see them (run-observation ticket 06).
  const notes =
    judging.notes === undefined || judging.notes.attempted === 0
      ? ""
      : `\n  notes: ${judging.notes.written}/${judging.notes.attempted} dispatches read from the ` +
        `inside on ${judging.notes.model}, ` +
        // The cheap half's spend on its own, which the debrief's own header deliberately does not
        // split: a contributor about to judge a thirteen-dispatch delivery is deciding whether to
        // spend, and the two tiers differ by an order of magnitude (run-observation ticket 06). It
        // says "of that" because the figure on the line above already covers both halves, and the
        // paid verification read the two as one sum before the wording said so.
        (judging.notes.spend.costUsd === undefined
          ? "spend unknown"
          : `$${judging.notes.spend.costUsd.toFixed(2)}` +
            (judging.kind === "none" ? "" : " of that")) +
        (judging.notes.path === undefined ? "" : ` → ${judging.notes.path}`);
  if (judging.kind === "none") return `judging: none — ${judging.reason}${notes}`;
  return (
    `judging: ${judging.defectCount} defect(s) on ${judging.model} ` +
    `(${judging.servedBy ?? "an unnamed model"}), ${dollars}, ` +
    `read against ${judging.judgedAgainst.source}${notes}`
  );
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
  `[--judge] <path to a session record.jsonl>`;

/**
 * Whether this replay spends money (run-observation ticket 05).
 *
 * **Off by default, and that is the whole of why the free seam survives.** Without it the same
 * records give the same debrief byte for byte, no model is called and nothing is spent — which is
 * what tickets 02 and 03 are verified at and what CONTRIBUTING's replay procedure documents. With
 * it, this command runs the whole feature: one long-context reading of the run, on the account the
 * terminal authenticates, answering the only question the judging half has — whether the observer
 * finds what a human found by hand.
 *
 * It switches judging on and nothing else. The model and the depth are the plugin's (D9) and no
 * flag, option or variable reaches them.
 */
const JUDGE_FLAG = "--judge";

async function main(argv: readonly string[]): Promise<number> {
  const judging = argv.includes(JUDGE_FLAG);
  const rest = argv.filter((it) => it !== JUDGE_FLAG);
  const recordPath = rest[0];
  if (recordPath === undefined || rest.length > 1) {
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

  const outcome = await debriefRun({
    recordPath: resolve(recordPath),
    dataDirectory,
    // A replay looks at a run that has stopped, so its one reading IS the synthesis's moment —
    // there is no `finalising` to wait for and no second reading to hold an answer for. Every
    // dispatch is therefore noted here, including any the run left in flight, and then the whole
    // run is read once. `beside: true` puts those notes in a file of their own next to whatever an
    // earlier observation left, which is D19's rule holding for the notes as it holds for the
    // debrief; the debrief names the file it rests on.
    judging: judging
      ? (input) =>
          synthesisJudge(dataDirectory, { beside: true })({
            trace: input.trace,
            facts: input.facts,
            finalising: true,
          })
      : undefined,
  });
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
  if (outcome.kind === "held") {
    // Unreachable from here for the reason `./distil.ts`'s own branch gives — this command passes
    // no `writeWhen` — and kept for the same one.
    process.stderr.write(`deliverer observer: ${outcome.reason}\n`);
    return 1;
  }
  process.stdout.write(
    `${outcome.written.debriefPath}\n  ${summariseDebrief(outcome)}\n` +
      `  ${judgingLine(outcome)}\n` +
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
