/**
 * The review lifecycle: start, poll, cancel (delegated-review ticket 04).
 *
 * Everything the three tools do that is not protocol lives here — validation, the one-in-flight
 * rule, the caller-supplied handle, the two bounds, and the wiring of a backend's events into the
 * reducer. The tool layer above it (`./index.ts`) only translates.
 *
 * Two contract rules shape the surface:
 *
 *  - **An error result means the tool could not do its job** — a malformed URL, an unknown id, a
 *    second review while one is in flight. A review that found problems is a *successful* call, and
 *    so is a review that failed on one of its bounds: the failure is a fact ABOUT the review,
 *    reported through `code_review_status`, not a failure of the call that asked.
 *  - **The handle exists before the work does.** `code_review_start` records the review and returns
 *    in well under a second; the backend's first event arrives afterwards. A caller may supply the
 *    id, so it holds the handle before anything can go wrong and a retry addresses the same review
 *    rather than starting a second one.
 *
 * **Two guards in `start()` are deliberate and load-bearing, and neither has a test. Do not remove
 * them as dead defensive code** (PR #11 grill, agenda A46/A47). `arm()` and `armIdle()` hand the run
 * they are arming for to `boundFailed` rather than reading the slot at fire time, and clear any timer
 * still held; `inFlightId` is released — and the record it was claimed for FAILED — when
 * `backend.start()` throws, both guarded so a synchronous terminal event that already released it
 * is not disturbed.
 * Together they prevent a **session-fatal wedge**: an in-flight slot claimed for an id nothing can
 * ever move to terminal, after which every later `code_review_start` on this server is refused for
 * the life of the process — and a bound armed against a review that already finished, firing
 * into whichever run holds the slot next.
 *
 * The record has to be failed and not merely abandoned (PR #11 review round 2): releasing the slot
 * alone leaves a `pending` record no eviction and no bound can ever move, and
 * `agents/code-reviewer.md` tells that agent to retry under the SAME id — so the retry branch would
 * hand that dead handle back for ever, and the agent would poll it until the run's budget was gone.
 * The wedge would have moved from the slot to the id, not gone.
 *
 * A THIRD check of that class sits on the idle bound's rearm, in the emit callback `start()` hands
 * the backend: it rearms only while the slot is still this review's. Not a redundant test —
 * `inFlightRun` belongs to whichever review holds the slot, so rearming without it would hand this
 * review's id to another review's run, and the bound would then abort that run while recording the
 * failure here. The `!== null` half is what a synchronous event inside `start()` meets, before there
 * is a run to arm against at all.
 *
 * They are untested because both defects are unreachable at the PUBLISHED TOOL SURFACE, which is
 * the only seam the spec's Testing Decisions permit — the reducer is deliberately not one. The
 * scripted double takes one script per server, so two reviews on one server necessarily behave the
 * same way and the second is terminal before a leaked timer could reach it; the shipped agent
 * backend's only synchronous emit is `preparing`, and its failure path goes through a rejected
 * promise. A fault-injection knob on the scripted double would reach them, and was rejected: it
 * puts test scaffolding into a shipped artifact. So "unreachable" rests on both shipped backends
 * never growing a synchronous throw — something `./backend.ts` explicitly permits a backend to do.
 */
import * as fs from "node:fs";

import type { ReviewBackend, ReviewRun } from "./backend.ts";
import type { ReviewEvent, ReviewStatusResult } from "./review-state.ts";
import { failureReason, isTerminal, newRecord, project, reduce } from "./review-state.ts";
import type { ReviewStore } from "./store.ts";

/** A failure of the CALL. The tool layer turns exactly this into an MCP error result. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

/**
 * How long a caller should wait before polling again. A hint, not a rule: nothing enforces it, and
 * the scripted double outruns it by design. It is advice for whoever is polling, published for any
 * caller and not just the shipped one (review-reliability D20).
 *
 * **No interval is hand-maintained against it, and that is the point.** `agents/code-reviewer.md`
 * is told to leave the `poll_after_ms` ITS OWN HANDLE gave it between one call and the next — this
 * figure, read off the payload rather than copied into prose — so there is one number and nothing
 * to keep in step. What that agent is still told nothing about is elapsed time or a deadline: the
 * hint paces a loop, and reasoning about a clock is what D19 removed after a shipped `sleep 15` was
 * observed as a two-minute one, twice.
 *
 * A bare "call and repeat" was the state this replaced, and it is unsafe at the bounds the server
 * now runs: the absolute cap is four hours (`./config.ts`), and a poller calling flat out for four
 * hours fills its own context with status payloads and dies holding the round's prose. 15 s is
 * still the right number on the measurements: a healthy round runs ~122 s, so ~8 polls, where 2 s
 * would have been ~60 — and ~960 at the absolute deadline, against ~7200 at 2 s.
 */
export const POLL_AFTER_MS = 15_000;

/** The scheme the transcript resource is served under. */
export const TRANSCRIPT_SCHEME = "code-review";
export const transcriptUri = (reviewId: string): string =>
  `${TRANSCRIPT_SCHEME}://transcript/${encodeURIComponent(reviewId)}`;
/**
 * The id a transcript URI addresses, or null when the URI is not one of ours.
 *
 * The pattern is BUILT from the scheme constant rather than written out: the two halves of this pair
 * are what the resource template is registered under and what a read of it is parsed with, so a
 * scheme rename that reached only one of them would publish URIs the server then refuses to serve.
 */
const TRANSCRIPT_URI_PATTERN = new RegExp(`^${TRANSCRIPT_SCHEME}://transcript/(.+)$`);
export function reviewIdFromTranscriptUri(uri: string): string | null {
  const match = TRANSCRIPT_URI_PATTERN.exec(uri);
  if (match === null || match[1] === undefined) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export interface StartInput {
  change_request_url: unknown;
  cwd?: unknown;
  review_id?: unknown;
}

export interface StartResult {
  review_id: string;
  status: string;
  transcript_uri: string;
  poll_after_ms: number;
}

export interface CancelResult {
  review_id: string;
  status: string;
}

export interface Lifecycle {
  start(input: StartInput): StartResult;
  status(reviewId: unknown): ReviewStatusResult;
  cancel(reviewId: unknown): CancelResult;
  transcript(reviewId: string): string | null;
}

export interface LifecycleDeps {
  backend: ReviewBackend;
  store: ReviewStore;
  effort: string | null;
  model: string | null;
  /** the required environment file's variables, layered over the server's own environment */
  claudeEnv: Record<string, string>;
  /**
   * the ABSOLUTE deadline every review is bounded by, in seconds — the outer of the two bounds.
   * Neither travels on an answer as a figure: both are documented where a caller reads what
   * `code_review_status` does, and named again in the refusal a second start meets (ADR-0007).
   *
   * Neither bound is nullable or optional: both are the server's own constants (`./config.ts`'s
   * `DEADLINE_SEC` and `IDLE_DEADLINE_SEC`) rather than anything a host configures, so "no bound" is
   * not a state this lifecycle can be in — an unbounded review would hold the single in-flight slot
   * for the life of the process with nothing able to release it. They are handed in so a check can
   * drive them with small numbers, which is not the same as configurable: the host boundary offers
   * no knob for either.
   */
  deadlineSec: number;
  /**
   * how long a review may go with NO event before it is aborted, in seconds — the bound that
   * ordinarily ends a wedged round, since a review nothing is coming back from reports nothing. Reset
   * by every event the backend reports, so a review still working is never aborted for being slow.
   */
  idleDeadlineSec: number;
  now?: () => number;
}

/** The largest delay `setTimeout` accepts before Node coerces it to 1 ms — about 24.8 days. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * One bound as a `setTimeout` delay, clamped to that range. Above it the delay is coerced to 1 ms,
 * so a deliberately generous bound — four hours today, and nothing here caps what a later one could
 * be — would fire on the next tick and fail every round under a message saying the opposite.
 */
const boundDelayMs = (sec: number): number => Math.min(MAX_TIMEOUT_MS, Math.max(0, sec * 1000));

/** Ids must survive a URI and a log line unescaped, and must be short enough to read. */
const REVIEW_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ToolError(`${field} is required and must be a non-empty string`);
  }
  return value;
}

/**
 * The change-request URL. Validated for SHAPE only — no forge is named here:
 * a check for a particular host would make the plugin quietly single-forge.
 */
function validateChangeRequestUrl(value: unknown): string {
  const raw = requireString(value, "change_request_url");
  if (/\s/.test(raw))
    throw new ToolError("change_request_url must not contain whitespace");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ToolError(`change_request_url is not a URL: "${raw}"`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ToolError(
      `change_request_url must be an http(s) URL, got "${parsed.protocol}//"`,
    );
  }
  return raw;
}

function validateCwd(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const raw = requireString(value, "cwd");
  let stat: fs.Stats;
  try {
    stat = fs.statSync(raw);
  } catch {
    throw new ToolError(`cwd does not exist: "${raw}"`);
  }
  if (!stat.isDirectory()) throw new ToolError(`cwd is not a directory: "${raw}"`);
  return raw;
}

function validateReviewId(value: unknown, field: string): string {
  const raw = requireString(value, field);
  if (!REVIEW_ID_PATTERN.test(raw)) {
    throw new ToolError(
      `${field} must be 1-128 characters of letters, digits, "." "_" ":" or "-" and start with a ` +
        `letter or digit, got "${raw}"`,
    );
  }
  return raw;
}

export function createLifecycle(deps: LifecycleDeps): Lifecycle {
  const now = deps.now ?? Date.now;
  let inFlightId: string | null = null;
  let inFlightRun: ReviewRun | null = null;
  let deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearInFlight = (): void => {
    inFlightId = null;
    inFlightRun = null;
    if (deadlineTimer !== null) clearTimeout(deadlineTimer);
    deadlineTimer = null;
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
  };

  /**
   * Fold one event in. Absorption is identity-compared rather than status-compared, so "terminal
   * states absorb" is decided in exactly one place — the reducer.
   */
  const apply = (reviewId: string, event: ReviewEvent): void => {
    const record = deps.store.get(reviewId);
    if (record === undefined) return; // evicted: nothing left for the event to move
    const next = reduce(record, event, now());
    if (next === record) return;
    deps.store.put(next);
    if (isTerminal(next.status) && inFlightId === reviewId) clearInFlight();
  };

  /**
   * Abort the run and record the failure one of the bounds produced.
   *
   * It takes the run it was armed for rather than reading `inFlightRun` when it fires. That is about
   * ONE review's bound never reaching another's run: `./backend.ts` permits a backend to emit
   * terminal events in any order, including synchronously inside `start()`, and a timer that
   * resolved the current run at fire time would abort whichever review happened to be in flight by
   * then while recording the failure against the one it was armed for — leaving the new review
   * aborted with no terminal event and the slot held for good.
   *
   * The failure it records is the one code the message-to-event narrowing can never emit, which is
   * why it is spelled out here: a round that ran out of time reported nothing for that narrowing to
   * read. The detail NAMES WHICH bound ran out rather than saying only "its deadline", because
   * running out of time is one cause with more than one way of arriving at it, and every bound a
   * review has reports `deadline_exceeded` (`./review-state.ts`).
   */
  const boundFailed = (reviewId: string, run: ReviewRun, detail: string): void => {
    run.abort("deadline");
    apply(reviewId, { type: "failed", message: failureReason("deadline_exceeded", detail) });
  };

  /**
   * What each bound says when it fires. Constants of this lifecycle, so they are built ONCE here
   * rather than per arming: `armIdle` runs from the emit callback for every event the backend
   * reports — 273 of them on one observed epic — and each run rebuilt a string that depends on
   * nothing but `deps`. Side by side is also where the wording that has to stay distinguishable is
   * easiest to keep so: every bound reports the same `deadline_exceeded` code, so the prose is the
   * only thing that says which one ran out.
   */
  const idleDetail =
    `the review exceeded its idle bound of ${deps.idleDeadlineSec}s with no event and was aborted`;
  const absoluteDetail =
    `the review exceeded its absolute deadline of ${deps.deadlineSec}s and was aborted`;

  /**
   * Arm the IDLE bound: silence for `idleDeadlineSec` and the review is aborted.
   *
   * Rearmed from every event the backend reports, so what it measures is the gap between two events
   * and not the length of the review. That is the whole point of it — a round still emitting events
   * is not the failure a bound exists to catch, and the fixed hour this replaced killed two rounds
   * of one observed epic while they were emitting 273 of them. Any timer still held is cleared
   * first, so a review has one idle bound rather than one per event.
   */
  const armIdle = (reviewId: string, run: ReviewRun): void => {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => boundFailed(reviewId, run, idleDetail),
      boundDelayMs(deps.idleDeadlineSec),
    );
  };

  /**
   * Arm both bounds the server owns. Always: they are constants of this server rather than options
   * (see `./config.ts`), so there is no configuration under which a review runs unbounded.
   *
   * The absolute one is armed here and never rearmed — that is what makes it absolute, and what
   * keeps "never" out of reach of a review that goes on talking for a week. Any timer still held is
   * cleared first, so a bound armed for a review that has already gone cannot fire into this one:
   * the same concern `boundFailed` handles from its own side, by carrying the run it was armed for
   * rather than reading the slot.
   */
  const arm = (reviewId: string, run: ReviewRun): void => {
    if (deadlineTimer !== null) clearTimeout(deadlineTimer);
    deadlineTimer = setTimeout(
      () => boundFailed(reviewId, run, absoluteDetail),
      boundDelayMs(deps.deadlineSec),
    );
    armIdle(reviewId, run);
  };

  const handleFor = (reviewId: string, status: string): StartResult => ({
    review_id: reviewId,
    status,
    transcript_uri: transcriptUri(reviewId),
    poll_after_ms: POLL_AFTER_MS,
  });

  return {
    start(input) {
      const changeRequestUrl = validateChangeRequestUrl(input.change_request_url);
      const cwd = validateCwd(input.cwd);
      const suppliedId =
        input.review_id === undefined || input.review_id === null
          ? null
          : validateReviewId(input.review_id, "review_id");

      deps.store.evict(now());

      // The retry: a caller-supplied id that already names a review addresses THAT review. This is
      // the whole reason the id is an input — a retried start must never become a second review.
      //
      // …but only while that review is still LIVE (PR #11 grill, agenda A1). Handing back a TERMINAL
      // record made a second round inherit the first one's result whole: both rounds get byte-identical
      // spawn contexts, so an agent picking the same id twice would report round 1's prose verbatim,
      // the run's two-completed-rounds bar would pass, and the change request would flip ready having
      // had ONE round — undetectable afterwards, because a round leaves no forge artifact to count.
      // Terminal records stay addressable through `code_review_status` for their whole TTL; what is
      // refused is re-STARTING under their id, which the retry branch was never for.
      if (suppliedId !== null) {
        const existing = deps.store.get(suppliedId);
        if (existing !== undefined && isTerminal(existing.status)) {
          throw new ToolError(
            `review_id "${suppliedId}" already names a review that finished (status ` +
              `${existing.status}), so starting again under it would report that review's result as ` +
              `this one's. Read it with the status tool, or start this review under an id of its own ` +
              `— one round, one id.`,
          );
        }
        if (existing !== undefined) return handleFor(existing.reviewId, existing.status);
      }

      if (inFlightId !== null) {
        const running = deps.store.get(inFlightId);
        // What this says is deliberately NOT "poll it or cancel it" (PR #11 grill, agenda A12). The
        // only shipped caller may take neither: `agents/code-reviewer.md` forbids cancelling
        // outright, and a round-2 agent does not hold round 1's id to poll. The slot is released by
        // a terminal event or by a bound the server owns and nothing else — so the honest,
        // actionable facts are which review holds it, how long it has held it, and that it ends by
        // itself.
        const ageSec =
          running === undefined ? null : Math.max(0, Math.round((now() - running.createdAt) / 1000));
        const age = ageSec === null ? "" : `, running for ${ageSec}s`;
        // BOTH bounds, because the outer one alone is misleading here: the idle bound is what
        // ordinarily ends a wedged round, and the caller reading this is the one waiting on the
        // slot. Giving it only the four-hour figure tells it to expect nothing sooner than four
        // hours from a round that will in fact end after half an hour of silence — the same defect
        // the status tool's own `deadlineSec` description was rewritten to avoid (ticket 04).
        const bound =
          `It reaches a terminal status without anyone acting: after ${deps.idleDeadlineSec}s ` +
          `with no event of any kind, which is what ordinarily ends a wedged review, and by its ` +
          `absolute deadline of ${deps.deadlineSec}s at the latest.`;
        throw new ToolError(
          `a review is already in flight on this server (${inFlightId}, status ` +
            `${running?.status ?? "unknown"}${age}). One review runs at a time. ${bound}`,
        );
      }

      const reviewId = suppliedId ?? `rev-${crypto.randomUUID()}`;
      const record = newRecord({ reviewId, changeRequestUrl, cwd }, now());
      deps.store.put(record);
      inFlightId = reviewId;
      // The slot is claimed BEFORE the backend starts, so a backend that emits synchronously finds
      // it already its own — but a backend that THROWS out of `start()` would then leave it claimed
      // for the life of the process: `clearInFlight()` only ever runs from a terminal event, and a
      // review that never started emits none. Every later `code_review_start` would be refused for
      // an id nothing can move to terminal. Neither shipped backend throws here today (the scripted
      // double's script is parsed at selection, the agent backend's effort at the tool boundary), so
      // this is a guard against a future one, not a fix for a reachable wedge.
      let run;
      try {
        run = deps.backend.start(
          {
            reviewId,
            changeRequestUrl,
            cwd,
            effort: deps.effort,
            model: deps.model,
            claudeEnv: deps.claudeEnv,
          },
          (event) => {
            // Every event the backend reports resets the idle bound, whatever it says: the liveness
            // observer's `running` arrives through this callback exactly as a result message does,
            // and an inner agent that is calling a tool is working. Rearmed BEFORE the fold, so a
            // terminal event arms nothing that `clearInFlight` does not then clear.
            //
            // `inFlightRun` is still null for an event emitted SYNCHRONOUSLY inside `start()`, and
            // nothing is armed at that point either — `arm()` below sets both bounds once the run
            // exists, and only while the slot is still this review's.
            if (inFlightId === reviewId && inFlightRun !== null) armIdle(reviewId, inFlightRun);
            apply(reviewId, event);
          },
        );
      } catch (error) {
        // only if it is still ours: a synchronous terminal event before the throw already released it
        if (inFlightId === reviewId) {
          // The record `put` above must not survive as an unmovable `pending` either: it is not
          // terminal, so `store.evict` never drops it; `arm()` was never reached, so no deadline can
          // fail it; and `agents/code-reviewer.md` tells that agent to retry under the SAME id,
          // which would hit the retry branch above and hand back this dead handle for ever — an
          // agent polling a frozen record until the run's budget is gone. Failing it turns the
          // documented retry into what it says it is: the id addresses that review, and that review
          // says it never started (PR #11 review round 2).
          apply(reviewId, {
            type: "failed",
            // The other code the narrowing cannot reach: a review that never started produced no
            // message to narrow. `backend_error` is what the server knows — the throw says the
            // backend could not begin, and nothing about why the review would have failed.
            message: failureReason(
              "backend_error",
              `the review backend failed to start the review: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
          });
          inFlightId = null;
        }
        throw error;
      }
      // A backend that emitted a terminal event synchronously has already released the slot inside
      // that call (`./backend.ts` permits it). Re-populating it would leave a finished review's run
      // behind a null id and arm bounds nothing can ever clear, so the slot is only furnished
      // while it is still this review's.
      if (inFlightId === reviewId) {
        inFlightRun = run;
        arm(reviewId, run);
      }
      return handleFor(reviewId, deps.store.get(reviewId)?.status ?? record.status);
    },

    status(reviewId) {
      const id = validateReviewId(reviewId, "review_id");
      deps.store.evict(now());
      const record = deps.store.get(id);
      if (record === undefined) {
        throw new ToolError(
          `unknown review id "${id}": this server has no review by that name. It was never ` +
            `started, or it finished long enough ago to have been evicted.`,
        );
      }
      return project(record);
    },

    cancel(reviewId) {
      const id = validateReviewId(reviewId, "review_id");
      deps.store.evict(now());
      const record = deps.store.get(id);
      if (record === undefined) {
        throw new ToolError(`unknown review id "${id}": this server has no review by that name.`);
      }
      // Terminal states absorb, and that includes a cancellation: reporting "cancelled" over a
      // review that had already completed would be the same class of lie as an approving verdict on
      // an unfinished run. The status reported is the one the review actually holds.
      //
      // The reason it records carries NO failure code, deliberately: a cancellation is not one of
      // the six causes, and a seventh word invented for it would open a vocabulary whose whole value
      // is being closed. The status tool documents that the code rides on a failed round instead.
      if (!isTerminal(record.status)) {
        if (inFlightId === id && inFlightRun !== null) inFlightRun.abort("cancelled");
        apply(id, { type: "cancelled", reason: "cancelled by the caller" });
      }
      return { review_id: id, status: deps.store.get(id)?.status ?? record.status };
    },

    transcript(reviewId) {
      const record = deps.store.get(reviewId);
      return record === undefined ? null : record.transcript;
    },
  };
}
