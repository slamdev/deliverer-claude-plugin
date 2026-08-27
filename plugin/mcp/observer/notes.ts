/**
 * The **dispatch note**: one **dispatch**'s interior, read on a cheap tier the moment that dispatch
 * finishes (run-observation ticket 06; D8, D9, D11, D19, D27, D28 and D29, with ADR-0018 holding
 * the bound).
 *
 * **This is the only reading of what happened inside a stage there will ever be.** A run's volume
 * is in its per-dispatch records — 5.9 MB of one measured delivery's 6.7 MB, one of them alone
 * 1.5 MB — so under D6's cap the one whole-run synthesis sees a dispatch's shape and never its
 * inside. It sees the notes instead. Five decisions here are load-bearing:
 *
 *  - **A note re-reads its dispatch's own record**, at its own budget, and does not narrow the
 *    trace's already-capped lines. `readSlice` carries why: a note fed the trace's cut recovers
 *    nothing the synthesis could not already see, which is the whole of what D8 asks a note for.
 *
 *  - **The unit is the dispatch and never the numbered stage.** One delivery on disk ran six
 *    `implementer` dispatches inside stage 1 alone, so a note per stage would wait for the last of
 *    them and then have six records to read at once.
 *  - **A note carries no mechanical figure.** How long a dispatch ran, what it spent, how many
 *    tools it called and which model served it are one field of the run's own record — ticket 02's
 *    trace and ticket 03's facts already hold every one of them, and a cheap model restating a
 *    number is a number that can come back wrong. The instruction below says so twice.
 *  - **The note is given no tools at all.** `tools: []` disables every built-in one, so this call
 *    cannot open a file, run a command or reach a network however it is instructed. That matters
 *    more here than anywhere else in the observation: there are up to thirteen of these per run,
 *    they are the cheapest calls it makes, and what they are reading is a dispatch's interior —
 *    which is where the delivery repository's own content actually is.
 *  - **A failed note costs the debrief that dispatch's interior and nothing else.** The synthesis
 *    still runs, on the trace and on whatever notes did come back, and the debrief names the
 *    dispatches it has no note for (D29).
 *
 * **The classification of a success that is really a failure is ticket 05's**, in
 * `./model-call.ts`, reused rather than re-invented for the reason that file gives: the one outcome
 * this epic must not produce is an SDK error reading as a dispatch nothing was wrong with.
 */
import type { NotesSummary, ObservationCost } from "./debrief-file.ts";
import {
  addCosts,
  bound,
  costFromResult,
  errorText,
  failureInText,
  loadQuery,
  NOTHING_MEASURED,
  NOTHING_SPENT,
  servedBy,
  type Query,
  type QueryMessage,
} from "./model-call.ts";
import { readRecordFile } from "./records.ts";
import {
  keyOf,
  openNotes,
  outcomeOf,
  readNotes,
  renderNote,
  type NotesFile,
} from "./notes-file.ts";
import {
  EXCERPT_CAP_MIN,
  LINE_OVERHEAD_CHARS,
  dispatchLines,
  formatDuration,
  type Elision,
  type Trace,
  type TraceDispatch,
  type TraceLine,
} from "./trace.ts";
import { emitDay, renderLine } from "./trace-file.ts";

/* ──────────────────────────────── the model, and its bounds ──────────────────────────────── */

/**
 * The cheap tier a **dispatch note** runs on (D9), and the sibling of `./judge.ts`'s
 * `SYNTHESIS_MODEL`.
 *
 * **An alias, never a pinned id**, for the reason the review's own `code_review_model` option
 * records and the synthesis repeats: an alias resolves against whatever provider the environment
 * authenticates to, where a pinned id only means the same thing on the provider it came from. It
 * carries no `[1m]` suffix and must not gain one — that suffix is measured as refused outright on
 * this alias, and a note has one dispatch to hold rather than a whole run, which is what the cap
 * below is for.
 *
 * **Where it is refused, that note is a named failure and nothing else**: no fallback to another
 * alias, no second call, and no option (D9 keeps depth out of the owner's hands). Where every note
 * fails that way the debrief says so and the synthesis still runs on the trace alone.
 */
export const NOTE_MODEL = "haiku";

/**
 * Reasoning depth, as the SDK's own option rather than as prompt text — the cheap end of the same
 * dial `./judge.ts` sets to `high`. A note reads one slice and reports what it saw; there is
 * nothing here to reason a long way about, and thirteen of these run per delivery.
 */
export const NOTE_EFFORT = "low";

/**
 * How long one note gets before it is stopped and reported as a failure.
 *
 * **Bounded so that a note that wedges ends as a named missing note rather than as spend nobody
 * asked for**, beside a delivery that may run for a day — one on this machine ran 29h36m. Tighter
 * than the synthesis's half hour because it is a much smaller reading and there may be thirteen of
 * them: a whole delivery's notes have to fit inside the moment between a run stopping and its
 * debrief being announced.
 *
 * Nothing about this bound reaches the run. The observer is a detached process outside it, and the
 * only thing a stopped note costs is one dispatch's interior in one debrief.
 */
const NOTE_DEADLINE_MS = bound("DELIVERER_OBSERVER_NOTE_MS", 5 * 60_000);

/**
 * How many turns a note may take. It is given no tools, so one turn is the whole of a healthy
 * note; the allowance above it is for a model that answers, reconsiders and answers again.
 */
const MOST_TURNS = 4;

/* ─────────────────────────────── the slice, and its own cap ─────────────────────────────── */

/**
 * How large the slice handed to one note may get.
 *
 * **Its own cap, because the trace's is not enough.** D6's cap is a share of the whole trace's
 * budget spread over every entry of the run, so a SMALL run gives each entry a wide one — and a
 * single dispatch record on disk reaches 1.5 MB across 640 entries. At the trace's widest cap that
 * one slice would come to roughly half a million characters, past this tier's window twice over,
 * and the note would fail on every large stage with the SDK's own `Prompt is too long`.
 *
 * 240,000 characters is roughly 100,000 tokens at the 2.4 bytes to the token ticket 02 measured
 * this content at — comfortably inside a cheap tier's window with the instruction, the dispatch's
 * own header and its **report** beside it. The arithmetic is D6's, applied to one dispatch's lines
 * rather than to the run's entries, and its floor is the same honest failure: a dispatch with tens
 * of thousands of entries gets a slice that grows past the budget rather than one with entries
 * dropped out of it.
 *
 * **The cap binds because the note reads the dispatch's OWN record and not the trace's cut of it**,
 * which took ticket 06 two paid verifications to establish. The first narrowed lines the trace had
 * already cut, and `recap` can only take more off — so on the thirteen-dispatch delivery every line
 * reached the note at the trace's 131 characters while this cap allowed between 257 and 800, and the
 * largest note read 119,607 characters of a 1.5 MB record against a budget of 240,000. A note fed
 * the trace's cut sees exactly as little of a dispatch's interior as the whole-run reading does,
 * which defeats the whole of D8: across the two runs judged that way not one **defect** was grounded
 * in a note in a way the capped trace could not have grounded, and that was ticket 06's criterion 96
 * — the last one it had open. `readSlice` below re-reads the record at this budget instead.
 */
export const NOTE_BUDGET_CHARS = 240_000;

/**
 * The **report**'s own share of that budget, taken off the top.
 *
 * **A report is one thing and the record is thousands, so they cannot share one cap.** The trace's
 * cap is a share of the whole run's budget spread over every entry, and on the thirteen-dispatch
 * delivery this was measured against that came to 131 characters — so the report a note was asked
 * to weigh arrived as its own first sentence. Three notes of that run then said a report had left
 * out findings that were in it, past the cut. The report now arrives whole up to this figure, which
 * is roughly 10,000 tokens and wider than any report either of the measured runs produced; what is
 * left is the lines' budget, so the whole prompt stays bounded and the floor the arithmetic below
 * rests on is unmoved (run-observation ticket 06).
 */
export const NOTE_REPORT_CHARS = 24_000;

/**
 * What one line of a slice may carry: the lines' whole budget, shared out over them.
 *
 * **Wider than the trace's own per-entry cap, deliberately.** While a note narrowed the trace's
 * lines this was held under `EXCERPT_CAP_MAX` because going past it could not recover anything — the
 * trace's cut had already run, and no cap applied afterwards puts a character back. `readSlice` now
 * re-reads the record, so the ceiling is this budget and nothing else: a dispatch of a few dozen
 * entries gets thousands of characters an entry where the trace gave it 131, which is the whole of
 * what a note is for.
 *
 * The floor is D6's own honest failure, kept: a dispatch with tens of thousands of entries gets a
 * slice that grows past the budget rather than one with entries silently dropped out of it.
 */
export function noteCapFor(lineCount: number): number {
  const budget = NOTE_BUDGET_CHARS - NOTE_REPORT_CHARS;
  if (lineCount <= 0) return budget;
  const share = Math.floor(budget / lineCount) - LINE_OVERHEAD_CHARS;
  return Math.max(EXCERPT_CAP_MIN, share);
}

/**
 * The cap the re-read runs at, which is none: an entry arrives whole and this cap takes nothing off
 * it, so `noteCapFor` below can be worked out from the real line count and applied ONCE. Two passes
 * are needed because the number of lines is not the number of entries — one assistant entry carrying
 * a text block and two tool calls is three lines — and the budget is shared over lines.
 */
const UNCAPPED = Number.POSITIVE_INFINITY;

/** An excerpt some earlier cap already elided, and what this cap took off it. */
const ALREADY_ELIDED = /…\(\+(\d+)\)$/;

/**
 * One excerpt narrowed to a note's own cap.
 *
 * An elision marker already on the excerpt is unwound and re-stated rather than stacked, so a reader
 * sees ONE count and it is the number of characters missing from the original entry — two markers on
 * one line would be a figure about this file rather than about the run. Nothing the re-read produces
 * carries one; the fallback path below hands over lines the trace cut, and those do.
 */
function recap(excerpt: string, cap: number, elision: Elision): string {
  const already = ALREADY_ELIDED.exec(excerpt);
  const body = already === null ? excerpt : excerpt.slice(0, excerpt.length - already[0].length);
  if (body.length <= cap) return excerpt;
  const dropped = body.length - cap;
  elision.chars += dropped;
  return `${body.slice(0, cap)}…(+${dropped + Number(already?.[1] ?? 0)})`;
}

export interface NoteSlice {
  readonly text: string;
  readonly cap: number;
  readonly elidedChars: number;
  /**
   * Whether this is the dispatch's own record read at the cap above, or the trace's already-cut
   * lines standing in for it. The prompt says which, because a note told it holds a dispatch's
   * interior at length when it holds the trace's 131-character cut of it is a note that has been
   * told something untrue about what it is reading — the mistake ticket 06's verification caught
   * twice already.
   */
  readonly reread: boolean;
}

/**
 * One dispatch's slice as the note reads it: **that dispatch's own record, at the note's budget.**
 *
 * **Why this re-reads the record rather than narrowing the trace (D8, and ticket 06's criterion
 * 96).** Criterion 13 says a note is written "from that dispatch's slice of the trace", and taken
 * literally that is what this did: it narrowed `dispatch.lines`, every one of them already cut to
 * D6's per-entry cap — 131 characters on the measured delivery, where a note's own cap allowed 257
 * to 800. So the note saw exactly as little of a dispatch's interior as the whole-run synthesis
 * does, and D8's premise is the opposite: the per-dispatch records are the bulk of a run, the
 * whole-run reading therefore sees a stage's shape and never its inside, and **a note is what
 * recovers the inside**. It cannot recover it from lines that were already cut. The maintainer's
 * call is that D8's intent wins over criterion 13's wording, which now describes what a note is
 * about rather than where its characters come from.
 *
 * **Only the entries the trace itself read.** A record is append-only and a note is written while
 * the run may still be going, so the file can hold entries the trace does not — and the prompt tells
 * the note it is holding "those same entries" at greater width, which has to stay true for a line a
 * note points at to be findable in `DO-NOT-FORWARD-trace.txt`.
 *
 * **Rendered by `./trace-file.ts`'s own line renderer** for that same reason, which is why this has
 * no format of its own: a line a note points at is the line a maintainer finds in the trace, and
 * that is what makes a **defect** the synthesis grounds in a note locatable (D11).
 *
 * A record that cannot be re-read costs the note its width and nothing else: the trace's own lines
 * stand in, the note is still written, and the prompt is told which of the two it holds.
 *
 * **What the re-read measured, and what it did not buy.** On the same two runs: the widest slice went
 * from 119,607 characters to 163,240 of a 1.5 MB record, a four-dispatch refinement's notes from
 * 26,539–85,377 characters to 52,705–96,404, and the notes' own spend from $0.19 and $0.96 to $0.39
 * and $1.30 — about ten cents a dispatch on both. Nothing reached the budget: the
 * per-line share binds first, at 257 characters on the 640-entry dispatch and thousands on a small
 * one, so no note failed and none failed for a prompt too long. The notes themselves changed in kind
 * — one read a 49-minute polling dispatch's interior and found that its brief carried no termination
 * condition at all, which 131 characters an entry could never have shown. **And criterion 96 still
 * did not close.** Across the fourteen defects those two debriefs name, two cite a note and both cite
 * it to corroborate: every one of the fourteen is anchored in the trace's own timestamps and in a
 * line of the installed plugin. The trace holds EVERY dispatch entry, short-quotable even at 131
 * characters, and `./judge.ts` tells the synthesis that the strongest defect quotes both sides of a
 * mismatch — the run's conduct and the plugin line it diverged from — which a note, holding no plugin
 * line, cannot do. So the width was necessary and is not sufficient: what D8 is still short of is a
 * reason for the synthesis to rest a defect on a note, not more characters in one.
 */
export async function readSlice(dispatch: TraceDispatch): Promise<NoteSlice> {
  const read = await noteLines(dispatch);
  const cap = noteCapFor(read.lines.length);
  const elision: Elision = { chars: 0 };
  const out: string[] = [];
  let day = "";
  for (const line of read.lines) {
    day = emitDay(out, line, day);
    const narrowed: TraceLine = { ...line, excerpt: recap(line.excerpt, cap, elision) };
    out.push(renderLine(narrowed, ""));
  }
  return { text: out.join("\n"), cap, elidedChars: elision.chars, reread: read.reread };
}

async function noteLines(
  dispatch: TraceDispatch,
): Promise<{ readonly lines: readonly TraceLine[]; readonly reread: boolean }> {
  if (dispatch.recordPath === undefined) return { lines: dispatch.lines, reread: false };
  // Never throws: `readRecordFile` reports a file it could not open as `unreadable` and a line that
  // is not JSON as a count, because a record the host is still writing ends in a partial line.
  const file = await readRecordFile(dispatch.recordPath);
  if (file.unreadable !== undefined || file.entries.length === 0) {
    return { lines: dispatch.lines, reread: false };
  }
  const entries = file.entries.slice(0, dispatch.entryCount);
  return { lines: dispatchLines(entries, UNCAPPED, { chars: 0 }).lines, reread: true };
}

/* ───────────────────────────────── the shape of the answer ───────────────────────────────── */

/**
 * The marker a note opens with.
 *
 * The same device `./judge.ts` uses and for the same reason: a marker that cannot occur inside the
 * prose is what makes reading the answer a split rather than a parse, and a cheap tier is the
 * likeliest of the observation's calls to write a sentence of preamble before its answer.
 */
export const NOTE_MARKER = "== NOTE ==";

export type NoteAnswer =
  | { readonly kind: "read"; readonly body: string }
  /** the answer did not arrive in the instructed shape, which is a failed note */
  | { readonly kind: "malformed"; readonly why: string };

/**
 * The note, or a refusal.
 *
 * **A note that does not come back in the instructed shape is a failed note**, exactly as a
 * malformed synthesis is a failed synthesis: the shape is held by instruction alone, so an answer
 * that ignores it is an answer nothing can tell apart from a reading of the wrong thing.
 */
export function readNote(text: string): NoteAnswer {
  const at = text.indexOf(NOTE_MARKER);
  if (at === -1) {
    return {
      kind: "malformed",
      why:
        `the answer carries no \`${NOTE_MARKER}\` line, so it did not come back in the instructed ` +
        `shape and nothing here can tell a reading of this dispatch from an answer about ` +
        `something else`,
    };
  }
  const body = text.slice(at + NOTE_MARKER.length).trim();
  if (body === "") {
    return {
      kind: "malformed",
      why: `the answer carries \`${NOTE_MARKER}\` and nothing after it, so there is no note in it`,
    };
  }
  return { kind: "read", body };
}

/* ────────────────────────────────────── the instruction ────────────────────────────────────── */

/**
 * What one note is told, and — with the synthesis's own instruction — the whole of what holds
 * ADR-0018's bound.
 *
 * **There is no mechanical redaction and no second reader, and this is the half that sees the
 * most.** The synthesis reads the trace, where a repository's content arrives as capped excerpts;
 * a note reads a dispatch's interior, where an `implementer` met that repository's diffs, file
 * contents and command output first-hand. The ADR records that the bound now rests on fourteen
 * calls rather than one, that the cheapest of them see the most, and that this is accepted on the
 * same ground as the rest: a mechanical bound costs a **defect** the grounds it stands on.
 *
 * So this text separates the two things a dispatch's record puts side by side — the plugin's own
 * machinery, which is what a note is for, and the repository's content, which is what the agent was
 * working on.
 *
 * **The bright line below was measured into this prompt and is not a preference.** A first wording
 * separated the two by category, the way `./judge.ts`'s does, and a cheap tier reading a
 * `spec-writer`'s 85,000-character slice came back naming the repository's linter, its package
 * versions, one of its environment variables, a regular expression out of a lint rule, and — worst —
 * a sentence of the human's own decision relayed into that dispatch's brief. A category list is a
 * list to find gaps in, and a haiku-class model finds them. "Quote nothing, name nothing, and if you
 * are reaching for backticks the thing you are reaching for is out of bounds" is one rule instead,
 * and it costs a note nothing it needed: the form the plugin already uses — pointing at a thing by
 * its place in the run — grounds an observation just as well.
 *
 * That first wording also told the note the human's words were "not in front of you here", which is
 * false: an orchestrator relays a **question round**'s answers into the brief it writes for the next
 * dispatch, so a spec-writer's record carries them verbatim. A prompt that tells a model something
 * untrue about what it is holding is a prompt that has excused the very thing it forbids.
 *
 * **A second untruth of the same kind was caught by ticket 06's paid verification, in the paragraph
 * saying why the note exists.** It told the note the reading at the end "gets one line per dispatch",
 * and `../observer/trace-file.ts` gives it every entry of every dispatch, each cut to the trace's own
 * excerpt cap — 131 characters on the delivery measured here. What the note actually has that the
 * final reading has not is those same entries at length and the report whole, so that is what the
 * paragraph now says. The overstatement mattered: a note told it is the only thing that can see in
 * here at all will report the shape of a dispatch back, which the trace already carried.
 */
function notePrompt(input: {
  readonly dispatch: TraceDispatch;
  readonly skill: string;
  readonly slice: NoteSlice;
}): string {
  const { dispatch, slice } = input;
  // The report whole, up to its own share of the budget — never the trace's 131-character cut of
  // it, which is what a note was weighing before this ticket's paid verification found it out.
  const reportElision: Elision = { chars: 0 };
  const report = recap(dispatch.reportInFull, NOTE_REPORT_CHARS, reportElision);
  return `You are reading the inside of ONE dispatch of one finished run of the **deliverer** plugin — a
Claude Code plugin that carries one feature from a rough idea to a change request a human can merge.
A dispatch is one agent the run sent off to do one stage's work. You took no part in the run, and you
are reading the record the host kept of what happened inside this one.

You are writing one short **dispatch note** about it. Up to twelve more like it are written for this
run, one per dispatch. All of them, and the whole run's trace, are then read together by the one
reading that writes this run's **debrief** — the document the human who started the run forwards,
**without reading it**, to whoever maintains the plugin. Your note is an input to that, and nothing
between you and it redacts anything.

# Why this note exists

That final reading is handed this dispatch's own entries as well — and no more than the first
hundred-odd characters of each, because the records a run's dispatches leave are several times the
size of the run's own and every entry of all of them has to fit one reading. It can see the SHAPE of
what happened in here. It cannot weigh a single thing in it. ${
    slice.reread
      ? `You are holding those same entries at ${slice.cap} characters — this dispatch's own record, ` +
        `read again for you at a budget nothing else in the observation gets — and its report whole. ` +
        `So **yours is the only reading of this dispatch's interior that will ever read it at ` +
        `length**`
      : `This dispatch's own record could not be read again for you, so you are holding those same ` +
        `entries cut the same way, to ${slice.cap} characters, and only its report whole. Weigh what ` +
        `you can actually see and say so where an entry stops short`
  }
— which is why a note that hands back the shape gives the debrief nothing it did not already have.

# Never restate a figure

How long this dispatch ran, what it spent, how many tools it called, which model served it and what
the host says became of it are **mechanical, already counted by code, and already in the debrief**.
They are not yours. A number you get slightly wrong here is worse than one you leave out, because
nothing downstream can tell the two apart.

**In words and in round figures too.** "For roughly fifty minutes", "for the full hour of its run",
"most of its running time" are the same restatement as the number would be, and the start and end
times above are there so a maintainer can find this dispatch — the span between them is not yours
either. Say **what** it spent its time on and let the debrief say how long that was.

Count something yourself only when the counting IS the observation — "it read the same file in four
separate turns", "it wrote the same section three times" — and then say plainly that you counted it
in what you were given.

# What to write

Five things, and only what this dispatch actually shows of them. Most notes have two or three; a
dispatch that simply did its work well gets a short note saying so, and that is a real answer.

- **What it did in there**, as an arc rather than a list. Where it started, what it decided to do,
  what it actually worked on, how it ended.
- **Where it went round in circles.** The same file opened again and again, a command retried with
  no change between the tries, a decision made and unmade, a search that kept missing.
- **What it had to go and find because its brief did not carry it.** A dispatch arrives with a brief
  the orchestrator wrote. Work spent discovering something the brief could have stated is the
  clearest defect this plugin has, and it is visible only from in here.
- **What it held and lost.** Something it established early and then contradicted, forgot, or went
  back and worked out a second time.
- **What it reported against what it actually did.** Its **report** is below and it is the only thing
  a dispatch returns. Over-claiming, under-claiming, or a report that omits the part that mattered
  is worth saying — and \`status\` is not evidence of anything: one dispatch on this machine reads
  \`completed\` while its whole text is an API-error termination. Read what came back, never the
  status field.

**If nothing came back**, say what the record shows instead — a cut-off, a refusal, an error the
agent met and could not get past — and what it had got to first.

# What stays out, and this is the part that matters most

Everything below this dispatch's own conduct belongs to somebody else. The record you are holding is
one agent's working session inside a private repository, and almost all of it — the code, the
commands, the documents, the tools, the human's own words relayed into the brief — is that person's
and not the plugin's. Your note travels onward. Their work does not.

**Quote nothing. Name nothing. Not one word of it.**

That is a bright line and it is meant to be one, because a list of categories is a list to find gaps
in. Concretely, none of these belongs in your note, in any form, however much clearer it would make
the point:

- a line of code, a diff, a file name, a directory or a path
- the text of a **spec**, a **ticket**, a brief, a commit message, a comment or anything from a forge
- a command, a flag, an option, an environment variable, a configuration key, a regular expression,
  an identifier, a version number or an error string
- **the name of any tool, package, library, service, product or company the repository uses** —
  including ones you recognise, and including the forge, the cloud and the language
- a branch name, a URL, a host name or an id
- anything a human said, and anything the run said to a human. The human's answers reach some
  dispatches inside the brief they were given: those are their product decisions verbatim, and they
  are the single worst thing this note could carry.

**A rule of thumb that catches almost all of it:** if you are reaching for backticks or quotation
marks, what you are reaching for is out of bounds. A note is your own prose from beginning to end.

**Point at things by their place in the run instead**, which is always both precise and sendable: "a
file the agent had already written", "the ticket it was given", "the first of the three commands it
tried", "a document the earlier stage produced", "the linter the project runs", "a package version it
had to go and establish". That form grounds the observation exactly as well as a quotation would, and
the reader can find the moment in the record either way.

**The trap:** the obvious way to make any of this clearer is to paste in what you are looking at, and
what you are looking at is somebody's proprietary work. A note made clearer that way is not clearer.
It is unsendable, and the human who was told the debrief is safe to forward will not be told
otherwise.

# Answer in exactly this shape

One line carrying the marker, then the note. Nothing before the marker. Plain prose in short
paragraphs — no headings, no bullet list of figures, and under 400 words. Wrap at 120 columns.

${NOTE_MARKER}

The note.

# The dispatch you are reading

- run: \`${input.skill}\`
- dispatch: #${dispatch.ordinal} \`${dispatch.agentType}\`${dispatch.description === "" ? "" : `, the stage the host names "${dispatch.description}"`}
- ran: ${dispatch.startedAt ?? "unknown"} to ${dispatch.endedAt ?? "unknown"}
- outcome: ${outcomeOf(dispatch)}
- entries in its record: ${dispatch.entryCount}

## What it reported back

${
  dispatch.reportInFull === ""
    ? "Nothing: no report of this dispatch is in the run's record."
    : `${
        reportElision.chars === 0
          ? "This is the whole of it, as it came back."
          : `Its first ${NOTE_REPORT_CHARS} characters; \`…(+${reportElision.chars})\` marks the ` +
            `rest, which you are NOT holding. What is past that mark may say anything, so a report ` +
            `cut off there has omitted nothing as far as you can tell — say what it does carry ` +
            `and leave what it does not alone.`
      }

${report}`
}

## Its record, in order

Every entry this dispatch left, in order, in the trace's own format — \`[time] kind label detail |
what it carried\`. What each entry carried is capped at ${slice.cap} characters${slice.elidedChars === 0 ? "" : `, and ${slice.elidedChars} characters were elided by that cap`}; \`…(+N)\` marks
what is missing. Nothing is left out by kind.

${slice.text}
`;
}

/* ────────────────────────────────────── one note ────────────────────────────────────── */

export type NoteOutcome =
  | {
      readonly kind: "written";
      readonly body: string;
      /** what the note was read by, for the file's own header */
      readonly readBy: string;
      readonly cost: ObservationCost;
    }
  | { readonly kind: "failed"; readonly why: string; readonly cost: ObservationCost };

export interface NoteInput {
  readonly dispatch: TraceDispatch;
  readonly skill: string;
  readonly dataDirectory: string;
}

/**
 * One dispatch, read once.
 *
 * **It never throws.** Every path out is a `NoteOutcome`, because a note that fell over costs the
 * debrief that dispatch's interior and must never cost the debrief itself (D29).
 */
export async function noteFor(input: NoteInput): Promise<NoteOutcome> {
  const { dispatch } = input;

  // A dispatch with no interior at all — a record that was never written, or one nothing could be
  // read out of. There is nothing for a model to read, so none is called: paying a cheap tier to
  // restate a fact the code already holds is exactly what this ticket's own criterion forbids.
  // The note is still written, because the absence is a fact about the run.
  if (dispatch.entryCount === 0) {
    return {
      kind: "written",
      readBy: "code alone — no model was called, and none was needed",
      cost: NOTHING_SPENT,
      body:
        dispatch.refusedBy === undefined
          ? `This dispatch left no readable record beside the run's own, so it has no interior to ` +
            `read and nothing was read. What the run's own record says became of it is above; ` +
            `everything a reading of the inside would have added is missing from this debrief for ` +
            `this dispatch alone.`
          : // A refusal that stopped the dispatch before it started is the one absence that costs
            // the debrief nothing: there is no interior because there was no work, and saying
            // "missing" of it would read as a diagnostic that degraded. The **orchestrator** asking
            // for something the human would not allow is the whole of what is worth reporting here.
            `The human refused this dispatch at the permission prompt and it never ran: it left no ` +
            `record of its own, so there is no interior and nothing is missing from this debrief. ` +
            `What is worth reporting is the refusal itself — the orchestrator asked for something ` +
            `the human would not allow.`,
    };
  }

  const loaded = await loadQuery();
  if (loaded.kind === "missing") {
    return { kind: "failed", why: loaded.why, cost: NOTHING_SPENT };
  }
  return call(loaded.query, input);
}

async function call(query: Query, input: NoteInput): Promise<NoteOutcome> {
  const slice = await readSlice(input.dispatch);
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort("deadline"), NOTE_DEADLINE_MS);
  let assistantTurns = 0;
  let result: QueryMessage | undefined;
  try {
    for await (const message of query({
      prompt: notePrompt({ dispatch: input.dispatch, skill: input.skill, slice }),
      options: {
        model: NOTE_MODEL,
        effort: NOTE_EFFORT,
        // D3's standing: the plugin's own data directory, which is outside every repository by
        // construction. The synthesis stands in the installed plugin tree because it quotes the
        // plugin's own lines; a note quotes nothing and reads nothing, so it stands where it can do
        // the least.
        cwd: input.dataDirectory,
        // **No tools at all.** Everything this call needs is in the prompt, and a note that cannot
        // open a file cannot be talked into opening one in the repository the run delivered into.
        // It is the one part of the bound here that is mechanical rather than instructed.
        tools: [],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        // The whole of what keeps the delivery repository's own conventions out of the note. The
        // SDK loads every settings source when told nothing, and it is the PROJECT source that
        // carries a `CLAUDE.md` — so a repository's instructions and hooks would walk into the
        // observation through a door ADR-0018 never looked at. There are up to thirteen of these
        // per run against the synthesis's one, so this is the likelier door of the two. The user's
        // own settings stay, because an owner whose credentials live there still has to
        // authenticate.
        settingSources: ["user"],
        maxTurns: MOST_TURNS,
        abortController: controller,
      },
    })) {
      if (message.type === "assistant") assistantTurns += 1;
      if (message.type === "result") {
        result = message;
        break;
      }
    }
  } catch (error) {
    clearTimeout(deadline);
    return {
      kind: "failed",
      cost: NOTHING_MEASURED,
      why: controller.signal.aborted
        ? `it was still going after ${formatDuration(NOTE_DEADLINE_MS)} and was stopped. Nothing ` +
          `about that bound reached the run itself`
        : `the call failed: ${errorText(error)}`,
    };
  }
  clearTimeout(deadline);

  if (result === undefined) {
    return {
      kind: "failed",
      why: "the call ended without ever reporting a result",
      cost: NOTHING_MEASURED,
    };
  }
  const cost = costFromResult(result, assistantTurns);
  if (result.subtype !== "success") {
    const errors = Array.isArray(result.errors) ? result.errors.map(String).join("; ") : "";
    return {
      kind: "failed",
      cost,
      why:
        `the call ended as ${String(result.subtype)}${errors === "" ? "" : `: ${errors}`}. A model ` +
        `the provider behind this machine's credentials refuses is reported here and nowhere ` +
        `else: there is no second call on another alias and no option to change it, so that every ` +
        `debrief a team produces was read at the same depth`,
    };
  }
  // A non-string result narrows to the empty string, which the classification reads as ticket 05
  // reads it: a call reported successful whose whole deliverable is absent is a failed call.
  const text = typeof result.result === "string" ? result.result : "";
  const carried = failureInText(
    text,
    "this note",
    `A note is handed one dispatch's own record, capped at ${NOTE_BUDGET_CHARS} characters by ` +
      `\`NOTE_BUDGET_CHARS\` — so a prompt too long here means that cap failed to bound this ` +
      `slice, and it is the cap that is wrong rather than the run.`,
  );
  if (carried !== undefined) {
    return { kind: "failed", why: `${carried.code}: ${carried.detail}`, cost };
  }

  const answer = readNote(text);
  if (answer.kind === "malformed") {
    return {
      kind: "failed",
      cost,
      why:
        `it answered, but ${answer.why}. A note's answer is held to a shape by instruction alone, ` +
        `so an answer that ignores it is reported as a failure rather than shown`,
    };
  }
  const served = servedBy(result);
  return {
    kind: "written",
    body: answer.body,
    readBy: `\`${NOTE_MODEL}\`${served === undefined ? "" : ` (served by ${served})`} at ${NOTE_EFFORT} effort, over ${slice.text.length} characters of this dispatch's record`,
    cost,
  };
}

/* ─────────────────────────── every note this run's debrief rests on ─────────────────────────── */

/**
 * The notes half of the observation: writes what is missing, and reports what it has.
 *
 * **Held across the rewrites of one run**, because the live **observer** rewrites a debrief as each
 * stage lands and asks its judge every time: without this each rewrite would re-read and re-pay for
 * every dispatch it had already noted. The notes file it appends to is opened once, on the first
 * ask, and a file left behind by an observer that was restarted is read for what it already holds
 * rather than written over.
 */
export interface RunNotes {
  /** notes every dispatch that has finished, or — when finalising — every dispatch at all */
  readonly catchUp: (input: {
    readonly trace: Trace;
    readonly dispatches: readonly TraceDispatch[];
    readonly finalising: boolean;
  }) => Promise<void>;
  /** every note written for this run, as the synthesis reads them */
  readonly text: () => Promise<string | undefined>;
  readonly cost: () => ObservationCost;
  readonly summary: () => NotesSummary;
  /**
   * A loss of this half that its own caller met rather than this file — `./judge.ts`'s catch around
   * `catchUp`, which exists because nothing above it can name a dispatch.
   *
   * It is here so that such a failure lands where every other missing note does, in the summary the
   * debrief prints: a diagnostic that degraded must not read as a run with nothing wrong with it
   * (D29).
   */
  readonly lost: (reason: string) => void;
}

export function runNotes(dataDirectory: string, how: { readonly beside: boolean }): RunNotes {
  let file: NotesFile | undefined;
  let cost: ObservationCost = NOTHING_SPENT;
  let written = 0;
  let attempted = 0;
  const noted = new Set<string>();
  const missing: string[] = [];

  return {
    catchUp: async ({ trace, dispatches, finalising }) => {
      // A dispatch is noted the moment it FINISHES — its tool result for a foreground one, its
      // completion notification for a background one. A background dispatch's result lands in
      // milliseconds carrying `async_launched`, so keying this to the result would note a stage
      // that has not run, and note two of them at once where a pair was launched nine seconds
      // apart. At the finalise every remaining dispatch is noted from what its record holds so far:
      // the stage a run died inside is the one most worth reporting.
      const due = dispatches.filter(
        (it) => !noted.has(keyOf(it)) && (it.finished || finalising),
      );
      if (due.length === 0) return;

      if (file === undefined) {
        try {
          file = await openNotes(dataDirectory, trace, how);
        } catch (error) {
          // Nowhere to write notes is the whole notes half lost, and it must not cost the debrief:
          // the synthesis still runs on the trace alone and the debrief says what is missing (D29).
          for (const dispatch of due) {
            noted.add(keyOf(dispatch));
            attempted += 1;
          }
          missing.push(
            `every dispatch due a note so far — this run's notes file could not be opened: ` +
              `${errorText(error)}`,
          );
          return;
        }
      }
      const open = file;

      for (const dispatch of due) {
        noted.add(keyOf(dispatch));
        attempted += 1;
        if (open.alreadyNoted.has(keyOf(dispatch))) {
          // Left by an earlier observer process watching this same run. Counted as written, because
          // it is in the file the synthesis will read, and never paid for a second time.
          written += 1;
          continue;
        }
        const outcome = await noteFor({
          dispatch,
          skill: trace.skills.join(", ") || "a deliverer run",
          dataDirectory,
        });
        cost = addCosts(cost, outcome.cost);
        const where = `#${dispatch.ordinal} \`${dispatch.agentType}\``;
        if (outcome.kind === "failed") missing.push(`${where} — ${outcome.why}`);
        const landed = await open
          .append(
            renderNote({
              dispatch,
              readBy: outcome.kind === "written" ? outcome.readBy : "nothing — this note failed",
              body:
                outcome.kind === "written"
                  ? outcome.body
                  : `NO NOTE. Nothing read this dispatch's interior: ${outcome.why}. The one ` +
                    `synthesis at the end of this run still ran, on the trace and on the notes ` +
                    `that did come back; what is missing from it is this dispatch's inside.`,
            }),
          )
          .then(() => true)
          // A note that could not be written down is the same loss to the debrief as one that was
          // never read, and it must not take the observation with it: it is named as missing.
          .catch((error: unknown) => {
            missing.push(`${where} — its note could not be written down: ${errorText(error)}`);
            return false;
          });
        // Counted written only once it is IN the file the synthesis reads. A note that came back and
        // then could not be written down would otherwise be counted twice over — once in `written`
        // and once in `missing` — and the header would claim a reading the debrief does not have.
        if (outcome.kind === "written" && landed) written += 1;
      }
    },
    text: async () => (file === undefined ? undefined : readNotes(file.path)),
    cost: () => cost,
    lost: (reason) => missing.push(reason),
    summary: () => ({
      written,
      attempted,
      model: NOTE_MODEL,
      path: file?.path,
      missing,
      spend: cost,
    }),
  };
}
