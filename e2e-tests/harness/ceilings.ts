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
 * They are overridable per test so a cheap test need not carry a delivery's ceiling.
 */

export interface Ceilings {
  /** how long one run may take, wall clock, from the first dispatch to the report */
  readonly wallClockMs: number;
  /** what one run may cost, in US dollars, the harness's own two agents included */
  readonly spendUsd: number;
}

export const DEFAULT_CEILINGS: Ceilings = {
  wallClockMs: 90 * 60 * 1000,
  spendUsd: 25,
};

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
export type Ceiling = "the ninety-minute wall clock" | "the spend";

/**
 * A run stopped by a ceiling rather than by anything it produced.
 *
 * The message opens with a marked line and never with an assertion's wording, so a reader scanning
 * the output can tell at a glance which of the two happened.
 */
export class CeilingReached extends Error {
  readonly ceiling: Ceiling;
  readonly elapsedMs: number;
  readonly spentUsd: number;

  constructor(ceiling: Ceiling, reached: { elapsedMs: number; spentUsd: number; detail?: string }) {
    super(
      `CEILING REACHED — ${ceiling} ceiling stopped this run. It is not an assertion ` +
        `that failed: nothing has been judged about what the plugin produced.\n` +
        `  reached: ${minutes(reached.elapsedMs)} and $${reached.spentUsd.toFixed(4)}` +
        `${reached.detail === undefined ? "" : `\n  ${reached.detail}`}`,
    );
    this.name = "CeilingReached";
    this.ceiling = ceiling;
    this.elapsedMs = reached.elapsedMs;
    this.spentUsd = reached.spentUsd;
  }
}

/** Whether a failure was a ceiling, for a caller deciding how to report it. */
export function isCeilingReached(error: unknown): error is CeilingReached {
  return error instanceof CeilingReached;
}

/** A duration a human reads without dividing anything. */
export function minutes(ms: number): string {
  const whole = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${whole}m ${String(seconds).padStart(2, "0")}s`;
}
