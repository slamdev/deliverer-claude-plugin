# 06 — The harness pins what a real round reports

Status: ready-for-agent

**Blocked by:** 05 — there is no spend object to assert on before it.

**What to build:** a rename that reaches the tools server but not the **observer** fails a test rather than a
**debrief**. The paid build happy path is the only seam of any kind that reaches the real backend's spend extraction —
the scripted double's spend is scripted rather than extracted — so it is where this payload's one automated assertion
belongs. Settled in the Testing Decisions of `../spec.md`.

- [ ] The build happy path asserts that every **round** which reached `completed` or `failed` has a poll answer
      carrying a spend with a dollar figure and a provider. A running poll carries none and a cancelled round never
      gets one, so the assertion turns on the round's own outcome rather than on every answer it gave.
- [ ] The keys it asserts on are written down in the **harness** rather than imported from the server, for the reason
      that file already states about the three tool names it keeps by hand: a contract that reached only one side of it
      is a defect this test should report rather than follow.
- [ ] Nothing else in the harness moves. The **ceiling**s, the **verifier**'s questions and every existing matcher are
      untouched.
- [ ] The build happy path is run once, end to end, against a real forge, and passes with the new assertion in place.
- [ ] What that run took and what it cost are reported. A **ceiling** reached is reported as a finding about the run
      rather than as a failing assertion, exactly as the harness already treats one.
- [ ] `typecheck` and `lint` pass in both packages; the file's register and column width are matched.
