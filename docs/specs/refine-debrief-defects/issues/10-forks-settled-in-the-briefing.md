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

- [x] Stage 1's done bar requires the sweep over the brief to report no input left unanswered.
- [x] **Sweeps** carries the paragraph: when it goes out, what it reads, its subject and input classes, what it owes
      back, and the repeat over what changed.
- [x] Stage 3's put-back carries each answer quoted as the option picked and any free text; stage 4 inherits it.
- [x] No new step, file or glossary term.
- [x] The refine skill is read against `/mattpocock-skills:writing-for-agents`.
- [ ] Recorded from a hand-driven refine run on claude-opus-5-5: the sweep over the brief and what it raised, the spec
      writer's stage-3 put-backs (at most one), and the run's cost against `main`'s $4.40 in `n3Eqb3`.
