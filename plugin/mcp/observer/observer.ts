/**
 * The **observer**: it watches one live **run** and keeps that run's **debrief** current
 * (run-observation ticket 04; D1, D3, D22, D23, D25 and D29).
 *
 * **It is a detached process outside the run.** `../../hooks/observe-run.sh` starts it on the
 * prompt that begins a run and never waits for it; the **orchestrator** does not dispatch it, is
 * not instrumented for it, keeps no task for it and never learns it exists. Nothing here can slow,
 * block, edit or fail the run: it holds no lock the run wants, writes nothing the run reads, and
 * its exit code is seen by nobody.
 *
 * **What it reads is what the host was already writing down** — the session record and the
 * per-**dispatch** records beside it — through exactly the code a contributor runs by hand
 * (`./debrief.ts`). One composition, so what a user gets and what can be reproduced from a record
 * on disk are the same thing rather than two renderings of one idea.
 *
 * **Three readings, and they are different claims:**
 *
 *  - *A stage landed* — a per-dispatch record appeared — so the debrief is rewritten at once. In
 *    between, a rewrite is throttled: re-reading a delivery's 6.7 MB of records for every entry
 *    would spend a core for the whole run on a file nobody is reading yet.
 *  - *The session ended* — the `SessionEnd` hook left a signal. That finalises the debrief, which
 *    is the flag D23 makes it, and announces it. It is the one certain end there is: the session
 *    is gone, so nothing could resume.
 *  - *The terminal is gone* — nothing has been written anywhere, main record or per-dispatch, for
 *    the idle bound. That finalises it too, and it is the guess of the three: D23 lets silence be
 *    a poor signal here because getting it wrong costs a label and never the content. So it is
 *    reversible — a run that turns out to be alive un-finalises and carries on.
 *
 * **Those two are the whole of it, and what the records SAY about themselves is not a third.**
 * D23 names session end and the idle bound and nothing else. `RunFacts.ending` reads `finished` of
 * any moment where every task is completed and the run's last word is prose, and nothing about a
 * task list forbids a run passing through that shape between two stages — so finalising on it
 * spends the one synthesis (D9) on a run that is still going and then holds that answer for the
 * rest of it. The finalise below carries what that costs, and what it measures.
 *
 * **The stop line is best-effort by construction and the prompt line is the guarantee** (D25). The
 * host writes a run's last entry and then fires its `Stop` hooks immediately, so whether this loop
 * has caught up in between is a race it cannot win reliably — which is exactly why the criterion
 * is "prints nothing at all when there is no debrief to name" rather than "always prints". What is
 * never lost is the debrief itself: the announcement waits in the data directory until some hook
 * prints it, including the first prompt of a session started days later.
 *
 * **Failure is never silent** (D29). Anything that stops a debrief being produced is written into
 * `.announce/`, which is the line the human was going to be shown anyway; anything that merely
 * degrades one is written into the debrief's own "what this observation lost" section. What never
 * happens is an error in the session, an exit code that matters, or something the human must act
 * on.
 */
import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import {
  clearAnnouncement,
  clearMarker,
  finaliseSignalPath,
  writeAnnouncement,
  writeMarker,
  type Announcement,
} from "./announce.ts";
import { NOTHING_JUDGES_YET, refreshDebrief, type Judging } from "./debrief-file.ts";
import { debriefRun, type DebriefOutcome, type JudgingInput } from "./debrief.ts";
import { synthesisJudge } from "./judge.ts";
import { runSkills } from "./run-facts.ts";
import { formatDuration } from "./trace.ts";

/* ────────────────────────────────────── the clocks ────────────────────────────────────── */

/**
 * How often the records' own footprint is looked at. A handful of `stat`s and one directory
 * listing — cheap enough to run for thirty hours, which is what the longest delivery on record
 * would ask of it.
 */
const TICK_MS = bound("DELIVERER_OBSERVER_TICK_MS", 2_000);

/**
 * The floor between two rewrites while a run is merely proceeding.
 *
 * A stage landing jumps this queue, so "rewritten as each stage lands" is literal. What the
 * throttle bounds is the rest: a delivery writes entries continuously, and re-reading its records
 * for each of them would spend a core all run on a file nobody is reading yet.
 */
const REFRESH_THROTTLE_MS = bound("DELIVERER_OBSERVER_REFRESH_MS", 15_000);

/**
 * How long everything has to be silent before the debrief is finalised on the idle bound alone.
 *
 * Generous on purpose, and D23 says why: this is the bound that catches a killed terminal and a
 * `SessionEnd` signal that never landed, and getting it wrong costs a label rather than content. A
 * human thinking about a grilling question for half an hour is what it must not mistake for a dead
 * terminal — and where it does, the run resuming un-finalises it again.
 */
const IDLE_FINALISE_MS = bound("DELIVERER_OBSERVER_IDLE_MS", 30 * 60_000);

/**
 * How long the observer keeps watching after finalising on its own reading rather than on a
 * signal. With `RUN_PATIENCE_MS` below this is the whole of "nothing waits forever": a signalled
 * finalise exits at once, every other one exits this long after, and a record that stops being
 * readable exits on the patience instead.
 */
const AFTER_FINALISE_MS = bound("DELIVERER_OBSERVER_AFTER_FINALISE_MS", 30 * 60_000);

/**
 * How long a record gets to show a run in it at all.
 *
 * The hook starts an observer on the prompt carrying the command, which is BEFORE the run has
 * written a single attributed entry — so "no run here" is the normal first answer and is waited
 * through. A `/deliverer:` command typed and immediately interrupted never produces one, and that
 * is what this bound is for.
 *
 * It bounds the same wait at the other end too: a record that stops being readable once a debrief
 * has been written gets this long to come back, and then the debrief already on disk is announced
 * and the loop stops. Nothing else would ever stop it there — a record that never comes back reaches
 * neither the `SessionEnd` signal nor the idle bound.
 */
const RUN_PATIENCE_MS = bound("DELIVERER_OBSERVER_PATIENCE_MS", 10 * 60_000);

/** How many readings may throw in a row before the observer gives up and says so. */
const MOST_CONSECUTIVE_FAILURES = 5;

/**
 * Every bound above is overridable, and the reason is the same one `e2e-tests` gives for its
 * ceilings: the states this loop has — a killed terminal, an idle bound that fires, a run that
 * resumes after one — are otherwise walkable only by waiting half an hour each. CONTRIBUTING's
 * by-hand procedure sets them.
 */
function bound(name: string, fallback: number): number {
  // Unset and set-but-empty both mean "no override", told apart from a real `0` — the distinction
  // `../launch.mjs` and `../server/config.ts` both draw, and for the same reason: `Number("")` is
  // `0`, which here would switch every bound off at once.
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/* ─────────────────────────────────────── the seams ─────────────────────────────────────── */

export interface JudgeInput extends JudgingInput {
  /** true on the last reading of the run, which is the one synthesis's moment */
  readonly finalising: boolean;
}

/**
 * What the judging half contributes to a debrief, asked once per rewrite.
 *
 * **The seam tickets 05 and 06 land on.** `./judge.ts` holds both halves of it: on every rewrite it
 * catches this run's **dispatch note**s up with the dispatches that have finished, on a cheap tier,
 * and answers that nothing has judged the run yet; on the one rewrite where `finalising` is true it
 * reads the whole **trace** and every note together, once.
 */
export type Judge = (input: JudgeInput) => Promise<Judging>;

export interface ObserveOptions {
  readonly recordPath: string;
  readonly dataDirectory: string;
  readonly sessionId: string;
  /**
   * What judges this run. The default is `./judge.ts`'s synthesis, which is the whole point of
   * observing at all; a caller passes one only to observe with no model in play.
   */
  readonly judge?: Judge;
  /** what was already lost before the loop began — an install that never finished, say */
  readonly startupLosses?: readonly string[];
}

export type ObserveOutcome =
  /** a debrief was written and finalised */
  | { readonly kind: "debriefed"; readonly debriefPath: string }
  /** the record never held a run: the command was typed and abandoned, or never really typed */
  | { readonly kind: "no-run"; readonly reason: string }
  /** nothing could be observed, and the human has been told through the line they were owed */
  | { readonly kind: "failed"; readonly reason: string };

/* ─────────────────────────────────────── the loop ─────────────────────────────────────── */

interface Footprint {
  /** size and modification time of everything this run writes, as one comparable string */
  readonly key: string;
  readonly dispatchRecords: number;
}

/**
 * Watch one run to its end.
 *
 * Returns when the run is over and its debrief is finalised, when the record turns out to hold no
 * run, or when something stopped a debrief being produced. It never throws: every path out is one
 * of those three, because the caller is a detached process whose exceptions nobody would ever see.
 */
export async function observeRun(options: ObserveOptions): Promise<ObserveOutcome> {
  // `beside: false` is the live observer's placement for its **dispatch note**s: it comes back to
  // the one file it has been appending to all run, where a REPLAY of the same run afterwards writes
  // a set of its own beside it (D19). The same split the debrief writer already makes.
  const judge = options.judge ?? synthesisJudge(options.dataDirectory, { beside: false });
  const startedAt = Date.now();

  let footprint: Footprint = { key: "", dispatchRecords: -1 };
  let lastActivityAt = startedAt;
  let lastRefreshAt = 0;
  let wasQuiet = true;

  let written: Extract<DebriefOutcome, { kind: "written" }> | undefined;
  let heldSince: number | undefined;
  /** the first reading that came back unreadable after one had come back written */
  let unreadableSince: number | undefined;
  let finalisedAt: number | undefined;
  let finalisedBySignal = false;
  let extentEnd = "";
  let dispatchesInRun = -1;
  let consecutiveFailures = 0;

  await mark(options, "watching");

  for (;;) {
    const now = Date.now();
    const signalled = await signalArrived(options);
    const seen = await footprintOf(options.recordPath);
    const grew = seen.key !== footprint.key;
    const stageLanded = written !== undefined && seen.dispatchRecords !== footprint.dispatchRecords;
    if (grew) lastActivityAt = now;
    // One tick of silence after a change is what makes a finished run readable within seconds of
    // its last entry rather than at the throttle's cadence. It is the difference between the stop
    // line naming a debrief and the next prompt having to.
    const settling = !grew && !wasQuiet;
    wasQuiet = !grew;
    footprint = seen;

    const idle = now - lastActivityAt >= IDLE_FINALISE_MS;
    const finalising = signalled || idle;
    const throttleExpired = now - lastRefreshAt >= REFRESH_THROTTLE_MS;
    const due =
      // Only while the finalise is still owed, and that is what keeps the throttle applying
      // afterwards. `idle` cannot go back to false on its own — `lastActivityAt` only moves when
      // something is written — so `finalising` stays true for the whole of `AFTER_FINALISE_MS`, and
      // an unqualified term here made every tick of that window due: with the shipped bounds, some
      // 900 further whole readings of an 11 MB record set, each rebuilding the trace and the facts
      // and rewriting both files, on a machine whose terminal has just been killed. A run that
      // turns out to be alive still un-finalises at once: that is `grew`, `stageLanded` and
      // `settling` below, none of which this touches.
      (finalising && finalisedAt === undefined) ||
      stageLanded ||
      settling ||
      (grew && throttleExpired) ||
      (written === undefined && throttleExpired) ||
      // A record that stopped being readable is re-read on the throttle until it comes back or the
      // patience below runs out. Under the throttle rather than every tick, because the patience is
      // ten minutes and nothing else here needs the record to have changed to notice time passing —
      // and re-reading it is what lets a record that recovers by some route the footprint cannot see
      // (a permission put back) be picked up at all.
      (unreadableSince !== undefined && throttleExpired);

    if (due) {
      lastRefreshAt = now;
      let outcome: DebriefOutcome;
      // `finalisedAt` is carried into every later reading, so a debrief that has been finalised does
      // not lose the flag to the next rewrite. Only the un-finalise below takes it away, and it
      // rewrites the file itself when it does. Held in a name rather than recomputed, because the
      // finalise block needs to know whether the reading it is about to announce already has it.
      const readAsFinal = finalising || finalisedAt !== undefined;
      try {
        outcome = await read(options, judge, {
          finalise: readAsFinal,
          // A run that has been found but has not named its epic yet is held off disk — for one
          // reading or for its whole first minute, which is measured: the delivery this was walked
          // against carried attribution for 1m20s before its first task update. Past the patience
          // it is written under the stand-in, because a run that never creates a task has no
          // better answer and a debrief nobody can find is worth less than an ugly directory name.
          force: heldSince !== undefined && now - heldSince >= RUN_PATIENCE_MS,
        });
        consecutiveFailures = 0;
      } catch (error) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= MOST_CONSECUTIVE_FAILURES) {
          const reason =
            `reading this run's records failed ${MOST_CONSECUTIVE_FAILURES} times in a row ` +
            `(${errorText(error)}), so the observer stopped`;
          await announce(options, { kind: "failure", reason });
          return { kind: "failed", reason };
        }
        await sleep(TICK_MS);
        continue;
      }

      if (outcome.kind === "held") {
        // The run IS here — it is its epic that is not named yet. Never a reason to give up, and
        // never counted against the patience below, which is about a record with no run in it.
        heldSince ??= now;
        await sleep(TICK_MS);
        continue;
      }
      if (outcome.kind !== "written") {
        // A record that stopped being readable AFTER a debrief was written gets the same patience,
        // counted from the first reading that failed rather than from the start — a blip, a rotated
        // file, a directory being moved under it — and then this loop stops with the debrief it
        // already has. Waiting indefinitely was the one hole in "nothing waits forever": a record
        // that never comes back — a cleaned `~/.claude/projects`, a per-run configuration directory
        // torn down, a lasting permission error — left a detached process ticking every tick with
        // no exit at all and never announcing the debrief it did write, since neither `SessionEnd`
        // nor the idle bound is reached from here.
        if (written !== undefined) {
          unreadableSince ??= now;
          if (now - unreadableSince < RUN_PATIENCE_MS) {
            await sleep(TICK_MS);
            continue;
          }
          // Announced as the debrief it is, because it is one: on disk, readable, and the last
          // reading of this run there is ever going to be. What it cannot say is that the run
          // finished, and it does not — it keeps whatever flag its last reading gave it.
          await announce(options, {
            kind: "debrief",
            debriefPath: written.written.debriefPath,
            headline: headlineOf(written),
          });
          await mark(options, `stopped watching — ${outcome.reason}`);
          return { kind: "debriefed", debriefPath: written.written.debriefPath };
        }
        // `refused` is a record nothing could read and `no-run` is one that holds no run YET. Both
        // are waited through, because the observer is started on the prompt carrying the command —
        // before the run has written a single entry of its own — and both run out of patience
        // together.
        if (now - startedAt < RUN_PATIENCE_MS) {
          await sleep(TICK_MS);
          continue;
        }
        if (outcome.kind === "refused") {
          await announce(options, { kind: "failure", reason: outcome.reason });
          return { kind: "failed", reason: outcome.reason };
        }
        // Nothing was ever written for this session, so nothing is announced either: a command
        // typed and abandoned is not a failure, and a line about it would be noise. The marker
        // goes, so a real run later in the same session is still observed.
        await clearMarker(options.dataDirectory, options.sessionId);
        return { kind: "no-run", reason: outcome.reason };
      }

      written = outcome;
      heldSince = undefined;
      unreadableSince = undefined;
      /** whether the reading `written` now holds was taken with the finalise flag already set */
      let heldIsFinal = readAsFinal;

      // The run's OWN extent decides whether it resumed, and never the session's: a human typing
      // unrelated work into the same session after their delivery finished is outside the run by
      // `RunFacts`'s own bound, and must not reopen a debrief that is done.
      const extentNow = outcome.facts.extent.endedAt ?? "";
      const advanced = extentNow > extentEnd || outcome.facts.dispatches.length > dispatchesInRun;
      extentEnd = extentNow;
      dispatchesInRun = outcome.facts.dispatches.length;

      if (finalisedAt !== undefined && advanced && !finalisedBySignal) {
        // Reversible by construction (D23): the idle bound is a guess, and a run that turns out to
        // be alive gets its label back rather than a second debrief written beside the first.
        //
        // The run's own extent advancing is the whole test, and what the records say about
        // themselves is deliberately not part of it: a run that reads `finished` and then writes
        // more is a run that is alive, and gating this on `ending.kind` would refuse the label
        // back in exactly the case the reading is worst at. What the answer already read is then
        // said in the debrief rather than re-read — `./judge.ts` keeps it and `./debrief-file.ts`
        // names its extent, because a second whole-run reading is not a cost a guess may impose.
        finalisedAt = undefined;
        // Swallowed like every other side effect in this loop, and for the loop's own reason: this
        // function never throws, and the one path it could throw from is the one that exists because
        // the run turned out to be ALIVE — where `../observe.mjs` would turn the exception into
        // "there is no debrief of your run" about a debrief sitting on disk, and stop observing.
        await clearAnnouncement(options.dataDirectory, options.sessionId).catch(() => undefined);
        await mark(options, "watching — a run that had gone quiet resumed");
        // Rewritten at once rather than at the next throttled reading, because between the two the
        // file on disk would be claiming to be final while the observer already knows it is not.
        const resumed = await read(options, judge, { finalise: false }).catch(() => outcome);
        if (resumed.kind === "written") {
          written = resumed;
          heldIsFinal = false;
        }
      }

      // D23's two finalisers and only those: the session's own end, and the idle bound for the
      // debrief a killed terminal left. `outcome.facts.ending.kind === "finished"` is deliberately
      // not a third, because it is a READING of the run's own words rather than a signal about the
      // run: it is true of any moment where every task is completed and the last word is prose, and
      // nothing about a task list forbids a run passing through that shape between two stages.
      // Finalising there spends the one synthesis (D9) on part of a run and then holds that answer
      // for the rest of it — content, which is exactly what D23 forbids the bound to cost.
      //
      // **The figure this comment used to carry does not reproduce any more, and the reason is
      // `./run-facts.ts`'s extent rather than anything here.** It read one 388-entry refinement's
      // first 290 entries as `finished` at 2h28m and 10 question rounds against the whole run's
      // 2h57m and 11 — but those 29 minutes and that eleventh round were the human's own follow-up
      // work after the refinement had published, and the ceiling the extent now applies cuts them
      // out. Re-measured over all eleven run records on that machine — five refinements and six
      // deliveries — `finished` first reads within twelve entries of the run's own last entry on
      // every one of the ten that reach it at all, and the eleventh never does. So the case against
      // this being a finaliser is what it always was — a reading is not a signal — and no longer a
      // measured gap of three quarters of a run.
      if (finalisedAt === undefined && finalising) {
        // Nothing is announced naming a debrief that still says the run is going — and the reading
        // above almost always already carried the flag, since it is taken with `finalising ||
        // finalisedAt !== undefined` and this branch is inside `finalising`. So this re-reads only
        // where it does not: the un-finalise above rewrote the file WITHOUT the flag and a
        // `SessionEnd` signal landed on the same tick, which is the whole of that case. Re-reading
        // unconditionally paid a second whole pass over the session record and every per-dispatch
        // record — 11 MB across 16 files on the largest delivery measured — plus a second trace, a
        // second set of facts and a second write of both files, on the one tick of the run that is
        // already the most expensive there is, because the synthesis ran inside the reading above.
        if (!heldIsFinal) {
          const final = await read(options, judge, { finalise: true }).catch(() => outcome);
          if (final.kind === "written") written = final;
        }
        finalisedAt = Date.now();
        finalisedBySignal = signalled;
        await announce(options, {
          kind: "debrief",
          debriefPath: written.written.debriefPath,
          headline: headlineOf(written),
        });
        await mark(options, `finalised — ${why(signalled)}`);
      }
    }

    if (finalisedAt !== undefined) {
      // A signalled finalise is the one certain end there is: the session itself is gone, so
      // nothing is left to watch and nothing could resume.
      if (finalisedBySignal || Date.now() - finalisedAt >= AFTER_FINALISE_MS) {
        return written === undefined
          ? { kind: "no-run", reason: "the run was finalised with no debrief written" }
          : { kind: "debriefed", debriefPath: written.written.debriefPath };
      }
    }

    await sleep(TICK_MS);
  }
}

/* ─────────────────────────────────── one reading of the run ─────────────────────────────── */

async function read(
  options: ObserveOptions,
  judge: Judge,
  how: { readonly finalise: boolean; readonly force?: boolean },
): Promise<DebriefOutcome> {
  return debriefRun({
    recordPath: options.recordPath,
    dataDirectory: options.dataDirectory,
    // The live writer: one debrief per run, kept current and staged-and-renamed every time. A
    // replay of this same run afterwards still writes BESIDE it (D19).
    write: refreshDebrief,
    observationLosses: options.startupLosses,
    status: {
      finalised: how.finalise,
      note:
        "It is being written by the observer the plugin started beside the run, which is still " +
        "reading the host's own records for it.",
    },
    // Held back until the run has named its epic. Where an observation lives is keyed by the
    // **slug**, and a run that has not yet created a task carries the stand-in — measured at 1m20s
    // into the delivery this was walked against — so without this gate every early reading would
    // leave a whole observation under `unknown-slug/` that nothing ever comes back to. At the
    // finalise, and once the caller has waited long enough, it is written under whatever the slug
    // is by then: a run that created no task at all has no better answer.
    writeWhen: (trace) => trace.slugRead || how.finalise || how.force === true,
    judging: (input) => judgeQuietly(judge, { ...input, finalising: how.finalise }),
  });
}

/**
 * The judge, with its failures turned into an answer rather than an exception.
 *
 * D29 in one function: judging that fell over degrades the debrief to D17's facts-only shape and
 * says so in the file, and it never costs the debrief itself. `./judge.ts` turns its own failures
 * into that answer already, so what is left for this wrapper is the one it cannot — a judge that
 * throws where none was expected to, which the loop above must never see.
 */
async function judgeQuietly(judge: Judge, input: JudgeInput): Promise<Judging> {
  try {
    return await judge(input);
  } catch (error) {
    return {
      kind: "none",
      reason:
        `The judging half of the observer failed, so this debrief carries its header and its ` +
        `facts alone: ${errorText(error)}`,
      cost: NOTHING_JUDGES_YET.cost,
    };
  }
}

/* ────────────────────────────────── what the human is told ────────────────────────────── */

/** One line naming the run and how it went, printed above the path in both of D25's lines. */
function headlineOf(outcome: Extract<DebriefOutcome, { kind: "written" }>): string {
  const { facts, trace } = outcome;
  return (
    `${runSkills(facts, trace) || "a deliverer run"} · epic ${trace.slug} · ` +
    `${formatDuration(facts.extent.durationMs)} · ${facts.dispatches.length} dispatches · ` +
    `${facts.rounds.length} rounds · ${facts.ending.kind} · ` +
    `${facts.human.questionRounds} question rounds put to you and ` +
    `${formatDuration(facts.human.totalWaitMs)} of the run spent waiting on you.`
  );
}

async function announce(options: ObserveOptions, announcement: Announcement): Promise<void> {
  // Deliberately swallowed: a line that could not be written is not worth taking the observer down
  // for, and there is nowhere else to report it that a human would ever look.
  await writeAnnouncement(options.dataDirectory, options.sessionId, announcement).catch(
    () => undefined,
  );
}

async function mark(options: ObserveOptions, state: string): Promise<void> {
  await writeMarker(options.dataDirectory, {
    pid: process.pid,
    sessionId: options.sessionId,
    recordPath: options.recordPath,
    startedAt: new Date().toISOString(),
    state,
  }).catch(() => undefined);
}

function why(signalled: boolean): string {
  // Two finalisers, so the second needs no test: `finalising` is `signalled || idle`.
  return signalled ? "the session ended" : "nothing was written anywhere for the idle bound";
}

/* ──────────────────────────────── what the records look like ──────────────────────────── */

/**
 * A cheap footprint of everything this run is writing: the main record and every per-dispatch
 * record beside it, by size and modification time.
 *
 * It opens nothing. A delivery's records reach 6.7 MB and this runs every couple of seconds for as
 * long as the run does, so a tick has to cost a handful of `stat`s and never a read.
 */
async function footprintOf(recordPath: string): Promise<Footprint> {
  const sessionId = basename(recordPath).replace(/\.jsonl$/, "");
  const directory = join(dirname(recordPath), sessionId, "subagents");
  let names: readonly string[];
  try {
    names = (await readdir(directory)).filter((it) => it.endsWith(".jsonl")).sort();
  } catch {
    // A run that has dispatched nothing yet has no such directory, which is not a loss.
    names = [];
  }
  const parts = [await footprintOfFile(recordPath)];
  for (const name of names) parts.push(`${name}:${await footprintOfFile(join(directory, name))}`);
  return { key: parts.join(","), dispatchRecords: names.length };
}

async function footprintOfFile(path: string): Promise<string> {
  try {
    const stats = await stat(path);
    return `${stats.size}@${stats.mtimeMs}`;
  } catch {
    return "absent";
  }
}

async function signalArrived(options: ObserveOptions): Promise<boolean> {
  try {
    await stat(finaliseSignalPath(options.dataDirectory, options.sessionId));
    return true;
  } catch {
    return false;
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
