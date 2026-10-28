# 03 — A finished run that settles finalises its debrief

**What to build:** a human who keeps one long-lived session open gets a finished delivery's debrief finalised within
minutes of the run returning, instead of thirty minutes later or only when the session is killed. A run reading
`finished` whose records then stay silent for two minutes is finalised as a third guess beside the idle bound and the
waiting ceiling — reversible exactly as an idle finalise is. Settled under **The finished-and-settled finaliser** in
`../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] A latest reading of `finished` plus two minutes of silence across the run's records, measured as the idle bound
      measures its own, finalises and announces the debrief.
- [x] The two minutes are a bound in the same family as the others, overridable from the environment the same way.
- [x] It is not a signal: the observer watches for the same while afterwards as after an idle finalise, and an advancing
      extent un-finalises it.
- [x] The comment arguing `finished` is not a finaliser is rewritten to carry this decision and its grounds — the ten
      measured runs, and that the reversal covers the case it guarded — citing this spec. No ADR is added.
- [x] The debrief's own "still going" paragraph no longer promises a timing that only holds when the session exits.
- [x] The delivery record from `../spec.md` § The source, cut just after its closing report and replayed, reads
      `finished`.
- [x] Driven by hand at shortened bounds: a finished copy that stops growing finalises after the settle bound; growing
      it again un-finalises it.
- [x] A `SessionEnd` finalise still exits at once and is never reversed, and the waiting ceiling is unchanged.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

Verified by hand on branch `idp-03-a-finished-run-that-settles-finalises-its-debrief` (scratch `CLAUDE_PLUGIN_DATA`
under `/tmp/idp-03/`, copies of the delivery record, nothing judging):

- **Replay.** The delivery record (`d5129b8a…`) cut at entry 658 — its closing report — replays as `**finished**: 9 of
  its 9 stages ended completed`. Cut at 651 it also reads `finished`; cut at 638 (task 9 still in progress) it does not.
- **The loop at shortened bounds** (`TICK=200ms`, `REFRESH=1s`, `SETTLE=6s`, `AFTER_FINALISE=30s`, `IDLE=10min`),
  through `observeRun` with a no-model judge. Before the change, a copy cut at 651 stayed `watching` with no
  announcement for 20s+. After: it finalised ~6s after it stopped growing — marker `finalised — the run read finished
  and nothing was written anywhere for the settle bound`, debrief without the still-going paragraph, both announcement
  files written. Entries 652–658 appended: marker `watching — a run that had gone quiet resumed`, announcements
  cleared, debrief rewritten as not final. Settled again: finalised and announced anew, then exited `debriefed`
  30s later (`AFTER_FINALISE_MS`, same as after an idle finalise). Control: a copy cut at 638 (not `finished`) under
  the same bounds is still `watching` after 22s.
- **SessionEnd.** A finalise signal written under a watcher exits it 1s later with marker `finalised — the session
  ended`; unchanged. The waiting ceiling's code is untouched.
- **Marker wording for ticket 02.** The settled finish is `finalised — the run read finished …`, apart from
  `finalised — the session ended`, so a re-arm that matches "finalised, but not the session ending" counts it as a
  guess. impl-02 has been told.
- The new bound is `DELIVERER_OBSERVER_SETTLE_MS` (2 min). CONTRIBUTING.md's hook-state walk and its list of bounds
  now describe it. `judge.ts`'s note on why re-finalising is rare is updated to match.
- `npm run typecheck && npm run lint` pass in `plugin/mcp`.
