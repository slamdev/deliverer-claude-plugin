# What 28 refinement debriefs exposed: questions asked twice, sweeps that paid twice, and writers that rewrote whole

Status: ready-for-agent

## Problem Statement

A human ran `/deliverer:refine` 28 times across three projects, and an **observer** wrote a **debrief** of each run. A
synthesis judged 20 of them. Those findings were deduplicated and then re-sorted by the plugin commit each run used.
Seventeen runs used the commit from before the per-item restructure of the refine skill and both writers. Eleven runs
(#17 and #19–28) used today's refine skill, and five of those used today's `main` exactly. A finding is grounded here
only where one of those eleven shows it, or where today's text plainly still has the gap an older run fell into.

What those runs cost the human is mostly time spent waiting, and what they cost in money is mostly reading done twice.

**Questions went to the human on premises nobody checked.** A recommended option rested on a fact that one look or a
**sweep** would have settled. The human decided on it, the **writer** killed the fact, and the decision came back as a
**fork** in a later **question round** (#17, #19, #23, #27). A removal decision left dangling references, and every
later reading found another one, which made three question rounds on one subject (#27). Today's per-round checklist
sends the *question* through the mechanical-or-sweep bar, but never the premise behind the answer it recommends.

**One frontier cost the human two waits.** Asking caps one call at four questions and says to carry the rest into
further calls. Runs did that by sending the next call only after the first call's answers came back, so the overflow
became a question round of its own (#20; also #11 and #16). On this host several question calls can go out in one
message and all of them reach the human before any answer comes back. This was established during the grilling that
produced this spec.

**Stage 1 asked facts and left terms behind.** An ADR number was put to the human as a decision (#26). Where an epic's
code lives was settled as a decision, and then two question rounds were spent unwinding it once the one-repository bound
surfaced (#13). A term a settled decision relied on never reached the glossary and came back later as a fork (#26).

**Sweeps queued, overlapped and rediscovered.** One sweep carried five to eight numbered points, so the slowest point
set the stage's critical path (#20). Parallel sweeps closed the same facts four to six times over (#17, #19, #20).
Every sweep rediscovered which cluster context worked, even after one had reported it (#17, #19). One dispatch was
spent purely as a timer (#17). Older runs show the hygiene the skill never states at all: shared scratch paths that one sweep deleted
under its siblings, extracted binaries and background processes left on the host, and pods created in production by a
sweep everyone took to be read-only (#5, #10, #12, #13, #14).

**Nothing a sweep found survived to the writers unless a decision carried it.** A sweep's checkout or found path was
missing from the **brief**, so writers searched the whole disk for it and fetched it again (#23, #24). The brief's rule
is that a sweep's facts ride only as a decision's **grounds**, so a fact with no decision attached had nowhere to go.
Every dispatch in one run read a stale checkout, and the human answered a fork on outdated counts (#24).

**Live credentials landed in dispatch records** (#17, #19; also #13, #18). From there they reached the **trace** and
the notes: passwords, private keys, storage keys, webhook tokens. The plugin's only redaction rule binds the brief.

**A put-back paid for the whole write again.** A continued spec writer rewrote its document whole instead of patching
it (#24). A cold writer was dispatched where continuing the old one would have worked, and spent 17 minutes rebuilding
context (#28). One writer tore down its prototype before a report whose open forks guaranteed a **put-back** (#28).

**Forks offered roads nobody had tried.** The human chose a road the writer had never seen work, and it failed (#26).

**Stage 4 has no loop.** The tickets writer found the spec wrong, and the epic was handed over anyway (#16), or every
ticket was rewritten after the hand-over (#6). Today's stage 4 is still one dispatch and done. "Every story covered" was
asserted without the per-story check behind it (#26). A blocker outside the ticket set, a pending change request, was
refused by the forge as a native link, and the ticket was written twice (#28).

## Solution

Three files change: the refine skill, `spec-writer` and `tickets-writer`. All three changes are prose.

- **The refine skill:**
  - checks the premises behind each question round, not just its questions;
  - sends every question of a round in one message;
  - closes stage 1 on a glossary bar, and names the one-repository bound in round 1;
  - fetches the default branch at open, and names the base ref in every dispatch;
  - sends sweeps that each carry one question, know their siblings and the environment, write their report to a file
    the brief names, and work inside one shared set of bounds;
  - puts writers back by continuing them, so the put-back is a patch;
  - gives stage 4 the same loop stage 3 has.
- **The two writers** share the same bounds, and both patch in place when continued.
- **The spec writer** marks every road it offers as proven or unchecked, and names a fourth kind of fork.
- **The tickets writer** maps every story to its tickets, reports where the spec is wrong, and puts an external blocker
  in the ticket body.

## User Stories

### Asking

1. As a human being grilled, I want every option I am recommended to rest on a premise that was checked where one look
   or a sweep could check it, so that I do not decide on a fact a writer later kills.
2. As a human being grilled, I want a question whose recommended answer rests on a fact a sweep is still out to find to
   wait for that sweep, so that I am never asked the same decision twice.
3. As a human being grilled, I want the full reach of a removal found before I am asked about it, so that one subject
   costs me one question round and not three.
4. As a human being grilled, I want every question of a question round in front of me at once, however many calls that
   takes, so that one frontier costs me one wait.
5. As a human being grilled, I want questions of fact settled by the run instead of put to me, so that I only spend time
   on decisions.
6. As a human being grilled, I want to hear in the first question round that an epic delivers into one repository, so
   that where the code lives never becomes a decision I make and then unwind.
7. As a human closing stage 1, I want every term my decisions rely on to be in the glossary or listed in the brief as
   missing, so that no term comes back as a fork after stage 1 is over.
8. As a human answering a fork, I want the counts and facts in front of me to be read at the current default branch, so
   that I am not deciding on a stale checkout.

### Sweeps

9. As an orchestrator, I want each sweep to carry exactly one question of fact, so that no fact queues behind a slower
   one inside the same dispatch.
10. As an orchestrator, I want each sweep to know the subjects of the sweeps already in flight, so that two sweeps never
    close the same fact.
11. As a sweep that runs into a sibling's subject, I want to report the collision rather than close it, so that the
    orchestrator decides whether a second look is owed.
12. As a sweep, I want to be handed how the environment is reached once an earlier report has established it, so that I
    do not rediscover which context or credentials path works.
13. As a writer, I want the same environment facts the sweeps were handed, so that I do not rediscover them either.
14. As an orchestrator waiting on sweeps, I want to end my turn and let their notifications wake me, so that no dispatch
    is spent as a timer.
15. As a sweep, I want to write my report to a file named from the epic's slug, so that what I found outlives my
    context.
16. As a sweep that cloned or checked something out, I want to keep that copy and name its path and ref in my report, so
    that a writer opens it instead of fetching it again.
17. As a writer, I want the brief to list every sweep's report file by path, so that I can rely on what a sweep found
    without fetching it again.
18. As a writer whose own first-hand look disagrees with a sweep's report, I want my own look to win and the
    disagreement to go to my report, so that a stale sweep fact never reaches the spec.
19. As an orchestrator, I want the brief to carry sweep report files only by path, so that it stays free of a section
    of established facts.
20. As a sweep, I want my own scratch copy under the temporary directory and never a shared or named path, so that no
    sibling deletes the tree I am reading.
21. As a human whose machine the run used, I want every sweep and writer to report with nothing left running, and to
    leave the host as it found it or name what it left, so that no binaries or processes pile up after the run.
22. As a human whose live systems a sweep can reach, I want every sweep and writer to write nothing to a live system,
    so that fact-finding never changes production.

### Secrets

23. As a human whose repository and environment hold credentials, I want every sweep and both writers to read config by
    key and never print a secret's value, so that no credential lands in a dispatch record, a trace or the notes.
24. As a dispatch comparing a secret, I want to compare it by hash or by length, so that I can settle the question
    without the value ever appearing.
25. As a human, I want no dispatch to use a credential it finds, so that a key found in a repository never
    authenticates against a device.
26. As a maintainer, I want the secrets rule worded the same way in the sweep dispatch and in both writer contracts, so
    that one wording changes in one review.

### The brief and the base ref

27. As an orchestrator opening a run, I want to fetch the default branch first, so that every reading starts from the
    remote's current state.
28. As a sweep or a writer, I want my dispatch to name the base ref I read at, so that I read at the same point as
    every other dispatch.
29. As a resumed run, I want the sweep report files the brief lists to still be on disk where it says, so that resume
    works as well as a first run.

### Put-backs

30. As an orchestrator putting a stage back, I want the skill to name continuing the writer as the mechanism, so that I
    do not dispatch a cold writer where the old one is still addressable.
31. As an orchestrator, I want a cold dispatch only where continuing fails or brings no report, so that a put-back's
    cost stays a patch.
32. As a continued spec writer, I want to edit the published spec in place, so that a put-back costs the change and not
    the whole document.
33. As a continued tickets writer, I want to edit the published tickets in place, so that a put-back keeps their
    numbers and costs the change alone.
34. As a cold writer, I want to be told that writing the document whole is what a cold dispatch does, so that I know
    when a whole write is the right move.
35. As a writer whose report still carries open forks, I want to keep my prototype until those forks close, so that the
    put-back does not pay to build it again.

### The spec writer's forks

36. As a human answering a fork, I want every road it offers marked as proven or unchecked, so that I never choose an
    untried road without knowing it.
37. As a spec writer, I want a decision my reading raised that the brief never addressed to count as a fork, so that I
    know how to carry it.
38. As a spec writer, I want such a fork to close on grounds I hold, or else stay open, the same as a fork the brief
    left open, so that I neither escalate a decision I can ground nor close one I cannot.

### Stage 4

39. As a tickets writer, I want a report line for every place the spec is wrong, so that a spec defect reaches a human
    instead of being worked around in silence.
40. As an orchestrator holding a tickets report that names a spec defect, I want to close any fork it raises with the
    human in one question round, so that stage 4 holds forks the same way stage 3 does.
41. As an orchestrator, I want to put stage 3 back with the answers and then stage 4 back with the corrected spec, so
    that the spec stays the record and the tickets are cut from it.
42. As a human, I want the epic handed over only once no spec defect the tickets writer named is still open, so that I
    never receive an epic whose tickets disagree with its spec.
43. As a human reading the task list, I want a stage 4 put-back to flip its task back to `in_progress` the same way a
    stage 3 put-back does, so that the window shows what is running.
44. As an orchestrator, I want the corrected tickets report taken through the same loop, as often as the writing needs,
    so that a correction that raises a new defect is held like the first one.

### The tickets writer's coverage and blockers

45. As a human, I want the tickets writer's report to map every user story to the tickets that cover it, so that "every
    story covered" can be checked in one look.
46. As a tickets writer, I want that mapping to be the output of step 3's per-story check, so that the report line is
    never asserted without the check behind it.
47. As a tickets writer meeting a blocker outside the ticket set, such as a pending change request, I want to name it in
    the ticket body by its link and never as a native blocking edge, so that the forge never refuses the ticket.
48. As a human, I want every external blocker named in the tickets writer's report, so that I know what the set waits
    on beyond itself.

### Maintainers

49. As a maintainer, I want every touched skill and agent file read against the writing-for-agents guidance before
    merge, so that the new prose holds the register the files are written in.
50. As a maintainer, I want the spec writer's changes measured on the bench against the current agent, so that I can
    see whether a put-back wave now patches.
51. As a maintainer, I want one hand-driven refine happy-path run after the skill changes, so that the question calls,
    the sweep report files and the brief's paths are seen working end to end.

## Implementation Decisions

### The refine skill

- **The per-round checklist covers premises.** Stage 1's step 1 — telling each frontier question's kind — also
  takes, for a decision, the load-bearing premise behind every option it recommends. That premise is a question of
  fact, and it goes through the same mechanical bar. One look settles it now. A thread goes out as a sweep, and the
  decision waits on that sweep under step 2's existing hold. The completeness of a removal's reach is such a premise:
  "nothing else depends on this" is a fact to find before the question is asked.
- **A question round is one message.** **Asking** says that every call of a question round goes out in the same
  message, before any answer is waited on. A frontier wider than four questions is still one question round and one
  wait. The skill's prose says "question round" wherever it now says "round" for the human's questions, following the
  glossary.
- **Stage 1's opening names the one-repository bound**, and its done bar gains a term rule. The first question round
  says that an epic delivers into this one repository. Stage 1 is not done until every term a settled decision relies
  on is in the glossary or listed in the brief as missing. A repository fact such as the next ADR's number stays a
  mechanical question, as the existing bar already says.
- **The base ref.** The run fetches the default branch as it opens, before stage 1, and every dispatch carries the base
  ref it reads at, sweeps and both writers alike. Fetching does not move the checkout and pulls nothing.
- **A sweep carries one question of fact.** "One subject each" is tightened so that a subject is one question of fact,
  following the glossary's **Sweep**. A dispatch that would list several numbered points is several sweeps.
- **What a sweep dispatch carries gains four things**, beside the subject, the first-hand rule and what it owes back:
  - the subjects of the sweeps already in flight, with the rule to report a collision rather than close it;
  - the environment facts an earlier report established, such as how a cluster or service is reached;
  - the host bounds;
  - the secrets rule.

  Writers' dispatches carry the environment facts too.
- **A sweep's report is a file.** The sweep writes it to the OS temporary directory as
  `<epic-slug>-sweep-<n>.md`, keeps any clone or checkout it made, and names that copy's path and ref in the report.
  The brief's artifacts list names every sweep report file by path, beside the paths it already lists. The brief still
  carries no section of established facts. A writer may rely on a report file without fetching what it describes
  again, and where its own first-hand look disagrees, its own look wins and the disagreement goes to its report.
- **No dispatch as a timer.** **Sequencing**'s rule that a `sleep` or a poll stands in for no report is extended to a
  dispatch spent only on waiting. The orchestrator ends its turn and is woken by the notifications.
- **A put-back continues the writer.** Stage 3's step 3 names the host's mechanism for continuing a dispatch by its id,
  and says a cold dispatch is the fallback when continuing fails or brings no report. The put-back message names what
  changed and points at the brief on disk rather than restating it.
- **Stage 4 gets stage 3's loop.** When the tickets writer's report names a spec defect, the orchestrator:
  1. closes any fork that defect raises with the human in one question round;
  2. puts stage 3 back carrying the answers;
  3. puts stage 4 back carrying the corrected spec's location;
  4. takes the corrected report through the same loop.

  Stage 4 is done when no defect the report names is still open. **Progress** flips stage 3's task and stage 4's task
  back to `in_progress` the same way it does for a stage 3 put-back today. **What to report** gains a line for every
  spec defect the tickets writer raised, and how it was closed.

### The shared bounds

There are two rules, each written once and copied word for word into the sweep dispatch's carry-list, `spec-writer`
and `tickets-writer`.

- **Secrets.** Read configuration by key and never print a secret's value. Compare a secret by hash or by length. Never
  use a credential you find to authenticate against anything. The brief's existing redaction line stays as it is.
- **Host bounds.**
  - Work in your own scratch copy under the OS temporary directory, never in a shared or named path, and never in the
    workspace root.
  - Report with nothing of yours still running.
  - Leave the host as you found it, or name in your report what you left.
  - Write nothing to a live system.
  - A writer keeps its prototype and scratch copy while its report carries open forks.

  A sweep's kept clone (above) is a named thing it left, so it appears in its report.

### `spec-writer`

- **A put-back clause.** A continued dispatch edits the published spec in place. Only a cold dispatch, including
  **Resume** finding a spec already published, writes it whole.
- **Fork roads carry their evidence state.** Every road a fork offers, open or recommended, is marked *proven* (the
  writer saw it work: a prototype ran, a test passed, the code already does it) or *unchecked*. This holds in the spec's
  Further Notes and in the report.
- **A fourth origin.** **Forks** names a decision the reading raised that the brief never addressed as a fork in its
  own right. It closes the same way as a fork the brief left open: on any grounds the writer holds, otherwise left open.
  A consequence of an answer the dispatch carried is written up as the decision it follows from, not escalated.
- The shared bounds and the base ref are read and honoured, and so are the sweep report files listed in the brief.

### `tickets-writer`

- **A spec-defect report line.** Every place its reading found the spec wrong (a mechanism that would not achieve what
  the spec intends, a decision the code makes impossible) goes to the report with what it found. It is not worked
  around silently in the tickets.
- **A put-back clause.** A continued dispatch edits its published tickets in place and keeps their numbers. Only a cold
  dispatch writes a ticket whole, and **Resume**'s fixed numbers still hold.
- **A story map.** Step 3's coverage bar produces an explicit mapping from every user story number to the ticket
  numbers that cover it, and the report carries that mapping in place of today's one-line coverage assertion. An
  uncovered story is still named with why.
- **External blockers.** A blocker outside the ticket set, such as a pending change request or another epic's ticket, is
  named in the ticket body by its link. It is never a native blocking link and never a **blocking edge**, and every
  one goes to the report.
- The shared bounds and the base ref apply here too.

### The glossary

**Question round** and **Put-back** are already landed, and **Sweep** now says that a subject is one question of fact.
No ADR changes. The orchestrator still forms no judgement (ADR 0015): checking a premise is settling a question of
fact, and a put-back is still one move whether continued or cold. A sweep's report file is not a state file
(ADR 0013), because no run reads its position from it.

## Testing Decisions

Nothing here is covered by CI: every change is prose. A good check here looks at what a run or a dispatch visibly did,
such as the calls in one message, the files on disk, a wave's output tokens or a report's lines. It never asks whether
the prose reads as intended. No new seam is proposed. The three existing ones are:

- **The writing-for-agents read.** The refine skill, `spec-writer` and `tickets-writer` are each read against
  `/mattpocock-skills:writing-for-agents` before merge. That read checks that the copied secrets and host-bounds rules
  are identical across the three files.
- **The bench** (CONTRIBUTING.md § The bench). Two arms, `current` against `before=<main>:plugin/agents/spec-writer.md`,
  with `--waves 1` on the existing fixture. Two things are read off the arms. First, the put-back wave's output tokens
  in each arm's `wave-1.md` and `reading.json`: the current arm should patch, and come in well under its own
  first-dispatch output. Second, whether every fork road in each arm's first report carries *proven* or *unchecked*.
  Under the bench's caveat, arms are compared only with each other.
- **One refine happy-path run, driven by hand** (CONTRIBUTING.md § The end-to-end tests). The test's existing
  assertions must still pass. Its session record and debrief are then read for four things:
  - every question round with more than four questions went out as several calls in one message;
  - each sweep's report file exists under the temporary directory;
  - the brief lists those files by path;
  - every dispatch carries the base ref.

  The fixture may not raise a frontier wider than four questions or a spec defect in stage 4. Where it raises neither,
  the report says so and that behaviour is left for the next observed debrief rather than forced.

Prior art: `docs/specs/idp-scaffold-defects/` verified its prose changes the same way, reading them against the guidance
and confirming them in the next observed run.

## Out of Scope

- **Findings seen only in runs on the old commit, where today's text already has an answer**: 1.1 (asking while a sweep
  is in flight), 1.3 (re-asking settled ground), 3.3 (system facts stated as context), 3.4 (contradicting decisions in
  the brief, now step 4's collision trace), 3.6 (slug renames), 3.7 (ADRs landed early, and stage 1 artifacts left
  uncommitted, now stage 5), 4.3 (writers that stopped short of writing), 4.5 (prototype cost), 5.4 (operations epics)
  and 5.5 (placeholder references).
- **The spec writer's conformance loop (4.1).** The rule survived the restructure unchanged, but none of the eleven runs
  on current code showed the loop. It waits for one that does.
- **The task-list findings (§7).** They are seen only in old runs, and the phantom stage 5 task in #19 is now stage 5's
  own task.
- **Host-level waste (§9)**: large files dumped whole, the 120-second tool timeout, and `disable-model-invocation`
  making the human re-type the command. No plugin file owns them.
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

### Established during the grilling

On this host, four question calls sent in one message all reached the human before any answer came back, so "every
call of a question round goes out in one message" can be done as written.

### Load-bearing behaviour this change must not disturb

- A question that does not turn on a sweep's subject is still asked now. A premise check holds only the question whose
  premise is in flight.
- The brief carries no section of established facts. Sweep report files ride by path.
- A sweep is still one subject each, and the first-hand rule still binds it.
- A writer's own first-hand look still decides every **claim**.
- Stage 5 still commits only the paths the refinement wrote. Sweep report files live in the temporary directory and are
  never committed.
