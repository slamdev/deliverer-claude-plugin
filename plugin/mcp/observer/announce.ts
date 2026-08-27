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
import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { OBSERVATIONS_DIRECTORY, writeFileAtomically } from "./trace-file.ts";

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

/** The `SessionEnd` hook's signal: finalise the debrief and stop. Written by the hook, never here. */
export function finaliseSignalPath(dataDirectory: string, sessionId: string): string {
  return join(sessionsDirectory(dataDirectory), `${sessionId}.finalise`);
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

export interface DebriefAnnouncement {
  readonly kind: "debrief";
  readonly debriefPath: string;
  /** one line naming the skill, the epic and how the run went */
  readonly headline: string;
}

export interface FailureAnnouncement {
  readonly kind: "failure";
  /** what stopped a debrief being produced, in the reader's words */
  readonly reason: string;
}

export type Announcement = DebriefAnnouncement | FailureAnnouncement;

/** The line the `Stop` hook prints: the run has stopped and here is what came of watching it. */
export function stopLine(announcement: Announcement): string {
  if (announcement.kind === "failure") return failureLine(announcement);
  return [
    `deliverer watched this run and wrote a debrief of it: ${announcement.debriefPath}`,
    announcement.headline,
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
 * What the observer records about itself, for a human reading the data directory and for the
 * liveness check below. Never parsed by the shell half, which tests only whether the file exists.
 */
export interface MarkerState {
  readonly pid: number;
  readonly sessionId: string;
  readonly recordPath: string;
  readonly startedAt: string;
  readonly state: string;
}

export async function writeMarker(dataDirectory: string, marker: MarkerState): Promise<void> {
  await mkdir(sessionsDirectory(dataDirectory), { recursive: true });
  await writeFileAtomically(
    markerPath(dataDirectory, marker.sessionId),
    `${JSON.stringify(marker, undefined, 2)}\n`,
  );
}

/**
 * Removes the marker, so a later prompt in this session may start an observer again.
 *
 * Done in exactly one case: the observer gave up having found no run at all. A session where
 * `/deliverer:refine` was typed and abandoned may still carry a real `/deliverer:build` later, and
 * a marker left behind would leave that one unobserved. It is deliberately NOT done when a run was
 * observed and finalised — the record still carries deliverer attribution, so every later prompt
 * would start an observer that re-observes a finished run and announces it again.
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
