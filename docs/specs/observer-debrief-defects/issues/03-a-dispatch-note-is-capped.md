# 03 — A dispatch note is capped

**What to build:** a maintainer paying for the synthesis finds its input bounded by the plugin's choice rather than by
whatever a cheap-tier note chose to write. A **dispatch note** is told its length cap in its prompt, and one that runs
over is cut, marked, and never sent back. Settled as Solution item 8 and under **The note cap** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The note's prompt states a cap of about 8,000 characters of output. Its input budget is unchanged.
- [ ] A note over the cap is cut at a line boundary under it, with an elision mark naming the characters cut.
- [ ] A cut note is never sent back to the model for a shorter one.
- [ ] Judged replay (`--judge`), on one refine and one build record: no note in the notes file exceeds the cap, and a
      cut note carries its elision mark.
- [ ] Nothing a cut note carries reaches the debrief (ADR-0018).
- [ ] Free replay of any record is byte for byte as before.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
