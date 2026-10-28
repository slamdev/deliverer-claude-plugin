# 05 — The models that ran are priced

**What to build:** a human opening a debrief of a run served by `claude-opus-5-5` or `claude-sonnet-5-5` finds its
headline carrying a dollar figure rather than "spend unknown". The observer's rate table carries both models, from the
source it already takes every rate from, with its as-of date moved to match. Settled as Solution item 5 in
`../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Both models are in the table at the rates the `claude-api` skill's model table gives, read at the time of the
      change rather than recalled.
- [ ] The as-of date moves to the date those rates were read.
- [ ] Any other model that source now prices and the table lacks is added in the same change, or named as left out.
- [ ] Either record from `../spec.md` § The source replays to a debrief whose headline carries dollars, and whose
      account of unpriced requests no longer names either model.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
