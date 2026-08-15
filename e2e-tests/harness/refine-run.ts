/**
 * The builder a refine test is written against (end-to-end-tests ticket 02).
 *
 * A second test for this skill costs a few lines: name a **fixture**, override a ceiling if it
 * needs one, and start. Everything between — the **staged copy**, the install, the **standing
 * repo**, the clone, the **responder** in the human's seat, the ceilings and the accounting — is
 * here, once.
 *
 * What comes back is what a human could see afterwards, and nothing from inside the run. The
 * matchers judge it (`./matchers.ts`); the **verifier** judges what they cannot (`./verifier.ts`).
 */
import type { TestContext } from "node:test";
import {
  DEFAULT_CEILINGS,
  holdSpendCeiling,
  minutes,
  type Ceilings,
  type Spend,
} from "./ceilings.ts";
import { briefsBeforeRun, collectBriefs, type Briefs } from "./brief.ts";
import { listEpics, readEpic, type PublishedEpic } from "./epic.ts";
import { loadFixture, type Fixture } from "./fixture.ts";
import { remoteHead } from "./forge.ts";
import { installPluginUnderTest, REVIEW_OPTIONS } from "./install.ts";
import { createResponder, type ResponderRecord } from "./responder.ts";
import { createRunDirectory, type RunDirectory } from "./run-directory.ts";
import { driveRun, readSessionRecords, type RunOutcome, type SessionRecords } from "./run.ts";
import { cloneStandingRepo, type StandingRepo } from "./standing-repo.ts";
import { stageWorkingTree } from "./staged-copy.ts";
import { verifyEpic, type Verdict } from "./verifier.ts";

/** The test's half of the standing repo's name. Never the run's: the repository outlives it. */
const TEST_NAME = "refine";

export interface RefineOutcome {
  readonly runDirectory: RunDirectory;
  readonly fixture: Fixture;
  readonly standingRepo: StandingRepo;
  readonly run: RunOutcome;
  readonly responder: ResponderRecord;
  /** the epics in the working tree before the run, and after it */
  readonly epicsBefore: readonly string[];
  readonly epicsAfter: readonly string[];
  /** the ones that appeared, which is what the run published — worked out once, here */
  readonly epicsPublished: readonly string[];
  /** what the forge has the standing repo's branch at, once the run is over */
  readonly remoteHeadAfterRun: string;
  readonly records: SessionRecords;
  /** what the run found in the operating system's temporary directory, and what it took away */
  readonly briefs: Briefs;
  readonly spend: Spend;
  /** the epic the run published, read off the clone */
  readonly epic: PublishedEpic;
  /** the test's own signal, so a verdict is stopped with the test rather than after it */
  readonly ceiling: AbortSignal;
}

export interface RefineRunBuilder {
  /**
   * Ceilings other than the epic's own, for a test that costs less than a delivery.
   *
   * Whatever a test passes here it also passes to `testTimeout`, or the runner kills a raised
   * ceiling before it can report (`./ceilings.ts`).
   */
  withCeilings(ceilings: Partial<Ceilings>): RefineRunBuilder;
  start(t: TestContext): Promise<RefineOutcome>;
}

export function refineRun(fixtureName: string): RefineRunBuilder {
  let ceilings: Ceilings = DEFAULT_CEILINGS;

  const builder: RefineRunBuilder = {
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

      const standingRepo = await cloneStandingRepo(runDirectory, fixture, TEST_NAME);
      t.diagnostic(
        `standing repo ${standingRepo.fullName}` +
          `${standingRepo.created ? " (created by this run)" : ""}` +
          `${standingRepo.forcePushed ? " (force-synced from the fixture)" : ""}` +
          ` at ${standingRepo.headBeforeRun.slice(0, 12)}`,
      );

      const epicsBefore = await listEpics(runDirectory.cloneDir, fixture.tracker);
      const responder = createResponder(runDirectory, fixture);

      // Taken before the run and collected after it, whichever way the run ends: a brief left in
      // the operating system's temporary directory is what makes the NEXT run skip its grilling
      // (`./brief.ts`).
      const briefsBefore = await briefsBeforeRun();
      const startedAt = Date.now();
      let collected: readonly string[];
      let run: RunOutcome;
      try {
        run = await driveRun({
          runDirectory,
          cwd: runDirectory.cloneDir,
          command: `/deliverer:${TEST_NAME} ${fixture.idea}`,
          ceilings,
          canUseTool: responder.canUseTool,
          spentElsewhere: () => responder.record().costUsd,
          progress: () => {
            const answered = responder.record();
            return `${answered.rounds} rounds of questions, ${answered.answers.length} answered`;
          },
          // Stage 5 names the call that delivers the epic, which is a refinement's own last word.
          // The grace period in `./run.ts` is what covers a report that words it differently.
          finished: (report) => report.includes("/deliverer:build"),
        });
      } finally {
        collected = await collectBriefs(runDirectory, startedAt);
        if (collected.length > 0) {
          t.diagnostic(`collected the run's brief into the run directory: ${collected.join(", ")}`);
        }
      }
      const briefs: Briefs = { beforeRun: briefsBefore, collected };
      const answered = responder.record();
      const spend: Spend = {
        ceilingUsd: ceilings.spendUsd,
        runUsd: run.costUsd,
        besideRunUsd: answered.costUsd,
      };
      t.diagnostic(
        `the run took ${minutes(run.durationMs)} and cost $${run.costUsd.toFixed(2)}, reported ` +
          `${run.resultsSeen} times as its dispatches came back, with ${answered.rounds} ` +
          `rounds of questions (${answered.answers.length} in all) answered for ` +
          `$${answered.costUsd.toFixed(2)}`,
      );

      holdSpendCeiling(
        spend,
        run.durationMs,
        `the run itself cost $${spend.runUsd.toFixed(2)} and the responder beside it ` +
          `$${spend.besideRunUsd.toFixed(2)}.`,
      );

      const epicsAfter = await listEpics(runDirectory.cloneDir, fixture.tracker);
      const epicsPublished = epicsAfter.filter((slug) => !epicsBefore.includes(slug));
      return {
        runDirectory,
        fixture,
        standingRepo,
        run,
        responder: answered,
        epicsBefore,
        epicsAfter,
        epicsPublished,
        remoteHeadAfterRun: await remoteHead(runDirectory, standingRepo.url),
        records: await readSessionRecords(runDirectory),
        briefs,
        spend,
        // Read whichever epic the run published, or an empty one when it published none — the
        // matcher is what names that as the failure it is.
        epic: await readEpic(
          runDirectory.cloneDir,
          fixture.tracker,
          epicsPublished[0] ?? "(nothing published)",
        ),
        ceiling: t.signal,
      };
    },
  };
  return builder;
}

/**
 * The verdict on what the run delivered.
 *
 * Separate from `start` because the mechanical assertions run first: a verdict on an epic that was
 * never published costs money to be told what a matcher already said. What it cost rides on the
 * verdict rather than on the run's `Spend`, because by the time this runs the run is over.
 */
export function verify(outcome: RefineOutcome): Promise<Verdict> {
  return verifyEpic(outcome.runDirectory, outcome.fixture, outcome.epic, outcome.ceiling);
}
