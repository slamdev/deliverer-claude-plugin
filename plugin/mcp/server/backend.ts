/**
 * What a review backend is (delegated-review issue 04).
 *
 * The lifecycle owns the state machine, the store, the deadline and the tool contract; a backend
 * owns nothing but "run this review and tell me what happens". Two of them exist by design: the
 * scripted double that ships beside the server (`./scripted-backend.ts`) and the real Agent-SDK run
 * that drives the platform's own code review (issue 05). Because the double is selected through the
 * same environment the server already reads for effort and model, the whole lifecycle is testable
 * with no LLM and no forge.
 */
import type { ReviewEvent } from "./review-state.ts";

/** Everything a backend is told. Effort and model are startup configuration, never per-call inputs. */
export interface ReviewRequest {
  reviewId: string;
  prUrl: string;
  /** the delivery worktree the review runs in, or null when the caller named none */
  cwd: string | null;
  effort: string | null;
  model: string | null;
  /**
   * the variables the owner's REQUIRED environment file assigned, to be layered over the server's
   * own environment — startup configuration like the two above, and for the same reason: a caller
   * must not be able to choose the identity a review runs as.
   */
  claudeEnv: Record<string, string>;
}

/** A backend run in progress. `abort` is called for a cancellation and for a deadline alike. */
export interface ReviewRun {
  abort(reason: string): void;
}

export interface ReviewBackend {
  /** the id this backend was selected by, reported so a caller can never mistake one for the other */
  readonly id: string;
  /**
   * Start the run and return immediately — `code_review_start` must answer in under a second, so a
   * backend that blocked here would break the contract rather than slow it down.
   *
   * `emit` may be called after `abort`, and may be called after a terminal event: the reducer
   * absorbs both. A backend is not required to police its own ordering.
   */
  start(request: ReviewRequest, emit: (event: ReviewEvent) => void): ReviewRun;
}
