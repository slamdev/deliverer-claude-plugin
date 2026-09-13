/**
 * What a token costs, and the arithmetic that turns a **run**'s tokens into dollars
 * (the-observation-reports-the-whole-run ticket 06; D12 through D18).
 *
 * **Why this file exists at all.** `CONTEXT.md` has defined **spend** as "its tokens, and a dollar
 * estimate labelled with the provider that served it" since the term was written, and the dollar
 * half had never been delivered: there was no price table anywhere in `observer/`, so a **debrief**
 * could price its own observation at $1.22 — `./model-call.ts` reads the SDK's own
 * `total_cost_usd` — while reporting the four-hour run it observed as **In dollars: unknown**. What
 * that absence cost was measured: the run under examination, unable to be told what it had spent,
 * analysed *itself* in twelve orchestrator requests at 250,960–307,711 tokens of context for **$5.29
 * — 16.8% of the run** — and arrived at $77.22, wrong by two and a half times against the $28.19 the
 * same records price at. The alternative to a priced debrief was never "no figure".
 *
 * **No network, ever** (D12). An observation must stay reproducible from a record on disk — that is
 * the seam every ticket of this epic is verified at — and it has never needed a network for
 * anything. So the rates are constants here, beside the one date the debrief prints, and a
 * contributor updates them from the source named below rather than from memory.
 *
 * **First-party Anthropic rates only, knowingly** (D13). Partner platforms price separately, and the
 * only vendor signal a session record carries is the prefix on a request's message id — the measured
 * run's are all `msg_bdrk_*`. A partner-billed run is therefore priced at first-party rates *and the
 * debrief says both facts*, so a reader comparing this figure against their own bill finds the
 * explanation in the document. One rate set to maintain, against an approximation on a
 * partner-billed run.
 *
 * **A figure with a stated basis beats unknown; a figure presented as exact would be worse than
 * either.** So everything a reader needs to weigh this number travels with it: the date, the model
 * it priced, the message id prefix, and the requests it could not price at all.
 */
import type { RequestUsage } from "./records.ts";

/* ────────────────────────────────────── the rates ────────────────────────────────────── */

/**
 * The day the rates below were read, printed by the debrief beside every figure they produced.
 *
 * **One date for the whole table and not one per row**, because what a reader needs is how old the
 * arithmetic is, and a per-row date would let the oldest row hide behind a newer one.
 */
export const RATES_AS_OF = "2026-06-24";

/**
 * Where they were read from, in the debrief's own words.
 *
 * **This is the reference this repository uses for anything about the Claude API, and the same one a
 * later contributor updates the table from** — never a model's memory of a price. The date above is
 * that source's own cache date rather than the day this file was edited: what a reader is weighing is
 * the age of the figures, not the age of the commit.
 */
export const RATES_SOURCE = "the `claude-api` skill's own model table";

/** What one model costs per million tokens, as the source states it. */
interface ModelRate {
  readonly inputPerMTok: number;
  readonly outputPerMTok: number;
  /**
   * This model's cache-read multiplier where it is not the usual one.
   *
   * D14 settles a flat 0.1×, which is what every model in the tier the observer has ever met takes.
   * The Fable 5.1 row is the one exception the source records — cache reads at $0.25/MTok against a
   * $10 input rate, a quarter of what the flat rule would charge — and since cache reads are the bulk
   * of a long agentic run's tokens, applying 0.1× there would overstate the dominant term of the sum
   * fourfold. Its Mythos counterpart is deliberately NOT given the override: the source says whether
   * that model shares the rate is open, and a figure this file cannot ground takes the general rule.
   */
  readonly cacheReadMultiplier?: number;
}

/**
 * Cache writes cost more than input and cache reads cost far less, per TTL (D14).
 *
 * `usage.cache_creation` splits a request's writes into `ephemeral_5m_input_tokens` and
 * `ephemeral_1h_input_tokens`, so the two are priced apart and the figure needs no range — and must
 * not be presented as one. Every write in the run this was measured against is five-minute.
 */
export const CACHE_WRITE_5M_MULTIPLIER = 1.25;
export const CACHE_WRITE_1H_MULTIPLIER = 2;
export const CACHE_READ_MULTIPLIER = 0.1;

/**
 * Per model id, dollars per million tokens, as of `RATES_AS_OF` from `RATES_SOURCE`.
 *
 * **Only the models that source prices.** The legacy and deprecated ids it lists — `claude-opus-4-5`,
 * `claude-sonnet-4-5`, `claude-opus-4-1` and the rest — carry no price there, so they are absent
 * here rather than guessed at: D15 makes an id this table does not know a named gap in the debrief,
 * which is the honest answer and is never a zero.
 */
const RATES: Readonly<Record<string, ModelRate>> = {
  // The source's own note: Claude Fable 5.1's cache reads are $0.25/MTok — 0.025× — where every other
  // row's are the flat 0.1×.
  "claude-fable-5-1": { inputPerMTok: 10, outputPerMTok: 50, cacheReadMultiplier: 0.025 },
  "claude-mythos-5-1": { inputPerMTok: 10, outputPerMTok: 50 },
  "claude-fable-5": { inputPerMTok: 10, outputPerMTok: 50 },
  // Priced off the same source's catalogue rather than its headline table, which omits this row:
  // Claude Mythos 5 is stated there to have the same tier, limits and per-token pricing as its Fable
  // counterpart.
  "claude-mythos-5": { inputPerMTok: 10, outputPerMTok: 50 },
  "claude-opus-5": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-7": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-6": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
};

/**
 * The rate for one model id as a record names it, or `undefined` where this table has none.
 *
 * **A dated id is the same model as its alias**, which the source states for every model that has
 * both, so a trailing `-YYYYMMDD` is dropped and the alias tried once. Without it a run served
 * `claude-haiku-4-5-20251001` would price nothing while the id a contributor sees in the table looks
 * like a match — a gap that reads as this file being out of date rather than as the record naming a
 * model nobody priced.
 */
function rateFor(model: string): ModelRate | undefined {
  return RATES[model] ?? RATES[model.replace(/-\d{8}$/, "")];
}

/* ─────────────────────────────── what pricing a run found ─────────────────────────────── */

/**
 * A set of API requests priced, with everything a reader needs to weigh the figure.
 *
 * **It carries what it could NOT price beside what it could**, because those are the two halves of
 * one honest answer: a run whose model this table has never heard of must read as a named gap and
 * never as a cheap run (D15).
 */
export interface Pricing {
  /**
   * The dollars, or `undefined` where nothing here could be priced at all.
   *
   * Unknown and never zero, which is what `CONTEXT.md`'s **spend** requires of a figure nobody could
   * compute — and the reason this is not a plain sum starting at 0.
   */
  readonly usd: number | undefined;
  readonly pricedRequests: number;
  /** requests carrying tokens that no rate here covers, which the figure above leaves out */
  readonly unpricedRequests: number;
  /** the model ids that WERE priced, as the records name them, in first-seen order */
  readonly models: readonly string[];
  /** the model ids this table does not know, named so a missing rate cannot read as a cheap run */
  readonly unknownModels: readonly string[];
  /** the prefixes the priced requests' message ids carry — the only vendor signal a record has */
  readonly idPrefixes: readonly string[];
}

export const NOTHING_PRICED: Pricing = {
  usd: undefined,
  pricedRequests: 0,
  unpricedRequests: 0,
  models: [],
  unknownModels: [],
  idPrefixes: [],
};

/** The stand-in a request whose usage names no model at all is reported under. */
export const NO_MODEL_NAMED = "no model named on the request";

/**
 * What one request costs, at this table's rates.
 *
 * Priced per request rather than off a run's totals because the rate is the request's own: one run's
 * orchestrator and its **dispatch**es need not have been served by the same model, and a total
 * priced at one row's rate would be a figure about a model rather than about the run.
 */
function priceOf(usage: RequestUsage, rate: ModelRate): number {
  const perMTok = (tokens: number, dollars: number): number => (tokens / 1_000_000) * dollars;
  return (
    perMTok(usage.inputTokens, rate.inputPerMTok) +
    perMTok(usage.outputTokens, rate.outputPerMTok) +
    perMTok(usage.cacheWrite5mTokens, rate.inputPerMTok * CACHE_WRITE_5M_MULTIPLIER) +
    perMTok(usage.cacheWrite1hTokens, rate.inputPerMTok * CACHE_WRITE_1H_MULTIPLIER) +
    perMTok(
      usage.cacheReadTokens,
      rate.inputPerMTok * (rate.cacheReadMultiplier ?? CACHE_READ_MULTIPLIER),
    )
  );
}

/**
 * Every request in, one figure and its basis out.
 *
 * **A request that recorded no tokens is passed over entirely**, and it is not a gap: it prices at
 * nothing under any rate, so naming the model it carried would put the host's own placeholder
 * entries — `<synthetic>` among them — in the debrief as models nobody could price, next to the
 * figure they cost nothing of.
 */
export function pricingOf(usages: Iterable<RequestUsage>): Pricing {
  let usd: number | undefined;
  let pricedRequests = 0;
  let unpricedRequests = 0;
  const models: string[] = [];
  const unknownModels: string[] = [];
  const idPrefixes: string[] = [];
  for (const usage of usages) {
    const tokens =
      usage.inputTokens + usage.outputTokens + usage.cacheWriteTokens + usage.cacheReadTokens;
    if (tokens === 0) continue;
    const rate = usage.model === undefined ? undefined : rateFor(usage.model);
    if (rate === undefined) {
      unpricedRequests += 1;
      add(unknownModels, usage.model ?? NO_MODEL_NAMED);
      continue;
    }
    pricedRequests += 1;
    usd = (usd ?? 0) + priceOf(usage, rate);
    add(models, usage.model ?? NO_MODEL_NAMED);
    const prefix = idPrefixOf(usage.messageId);
    if (prefix !== undefined) add(idPrefixes, prefix);
  }
  return { usd, pricedRequests, unpricedRequests, models, unknownModels, idPrefixes };
}

function add(into: string[], value: string): void {
  if (!into.includes(value)) into.push(value);
}

/**
 * Two sets of requests priced as one figure.
 *
 * **A side that priced nothing contributes nothing at all — not even a measured zero**, which is the
 * same subtlety `./model-call.ts`'s `addCosts` carries and for the same reason: a plain sum would let
 * one side's `0` swallow the other's `undefined`, and a run nobody could price would report `$0.00`
 * where it owes the reader `unknown`.
 */
export function addPricing(left: Pricing, right: Pricing): Pricing {
  const merge = (one: readonly string[], other: readonly string[]): readonly string[] => {
    const all = [...one];
    for (const value of other) add(all, value);
    return all;
  };
  return {
    usd:
      left.usd === undefined && right.usd === undefined
        ? undefined
        : (left.usd ?? 0) + (right.usd ?? 0),
    pricedRequests: left.pricedRequests + right.pricedRequests,
    unpricedRequests: left.unpricedRequests + right.unpricedRequests,
    models: merge(left.models, right.models),
    unknownModels: merge(left.unknownModels, right.unknownModels),
    idPrefixes: merge(left.idPrefixes, right.idPrefixes),
  };
}

/* ──────────────────────────── the basis a figure is stated with ──────────────────────────── */

/**
 * The vendor tag on a message id, and `undefined` where the id carries none.
 *
 * **The prefix and never the id** — a request's own id is bookkeeping of the run's, and the prefix is
 * the whole of what says anything about who served it: `msg_bdrk_` is Amazon Bedrock's shape,
 * `msg_vrtx_` Google Vertex AI's, and a plain `msg_` followed by the id itself is the first-party
 * one. Anything that is not message-id-shaped at all is passed over rather than printed: it would be
 * a string out of a record in a document that says on its face it carries none (ADR-0018).
 */
export function idPrefixOf(messageId: string | undefined): string | undefined {
  if (messageId === undefined) return undefined;
  const match = /^(msg_(?:[a-z]+_)?)/.exec(messageId);
  return match?.[1];
}

/** The first-party message id shape, which every other prefix is a partner platform's. */
export const FIRST_PARTY_ID_PREFIX = "msg_";

/**
 * What the message ids say about who served these requests, in the debrief's own words (D13).
 *
 * Three answers, and the middle one is the reason this exists: a run whose ids name a partner is
 * priced at first-party rates anyway, and the reader is told both facts in one sentence so that a
 * discrepancy against their own AWS bill has an explanation in the document rather than none.
 */
export function vendorClause(prefixes: readonly string[]): string {
  const partner = prefixes.filter((it) => it !== FIRST_PARTY_ID_PREFIX);
  const named = prefixes.map((it) => `\`${it}*\``).join(", ");
  if (prefixes.length === 0) {
    return (
      "No request here carries a message id, so nothing says which platform served it; these are " +
      "first-party rates either way."
    );
  }
  if (partner.length === 0) {
    return (
      `These requests' message ids are ${named} — the first-party shape, which is what these rates ` +
      `are.`
    );
  }
  return (
    `These requests' message ids are ${named}, and a prefix past \`${FIRST_PARTY_ID_PREFIX}\` is a ` +
    `partner platform's rather than Anthropic's own. **Partner platforms price separately, and ` +
    `these are first-party rates regardless** — the message id prefix is the only vendor signal a ` +
    `session record carries, so this figure is close rather than exact, and a difference against ` +
    `that platform's own bill is expected.`
  );
}

/**
 * How the table itself is stated, wherever a figure it produced is printed.
 *
 * One sentence, in one place, because it appears beside the run's spend and beside the observation's
 * own and the two must not drift into two accounts of one table.
 */
export function ratesClause(models: readonly string[]): string {
  const named = models.map((it) => `\`${it}\``).join(", ");
  return (
    `Priced from this plugin's own rate table, ${
      models.length === 0 ? "which named no model here" : `at the rates for ${named}`
    }, as of ${RATES_AS_OF} from ${RATES_SOURCE}: cache writes at ` +
    `${CACHE_WRITE_5M_MULTIPLIER}× input on the five-minute TTL and ${CACHE_WRITE_1H_MULTIPLIER}× ` +
    `on the one-hour one, and ${cacheReadClause(models)}. The table ships in the plugin and ` +
    `reaches no network, so this figure is reproducible from the records on disk.`
  );
}

/**
 * What cache reads were priced at, for the models this figure covers — and never the flat rule where
 * the arithmetic did not use it (the-observation-reports-the-whole-run ticket 06; D14).
 *
 * **This clause exists to be checkable, so it has to be what `priceOf` did.** D14's 0.1× is the
 * general rule and `RATES`'s Fable 5.1 row overrides it at 0.025×, so a sentence that always said
 * 0.1× misstated the dominant term of a long agentic run — where cache reads are the bulk of the
 * tokens — by four times, on the one model the table prices them differently for. Story 10 is the
 * stated basis, and a basis a reader cannot reproduce by hand is worse than no basis at all.
 *
 * **Grouped by the multiplier and not by the model**, because one figure may cover several: a run
 * whose orchestrator and **dispatch**es were served by different models prices each request at its
 * own row, and the reader needs to know which of the rates applied to which. Where they all take one
 * rate — every run measured so far — it reads exactly as it did before, with no model named.
 */
function cacheReadClause(models: readonly string[]): string {
  const byMultiplier = new Map<number, string[]>();
  for (const model of models) {
    // Through `rateFor`, so a dated id groups with the alias it prices at rather than falling to the
    // general rule the way a lookup in `RATES` alone would.
    const multiplier = rateFor(model)?.cacheReadMultiplier ?? CACHE_READ_MULTIPLIER;
    const held = byMultiplier.get(multiplier);
    if (held === undefined) byMultiplier.set(multiplier, [model]);
    else held.push(model);
  }
  const applied = [...byMultiplier.keys()];
  // Nothing priced states the rule, which is all there is to state: no request took any rate at all.
  if (applied.length <= 1) return `reads at ${applied[0] ?? CACHE_READ_MULTIPLIER}×`;
  const groups = [...byMultiplier].map(
    ([multiplier, named]) => `${multiplier}× for ${named.map((it) => `\`${it}\``).join(", ")}`,
  );
  return `reads at ${groups.join(" and ")}`;
}

/** What the table could not price, in the reader's words, and `""` where it priced everything. */
export function unpricedClause(pricing: Pricing): string {
  if (pricing.unpricedRequests === 0) return "";
  const named = pricing.unknownModels.map((it) => `\`${it}\``).join(", ");
  const one = pricing.unpricedRequests === 1;
  return (
    ` **${pricing.unpricedRequests} of these requests ${one ? "is" : "are"} not in the figure ` +
    `above**: ${one ? "it names" : "they name"} ${named}, which this table has no rate for, so ` +
    `${one ? "it prices" : "they price"} nothing at all. A model nobody could price is named here ` +
    `rather than counted as free.`
  );
}
