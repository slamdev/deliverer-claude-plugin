# 08 — A continued dispatch's note is rewritten, and its duration runs to its record's end

**What to build:** a maintainer reading a debrief of a run with a **put-back** finds the continued stage's note
describing what it finally did, never a first attempt's state, and its time covering the same span as its tokens, so
the slow stage is the one named as slow. Settled as Solution item 3 and under **The replaced note** in `../spec.md`.

**Blocked by:** 01 — where a continue's entries land.

**Status:** resolved

- [x] A dispatch keeps one note. When a continue to its agent finishes, the note is rewritten in place from the whole
      record at the note's existing input budget, as a first note is today.
- [x] The note states how many continues it covers and the last entry it read. The synthesis only ever sees the latest.
- [x] A re-armed observer rewrites a note only when the record has grown past that entry.
- [x] A dispatch's tokens are still summed over its whole record; its duration runs from its start to the record's last
      entry.
- [x] Free replay: a continued dispatch's duration is its working time, with no idle gap between attempts.
- [ ] Judged replay (`--judge`), on one refine and one build record with put-backs: one note per dispatch, and a
      continued dispatch's note covers its continues and names how many.
- [x] Driven by hand through the hook script: an observer killed after a note and re-armed with the record unchanged
      rewrites no note.
- [x] Free replay of a record with no put-back is byte for byte as before; two replays are identical.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

**Built on `ticket-08`, verified by hand, 2026-10-31. Every check below spent nothing.**

- **Duration: only a continued dispatch takes its time from its record.** (Superseded in part below: it is now the
  working time, not the span to the record's end.) Taken for every dispatch, the record's last entry
  differs from the host's `totalDurationMs` by about a second on dispatches nobody continued: five of the eight
  put-back-free records on this machine (`53ee4fb8…`, `965ab64f…`, `330c2820…`, `558d2ef6…`, `a5f1b0ee…`) then
  replayed differently. That breaks "byte for byte as before". So a dispatch with a continue in its record runs to
  that record's last entry, and any other dispatch keeps the host's figure. In `672f1723…` the spec-writer reads
  `17m49s` (22:23:58.634 to 22:41:48.376), not `11m31s`.
- **Free replay, all 43 records with a `deliverer:*` dispatch on this machine, against `debrief-observer-fixes`
  (same data path):** the eight with no continue (one is exit 2 on both) are byte for byte identical. In every other
  record, the only changed lines are the `dispatched` lines of the continued dispatches, one per continued dispatch.
  Two replays of `672f1723…`, `c7ba8412…` and `dd4e1e66…` are identical.
- **Notes and their prompts, via the free SDK stand-in (`--judge` with a loader that answers in shape):** refine
  `527b6996…`, build `575abc28…`, `672f1723…` and `a49d9599…` each give one note per dispatch. Only a continued
  dispatch's note carries `continues N` (N = 1, 1, 2, 1) and `read to entry M of its record, at <time>`. Its prompt
  names the continues and the record's end. Every other note prompt is byte for byte the integration branch's, and so
  are both prompts of the put-back-free `dd4e1e66…` and `53ee4fb8…` runs. A run with no put-back costs what it did.
- **Paid judged replay (`--judge` on one refine and one build record): not run.** This machine has no credential, and
  the paid run was ruled out. Still to do with a real model: whether a continued note's prose covers its continues.
- **Through the hook script** (`observe-run.sh`, observer installed into a scratch `CLAUDE_PLUGIN_DATA`, SDK stand-in
  via `NODE_OPTIONS`), on a copy of `a49d9599…` grown by hand:
  - The spec-writer is noted once.
  - Killed with `-9` and started again with the record unchanged: no note call.
  - Grown through the continue's return: the note is rewritten in place. Still one note in the file, now `continues 1`
    and `read to entry 351`.
  - Killed and started again unchanged: no note call.
- **Rewrite beside ticket 04's unparsed entry:** a notes file holding the first-attempt note followed by
  `== the synthesis answer, unparsed ==`, caught up live after the continue returned. The note is replaced in place;
  the unparsed entry stays last and byte for byte as it was. A second catch-up makes no call.
- **Open, for ticket 09:** a put-back after the hand-over does not yet un-finalise a finalised observer. Re-armed by
  `Stop` after the continue, it found no new own signal and never judged again, so it did not rewrite either. The
  rewrite runs on the next judging after that, so this closes once ticket 09 counts `SendMessage`.
- **Duration is working time, not the span to the record's end (2026-10-31, after the build).** The ticket 03 judged
  replay's build record `575abc28…` showed what the span cost: its change-request-creator worked 3m24s, sat idle 1h37m
  while its human was away, and was put back for 54s, and read `1h41m`. That names the idle stage as slow, which user
  story 3 exists to stop. Across the 43 records the old rule read up to `18h19m` (`c7ba8412…` #3, now `17m26s`). The
  maintainer chose working time: the first attempt (the host's `totalDurationMs` where the result has one), plus each
  continue from its `coordinator` entry to its last entry. Re-replayed all 43: only continued dispatches' `dispatched`
  lines moved (`575abc28…` #10 `4m18s`, `527b6996…` #2 `33m11s`, `672f1723…` #4 `15m01s`); every other byte is as
  before.
