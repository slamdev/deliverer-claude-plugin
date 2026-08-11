# Three contract gaps in the orchestrator's stage 1 and stage hand-offs

Status: ready-for-agent

## Problem Statement

A human refines one idea with `/deliverer:refine`. The run works — it grills the idea, writes the brief, publishes a
spec and its tickets, and hands the epic over. But an observed end-to-end run cost the human three things it did not
have to.

**They answered the same question twice.** The orchestrator dispatched a **sweep** on a build tool's container support,
then asked a round of four questions while it was still running. Two of those four turned on what the sweep was sent to
find. The sweep landed 2 minutes 37 seconds after the round was posted; the human answered 62 minutes later, on premises
that were already stale; a re-ask round followed with one question header — `Attestations` — appearing verbatim in both
rounds. One wasted answer, and a 68-minute detour, for a sweep that was two and a half minutes from landing.

**The run stalled on a guess.** The orchestrator sent a correction to the still-addressable `spec-writer` rather than
dispatching a cold one — the cheaper and better call, measured at 25,362 output tokens for a surgical 15-edit patch
against 35,777 for the original full write. But the continuation returned an acknowledgement and finished in the
background. Stage 4 is strictly sequenced after stage 3 publishes, so the orchestrator had to wait, and nothing told it
how: it ran `sleep 90` and then `sleep 180` in consecutive turns, burning two turns and 79 seconds of dead wait on
durations that were pure guesses. Too short and it loops again; too long and the epic waits on the guess.

**The brief invited the writer to trust it.** The brief handed the **writer** a decision asserting that a base-image pin
would join an existing version-bump sweep. The writer read the version-bump skill first-hand, found it hardcodes a
single path, and reported the decision unimplementable — the orchestrator's own words were *"my error, caught by the
spec writer"*, and it went back to the human rather than papering over it. That catch is the workflow's central design
bet paying off. But it was luck: nothing in the brief told the writer which statements were unchecked, and the
orchestrator spontaneously invented a brief section headed *"Facts established during the session that the spec depends
on"*. Had the false decision sat under that heading, the writer would have had every reason not to open the version-bump
skill at all, and the catch would have been lost.

## Solution

Three contract changes, each landable and reviewable on its own.

**A sweep in flight constrains the round.** Before asking anything, the orchestrator tests each pending question against
the subject it sent the sweep to settle: a question that needs those facts waits, and every other question is asked now.
When the hold leaves the round empty, the sweep is the only thing left to wait for, so it waits. And when a sweep lands
facts that contradict something already settled, that decision goes back to the human as a **fork** rather than being
carried on a premise that turned out false.

**A stage is not finished until its report is in hand.** Continuing an agent that still holds a stage's context is
encouraged, because it costs a patch rather than a rewrite. But an acknowledgement is not a **report**, and a stage the
next one reads is unfinished until its report arrives. No `sleep` stands in for one.

**The brief carries claims, not facts.** It names the statements the design rests on that the session never verified,
each with the path that would settle it, and it names them as **claims** — never as findings. The `spec-writer` checks
each one before writing it up, and a claim that does not survive goes to its report as a correction. The brief carries
no section that hands the writer facts to trust.

## User Stories

1. As a human being interviewed, I want a question held back when the answer depends on facts a sweep is about to land,
   so that I never answer the same question twice.
2. As a human being interviewed, I want every question the sweep does not touch asked immediately, so that a fact hunt
   never stalls the interview.
3. As a human being interviewed, I want a decision I already settled reopened when a sweep contradicts its premise, so
   that no answer of mine is implemented on grounds that turned out false.
4. As a human being interviewed, I want to be told that a premise changed and why, so that I can re-decide rather than
   discover the change in a spec.
5. As a refining orchestrator, I want a test for "downstream of the sweep" I can actually evaluate, so that
   classification is a check rather than a guess.
6. As a refining orchestrator, I want the sweep's subject to be the thing I test against, so that the test has a fixed
   referent I named myself.
7. As a refining orchestrator, I want the empty-round case stated, so that holding questions and never blocking the
   interview do not read as contradictory rules.
8. As a refining orchestrator, I want the sweep rules in one named section, so that stage 1 still delegates the
   interview in a single bullet.
9. As a refining orchestrator, I want the interview skills to keep owning format and pacing, so that I take ownership of
   nothing beyond the sweep-and-frontier interaction.
10. As a refining orchestrator, I want continuing an addressable writer endorsed rather than merely tolerated, so that a
    correction costs a patch rather than a rewrite.
11. As a refining orchestrator, I want to know that an acknowledgement is not a report, so that I do not treat a
    background continuation as a finished stage.
12. As a refining orchestrator, I want `sleep`-based waiting ruled out explicitly, so that I do not invent a duration
    the epic then waits on.
13. As a refining orchestrator, I want the brief to name every unverified claim with the path that settles it, so that
    the writer I dispatch has a checklist rather than a hunt.
14. As a refining orchestrator, I want the brief forbidden from carrying a findings-shaped section, so that I cannot
    hand a writer facts to trust even by accident.
15. As a refining orchestrator, I want a claim the writer killed to reach my report, so that a decision the human made
    on a false premise gets back to them.
16. As a delivering orchestrator, I want the same sequencing rule in my own skill, so that a stage feeding a later one
    is unfinished until its report arrives.
17. As a delivering orchestrator, I want `sleep`-based waiting ruled out for me too, so that seven sequenced stages
    never stall on a guessed duration.
18. As a spec writer, I want the brief's claims marked as claims, so that the one statement I must not take on trust is
    the one I am told to check.
19. As a spec writer, I want to keep meeting the repository first-hand, so that my reading is what promotes a claim to a
    fact or kills it.
20. As a spec writer, I want a channel for a claim I can neither confirm nor kill, so that it reaches a human rather
    than being written up as settled.
21. As a spec writer, I want a dead claim to go to my report as a correction, so that the orchestrator learns its brief
    was wrong.
22. As a human running the refinement, I want claims the writers killed or could not settle in the hand-off report, so
    that I see them without reading the spec.
23. As a contributor, I want **sweep** and **claim** in the glossary, so that the words the new rules turn on are
    defined once rather than re-argued per file.
24. As a contributor, I want the ADR on the orchestrator's moves to stop implying there are exactly two, so that the
    skills do not contradict the decision above them.
25. As a contributor, I want the delivery skill's share of this change scoped to what was demonstrated, so that a cost
    preference measured on one agent is not extended to agents it was never measured on.
26. As a contributor, I want the register and wrapping of each file preserved, so that the change reads as though it was
    always there.

## Implementation Decisions

### Modules touched

- **The refinement skill** (`plugin/skills/refine/SKILL.md`) — all three changes.
- **The delivery skill** (`plugin/skills/build/SKILL.md`) — the sequencing change only.
- **The spec writer agent** (`plugin/agents/spec-writer.md`) — the claims change.
- **The ADR on the orchestrator's moves** (`docs/adrs/0015-the-orchestrator-forms-no-judgement.md`) — amended.
- **The glossary** (`CONTEXT.md`) — **already landed**, see Further Notes.

### Sweeps and the frontier

- **D1. The hold test is the sweep's own subject.** A pending question is downstream of an in-flight sweep when
  answering it well needs what the sweep was dispatched to find. The rejected alternative was "a question whose premise
  those facts could change, however unrelated it reads" — that is an open-ended counterfactual, evaluates to *maybe* for
  almost any question, and so collapses into blocking on every sweep. The subject test has a fixed referent and does
  catch the observed miss: a merge gate and an attestation policy both turn on whether the build tool has a snapshot
  mode, which is exactly what that sweep was asked for.
- **D2. The subject is named at dispatch and persisted nowhere.** The orchestrator names what it asked the sweep to
  settle when it dispatches it, and tests pending questions against what it named. It is not written to the brief — the
  brief is a hand-off to the spec writer, which has no use for interview bookkeeping — and not to the task list, which
  is one task per stage and nothing else.
- **D3. An empty round means waiting is correct, and the text says so.** When the hold leaves nothing to ask, the sweep
  is the only thing left to wait for. The non-blocking property being protected is that questions the sweep does not
  touch never wait for it; when it touches all of them, nothing is delayed that the property covers. This is stated
  rather than left to judgement, because the hold rule and "a sweep never blocks the interview" read as contradictory to
  anyone who meets only one of them.
- **D4. A contradicted decision reopens as a fork.** When a sweep lands facts that contradict something already settled,
  the orchestrator says so and puts the decision back to the human rather than carrying the answer it holds. The bar it
  serves is that no decision is silently assumed, and an answer given on a premise that turned out false is exactly
  that. This codifies behaviour the observed run already produced unprompted; the hold in D1 is the only new behaviour.
- **D5. The rules live in a named section.** Stage 1 keeps delegating the interview in one bullet and gains a single
  clause naming the new section, in the shape the existing `Asking` carve-out already established. The three rules — the
  subject test, the empty round, the retraction — go in that section. The clause carving out how a question reaches the
  human **must survive**: see Further Notes.
- **D6. The interview skills keep owning format and pacing.** The refinement skill takes ownership of the
  sweep-and-frontier interaction and nothing else. Sweep dispatch itself stays non-blocking.

### Stage sequencing

- **D7. A stage the next one reads is unfinished until its report is in hand.** An acknowledgement is not a report. A
  continuation may hand back an acknowledgement and finish later; when it does, no report has arrived and the stage is
  not done.
- **D8. `sleep`-based waiting is ruled out explicitly.** No duration the orchestrator picks stands in for a report — too
  short and it asks again, too long and the epic waits on the guess.
- **D9. Continuing an addressable writer is preferred over a cold dispatch, in the refinement skill.** It keeps the
  context that wrote the document, so a correction costs a patch rather than a rewrite. Forbidding continuations is
  explicitly **not** the fix: the measured continuation ran at 71% of the original write's output cost while doing
  surgical work. A cold dispatch is for when the writer is no longer addressable.
- **D10. The delivery skill gets the sequencing half only — not the cost preference.** The sequencing defect is general
  to a strictly-ordered orchestrator, and the delivery skill is more exposed than the refinement one: seven sequenced
  stages, plus one implementer dispatch per ticket where the next starts only once the last one's report names its
  commits. The continue-over-re-dispatch preference is left out, because the measurement behind it was taken on a spec
  writer, and the delivery skill's own resume contract already says re-dispatching any agent but the code reviewer is
  safe — and the code reviewer has its own rule, since rounds are counted.
- **D11. The wording names no host mechanism.** State what must be true and what is forbidden, never the tool that makes
  it so. This follows the standing decision that the plugin names no forge: naming one host's completion mechanism dates
  the prose and breaks it wherever that mechanism differs.
- **D12. The ADR is amended so it no longer implies exactly two moves.** Continuing a dispatch that still holds a
  stage's context is the same move as dispatching it again — what differs is only the cost. What does differ is the
  sequencing: a continuation that finishes in the background has not reported, and a stage whose report has not arrived
  has not finished. The amendment is load-bearing for both skills, but is **not** a substitute for the skill text: no
  file under `plugin/` cites an ADR, and `docs/adrs/` does not ship, so a rule recorded only in the ADR reaches no
  runtime agent.

### Claims in the brief

- **D13. The brief's contract gains an unverified-claims list.** Each entry names the claim and the path that would
  settle it — a fact taken from the human, a precedent assumed to generalise, a tool assumed to have a feature.
- **D14. They are named as claims and never as findings.** The reader's own first-hand look is what promotes one to a
  fact or kills it, and a claim dressed as a fact is the one nobody thinks to check. The framing **is** the fix; get it
  wrong and the safety property is deleted rather than weakened.
- **D15. The contract forbids a findings-shaped section outright.** Making the right section available does not make the
  wrong one unavailable, and the observed orchestrator invented the wrong one with no claims list to reach for. The
  brief carries what the session decided and what it never checked, never a finding of its own.
- **D16. The spec writer checks every marked claim before writing it up.** A claim that does not survive goes to its
  report as a correction rather than into the spec.
- **D17. A claim the writer can neither confirm nor kill goes to its report.** It already has a report channel that
  reaches a human. It does **not** ride into the spec as a fork: a fork is a decision a reasonable engineer could go
  either way on, a claim is a question of fact nobody chose, and merging the two widens *fork* until its two-clause test
  stops biting.
- **D18. The refinement skill's report list grows by claims the writers killed or could not settle.** That list is
  enumerated, not open-ended, so an item not named on it is one an orchestrator has no reason to add. Both outcomes are
  reported: a killed claim is how the observed run discovered that a decision the human had made was unimplementable. A
  claim that survived is not reported — it is a fact now.
- **D19. The tickets writer is unchanged, deliberately.** Its input is the published spec, and by publication every
  claim is a fact, a correction, or a reported unknown — so the spec carries none for it to check. This is a decision,
  not an omission.

### Bounds on the change

- **D20. No new ADR.** The amendment in D12 is the whole of the ADR work. A new ADR for the refinement skill's local
  ownership of interview behaviour was considered and declined: the bar is hard to reverse, surprising without context,
  **and** a real trade-off, and this scores only on the third — deleting a section reverses it, and the existing
  `Asking` carve-out already did the same thing without one.
- **D21. Paths rather than contents stays untouched**, as does the writer's first-hand read of the repository. Those are
  what caught the false decision in the first place. This change must not turn into "the brief passes findings the
  writer can trust".
- **D22. Nothing outside this repository.** No upstream change to the interview skill, no host bug reports filed. Those
  are hand-offs, not work: see Further Notes.
- **D23. Register and wrapping are preserved per file** — load-bearing bold, no hedging, second person, "you are done
  when…", and each file's prevailing column width.
- **D24. The three changes stay independent**, each landable and reviewable on its own.

## Testing Decisions

**There is no test seam, and that is the finding rather than an omission.** Every file this spec touches is prose. The
whole of CI is `npm run typecheck && npm run lint` run from `plugin/mcp`, so none of these files has a CI surface. The
refinement workflow never calls the tools server, so exercising the review lifecycle against the scripted backend — the
by-hand check this repo prescribes when behaviour moves — would verify nothing about this change. And `deliverer` is
deliberately absent from `enabledPlugins`, so no `/deliverer:*` run against this repository is available as a check.

**Prior art is the whole repository outside `plugin/mcp`:** markdown, the manifests and the shell hooks are all verified
by hand. This change is verified the same way, and the spec says so plainly rather than performing a check that
exercises nothing.

**What a good check looks like here** — external behaviour of the prose, not its wording:

- Every snippet an implementer intends to replace is confirmed present in the current source **before** editing, and any
  mismatch is reported rather than guessed around. One known mismatch is recorded in Further Notes.
- The new section and the text already around it do not contradict each other. The specific risk is a reader meeting the
  hold rule and the non-blocking property and concluding they conflict — D3 exists to close that, so the check is that
  it reads closed.
- The glossary's own words are used, and the synonyms its `_Avoid_` lists displace are not.
- The register bar in D23 holds, and each file's prevailing column width is matched.
- Interview format and pacing are still delegated to the two interview skills, and sweep dispatch is still non-blocking.

**Nothing exercises the hold rule before a user does.** That is the honest state of this change, and it is the reason D1
was chosen for being evaluable rather than merely correct.

## Out of Scope

- **A README note on cold-host install cost.** Investigated and declined. The session-start install gate is
  unconditional and the launcher blocks the handshake for up to 25 seconds, which the refinement workflow never needs —
  but the install is paid once per host, making it lazy makes the handshake race worse rather than better, and the
  hook's lock, stamp and symlink machinery defends against measured failure modes. The only defensible change would be
  making the cost legible in the README, which is optional and low value.
- **Anything under `plugin/hooks/` or `plugin/mcp/`**, and the ADR on the launcher waiting for the install.
- **An upstream change to the interview skill.** The gap is genuinely in its own text — its fact-finding rule asks for a
  downstream classification and offers no test — but the local fix is needed regardless, since the refinement skill
  cannot ship a dependency on an unmerged third-party change.
- **Host bug reports.** Two are worth someone's time and neither is this change: a blocked question round prevents the
  orchestrator consuming a background agent's completion notification, and there is no synchronous or awaiting form of
  continuing an idle agent.
- **Any change to the tickets writer**, per D19.
- **Parallelising stages 3 and 4.** Tickets are cut from the published spec; the strict sequencing is correct.
- **Weakening paths-rather-than-contents or the writer's first-hand read**, per D21.
- **Making the interview's question format or pacing this skill's business**, per D6.

## Further Notes

### The glossary work is already done

Two terms were landed during the refinement session rather than left for implementation, and are in the working tree
now:

- **Sweep** — a fact-finding dispatch a grilling makes to settle a question of fact, carrying the subject it was asked
  to settle. Distinct from **dispatch**, which is stage-shaped and returns judgement between stages.
- **Claim** — a statement of fact a document rests on that nobody has checked, carried with the path that would settle
  it. Never a finding. One entry covers both this change's use and the existing use in the assumption reviewer, where
  the same claim-not-finding distinction was already load-bearing and undefined.

An implementer should confirm both are present and consistent with the prose it writes, not re-add them.

### One known stale snippet

The analysis this spec was built from was produced against a slightly older tree. Its proposed replacement for stage 1
of the refinement skill was written against a two-clause sentence, and the current source has three: a clause carving
out **how a question reaches the human** was added after that analysis, along with the section it points at. Applying
the proposed replacement verbatim would silently revert that carve-out. **Do not.** Stage 1's new clause is added
alongside the existing one, per D5.

Every other snippet in that analysis was confirmed present in the current source, exactly as quoted.

### The largest latency finding is already closed

The observed run's first question round was posted in the interview skill's prescribed markdown format and waited 158
minutes — and the reply, when it came, was not an answer but a request to use the host's native question tool. After
that switch, nine rounds ran with a median answer time of 79 seconds. That is the single largest lever on this
workflow's wall-clock, and it is **already fixed** in the current source. It needs nothing here beyond not being undone.

### Load-bearing behaviour this change must not disturb

The observed run exercised all of these successfully:

- Paths rather than contents, and the writer's first-hand read of the repository.
- Strict stage 3 to stage 4 sequencing, with tickets cut from the published spec.
- Non-blocking sweep dispatch — the first sweep's finding correctly reweighted an existing question rather than adding
  one.
- The correction ownership split: the orchestrator edits its own artifacts and puts a writer's document back to the
  writer that owns it.
- The report-only channel between stages.
- Repository conventions beating the skill's generic templates — the run chose the target repository's richer ADR house
  style over a minimal template, and read that repository's own documentation guard tests before writing documents that
  could trip them.

### Open forks

None. Every decision above was settled with the human in the room.
