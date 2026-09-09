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

**Each writer's exploration gains the done-bar it is missing.** Step 2 of `spec-writer` and of `tickets-writer` is the
only **exploration** step in either document that states no completion condition, and it is the step that ran longest.
The bar is coverage-shaped, matching how their neighbouring steps already close.

*(Amended 2026-09-09. This read "the only step in either document", which is false: step 1 of each writer and the
report step state none either. The reading step is self-limiting — "read it in full" is its own bar — so the claim is
true of exploration steps and of nothing wider. It is recorded rather than quietly fixed because it is an instance of
exactly what this change exists to prevent: a claim asserted from a plausible reading rather than from a check.)*

**Six of the seven agents are told to issue independent reads together.** One sentence, six files, and it says what it
does not reach: two of the six forbid batching what they write.

And the words are pinned down: **mechanical** is bolded three times in `build/SKILL.md` and stated in ADR 0015 without
ever being defined, so it enters the glossary; and ADR 0015's "read-only" is amended to say what it is read-only over,
since a refining orchestrator authors the brief and the glossary entries and ADRs a refinement lands.

**A claim about code carries the ref it was read at, and no agent's context spans two refs.** The observed run read a
feature branch and wrote `main`'s names over it. Two things let it: `spec-writer` was **dispatched twice** — once with
the working tree on the branch, once nineteen minutes later on `main` — so one context held two incompatible views of
the code; and nothing in a refinement's output records which ref its `file:line` claims were read at, so nothing could
catch the mismatch afterwards. Both are closed here.

**And "already tested" is a claim that needs a read.** Three of the wrong-shape claims assert coverage a test file does
not have, inferred from its name and never checked against its body. The bar is that a **claim** about what an existing
test covers is settled by reading the test, or it is not made.

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
16. As a **spec writer**, I want a stated bar for when exploration is done, so that the one step in my instructions
    without a completion condition stops being the one that runs longest.
17. As a spec writer, I want that bar keyed to the brief's **claim**s and the modules the spec touches, so that it
    measures coverage rather than counting calls.
18. As a spec writer, I want to keep meeting the repository first-hand, so that the bar bounds my reading without
    weakening what makes my reading worth anything.
19. As a **tickets writer**, I want a bar keyed to the spec's **user stories** and the modules the slices cut through,
    so that it is stated in terms of the inputs I actually hold.
20. As any dispatched agent, I want to be told to issue independent lookups together, so that lookups that do not
    depend on each other are not paid for as separate turns over a growing context.
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
30. As a refining orchestrator, I want the ref every `file:line` claim was read at recorded once, so that a claim
    outlives the working tree it was read from.
31. As a refining orchestrator, I want never to resume a **writer** across a changed working tree, so that one agent's
    context cannot hold two incompatible views of the code.
32. As a **spec writer**, I want a stated bar for asserting what an existing test covers, so that a class name is not
    mistaken for coverage.
33. As a **tickets writer**, I want the coverage claims I inherit to carry their evidence, so that an acceptance
    criterion never tells an implementer to extend a test that is not there.
34. As a contributor, I want the eleven wrong claims and their two causes recorded, so that the next reader can check
    whether this change would have caught them.
35. As a human refining an idea, I want fact-finding sent out even where my host makes the interview wait for it, so
    that the saving is not abandoned wherever it costs a little patience.
36. As any dispatched agent, I want the batching instruction to say what it does not reach, so that a rule about reading
    is never taken as licence to batch what I write.
37. As a **spec writer**, I want my exploration bar to bound my reading rather than restate a later step's bar, so that
    two steps do not close on the same thing.
38. As a **tickets writer**, I want a bar that ends its own step rather than my reading, so that a later step that has
    to open a test can still open it.
39. As a contributor, I want the word that names a rote change to keep a word of its own, so that defining one term does
    not quietly empty another definition.
40. As a contributor, I want what the observation itself cost reported beside the run's, so that **spend** moved out of
    band is not read as spend removed.
41. As a contributor, I want the before-and-after taken and written down rather than intended, so that the bet this
    change makes is settled by evidence rather than left to expire.
42. As a contributor, I want the tally's per-agent figures actually attributed to agents, so that the one number that
    says whether the interview's context shrank is readable.

## Implementation Decisions

### Modules touched

- **The refinement skill** (`plugin/skills/refine/SKILL.md`) — the mechanical rule, the sweep trigger and contract,
  sweep concurrency and subject width, the fallback where no sweep can be dispatched, the base ref recorded in the
  brief, and no writer continued across a moved base ref.
- **The delivery skill** (`plugin/skills/build/SKILL.md`) — the shared test clause gains the web, per D3. **Its edges
  are not touched**, per D13.
- **The spec writer and tickets writer** (`plugin/agents/spec-writer.md`, `plugin/agents/tickets-writer.md`) — a
  done-bar on step 2 each, the base ref carried into what they publish, and the bar on asserting test coverage.
- **Six of the seven agents** (`plugin/agents/*.md`, less `code-reviewer`) — the parallel-lookup line, per D11.
- **The glossary** (`CONTEXT.md`) — a **Mechanical** entry and a **Base ref** entry; the **Orchestrator** entry
  qualified; the word dropped from **Wide refactor**.
- **The ADR on the orchestrator's moves** (`docs/adrs/0015-the-orchestrator-forms-no-judgement.md`) — amended.
- **The contribution guide** (`CONTRIBUTING.md`) — the tally, as its own subsection.
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
  mechanical look goes out. Stated as a condition the orchestrator tests, not a permission it may decline — two
  existing instructions phrased as permissions produced zero sweeps.
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

- **D9. Step 2 of each writer gains a done-bar, and both are keyed on reading alone.** For the spec writer: every module
  the spec will touch has been read, along with the ADRs that touch the area. For the tickets writer: every module the
  slices will cut through has been read well enough to size a ticket against it, and nothing on the spec's user-story
  list points at code the writer has not opened. Both match the shape their neighbouring steps already use, and neither
  carries a number.

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
- **D10. The bars bound the reading and not the first-hand contract.** A done-bar says when exploring stops, never that
  the writer may take something on trust. Paths rather than contents stands untouched — see D13.

### Across the plugin

- **D11. One parallel-lookup line, in six agents, identical.** Independent lookups go out together in one turn rather
  than one per turn. **This departs from D10 of `docs/specs/orchestrator-contracts/spec.md`**, which holds that a spend
  preference measured on one agent is not extended to agents it was never measured on. The grounds for departing: that
  decision governed a preference between two dispatch strategies, where getting it wrong on an unmeasured agent changes
  what the agent does. This is an instruction to batch lookups that do not depend on each other, which carries no
  tradeoff to get wrong, and the delivery skill's reading-heavy agents are heavier readers than either refinement
  writer. Three agents were measured; three receive the line unmeasured, knowingly.

  **The line names reads and says what it does not reach, because two of the six forbid batching in almost those
  words.** `change-request-creator` is told "Post one comment per entry carrying none — **never a batch**", and
  `assumption-reviewer` "**Adjudicate them one at a time**, giving the last one the same scrutiny as the first". An
  unqualified "these go out together in one turn" in either file is one inference from batched comments or batched
  **verdict**s, and the second would take down the per-assumption scrutiny the whole adjudication rests on. So the line
  names a search, a file and a listing, and closes by saying that what the agent writes is unaffected — a post, a reply,
  a verdict and a commit each keep the rule they already have. Identical in all six, and the exclusion travels with it
  into the two files that need it.

  **`code-reviewer` is excluded, and this is where that is recorded.** It runs at `model: sonnet`, `effort: low` and
  opens no file at all: it calls `code_review_start`, polls `code_review_status` to a **terminal** status, and reports
  the prose. The grounds for extending the line to unmeasured agents are that the delivery agents are heavy readers,
  which does not cover one that reads nothing — so the line would be inert there, and it sits badly beside the
  **Poll** contract ("what is known when it is asked and no more") and the agent's own "One dispatch, one round". The
  rejected alternative was all seven for grep-checkability. Anyone reaching for symmetry later should read this entry
  first.
- **D12. `mechanical` enters the glossary.** It is bolded three times in `build/SKILL.md` — and used a fourth time there
  unbolded, in "not a mechanical fact, so not yours" — stated in ADR 0015, and defined nowhere. A question about the
  tree, the forge or the web whose answer is true or false rather than good or bad — **and the fact that answers one**,
  since `build/SKILL.md` bolds "the **mechanical** facts you settled" as well as the question. All four uses in that
  file modify a question or a fact and none needs rewording. It goes in the glossary's *The run* section beside
  **Orchestrator**, whose behaviour it describes.

  **The word carries a second sense in bolded prose, and that sense keeps its meaning under another word.**
  `CONTEXT.md`'s **Wide refactor** entry reads "one mechanical change", and `tickets-writer.md` says the same thing in
  the same words — both meaning rote or automatable, which is not this definition. Bold marks a glossary term here, so
  one word cannot carry both. `tickets-writer.md` drops the word and keeps its examples, which already carry the sense
  it was doing. **The glossary entry has no examples, so dropping the word alone would leave nothing carrying it**: that
  entry says "one **rote** change — rename a column, retype a shared symbol — whose blast radius …", taking the word the
  agent file already uses and the examples with it, so the two places finally read alike.

  **The rote sense also lives in the Node code's comments, roughly twenty times, and stays there.** "the observer's
  mechanical half", "a mechanical bound costs a **defect** the **grounds** it stands on", "the ONE invisible failure
  this design can mechanically detect". None is bold and none is prose a model reads as instruction, so the rule that
  bold marks a term is not broken and no comment is touched. Rewording them would put a large diff in the one package CI
  checks for no change in behaviour.

  *(Amended 2026-09-09. This decision said the second sense sat in exactly two places and that the examples beside the
  word already carried it. Both halves were read off `tickets-writer.md` and asserted of the glossary and the product:
  the glossary entry carries no examples at all, and the Node comments carry the sense about twenty times. Recorded
  rather than quietly fixed for the same reason as the notes above.)*
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

  **It reuses the observer rather than reimplementing it.** `plugin/mcp/observer/distil.ts` already runs by hand with
  no model and no money and already prints per-turn ids and token figures with a run total, and `records.ts` already
  resolves the split-record problem. Only **peak context per agent** is new — nothing under `observer/` computes it —
  and it is `jq` over `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`, maxed. That line cannot
  drift from the shipped code because it shares no logic with it: the placeholder problem affects `output_tokens` alone,
  and every record of one response repeats the same input and cache figures, so a peak needs no dedup at all.

  **Per agent takes one more step than the maximum, and the guide states it.** The host names each dispatch's record
  with an opaque id — `agent-<id>.jsonl` — and the agent it ran is not in the file or its lines: it is in the
  `agent-<id>.meta.json` sidecar beside it, as `agentType`. So the maximum alone yields a column keyed by ids rather
  than a per-agent figure, and per-agent is the whole point, being the figure that says whether the interview's context
  shrank. `plugin/mcp/observer/records.ts` already reads those sidecars and records that it checked every one against
  the **dispatch** that made it across three runs, so the guide cites it rather than re-deriving the layout.

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
  since this change also closes eleven false **claim**s on its own account. The "before" must be taken from a clean
  `main` worktree: the **harness** installs from a **staged copy** of the working tree, so a run started from a
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

- **D21. The base ref is recorded once, in the brief, and every writer carries it into what it publishes.** A
  refinement's output is full of `file:line` claims and states none of the refs they were read at, so a claim cannot be
  checked once the working tree moves. The rejected alternative was recording a commit per claim: the run's claims came
  from one ref each time, and a per-claim field is noise that the one case it would catch — a writer reading two refs —
  is already forbidden by D22.

  **Three placements, each named, because each document has a fixed shape.** In the **brief**, a line *above* the five
  bullets rather than a sixth bullet: the stage's own bar reads "every one of the **five** things it carries is written
  out of the conversation or stated to hold nothing", and the ref is a mechanical fact about the environment rather
  than something the conversation settled, so it does not answer to that bar and must not be counted by it. In the
  **spec**, a line in *Further Notes*, which already collects exactly this class of document-level fact — every open
  **fork**, every ADR the spec contradicts. In a **ticket**, a `Base ref:` line beside `Status:`, which stays literal
  text on every tracker: `Spec`, `Blocked by` and `Status` are replaced by platform mechanisms where a forge has them,
  and no forge has one for a ref. A ticket needs its own because an implementer reads "this ticket and whatever it
  points at, and nothing else of the epic", and the coverage claims D23 guards land in its acceptance criteria.

  **The brief's own prohibition has to name the ref line as not one of them.** That section closes "the brief carries
  what the session decided and what it never checked — and no section of established facts, however that section is
  headed", which is the contract that makes a **claim** get checked by the **writer** rather than trusted. A stated fact
  above the bullets meets it head-on: a reader either leaves the ref out, or takes the prohibition as soft and opens the
  facts section it exists to forbid. So the clause gains the exception rather than the placement dodging it — the base
  ref line says where the reading happened, not what the reading found. Placement alone was the rejected alternative: it
  leaves two instructions apparently in conflict with nothing in the file resolving them.
- **D21a. `Base ref` enters the glossary.** After this change the phrase is a term in four shipping files, and a needed
  term the glossary does not carry is this repository's signal to add one. What is being defined is not git's "ref" but
  **the** base ref: one commit per **run**, explicitly never one per **claim**, recorded by the brief and carried by
  every **writer**. That cardinality was a decision, and the glossary is the only place a rule of that shape survives.
- **D22. A writer is never continued across a **moved base ref**; it is re-dispatched.** The observed run resumed
  `spec-writer` nineteen minutes after it finished, on a different ref, and its already-written line numbers went out
  in the **spec** unchanged while the prose around them was rewritten. A resumed agent cannot be told to distrust its
  own notes. **Get this wrong and every other guard here is decoration**, because a context holding two refs will
  produce claims true of neither. The orchestrator reads the ref and compares it against the one the brief records,
  which is a single look and so **mechanical** under D1.

  *(Amended 2026-09-09. This read "across a changed working tree", which is a different and much wider test. Stage 1
  runs the domain-modeling skill precisely so glossary entries and ADRs land as decisions crystallise — that dirties
  the tree without moving the ref, so the literal rule would forbid continuing a writer after nearly every refinement
  and delete D9 of `docs/specs/orchestrator-contracts/spec.md`, whose continue-over-cold preference was measured at 71%
  of a cold write. **This is the same failure D4 warns about**: a rule stated without saying what it applies over,
  silently deleting a stage.)*
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
  So its bar goes in the **drafting** step, on criteria that assert what an existing test already covers. The rejected
  alternative was filtering on intake in step 1, which puts the bar pages away from the moment of restatement.
- **D24. Nothing re-checks a claim mechanically, and no verification agent ships.** The bar is where the claim is made,
  not a pass over it afterwards. A checking pass would need the ref, the build outputs and a second read of everything
  the writers read — the whole cost this spec exists to remove — and the plugin has no seam to run it in. **The risk is
  recorded rather than resolved:** these are prose bars on prose documents, and nothing in CI can hold them.

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
- One wording per shared rule: the mechanical rule reads identically in both skills.
- The glossary's own words are used, and the synonyms its `_Avoid_` lists displace are not.
- The register bar in D19 holds, and each file's prevailing column width is matched.

**The instrument this change adds is a tally, not a test.** A documented command over a run's **session record**s
reporting, per agent, model turns, peak context and tokens by kind. It measures a run after the fact; it asserts
nothing and gates nothing.

**One existing paid test is the guard, unchanged.** `e2e-tests/tests/refine-happy-path.test.ts` drives a whole
refinement against a committed **fixture** and prints its measured wall clock and **spend**; run from a clean `main`
and again on the branch, it is the controlled before-and-after D17 needs and the only thing that would catch sweeps
buying spend with wall clock before a user meets it. **No assertion is added to it and the file is not edited** — the
diagnostic it already prints is the whole instrument.

**Running it twice is a slice of its own** (D17a), because the figures are a deliverable rather than an intention and
because an unattended agent working it needs telling which outcomes it may pay to repeat: a run that never started or a
failed mechanical assertion, three attempts a figure, every attempt written up — and never a failed **verifier**
verdict, which is the finding rather than a flake.

**The harness needs no change, and that was checked rather than assumed.** Adding a `Base ref:` line to a ticket and a
line to the spec's Further Notes touches nothing it reads: `assertSpecPublished` checks the file exists and carries a
**triage label**, `assertTicketsPublished` checks contiguous two-digit numbering, a blocking-edges line and a label,
and both parsers are line-anchored multiline patterns (`e2e-tests/harness/epic.ts`). The **verifier** judges coherence
and coverage only. `assertSessionRecordsKept` takes a *floor*, so the extra **session record**s that sweeps leave
cannot fail it.

**Nothing exercises the trigger before a user does.** That is the honest state of this change, and it is why D5 is
phrased as a condition rather than a permission.

## Out of Scope

- **Model and effort tiers**, per D14. A hand-off, not work.
- **A sweeper agent**, per D15.
- **Weakening paths rather than contents, or a writer's first-hand read of the repository.** That contract is what
  makes a **claim** get checked, and this change must not turn into "the brief passes findings the writer can trust".
- **Batching instructions beyond the one line in D11.** The agents already compound 69–97% of their shell calls and
  already issue two in one turn about half the time. There is no headroom, and an instruction to prefer the dedicated
  read and search tools over the shell was declined as token-neutral on the read itself.
- **A spend target**, per D17.
- **Re-pricing the observed run at Bedrock rates.** With no target, the absolute figure decides nothing, and every lever
  here is judged by a before-and-after ratio on one provider. A hand-off.
- **The two observation defects** — an observation that finalised 93 minutes and **$27.56** early (125 of the run's 146
  requests fell after it), and a run window that closes at 1m38s. Both are diagnosed to specific lines and both belong
  to their own session.
- **Mechanically re-checking a claim**, per D24. The bars sit where the claim is made; there is no verification pass and
  no verification agent.
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
  `plugin/mcp/observer/records.ts` implements and reconciled against the tools server's own figure to the token, and why
  ticket 03 says so.

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
tested" is believed.** That is why D23 is a bar and not a suggestion.

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

### Hand-offs

- Reopening effort tiers on the reading-heavy writers, if the measurement in D16 disappoints.
- Re-pricing the observed run at Bedrock rates.
- The upstream fix to the interview skill's fact-finding rule, now wanted for the second time.
- Teaching the **observer** to report turns and peak context, once its two defects are fixed — the tally in D16 is a
  by-hand stand-in for that. The twelve post-handover turns are the sharpest argument for fixing it: with no instrument
  to hand, a run will cost itself in its own context, for 16.8% of its own **spend**, and get the answer wrong.
- The operator-side lever this change cannot reach: the tool schemas and skill listings a session carries into every
  request, which are the larger half of the floor and belong to whoever configures the host.

### Nothing from the observed repository appears here

The run under analysis delivered into a private repository that is no part of this project. Its name, its paths, its
domain and the idea it refined are deliberately absent, as the **debrief** bound requires. The raw records remain
outside version control and are not to be quoted into any document here.
