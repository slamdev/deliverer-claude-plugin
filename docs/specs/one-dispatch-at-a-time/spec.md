# A delivery dispatches one agent at a time, and its stages stop overlapping

Status: ready-for-agent

## Problem Statement

A human delivers an **epic** with `/deliverer:build`. The run works — every **ticket** implemented, the **change
request** opened, both **rounds** run, the change request **flipped ready**. But one stage of the delivery skill asks
the **orchestrator** to do the one thing the rest of the plugin forbids, and the plugin's own documentation already
promises it will not happen.

**One stage instructs two dispatches at once.** Stage 3 reads *"dispatch `assumption-reviewer` and `code-reviewer` in
one message so they run concurrently"*. It is the only place in the plugin where two **dispatch**es are asked for
together, and the only stage of a delivery where a dispatch has been observed launched in the background rather than
waited on.

**A background dispatch may never report at all.** The skill's own **Sequencing** rule already says *"an acknowledgement
is not a report"*, and the plugin has watched that happen: in one refinement, a lone stage dispatch went out in the
background and the observation of it records *"launched in the background, with no completion recorded in this record"*
— after 18m11s of work that had a document to hand back. Nothing in either skill tells the orchestrator
not to launch a dispatch in the way that produces an acknowledgement in the first place.

**The shape is nondeterministic.** Three observed deliveries met that instruction and split two-to-one on what they did
with it:

- **A six-ticket delivery** dispatched both **in the background** on one turn, 9 seconds apart. The adjudication
  finished after 12m27s and the round after 14m15s, and both came back as completion notifications rather than as the
  results of the calls that launched them, inside a stage window of 14m25s. The orchestrator spent that wait reading the
  branch's `Gates:` sections, which is work it owes every run.
- **A nine-ticket delivery** dispatched both on one turn, 3 seconds apart, neither in the background. The adjudication
  took 17m46s and the round 16m03s, and the orchestrator did nothing at all in the 17m46s window.
- **An earlier delivery of the same epic** dispatched both on one turn, 3 seconds apart, neither in the background.

Every other dispatch in all three deliveries was waited on. So the instruction produces one of two run shapes depending
on nothing the plugin controls, and one of those two shapes is the failure mode the Sequencing rule exists to forbid.

**The shipped README already promises the contract that stage 3 breaks.** It states the requirement as *"one stage, one
dispatch, reported before the next starts"*, and its troubleshooting list names ***"Stages run over each other, or a
dispatch never reports back"*** as the symptom of a host setting left wrong. A user who reads that, watches two stages
run over each other, and goes looking at their settings is being sent after a defect that is in the skill.

## Solution

**Eight stages, each one dispatch, each waited on.** The adjudication becomes a stage of its own and the first round
becomes the stage after it; the four stages below them keep their titles and slide down by one. **Sequencing** gains a
positive rule at its head — one dispatch at a time, nothing goes out while a **report** is owed — so the property holds
for every stage rather than for the one that was paired.

What the run gives up is the shorter of the two stages: **~12 minutes and ~16 minutes** on the two deliveries measured
above. That is the price of the run doing the same thing every time, and of the plugin's documentation being true.

## User Stories

1. As a human running a delivery, I want the adjudication and the first round dispatched one at a time, so that neither
   is launched in a way that hands back an acknowledgement instead of a **report**.
2. As a human running a delivery, I want the run to have the same shape every time, so that what one run's task list
   showed me tells me what to expect from the next.
3. As a human running a delivery, I want the contract the README states to be the one the run follows, so that the
   troubleshooting symptom means what it says and does not send me after my own settings.
4. As a human running a delivery, I want a stage stopped from overlapping another even at the cost of minutes, so that a
   report I am waiting on is never lost to a notification nobody consumed.
5. As a human running a delivery, I want one task per **dispatch** for the whole run, so that the task list is a window
   on the stages rather than on how they happened to be launched.
6. As a human reading a run's report, I want everything the report names unchanged by this, so that a run's account of
   its **assumption**s, its rounds and its **spend** reads exactly as it did.
7. As a delivering orchestrator, I want one rule that covers every dispatch, so that I never have to decide per stage
   whether overlapping this one is allowed.
8. As a delivering orchestrator, I want that rule to carry its reason, so that I do not reason my way around it the next
   time a stage looks cheap to overlap.
9. As a delivering orchestrator, I want the adjudication to be a numbered stage of its own, so that "every stage below
   is one agent dispatch" is true as written rather than true with an exception.
10. As a delivering orchestrator, I want the first round to be a numbered stage of its own, so that the round I must not
    open twice has one place in the sequence.
11. As a delivering orchestrator, I want the adjudication to come first, so that the stage that can end without a review
    sits next to the **fix wave** that consumes its prose.
12. As a delivering orchestrator, I want the rule to name no host mechanism, so that it still tells me what to do on a
    host whose completion mechanism differs.
13. As a delivering orchestrator, I want every reference to a stage number pointing at the right stage after the
    renumbering, so that a bullet does not send me to a stage that no longer does what it says.
14. As a delivering orchestrator, I want the task-list section to stop naming one stage's two tasks, so that "one
    dispatch, one task" is the only rule I read about naming them.
15. As a delivering orchestrator, I want the **bearings** contract untouched, so that a resumed run still dispatches the
    adjudication again rather than counting comments.
16. As a delivering orchestrator, I want reading the branch's **gate**s to stay something I do every run, so that losing
    the window an overlap gave me does not lose the reading.
17. As a delivering orchestrator, I want the ready bar to still read as two completed rounds and green **check**s, so
    that renumbering the stage that flips the change request changes nothing about what earns it.
18. As a contributor, I want the **harness**'s stage numbers to agree with the skill's, so that a failure message does
    not name a stage that does not exist.
19. As a contributor, I want the descriptions that count a delivery's stages to say eight, so that the count I read
    matches the run I watch.
20. As a contributor, I want the skill and the harness to move in one commit, so that no commit leaves the two packages
    disagreeing about the numbering.
21. As a contributor, I want the reversal of a behaviour an earlier record called load-bearing written down with what it
    cost, so that I do not read that record as still current.
22. As a contributor, I want the glossary left alone, so that a rule about the orchestrator's behaviour does not migrate
    into the place where words are defined.
23. As a contributor, I want no new ADR for this, so that the three-part bar keeps biting.
24. As a contributor, I want the refinement skill and its **sweep**s untouched, so that a fact hunt still never stalls
    an interview.
25. As a contributor, I want the **ceiling**s left as they are, so that a slower stage is not mistaken for a run that
    needs more room.
26. As a contributor, I want each file's register and column width preserved, so that the change reads as though it was
    always there.
27. As a contributor, I want the absence of a test seam stated rather than papered over, so that nobody believes CI
    covers this.

## Implementation Decisions

### Modules touched

- **The delivery skill** (`plugin/skills/build/SKILL.md`) — the split, the renumbering, the **Sequencing** rule and one
  deletion in **Progress**.
- **The end-to-end harness** (`e2e-tests/`) — the stage numbers in the matchers, the build happy path test, the build
  run and the run directory. Comments and failure strings only; no assertion changes.
- **The contribution guide** (`CONTRIBUTING.md`) — the build happy path's stage count.
- **Untouched, deliberately**: both agent definitions, the refinement skill, `CONTEXT.md`, `docs/adrs/`, `README.md`,
  and everything under `plugin/mcp/` and `plugin/hooks/`.

### The stages

- **D1. Eight stages, each one dispatch.** Implement every ticket; open the change request; **adjudicate the
  assumptions**; **first round**; first fix wave; second round; second fix wave; flip it ready. Stage 1 keeps its
  per-ticket loop and its single task, which the existing text already excepts by name.
- **D2. The adjudication goes first, and the order is free.** Neither agent reads the other's output: the adjudication
  collects only comments carrying the `ASSUMPTION` prefix, so a **review finding** cannot be mistaken for a **fork**;
  the round is a review the tools server runs from the change request's URL; and the adjudication changes no code, so
  the diff the round reads is the same either way. The reason for this order is failure, not input — a round can end
  `failed` or `cancelled`, and its `completed` count is what the ready bar rests on, so it sits adjacent to the fix wave
  that is dispatched with its prose. Keeping the document's existing order also leaves both task names as they are.
- **D3. Sequential, not concurrent-and-waited-on.** The rejected alternative keeps the 12 to 16 minutes: dispatch both
  and go no further until both reports are in hand. It was declined because stating it means asking the host to run one
  turn's two calls concurrently while blocking on both — a host mechanism the prose may not name (ADR 0012 is the
  standing decision behind that discipline for forges, and ADR 0015 is the one this rule sits under) — and because one
  of the three observed runs, given the concurrency instruction, did not take that shape at all. Sequential is the only
  shape statable as *what must be true*.
- **D4. The two new stages are titled `Adjudicate the assumptions` and `First round`.** The four below them keep their
  titles exactly and change only their numbers.
- **D5. Three cross-references inside the skill move by one.** The change request stage's pointer to what becomes of a
  fix wave's entries, the round's pointer to the wave that is dispatched with its prose, and the **Rounds** section's
  statement of which stage the two-round bar belongs to. The pointers to stage 1 and stage 2 do not move.

### The rule

- **D6. Sequencing gains one rule at its head**: one dispatch at a time, and while a report is owed nothing else goes
  out — no stage runs beside another, and no stage is worth the minutes an overlap saves. It sits before the existing
  acknowledgement sentence, which then reads as the consequence rather than as the whole rule.
- **D7. The rule carries its reason.** Every rule in this skill gives its grounds, and a rule with no reason is the one
  an orchestrator reasons its way around — which is how one stage came to be instructed to overlap while the README
  promised it would not.
- **D8. It states what must be true and names no mechanism.** No tool, no launch mode, no host setting. This is the
  same discipline the plugin applies to forges, and it is what makes the rule survive a host that finishes a dispatch
  some other way.
- **D9. The task-list sentence naming the paired stage's two tasks is deleted, not rewritten.** `One dispatch, one task`
  and its worked example already cover naming a task from the stage it serves, and restating it for two stages that are
  now ordinary would leave the reader wondering what is special about them.
- **D10. Nothing is added about where the mechanical reading goes.** The skill already says reading the branch's
  `Gates:` sections is done every run rather than only when a report fails to arrive, and it will happen between
  dispatches on its own. The observed run that read them inside the overlap window did so because the window existed,
  not because the skill sent it there.

### What the change costs, and what is not paid for it

- **D11. The measured cost is the shorter of the two stages** — ~12 minutes on a six-ticket delivery and ~16 on a
  nine-ticket one. Accepted deliberately: what is bought is a run that does the same thing every time and a documented
  contract that holds.
- **D12. The ceilings do not change.** The build happy path measured about 23 minutes against a 90-minute wall clock and
  a $25 **spend** ceiling, and a three-ticket fixture's adjudication is shorter than either figure above. A ceiling
  raised for headroom nobody needs is a ceiling that stops catching anything.
- **D13. The dispatch count does not change.** A delivery still dispatches one implementer per ticket and one agent per
  stage after it; only the stage numbers those dispatches sit under move. The harness's declared count stays as it is.

### Bounds on the change

- **D14. The delivery skill only.** The refinement skill is untouched, and its sweeps stay non-blocking — a sweep that
  blocked would stall the interview it exists to keep moving. The background stage dispatch observed in a refinement is
  named in Further Notes and is not this change's business.
- **D15. No glossary change.** One-at-a-time is a rule about the orchestrator's behaviour rather than a word the design
  turns on, and **dispatch** and **report** already carry the terms it is stated in.
- **D16. No new ADR.** The bar is hard to reverse, surprising without context **and** a real trade-off; this scores on
  the last two only, since deleting a clause reverses it. The reversal is recorded in Further Notes below instead.
- **D17. One ticket, one commit, both packages.** Split in two, the tree spends a commit with the skill saying one
  number and a test's failure string saying another.
- **D18. Register and wrapping are preserved per file** — load-bearing bold, second person, no hedging, and each file's
  prevailing column width.
- **D19. Every snippet is confirmed present in the current source before it is edited**, and a mismatch is reported
  rather than guessed around.

## Testing Decisions

**There is no test seam, and that is the finding rather than an omission.** The seams this repo has, highest first, and
what each one reaches here:

- **The end-to-end harness** installs the plugin and drives a whole run, which makes it the highest seam available. It
  cannot see this change: it reads **session record** filenames and the **debrief**'s text, never a record's contents,
  so asserting that neither dispatch was backgrounded means a new reader over the orchestrator's own record. Declined
  with grounds — it would assert on the host's own field names, and a session record is defined as a **claim** and never
  as a contract, so the assertion would bind a test to a shape the glossary says not to trust.
- **The scripted backend** is the by-hand check this repo prescribes when behaviour moves. It exercises the tools
  server's review lifecycle; the orchestrator never enters it, so it says nothing about stage sequencing.
- **`typecheck` and `lint` in `e2e-tests`** are the only mechanical checks any file in this change touches, and what
  they cover is that the package still builds after comments and failure strings changed. They must pass; they prove
  nothing about the sweep being complete.
- **A by-hand read-through** is the verification.

**Prior art is the whole repository outside `plugin/mcp/`:** markdown, the manifests and the shell hooks are all
verified by hand, and the last change of exactly this shape — contract text in the two skills — was verified the same
way and said so.

**What a good check looks like here** — external behaviour of the prose, not its wording:

- No stale stage number is left in either package, and the two agree with each other. The references that must **not**
  move are as load-bearing as the ones that must: the refinement skill's own stage numbers appear in the harness too,
  and the delivery's adjudication keeps the number it has.
- The new rule and the paragraph it joins do not contradict each other, and a reader meeting only the new rule still
  learns that an acknowledgement is not a report.
- The skill's opening claim that every stage is one agent dispatch reads true against the stage list below it, with
  stage 1's per-ticket loop the one accommodation it already carried.
- The glossary's own words are used and the synonyms its `_Avoid_` lists displace are not.
- The register bar in D18 holds, and each file's prevailing column width is matched.
- The refinement skill is byte-for-byte unchanged.

**Nothing exercises the sequencing before a user does.** That is the honest state of this change, and it is why D3 chose
the shape that can be stated as a rule over the shape that would have been faster.

## Out of Scope

- **Concurrent-and-waited-on**, per D3.
- **A harness assertion on how a dispatch was launched or whether two overlapped.** Declined with grounds in Testing
  Decisions. If it is ever wanted, it is its own change with its own ticket, because it is the harness's first
  content-level read of a record.
- **The refinement skill**, including the background stage dispatch observed in one — per D14.
- **A new ADR, any glossary change, and any README change.** The README already states the contract this change makes
  true.
- **The two agent definitions.** Neither mentions running beside anything, so neither has anything to say about this.
- **The ceilings**, per D12.
- **Anything under `plugin/mcp/` or `plugin/hooks/`.**
- **Rewriting the stage numbers in earlier specs.** Those are records of changes already made, not live contracts.

## Further Notes

### This reverses something an earlier record called load-bearing

`docs/specs/build-run-defects/` lists, under behaviour its change must not disturb, *"Stage 3's two concurrent
dispatches, which put a whole round inside the adjudication's window."* That reading was correct about what the
concurrency bought and silent about what it cost: the same instruction produces two different run shapes, and one of
them is a dispatch that never reports. This change gives up 12 to 16 minutes a delivery, knowingly, and the earlier
record stays as written — it is an account of a past change rather than a standing contract.

### The observation records behind the figures do not survive

Every figure and quotation in the Problem Statement was read off **trace** files under the operating system's temporary
directory, which the next reboot takes. They are reproduced here rather than cited for that reason. The three
deliveries were a six-ticket and a nine-ticket delivery on one repository and an earlier delivery of the six-ticket
epic; the refinement was a separate run of `/deliverer:refine` on the same repository.

### The failure mode was observed on a lone dispatch too

The refinement whose `spec-writer` went out in the background was given no concurrency instruction — nothing asked for
two dispatches, and it backgrounded one anyway, with the observation recording no completion for it. Two things follow.
Deleting the concurrency instruction is therefore **not** on its own the whole fix, which is why D6 states the rule
positively rather than leaving the stage bullets to imply it. And the refinement skill has the same exposure with no
rule of its own — that is out of scope here, deliberately, and it is written down so the next person to look at that
skill finds it rather than re-deriving it.

### Load-bearing behaviour this change must not disturb

- The **Sequencing** contract already in the skill: a stage is unfinished until its report is in hand, an
  acknowledgement is not a report, and no `sleep` or poll stands in for one.
- Continuing an addressable agent as the cheaper way to put a stage back, and the carve-out that a continued
  `code-reviewer` opens no new round.
- **Bearings** taken from the branch and the change request, never from a task list or a comment's replies.
- One comment per assumption, unbatched, and the adjudication's own resume filter — a verdict reply, whoever wrote it.
- The mechanical carve-out: a question about the tree or the forge is the orchestrator's to settle, a judgement is not.
- Paths rather than contents in every dispatch, with the fix wave's carry of the round's prose as the one exception.

### Open forks

None. Every decision above was settled with the human in the room.
