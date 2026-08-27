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
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NO_TOKENS, type TokenTotals } from "./records.ts";
import { formatDuration, tokenDetail, type Trace, type TraceDispatch } from "./trace.ts";
import { observationDirectory, writeFileAtomically } from "./trace-file.ts";
import type { PluginCommit } from "./plugin-commit.ts";
import type { RunFacts, RunRound } from "./run-facts.ts";

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
 * What the judging half of the observer contributed to this debrief.
 *
 * **One member today, and it is the seam the rest of the epic lands on.** D17 is the whole of what
 * this ticket builds: where no judging can run — nothing built yet, no credentials on that
 * machine, the SDK missing, the model refusing — the debrief ships with its header, no **defect**s
 * and one line naming what stopped it. Tickets 05 and 06 add the member carrying defects,
 * **hunch**es, proposals and what the judging spent; nothing above this line moves when they do.
 */
export type Judging = {
  readonly kind: "none";
  /** the one line naming what stopped the judging */
  readonly reason: string;
  readonly cost: ObservationCost;
};

/**
 * The live **observer**'s facts-only answer, which is the only one it has today.
 *
 * Separate from `NOTHING_JUDGED` below because the two make different claims about the same empty
 * section, and a human reading a debrief of a run they just watched should not be told it was
 * replayed. Ticket 05 replaces this one and leaves the other alone.
 */
export const NOTHING_JUDGES_YET: Judging = {
  kind: "none",
  reason:
    "Nothing judged this run. The observer that watched it is mechanical throughout in this " +
    "build of the plugin: it reads the host's own session records, works the figures above out " +
    "of them and calls no model at all.",
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
  "DO NOT FORWARD — this file says which run, and which repository of yours, the debrief beside " +
  "it is about. It carries a path from your machine, which the debrief deliberately does not. It " +
  "is read by the observer of a later run of the same epic and by nothing else.";

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
      await writeFile(identityPath, renderIdentity(input, ordinal), {
        encoding: "utf8",
        flag: "wx",
      });
    } catch (error) {
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
    `skill: ${trace.skills.length === 0 ? "unknown" : trace.skills.join(", ")}`,
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

export function renderDebrief(input: DebriefInput): string {
  const { trace, facts, judging } = input;
  const skill =
    trace.skills.length === 0 ? (facts.extent.command ?? "unknown") : trace.skills.join(", ");
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
  bullet(out, "what this observation cost", costLine(judging.cost));
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

  line(out, "## Defects");
  paragraph(out, `**None — nothing judged this run.** ${judging.reason}`);
  paragraph(out,
    "A **defect** is one thing a run cost its human that it did not have to, carrying the grounds " +
      "from the run's own conduct that show it. This debrief looked for none, so the absence of " +
      "defects here is not a finding that the run was clean — it is the absence of anybody having " +
      "looked.",
  );

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

  line(out, "## Where to send this");
  paragraph(out, `Open an issue on the plugin's own repository: **${DEBRIEF_DESTINATION}**`);
  paragraph(out,
    "Paste this document in whole. It needs no tooling of the maintainer's and no context beyond " +
      "itself, and it is bounded to the plugin's own machinery — so it may be forwarded without " +
      "being read for leaks first.",
  );

  return documentText(out);
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
      : `. Its last call came back an error: ${round.lastPollError}`)
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

function costLine(cost: ObservationCost): string {
  const dollars = cost.costUsd === undefined ? "**unknown**" : `$${cost.costUsd.toFixed(2)}`;
  if (cost.modelCalls === 0) {
    return (
      `**nothing, measured rather than assumed**: 0 model calls, 0 tokens, ${dollars}. This ` +
      `debrief was written by code alone. A figure nobody could measure reads unknown; this one ` +
      `was measured, and it is zero.`
    );
  }
  return `${cost.modelCalls} model call(s), ${tokenDetail(cost.tokens) || "no tokens"}, ${dollars}.`;
}
