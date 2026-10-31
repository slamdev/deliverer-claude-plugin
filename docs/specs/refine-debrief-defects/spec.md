# What 28 refinement debriefs exposed: questions asked twice, sweeps that paid twice, and writers that rewrote whole

Status: ready-for-agent

## Problem Statement

A human ran `/deliverer:refine` 28 times across three projects, and an **observer** wrote a **debrief** of each run. A
synthesis judged 20 of them. Those findings were deduplicated and then re-sorted by the plugin commit each run used.
Seventeen runs used the commit from before the per-item restructure of the refine skill and both writers. Eleven runs
(#17 and #19–28) used today's refine skill, and five of those used today's `main` exactly. A finding is grounded here
only where one of those eleven shows it, or where today's text plainly still has the gap an older run fell into.

What those runs cost the human is mostly time spent waiting, and what they cost in money is mostly reading done twice.

**Questions went to the human on premises nobody checked.** A recommended answer rested on a fact that one look or a
**sweep** would have settled. The human decided on it, the **writer** killed the fact, and the decision came back as a
**fork** in a later **question round** (#17, #19, #23, #27). A removal decision left dangling references, and every
later reading found another one, which made three question rounds on one subject (#27). Today's per-round checklist
sends the *question* through the mechanical-or-sweep bar, but never the premise behind the answer it recommends.

**One frontier cost the human two waits.** Asking caps one call at four questions and says to carry the rest into
further calls. Runs sent the next call only after the first call's answers came back, so the overflow became a question
round of its own (#20; also #11 and #16). On this host several question calls can go out in one message, and all of
them reached the human before any answer came back when tried during the grilling.

**Stage 1 asked facts and left terms behind.** An ADR number was put to the human as a decision (#26). Where an epic's
code lives was settled as a decision, and then two question rounds were spent unwinding it once the one-repository bound
surfaced (#13). A term a settled decision relied on never reached the glossary and came back later as a fork (#26).

**Sweeps queued, overlapped and rediscovered.** One sweep carried five to eight numbered points, so the slowest point
set the stage's critical path (#20). Parallel sweeps closed the same facts four to six times over (#17, #19, #20).
Every sweep rediscovered which cluster context worked, even after one had reported it (#17, #19). One dispatch was
spent purely as a timer (#17). Older runs show the hygiene the skill never states at all: shared scratch paths that
one sweep deleted under its siblings, extracted binaries and background processes left on the host, and pods created
in production by a sweep everyone took to be read-only (#5, #10, #12, #13, #14).

**A sweep's checkout never reached the writers.** The checkout a sweep made was missing from the **brief**, so writers
searched the whole disk for it and fetched it again (#23, #24). Every dispatch in one run read a stale checkout, and
the human answered a fork on outdated counts (#24).

**Live credentials landed in dispatch records** (#17, #19; also #13, #18). From there they reached the **trace** and
the notes: passwords, private keys, storage keys, webhook tokens. The plugin's only redaction rule binds the brief. The
same dispatches dumped large files whole through the shell and read them again (§9), and the build side's debriefs show
every agent there doing the same.

**A put-back paid for the whole write again.** A continued spec writer rewrote its document whole instead of patching
it (#24). A cold writer was dispatched where continuing the old one would have worked, and spent 17 minutes rebuilding
context (#28). One writer tore down its prototype before a report whose open forks guaranteed a **put-back** (#28).

**Forks offered roads nobody had tried.** The human chose a road the writer had never seen work, and it failed (#26).

**Stage 4 has no loop.** The tickets writer found the spec wrong, and the epic was handed over anyway (#16), or every
ticket was rewritten after the hand-over (#6). Today's stage 4 is still one dispatch and done. "Every story covered" was
asserted without the per-story check behind it (#26). A blocker outside the ticket set, a pending change request, was
refused by the forge as a native link, and the ticket was written twice (#28).

## Solution

Three files change: the refine skill, `spec-writer` and `tickets-writer`, all in prose. The glossary's **Epic** names
the one-repository bound.

- **The refine skill:**
  - checks the premise behind each recommended answer, not just the question;
  - sends every question of a question round in one message;
  - states the one-repository bound in the first question round, and closes stage 1 on a glossary bar;
  - fetches the default branch at open, and puts a stale checkout to the human;
  - sends sweeps that each carry one question of fact, know their siblings and the environment, keep their checkout
    for the writers, and work inside one shared set of bounds;
  - gives stage 4 the loop stage 3 has.
- **The two writers** share those bounds and the build side's working-habits block, and patch in place when continued.
  The spec writer marks every road it offers as proven or unchecked; the tickets writer reports the forks its reading
  forced against the spec, maps every story to its tickets, and puts an external blocker in the ticket body.

## User Stories

### Asking

1. As a human being grilled, I want the premise behind every recommended answer checked where one look or a sweep could
   check it, and the question held while that sweep is out, so that I never decide on a fact a writer later kills.
2. As a human being grilled, I want the full reach of a removal found before I am asked about it, so that one subject
   costs me one question round and not three.
3. As a human being grilled, I want every question of a question round in front of me at once, however many calls that
   takes, so that one frontier costs me one wait.
4. As a human being grilled, I want questions of fact settled by the run instead of put to me, so that I only spend time
   on decisions.
5. As a human being grilled, I want to hear in the first question round that an epic delivers into one repository, so
   that where the code lives never becomes a decision I make and then unwind.
6. As a human closing stage 1, I want every term my decisions rely on to be in the glossary or listed in the brief as
   missing, so that no term comes back as a fork after stage 1 is over.
7. As a human whose checkout is behind the default branch, I want to be told so in the first question round and asked
   whether to pull, so that no dispatch reads a stale tree and I never answer a fork on outdated counts.

### Sweeps

8. As an orchestrator, I want each sweep to carry exactly one question of fact, so that no fact queues behind a slower
   one inside the same dispatch.
9. As a sweep, I want to be told the subjects of the sweeps already in flight, so that I do not close a fact a sibling
   is out to close.
10. As a sweep or a writer, I want to be handed how the environment is reached once an earlier report has established
    it, so that I do not rediscover which context or credentials path works.
11. As an orchestrator waiting on sweeps, I want to end my turn and let their notifications wake me, so that no dispatch
    is spent as a timer.
12. As a writer, I want every checkout a sweep made kept on disk and listed in the brief by path and ref, so that I open
    it instead of searching the disk or fetching it again.

### Bounds, working habits and secrets

13. As a human whose machine and live systems the run used, I want every sweep and writer to work in its own scratch
    copy under the temporary directory, report with nothing left running, name whatever it left, and write nothing to a
    live system, so that no sibling deletes a tree under another and fact-finding never changes production.
14. As a human whose machine the run used, I want the run's report to list every scratch path its sweeps and writers
    kept, so that I know what to remove.
15. As a human whose repository and environment hold credentials, I want every sweep and both writers to read config by
    key, never print a secret's value, compare secrets by hash or length, and never use a credential they find, so that
    no credential lands in a dispatch record, a trace or the notes, or authenticates against anything.
16. As a human, I want every sweep and both writers to background a long wait, read a large file once in ranges and
    measure text once after the last edit, worded as the build side words it, so that a refinement pays for none of
    that twice and one wording changes in one review.

### Put-backs

17. As a continued writer, I want to edit my published spec or tickets in place, keeping the tickets' numbers, and to
    know that only a cold dispatch writes them whole, so that a put-back costs the change and not the whole document.
18. As a writer whose report still carries open forks, I want to keep my prototype until those forks close, so that the
    put-back does not pay to build it again.

### The spec writer's forks

19. As a human answering a fork, I want every road it offers marked as proven or unchecked, so that I never choose an
    untried road without knowing it.
20. As a spec writer, I want a decision my reading raised that the brief never addressed to be held as a fork the brief
    left open, so that I close it on grounds I hold or else leave it open.

### Stage 4

21. As a tickets writer, I want to report every fork my reading forced against the spec, with what I found, so that a
    wrong spec reaches a human instead of being worked around in silence.
22. As an orchestrator holding such a report, I want to take it through stage 3's loop and then put stage 4 back on the
    corrected spec, so that the spec stays the record and the tickets are cut from it.
23. As a human, I want the epic handed over only once no fork the tickets writer raised is still open, so that I never
    receive an epic whose tickets disagree with its spec.
24. As a human reading the task list, I want a stage 4 put-back to flip its task back to `in_progress` the same way a
    stage 3 put-back does, so that the window shows what is running.

### The tickets writer's coverage and blockers

25. As a human, I want the tickets writer's report to map every user story to the tickets that cover it, as the output
    of its per-story check, so that "every story covered" is never asserted unchecked and can be checked in one look.
26. As a tickets writer meeting a blocker outside the ticket set, such as a pending change request, I want to name it in
    the ticket body by its link and in my report, never as a native blocking link, so that the forge never refuses the
    ticket and the human knows what the set waits on beyond itself.

## Implementation Decisions

The refine skill, `spec-writer` and `tickets-writer` all run on opus at medium effort, and sweeps take the session's
model through the host's general-purpose agent. Every rule here is one clause or one bullet added to an existing place,
written to be held without deliberation; none adds a step, a file or a term.

### The refine skill

- **The premise behind a recommended answer is a question of fact.** Stage 1's step 1 — telling each frontier
  question's kind — takes, for a decision, the premise its recommended answer rests on through the same mechanical
  bar: one look settles it now, a thread goes out as a sweep and the decision waits under step 2's existing hold. The
  reach of a removal is the example: "nothing else depends on this" is a fact to find before the question is asked.
- **A question round is one message.** **Asking** says that every call of a question round goes out in the same
  message, before any answer is waited on, replacing "the human answers in batches". The skill says "question round"
  wherever it now says "round" for the human's questions.
- **Stage 1's opening and done bar.** The first question round states the glossary's one-repository bound. Stage 1 is
  not done until every term a settled decision relies on is in the glossary or listed in the brief as missing.
- **The checkout at open.** The run fetches the default branch as it opens, before stage 1. Where the checkout is behind
  it, the first question round says so and asks whether to pull; the run never pulls on its own. Dispatches carry no
  ref.
- **A sweep carries one question of fact**, following the glossary's **Sweep**. A dispatch that would list several
  numbered points is several sweeps. Beside the subject, the first-hand rule and what it owes back, a sweep's dispatch
  carries:
  - the subjects of the sweeps already in flight, as context;
  - the environment facts an earlier report established, such as how a cluster or service is reached — writers'
    dispatches carry these too;
  - the host bounds and the working-habits block, by reference to the skill's own copy, word for word;
  - that a checkout or clone it makes is kept, and its path and ref named in its report.
- **The brief lists a sweep's checkout** through its existing artifacts bullet, by path and ref. Nothing else about the
  brief changes: it still carries claims and no section of established facts, and what a sweep settled still rides as
  a decision's **grounds**.
- **No dispatch as a timer.** **Sequencing**'s rule that a `sleep` or a poll stands in for no report extends to a
  dispatch spent only on waiting. The orchestrator ends its turn and the notifications wake it.
- **Stage 4 gets stage 3's loop.** When the tickets writer's report raises forks against the spec, they go through
  stage 3's "one report, one round, one put-back" by reference, the put-back going to `spec-writer`; stage 4 is then put
  back carrying the corrected spec's location, and its corrected report goes through the same. Stage 4 is done when no
  fork the report raised is still open. **Progress** flips stage 3's and stage 4's tasks the same way it does for a
  stage 3 put-back today.
- **What to report** gains a line for every fork the tickets writer raised and how it closed, and a line listing every
  scratch path the sweeps and writers kept.

The skill's put-back mechanism stands as it is: **Dispatch** already continues a writer while it is addressable, and
falls back to a cold dispatch.

### The shared bounds

Two blocks, each in the refine skill once, in `spec-writer` and in `tickets-writer`. The sweep dispatch passes the
skill's copy on by reference.

- **The working-habits block**, word for word as [build-debrief-defects](../build-debrief-defects/spec.md) gives it — a
  long wait backgrounded, a large file read once in ranges, measuring once after the last edit, and a secret never used
  or shown. That spec owns the wording; with the build skill and its six agents the block spans ten files. The brief's
  existing redaction line stays as it is.
- **Host bounds**, the refine side's own, since an implementer works in the workspace and drives gates that may touch a
  live system:
  - Work in your own scratch copy under the OS temporary directory, never in a shared or named path, and never in the
    workspace root.
  - Report with nothing of yours still running.
  - Leave the host as you found it, or name in your report what you left.
  - Write nothing to a live system.
  - A writer keeps its prototype and scratch copy while its report carries open forks.

### `spec-writer`

- **A put-back clause.** A continued dispatch edits the published spec in place. Only a cold dispatch, including
  **Resume** finding a spec already published, writes it whole.
- **Fork roads carry their evidence state.** Every road a fork offers, open or recommended, is marked *proven* (the
  writer saw it work: a prototype ran, a test passed, the code already does it) or *unchecked*, in the spec's Further
  Notes and in the report.
- **An unaddressed decision.** One sentence in **Forks**: a decision the reading raised that the brief never addressed
  is a fork the brief left open, and closes the same way. **Forks** keeps its two states and no third.
- The shared bounds apply, and so do the checkout paths the brief lists.

### `tickets-writer`

- **Forks against the spec.** Every place its reading found the spec wrong — a mechanism that would not achieve what
  the spec intends, a decision the code makes impossible — goes to the report as a fork, with what it found. It is not
  worked around silently in the tickets.
- **A put-back clause.** A continued dispatch edits its published tickets in place and keeps their numbers. Only a cold
  dispatch writes a ticket whole, and **Resume**'s fixed numbers still hold.
- **A story map.** Step 5's per-story check produces a mapping from every user story number to the ticket numbers that
  cover it, and the report carries that mapping in place of today's one-line coverage assertion. An uncovered story is
  still named with why.
- **External blockers.** A blocker outside the ticket set, such as a pending change request or another epic's ticket, is
  named in the ticket body by its link — never a native blocking link and never a **blocking edge** — and every one
  goes to the report.
- The shared bounds apply here too.

### The glossary and ADRs

**Question round** and **Put-back** are landed, **Sweep** says a subject is one question of fact, and **Epic** names
the one-repository bound. No ADR changes. The orchestrator still forms no judgement (ADR 0015): checking a premise is
settling a question of fact, and a put-back is still one move whether continued or cold.

## Testing Decisions

Nothing here is covered by CI: every change is prose. A good check looks at what a run or a dispatch visibly did — the
calls in one message, the paths in the brief, a wave's output tokens, a report's lines — and never asks whether the
prose reads as intended. No new seam is proposed. The three existing ones:

- **The writing-for-agents read.** The refine skill, `spec-writer` and `tickets-writer` are each read against
  `/mattpocock-skills:writing-for-agents` before merge. The read also diffs the host bounds across the three files, and
  the working-habits block against the build side's seven copies.
- **The bench** (CONTRIBUTING.md § The bench). Two arms, `current` against `before=<main>:plugin/agents/spec-writer.md`,
  with `--waves 1` on the existing fixture. Two things are read off the arms: the put-back wave's output tokens in each
  arm's `wave-1.md` and `reading.json` — the current arm should patch, and come in well under its own first-dispatch
  output — and whether every fork road in each arm's first report carries *proven* or *unchecked*. Under the bench's
  caveat, arms are compared only with each other.
- **One refine happy-path run, driven by hand** (CONTRIBUTING.md § The end-to-end tests). The test's existing
  assertions must still pass. Its session record and debrief are then read for:
  - the default branch fetched before stage 1;
  - every question round with more than four questions sent as several calls in one message;
  - every sweep carrying one question, and every checkout a sweep made listed in the brief by path and ref;
  - the run's report listing the scratch paths kept.

  The fixture may not raise a frontier wider than four questions, a stale checkout or a fork in stage 4. Where it
  raises none of them, the report says so and that behaviour is left for the next observed debrief rather than forced.

Prior art: `docs/specs/idp-scaffold-defects/` verified its prose changes the same way, reading them against the guidance
and confirming them in the next observed run.

## Out of Scope

- **Findings seen only in runs on the old commit, where today's text already has an answer**: 1.1 (asking while a sweep
  is in flight), 1.3 (re-asking settled ground), 3.3 (system facts stated as context), 3.4 (contradicting decisions in
  the brief, now step 4's collision trace), 3.6 (slug renames), 3.7 (ADRs landed early, and stage 1 artifacts left
  uncommitted, now stage 5), 4.3 (writers that stopped short of writing), 4.5 (prototype cost), 5.4 (operations epics)
  and 5.5 (placeholder references).
- **Restating that a put-back continues the writer**: **Dispatch** already says it, and #28 did not follow it.
- **Sweep reports as files the writers rely on**: the brief carries no established facts, so only a checkout's path.
- **A model or effort for sweeps**: they take the session's; the money went on reading twice, not on the model.
- **The spec writer's conformance loop (4.1).** The rule survived the restructure unchanged, but none of the eleven runs
  on current code showed the loop. It waits for one that does.
- **The task-list findings (§7).** They are seen only in old runs, and the phantom stage 5 task in #19 is now stage 5's
  own task.
- **Host-level waste (§9)**: the 120-second tool timeout, and `disable-model-invocation` making the human re-type the
  command. No plugin file owns them. Large files dumped whole are the working-habits block's.
- **The observer's own defects** in `debrief-findings.md`. They are worked separately.
- **A mechanical guard for secrets or for writes to live systems**, such as a hook. This change states the rule in
  prose, and a guard would come only if the prose fails again.

## Further Notes

### The source

`/root/deliverer-debriefs/refine-findings.md` deduplicates the 28 debriefs collected in
`/root/deliverer-debriefs/refine.md`. That file names each run's plugin commit, and the numbers used here are that
file's. Run #20's claim that it "stopped with eight questions never asked" is not used as grounds: its debrief saw
seven minutes of the run, which is the observer defect `idp-scaffold-defects` fixed, and the run went on to ask eight
more question rounds. The overflow that run planned as a separate question round still holds as evidence.

### Load-bearing behaviour this change must not disturb

- A question that does not turn on a sweep's subject is still asked now. A premise check holds only the question whose
  premise is in flight.
- A sweep is still one subject each, and the first-hand rule still binds it.
- A writer's own first-hand look still decides every **claim**; the brief carries no section of established facts.
- Stage 5 still commits only the paths the refinement wrote. Kept checkouts and scratch copies live in the temporary
  directory and are never committed.
