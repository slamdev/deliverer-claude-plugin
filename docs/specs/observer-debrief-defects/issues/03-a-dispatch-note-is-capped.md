# 03 — A dispatch note is capped

**What to build:** a maintainer paying for the synthesis finds its input bounded by the plugin's choice rather than by
whatever a cheap-tier note chose to write. A **dispatch note** is told its length cap in its prompt, and one that runs
over is cut, marked, and never sent back. Settled as Solution item 8 and under **The note cap** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The note's prompt states a cap of about 8,000 characters of output. Its input budget is unchanged.
- [x] A note over the cap is cut at a line boundary under it, with an elision mark naming the characters cut.
- [x] A cut note is never sent back to the model for a shorter one.
- [ ] Judged replay (`--judge`), on one refine and one build record: no note in the notes file exceeds the cap, and a
      cut note carries its elision mark.
- [ ] Nothing a cut note carries reaches the debrief (ADR-0018).
- [x] Free replay of any record is byte for byte as before.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

- Judged replay ran once on the refine record `527b6996-…` (3 notes, $4.26) and once on the build record
  `575abc28-…` (16 notes, $9.24). No note exceeded the cap (largest body 3,443 characters), so no note was cut and the
  elision mark half of the check had nothing to show. Left unticked: the cut itself was exercised only by a throwaway
  script calling `capNote` (lines kept whole, mark counted inside the cap, count exact, one-line overrun capped).
- "Nothing a cut note carries reaches the debrief" is left unticked for the same reason: no cut note existed in either
  paid replay. Neither debrief carries the mark, and a note's body still reaches only the notes file and the synthesis,
  as before this ticket.
