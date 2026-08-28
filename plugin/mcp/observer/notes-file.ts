/**
 * Where a **run**'s **dispatch note**s live, and what they look like as a file (run-observation
 * ticket 06; D8, D19 and D20, with ADR-0018 holding the bound).
 *
 * **One file per run, beside the trace, appended as each dispatch lands.** Appended rather than
 * rewritten, because that is the whole of what makes writing early worth anything: a terminal
 * killed halfway through a delivery keeps every note already written, and the one synthesis at the
 * end has one file to read rather than thirteen.
 *
 * **It refuses forwarding in the two places the trace does** — its file name, which is what
 * somebody attaching a file reads, and its own first line, which is what somebody opening it reads.
 * A note carries no bound of its own: it is written from a dispatch's interior, which is where a
 * delivery repository's content is dense rather than incidental, and ADR-0018 says so. The
 * **debrief** is the document to send, and the debrief's mention of these is the third refusal —
 * the same place ticket 03 put the trace's.
 *
 * **A replay writes beside what is already there** (D19), exactly as `./debrief-file.ts` does and
 * under the same ordinals: the first takes the plain name, every one after it carries its number,
 * and nothing already on disk is rewritten, appended to or removed. The live **observer** is the
 * one writer that comes back to a file it started, and it comes back to its own.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Trace, TraceDispatch } from "./trace.ts";
import { observationDirectory } from "./trace-file.ts";

/** Read by a human attaching a file, who reads the name and nothing else. */
export const NOTES_FILE_NAME = "DO-NOT-FORWARD-notes.txt";

/** Read by a human who opened it. First line of the file, before anything else. */
export const NOTES_REFUSAL =
  "DO NOT FORWARD — these are one deliverer run's dispatch notes: what a cheap reading made of " +
  "each dispatch's own interior, as it finished. They are bounded by nothing. A dispatch's " +
  "interior is where your repository's own contents are, so these carry whatever the agents in it " +
  "read and wrote. The document to send is the debrief beside them.";

/**
 * The name an nth set of notes goes under. The first takes the plain one; every one after it
 * carries its ordinal, so a replay writes BESIDE what is already there and rewrites nothing —
 * `debriefNames`'s rule, in the same words.
 *
 * The two ordinals are each file's own and are not promised to match: a run's notes are opened when
 * its first dispatch is noted and its debrief is named when the debrief is written, so a replay
 * that judges a run somebody already replayed for free lands as `debrief-2.md` beside a first set
 * of notes. The debrief names the notes file it rests on by path, which is what a reader needs.
 */
export function notesNames(ordinal: number): string {
  return ordinal <= 1 ? NOTES_FILE_NAME : `DO-NOT-FORWARD-notes-${ordinal}.txt`;
}

/** How many replays of one run may pile up before this refuses to add another notes file. */
const MOST_REPLAYS = 200;

/** The line one note opens with, and the only thing anything ever parses back out of this file. */
const NOTE_MARKER = "== note ";

/**
 * A run's notes file, open for appending.
 *
 * `alreadyNoted` is what keeps an observer that was restarted mid-run from paying for the same
 * dispatch twice. It is empty for a replay by construction: a replay opens a file of its own.
 */
export interface NotesFile {
  readonly path: string;
  readonly ordinal: number;
  /** the keys of the notes this file already holds — `keyOf` below builds one */
  readonly alreadyNoted: ReadonlySet<string>;
  append: (text: string) => Promise<void>;
}

/**
 * How a dispatch is named in this file, and how a note already written is recognised.
 *
 * The tool-use id is the key wherever there is one, because it is what the run's own record, the
 * dispatch's sidecar and the trace all agree on. A dispatch record nothing claims has none, and
 * falls back to its ordinal.
 */
export function keyOf(dispatch: TraceDispatch): string {
  return dispatch.toolUseId ?? `#${dispatch.ordinal}`;
}

/**
 * Open this run's notes file for appending.
 *
 * `beside` is the caller's choice and not a guess, exactly as the debrief writer's two forms are:
 * a **replay** writes beside whatever is there (D19), and the live observer comes back to the one
 * file it has been appending to all run.
 */
export async function openNotes(
  dataDirectory: string,
  trace: Trace,
  how: { readonly beside: boolean },
): Promise<NotesFile> {
  const directory = observationDirectory(dataDirectory, trace);
  await mkdir(directory, { recursive: true });
  const header = `${NOTES_REFUSAL}\n\nOne note per dispatch, in the order the dispatches finished.\n`;

  if (!how.beside) {
    const path = join(directory, notesNames(1));
    const existing = await readIfThere(path);
    if (existing === undefined) await writeFile(path, header, "utf8");
    return appender(path, 1, notedIn(existing ?? ""));
  }

  for (let ordinal = 1; ordinal <= MOST_REPLAYS; ordinal += 1) {
    const path = join(directory, notesNames(ordinal));
    try {
      // `wx` is the whole of how "nothing already there is rewritten" is kept, for the reason
      // `./debrief-file.ts` gives: the write itself refuses an existing file, rather than a check
      // beforehand deciding it is safe to overwrite one.
      await writeFile(path, header, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (isAlreadyThere(error)) continue;
      throw error;
    }
    return appender(path, ordinal, new Set());
  }
  throw new Error(
    `${directory} already holds ${MOST_REPLAYS} sets of notes for this run, and nothing here ` +
      `removes one. Move them aside if another replay is wanted.`,
  );
}

function appender(path: string, ordinal: number, alreadyNoted: Set<string>): NotesFile {
  return {
    path,
    ordinal,
    alreadyNoted,
    // Appended, never staged and renamed: a reader of this file is the synthesis at the end of the
    // run, and a note half-written costs it that dispatch and nothing else — where a debrief caught
    // half-written would be a document a human reads. `./trace-file.ts` explains the other choice.
    append: async (text) => {
      await writeFile(path, text, { encoding: "utf8", flag: "a" });
    },
  };
}

/**
 * One note, as it goes into the file.
 *
 * **Each note names its dispatch the way the trace does** — the ordinal and agent type, the stage
 * description the host's sidecar carries, the tool-use id and the timestamps — so a **defect** the
 * synthesis grounds in a note is locatable by a maintainer holding the file. That is ticket 05's
 * rule for **grounds**, extended to the second place grounds can now come from.
 *
 * What is NOT here is every mechanical figure: how long the dispatch ran, what it spent, how many
 * tools it called and which model served it are the trace's and ticket 03's, and repeating them
 * beside a cheap model's prose would invite it to disagree with them.
 */
export function renderNote(input: {
  readonly dispatch: TraceDispatch;
  readonly readBy: string;
  readonly body: string;
}): string {
  const { dispatch } = input;
  const rows = [
    `${NOTE_MARKER}${keyOf(dispatch)} ==`,
    row("dispatch", `#${dispatch.ordinal} ${dispatch.agentType}`),
    row("stage", dispatch.description === "" ? "none recorded" : `"${dispatch.description}"`),
    row("tool-use id", dispatch.toolUseId ?? "none — no Agent call in the run's record claims it"),
    row("started", dispatch.startedAt ?? "unknown"),
    row("ended", dispatch.endedAt ?? "unknown"),
    row("record", dispatch.recordPath ?? "none — this dispatch left no record beside the run's"),
    row("outcome", outcomeOf(dispatch)),
    row("read by", input.readBy),
    "",
    input.body.trim(),
    "",
  ];
  return `\n${rows.join("\n")}\n`;
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(13)} ${value}`;
}

/**
 * How this dispatch ended, in the code's own words rather than a model's.
 *
 * **`status` is not evidence that a dispatch produced anything** — one delivery on disk holds a
 * dispatch reading `completed` whose whole text is an API-error termination — so the word is
 * printed as the host's claim and the note's prose is what says what actually came back. The three
 * cases before it are ones no status field states at all: a dispatch the human refused (the
 * `toolUseResult` is a bare string, so every mechanical figure is absent), one still in flight when
 * the run was read, and a background dispatch whose completion notification never arrived.
 *
 * **A refused dispatch is not a dispatch that never ran, and this was measured.** Ticket 06's triage
 * read the refusal as "it never ran"; both refused dispatches in the delivery it counted had left
 * substantial records of their own — 128 and 55 entries — because the human said no to a permission
 * prompt the agent had already reached, not to the dispatch itself. So the wording below says when
 * it ended rather than that it never began, and `./notes.ts` reads the interior wherever there is
 * one. A refusal with no record at all is the other case, and it is that file's.
 */
export function outcomeOf(dispatch: TraceDispatch): string {
  if (dispatch.refusedBy !== undefined) {
    return (
      `the human refused this dispatch at the permission prompt (\`${dispatch.refusedBy}\`), so ` +
      `it ended when they said no rather than when it was done`
    );
  }
  if (!dispatch.finished) {
    return (
      `not finished when this was read — ` +
      (dispatch.background
        ? `it was launched in the background and no completion notification for it is in the run's ` +
          `record`
        : `the run stopped, or was still going, before its result landed`)
    );
  }
  return `the host reported \`${dispatch.status ?? "no status"}\`, which is its claim and not a reading`;
}

/** The keys a notes file already holds, so an observer that restarted pays for none of them twice. */
function notedIn(text: string): Set<string> {
  const keys = new Set<string>();
  for (const line of text.split("\n")) {
    if (!line.startsWith(NOTE_MARKER)) continue;
    const key = line.slice(NOTE_MARKER.length).replace(/\s*==\s*$/, "").trim();
    if (key !== "") keys.add(key);
  }
  return keys;
}

/** This run's notes as the synthesis reads them, or `undefined` where none were written. */
export async function readNotes(path: string): Promise<string | undefined> {
  return readIfThere(path);
}

async function readIfThere(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

function isAlreadyThere(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "EEXIST"
  );
}
