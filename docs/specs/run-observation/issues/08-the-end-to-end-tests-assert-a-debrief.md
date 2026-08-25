# 08 — The end-to-end tests assert a debrief appeared

Status: ready-for-agent

**Blocked by:** 04

**What to build:** the two happy-path tests already drive whole runs against a real forge, so a debrief is produced
whether or not anybody looks. This makes the **harness** look — shallowly and deliberately, because depth lives at the
replay seam and this one costs real money every time it runs. Settled under Testing Decisions in `../spec.md`.

- [ ] The refine and build happy-path tests assert that the run they drove left a debrief.
- [ ] The assertion reads the header: the right skill, the right epic slug, and a dispatch count consistent with the
      run the test just drove.
- [ ] A missing debrief fails the test with the **run directory**'s path quoted, so the failure is read there rather
      than reproduced.
- [ ] The assertion adds no measurable money and no measurable time, and the **ceilings** are unchanged.
- [ ] The harness does not switch observation off, and does not configure it — it meets the default a user meets.
- [ ] Nothing the observer wrote appears inside the fixture repository, the clone or the change request the test
      produced.
- [ ] The harness is typechecked and linted as CI already does, and no end-to-end test is added to CI.
