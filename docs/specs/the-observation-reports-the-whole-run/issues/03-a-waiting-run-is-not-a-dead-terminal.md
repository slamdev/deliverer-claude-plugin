# 03 — A waiting run is not a dead terminal

Status: ready-for-agent

**Blocked by:** 02, and through it 01. **A reuse edge and the epic's one real dependency:** an observer can only see a
question this run is **waiting** on if that question is inside the **extent**, and until 02 lands the extent excludes
it. On the measured run the pending question sits at entry 171 while the frozen extent ends at 42.

**What to build:** the idle bound stops treating a human who is thinking as a terminal that was killed. While the run's
own last act is an `AskUserQuestion` nobody has answered, silence is not evidence of death, and the **debrief** is not
finalised on it. A ceiling of twelve hours on that one wait — not on the watcher's lifetime — is what stops a watcher
whose terminal really was killed with a question on screen. Settled as D5, D6, D7 and D8 in `../spec.md`, and it is the
case `IDLE_FINALISE_MS`'s own comment already names as the one it must not get wrong.

**The measured run, in figures.** The largest silence is 7,004s — 09:24:42 to 11:21:26, an unanswered question from the
run's first grilling stage. On the shipped bounds the observer finalised around 09:54, watched until about 10:24, and
exited roughly an hour before the human came back. Five further silences over ten minutes sit in the same run (997s,
1133s, 858s, 783s, 735s), so this is a refinement's rhythm rather than a freak.

**Recovering afterwards is not the fix, and the evidence is why.** The record's own `stop_hook_summary` entries show
`hooks/observe-run.sh` running at 09:11:26 and then **not again until 12:00:07**: a turn that ends by asking a question
is not a turn boundary. Nor is answering one a prompt submission — the host's hook reference scopes `UserPromptSubmit`
to "when you submit a prompt", and its input documentation says an `AskUserQuestion` answer comes back as the tool
call's own result. The measured run contains no typed human turn at all between 09:11:29 and 13:13:42. **So no hook
fires for the whole of a wait, and a restart could only ever have picked the run up after the stage that followed it.**
`hooks/observe-run.sh` and the marker contract are therefore untouched by this ticket.

**What the reading already has.** `humanTimeOf` (`plugin/mcp/observer/run-facts.ts:850`) keeps every `AskUserQuestion`
by its tool-use id and matches answers by `tool_use_id`. A question with no matching answer, and the timestamp it was
asked at, is a small addition there — not a new pass over the record.

- [ ] `RunFacts` carries whether the run is waiting on a question and when that question was asked, read where the
      answers are already matched. No second scan of the record.
- [ ] `observer.ts` does not finalise on the idle bound while that is true.
- [ ] A ceiling of twelve hours, measured from when the question was asked, finalises on exactly the guess the idle
      bound makes today and lets the loop exit as it does now. Its constant carries why twelve and not thirty hours: the
      tick comment's own longest delivery on record is thirty hours, so a ceiling on the watcher's *lifetime* would kill
      a live run, and this one cannot because a run that keeps writing is not waiting.
- [ ] The finalise reason distinguishes the third finaliser from the two that exist, so a marker and an announcement do
      not claim silence where the answer was a wait that ran out.
- [ ] The new bound is overridable from the environment through the same `bound()` helper, for the reason that function
      already documents.
- [ ] `AFTER_FINALISE_MS`, `RUN_PATIENCE_MS`, the refresh throttle, the settling tick and D23's reversal are unchanged,
      and a comment records that the reversal starts working again as a consequence of 02 rather than of anything here.
- [ ] Nothing is announced while a run is waiting: an unfinalised debrief still prints nothing at the stop, exactly as
      today.
- [ ] **Verified by hand with 01's procedure**, bounds turned down: a prefix ending on an unanswered question does not
      finalise however long it is left; the same record with the answer appended carries on and finalises at the end; a
      prefix left past the ceiling finalises with the new reason and the watcher exits; and a killed watcher leaves
      nothing behind that a later run trips over.
- [ ] `(cd plugin/mcp && npm run typecheck && npm run lint)` passes.
