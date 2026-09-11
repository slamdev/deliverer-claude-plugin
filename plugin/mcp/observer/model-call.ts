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
import { NO_TOKENS, addTokens, type RequestUsage } from "./records.ts";
import { pricingOf } from "./rates.ts";
import type { CostBasis, ObservationCost } from "./debrief-file.ts";

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

/**
 * The code that one carries, named once (one-environment-file ticket 04; D11).
 *
 * Both callers compare a classification against it to decide whether a failure ends the judging,
 * and a bare string literal in each of them is exactly the drift nothing would catch.
 */
export const NOT_LOGGED_IN_CODE = "not_logged_in";

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
      code: NOT_LOGGED_IN_CODE,
      // What this sentence used to say was that the observer reads no credential file of its own
      // and that the plugin's option "names the identity the REVIEW runs as and stays the review's"
      // — the opposite of what is true since one file began authenticating every model call the
      // plugin makes (one-environment-file ticket 04; D18, with ADR-0009 holding the decision), and
      // it said it in the one document a maintainer reads. Where this detail lands NOW is the notes
      // file and not the debrief: the debrief says the whole of it once, in `./judge.ts`.
      detail:
        `${what} ran but was NOT LOGGED IN, so nothing was judged — it answered: ` +
        `${text.trim().slice(0, 300)}. No credential reached this observation: what the plugin's ` +
        `code_review_claude_env_file option names is what its model calls run under, layered over ` +
        `the environment the observation was started in`,
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

/* ──────────────────── the one failure that ends the judging, once ──────────────────── */

/**
 * That no credential reached this observation, remembered for the life of it
 * (one-environment-file ticket 04; D11).
 *
 * **The first result classified `not_logged_in` ends the judging**: no further **dispatch note** is
 * attempted and the synthesis is not attempted. What the human is owed is that fact once, in the
 * line they were going to be shown anyway and in one place in the **debrief** — not the same
 * sixty-word disclaimer thirteen times over where the account of each stage's interior belongs.
 *
 * **Sticky, and that is the whole of why this is an object rather than a local.** The notes half
 * catches up on every rewrite of a live debrief and the synthesis runs at the finalise, so a fact
 * remembered for one rewrite only would be rediscovered on the next — which is the defect this
 * exists to prevent rather than a tidiness. One of these per observation, built where the
 * **environment file** is read (`./judge.ts`'s factory, D3) and shared by the two halves that
 * spend, because either of them may be the call that learns it: the notes ordinarily, and the
 * synthesis on a run whose dispatches had no interior to read.
 *
 * **Only that one classification closes it.** No result, prompt too long and connection lost are
 * per-call conditions — a lost connection may come back, and an oversized slice says nothing about
 * the next one — so none of them may cost a run every remaining note.
 */
export interface CredentialGate {
  /** whether a call has already come back not logged in */
  readonly closed: () => boolean;
  /** remember that one has, for the rest of this observation */
  readonly close: () => void;
}

export function credentialGate(): CredentialGate {
  let closed = false;
  return {
    closed: () => closed,
    close: () => {
      closed = true;
    },
  };
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
 * met.
 *
 * **The dollar figure is the SDK's own where it reported one, and this plugin's own rate table where
 * it did not** (the-observation-reports-the-whole-run ticket 06; D17). Measured beats computed and
 * computed beats unknown, and the debrief says which of the two it got: the host still records no
 * money in a session record, so the run's own spend is priced from that same table, and holding the
 * observation to a lower standard than the run it reports on is the thing this closes.
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
  const reported = measured(asNumber(message.total_cost_usd));
  // The table's answer, computed only where the SDK gave none: measured beats computed (D17). It
  // needs the model, which the per-model usage is the only carrier of — a result with the aggregate
  // counters alone names none, so that one stays unknown rather than being priced at a rate nothing
  // in it chose.
  const priced = reported !== undefined ? undefined : pricingOf(usagesOf(perModel)).usd;
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
    costUsd: reported ?? priced,
    costBasis: reported !== undefined ? "measured" : priced === undefined ? "none" : "priced",
  };
}

/**
 * One `modelUsage` entry per model, in the shape `./rates.ts` prices a request in (ticket 06; D17).
 *
 * **Per model, because the rate is the model's.** One call's usage map holds an entry for each model
 * that served any part of it — the synthesis delegates to none, but a result is free to report
 * several — and a total priced at one of their rates would be a figure about a model rather than
 * about the call.
 *
 * **The cache write rides at the five-minute TTL**, exactly as `./records.ts` does for a record
 * carrying no split: `modelUsage` reports one flat `cacheCreationInputTokens` and five minutes is the
 * host's own default, so this is the same claim made in the same direction rather than a second rule.
 */
function usagesOf(perModel: Record<string, unknown>): readonly RequestUsage[] {
  const usages: RequestUsage[] = [];
  for (const [model, value] of Object.entries(perModel)) {
    const usage = asRecord(value) ?? {};
    const write = asNumber(usage["cacheCreationInputTokens"]) ?? 0;
    usages.push({
      requestId: model,
      model,
      effort: undefined,
      // Nothing here carries one: a message id belongs to a request in a session record, and this is
      // the SDK's own summary of a call the observation made itself.
      messageId: undefined,
      inputTokens: asNumber(usage["inputTokens"]) ?? 0,
      outputTokens: asNumber(usage["outputTokens"]) ?? 0,
      cacheWriteTokens: write,
      cacheWrite5mTokens: write,
      cacheWrite1hTokens: 0,
      cacheReadTokens: asNumber(usage["cacheReadInputTokens"]) ?? 0,
    });
  }
  return usages;
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
    costBasis: addBases(left, right),
  };
}

/**
 * How two sides' bases combine (ticket 06; D17).
 *
 * A side that made no call has no basis to contribute, exactly as it contributes no dollars — and one
 * measured side beside one priced side is `both`, which is the honest word for the sum: part of it
 * billed at that figure and part of it is this plugin's arithmetic.
 */
function addBases(left: ObservationCost, right: ObservationCost): CostBasis {
  if (left.modelCalls === 0 || left.costBasis === "none") return right.costBasis;
  if (right.modelCalls === 0 || right.costBasis === "none") return left.costBasis;
  return left.costBasis === right.costBasis ? left.costBasis : "both";
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
  // Nor priced: a call that never reached a result reported no tokens either, and there is nothing
  // for the table to be applied to (ticket 06; D17).
  costBasis: "none",
};

/** What a call that was never made cost: nothing, measured. */
export const NOTHING_SPENT: ObservationCost = {
  modelCalls: 0,
  tokens: NO_TOKENS,
  costUsd: 0,
  costBasis: "none",
};
