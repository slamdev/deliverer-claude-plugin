# 02 — Extend the orchestrator's mechanical facts to the forge

**What to build:** the decision that scopes what the **orchestrator** may settle for itself covers a mechanical fact
about the forge as well as one about the tree. Ticket 07 has the orchestrator read whether the **checks** are green;
until this lands, that prose contradicts the decision above it. Settled as D22 in `../spec.md`, which also records why
the ADR is not a substitute for the skill text: nothing under `plugin/` cites an ADR, and `docs/adrs/` does not ship.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] ADR-0015 says a mechanical question about the tree **or the forge** is the orchestrator's own to settle.
- [x] The reason the exception exists is unchanged: such a question asks whether a **report**'s fact is true, not
      whether its judgement is right.
- [x] What stays forbidden is unchanged and still explicit — a **review finding**, a design, whether the work is good.
- [x] The read-only scoping and the two moves — re-dispatch or report, never fix — are unchanged.
- [x] The paragraph on sequencing — that an acknowledgement is not a report, and that a stage whose report has not
      arrived has not finished — is untouched.
- [x] The ADR names no spec and no ticket, per the doc stack.
- [x] The file's prevailing column width and register are matched.
