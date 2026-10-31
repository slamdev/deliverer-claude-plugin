# 10 — A run that resumes after its final debrief is read again

**What to build:** a human who resumed a run after its debrief went final finds it read again once the run settles,
and told which extent that reading is of, so they know which debrief to forward. A maintainer pays at most one extra
reading per resumption. This lifts the run-observation spec's "one synthesis per run" (D9, D23) exactly as far as a
resumption. Settled as Solution item 5 and under **The extra reading** in `../spec.md`.

**Blocked by:** 09 — a put-back is the resumption this is verified with.

**Status:** ready-for-agent

- [ ] The trigger is an un-finalise caused by the extent gaining an own signal past the extent of the reading the
      debrief holds. A finalise of the same extent does not trigger it.
- [ ] The reading is taken at the next finalise, whichever finaliser that is, never immediately on the new signal.
- [ ] One reading per un-finalise, so a run resumed twice can be read three times.
- [ ] A re-armed observer that inherits a held answer reuses it when the extent has not grown, and reads again at the
      next finalise when it has.
- [ ] The debrief shows the extent of the reading it carries, and that an earlier reading of a shorter extent was
      replaced.
- [ ] Driven by hand through the hook script at shortened bounds: a run left idle until it finalises, then grown with a
      put-back and left to settle, is read a second time and names the replaced extent. Left to settle again with
      nothing grown, it is not read a third time.
- [ ] A `SessionEnd` finalise still exits at once, and a run with no resumption costs exactly what it costs today.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
