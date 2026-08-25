# 07 — An epic's earlier debriefs are read

Status: ready-for-agent

**Blocked by:** 05

**What to build:** an **epic** usually takes more than one run — runs are interruptible by design, and one measured
delivery ran 29h36m. An observer for a later run reads the debriefs the earlier ones left, so a defect that exists only
across the seam between two runs is findable at all. Settled as D21 in `../spec.md`.

- [ ] An observer whose epic already has debriefs under its slug in the plugin's data directory reads them.
- [ ] A defect spanning two runs of one epic is reportable, and names which runs it spans — a stage the resumed run
      dispatched again although an earlier one had finished it, a question asked in two different runs.
- [ ] Each debrief still stands alone for forwarding: nothing in a later one requires an earlier one to be read
      alongside it.
- [ ] Earlier debriefs are never rewritten, appended to or replaced.
- [ ] A debrief that cannot be read costs the later one its continuity and nothing else, and the later one says so.
- [ ] Verified by replaying two runs of one epic in order and reading whether the second sees the first.
