# 01 — Permit a forge named as an illustration, in the ADR that forbids naming one

**What to build:** a contributor reading the decision that the plugin names no forge finds the carve-out that permits
naming one to *illustrate a mechanism*, and still finds the rule against conditioning behaviour on a host, and the
vocabulary rule, intact. Two later tickets add worked GitHub and GitLab examples to agent definitions; until this lands
they contradict the decision above them. Settled as D6 in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] ADR-0012 states that naming a forge to illustrate a mechanism is permitted.
- [x] It states that conditioning behaviour on a host — a check for which forge is in play — remains forbidden.
- [x] The distinction is stated so that a reader can tell which side of it a given piece of prose falls on.
- [x] The existing grounds still stand as written: a host check costs nothing to write and cannot be discovered by
      anyone whose forge is not the one that happened to be tested.
- [x] The vocabulary rule is unchanged — the unit a human merges is a **change request**, never a pull request or a
      merge request.
- [x] No new ADR is added, per D25.
- [x] The ADR names no spec and no ticket, per the doc stack.
- [x] The file's prevailing column width and register are matched.
