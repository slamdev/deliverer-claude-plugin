/**
 * The two lines that carry a **debrief** to the human, and the small files the hooks read them out
 * of (run-observation ticket 04; D25, D26 and D29).
 *
 * **This module and `../../hooks/observe-run.sh` are two halves of one contract**, so the layout
 * below is stated once and both sides cite it. Everything sits under the plugin's data directory,
 * beside the observations themselves:
 *
 * ```
 * <data>/observations/.sessions/<session-id>.observer   the marker: an observer exists for this session
 * <data>/observations/.sessions/<session-id>.finalise   the SessionEnd signal: finalise and stop
 * <data>/observations/.sessions/<session-id>.lock       the live observer's pid (`../observe.mjs`)
 * <data>/observations/.sessions/<session-id>.final-reading  where the last finalise left the run
 * <data>/observations/.announce/<session-id>.stop.json    what the Stop hook prints, if anything
 * <data>/observations/.announce/<session-id>.prompt.json  what the next prompt prints, if anything
 * ```
 *
 * **The announcement files hold the hook's whole JSON output, already rendered.** The hook `cat`s
 * one and removes both, and that is the entire hook-side implementation: no `jq`, no escaping of
 * prose into JSON in shell, and one place — this file — where the wording lives. The pair is
 * written and removed together, so a line printed at the stop is not printed again at the next
 * prompt.
 *
 * **`systemMessage` and nothing else** (C3, settled in `../../../docs/specs/run-observation/spec.md`).
 * The host displays that field to the human on every event. `hookSpecificOutput.additionalContext`
 * is not the channel: on `Stop` it is feedback for the MODEL and the conversation continues on it,
 * which would prod a run this feature must never touch. Bare stdout is not the channel either.
 *
 * **A file being present is what "not read yet" means.** Whichever hook prints it removes it, so
 * the human meets each debrief once — at the stop where the observer got there in time, and at the
 * next prompt otherwise, including the next prompt of a session started days later, which is what
 * a debrief finalised after its terminal closed needs (D25).
 */
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { OBSERVATIONS_DIRECTORY, writeFileAtomically } from "./trace-file.ts";
import type { Judging } from "./debrief-file.ts";

/* ─────────────────────────────────────── the layout ─────────────────────────────────────── */

/** Where a session's marker and its finalise signal live. */
export const SESSIONS_DIRECTORY = ".sessions";

/** Where a line waiting to be printed lives. */
export const ANNOUNCE_DIRECTORY = ".announce";

/**
 * What a session id has to look like before it is made into a path.
 *
 * The host's own ids are uuids, so this rejects nothing it will ever meet — it is here because the
 * id arrives from a hook payload and is concatenated into a path on both sides of the contract,
 * and a `..` in one would reach out of the plugin's data directory. The shell half applies the
 * same pattern, and the two must stay the same.
 */
export const SESSION_ID_PATTERN = /^[A-Za-z0-9._-]{1,200}$/;

export function sessionsDirectory(dataDirectory: string): string {
  return join(dataDirectory, OBSERVATIONS_DIRECTORY, SESSIONS_DIRECTORY);
}

export function announceDirectory(dataDirectory: string): string {
  return join(dataDirectory, OBSERVATIONS_DIRECTORY, ANNOUNCE_DIRECTORY);
}

/** The marker saying an observer exists for this session, so no later prompt asks again. */
export function markerPath(dataDirectory: string, sessionId: string): string {
  return join(sessionsDirectory(dataDirectory), `${sessionId}.observer`);
}

/**
 * The `SessionEnd` hook's signal: finalise the debrief and stop. Written by the hook, and removed
 * by whichever side acts on it — the observer that finalises on it, or the hook re-arming an
 * observer in a session that turned out to be resumed (`clearFinaliseSignal`).
 */
export function finaliseSignalPath(dataDirectory: string, sessionId: string): string {
  return join(sessionsDirectory(dataDirectory), `${sessionId}.finalise`);
}

/**
 * Takes the signal away once it has been acted on (PR #18 review). A session that `--resume`
 * brings back keeps its id and its record, so a `SessionEnd` left on disk is the PREVIOUS end of
 * that session by the time anything reads it again, and an observer re-armed in it would finalise
 * the resumed run as ended on its first tick and never be re-armed after.
 */
export async function clearFinaliseSignal(dataDirectory: string, sessionId: string): Promise<void> {
  await rm(finaliseSignalPath(dataDirectory, sessionId), { force: true });
}

export function announcePaths(
  dataDirectory: string,
  sessionId: string,
): { readonly stop: string; readonly prompt: string } {
  const directory = announceDirectory(dataDirectory);
  return {
    stop: join(directory, `${sessionId}.stop.json`),
    prompt: join(directory, `${sessionId}.prompt.json`),
  };
}

/* ─────────────────────────────────────── the wording ─────────────────────────────────────── */

/**
 * How observation is turned off, named in every line (D25's fourth requirement, and D26's switch).
 *
 * The title is the manifest's own, verbatim, because that is the string the human reads in
 * `/plugin` — a line naming an option by a word that is not on the screen is a line that costs a
 * search.
 */
export const SWITCH_OFF_LINE =
  'To stop observing runs: /plugin → deliverer → "Observe runs". It is on by default, and turning ' +
  "it off stops the whole thing — no process, no trace and no debrief.";

/**
 * What a debrief IS, that it is bounded, and that the trace beside it is not the thing to send.
 *
 * Said in both lines rather than in one of them, because they are alternatives: a human meets
 * exactly one of the two for any given debrief.
 */
const WHAT_A_DEBRIEF_IS =
  "A debrief is a short account of what the plugin's own machinery did and what it cost you — its " +
  "skills, its agents, its dispatches, its timings and its spend. It is bounded to the plugin: " +
  "nothing from the repository the run delivered into, and no word of what you and the run said " +
  "to each other. So it is safe to forward without reading it for leaks first, and the bottom of " +
  "the file says where to send it. The trace beside it is NOT — that one is bounded by nothing, " +
  "and its own name says so.";

/**
 * The one clause a line gains where nothing in the debrief was judged for want of a credential
 * (one-environment-file ticket 04; D13).
 *
 * **The human meets this where they already meet the feature.** Without it they open a document whose
 * shape looks complete — a header, every figure, a *Defects* section — and find that the part it
 * exists for is the absence of anybody having looked. The debrief says the whole of it in one place;
 * this says the fact and the option, and leaves the rest to the file.
 *
 * **It names the option and nothing else about it**: no value, no variable name and no path, exactly
 * as the debrief may not carry them — and a line printed into a session is read by the human and
 * seen by the host, which is one more reason than the debrief has.
 */
const NOTHING_WAS_JUDGED =
  "Nothing in it was judged: no credential reached the observation, so a model call it made came " +
  "back not logged in and it stopped there rather than making the same call again. Your run itself " +
  "was not affected — the observation runs outside it — and every figure in the debrief is still " +
  "the run's own. What those model calls authenticate as is the plugin's " +
  "code_review_claude_env_file option, and the debrief says what became of it here.";

export interface DebriefAnnouncement {
  readonly kind: "debrief";
  readonly debriefPath: string;
  /** one line naming the skill, the epic and how the run went */
  readonly headline: string;
  /**
   * Whether nothing in that debrief was judged because no credential reached the observation
   * (ticket 04; D11 and D13).
   *
   * Required rather than optional, and a boolean rather than the clause itself: the two producers are
   * one file — `./observer.ts` — and both of them have the judging in hand, while the WORDING of
   * every line the human meets lives here and in one place.
   */
  readonly noCredential: boolean;
}

export interface FailureAnnouncement {
  readonly kind: "failure";
  /** what stopped a debrief being produced, in the reader's words */
  readonly reason: string;
}

export type Announcement = DebriefAnnouncement | FailureAnnouncement;

/**
 * The clauses that go between the headline and what a debrief is — today exactly one, and only where
 * it applies (ticket 04; D13).
 *
 * Placed after the headline because the headline is what the debrief is ABOUT and this is what it
 * came to; placed before `WHAT_A_DEBRIEF_IS` because that paragraph tells the human it is safe to
 * forward, which is true of an unjudged debrief as well and reads oddly in front of the reason it is
 * thin.
 */
function whatCameOfIt(announcement: DebriefAnnouncement): readonly string[] {
  return announcement.noCredential ? [NOTHING_WAS_JUDGED] : [];
}

/** The line the `Stop` hook prints: the run has stopped and here is what came of watching it. */
export function stopLine(announcement: Announcement): string {
  if (announcement.kind === "failure") return failureLine(announcement);
  return [
    `deliverer watched this run and wrote a debrief of it: ${announcement.debriefPath}`,
    announcement.headline,
    ...whatCameOfIt(announcement),
    WHAT_A_DEBRIEF_IS,
    SWITCH_OFF_LINE,
  ].join("\n\n");
}

/** The line the next prompt prints: a debrief nobody has been shown yet, from any earlier run. */
export function promptLine(announcement: Announcement): string {
  if (announcement.kind === "failure") return failureLine(announcement);
  return [
    `deliverer has a debrief you have not seen yet, from a run it watched: ` +
      `${announcement.debriefPath}`,
    announcement.headline,
    // The same clause, for the same reason both lines already say what a debrief is: a human meets
    // exactly one of the two for any given debrief (ticket 04; D13).
    ...whatCameOfIt(announcement),
    WHAT_A_DEBRIEF_IS,
    SWITCH_OFF_LINE,
  ].join("\n\n");
}

/**
 * D29's other half: failure is never silent, and it is reported where the human already meets this
 * feature — the line that was going to be printed anyway.
 *
 * It says plainly that the run was untouched, because the one thing a human must not conclude from
 * a message about their delivery is that their delivery went wrong.
 */
function failureLine(announcement: FailureAnnouncement): string {
  return [
    `deliverer could not observe your run, so there is no debrief of it: ${announcement.reason}`,
    "Your run itself was not affected in any way — observation runs outside it, in its own " +
      "process, and nothing it does reaches the run. There is nothing here for you to fix, and " +
      "the next run is observed as usual.",
    SWITCH_OFF_LINE,
  ].join("\n\n");
}

/* ──────────────────────────────────── putting it on disk ──────────────────────────────────── */

/**
 * Writes both halves of one announcement, replacing whatever was waiting.
 *
 * Replacing rather than adding: an observer that finalises, sees its run resume and finalises
 * again has one thing to say and not two. The pair is written stop-first so a `Stop` hook firing
 * between the two writes prints the stop wording rather than nothing.
 */
export async function writeAnnouncement(
  dataDirectory: string,
  sessionId: string,
  announcement: Announcement,
): Promise<void> {
  const paths = announcePaths(dataDirectory, sessionId);
  await mkdir(announceDirectory(dataDirectory), { recursive: true });
  await writeFileAtomically(paths.stop, hookOutput(stopLine(announcement)));
  await writeFileAtomically(paths.prompt, hookOutput(promptLine(announcement)));
}

/** Removes whatever was waiting for this session, printed or not. */
export async function clearAnnouncement(
  dataDirectory: string,
  sessionId: string,
): Promise<void> {
  const paths = announcePaths(dataDirectory, sessionId);
  await rm(paths.stop, { force: true });
  await rm(paths.prompt, { force: true });
}

/**
 * The hook's whole stdout, as JSON, with a trailing newline.
 *
 * `JSON.stringify` is what makes the shell half trivial: every quote, newline and backslash in the
 * prose above is escaped here, once, in the language that has an escaper — rather than in a hook
 * that would have to grow one.
 */
export function hookOutput(systemMessage: string): string {
  return `${JSON.stringify({ systemMessage })}\n`;
}

/* ─────────────────────────────────── the session's marker ─────────────────────────────────── */

/**
 * What the observer records about itself, for a human reading the data directory and for the hook.
 *
 * **The shell half reads one thing out of it: whether `state` says the observer finalised**
 * (idp-scaffold-defects ticket 02). Every finalise writes `finalised — <why>`, and the hook re-arms
 * a stopped observer on any of those that left a final reading beside it — `SESSION_ENDED_STATE`
 * included, since `--resume` brings a session back after its end (PR #18 review) — so a further
 * finaliser joins by writing a `finalised — ` state of its own, and nothing in the hook changes.
 * Liveness is not read here: it is the `.lock` beside it, whose pid `../observe.mjs` writes and
 * removes, and which a crashed observer leaves holding a pid nothing answers to.
 */
export interface MarkerState {
  readonly pid: number;
  readonly sessionId: string;
  readonly recordPath: string;
  readonly startedAt: string;
  readonly state: string;
}

/**
 * The finalise the session's own end makes. It is the one that exits at once rather than watching
 * on, and it was once the one state the hook never re-armed on — until `--resume` was found to keep
 * a session's id and record across its end (PR #18 review). It is re-armed now like any other.
 */
export const SESSION_ENDED_STATE = "finalised — the session ended";

/**
 * The prefix of the state an observer leaves when it stopped because a record could not be read
 * and its debrief says so (observer-debrief-defects ticket 06). Not a `finalised — ` state, because
 * nothing was finalised: the hook re-arms on it on its own terms, with no final reading beside it,
 * and the fresh observer replaces the debrief as it would any other that is not final.
 */
export const STOPPED_EARLY_STATE = "stopped early — ";

export async function writeMarker(dataDirectory: string, marker: MarkerState): Promise<void> {
  await mkdir(sessionsDirectory(dataDirectory), { recursive: true });
  await writeFileAtomically(
    markerPath(dataDirectory, marker.sessionId),
    `${JSON.stringify(marker, undefined, 2)}\n`,
  );
}

/* ──────────────────────────── where a finalise left the run ──────────────────────────── */

/**
 * What a finalise leaves for the observer after it (idp-scaffold-defects ticket 02) — every
 * finalise, the session's own end included, because a resumed session is the same session.
 *
 * **The hook rewrites the marker before it re-arms, so this cannot live in the marker.** A fresh
 * observer started on a run that outlived its observer has to do what that one would have done:
 * un-finalise when the run's **extent** has advanced past the reading it was finalised on, and
 * otherwise leave the debrief — and its one synthesis — exactly as it is. That takes the extent the
 * finalise read, which no process holds any more; so it is put on disk at the finalise, and taken
 * away at the un-finalise.
 *
 * **And the answer the finalise's judge held, so a second finalise reuses it as that judge would
 * have.** An observer that never died keeps its one synthesis in memory across an un-finalise and
 * the next finalise (`./judge.ts`, "a second whole-run reading is not a cost a guess may impose");
 * a fresh one has nothing in memory, so without this it would pay for that reading again. The
 * answer is plain data and small — defects and hunches as prose, the cost and extent as figures —
 * so it rides here, minus the one field that is not: `modelEnvironment` carries the process's whole
 * environment, credentials included, and is never written. The judge that restores the answer
 * attaches its own, which names the same environment file unless its owner edited it in between.
 */
export interface FinalReading {
  /** the marker state the finalise wrote, which a fresh observer writes back while it watches */
  readonly state: string;
  /** `RunFacts.extent.endedAt` of the reading the debrief was finalised on, `""` where absent */
  readonly extentEnd: string;
  /** how many of the run's own dispatches that reading counted */
  readonly dispatches: number;
  readonly debriefPath: string;
  /**
   * What the finalise's judge answered, held for the next finalise; absent where nothing judged
   * that reading (an injected judge, or a finalise whose own read failed) — a fresh observer then
   * judges at its finalise, which is the only cost that absence has.
   */
  readonly judging?: Judging;
}

export function finalReadingPath(dataDirectory: string, sessionId: string): string {
  return join(sessionsDirectory(dataDirectory), `${sessionId}.final-reading`);
}

export async function writeFinalReading(
  dataDirectory: string,
  sessionId: string,
  reading: FinalReading,
): Promise<void> {
  await mkdir(sessionsDirectory(dataDirectory), { recursive: true });
  const { judging, ...rest } = reading;
  const held = judging === undefined ? undefined : withoutEnvironment(judging);
  await writeFileAtomically(
    finalReadingPath(dataDirectory, sessionId),
    `${JSON.stringify({ ...rest, judging: held }, undefined, 2)}\n`,
  );
}

/** `undefined` rather than removed, which `JSON.stringify` leaves out of the file all the same. */
function withoutEnvironment(judging: Judging): Judging {
  return { ...judging, modelEnvironment: undefined };
}

/**
 * The reading a finalise left, or `undefined` — absent, unreadable or of another shape all mean the
 * same: there is no finalised debrief this process may treat as already settled, and it watches the
 * run as a first observer would.
 */
export async function readFinalReading(
  dataDirectory: string,
  sessionId: string,
): Promise<FinalReading | undefined> {
  try {
    const parsed: unknown = JSON.parse(
      await readFile(finalReadingPath(dataDirectory, sessionId), "utf8"),
    );
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const it = parsed as Record<string, unknown>;
    if (
      typeof it.state !== "string" ||
      typeof it.extentEnd !== "string" ||
      typeof it.dispatches !== "number" ||
      typeof it.debriefPath !== "string"
    ) {
      return undefined;
    }
    return {
      state: it.state,
      extentEnd: it.extentEnd,
      dispatches: it.dispatches,
      debriefPath: it.debriefPath,
      judging: heldJudging(it.judging),
    };
  } catch {
    return undefined;
  }
}

/**
 * The held answer, where it has the shape a debrief is written from; `undefined` otherwise, which
 * costs a fresh synthesis at the next finalise and nothing else. The file is this module's own
 * output, so this checks what the debrief writer reads unguarded rather than every optional field.
 */
function heldJudging(value: unknown): Judging | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const it = value as Record<string, unknown>;
  const cost = it.cost as Record<string, unknown> | null | undefined;
  if (
    typeof cost !== "object" ||
    cost === null ||
    typeof cost.modelCalls !== "number" ||
    typeof cost.tokens !== "object" ||
    cost.tokens === null
  ) {
    return undefined;
  }
  if (it.kind === "none") return typeof it.reason === "string" ? (value as Judging) : undefined;
  if (it.kind !== "judged") return undefined;
  const readOf = it.readOf as Record<string, unknown> | null | undefined;
  const tree = it.judgedAgainst as Record<string, unknown> | null | undefined;
  return typeof it.defects === "string" &&
    typeof it.hunches === "string" &&
    typeof it.defectCount === "number" &&
    typeof readOf === "object" &&
    readOf !== null &&
    typeof readOf.lastEntry === "number" &&
    typeof readOf.dispatches === "number" &&
    typeof tree === "object" &&
    tree !== null &&
    typeof tree.line === "string"
    ? (value as Judging)
    : undefined;
}

export async function clearFinalReading(dataDirectory: string, sessionId: string): Promise<void> {
  await rm(finalReadingPath(dataDirectory, sessionId), { force: true });
}

/**
 * Removes the marker, so a later prompt in this session may start an observer again.
 *
 * Done in exactly one case: the observer gave up having found no run at all. A session where
 * `/deliverer:refine` was typed and abandoned may still carry a real `/deliverer:build` later, and
 * a marker left behind would leave that one unobserved. It is deliberately NOT done when a run was
 * observed and finalised — the record still carries deliverer attribution, so every later prompt
 * would start an observer that re-observes a finished run and announces it again. What re-observes
 * a run that outlived its observer is the hook reading the marker's state instead (ticket 02).
 */
export async function clearMarker(dataDirectory: string, sessionId: string): Promise<void> {
  await rm(markerPath(dataDirectory, sessionId), { force: true });
}

/** Whether anything is waiting to be printed for any session — for the observer's own reporting. */
export async function pendingAnnouncements(dataDirectory: string): Promise<readonly string[]> {
  try {
    return (await readdir(announceDirectory(dataDirectory)))
      .filter((it) => it.endsWith(".prompt.json"))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Writes an announcement without importing anything that could itself be missing.
 *
 * `../observe.mjs` has its own copy of this two-line shape, because it has to be able to report a
 * published source tree that never arrived — the one failure that happens BEFORE this module can
 * be imported at all. Exported here so the two are visibly the same file format rather than two
 * ideas about one.
 */
export async function writeRawAnnouncement(
  dataDirectory: string,
  sessionId: string,
  systemMessage: string,
): Promise<void> {
  await mkdir(announceDirectory(dataDirectory), { recursive: true });
  const paths = announcePaths(dataDirectory, sessionId);
  const text = hookOutput(systemMessage);
  // Staged and renamed, like every other write here, because a hook reads these files while this
  // process writes them: a half-written file read by `UserPromptSubmit` is not JSON, and what a
  // hook prints on stdout that the host cannot parse is injected into the session as context —
  // the one thing D1 forbids. `../observe.mjs` writes the same pair the same way.
  await writeFileAtomically(paths.stop, text);
  await writeFileAtomically(paths.prompt, text);
}
