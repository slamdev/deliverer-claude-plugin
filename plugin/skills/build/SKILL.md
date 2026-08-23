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

Every stage below is one agent dispatch — **one dispatch, one task** (**Progress**) — and the dispatched agent's
**report** is all you get back: what it names is what you know. Where a report leaves you unsure, put the stage back
rather than going to look, and the bearings you take from the branch and the change request say which stage is owed, not
what a finding says. **Continue an agent that stopped without a report while it is still addressable** — it still holds
the epic, the ticket and the codebase it read, so continuing costs one message where a cold dispatch pays for all of
that reading again; dispatch a cold one once it is not addressable, or once continuing it fails. That message tells it
what the branch carries, whether it builds and whether the checks are green — the facts you settle for yourself — and,
where a stage leaves you no evidence to read, only that no report arrived and the work is owed. `code-reviewer` is
continued like any other agent, and a continue opens no **round**: it carries on polling the `review_id` it already
holds, and only a cold dispatch opens a fresh round (**Rounds**). A **mechanical question about the tree or the forge**
is yours to settle — does it build, does this symbol exist, what does the branch carry, are the change request's
**checks** green — because that asks whether a report's fact is true, not whether its judgement is right. A finding, a
design, whether the work is good — those are never yours to form a view on. Two edges on it: **read only**, and the only
things to do with what you find are **put a stage back to an agent — continued or cold — or report it**, never fix.
Yours is the work no agent does: read the epic for its tickets, dispatch in order, read each report, keep the task list
current, and flip the change request ready at the end.

**Resume.** This epic may be part-delivered — by an earlier run of your own that was interrupted, or by hand. The epic
branch and the change request are what say how far it got: the commits carrying a `Ticket:` line name the tickets
implemented, and one without it is not a ticket; whether a change request is open for the branch says whether stage 2
ran. Start from the earliest stage whose evidence you cannot find — dispatching any agent but `code-reviewer` cold is
safe, because each one resumes on its own and adds only what is missing. `code-reviewer` is the exception: see
**Rounds**.

**The commits carry one fact that is not about progress.** A commit's `Gates:` section names a **gate** its ticket left
red for work outside it, and reading those off the branch is something you do every run rather than only when a report
fails to arrive: a second path that runs only once something has already gone wrong is the path least likely to work.
Carry them into your report beside the ones the reports named, and where a report names none while a commit names one,
the commit is the account to trust — it is the record that survives a report not arriving.

**The adjudication and the fix waves leave you no evidence to read.** What they leave behind is a comment's replies, and
telling a **verdict** that owes a change from a reply recording the change made is a judgement about what those replies
say — not a mechanical fact, so not yours. A resumed run therefore counts no comments: dispatch `assumption-reviewer`
and `comments-addresser` again and let each read its own filter. One meeting a fully adjudicated change request replies
nothing and reports it; one meeting no unresolved comment commits nothing and reports that. That is what makes either
dispatch worth spending whenever it is in doubt: one with nothing to do costs time, while a skipped wave flips a change
request ready with an **override** unimplemented and an **escalation** nobody has seen.

**Dispatch.** Every dispatch carries the epic, and — once each exists — the change request's URL and the **epic branch's
name**, so none of them has to find it again. Neither exists at the first stage-1 dispatch: that implementer creates the
branch and names it in its report, and stage 2 reports the URL. Each later `implementer` also carries what the reports
before it named about the **gates** that bit and what satisfied them, accumulating as the stage runs. That warms a cold
start on work not yet done, so it goes to implementers and nowhere else, and every other agent meets the repo first-hand
because that is what its own judgement must rest on — with one deliberate exception. Each `comments-addresser` dispatch
carries the preceding **round**'s prose, verbatim: the whole summary that round's report handed you, pasted in rather
than pointed at. Where the reviewer posted no comment on a finding, that prose is the only form it exists in, and the
fix wave is the only agent that can act on it — and the prose reached you in a report rather than on disk, so there is
no path you could send instead. Carry it as it came, forming no view on what it raises. A round that produced no review
left no prose, and its wave runs on the comments alone.

**Sequencing.** A stage you dispatched in this run is unfinished until its **report** is in hand, and an acknowledgement
is not a report: a dispatch may answer you at once and finish its work in the background, and until the report lands
that stage has not run. That holds inside stage 1 too, where the next implementer starts on the last one's report. Wait
for the report itself. A `sleep` or a poll stands in for none — pick a duration too short and you dispatch again, too
long and the epic waits on your guess.

## Stages

1. **Implement every ticket** — dispatch `implementer` once per ticket, in the order the epic lists them, one ticket at
   a time: they all commit to the one epic branch, so the next starts once the last one's report names its commits. Pass
   that one ticket besides. You are done when every ticket the epic lists has a report naming its commits.
2. **Open the change request** — dispatch `change-request-creator`. It opens the change request as a **draft** and
   mirrors every assumption the branch's commits recorded into an `ASSUMPTION` comment. Keep the URL it reports.
3. **Adjudicate and review together** — dispatch `assumption-reviewer` and `code-reviewer` in one message so they run
   concurrently. `assumption-reviewer` replies a verdict — `accept`, `override` or `escalate` — to every `ASSUMPTION`
   comment. `code-reviewer` drives one **round** and reports its prose. Keep that prose: the review's prompt instructs
   the reviewer to post its findings as comments on the change request, and where it did not, the prose is the only form
   they exist in — so stage 4 is dispatched with it.
4. **First fix wave** — dispatch `comments-addresser`, carrying the first round's prose (**Dispatch**). It works every
   unresolved comment and every point that prose raises: implementing the overrides and the findings, resolving what it
   implements or declines, and leaving the escalations for a human. Keep the **hand-off** list its report carries. Its
   own commits carry no `Ticket:` line and record the **forks** the wave closed silently: stage 2's mirror passes those
   over and nothing adjudicates them, so no stage is owed for them.
5. **Second round** — dispatch `code-reviewer` again. It reviews the fix wave's commits, so what the first round missed
   still gets caught.
6. **Second fix wave** — dispatch `comments-addresser` again, carrying the second round's prose, for what that round
   raised.
7. **Flip it ready** — once two rounds have completed and you have read the change request's **checks** green on the
   forge, take the change request out of draft and report. The fix wave reports them too, and the two accounts agreeing
   is the ordinary case; where they disagree, put the stage back rather than choosing between them — a report and the
   forge disagreeing is exactly what a re-dispatch is for. Escalations and declined findings ride into the report rather
   than holding the flip: they are what the human review is for. When the checks are not green, leave it a draft and
   report that instead. When the bar cannot be met — no round completed, or one did and the second cannot — leave it a
   draft the same way, and report the review stage as a **hand-off** with the reason each round ended on.

## Rounds

A round is one `code-reviewer` dispatch, and **two rounds that reached `completed`** is the bar stage 7 waits on.

- **`completed`** — one of the two. Its report carries the round's `review_id` and its prose, and that prose is the
  round's whole deliverable: the findings it names are comments on the change request where the reviewer posted them and
  exist nowhere else where it did not, and the fix wave after it is dispatched with all of it either way. Nothing of the
  round itself lands on the change request — not the prose, and no record that a round ran — so your **report** is where
  a human meets the review.
- **`failed` or `cancelled`** — that round produced no review, so it is not one of the two. Its report carries the
  one-line `reason` it ended on: a `failed` round's reason opens with a code naming the cause, and a `cancelled` round's
  carries none. A fresh `code-reviewer` dispatch does not carry on that round — it opens a fresh round under a fresh id.
- **Rounds leave nothing to count.** A resumed run cannot read off how many already ran, and the count is what the bar
  rests on: flipping ready on one round ships a review nobody did.

## Progress

The task list is the human's window on the run. You write to it; you take your bearings from the branch and the change
request, as **Resume** has it.

**A signal that needs no action needs no message.** Progress goes to the task list, which is where the human is already
looking — an idle notice for a dispatch you have already accounted for asks nothing of you, so nothing is owed for it. A
signal that does ask something is not one of those: a **report** to read, a stage that went wrong, a round to put back.

**One dispatch, one task.** Create one per dispatch as the run opens, named from the stage it serves and prefixed with
the epic's slug so two epics can share a session — `<slug>: open the change request`. Stage 3's two concurrent
dispatches get a task each, `adjudicate assumptions` and `first round`. A resumed run opens the same set, with the
dispatches the branch and the change request already account for created `completed`. Mark a task `in_progress` as you
dispatch it and `completed` once you have read its report. `completed` says the dispatch is over rather than that it
succeeded, so a round that died carries its outcome in its subject — `<slug>: second round (failed — no review)`. A
round you spend after one that died is another dispatch, so it gets a task of its own. Continuing an agent is the same
dispatch rather than a new one, so it gets no task of its own: the task it already has flips back to `in_progress`, and
`completed` once the report you were owed lands.

Stage 1 is one task for all its tickets, relabelled as each lands: `<slug>: implement every ticket (4/21)` as the
subject and `Implementing ticket 4/21 — <ticket>` as the `activeForm`, both in the one `TaskUpdate`. The numerator is
how many tickets the `Ticket:` lines name, so a resumed run opens at the count it left off.

## What to report

Whoever reads this has your report and nothing else.

- the change request's URL, and whether it ended draft or ready
- how many tickets were implemented, and how many rounds completed — with the reason each round that did not complete
  ended on, so the count says why the rest did not
- what the rounds cost — each round's tokens and its provider-labelled dollar estimate, unknown where a round has none
- how many assumptions were adjudicated `accept`, `override` and `escalate`
- every hand-off, one line each — the escalations and anything else still waiting on a human
- every finding the fix waves declined, one line each, with its grounds
- every **gate** left red for work outside its ticket, one line each — from the commits as well as from the reports
- whether the checks ended green
