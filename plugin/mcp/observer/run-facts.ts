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
 * session's.
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
import {
  addTokens,
  asObject,
  numberField,
  objectField,
  requestUsage,
  stringField,
  totalTokens,
  type DispatchRecord,
  type JsonObject,
  type RecordFile,
  type TokenTotals,
} from "./records.ts";
import { pluginDirectoryInText, type PluginDirectory } from "./plugin-commit.ts";
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
  /** a round's spend IS measured in dollars, with the provider that served it */
  readonly costUsd: number | undefined;
  readonly provider: string | undefined;
  readonly model: string | undefined;
  readonly agentDurationMs: number | undefined;
  /** set when the chronologically last poll came back an error rather than a status */
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
}

export interface RunFacts {
  readonly extent: RunExtent;
  readonly ending: RunEnding;
  /** the run's own dispatches — never the session's */
  readonly dispatches: readonly TraceDispatch[];
  readonly rounds: readonly RunRound[];
  /** the whole run's tokens: the orchestrator's own and every dispatch's */
  readonly tokens: TokenTotals;
  readonly ownTokens: TokenTotals;
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

  const ownTokens = totalTokens(requestUsage(window).values());
  const rounds = roundsOf(window, dispatches, input.dispatchRecords, losses);

  let taskUpdates = 0;
  let toolCalls = 0;
  let openedAt: RunFacts["openedAt"];
  for (const entry of window) {
    for (const block of toolUses(entry)) {
      toolCalls += 1;
      if (!TASK_TOOLS.has(stringField(block, "name") ?? "")) continue;
      taskUpdates += 1;
      // The FIRST count wins, exactly as the first slug does in `./trace.ts`: what the run opened
      // at is what a later update cannot move (ticket 07).
      openedAt ??= progressIn(block);
    }
  }

  // Read once: the window is the whole run and a second scan of it buys nothing.
  const plugin = pluginInWindow(window);

  return {
    extent,
    ending: endingOf(window),
    dispatches,
    rounds,
    tokens: dispatches.reduce((total, it) => addTokens(total, it.tokens), ownTokens),
    ownTokens,
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

/* ─────────────────────────────────────── the extent ─────────────────────────────────────── */

interface RunBounds {
  readonly command: string | undefined;
  readonly firstIndex: number;
  readonly lastIndex: number;
  readonly boundedBy: string;
  readonly total: number;
}

/**
 * Where the run starts and where it stops, as positions in the session's own record.
 *
 * The start is the `/deliverer:` command. The far end is found in two steps, because neither alone
 * is right: the last entry that is mechanically the run's — an attributed entry, a dispatch, a
 * question round, a review poll, a task update, or the answer to one of those — and then forward
 * through whatever the orchestrator wrote after it, up to the first turn the human typed. That
 * second step is what keeps a finished run's closing **report** inside the run; the first is what
 * keeps the human's unrelated work the next afternoon outside it.
 */
function boundsOf(entries: readonly JsonObject[], losses: string[]): RunBounds {
  let firstIndex = 0;
  let command: string | undefined;
  for (const [index, entry] of entries.entries()) {
    const named = /<command-name>(\/deliverer:[a-z0-9-]+)<\/command-name>/.exec(
      typedText(entry) ?? "",
    );
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

  const raised = new Set<string>();
  let lastSignal = firstIndex;
  for (let index = firstIndex; index < entries.length; index += 1) {
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

  let lastIndex = entries.length - 1;
  let boundedBy = "the session's record ends there";
  for (let index = lastSignal + 1; index < entries.length; index += 1) {
    if (typedText(entries[index] ?? {}) === undefined) continue;
    lastIndex = index - 1;
    boundedBy =
      "the human typed something else next, and what follows is work of their own";
    break;
  }
  return { command, firstIndex, lastIndex, boundedBy, total: entries.length };
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
    const stats = objectField(reported?.payload, "stats");
    const last = polls.filter((it) => it.kind === "answer").at(-1);
    rounds.push({
      reviewId,
      polls: polls.filter((it) => it.kind === "call").length,
      startedAt: polls[0]?.at,
      lastPollAt: last?.at,
      status: stringField(reported?.payload, "status"),
      reason: stringField(reported?.payload, "reason") ?? "",
      costUsd: numberField(stats, "costUsd"),
      provider: stringField(stats, "provider"),
      model: stringField(stats, "model"),
      agentDurationMs: numberField(stats, "agentDurationMs"),
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
        error: payload === undefined ? text.replace(/\s+/g, " ").slice(0, 200) : undefined,
      });
    }
  }
  return events;
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
 * the stage outright; a run that closed with prose of its own finished; anything else stopped
 * where the record does, which is the run most worth reporting and the one with no **report** to
 * say so itself (ADR-0018).
 */
function endingOf(window: readonly JsonObject[]): RunEnding {
  const subjects = new Map<string, string>();
  const states = new Map<string, string>();
  let created = 0;
  let lastCompleted: string | undefined;
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
      states.set(id, status);
      if (status === "completed") lastCompleted = subjects.get(id) ?? id;
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
  if (closedWithProse) {
    return {
      kind: "finished",
      stage: undefined,
      line:
        `**finished**: every one of its ${created} stages ended completed, and it closed with a ` +
        `report of its own.`,
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

/**
 * How many question rounds the run put to the human and how long it waited on them.
 *
 * Two waits, and only one of them is a question: the answer to an `AskUserQuestion`, and the run
 * sitting idle until the human typed of their own accord. The second is the larger by far — one
 * delivery on disk waited 2h06m for the word "continue" — so a figure counting only the first
 * would report the time the plugin took from its human as nearly none.
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

  for (const [index, entry] of window.entries()) {
    const at = stringField(entry, "timestamp");
    for (const block of toolUses(entry)) {
      if (stringField(block, "name") !== "AskUserQuestion") continue;
      questionRounds += 1;
      const asking = objectField(block, "input")?.["questions"];
      const questions = Array.isArray(asking) ? asking.length : 0;
      questionsAsked += questions;
      const id = stringField(block, "id");
      if (id !== undefined) asked.set(id, { at, questions });
    }
    for (const block of contentBlocks(objectField(entry, "message"))) {
      const id = stringField(block, "tool_use_id");
      const question = id === undefined ? undefined : asked.get(id);
      if (question === undefined) continue;
      answerWaitMs += Math.max(0, elapsed(question.at, at) ?? 0);
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
  };
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
