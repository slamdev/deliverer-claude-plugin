/**
 * The build happy path (end-to-end-tests ticket 03).
 *
 * An **epic** goes in on the default branch of a **throwaway repo**, all seven stages run — two
 * real **rounds** through the tools server and both **fix waves** among them — and out comes a
 * **change request** **flipped ready** with its **checks** green. Both bars have to pass: the
 * mechanical assertions, because a fact should never rest on a model's opinion, and the
 * **verifier**, because a delivery of correctly shaped rubbish is exactly the failure a shape-only
 * assertion waves through.
 *
 * Nothing here is scripted. The rounds are real delegated reviews at the model and effort tier the
 * plugin's own options select, the findings are posted as comments by the reviewer itself, and the
 * fix waves work real unresolved comments.
 *
 * Everything this file touches is the builder and the named matchers. That is the point: a second
 * test for this skill — a different **fixture**, a resumed run — costs a few lines here and no
 * change to the **harness**.
 */
import { test } from "node:test";
import { buildRun, verify } from "../harness/build-run.ts";
import { DEFAULT_CEILINGS, minutes, testTimeout, totalSpend } from "../harness/ceilings.ts";
import {
  assertAssumptionsAdjudicated,
  assertChangeRequestOpened,
  assertChecksGreen,
  assertEveryTicketCommitted,
  assertFlippedReady,
  assertNoScriptedBackend,
  assertRoundsCompleted,
  assertRunFinished,
  assertSessionRecordsKept,
  assertVerdictPassed,
} from "../harness/matchers.ts";

/**
 * This test runs at the epic's own ceilings, and names them once.
 *
 * A test wanting others changes this line and nothing else: the same ceilings reach the runner's
 * timeout and the run itself, which is what stops a raised ceiling being killed by a timeout that
 * did not hear about it.
 */
const CEILINGS = DEFAULT_CEILINGS;

/** The bar stage 7 waits on, and what this test holds the delivery to. */
const ROUNDS = 2;

/**
 * What a delivery of this epic dispatches: one implementer per ticket, then one agent per stage
 * after it, with stage 3 dispatching two and the second round and wave repeating stages 3 and 4.
 */
const DISPATCHES = 9;
const WHAT_IT_DISPATCHES =
  "a delivery dispatches an implementer per ticket, a change request creator, an assumption " +
  "reviewer, a reviewer per round and a comments addresser per fix wave";

test("a delivery implements an epic and flips its change request ready", {
  timeout: testTimeout(CEILINGS),
}, async (t) => {
  const outcome = await buildRun("typescript-library").withCeilings(CEILINGS).start(t);

  assertNoScriptedBackend(outcome);
  assertRunFinished(outcome);
  assertChangeRequestOpened(outcome);
  assertEveryTicketCommitted(outcome);
  assertAssumptionsAdjudicated(outcome);
  assertFlippedReady(outcome);
  assertChecksGreen(outcome);
  // Last of the delivery's own bars, because it is the one read out of prose: a run that failed
  // something the forge could answer for should say so before the harness's own reading is in
  // question (`../harness/report.ts`).
  assertRoundsCompleted(outcome, ROUNDS);
  assertSessionRecordsKept(outcome, DISPATCHES, WHAT_IT_DISPATCHES);

  const verdict = await verify(outcome);
  t.diagnostic(`the verifier: ${verdict.summary}`);

  // Reported before the verdict is judged, because ticket 04 publishes measurements where the spec
  // carried estimates and a run that failed its last assertion still cost what it cost.
  t.diagnostic(
    `measured: ${minutes(outcome.run.durationMs)} and ` +
      `$${totalSpend(outcome.spend).toFixed(2)} for the run against a ceiling of ` +
      `$${outcome.spend.ceilingUsd}, plus $${verdict.costUsd.toFixed(2)} for the verdict, for ` +
      `${outcome.epic.tickets.length} tickets, ` +
      `${outcome.changeRequest?.commits.length ?? 0} commits, ` +
      `${outcome.changeRequest?.assumptionComments.length ?? 0} assumptions and ` +
      `${outcome.roundsCompleted ?? "unknown"} rounds`,
  );

  assertVerdictPassed(verdict);

  // Only here, with every assertion passed. A failing run keeps its repository, its branch and its
  // change request, because the change request is the evidence — and a cleanup that fails is
  // reported rather than thrown, because it must never turn a passing test red.
  const uncleaned = await outcome.cleanUp();
  if (uncleaned !== null) t.diagnostic(uncleaned);
});
