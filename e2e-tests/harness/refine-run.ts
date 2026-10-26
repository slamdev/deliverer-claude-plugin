/**
 * The builder a refine test is written against (end-to-end-tests ticket 02).
 *
 * A second test for this skill costs a few lines: name a **fixture**, override a ceiling if it
 * needs one, and start. Everything between — the **staged copy**, the install, the **throwaway
 * repo**, the clone, the **responder** in the human's seat, the ceilings, the accounting and the
 * cleanup — is here, once.
 *
 * What comes back is what a human could see afterwards, and nothing from inside the run: the epic
 * in the working tree, and — since a refinement into an in-repository tracker now publishes on the
 * **epic branch** (the-epic-branch-carries-the-spec ticket 04) — the branches and the **change
 * request**s the forge carries. The matchers judge it (`./matchers.ts`); the **verifier** judges
 * what they cannot (`./verifier.ts`).
 *
 * **The repository is destroyed by the test and not by this file**, exactly as a delivery's is
 * (`./build-run.ts`): a failing run leaves its epic branch and its draft standing as the evidence.
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
import { listChangeRequests, type ChangeRequestSummary } from "./change-request.ts";
import { describeDebriefs, readDebriefs, type Debriefs } from "./debrief.ts";
import { listEpics, readEpic, type PublishedEpic } from "./epic.ts";
import { loadFixture, type Fixture } from "./fixture.ts";
import {
  DEFAULT_BRANCH,
  git,
  readBranch,
  remoteBranches,
  remoteHead,
  type BranchCommit,
} from "./forge.ts";
import { installPluginUnderTest, REVIEW_OPTIONS } from "./install.ts";
import { createResponder, type ResponderRecord } from "./responder.ts";
import { createRunDirectory, type RunDirectory } from "./run-directory.ts";
import { driveRun, readSessionRecords, type RunOutcome, type SessionRecords } from "./run.ts";
import { stageWorkingTree } from "./staged-copy.ts";
import {
  createThrowawayRepoWithoutEpic,
  deleteThrowawayRepo,
  type ThrowawayRepo,
} from "./throwaway-repo.ts";
import { verifyEpic, type Verdict } from "./verifier.ts";

/** The test's half of the repository's name. The run's half is the run directory's own. */
const TEST_NAME = "refine";

/** A branch the run left on the forge that the repository was not created with. */
export interface NewBranch {
  readonly name: string;
  /** every file it carries, relative to the repository's root */
  readonly files: readonly string[];
  /** every commit it carries beyond the default branch the repository was created with */
  readonly commits: readonly BranchCommit[];
}

export interface RefineOutcome {
  readonly runDirectory: RunDirectory;
  readonly fixture: Fixture;
  readonly repo: ThrowawayRepo;
  readonly run: RunOutcome;
  /** the skill this test drove: the same string the command it sent carries */
  readonly skill: string;
  readonly responder: ResponderRecord;
  /** the epics in the working tree before the run, and after it */
  readonly epicsBefore: readonly string[];
  readonly epicsAfter: readonly string[];
  /** the ones that appeared, which is what the run published — worked out once, here */
  readonly epicsPublished: readonly string[];
  /** what the forge has the default branch at, once the run is over */
  readonly remoteHeadAfterRun: string;
  /** every branch on the forge other than the default one, which the repository was created with */
  readonly newBranches: readonly NewBranch[];
  /** every markdown path the clone holds changed or new and uncommitted once the run is over */
  readonly uncommittedMarkdown: readonly string[];
  /** every change request the repository carries, so "exactly one" is a matcher's to hold */
  readonly changeRequests: readonly ChangeRequestSummary[];
  readonly records: SessionRecords;
  /** what the observer had left beside the run the moment it returned (`./debrief.ts`) */
  readonly debriefs: Debriefs;
  /** what the run found in the operating system's temporary directory, and what it took away */
  readonly briefs: Briefs;
  readonly spend: Spend;
  /** the epic the run published, read off the clone */
  readonly epic: PublishedEpic;
  /** the test's own signal, so a verdict is stopped with the test rather than after it */
  readonly ceiling: AbortSignal;
  /**
   * The throwaway repo deleted, once every assertion has passed. Whatever went wrong comes back as
   * a line to report rather than as a throw: a cleanup must never turn a passing test red.
   */
  cleanUp(): Promise<string | null>;
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

      const repo = await createThrowawayRepoWithoutEpic(runDirectory, fixture);
      t.diagnostic(
        `throwaway repo ${repo.fullName} created private, carrying no epic, on ` +
          `${DEFAULT_BRANCH} at ${repo.headAtCreation.slice(0, 12)}`,
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
          // Stage 6 names the call that delivers the epic, which is a refinement's own last word.
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

      // Read here and not later, because "the moment the run returned" is the state this reports:
      // no wait, no poll, and the debrief said to be still going is the answer rather than a
      // reason to look again (`./debrief.ts`).
      const debriefs = await readDebriefs(runDirectory);
      t.diagnostic(describeDebriefs(debriefs));

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
      const newBranches = await readNewBranches(runDirectory, repo);
      const changeRequests = await listChangeRequests(runDirectory, repo.fullName);
      t.diagnostic(
        `the forge carries ${newBranches.length} new branches ` +
          `(${newBranches.map((branch) => branch.name).join(", ") || "none"}) and ` +
          `${changeRequests.length} change requests ` +
          `(${changeRequests.map(describeChangeRequest).join(", ") || "none"})`,
      );
      return {
        runDirectory,
        fixture,
        repo,
        run,
        skill: TEST_NAME,
        responder: answered,
        epicsBefore,
        epicsAfter,
        epicsPublished,
        remoteHeadAfterRun: await remoteHead(runDirectory, repo.url),
        newBranches,
        uncommittedMarkdown: await readUncommittedMarkdown(runDirectory),
        changeRequests,
        records: await readSessionRecords(runDirectory),
        debriefs,
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
        cleanUp: () => deleteThrowawayRepo(runDirectory, repo),
      };
    },
  };
  return builder;
}

/** Every branch the forge carries beyond the default one, each with the files it carries. */
async function readNewBranches(
  runDirectory: RunDirectory,
  repo: ThrowawayRepo,
): Promise<NewBranch[]> {
  const branches = await remoteBranches(runDirectory, repo.url);
  const read: NewBranch[] = [];
  for (const name of branches.keys()) {
    if (name === DEFAULT_BRANCH) continue;
    read.push({ name, ...(await readBranch(runDirectory, repo.url, name)) });
  }
  return read;
}

/**
 * Every markdown path the clone holds changed or new and not committed, once the run is over.
 *
 * Markdown, because everything a refinement writes into the repository is — the spec, the tickets,
 * the glossary and the ADRs — and the fixture starts clean, so any such path left over is one the
 * run wrote and never committed. Anything else a sweep or a writer left lying about is not this
 * stage's to commit and is not counted.
 */
async function readUncommittedMarkdown(runDirectory: RunDirectory): Promise<string[]> {
  const status = await git(runDirectory, runDirectory.cloneDir)(
    ["status", "--porcelain", "--untracked-files=all", "-z"],
    "reading what the run left uncommitted in the clone",
  );
  return status.stdout
    .split("\0")
    .filter((entry) => entry.length > 3)
    .map((entry) => entry.slice(3))
    .filter((path) => path.endsWith(".md"));
}

function describeChangeRequest(changeRequest: ChangeRequestSummary): string {
  return (
    `${changeRequest.url} from ${changeRequest.branch}, ${changeRequest.state}` +
    `${changeRequest.isDraft ? " and a draft" : " and out of draft"}`
  );
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
