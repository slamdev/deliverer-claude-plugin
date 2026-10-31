# 10 — A run that resumes after its final debrief is read again

**What to build:** a human who resumed a run after its debrief went final finds it read again once the run settles,
and told which extent that reading is of, so they know which debrief to forward. A maintainer pays at most one extra
reading per resumption. This lifts the run-observation spec's "one synthesis per run" (D9, D23) exactly as far as a
resumption. Settled as Solution item 5 and under **The extra reading** in `../spec.md`.

**Blocked by:** 09 — a put-back is the resumption this is verified with.

**Status:** ready-for-agent

- [x] The trigger is an un-finalise caused by the extent gaining an own signal past the extent of the reading the
      debrief holds. A finalise of the same extent does not trigger it.
- [x] The reading is taken at the next finalise, whichever finaliser that is, never immediately on the new signal.
- [x] One reading per un-finalise, so a run resumed twice can be read three times.
- [x] A re-armed observer that inherits a held answer reuses it when the extent has not grown, and reads again at the
      next finalise when it has.
- [x] The debrief shows the extent of the reading it carries, and that an earlier reading of a shorter extent was
      replaced.
- [x] Driven by hand through the hook script at shortened bounds: a run left idle until it finalises, then grown with a
      put-back and left to settle, is read a second time and names the replaced extent. Left to settle again with
      nothing grown, it is not read a third time.
- [x] A `SessionEnd` finalise still exits at once, and a run with no resumption costs exactly what it costs today.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

**Built, 2026-10-31.** `./observer.ts` sets `readingOwed` at the un-finalise, only when the reading's extent ends past
`readOf.lastEntry` of the held answer (the one the finalise left in `finalReading`, inherited or this process's). The
next finalise passes `readAgain`, and the flag clears there. `synthesisJudge` in `./judge.ts` returns its held answer
on every other call. Given `readAgain` on a finalise whose extent passes that answer, it catches the notes up and
synthesises again. The answer carries `replaced` (each earlier `readOf`, oldest first) and the spend of every reading.
`./debrief-file.ts` prints the reading's extent and the replaced ones inside the "Read by" sentence. Only then:
a run that never resumed reads as it did. Two calls this ticket made:

- **Only a judged held answer is read again.** A held answer that failed, came back unparsed or met no credential
  carries no extent, so a resumption does not pay for it a second time.
- **A re-reading that fails replaces the held answer**, like any other failed synthesis. Its spend is still counted
  with the earlier one's.

**Verified by hand, all through `hooks/observe-run.sh`.** The observer was installed into a scratch
`CLAUDE_PLUGIN_DATA` and judged through ticket 04's SDK stand-in (`NODE_OPTIONS=--import`, counting every synthesis
and note call), so nothing was spent. The record was a copy of `dc246bd1…` grown by `head`, with each dispatch record
cut to the main record's last timestamp. Bounds: tick and refresh 0.3 s, idle 3 s, settle 60 s so the idle bound
fires. Harness: `/tmp/t10/{lib,resume,rearm,sessionend,plain,replays,judged}.sh`.

- **Resuming, one live observer.** Cut at 206 (after the hand-over at 191), the run idle-finalises: 1 reading, of
  3–190. Grown to 215 with the put-back at 207: it un-finalises with the count still 1, then idle-finalises again
  with 2 readings. The debrief reads "over the whole run in one reading (entries 3–215 and 2 dispatches, taken again
  after the run resumed, which replaced an earlier reading of a shorter extent, entries 3–190 and 2 dispatches)".
  Left 8 s with nothing grown: still 2. Grown to 233 (a second put-back): 3 readings, naming both replaced extents.
  The continued dispatch's note was rewritten at each resumed reading (ticket 08): `continues 2`, then 3, still
  one note. The same script on the integration branch stays at 1 reading and says "as far as it had got by then".
- **Re-armed.** Cut at 190, idle-finalised, observer exited. `Stop` with the record unchanged: a fresh observer
  probes and exits, still 1 reading and no note call. Grown to 206 (the human's turn and the answer to it, no own
  signal), then `Stop`: the same, still 1. Grown to 215, then `Stop`: un-finalises, finalises with 2 readings, names
  3–190 as replaced, and rewrites the continued note.
- **`SessionEnd`.** Mid-run at 150, the observer finalises and exits about 1 s after the signal, with 1 reading.
  Un-finalised by the put-back and then `SessionEnd`: the owed reading is taken at that finalise (2 readings, names
  the replaced extent), and it still exits about 1 s after the signal. Idle and `SessionEnd` were exercised as the
  re-reading's finaliser. The settled finish was not, since the 215 cut is no finished reading, but it reaches the
  same code path.
- **No resumption.** Grown 120 → 160 → 190 under a live observer, idle-finalised, watched through its whole
  after-finalise window: 1 reading and 3 note calls. The integration branch gives the same counts, and the debrief is
  byte for byte the same.
- **Replays.** Free replay of all 41 deliverer records on this machine, the integration tip against this branch,
  into the same data path: byte for byte identical. A `--judge` replay through the stand-in of `a49d9599…` and
  `dc246bd1…`: identical debriefs.
- **Not done:** a paid reading against a real model. The coordinator ruled it out. The stand-in exercises every path
  this ticket touches.
