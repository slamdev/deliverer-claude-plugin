# 02 — The 5-5 haiku is priced by prompt length

**What to build:** a human whose run used `claude-haiku-5-5` finds a dollar figure in its debrief, with each of its
requests priced at the tier its own prompt fell in, and no model named as unpriced. The rate table learns one
prompt-length threshold per row, which reverses the exclusion ticket 05 of `idp-scaffold-defects` made for the reason
it gave. Settled as Solution item 1 and under **The tier** in `../spec.md`.

**Blocked by:** 01 — what counts as a prompt for the tier.

**Status:** ready-for-agent

- [ ] A row may carry one prompt-length threshold and an input and output rate above it. Every existing row carries
      none and prices exactly as today.
- [ ] `claude-haiku-5-5` is in the table at $0.10 / $0.50 per million tokens up to 100K and $0.50 / $2.50 above, read
      from the table's existing source at the time of the change.
- [ ] A request's tier is decided by its own prompt as 01 established it, never by the run's total or an average.
- [ ] The comment naming the 5-5 haiku as deliberately absent is replaced by the row. The as-of date and source are
      taken as the table already takes them.
- [ ] Free replay: a run with haiku-5-5 requests carries a dollar figure and names no unpriced model. A synthetic
      record with one prompt each side of 100K is priced at the two tiers.
- [ ] Free replay: every other model's figure is unchanged, and a record with no haiku-5-5 request replays byte for
      byte as before.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
