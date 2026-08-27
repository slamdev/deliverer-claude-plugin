/**
 * What one model call the **observation** makes looks like, and what a success that is really a
 * failure is (run-observation ticket 05, moved here whole by ticket 06).
 *
 * **It moved because there are now two callers and one classification.** `./judge.ts` makes the one
 * long-context synthesis per **run**; `./notes.ts` makes up to thirteen cheap calls beside it, one
 * per **dispatch**. Ticket 06's criterion is that ticket 05's classification is *reused* rather than
 * a second one invented, for the reason ticket 05 gives for having it at all: the one outcome this
 * epic must not produce is an SDK error reading as a run with nothing wrong with it. A second copy
 * of these four patterns would drift, and the half that drifted would be the half nobody reads.
 *
 * Nothing here judges anything and nothing here writes a document. It is the SDK's shape, the four
 * failures it reports as successes, and how a call's own spend is read.
 *
 * **`observer/` never imports from `server/`.** `hooks/install-mcp-server.sh` publishes them as two
 * independent symlinked trees, so an import across them would make observation depend on a tree
 * published by a different process — which is why the review's classification is re-implemented in
 * this file rather than imported from `../server/agent-backend.ts`, and why `./records.ts`
 * re-implements `e2e-tests`' token rule.
 */
import { NO_TOKENS, addTokens } from "./records.ts";
import type { ObservationCost } from "./debrief-file.ts";

/* ────────────────────────────────────── the SDK ────────────────────────────────────── */

/** The package the Agent SDK ships as, installed beside this source by the `SessionStart` hook. */
export const AGENT_SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";

/**
 * The `query` the observation needs, stated structurally rather than imported as a type.
 *
 * The SDK is loaded through a dynamic import, so nothing here carries a static dependency on it:
 * an observation on a host whose install has not finished must still produce a debrief saying what
 * was missing, and a static import would take the whole observer down instead.
 */
export type QueryMessage = Record<string, unknown>;
export type Query = (params: {
  prompt: string;
  options: Record<string, unknown>;
}) => AsyncIterable<QueryMessage>;

/** The SDK, or the reason it is not here. Never throws: a missing install is a debrief's answer. */
export type LoadedQuery =
  | { readonly kind: "loaded"; readonly query: Query }
  | { readonly kind: "missing"; readonly why: string };

export async function loadQuery(): Promise<LoadedQuery> {
  try {
    const { query } = (await import(AGENT_SDK_PACKAGE)) as { query: Query };
    return { kind: "loaded", query };
  } catch (error) {
    return {
      kind: "missing",
      why:
        `the Agent SDK (${AGENT_SDK_PACKAGE}) could not be loaded: ${errorText(error)}. The ` +
        `plugin's SessionStart install hook installs it beside the observer's own source; a later ` +
        `run is observed as usual once that has succeeded`,
    };
  }
}

/** Overridable for the reason `./observer.ts`'s own bounds are, and told apart from a real `0`. */
export function bound(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/* ─────────────────────────── a success that is really a failure ─────────────────────────── */

/**
 * The SDK's own not-logged-in answer, anchored to the START of the result.
 *
 * **The first of these four is exactly what an environment with no usable credential produces**, and
 * without this branch every debrief on such a machine would carry a login error where its defects
 * belong. The anchor is what keeps a synthesis whose own prose discusses a login defect from failing
 * its own call.
 */
const NOT_LOGGED_IN = /^\s*not logged in\b/i;

/** The other answers the SDK reports as a SUCCESS while the whole result is its own failure text. */
const SDK_FAILURES: readonly { readonly pattern: RegExp; readonly code: string }[] = [
  { pattern: /^\s*API Error:\s*Connection closed mid-response\b/i, code: "connection_lost" },
  { pattern: /^\s*Prompt is too long\b/i, code: "prompt_too_long" },
];

/**
 * The failure a success-shaped result is really carrying, or `undefined` for a real answer.
 *
 * `noRoom` is what a prompt-too-long MEANS to the caller, and it is the caller's because the two
 * callers mean different things by it: for the synthesis it is a provider without the long-context
 * window, and for a **dispatch note** it is this file's own cap having failed to bound a slice.
 * Everything else about the four is identical, which is the whole reason they are in one place.
 */
export function failureInText(
  text: string,
  what: string,
  noRoom: string,
): { code: string; detail: string } | undefined {
  if (text.trim() === "") {
    return {
      code: "no_result",
      detail:
        `${what} was reported as successful, but its result carries no text at all, so there is ` +
        `nothing to read`,
    };
  }
  if (NOT_LOGGED_IN.test(text)) {
    return {
      code: "not_logged_in",
      detail:
        `${what} ran but was NOT LOGGED IN, so nothing was judged — it answered: ` +
        `${text.trim().slice(0, 300)}. The observer authenticates with whatever the session it was ` +
        `started beside authenticates with, and it reads no credential file of its own: the ` +
        `plugin's code_review_claude_env_file names the identity the REVIEW runs as and stays the ` +
        `review's`,
    };
  }
  const self = SDK_FAILURES.find(({ pattern }) => pattern.test(text));
  if (self !== undefined) {
    return {
      code: self.code,
      detail:
        `${what} was reported as successful, but its result opens with the SDK's own failure text ` +
        `rather than with an answer, so nothing was judged — it answered: ` +
        `${text.trim().slice(0, 300)}` + (self.code === "prompt_too_long" ? `. ${noRoom}` : ""),
    };
  }
  return undefined;
}

/* ───────────────────────────── what the observation itself cost ───────────────────────────── */

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

/**
 * A counter nobody measured and a counter measured at zero are the same answer: unknown.
 * `CONTEXT.md` defines **spend** so that unknown is the honest answer for a figure nobody measured
 * and never zero.
 */
const measured = (count: number | undefined): number | undefined =>
  count === undefined || count === 0 ? undefined : count;

/** One token counter summed across every `modelUsage` entry, which is where a delegating call's
 *  tokens are — the same rule a **round**'s spend is read by, and the reason it sums rather than
 *  picking one entry: every model in that map is real spend. */
function summed(perModel: Record<string, unknown>, field: string): number | undefined {
  let total: number | undefined;
  for (const value of Object.values(perModel)) {
    const count = asNumber(asRecord(value)?.[field]);
    if (count === undefined) continue;
    total = (total ?? 0) + count;
  }
  return total;
}

/**
 * What the result message says this call spent.
 *
 * Read the way a **round**'s spend already is: the per-model usage whenever the message carries
 * any, and the aggregate counters otherwise, with the source chosen ONCE per message rather than
 * once per counter — mixing the two scopes into one row is a measured failure the review already
 * met. The dollar figure is the SDK's own, and it is the one real money figure a debrief holds:
 * ticket 03 found none for the run itself, because the host records no money anywhere.
 *
 * `modelCalls` is one because this reads ONE call. An observation makes up to fourteen of them, and
 * summing them is `addCosts` below (run-observation ticket 06).
 */
export function costFromResult(message: QueryMessage, assistantTurns: number): ObservationCost {
  const perModel = asRecord(message.modelUsage) ?? {};
  const aggregate = asRecord(message.usage);
  const fromPerModel = Object.keys(perModel).length > 0;
  const counter = (perModelField: string, aggregateField: string): number =>
    (fromPerModel
      ? summed(perModel, perModelField)
      : asNumber(aggregate?.[aggregateField])) ?? 0;
  // A result carrying NEITHER shape measured nothing, and `TokenTotals` says that by counting no
  // requests — which is what makes the debrief's line read "no tokens reported" rather than four
  // confident zeros. Inside a shape that IS there, an absent field rides as 0, exactly as
  // `./records.ts` treats an absent counter on a request that happened.
  const nothingMeasured = !fromPerModel && aggregate === undefined;
  return {
    modelCalls: 1,
    tokens: nothingMeasured
      ? NO_TOKENS
      : {
          // The SDK reports turns, not API requests, and one turn is one request here: there is no
          // second reader and no sub-agent in this call. `num_turns` reading zero is the review's
          // measured case, so the turns actually seen stand in — never a confident zero.
          requests: measured(asNumber(message.num_turns)) ?? assistantTurns,
          inputTokens: counter("inputTokens", "input_tokens"),
          outputTokens: counter("outputTokens", "output_tokens"),
          cacheWriteTokens: counter("cacheCreationInputTokens", "cache_creation_input_tokens"),
          cacheReadTokens: counter("cacheReadInputTokens", "cache_read_input_tokens"),
        },
    costUsd: measured(asNumber(message.total_cost_usd)),
  };
}

/**
 * Two calls' cost as one figure (run-observation ticket 06).
 *
 * **A side that made no calls is the identity and contributes nothing at all — not even a measured
 * zero.** That is the whole subtlety, and getting it wrong is measured: the notes' running total
 * starts at `NOTHING_SPENT`, whose dollars are a real `0` because no call had been made, and a
 * plain sum would let that zero swallow the `undefined` of every unmeasured call after it. A
 * debrief of five calls that priced none of them then reads `$0.00` where it owes the reader
 * `unknown` — the one thing `CONTEXT.md`'s definition of **spend** forbids.
 *
 * Where both sides did make calls the measured dollars sum and an unmeasured one rides as nothing,
 * exactly as an absent token counter does inside a usage shape that IS there. Where neither
 * measured anything the total is unknown.
 */
export function addCosts(left: ObservationCost, right: ObservationCost): ObservationCost {
  return {
    modelCalls: left.modelCalls + right.modelCalls,
    tokens: addTokens(left.tokens, right.tokens),
    costUsd:
      left.modelCalls === 0
        ? right.costUsd
        : right.modelCalls === 0
          ? left.costUsd
          : left.costUsd === undefined && right.costUsd === undefined
            ? undefined
            : (left.costUsd ?? 0) + (right.costUsd ?? 0),
  };
}

/** Which model actually served the call, off the per-model usage the result carries. */
export function servedBy(message: QueryMessage): string | undefined {
  const perModel = asRecord(message.modelUsage) ?? {};
  const keys = Object.keys(perModel);
  return keys.length === 0 ? undefined : keys.join(", ");
}

/** What a call that never got as far as a result cost: nothing measurable, and never zero. */
export const NOTHING_MEASURED: ObservationCost = {
  modelCalls: 1,
  tokens: NO_TOKENS,
  costUsd: undefined,
};

/** What a call that was never made cost: nothing, measured. */
export const NOTHING_SPENT: ObservationCost = { modelCalls: 0, tokens: NO_TOKENS, costUsd: 0 };
