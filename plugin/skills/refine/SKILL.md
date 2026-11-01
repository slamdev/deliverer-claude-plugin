---
name: refine
description: Refine one idea into an epic — grilled with you, written up as a spec, broken into tickets ready to build.
disable-model-invocation: true
argument-hint: "<epic-idea>"
metadata:
  credits: |
    All credits belong to https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md
    and https://github.com/mattpocock/skills/blob/main/skills/productivity/handoff/SKILL.md
---

You **refine** one **idea** into an **epic** ready to deliver: the idea **grilled** with the human until no decision is
left silently assumed, that conversation written down as a **brief**, and the brief turned into a published **spec** and
one published **ticket** per slice of work.

Your argument names the idea; when it names none, ask the user for it rather than picking one. Name the epic from it
once, as a short **slug** — the brief's filename, the task list and the published artifacts all carry it, so two epics
never collide.

**Stage 1's conversation and its decisions are yours and nobody else's**: the human is in the room, the decisions are
theirs, and what goes out of stage 1 is fact-finding and never the interview itself. Stages 3 and 4 are one agent
dispatch each — **one stage, one task** (**Progress**) — and the dispatched agent's **report** is all you get back: what
it names is what you know. A **writer** meets the codebase for itself but never the conversation, so a decision the
brief leaves out is one the writer closes again on its own, and maybe the other way — **that is what makes the brief
load-bearing**. Where a report leaves you unsure, or a writer's document is wrong, put the stage back to the writer
naming what it got wrong rather than editing the document yourself: the writer holds the context the document needs.
Yours is the work no agent does: grill the idea, send its questions of fact out as **sweep**s (**Sweeps**), write the
brief, dispatch the two writers in order, read their reports, commit what the refinement wrote into the repository onto
the epic's **epic branch**, and hand the epic to the human.

**A mechanical question about the tree, the forge or the web is yours to settle** — does this symbol exist, what does
this file say, what does a published **spec** already carry, does this tool's own documentation name the feature —
because each answers true or false in a single look. **A thread goes out to a sweep**: a search whose results are read
to decide what to search next is one, however cheap each step of it looks. That bar binds the whole **run** — the
reading stage 3 does, checking what a **writer** reported, is a single look and so yours — and it bounds your reading
and nothing else: the **brief**, and the glossary entries and ADRs stage 1 lands, are yours to write.

**Resume.** Every run, resumed or not, fetches the default branch before anything else runs. Where the checkout is
behind it, say so and ask whether to pull — in the first question round, or before the next dispatch on a run that skips
stage 1: the pull is the human's call, never yours. This idea may be part-refined — by an earlier run of your own that
was interrupted, or by hand. The artifacts are what say how far it got: the brief on disk says stage 2 ran, a published
spec says stage 3 ran, and published tickets say stage 4 did. Start from the earliest stage whose artifact you cannot
find — re-dispatching either writer is safe, because each one resumes on its own and adds only what is missing. Stage 1
is the exception: a conversation leaves nothing behind but the brief, so when the brief is gone the grilling is owed
again. Once stage 5 has run, what it committed may sit on the **epic branch** alone, with the checkout on some other
branch. Where the project keeps the spec in the repository and the tree carries none, find the epic branch the way stage
5 does, and where one carries the spec, switch to it with `--merge` before judging anything — the writers resume off
what it carries. An open change request says nothing about whether stage 5 is done, since what it committed may have
changed since it opened, so stage 5 runs on every run: it reads its own progress off the branch and the forge, commits
only what differs, and never opens a change request beside one already open.

**Dispatch.** Every dispatch carries the epic's **slug**. Stage 3's carries the brief's path; stage 4's carries the
spec's location instead — once the spec is published it is the record, so the tickets are cut from it rather than from
the conversation behind it. Paths rather than contents: a writer handed the path opens the whole document for itself,
and reads the repo first-hand on top of it. A dispatch carries no ref for the workspace checkout, which it reads as it
stands; a checkout a sweep kept is named by its path and ref. Every dispatch, a writer's or a sweep's, also carries the
environment facts an earlier sweep's report established — how a cluster or a service is reached — so none rediscovers
them.

**Sequencing.** A stage you dispatched in this run is unfinished until its **report** is in hand, and an acknowledgement
is not a report: a writer you continue may answer you at once and finish its work in the background, and until the
report lands that stage has not run. Wait for the report itself; a `sleep` or a poll stands in for none, and neither
does a dispatch spent only on waiting: end your turn, and the notifications wake you.

**Continue a dispatch while it is still addressable** — to put a stage back, or to ask after a report that never came. A
writer is still holding the context that wrote the document, so the correction costs a patch where a cold dispatch pays
for the whole write again. Dispatch a cold one once it is not addressable, or once a continue itself brings no report:
the same move at its higher price, and it keeps the run going where stopping hands the human a half-written epic to
re-run.

## Stages

1. **Grill the idea.** Call the Skill tool twice, once with `mattpocock-skills:grilling` and once with
   `mattpocock-skills:domain-modeling`, and run the grilling on the idea with domain-modeling alongside, so terms and
   decisions land in the project's glossary and ADRs as they crystallise. When either is not installed, report that and
   stop rather than improvising an interview. Those two skills own how the interview runs, apart from how a question
   reaches the human (**Asking**) and how a question of fact gets settled (**Sweeps**). The first question round states
   that an **epic** delivers into one repository, as the glossary bounds it, and carries the pull question **Resume**
   names. Each question round, before it is asked, every question on the **frontier** goes through:
   1. its kind told. A decision is the human's and goes toward the question round. A question of fact goes to the
      **mechanical** bar: one you can close in a single look, you settle yourself; one that wants a thread followed — a
      feature traced from one file to the next, a second repository read, a published document fetched and then read
      for what to fetch after it — goes out as a **sweep**, dispatched the moment its subject is clear. For a decision,
      the premise its recommended answer rests on goes to the same bar — the reach of a removal above all, since
      "nothing else depends on this" is a fact to find before the question is asked — and where it goes out as a sweep,
      that decision alone waits on it, under step 2's hold;
   2. for a decision, every sweep in flight tested against it. A question that turns on a sweep's subject — one you
      cannot ask well without what the sweep is out to find, its premise among it — waits for that sweep; every other
      question goes into the question round now, since a sweep never holds up the questions it does not touch;
   3. the question round asked (**Asking**) — or, where the holds took every question out of it, the sweep waited for
      rather than asking anyway.

   Each sweep that lands releases its subject: every question it was holding goes into the next question round, with its
   premise corrected where the sweep's facts changed it, and a settled decision whose premise those facts undercut goes
   back to the human as a **fork**, saying what changed — an answer carried on a premise that turned out false is a
   decision silently assumed, the one thing this stage exists to prevent. The hold lasts as long as the sweep is in
   flight and no longer. You are done on grilling's own bar — the frontier empty, a question a sweep is holding still on
   it, the sweep over the brief (**Sweeps**) reported and every input it raised answered, and the user's confirmation
   that you have reached a shared understanding — and once every term a settled decision relies on is in the glossary or
   listed in the brief as missing from it.
2. **Write the brief** — as **The brief** below. You are done when every one of the five things it carries is written
   out of the conversation or stated to hold nothing, and a fresh agent could carry the design forward from it alone.
3. **Write the spec.** Dispatch `spec-writer`; it publishes the spec to the project's issue tracker, and its **report**
   raises the **fork**s its reading forced — among them the decision a killed **claim** took down with it. Every one is
   yours to hold, and **one report, one question round, one put-back** is the loop each report goes through:
   1. the spec's location it names kept;
   2. every fork it raises closed with the human in one question round (**Asking**), saying what the writer found.
      The forks a report raised are the whole set, and you hold them all the moment it lands;
   3. the stage put back once, carrying every answer as the human gave it — the option picked and any free text,
      quoted rather than restated — the writer continued where it is addressable, a cold dispatch otherwise, since an
      answer that reaches stage 4 any other way is one the record does not carry;
   4. the corrected report taken as the next one, through the same loop: folding the answers in can raise forks the
      writer could not have seen before, as often as the writing needs.

   You are done when the spec's location is in hand and no decision a killed claim took down is still open.
4. **Break it into tickets.** Dispatch `tickets-writer`, carrying the spec's location. It publishes one ticket per
   slice, numbered in dependency order, and its report raises the **fork**s its reading found against the spec. Those
   go through stage 3's **one report, one question round, one put-back**, the put-back going to `spec-writer`; stage 4
   is then put back carrying the corrected spec's location, and its corrected report goes through the same. You are
   done when its report is in hand, with the count and the locations it names kept, and no fork it raised is still
   open.
5. **Open the draft** — for both tracker kinds: what this refinement wrote into the repository, committed onto the
   **epic branch**. It is **mechanical** throughout — every step a git or forge operation, with no wording to choose.
   First **the paths**, read off the project's tracker conventions, the same ones the writers published to:
   - **Where they put the spec and tickets as files in the repository**, the paths are the epic's spec and tickets, and
     every glossary and ADR file stage 1 landed.
   - **Where they put them on the forge's issues**, the paths are the glossary and ADR files stage 1 landed, and those
     alone — read off the brief, which lists by path every glossary entry and ADR the session landed. Where it lists
     none, the stage has nothing to commit: push nothing, open nothing, complete its task as
     `<slug>: open the draft (nothing to commit)`, and go to stage 6. Where the brief is gone, no mechanical step tells
     this refinement's lines from the human's: commit nothing, report every uncommitted glossary and ADR change in the
     tree as a **hand-off**, and complete the task the same way.

   Then, with the paths in hand:
   1. **The branch.** Fetch first. The **epic branch** is a branch on the remote, named from the epic's **slug** in the
      style of the branches already there — the rule `implementer` names it by — and where the spec sits decides how
      you recognise it:
      - **Spec in the repository**: the branch that carries the epic's spec at its location — look first under that
        name, then across the remote's other branches.
      - **Spec on the forge's issues**: no file names the epic, so it is the branch of that name with an open change
        request from it whose description names the epic's spec location. One with no open change request is the
        epic's as well where an earlier run of this refinement pushed it and stopped short of the draft: the brief is
        in hand, and every commit the branch carries beyond the default branch has no `Ticket:` line and changes only
        paths the brief marks as landed. Take that branch as found, and open its draft at step 3.

      Where the epic branch exists, switch to it and pull. Where none does, create it from the up-to-date default branch
      on the remote, under that name; a branch of that name the remote already carries without the spec, or without
      that change request or those commits, is someone else's work, so report it and stop rather than committing on
      it. Switch with `--merge`, so the tree's uncommitted changes are carried onto the branch even where a file
      differs between the two; where that merge conflicts, stop and report the conflicting files as a **hand-off**
      rather than resolving them.
   2. **The commit.** Add exactly the paths, and name the same paths on the commit itself (`git commit -- <paths>`), so
      nothing else the index already held rides in. Every other change in the tree stays as you found it, staged or
      not, and goes into your report. One of those files that already carried uncommitted changes of the human's when
      the run opened goes in whole, since no mechanical step tells their lines from yours: name it in your report. The
      message follows the project's own commit conventions and carries no `Ticket:` line: this is no ticket's work.
   3. **The change request.** Push the branch and open its change request as a **draft**, titled with the spec's title,
      and described with this text and nothing else, the two placeholders filled in and passed through a file rather
      than on the command line, where the backticks would run as a command:

      ```
      The spec for this epic is at `<spec location>`, broken into <ticket count> tickets.

      This description is a placeholder: the delivery rewrites it.
      ```

      The description stays this placeholder because build writes the real one; `pr` is build's to run.

   **Resume.** The branch, its commits and the forge say how far this stage got, on every run. A branch already carrying
   those paths at their current content owes no commit; a difference owes a new commit on top, pushed — history only
   grows, so never an amend and never a force-push. A change request already open for the branch is the change request,
   draft or not: push to it and leave its title and description as they stand. Where none is open — never opened, or
   closed or merged since — open a fresh draft as above: one open at a time, never two.

   You are done when the epic branch on the remote carries every one of the paths at its current content and a change
   request is open from it — or, where the spec lives on the forge's issues, when there were no paths to commit.
6. **Hand the epic over** — report as below, and name the call that delivers it: `/deliverer:build <epic location>`, the
   location being where the spec and its tickets sit together, as the project's conventions have it.

## Asking

Every question you put to the human — the grilling's above all, and the forks a writer's report raises — is **written,
then picked**, both in the same turn. The tool's fields are too narrow to carry a question, so the text carries it and
the tool takes the answer:

1. **Written.** The whole question round as text first, in grilling's own numbered format: each question's title, a
   body carrying the context the human needs to decide — what raised it, what hangs on it — every plausible answer
   with what follows from choosing it, and your recommended answer.
2. **Picked.** Then the `AskUserQuestion` tool on the same question round, as the answer pad: each question named by
   its number and title, each option a short label pointing back at an answer the text spelled out (`Q2 · B: one queue
   per tenant`), your recommended answer leading the list. Open-ended is not an exemption: the plausible answers become
   the options, and the free-text escape carries anything else.

Four questions is one call's limit and a frontier is often wider. Carry the rest into further calls rather than trimming
the frontier to fit, and send every call of the question round in the same message, before any answer is waited on: one
frontier costs the human one wait, and every question the question round holds reaches them at once. The text is
written once, at the head of the question round, and every call points back into it.

## Sweeps

A **sweep** is a fact-finding dispatch, one subject each, and several run at once so two questions of fact never queue
behind one another. Facts that different frontier questions turn on go out as different sweeps, so one never reports
late on another's account; the points one held question needs stay in one sweep. Whatever general-purpose agent your
host offers is what it goes to: this plugin ships no sweeper of its own. Send each the moment its subject is clear, and
**send it even where dispatching makes you wait for the report**: on a host where that blocks, the interview serialises
— send, wait, ask, send — and the sweep still goes out, because the reading is the cost and the waiting only takes time.
The dispatch carries:

- **the subject, named as the question of fact the sweep is out to close — never the next file to open — and the
  questions on the frontier it holds**, worded as the human will be asked them. A sweep follows the thread itself,
  however many looks that takes, and comes back once its facts let every question it holds be put on a checked premise;
- **that the looking is first-hand.** A subject broad enough to split is one an agent will split, and the half it hands
  on comes back late — or comes back to you instead, long after the sweep that sent it has reported without it. Telling
  a second subject from a second look at the same one is yours, because the **frontier** is what says which of the two
  you are owed;
- **what it owes back: the facts and where it found them** — never a view on the design, which is the human's to form
  with you;
- **the subjects of the sweeps already in flight**, as context, so it leaves a sibling's fact to that sibling;
- **the environment facts**, as **Dispatch** names them;
- **the two blocks of Bounds, by reference to this skill's own copy** — this file's path and that section's heading —
  so the sweep reads them word for word rather than a retelling;
- **that a checkout or clone it makes is kept**, its path and ref named in its report, for the brief to hand on.

**Once the frontier is empty, one sweep goes over the brief** before the human confirms. Write the brief as stage 2 has
it, and send a sweep carrying its path, its subject the question of fact which inputs the settled decisions leave
unanswered or contradictory — inputs derived from the decisions themselves: the empty one, the edge of each threshold,
and those where two decisions' triggers meet. It owes back each such input with the decisions it involves. Every one
goes to the human as a decision, in one question round, and the brief takes the answers. It goes out once: an input
those answers raise is the writer's to find, as any other fork is.

You hold the subject for the rest of the interview and nowhere else: the brief hands the spec writer the design rather
than the interview's bookkeeping, and the task list carries one task per stage.

**Where your host offers no agent to sweep with, read inline** and carry that into your **report** as a **hand-off**.
There is nowhere else for the reading to go, and stalling an interview over a host's configuration strands a human who
cannot fix it from where they sit.

## The brief

The brief is the whole **hand-off** of stage 1: whoever writes the spec has it and nothing else of the conversation.
Write it to the temporary directory of the user's OS — not the workspace, which is for the artifacts this run
publishes — as `<epic-slug>-brief.md`, so a later run can find the one you left. It carries:

- the idea, and the problem behind it in the user's own terms
- every decision the grilling settled, each with the grounds it was settled on
- every **fork** the grilling left open, and that it is the human's to close
- the artifacts the session landed or touched — glossary entries, ADRs, prior specs, code, and every path a **sweep**
  reported back — by path, never copied in, every checkout a sweep kept by its path and ref, each glossary or ADR file
  the session wrote marked as landed, since stage 5 commits those, and every term a settled decision relies on that the
  glossary does not carry, listed as missing from it; it is where the looking happened rather than what the looking
  found
- every **claim** the design rests on that the session never checked, each with the **cheapest** path that would settle
  it — a fact the human handed you, a precedent you took to generalise, a tool you took to have a feature

Those are written as claims and never as findings: the writer's own first-hand look is what turns one into a fact or
kills it, and a claim dressed as a fact is the one nobody thinks to check. So the brief carries what the session decided
and what it never checked — and no section of established facts, however that section is headed. What a **sweep**
settled rides in the **grounds** beside the decision it settled, where the contract already carries evidence.

**Cheapest is counted in the writer's reading, not in your typing.** A claim about what a file says is settled by
opening that file, what a test covers by reading its body, what a tool does by running that tool once. A path that says
to settle it by doing the work sends the **writer** off to build the thing and run the suite before a line of the spec
exists, so write the path down at the price it really costs: name the file, the body or the command where one of those
closes the claim. **A claim only a prototype settles gets that path and says so**: where building it is genuinely the
only thing that would settle one — an extraction nobody has attempted, an output nothing has compared — a writer sent to
prototype knowingly is worth what it spends.

Redact secrets and personal data: the brief outlives the session, on a disk nobody is watching.

## Bounds

Two blocks bound every **sweep** and both writers.

**Working habits.**

- **A long wait is backgrounded.** Work that takes minutes runs in the background, and its completion notice wakes
  you; before waiting again, read the state of what you are waiting on, so a wait never outlives its answer.
- **A large file is read once, in ranges.** A file or a persisted output too big to show is read with the file-reading
  tool in ranges, never dumped through the shell and then read again.
- **Measure once, after the last edit.** Widths, counts and conformance are measured once the text is final, never
  between edits.
- **A secret is never used or shown.** Configuration is read by key. A secret's value is never printed and never
  interpolated into a command; two secrets are compared by hash or by length. A credential found in the repository is
  never used to authenticate against anything: report it, and go on without it.

**Host bounds.**

- **Your own scratch copy.** Work in a scratch copy of your own under the OS temporary directory, made under a fresh
  name — never a shared or fixed path, and never inside the workspace, where only a spec or ticket published as the
  project's conventions have it belongs.
- **Nothing left running.** Report with nothing of yours still running.
- **The host as you found it.** Leave the host as you found it, or name in your report what you left.
- **A live system is read, never written.** Read from a live system, and write nothing to it.
- **A writer's prototype outlives its open forks.** A writer keeps its prototype and scratch copy while its report
  carries open forks, and names their paths in that report.

## Progress

The task list is the human's window on the run. **One stage, one task** — one each for stages 1 to 5, since stage 6 is
the report itself. Create all five at once as the run opens, whatever the tracker: whether the grilling will land
anything for stage 5 to commit is not yet known. Name each from the stage it serves and prefix it with the epic's slug
so two epics can share a session: `<slug>: grill the idea`, `<slug>: open the draft`. Mark a task `in_progress` as you
enter its stage and `completed` once its artifact exists — for stages 3 and 4, once you have read the writer's report;
for stage 5, once its own bar holds, renamed `<slug>: open the draft (nothing to commit)` where it had no paths, so the
skip shows rather than looking like a stage that never ran. Putting a stage back to its writer flips its task to
`in_progress` again, and `completed` once the corrected report lands: a correction is the same stage rather than a new
one, so it gets no task of its own. A fork stage 4 raises flips stage 3's task and then stage 4's the same way. A
resumed run opens the same set, with the stages whose artifacts it found created `completed` — never stage 5's, which
runs on every run and is marked `completed` once its bar holds on this one.

## What to report

The human who ran this sat through stage 1, so your report is what came of it rather than a retelling.

- the epic's location, the spec's within it, and the brief's path
- how many tickets, and which of them can start immediately
- where stage 5 ran, whatever the tracker: the epic branch, the change request's URL, every change you left
  uncommitted in the tree, one line each, because none of it was this run's to commit, and every file the commit took
  whole with changes of the human's in it
- where stage 5 had nothing to commit: that it pushed no branch and opened no change request, and which of the two
  reasons held — the brief marks no glossary or ADR file as landed, or the brief was gone, with its uncommitted
  glossary and ADR changes among the hand-offs
- every fork the grilling left open, one line each — those are the human's to close
- every fork the tickets writer raised against the spec, one line each, and how it closed
- every glossary entry and ADR the session landed
- what the writers raised for a human — a seam newly proposed, an ADR the spec contradicts, a **claim** of yours a
  writer killed or could settle neither way, a user story no ticket covers, two tickets the set does not build in number
  order, a term the glossary does not carry — or that every claim you marked survived the writer's reading
- every hand-off, one line each — anything still waiting on a human, and a question of fact you had to read inline for
  want of an agent to sweep with
- every scratch path the sweeps and writers kept — checkouts, scratch copies, prototypes — one line each, for the human
  to remove
- the call that delivers the epic: `/deliverer:build <epic location>`
