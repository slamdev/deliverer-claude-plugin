/**
 * The **debrief** as a document, and the **identity file** beside it (run-observation ticket 03;
 * D13, D15, D17, D19 and D20, with ADR-0018 holding the bound).
 *
 * **The debrief is the document to send.** It refuses nothing about forwarding — it says the
 * opposite, in its own opening lines and again in its footer — because that is the whole of what
 * makes the feature work: a team member forwards it without reading it for leaks first, and the
 * maintainer gets the signal. What holds that promise is the bound, and the bound is held by
 * instruction alone (ADR-0018): the plugin's own machinery, never the repository being delivered
 * into, and the human's conversation as SHAPE — how many question rounds, how long they were
 * waited on — and never a word of it.
 *
 * Three things it does that are worth saying out loud:
 *
 *  - **It names the trace and refuses forwarding for it in the same breath.** That is the third of
 *    D20's three refusals; the other two are the trace's own filename and its own first line, in
 *    `./trace-file.ts`. A doubting maintainer asks for the trace, so the debrief has to name it —
 *    and a helpful human attaches whatever is named, so it has to say what the trace is.
 *  - **It never mentions the identity file.** Nothing about that file is ever wanted upstream, and
 *    a debrief that named it would invite exactly the attachment D20 exists to prevent.
 *  - **Nothing in it records when it was written.** Replaying one run's records twice produces the
 *    same bytes, which is the seam the rest of this epic is verified at, and a timestamp of its
 *    own would make that unmeetable — the trap ticket 02's trace met. The commit line is read from
 *    the machine where the records carry no commit, so a debrief replayed after a plugin update
 *    legitimately differs there and nowhere else.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NO_TOKENS, type TokenTotals } from "./records.ts";
import { formatDuration, tokenDetail, type Trace, type TraceDispatch } from "./trace.ts";
import { observationDirectory, writeFileAtomically } from "./trace-file.ts";
import { runSkills, type RunFacts, type RunRound } from "./run-facts.ts";
// The option's own KEY, which is the most this document may say about the owner's **environment
// file** (D12): the file's path is never in here, and `ModelEnvironment.path` is read by nothing
// below. `./model-env.ts` imports nothing of this file, so naming it here closes no circle.
import { ENV_FILE_OPTION, type ModelEnvironment } from "./model-env.ts";
// Type-only, so nothing of `./continuity.ts` is loaded at runtime by this file: that module reads
// this one's own naming and its identity parser, and a value import back would close the circle.
import type { ContinuitySummary } from "./continuity.ts";
import type { PluginCommit } from "./plugin-commit.ts";

/* ─────────────────────────────────── where it is sent ─────────────────────────────────── */

/**
 * Where a debrief goes (D15).
 *
 * One fixed string in the observer's own text, and deliberately not read off the host's install
 * bookkeeping: a fork's debriefs are worth having upstream too, and a fork's own marketplace entry
 * would send them to somebody who did not write the machinery being reported on. Naming a
 * destination decides nothing about the plugin's BEHAVIOUR, so ADR-0012 — the plugin names no
 * forge — is untouched: no rule here holds on one forge and not another, and no instruction
 * becomes reachable only where a particular tool is installed.
 */
export const DEBRIEF_DESTINATION = "https://github.com/slamdev/deliverer-claude-plugin/issues";

/* ─────────────────────────────── what judging contributed ─────────────────────────────── */

/**
 * What the observation itself cost. `0` is a measurement and never a stand-in for not knowing:
 * with nothing judging, the observation cost nothing, which is a different claim from unknown and
 * is exactly the fact the header exists to carry.
 */
export interface ObservationCost {
  readonly modelCalls: number;
  readonly tokens: TokenTotals;
  /** dollars where something priced them; `undefined` is unknown, and unknown is never zero */
  readonly costUsd: number | undefined;
}

/**
 * Which installed tree the synthesis read the plugin's own text out of (run-observation ticket 05).
 *
 * Two answers and they are different claims, which is why the debrief prints which one it got. A
 * line quoted from the tree the run itself ran is evidence about that run; the same line quoted
 * from the tree installed now is evidence about this machine, and where the file has changed since
 * it is evidence about nothing.
 */
export interface JudgedTree {
  readonly directory: string;
  readonly source: "the run's own" | "the plugin installed now";
  /** the clause the *Defects* section prints, already in the reader's words */
  readonly line: string;
}

/**
 * What the notes half of the observation contributed (run-observation ticket 06).
 *
 * **Carried here beside what the observation cost, because the two are one fact.** A debrief
 * resting on eleven **dispatch note**s of thirteen is a different document from one resting on all
 * thirteen, and a reader deciding what to make of a **defect** grounded in a note has to be able to
 * tell which they are holding. `missing` is D29 at the granularity a note has: a diagnostic that
 * degraded must not read as a run with nothing wrong with it.
 */
export interface NotesSummary {
  readonly written: number;
  readonly attempted: number;
  /** the cheap alias the notes were asked for, never a pinned id */
  readonly model: string;
  /** where they are, for a maintainer who has the machine — never a document to forward */
  readonly path: string | undefined;
  /** the dispatches nothing could be noted for, in a reader's words */
  readonly missing: readonly string[];
  /**
   * Why this half stopped before the dispatches ran out, where it did (one-environment-file ticket
   * 04; D11).
   *
   * **It is not a second statement of why nothing was judged** — that is said once, in the
   * `Judging`'s own reason, and the whole point of the ticket is that it is said once. This is the
   * clause that keeps `written` and `attempted` from reading as the whole story: a run of thirteen
   * dispatches whose first note came back unauthenticated reports one call made and no others, and
   * without this the figure would read as a run that owed exactly one note.
   */
  readonly stopped?: string;
  /**
   * What this half alone spent, so the two tiers can be told apart by whoever is paying.
   *
   * The header's own figure covers both together and stays that way — one document, one number.
   * This is for the line the replay command prints and for the measurement behind it: a
   * contributor deciding whether to judge a thirteen-dispatch delivery needs to know which half
   * the money is in, and summing the two before anybody sees them is what made that unmeasurable
   * (run-observation ticket 06).
   */
  readonly spend: ObservationCost;
}

/**
 * What the judging half of the observer contributed to this debrief.
 *
 * **Two members, and the pair is the whole of what a reader has to be able to tell apart.** D17 is
 * the facts-only one: where no judging can run — no credentials on that machine, the SDK missing,
 * the model refusing, the answer malformed — the debrief ships with its header, no **defect**s and
 * one line naming what stopped it. `judged` is the other, and it carries the synthesis's own prose.
 *
 * **`none` never means "nothing was found".** A judged run that found nothing says so inside its
 * own defects section, where the reader can see that somebody looked. `none` is the absence of the
 * looking, and running the two together is the one outcome this epic must not produce.
 *
 * Only the *Defects* section and the header's `what this observation cost` line read this. Nothing
 * else in the document moves between the two members.
 */
export type Judging =
  | {
      readonly kind: "none";
      /** the one line naming what stopped the judging */
      readonly reason: string;
      /**
       * That what stopped it was that no credential reached the observation (one-environment-file
       * ticket 04; D11 and D13).
       *
       * The reason above already says so in full, and this is not a second copy of it: it is the flag
       * the **announcement** reads, because the line a human meets at the stop gains one clause in
       * this case and carries none of the document's other wording. Nothing in the debrief reads it.
       */
      readonly noCredential?: true;
      readonly cost: ObservationCost;
      /** what the notes half did before it, where anything did (run-observation ticket 06) */
      readonly notes?: NotesSummary;
      /** what continuity the reading had, where it got as far as looking (ticket 07) */
      readonly continuity?: ContinuitySummary;
      /** what this observation's model calls ran under (one-environment-file ticket 02; D12) */
      readonly modelEnvironment?: ModelEnvironment;
    }
  | {
      readonly kind: "judged";
      /**
       * The synthesis's own defects, verbatim, in the shape it was instructed to answer in. Each
       * one states what happened, its **grounds**, the file in the installed plugin it is about,
       * and — where one was obvious — a marked proposal. Proposals ride inside a defect rather than
       * in a section of their own, because D13 puts them there: a proposal is never in place of
       * stating the defect.
       */
      readonly defects: string;
      /** the **hunch**es, verbatim: what it noticed and nothing it kept can ground */
      readonly hunches: string;
      /** how many defects it named, counted off the shape rather than claimed by the model */
      readonly defectCount: number;
      /**
       * The model the synthesis was asked for, beside what the provider actually served — and
       * `undefined` where the call named NO model at all, which is the owner's `code_review_model`
       * set empty (one-environment-file ticket 03; D7).
       *
       * Two fields rather than one because they answer different questions, and the pair is what
       * lets a reader tell the owner's three cases apart without being told which they are in: what
       * was asked for, and what came back. `servedBy` is `undefined` only where the result reported
       * no per-model usage at all.
       */
      readonly model: string | undefined;
      readonly servedBy: string | undefined;
      readonly judgedAgainst: JudgedTree;
      /** how much of the run the one synthesis actually held when it read (D23) */
      readonly readOf: SynthesisExtent;
      /** the notes and the synthesis together, at both tiers (run-observation ticket 06) */
      readonly cost: ObservationCost;
      readonly notes?: NotesSummary;
      /**
       * What continuity this reading had: the earlier **debrief**s of the same **epic** it read, the
       * ones it could not read, and whether the run resumed work none of them covers (ticket 07).
       *
       * Carried on the judging rather than on the `DebriefInput` because the reading is the
       * synthesis's own — the earlier debriefs reach the one whole-run reading and no **dispatch
       * note** — and because a facts-only debrief has to stay byte for byte what ticket 03 wrote:
       * nothing judged it, so it read nothing, and a section saying so would be a section about
       * something that never happened.
       */
      readonly continuity?: ContinuitySummary;
      /**
       * What this observation's model calls ran under: the owner's own **environment file**, or the
       * environment the observation was started in (one-environment-file ticket 02; D12).
       *
       * Carried on the judging for the same reason continuity is — the judging half is the only half
       * that calls a model, so nothing else here has an identity to attribute — and absent on the
       * facts-only path for the same reason: nothing judged it, so nothing was paid for and there is
       * nobody to name. Only `costLine` reads it, and it reads `kind` and `why` and never `path`.
       */
      readonly modelEnvironment?: ModelEnvironment;
    };

/**
 * The run as it stood at the moment the one synthesis read it (run-observation D23).
 *
 * **Why an answer can be older than the debrief carrying it.** The synthesis runs once per run
 * (D9) and is then held, so a run finalised on the idle bound, resumed and finalised again is
 * described by a reading taken before it resumed. D23 lets that bound be a guess because getting
 * it wrong costs a label and never the content — and a debrief claiming a whole-run reading it did
 * not have costs the content. So the reading says how far it got instead, and neither a second
 * paid reading nor a silent lie is what the guess buys.
 */
export interface SynthesisExtent {
  /** the run's last entry it had, 1-based into the session's record, as the header prints them */
  readonly lastEntry: number;
  /** how many of the run's dispatches it had */
  readonly dispatches: number;
}

/**
 * What a live **observer** answers before the one synthesis has run.
 *
 * Separate from `NOTHING_JUDGED` below because the two make different claims about the same file,
 * and separate from a judged run that found nothing for the same reason. The synthesis reads the
 * whole run at once, so it runs when the run is over — and D23 keeps a readable debrief at every
 * moment before that, which is this one.
 */
// Typed to the `none` member rather than to `Judging`, so `./judge.ts` can build the mid-run answer
// out of this one's own wording rather than repeating it (run-observation ticket 06).
export const NOTHING_JUDGES_YET: Extract<Judging, { kind: "none" }> = {
  kind: "none",
  reason:
    "This run is still being watched, and the one synthesis per run reads the whole run at once — " +
    "so it has not run yet. This debrief carries its header and its figures, and it is rewritten " +
    "with what the synthesis found once the run stops.",
  cost: { modelCalls: 0, tokens: NO_TOKENS, costUsd: 0 },
};

/** The facts-only path: replay with no model in play, and its own cost measured at nothing. */
export const NOTHING_JUDGED: Judging = {
  kind: "none",
  reason:
    "No judging ran, so this debrief carries its header and its facts and looks for nothing. It " +
    "was produced by replay — the observer's mechanical half, pointed at a finished run's " +
    "records — which calls no model at all.",
  cost: { modelCalls: 0, tokens: NO_TOKENS, costUsd: 0 },
};

/* ────────────────────────────────── where the files go ────────────────────────────────── */

/** Read by a human deciding what to forward: this one, and never the trace. */
export const DEBRIEF_FILE_NAME = "debrief.md";

/** Read by a human attaching a file, who reads the name and nothing else. */
export const IDENTITY_FILE_NAME = "DO-NOT-FORWARD-identity.txt";

/** Read by a human who opened it. First line of the file, before anything else. */
export const IDENTITY_REFUSAL =
  // What separates the two files is the REPOSITORY and not paths in general: the debrief prints
  // its own trace's path, its notes' path and the installed plugin's, all of them on this machine
  // (ADR-0018 puts the plugin's own text inside the bound). The one path it never carries is the
  // one this file exists to hold, so that is what this line says.
  "DO NOT FORWARD — this file says which run, and which repository of yours, the debrief beside " +
  "it is about. It names that repository, which the debrief never does — the debrief carries " +
  "paths on this machine, its own trace and notes among them, and none of yours. It is read by " +
  "the observer of a later run of the same epic and by nothing else.";

/**
 * The pair of names an nth replay writes under. The first replay takes the plain pair; every one
 * after it carries its ordinal, so a replay writes BESIDE what is already there and rewrites,
 * appends to and removes nothing — D19 holding for the debrief as it already holds for the trace.
 */
export function debriefNames(ordinal: number): { debrief: string; identity: string } {
  return ordinal <= 1
    ? { debrief: DEBRIEF_FILE_NAME, identity: IDENTITY_FILE_NAME }
    : { debrief: `debrief-${ordinal}.md`, identity: `DO-NOT-FORWARD-identity-${ordinal}.txt` };
}

/**
 * The replay ordinal a file name carries where it is one of `debriefNames`' identity files, and
 * `undefined` where it is not one of them at all (run-observation ticket 07).
 *
 * Ticket 07 lists a whole epic's directory to find the earlier debriefs, and it enumerates the
 * IDENTITY files rather than the debriefs: the identity file is what says which run and which
 * repository a debrief is about, and the highest ordinal is that run's newest debrief. It lives here
 * because the naming is here, and the check below is what keeps it a reverse of `debriefNames`
 * rather than a second format that can drift from it.
 */
export function identityOrdinal(name: string): number | undefined {
  const match = /^DO-NOT-FORWARD-identity(?:-(\d+))?\.txt$/.exec(name);
  if (match === null) return undefined;
  const ordinal = match[1] === undefined ? 1 : Number(match[1]);
  return debriefNames(ordinal).identity === name ? ordinal : undefined;
}

/**
 * Whether a name is one of `debriefNames`' debriefs, checked the same way (ticket 07).
 *
 * Ticket 07's listing needs it to tell two different states of an earlier run's directory apart: one
 * holding a debrief nothing can be matched to, and one holding no debrief at all — a run whose
 * observer left a trace and died before its first debrief. Only the first is a debrief that could
 * not be read.
 */
export function isDebriefName(name: string): boolean {
  const match = /^debrief(?:-(\d+))?\.md$/.exec(name);
  if (match === null) return false;
  return debriefNames(match[1] === undefined ? 1 : Number(match[1])).debrief === name;
}

/** How many replays of one run may pile up before this refuses to add another pair. */
const MOST_REPLAYS = 200;

export interface WrittenDebrief {
  readonly debriefPath: string;
  readonly identityPath: string;
  /** which replay this was: 1 the first, 2 the one written beside it, and so on */
  readonly ordinal: number;
}

/**
 * Whether the run this debrief is about is over (run-observation ticket 04; D23).
 *
 * **Finalising is a flag and never a second document.** The live **observer** rewrites this
 * debrief as each stage lands, so a readable one exists from the first stage onwards — and
 * "nothing was found yet" has to be tellable from "the run is over". Replay never carries one: a
 * record on disk is a run that has stopped, so `undefined` means finalised and renders exactly
 * what ticket 03 rendered, byte for byte.
 */
export interface DebriefStatus {
  readonly finalised: boolean;
  /** why it is not final yet, in the reader's words; unused once `finalised` */
  readonly note: string;
}

export interface DebriefInput {
  readonly trace: Trace;
  readonly facts: RunFacts;
  readonly commit: PluginCommit;
  readonly judging: Judging;
  readonly tracePath: string;
  /** absent means the run is over, which is what a replay always looks at */
  readonly status?: DebriefStatus;
  /**
   * What the OBSERVER itself lost, as against what the run's records lost (D29).
   *
   * The two are printed together and they are different claims: the records' losses say the run's
   * own account was damaged, and these say the thing reading it was. A diagnostic that stopped
   * working must not read as a run with nothing wrong with it, and this is where it says so.
   */
  readonly observationLosses?: readonly string[];
}

/**
 * How a debrief and its identity file are put on disk.
 *
 * Two implementations and they mean different things, which is why the caller chooses rather than
 * the writer guessing: `writeDebrief` below is **replay**'s — it writes BESIDE whatever is there
 * and rewrites nothing (D19) — and `refreshDebrief` is the live observer's, which keeps exactly
 * one debrief current for the run it is watching (D23).
 */
export type DebriefWriter = (
  dataDirectory: string,
  input: DebriefInput,
) => Promise<WrittenDebrief>;

/**
 * Writes the debrief and its identity file, and removes nothing.
 *
 * The `wx` flag is the whole of how "nothing already there is rewritten" is kept: the write itself
 * refuses an existing file, rather than a check beforehand deciding it is safe to overwrite one.
 */
export async function writeDebrief(
  dataDirectory: string,
  input: DebriefInput,
): Promise<WrittenDebrief> {
  const directory = observationDirectory(dataDirectory, input.trace);
  await mkdir(directory, { recursive: true });
  const debrief = renderDebrief(input);
  for (let ordinal = 1; ordinal <= MOST_REPLAYS; ordinal += 1) {
    const names = debriefNames(ordinal);
    const debriefPath = join(directory, names.debrief);
    const identityPath = join(directory, names.identity);
    try {
      await writeFile(debriefPath, debrief, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (isAlreadyThere(error)) continue;
      throw error;
    }
    try {
      await writeFile(identityPath, renderIdentity(input, ordinal), {
        encoding: "utf8",
        flag: "wx",
      });
    } catch (error) {
      // The two files are claimed one at a time, so the second can find its slot taken while the
      // first did not — an earlier replay interrupted between the two writes leaves exactly that.
      // The debrief just written is this call's own, which `wx` is what proves, so removing it
      // undoes nobody else's work. A debrief with no identity file beside it is worse than
      // neither: `./continuity.ts` places an epic's earlier debriefs by the identity file, so an
      // orphan is counted as a run whose debrief could not be read rather than as one absent.
      await rm(debriefPath, { force: true }).catch(() => undefined);
      if (isAlreadyThere(error)) continue;
      throw error;
    }
    return { debriefPath, identityPath, ordinal };
  }
  throw new Error(
    `${directory} already holds ${MOST_REPLAYS} debriefs of this run, and nothing here removes ` +
      `one. Move them aside if another replay is wanted.`,
  );
}

function isAlreadyThere(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "EEXIST"
  );
}

/**
 * The live **observer**'s writer: one debrief per run, kept current (run-observation ticket 04;
 * D23).
 *
 * **It takes the first pair of names and rewrites them, which is the one thing `writeDebrief`
 * above refuses to do — and the two are not in conflict.** A run has exactly one observer, holding
 * a lock on this directory, and the debrief it is rewriting is its own account of a run still
 * going. A REPLAY of that same run afterwards still writes beside it as `debrief-2.md`, so D19's
 * "nothing already there is removed" holds for everything that is not this observer's own current
 * answer.
 *
 * **Every rewrite is staged and renamed** (`writeFileAtomically`), because "a readable debrief
 * exists at every moment" includes the moments something is reading it — ticket 08's end-to-end
 * assertion reads the current one with no wait and no poll, and rests on exactly this.
 */
export async function refreshDebrief(
  dataDirectory: string,
  input: DebriefInput,
): Promise<WrittenDebrief> {
  const directory = observationDirectory(dataDirectory, input.trace);
  await mkdir(directory, { recursive: true });
  const names = debriefNames(1);
  const debriefPath = join(directory, names.debrief);
  const identityPath = join(directory, names.identity);
  await writeFileAtomically(debriefPath, renderDebrief(input));
  await writeFileAtomically(identityPath, renderIdentity(input, 1));
  return { debriefPath, identityPath, ordinal: 1 };
}

/* ──────────────────────────────────── the identity file ──────────────────────────────────── */

/**
 * The one fact a debrief may not carry about itself: which repository its run ran in.
 *
 * ADR-0018 makes the epic's **slug** the single thing of the user's own domain a debrief holds,
 * and the plugin's data directory is one per machine — so two epics of one name in two
 * repositories would read each other once ticket 07 has a later run read the earlier debriefs
 * under its slug. This file is what that filter reads, and nothing else ever reads it. It is
 * written on the facts-only path too, because a debrief nothing judged is still an earlier debrief
 * for the run after it.
 *
 * Not called a sidecar: that word is already the host's own `.meta.json` beside a dispatch's
 * record.
 */
export function renderIdentity(input: DebriefInput, ordinal: number): string {
  const { trace, facts } = input;
  const lines = [
    IDENTITY_REFUSAL,
    "",
    // The run's key is ticket 02's — the slug and the run's first timestamp — because that pair
    // names the directory all three files sit in.
    `slug: ${trace.slug}${trace.slugRead ? "" : " (no task update carried one)"}`,
    `run-started-at: ${trace.startedAt ?? "unknown"}`,
    // The RUN's skills and not the record's, for the reason `skillOf` gives: one record can hold
    // two runs, and this file names one of them.
    `skill: ${skillOf(input)}`,
    `command: ${facts.extent.command ?? "none — the run was resumed by prose"}`,
    `repository: ${facts.repository ?? "unknown"}`,
    `plugin-commit: ${input.commit.commit ?? "unknown"}`,
    `plugin-commit-source: ${input.commit.source}`,
    `session: ${trace.sessionId ?? "unknown"}`,
    `record: ${trace.recordPath}`,
    `debrief: ${debriefNames(ordinal).debrief}`,
    // D23's flag, read by the observer of a later run of the same epic (ticket 07): a debrief the
    // observer is still rewriting is read for continuity but marked as unfinished where it is
    // used, and a half-written account presented as a finished one is the thing that must not
    // happen. Replay carries no status and is always `yes` — a record on disk is a run that
    // stopped.
    `finalised: ${input.status === undefined || input.status.finalised ? "yes" : "no"}`,
  ];
  return `${lines.join("\n")}\n`;
}

/**
 * One identity file back as its fields, for the later run that has to tell one epic's debriefs
 * from another epic of the same name in a different repository (ticket 07). Kept beside the
 * writer so the format is one place rather than a shape prose describes.
 */
export function parseIdentity(text: string): Readonly<Record<string, string>> {
  const fields: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const separator = line.indexOf(": ");
    if (separator <= 0) continue;
    fields[line.slice(0, separator)] = line.slice(separator + 2);
  }
  return fields;
}

/* ─────────────────────────────────────── the debrief ─────────────────────────────────────── */

/** What the document wraps at, and the whole of why nothing here builds a line by hand. */
const WRAP_COLUMNS = 120;

/**
 * The skill this document is about, in the run's own words before the record's.
 *
 * `RunFacts.skills` is bounded by the run's extent and `Trace.skills` is the whole session's, and
 * where one record holds two runs those differ: a title naming both would be a document about one
 * run titled after two. The trace's own list stays behind it, for a run whose window carried no
 * attributed entry at all, and the command the human typed stands in where neither has anything.
 */
function skillOf(input: DebriefInput): string {
  return runSkills(input.facts, input.trace) || (input.facts.extent.command ?? "unknown");
}

export function renderDebrief(input: DebriefInput): string {
  const { trace, facts, judging } = input;
  const skill = skillOf(input);
  const out: Document = { lines: [] };

  line(out, `# Deliverer debrief — \`${skill}\`, epic \`${trace.slug}\``);
  paragraph(out,
    "This is a **debrief** of one run of the deliverer plugin: what the plugin's own machinery " +
      "did, and what it cost. It is bounded to the plugin — its skills, its agents, its " +
      "dispatches, its timings and its spend — and it carries nothing from the repository the run " +
      "delivered into and no word of what the run and its human said to each other. **It is safe " +
      "to forward without reading it first.** Where to send it is at the bottom.",
  );

  // D23's flag, where a human meets it. The observer rewrites this file as each stage lands, so a
  // reader can open it mid-run — and a set of figures that stops halfway is worth having only if
  // it says it is not the whole run yet. Nothing is printed once the run is over, so a finalised
  // live debrief and a replay of the same records are the same bytes.
  if (input.status !== undefined && !input.status.finalised) {
    paragraph(out,
      `**This run is still going, so this debrief is not final.** ${input.status.note} Every ` +
        `figure below is the run as far as it has got, and this file is rewritten as each stage ` +
        `lands. Forwarding it is safe — the bound below holds either way — but a later reading of ` +
        `the same file will say more.`,
    );
  }

  line(out, "## The run");
  blank(out);
  bullet(out, "skill", `\`${skill}\``);
  bullet(out,
    "epic slug",
    trace.slugRead
      ? `\`${trace.slug}\``
      : `\`${trace.slug}\` — a stand-in: no task update of this run carried one`,
  );
  bullet(out, "wall clock", wallClockLine(facts));
  bullet(out, "dispatches", `${facts.dispatches.length} — ${dispatchTally(facts.dispatches)}`);
  bullet(out, "rounds", roundsLine(facts.rounds));
  for (const round of facts.rounds) subBullet(out, roundLine(round));
  bullet(out, "how the run ended", facts.ending.line);
  bullet(out, "the run's spend", spendLine(facts));
  bullet(out, "what this observation cost", costLine(judging));
  // Only where a note was actually attempted, so a facts-only replay is byte for byte ticket 03's
  // and a run that died before dispatching anything says nothing about notes it never owed.
  if (judging.notes !== undefined && judging.notes.attempted > 0) {
    bullet(out, "dispatch notes", notesLine(judging.notes));
  }
  bullet(out, "plugin commit", input.commit.line);
  blank(out);

  line(out, "## The human's own time");
  paragraph(out,
    "Shape and never subject: how often the run stopped for its human and how long it waited on " +
      "them, with no question, no answer and no word of either.",
  );
  bullet(out,
    "question rounds put to the human",
    `${facts.human.questionRounds}` +
      (facts.human.questionRounds === 0
        ? " — the run asked nothing"
        : `, carrying ${plural(facts.human.questionsAsked, "question", "questions")} in all`),
  );
  bullet(out, "time the run spent waiting on the human", waitLine(facts));
  blank(out);

  continuitySection(out, judging.continuity);

  defectsSection(out, judging, facts);

  line(out, "## What this observation lost");
  blank(out);
  const losses = [...trace.losses, ...facts.losses, ...(input.observationLosses ?? [])];
  if (losses.length === 0) {
    paragraph(out,
      "Nothing: every record this run left was read whole, and every figure above is off those " +
        "records.",
    );
  } else {
    paragraph(out,
      "The figures above rest on the host's own session records, and this much of them could not " +
        "be read — or was lost by the thing reading them. A run whose records were damaged, and " +
        "an observation that degraded, do not read here as a run with nothing wrong with it.",
    );
    for (const loss of losses) out.lines.push(...wrap("- ", loss, "  "));
    blank(out);
  }
  bullet(out,
    "how much was elided",
    `every entry of the run is in the trace, with what each one carried capped at ` +
      `${trace.excerptCap} characters — ${trace.elidedChars} characters in all. Nothing was ` +
      `dropped by kind; volume is the whole of what that cap bounds.`,
  );
  blank(out);

  line(out, "## The trace behind this debrief");
  paragraph(out,
    `Every figure above is checkable against this run's **trace**, at \`${input.tracePath}\` on ` +
      `the machine the run happened on. **Do not forward the trace.** Unlike this debrief it is ` +
      `bounded by nothing: it holds the whole run's shape in order and, with it, whatever the run ` +
      `touched — the repository's contents and the human's own words among them. Ask for a ` +
      `specific line of it where a figure here looks wrong; never attach the file.`,
  );
  // The same refusal for the notes, in the same breath and for the same reason (D20, extended by
  // ticket 06). A note reads a dispatch's INTERIOR, so of the files beside this one it is the one
  // carrying the most of somebody's repository.
  if (judging.notes?.path !== undefined) {
    paragraph(out,
      `The **dispatch note**s are beside it, at \`${judging.notes.path}\`. **Do not forward those ` +
        `either.** Each is a cheap reading of one dispatch's own record, which is where the ` +
        `repository this run delivered into is densest, and they carry no bound of their own. ` +
        `They are there so a defect above can be checked, one note at a time.`,
    );
  }

  line(out, "## Where to send this");
  paragraph(out, `Open an issue on the plugin's own repository: **${DEBRIEF_DESTINATION}**`);
  paragraph(out,
    "Paste this document in whole. It needs no tooling of the maintainer's and no context beyond " +
      "itself, and it is bounded to the plugin's own machinery — so it may be forwarded without " +
      "being read for leaks first.",
  );

  return documentText(out);
}

/* ────────────────────────────── continuity across the epic ────────────────────────────── */

/**
 * What continuity this debrief had (run-observation ticket 07; D21).
 *
 * **Below D13's fixed header rather than inside it.** The header is what makes debriefs comparable
 * across a team, and ticket 03 left it as the spec settled it — so this sits beside the human's own
 * time, where ticket 03 put that.
 *
 * **Three states, kept apart**, because they are three different claims and running them together is
 * the failure: how many earlier debriefs were read, zero being a number rather than silence; which
 * ones could not be read, which costs this debrief its continuity and nothing else (D29); and
 * whether the run resumed work no debrief above covers.
 *
 * Nothing prints where nothing judged: a facts-only debrief read no earlier debrief because nothing
 * read anything, and ticket 03's bytes stay ticket 03's.
 */
function continuitySection(out: Document, continuity: ContinuitySummary | undefined): void {
  if (continuity === undefined) return;
  line(out, "## Continuity across this epic's runs");
  paragraph(out,
    "An **epic** usually takes more than one run, and a **defect** may exist only across two of " +
      "them — a stage the resumed run dispatched again although an earlier one had finished it, a " +
      "question asked in two different runs. This is what the reading below had of the runs before " +
      "this one: their **debrief**s, whole and oldest first, and never their traces and never " +
      "their notes. Each debrief still stands alone — a cross-run defect states in full what " +
      "happened, and names the other debrief as where it may be checked rather than as where the " +
      "rest of it lives.",
  );
  bullet(out,
    "earlier debriefs of this epic read",
    `${continuity.read.length}` +
      (continuity.read.length === 0 ? " — nothing here has read a run of this epic before" : "") +
      (continuity.elsewhere === 0
        ? ""
        : `. A further ${plural(continuity.elsewhere, "debrief", "debriefs")} under this epic's ` +
          `slug ${continuity.elsewhere === 1 ? "is" : "are"} another repository's run of the same ` +
          `name, and ${continuity.elsewhere === 1 ? "was" : "were"} not read: one data directory ` +
          `holds every epic on the machine, and a defect assembled from an unrelated epic would ` +
          `arrive with grounds attached`),
  );
  for (const it of continuity.read) subBullet(out, it);
  // "runs whose debrief" rather than "debriefs": one of the states this counts is a run that left a
  // trace and no debrief at all, and naming that a debrief that could not be read would name a
  // document that was never there.
  bullet(out,
    "earlier runs of this epic whose debrief could not be read",
    continuity.unreadable.length === 0
      ? "none"
      : `${continuity.unreadable.length} — this debrief lost that much of its continuity and ` +
        `nothing else; the reading below still ran on this run's own trace and notes`,
  );
  for (const it of continuity.unreadable) subBullet(out, it);
  bullet(out,
    "work of this epic before this run that no debrief above covers",
    continuity.hole ??
      "none this run's own records show: its task list did not open on work already done",
  );
  blank(out);
}

/* ─────────────────────────────── the defects and the hunches ─────────────────────────────── */

/**
 * D13's *Defects*, and the *Hunches* section under it (run-observation ticket 05).
 *
 * **The code owns the document and the synthesis owns only these two blocks.** Everything around
 * them — the header, the losses, the trace's refusal, the footer — is written here whether anything
 * judged or not, so a debrief nobody judged and a debrief full of defects are the same document
 * with one section answered differently. The model never writes the file.
 *
 * The two blocks go in as they came back, each as ONE line of the document, which is what keeps
 * `documentText`'s blank-line tidying off the inside of them. They are already wrapped: the
 * instruction asks for 120 columns, and re-wrapping prose that carries fenced quotations from the
 * plugin's own files would break the quotations.
 */
/** "nothing was found" is a finding; a count is the other one. Never the same sentence. */
function found(count: number): string {
  return count === 0 ? "**This run was read and nothing was found.**" : `**${count} named.**`;
}

function defectsSection(out: Document, judging: Judging, facts: RunFacts): void {
  line(out, "## Defects");
  if (judging.kind === "none") {
    paragraph(out, `**None — nothing judged this run.** ${judging.reason}`);
    paragraph(out,
      "A **defect** is one thing a run cost its human that it did not have to, carrying the " +
        "grounds from the run's own conduct that show it. This debrief looked for none, so the " +
        "absence of defects here is not a finding that the run was clean — it is the absence of " +
        "anybody having looked.",
    );
    return;
  }

  paragraph(out,
    `A **defect** is one thing this run cost its human that it did not have to, and every one below ` +
      `carries the **grounds** that show it: a timestamp, a dispatch, a poll or a question round ` +
      // D11's test, in the reader's words, over the three files that satisfy it today — the third
      // being ticket 07's, and named here so a defect resting on one does not read as a weaker
      // defect than one resting on the trace.
      `that whoever holds this run's own files can find in them — its trace, the **dispatch note**s ` +
      `beside it, or an earlier debrief of this epic. ` +
      `${found(judging.defectCount)} ` +
      `Read by ${askedFor(judging.model)}${servedClause(judging.servedBy)}, ` +
      `${extentRead(judging.readOf, facts)}` +
      (judging.notes === undefined || judging.notes.written === 0
        ? ""
        : `, together with the ${plural(judging.notes.written, "dispatch note", "dispatch notes")} ` +
          `above — the only reading this debrief has of what happened inside a stage`) +
      (judging.continuity === undefined || judging.continuity.read.length === 0
        ? ""
        : `, and with the ` +
          `${plural(judging.continuity.read.length, "earlier debrief", "earlier debriefs")} ` +
          `named above`) +
      `, against ${judging.judgedAgainst.line}`,
  );
  out.lines.push("", judging.defects, "");

  line(out, "## Hunches");
  paragraph(out,
    "A **hunch** is something the same reading noticed that nothing it kept can ground. It is the " +
      "observer's nose rather than its evidence, and it is kept apart from the defects above on " +
      "exactly those terms: act on one only after checking it yourself.",
  );
  out.lines.push("", judging.hunches, "");
}

/**
 * How much of the run the one reading held, in the reader's words.
 *
 * **"The whole run" is earned here rather than asserted.** It is the ordinary answer and the one
 * every replay gives, because a replay judges a record that has stopped. What it must not survive
 * is the case D23 leaves open: a run finalised on the idle bound, resumed, and finalised again
 * keeps the answer it already has (D9 — one synthesis per run, and a guess may not buy a second
 * whole-run reading), so that answer is older than the run around it. A maintainer weighing a
 * defect has to know which of the two they are holding, and the figures are the header's own, so
 * they can see for themselves what was left out.
 */
function extentRead(read: SynthesisExtent, facts: RunFacts): string {
  if (read.lastEntry >= facts.extent.lastEntry && read.dispatches >= facts.dispatches.length) {
    return "over the whole run in one reading";
  }
  return (
    `in one reading of the run **as far as it had got by then** — entries ` +
    `${facts.extent.firstEntry}–${read.lastEntry} of ${facts.extent.lastEntry} and ` +
    `${read.dispatches} of its ${facts.dispatches.length} dispatches. The run had gone quiet long ` +
    `enough to be taken for over, and it resumed after this reading: there is one reading per run ` +
    `and it was not made again, so nothing has judged what the run did after that entry`
  );
}

/**
 * The document as lines.
 *
 * Wrapping happens here rather than by writing the prose pre-broken, because most of what is
 * wrapped carries figures whose width is the run's and not the author's — and a debrief is read in
 * a terminal as often as in a browser.
 */
interface Document {
  readonly lines: string[];
}

function line(out: Document, text: string): void {
  out.lines.push(text);
}

function blank(out: Document): void {
  out.lines.push("");
}

function paragraph(out: Document, text: string): void {
  out.lines.push("", ...wrap("", text, ""), "");
}

function bullet(out: Document, label: string, value: string): void {
  out.lines.push(...wrap("- ", `**${label}** — ${value}`, "  "));
}

function subBullet(out: Document, text: string): void {
  out.lines.push(...wrap("  - ", text, "    "));
}

function documentText(out: Document): string {
  // One trailing newline, and never a run of blank lines: the sections above each open with one
  // and some close with one too.
  const tidied: string[] = [];
  for (const text of out.lines) {
    if (text === "" && tidied.at(-1) === "") continue;
    tidied.push(text);
  }
  return `${tidied.join("\n").trim()}\n`;
}

/** The marker or indent a line opens with is never a word, so it is carried apart from the text. */
function wrap(prefix: string, text: string, indent: string): readonly string[] {
  const lines: string[] = [];
  let current = prefix;
  let empty = true;
  for (const word of text.split(/\s+/).filter((it) => it !== "")) {
    if (!empty && `${current} ${word}`.length > WRAP_COLUMNS) {
      lines.push(current);
      current = `${indent}${word}`;
      continue;
    }
    current = empty ? `${current}${word}` : `${current} ${word}`;
    empty = false;
  }
  lines.push(current);
  return lines;
}

/* ───────────────────────────────── the header's own figures ───────────────────────────────── */

/** What the run cost its human in time, and nothing about what either of them said. */
function waitLine(facts: RunFacts): string {
  const { answerWaitMs, idleWaitMs, totalWaitMs, typedTurns } = facts.human;
  if (totalWaitMs === 0) return "none — the run never stopped for its human";
  return (
    `${formatDuration(totalWaitMs)} in all: ${formatDuration(answerWaitMs)} of it waiting for ` +
    `answers to those rounds, and ${formatDuration(idleWaitMs)} of it idle before the ` +
    `${plural(typedTurns, "turn", "turns")} the human typed unprompted`
  );
}

/** "1 entry", "13 entries" — never "1 entry/entries", which reads as a figure nobody checked. */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * The run's wall clock, said with the bound it was taken over.
 *
 * Neither of the two figures lying nearest to hand. From attribution it is far too short — one
 * delivery on disk attributes 2h28m of a 5h48m run and neither of its two rounds; from the
 * session's own span it is far too long — one of those sessions ran 20h26m because the human came
 * back the next afternoon for unrelated work.
 */
function wallClockLine(facts: RunFacts): string {
  return (
    `${formatDuration(facts.extent.durationMs)} — ${facts.extent.startedAt ?? "unknown"} to ` +
    `${facts.extent.endedAt ?? "unknown"}. The run's own and not the session's: from the ` +
    `\`${facts.extent.command ?? "(no command: the run was resumed by prose)"}\` that started it ` +
    `to the last entry it or any of its dispatches left. It stops there because ` +
    `${facts.extent.boundedBy}. ${plural(facts.extent.entriesOutside, "entry", "entries")} of the ` +
    `same session lie outside it, and no figure here counts them.`
  );
}

/** A dispatch count counts dispatches. Thirteen dispatches leave 26 files, and files are not it. */
function dispatchTally(dispatches: readonly TraceDispatch[]): string {
  const byAgent = new Map<string, number>();
  for (const dispatch of dispatches) {
    byAgent.set(dispatch.agentType, (byAgent.get(dispatch.agentType) ?? 0) + 1);
  }
  const tally = [...byAgent.entries()].map(([agent, count]) => `${count}× ${agent}`).join(", ");
  return tally === "" ? "none" : tally;
}

function roundsLine(rounds: readonly RunRound[]): string {
  if (rounds.length === 0) {
    return "0 — no review round was started, which is what a refinement looks like";
  }
  return (
    `${rounds.length} started, ending ${rounds.map((it) => it.status ?? "unreported").join(", ")}` +
    `. Counted per review id across the run's own record and every per-dispatch record, since the ` +
    `run's own holds only the polls the orchestrator made itself.`
  );
}

/**
 * One round's line: the poll's own word for how it ended, and the dollars that poll measured.
 *
 * A round's spend IS money, unlike the run's own, because the tools server puts the SDK's own
 * figure in the payload every poll returns — and it survives a **failed** round, which is the half
 * most likely to be lost. The provider that served it travels beside it, because a dollar figure
 * from one provider is not a dollar figure from another.
 *
 * **A poll that came back no status at all is named by its shape and never quoted.** The tools
 * server's own refusals quote what they refused — a forge URL, a repository path — and this is the
 * document that says on its face it carries neither, so `RunRound.lastPollError` is already the
 * observer's own words about that answer rather than the answer (ADR-0018).
 */
function roundLine(round: RunRound): string {
  const spend =
    round.costUsd === undefined
      ? "spend unknown — no poll of it came back carrying one"
      : `$${round.costUsd.toFixed(2)} on ${round.provider ?? "an unnamed provider"}` +
        (round.model === undefined ? "" : ` (${round.model})`);
  return (
    `\`${round.reviewId}\` — **${round.status ?? "no poll ever reported a status"}**` +
    (round.reason === "" ? "" : `, reason: ${round.reason}`) +
    `; ${plural(round.polls, "call", "calls")} to the review tools, in ${round.where.join(" and ")}` +
    (round.agentDurationMs === undefined
      ? ""
      : `; ${formatDuration(round.agentDurationMs)} inside the reviewer`) +
    `; ${spend}` +
    (round.lastPollError === undefined
      ? ""
      : `. Its last call came back no status — ${round.lastPollError}`)
  );
}

/**
 * The run's own spend: tokens, and dollars that nothing measured.
 *
 * **The host records no money at all** — no cost, dollar or price field exists anywhere in a
 * session record, only per-request tokens — so the dollar half reads unknown, which is what the
 * glossary requires of a figure nobody measured and is never zero. The rounds' dollars above are
 * real, and the two are never added: one total would present a measured amount as covering the
 * unmeasured part.
 */
function spendLine(facts: RunFacts): string {
  return (
    `${tokenDetail(facts.tokens) || "no tokens recorded"} — the whole run: the orchestrator's own ` +
    `turns (${tokenDetail(facts.ownTokens) || "none"}) and every dispatch's together, counted per ` +
    `API request and never per entry. **In dollars: unknown.** The host records no money anywhere ` +
    `in a session record, so nothing here prices these tokens; unknown is the honest answer and it ` +
    `is not zero.` +
    (facts.rounds.length === 0
      ? ""
      : ` The rounds above carry dollars of their own, measured by the tools server, and the two ` +
        `are deliberately never added — one total would present what was measured as covering ` +
        `what was not.`)
  );
}

/**
 * What the observation itself cost, which is the one dollar figure in this document that is real.
 *
 * The run's own spend above is tokens with `unknown` where the money should be, because the host
 * records none. This half is measured: the judging's result message carries the same per-model
 * usage a **round**'s spend is read off, summed per API request, and the SDK's own dollar figure
 * beside it. So the two halves of the header's spend say different things on purpose, and neither
 * is added to the other.
 *
 * **And it says WHOSE money it was** (one-environment-file ticket 02; D12). The observation used to
 * run on whatever the session it was started beside authenticates with, so "the same account the run
 * was" needed no saying; now it runs under the **environment file** the owner named wherever there is
 * a usable one, which may be a different account entirely. So the line names the option that decided
 * that — and never the file's path, which is on the owner's filesystem and routinely names their
 * repository, the one fact a document that is safe to forward unread may not hold.
 */
function costLine(judging: Judging): string {
  const { cost } = judging;
  const dollars = cost.costUsd === undefined ? "**unknown**" : `$${cost.costUsd.toFixed(2)}`;
  if (cost.modelCalls === 0) {
    return (
      `**nothing, measured rather than assumed**: 0 model calls, 0 tokens, ${dollars}. Nothing ` +
      `judged this run, so this document was written by code alone. A figure nobody could measure ` +
      // Nothing was paid, so there is no identity to attribute — but a named source that could not
      // be used is still worth saying here, since it is the reason a later call would fail too.
      `reads unknown; this one was measured, and it is zero.${unusableSource(judging)}`
    );
  }
  return (
    `${plural(cost.modelCalls, "model call", "model calls")} — ${tiers(judging)}. ` +
    `${tokenDetail(cost.tokens) || "no tokens reported"}, ${dollars}. Counted per API request off ` +
    `the per-model usage each call itself reported, the way a round's spend above is, and summed ` +
    `across every one of them; a counter nobody measured reads unknown and never zero. ` +
    `${whoPaid(judging)}`
  );
}

/**
 * Which identity paid for the observation (D12).
 *
 * Today's wording where it inherited, which is then true — the environment it inherited is the
 * session's, so the run's own account is what paid — with the reason it inherited after it, where
 * a source was named and could not be used.
 */
function whoPaid(judging: Judging): string {
  if (judging.modelEnvironment?.kind !== "file") {
    return `It is drawn on the same account the run was.${unusableSource(judging)}`;
  }
  return (
    `It is drawn on the identity the plugin's \`${ENV_FILE_OPTION}\` option names: that file's ` +
    `variables were layered over this observation's own environment for every call counted here, ` +
    `so this spend may not have come out of the account the run's did. The file itself is not ` +
    `named — this document carries the option and never a path of yours.`
  );
}

/** Why the named source was not used, where one was named at all — a line and never a value (D10). */
function unusableSource(judging: Judging): string {
  const environment = judging.modelEnvironment;
  if (environment === undefined || environment.kind === "file") return "";
  // Where nothing was judged for want of a credential, the *Defects* section says which option names
  // one and whether what it named was used or was unusable — the whole of it, in one place
  // (one-environment-file ticket 04; D11). This clause is that same sentence, and a document carrying
  // it twice is what that ticket exists to stop.
  if (judging.kind === "none" && judging.noCredential === true) return "";
  return ` ${environment.why}`;
}

/**
 * The two tiers the observation spends at, named separately (run-observation ticket 06; D9).
 *
 * One figure covering both is what the header wants, and a reader who cannot see the split cannot
 * tell a run that cost thirteen cheap calls and one long-context reading from one that made
 * fourteen expensive ones.
 */
function tiers(judging: Judging): string {
  const notes =
    judging.notes === undefined || judging.notes.attempted === 0
      ? undefined
      : `${plural(judging.notes.attempted, "dispatch note", "dispatch notes")} on ` +
        `\`${judging.notes.model}\``;
  const synthesis =
    judging.kind === "judged"
      ? `one synthesis over the whole run on ${askedFor(judging.model)}` +
        servedClause(judging.servedBy)
      : "no synthesis: nothing read the whole run";
  return notes === undefined ? synthesis : `${notes}, and ${synthesis}`;
}

/**
 * The model a call asked for, in the reader's words (one-environment-file ticket 03; D7).
 *
 * **`undefined` is not a figure nobody measured: it is a model nobody named.** It is what the owner's
 * `code_review_model` set empty means — no model reaches the provider and the provider's own default
 * serves the call — so it is said in words rather than left as a gap, which is what a blank between
 * two backticks would read as. Said beside `servedClause` below, the pair is what lets a reader tell
 * that case from an owner who named a model and from one who never touched the option.
 */
function askedFor(model: string | undefined): string {
  return model === undefined
    ? "the provider's own default, with no model named"
    : `\`${model}\``;
}

/** What actually served a call, where the result said, so the cost line names it whether or not one
 *  was asked for (ticket 03; D7). */
function servedClause(servedBy: string | undefined): string {
  return servedBy === undefined ? "" : ` (served by \`${servedBy}\`)`;
}

/**
 * What the notes half did, and which dispatches this debrief has no note for.
 *
 * **A note that could not be written costs this debrief that dispatch's interior and nothing
 * else** — the synthesis still ran, on the trace and on whatever notes did come back. Saying which
 * ones are missing is what stops that reading as a run those stages were fine in.
 */
function notesLine(notes: NotesSummary): string {
  const head =
    `${notes.written} of ${plural(notes.attempted, "dispatch", "dispatches")} read from the ` +
    `inside, on \`${notes.model}\` — a cheap reading of each dispatch's own record as it finished, ` +
    `which is the only reading of what happened INSIDE a stage this debrief has. They are kept ` +
    `beside the trace and, like it, are not to be forwarded.` +
    // Where this half stopped early, the figures above are the calls that were made and not the
    // dispatches that were due, and a reader has to be able to tell (ticket 04; D11).
    (notes.stopped === undefined ? "" : ` **It stopped there**: ${notes.stopped}.`);
  if (notes.missing.length === 0) return head;
  return (
    `${head} **No note for ${plural(notes.missing.length, "dispatch", "dispatches")}**, so this ` +
    `debrief has nothing about what happened inside ${notes.missing.length === 1 ? "it" : "them"}: ` +
    `${notes.missing.join("; ")}.`
  );
}
