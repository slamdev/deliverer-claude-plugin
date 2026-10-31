# 01 — A round polls once per turn

Status: resolved

**Blocked by:** None — can start immediately.

**What to build:** a **round** holds one status **poll** at a time. Both rounds of one observed run, and another run
besides, sent two identical status polls in one turn; each poll now holds for up to 50 seconds, so the duplicate held a
second wait for nothing. `code-reviewer`'s poll step says one status call at a time, never two in one turn, because
each one holds. Settled as change 1 in `../spec.md` § Solution, and sized under **Modules touched** there: the agent
runs at low effort, so the rule is one plain sentence.

- [x] `code-reviewer`'s poll step carries the rule as one plain sentence, with its reason: each poll holds.
- [x] Nothing else in `code-reviewer` moves, and it gains no working-habits block (`../spec.md` § The working-habits
      block).
- [x] The file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap are kept.
