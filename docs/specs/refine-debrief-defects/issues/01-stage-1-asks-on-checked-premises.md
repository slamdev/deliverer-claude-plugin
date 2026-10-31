# 01 — Stage 1 asks on checked premises, one question round per message

**What to build:** a human being grilled decides only on premises the run has checked, sees every question of a
question round at once, and never spends a question on a fact. Under the refine skill's stage 1, the premise a
recommended answer rests on goes through the same mechanical bar as a question of fact: one look settles it now, and a
thread goes out as a **sweep** while the decision waits under the existing hold. Every call of a question round goes out
in one message before any answer is waited on. The first question round states that an **epic** delivers into one
repository, and stage 1 closes only once every term a settled decision relies on is in the glossary or listed in the
brief as missing. The run fetches the default branch as it opens; where the checkout is behind, the first question
round says so and asks whether to pull. Settled under **The refine skill** in `../spec.md`; stories 1–7.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Stage 1's step 1 takes, for a decision, the premise its recommended answer rests on through the mechanical bar,
      with the reach of a removal as the example; a thread goes out as a sweep and the decision waits under step 2's
      existing hold.
- [x] A question that does not turn on a sweep's subject is still asked now: the premise check holds only the question
      whose premise is in flight.
- [x] **Asking** says every call of a question round goes out in the same message, before any answer is waited on,
      replacing "the human answers in batches".
- [x] The skill says "question round" wherever it meant a round of the human's questions, and "round" nowhere else
      for them.
- [x] The first question round states the glossary's one-repository bound.
- [x] Stage 1's done bar requires every term a settled decision relies on to be in the glossary or listed in the brief
      as missing.
- [x] The run fetches the default branch before stage 1; a checkout behind it is put to the human in the first question
      round, asking whether to pull, and the run never pulls on its own. Dispatches carry no ref.
- [x] Each change is one clause or one bullet in an existing place: no new step, file or term.
- [x] The refine skill is read against `/mattpocock-skills:writing-for-agents`.
- [x] Recorded for the hand-driven refine run (`../spec.md` § Testing Decisions): the default branch fetched before
      stage 1, and every question round wider than four questions sent as several calls in one message — or that the
      fixture raised no such frontier.

## Comments

Implemented on `refine-debrief-defects`. Run `/tmp/deliverer-e2e/refine-typescript-library-2026-10-31T20-08-21-thJPmn`, 2026-10-31: passed every assertion and the verifier, 47m 47s, $22.08 plus $0.64 for the verdict. The default branch was fetched (`git fetch` and a left/right count, `0 0`) before round 1, so no stale checkout was raised. 11 question rounds, 37 questions, none wider than four: the fixture raised no frontier that needed several calls in one message, so that behaviour waits for the next observed debrief.

Second run. Run `/tmp/deliverer-e2e/refine-typescript-library-2026-10-31T21-31-52-RBnh9f` on `b02426f`, 2026-10-31: passed every assertion and the verifier, 41m 54s, $16.71. The first question round carried six questions as two calls in one message, before any answer — the wide-frontier behaviour, now observed.
