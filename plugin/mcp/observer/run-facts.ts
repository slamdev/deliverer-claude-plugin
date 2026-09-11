/**
 * The **run**'s extent, and every figure bounded by it (run-observation ticket 03).
 *
 * **The extent is settled before a single figure is computed, and attribution does not settle it.**
 * Attribution is how a run is FOUND — it is the whole of ticket 02's identification rule and
 * nothing here touches it — but it is not how a run is BOUNDED, and taking it for the bound is
 * wrong by an order of magnitude in both directions. Measured against the eight runs on the
 * machine this was written on:
 *
 *  - **From attribution, far too short.** `attributionSkill` stops partway through every run on
 *    disk. One delivery attributes 2h28m of a 5h48m run — seven of its thirteen **dispatch**es and
 *    NEITHER of its two **round**s, because everything after the change-request stage carries none.
 *    Another attributes 17m44m of 10h18m. A refinement attributes 32 seconds of 1h50m, because
 *    what follows its own turns is attributed to the skills a refinement delegates to.
 *  - **From the session, far too long.** One of those sessions spans 20h26m because the human came
 *    back the next afternoon for work that had nothing to do with the run.
 *
 * So the run runs **from the `/deliverer:` command that started it to the last entry it or any of
 * its dispatches left**, and that is what every figure below is taken over: the wall clock, the
 * dispatch count, the rounds, the tokens and the human's own time are the RUN's and never the
 * session's. **One record can hold two runs**, and where it does the second one's command closes
 * the first one's extent: a refinement and the delivery the human started five hours later are two
 * runs, and one debrief may only ever be about one of them.
 *
 * **Nothing here judges anything either.** Same records, same facts, no model and no clock read —
 * ticket 02's determinism holds through this file, which is what lets a **debrief** be replayed.
 *
 * It reads the same two things ticket 02's distiller read, and one thing more: the **trace** it
 * produced, whose `dispatches` already carry each stage's timings and tokens. What it does NOT
 * take from the trace is anything under the excerpt cap — a **round**'s poll payload and the skill
 * preamble naming the plugin's commit are both far longer than a large run's cap, so those are
 * read from the records themselves. The trace is still where a maintainer checks any of it: every
 * entry counted here is a line in it, at the timestamp printed beside the figure.
 */
import { basename } from "node:path";
import {
  addTokens,
  asObject,
  attributionOf,
  numberField,
  objectField,
  PLUGIN_NAME,
  requestUsage,
  stringField,
  totalTokens,
  type DispatchRecord,
  type JsonObject,
  type RecordFile,
  type TokenTotals,
} from "./records.ts";
import { pluginDirectoryInText, type PluginDirectory } from "./plugin-commit.ts";
import { addPricing, pricingOf, RATES_AS_OF, RATES_SOURCE, type Pricing } from "./rates.ts";
import {
  contentBlocks,
  elapsed,
  isReviewTool,
  TASK_TOOLS,
  type Trace,
  type TraceDispatch,
} from "./trace.ts";

/* ─────────────────────────────────── what the facts hold ─────────────────────────────────── */

/** Where the run starts and stops inside a session's record, and how that was decided. */
export interface RunExtent {
  /** the command as the human typed it, or `undefined` for a run resumed by prose */
  readonly command: string | undefined;
  readonly startedAt: string | undefined;
  readonly endedAt: string | undefined;
  readonly durationMs: number | undefined;
  /** 1-based, into the run's own record, so a reader can find both ends in the trace */
  readonly firstEntry: number;
  readonly lastEntry: number;
  /** entries of the same session lying outside the run, before it and after it */
  readonly entriesOutside: number;
  /** how the far end was found, in the words the debrief prints */
  readonly boundedBy: string;
}

/**
 * One **round**, counted per review id across the run's own record and every per-dispatch record.
 *
 * The run's own record holds only the polls the **orchestrator** made itself — a cancellation, a
 * status call after an interruption — while the round's own polling loop is inside the
 * `code-reviewer` dispatch that ran it. One measured delivery's five rounds have polls in both, so
 * counting either record alone gets the count wrong.
 *
 * `status` and `reason` are **the last poll's own word**, verbatim from the payload the tools
 * server published — `completed`, `failed` with the reason that poll names, `cancelled`, or a
 * non-terminal word for a round nothing ever saw finish. Never a vocabulary of the debrief's own.
 */
export interface RunRound {
  readonly reviewId: string;
  /** every call to the plugin's review tools carrying this id, start and cancel among them */
  readonly polls: number;
  readonly startedAt: string | undefined;
  readonly lastPollAt: string | undefined;
  readonly status: string | undefined;
  readonly reason: string;
  /**
   * A round's spend IS measured in dollars, with the provider that served it, and all three are
   * read off the one `spend` object a poll publishes them in rather than found among a bag of
   * statistics. Undefined is what a poll that carried no spend says: unknown, and never zero.
   */
  readonly costUsd: number | undefined;
  readonly provider: string | undefined;
  readonly model: string | undefined;
  /** the reviewer's own figure, off the poll's top level, where time sits apart from money */
  readonly agentDurationMs: number | undefined;
  /**
   * Set when the chronologically last poll came back an error rather than a status — as that
   * answer's SHAPE, never its text, which the tools server's own refusals quote a repository into
   * (ADR-0018). `./run-facts.ts`'s `errorShape` is the whole of what can appear here.
   */
  readonly lastPollError: string | undefined;
  /** which records the polls sit in, so the figures above can be found in the trace */
  readonly where: readonly string[];
}

/** How the run itself ended, read off the task list it kept and its own last words. */
export interface RunEnding {
  readonly kind: "finished" | "stopped" | "unknown";
  /** the stage it stopped in, where a stage can be named */
  readonly stage: string | undefined;
  /** the whole line the debrief prints */
  readonly line: string;
}

/** What the run put to the human, and how long it waited on them. Shape only, never a subject. */
export interface HumanTime {
  readonly questionRounds: number;
  readonly questionsAsked: number;
  /** time between a question round and the human's answer */
  readonly answerWaitMs: number;
  /** turns the human typed inside the run, the opening command excluded */
  readonly typedTurns: number;
  /** time the run sat idle before each of those turns */
  readonly idleWaitMs: number;
  readonly totalWaitMs: number;
  /**
   * When the question this run is **waiting** on was asked, and `undefined` where it is not waiting
   * (the-observation-reports-the-whole-run ticket 03; D5).
   *
   * **Waiting is the run's own last act being a question nobody has answered**, and it is
   * categorically different from a terminal that was killed even though the two are the same thing
   * on disk: nothing is written anywhere while a run waits. The pending question is therefore the
   * only thing that tells them apart, which is why `./observer.ts` reads this rather than the
   * silence — the largest wait measured is 1h56m against an idle bound of half an hour.
   *
   * **One field for both halves of it, and the timestamp is the half that has to be there.** The
   * ceiling D6 puts on one wait is measured from when the question was asked, so a pending question
   * carrying no timestamp is a wait nothing could ever measure out — and this says "not waiting"
   * there rather than suspending the one bound that stops a watcher whose terminal really is gone.
   */
  readonly waitingSince: string | undefined;
}

export interface RunFacts {
  readonly extent: RunExtent;
  /**
   * The plugin skills that produced entries INSIDE the run, in first-seen order.
   *
   * `Trace.skills` is the whole record's and is deliberately left that way — a trace is one
   * session's distillation. This is the run's, and the difference shows where one record holds two
   * runs: a refinement and the delivery the human started five hours later put both skills in the
   * trace, and a debrief naming both would be a document about one run titled after two.
   */
  readonly skills: readonly string[];
  /**
   * The third-party skills this run invoked, by name, in first-seen order
   * (the-observation-reports-the-whole-run ticket 02; D4).
   *
   * Kept apart from `skills` above rather than folded into it, and what reads them is the reason:
   * `runSkills` is what NAMES the run — the debrief's title, the identity file, the one line the
   * human is shown — and that line opens with the plugin's own skill rather than with somebody
   * else's plugin. So these are listed BESIDE the skill in the debrief's header, and nowhere else.
   *
   * **The names and nothing else** (ADR-0018). What those skills did, read or said travels with
   * none of them: a skill's name is the plugin's own machinery, since the plugin's own skill text
   * is what sent the run there, and naming it is what makes 2h48m of a four-hour refinement legible
   * instead of a gap in the document.
   */
  readonly delegatedSkills: readonly string[];
  readonly ending: RunEnding;
  /** the run's own dispatches — never the session's */
  readonly dispatches: readonly TraceDispatch[];
  readonly rounds: readonly RunRound[];
  /** the whole run's tokens: the orchestrator's own and every dispatch's */
  readonly tokens: TokenTotals;
  readonly ownTokens: TokenTotals;
  /**
   * The same two figures in dollars, priced by `./rates.ts`
   * (the-observation-reports-the-whole-run ticket 06; D12 through D18).
   *
   * **The existing split is what gets priced and nothing else** (D18): the whole run, and the
   * orchestrator's own turns within it. No third breakdown and no per-model split — the models that
   * were priced are named beside the figure, which is what lets a reader weigh it, and dividing the
   * dollars among them is a document nobody asked for.
   *
   * `Pricing.usd` is `undefined` where nothing could be priced, which is unknown and never zero, and
   * `unknownModels` is what a model this table has no rate for costs the figure.
   */
  readonly spend: Pricing;
  readonly ownSpend: Pricing;
  readonly human: HumanTime;
  readonly taskUpdates: number;
  readonly toolCalls: number;
  /**
   * What this run's task list opened at, where its first task update carried a count
   * (run-observation ticket 07).
   *
   * **The third continuity state, and the only place it can be read from.** Both skills prefix a
   * task subject with the epic's slug and carry the progress in it — `<slug>: implement every ticket
   * (16/18)` — and the first delivery on the machine this was measured on opened at exactly that,
   * so sixteen tickets were delivered by something no record there holds. Without it a debrief
   * reading "no earlier debriefs" is indistinguishable from a first run.
   *
   * **Only the two counts, never the subject that carried them.** A task's subject past the slug is
   * the user's own domain, and ADR-0018 makes the slug the one thing of it a debrief carries.
   * `undefined` where no task update of this run carried a count at all, which is what a refinement
   * leaves.
   */
  readonly openedAt: { readonly completed: number; readonly total: number } | undefined;
  /** the commit the run's own records name, for `./plugin-commit.ts` to label */
  readonly commitInRecords: string | undefined;
  /**
   * The installed plugin directory those same records name — the tree whose text this run actually
   * ran (run-observation ticket 05).
   *
   * Read off the same match as the commit above, so the two can never name different builds. It is
   * what the synthesis quotes the plugin's own lines from; a run resumed by prose names none, and
   * the judging says so and reads the tree installed now instead.
   */
  readonly pluginDirectoryInRecords: string | undefined;
  /** the repository the run ran in — for the **identity file** alone, never for the debrief */
  readonly repository: string | undefined;
  /** what could not be settled about the run itself, in a reader's words */
  readonly losses: readonly string[];
}

/**
 * The skills to name a RUN by: its own before the record's (ticket 03).
 *
 * `RunFacts.skills` is bounded by the extent and `Trace.skills` is the whole session's, and where
 * one record holds two runs those differ — so everything that names the run this observation is
 * ABOUT reads this, and only the trace's own file names the record's list. Empty where neither has
 * anything, which leaves each caller its own fallback: they differ, and none of them is a skill.
 *
 * **The third-party skills a run delegated to are `RunFacts.delegatedSkills` and never this**
 * (the-observation-reports-the-whole-run ticket 02; D4). This line opens the debrief's title, the
 * identity file's `skill` field and the one line the observer prints when a run ends, and all three
 * are about a run of THIS plugin: a line beginning with somebody else's plugin would read as a
 * debrief of their skill.
 */
export function runSkills(facts: RunFacts, trace: Trace): string {
  return facts.skills.length > 0 ? facts.skills.join(", ") : trace.skills.join(", ");
}

/* ──────────────────────────────────── reading the records ──────────────────────────────────── */

export interface RunFactsInput {
  readonly record: RecordFile;
  readonly dispatchRecords: readonly DispatchRecord[];
  readonly trace: Trace;
}

export function runFactsOf(input: RunFactsInput): RunFacts {
  const entries = input.record.entries;
  const losses: string[] = [];
  // In this order, and the order is the criterion: the extent is settled first, the run's own
  // dispatches are picked out of the session's by it, and only then is anything counted.
  const bounds = boundsOf(entries, losses);
  const window = entries.slice(bounds.firstIndex, bounds.lastIndex + 1);
  const dispatches = dispatchesInRun(entries, window, input.trace, losses);
  const extent = extentOf(bounds, window, dispatches, losses);

  // Grouped once and read twice, as tokens and as dollars (ticket 06; D18). Every dispatch's own
  // dollars were priced where its requests already were, in `./trace.ts`, so nothing here reads a
  // per-dispatch record a second time to get them.
  const ownUsage = requestUsage(window);
  const ownTokens = totalTokens(ownUsage.values());
  const ownSpend = pricingOf(ownUsage.values());
  const spend = dispatches.reduce((total, it) => addPricing(total, it.spend), ownSpend);
  unpricedLoss(spend, losses);
  const rounds = roundsOf(window, dispatches, input.dispatchRecords, losses);

  let taskUpdates = 0;
  let toolCalls = 0;
  let openedAt: RunFacts["openedAt"];
  const delegatedSkills: string[] = [];
  for (const entry of window) {
    for (const block of toolUses(entry)) {
      toolCalls += 1;
      const name = stringField(block, "name") ?? "";
      // Read off the same calls `isOwnSignal` now bounds the run by, so the header names exactly
      // the delegations that kept the extent open (the-observation-reports-the-whole-run ticket
      // 02; D4).
      const delegated = name === "Skill" ? skillInvokedBy(block) : undefined;
      if (delegated !== undefined && !delegatedSkills.includes(delegated)) {
        delegatedSkills.push(delegated);
      }
      if (!TASK_TOOLS.has(name)) continue;
      taskUpdates += 1;
      // The FIRST count wins, exactly as the first slug does in `./trace.ts`: what the run opened
      // at is what a later update cannot move (ticket 07).
      openedAt ??= progressIn(block);
    }
  }

  // Read once: the window is the whole run and a second scan of it buys nothing.
  const plugin = pluginInWindow(window);

  // Last, because both of them compare what is ABOVE against what is on disk: the dispatches this
  // reading settled on and the extent it chose have to exist before either can be checked
  // (the-observation-reports-the-whole-run ticket 05; D10 and D11).
  crossCheckDispatchRecords(input.dispatchRecords, dispatches, entries, bounds, losses);
  crossCheckAttributionOutside(entries, bounds, losses);

  return {
    extent,
    skills: attributionOf(window),
    delegatedSkills,
    ending: endingOf(window),
    dispatches,
    rounds,
    tokens: dispatches.reduce((total, it) => addTokens(total, it.tokens), ownTokens),
    ownTokens,
    spend,
    ownSpend,
    human: humanTimeOf(window),
    taskUpdates,
    toolCalls,
    openedAt,
    // Scanned over the run's own window rather than the whole session: a preamble from somebody
    // else's later skill in the same session is not this run's evidence of anything.
    commitInRecords: plugin?.commit,
    pluginDirectoryInRecords: plugin?.directory,
    repository: window.map((entry) => stringField(entry, "cwd")).find((it) => it !== undefined),
    losses,
  };
}

/**
 * A model this plugin's rate table has no rate for, recorded as a loss
 * (the-observation-reports-the-whole-run ticket 06; D15).
 *
 * **Unknown is the honest answer for a figure nobody could compute, and never zero** — the rule
 * `CONTEXT.md`'s **Spend** already states. So a model id the table has never heard of prices nothing,
 * is named, and says here that the run's dollar figure is short by whatever those requests cost. It
 * is a loss and not a **defect**: nothing about it is something the run cost its human, and it is the
 * reading — this table's own age — that fell short. That is what the losses section is for, and it is
 * where a reader weighing a figure already looks.
 *
 * Named alongside the date, because the date is the actionable half: a table five months stale and a
 * run on a model released last week are the same line, and the reader can tell which they have.
 */
function unpricedLoss(spend: Pricing, losses: string[]): void {
  if (spend.unpricedRequests === 0) return;
  const named = spend.unknownModels.map((it) => `\`${it}\``).join(", ");
  const one = spend.unpricedRequests === 1;
  losses.push(
    `${plural(spend.unpricedRequests, "API request", "API requests")} of this run ` +
      `${one ? "names" : "name"} ` +
      `${spend.unknownModels.length === 1 ? "a model" : "models"} this plugin's rate ` +
      `table has no rate for — ${named} — so ${one ? "it is" : "they are"} priced at nothing and ` +
      `left out of the run's dollar figure, which is short by whatever ${one ? "it" : "they"} ` +
      `cost. The table is dated ${RATES_AS_OF} and comes from ${RATES_SOURCE}: a model released ` +
      `after that date, or one that source prices nowhere, is what this means`,
  );
}

/**
 * The progress a task subject carries, as its two counts and nothing else (ticket 07).
 *
 * Both skills write `<slug>: implement every ticket (4/21)`, checked against every run on the
 * machine this was measured on, refinements and deliveries alike. The subject itself never leaves
 * this function: past the slug it is the repository's own domain (ADR-0018). A subject with no
 * count — every one a refinement writes — is `undefined` and not a zero.
 */
function progressIn(block: JsonObject): RunFacts["openedAt"] {
  const subject = stringField(objectField(block, "input"), "subject");
  const match = subject === undefined ? null : /\((\d+)\/(\d+)\)/.exec(subject);
  if (match?.[1] === undefined || match[2] === undefined) return undefined;
  return { completed: Number(match[1]), total: Number(match[2]) };
}

/**
 * The skill one `Skill` call invoked, as a name and nothing else
 * (the-observation-reports-the-whole-run ticket 02; D4).
 *
 * **Only the name is read, and only where it is name-shaped.** The call's other input is the
 * argument the run passed the skill, which is the run's own words about somebody's repository and
 * may not reach a document a human forwards unread (ADR-0018) — so nothing here goes near it, and
 * a `skill` field carrying anything but a name is dropped rather than printed. Which field the host
 * puts that name in is a claim like every other shape in these records: `skill` on the version this
 * was written against, `command` on the ones that named it that. A call whose name matches neither
 * still bounds the run — `isOwnSignal` needs the tool's own name and no more — and costs the
 * header a line instead.
 *
 * The plugin's own skills are excluded: `runSkills` already names the one the run IS, and D4's
 * whole point is the two lists being distinct.
 */
function skillInvokedBy(block: JsonObject): string | undefined {
  const input = objectField(block, "input");
  const named = (stringField(input, "skill") ?? stringField(input, "command") ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9:_./-]{0,63}$/.test(named)) return undefined;
  if (named === PLUGIN_NAME || named.startsWith(`${PLUGIN_NAME}:`)) return undefined;
  return named;
}

/* ─────────────────────────────────────── the extent ─────────────────────────────────────── */

interface RunBounds {
  readonly command: string | undefined;
  readonly firstIndex: number;
  readonly lastIndex: number;
  readonly boundedBy: string;
  readonly total: number;
  /**
   * Where a second `/deliverer:` command starts a second run, and `undefined` where none does
   * (the-observation-reports-the-whole-run ticket 05; D10).
   *
   * Carried rather than read back off `boundedBy`, because the second cross-check below has to know
   * that the tail of this record is ANOTHER run's and `boundedBy` is prose that step 3 may have
   * replaced by then. A line a reader is shown is not a fact another reader may turn on.
   */
  readonly secondRunAt: number | undefined;
}

/**
 * Where the run starts and where it stops, as positions in the session's own record.
 *
 * The start is the `/deliverer:` command. The far end is found in three steps, because no one of
 * them is right on its own:
 *
 *  1. **A ceiling, past which nothing is ever this run's.** Closed by a second `/deliverer:`
 *     command — one record can hold two runs and one debrief may only be about one of them — and by
 *     the first turn the human typed after the run's last signal that is identifiably the RUN's.
 *     Both are computed before anything else, because a scan that runs to the end of the record
 *     first can land past either of them and then a cut applied afterwards has nothing left to cut.
 *  2. **The last entry inside that ceiling that is mechanically the run's** — an attributed entry, a
 *     dispatch, a question round, a review poll, a task update, or the answer to one of those.
 *  3. **Forward through whatever the orchestrator wrote after it**, up to the first turn the human
 *     typed. That is what keeps a finished run's closing **report** inside the run.
 *
 * **Step 1 is where the two strengths of signal matter, and the difference is the whole of the
 * bound.** Deliverer attribution, a call to the plugin's own review tools, a dispatch of one of the
 * plugin's own agents and a `Skill` call the run itself made are the run's and nothing else's —
 * the fourth of them added by the-observation-reports-the-whole-run ticket 02, for the reason
 * `isOwnSignal` carries. `Agent`, `AskUserQuestion`, `TaskCreate`
 * and `TaskUpdate` are host built-ins that any later work in the same session makes too, so they
 * say a run is proceeding but cannot tell its continuation from somebody else's next afternoon —
 * which is why step 2 trusts them inside a ceiling the run's own signals set, and never to set it.
 */
function boundsOf(entries: readonly JsonObject[], losses: string[]): RunBounds {
  let firstIndex = 0;
  let command: string | undefined;
  for (const [index, entry] of entries.entries()) {
    const named = OWN_COMMAND.exec(typedText(entry) ?? "");
    if (named?.[1] === undefined) continue;
    firstIndex = index;
    command = named[1];
    break;
  }
  if (command === undefined) {
    // D22 covers a run resumed by prose, and it has no command to be found. The first entry
    // carrying deliverer attribution is the earliest thing that is certainly the run's; failing
    // even that, the record's own start, which is the widest honest answer rather than a guess.
    const attributed = entries.findIndex(
      (entry) => stringField(entry, "attributionPlugin") === "deliverer",
    );
    firstIndex = attributed === -1 ? 0 : attributed;
    losses.push(
      "no `/deliverer:` command is in this record, so the run was resumed by prose rather than " +
        "typed: it is bounded from the first entry carrying deliverer attribution instead, which " +
        "may take in a turn or two of the session before it",
    );
  }

  // ── step 1: the ceiling ──
  // A second `/deliverer:` command starts a second run, and merging the two reports the gap between
  // them as time the plugin took from its human: a refinement at 09:00 and a delivery at 14:00 read
  // as one 5h30m run whose 4h57m of that is nobody's doing. Only the first is this debrief's.
  let ceiling = entries.length;
  let ceilingReason = "the session's record ends there";
  const second = indexOfOwnCommand(entries, firstIndex + 1);
  if (second !== undefined) {
    ceiling = second;
    ceilingReason = "another `/deliverer:` command starts a second run there";
    losses.push(
      "another `/deliverer:` command was typed later in this same record, so the record holds " +
        "more than one run: this debrief is about the first of them, and everything from that " +
        "command on — its dispatches, its rounds, its tokens and the time between the two — is " +
        "outside it",
    );
  }
  // The first turn the human typed after the run's last signal of its OWN. Step 2 below reads host
  // built-ins as well, and those are true of the human's unrelated work the next afternoon: with no
  // ceiling here, one `TaskCreate` in that work pulls the far end a day past the turn that ended the
  // run, and the wall clock, both human-time figures, the dispatch count, the tokens and the ending
  // all go with it — the "far too long" failure this module opens by naming.
  let lastOwn = firstIndex;
  for (let index = firstIndex; index < ceiling; index += 1) {
    if (isOwnSignal(entries[index] ?? {})) lastOwn = index;
  }
  for (let index = lastOwn + 1; index < ceiling; index += 1) {
    if (typedText(entries[index] ?? {}) === undefined) continue;
    ceiling = index;
    ceilingReason = "the human typed something else next, and what follows is work of their own";
    break;
  }

  // ── step 2: the last entry inside the ceiling that is mechanically the run's ──
  const raised = new Set<string>();
  let lastSignal = firstIndex;
  for (let index = firstIndex; index < ceiling; index += 1) {
    const entry = entries[index];
    if (entry === undefined) continue;
    if (stringField(entry, "attributionPlugin") === "deliverer") lastSignal = index;
    for (const block of toolUses(entry)) {
      const name = stringField(block, "name") ?? "";
      const id = stringField(block, "id");
      const machinery =
        name === "Agent" || name === "AskUserQuestion" || TASK_TOOLS.has(name) || isReviewTool(name);
      if (machinery) {
        lastSignal = index;
        if (id !== undefined) raised.add(id);
      }
    }
    for (const block of contentBlocks(objectField(entry, "message"))) {
      const answers = stringField(block, "tool_use_id");
      if (answers !== undefined && raised.has(answers)) lastSignal = index;
    }
    // A dispatch launched in the background reports back as a `<task-notification>` carrying the
    // tool-use id of the `Agent` call that started it, so it is the run's however late it lands.
    const content = stringField(entry, "content");
    const notified =
      content === undefined ? null : /<tool-use-id>([^<]+)<\/tool-use-id>/.exec(content);
    if (notified?.[1] !== undefined && raised.has(notified[1])) lastSignal = index;
  }

  // ── step 3: forward through what the orchestrator wrote after it ──
  let lastIndex = ceiling - 1;
  let boundedBy = ceilingReason;
  for (let index = lastSignal + 1; index < ceiling; index += 1) {
    if (typedText(entries[index] ?? {}) === undefined) continue;
    lastIndex = index - 1;
    boundedBy = "the human typed something else next, and what follows is work of their own";
    break;
  }
  return { command, firstIndex, lastIndex, boundedBy, total: entries.length, secondRunAt: second };
}

/** The plugin's own commands, as the host writes one into the prompt that ran it. */
const OWN_COMMAND = /<command-name>(\/deliverer:[a-z0-9-]+)<\/command-name>/;

/** Where the next `/deliverer:` command the human typed sits, at or after `from`. */
function indexOfOwnCommand(entries: readonly JsonObject[], from: number): number | undefined {
  for (let index = Math.max(from, 0); index < entries.length; index += 1) {
    if (OWN_COMMAND.test(typedText(entries[index] ?? {}) ?? "")) return index;
  }
  return undefined;
}

/**
 * The agents the plugin ships, as a dispatch's `subagent_type` names them.
 *
 * A dispatch of one of these is the run's and nothing else's, which is what lets the ceiling above
 * trust it where it cannot trust a bare `Agent` call. Matched with the plugin's prefix and without,
 * because how far the host qualifies an agent's name depends on the install — a claim, like every
 * other shape read out of these records.
 */
const OWN_AGENTS = new Set([
  "assumption-reviewer",
  "change-request-creator",
  "code-reviewer",
  "comments-addresser",
  "implementer",
  "spec-writer",
  "tickets-writer",
]);

/**
 * Whether one entry carries a signal that is the RUN's rather than the session's.
 *
 * **Four signals, and the fourth is a `Skill` call the run made**
 * (the-observation-reports-the-whole-run ticket 02; D1). The plugin's own skill text is what sends
 * a run into a third-party skill — `plugin/skills/refine/SKILL.md` tells stage 1 to invoke
 * `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling` — and the host then
 * re-attributes every entry underneath that skill to THAT plugin. So on the run this was measured
 * against, deliverer attribution stopped at entry 44, entries 55 to 270 carried
 * `attributionPlugin: mattpocock-skills`, and the next signal the three below could see was the
 * `spec-writer` dispatch 2h48m later: the ceiling closed on the idea the human typed at 09:11:29
 * — which the run's own first question had asked them for — and the extent froze at 1m38s, taking
 * the dispatch count, the question rounds and 98.4% of the token spend with it. The time a run
 * spends inside a skill its own instructions named is the plugin's business, so it is in the
 * extent.
 *
 * **Any skill counts, and no list of the ones the plugin's own skills name is kept.** Such a list
 * would go stale the moment a skill's text changed, in the one direction nobody would notice —
 * the extent quietly freezing again. What bounds the over-reach instead is the ceiling itself
 * (D2): a new piece of a human's own work always begins with a turn they typed, and that closes it,
 * which is why the same measured record leaves the human's own `claude-api` work at 13:20 outside
 * the run.
 *
 * **The one shape that argument does not cover, and it is left standing knowingly:** a human's own
 * later work in the same session that itself invokes a skill. That call is one of these signals
 * too, so it moves the last own signal PAST the turn they typed and the ceiling no longer closes
 * there — walked on a synthetic record of the measured shape, a 4h03m run read 5h20m once the
 * human's own later work called `Skill`. Nothing here guards it, because in the record the two
 * shapes are the same shape: the measured run's own delegation also follows a turn the human typed
 * — the idea its first question asked for — which is exactly why D3 declines an exemption for that
 * turn. A reading that took a human's own work into the extent is what D10's cross-check is for.
 *
 * **None of this is evidence that a session holds a run at all.** Whether one does is
 * `attributionOf`'s question and stays deliverer attribution's alone: a `Skill` call widens where a
 * run already found STOPS, and were it ever allowed to answer the other question, every session on
 * the machine that used any skill would produce a debrief.
 */
function isOwnSignal(entry: JsonObject): boolean {
  if (stringField(entry, "attributionPlugin") === "deliverer") return true;
  for (const block of toolUses(entry)) {
    const name = stringField(block, "name") ?? "";
    if (isReviewTool(name)) return true;
    if (name === "Skill") return true;
    if (name !== "Agent") continue;
    const type = stringField(objectField(block, "input"), "subagent_type") ?? "";
    if (OWN_AGENTS.has(type.startsWith("deliverer:") ? type.slice("deliverer:".length) : type)) {
      return true;
    }
  }
  return false;
}

/** The run's window as a wall clock, once its own dispatches are known. */
function extentOf(
  bounds: RunBounds,
  window: readonly JsonObject[],
  dispatches: readonly TraceDispatch[],
  losses: string[],
): RunExtent {
  const stamps: string[] = [];
  for (const entry of window) {
    const at = stringField(entry, "timestamp");
    if (at === undefined) continue;
    // A `queue-operation` is written when a prompt is QUEUED, which for the prompt that ends a run
    // is after the run is over: one delivery on disk carries two of them stamped the next
    // afternoon, ahead of entries stamped the night before. Taking the plain maximum there reports
    // a 10h18m run as 20h24m. The ones that carry a task notification are the run's own and stay.
    const isQueue = stringField(entry, "type") === "queue-operation";
    if (isQueue && !(stringField(entry, "content") ?? "").includes("<task-notification>")) continue;
    stamps.push(at);
  }
  const startedAt = stamps[0];
  // A dispatch can outlive the record of the run that started it — one refinement on disk has an
  // agent still writing 26 minutes after its orchestrator's last entry — so "the last entry it or
  // any of its dispatches left" is the maximum of both and not of the run's own record alone.
  const endedAt = [...stamps, ...dispatches.map((it) => it.endedAt)]
    .filter((it): it is string => it !== undefined)
    .sort()
    .at(-1);
  if (startedAt === undefined) {
    losses.push("no entry inside the run carries a timestamp, so the run has no wall clock");
  }

  return {
    command: bounds.command,
    startedAt,
    endedAt,
    durationMs: elapsed(startedAt, endedAt),
    firstEntry: bounds.firstIndex + 1,
    lastEntry: bounds.lastIndex + 1,
    entriesOutside: bounds.firstIndex + (bounds.total - 1 - bounds.lastIndex),
    boundedBy: bounds.boundedBy,
  };
}

/* ─────────────────────────────────────── the dispatches ─────────────────────────────────────── */

/**
 * The run's own dispatches: those whose `Agent` call is inside the run.
 *
 * Three cases, and the middle one is why this exists. A dispatch the run itself started is kept. A
 * dispatch that some LATER work in the same session started — the human's own next afternoon — is
 * dropped, because a dispatch count that took the session's would be the same mistake as a wall
 * clock that did. And a dispatch record that no `Agent` call anywhere claims is kept, because
 * dropping it would lose a whole stage; ticket 02's trace already records that one as a loss of
 * its own, so nothing here says it a second time.
 */
function dispatchesInRun(
  entries: readonly JsonObject[],
  window: readonly JsonObject[],
  trace: Trace,
  losses: string[],
): readonly TraceDispatch[] {
  const anywhere = agentCallsIn(entries);
  const inRun = agentCallsIn(window);
  const kept: TraceDispatch[] = [];
  for (const dispatch of trace.dispatches) {
    const id = dispatch.toolUseId;
    if (id !== undefined && inRun.has(id)) {
      kept.push(dispatch);
      continue;
    }
    if (id !== undefined && anywhere.has(id)) {
      losses.push(
        `dispatch #${dispatch.ordinal} (${dispatch.agentType}) is in this session's record but ` +
          `outside the run, so nothing here counts it`,
      );
      continue;
    }
    kept.push(dispatch);
  }
  return kept;
}

function agentCallsIn(entries: readonly JsonObject[]): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    for (const block of toolUses(entry)) {
      const id = stringField(block, "id");
      if (stringField(block, "name") === "Agent" && id !== undefined) ids.add(id);
    }
  }
  return ids;
}

/* ─────────────────────────── the reading's own cross-checks ─────────────────────────── */

/**
 * Two comparisons of what this reading says against what is on disk beside it
 * (the-observation-reports-the-whole-run ticket 05; D10 and D11).
 *
 * **What they are for, in the shape of the reading that would have been caught.** One
 * `/deliverer:refine` run of 3h50m, two **dispatch**es and eight question **round**s was reported by
 * its **debrief** as `1m38s · 0 dispatches · 1 question round`, and it read its own figures back as
 * ordinary: *"no review round was started, which is what a refinement looks like"*. While it said
 * that, `agent-*.jsonl` records with `.meta.json` sidecars naming `deliverer:spec-writer` and
 * `deliverer:tickets-writer` were sitting in the very directory `./records.ts` reads, and 226 entries
 * carrying the run's own attribution were sitting outside the **extent** it had chosen. Neither fact
 * costs a model call to notice, and nothing was looking at either.
 *
 * **They are losses and never a defect** (D11). A **defect** is one thing the run cost its human;
 * these are faults in the READING, so they belong where an observation already records what it lost
 * — which is where a reader weighing a figure already looks. And never a **hunch** either: a hunch
 * is what nothing kept can ground, and each of these carries the file name or the entry count that
 * grounds it.
 *
 * **Neither may claim that what it found is the run's**, because in both cases it honestly may not
 * be:
 *
 *  - a human dispatches agents of their own in the same session, and the host puts those records in
 *    the same `subagents/` directory — so a file this cannot place is a file it cannot place;
 *  - a record holding two runs is bounded at the second `/deliverer:` command on purpose, and the
 *    entries past it carry the run's own attribution while being correctly outside THIS debrief's
 *    extent. `boundsOf` already records that as a loss of its own, and the second check is silent
 *    there rather than repeating a rule working as designed as a fault.
 *
 * **Both run wherever a reading does.** They are here, in the pure pass every **replay** and every
 * live **observer** rewrite goes through, so the facts-only path gets them too and for nothing — an
 * observation that nothing judged is exactly the one whose reading nobody checked.
 *
 * **One shape neither of them reaches, measured and reported rather than guessed at.** Ticket 02
 * left a human's own later work standing where that work itself invokes a skill: the `Skill` call is
 * one of the run's own signals, so it moves the last own signal past the turn the human typed and
 * step 1's ceiling no longer closes there — a 4h03m run read 5h20m on the record ticket 02 walked,
 * with the human's own `claude-api` work INSIDE the extent. D10's two checks both look the other way:
 * the second counts entries the extent left OUT, and a swallowed stretch is the opposite of that,
 * while the first looks for a record nothing places, and an agent the human dispatched inside a
 * widened extent is placed — as one of the run's, which is the error itself. Walked on a synthetic
 * record of that shape: 0 entries outside the extent, the human's own dispatch counted as the run's
 * third, and not one loss between the two checks. Catching it would take a rule about entries INSIDE
 * the extent, which is the exemption D3 declined; the honest state of it is that D10 does not cover
 * it and this comment is where a reader finds that out.
 */

/**
 * Check one: dispatch record files beside the run's own record that its account places nowhere.
 *
 * **What "places" means here, and the one case deliberately left out.** A record this reading
 * attributed to the run is placed — it is in the dispatch count, in the tally and in the trace. A
 * record that NO `Agent` call anywhere claims is also placed: `dispatchesInRun` keeps it rather than
 * lose a whole stage, and `./trace.ts` already writes the loss saying it was traced last rather than
 * in its place. Saying that again here would be a second line about a file the reader has already
 * been told about, and it would be untrue as well — the reading does account for that one.
 *
 * What is left is the case the measured debrief was in: a file whose `Agent` call this reading put
 * OUTSIDE the run, so no figure above counts it. `dispatchesInRun`'s own loss names that dispatch by
 * ordinal and agent type; this one names the FILE, off the directory rather than off the record,
 * which is the comparison D10 asks for and the one that still holds where the two disagree about how
 * many files are even there.
 *
 * **A second run's own dispatch records are not reported either** (D10, as the second check reads
 * it). Where the ceiling closed on a second `/deliverer:` command, the records that command's run
 * left are in this same directory and this reading places them outside the run — deliberately, and
 * `boundsOf`'s loss already says that everything from that command on, its dispatches among them, is
 * outside this extent. A refinement followed by a delivery in one session is the ordinary shape of
 * that, and a delivery dispatches thirteen times.
 *
 * **The agent type travels only where it is one of the plugin's own** (ADR-0018). A file this cannot
 * place is as likely to be an agent the human wrote as one of ours, and a user-defined agent's type
 * is a name out of their own domain — the one thing a document that is safe to forward unread may
 * not carry. Naming it where it IS one of ours is also the more useful half: that is the file most
 * likely to be a stage of this run.
 */
function crossCheckDispatchRecords(
  records: readonly DispatchRecord[],
  dispatches: readonly TraceDispatch[],
  entries: readonly JsonObject[],
  bounds: RunBounds,
  losses: string[],
): void {
  // The `Agent` calls the SECOND run made, where there is one — read through the same reader
  // `dispatchesInRun` picks the run's own dispatches with, so the two can never disagree about what
  // an `Agent` call is.
  const secondRun =
    bounds.secondRunAt === undefined
      ? new Set<string>()
      : agentCallsIn(entries.slice(bounds.secondRunAt));
  const placed = new Set<string>();
  for (const dispatch of dispatches) {
    // Both, because a dispatch reaches its record two ways: its sidecar's `toolUseId` linked it, or
    // its tool result named the agent id where no sidecar did.
    if (dispatch.agentId !== undefined) placed.add(dispatch.agentId);
    if (dispatch.recordPath !== undefined) placed.add(dispatch.recordPath);
  }
  const unplaced = records.filter((record) => {
    if (placed.has(record.agentId) || placed.has(record.file.path)) return false;
    const claimedBy = record.sidecar?.toolUseId;
    return claimedBy === undefined || !secondRun.has(claimedBy);
  });
  if (unplaced.length === 0) return;
  const named = unplaced.map(
    (record) => `\`${basename(record.file.path)}\` (${sidecarClause(record)})`,
  );
  const one = unplaced.length === 1;
  losses.push(
    `${plural(unplaced.length, "dispatch record file sits", "dispatch record files sit")} in the ` +
      `directory beside this run's own record that nothing in this debrief's account of the run ` +
      `places: ${named.join(", ")} — this reading cannot place ${one ? "it" : "them"} and does not ` +
      `claim ${one ? "it is" : "they are"} the run's, since a human dispatches agents of their own ` +
      `in the same session and the host puts those records in this same directory; where one of ` +
      `them was a stage of this run, the dispatch count above is short by that much`,
  );
}

/** What the sidecar beside an unplaceable record says, as far as this document may carry it. */
function sidecarClause(record: DispatchRecord): string {
  const named = record.sidecar?.agentType;
  if (named === undefined) return "no sidecar beside it names an agent";
  const bare = named.startsWith(`${PLUGIN_NAME}:`) ? named.slice(PLUGIN_NAME.length + 1) : named;
  return OWN_AGENTS.has(bare)
    ? `its sidecar names \`${named}\`, one of this plugin's own agents`
    : "its sidecar names an agent that is not one of this plugin's own";
}

/**
 * Check two: entries carrying the run's own attribution that the extent leaves out.
 *
 * **The reading it would have caught is the frozen extent.** The measured refinement's own
 * attribution ran to entry 44 while its extent stopped at the idea the human typed at 09:11:29 —
 * 1m38s of a 3h50m run — and every figure in that debrief was of the extent, so each of them was
 * missing whatever those entries carried. The extent was reported as the run, and a short run and a
 * truncated reading of a long one read identically. Ticket 02 fixed the cause; this is what says so
 * if it ever comes back, at the cost of one pass over entries the reading has already read.
 *
 * **Attribution, and never `isOwnSignal`.** A `Skill` call is one of the run's own signals and is
 * emphatically not evidence that an entry is the run's — a human's own later work makes those too,
 * which `isOwnSignal`'s own last paragraph is about — so counting them here would report a human's
 * afternoon as the run's lost entries. Deliverer attribution is the one signal that is the run's and
 * nobody else's.
 *
 * **Silent where a second `/deliverer:` command closed the ceiling** (D10). Those entries are the
 * SECOND run's: they carry this plugin's attribution, they are correctly outside this debrief's
 * extent, and `boundsOf` has already recorded that the record holds more than one run. Without this
 * every two-run record would carry a line saying the reading went wrong where it did exactly what it
 * was built to do — walked, and the measured shape of it is three entries reported as lost.
 */
function crossCheckAttributionOutside(
  entries: readonly JsonObject[],
  bounds: RunBounds,
  losses: string[],
): void {
  let before = 0;
  let after = 0;
  for (const [index, entry] of entries.entries()) {
    if (index >= bounds.firstIndex && index <= bounds.lastIndex) continue;
    if (bounds.secondRunAt !== undefined && index >= bounds.secondRunAt) continue;
    if (stringField(entry, "attributionPlugin") !== PLUGIN_NAME) continue;
    if (index < bounds.firstIndex) before += 1;
    else after += 1;
  }
  const outside = before + after;
  if (outside === 0) return;
  losses.push(
    `${plural(outside, "entry", "entries")} of this session's record ` +
      `${outside === 1 ? "carries" : "carry"} this plugin's own attribution and ` +
      `${outside === 1 ? "lies" : "lie"} outside the extent this reading chose — ${before} before ` +
      `it and ${after} after it, against an extent of entries ${bounds.firstIndex + 1}–` +
      `${bounds.lastIndex + 1} of ${bounds.total} — so the extent stops short of the run somewhere: ` +
      `every figure in this debrief is of the extent, and each of them is missing whatever those ` +
      `entries carry` +
      (bounds.secondRunAt === undefined
        ? ""
        : `. Entries from the second \`/deliverer:\` command on are not counted here: they are that ` +
          `run's, correctly outside this one, and the loss above says so`),
  );
}

/** "1 entry", "13 entries" — never a figure with a slash in it, in a document a human forwards. */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/* ──────────────────────────────────────── the rounds ──────────────────────────────────────── */

interface PollEvent {
  readonly at: string;
  readonly reviewId: string;
  readonly where: string;
  /** the call itself, or what came back from it — a round's poll COUNT is the calls alone */
  readonly kind: "call" | "answer";
  readonly payload: JsonObject | undefined;
  readonly error: string | undefined;
}

function roundsOf(
  window: readonly JsonObject[],
  dispatches: readonly TraceDispatch[],
  dispatchRecords: readonly DispatchRecord[],
  losses: string[],
): readonly RunRound[] {
  const byAgentId = new Map(dispatchRecords.map((record) => [record.agentId, record]));
  const events: PollEvent[] = [...pollsIn(window, "the run's own record")];
  for (const dispatch of dispatches) {
    const record = dispatch.agentId === undefined ? undefined : byAgentId.get(dispatch.agentId);
    if (record === undefined) continue;
    events.push(
      ...pollsIn(record.file.entries, `dispatch #${dispatch.ordinal} ${dispatch.agentType}`),
    );
  }
  // Sorted by the poll's own timestamp across BOTH records, because "how the round ended" is the
  // last poll's word and the last poll is not always the one in the record read last: one
  // delivery's first round was cancelled from the run's own record long after its dispatch had
  // stopped polling, and reading the dispatch last would report that round as still running.
  events.sort((left, right) => (left.at < right.at ? -1 : left.at > right.at ? 1 : 0));

  const order: string[] = [];
  const grouped = new Map<string, PollEvent[]>();
  for (const event of events) {
    const held = grouped.get(event.reviewId);
    if (held === undefined) {
      order.push(event.reviewId);
      grouped.set(event.reviewId, [event]);
    } else held.push(event);
  }

  const rounds: RunRound[] = [];
  for (const reviewId of order) {
    const polls = grouped.get(reviewId) ?? [];
    const reported = polls.filter((it) => stringField(it.payload, "status") !== undefined).at(-1);
    // The money is under `spend`, the ONE key a poll puts it under, and the time inside the
    // reviewer sits at the top level beside it — time is not spend. There is no fallback to the
    // `stats` bag these three used to arrive in: a record written before that change holds the
    // figures under the old name and this reports that round's spend as unknown, which is the
    // consequence the spec accepted rather than a defect to chase, and reading both names would
    // keep a shape the product no longer has alive in the one reader of it
    // (a-poll-says-what-it-knows D23).
    const spend = objectField(reported?.payload, "spend");
    const last = polls.filter((it) => it.kind === "answer").at(-1);
    rounds.push({
      reviewId,
      polls: polls.filter((it) => it.kind === "call").length,
      startedAt: polls[0]?.at,
      lastPollAt: last?.at,
      status: stringField(reported?.payload, "status"),
      // A poll omits the reason a healthy round has no need of, so absent and empty are the same
      // answer here: no reason to print.
      reason: stringField(reported?.payload, "reason") ?? "",
      costUsd: numberField(spend, "costUsd"),
      provider: stringField(spend, "provider"),
      model: stringField(spend, "model"),
      agentDurationMs: numberField(reported?.payload, "agentDurationMs"),
      lastPollError: last?.error,
      where: [...new Set(polls.map((it) => it.where))],
    });
    if (reported === undefined) {
      losses.push(
        `no poll of round ${reviewId} came back with a status, so how it ended is not in these ` +
          `records`,
      );
    }
  }
  return rounds;
}

/** Every call to the plugin's own review tools in one record, with what it came back with. */
function pollsIn(entries: readonly JsonObject[], where: string): readonly PollEvent[] {
  const calls = new Map<string, string>();
  const events: PollEvent[] = [];
  for (const entry of entries) {
    const at = stringField(entry, "timestamp") ?? "";
    for (const block of toolUses(entry)) {
      const name = stringField(block, "name") ?? "";
      const id = stringField(block, "id");
      if (!isReviewTool(name) || id === undefined) continue;
      // Every one of the three tools takes `review_id`, so the id a poll is about is read off the
      // call rather than inferred from what came back — which is what lets a poll whose result was
      // an error still be counted against its round.
      const reviewId = stringField(objectField(block, "input"), "review_id") ?? "unknown-review";
      calls.set(id, reviewId);
      events.push({ at, reviewId, where, kind: "call", payload: undefined, error: undefined });
    }
    for (const block of contentBlocks(objectField(entry, "message"))) {
      const id = stringField(block, "tool_use_id");
      const reviewId = id === undefined ? undefined : calls.get(id);
      if (reviewId === undefined) continue;
      const text = resultText(block);
      const payload = parseObject(text);
      events.push({
        at,
        reviewId,
        where,
        kind: "answer",
        payload,
        // A poll the server refused — an id it has no review for, a review already finished — is
        // not a status, and reading one as the round's end would report prose as a verdict.
        //
        // **Its SHAPE and never its text** (ADR-0018). The tools server's own refusals quote what
        // they refused — `change_request_url is not a URL: "<the forge URL>"`, `cwd does not exist:
        // "<the delivery repository's path>"`, and any unhandled error's message — and a round
        // whose `code_review_start` failed validation has exactly one call and one answer, so that
        // refusal IS the round's last poll and would reach the debrief verbatim. That is the
        // CODE's own output rather than the model's, so it is not the risk ADR-0018 accepts: the
        // text stays in the **trace**, where the same rule already puts everything the repository
        // touched, and what travels from here is that a poll came back and how much of it there
        // was.
        error: payload === undefined ? errorShape(text, block) : undefined,
      });
    }
  }
  return events;
}

/**
 * A refused poll described without quoting it: whether the host flagged it an error, and its size.
 *
 * Enough for a maintainer to tell a server refusal from a transport failure and to find the text
 * itself in the trace at the same timestamp, and bounded by construction — every character of it is
 * this function's own or a digit.
 */
function errorShape(text: string, block: JsonObject): string {
  const flagged = block["is_error"] === true;
  return (
    `${flagged ? "the host flagged it an error" : "it carried no status"}, ` +
    `${text.trim().length} characters that are not the JSON a poll returns — the text itself is ` +
    `in the trace, at this poll's own timestamp`
  );
}

function resultText(block: JsonObject): string {
  const content = block["content"];
  if (typeof content === "string") return content;
  let text = "";
  for (const inner of Array.isArray(content) ? content : []) {
    text += stringField(asObject(inner), "text") ?? "";
  }
  return text;
}

function parseObject(text: string): JsonObject | undefined {
  try {
    return asObject(JSON.parse(text));
  } catch {
    return undefined;
  }
}

/* ──────────────────────────────────── how the run ended ──────────────────────────────────── */

/**
 * Whether the run finished or stopped, and the stage it stopped in.
 *
 * Read off the task list the orchestrator keeps — **one stage, one task** is both skills' own rule
 * — and off whether the run said anything after its last stage. A task left `in_progress` names
 * the stage outright; a run that completed at least one stage and closed with prose of its own
 * finished; anything else stopped where the record does, which is the run most worth reporting and
 * the one with no **report** to say so itself (ADR-0018).
 *
 * **`finished` is a claim about what the records hold, so it is counted and never inferred from the
 * absence of the other cases.** A run that laid out its task list and was killed before the first
 * update has nothing `in_progress` and closes with the words it laid the list out in — which used
 * to read `finished`, in the one place a debrief must never be wrong: `kind` is what the observer's
 * headline prints and what the synthesis is told the run's outcome was.
 */
function endingOf(window: readonly JsonObject[]): RunEnding {
  const subjects = new Map<string, string>();
  const states = new Map<string, string>();
  let created = 0;
  let lastCompleted: string | undefined;
  // Counted rather than assumed: `TaskCreate` seeds a task at `created` and nothing but a
  // `TaskUpdate` moves it, so a run whose task list was laid out and never updated has no stage
  // that ended anything. Without this the `finished` branch below asserted a completion no record
  // holds — and `ending.kind` is what the observer's headline prints and what the synthesis is
  // told, so an interrupted run read to the model as a clean one.
  let completed = 0;
  for (const entry of window) {
    for (const block of toolUses(entry)) {
      const name = stringField(block, "name") ?? "";
      if (!TASK_TOOLS.has(name)) continue;
      const call = objectField(block, "input");
      if (name === "TaskCreate") {
        created += 1;
        // The host numbers tasks in creation order from 1, and `TaskUpdate` names that number.
        // A claim like every other shape here: a task whose id does not match keeps its own line.
        subjects.set(String(created), stringField(call, "subject") ?? "");
        states.set(String(created), "created");
        continue;
      }
      const id = stringField(call, "taskId");
      const status = stringField(call, "status");
      if (id === undefined || status === undefined) continue;
      const was = states.get(id);
      states.set(id, status);
      if (status === "completed") {
        if (was !== "completed") completed += 1;
        lastCompleted = subjects.get(id) ?? id;
      } else if (was === "completed") completed -= 1;
    }
  }

  const open = [...states.entries()].filter(([, status]) => status === "in_progress").at(-1);
  const closedWithProse = lastWordOf(window) === "prose";
  if (open !== undefined) {
    const stage = subjects.get(open[0]) ?? open[0];
    return {
      kind: "stopped",
      stage,
      line:
        `**stopped** in \`${stage}\`: that stage was still in progress when its record ends, ` +
        `and no later stage was ever started.`,
    };
  }
  if (created === 0) {
    return {
      kind: "unknown",
      stage: undefined,
      line:
        "**unknown**: the run created no task list, so there is no stage to name. " +
        (closedWithProse
          ? "It did close with words of its own."
          : "It does not close with words of its own either."),
    };
  }
  if (closedWithProse && completed > 0) {
    return {
      kind: "finished",
      // No stage: `stage` is the stage a run stopped IN, and `./judge.ts` renders it as "ended
      // finished in `<stage>`", which would name the last one completed as though it were where the
      // run got stuck.
      stage: undefined,
      line:
        `**finished**: ${completed} of its ${created} stages ended completed, none was left in ` +
        `progress, and it closed with a report of its own.`,
    };
  }
  if (closedWithProse) {
    // The task list was created and never updated. It closed with words of its own, which is why it
    // is not the `stopped` line below — that one names a stage that completed, and none did.
    return {
      kind: "stopped",
      stage: undefined,
      line:
        `**stopped**: none of its ${created} stages was ever marked completed — the task list was ` +
        `laid out and no update to it followed — though it did close with words of its own.`,
    };
  }
  return {
    kind: "stopped",
    stage: lastCompleted,
    line:
      `**stopped** after \`${lastCompleted ?? "its last stage"}\`: that stage completed, nothing ` +
      `was started after it, and the run never closed with a report of its own.`,
  };
}

/** What the last thing in the run was: the orchestrator's own words, or work left mid-flight. */
function lastWordOf(window: readonly JsonObject[]): "prose" | "mid-flight" {
  for (let index = window.length - 1; index >= 0; index -= 1) {
    const entry = window[index];
    const type = stringField(entry, "type");
    if (type !== "assistant" && type !== "user") continue;
    if (type === "user") return "mid-flight";
    for (const block of contentBlocks(objectField(entry, "message"))) {
      if (stringField(block, "type") === "text" && (stringField(block, "text") ?? "") !== "") {
        return "prose";
      }
    }
    return "mid-flight";
  }
  return "mid-flight";
}

/* ─────────────────────────────────── the human's own time ─────────────────────────────────── */

/** One `AskUserQuestion` and where it sits, for the waiting test below (ticket 03; D5). */
interface PendingQuestion {
  readonly id: string;
  readonly at: string | undefined;
  /** into the run's own window, so "the run wrote nothing after it" is a walk of the tail alone */
  readonly index: number;
}

/**
 * How many question rounds the run put to the human and how long it waited on them.
 *
 * Two waits, and only one of them is a question: the answer to an `AskUserQuestion`, and the run
 * sitting idle until the human typed of their own accord. The second is the larger by far — one
 * delivery on disk waited 2h06m for the word "continue" — so a figure counting only the first
 * would report the time the plugin took from its human as nearly none.
 *
 * **It also reads whether the run is WAITING** (the-observation-reports-the-whole-run ticket 03;
 * D5): the questions are already kept by tool-use id here and the answers already matched against
 * them by `tool_use_id`, so the one still open is a name and a comparison in the pass that exists —
 * never a second reading of the record. What comes out of it is `waitingSince` above, which is a
 * timestamp and nothing else.
 *
 * Shape only. No subject, no header, no word of a question or an answer travels out of here:
 * ADR-0018's bound, and user story 8.
 */
function humanTimeOf(window: readonly JsonObject[]): HumanTime {
  const asked = new Map<string, { at: string | undefined; questions: number }>();
  let questionRounds = 0;
  let questionsAsked = 0;
  let answerWaitMs = 0;
  let typedTurns = 0;
  let idleWaitMs = 0;
  let previousAt: string | undefined;
  /** the last `AskUserQuestion` of the run with no answer beside it yet (ticket 03; D5) */
  let pending: PendingQuestion | undefined;

  for (const [index, entry] of window.entries()) {
    const at = stringField(entry, "timestamp");
    for (const block of toolUses(entry)) {
      if (stringField(block, "name") !== "AskUserQuestion") continue;
      questionRounds += 1;
      const asking = objectField(block, "input")?.["questions"];
      const questions = Array.isArray(asking) ? asking.length : 0;
      questionsAsked += questions;
      const id = stringField(block, "id");
      if (id === undefined) continue;
      asked.set(id, { at, questions });
      // Only the last question asked can be the run's own last act, so a later round replaces an
      // earlier one here rather than queuing behind it (ticket 03; D5).
      pending = { id, at, index };
    }
    for (const block of contentBlocks(objectField(entry, "message"))) {
      const id = stringField(block, "tool_use_id");
      const question = id === undefined ? undefined : asked.get(id);
      if (question === undefined) continue;
      answerWaitMs += Math.max(0, elapsed(question.at, at) ?? 0);
      // The same match, read for the run's state as well as for its arithmetic: a question that has
      // its answer is not one the run is waiting on (ticket 03; D5).
      if (id === pending?.id) pending = undefined;
    }
    if (index > 0 && typedText(entry) !== undefined) {
      typedTurns += 1;
      idleWaitMs += Math.max(0, elapsed(previousAt, at) ?? 0);
    }
    // A prompt's own `queue-operation` entries are stamped when the human typed, so counting them
    // as "the last thing the run did" would report every wait as nothing.
    if (at !== undefined && stringField(entry, "type") !== "queue-operation") previousAt = at;
  }

  return {
    questionRounds,
    questionsAsked,
    answerWaitMs,
    typedTurns,
    idleWaitMs,
    totalWaitMs: answerWaitMs + idleWaitMs,
    waitingSince:
      pending !== undefined && isTheRunsLastAct(window, pending.index) ? pending.at : undefined,
  };
}

/**
 * Whether the run wrote nothing after this entry, which is what makes an unanswered question the
 * run's own last act (ticket 03; D5).
 *
 * A `queue-operation` does not count, for the reason the two other readers of one here already give:
 * it is stamped when the HUMAN typed, so a prompt queued while a question is on screen is not the
 * run writing anything. Everything else does, and that strictness is the safe direction — a question
 * the run went PAST, one the human escaped out of and typed over, leaves the idle bound exactly as
 * it is today rather than suspending it on a wait that ended.
 *
 * **One shape reads as waiting and is really over, knowingly:** the human typed over a question and
 * the record ends there, so step 1's ceiling closes on the question itself and it is the last entry
 * of the window. Walked, and what it costs is the label arriving at the wait's ceiling instead of at
 * the idle bound on a run that had already stopped — no content, since the debrief goes on being
 * rewritten throughout and finalises at the end either way. Telling that shape from a wait would
 * take the very exemption D3 declined.
 */
function isTheRunsLastAct(window: readonly JsonObject[], index: number): boolean {
  for (let after = index + 1; after < window.length; after += 1) {
    if (stringField(window[after] ?? {}, "type") !== "queue-operation") return false;
  }
  return true;
}

/* ────────────────────────────────────── shared reading ────────────────────────────────────── */

/** The tool calls one entry made, if it made any. */
function toolUses(entry: JsonObject): readonly JsonObject[] {
  if (stringField(entry, "type") !== "assistant") return [];
  return contentBlocks(objectField(entry, "message")).filter(
    (block) => stringField(block, "type") === "tool_use",
  );
}

/**
 * What the human typed in this entry, or `undefined` where they typed nothing.
 *
 * Three things wear a human turn's shape and are not one: a tool result, the host's own injected
 * preamble (`isMeta`), and the `<task-notification>` the host writes as a user message when a
 * background dispatch finishes. Counting that last one as the human typing would end a run at its
 * own dispatch's report.
 */
function typedText(entry: JsonObject): string | undefined {
  if (stringField(entry, "type") !== "user" || entry["isMeta"] === true) return undefined;
  const blocks = contentBlocks(objectField(entry, "message"));
  if (blocks.length === 0) return undefined;
  let text = "";
  for (const block of blocks) {
    if (stringField(block, "tool_use_id") !== undefined) return undefined;
    text += stringField(block, "text") ?? "";
  }
  if (text.trim() === "" || text.includes("<task-notification>")) return undefined;
  return text;
}

/** The plugin directory named in the run's own preamble, whose name is the commit it ran. */
function pluginInWindow(window: readonly JsonObject[]): PluginDirectory | undefined {
  for (const entry of window) {
    if (stringField(entry, "type") !== "user") continue;
    for (const block of contentBlocks(objectField(entry, "message"))) {
      const named = pluginDirectoryInText(stringField(block, "text") ?? "");
      if (named !== undefined) return named;
    }
  }
  return undefined;
}
