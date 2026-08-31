/**
 * The review lifecycle's state and its reducer (delegated-review ticket 04).
 *
 * One record per review, one pure function that folds a backend event into it, and one projection
 * that turns a record into what `code_review_status` publishes. Three rules are load-bearing and
 * live here rather than in any caller, because a caller can forget them:
 *
 *  - **Terminal states absorb.** Once a review is `completed`, `failed` or `cancelled`, no event may
 *    move it. That is what makes cancellation trustworthy against a backend message already in
 *    flight, and it is why the reducer's very first act is to check for it.
 *  - **Nothing verdict-shaped survives a non-`completed` status.** A review that did not finish
 *    carries no prose at all, and that is the whole of what there is left to guard: a verdict and a
 *    finding count were never things a real review had. A prototype produced the exact lie this
 *    prevents: an approving verdict beside prose describing two crash-level bugs. A review that
 *    never finished must never be reportable as clean.
 *  - **A poll publishes a key only where there is something to read.** No `null`, no literal
 *    `"unknown"`, no empty string: unknown is absence, which makes the same claim and costs nothing
 *    to send. The record holds `null` and `""` internally — the reducer needs somewhere to fold
 *    into — and `project` below is the one place that turns them back into silence
 *    (a-poll-says-what-it-knows D1/D2).
 *
 * This module is deliberately **not a seam** (spec, "Testing Decisions"): every behaviour above is
 * observable at the tool surface, and the suite pins it there.
 */

/**
 * Every status a review can hold. Five words, and a record opens on the first: `preparing` is honest
 * for both of the states it covers — the server has accepted the review, and it is starting the
 * backend. A sixth, `pending`, sat in front of it and was unreachable through either tool, because
 * the agent backend's first act inside its own `start` is to report `preparing` — synchronously,
 * before the handle is read back from the store. No caller ever saw the word and only a script could
 * produce it, so it is gone (a-poll-says-what-it-knows D14).
 */
export type ReviewStatus =
  | "preparing"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export const TERMINAL_STATUSES: readonly ReviewStatus[] = ["completed", "failed", "cancelled"];

/** The same set as a tuple, because the published output schema needs one and must not drift. */
export const STATUSES_TUPLE = [
  "preparing",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const satisfies readonly ReviewStatus[];

export const isTerminal = (status: ReviewStatus): boolean => TERMINAL_STATUSES.includes(status);

/**
 * What one run of a review spent, as its backend reports it. One shape for the whole path — a
 * backend event carries it, the record holds it, a poll's `spend` object publishes it — so a field
 * added here is a field the compiler then demands at every place it travels through.
 *
 * Every field is independently optional, and absence is the honest answer rather than a defect: a
 * round that died before its result message arrived knows none of them. Nothing here is ever
 * defaulted to zero, because a confident zero reads exactly like a cheap review.
 *
 * `costUsd` is the SDK's own list-rate arithmetic rather than an invoice — on a partner provider it
 * says what these tokens would have cost first-party. The token counters are the portable figure,
 * which is why `provider` travels beside them and the `code-reviewer` agent is told to label the
 * dollars with it.
 *
 * `agentDurationMs` rides here because a result message is where it is measured, and is the one
 * field of this shape a poll publishes OUTSIDE the `spend` object: time is not money, so it sits at
 * the top level beside the record's own timestamps (a-poll-says-what-it-knows D12).
 */
export interface ReviewSpend {
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  /** the INNER agent's own wall-clock: how long the round ran, not how long the record lived */
  agentDurationMs?: number;
  /** the model that served the round, and the provider that served that model */
  model?: string;
  provider?: string;
}

/**
 * The same fields as the RECORD holds them: unknown is `null`, because the reducer needs a slot to
 * fold the next event into. Nothing published carries that `null` — `project` below turns it back
 * into an absent key.
 */
export type RecordedSpend = {
  [Field in keyof ReviewSpend]-?: NonNullable<ReviewSpend[Field]> | null;
};

/**
 * WHY a terminal failure happened, in one machine-readable word. The vocabulary is CLOSED: every
 * terminal failure the server ITSELF produces prefixes its reason with one of these six, so a caller
 * reads the cause off the front of the line instead of matching prose it was never promised
 * (review-reliability ticket 03). An observed epic drove four rounds that all died and reported
 * nothing a caller could act on, so the orchestrator was left inferring the cause from the
 * reviewer's text.
 *
 * The scripted double is the one thing outside that, and it is not a gap: it replays a script's own
 * `message` verbatim, exactly as it replays everything else it is handed, so a script that wants the
 * real shape writes the code into the text it scripts.
 *
 * It rides on the `reason` a failed round already publishes rather than on a key of its own: the
 * status payload is documented as exactly the keys the tool contract names, and a prefix on an
 * existing one-line string keeps that true.
 *
 * Two things the closedness costs, both deliberate:
 *
 *  - **A cancellation carries no code.** `reason` is published for a cancelled round as well as a
 *    failed one, and none of these six is a cancellation — so rather than invent a seventh word for
 *    it, the status tool documents that the code rides on a FAILED round and a caller is not sent
 *    looking for one that is not there.
 *  - **Every bound a review has reports `deadline_exceeded`**, with the prose after the code saying
 *    which bound ended the round. A second bound is a second way to run out of time, not a second
 *    cause.
 */
export const FAILURE_CODES = [
  "prompt_too_long",
  "deadline_exceeded",
  "connection_lost",
  "not_logged_in",
  "no_result",
  "backend_error",
] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];

/**
 * A failed event's message with its code on the front. Every site that emits a terminal failure
 * goes through here, which is what makes the vocabulary above closed in fact and not just in
 * documentation: the separator is decided once, and a seventh word does not compile.
 */
export const failureReason = (code: FailureCode, detail: string): string => `${code}: ${detail}`;

/**
 * What a review backend may say. Backend-neutral on purpose: the scripted double and the real
 * Agent-SDK run (ticket 05) both narrow to this, so the lifecycle has exactly one vocabulary.
 *
 * `completed` and `failed` both carry spend, because a round that burned twelve minutes and died
 * spent that money exactly as one that finished did. `cancelled` carries none and must not be given
 * any: an aborted run never receives a result message, so its spend is genuinely unrecoverable.
 */
export type ReviewEvent =
  | { type: "preparing" }
  | { type: "running" }
  | { type: "text"; text: string }
  | ({ type: "completed"; summary?: string } & ReviewSpend)
  | ({ type: "failed"; message: string } & ReviewSpend)
  | { type: "cancelled"; reason: string };

/** One review, as the server holds it. Immutable: the reducer returns a new record or the old one. */
export interface ReviewRecord extends RecordedSpend {
  reviewId: string;
  changeRequestUrl: string;
  cwd: string | null;
  status: ReviewStatus;
  /** set ONLY by a completion event — never inferred, so an unfinished run has nothing to report */
  summary: string;
  /** everything that landed, in order; a cancelled or failed run keeps whatever it got */
  transcript: string;
  /**
   * WHY a non-completed run ended, in one line — the failure message or the cancellation reason,
   * empty while the run is alive or when it completed. Held as its own field, not dug back out of
   * the transcript, because it is the one thing a caller needs on the failure path and the
   * transcript no longer reaches `code_review_status` at all (grill A6/A20).
   *
   * A failure's message arrives with its `FailureCode` already on the front — the reducer prefixes
   * nothing, so the emitting site is the one that names the cause it knows.
   */
  reason: string;
  createdAt: number;
  /**
   * When the reducer last accepted an event. INTERNAL and load-bearing: `./store.ts` evicts a
   * terminal record on it when that record has no ending timestamp. It used to be published as the
   * last event's time too, and is not any more — the count of events moves with it and is the whole
   * signal on its own, so the timestamp only ever added a clock (ADR-0007's second amendment).
   */
  updatedAt: number;
  endedAt: number | null;
  events: number;
}

/** No spend known yet: what a record opens with, and what a run that never reported one keeps. */
const NO_SPEND: RecordedSpend = {
  costUsd: null,
  inputTokens: null,
  outputTokens: null,
  cacheReadTokens: null,
  cacheCreationTokens: null,
  agentDurationMs: null,
  model: null,
  provider: null,
};

/**
 * Fold an event's spend over what the record already holds, field by field: a backend that names
 * some of them and not others must not blank the rest. Absent stays absent, so a field no event ever
 * named is one no answer ever carries, rather than a number nobody measured.
 */
const mergedSpend = (record: RecordedSpend, event: ReviewSpend): RecordedSpend => ({
  costUsd: event.costUsd ?? record.costUsd,
  inputTokens: event.inputTokens ?? record.inputTokens,
  outputTokens: event.outputTokens ?? record.outputTokens,
  cacheReadTokens: event.cacheReadTokens ?? record.cacheReadTokens,
  cacheCreationTokens: event.cacheCreationTokens ?? record.cacheCreationTokens,
  agentDurationMs: event.agentDurationMs ?? record.agentDurationMs,
  model: event.model ?? record.model,
  provider: event.provider ?? record.provider,
});

export function newRecord(
  input: { reviewId: string; changeRequestUrl: string; cwd: string | null },
  now: number,
): ReviewRecord {
  return {
    reviewId: input.reviewId,
    changeRequestUrl: input.changeRequestUrl,
    cwd: input.cwd,
    status: "preparing",
    summary: "",
    transcript: "",
    reason: "",
    createdAt: now,
    updatedAt: now,
    endedAt: null,
    events: 0,
    ...NO_SPEND,
  };
}

const appended = (transcript: string, line: string): string =>
  transcript === "" ? line : `${transcript}\n${line}`;

/**
 * Fold one event into a record.
 *
 * Returns the record UNCHANGED — the same object, so a caller can compare by identity — when the
 * event is absorbed. Absorption is not an error and is not logged as one: a backend that emits a
 * final message after a cancellation is behaving normally.
 */
export function reduce(record: ReviewRecord, event: ReviewEvent, now: number): ReviewRecord {
  if (isTerminal(record.status)) return record;

  const base = { ...record, updatedAt: now, events: record.events + 1 };
  switch (event.type) {
    case "preparing":
      return { ...base, status: "preparing" };
    case "running":
      return { ...base, status: "running" };
    case "text":
      // The reviewer's own words, so an inner agent that is talking is running — whatever the
      // backend has got round to saying about itself. Text promotes the status a record opens in
      // and moves nothing else (a-poll-says-what-it-knows D15).
      return {
        ...base,
        status: record.status === "preparing" ? "running" : record.status,
        transcript: appended(record.transcript, event.text),
      };
    case "completed":
      return {
        ...base,
        ...mergedSpend(record, event),
        status: "completed",
        endedAt: now,
        summary: event.summary ?? "",
      };
    case "failed":
      return {
        ...base,
        // A round that failed still spent what it spent, and nothing else in this payload survives
        // a non-`completed` status — so this is the one thing a dead round has to report.
        ...mergedSpend(record, event),
        status: "failed",
        endedAt: now,
        // Kept twice, deliberately: in the transcript, where everything that landed is kept in
        // order, and in `reason`, which is what `code_review_status` publishes. The published
        // shape has no `error` field and gains none — `reason` took the slot `transcript` vacated,
        // so the failure path stopped being dark without the payload growing (grill A6/A20).
        transcript: appended(record.transcript, `[failed] ${event.message}`),
        reason: event.message,
      };
    case "cancelled":
      return {
        ...base,
        status: "cancelled",
        endedAt: now,
        transcript: appended(record.transcript, `[cancelled] ${event.reason}`),
        reason: event.reason,
      };
  }
}

/**
 * What a round **spent**, as a poll publishes it: `ReviewSpend` less the duration, which is a fact
 * about the run rather than a figure about money and travels at the top level instead
 * (a-poll-says-what-it-knows D12). It is the glossary's own word for what this object holds — the
 * four token counters and the dollar estimate — plus `provider`, which labels the dollars, and
 * `model`, which is what that provider served.
 *
 * The four counters stay separate: they are the figure that does not depend on a provider's price
 * list, and each of the four is priced differently, which is what makes a completed answer a usable
 * oracle for the **harness**'s own price table (`e2e-tests/README.md`).
 */
export type PublishedSpend = Omit<ReviewSpend, "agentDurationMs">;

/**
 * What one poll answers. **Four keys are always present because they are always known** — the
 * review's id, its status, when the record was opened and how many events have landed — and every
 * other key is optional, which is what makes the omission rule in this file's header expressible in
 * the type and in the published output schema rather than merely documented
 * (a-poll-says-what-it-knows D3).
 *
 * **Nothing here is a clock, and that is the whole design of it.** The RECORD's own elapsed
 * wall-clock left first (review-reliability ticket 10, D19): it rose whether the review was working
 * or wedged and answered neither, and the shipped `code-reviewer` read it every poll and reasoned
 * aloud about a deadline off the back of it. Then the last event's own timestamp went, and with it
 * both bounds as figures (ADR-0007): `events` moves only when that timestamp does, so it is the
 * whole working-versus-wedged signal on its own, and a bound a caller can neither configure nor act
 * on is documented where a caller reads what the status tool does instead of riding on every answer.
 * What dates anything at all is `startedAt`, which dates the review's start, and `endedAt`, which
 * arrives once there is an ending to date.
 */
export interface ReviewStatusResult {
  reviewId: string;
  status: ReviewStatus;
  startedAt: string;
  /**
   * How many events have landed, published even at zero: nothing has landed is a measurement rather
   * than an absence, and it is what the first poll of a round has to say
   * (a-poll-says-what-it-knows D4). The only field that moves while a review is alive — the SDK's
   * iterable says nothing until the inner agent finishes (`agent-backend.ts`'s header) — so it is
   * the whole of what tells a poller "working" from "wedged", and two polls agreeing on it need no
   * clock to compare.
   */
  events: number;
  endedAt?: string;
  /**
   * Why a non-completed run ended, verbatim; absent while the run is alive and absent when it
   * completed. A FAILED run's reason opens with a `FailureCode`; a cancelled one's does not. It
   * replaced `transcript` in this payload rather than joining it (grill A6): a deadline-length run
   * costs hundreds of polls, and returning the whole accumulated stream on each one grows the
   * polling agent's context with the reviewer's verbosity until it hits a ceiling the server's
   * deadline never reaches. The full stream stays available, pull-only, at
   * `code-review://transcript/<id>`.
   */
  reason?: string;
  /** how long the round ran INSIDE the reviewer — the reviewer's own figure, never a subtraction */
  agentDurationMs?: number;
  /**
   * What the round spent, whatever the status — what a round cost is a fact about the run rather
   * than a claim about the code, so unlike the prose it survives a `failed` status (ADR-0010). The
   * whole object is absent until a result arrives, so a running round has no spend key rather than
   * an empty one, and a cancelled round never gets one at all (a-poll-says-what-it-knows D11).
   */
  spend?: PublishedSpend;
  summary?: string;
}

/**
 * The `spend` object a poll publishes, or nothing at all when not one figure of it is known.
 *
 * Read off a record that holds `null` for unknown, and every `null` is then DROPPED rather than
 * sent: a figure nobody measured is unknown, absence says exactly that, and `CONTEXT.md`'s
 * **spend** entry forbids the confident zero that would otherwise read as a cheap review
 * (a-poll-says-what-it-knows D1/D2).
 *
 * `held` names every key of the published shape ONCE, which is what makes this exhaustive in both
 * directions: a field added to `ReviewSpend` does not compile until it is named here, and the copy
 * below walks whatever `held` holds, so it cannot then be left out of what is published.
 */
function publishedSpend(record: RecordedSpend): PublishedSpend | undefined {
  const held: { [Field in keyof PublishedSpend]-?: PublishedSpend[Field] | null } = {
    costUsd: record.costUsd,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    cacheReadTokens: record.cacheReadTokens,
    cacheCreationTokens: record.cacheCreationTokens,
    model: record.model,
    provider: record.provider,
  };
  const spend: PublishedSpend = {};
  for (const [field, value] of Object.entries(held)) {
    if (value !== null) Object.assign(spend, { [field]: value });
  }
  return Object.keys(spend).length === 0 ? undefined : spend;
}

export function project(record: ReviewRecord): ReviewStatusResult {
  const spend = publishedSpend(record);
  return {
    reviewId: record.reviewId,
    status: record.status,
    startedAt: new Date(record.createdAt).toISOString(),
    events: record.events,
    // Each of these is omitted where the record has nothing to say, which is the whole omission
    // rule at the one place it can be enforced: an ending a live round has not reached, the reason
    // a healthy round has no need of, the duration and the money no result has reported yet, and
    // the prose an unfinished round does not have.
    ...(record.endedAt === null ? {} : { endedAt: new Date(record.endedAt).toISOString() }),
    ...(record.reason === "" ? {} : { reason: record.reason }),
    ...(record.agentDurationMs === null ? {} : { agentDurationMs: record.agentDurationMs }),
    ...(spend === undefined ? {} : { spend }),
    // The prose is the whole deliverable, and it is published only for a review that COMPLETED: a
    // round that failed or was cancelled carries none of it, which is the stronger statement of
    // what a `partial` flag used to make by restating the status (ADR-0010).
    ...(record.status === "completed" && record.summary !== "" ? { summary: record.summary } : {}),
  };
}
