# 01 — A wait is told by the run's own turns

**What to build:** a human who leaves a question on screen for an hour finds the debrief reporting that hour as the run
**waiting** on them, and the observer still watching when they answer — however much bookkeeping the host writes into
the record meanwhile. Whether a pending question is the run's own last act is decided by the run's own turns alone: an
assistant entry, or a user entry carrying a tool result or text the human typed. Everything else — host bookkeeping of
any kind, timestamped or not, known today or added later, and a `<task-notification>` — leaves the wait standing.
Settled under **The run's last act** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The test inverts to "nothing counts but the run's own turns", reusing the existing definition of what the human
      typed rather than a new list of entry kinds; no timestamp test is introduced.
- [ ] The refinement record from `../spec.md` § The source, cut just after its first question's last bookkeeping entry
      and replayed, reads as waiting, with the question's time in the facts.
- [ ] The same record cut just after that question's answer does not read as waiting.
- [ ] Every later wait in that record, cut the same way, reads as waiting.
- [ ] The whole record replays to a debrief with nine question rounds and thirty questions.
- [ ] A question the human escaped and typed over still ends the wait.
- [ ] The comment above the test is rewritten to carry the new rule and its grounds — the `tools-used`, `last-prompt`
      and `atis-latch` entries on the measured record — citing this spec.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
