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
 * test for this skill — a different **fixture**, a different **idea**, a resumed run — costs a few
 * lines here and no change to the **harness**.
 */
import { test } from "node:test";
import { minutes, testTimeout } from "../harness/ceilings.ts";
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
import { refineRun, totalSpend, verify } from "../harness/refine-run.ts";

/** The two writers refinement dispatches, which is the floor under what its records must hold. */
const DISPATCHED_WRITERS = 2;

test("a refinement turns an idea into a published spec and its tickets", {
  timeout: testTimeout(),
}, async (t) => {
  const outcome = await refineRun("typescript-library").start(t);

  assertRunFinished(outcome);
  assertGrillingAnswered(outcome);
  assertEpicPublished(outcome);
  assertSpecPublished(outcome);
  assertTicketsPublished(outcome);
  assertNothingPushed(outcome);
  assertSessionRecordsKept(outcome, DISPATCHED_WRITERS);

  const verdict = await verify(outcome);
  t.diagnostic(`the verifier: ${verdict.summary}`);

  // Reported before the verdict is judged, because ticket 04 publishes measurements where the spec
  // carried estimates and a run that failed its last assertion still cost what it cost.
  t.diagnostic(
    `measured: ${minutes(outcome.run.durationMs)} and ` +
      `$${totalSpend(outcome.spend).toFixed(2)} in all (the run ` +
      `$${outcome.spend.runUsd.toFixed(2)}, the responder ` +
      `$${outcome.spend.responderUsd.toFixed(2)}, the verifier ` +
      `$${outcome.spend.verifierUsd.toFixed(2)}), against a ceiling of ` +
      `$${outcome.spend.ceilingUsd}, for ${outcome.epic.tickets.length} tickets`,
  );

  assertVerdictPassed(verdict);
});
