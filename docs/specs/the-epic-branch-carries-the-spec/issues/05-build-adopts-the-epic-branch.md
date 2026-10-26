# 05 — Build adopts the epic branch

Status: ready-for-agent

**Blocked by:** 04 — Refine publishes on the epic branch.

**What to build:** `/deliverer:build <epic location>` delivers an epic a refinement left on its epic branch, as well as
one the default branch carries, and keeps stage 2 honest now that a change request may already be open before it runs.
Settled in `../spec.md` under Implementation Decisions › Build.

- [ ] Where the default branch does not carry the epic location build was handed, build reads the epic off the branch
      named from its slug; where neither does, it reports that and stops; where the default branch does, it behaves as
      today.
- [ ] Build hands the first `implementer` the epic branch's name whenever it found one, and the implementer adopts an
      existing epic branch — switching to it and pulling — instead of creating one. Creating one when none exists is
      unchanged.
- [ ] Build's resume no longer takes an open change request as evidence that stage 2 ran: stage 2 dispatches
      `change-request-creator` on every run, and nothing in that agent's resume rules needs to change for it.
- [ ] Build's resume still counts only commits carrying a `Ticket:` line as tickets begun, so refine's commit is never
      one.
- [ ] Glossary terms are used as `GLOSSARY.md` now defines the epic branch.

## Comments
