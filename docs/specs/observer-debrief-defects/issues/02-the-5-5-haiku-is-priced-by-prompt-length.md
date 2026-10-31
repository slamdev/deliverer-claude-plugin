# 02 — The 5-5 haiku is priced by prompt length

**What to build:** a human whose run used `claude-haiku-5-5` finds a dollar figure in its debrief, with each of its
requests priced at the tier its own prompt fell in, and no model named as unpriced. The rate table learns one
prompt-length threshold per row, which reverses the exclusion ticket 05 of `idp-scaffold-defects` made for the reason
it gave. Settled as Solution item 1 and under **The tier** in `../spec.md`.

**Blocked by:** 01 — what counts as a prompt for the tier.

**Status:** resolved

- [x] A row may carry one prompt-length threshold and an input and output rate above it. Every existing row carries
      none and prices exactly as today.
- [x] `claude-haiku-5-5` is in the table at $0.10 / $0.50 per million tokens up to 100K and $0.50 / $2.50 above, read
      from the table's existing source at the time of the change.
- [x] A request's tier is decided by its own prompt as 01 established it, never by the run's total or an average.
- [x] The comment naming the 5-5 haiku as deliberately absent is replaced by the row. The as-of date and source are
      taken as the table already takes them.
- [x] Free replay: a run with haiku-5-5 requests carries a dollar figure and names no unpriced model. A synthetic
      record with one prompt each side of 100K is priced at the two tiers.
- [x] Free replay: every other model's figure is unchanged, and a record with no haiku-5-5 request replays byte for
      byte as before.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

**Verified by hand, 2026-10-31.** The `claude-api` skill's model table (cached 2026-10-06, the date `RATES_AS_OF`
already carries) prices Claude Haiku 5.5 at $0.10 / $0.50 for prompts up to 100K tokens and $0.50 / $2.50 beyond, so
the date and source are unchanged. No deliverer run on this machine used `claude-haiku-5-5`, so the "run with haiku-5-5
requests" is synthetic: a copy of refine run `a49d9599-92ee-4607-933e-133c4bf721a8` with dispatch
`agent-a42d89c7702646c08` rewritten to `claude-haiku-5-5`, every usage zeroed but two. One prompt is exactly 100,000
tokens (10,000 in + 80,000 cache read + 10,000 cache write) and prices low at $0.05305. The other is 100,001 and prices
high at $0.2607505. Both match the figures worked out by hand. The debrief went from $7.66 with "2 of these requests are
not in the figure above" to $7.97, with no unpriced model and no loss entry. Byte for byte against
`debrief-observer-fixes`, through the same data directory: 13 real runs and 32 non-run records replay identically. The
observation's own cost (`model-call.ts`) prices `modelUsage` summed over a call's turns, which cannot say which tier a
request fell in. For `claude-haiku-5-5` that cost now stays unknown and is not priced as one long prompt.
