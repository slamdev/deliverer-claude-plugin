# 07 — Proved on the affected host

Status: ready-for-human

**Blocked by:** 02, 03, 04

**What to build:** the evidence that a hook-launched observation reaches a model at all. On the machine this was
diagnosed on, no live **run** has ever produced a judged **debrief**: the only two live debriefs there are both the
failure this epic fixes, and every earlier debrief beside them was a **replay** that called no model. Until one live run
on a host of that shape comes back with a **dispatch note** read from the inside, the fix is reasoned rather than
measured. Settled under Testing Decisions in `../spec.md`.

**Why this one is not for an agent.** The live run has to happen on a host whose session is authenticated by an
environment variable the hook boundary withholds — a different machine from this repository, which nothing running here
can reach. The replay shapes and the hook walk below could be done by an agent; the run itself is the human's, and a
ticket claiming otherwise would be picked up and abandoned halfway.

- [ ] The four replay shapes are walked and what each produced is recorded: a file assigning a real credential, a file
      assigning a bogus one, an unreadable or malformed file, and no variable at all.
- [ ] The hook events that carry the new clause are driven by hand: a stop where the observation had finalised a debrief
      that judged nothing, and the prompt-time line for a debrief nobody has been shown yet.
- [ ] One live `/deliverer:` run on an environment-credentialled host, with at least one **dispatch**, produces a
      debrief carrying a dispatch note read from the inside. One dispatch is enough — this is evidence that the path
      works, not a measurement of a whole delivery.
- [ ] The same run's debrief is finalised with a synthesis, or the reason it was not is recorded. The two halves fail
      independently, and a note landing does not prove the long-context call did.
- [ ] That debrief is read for the bound before anything is forwarded anywhere: no credential value, no variable name,
      no file path, and nothing of the repository beyond the **epic**'s **slug**.
- [ ] What the observation cost on that run is recorded — model calls, tokens, and dollars where the SDK measured them —
      so the figure this epic adds to a delivery is a measurement rather than an assumption.
- [ ] The identity that paid is confirmed to be the one the **environment file** names, read off the debrief's own spend
      line rather than inferred.
- [ ] Anything that did not behave as the spec says is reported as a **defect** against this epic rather than fixed in
      passing, so the fix is a change somebody reviewed.
