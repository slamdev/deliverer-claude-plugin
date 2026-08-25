# 05 — The debrief names defects, with grounds

Status: ready-for-agent

**Blocked by:** 03

**What to build:** replayed against a past run, the debrief stops being a page of figures and starts saying what the run
cost the human that it did not have to — each **defect** carrying the **grounds** from the trace that show it. This is
the half that reproduces what a human got from watching a run in a second session, and it is built and verified entirely
through replay, so no live run is spent on it. Settled as D2, D8, D9, D10, D11, D12, D14, D27 and D28 in `../spec.md`,
and as [ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md).

- [ ] The debrief carries defects, each stating what happened, its grounds from the trace, which file in the
      installed plugin it is about, and — where one is obvious — a proposal, always marked as a proposal and never
      in place of stating the defect.
- [ ] What counts as a defect is not constrained by a class list. The observer reports what it noticed.
- [ ] An observation the trace cannot ground is a **hunch**: written down, in a section of its own, marked apart,
      and never mixed in among defects.
- [ ] The observer is told which run it is watching and reads that skill's own installed text, so a defect can quote
      the line the run diverged from.
- [ ] One synthesis reads the whole trace, on a long-context model. Depth is the plugin's choice and no option
      exposes it, so debriefs stay comparable between people.
- [ ] The bound is instructed: the plugin's own machinery, never the repository being delivered into. A run's
      conversation with its human is carried by shape — counts, subjects, timings, who waited on whom — and never by
      the words of a question or an answer.
- [ ] The observer authenticates from the environment it inherits, with no configuration of its own. **C2** is
      recorded once a hook-launched observer has reached a model.
- [ ] Contention with the run is not managed: no back-off, no deferral, no detection of what kind of credential is
      in hand. The README says observation draws on the same account.
- [ ] A judging call that fails leaves ticket 03's trace-facts-only debrief with the reason named. A partial
      judgement is never presented as a complete one.
- [ ] Verified by replaying the runs behind `build-run-defects`, `orchestrator-contracts` and `review-reliability`
      and reading whether the observer finds what the human found by hand.
- [ ] Every debrief produced during that verification is read by a human for repository content and for quoted
      questions or answers. Nothing mechanical checks this, and ADR-0018 records that as an accepted risk.
