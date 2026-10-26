# 03 — The implementer tests the way the spec agreed

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** an `implementer` that writes tests where the epic agreed they go and in a form that can disagree with
the code, adopted from upstream's `implement` and `tdd`. Today it says nothing about tests at all. Settled in
`../spec.md` under Implementation Decisions › `implementer`.

- [ ] The implementing step says to test at the seams the spec's testing decisions name, and at no seam nobody agreed.
- [ ] It says every expected value comes from an independent source — a known-good literal, a worked example, the spec —
      and never recomputes the expected value the way the code does.
- [ ] It says refactoring beyond what the ticket asks is not the ticket's: it belongs to the rounds and fix waves.
- [ ] It says to read the project's glossary, where there is one, before naming tests and interfaces.
- [ ] The rules sit with the existing gate and fork guidance rather than in a new section that repeats it, and nothing
      the implementer already does about gates, forks or commits changes.
- [ ] The agent's credits name upstream's `implement` and `tdd`.

## Comments
