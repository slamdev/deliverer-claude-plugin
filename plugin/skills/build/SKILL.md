---
name: build
description: Build one epic end to end — every ticket implemented, its change request reviewed, and flipped ready.
disable-model-invocation: true
argument-hint: "<epic-location>"
---

You **orchestrate** the delivery of one **epic**: every **ticket** implemented on the **epic branch**, every
**assumption** and **review finding** on the epic's **change request** settled, and the change request **flipped ready**
for a human.

Your argument names the epic; when it names none, report that and stop rather than picking one.

**Find the epic before anything else**, and the **epic branch** with it, before any ticket is begun:

- Where the epic location you were handed is on the forge's issues, read the epic there. Its epic branch is the one a
  refinement left when its grilling landed glossary entries or ADRs: fetch, and look for an open change request from
  a branch named from the epic's **slug** in the style of the branches already there — the slug the spec's issue is
  titled from — whose description names the epic's spec location. Both have to hold: a branch of that name with no
  such change request is someone else's. Where one does, that branch is the epic branch, found. Where none does, no
  branch carries the epic, and the first `implementer` creates the epic branch.
- Where it is in the repository, fetch first. Where the default branch carries it, read the epic there.
- Where the default branch does not, the epic sits on its epic branch alone — a refinement publishes its spec and
  tickets there and nowhere else — and that branch is the one on the remote carrying the epic location: look first
  under the name from the epic's **slug** in the style of the branches already there, then across the remote's other
  branches, and read the epic off the one that carries it.
- Where no branch carries the epic location, report that and stop.

Every stage below is made of agent dispatches — **one stage, one task** (**Progress**) — and each dispatched agent's
**report** is all you get back: what it names is what you know. Where a report leaves you unsure, put the stage back
rather than going to look, and the bearings you take from the branch and the change request say which stage is owed, not
what a finding says. Yours is the work no agent does: read the epic for its tickets, dispatch in order, read each
report, keep the task list current, and flip the change request ready at the end.

A **mechanical question about the tree, the forge or the web** is yours to settle — does it build, does this symbol
exist, what does the branch carry, are the change request's **checks** green — because that asks whether a report's fact
is true, not whether its judgement is right. A finding, a design, whether the work is good — those are never yours to
form a view on. Two edges on it: **read only**, and the only things to do with what you find are **put a stage back to
an agent — continued or cold — or report it**, never fix.

**Resume.** This epic may be part-delivered — by an earlier run of your own that was interrupted, or by hand. The epic
branch and the change request are what say how far it got, and nothing else does:

- **A commit carrying a `Ticket:` line names a ticket begun.** One without it is not a ticket's — a refinement's commit
  of what it wrote into the repository, or a **fix wave**'s. The last ticket named may be part-delivered with nothing
  anywhere saying so, because an `implementer` commits each coherent piece as it lands: it is dispatched again, ahead
  of the tickets carrying no commit at all, and that implementer reads the commits, implements only what they left
  undone, and reports the commit that covered it where the branch covered it in full already.
- **The change request's description says whether stage 1 is over.** One that does not read
  `This description is a placeholder` was written by stage 2, which runs only once every ticket has a report, so no
  `implementer` goes out again. An open change request alone says nothing — a refinement may have opened it before any
  ticket began — so stage 2 is dispatched on every run.
- **The adjudication, the spec review and the fix waves leave you no evidence to read.** What they leave is replies on
  the comments and `SPEC` comments among them, and telling a **verdict** that owes a change from a reply recording the
  change made, or a finding posted from a reading finished, is a judgement about what those say — not a mechanical fact,
  so not yours. A resumed run counts no comments: it dispatches `assumption-reviewer`, `spec-reviewer` and
  `comments-addresser` again and lets each read its own filter. One meeting nothing to do replies nothing, commits
  nothing and reports that, where a skipped wave flips a change request ready with an `improve` or an `override`
  unimplemented and an **escalation** nobody has seen.
- **Rounds leave nothing to count.** Nothing of a round lands on the change request, so a resumed run cannot read off
  how many already ran, and the count is what the bar rests on: flipping ready on one round ships a review nobody did.
  Both rounds are owed again (**Rounds**).

Start from the earliest stage whose evidence you cannot find. Dispatching any agent but `code-reviewer` cold is safe,
because each one resumes on its own and adds only what is missing; `code-reviewer` is the exception, because a cold
dispatch opens a fresh **round** (**Rounds**).

**Read off the branch every run, whatever the reports say** — a path that runs only once something has already gone
wrong is the path least likely to work — and where a report and the branch disagree, **the account nearer the code** is
the one to trust:

- **every `Gates:` section on its commits.** It names a **gate** the commit left red for work nobody asked for — outside
  its ticket where it carries a `Ticket:` line, and outside anything a comment asked for where it carries none. Carry
  each into your report beside the ones the reports named.
- **whether the working tree is clean.** An `implementer` and a **fix wave** each leave work nobody asked for exactly as
  they found it and name it in their report, and a **round** reads the checkout it runs in and reviews whatever is
  sitting there as the epic's work. Carry either account into your report.

**Dispatch.** Every dispatch carries the epic, and — once each exists — the change request's URL and the **epic branch's
name**, so none of them has to find it again: the branch's name from the first stage-1 dispatch where you found the epic
branch, and from that implementer's report otherwise, since it creates the branch; the URL from stage 2's report. Beyond
that, every agent meets the repo first-hand, because that is what its own judgement must rest on — with two deliberate
exceptions, each carrying what exists nowhere the agent could read:

- **Each `implementer` after the first, and each `comments-addresser`,** carries the **gates** account: what the
  implementers' reports named about the gates that bit and what satisfied them — where the toolchain each gate needed
  lives and how it was obtained included — accumulating as stage 1 runs. That warms a cold start on work not yet done,
  which a fix wave is as much as a ticket, so it goes to them and nowhere else. It stays an account of what bit and what
  satisfied it: the repo's conventions are read first-hand, as everything else is.
- **Each `comments-addresser`** carries the preceding **round**'s prose, verbatim — the whole summary that round's
  report handed you, pasted in rather than pointed at. A finding the reviewer never posted exists nowhere but that prose
  (**Rounds**), the fix wave is the only agent that can act on it, and the prose reached you in a report rather than on
  disk, so there is no path you could send instead. A round that produced no review left no prose, and its wave runs on
  the comments alone. The same dispatch carries the findings every earlier wave **declined** and the **grounds** it
  declined them on, verbatim from its report: a finding the reviewer never posted is answered nowhere on the change
  request, so a later round raising the same point again would otherwise meet a wave holding nothing — re-deriving
  grounds already reached, or reversing them without ever seeing them. Those lines are an account of what has already
  been adjudicated rather than a list of points to pass over: pass them on as they came, forming no view on what they
  raise.

**Sequencing.** One dispatch at a time: while a **report** is owed, nothing else goes out — no stage runs beside
another, and no stage is worth the minutes an overlap saves. A stage you dispatched in this run is unfinished until its
**report** is in hand, and an acknowledgement is not a report: a dispatch may answer you at once and finish its work in
the background, and until the report lands that stage has not run. Wait for the report itself; a `sleep` or a poll
stands in for none.

**Continue an agent while it is still addressable** — to put its stage back, or when it stopped without a report at all.
It still holds the epic, the ticket and the codebase it read, so continuing costs one message where a cold dispatch pays
for all of that reading again. That message carries the **mechanical** facts you settled for yourself and, where a stage
leaves you no evidence to read, only that no report arrived and the work is owed. Dispatch a cold one once it is not
addressable, or once continuing it fails. A continued `code-reviewer` opens no **round**: it carries on polling the
`review_id` it already holds, and only a cold dispatch opens a fresh round under a fresh id (**Rounds**).

## Stages

1. **Implement every ticket.** The tickets go in the order the epic lists them, one at a time, since they all commit to
   the one epic branch, and **one ticket, one dispatch, one report** is the loop each goes through:
   1. `implementer` dispatched, carrying that one ticket besides (**Dispatch**);
   2. its report waited for, and the next ticket begun only once that report names its commits — or the commit that
      covered the ticket already;
   3. kept from the report: the epic branch's name where this dispatch created it, the **gates** that bit and what
      satisfied them — the toolchain's location and how it was obtained among it — for the dispatches after it, and
      every gate it left red and every piece of uncommitted work it found for your own report;
   4. the stage's task relabelled (**Progress**).

   You are done when every ticket the epic lists has a report naming its commits.
2. **Open the change request.** Dispatch `change-request-creator`, on every run, resumed or not. It opens the change
   request as a **draft** — or, where one is already open for the branch, refine's draft among them, brings that one up
   to date and puts it back to draft where someone took it out — describes it with `mattpocock-skills:pr`, and mirrors
   into an `ASSUMPTION` comment every assumption recorded by a commit carrying a `Ticket:` line. A commit without that
   line is a **fix wave**'s, recording the **forks** that wave closed silently: the mirror passes those over and nothing
   adjudicates them, so no stage is ever owed for them, and a report naming fewer comments than the branch's commits
   recorded is this stage doing its job. A report naming `pr` missing is a stage that cannot be completed: report it as
   a **hand-off** and dispatch nothing further. You are done when the URL is in hand, with every comment the report
   names **anchored anywhere but at a translated line on head** kept — the agent's own wording, and wider than the
   diff: an assumption about a caller the branch never touched is anchored at the file on purpose, and is one of these.
3. **Adjudicate the assumptions.** Dispatch `assumption-reviewer`. For each `ASSUMPTION` comment it compares the roads
   the **fork** left open and replies one verdict — `accept`, `improve`, `override` or `escalate`. An `improve` is a
   road that beat the one the code took on a named **axis**, so it carries a **directive** stage 6 implements, and code
   no ticket asked for changes on a judgement nobody ratified. You are done when its report is in hand, with the four
   counts and every `improve` it names directing kept.
4. **Read it against the spec.** Dispatch `spec-reviewer`, once. It reads the change request against the epic's spec
   and every ticket, and posts each **spec finding** — something asked for missing or partial, behaviour nothing asked
   for, something asked for implemented but wrong — as a `SPEC` comment, which stage 6 works as it works any other. It
   is no **round** and counts toward nothing stage 10 waits on. You are done when its report is in hand, with the count
   of findings it names posting kept. Where its report names a document it could not read, or it still ends without a
   report once continued and then dispatched cold, carry the stage into your report as a **hand-off** — the change
   request went unread against its spec, whatever count it names — and go on to stage 5.
5. **First round.** Dispatch `code-reviewer`; it drives one **round** and reports its prose. You are done when its
   report is in hand, with the round's `review_id`, how it ended and all of its prose kept (**Rounds**): stage 6 is
   dispatched with the whole of that prose.
6. **First fix wave.** Dispatch `comments-addresser`, carrying the first round's prose and the gates account
   (**Dispatch**). It works every unresolved comment and every point that prose raises — implementing the improvements,
   the overrides and the findings, resolving what it implements or declines, and leaving the escalations for a human —
   and what happened to the code is its report's to say, **the account nearer the code** over `assumption-reviewer`'s.
   Each report goes through:
   1. every **directive** stage 3 named found in it — implemented, declined with **grounds**, or handed off. One the
      report leaves out altogether has no account of the code at all: put the stage back naming it, since which report
      is right turns on what the replies on that comment say, and reading them is a judgement that is never yours;
   2. kept: every `improve` line, every finding and every `improve` it declined with its grounds, its **hand-off** list,
      every gate it left red and every piece of uncommitted work it names, and whether the checks ended green.

   You are done when every directive stage 3 named has an account in the wave's report.
7. **Second round.** Dispatch `code-reviewer` again, cold, so that a fresh round opens (**Rounds**). It reviews the fix
   wave's commits, so what the first round missed still gets caught. You are done on stage 5's bar.
8. **Second fix wave.** Dispatch `comments-addresser` again, carrying the second round's prose, the findings the
   first wave declined with their grounds, and the gates account (**Dispatch**), for what that round raised. Its
   report goes through stage 6's loop over the directives the first wave handed off, and you are done on the same bar.
9. **Refresh the description.** Dispatch `change-request-creator` again, continued where the stage-2 agent is still
   addressable — telling it the fix waves have landed since it read the branch — and cold otherwise, so the description
   a human reads accounts for both fix waves rather than for the tickets alone. It changes the title and description and
   nothing else, so its report names no assumption comment posted; one it does name is a **fork** stage 2 missed that
   nothing will adjudicate now, and rides into your report as a **hand-off**. This stage runs whatever stage 10 then
   does, flip or draft — a change request left a draft is the one a human has the most to judge. A report naming `pr`
   missing ends the run as it does at stage 2. You are done when its report is in hand.
10. **Flip it ready.** Once **two rounds have completed** (**Rounds**) and you have read the change request's
    **checks** green on the forge, take the change request out of draft and report. The fix wave reports the checks too;
    where its account and the forge disagree, put the stage back rather than choosing between them. Escalations and
    declined findings ride into the report rather than holding the flip: they are what the human review is for. When
    the checks are not green, leave it a draft and report that instead. When the bar cannot be met — no round completed,
    or one did and the second cannot — leave it a draft the same way, and report the review stage as a **hand-off** with
    the reason each round ended on.

## Rounds

A round is one `code-reviewer` dispatch, and **two rounds that reached `completed`** is the bar stage 10 waits on. A
fresh round comes of a cold dispatch, under a `review_id` no round has used; continuing an agent carries on the id it
already holds and opens none.

- **`completed`** — one of the two. Its report carries the round's `review_id` and its prose, and that prose is the
  round's whole deliverable: the reviewer is instructed to post its findings as comments on the change request, and a
  finding it did not post exists nowhere else. Nothing of the round itself lands on the change request — not the prose,
  and no record that a round ran — so your **report** is where a human meets the review.
- **`failed` or `cancelled`** — that round produced no review, so it is not one of the two. Its report carries the
  one-line `reason` it ended on: a `failed` round's reason opens with a code naming the cause, and a `cancelled` round's
  carries none.
- **A round whose record is gone** — a continued `code-reviewer` reports the id and that the server no longer holds
  it. The round ran; its prose and its **spend** are unrecoverable, so it is not one of the two either, and its place
  in the report is a **hand-off** naming what was lost. It is not a reason to put the stage back under that id.
- **A dispatch that started no round** — the refusal it met named something only the owner can fix, so it reported those
  words and started nothing. None of the two, and its place in the report is a **hand-off** carrying the refusal: no
  round can complete until what it names is fixed.

## Progress

The task list is the human's window on the run. You write to it; you take your bearings from the branch and the change
request, as **Resume** has it.

**A signal that needs no action needs no message.** Progress goes to the task list, which is where the human is already
looking — an idle notice for a dispatch you have already accounted for asks nothing of you, so nothing is owed for it. A
signal that does ask something is not one of those: a **report** to read, a stage that went wrong, a round to put back.

**One stage, one task.** Create one each for stages 1 to 9 as the run opens, since stage 10 is the flip and the report
itself — named from the stage it serves and prefixed with the epic's slug so two epics can share a session, as
`<slug>: open the change request`. A resumed run opens the same set, with the stages the branch already accounts for
created `completed` — never stage 2's, which runs every time. Mark a task `in_progress` as you enter its stage and
`completed` once you have read the report that ends it. `completed` says the stage is over rather than that it
succeeded, so a round that died carries its outcome in its subject — `<slug>: second round (failed — no review)`.
Putting a stage back to an agent — continued or cold — is the same stage rather than a new one, so it gets no task of
its own: the task it already has flips back to `in_progress`, and `completed` once the report you were owed lands. **A
round is the exception**, because a cold `code-reviewer` opens a fresh one (**Rounds**): a round you spend after one
that died is another round, and it gets a task of its own.

Stage 1's one task carries all its tickets, relabelled as each lands: `<slug>: implement every ticket (4/21)` as the
subject and `Implementing ticket 4/21 — <ticket>` as the `activeForm`, both in the one `TaskUpdate`. The numerator is
how many tickets have a report in hand. A resumed run has none, so it opens at the tickets the `Ticket:` lines name
**less the last one**, which **Resume** dispatches again — or at all of them, created `completed`, where the change
request's description says stage 2 already ran.

## What to report

Whoever reads this has your report and nothing else.

- the change request's URL, and whether it ended draft or ready
- how many tickets were implemented, and how many rounds completed — with the reason each round that did not complete
  ended on, so the count says why the rest did not
- what the rounds cost — each round's total tokens and its provider-labelled dollar estimate, unknown where a round
  has none
- how many assumptions were adjudicated `accept`, `improve`, `override` and `escalate`
- how many spec findings the spec review posted
- every `improve` a fix wave implemented, one line each — the **fork**, the road taken and the **axis** that carried it
- every hand-off, one line each — the escalations and anything else still waiting on a human
- every finding and every `improve` the fix waves declined, one line each, with its grounds
- every **gate** left red for work nobody asked for, one line each — from the commits as well as from the reports
- every assumption comment anchored anywhere but at a translated line on head, one line each — a fork a human reading
  the diff never meets, so these lines are where they meet it
- any uncommitted work left on the branch that nothing asked for, one line each — from the tree as well as from the
  reports, because a round reads the checkout and reviews that work as the epic's
- whether the checks ended green

**The `improve` lines are the only trace of code the run redesigned.** Nothing ratified those changes before they
landed, and the comment each one came from is resolved by then and collapsed where the human is reading — so one you
leave out is a redesign they meet by reading the diff or never at all.
