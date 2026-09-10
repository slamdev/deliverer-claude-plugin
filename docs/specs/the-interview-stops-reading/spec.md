# The interview stops reading the repository

Status: ready-for-agent

## Problem Statement

A human refined one **idea** with `/deliverer:refine`. The **run** worked: it grilled the idea, wrote the **brief**,
published a **spec** and eight **ticket**s, and handed the **epic** over. The idea was a basic one. The run's **spend**
was **$31.40** — 146 requests and 25.9M tokens over 4h15m, every one of them on `claude-opus-5` at effort `high`,
priced at Anthropic first-party rates although the run in fact billed through Amazon Bedrock, which is priced
separately.

**And the run was wrong.** Of 82 claims about code it asserted as fact, eleven are false: four put a real symbol at a
line it does not sit at, and seven describe behaviour that is not there. None is a fabrication — every symbol exists.
They reached the published **spec** and three of the **ticket**s, where they read as verified prior art an implementer
is told to extend. That is the more serious half of this problem: the **spend** is recoverable, and a ticket that says
"this is already tested" when it is not costs a test nobody writes.

**Nothing about that figure is a function of how simple the idea was.** Output is **13%** of it. Cache write is 49%
and cache read 37%: the run spent its money re-reading a large context, once per turn, 146 times. Spend here is turns
multiplied by the context dragged through them, and neither term is set by the idea.

**The largest single block is the interview doing a **writer**'s job.** Forty-seven of the **orchestrator**'s 62 shell
calls — 76% of them — fired before the first **dispatch**, tracing one feature end to end through the code: schemas to
model to converter to service to scheduler, six forge calls into a second repository, a runbook, a feature-flag hunt.
All of it inside the interview's own context, which reached **308K tokens**. `spec-writer` was then dispatched and told
to read the repository first-hand, and did the same work again from an empty context. Fifteen files were read **three
times, once per agent**. That pre-dispatch block carries more spend than either **writer**.

**The skill already says this should not happen, twice, and it happened anyway.** `refine/SKILL.md` carries a Sweeps
section — what a **sweep** holds back, what it releases, what it reopens — and stage 1 points at it. The interview
skill it delegates to says in its own words that finding facts is the agent's job and that a question of fact goes out
to be settled elsewhere. The run dispatched **zero** sweeps.

Reading the section closely says why. All four of its bullets govern a sweep **already in flight**. Not one of them
says when to send one out. The trigger is the missing piece, and the orchestrator has no rule telling it that following
a thread through a repository is not the interview's work.

**Two of the three drivers first suspected are not real, and the spec records that so nobody re-attacks them.** The
**writer**s are not exploring without discipline: they already compound 69–97% of their shell calls and already issue
two in one turn about half the time, so 184 shell calls are only **124 model turns**, with exactly one literal
duplicate command among them. And their exhaustive reading is instructed rather than drifting — `refine/SKILL.md`
carries paths rather than contents deliberately, so that a writer opens the document itself and meets the repository
first-hand. That contract is load-bearing and stays.

**The evidence came from the raw **session record**s, not from the plugin's own account of the run.** The **debrief**
for this run covered 5 of its 146 requests and its **trace** stopped 36 minutes before the first dispatch. Both are
separate **defect**s with their own diagnosis, and neither is this change. What the gap cost is recorded below under
*Where the spend actually sat*: with no instrument to hand, the run analysed itself, in its own context, for $5.29.

## Solution

Fact-finding leaves the interview.

**The orchestrator settles mechanical questions and nothing more.** A question about the tree, the forge or the web
whose answer is true or false rather than good or bad — does this symbol exist, what does this file say, is this
published — is settled inline in one look. Following a thread is not: it goes out to a **sweep**. This is not a new
contract. ADR 0015 already states it for the orchestrator generally; `refine/SKILL.md` is where it was never written
down.

**The Sweeps section gains the trigger it is missing**, stated as a condition the orchestrator tests rather than a
permission it may decline, together with what a sweep carries out and what it must report back. Several sweeps may be
in flight at once, one subject each, so moving the reading out need not buy spend with wall clock — and where a host
makes the interview wait for one regardless, the sweep still goes out, because the reading is what costs and the waiting
is not.

**And the skill's own opening stops contradicting the rule.** Two sentences in the first three paragraphs say the
interview dispatches nothing: "Stage 1 is yours and nobody else's", read against "Every stage after it is one agent
dispatch", and an enumeration of the orchestrator's own work that ends at the two **writer**s. A rule added further down
the file loses to them — which is the likeliest reason the interview skill's own **imperative** to dispatch a sub-agent
for a fact produced no **sweep** at all. Both are narrowed, and the narrowed ownership sentence carries its own limit in
the same breath: the conversation and the decisions are the orchestrator's and never an agent's, and what goes out is
fact-finding rather than the interview.

**Each writer's exploration gains the done-bar it is missing.** Step 2 of `spec-writer` and of `tickets-writer` is the
only **exploration** step in either document that states no completion condition, and it is the step that ran longest.
The bar is coverage-shaped, matching how their neighbouring steps already close.

*(Amended 2026-09-09. This read "the only step in either document", which is false: step 1 of each writer and the
report step state none either. The reading step is self-limiting — "read it in full" is its own bar — so the claim is
true of exploration steps and of nothing wider. It is recorded rather than quietly fixed because it is an instance of
exactly what this change exists to prevent: a claim asserted from a plausible reading rather than from a check.)*

**And the README stops calling the new shape a fault.** It makes stages dispatched one at a time a requirement, names
*stages running over each other* as the symptom of a host setting left wrong, and prices an observation off a
**dispatch** count measured when a refinement made three or four. After this change a user watches several sweeps run
inside the interview and pays to have each one graded, so the document they check first is the document that has to say
so.

And the words are pinned down: **mechanical** is bolded three times in `build/SKILL.md` and stated in ADR 0015 without
ever being defined, so it enters the glossary; and ADR 0015's "read-only" is amended to say what it is read-only over,
since a refining orchestrator authors the brief and the glossary entries and ADRs a refinement lands.

**And "already tested" is a claim that needs a read.** Three of the wrong-shape claims assert coverage a test file does
not have, inferred from its name and never checked against its body. The bar is that a **claim** about what an existing
test covers is settled by reading the test, or it is not made.

**That is one of the eleven wrong claims' two causes and not both.** The other — a `spec-writer` **dispatched twice**,
nineteen minutes apart, with the working tree on a different ref each time, so one context held two incompatible views
of the code and nothing in the output recorded which ref anything was read at — was scoped into this change and then
scoped back out of it. The evidence for it stays recorded below under *What the run got wrong*; the reasons it is not
fixed here are in Out of Scope, and the fix is a **hand-off**.

**So three of the eleven are closed here and eight are not**, and the arithmetic is written out because a spec that
fixes three of eleven must not read as one that fixes eleven. Four are the wrong-location claims the withdrawn decisions
would have caught. The other four are wrong-shape claims that answer to neither cause — a class described three times as
something it is not, and its like — and **nothing in this change or in the version of it that carried those decisions
would have caught those**: they were never in scope, and the bars here sit where a **claim** is made rather than over
every claim made.

## User Stories

1. As a human refining an idea, I want a basic idea to cost roughly what a basic idea is worth, so that the price of a
   refinement tracks the work rather than the machinery.
2. As a human refining an idea, I want the interview's fact-finding to happen somewhere other than the interview, so
   that every later question is not re-read over the facts every earlier one gathered.
3. As a human refining an idea, I want the interview to stay responsive while facts are being found, so that thrift
   does not buy itself with my waiting.
4. As a human refining an idea, I want several facts found at once when several are owed, so that a long interview does
   not serialise into a longer one.
5. As a human refining an idea, I want the same answers I would have got, so that a cheaper run is not a worse one.
6. As a refining orchestrator, I want a stated test for what I settle myself, so that the boundary is a check rather
   than a judgement I make afresh each turn.
7. As a refining orchestrator, I want that test to read the same as the one the delivering orchestrator already has, so
   that one rule does not have two wordings.
8. As a refining orchestrator, I want the test to cover the forge and the web as well as the tree, so that a thread
   followed through a second repository is not exempt from a rule aimed at threads.
9. As a refining orchestrator, I want the rule to bind for the whole run, so that it does not switch off between stages
   and leave me deciding when it applies.
10. As a refining orchestrator, I want the rule not to forbid writing the brief, the glossary entries and the ADRs my
    stages exist to produce, so that a limit on reading does not silently delete a stage.
11. As a refining orchestrator, I want to be told when to dispatch a sweep, so that a section describing how one behaves
    is one I can actually act on.
12. As a refining orchestrator, I want that trigger stated as a condition rather than a permission, so that the cheap
    path is the one the rule names rather than the one I have to choose.
13. As a refining orchestrator, I want to know what a sweep carries out and what it must report back, so that I can
    construct the dispatch without inventing its shape while a human waits.
14. As a refining orchestrator, I want to keep more than one sweep in flight, so that two independent questions of fact
    do not queue behind each other.
15. As a refining orchestrator, I want the target agent left unnamed, so that the rule holds on a host whose agents are
    named differently from the one it was written on.
16. As a **spec writer**, I want a stated bar for when exploration is done, so that the one **exploration** step in my
    instructions without a completion condition stops being the one that runs longest.
17. As a spec writer, I want that bar keyed to the paths the **brief** already names and the ADRs that touch the area,
    so that what ends my exploring is a set I was handed rather than one I define as I go.
18. As a spec writer, I want to keep meeting the repository first-hand, so that the bar bounds my reading without
    weakening what makes my reading worth anything.
19. As a **tickets writer**, I want a bar keyed to the modules the **spec**'s implementation decisions name, so that it
    is stated in terms of the inputs I actually hold — a spec carrying no paths for me to key to.
20. As either **writer**, I want my bar to keep reading a module it did not name, so that the floor it sets does not
    become a ceiling.
21. As a contributor, I want **mechanical** in the glossary, so that a word two skills and an ADR already lean on is
    defined once rather than re-explained per file.
22. As a contributor, I want ADR 0015 to say what "read-only" is read-only over, so that the next reader does not take
    it to forbid the brief.
23. As a contributor, I want the decision this change supersedes named, so that a settled decision is seen to be
    revisited rather than quietly contradicted.
24. As a contributor, I want the two drivers that turned out not to be real recorded, so that nobody spends a session
    re-attacking batching or writer discipline.
25. As a contributor, I want a documented way to tally a run's turns and peak context, so that the next change to this
    machinery has an instrument rather than an argument.
26. As a contributor, I want the instrument keyed to what the plugin controls, so that a comparison is not swamped by
    the provider, the repository or the size of the idea.
27. As a contributor, I want the register and wrapping of each file preserved, so that the change reads as though it
    was always there.
28. As a plugin maintainer, I want the model and effort tiers left alone in this change, so that a spend reduction and a
    quality trade are never landed as one indistinguishable move.
29. As a human refining an idea, I want the claims in my **spec** and **ticket**s to be true, so that a cheaper run is
    not one that hands an implementer work built on things that are not there.
30. As a **spec writer**, I want a stated bar for asserting what an existing test covers, so that a class name is not
    mistaken for coverage.
31. As a **tickets writer**, I want the coverage claims I inherit to carry their evidence, so that an acceptance
    criterion never tells an implementer to extend a test that is not there.
32. As a contributor, I want the eleven wrong claims and their two causes recorded, so that the next reader can check
    whether this change would have caught them.
33. As a human refining an idea, I want fact-finding sent out even where my host makes the interview wait for it, so
    that the saving is not abandoned wherever it costs a little patience.
34. As a **spec writer**, I want my exploration bar to bound my reading rather than restate a later step's bar, so that
    two steps do not close on the same thing.
35. As a **tickets writer**, I want a bar that ends its own step rather than my reading, so that a later step that has
    to open a test can still open it.
36. As a contributor, I want the word that names a rote change to keep a word of its own, so that defining one term does
    not quietly empty another definition.
37. As a contributor, I want what the observation itself cost reported beside the run's, so that **spend** moved out of
    band is not read as spend removed.
38. As a contributor, I want the before-and-after taken and written down rather than intended, so that the bet this
    change makes is settled by evidence rather than left to expire.
39. As a contributor, I want the tally's per-agent figures actually attributed to agents, so that the one number that
    says whether the interview's context shrank is readable.
40. As a refining orchestrator, I want the paragraphs that open my instructions not to forbid the fact-finding a later
    rule requires, so that the cheap path is not overruled by the page before it.
41. As a refining orchestrator, I want the limit on what I hand out to name the interview itself, so that a permission
    to send facts out is never read as licence to send the conversation out.
42. As a human running a refinement, I want to be told that several agents working inside my interview are expected, so
    that I do not go looking for a host setting that is already right.
43. As a human running a refinement, I want to be told that what an observation costs follows a **dispatch** count that
    now includes fact-finding, so that the figure I was given still says something true.
44. As a **spec writer**, I want the paths a **sweep** looked at recorded in the **brief**, so that my own reading floor
    does not shrink by exactly as much as the interview's reading did.
45. As a contributor, I want the number of sweeps a run sent out reported beside the before-and-after figures, so that
    the one thing this change bets on is measured rather than inferred from the figures around it.
46. As a contributor, I want it written down that the **observer** does not recognise a sweep as the **run**'s own, so
    that the instrument this change is judged by is read knowing what it cannot see.

## Implementation Decisions

### Modules touched

- **The refinement skill** (`plugin/skills/refine/SKILL.md`) — the mechanical rule, the sweep trigger and contract,
  sweep concurrency and subject width, and the fallback where no sweep can be dispatched. **Two of its opening
  sentences** are narrowed, per D5a, and the brief's artifact list carries the paths a sweep named, per D9a.
- **The delivery skill** (`plugin/skills/build/SKILL.md`) — the shared test clause gains the web, per D3. **Its edges
  are not touched**, per D13.
- **The spec writer and tickets writer** (`plugin/agents/spec-writer.md`, `plugin/agents/tickets-writer.md`) — a
  done-bar on step 2 each, and the bar on asserting test coverage. **Nothing else in either file**, per D26 — no
  batching line, and nothing about a ref.
- **The glossary** (`CONTEXT.md`) — a **Mechanical** entry; the **Orchestrator** entry qualified; the word dropped from
  **Wide refactor**.
- **The ADR on the orchestrator's moves** (`docs/adrs/0015-the-orchestrator-forms-no-judgement.md`) — amended.
- **The contribution guide** (`CONTRIBUTING.md`) — the tally, as its own subsection, and its own use of the word the
  glossary is about to define, per D12.
- **The user-facing README** (`README.md`) — what a user now sees inside an interview, and what it adds to an
  observation, per D25.
- **This spec** (`docs/specs/the-interview-stops-reading/spec.md`) — a dated results section holding the
  before-and-after figures, written by the last slice rather than by an implementer, per D17a.

### What the orchestrator settles for itself

- **D1. A mechanical question is the orchestrator's; a thread is a sweep's.** A mechanical question answers true or
  false in a single look. Following a thread — a search whose results are read to decide what to search next — is not
  one, however cheap any individual step of it is. The rejected alternative was a call-count threshold: a number in
  prose is advisory, and the run that produced this spec issued single calls that each carried six subcommands, so any
  count would have measured the wrong thing.
- **D2. The rule binds for the whole run, and one clause is shared verbatim.** A rule that applies only to stage 1 is
  one more condition to evaluate, and the reading stage 3 does — checking what a writer reported — is mechanical under
  D1 and so already permitted. **What "one wording per shared rule" binds here is the bolded test clause and nothing
  else.** The delivery skill's sentence continues into examples about a branch and a change request, and closes on
  edges — "read only", "never fix" — that D4 rules out for a refining orchestrator. Told to copy it whole, an
  implementer either writes refinement text naming machinery refinement has not got, or diverges and calls the bar met.
  So: the test clause is identical in both skills; the examples and the edges are each skill's own.

  *(Amended 2026-09-09. This called the rule shared while leaving the load-bearing half of D1 — a question that answers
  **in a single look**, and a thread that is not one — in the refinement skill alone. What `build/SKILL.md` bolds is a
  noun phrase naming the sources, so copying it verbatim shares the label and not the test. **The test goes into D12's
  glossary entry**, which is the one document a reader of either skill meets, and the delivery skill keeps its own
  sentence: a prohibition needs an outlet, and a delivering orchestrator has none — it dispatches only this plugin's own
  named agents, one at a time, and its edges are read-only and never-fix, so a thread it may not follow would have
  nowhere to go. `CONTEXT.md` does not ship, so the two skills' shipped prose still differs — deliberately, and for that
  reason.)*
- **D3. The rule reaches the tree, the forge and the web alike, in every place it is stated.** One test, applied to any
  source. The observed run's thread-following included two code searches and a change-request read on a second
  repository, and a fetched specification; where the bytes came from does not change whether the interview should be
  the thing reading them. **Because D2 makes the clause shared, the web reaches all four statements of it** — the
  delivery skill, ADR 0015, the glossary entry and the refinement skill — or the shared clause is not shared. That
  widens what a delivering orchestrator may settle, which is inert in practice: delivery reads a branch and a change
  request. The delivery skill's own edges are **not** touched by it — see D13.

  **ADR 0015's next sentence counts the sources, so it is rewritten rather than left standing.** It reads "The two are
  one exception and not two: whether a check is green is as mechanical as whether the tree builds, and reading it is the
  same move as reading the branch" — true of two sources, false of three, and its argument has no web half. The
  amendment keeps the argument and drops the count: whether a check is green, or whether a published document says what
  a report claims it says, is as mechanical as whether the tree builds.

  *(Amended 2026-09-09. This decision named the four statements of the clause and nothing of the prose around them,
  which is a claim about the ADR read off the clause alone — the sentence under it counts the sources and goes false on
  the edit. Recorded rather than quietly fixed because it is an instance of exactly what this change exists to
  prevent.)*
- **D4. The read-only edge does not transfer.** `build/SKILL.md` pairs its mechanical limit with "read only" and "never
  fix", which fits an orchestrator that writes nothing. A refining orchestrator writes the brief, and stage 1 runs the
  domain-modeling skill precisely so terms and decisions land in the project's glossary and ADRs as they crystallise.
  The refinement skill takes the mechanical/judgement distinction and states its own edges. **Get this wrong and the
  rule deletes stage 2.**

### The sweep trigger

- **D5. The Sweeps section gains the trigger it lacks, stated as a condition.** All four existing bullets govern a
  sweep already in flight. The new one governs sending it: a question of fact the interview cannot settle with one
  mechanical look goes out. Stated as a condition the orchestrator tests rather than a permission it may decline.

  *(Amended 2026-09-09. This closed on "two existing instructions phrased as permissions produced zero sweeps", which is
  false of the one that matters: the interview skill this stage runs says, in the imperative, "When a frontier question
  needs a fact from the environment … dispatch a sub-agent to find it; don't ask the user for anything you could look up
  yourself". It was already an instruction, and it still produced nothing — so softness is not the diagnosis and D5a is.
  The condition stays, because a condition is the right shape for a rule the orchestrator tests, and not because a
  permission was the defect. Recorded rather than quietly fixed: it is a claim about another file's register, asserted
  from what a failed run seemed to imply rather than from reading it.)*
- **D5a. The two sentences telling the interview to dispatch nothing are narrowed, and the limit rides with them.**
  `refine/SKILL.md` opens on "**Stage 1 is yours and nobody else's**" immediately beside "Every stage after it is one
  agent dispatch", and ends its third paragraph on "Yours is the work no agent does: grill the idea, write the brief,
  dispatch the two writers in order …". Between them they say the interview dispatches nothing and that the two
  **writer**s are the whole of what this run sends out. Both sit pages above the Sweeps section, and **a rule that
  contradicts the page above it loses** — which is the mechanism behind the risk D5 is written against, and the evidence
  for it is that an imperative to sweep already existed upstream and fired nothing. The enumeration gains the sweeps
  rather than being left to imply a closed list.

  **The narrowed ownership sentence states its own exclusion, in one sentence with the permission.** What stage 1 owns
  is the conversation and the decisions — never an agent's — and what goes out is fact-finding, never the interview.
  Split across two sentences or two sections, the permission is one inference from dispatching an agent to conduct the
  grilling, which is a worse failure than the one this epic exists to fix: the human is in the room for exactly one
  stage, an agent cannot be in it, and the brief is all that survives of it. **Get this wrong and the change deletes the
  stage it was written to make cheaper**, which is D4's failure one stage over.
- **D6. The sweep's contract is stated and its target is not named.** The contract says what a sweep is handed — the
  subject it exists to close — and what it must report back: the facts and where they were found, never a view on the
  design. The agent is deliberately left unnamed, because the plugin ships no sweeper and a host's generic agents are
  the host's to name. Every other dispatch this plugin makes is fully specified, and a sweep is the only one that will
  not be; the contract is what stops that gap leaving the orchestrator inventing a dispatch mid-interview.
- **D6a. The subject names the question of fact, not the next file to open.** A sweep is expected to follow the thread
  itself, however many looks that takes, and to come back when the subject is closed. **Without this the change
  relocates the spend rather than removing it**: the waste measured here was a chain — schemas to model to converter to
  service to scheduler — where each answer decides the next question, so a subject scoped to one link produces
  interview, sweep, new question, sweep, each round trip re-reading overlapping files from a cold context while a human
  waits. D7's concurrency does not help, because a chain has nothing to run beside.
- **D6b. Where no sweep can be dispatched, the interview says so and reads inline.** D5 states the trigger as a
  condition rather than a permission, and D15 ships no sweeper while D6 names no agent — so on a host offering no
  general-purpose agent the orchestrator would be forbidden from following the thread and have nowhere to send it. The
  rejected alternative was the missing-skill precedent, report and stop: that turns a spend reduction into a hard
  dependency on host configuration and strands a user who cannot fix it. Degrading honestly is better than refusing,
  and the fact rides into the run's **report** as a **hand-off** — the interview's only channel to the human is the
  question tool, and a decision prompt is the worst place to put machinery a human cannot act on.
- **D6c. A sweep still goes out where the interview has to wait on it.** D7 wants several in flight and the section
  already says a dispatch never holds up the interview, but neither is something this prose can make true: D11 of
  `docs/specs/orchestrator-contracts/spec.md` holds that the wording states what must be true and never the mechanism
  that makes it so, so the skill cannot name a way to dispatch without waiting. On a host where a dispatch blocks, the
  interview serialises — send, wait, ask, send, wait. **That is not D6b's case and must not be given D6b's answer**:
  the reading is what costs, because it lands in a context every later turn re-reads, while the waiting costs only time.
  So the sweep goes out either way, and reading inline stays the answer to the one case it was written for — nowhere to
  send it at all. The wall-clock exposure is recorded rather than resolved: see Further Notes.

  **The section's own opening sentence is narrowed to what it always meant.** "Dispatching a **sweep** never holds up
  the interview" was written when nothing ever went out, and what it holds is that the questions a sweep does not touch
  keep moving — which is exactly what the four bullets under it govern. Left verbatim beside this decision, a reader
  meets it and "send it even where you will wait for it" a few lines apart with nothing on the page to reconcile them.
  So it says the narrower thing, and this decision owns the clock openly.

  **This revisits the premise of D14 of `docs/specs/one-dispatch-at-a-time/spec.md`**, which left the refinement skill
  untouched on the grounds that "its sweeps stay non-blocking — a sweep that blocked would stall the interview it exists
  to keep moving". That decision's deliverable stands untouched: it only ever edited the delivery skill, and one
  dispatch at a time still binds there. What changes is the reasoning — on a host where a dispatch blocks, a sweep does
  stall the interview, and it goes out anyway. Named here because a settled decision is reopened explicitly in this
  repository or not at all.
- **D7. Several sweeps may be in flight, one subject each.** The section's existing mechanics are already written
  per-subject — a question waits on the subject it turns on, a landed sweep releases that subject and no other — so
  concurrency needs no new rules, only saying that it is allowed. It is also what stops this change buying spend with
  wall clock: an interview that serialises its sweeps waits longer than one that read inline.
- **D8. This supersedes D6 of `docs/specs/orchestrator-contracts/spec.md`.** That decision gave the refinement skill
  "the sweep-and-frontier interaction and nothing else", leaving when-to-sweep with the interview skills. The grounds
  for narrowing it are the grounds that epic itself accepted when it declined an upstream fix: the gap is genuinely in
  the interview skill's own text, and the local fix is needed regardless because this skill cannot ship a dependency on
  an unmerged third-party change. What that epic did not have is the evidence here — a run that made zero sweeps. This
  is the second local fix for the same upstream gap, and the upstream fix stays a hand-off.

### The writers

- **D9. Step 2 of each writer gains a done-bar, keyed on reading alone and on inputs the step cannot move.** For the
  spec writer: every path the **brief** names has been opened, along with the ADRs that touch the area, and any module
  the work turns out to reach beyond them. For the tickets writer: every module the **spec**'s implementation decisions
  name has been read well enough to size a ticket against it, and any the slices turn out to cut through beyond them.
  Both match the shape their neighbouring steps already use, and neither carries a number.

  **A bar ends its step and not the writer's reading**, said once in each file. Both writers have later steps that open
  a file — D23's bar on a coverage claim is one, and it lands in a step after this one — so a bar read as closing the
  repository for the rest of the run would set the two against each other on the page.

  *(Amended 2026-09-09. The tickets writer's bar read "every user story the spec lists has a slice it could sit in",
  which duplicates step 3's own bar — "every user story the spec lists is covered by at least one slice" — two steps
  earlier. That would have ended step 2 by naming slices, which is step 3's work, and left a reader meeting two
  near-identical bars unable to tell which binds. Step 3 keeps sole ownership of coverage: nothing downstream measures
  the set against the user stories, so it is the only coverage guarantee in the pipeline.)*

  *(Amended 2026-09-09, again, and for the same defect one writer over. The spec writer's bar read "every **claim** the
  brief marks has a path to settle it, and every module the spec will touch has been read". The first half is true
  before the step begins: `refine/SKILL.md` requires the brief to carry every claim "each with the path that would
  settle it", and this writer's step 3 opens "Settle every claim the brief marks, **down the path it names beside each
  one**" — so the writer holds those paths on arrival and the clause bounds no reading, while also standing two steps
  from step 3's own claims bar. Step 3 keeps sole ownership of claims exactly as step 3 of the tickets writer keeps
  coverage, and both bars now read alike. It is recorded rather than quietly fixed because it is the same failure the
  note above records: a bar asserted from a plausible reading of a file rather than from a check of it.)*

  *(Amended 2026-09-09, a third time, and on the keying rather than the wording. Both bars read "every module the spec
  **will touch**" and "every module the slices **will cut through**" — sets the writer itself defines as it goes, so
  each bar was graded by the only party it bounds, and could be called met at any point in either direction. They now
  key to what the step is handed: the brief is already required to carry the artifacts the session touched **by path**,
  and a spec's implementation decisions are already required to name "the modules that will be built or modified" —
  while a spec carries no paths at all, by a standing rule of its own template, so a path-shaped bar was never available
  one writer over. **The open clause is what stops the floor becoming a ceiling**: a module the work reaches beyond the
  list is still read. The tickets writer's clause about the user-story list goes with it, being keyed to the one list
  step 3 already measures coverage against.)*
- **D9a. The brief's artifact list carries the paths a sweep named.** D9's floor for the spec writer is the brief's list
  of "the artifacts the session landed or touched … by path", and **this change shrinks that list by construction**: the
  interview stops opening the code, so what it touched is less, and the writer's floor would fall by exactly what the
  **sweep**s took over. Nothing new has to be found for it — a sweep's contract already reports where its facts were
  found, and what it settled already rides in the **grounds** beside the decision it settled, where the contract
  requires whoever holds the file to be able to find the thing cited. The orchestrator holds those paths already.

  **It is where the looking happened and never what the looking found.** The brief's own prohibition — no section of
  established facts, however that section is headed — is what makes a **claim** get checked by a writer rather than
  trusted, and a list of paths sits close enough to it that the difference is stated rather than left to a reader. It is
  the one clause of that prohibition this change touches, and it extends it rather than softening it.
- **D10. The bars bound the reading and not the first-hand contract.** A done-bar says when exploring stops, never that
  the writer may take something on trust. Paths rather than contents stands untouched — see D13.

### Across the plugin

- **D11. Withdrawn.** This held that one identical parallel-lookup line went into six of the seven agents — independent
  lookups out together in one turn — with `code-reviewer` excluded for reading nothing. **No agent gains it**, and the
  grounds are in D26. The number is kept rather than reused so that a reader arriving from a document that cited it
  finds the withdrawal rather than a different decision.
- **D12. `mechanical` enters the glossary.** It is bolded three times in `build/SKILL.md` — and used a fourth time there
  unbolded, in "not a mechanical fact, so not yours" — stated in ADR 0015, and defined nowhere. A question about the
  tree, the forge or the web whose answer is true or false rather than good or bad — **and the fact that answers one**,
  since `build/SKILL.md` bolds "the **mechanical** facts you settled" as well as the question. All four uses in that
  file modify a question or a fact and none needs rewording. It goes in the glossary's *The run* section beside
  **Orchestrator**, whose behaviour it describes.

  **The entry carries D1's test and not only its label**, per D2's amendment: answerable **in a single look**, and a
  thread — a search whose results are read to decide what to search next — is not one, however cheap each step of it
  looks. The glossary is the one document a reader of either skill meets, and ADR 0015 uses the term rather than
  restating it, so the test reaches the record without a second wording to keep in step.

  **The word carries a second sense in bolded prose, and that sense keeps its meaning under another word.**
  `CONTEXT.md`'s **Wide refactor** entry reads "one mechanical change", and `tickets-writer.md` says the same thing in
  the same words — both meaning rote or automatable, which is not this definition. Bold marks a glossary term here, so
  one word cannot carry both. `tickets-writer.md` takes the same word the entry takes and keeps its examples, which
  already carry the sense it was doing. **The glossary entry has no examples, so dropping the word alone would leave
  nothing carrying it**: that entry says "one **rote** change — rename a column, retype a shared symbol — whose blast
  radius …", taking the examples from the agent file, and the agent file says *rote* too, so the two places finally read
  alike. **Dropping the word from one side and adding a different one to the other would leave them not matching**,
  which is the whole thing this half of the decision is for.

  **A third use is the glossary's own, and the contribution guide's.** `CONTEXT.md`'s **Verifier** entry closes on "What
  a test can assert **mechanically** is never its business", and `CONTRIBUTING.md` uses the word the same way — meaning
  *by a test rather than by a reader*, which is neither this definition nor the rote one. A glossary that defines a word
  on one line and uses it otherwise a few hundred lines later is the sharpest instance of what this change exists to
  prevent, so both say what they mean instead. The `end-to-end-tests` spec and this epic's own tickets use it that way
  too and are left alone: `docs/specs/` records what was decided when, and editing a landed spec's wording to protect a
  term costs more than the word surviving in it.

  **The rote sense also lives in the Node code's comments, roughly twenty times, and stays there.** "the observer's
  mechanical half", "a mechanical bound costs a **defect** the **grounds** it stands on", "the ONE invisible failure
  this design can mechanically detect". None is bold and none is prose a model reads as instruction, so the rule that
  bold marks a term is not broken and no comment is touched. Rewording them would put a large diff in the one package CI
  checks for no change in behaviour.

  *(Amended 2026-09-09. This decision said the second sense sat in exactly two places and that the examples beside the
  word already carried it. Both halves were read off `tickets-writer.md` and asserted of the glossary and the product:
  the glossary entry carries no examples at all, and the Node comments carry the sense about twenty times. Recorded
  rather than quietly fixed for the same reason as the notes above.)*

  *(Amended again, 2026-09-09, and the inventory was still short. A **third** sense — asserted by a test rather than by
  a reader — sits in `CONTEXT.md`'s own **Verifier** entry and in `CONTRIBUTING.md`, and the fix above was also going to
  leave the two rote uses saying different words. Twice now this decision has claimed to have counted a word's uses
  without counting them, which is the failure the epic is named for, in the decision that defines the word.)*
- **D13. ADR 0015 is amended, not replaced — and so is the glossary's own entry.** The ADR states that the orchestrator
  "is read-only" without saying what over. The amendment says: read-only over the code being delivered into, while the
  epic's own documents — the brief, and the glossary entries and ADRs a refinement lands — are the orchestrator's to
  write. This follows the precedent of amending 0015 rather than adding beside it. **No new ADR**: the bar is hard to
  reverse, surprising without context **and** a real trade-off, and the refinement skill's local rule scores only on
  the last two, since deleting a paragraph reverses it.

  **`CONTEXT.md`'s `Orchestrator` entry carries the same unqualified "Read-only" and gets the same object.** The
  glossary is the layer every other document cites; fixing the ADR and leaving the glossary would close D4's "single
  most dangerous misreading" one level up from where a reader meets it.

  **And the delivery skill's edges are explicitly not touched.** `build/SKILL.md`'s "read only" and "never fix" are
  correct unqualified, because a delivering orchestrator writes nothing — everything goes through an agent. One slice
  edits that file for D3's web **and** amends the ADR's read-only, so an implementer holds both in one context and is
  one inference from mirroring the qualification across. That would tell a delivering orchestrator it may write the
  epic's documents, and "put a stage back rather than fix it" depends on it not being able to. The negative check is a
  criterion on the slice.

### Bounds on the change

- **D14. Model and effort are untouched, everywhere.** Every agent stays as it is. The spend reduction and any quality
  trade are kept separable, so the measurement in D16 attributes cleanly. Reopening effort on the reading-heavy writers
  is a hand-off, live only if the measurement disappoints.
- **D15. No sweeper agent ships.** Adding one would name the target and let its tier be set, and it was declined for
  portability: the sweep's target stays whatever the host offers. The trigger and contract in D5 and D6 are what carry
  the weight instead, and **the risk is recorded rather than resolved** — see Further Notes.
- **D16. Verification is turns and peak context per agent, with the spend alongside.** Those are what the plugin
  controls; a dollar figure moves with the provider, the repository and the size of the idea. The spend is reported
  labelled with the provider that served it, as the glossary requires. The instrument is a documented command in
  `CONTRIBUTING.md`, in a **`Tallying a run` subsection straight after `Replaying a run's records`** — it takes the
  same input and the same entry point, and it opens by saying plainly that it measures and gates nothing, so nobody
  reads it as a check. Not a script, since nothing outside `plugin/` ships and CI checks neither.

  **It reads the trace the observer already writes, rather than the records underneath it.**
  `plugin/mcp/observer/distil.ts` runs by hand with no model and no money and writes the run's **trace**, and that file
  already carries every figure this tally wants but one. Its token section holds a row per **dispatch** labelled
  `#<ordinal> <agent>`, reading `N req · in … out … cache-write … cache-read …` — model turns and tokens by kind, per
  agent, already deduplicated by `records.ts` and already attributed to the agent that ran. Its ordered section prefixes
  every line of a dispatch's slice with `#n` and states each turn's own figures once, on that turn's first line.

  **So the only arithmetic left is the peak**: the largest `in + cache-write + cache-read` among a slice's turn lines.
  It needs no dedup — the placeholder problem affects `output_tokens` alone, and every record of one response repeats
  the same input and cache figures — and it needs no second statement of the dedup rule either, because the figures it
  reads have already had `records.ts`'s rule applied to them.

  *(Amended 2026-09-09. This prescribed `jq` over the raw records for the peak, plus a second step reading each
  `agent-<id>.meta.json` sidecar for `agentType`, in the same breath as saying the tally reuses the observer rather than
  reimplementing it. The two pulled opposite ways, and an implementer holding both would have written the shell path.
  Both halves were asserted of the trace without opening it: it already labels every dispatch with its agent, and
  already prints `in`, `out`, `cache-write` and `cache-read` per turn — so the sidecar step was work already done, and
  the raw-record path was a second implementation of `records.ts` waiting to drift from it.)*

  **The observation's own cost is reported beside the run's.** The **observer** grades every dispatch, one cheap call
  each, and this change multiplies a refinement's dispatches by however many sweeps its interview sends — so part of
  what the run stops spending reappears out of band, where neither the **ceiling** nor this tally would see it. It is a
  read rather than a computation: the **debrief**'s own header already carries what the observation cost. Reporting it
  is what stops a before-and-after flattering itself.
- **D17. No spend target is set, and the baseline is the fixture rather than the observed run.** The plugin does not
  control the size of the repository it runs against. The bar is that the identified waste is gone, measured as a
  before-and-after ratio.

  **The observed run cannot be the "before".** It refined a private idea against a private repository and cannot be
  re-run, so comparing it to anything measures two ideas against two repositories. The refine happy path under
  `e2e-tests/tests/` already drives a whole refinement against a **committed fixture**, with a **responder** in the
  human's seat, and
  already prints its measured minutes and **spend** as a diagnostic. Two runs of it — one from a clean `main`, one on
  the finished branch — hold the idea, the repository, the responder and the **ceiling**s fixed. It will understate the
  saving, because the fixture is a small library with little thread to follow; it is still the only reproducible
  baseline available, and **the only thing that catches this change buying spend with wall clock before a user does**,
  which matters because sweeps add round trips under a ceiling that already exists. The tally is the diagnosis and the
  paid test is the guard; neither replaces the other. A worse figure is a finding to discuss rather than a merge block,
  since this change also closes three false **claim**s on its own account, per D26. The "before" must be taken from a
  clean `main` worktree: the **harness** installs from a **staged copy** of the working tree, so a run started from a
  part-edited tree measures a part-edited plugin.
- **D17a. The measurement is a slice of its own, last, and the evidence is its deliverable.** Every other slice here is
  prose that reviews on its own; nothing in any of them takes a figure, so the epic could be implemented, reviewed and
  merged with the bet in Further Notes never settled — and the **hand-off** it names, giving the sweep a target agent,
  is "revisitable with evidence" that would then not exist. A separate clean `main` worktree is independent of the
  working tree, so the "before" run needs no ordering against the other slices and the slice needs no edge except on all
  of them.

  **It is `ready-for-agent`**, which the refinement path earns: it clones a **standing repo** and creates and destroys
  nothing on the forge — that is the delivery path — and it was last measured at **21m 52s and $6.36** against
  **ceiling**s of ninety minutes and twenty-five dollars.

  **Up to three attempts per figure, and every attempt is written up** with its figures and why it ended. Recording only
  the passing one makes a branch that passed on the third attempt read exactly like one that passed first time, and the
  difference between those two is the most useful thing this measurement could say. **What may be repeated is a run that
  never started — a missing credential, an install that refused — or a failed mechanical assertion.** A failed
  **verifier** verdict on the branch **ends the slice and is reported as the finding it is**: it is the one signal
  nothing in this repository can assert, so a second run buys over exactly the evidence that reading less produced a
  worse **spec**. A ceiling reached is a reported outcome and never a failure, as the **Ceiling** entry has it.

  **The number of sweeps each run sent out is reported beside the figures, and it is the only direct test of the bet.**
  Everything else the slice reports is a consequence — turns, peak context, tokens, **spend**, wall clock — and every
  one of them moves for reasons that have nothing to do with whether the trigger fired. **Zero sweeps on the "after" run
  means the change did not happen**, whatever the rest of the table says, and that is the finding rather than a reason
  to run again. It costs nothing to read: the trace names every **dispatch** with the agent that ran it, in the same
  file D16's tally is read from.

  **Nothing in that slice edits prose to move the number.** The fixture is three functions with unit tests and D17
  already says it will understate; an agent holding a target-shaped figure beside the files that produce it is one step
  from tuning shipped instructions to one run, and that diff would be indistinguishable from this epic's actual work.
- **D18. Prose is cut only where the new prose obsoletes it.** Everything here adds text to documents that are re-read
  every turn, which was checked and comes to roughly $0.02 per run — irrelevant. No length is imposed, and nothing
  removed that is still doing work.
- **D19. Register and wrapping are preserved per file** — load-bearing bold, no hedging, second person, "you are done
  when…", and each file's prevailing column width.
- **D20. The changes stay independent**, each landable and reviewable on its own.

### What the run asserted

- **D21, D21a and D22. Withdrawn.** Between them these held that the **brief** records the one commit a **run** read the
  code at, that every **writer** carries it into what it publishes — a line in the spec's *Further Notes*, a `Base ref:`
  line beside a ticket's `Status:` — that the term entered the glossary, and that a writer is never continued across a
  moved one. **Nothing records a ref and nothing constrains a continue**, and the grounds are in D26. The numbers are
  kept rather than reused, as D11's is.
- **D23. A claim about what an existing test covers is settled by reading the test body.** Three claims asserted
  coverage inferred from a class name — a round-trip test that only looks a resource up, a fallback said to be
  exercised by the one entity that cannot reach it. The bar is a read, not a naming convention, and it binds on both
  writers because the tickets writer inherits the spec's table wholesale. The rejected alternative was forbidding
  coverage claims outright: an implementer needs to know what already exists, and silence would just move the guess.

  **Each bar sits where its claim is made, and the two writers differ in where that is.** The spec writer has a step
  whose job is the seams and the **prior art** beside them, and the bar goes there. The tickets writer has no testing
  step at all — it reads the spec, explores, drafts the slices, publishes — and it does not author coverage claims but
  *restates* them, turning the spec's table into acceptance criteria. That restatement is the observed failure: two
  wrong claims arrived as criteria an implementer is told to extend, carrying more authority than they were made with.
  So its bar goes in the step that writes those criteria, on any that assert what an existing test already covers. The
  rejected alternative was filtering on intake in step 1, which puts the bar pages away from the moment of restatement.

  *(Amended 2026-09-09. This named the **drafting** step, which does not write acceptance criteria: that step drafts the
  slices and their **blocking edges**, and the criteria arrive one step later, when each slice is published to the
  ticket template that carries them. The bar was to sit where the claim is made, and it was placed in the step before it
  — read off the word "drafts" rather than off what the step's own text says it drafts.)*
- **D24. Nothing re-checks a claim mechanically, and no verification agent ships.** The bar is where the claim is made,
  not a pass over it afterwards. A checking pass would need the ref, the build outputs and a second read of everything
  the writers read — the whole cost this spec exists to remove — and the plugin has no seam to run it in. **The risk is
  recorded rather than resolved:** these are prose bars on prose documents, and nothing in CI can hold them.

### What the user is told

- **D25. The README says what a user will now see inside an interview, and what it adds to an observation.** Two of its
  statements stop being true, and it is the document a user reads before any other.

  **It makes stages dispatched one at a time a requirement, and names its own violation as a misconfiguration.** The
  requirements list justifies one host setting with "its stages stop being dispatched one at a time", and the
  troubleshooting list names **"Stages run over each other, or a dispatch never reports back"** as that setting being
  on. After this change a refinement runs several **sweep**s beside its interview, which is what that symptom looks like
  from outside — so both places separate the epic's own stages overlapping, which is still a fault, from fact-finding
  beside an interview, which is now expected. The delivery half of the promise is untouched and stays true: one stage,
  one dispatch, reported before the next starts.

  **It prices an observation off a dispatch count.** It states "about ten cents a dispatch", that "the figure follows
  how many dispatches your run made, not how long it took", and "$3.18 to $3.48 for a refinement" — measured when a
  refinement made three or four **dispatch**es. The **observer** grades every dispatch, so a refinement that sweeps
  costs more to observe than that arithmetic implies, on the user's own account and against the same rate limit as the
  run. **No new figure is stated**: nobody has yet measured a refinement that sweeps, a derived figure is labelled as
  derived in this repository, and the README already carries the per-dispatch arithmetic — so saying the count now
  includes fact-finding is the whole of what is owed. D17a's slice gets no licence to come back and edit it either.

### What was scoped out after the fact

- **D26. Two decisions were taken and then withdrawn, and this is where that is recorded.** Both were in this spec when
  it was published, both had slices cut for them, and both were dropped on the grounds below rather than deleted
  quietly. D11, D21, D21a and D22 keep their numbers as withdrawal stubs so that a reader arriving from any document
  that cited one lands on the withdrawal.

  **The parallel-lookup line (D11) is dropped because this spec's own evidence says there is nothing to win.** Recorded
  two sections down under *Two suspected drivers that are not real*: the agents already compound 69–97% of their shell
  calls, about half of all turns already issue two lookups together, and 184 shell calls were 124 model turns with
  exactly one literal duplicate command among them. **Out of Scope already said "there is no headroom"** while the
  decision spent six files reaching for it, and D11 had to depart from D10 of
  `docs/specs/orchestrator-contracts/spec.md` to extend an unmeasured preference to three agents nobody had measured.
  So the upside is inside the noise of the before-and-after in D17a, and the downside is not:
  `assumption-reviewer`'s "**adjudicate them one at a time**" is what the whole adjudication rests on, and
  `change-request-creator`'s "**never a batch**" is a contract of its own. The line needed an exclusion clause in both
  files to be safe — which is a good sign the line does not belong there. **Nothing about batching is instructed
  anywhere**, and the `code-reviewer` exclusion argument goes with it, there being nothing left to exclude from.

  **The base ref (D21, D21a, D22) is dropped because it is the other half of a different change.** This spec carries two
  changes wearing one name: one removes reading to cut **spend**, the other adds reading to make **claim**s true. D23
  keeps the second half, and the ref work is what leaves with it, on two grounds. **First, D22 bought correctness with
  the very figure D17 measures**: a moved ref forced a cold re-dispatch where a continue was measured at 71% of a cold
  write, so the one number this epic is judged by would have carried a saving and a new cost with nothing separating
  them. **Second, this spec's own sentence sorts the two failures** — "a wrong line number is caught on the first
  checkout; 'this is already tested' is believed". The four wrong-location claims are the self-catching kind; the three
  coverage claims are the kind that costs a test nobody writes. Keeping the bar on the second and dropping the guard on
  the first keeps the correctness work aimed at the failure that survives contact with an implementer.

  **What that leaves open is stated rather than implied.** A **writer** can still be continued across a moved ref, so
  the observed failure can recur exactly as it happened, and no document a refinement publishes records the ref its
  `file:line` claims were read at. **The four wrong-location claims stay open**, the evidence for them stays under
  *What the run got wrong* so a later session need not re-derive it, and the fix is a **hand-off** below rather than a
  gap nobody named. What the drop also removes is a whole slice, three placements in three fixed document shapes, an
  extension of the brief's prohibition clause, a glossary entry, two template edits and the harness check D21 needed.

## Testing Decisions

**There is no test seam, and that is the finding rather than an omission.** Every file this spec touches is prose. CI is
`npm run typecheck && npm run lint` over `plugin/mcp` and `e2e-tests` and nothing else, so none of these files has a CI
surface. The refinement workflow never calls the tools server, so exercising the review lifecycle against the scripted
backend — the by-hand check this repository prescribes when behaviour moves — would verify nothing here. And
`deliverer` is deliberately absent from `enabledPlugins`, so no `/deliverer:*` run against this repository is available
as a check.

**Prior art is the whole repository outside `plugin/mcp`:** markdown, the manifests and the shell hooks are all
verified by hand, and the `orchestrator-contracts` epic — the closest prior art, touching the same files — reached the
same finding and said so plainly rather than performing a check that exercises nothing.

**What a good check looks like here** — external behaviour of the prose, not its wording:

- Every snippet an implementer intends to replace is confirmed present in the current source **before** editing, and
  any mismatch is reported rather than guessed around.
- The new trigger and the existing non-blocking property do not read as contradictory. A reader meeting "a sweep never
  holds up the interview" and "this question goes out to a sweep" must not conclude the interview stalls; D7's
  concurrency is part of why it does not.
- The mechanical rule does not read as forbidding the brief, the glossary entries or the ADRs stage 1 and stage 2
  produce. This is the single most dangerous misreading in the change, per D4.
- The narrowed ownership sentence still forbids handing the **interview** to an agent, and it says so in the same
  sentence that permits fact-finding, per D5a. This is the second most dangerous misreading, and the worse failure of
  the two.
- One wording per shared rule: the bolded test clause reads identically in both skills, and the test itself — one look,
  and a thread is not one — is in the glossary entry both skills' readers meet, per D2.
- Each writer's bar names something the step was handed rather than something the step decides, per D9.
- The README's new wording does not read as permission for two of an epic's own stages to overlap, per D25.
- The glossary's own words are used, and the synonyms its `_Avoid_` lists displace are not.
- The register bar in D19 holds, and each file's prevailing column width is matched.

**The instrument this change adds is a tally, not a test.** A documented reading of the **trace** the **observer**
already writes from a run's **session record**s, reporting per agent its model turns, its peak context and its tokens by
kind. It measures a run after the fact; it asserts nothing and gates nothing.

**One existing paid test is the guard, unchanged.** `e2e-tests/tests/refine-happy-path.test.ts` drives a whole
refinement against a committed **fixture** and prints its measured wall clock and **spend**; run from a clean `main`
and again on the branch, it is the controlled before-and-after D17 needs and the only thing that would catch sweeps
buying spend with wall clock before a user meets it. **No assertion is added to it and the file is not edited** — the
diagnostic it already prints is the whole instrument.

**Running it twice is a slice of its own** (D17a), because the figures are a deliverable rather than an intention and
because an unattended agent working it needs telling which outcomes it may pay to repeat: a run that never started or a
failed mechanical assertion, three attempts a figure, every attempt written up — and never a failed **verifier**
verdict, which is the finding rather than a flake.

**The harness needs no change, and that was checked rather than assumed.** After D26 nothing here alters the shape of a
published document at all — the check that mattered was for the `Base ref:` line D21 would have added to a ticket, and
that decision is withdrawn. What remains is that sweeps leave extra **session record**s behind, and
`assertSessionRecordsKept` takes a *floor*, so they cannot fail it. The **verifier** judges coherence and coverage only.

**Nothing exercises the trigger before a user does.** That is the honest state of this change, and it is why D5 is
phrased as a condition rather than a permission.

## Out of Scope

- **Model and effort tiers**, per D14. A hand-off, not work.
- **A sweeper agent**, per D15.
- **Weakening paths rather than contents, or a writer's first-hand read of the repository.** That contract is what
  makes a **claim** get checked, and this change must not turn into "the brief passes findings the writer can trust".
- **Batching instructions of any kind**, per D26 — including the one line this spec first carried as D11. The agents
  already compound 69–97% of their shell calls and already issue two in one turn about half the time. There is no
  headroom, and an instruction to prefer the dedicated read and search tools over the shell was declined as
  token-neutral on the read itself. No agent file is edited for it, `code-reviewer` least of all.
- **The base ref, and a **writer** continued across a moved one**, per D26 — the withdrawn D21, D21a and D22. Nothing a
  refinement publishes records the ref its `file:line` **claim**s were read at, and nothing stops a writer being
  continued after the ref moves, which is how four of the observed run's eleven wrong claims happened. The evidence is
  kept under *What the run got wrong* and the fix is a hand-off; it is left out here so that the correctness work in D23
  aims only at the failure nobody catches on the first checkout, and so that D17's one figure is not a saving and a new
  cost added together.
- **A spend target**, per D17.
- **Re-pricing the observed run at Bedrock rates.** With no target, the absolute figure decides nothing, and every lever
  here is judged by a before-and-after ratio on one provider. A hand-off.
- **The two observation defects** — an observation that finalised 93 minutes and **$27.56** early (125 of the run's 146
  requests fell after it), and a run window that closes at 1m38s. Both are diagnosed to specific lines and both belong
  to their own session.
- **Mechanically re-checking a claim**, per D24. The bars sit where the claim is made; there is no verification pass and
  no verification agent.
- **Teaching the **observer** to count a sweep as the **run**'s own.** It recognises a **dispatch** to one of the
  plugin's seven named agents and deliberately trusts no other, which a sweep is; that bounds what its account of a run
  covers. A hand-off, and TypeScript, which this change is not.
- **A figure for what sweeps add to an observation**, per D25. The count is reported by D17a's slice; deriving a dollar
  figure from it before anything has been measured is not.
- **The trace's own legend**, which describes lines carrying `req <id>` where the renderer emits a turn number, its
  request id and its four token figures. The tally in D16 describes the lines rather than the legend; correcting the
  legend is a hand-off.
- **The three defects the run's own **debrief** already names** — the missing task list, the brief written to the
  workspace rather than the OS temporary directory, and the two-round-trip idea capture. All three land in
  `refine/SKILL.md`, which this change edits anyway; they are left out so the before-and-after measurement attributes
  to one change.
- **An upstream change to the interview skill**, per D8. Its fact-finding rule is where the trigger properly belongs.
- **A test seam or an end-to-end assertion on turn count**, per the Testing Decisions above.
- **Editing any of this change's prose to move the measured figure**, per D17a. A worse or flat figure is reported.

## Further Notes

### The risks this change knowingly carries

**The trigger may not fire.** The whole stage-1 saving rests on one prose condition firing where two existing
instructions did not. No agent is named, no sweeper ships, and nothing exercises the trigger before a user meets it. D5
answers this as well as prose can — a condition rather than a permission, paired with D1's limit so the two close on
each other from both sides — but it is a bet, and the measurement in D16 and D17a is what settles it. **If the
before-and-after shows the trigger still does not fire, the fix is not more prose**: it is naming a target, which was
declined here for portability and can be revisited with evidence.

**A host that makes the interview wait spends the saving in wall clock rather than losing it.** D6c holds that the sweep
goes out regardless, because the reading is the cost and the waiting is not — but no wording can make a dispatch
non-blocking without naming the mechanism, so on such a host an interview serialises its sweeps and takes longer than
one that read inline. What bounds the exposure is measured: the refinement path last ran at 21m 52s against a
ninety-minute **ceiling**, so there is roughly four times the room, and a ceiling reached is reported as a ceiling
rather than as a failed assertion — this surfaces as a figure to discuss and not as a broken test.

**The observation gets more expensive, and its bound is asked to hold over more.** The **observer** grades every
**dispatch**, so every sweep is another graded dispatch: part of what the run stops spending reappears out of band,
which the ceiling excludes by definition and the tally would miss if D16's observation figure were not reported beside
the run's. And a sweep's own **session record** holds the repository's code, which the grading reads — while ADR-0018's
bound on what a **debrief** may carry holds by instruction alone, with nothing redacting and no second reader. Nothing
here weakens that bound; it is simply asked to hold over more material than before, and that is recorded rather than
resolved.

**And the observer does not recognise a sweep as the run's own.** `plugin/mcp/observer/run-facts.ts` decides which
entries belong to the **run** partly by matching a **dispatch** against the seven agents this plugin ships, and its own
comment says why: a dispatch of one of those "is the run's and nothing else's, which is what lets [it] trust it where it
cannot trust a bare `Agent` call". A sweep is exactly that bare call, aimed at whatever agent the host offers. **Nothing
about this reaches the run** — the observer is read-only over what a run leaves behind and never in touch with it. What
it can bend is the **account**: where the run is judged to have ended, and which dispatches are attributed to it. That
matters more here than it would elsewhere, because D17a settles this epic's bet by reading that account. What bounds the
exposure is that the interview's own turns carry the plugin's attribution regardless, so a sweep is never the only
signal in its window. Recorded rather than resolved, and a hand-off below.

**And the run can still read two refs.** D26 withdrew the guard, so a **writer** may be continued after the ref under it
moved, exactly as the observed run's `spec-writer` was — and no document a refinement publishes says which ref anything
in it was read at, so nothing downstream can catch the mismatch either. This is the one risk here that has already been
observed happening rather than reasoned about: four of eleven wrong **claim**s, in a published **spec** and three
**ticket**s. What bounds it is that its failures announce themselves — a line number wrong on the checked-out ref is
caught the first time anyone opens the file — which is the whole of why D26 kept D23's bar and dropped this one. It is a
hand-off, and it is the one hand-off here with a run behind it.

### What the evidence was, and what it was not

Every figure in this spec comes from the host's raw **session record**s for the observed run: one orchestrator record
and one per **dispatch**. The plugin's own **debrief** of that run covered 5 of its 146 requests and its **trace**
stopped 36 minutes before the first dispatch, so neither was used. Four figures the original analysis left open or got
wrong were settled while writing this spec:

- **The cache TTL is 5-minute, in full.** Every cache-creation entry across all three records is 5-minute; there are no
  1-hour entries anywhere. The spend is a single figure rather than a range topping out at $35.06, and the eight cold
  cache writes were 5-minute expiries across long waits for a human's answer. The plugin sets no TTL — there is no
  `cache_control`, no `ephemeral` and no TTL setting anywhere under `plugin/` — so this is reachable only by shrinking
  what the interview drags through those waits, which is what this change does.
- **The run is 146 requests and $31.40, not 138 and $26.94.** The lower count omits the twelve turns that fired after
  the handover; the orchestrator made 60 requests, not 52.
- **Output was undercounted fivefold.** One response is split across several records, one per content block, and only
  one of them carries the true `output_tokens` — the others hold placeholders of 1 to 4. Summing a placeholder-bearing
  record per response gives 100,955 tokens for the run; taking each response's true figure gives 165,111. Output is 13%
  of the spend, not 9%. **Any tally must take the record with the highest `output_tokens` per id**, which is the rule
  `plugin/mcp/observer/records.ts` implements and reconciled against the tools server's own figure to the token — and
  which is the reason D16's tally reads the **trace** rather than the records: the trace's figures have already had that
  rule applied to them, so no by-hand reading can get it wrong or drift from it.

  *(Amended 2026-09-09. This read "only the **last** carries the true `output_tokens`" and "any tally must take the last
  record per id" — not the rule the product implements, which keeps the highest per id. The two coincide on these
  records, but the rule was read off the record's shape rather than off the code that had already settled it, and a
  tally written to the stated rule would diverge from every figure the plugin reports. The illustration is restated
  without asserting which position either figure came from: the records are private and outside version control, so
  nobody can check that. Recorded rather than quietly fixed, as the notes above are.)*
- **A competing figure of $77.22 is wrong.** The run's own in-session analysis produced it by counting each
  `thinking`, `text` and `tool_use` block as a separate request. The agent records carry no request id, so a tally
  falls back to the message id: 143 entries collapse to 58 responses, which is the figure this spec uses.

### What the run got wrong, and why

Every identifier-shaped claim the run asserted as fact — in prose, and in the bodies of the `bash` heredocs it wrote
its documents with — checked against the code:

| | count |
|---|---:|
| distinct claims asserted and checked | **82** |
| confirmed | 65 |
| wrong location — right symbol, wrong ref and line | 4 |
| wrong shape — the claim about the symbol is false | 7 |
| fabricated | **0** |
| unverifiable — build-time generated types, services outside the repository | 5 |

**Nothing was invented.** Every symbol the run named exists. The four wrong-location claims share one cause: it read a
feature branch and narrated the default branch under the branch's names, down to a caller count that is right on one
ref and wrong on the other. Most of the wrong-shape claims share a second: coverage inferred from a test class's name —
a round-trip test that only looks a resource up, a fallback branch said to be exercised by the one entity that cannot
reach it, a Lombok `@Value` class described three times as a record.

**Eleven of the eighty-two reached the deliverables**, not just the reasoning: the published **spec** carries the wrong
symbol name through its own edit pass, and three **ticket**s carry coverage claims in their acceptance criteria as
prior art an implementer is told to extend. **A wrong line number is caught on the first checkout; "this is already
tested" is believed.** That is why D23 is a bar and not a suggestion — and, per D26, why it is the only bar here: that
same sentence is what sorted the three coverage claims this change closes from the four wrong-location ones it leaves
open. **This table is kept whole for the half it no longer answers**, so that whoever picks up the hand-off has the
evidence without re-deriving it from records that are private and outside version control.

### Two suspected drivers that are not real

Recorded so no later session re-attacks them:

- **The writers are not exploring without discipline.** Compound shell calls run at 97% for the orchestrator, 75% for
  the spec writer and 69% for the tickets writer, and about half of all turns already issue two lookups together. The
  184 shell calls are 124 model turns, with exactly one literal duplicate command among them.
- **Their exhaustive reading is instructed.** Paths rather than contents, and a writer meeting the repository
  first-hand, is what makes three agents each open the same files. It is a deliberate contract stated in three places
  and it stays.

### Where the spend actually sat

| stage | requests | spend |
|---|---:|---:|
| 1 — grilling, to the first dispatch at 11:59 | 38 | $9.86 |
| 2 — spec, including the writer | 67 | $13.14 |
| 3 — tickets, including the writer | 29 | $3.13 |
| after the handover — the run costing itself | 12 | $5.29 |

Thirty-eight of the orchestrator's 60 turns and 47 of its 62 shell calls fired before the first dispatch; that block
carries more spend than either writer. Fifteen files were read three times, once per agent. Peak context reached 308K in
the interview, 242K in the spec writer and 155K in the tickets writer, over a floor of roughly 110K that the
orchestrator's first turn already carried before any work began.

**The last row is not part of the delivery.** With the debrief reporting 5 of 146 requests, the run worked out its own
cost inside its own context: twelve turns at 251K–308K, two of them cold cache writes costing $1.58 and $1.63 for a
single request each, arriving at $77.22 — wrong by two and a half times. **16.8% of the run**, spent on a wrong answer
to the question the **observer** exists to answer offline and for nothing.

**Two drivers dominate, and they overlap, so they cannot be added.** Removing the tool-schema floor alone saves $10.61;
removing the cache expiries alone saves $11.92; removing both saves $17.94, and the $4.59 difference is the floor being
rewritten by the expiries. As marginal contributions that do sum: the conversation itself $13.47, expiry $7.33, the
floor $6.01, their interaction $4.60. **The floor is almost none of it the plugin's** — its largest slices are the
operator's own user-level MCP servers and the host's built-in tool schemas, and a current host defers them out of the
system prompt only to load them into the message stream on the first turn, so they stay inside the prefix the expiries
rewrite. That leaves the expiries as the part this change reaches, and what the interview holds across a human's pause
as the only lever the plugin has on them.

### The before-and-after, measured 2026-09-09

**One attempt each, and each passed on it.** Neither **run** failed to start, neither failed a mechanical assertion,
neither reached a **ceiling**, and the **verifier** passed on both — so nothing was repeated, no attempt is unreported
and the three-attempt bound in D17a was never approached. Both are `node --test tests/refine-happy-path.test.ts` against
the same **fixture** (`typescript-library` — word-wrapping in a small library), the same **standing repo** at
`7d99e9ce83d2`, the same **responder** and the same ceilings of ninety minutes and twenty-five dollars.

- **"before"** — a clean `main` worktree at `4234d15`, installed from a **staged copy** of that worktree (`da1fae3c`).
- **"after"** — this branch with slices 01 to 05 landed, at `742da87`, staged copy `7f8f240`.

**Sweeps: one on the "before" run and one on the "after" run, and that is the headline.** D17a makes the count the only
direct test of the bet, and on this fixture it does not separate the two runs. The "before" run's first **dispatch** is
a bare `general-purpose` agent titled *Sweep ANSI wrap style-continuity facts*, whose own prompt opens "You are a
fact-finding sweep for a design interview"; the "after" run's is the same shape, on SGR state semantics. So the trigger
fired on the branch — and it had already been firing on `main`, which the observed private run's zero sweeps gave no
reason to expect. **The change cannot be credited with the sweep this fixture produces**, and nothing here says whether
the trigger would fire where the upstream **imperative** did not. Both counts are read off the `#` rows of each run's
**trace**, where a sweep is named with the agent that ran it — and the risk above, that the **observer** does not
recognise a sweep as the run's own, did not bite on either: the interview's own turns bracket the sweep in both, so both
accounts carry it.

**Per agent, "before"** — model turns, peak context and tokens by kind:

| agent | model turns | peak context | in | out | cache-write | cache-read |
|---|---:|---:|---:|---:|---:|---:|
| the interview | 27 | 108,144 | 54 | 47,360 | 167,071 | 1,747,489 |
| #1 the sweep (`general-purpose`) | 29 | 67,216 | 58 | 14,871 | 77,956 | 1,152,158 |
| #2 `deliverer:spec-writer` | 71 | 176,535 | 142 | 117,039 | 331,038 | 6,727,446 |
| #3 `deliverer:tickets-writer` | 14 | 63,259 | 28 | 18,984 | 58,888 | 564,857 |
| whole run | 141 | — | 282 | 198,254 | 634,953 | 10,191,950 |

**Per agent, "after"**:

| agent | model turns | peak context | in | out | cache-write | cache-read |
|---|---:|---:|---:|---:|---:|---:|
| the interview | 41 | 111,821 | 82 | 52,436 | 191,387 | 3,053,092 |
| #1 the sweep (`general-purpose`) | 16 | 30,888 | 32 | 13,862 | 43,092 | 317,842 |
| #2 `deliverer:spec-writer` | 88 | 133,268 | 176 | 73,279 | 376,851 | 7,058,801 |
| #3 `deliverer:tickets-writer` | 57 | 99,990 | 114 | 51,273 | 179,177 | 3,787,502 |
| whole run | 202 | — | 404 | 190,850 | 790,507 | 14,217,237 |

**The interview did not shrink, and that is the one number D16 says to read.** Its model turns went 27 → 41, its peak
context 108,144 → 111,821, its own cache read 1.75M → 3.05M, and the trace's count of tool calls in the run's own
record 41 → 54. Its share of the run's cache read rose from 17% to 21%. Whatever the sweep took off it, more came back.

**The one figure that moved the way the change intended is the spec writer's.** Its peak context fell 176,535 →
133,268, a quarter, and its stage's wall clock halved — 42m49s to 20m34s — which is the shape D9's done-bar was
written for. The sweep also came back cheaper — 29 turns and a 67,216 peak against 16 and 30,888. The tickets writer
went the other way on every figure, publishing eight **ticket**s where the "before" run published six.

**Spend, both runs served by the same provider**: whatever `ANTHROPIC_BASE_URL` named in the environment the
**harness** handed each session, which bills through Amazon Bedrock — every one of the 141 and the 202 requests carries
a Bedrock-shaped message id. The dollar figures are the host's own estimate at first-party rates, so what they support
is a ratio between two runs on one provider and never a bill.

| | "before" | "after" |
|---|---:|---:|
| measured wall clock | 81m 03s | 68m 21s |
| the run, with the responder in it | $17.51 | $20.29 |
| of which the responder | $0.23 | $0.26 |
| the **verdict**, out of band | $0.65 | $0.66 |
| what the observation cost, out of band | $1.77 | $2.17 |
| question rounds / questions | 8 / 26 | 9 / 29 |
| tickets published | 6 | 8 |

**So spend went up 16% while the wall clock came down 16%**, which is the opposite of the trade D17 was watching for.
The observation went up with it, 23%, on the same three dispatch notes and one synthesis — more material graded rather
than more gradings. Both figures are read where they are owed: the run's and the wall clock from the **harness**'s own
measured line, the observation from each **debrief**'s `what this observation cost` header line.

**The extra work does not explain the extra spend.** The "after" run published more — eight tickets against six, 56
user stories against 45 — but in about the same volume: 1,052 lines of spec, tickets and ADRs against 1,102, and *fewer*
output tokens (190,850 against 198,254). What grew is turns over context: 202 requests against 141, and 14.22M cache
read against 10.19M. Spend per request in fact fell, from about $0.12 to about $0.10 (derived), so the change made a
turn cheaper and the run took 61 more of them.

**Where each figure came from.** The per-agent rows are the trace's `== tokens ==` section, and the peaks were worked
out by hand from its ordered section, exactly as `CONTRIBUTING.md` § Tallying a run prescribes. Each trace was distilled
by hand from that run's own **session record** with the guide's command — no model and no money — and came out
byte-identical to the one the **observer** had already written beside its debrief. Both debriefs read "not yet final"
when the harness returned and were finalised afterwards, so the observation figures are the finalised ones.

**What these figures do not settle.**

- **The fixture is too small to hold the waste this change removes.** Before its first dispatch the "before" run made
  five tool calls in its own record and the "after" run eight — against 47 of 62 on the observed run, which is the block
  this epic was written for. The baseline has no interview-shaped reading to remove, so the ratio measures its absence.
- **One run each.** Nothing here separates the change from the spread between two runs of the same fixture, which
  nobody has measured. A 16% move in either direction may be entirely that.
- **The two runs did not deliver the same amount of work** — eight tickets and 56 stories against six and 45, one ADR
  against three, nine question rounds against eight. A figure per ticket or per user story would be derived from a
  sample of one and is not stated.
- **The wall clock is soft.** Both runs were driven on a loaded machine with other agents working beside them, so the
  81m and the 68m carry that as well as the plugin.
- **Nothing here says the **claim**s got truer.** D23's bar is unmeasured: neither run's spec or tickets was audited
  against the fixture's code the way the observed run's were.
- **The observer's own account of the "after" run is imperfect** — its debrief header reads **stopped** in the spec
  stage for a run that finished and whose verdict passed. It bends the account and not the tally; the figures above are
  read off the trace's rows rather than off that line.

**Nothing in this epic's prose was edited to move any of it**, per D17a. The levers a flat figure reopens stay
hand-offs: model and effort tiers per D14, and naming the sweep's target per D15 — the second now with a run behind it
saying the trigger is not the thing that needs naming on a fixture this size.

### Hand-offs

- **The base ref, and a **writer** continued across a moved one** — the withdrawn D21, D21a and D22, per D26. It is the
  one hand-off here with an observed failure behind it rather than a risk: four wrong **claim**s in a published **spec**
  and three **ticket**s. Whoever takes it has the three placements, the brief's prohibition clause, the glossary
  cardinality and the harness check already worked out in this spec's history, and should take the measurement in D17a
  with it, since D22 trades a cold re-dispatch against a continue measured at 71% of a cold write.
- Reopening effort tiers on the reading-heavy writers, if the measurement in D16 disappoints.
- Re-pricing the observed run at Bedrock rates.
- The upstream fix to the interview skill's fact-finding rule, now wanted for the second time.
- Teaching the **observer** to report turns and peak context, once its two defects are fixed — the tally in D16 is a
  by-hand stand-in for that. The twelve post-handover turns are the sharpest argument for fixing it: with no instrument
  to hand, a run will cost itself in its own context, for 16.8% of its own **spend**, and get the answer wrong.
- The operator-side lever this change cannot reach: the tool schemas and skill listings a session carries into every
  request, which are the larger half of the floor and belong to whoever configures the host.
- Teaching the **observer** to count a **sweep** as the **run**'s own, so that its account of a refinement covers the
  dispatches this change adds. `run-facts.ts` trusts the plugin's seven agents by name and no bare dispatch.
- The **trace**'s legend, which announces `req <id>` lines where the renderer writes a turn number, a request id and
  four token figures. Harmless until somebody reads the legend instead of the lines, which D16's tally is written not
  to.

### Nothing from the observed repository appears here

The run under analysis delivered into a private repository that is no part of this project. Its name, its paths, its
domain and the idea it refined are deliberately absent, as the **debrief** bound requires. The raw records remain
outside version control and are not to be quoted into any document here.
