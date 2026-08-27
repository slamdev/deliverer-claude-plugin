/**
 * The **dispatch note**: one **dispatch**'s interior, read on a cheap tier the moment that dispatch
 * finishes (run-observation ticket 06; D8, D9, D11, D19, D27, D28 and D29, with ADR-0018 holding
 * the bound).
 *
 * **This is the only reading of what happened inside a stage there will ever be.** A run's volume
 * is in its per-dispatch records — 5.9 MB of one measured delivery's 6.7 MB, one of them alone
 * 1.5 MB — so under D6's cap the one whole-run synthesis sees a dispatch's shape and never its
 * inside. It sees the notes instead. Four decisions here are load-bearing:
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
import {
  keyOf,
  openNotes,
  outcomeOf,
  readNotes,
  renderNote,
  type NotesFile,
} from "./notes-file.ts";
import {
  EXCERPT_CAP_MAX,
  EXCERPT_CAP_MIN,
  LINE_OVERHEAD_CHARS,
  formatDuration,
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
 */
export const NOTE_BUDGET_CHARS = 240_000;

/** What one line of a slice may carry. Never wider than the trace's own cap, which already ran. */
export function noteCapFor(lineCount: number): number {
  if (lineCount <= 0) return EXCERPT_CAP_MAX;
  const share = Math.floor(NOTE_BUDGET_CHARS / lineCount) - LINE_OVERHEAD_CHARS;
  return Math.min(EXCERPT_CAP_MAX, Math.max(EXCERPT_CAP_MIN, share));
}

/** An excerpt the trace already elided once, and what this cap took off it. */
const ALREADY_ELIDED = /…\(\+(\d+)\)$/;

interface Elision {
  chars: number;
}

/**
 * One excerpt narrowed to a note's own cap.
 *
 * The trace's elision marker is unwound and re-stated rather than stacked, so a reader sees ONE
 * count and it is the number of characters missing from the original entry — two markers on one
 * line would be a figure about this file rather than about the run.
 */
function recap(excerpt: string, cap: number, elision: Elision): string {
  const already = ALREADY_ELIDED.exec(excerpt);
  const body = already === null ? excerpt : excerpt.slice(0, excerpt.length - already[0].length);
  if (body.length <= cap) return excerpt;
  const dropped = body.length - cap;
  elision.chars += dropped;
  return `${body.slice(0, cap)}…(+${dropped + Number(already?.[1] ?? 0)})`;
}

/**
 * One dispatch's slice as the note reads it.
 *
 * **Rendered by `./trace-file.ts`'s own line renderer**, so a line a note points at is the line a
 * maintainer finds in `DO-NOT-FORWARD-trace.txt`. That is what makes a **defect** the synthesis
 * grounds in a note locatable (D11), and it is the whole reason this does not have a format of its
 * own.
 */
export function renderSlice(dispatch: TraceDispatch): {
  readonly text: string;
  readonly cap: number;
  readonly elidedChars: number;
} {
  const cap = noteCapFor(dispatch.lines.length);
  const elision: Elision = { chars: 0 };
  const out: string[] = [];
  let day = "";
  for (const line of dispatch.lines) {
    day = emitDay(out, line, day);
    const narrowed: TraceLine = { ...line, excerpt: recap(line.excerpt, cap, elision) };
    out.push(renderLine(narrowed, ""));
  }
  return { text: out.join("\n"), cap, elidedChars: elision.chars };
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
 */
function notePrompt(input: {
  readonly dispatch: TraceDispatch;
  readonly skill: string;
  readonly slice: { readonly text: string; readonly cap: number; readonly elidedChars: number };
}): string {
  const { dispatch, slice } = input;
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

That final reading sees this dispatch's SHAPE and never its inside. The records a run's dispatches
leave are several times the size of the run's own, so no reading of the whole run can hold them: what
it gets is one line per dispatch. **You are the only reading of this dispatch's interior there will
ever be.**

# Never restate a figure

How long this dispatch ran, what it spent, how many tools it called, which model served it and what
the host says became of it are **mechanical, already counted by code, and already in the debrief**.
They are not yours. A number you get slightly wrong here is worse than one you leave out, because
nothing downstream can tell the two apart.

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

${dispatch.report === "" ? "Nothing: no report of this dispatch is in the run's record." : dispatch.report}

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
  const slice = renderSlice(input.dispatch);
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
    }),
  };
}
