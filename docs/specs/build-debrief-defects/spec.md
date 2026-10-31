# What twenty-five build debriefs exposed: a delivery that learns nothing between dispatches

Status: resolved

## Problem Statement

A human ran `/deliverer:build` twenty-five times across three projects, on four plugin commits from `b00203120648` to
`a7333959daf3`, and the **observer** left a **debrief** of each. Seventeen were judged and named 79 **defect**s between
them. Read against the plugin as it stands at `a7333959daf3`, about half of those are already gone: every run that
grounded the polling cadence, the burst of refused posts, the cold **fix wave** and the uncommitted refinement output
predates the commit that fixed it. What remains is grounded on runs at or near head, and it has one shape: **a delivery
pays for the same work more than once, because nothing a dispatch learns reaches the next one, and nothing a dispatch
proves reaches the reader.**

**Every implementer rediscovers what the one before it found.** Whether the project marks a ticket delivered is
searched for by every `implementer` of a run — eight times in one, and on every ticket of two more — and is usually
absent, which every one of them rediscovers. A shared test cluster another session held was re-checked by every
implementer and the first fix wave. A CI block only a human could clear was rediscovered five times in one run, and a
procedure one dispatch found — "confirm teardown, then rerun" — reached the next as a warning, which then paid the same
22-minute stall. The only channel between dispatches is the **gates** account, and it carries what bit, nothing else.

**A demonstration made in stage 1 has nowhere to go.** An implementer runs the proof, the timing or the probe pair its
ticket asks for, and its commit and **report** have no slot for what that showed. `change-request-creator` writes the
description's evidence from commit messages, `spec-reviewer` correctly posts each one as missing, and a fix wave runs
every demonstration again: 18 **spec finding**s in one run, 3 and 7 in two others, six probe pairs redone in the last.
Where a report did say a gate passed, it sometimes said more than its records show — a full-suite pass served from
cache reported as watched, in two runs — and the orchestrator passed it on.

**A fix wave has no exit and no checkpoint.** "Drive the checks green" has no case for a **check** red for a cause no
commit on the branch can clear: a wave outwaited a third-party outage for 37 minutes after its work was done, and
another re-ran a CI block no rerun could clear. It commits only once every comment is worked, so an interruption lost
the whole of a wave and left its edits in the tree. It reads the **verdict**s on a finding's lines only after it has
fixed it, so a wave built and pushed a fix that a standing `accept` had already ruled out, then reverted it, at about 15
minutes of CI. And a wave rewrote the change request's description that stage 9 then rewrote again.

**Nobody checks that the change request can merge.** One run flipped a conflicting change request ready and its human
spent 17 minutes fixing it. In another the default branch moved mid-delivery and turned a check red, and the next wave
spent its first turns working out what broke.

**GitLab's commit anchor stores no anchor.** The worked example for an **assumption comment** anchored at the commit
that recorded it is a bare `commit_id`. GitLab accepts it and stores nothing positional, so in each of the four runs
that used it, it led to a post, a delete and a repost, or to the anchor being written into the body. And the anchoring
ladder has no rung that always holds: where the file is not in the diff at all, both the file-level and the commit
anchor are refused, and one assumption was never posted and so never adjudicated.

**A round polls twice at once.** Both **round**s of one run sent two identical status **poll**s in one turn, and
another run did the same. Each poll now holds for up to 50 seconds, so a parallel duplicate holds a second wait for
nothing.

**Every agent mishandles a long wait, a large file and a secret the same way.** A sleep loop beside a job already in the
background burned 26 turns; a blocking wait ran on after the completion notice arrived, leaving a failed **gate** unread
for nine minutes; two 600-second blind waits happened twice in one run. Whole files were dumped through the shell and
then read again, and a 44 KB spec was read three times because the first output was persisted rather than shown.
Credentials found in a repository were used literally in commands, twice, and now sit in the run's record.

**A round's prose can reach a fix wave rewritten, and nobody says so.** When a dispatch's hand-back matches the host's
instruction-shaped patterns, the host neutralises it and opens it with a flag line saying so. It did so, in three runs,
to **round** prose the build skill carries verbatim into a fix wave; the flag stayed with the orchestrator, and the fix
wave read the neutralised prose as the reviewer's.

## Solution

Eight changes, all of them prose in the build skill and the agents it dispatches. No Node code moves.

1. **A round polls once per turn.** `code-reviewer`'s poll step says one status call at a time, never two in one turn,
   because each one holds.
2. **One working-habits block** in the build skill and the five agents that run commands:
   - **A long wait is backgrounded.** Work that takes minutes runs in the background and its completion notice wakes
     the agent; before waiting again, it reads the state of what it waits on, so a wait never outlives its answer.
   - **A large file or a persisted output is read once, in ranges,** with the file-reading tool — never dumped through
     the shell and read again.
   - **A secret is never used or shown.** Configuration is read by key; a secret's value is never printed or
     interpolated into a command, and two secrets are compared by hash or length. A credential found in the repository
     authenticates nothing: it is reported, and the agent goes on without it.
3. **Every assumption comment lands, on GitLab too.** Rung 3's GitLab example becomes a positional `text` form against
   the recording commit's own diff — base and start at its parent, head at the commit. A rung 4 that always holds joins
   below it: a general comment carrying the entry's `file:` and `line:`. The file-level rung is described as covering a
   file the diff carries at a line it does not, not a file the diff never touched.
4. **A fix wave checks verdicts first, checkpoints, and knows where it stops.**
   - Before working a finding it reads every verdict on the lines it would touch, resolved `accept`s included. A finding
     a standing verdict already ruled out is declined on that verdict's **grounds**, or handed off where the finding
     argues the verdict is wrong.
   - It commits each piece as it lands, and pushes once its comments are worked.
   - A check red for a cause outside the branch is a **hand-off**, named with its cause, and the wave stops waiting on
     it. Outside means, mechanically: the same check is red on the default branch's head, or it failed before running
     any of the branch's code. Every other red check is the wave's.
   - It never edits the change request's title or description; those are stage 9's.
5. **A demonstration is recorded as evidence on its commit.** Implementer and fix-wave commits gain an `Evidence:`
   section after `Gates:` — one entry per demonstration the ticket or spec asks for: what was run, what it showed, and
   `observed` or `cached`. `change-request-creator` mirrors the entries into the description marked as reported, and a
   report that says a gate passed says whether it watched it run.
6. **The orchestrator reads whether the change request can merge** before each fix wave and at stage 10. A conflict
   goes into the wave's brief as a fact, and the wave merges the default branch in — a merge commit, never a rebase or
   a force-push. At stage 10 a change request that cannot merge stays a draft, with the conflict as a hand-off. A check
   read red goes into the brief the same way.
7. **The ledger replaces the gates account.** It carries what the gates account did plus a convention found absent, a
   fact about the environment, a third-party artefact and where it sits, a procedure as ordered quoted steps, and the
   orchestrator's own mechanical reads. It goes to every implementer after the first and every fix wave, and their
   reports gain a slot for what they established.
8. **A neutralised round is said to be so.** When a `code-reviewer` hand-back opens with the host's flag line, the
   orchestrator carries that line beside the verbatim prose into the fix wave's brief, and What to report names the
   round.

## User Stories

1. As a human paying for a delivery, I want a round to hold one poll at a time, so that no round pays for a second wait.
2. As a human, I want every agent to background long work, read large files once and never use a secret it finds, so
   that no dispatch burns turns sleeping, pays for the same bytes twice or leaks a credential into the run's record.
3. As a human delivering into GitLab, I want every assumption the tickets recorded posted where GitLab stores it, so
   that no fork ships unadjudicated because no anchor would take it.
4. As a human, I want a fix wave to respect standing verdicts, keep its finished work committed, and hand me a check no
   commit can clear, so that it neither builds a ruled-out fix, loses its work, nor waits on an outage.
5. As a human reading a change request, I want every demonstration its tickets asked for on the branch, with what it
   showed and whether it was watched, so that I can judge the work without it being run again.
6. As a human, I want a change request that cannot merge never flipped ready, and a wave told of a conflict or a red
   check before it starts, so that I am never handed a merge to fix and no wave spends turns finding what broke.
7. As an implementer or fix wave, I want what earlier dispatches established — a convention found absent included —
   carried with the one look that checks it, so that I trust it after one call instead of rediscovering it.
8. As a fix wave, I want to be told when the round prose I carry was neutralised by the host, so that I do not read the
   host's text as the reviewer's finding.

## Implementation Decisions

### Modules touched, and what they run on

| Module                                   | Model / effort | Changes                                       |
|------------------------------------------|----------------|-----------------------------------------------|
| build skill (the orchestrator's session) | opus / medium  | 2, 6, 7, 8                                    |
| `code-reviewer`                          | sonnet / low   | 1                                             |
| `implementer`                            | opus / high    | 2, 5, 7 (report slot)                         |
| `comments-addresser`                     | opus / medium  | 2, 4, 5, 6 (the merge), 7 (report slot)       |
| `change-request-creator`                 | opus / medium  | 2, 3, 5 (the mirror)                          |
| `assumption-reviewer`                    | opus / high    | 2                                             |
| `spec-reviewer`                          | opus / medium  | 2; reads `Evidence:` as what was demonstrated |

The wording is sized to those settings. `code-reviewer` runs at low effort, so its poll rule is one plain sentence, and
the parallel duplicate is exactly what a low-effort turn emits. Most new rules land on `comments-addresser` at medium
effort, so each is a test it can apply without judgement: the outside-cause test and the conflict are read from the
forge, not inferred. The orchestrator forms no view in any of them.

### The working-habits block

- One wording, identical in all six files; each places it where its instructions on working sit. It names no host, no
  tool timeout and no command. `code-reviewer` does not carry it: its poll rule is its only wait, and it touches no
  repository.

### The anchoring ladder

- Rung 3 keeps its meaning and its GitHub example. Rung 4's body opens with the same `ASSUMPTION (<hash>)` prefix.
- The positional form is a claim until checked against a real GitLab merge request (**Testing Decisions**). Where GitLab
  does not store it, rung 3 on GitLab is the general comment and the example says so.
- A comment at rung 3 or 4 is already reported as "anchored anywhere but at a translated line on head"; that rule now
  covers rung 4 too.

### The fix wave

- Steps 4 to 6 interleave as the implementer's step 3 does — each comment's fix, its gates, its commit — and one push
  follows. The mark step stays after, because a mark names the commit that did the work.
- The verdict read moves to the front of step 4's loop. The existing rule for a verdict a fix outdates is unchanged.
- A conflict named in the brief is merged before the first comment is worked.

### Evidence

- `Evidence:` follows `Gates:` in both commit formats, numbered the same way, and is left out when empty. Routine green
  gates get no entry.
- The creator reads it the way it reads `Assumptions:` — to the next `<Word>:` line — but from every commit, a fix
  wave's included, since evidence needs no adjudication.

### The ledger

- It takes the gates account's place in the build skill's Dispatch section, under the same rule: an account of what a
  dispatch established, not a channel for judgement. The sentence that conventions are read first-hand stays, narrowed
  to conventions found present, which are cited by where they live and never restated.
- An entry is the fact, the one look that checks it, and which dispatch established it. The orchestrator adds a
  report's entries as they came. What to report is unchanged by it: the ledger is a brief's, not the human's.

## Testing Decisions

Nothing here is covered by CI: typecheck and lint run over the plugin's Node code, which this change does not touch. A
good check asserts what a human or the next agent would see — a comment's stored anchor, a commit's sections, a brief's
contents, a debrief's figures — never how an agent phrased its reasoning.

- **The GitLab anchor forms, in a throwaway project** under the owner's personal namespace: one merge request of two
  commits, the second moving a line the first added. Post an assumption comment at each rung, read every discussion
  back, confirm what each stored, and delete the project. This settles rung 3 before its example ships.
- **One hand-run end-to-end build** on the repository-tracker fixture (CONTRIBUTING.md § The end-to-end tests), read
  through its debrief and records: no turn with two status polls; `Evidence:` on the commits whose ticket asked for a
  demonstration, mirrored as reported; the ledger in every implementer brief after the first and in each fix wave's,
  with a mark-delivered convention found absent carried as absent; a mergeability read before each wave and at the
  flip; fix-wave commits per piece and one push. The fixture runs on GitHub and does not conflict, so it exercises
  neither the GitLab rungs nor the merge.
- **Every touched prose file read against `/mattpocock-skills:writing-for-agents`**, and the working-habits block
  diffed across its six files.
- **The next observed deliveries' debriefs** cover the rest: a conflict merged by a wave, the outside-cause hand-off,
  the GitLab rungs on a real delivery, and the flag on the next neutralised round.

## Out of Scope

- **Everything already fixed at head:** the held poll, the burst of refused posts, the gates account reaching fix waves,
  the uncommitted refinement output, the implementer's anchor read-back.
- **Hunches from older commits that never recurred at head:** `accept` on nearly everything, a wave adding unrequested
  scope, doubled baseline gate runs, a `review_id` collision, round 2 costing as much as round 1.
- **The ledger for reviewers.** An `assumption-reviewer` posted a wrong **directive** because it did not know which
  files a gate leaves uncovered; reviewers still read that first-hand, so their judgement rests on nothing another agent
  claimed.
- **Clearing a conflict before stage 3.** In one run the change request conflicted from stage 3 to stage 5, so no check
  ran and three of four spec findings were about that; the first fix wave now merges it, at the price of those stages.
- **Re-measuring between edits:** a writer's habit, not every agent's.
- **A flip bar that requires a round on the head being flipped:** a third round per run is its price.
- **The stage-flow gaps:** an exit for a blocked ticket in stage 1, question rounds in build, the first round before
  adjudication.
- **Gates scoped to what a piece touched**, **shell self-harm guards**, **carrying a wave's implemented lines to the
  next wave**, **listing the forks a wave closed**, and **a shipped line translator**.

## Further Notes

### The source

The debriefs are not part of this repository, and this spec carries what it needs from them. Each finding was sorted by
the plugin commit of every run that grounded it, and kept only where a run at or near head grounded it or the contract
at head still carries the gap. Two hunches were grounded in a run's own record: both rounds of one run sent two
`code_review_status` calls in one assistant message, and a flagged hand-back opens with the host's line
`[harness: subagent output matched instruction-shaped pattern(s): …]`.

### What this reverses

[idp-scaffold-defects](../idp-scaffold-defects/spec.md) put "carrying repository conventions between implementers, such
as whether the project marks a ticket delivered" out of scope, keeping them first-hand reading. Three runs on head
searched for that convention on every ticket. The ledger reverses that call for a convention found absent, and keeps it
for one found present, which is still cited and read rather than restated.

### Load-bearing behaviour this change must not disturb

- The orchestrator forms no judgement ([ADR 0015](../../adrs/0015-the-orchestrator-forms-no-judgement.md)):
  mergeability, a check's state and the host's flag are mechanical reads, and the ledger's entries are carried as they
  came.
- The plugin names no forge ([ADR 0012](../../adrs/0012-the-plugin-names-no-forge.md)): the GitLab and GitHub forms
  stay worked examples of one mechanism, and the working-habits block names no host.
- A fix wave's forks are still not mirrored and not adjudicated; only its evidence is.
- A round's prose still reaches a fix wave as the host returned it, with the declined findings and their grounds. The
  flag is added beside the prose, never in place of it.
