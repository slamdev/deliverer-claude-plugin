/**
 * The builder a build test is written against (end-to-end-tests ticket 03).
 *
 * A second delivery test costs a few lines: name a **fixture**, override a ceiling if it needs one,
 * and start. Everything between — the **staged copy**, the install, the **throwaway repo** carrying
 * the **epic**, the clone, the ceilings, the accounting and the cleanup — is here, once.
 *
 * What comes back is what a human could see afterwards: the **change request**, the commits on the
 * **epic branch**, the comments on both **channels**, the **checks**, and the run's own report. The
 * matchers judge it (`./matchers.ts`); the **verifier** judges what they cannot (`./verifier.ts`).
 *
 * **The repository is destroyed by the test and not by this file.** Deleting it is `cleanUp`, which
 * the test calls once every assertion has passed — so a failing run leaves its repository, its
 * branch and its change request standing, because the change request is the evidence.
 */
import type { TestContext } from "node:test";
import { join } from "node:path";
import {
  DEFAULT_CEILINGS,
  holdSpendCeiling,
  minutes,
  type Ceilings,
  type Spend,
} from "./ceilings.ts";
import {
  listChangeRequests,
  readChangeRequest,
  writeDeliveredDiff,
  type ChangeRequest,
  type ChangeRequestSummary,
} from "./change-request.ts";
import { describeDebriefs, readDebriefs, type Debriefs } from "./debrief.ts";
import { readEpic, type PublishedEpic } from "./epic.ts";
import { DEFAULT_BRANCH } from "./forge.ts";
import { loadFixture, type Fixture } from "./fixture.ts";
import { installPluginUnderTest, REVIEW_OPTIONS } from "./install.ts";
import { describePolledRound, readPolledRounds, type PolledRound } from "./polls.ts";
import { roundsCompleted } from "./report.ts";
import { createUnattendedSeat, type ResponderRecord } from "./responder.ts";
import {
  createRunDirectory,
  scriptedBackendKeptOut,
  SCRIPTED_BACKEND_VARIABLES,
  type RunDirectory,
} from "./run-directory.ts";
import { driveRun, readSessionRecords, type RunOutcome, type SessionRecords } from "./run.ts";
import { stageWorkingTree } from "./staged-copy.ts";
import {
  createThrowawayRepo,
  deleteThrowawayRepo,
  type ThrowawayRepo,
} from "./throwaway-repo.ts";
import { verifyDelivery, type Verdict } from "./verifier.ts";

/** The test's half of the repository's name. The run's half is the run directory's own. */
const TEST_NAME = "build";

/** What the diff a delivery produced is kept as, in the run directory beside its records. */
const DIFF_FILE = "delivered.diff";

/**
 * The scripted review double, and what it would have done had it arrived.
 *
 * `reachedSession` is the whole bar and it is asked of the environment the session was actually
 * given — the object `driveRun` handed to the host, carried back on the outcome, and not a second
 * one built the same way (`./run.ts` says what that cost). `fromContributor` is what was kept out of
 * it, which a diagnostic reports: a contributor whose shell selects the double every day should be
 * told their run reviewed something anyway.
 */
export interface ScriptedBackend {
  readonly fromContributor: Record<string, string>;
  readonly reachedSession: Record<string, string>;
}

export interface BuildOutcome {
  readonly runDirectory: RunDirectory;
  readonly fixture: Fixture;
  readonly repo: ThrowawayRepo;
  readonly run: RunOutcome;
  /** the skill this test drove: the same string the command it sent carries */
  readonly skill: string;
  /** the human's seat, empty: what a delivery asked that nobody was there to answer */
  readonly seat: ResponderRecord;
  /** the epic the delivery was handed, read off the clone */
  readonly epic: PublishedEpic;
  /** every change request the repository carries, so "exactly one" is a matcher's to hold */
  readonly changeRequests: readonly ChangeRequestSummary[];
  /** the one it opened, read whole — null when it opened none, or more than one */
  readonly changeRequest: ChangeRequest | null;
  /** how many **rounds** the run's own report is evidence for (`./report.ts`) */
  readonly roundsCompleted: number | null;
  /** every round this run polled, and what those polls answered (`./polls.ts`) */
  readonly rounds: readonly PolledRound[];
  readonly scriptedBackend: ScriptedBackend;
  readonly records: SessionRecords;
  /** what the observer had left beside the run the moment it returned (`./debrief.ts`) */
  readonly debriefs: Debriefs;
  readonly spend: Spend;
  /** what the epic branch changed, as the forge has it — the verifier's evidence */
  readonly deliveredDiffPath: string | null;
  /** the test's own signal, so a verdict is stopped with the test rather than after it */
  readonly ceiling: AbortSignal;
  /**
   * The throwaway repo deleted, once every assertion has passed. Whatever went wrong comes back as
   * a line to report rather than as a throw: a cleanup must never turn a passing test red.
   */
  cleanUp(): Promise<string | null>;
}

export interface BuildRunBuilder {
  /**
   * Ceilings other than the epic's own.
   *
   * Whatever a test passes here it also passes to `testTimeout`, or the runner kills a raised
   * ceiling before it can report (`./ceilings.ts`).
   */
  withCeilings(ceilings: Partial<Ceilings>): BuildRunBuilder;
  start(t: TestContext): Promise<BuildOutcome>;
}

export function buildRun(fixtureName: string): BuildRunBuilder {
  let ceilings: Ceilings = DEFAULT_CEILINGS;

  const builder: BuildRunBuilder = {
    withCeilings(given) {
      ceilings = { ...ceilings, ...given };
      return builder;
    },
    async start(t) {
      const fixture = await loadFixture(fixtureName);
      const runDirectory = await createRunDirectory(`${TEST_NAME}-${fixture.name}`);
      // Named first, because a failing run is read here rather than reproduced.
      t.diagnostic(`run directory: ${runDirectory.root}`);

      const staged = await stageWorkingTree(runDirectory);
      t.diagnostic(`staged ${staged.fileCount} files of the working tree at ${staged.commit}`);
      await installPluginUnderTest(runDirectory, staged, REVIEW_OPTIONS);

      const repo = await createThrowawayRepo(runDirectory, fixture);
      t.diagnostic(
        `throwaway repo ${repo.fullName} created private, carrying the epic at ` +
          `${repo.epicLocation} on ${DEFAULT_BRANCH} at ${repo.headAtCreation.slice(0, 12)}`,
      );

      const epic = await readEpic(runDirectory.cloneDir, fixture.tracker, fixture.epic?.slug ?? "");
      // Read before the run, because a contributor who has the double selected wants telling now
      // rather than after twenty minutes of delivery. What actually reached the session is read off
      // the run once it is over, which is the only place that fact exists.
      const fromContributor = await scriptedBackendKeptOut();
      if (Object.keys(fromContributor).length > 0) {
        t.diagnostic(
          `kept the scripted review double out of the session: ` +
            `${Object.keys(fromContributor).join(", ")} is set in this ` +
            `contributor's environment and every round of this run is a real one anyway`,
        );
      }

      const seat = createUnattendedSeat();
      const run = await driveRun({
        runDirectory,
        cwd: runDirectory.cloneDir,
        command: `/deliverer:${TEST_NAME} ${repo.epicLocation}`,
        ceilings,
        canUseTool: seat.canUseTool,
        // Nobody is sitting in the seat, so nothing is spent beside the run.
        spentElsewhere: () => 0,
        progress: () => progressOnTheForge(runDirectory, repo),
        // The forge is what says a delivery is over: stage 8 is the flip, and a change request out
        // of draft is that stage having run. The report is asked for a word about its rounds
        // besides, so the last turn is not cut off before it says one — and the grace period in
        // `./run.ts` covers a report that words it differently.
        finished: async (report) =>
          /\bround/i.test(report) && (await flippedReady(runDirectory, repo)),
      });

      // Read here and not later, because "the moment the run returned" is the state this reports:
      // no wait, no poll, and the debrief said to be still going is the answer rather than a
      // reason to look again (`./debrief.ts`).
      const debriefs = await readDebriefs(runDirectory);
      t.diagnostic(describeDebriefs(debriefs));

      const scriptedBackend: ScriptedBackend = {
        fromContributor,
        reachedSession: scriptedBackendIn(run.environment),
      };
      const spend: Spend = { ceilingUsd: ceilings.spendUsd, runUsd: run.costUsd, besideRunUsd: 0 };
      t.diagnostic(
        `the run took ${minutes(run.durationMs)} and cost $${run.costUsd.toFixed(2)}, reported ` +
          `${run.resultsSeen} times as its dispatches came back, over ${run.numTurns} turns`,
      );
      if (seat.record().rounds > 0) {
        t.diagnostic(
          `the delivery put ${seat.record().rounds} rounds of questions to a seat nobody was ` +
            `sitting in; the recommended option went back to each`,
        );
      }

      holdSpendCeiling(
        spend,
        run.durationMs,
        `the run itself cost $${spend.runUsd.toFixed(2)}, and nobody was sitting in the human's ` +
          `seat to spend anything beside it.`,
      );

      const changeRequests = await listChangeRequests(runDirectory, repo.fullName);
      const only = changeRequests.length === 1 ? changeRequests[0] : undefined;
      const changeRequest = only === undefined
        ? null
        : await readChangeRequest(runDirectory, repo.fullName, only);

      // What the rounds were answered when they were polled, read off the records the run left
      // (`./polls.ts`). Reported as well as asserted on: a round's spend is in none of the figures
      // above — a round runs as its own process and its money never reaches the session's total —
      // so this is the only place a reader is told what the reviews themselves cost.
      const records = await readSessionRecords(runDirectory);
      const rounds = await readPolledRounds(records);
      t.diagnostic(
        `the rounds, as their polls answered them: ` +
          `${rounds.map(describePolledRound).join("; ") || "none were polled in this run"}`,
      );

      return {
        runDirectory,
        fixture,
        repo,
        run,
        skill: TEST_NAME,
        seat: seat.record(),
        epic,
        changeRequests,
        changeRequest,
        roundsCompleted: roundsCompleted(run.report),
        rounds,
        scriptedBackend,
        records,
        debriefs,
        spend,
        deliveredDiffPath: changeRequest === null
          ? null
          : await writeDeliveredDiff(
              runDirectory,
              repo.url,
              changeRequest.branch,
              join(runDirectory.root, DIFF_FILE),
              DEFAULT_BRANCH,
            ),
        ceiling: t.signal,
        cleanUp: () => deleteThrowawayRepo(runDirectory, repo),
      };
    },
  };
  return builder;
}

/**
 * The verdict on what the delivery built.
 *
 * Separate from `start` because the mechanical assertions run first: a verdict on a change request
 * that was never opened costs money to be told what a matcher already said.
 */
export function verify(outcome: BuildOutcome): Promise<Verdict> {
  const delivered = outcome.changeRequest;
  if (delivered === null || outcome.deliveredDiffPath === null) {
    throw new Error(
      `there is no change request to judge, so the matchers should have failed before this. That ` +
        `they did not is the harness failing rather than a finding about the plugin.`,
    );
  }
  return verifyDelivery(
    outcome.runDirectory,
    outcome.epic,
    { branch: delivered.branch, diffPath: outcome.deliveredDiffPath },
    outcome.ceiling,
  );
}

/** Which of the double's two knobs one environment carries, and with what value. */
function scriptedBackendIn(environment: NodeJS.ProcessEnv): Record<string, string> {
  const found: Record<string, string> = {};
  for (const variable of SCRIPTED_BACKEND_VARIABLES) {
    const value = environment[variable];
    if (value !== undefined) found[variable] = value;
  }
  return found;
}

/** Whether the change request has been taken out of **draft**, which is stage 8 having run. */
async function flippedReady(runDirectory: RunDirectory, repo: ThrowawayRepo): Promise<boolean> {
  try {
    const open = await listChangeRequests(runDirectory, repo.fullName);
    return open.some((changeRequest) => !changeRequest.isDraft);
  } catch {
    // A forge that cannot be reached says nothing about the run, and a run left going says more
    // than one ended on a network failure. The grace period is what ends it either way.
    return false;
  }
}

/**
 * How far the delivery had got, for a ceiling to report — read off the forge, because that is where
 * a delivery leaves its progress.
 *
 * It never throws: this runs inside a failure, and a ceiling that could not say what it stopped is
 * worse than one that says less than it hoped to.
 */
async function progressOnTheForge(
  runDirectory: RunDirectory,
  repo: ThrowawayRepo,
): Promise<string> {
  try {
    const changeRequests = await listChangeRequests(runDirectory, repo.fullName);
    const opened = changeRequests[0];
    if (opened === undefined) {
      return `no change request on ${repo.fullName} yet, so it had not reached stage 2`;
    }
    const delivered = await readChangeRequest(runDirectory, repo.fullName, opened);
    const tickets = new Set(
      delivered.commits
        .map((commit) => commit.ticket)
        .filter((ticket): ticket is number => ticket !== null),
    );
    return (
      `${opened.url}, ${opened.isDraft ? "still a draft" : "out of draft"}, with ` +
      `${delivered.commits.length} commits naming ${tickets.size} tickets, ` +
      `${delivered.assumptionComments.length} assumption comments and ` +
      `${delivered.checks.length} checks`
    );
  } catch (error) {
    return `nothing this harness could read off ${repo.fullName}: ${String(error)}`;
  }
}
