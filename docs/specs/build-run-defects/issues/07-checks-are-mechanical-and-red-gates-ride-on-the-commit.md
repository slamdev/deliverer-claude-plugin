# 07 — Let the orchestrator read the checks, and record a red gate on the commit

**What to build:** whether the **checks** are green is a fact about the forge the **orchestrator** reads for itself, and
the flip out of **draft** turns on what it read. The **fix wave** still reports the checks, and a disagreement between
the two is a re-dispatch rather than a judgement. A **gate** left red for work outside the ticket is recorded on the
commit as well as in the report, so the last fact that lived only in a report becomes durable.

An observed run had 7 of 12 dispatches signal idle without ever delivering a **report**, and the orchestrator said what
it was missing: *"Six fix-wave commits landed and the branch is in sync with origin… But I still need its report for the
check status and hand-off list."* The clause that forbids it reading the checks is narrower than ADR-0013, which is
titled for the repository **and the forge**. Settled as D19–D21 in `../spec.md`.

**Blocked by:** 02 — the ADR has to cover the forge before the skill text relies on it.

**Status:** ready-for-agent

- [x] The delivery skill says a check's state is a mechanical fact the orchestrator may read, alongside the questions
      about the tree it already may settle.
- [x] Stage 7's flip turns on the checks as read; a change request whose checks are not green stays a draft and is
      reported as one.
- [x] The fix wave still reports whether the checks ended green, and a report that disagrees with the forge is answered
      by re-dispatching the stage.
- [x] What stays forbidden is unchanged and still explicit: a **review finding**, a design, whether the work is good.
- [x] Two completed **rounds** remain the other half of the bar, unchanged.
- [x] The `implementer`'s commit format carries a gate left red for work outside the ticket.
- [x] The implementer still never undoes work the ticket asked for to turn a gate green, and a red gate still goes in
      its report as well.
- [x] `CONTEXT.md`'s **gate** entry — already amended and in the working tree — is confirmed present and consistent with
      the trailer wording written here, and is **not** re-added.
- [x] Each file's register and column width are matched.
