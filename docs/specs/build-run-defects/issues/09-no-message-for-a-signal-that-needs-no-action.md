# 09 — Stop narrating events that need nothing

**What to build:** the **orchestrator** spends no message on a signal that asks nothing of it. Progress belongs to the
task list, which the skill already keeps as the human's window on the **run**.

An observed run produced four near-identical messages of the form *"Post-report idle signal from the assumption reviewer
— already accounted for"*. Settled as D24 in `../spec.md`, which also records that the cost attribution the observation
report attached to this did not survive checking: the rule lands, the measurement does not.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The delivery skill says a signal that needs no action needs no message.
- [x] It says where progress goes instead — the task list it already maintains.
- [x] No claim is made about what this saves.
- [x] The task list contract is otherwise unchanged: one dispatch one task, the orchestrator is its only writer, and
      `completed` still says the dispatch is over rather than that it succeeded.
- [x] Reporting a stage that went wrong is unaffected — a failure is not a signal that needs no action.
- [x] The file's register and column width are matched.
