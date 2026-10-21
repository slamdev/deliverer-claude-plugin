# 03 — The description is written by pr and refreshed before the end

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a **change request** whose description a human can judge it by, current with everything the delivery
did. `change-request-creator` describes the change request with `mattpocock-skills:pr` — a Summary, Evidence with a
before and an after, and a Merge Danger — and the delivery dispatches it once more after the second **fix wave**, so the
description read at the end accounts for both **rounds** and both waves rather than for the tickets' work alone. Today
the description has no shape and is written once, at stage 2. Settled in `../spec.md` under Implementation Decisions.

- [ ] `change-request-creator` invokes `mattpocock-skills:pr` and writes the description it produces, adding no guidance
      of its own: no source it must read Evidence from, and no line linking the epic.
- [ ] When `pr` is not installed the agent reports the skill as missing and stops, opening and editing nothing.
- [ ] The delivery skill treats that report as a stage that cannot be completed: it reports it as a **hand-off** and
      dispatches nothing further.
- [ ] A new stage between the second fix wave and the last stage dispatches `change-request-creator` again, under the
      **Sequencing** rule like every other stage, and runs on every path that reaches the last stage — whether the
      change request is then **flipped ready** or left a **draft**.
- [ ] The refresh changes the title and description and nothing else: no second change request, the draft state left as
      found, no **assumption comment** posted twice, and a fix wave's commits still passed over by the mirror. Where the
      agent's contract does not already say so, it does after this ticket.
- [ ] The stages after the refresh renumber, and every cross-reference in the delivery skill that names a stage by
      number moves with them, and no other.
- [ ] The README's troubleshooting entry for a missing skill covers a delivery that stops at its change request stage as
      well as a refinement that stops at its grilling.
- [ ] Both edited prose files are reviewed with `/mattpocock-skills:writing-for-agents`.
