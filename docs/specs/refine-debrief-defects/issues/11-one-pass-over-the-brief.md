# 11 — One pass over the brief

**What to build:** the sweep over the brief goes out once. Everything its pass finds — contradictions and unanswered
inputs alike — goes to the human in one question round, and the brief takes the answers; an input those answers raise
is the writer's to find, as any other fork is. Stage 1's done bar asks for that report and every input it raised
answered. This replaces ticket 10's repeat-until-none, which in its measured run took four passes and 17 questions and
tripled stage 1's cost. Settled under **One sweep goes over the brief before stage 1 closes** in `../spec.md`; story 31.

**Blocked by:** 10 — Forks settled in the briefing.

**Status:** resolved

- [x] **Sweeps**' paragraph says the sweep goes out once, and what its answers raise is the writer's to find.
- [x] Stage 1's done bar asks for the report and every input it raised answered, not for a pass reporting none.
- [x] The spec's success bar is at most one stage-3 put-back, the run at or under about $6.
- [x] The refine skill is read against `/mattpocock-skills:writing-for-agents`.
- [x] Recorded from a hand-driven refine run on claude-opus-5-5: the one pass and what it raised, the spec writer's
      stage-3 put-backs, and the run's cost against `wMwBmD` ($7.88) and `n3Eqb3` ($4.30).

## Comments

Run `/tmp/deliverer-e2e/refine-typescript-library-2026-11-01T09-46-47-Pneamy` on `37905d0`, claude-opus-5-5,
2026-11-01: passed every assertion and the verifier, 20m 21s, $5.48. **Both bars met.** The sweep over the brief made
one pass for $0.81 and raised 10 inputs, all answered in one question round. The spec writer then raised 2 forks — a
paragraph of only spaces wider than the width, and whether `wrap` shares `truncate`'s walk — closed in one put-back
($0.39), each answer carried as the option picked; the tickets writer raised none. Against `wMwBmD` (four passes):
$5.48 against $7.88, stage 1–2 at $2.16 against $4.62. Against `main`'s `n3Eqb3`: $1.18 more, of which about $0.94 is
the writers' first passes ($2.56 against $1.62). One reading against one.
