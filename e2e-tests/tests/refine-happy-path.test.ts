/**
 * The refine happy path (end-to-end-tests ticket 02).
 *
 * An **idea** goes in, a **responder** answers the grilling in the human's place, and what comes
 * out is a published **spec** and one **ticket** per slice. Both bars have to pass: the mechanical
 * assertions, because a fact should never rest on a model's opinion, and the **verifier**, because
 * a run that produced correctly shaped rubbish is exactly the failure a shape-only assertion waves
 * through.
 *
 * Everything this file touches is the builder and the named matchers. That is the point: a second
 * test for this skill — a different **fixture**, a resumed run — costs a few lines here and no
 * change to the **harness**.
 */
import { test } from "node:test";
import { DEFAULT_CEILINGS, minutes, testTimeout, totalSpend } from "../harness/ceilings.ts";
import {
  assertEpicPublished,
  assertGrillingAnswered,
  assertNothingPushed,
  assertRunFinished,
  assertSessionRecordsKept,
  assertSpecPublished,
  assertTicketsPublished,
  assertVerdictPassed,
} from "../harness/matchers.ts";
import { refineRun, verify } from "../harness/refine-run.ts";

/**
 * This test runs at the epic's own ceilings, and names them once.
 *
 * A test wanting others changes this line and nothing else: the same ceilings reach the runner's
 * timeout and the run itself, which is what stops a raised ceiling being killed by a timeout that
 * did not hear about it.
 */
const CEILINGS = DEFAULT_CEILINGS;

/** The two writers refinement dispatches, which is the floor under what its records must hold. */
const DISPATCHED_WRITERS = 2;
const WHAT_IT_DISPATCHES = "refinement dispatches a spec writer and a tickets writer";

test("a refinement turns an idea into a published spec and its tickets", {
  timeout: testTimeout(CEILINGS),
}, async (t) => {
  const outcome = await refineRun("typescript-library").withCeilings(CEILINGS).start(t);

  assertRunFinished(outcome);
  assertGrillingAnswered(outcome);
  assertEpicPublished(outcome);
  assertSpecPublished(outcome);
  assertTicketsPublished(outcome);
  assertNothingPushed(outcome);
  assertSessionRecordsKept(outcome, DISPATCHED_WRITERS, WHAT_IT_DISPATCHES);

  const verdict = await verify(outcome);
  t.diagnostic(`the verifier: ${verdict.summary}`);

  // Reported before the verdict is judged, because ticket 04 publishes measurements where the spec
  // carried estimates and a run that failed its last assertion still cost what it cost.
  t.diagnostic(
    `measured: ${minutes(outcome.run.durationMs)} and ` +
      `$${totalSpend(outcome.spend).toFixed(2)} for the run (of which the responder ` +
      `$${outcome.spend.besideRunUsd.toFixed(2)}) against a ceiling of ` +
      `$${outcome.spend.ceilingUsd}, plus $${verdict.costUsd.toFixed(2)} for the verdict, ` +
      `for ${outcome.epic.tickets.length} tickets`,
  );

  assertVerdictPassed(verdict);
});
