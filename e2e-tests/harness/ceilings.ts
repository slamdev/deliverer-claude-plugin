/**
 * What a run may take and what it may cost, in one place (end-to-end-tests ticket 02).
 *
 * A wedged **orchestrator** is stopped rather than left spending for an afternoon, and a test says
 * what the run had reached when it stopped it — because the only thing a contributor wants to know
 * first is whether the run was slow or stuck.
 *
 * **A ceiling is not an assertion, and reaching one is not a failing assertion.** A run that
 * finished and published the wrong thing is a finding about the plugin; a run that hit ninety
 * minutes is a finding about the run. `CeilingReached` is what keeps the two apart in the output —
 * it carries what the run had reached, so the next decision is the reader's rather than a rerun's.
 *
 * Both figures are the spec's first estimates, to be revised once real durations and costs exist.
 * They are overridable per test so a cheap test need not carry a delivery's ceiling, and a test
 * that overrides one hands the SAME ceilings to `testTimeout` and to the run: the runner's timeout
 * sits above the ceiling, and a raised ceiling under an unraised timeout would be killed by the
 * runner before it could report anything.
 */

export interface Ceilings {
  /** how long one run may take, wall clock, from the first dispatch to the report */
  readonly wallClockMs: number;
  /**
   * what one run may cost, in US dollars: the run itself and the **responder** sitting in the
   * human's seat, which between them are everything spent while the run is going. The **verifier**
   * is not in it — it judges what the run delivered once the run is over, and carries its own
   * ceiling below.
   */
  readonly spendUsd: number;
}

export const DEFAULT_CEILINGS: Ceilings = {
  wallClockMs: 90 * 60 * 1000,
  spendUsd: 25,
};

/**
 * What one run cost, against the ceiling that was in force.
 *
 * The run itself and whatever the harness spent in the human's seat beside it — the **responder**
 * answering a grilling, or nothing at all where a delivery asked nobody anything. Between them they
 * are everything spent while the run was going, which is what the ceiling covers. The **verifier**
 * is not in it: it judges what the run delivered once the run is over, carries its own ceiling,
 * and reports its cost on the verdict.
 */
export interface Spend {
  readonly ceilingUsd: number;
  readonly runUsd: number;
  readonly besideRunUsd: number;
}

/** What the run cost: everything spent while it was going, which is what the ceiling covers. */
export function totalSpend(spend: Spend): number {
  return spend.runUsd + spend.besideRunUsd;
}

/**
 * The spend ceiling held against what the whole run cost, or reached.
 *
 * The session's own ceiling cannot do this on its own: what the harness spends in the human's seat
 * is spent BESIDE the run rather than inside it, and one ceiling covers the whole of what a run
 * costs. `detail` is the caller's account of where the money went, which is the only part that
 * differs between a refinement and a delivery.
 */
export function holdSpendCeiling(spend: Spend, elapsedMs: number, detail: string): void {
  const spent = totalSpend(spend);
  if (spent <= spend.ceilingUsd) return;
  throw new CeilingReached("spend", `$${spend.ceilingUsd}`, { elapsedMs, spentUsd: spent, detail });
}

/**
 * What the harness's own two agents may spend on one turn each.
 *
 * Not a run's ceiling and not overridable: these are guards on an agent that has started reasoning
 * about the epic instead of answering from a brief, or writing a review instead of returning a
 * verdict. A turn costs a fraction of either in practice. They live here rather than beside their
 * agents so that every figure the harness spends against is in one file.
 */
export const RESPONDER_ROUND_CEILING_USD = 1;
export const VERIFIER_CEILING_USD = 5;

/**
 * What a test gives the runner on top of the run's own ceiling: the install, the standing repo and
 * the verdict all sit outside the run and none of them is what the wall clock is for. It is
 * deliberately generous — the runner's timeout is the outer bound, and the ceiling inside it is
 * what reports.
 */
export const AROUND_THE_RUN_MS = 20 * 60 * 1000;

/** The timeout a test declares, so the ceiling inside it is what stops a run and says so. */
export function testTimeout(ceilings: Ceilings = DEFAULT_CEILINGS): number {
  return ceilings.wallClockMs + AROUND_THE_RUN_MS;
}

/** Which ceiling stopped a run. The wording a failure carries, so it reads the same everywhere. */
export type Ceiling = "wall-clock" | "spend";

/**
 * A run stopped by a ceiling rather than by anything it produced.
 *
 * The message opens with a marked line and never with an assertion's wording, so a reader scanning
 * the output can tell at a glance which of the two happened. The figure comes from the ceiling that
 * was IN FORCE rather than from the spec's estimate of it: a test that raised one and then read
 * ninety minutes in the failure would be told the wrong thing twice over.
 */
export class CeilingReached extends Error {
  readonly ceiling: Ceiling;
  readonly elapsedMs: number;
  readonly spentUsd: number;

  constructor(
    ceiling: Ceiling,
    inForce: string,
    reached: { elapsedMs: number; spentUsd: number; detail?: string },
  ) {
    super(
      `CEILING REACHED — the ${ceiling} ceiling of ${inForce} stopped this run. It is not an ` +
        `assertion that failed: nothing has been judged about what the plugin produced.\n` +
        `  reached: ${minutes(reached.elapsedMs)} and $${reached.spentUsd.toFixed(4)}` +
        `${reached.detail === undefined ? "" : `\n  ${reached.detail}`}`,
    );
    this.name = "CeilingReached";
    this.ceiling = ceiling;
    this.elapsedMs = reached.elapsedMs;
    this.spentUsd = reached.spentUsd;
  }
}

/** A duration a human reads without dividing anything. */
export function minutes(ms: number): string {
  const whole = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${whole}m ${String(seconds).padStart(2, "0")}s`;
}
