# 05 — The models that ran are priced

**What to build:** a human opening a debrief of a run served by `claude-opus-5-5` or `claude-sonnet-5-5` finds its
headline carrying a dollar figure rather than "spend unknown". The observer's rate table carries both models, from the
source it already takes every rate from, with its as-of date moved to match. Settled as Solution item 5 in
`../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Both models are in the table at the rates the `claude-api` skill's model table gives, read at the time of the
      change rather than recalled.
- [x] The as-of date moves to the date those rates were read.
- [x] Any other model that source now prices and the table lacks is added in the same change, or named as left out.
- [x] Either record from `../spec.md` § The source replays to a debrief whose headline carries dollars, and whose
      account of unpriced requests no longer names either model.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

Verified by hand, 2026-10-28.

- **Rates read from the source at the time of the change.** The `claude-api` skill (bundled 2.1.311) states its model
  table as cached 2026-10-06: `claude-opus-5-5` $4 / $20 per MTok with cache reads $0.20 (0.05x, so the row carries a
  `cacheReadMultiplier` of 0.05 rather than the flat 0.1x); `claude-sonnet-5-5` $2 / $10, cache reads $0.20 (the flat
  0.1x). `RATES_AS_OF` moves from 2026-06-24 to 2026-10-06 — the source's own cache date, as the constant's comment
  requires, not the edit date.
- **Other models the source now prices.** `claude-haiku-5-5` is priced there and **left out, named in `rates.ts`**: it
  has two rate cards chosen by prompt length ($0.10 / $0.50 up to 100K tokens, $0.50 / $2.50 above), and a row here
  holds one rate, so the lower card would understate a long-prompt request fivefold. It stays a named gap. Separately,
  the source now states that `claude-mythos-5-1` shares Fable 5.1's $0.25 cache-read rate, which the old comment had
  called open; that row now carries the same 0.025x override.
- **Replay** (copies of both records under `/tmp/idp-05/`, scratch `CLAUDE_PLUGIN_DATA`, script
  `/tmp/idp-05/check.sh`). Before the change both headlines read "spend unknown", "In dollars: unknown", and "1270 of
  these requests are not in the figure above: they name `claude-opus-5-5`, `claude-sonnet-5-5`". After: the build
  record reads `about $51.81` in its headline and "In dollars: $51.81", the refinement record `about $14.02` and
  "In dollars: $14.02"; neither debrief has an unpriced-requests clause naming either model, and the rates clause reads
  "at the rates for `claude-opus-5-5`, `claude-sonnet-5-5`, as of 2026-10-06".
- `npm run typecheck && npm run lint` pass in `plugin/mcp`.
