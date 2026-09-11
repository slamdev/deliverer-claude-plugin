# The spec writer is primed once

Status: ready-for-agent

## Problem Statement

A human refines one **idea** with `/deliverer:refine`. Stage 3 dispatches the **spec-writer**, which reads the
**brief**, meets the codebase first-hand, publishes the **spec** and reports. Then the orchestrator reads that report,
finds a **fork** in it, puts the fork to the human, gets an answer, and **puts the stage back** so the writer folds the
answer into the published spec. Then it finds the next fork, and does the whole thing again.

**Measured on 2026-09-10, that happened four times in one run.** The spec writer was re-primed once per late-surfacing
fork, against a document that only ever grows. The stage took **168 model turns** where the same stage on the baseline
plugin took 89, reached a **243,036-token peak context**, and re-read **23.15M** cached tokens — more, on its own, than
the whole-run cache read of every other **run** ever measured here. Modelled at first-party rates that one stage is
**$24.39 of a $36.65 run: 68%**.

**It is not what the writer wrote.** Both runs published a spec of near-identical length. The difference is how many
separate times the stage was primed against an ever-growing document.

**And spend is quadratic in a stage's turn count.** Context grows steadily — 1,270 to 2,763 tokens per turn depending
on the agent — so total re-read goes with the square of the turns. The costliest 10% of turns carry 37-38% of a run's
cost in all four runs measured. A stage that reaches the same answer in 30% fewer turns models at **45% less**. Every
re-prime is therefore paid for twice: once for the turns it adds, and again for the context every one of those turns
re-reads.

**The plugin instruction behind it is singular.** `plugin/skills/refine/SKILL.md` stage 3 says a killed **claim** takes
a decision down with it, so put *that* decision back to the human and then put the stage back to fold *the* answer in.
It is singular throughout and says nothing about holding several closures for one put-back. The baseline plugin had no
put-back loop at all — its orchestrator improvised one, and **batched**: "Human closed **all three** forks; fold into
spec". So the loop that made the run *more correct* is the loop that made it quadratically more expensive, because
nothing told it to batch.

**The forks were not the ones the contract anticipates, either.** `spec-writer.md` kills claims at step 3 of 6 and
writes at step 5, so a killed claim's decision would batch naturally — the writer has them all before it writes a line.
What actually surfaced were **collisions between decisions the brief had already settled**, found while writing, when
the writer traced one settled decision's consequences and hit another. Nothing in the contract looks for those, so they
arrive one at a time, each one a fresh re-prime.

**The same disease appeared one stage later.** The **observer** watching that run named a second **defect** from its own
**dispatch note**s: the published spec declared every fork closed while the **tickets-writer**'s own reading found one
still open, which reopened two dispatches that had already reported complete. A fork can be declared closed on nothing,
and the next dispatch is what discovers it.

**The observer reached the first finding independently and grounded it.** The three resume turns' own cache-writes —
114,905 + 174,608 + 227,397 = **516,910 tokens** — are 54% of the spec writer's whole cache-write and 36% of the run's.

## Solution

Three prose changes, in the two files that hold the contract, plus one glossary clause.

**The put-back is batched, per wave.** The orchestrator holds every fork a writer's **report** raised, closes them all
with the human in one question round, and puts the stage back **once**. The report is the wave boundary: one report, one
round, one put-back. If folding those answers in raises new forks the writer could not have seen before, that is a new
wave and the same rule applies — batched again, never one put-back per fork.

**The writer's first fork inventory is made complete.** The spec writer gains a check for the category that actually
surfaced: two decisions the brief settled that cannot both hold. It runs where the brief's contents already meet
first-hand reading, so a collision lands in the *first* report rather than arriving as a fourth wave.

**Nothing contradictory publishes as settled.** The writer's publish step gains a bar: no two decisions in the published
spec may contradict each other on an input the spec names *and* be written up as settled. One caught at that point
publishes as an open fork with both roads named — the writer cannot resolve it, because that decision is the human's.

**A closed fork carries the grounds that closed it**, so a fork closed on nothing is visible in the document rather than
discovered by the next dispatch.

Cost is what motivates this, but correctness is what it buys alongside: a fork that surfaces in the first report is a
fork the human closes before the spec is written, rather than one that reopens a completed dispatch.

## User Stories

1. As a human refining an epic, I want every fork my spec writer raised put to me in one round, so that I answer once
   instead of being interrupted four times over an hour and a half.
2. As a human refining an epic, I want the writer put back once per round of answers, so that I am not paying for the
   whole spec to be re-read each time I close one decision.
3. As a human refining an epic, I want the stage-3 instruction to say plainly that closures are held and batched, so
   that an orchestrator reading it cannot conclude that one fork means one put-back.
4. As a human refining an epic, I want a late-surfacing fork to still reach me when one appears, so that batching never
   costs me a decision.
5. As a human refining an epic, I want a second wave of forks handled by the same rule, so that the loop stays correct
   when my own answers expose something new.
6. As a human refining an epic, I want the number of put-backs bounded by the number of reports rather than by the
   number of forks, so that the cost of stage 3 stops growing with the count of open decisions.
7. As a human refining an epic, I want the spec writer to look for collisions between decisions my brief already
   settled, so that the fork inventory in its first report is the whole inventory.
8. As a human refining an epic, I want that check to run where the brief's decisions meet the writer's first-hand
   reading, so that it catches the collisions that are only visible once consequences are traced against the code.
9. As a human refining an epic, I want a collision reported on a line of its own, so that I can tell what the writer
   newly discovered from what my brief already left open.
10. As a human refining an epic, I want the writer to name both roads of a collision and which decision each came from,
    so that I can close it in one answer without re-reading the brief.
11. As a human refining an epic, I want no spec published that writes two contradicting decisions up as settled, so that
    no ticket is cut from a decision the spec itself disproves.
12. As a human refining an epic, I want a collision found at publish time to publish as an open fork rather than block
    the spec, so that I am never handed a half-refined epic with no spec at all.
13. As a human refining an epic, I want every fork the spec declares closed to carry the **grounds** that closed it, so
    that a fork closed on nothing is visible before the next stage discovers it.
14. As a human refining an epic, I want the tickets stage to stop reopening dispatches that already reported complete,
    so that the same re-priming does not simply move one stage later.
15. As a human running a refinement, I want the spec writer's stage to cost what the work needs, so that a simple idea
    does not cost $36 to refine.
16. As a human running a refinement, I want the saving to come from fewer turns rather than terser turns, so that the
    quality of what the writer writes is not what pays for it.
17. As a contributor, I want the batching rule stated as a rule and not as an allowance, so that a model reading it
    batches by default rather than when it feels expensive.
18. As a contributor, I want the wave boundary defined by something the orchestrator already has — the report — so that
    the rule needs no new signal, no poll and no guess about whether more forks are coming.
19. As a contributor, I want a collision between settled decisions called a **fork**, so that the glossary carries no
    invented word for a thing it already describes.
20. As a contributor, I want the **Grounds** entry to name a closed fork alongside a verdict, a declined finding and a
    reopened ADR, so that the glossary lists every place grounds are owed.
21. As a contributor, I want the two files' prose to stay in the register the repository writes agent prose in, so that
    a model reads them as instruction rather than as commentary.
22. As a contributor, I want the changed instructions to use the glossary's own words — fork, claim, grounds, report,
    wave — so that a reader meets one vocabulary.
23. As a contributor, I want the measured figures this change rests on committed in the repository, so that the reason
    for the change outlives the working document it was written in.
24. As a contributor, I want the corrections to that measurement written down beside it, so that nobody re-derives a
    conclusion the evidence has already reversed.
25. As a contributor, I want the reasons a proposal was dropped recorded as decisions, so that the next person reading
    the analysis does not implement it again.
26. As a maintainer, I want this change to touch no Node code, no hook and no manifest, so that its blast radius is the
    prose an agent reads and nothing a user's session runs.
27. As a maintainer, I want the tickets writer left alone, so that a fix aimed at the spec writer's contract does not
    quietly change a second writer's.
28. As a maintainer, I want the effort tier and the model left untouched, so that this change's effect can be attributed
    without a capability trade mixed into it.
29. As a maintainer, I want verification stated honestly as one paid run read for mechanism, so that nobody reads a
    single dollar figure as a measured saving.
30. As a maintainer, I want the done-bar to be the trace showing one batched put-back per wave, so that the check is
    something a single run can actually settle.
31. As a maintainer, I want the ceiling raise kept local and uncommitted, so that raising it never becomes part of what
    a run measures.
32. As a maintainer, I want the effort-tier hand-off recorded as live rather than merely noted, so that the condition
    set for reopening it is seen to have fired.

## Implementation Decisions

### Modules touched

- **`plugin/skills/refine/SKILL.md`** — stage 3's put-back instruction. This is the orchestrator's contract and the only
  place the batching rule can live, because batching is a decision about a run's shape and the orchestrator is what
  holds a run's shape.
- **`plugin/agents/spec-writer.md`** — step 3 (the collision check), step 5's done-bar (the publish gate), the closed-
  fork grounds requirement, and the report contract.
- **`CONTEXT.md`** — one clause on the **Grounds** entry.

Nothing else. No Node code, no hook, no manifest, no `e2e-tests/` file, and no second agent file.

### The batched put-back

- **D1. The rule is one put-back per wave, and the report is the wave boundary.** One report, one question round, one
  put-back. The orchestrator holds every fork a report raised until it has closed all of them with the human, and then
  puts the stage back once carrying every answer. Nothing else has to be introduced to make this work: the report is
  already the only thing a dispatch returns, so the orchestrator already knows exactly when it has the full set of forks
  that report raised.
- **D2. A new wave is legitimate and uncapped.** Folding a wave's answers in can make the writer hit a collision it
  could not have seen before. That report opens a new wave, and the same rule applies to it. The alternative — a hard
  cap of one put-back — was declined: a late fork would then have nowhere to go but the report, so the published spec
  ships wrong to save a re-prime, and correctness is what the put-back loop exists for.
- **D3. The rule is stated as the rule, not as an allowance.** The current wording is singular throughout — *that*
  decision, *the* answer — and a model reading it puts the stage back per fork without ever being told to. The
  replacement is plural by default: the closures a writer's reading forced are held, closed together, and folded in
  once. Wording that merely *permits* batching is not enough, because the measured run had that permission implicitly
  and did not take it.
- **D4. The human's round is bounded by the existing Asking contract and nothing new.** Four questions is one
  `AskUserQuestion` call's limit and a wave may hold more; the skill's **Asking** section already says to carry the rest
  into further calls rather than trimming. A wave is one round of questions in that sense — every fork reaches the human
  before the stage goes back — regardless of how many calls that round takes.

### The writer's fork inventory

- **D5. The collision check lives at step 3.** Step 3 is already where the brief's contents meet the writer's own
  first-hand reading, which is precisely what the check needs: the measured collisions were invisible from the brief
  alone and only became visible once a settled decision's consequences were traced against the code. Step 1 was declined
  for that reason — reading the brief is too early. A new numbered step between 3 and 4 was declined as a step whose
  work belongs to one that already exists.
- **D6. A collision is two decisions the brief settled that cannot both hold on an input the spec names.** That is the
  category, stated narrowly. It is not a claim, which is a statement of fact nobody checked; it is not a fork the brief
  left open, which the human already knows about. It is two closed decisions in conflict.
- **D7. A collision rides into the spec as a fork, and the glossary needs no new term.** Once the writer finds it the
  decision *is* open again, and both of **Fork**'s clauses hold: a different reasonable engineer could take either road,
  and which road is taken changes behaviour the spec cares about. It is marked the human's to close, beside the forks
  the brief left open and the ones a killed claim reopened. Calling it a **claim** instead was declined — that would
  name a decision a statement of fact, which the glossary explicitly forbids.
- **D8. The report gains a line of its own for collisions.** Every collision found between decisions the brief settled,
  with the fork it became. It is separate from the existing open-forks line because the two carry different weight for
  the reader: a fork the brief left open is one the human already knows about, while a collision is new information they
  have to be told. The orchestrator needs that distinction to know what its next question round is actually about.

### The publish gate

- **D9. Step 5's bar forbids writing a contradiction up as settled — it does not forbid publishing.** The bar is that no
  two decisions in the published spec contradict each other on an input the spec names *and* are both written up as
  settled. Blocking publication until the human closes the collision was declined: it costs a put-back before the spec
  exists at all, which is the exact re-prime this epic removes, and it hands the human a half-refined epic.
- **D10. A collision caught at publish time publishes as an open fork with both roads named**, in the same place the
  template already carries open forks, and saying which settled decision each road came from. The writer holds the
  context that found the collision; reconstructing it later costs the human a re-read of the brief or the orchestrator a
  cold dispatch. Naming the roads is what makes the human's single answer enough to close it.
- **D11. A fork the spec declares closed carries the grounds that closed it.** This is the observer's second defect,
  fixed in the writer's contract rather than the tickets writer's: a fork closed on an answer names that answer as its
  **grounds**, and a fork with no grounds is not closed. A fork closed on nothing then shows in the document, where the
  next dispatch would otherwise be what discovers it.
- **D12. The tickets writer is untouched.** The wider fix — telling the tickets writer what to do when it finds a fork
  still open — was declined for this epic. D11 addresses the cause in the file that produces the document; adding a
  third file would widen the change without evidence that the effect survives D11.

### The glossary

- **D13. `CONTEXT.md`'s Grounds entry gains a closed fork.** The entry reads as an exhaustive list of what stands on
  grounds — a verdict, a declined finding, a reopened ADR, and for a **defect** what the observation kept. A closed fork
  is a fourth, and after D11 the plugin's prose uses it that way. Amending **Fork** instead was declined: the
  requirement belongs in the entry that defines what grounds are, not duplicated into the term it constrains.
- **D14. No new term, and no ADR.** D7 settles that **Fork** already covers a collision. And this change misses the ADR
  bar on its first clause: a contract stated in prose is reversed by editing prose, so it is not hard to reverse. ADRs
  here need all three of hard to reverse, surprising without context, and the result of a real trade-off.

### Bounds on the change

- **D15. Model and effort are untouched, everywhere.** `spec-writer.md`'s `effort: high` stays. Reopening effort on the
  reading-heavy writers was already made a hand-off, live only if the measurement disappointed. It disappointed, so that
  hand-off is now live — and it is still not this epic. Two facts sharpen it for
  whoever picks it up: `high` is the API default, so that frontmatter line changes nothing today; and lower effort
  consolidates tool calls, which is the same quadratic lever this epic pulls rather than a per-turn saving. Against
  those, the published curve for long-horizon agentic work trades roughly 2 points of quality at `medium` for half the
  cost and about 8 at `low` for a quarter, every figure behind the local case is n = 1, and the guidance is explicit
  that a one-case swing decides nothing. It needs a sweep of its own — roughly four runs and $160 — with its own
  approval.
- **D16. No sweeper agent, and no agent-type preference for a sweep.** The proposal was to give the **sweep** a cheap
  read-only agent, on the grounds that a sweep owes facts and never a view and so needs no write tools. The traces
  contradict both halves, and the family was already declined once for portability — the sweep's target stays whatever
  the host offers. See *What the evidence reversed* below.
- **D17. This epic edits no landed spec's prose and no published figure.** A landed spec records what was decided when,
  and editing one to move a measured figure is forbidden where those figures were published. This change touches the
  machinery those figures were measured against, which is a different change and reads as one.
- **D18. The measurement folds into this spec, and the working document it came from is not this epic's to deliver.**
  The figures this epic rests on become the *Further Notes* measurement section below, corrected, matching the precedent
  already set here: a measurement is carried inside the spec whose decisions rest on it. A spec resting on an untracked
  root file, or on `/tmp` traces marked never to be forwarded, is a citation nobody downstream can follow. Method that
  no decision rests on is not carried over — the cache-TTL price derivation, the scratch-script provenance, and the
  reproduction commands, which `CONTRIBUTING.md` § *Tallying a run* already documents. **The untracked working document
  is disposed of outside this epic**, because removing an untracked file produces no diff: no ticket could deliver it
  and no change request could show it. It is named as a **hand-off** instead.

## Testing Decisions

**There is no test seam, and that is the finding rather than an omission.** Every file this spec touches is prose read
by a model. CI is `npm run typecheck && npm run lint` over `plugin/mcp` and `e2e-tests` and nothing else, so none of
these files has a CI surface. The refinement workflow never calls the tools server, so exercising the review lifecycle
against the **scripted backend** — the by-hand check this repository prescribes when behaviour moves — would verify
nothing here. And `deliverer` is deliberately absent from `enabledPlugins`, so no `/deliverer:*` run against this
repository is available as a check.

**Prior art is the whole repository outside `plugin/mcp`**, and specifically the two epics that touched these same
files: `orchestrator-contracts` and `the-interview-stops-reading` both reached this finding and said so plainly rather
than performing a check that exercises nothing. That is the precedent this section follows.

**What a good check looks like here** — the external behaviour of the prose, not its wording:

- Every snippet an implementer intends to replace is confirmed present in the current source **before** editing, and any
  mismatch is reported rather than guessed around.
- The batching rule does not read as forbidding a second put-back. A reader meeting "put the stage back once" must not
  conclude that a fork surfacing later has nowhere to go; D2 is what stops that reading, and it has to be in the same
  passage.
- The batching rule does not read as an optimisation the orchestrator may skip when it seems cheap. D3 is the single
  most dangerous misreading in this change: the measured run already had permission to batch and did not.
- The collision check does not read as licence to *settle* a collision. The writer finds it and names both roads; the
  decision stays the human's, and step 3's existing wording about a claim the writer's reading kills is the model for
  that distinction.
- The publish gate does not read as a block on publishing. D9's bar is about what may be written up as settled, and a
  reader concluding otherwise would strand an epic with no spec.
- The report's new line reads as distinct from the open-forks line beside it, so an orchestrator cannot merge them and
  lose which forks the human has already seen.
- The closed-fork grounds requirement does not read as a demand for grounds on a fork the spec leaves *open*.
- The glossary's own words are used and the synonyms its `_Avoid_` lists displace are not, and the amended **Grounds**
  entry still reads as one sentence about evidence rather than a list of rules.
- Each file's prevailing column width is matched, and the register of agent prose holds.

**One existing paid test is the instrument, unchanged.** `e2e-tests/tests/refine-happy-path.test.ts` drives a whole
refinement against a committed **fixture** and leaves a **run directory** and a **trace** behind. **No assertion is
added to it and the file is not edited.**

**The done-bar is the trace, read by hand, for mechanism and not for money.** After the epic lands, one run, and then
the trace's `SendMessage` lines: they show directly whether the spec writer was put back once per wave carrying several
closures, or once per fork. A single run settles that. It does **not** settle a dollar saving, because run-to-run spread
on this fixture has never been measured, and a figure from one run of each side cannot be separated from it. Report the
spend and say which of the two the figure is.

**A mechanical assertion at that seam was considered and declined.** Counting the spec writer's put-backs against its
reports is close to right, but the contract legitimately allows continuing a writer to ask after a report that never
came, which inflates the count without a re-prime — so the assertion would fail runs that did nothing wrong. Extending
the **verifier** with the same question was also declined for this epic: it would trade a fact for a judgement on a
change whose evidence is already a judgement call.

**The ceiling needs raising locally, and the raise is never committed.** `DEFAULT_CEILINGS` is 90 minutes and $25; the
plugin as measured takes 97m56s and $36.36, so a run at today's cost is reported as a **ceiling** rather than as a
measurement and the money is spent for nothing. `e2e-tests/harness/ceilings.ts` is no part of what a run measures —
only `plugin` and `.claude-plugin` are staged — so a local uncommitted raise changes when the harness stops a run and
nothing else. Committing one would let the ceiling drift up behind a regression, which is what it exists to catch.

**Nothing exercises the new rule before a user does, absent that paid run.** That is the honest state of this change.

## Out of Scope

- **A read-only or otherwise cheaper agent for the sweep**, per D16. The evidence for it reversed; see below.
- **Model and effort tiers**, per D15. A live hand-off, and not work in this epic.
- **The writer's upkeep of its own output document.** Across all four runs the spec writer spends 42-68% of its tool
  calls on the document it is writing, and 13-31% on mechanical upkeep of it — column width, renumbering **user
  stories** after an insertion, re-grepping its own spec for a phrase it may have contradicted. Cheap to attack and
  worth attacking, but *linear* where the batching work is quadratic, and the figure is keyword-matched so indicative
  rather than exact. A hand-off.
- **The writer re-establishing facts a sweep already settled.** The measured run's writer re-fetched issue titles the
  sweep had cited, which by the contract should not happen: what a sweep settled rides in the **grounds** beside the
  decision it settled, and a **claim** is the only thing the writer checks first-hand. One tool call is not grounds for
  changing a contract. Carried as a **hunch**.
- **Moving fork discovery into the interview.** The deeper version of this finding is that in both runs forks surfaced
  only once a writer read the settled decisions closely enough to hit their consequences. Whether stage 1 *can* surface
  them earlier is a design question no measurement here answers, and it would change the interview rather than the
  writer.
- **The tickets writer's contract**, per D12.
- **The interview's own turn count.** Lighter on the current plugin than the baseline — 38 turns against 55 — and moving
  in the intended direction already.
- **Any assertion or harness change**, and any edit to `e2e-tests/`, per the Testing Decisions above.
- **Editing this epic's own prose to move a figure**, following the standing rule that a measured figure is reported
  rather than engineered. A flat or worse figure is reported.
- **Two judgement calls flagged on an earlier change request** — `**rote**` bolded in `CONTEXT.md` and
  `plugin/agents/tickets-writer.md` with no glossary entry, and the tickets writer's open clause. They shipped with that
  merge and are their own concern.

## Further Notes

### The measurement this change rests on

Two runs of `e2e-tests/tests/refine-happy-path.test.ts`, driven in parallel on 2026-09-10, differing in exactly one
thing: the plugin. **OLD** is the plugin at `0b99d0c` (2026-08-15) under *today's* **harness**; **NEW** is
`the-interview-stops-reading` at `cb0f8fd` as committed. Both passed every mechanical assertion and both **verifier**s,
no **ceiling** reached, one attempt each.

Both runs were served through an internal proxy to **Amazon Bedrock**, which is partner-operated with its own pricing.
Every dollar figure below is the host's own estimate at Anthropic first-party rates, so it supports a same-provider
ratio and never a bill.

**Three deviations qualify these figures, and each was deliberate.** The **ceiling**s were raised locally and
uncommitted from 90m/$25 to 150m/$40 in both trees, so "no ceiling reached" above means *no raised ceiling* reached —
the NEW run would have hit the original $25 and been reported as a ceiling rather than as a measurement. The
debrief assertion was skipped in the OLD tree alone, because the whole **observer** postdates `0b99d0c` and no run of
that plugin can leave a **debrief**; that is also why OLD carries no observation spend rather than a small one. And both
trees ran with the thinking summary displayed, which is what made the put-back sequence below readable at all — every
earlier run's reasoning is empty.

| | OLD (`0b99d0c`) | NEW (`cb0f8fd`) |
|---|---:|---:|
| wall clock | 73m 43s | **97m 56s** |
| the run, **responder** included | $22.69 | **$36.65** |
| the **verdict**, out of band | $0.96 | $0.59 |
| the observation, out of band | **$0** — no **observer** in this plugin | $2.44 |
| model turns | 188 | 275 |
| output tokens | 192,074 | 254,749 |
| cache write | 962,194 | 1,421,680 |
| cache read | 15,077,353 | **30,559,654** |
| **ticket**s published | **8** | 5 |
| **user stories** | **60** | 53 |
| spec / ticket / ADR lines | 694 / 437 / 30 | 698 / 320 / 47 |
| question rounds / questions | 10 / 26 | 10 / 22 |

**The current plugin costs 62% more and delivered less.** Two things that settles, and one it does not.

The `$6.36` a refinement once cost is **not recoverable by putting the old plugin back**: that same plugin costs $22.41
under today's harness. Whatever took a refinement from $6 to $20-plus, it is not the plugin's instructions growing — the
control says so. And the regression since 2026-09-09 is real and large: the branch measured $20.03 then and $36.36 now.

What it does not settle: **one run each.** Nothing here separates a 62% gap from the spread between two runs of the same
**fixture**, which nobody has measured. Both also ran in parallel on one machine, so both wall clocks carry that too —
though the pair is fair to itself, since both bore the load.

### The whole difference is one stage

| run | spec-writer turns | peak context | cache read | modelled $ | share of run |
|---|---:|---:|---:|---:|---:|
| 09-09 before (`main` `4234d15`) | 71 | 176,535 | 6.73M | $10.11 | 58% |
| 09-09 after (branch `742da87`) | 88 | 133,268 | 7.06M | $9.13 | 46% |
| today OLD (`0b99d0c`) | 89 | 144,509 | 7.79M | $9.71 | 44% |
| **today NEW (`cb0f8fd`)** | **168** | **243,036** | **23.15M** | **$24.39** | **68%** |

That one stage's cache read exceeds the whole-run cache read of every other run ever measured here (10.19M, 14.22M,
15.08M), and its peak context is the highest.

### The put-backs, side by side

NEW, from the trace's `SendMessage` lines — four separate primings, one fork each:

| | what the put-back carried |
|---|---|
| 10:54:52 | "Hard-break fork closed; glossary terms landed" |
| 11:02:24 | "Finish the interrupted spec edit and report" |
| 11:12:24 | "Decision 20 closed: skip reset when prefix empty" |
| 11:40:40 | "Decision 21: wide indent may stand alone" |

OLD hit **the same problem** — forks surfacing after the interview had confirmed — and batched:

| | what the put-back carried |
|---|---|
| 10:41:08 | "Human closed **all three** forks; fold into spec" |
| 11:08:02 | "**Two more** forks closed; fold into spec" |
| 11:08:44 | "Human closed **two of your three** gaps" |
| 11:15:24 | "Status and Blocked by lines are misplaced" |

**The observer grounded the same finding independently**, from its own **dispatch note**s rather than from the trace:
the three resume turns' cache-writes are 516,910 tokens, 54% of the spec writer's whole cache-write and 36% of the
run's.

### Why turns and not context per turn

Cost concentrates in each stage's tail: the costliest 10% of turns carry **37-38%** of a run's cost in all four runs,
while the cheapest half carries 25-26%. Context grows 1,270-2,763 tokens per turn depending on the agent, so total
re-read goes with the square of a stage's turn count. Holding that slope, a stage reaching the same answer in fewer
turns models at:

| stage | as measured | −10% turns | −20% | −30% |
|---|---:|---:|---:|---:|
| NEW spec writer | $24.39 | $19.09 | $16.16 | **$13.43** |
| OLD spec writer | $9.71 | $7.56 | $6.48 | $5.45 |
| NEW interview | $4.80 | $3.71 | $3.19 | $2.70 |

A 30% cut in turns buys a **45%** cut in that stage's cost. An optimisation that makes a stage terser per turn pays
linearly; one that makes it reach its answer in fewer turns pays quadratically. That ratio is why this epic attacks
re-primes and leaves the writer's prose alone.

### What was ruled out, and stays ruled out

- **The thinking summary.** Its replay models at ~$0.76 of the NEW run (2%) and ~$0.31 of the OLD (1.4%), because
  `display: "summarized"` changes what is echoed back and never what generation is billed. It bought this whole
  diagnosis for 2%.
- **Output volume.** The NEW run wrote 33% more output tokens for 62% more money and *fewer* tickets, so output tracks
  neither cost nor delivered work.
- **Prompt caching.** Cache write is ~3,900 tokens per request against a ~70K prefix — one turn's delta, the shape the
  caching guidance calls healthy — and cache read is 94-96% of all input in every run. There is no silent invalidator to
  hunt; this is what the design costs.
- **`205348b` as the cause.** It landed prose in both writers between the 09-09 run and `cb0f8fd`, and was investigated
  and cleared: its wording is near-equivalent to what it replaced.

### What the evidence reversed

**A third proposal was dropped because reading the traces contradicted it**, and it is recorded here so that nobody
re-derives it from the numbers alone. The proposal: give the **sweep** a cheap read-only agent where the host offers
one, since a sweep owes facts and never a view and so needs no write tools. The figure behind it was an 11× gap — the
baseline's sweep ran 5 turns and 1m30s on an `Explore` agent; the current plugin's ran 42 turns and 12m18s on a
`general-purpose` one, for ~$3.37.

What the two traces actually show:

- **The cheap agent was never tool-starved.** The baseline's `Explore` sweep was granted `WebFetch` and `WebSearch`; the
  two sweeps' toolsets differed by `NotebookEdit` alone. It simply never used them — all five of its calls were `Bash`
  against the clone.
- **The expensive sweep needed a tool `Explore` does not have.** It wrote and ran five scratch probe scripts, after
  three shell-quoting failures mangled the escape bytes it was probing. `Explore` has no `Write`. Forcing that sweep
  onto a read-only agent would have taken its method away, not made it cheaper.
- **The subjects were different work.** Repository constraints — five `Bash` calls, 1m30s — against external prior art:
  roughly 19 network retrievals over ~16 URLs on 9 hosts, plus behavioural probes against four locally installed
  packages. In the baseline run prior art was never swept at all; the *spec writer* did those lookups downstream. So
  part of the gap is work that moved into stage 1, arguably to the right place.
- **A large share of the 42 turns was friction, not subject.** Four failed calls on shell quoting, an API error
  mid-response, a failed document fetch followed by a ~6-turn fallback hunt, an import failure with a fix-and-rerun, one
  file retrieved four times through two channels, cleanup, and a closing digression about a file it had not created.
- **Neither sweep was ever put back.** No `SendMessage` in either trace was addressed to a sweep.

So the 11× decomposes into a subject that genuinely moved earlier plus harness friction, and neither is addressed by
which agent the sweep goes to. A sweeper agent had already been declined once for portability — the sweep's target stays
whatever the host offers — which is a second and independent reason the change should not be made.

### Hand-offs

- **The effort sweep on the reading-heavy writers.** Live, per D15. Roughly four runs and $160, with its own approval.
- **The fixture's run-to-run spread.** Unmeasured, and it is what stops any single pair of runs from stating a saving.
  Roughly three runs and $110.
- **The writer's upkeep of its own output document.** Out of scope above, and worth ranking properly once spread is
  known.
- **The writer re-establishing a sweep's facts.** A hunch, one tool call of evidence.
- **Whether fork discovery can move into the interview.** The deeper finding, and a design question rather than work.
- **The working analysis document at the repository root.** Its figures are carried above and its method is not; it was
  untracked, so disposing of it leaves no diff and belongs to whoever holds it rather than to a ticket, per D18.

### The run that settled the mechanism

One run of `e2e-tests/tests/refine-happy-path.test.ts` against this branch on 2026-09-10, once the four prose slices had
landed, with the **ceiling**s raised locally and uncommitted to 150m/$50. It passed every mechanical assertion and its
**verifier** — which found all 51 **user stories** met by at least one of the six **ticket**s — no ceiling reached, one
attempt. Three **dispatch**es: the **sweep**, the **spec-writer**, the tickets writer.

**One put-back carried several closures, which is the whole of what D1 bet on.** The spec-writer reported two **fork**s,
and the **orchestrator** answered both in a single put-back — *"Human closed both forks; put spec back"*, opening *"Both
forks are closed by the human, and the two side questions with them."* Against the measured NEW run's four primings of
one fork each, that is the batched shape, and the writer was resumed once rather than once per fork. The run's only
other `SendMessage` went to the sweep, asking after a **report** that had not arrived — the case *Testing Decisions*
above names as why a put-back count is no sound assertion, turning up on the first run after the rule shipped.

**The figures, and what they are not.** Same **fixture**, same **harness**, one run:

| | NEW (`cb0f8fd`) | this branch |
|---|---:|---:|
| wall clock | 97m 56s | **69m 42s** |
| the run, **responder** included | $36.65 | **$16.16** |
| the **verdict**, out of band | $0.59 | $0.63 |
| the observation, out of band | $2.44 | $2.00 |
| model turns | 275 | 152 |
| output tokens | 254,749 | 160,966 |
| cache write | 1,421,680 | 656,809 |
| cache read | 30,559,654 | **9,286,451** |
| **ticket**s published | 5 | 6 |
| **user stories** | 53 | 51 |
| question rounds / questions | 10 / 22 | 10 / 30 |

And the one stage this epic aimed at:

| | NEW (`cb0f8fd`) | this branch |
|---|---:|---:|
| spec-writer turns | 168 | **55** |
| peak context | 243,036 | **130,711** |
| cache read | 23.15M | **4.15M** |
| share of the run's cache read | 76% | 45% |

The per-stage modelled dollar of the table above is not extended here: its derivation is not among what D18 kept, so
there is no figure to carry on honestly.

**None of that is a measured saving.** Run-to-run spread on this fixture has still never been measured — the hand-off
named above — so the distance between $36.65 and $16.16 cannot be separated from it, and one run each side states a
direction at best. Two things qualify this run in particular: the measured pair ran in parallel on one machine and this
one ran alone, which flatters its wall clock; and its reading raised two forks where the measured run raised four, so
part of the gap is a brief that collided less rather than a rule that batched more.

**The provider, and what a dollar figure here is.** This run was served through the same internal proxy to **Amazon
Bedrock** as the two runs above — the **trace**'s own request ids say so — which is what makes the comparison a
same-provider ratio rather than the far weaker cross-provider kind. The provider comes from the shell a run is started
in and not from the **environment file**: the harness layers that file above the inherited environment, and a commented
line overrides nothing. Every dollar figure is the host's own estimate at first-party rates while the calls bill through
a partner-operated provider, so it supports that ratio and never a bill.

### Nothing from an observed repository appears here

Every figure above came from the plugin's own **trace**s and the runs' **session record**s, distilled with no model and
no money. The **fixture** those runs drove is a committed test fixture in this repository. The traces themselves are
marked never to be forwarded and are not cited by path, which is why the figures they support are written out here
rather than referenced.
