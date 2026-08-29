# 04 — One missing credential is reported once

Status: ready-for-agent

**Blocked by:** 02

**What to build:** a **debrief** from a host where nothing could authenticate says so once, in its own words, instead of
repeating a sixty-word disclaimer once per **dispatch** where the account of each stage's interior belongs — and the
human learns it from the line they were being shown anyway rather than by opening a document whose shape looks complete.
Settled as D11 and D13 in `../spec.md`, and the part of D18 that belongs to the message itself.

- [ ] The first result classified `not_logged_in` ends the judging: no further **dispatch note** is attempted, and the
      synthesis is not attempted.
- [ ] The fact is sticky for the life of the observation. The notes half catches up on every rewrite of a live debrief
      and the synthesis runs at the finalise, so a fact remembered for one rewrite only would be rediscovered on the
      next — which is the defect this criterion exists to prevent.
- [ ] The debrief states it in ONE place: that nothing was judged because no credential reached the observation, which
      option names one, and — where a file was named — whether it was used or was unusable. The per-note repetition is
      gone.
- [ ] The other three success-shaped failures do not short-circuit. No result, prompt too long and connection lost are
      per-call conditions: a lost connection may come back, and an oversized slice says nothing about the next one, so
      one of them must not cost a run every remaining note.
- [ ] What the observation spent is still counted and still honest. The calls that were made are reported, a counter
      nobody measured still reads unknown rather than zero, and the debrief does not claim a saving it cannot measure.
- [ ] A debrief that judged nothing still keeps its header and every mechanical figure in it. Nothing about the notes
      half short-circuiting reaches the half that reads the records.
- [ ] The stop line gains one clause where nothing was judged for want of a credential, naming the option. The
      prompt-time line carries the same clause, because a human meets exactly one of the two for any given debrief.
- [ ] Everything else those two lines say is unchanged: what a debrief is, that it is bounded and safe to forward, that
      the **trace** beside it is not, that the run itself was not affected, and how to switch observation off.
- [ ] The `not_logged_in` detail text stops telling its reader that the plugin's option "names the identity the REVIEW
      runs as and stays the review's". That sentence is now the opposite of true, and it is in the one document a
      maintainer reads.
- [ ] No credential value, no variable name and no file path appears in the new message, the short-circuit's own line,
      or either announcement.
- [ ] Verified by replay with a file assigning a bogus credential: exactly one model call attempted, no synthesis
      attempted, one statement in the debrief, the option named, nothing echoed.
- [ ] Verified at the hook boundary by hand for both lines: a stop where the observation finalised a debrief that judged
      nothing, and the prompt-time line for a debrief nobody has been shown yet.
- [ ] `plugin/mcp` typechecks and lints.
