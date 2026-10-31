# What twenty-five build debriefs exposed: a delivery that learns nothing between dispatches

Status: ready-for-agent

## Problem Statement

A human ran `/deliverer:build` twenty-five times across three projects, on four plugin commits from `b00203120648` to
`a7333959daf3`, and the **observer** left a **debrief** of each. Seventeen were judged and named 79 **defect**s between
them. Read against the plugin as it stands at `a7333959daf3`, about half of those are already gone: every run that
grounded the polling cadence, the burst of refused posts, the cold **fix wave** and the uncommitted refinement output
predates the commit that fixed it. What remains is grounded on runs at or near head, and it has one shape: **a delivery
pays for the same work more than once, because nothing a dispatch learns reaches the next one, and nothing a dispatch
proves reaches the reader.**

**Every implementer rediscovers what the one before it found.** Whether the project marks a ticket delivered is
searched for by every `implementer` of the run — eight times in one (#23), and on every ticket of #24 and #25 — and is
usually absent, which every one of them rediscovers. A shared test cluster another session held was re-checked by every
implementer and the first fix wave (#20). A CI block only a human could clear was rediscovered five times (#25), and a
procedure one dispatch found — "confirm teardown, then rerun" — reached the next as a warning, which then paid the same
22-minute stall. The only channel between dispatches is the **gates** account, it goes to implementers and fix waves
only, and the **assumption-reviewer** in #20 posted a wrong **directive** because it did not know which files a gate
leaves uncovered.

**A demonstration made in stage 1 has nowhere to go.** An implementer runs the proof, the timing or the probe pair its
ticket asks for, and its commit and **report** have no slot for what that showed. `change-request-creator` writes the
description's evidence from commit messages, `spec-reviewer` correctly posts each one as missing, and a fix wave runs
every demonstration again: 18 **spec finding**s in #23, 3 in #24, 7 and six probe pairs redone in #25. Where a report
did say a gate passed, it sometimes said more than its records show — a full-suite pass served from cache reported as
watched (#20, #25) — and the orchestrator passed it on.

**A fix wave has no exit and no checkpoint.** "Drive the checks green" has no case for a **check** red for a cause no
commit on the branch can clear: a wave outwaited a third-party outage for 37 minutes after its work was done (#6), and
re-ran a CI block no rerun could clear (#25). It commits only once every comment is worked, so an interruption lost the
whole of a wave and left its edits in the tree (#11). It reads the **verdict**s on a finding's lines only after it has
fixed it, so a wave built and pushed a fix that a standing `accept` had already ruled out, then reverted it, at about 15
minutes of CI (#23). And it rewrote the change request's description that stage 9 then rewrote again (#19).

**Nobody checks that the change request can merge.** #1 flipped a conflicting change request ready and its human spent
17 minutes fixing it. In #20 the change request conflicted from stage 3 to stage 5, so no check ran, and three of the
four spec findings were about checks that had not run. In #23 the default branch moved mid-delivery and turned a check
red, and the next wave spent its first turns working out what broke.

**GitLab's commit anchor stores no anchor.** The worked example for an **assumption comment** anchored at the commit
that recorded it is a bare `commit_id`. GitLab accepts it and stores nothing positional, so every time it was used it
led to a post, a delete and a repost, or to the anchor being written into the body (#3, #6, #12, #13). And the anchoring
ladder has no rung that always holds: where the file is not in the diff at all, both the file-level and the commit
anchor are refused, and in #20 one assumption was never posted and so never adjudicated.

**A round polls twice at once.** Both **round**s of #23 sent two identical status **poll**s in one turn, and #20 did
the same. Each poll now holds for up to 50 seconds, so a parallel duplicate holds a second wait for nothing.

**Every agent mishandles a long wait, a large file and a secret the same way.** A sleep loop beside a job already in the
background burned 26 turns (#12); a blocking wait ran on after the completion notice arrived, leaving a failed **gate**
unread for nine minutes (#24); two 600-second blind waits happened twice (#25). Whole files were dumped through the
shell and then read again (#8, #9), and a 44 KB spec was read three times because the first output was persisted rather
than shown (#25). Agents re-measured line widths while still editing (#11, #13). Credentials found in a repository were
used literally in commands, twice, and now sit in the run's record (#15) — and refine has the same gap.

## Solution

Seven changes, all of them prose in the plugin's agents and skills. No Node code moves.

### 1. A round polls once per turn

`code-reviewer`'s poll step says one status call at a time: never two in one turn, because each one holds.

### 2. One working-habits rule, in every agent and both skills

One wording, repeated verbatim in all nine agent definitions and both skills:

- **A long wait is backgrounded.** Work that takes minutes runs in the background and its completion notice wakes the
  agent; before waiting again, it reads the state of what it is waiting on, so a wait never outlives its answer.
- **A large file is read once, in ranges.** A file or a persisted output too big to show is read with the file-reading
  tool in ranges, never dumped through the shell and then read again.
- **Measure once, after the last edit.** Widths, counts and conformance are measured once the text is final, never
  between edits.
- **A secret is never used or shown.** A credential found in the repository is never printed, never interpolated into a
  command and never used to authenticate: it is reported, and the agent goes on without it.

### 3. Every assumption comment lands, on GitLab too

- The commit-anchor rung's GitLab example becomes a positional `text` form against the recording commit's own diff —
  base and start at that commit's parent, head at the commit — in place of the bare `commit_id`.
- A fourth rung joins the ladder below it, and it always holds: a general comment on the change request, carrying the
  entry's `file:` and `line:` in its body. It is the anchor of last resort for an entry no other rung accepts, an entry
  whose file the diff never carries among them.
- The claim that the file-level form covers a file the diff never touched is corrected: it covers a file the diff
  carries, at a line the diff does not.

### 4. A fix wave checkpoints, checks the verdicts first, and knows where it stops

- **It commits and pushes each piece as it lands**, the way an implementer does, in place of one commit at the end.
- **It reads the verdicts on a finding's lines before working it**, resolved `accept`s included. A finding a standing
  verdict already ruled out is declined on that verdict's **grounds**, or handed off where the finding argues the
  verdict is wrong — before any code is written. The reread of verdicts a fix outdates stays where it is.
- **A check red for a cause outside the branch is a hand-off.** Where no commit on the branch can clear it — a
  third-party outage, a block only a human can lift — the wave names the check and the cause on its **hand-off** list
  and stops waiting on it.
- **The change request's title and description are stage 9's.** A fix wave never edits them.

### 5. A demonstration is recorded as evidence on its commit

- Implementer and fix-wave commits gain an `Evidence:` section beside `Assumptions:` and `Gates:`: one numbered entry
  per demonstration the ticket or spec asks for — what was run, what it showed before and after, and whether it was
  observed in this dispatch or served from cache. Routine green gates get none. The section goes where there were no
  demonstrations, as the other two do.
- `change-request-creator` mirrors those entries into the description's evidence, each one marked as reported rather
  than observed — it did not watch it run.
- A report that says a gate passed says whether the dispatch watched it run or it was served from cache.

### 6. The orchestrator reads whether the change request can merge

- After stage 2 the orchestrator reads, mechanically, whether the change request is mergeable and what its checks read.
- Where it conflicts with the default branch, a `comments-addresser` goes out before stage 3 on a brief that names the
  conflict and nothing else. That **conflict dispatch** merges the default branch in — a merge commit, never a rebase or
  a force-push — pushes, and drives the checks, and collects, marks and resolves no comment: the assumption comments
  are not yet adjudicated. It is no fix wave, and stage 6 is still the first.
- Stage 10's bar gains mergeability: a change request that cannot merge stays a draft, with the conflict as a hand-off.
- A check the orchestrator read red goes into the next dispatch's brief as a fact, so the dispatch does not rediscover
  it.

### 7. The ledger replaces the gates account

- The **ledger** is the mechanical facts the run's dispatches have established so far: the gates that bit and what
  satisfied them, where the toolchain lives and how it was obtained; a convention found or found absent; a fact about
  the environment; a third-party artefact and where it already sits. The orchestrator's own mechanical findings — an
  uncommitted file, a check read red, a conflict — join it.
- Each entry is a **claim** carried with the one look that checks it — a path to read, a command to run — so "never
  trust unrun" costs one call rather than a search. A convention found present is cited by where it lives and never
  restated, so conventions are still read first-hand; a convention found absent is carried as absent, which is the
  rediscovery the ledger exists to stop. A procedure is carried as ordered, quoted steps.
- It goes to every implementer after the first, every fix wave and the conflict dispatch, `assumption-reviewer` and
  `spec-reviewer` — every dispatch that runs commands. `code-reviewer` and `change-request-creator` get none.
- Every one of those agents' reports gains a slot for the facts it established, in that shape, which is what the
  orchestrator adds to the ledger.

## User Stories

1. As a human paying for a delivery, I want a review round to hold one poll at a time, so that no round pays for a
   second wait it cannot use.
2. As a `code-reviewer`, I want my poll step to say one status call per turn, so that I do not send a duplicate on the
   turn the host would let me.
3. As a human, I want every agent to background a long job and be woken by its completion, so that no dispatch burns
   turns sleeping beside work that will tell it when it is done.
4. As a human, I want an agent to read the state of what it waits on before waiting again, so that a failed gate is
   read when it fails rather than minutes later.
5. As a human, I want an agent to read a large file once, in ranges, so that a run does not pay for the same bytes
   twice.
6. As a human, I want an agent that lands a persisted output to read that output rather than fetching it again, so that
   a large spec is read once per dispatch.
7. As a human, I want every agent that edits text to measure it once, after the last edit, so that no dispatch loops
   between rewrapping and remeasuring.
8. As a human whose repository holds a credential, I want no agent ever to use, print or interpolate it, so that it
   never lands in a command, a commit or the run's record.
9. As a human, I want a credential an agent found reported to me, so that I know it is there and can deal with it.
10. As a maintainer, I want the working-habits rule worded identically in every agent and both skills, so that one
    change to it is one wording to change.
11. As a human delivering into GitLab, I want an assumption comment that cannot sit on head's diff anchored at the
    commit that recorded it, in a form GitLab stores, so that it sits on that commit's code rather than nowhere.
12. As a `change-request-creator`, I want a GitLab example for the commit anchor that works, so that I do not post,
    delete and repost to find one.
13. As a human, I want every assumption the tickets recorded to reach the change request as a comment, so that no fork
    ships unadjudicated because no anchor would take it.
14. As a `change-request-creator`, I want a last rung that always holds, so that an entry about a file the diff never
    carries is still posted.
15. As a human reading a general assumption comment, I want it to name the file and line it is about, so that I can
    find the code without an anchor.
16. As a `change-request-creator`, I want the file-level anchor described as covering what it actually covers, so that
    I do not try it on a file the diff never carried.
17. As a human whose fix wave is interrupted, I want everything it finished already on the remote, so that the next
    wave starts from the last piece rather than from nothing.
18. As a fix wave, I want to commit each piece as it lands, so that my edits never sit in the tree where a round may
    read them.
19. As a human, I want a fix wave to read the verdicts on a finding's lines before it writes code, so that it never
    builds a fix a standing `accept` already ruled out.
20. As a fix wave, I want a finding a standing verdict already decided declined on that verdict's grounds, so that the
    human sees why it was not implemented.
21. As a human, I want a finding that argues an accepted verdict is wrong handed to me, so that a settled fork is only
    reopened by someone who can ratify it.
22. As a human, I want a fix wave to hand off a check red for a cause no commit can clear, so that a delivery does not
    sit waiting on an outage or a block only I can lift.
23. As a human reading the report, I want that hand-off to name the check and its cause, so that I know what to clear.
24. As a human, I want a fix wave never to touch the change request's title or description, so that the description is
    written once, by the stage that owns it.
25. As a human reading a change request, I want every demonstration its tickets asked for recorded with what it
    showed, so that I can judge the work without running it again.
26. As an implementer, I want a commit section for the demonstrations I made, so that what they showed is on the branch
    even when my report does not arrive.
27. As a fix wave, I want the same section on my commits, so that a demonstration a spec finding asked for is recorded
    where the next reader looks.
28. As a human, I want each evidence entry to say whether it was observed in that dispatch or served from cache, so
    that a cached pass is never read as a watched one.
29. As a `change-request-creator`, I want to mirror the evidence entries into the description, so that its evidence
    comes from what was recorded rather than from commit messages.
30. As a human reading the description, I want mirrored evidence marked as reported, not observed, so that I know who
    watched it run.
31. As a `spec-reviewer`, I want the evidence a ticket asked for on the branch, so that I do not post it missing when it
    was made.
32. As a human, I want routine green gates kept out of the evidence, so that what the section holds is what was asked
    for.
33. As a human, I want the change request's mergeability read right after it opens, so that a conflict is cleared
    before anything is adjudicated or reviewed on checks that never ran.
34. As a human, I want a conflict with the default branch cleared by a merge commit, so that the branch's history and
    every anchor on it survive.
35. As a human, I want the dispatch that clears a conflict to leave every comment alone, so that unadjudicated
    assumptions are not marked as hand-offs before they are adjudicated.
36. As a human, I want a change request that cannot merge left a draft, so that I am never handed a ready change
    request I must fix before merging.
37. As a human reading the report, I want that conflict named as a hand-off, so that I know why it stayed a draft.
38. As a dispatch after the default branch moved, I want a check the orchestrator read red in my brief, so that I start
    on the cause rather than on finding that something broke.
39. As an implementer, I want to be told whether the project marks a ticket delivered, so that I do not search for a
    convention an earlier ticket already found absent.
40. As an implementer, I want a convention an earlier dispatch found present pointed at where it lives, so that I still
    read it first-hand.
41. As a dispatch, I want each carried fact paired with the one look that checks it, so that I can trust it after one
    call instead of rederiving it.
42. As a dispatch, I want environment facts — a shared resource another session holds, a hook that cannot run, a bind
    mount — carried, so that I do not rediagnose them.
43. As a dispatch, I want a third-party artefact an earlier dispatch fetched carried with where it sits, so that I do
    not fetch it again.
44. As a dispatch, I want a procedure an earlier dispatch found carried as ordered steps, so that its order survives the
    hand-over.
45. As an `assumption-reviewer`, I want the ledger, so that a directive I post rests on what a gate does and does not
    cover.
46. As a `spec-reviewer`, I want the ledger, so that I read the change request with what the run already knows about
    its checks and its environment.
47. As a fix wave, I want the ledger rather than the gates account alone, so that I start warm on everything stage 1
    established.
48. As an orchestrator, I want my own mechanical findings in the ledger, so that what I settled reaches the dispatches
    after me.
49. As an orchestrator, I want each report to carry its established facts in the ledger's shape, so that adding them is
    copying rather than judging.
50. As a maintainer, I want the ledger kept to mechanical facts as claims, so that it never carries a judgement about
    the work from one agent to another.
51. As a maintainer, I want `code-reviewer` and `change-request-creator` left without the ledger, so that the two agents
    that run no gate are not carried what they never use.

## Implementation Decisions

### Modules touched

- **`code-reviewer`** — the poll step.
- **Every agent definition and both skills** — the working-habits rule.
- **`change-request-creator`** — the anchoring ladder and its GitLab examples; the evidence mirror; the description it
  writes in stage 2 and stage 9.
- **`comments-addresser`** — its steps (per-piece commits, the verdict read moved ahead of the work, the outside-cause
  hand-off), the conflict dispatch, the description rule, the `Evidence:` section, its report's ledger slot.
- **`implementer`** — the `Evidence:` section, the cached-or-observed wording on gates, its report's ledger slot.
- **`assumption-reviewer` and `spec-reviewer`** — the ledger in what their prompt may carry, and their reports' ledger
  slot. `spec-reviewer` also reads the evidence section as the record of what was demonstrated.
- **The build skill** — Dispatch (the ledger replaces the gates account), stage 2 (the mergeability read and the
  conflict dispatch), stage 10 (mergeability in the bar), and What to report.
- **The glossary** — **Ledger** and **Evidence** are added, and **Dispatch** names its two exceptions; all three are
  already in place.

### The poll

- One sentence in step 4: one call at a time, never two in one turn — a poll holds, so a second one holds a second
  wait. Nothing about the server's bounds moves.

### The working-habits rule

- One block, identical wherever it appears, under the "one wording per shared rule" convention. Each skill and agent
  places it where its own instructions on working sit; the wording does not bend to the place.
- It names no host, no tool timeout and no command. "The file-reading tool in ranges" is the instruction; the host's
  tool name is not.
- The secrets line covers what the agent finds in the repository, its environment files included, and binds every
  agent of both phases.

### The anchoring ladder

- The ladder grows from three rungs to four. Rung 3 keeps its meaning — the commit the prefix names — and its GitHub
  example; its GitLab example becomes the positional `text` form against that commit's own diff. Rung 4 is the general
  comment on the change request, whose body opens with the same `ASSUMPTION (<hash>)` prefix and carries the entry's
  `file:` and `line:`.
- The positional form is a claim until it is checked against a real GitLab merge request, before the example ships —
  **Testing Decisions** says how. Where GitLab does not store it, rung 3 on GitLab is the general comment and the
  example says so.
- An assumption comment anchored at rung 3 or 4 is one the orchestrator already carries into its report as "anchored
  anywhere but at a translated line on head"; that rule is unchanged and now covers rung 4 too.

### The fix wave

- Steps 4 to 6 interleave as the implementer's step 3 does: each comment's fix, its gates, then its commit and push,
  before the next. The mark step stays after, because a mark names the commit that did the work.
- The verdict read moves to the front of step 4's loop: before a finding is worked, every assumption comment on the
  lines it would touch is read, resolved ones included. The existing rule for a verdict a fix outdates is unchanged.
- Step 8 gains its exit: a check red for a cause outside the branch, named with that cause, goes on the hand-off list,
  and the step is done. A check red for anything on the branch is still the wave's, however it got red.
- The conflict dispatch is a named case at the top of the agent: a brief naming a conflict with the default branch and
  nothing else. It runs only steps 1, 2, the merge, its gates, its push and step 8, and its report says it collected no
  comment.

### Evidence

- `Evidence:` follows `Gates:` in both commit formats, numbered as they are, and goes when empty. An entry names what
  was run, what it showed before and after, and `observed` or `cached`.
- The creator's mirror reads `Evidence:` the way it reads `Assumptions:` — the section runs to the next `<Word>:` line
  — but from every commit, a fix wave's included, since evidence needs no adjudication. It writes them into the
  description, marked reported rather than observed.

### Mergeability

- A mechanical read in the orchestrator's sense: one look at the forge for whether the change request can merge, and
  at its checks. It happens after stage 2's report and again at stage 10.
- A conflict found after stage 2 sends out the conflict dispatch and is read again once its report is in. A conflict
  that remains after it is a hand-off, and the run goes on — stages 3 to 9 still have work to do on a draft.
- A conflict found at stage 10 leaves the change request a draft with the conflict as a hand-off. No conflict dispatch
  goes out there: the run is over.

### The ledger

- It replaces the gates account in the build skill's Dispatch section, under the same rule that it is an account of
  what a dispatch established, not a channel for judgement — the sentence that conventions are read first-hand stays,
  narrowed to conventions found present.
- An entry's shape: the fact, the one look that checks it, and which dispatch established it. The orchestrator adds the
  report's entries as they came and forms no view on them.
- What to report is unchanged by it: the ledger is a brief's, not the human's.

## Testing Decisions

Nothing here is covered by CI: typecheck and lint run over the plugin's Node code, which this change does not touch. A
good check here asserts what a human or the next agent would see — a comment's stored anchor, a commit's sections, a
brief's contents, a debrief's figures — never how an agent phrased its reasoning.

- **The GitLab anchor forms, in a throwaway project.** In a scratch project under the owner's personal namespace on
  their GitLab instance, one merge request of two commits, the second moving a line the first added. Post an assumption
  comment at each of rung 1, rung 2, rung 3 (the positional form against the first commit's diff) and rung 4, then read
  every discussion back and confirm what each stored. Delete the project afterwards. This settles the rung-3 claim
  before its example ships.
- **One hand-run end-to-end build**, on the repository-tracker fixture (CONTRIBUTING.md § The end-to-end tests), read
  through its debrief and its records. It should show: no turn with two status polls; `Evidence:` sections on the
  commits where a ticket asked for a demonstration, and the description mirroring them as reported; the ledger in every
  brief after the first implementer's, a mark-delivered convention found absent carried as absent; the mergeability
  read after stage 2 and at the flip; fix-wave commits per piece. The fixture runs on GitHub, so it does not exercise
  the GitLab anchors; it will not conflict, so it exercises the read and not the conflict dispatch.
- **Every touched prose file read against `/mattpocock-skills:writing-for-agents`**, and the working-habits block
  diffed across all eleven files to confirm it is identical.
- **The next observed deliveries' debriefs** are the remaining seam — for the conflict dispatch, the outside-cause
  hand-off and the GitLab rungs on a real delivery.

## Out of Scope

- **Everything already fixed at head.** The polling cadence (the held poll), a burst of refused posts, the gates account
  reaching fix waves, the uncommitted refinement output, and the implementer's anchor read-back.
- **Hunches from older commits that never recurred at head:** `accept` on nearly everything (#6, #17), a wave adding
  unrequested scope (#6), baseline gate runs doubled (#1), a `review_id` collision (#13), round 2 costing as much as
  round 1 (#3). Left for a later debrief to ground.
- **A flip bar that requires a round on the head being flipped.** The last fix wave's commits still ship unreviewed by a
  round (#10); a third round per run is the price of changing it.
- **The stage-flow gaps:** an exit for a blocked ticket in stage 1, rules for question rounds in build, and running the
  first round before the adjudication (#6, #9, #10, #13, #15).
- **Gates scoped to what a piece touched.** A docs-only piece still runs the long end-to-end gate (#24).
- **Shell self-harm guards** — a pattern kill matching the agent's own shell, a heredoc running document text (#15,
  #17).
- **Carrying a fix wave's implemented lines forward to the next wave** (#2, #10, #17), and **listing the forks a fix
  wave closed in its report** (#3).
- **Shipping a line translator for anchors.** The translation step already in the contract postdates every run that
  hand-rolled one.

## Further Notes

### The source

The consolidated findings and the twenty-five debriefs behind them sit outside this repository, on the machine the runs
happened on; they name repositories and transcripts and are not for forwarding. Each finding above was sorted by the
plugin commit of every run that grounded it, and kept only where a run at or near head grounded it or the contract at
head still carries the gap. The parallel-poll hunch was grounded here by reading #23's own record: both rounds sent two
`code_review_status` calls in one assistant message.

### What this reverses

[idp-scaffold-defects](../idp-scaffold-defects/spec.md) put "carrying repository conventions between implementers, such
as whether the project marks a ticket delivered" out of scope, keeping them first-hand reading. Three runs on head
(#23–#25) searched for that convention on every ticket. The ledger reverses that call for a convention found absent,
and keeps it for one found present, which is still cited and read rather than restated.

### Load-bearing behaviour this change must not disturb

- The orchestrator forms no judgement ([ADR 0015](../../adrs/0015-the-orchestrator-forms-no-judgement.md)):
  mergeability and a check's state are mechanical reads, and the ledger's entries are carried as they came.
- The plugin names no forge ([ADR 0012](../../adrs/0012-the-plugin-names-no-forge.md)): the GitLab and GitHub forms
  stay worked examples of one mechanism, and the working-habits rule names no host.
- A fix wave's forks are still not mirrored and not adjudicated; only its evidence is.
- A round's prose still reaches a fix wave verbatim, and the declined findings with their grounds still travel.
