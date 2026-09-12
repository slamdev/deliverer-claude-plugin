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
  assertDebriefWritten,
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
 * This test runs at the epic's ceilings with one raised, and names them once.
 *
 * A test wanting others changes this line and nothing else: the same ceilings reach the runner's
 * timeout and the run itself, which is what stops a raised ceiling being killed by a timeout that
 * did not hear about it.
 *
 * **The spend ceiling is this test's own, because the evidence for it is this test's own.** Seven
 * refinements of this **fixture**, every one on `opus`, spread from $13.45 to $36.46 on the tokens
 * their own records carry — a mean of $20.94 either side of a standard deviation of $7.55
 * (CONTRIBUTING.md § The end-to-end tests). The default's $25 sits between the mean and one
 * deviation above it, so a refinement that runs normally and dear stops on budget and fails
 * whatever assertion covered the stage it never reached — which reports a **run**'s own spread as
 * though it were a finding about the plugin. $40 clears every reading ever taken of this fixture
 * and leaves the ceiling doing the job it exists for: stopping a wedged run, not an expensive one.
 *
 * **The default stays where it is**, and a delivery keeps it: the priciest ever measured spent
 * $10.58 against that $25, so the room a refinement needs is room a delivery has never asked for
 * and should not be given silently.
 *
 * The wall clock is untouched. Nothing has come near ninety minutes — the longest run measured took
 * 55m 29s — and the two ceilings answer different questions.
 */
const CEILINGS = { ...DEFAULT_CEILINGS, spendUsd: 40 };

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
  // The run was observed because the plugin observes runs by default and nothing here switched
  // that off. Shallow on purpose: a debrief exists for this epic and its header names this run.
  assertDebriefWritten(outcome);

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
