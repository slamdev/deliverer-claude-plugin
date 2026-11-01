# 10 — Forks settled in the briefing

**What to build:** the inputs a human's decisions leave open are put to them while stage 1 is still running, not
through a writer's report. Once the frontier is empty, the orchestrator writes the brief and sends one sweep over it,
by path, whose subject is which inputs the settled decisions leave unanswered or contradictory — derived from the
decisions: the empty input, the edge of each threshold, and inputs where two decisions' triggers meet. Each input it
reports goes to the human in one question round, the brief takes the answers, and the sweep goes out again over what
changed until it reports none. A put-back carries every answer as the human gave it. Settled under **One sweep goes
over the brief before stage 1 closes** and **An answer travels as given** in `../spec.md`; stories 31, 32.

**Blocked by:** 08 — A sweep is cut by the questions it holds.

**Status:** resolved

- Stage 1's done bar requires the sweep over the brief to report no input left unanswered. *Superseded by 11.*
- [x] **Sweeps** carries the paragraph: when it goes out, what it reads, its subject and input classes, and what it
      owes back.
- **Sweeps**' paragraph carries the repeat over what changed. *Superseded by 11.*
- [x] Stage 3's put-back carries each answer quoted as the option picked and any free text; stage 4 inherits it.
- [x] No new step, file or glossary term.
- [x] The refine skill is read against `/mattpocock-skills:writing-for-agents`.
- [x] Recorded from a hand-driven refine run on claude-opus-5-5: the sweep over the brief and what it raised, the spec
      writer's stage-3 put-backs (at most one), and the run's cost against `main`'s $4.30 in `n3Eqb3`.

## Comments

Run `/tmp/deliverer-e2e/refine-typescript-library-2026-11-01T00-24-19-wMwBmD` on `07af96b`, claude-opus-5-5,
2026-11-01: passed every assertion and the verifier, 29m 52s, $7.88. **The put-back bar is met**: the spec writer
published in one pass and raised no fork, and the tickets writer raised none, so stage 4 never looped. **The cost bar is
missed**: $7.88 against `main`'s $4.30 in `n3Eqb3`. Stages 3 and 4 came back to `main`'s level ($2.94 against $2.65,
orchestrator share included), and the whole excess moved into stage 1 ($4.62 against $1.46): the sweep over the brief
ran four passes for $1.92 and surfaced 10, 5, 1 and 1 questions, and the orchestrator's stage-1 share doubled to $2.29
over 35 questions in 9 messages. The fork cost moved rather than shrank — this branch before the sweep spent about the
same on writer put-backs — and `main` stays cheapest because its writer raised fewer forks and closed more on its own
grounds. One reading against one.
