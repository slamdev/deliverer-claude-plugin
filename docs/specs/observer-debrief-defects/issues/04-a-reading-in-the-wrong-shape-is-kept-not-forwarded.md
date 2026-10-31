# 04 — A reading in the wrong shape is kept in the notes, not forwarded

**What to build:** a human whose synthesis answered without the `== DEFECTS ==` line or the hunches line, or with the
two out of order, finds a debrief that says plainly the run went unjudged and why, rather than one with no judgement
and only a failure. The reading they paid for is kept in the do-not-forward notes file. Settled as Solution item 2 and
under **The unparsed reading** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The cases recognised are those the judge already distinguishes: either marker missing, or the two out of order.
- [ ] The raw answer goes into the notes file under a heading of its own, after the dispatch notes.
- [ ] The debrief carries one statement where its defects belong: unjudged, with why, pointing at the notes file by its
      role. It quotes nothing from the answer, and stays within its bound (ADR-0018).
- [ ] No retry is made, and structured output stays off.
- [ ] Judged replay (`--judge`): a bogus token through a gateway, as the run-observation procedure names, leaves the
      raw answer in the notes file under its heading and a debrief that says unjudged and quotes none of it.
- [ ] A well-shaped answer produces the same debrief as before.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
