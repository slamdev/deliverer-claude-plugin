# 03 — A finished run that settles finalises its debrief

**What to build:** a human who keeps one long-lived session open gets a finished delivery's debrief finalised within
minutes of the run returning, instead of thirty minutes later or only when the session is killed. A run reading
`finished` whose records then stay silent for two minutes is finalised as a third guess beside the idle bound and the
waiting ceiling — reversible exactly as an idle finalise is. Settled under **The finished-and-settled finaliser** in
`../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] A latest reading of `finished` plus two minutes of silence across the run's records, measured as the idle bound
      measures its own, finalises and announces the debrief.
- [ ] The two minutes are a bound in the same family as the others, overridable from the environment the same way.
- [ ] It is not a signal: the observer watches for the same while afterwards as after an idle finalise, and an advancing
      extent un-finalises it.
- [ ] The comment arguing `finished` is not a finaliser is rewritten to carry this decision and its grounds — the ten
      measured runs, and that the reversal covers the case it guarded — citing this spec. No ADR is added.
- [ ] The debrief's own "still going" paragraph no longer promises a timing that only holds when the session exits.
- [ ] The delivery record from `../spec.md` § The source, cut just after its closing report and replayed, reads
      `finished`.
- [ ] Driven by hand at shortened bounds: a finished copy that stops growing finalises after the settle bound; growing
      it again un-finalises it.
- [ ] A `SessionEnd` finalise still exits at once and is never reversed, and the waiting ceiling is unchanged.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
