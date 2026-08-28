# 01 — The paired stage becomes two waited-on stages

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a delivery whose stages never run over each other. `/deliverer:build` dispatches the adjudication,
waits for its **report**, and only then dispatches the first **round** — and the skill states that as a rule once, for
every stage, so the property does not depend on which stage a reader happens to be in. Today stage 3 asks for the two
**dispatch**es "in one message so they run concurrently", which is the only place in the plugin where two are asked for
together and the only stage of a delivery observed launching one in the background rather than waiting on it. Three
observed deliveries split two-to-one on which shape that produced, and one of the two is the failure the skill's own
**Sequencing** rule exists to forbid — while the shipped README already promises users "one stage, one dispatch,
reported before the next starts" and lists overlapping stages as a symptom of a host setting left wrong. Settled as D1
through D10 in `../spec.md`; the cost, ~12 to 16 minutes a delivery, is D11.

- [x] Stage 3 becomes two stages, **Adjudicate the assumptions** and **First round**, dispatching `assumption-reviewer`
      and `code-reviewer` respectively. The clause `in one message so they run concurrently` is gone, and nothing
      replaces it with a different instruction about how a dispatch is launched: what these two stages say about
      launching is nothing at all, which is what every other stage says.
- [x] The prose the paired bullet carried follows the half it belongs to. The verdicts sentence — `accept`, `override`
      or `escalate` on every `ASSUMPTION` comment — goes with the adjudication; the round's own sentences, that it
      drives one round and reports its prose and that the prose is the only form of a finding the reviewer did not post,
      go with the round.
- [x] The four stages below renumber — first fix wave 5, second round 6, second fix wave 7, flip it ready 8 — with their
      titles and their bodies otherwise untouched.
- [x] Three pointers move by one, and no others: the change request stage's pointer to which stage says what becomes of
      a **fix wave**'s entries (4 → 5); the round's pointer to which stage is dispatched with its prose (4 → 5); and
      **Rounds**' opening, naming the stage the two-completed-rounds bar belongs to (7 → 8). The fix wave bullet's
      reference to stage 2's mirror, **Resume**'s references to stage 2, and **Progress**'s references to stage 1 stay
      exactly as they are.
- [x] **Sequencing** opens with the rule, verbatim: "One dispatch at a time: while a **report** is owed, nothing else
      goes out — no stage runs beside another, and no stage is worth the minutes an overlap saves." The paragraph's
      existing first sentence follows it unchanged, so an acknowledgement not being a report reads as the consequence of
      the rule rather than as the whole of it, and the `sleep`-and-poll sentence and the clause about stage 1 are
      untouched.
- [x] The rule names no host mechanism — no tool, no launch mode, no host setting — and no sentence is added elsewhere
      to make up for that. It states what must be true, in the discipline ADR 0012 sets for forges and under the
      sequencing ADR 0015 records.
- [x] **Progress** loses the sentence naming the paired stage's two tasks outright, rather than gaining a rewritten one.
      `One dispatch, one task` and its `<slug>: open the change request` example already name a task from the stage it
      serves, and stage 1's own accommodation stays as it is.
- [x] The skill's opening paragraph is left alone. With the split, its claim that every stage below is one agent
      dispatch reads true, with stage 1's per-ticket loop the one accommodation it already carried.
- [x] The **harness** counts the same stages the skill does: every reference to the stage that flips the change request
      reads 8, and every description counting a delivery's stages reads eight. They sit in the matchers, the build happy
      path test, the build run and the run directory, in comments and in the failure strings a contributor reads.
- [x] Three harness references must **not** move, and a sweep that catches them is a defect rather than thoroughness:
      the refinement skill's stage 4, which cuts an epic into slices; the refinement skill's stage 3, which a run with a
      brief on disk reaches; and the delivery's stage 3, which is still the adjudication.
- [x] The declared dispatch count stays at nine — no dispatch is added or removed — and the comment above it stops
      saying one stage dispatches two, naming instead the stages the second round and second fix wave repeat.
- [x] `CONTRIBUTING.md`'s description of the build happy path says eight stages.
- [x] Nothing else moves. `assumption-reviewer.md` and `code-reviewer.md` are untouched — neither mentions running
      beside anything — as are the refinement skill byte-for-byte, `CONTEXT.md`, `docs/adrs/`, `README.md`, which
      already states the contract this makes true, and everything under `plugin/mcp/` and `plugin/hooks/`. Earlier specs
      keep the stage numbers they were written with: they are records of changes already made, not live contracts.
- [x] `(cd e2e-tests && npm run typecheck && npm run lint)` passes, and `(cd plugin/mcp && npm run typecheck && npm run
      lint)` still does. Nothing here has any other mechanical check, which is the finding rather than an omission —
      `../spec.md`'s Testing Decisions says why, and the verification is the by-hand read-through it describes.
- [x] Every snippet replaced is confirmed present in the current source before it is edited, and a mismatch is reported
      rather than guessed around.
- [x] One commit, both packages, so no commit leaves the skill and a test's failure string naming different stages.
      Register and each file's prevailing column width are matched — the skill wraps at 120, the harness's TypeScript at
      ~100 — counting characters rather than bytes, since the em-dashes are three bytes each.
