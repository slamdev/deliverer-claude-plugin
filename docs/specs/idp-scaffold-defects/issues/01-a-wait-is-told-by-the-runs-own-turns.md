# 01 — A wait is told by the run's own turns

**What to build:** a human who leaves a question on screen for an hour finds the debrief reporting that hour as the run
**waiting** on them, and the observer still watching when they answer — however much bookkeeping the host writes into
the record meanwhile. Whether a pending question is the run's own last act is decided by the run's own turns alone: an
assistant entry, or a user entry carrying a tool result or text the human typed. Everything else — host bookkeeping of
any kind, timestamped or not, known today or added later, and a `<task-notification>` — leaves the wait standing.
Settled under **The run's last act** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The test inverts to "nothing counts but the run's own turns", reusing the existing definition of what the human
      typed rather than a new list of entry kinds; no timestamp test is introduced.
- [x] The refinement record from `../spec.md` § The source, cut just after its first question's last bookkeeping entry
      and replayed, reads as waiting, with the question's time in the facts.
- [x] The same record cut just after that question's answer does not read as waiting.
- [x] Every later wait in that record, cut the same way, reads as waiting.
- [x] The whole record replays to a debrief with nine question rounds and thirty questions.
- [x] A question the human escaped and typed over still ends the wait.
- [x] The comment above the test is rewritten to carry the new rule and its grounds — the `tools-used`, `last-prompt`
      and `atis-latch` entries on the measured record — citing this spec.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

Verified by hand: copies of the refinement record (session `26831492…`, 292 entries) were cut with `head -n N`,
with its `subagents/` beside each copy, and replayed through `debriefRun` into a scratch `CLAUDE_PLUGIN_DATA` under
`/tmp`; each check read `facts.human.waitingSince`.

- **Red first.** On the unchanged code the cuts at 101 (`tools-used`, no timestamp), 106 (`last-prompt`,
  `atis-latch`) and 107 (the first question's last bookkeeping entry) all read not waiting, as did the cut at 133 (the
  second wait) and the one at 221 (the seventh wait, after its `last-prompt` and `atis-latch`).
- **Green.** All nine waits read as waiting, each with its question's own timestamp, cut both at the question and after
  its last bookkeeping entry: 100/101/106/107, 133, 144, 150, 172, 180, 221, 227, 249. Each cut just after the answer
  (108, 134, 145, 151, 173, 181, 222, 228, 250) reads not waiting. The whole record gives 9 question rounds, 30
  questions, ending `finished`, and is not waiting.
- **Synthetic tails appended to the cut at 107.** An unknown entry kind with a timestamp, an `attachment`, a `system`
  entry and a user `<task-notification>` all leave the wait standing. A typed turn followed by more of the run (an
  attributed assistant entry, or attributed bookkeeping of an unknown kind, which leaves the typed turn as the only own
  turn) ends it. A typed turn with nothing after it stays outside the extent and reads as waiting. That is the shape the
  comment already documents as knowingly accepted, and the change leaves it as it was.
- `npm run typecheck && npm run lint` pass in `plugin/mcp`.
