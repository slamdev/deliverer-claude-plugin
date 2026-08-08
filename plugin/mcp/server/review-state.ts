/**
 * The review lifecycle's state and its reducer (delegated-review issue 04).
 *
 * One record per review, one pure function that folds a backend event into it, and one projection
 * that turns a record into what `code_review_status` publishes. Two rules are load-bearing and live
 * here rather than in any caller, because a caller can forget them:
 *
 *  - **Terminal states absorb.** Once a review is `completed`, `failed` or `cancelled`, no event may
 *    move it. That is what makes cancellation trustworthy against a backend message already in
 *    flight, and it is why the reducer's very first act is to check for it.
 *  - **Nothing verdict-shaped survives a non-`completed` status.** The verdict, the finding count and
 *    the summary all read `unknown` / absent unless the run actually finished. A prototype produced
 *    the exact lie this prevents: an approving verdict beside prose describing two crash-level
 *    bugs. A review that never finished must never be reportable as clean.
 *
 * This module is deliberately **not a seam** (PRD, "Testing Decisions"): every behaviour above is
 * observable at the tool surface, and the suite pins it there.
 */

/** Every status a review can hold. `pending` is the handle before the backend has said anything. */
export type ReviewStatus =
  | "pending"
  | "preparing"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export const TERMINAL_STATUSES: readonly ReviewStatus[] = ["completed", "failed", "cancelled"];

/** The same set as a tuple, because the published output schema needs one and must not drift. */
export const STATUSES_TUPLE = [
  "pending",
  "preparing",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const satisfies readonly ReviewStatus[];

export const isTerminal = (status: ReviewStatus): boolean => TERMINAL_STATUSES.includes(status);

/**
 * What a review backend may say. Backend-neutral on purpose: the scripted double and the real
 * Agent-SDK run (issue 05) both narrow to this, so the lifecycle has exactly one vocabulary.
 */
export type ReviewEvent =
  | { type: "preparing" }
  | { type: "running" }
  | { type: "text"; text: string }
  | {
      type: "completed";
      summary?: string;
      verdict?: string;
      findings?: number;
      costUsd?: number;
      turns?: number;
    }
  | { type: "failed"; message: string }
  | { type: "cancelled"; reason: string };

/** One review, as the server holds it. Immutable: the reducer returns a new record or the old one. */
export interface ReviewRecord {
  reviewId: string;
  prUrl: string;
  cwd: string | null;
  status: ReviewStatus;
  /** set ONLY by a completion event — never inferred, so an unfinished run has nothing to report */
  verdict: string | null;
  findings: number | null;
  summary: string;
  /** everything that landed, in order; a cancelled or failed run keeps whatever it got */
  transcript: string;
  /**
   * WHY a non-completed run ended, in one line — the failure message or the cancellation reason,
   * empty while the run is alive or when it completed. Held as its own field, not dug back out of
   * the transcript, because it is the one thing a caller needs on the failure path and the
   * transcript no longer reaches `code_review_status` at all (grill A6/A20).
   */
  reason: string;
  createdAt: number;
  updatedAt: number;
  endedAt: number | null;
  events: number;
  costUsd: number | null;
  turns: number | null;
}

export function newRecord(
  input: { reviewId: string; prUrl: string; cwd: string | null },
  now: number,
): ReviewRecord {
  return {
    reviewId: input.reviewId,
    prUrl: input.prUrl,
    cwd: input.cwd,
    status: "pending",
    verdict: null,
    findings: null,
    summary: "",
    transcript: "",
    reason: "",
    createdAt: now,
    updatedAt: now,
    endedAt: null,
    events: 0,
    costUsd: null,
    turns: null,
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
      // text before any status event still means the run has started talking
      return {
        ...base,
        status: record.status === "pending" ? "running" : record.status,
        transcript: appended(record.transcript, event.text),
      };
    case "completed":
      return {
        ...base,
        status: "completed",
        endedAt: now,
        verdict: event.verdict ?? null,
        findings: event.findings ?? null,
        summary: event.summary ?? "",
        costUsd: event.costUsd ?? record.costUsd,
        turns: event.turns ?? record.turns,
      };
    case "failed":
      return {
        ...base,
        status: "failed",
        endedAt: now,
        // Kept twice, deliberately: in the transcript, where everything that landed is kept in
        // order, and in `reason`, which is what `code_review_status` publishes. The nine-key shape
        // has no `error` field and gains none — `reason` took the slot `transcript` vacated, so the
        // failure path stopped being dark without the payload growing (grill A6/A20).
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

/** The literal every verdict-shaped field falls back to. Never `null`, never an empty verdict. */
export const UNKNOWN = "unknown";

/** Exactly the nine keys the tool contract names — no more, so a consumer can rely on the shape. */
export interface ReviewStatusResult {
  reviewId: string;
  prUrl: string;
  status: ReviewStatus;
  verdict: string;
  counts: { findings: number | "unknown" };
  stats: {
    startedAt: string;
    endedAt: string | null;
    durationMs: number;
    events: number;
    /**
     * When the last event landed, or null before any has. This and `events` are the only fields that
     * move while a review is alive — the SDK's iterable says nothing until the inner agent finishes
     * (`agent-backend.ts`'s header) — so together they are what tells a poller "working" from
     * "wedged". `durationMs` rises either way and answers neither.
     */
    lastEventAt: string | null;
    costUsd: number | null;
    turns: number | null;
    /** the ceiling every review on this server is bounded by — a constant, so never absent */
    deadlineSec: number;
  };
  /**
   * Why a non-completed run ended, verbatim; empty when the run is alive or completed. It replaced
   * `transcript` in this payload rather than joining it (grill A6): a deadline-length run costs
   * ~120 polls, and returning the whole accumulated stream on each one grows the driver's context
   * with the reviewer's verbosity until the actor hits a ceiling the server's deadline never
   * reaches. The full stream stays available, pull-only, at `code-review://transcript/<id>`.
   */
  reason: string;
  partial: boolean;
  summary: string;
}

export function project(
  record: ReviewRecord,
  context: { now: number; deadlineSec: number },
): ReviewStatusResult {
  const done = record.status === "completed";
  return {
    reviewId: record.reviewId,
    prUrl: record.prUrl,
    status: record.status,
    verdict: done ? (record.verdict ?? UNKNOWN) : UNKNOWN,
    counts: { findings: done && record.findings !== null ? record.findings : UNKNOWN },
    stats: {
      startedAt: new Date(record.createdAt).toISOString(),
      endedAt: record.endedAt === null ? null : new Date(record.endedAt).toISOString(),
      durationMs: (record.endedAt ?? context.now) - record.createdAt,
      events: record.events,
      // `updatedAt` only moves when the reducer accepts an event, so it IS the last event's time —
      // but it starts equal to `createdAt`, so it is published only once something has landed.
      lastEventAt: record.events === 0 ? null : new Date(record.updatedAt).toISOString(),
      costUsd: record.costUsd,
      turns: record.turns,
      deadlineSec: context.deadlineSec,
    },
    reason: record.reason,
    // `partial` is the whole truth of "is this the finished review?", so it is derived from the
    // status rather than from whether anything landed: only `completed` is not partial
    partial: !done,
    summary: done ? record.summary : "",
  };
}
