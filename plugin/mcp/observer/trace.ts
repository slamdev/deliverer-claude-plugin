/**
 * The **trace**: one **run**'s whole shape, in order, distilled from the host's own session records
 * (run-observation ticket 02; settled as D5, D6, D7, D18, D19 and D20 in the epic's spec).
 *
 * **Nothing here judges anything.** No model is called, nothing samples and nothing randomises, so
 * the same records produce the same trace byte for byte — which is what lets every ticket after
 * this one be verified by replaying a record instead of spending a run. Two consequences are
 * load-bearing and easy to undo by accident:
 *
 *  - **The key's timestamp is the RUN's own**, read off the first entry that carries one. Nothing
 *    in the body records when distillation happened. A key or a line carrying the moment the
 *    distiller ran would make byte-for-byte replay unmeetable.
 *  - **Directory order is never trusted.** Dispatch records are sorted by file name in
 *    `./records.ts`, because `readdir` promises no order.
 *
 * **What is kept, and what the cap bounds.** Every entry of the session's record is traced, in
 * order, whatever produced it — a session that also held another plugin's skills traces whole,
 * because cutting the entries it did not produce would lose the human's turns between them. Beside
 * each **dispatch** goes the whole of that dispatch's own record, as a slice the reader can see the
 * boundaries of. Nothing is dropped by kind. Volume is all the cap bounds: what an entry CARRIED
 * rides along as a capped excerpt, and the cap tightens as the run grows so a long delivery's trace
 * stays inside a context window (D6).
 *
 * That the excerpt is tight is the design and not a compromise. A dispatch's interior is read by
 * its **dispatch note**, written from that dispatch's slice on its own (D8); what the whole-run
 * reading needs from the trace is a stage's SHAPE, which is the line and not the excerpt.
 *
 * **A round's own review session is deliberately not read.** The session the tools server spawns
 * for a **round** is a top-level record of its own carrying no deliverer attribution — four of them
 * on this machine at 2.2 to 4.5 MB each — and what a round did is already in the `code-reviewer`
 * dispatch's polls, which are in that dispatch's slice. Leaving it out is a decision, not an
 * oversight.
 */
import {
  addTokens,
  arrayField,
  asObject,
  attributionOf,
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

/* ───────────────────────────────────────── the cap ───────────────────────────────────────── */

/**
 * How large the whole trace may get, and how that becomes one entry's share of it.
 *
 * **Measured against the records on disk rather than guessed** (ticket 02). The largest run there
 * is a `deliverer:build` whose records are 11.0 MB across one main record and fifteen per-dispatch
 * ones — 4,036 entries; the delivery the spec measured is 6.9 MB across fourteen files, 2,840
 * entries. Distilled at this budget they come out at 572,842 bytes / 243,989 tokens (cap 68) and
 * 510,870 bytes / 207,352 tokens (cap 131) — a 19× and a 13× reduction, with every entry still
 * present. The token figures were counted by `/v1/messages/count_tokens` rather than estimated, and
 * this content runs about 2.4 bytes to the token: it is timestamps, uuids and JSON rather than
 * prose.
 *
 * **The budget is a ceiling on the file and not a target.** Most entries are shorter than the cap
 * and never spend their share, which is why both runs above land well under it. What the number
 * buys is that no run can produce a trace larger than it while the cap holds.
 *
 * 600,000 characters is roughly a quarter of the long-context window the one synthesis per run
 * holds it in (D9). A quarter, because the synthesis reads the trace, the skill's own installed
 * text and every **dispatch note** together.
 *
 * The floor matters more than the ceiling, and it is where this stops being a bound. A run with
 * enough entries to reach it gets a trace that grows with its entry count — at 40 characters an
 * entry, a run four times the largest measured here would come to about 1.7 MB. That is the honest
 * failure: the alternative is dropping entries, which is the one thing D6 forbids.
 */
export const TRACE_BUDGET_CHARS = 600_000;

/**
 * What a traced line costs before its excerpt: the timestamp, the kind, the label, the turn and —
 * on a turn's first line only — the request id and that turn's token figures. Measured at 78.9 and
 * 79.2 characters a line across the two runs above, and subtracted so the budget bounds the FILE
 * rather than only the excerpts in it. Rounded up, because a line's overhead is the part no cap
 * bounds: get this too low and the budget stops being a ceiling, which is the whole of what it is.
 */
export const LINE_OVERHEAD_CHARS = 80;

export const EXCERPT_CAP_MAX = 800;
export const EXCERPT_CAP_MIN = 40;

export function excerptCapFor(entryCount: number): number {
  if (entryCount <= 0) return EXCERPT_CAP_MAX;
  const share = Math.floor(TRACE_BUDGET_CHARS / entryCount) - LINE_OVERHEAD_CHARS;
  return Math.min(EXCERPT_CAP_MAX, Math.max(EXCERPT_CAP_MIN, share));
}

/* ──────────────────────────────────── what a trace holds ──────────────────────────────────── */

/**
 * What one traced entry was.
 *
 * Deliberately coarse: this is the vocabulary the ticket names — a dispatch, a question round, a
 * review poll, a task update, a tool call — plus the catch-alls that keep the promise that nothing
 * is left out by kind.
 */
export type TraceKind =
  | "human" //        a message from the human, typed or answered
  | "say" //          the agent's own prose
  | "think" //        the agent's reasoning
  | "dispatch" //     an `Agent` call: one dispatch, opening its slice
  | "dispatched" //   that dispatch's outcome
  | "question" //     an `AskUserQuestion` call: one question round put to the human
  | "answered" //     the human's answer, and how long they were waited on
  | "poll" //         a call to the plugin's own review tools
  | "polled" //       what that call reported
  | "task" //         a task created or updated
  | "tool" //         any other tool call
  | "result" //       any other tool result
  | "note" //         a background task's completion notification
  | "hook" //         the host's own hook summaries
  | "meta"; //        the host's bookkeeping: attachments, snapshots, queue operations

export interface TraceLine {
  /** the entry's own ISO timestamp, where it carries one */
  readonly at: string | undefined;
  readonly kind: TraceKind;
  /** what it was: a tool name, an agent type, an entry type */
  readonly label: string;
  /** the mechanical facts — durations, statuses, token figures — already formatted */
  readonly detail: string;
  /** what the entry carried, collapsed to one line and capped */
  readonly excerpt: string;
  /** set on a `dispatch` line: which dispatch's slice follows */
  readonly dispatch: number | undefined;
}

/** One **dispatch**, and the slice of the trace that is its own record. */
export interface TraceDispatch {
  readonly ordinal: number;
  readonly agentType: string;
  readonly description: string;
  readonly toolUseId: string | undefined;
  readonly agentId: string | undefined;
  readonly recordPath: string | undefined;
  readonly startedAt: string | undefined;
  readonly endedAt: string | undefined;
  readonly durationMs: number | undefined;
  /** what the host said became of it — a claim, and one measured record reads `completed` for a
   *  dispatch whose whole text is an API-error termination */
  readonly status: string | undefined;
  readonly model: string | undefined;
  readonly background: boolean;
  readonly toolCalls: number | undefined;
  readonly entryCount: number;
  readonly tokens: TokenTotals;
  /** the dispatch's **report** — the only thing a dispatch returns — capped like every excerpt */
  readonly report: string;
  readonly lines: readonly TraceLine[];
}

export interface TraceCounts {
  readonly entries: number;
  readonly ownEntries: number;
  readonly dispatchEntries: number;
  readonly dispatches: number;
  readonly questionRounds: number;
  readonly reviewPolls: number;
  readonly taskUpdates: number;
  /** tool calls in the run's own record */
  readonly toolCalls: number;
  /** tool calls inside the dispatches, where most of a delivery's are */
  readonly dispatchToolCalls: number;
}

/** The stand-in a run that created no task is keyed by. Never a guess at what the slug was. */
export const UNKNOWN_SLUG = "unknown-slug";

/** The stand-in for a record with no timestamped entry at all. */
export const UNKNOWN_STAMP = "unknown-start";

export interface Trace {
  readonly recordPath: string;
  readonly sessionId: string | undefined;
  /** the plugin skills that produced entries here, in first-seen order */
  readonly skills: readonly string[];
  readonly slug: string;
  /** false when no task update carried one, and `slug` is therefore the stand-in */
  readonly slugRead: boolean;
  readonly startedAt: string | undefined;
  readonly endedAt: string | undefined;
  readonly durationMs: number | undefined;
  readonly counts: TraceCounts;
  readonly tokens: TokenTotals;
  readonly ownTokens: TokenTotals;
  readonly excerptCap: number;
  readonly elidedChars: number;
  /** what could not be read, in the words a reader of the trace needs */
  readonly losses: readonly string[];
  readonly lines: readonly TraceLine[];
  readonly dispatches: readonly TraceDispatch[];
}

/* ──────────────────────────────────── building the trace ──────────────────────────────────── */

/** Tool names that are the plugin's own review tools, wherever the host namespaced the server. */
function isReviewTool(name: string): boolean {
  // The host's MCP tool names are `mcp__<server>__<tool>`, and the server's name depends on how the
  // plugin was installed — `mcp__plugin_deliverer_tools__code_review_status` on this machine. So
  // the match is on the plugin's name and the tool's, never on the whole string. A claim, like
  // everything else about the format.
  return name.startsWith("mcp__") && name.includes("deliverer") && name.includes("code_review_");
}

const TASK_TOOLS = new Set(["TaskCreate", "TaskUpdate"]);

interface Elision {
  chars: number;
}

function excerpt(value: unknown, cap: number, elision: Elision): string {
  const text = typeof value === "string" ? value : value === undefined ? "" : safeStringify(value);
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= cap) return collapsed;
  elision.chars += collapsed.length - cap;
  return `${collapsed.slice(0, cap)}…(+${collapsed.length - cap})`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    // A record the host wrote is JSON, so this is unreachable through the parser — but a cycle
    // introduced by a future reader of this module must not take the trace down with it.
    return String(value);
  }
}

/** The text of a message's content, whether it is a bare string or a list of blocks. */
function contentBlocks(message: JsonObject | undefined): readonly JsonObject[] {
  const content = message === undefined ? undefined : message["content"];
  if (typeof content === "string") return [{ type: "text", text: content }];
  const blocks: JsonObject[] = [];
  for (const block of arrayField(message, "content")) {
    const object = asObject(block);
    if (object !== undefined) blocks.push(object);
  }
  return blocks;
}

export interface DistilInput {
  readonly record: RecordFile;
  readonly dispatchRecords: readonly DispatchRecord[];
  /** losses the reader already knows about, carried into the trace's own header */
  readonly losses: readonly string[];
}

export function buildTrace(input: DistilInput): Trace {
  const own = input.record.entries;
  const dispatchEntryCount = input.dispatchRecords.reduce(
    (total, record) => total + record.file.entries.length,
    0,
  );
  const cap = excerptCapFor(own.length + dispatchEntryCount);
  const elision: Elision = { chars: 0 };
  const losses = [...input.losses];
  if (input.record.unreadableLines.length > 0) {
    losses.push(
      `${input.record.unreadableLines.length} line(s) of the run's own record were not readable ` +
        `JSON and are not in this trace (first at line ${input.record.unreadableLines[0]}) — a ` +
        `record still being written ends in one`,
    );
  }
  for (const record of input.dispatchRecords) {
    if (record.file.unreadableLines.length === 0) continue;
    losses.push(
      `${record.file.unreadableLines.length} line(s) of dispatch record ${record.agentId} were ` +
        `not readable JSON and are not in this trace`,
    );
  }

  // Which tool calls report their own outcome on their own line — a dispatch's status and duration,
  // a question round's answer — so the raw result is not traced a second time at the trace's
  // expense. Collected in one pass rather than searched per result.
  const answeredOnTheirCall = new Set<string>();
  for (const entry of own) {
    if (stringField(entry, "type") !== "assistant") continue;
    for (const block of contentBlocks(objectField(entry, "message"))) {
      const name = stringField(block, "name");
      const id = stringField(block, "id");
      if (id !== undefined && (name === "Agent" || name === "AskUserQuestion")) {
        answeredOnTheirCall.add(id);
      }
    }
  }

  // Where a tool call's answer is, so a dispatch, a question round and a poll can each carry their
  // own outcome on the line that raised them.
  const resultsByToolUse = new Map<string, { entry: JsonObject; block: JsonObject }>();
  const notificationsByToolUse = new Map<string, JsonObject>();
  for (const entry of own) {
    const type = stringField(entry, "type");
    if (type === "user") {
      for (const block of contentBlocks(objectField(entry, "message"))) {
        const id = stringField(block, "tool_use_id");
        if (id !== undefined && !resultsByToolUse.has(id)) {
          resultsByToolUse.set(id, { entry, block });
        }
      }
    }
    if (type === "queue-operation") {
      // A dispatch launched in the background returns in milliseconds and reports its finish later
      // as a `<task-notification>` carrying the same tool-use id. The host writes the same
      // notification twice, `enqueue` then `remove`; the first is the one that says when.
      const content = stringField(entry, "content");
      const id = content === undefined ? null : /<tool-use-id>([^<]+)<\/tool-use-id>/.exec(content);
      if (id?.[1] !== undefined && !notificationsByToolUse.has(id[1])) {
        notificationsByToolUse.set(id[1], entry);
      }
    }
  }

  // Each dispatch's own record, found by the `toolUseId` its sidecar carries. Sidecars were checked
  // against three runs and matched every call, but the link is a claim: a record nothing claims is
  // still traced, at the end, and said so.
  const byToolUse = new Map<string, DispatchRecord>();
  for (const record of input.dispatchRecords) {
    const id = record.sidecar?.toolUseId;
    if (id !== undefined) byToolUse.set(id, record);
  }
  const attached = new Set<DispatchRecord>();

  const usageOf = usageReporter(own);
  const dispatches: TraceDispatch[] = [];
  const lines: TraceLine[] = [];
  let questionRounds = 0;
  let reviewPolls = 0;
  let taskUpdates = 0;
  let toolCalls = 0;
  let slug: string | undefined;

  for (const entry of own) {
    const at = stringField(entry, "timestamp");
    const type = stringField(entry, "type");

    if (type === "assistant") {
      // Asked ONCE per entry, and put on whatever line that entry becomes. The reporter states a
      // request's figures on its first line only, so calling it for a line that then discards the
      // answer would lose that turn's tokens altogether.
      const usage = usageOf(entry);
      for (const block of contentBlocks(objectField(entry, "message"))) {
        const blockType = stringField(block, "type");
        if (blockType === "tool_use") {
          toolCalls += 1;
          const name = stringField(block, "name") ?? "?";
          const toolUseId = stringField(block, "id");
          const toolInput = objectField(block, "input");
          if (name === "Agent") {
            const record = toolUseId === undefined ? undefined : byToolUse.get(toolUseId);
            if (record !== undefined) attached.add(record);
            const dispatch = buildDispatch({
              ordinal: dispatches.length + 1,
              at,
              toolUseId,
              toolInput,
              record,
              result: toolUseId === undefined ? undefined : resultsByToolUse.get(toolUseId),
              notification:
                toolUseId === undefined ? undefined : notificationsByToolUse.get(toolUseId),
              cap,
              elision,
              losses,
            });
            dispatches.push(dispatch);
            lines.push({
              at,
              kind: "dispatch",
              label: `#${dispatch.ordinal} ${dispatch.agentType}`,
              detail: [
                quoted(dispatch.description),
                dispatch.background ? "in the background" : "",
                usage,
              ]
                .filter((it) => it !== "")
                .join(" "),
              excerpt: excerpt(stringField(toolInput, "prompt"), cap, elision),
              dispatch: dispatch.ordinal,
            });
            const ended = dispatchEndLine(dispatch);
            if (ended !== undefined) lines.push(ended);
            continue;
          }
          if (name === "AskUserQuestion") {
            questionRounds += 1;
            const asked = arrayField(toolInput, "questions");
            lines.push({
              at,
              kind: "question",
              label: `round ${questionRounds}`,
              detail: `${asked.length} question(s): ${asked
                .map((it) => quoted(stringField(asObject(it), "header") ?? "?"))
                .join(" ")} ${usage}`.trim(),
              excerpt: excerpt(toolInput, cap, elision),
              dispatch: undefined,
            });
            const answer = toolUseId === undefined ? undefined : resultsByToolUse.get(toolUseId);
            if (answer !== undefined) {
              const answeredAt = stringField(answer.entry, "timestamp");
              lines.push({
                at: answeredAt,
                kind: "answered",
                label: `round ${questionRounds}`,
                detail: `waited on the human for ${formatDuration(elapsed(at, answeredAt))}`,
                excerpt: excerpt(answer.block["content"], cap, elision),
                dispatch: undefined,
              });
            }
            continue;
          }
          if (isReviewTool(name)) {
            reviewPolls += 1;
            lines.push({
              at,
              kind: "poll",
              label: name.slice(name.indexOf("__code_review_") + 2),
              detail: usage,
              excerpt: excerpt(toolInput, cap, elision),
              dispatch: undefined,
            });
            continue;
          }
          if (TASK_TOOLS.has(name)) {
            taskUpdates += 1;
            const subject = stringField(toolInput, "subject");
            // The slug: both skills prefix every task subject with it — `<slug>: implement every
            // ticket (4/21)`. Checked against all eight runs on disk, refinements and deliveries
            // alike. The FIRST subject that carries one wins, so a later task cannot move the key.
            if (slug === undefined && subject !== undefined) {
              const prefix = /^([A-Za-z0-9][A-Za-z0-9._-]*):\s/.exec(subject);
              if (prefix?.[1] !== undefined) slug = prefix[1];
            }
            lines.push({
              at,
              kind: "task",
              label: name,
              detail: usage,
              excerpt: excerpt(toolInput, cap, elision),
              dispatch: undefined,
            });
            continue;
          }
          lines.push({
            at,
            kind: "tool",
            label: name,
            detail: [stringField(toolInput, "description") ?? "", usage]
              .filter((it) => it !== "")
              .join(" "),
            excerpt: excerpt(toolInput, cap, elision),
            dispatch: undefined,
          });
          continue;
        }
        lines.push({
          at,
          kind: blockType === "thinking" ? "think" : "say",
          label: modelLabel(entry),
          detail: usage,
          excerpt: excerpt(
            blockType === "thinking" ? stringField(block, "thinking") : stringField(block, "text"),
            cap,
            elision,
          ),
          dispatch: undefined,
        });
      }
      continue;
    }

    if (type === "user") {
      for (const block of contentBlocks(objectField(entry, "message"))) {
        const toolUseId = stringField(block, "tool_use_id");
        if (toolUseId !== undefined) {
          // A tool result whose call already carried it — a dispatch's outcome, a question's answer
          // — is on that call's line. This is every other tool result.
          if (answeredOnTheirCall.has(toolUseId)) continue;
          lines.push({
            at,
            kind: "result",
            label: field(block, "is_error") === true ? "error" : "ok",
            detail: "",
            excerpt: excerpt(block["content"], cap, elision),
            dispatch: undefined,
          });
          continue;
        }
        lines.push({
          at,
          kind: "human",
          label: entry["isMeta"] === true ? "injected" : "",
          detail: "",
          excerpt: excerpt(stringField(block, "text"), cap, elision),
          dispatch: undefined,
        });
      }
      continue;
    }

    lines.push(bookkeepingLine(entry, at, type, cap, elision));
  }

  for (const record of input.dispatchRecords) {
    if (attached.has(record)) continue;
    // A dispatch record nothing in the run's own record claims. Traced anyway, at the end, because
    // dropping it would lose a whole stage — and said, because an unclaimed record means either the
    // link moved or the run started an agent this trace cannot place.
    const dispatch = buildDispatch({
      ordinal: dispatches.length + 1,
      at: undefined,
      toolUseId: record.sidecar?.toolUseId,
      toolInput: undefined,
      record,
      result: undefined,
      notification: undefined,
      cap,
      elision,
      losses,
    });
    dispatches.push(dispatch);
    losses.push(
      `the dispatch record ${record.agentId} is not claimed by any Agent call in the run's own ` +
        `record, so it is traced last as #${dispatch.ordinal} rather than in its place`,
    );
    lines.push({
      at: dispatch.startedAt,
      kind: "dispatch",
      label: `#${dispatch.ordinal} ${dispatch.agentType}`,
      detail: "unplaced — no Agent call in the run's own record claims this record",
      excerpt: "",
      dispatch: dispatch.ordinal,
    });
  }

  const ownTokens = totalTokens(requestUsage(own).values());
  const tokens = dispatches.reduce(
    (total, dispatch) => addTokens(total, dispatch.tokens),
    ownTokens,
  );
  const stamps = own.map((entry) => stringField(entry, "timestamp")).filter(isString);
  const startedAt = stamps[0];
  const endedAt = [...stamps, ...dispatches.map((it) => it.endedAt).filter(isString)]
    .slice()
    .sort()
    .at(-1);
  if (startedAt === undefined) {
    losses.push("no entry in the run's own record carries a timestamp, so the run has no window");
  }
  if (slug === undefined) {
    losses.push(
      `no task update carried a slug, so this trace is keyed by "${UNKNOWN_SLUG}" — the run left ` +
        `before it created a task`,
    );
  }

  return {
    recordPath: input.record.path,
    sessionId: own.map((entry) => stringField(entry, "sessionId")).find(isString),
    skills: attributionOf(own),
    slug: slug ?? UNKNOWN_SLUG,
    slugRead: slug !== undefined,
    startedAt,
    endedAt,
    durationMs: elapsed(startedAt, endedAt),
    counts: {
      entries: own.length + dispatchEntryCount,
      ownEntries: own.length,
      dispatchEntries: dispatchEntryCount,
      dispatches: dispatches.length,
      questionRounds,
      reviewPolls:
        reviewPolls + dispatches.reduce((total, it) => total + linesOfKind(it, "poll"), 0),
      taskUpdates,
      toolCalls,
      dispatchToolCalls: dispatches.reduce(
        (total, it) =>
          total + linesOfKind(it, "tool") + linesOfKind(it, "poll") + linesOfKind(it, "task"),
        0,
      ),
    },
    tokens,
    ownTokens,
    excerptCap: cap,
    elidedChars: elision.chars,
    losses,
    lines,
    dispatches,
  };
}

function linesOfKind(dispatch: TraceDispatch, kind: TraceKind): number {
  return dispatch.lines.filter((line) => line.kind === kind).length;
}

function field(object: JsonObject, key: string): unknown {
  return object[key];
}

function isString(value: string | undefined): value is string {
  return value !== undefined;
}

function quoted(value: string): string {
  return value === "" ? "" : `"${value}"`;
}

function bookkeepingLine(
  entry: JsonObject,
  at: string | undefined,
  type: string | undefined,
  cap: number,
  elision: Elision,
): TraceLine {
  const content = stringField(entry, "content") ?? "";
  if (type === "queue-operation" && content.includes("<task-notification>")) {
    return {
      at,
      kind: "note",
      label: stringField(entry, "operation") ?? "",
      detail: "",
      excerpt: excerpt(content, cap, elision),
      dispatch: undefined,
    };
  }
  if (type === "system") {
    return {
      at,
      kind: "hook",
      label: stringField(entry, "subtype") ?? "system",
      detail: "",
      excerpt: excerpt(entry, cap, elision),
      dispatch: undefined,
    };
  }
  return {
    at,
    kind: "meta",
    label:
      type === "attachment"
        ? `attachment ${stringField(objectField(entry, "attachment"), "type") ?? "?"}`
        : (type ?? "?"),
    detail: "",
    excerpt: excerpt(entry, cap, elision),
    dispatch: undefined,
  };
}

/* ──────────────────────────────────── one dispatch's slice ──────────────────────────────────── */

interface DispatchInput {
  readonly ordinal: number;
  readonly at: string | undefined;
  readonly toolUseId: string | undefined;
  readonly toolInput: JsonObject | undefined;
  readonly record: DispatchRecord | undefined;
  readonly result: { entry: JsonObject; block: JsonObject } | undefined;
  readonly notification: JsonObject | undefined;
  readonly cap: number;
  readonly elision: Elision;
  readonly losses: string[];
}

function buildDispatch(input: DispatchInput): TraceDispatch {
  const outcome = asObject(input.result?.entry["toolUseResult"]);
  const sidecar = input.record?.sidecar;
  const status = stringField(outcome, "status");
  const background = status === "async_launched" || field(outcome ?? {}, "isAsync") === true;
  const notificationAt = stringField(input.notification, "timestamp");
  const resultAt = stringField(input.result?.entry, "timestamp");
  // A background dispatch's tool result lands in milliseconds and says nothing about the work; its
  // finish is the `<task-notification>` carrying the same tool-use id. Taking the result's own
  // timestamp would report a twenty-minute stage as having taken 17ms, so it is not a fallback —
  // where there is no notification the dispatch's own last entry is, below.
  const endedAt = background ? notificationAt : resultAt;
  const reportedDuration = numberField(outcome, "totalDurationMs");

  const lines: TraceLine[] = [];
  const entries = input.record?.file.entries ?? [];
  const usageOf = usageReporter(entries);
  for (const entry of entries) {
    const at = stringField(entry, "timestamp");
    const type = stringField(entry, "type");
    if (type === "assistant") {
      const usage = usageOf(entry);
      for (const block of contentBlocks(objectField(entry, "message"))) {
        const blockType = stringField(block, "type");
        if (blockType === "tool_use") {
          const name = stringField(block, "name") ?? "?";
          const toolInput = objectField(block, "input");
          lines.push({
            at,
            kind: isReviewTool(name) ? "poll" : TASK_TOOLS.has(name) ? "task" : "tool",
            label: isReviewTool(name) ? name.slice(name.indexOf("__code_review_") + 2) : name,
            detail: [stringField(toolInput, "description") ?? "", usage]
              .filter((it) => it !== "")
              .join(" "),
            excerpt: excerpt(toolInput, input.cap, input.elision),
            dispatch: undefined,
          });
          continue;
        }
        lines.push({
          at,
          kind: blockType === "thinking" ? "think" : "say",
          label: modelLabel(entry),
          detail: usage,
          excerpt: excerpt(
            blockType === "thinking" ? stringField(block, "thinking") : stringField(block, "text"),
            input.cap,
            input.elision,
          ),
          dispatch: undefined,
        });
      }
      continue;
    }
    if (type === "user") {
      for (const block of contentBlocks(objectField(entry, "message"))) {
        const isResult = stringField(block, "tool_use_id") !== undefined;
        lines.push({
          at,
          kind: isResult ? "result" : "human",
          label: isResult ? (field(block, "is_error") === true ? "error" : "ok") : "",
          detail: "",
          excerpt: excerpt(
            isResult ? block["content"] : stringField(block, "text"),
            input.cap,
            input.elision,
          ),
          dispatch: undefined,
        });
      }
      continue;
    }
    lines.push(bookkeepingLine(entry, at, type, input.cap, input.elision));
  }

  if (input.record === undefined) {
    input.losses.push(
      `dispatch #${input.ordinal} ` +
        `(${sidecar?.agentType ?? stringField(input.toolInput, "subagent_type") ?? "?"}) left no ` +
        `readable record beside the run's own, so its interior is not in this trace`,
    );
  }

  const stamps = entries.map((entry) => stringField(entry, "timestamp")).filter(isString);
  const lastEntryAt = stamps.slice().sort().at(-1);
  return {
    ordinal: input.ordinal,
    agentType:
      sidecar?.agentType ??
      stringField(input.toolInput, "subagent_type") ??
      stringField(outcome, "agentType") ??
      "unknown-agent",
    description:
      sidecar?.description ??
      stringField(input.toolInput, "description") ??
      stringField(outcome, "description") ??
      "",
    toolUseId: input.toolUseId,
    agentId: input.record?.agentId ?? stringField(outcome, "agentId"),
    recordPath: input.record?.file.path,
    startedAt: input.at ?? stamps[0],
    endedAt: endedAt ?? lastEntryAt,
    durationMs: reportedDuration ?? elapsed(input.at ?? stamps[0], endedAt ?? lastEntryAt),
    status: background
      ? (statusOfNotification(input.notification) ??
        "launched in the background, with no completion recorded in this record")
      : status,
    model: stringField(outcome, "resolvedModel"),
    background,
    toolCalls: numberField(outcome, "totalToolUseCount"),
    entryCount: entries.length,
    tokens: totalTokens(requestUsage(entries).values()),
    // Capped ONCE, here. Capping the closing line's excerpt again would cut an already-cut string
    // and report a second elision on top of the first — a figure about the trace rather than about
    // the run.
    //
    // A BACKGROUND dispatch's tool result is the host's own launch notice and not a report at all,
    // so its report is read off its record like a dispatch that never returned one.
    report:
      input.result === undefined || background
        ? lastProseIn(lines)
        : excerpt(input.result.block["content"], input.cap, input.elision),
    lines,
  };
}

/**
 * What the dispatched agent last said, for a dispatch whose result is not in the record.
 *
 * A dispatch launched in the background reports through a notification carrying no text, and a run
 * that stopped mid-stage has no result at all — but the agent's own record still ends with whatever
 * it had got to, and that is the closest thing to a **report** there is.
 */
function lastProseIn(lines: readonly TraceLine[]): string {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (line?.kind === "say" && line.excerpt !== "") return line.excerpt;
  }
  return "";
}

function statusOfNotification(notification: JsonObject | undefined): string | undefined {
  const content = stringField(notification, "content");
  const status = content === undefined ? null : /<status>([^<]*)<\/status>/.exec(content);
  return status?.[1];
}

function dispatchEndLine(dispatch: TraceDispatch): TraceLine | undefined {
  if (dispatch.status === undefined && dispatch.endedAt === undefined) {
    // A dispatch with no outcome at all: the run stopped while it was still going, or was killed.
    // The absence is the fact, and it is said rather than left as a slice that simply stops.
    return {
      at: undefined,
      kind: "dispatched",
      label: `#${dispatch.ordinal} ${dispatch.agentType}`,
      detail: "no outcome in the record — the run stopped before this dispatch reported",
      excerpt: "",
      dispatch: undefined,
    };
  }
  return {
    at: dispatch.endedAt,
    kind: "dispatched",
    label: `#${dispatch.ordinal} ${dispatch.agentType}`,
    detail: [
      dispatch.status ?? "no status",
      `after ${formatDuration(dispatch.durationMs)}`,
      dispatch.model ?? "",
      dispatch.toolCalls === undefined ? "" : `${dispatch.toolCalls} tool calls`,
      tokenDetail(dispatch.tokens),
    ]
      .filter((it) => it !== "")
      .join(" · "),
    // A dispatch's **report** is the only thing it returns, so it is the one excerpt on the line
    // that closes a slice.
    excerpt: dispatch.report,
    dispatch: undefined,
  };
}

/* ────────────────────────────────────── formatting ────────────────────────────────────── */

function modelLabel(entry: JsonObject): string {
  const message = objectField(entry, "message");
  const model = stringField(message, "model") ?? "";
  const effort = stringField(entry, "effort");
  return effort === undefined ? model : `${model}/${effort}`;
}

/**
 * What goes on an assistant line where its API request's tokens do: a reporter over one record.
 *
 * **A turn's figures are stated ONCE, on the first line of the request that produced them, and the
 * request's other lines carry its id alone.** The usage written on an entry is not what is
 * rendered: one request writes several entries repeating the same usage and only the entry carrying
 * the request's `stop_reason` carries its full `output_tokens`, so a per-entry figure is wrong on
 * every line and more than doubles when summed. `requestUsage` in `./records.ts` resolves the
 * request's own figures, and this puts them where a reader can attribute them to a turn.
 *
 * Deterministic: which line is a request's first depends on the order of the record and on nothing
 * else.
 */
function usageReporter(entries: readonly JsonObject[]): (entry: JsonObject) => string {
  const usages = requestUsage(entries);
  // A turn's number, so the lines of one request can be read as one turn without repeating a
  // thirty-character request id on every one of them. The id is stated once, on the turn's first
  // line, where a maintainer can still find it in the record.
  const turns = new Map<string, number>();
  const reported = new Set<string>();
  return (entry) => {
    const requestId =
      stringField(entry, "requestId") ?? stringField(objectField(entry, "message"), "id");
    if (requestId === undefined) return "";
    const turn = turns.get(requestId) ?? turns.size + 1;
    turns.set(requestId, turn);
    const usage = usages.get(requestId);
    if (usage === undefined || reported.has(requestId)) return `turn ${turn}`;
    reported.add(requestId);
    return (
      `turn ${turn} ${requestId} · in ${usage.inputTokens} out ${usage.outputTokens} ` +
      `cache-write ${usage.cacheWriteTokens} cache-read ${usage.cacheReadTokens}`
    );
  };
}

export function tokenDetail(tokens: TokenTotals): string {
  if (tokens.requests === 0) return "";
  return (
    `${tokens.requests} req · in ${tokens.inputTokens} out ${tokens.outputTokens} ` +
    `cache-write ${tokens.cacheWriteTokens} cache-read ${tokens.cacheReadTokens}`
  );
}

export function elapsed(from: string | undefined, to: string | undefined): number | undefined {
  if (from === undefined || to === undefined) return undefined;
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined;
  return end - start;
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "an unknown time";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m${String(seconds % 60).padStart(2, "0")}s`;
  return `${seconds}s`;
}
