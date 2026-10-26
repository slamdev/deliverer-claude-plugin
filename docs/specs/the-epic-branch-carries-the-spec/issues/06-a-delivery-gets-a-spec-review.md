# 06 — A delivery gets a spec review

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** each delivery's change request is read once against its spec and tickets by a new `spec-reviewer`
agent, whose **spec finding**s the first **fix wave** works like any other comment — so a requirement the code dropped,
scope nobody asked for, or a plausible but wrong implementation is caught before a human reviews. It is no **round**.
Settled in `../spec.md` under Implementation Decisions › `spec-reviewer` and › Build.

- [ ] A new shipped agent `spec-reviewer`, opus at `medium`, with the same disallowed tools and first-person preamble as
      the others: it dispatches nothing, writes nothing to the task list, and changes no code. It credits upstream's
      `code-review`.
- [ ] Handed the epic and the change request's URL, it switches to the epic branch, reads the spec and every ticket —
      from the repository or the forge — and the diff first-hand.
- [ ] It reports requirements missing or partial, behaviour nothing asked for, and requirements implemented but wrong,
      each quoting the spec or ticket line it rests on, each posted as one resolvable comment beginning `SPEC`,
      anchored to a file and line where the forge allows.
- [ ] Resumed, it posts only the findings no `SPEC` comment already carries.
- [ ] Build dispatches it once, after the assumptions are adjudicated and before the first round; a resumed build always
      dispatches it again. The first fix wave's dispatch is otherwise unchanged.
- [ ] The flip bar is unchanged. Build's report carries the count of spec findings posted, and a hand-off where the spec
      review never reported.
- [ ] Build's task list carries the new stage as its own task.
- [ ] The installation smoke test expects eight shipped agents; the build happy path's dispatch floor rises by one and
      its description of what a delivery dispatches names the spec reviewer.
- [ ] Typecheck and lint pass in both packages.

## Comments
