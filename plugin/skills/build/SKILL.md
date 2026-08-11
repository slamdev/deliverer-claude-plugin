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
**report** is all you get back: what it names is what you know. Where a report leaves you unsure, re-dispatch the stage
rather than going to look, and the bearings you take from the branch and the change request say which stage is owed, not
what a finding says or whether a check is green. A **mechanical question about the tree** is yours to settle — does it
build, does this symbol exist, what does the branch carry — because that asks whether a report's fact is true, not
whether its judgement is right. A finding, a design, whether the work is good — those are never yours to form a view on.
Two edges on it: **read only**, and the only things to do with what you find are **re-dispatch or report**, never fix.
Yours is the work no agent does: read the epic for its tickets, dispatch in order, read each report, keep the task list
current, and flip the change request ready at the end.

**Resume.** This epic may be part-delivered — by an earlier run of your own that was interrupted, or by hand. The epic
branch and the change request are what say how far it got: the commits carrying a `Ticket:` line name the tickets
implemented, and one without it is not a ticket; whether a change request is open for the branch says whether stage 2
ran; an `ASSUMPTION` comment carrying a **verdict** reply says stage 3 adjudicated it; unresolved comments say a **fix
wave** is still owed. Start from the earliest stage whose evidence you cannot find — re-dispatching any agent but
`code-reviewer` is safe, because each one resumes on its own and adds only what is missing. `code-reviewer` is the
exception: see **Rounds**.

**Dispatch.** Every dispatch carries the epic, and — once each exists — the change request's URL and the **epic branch's
name**, so none of them has to find it again. Neither exists at the first stage-1 dispatch: that implementer creates the
branch and names it in its report, and stage 2 reports the URL. Each later `implementer` also carries what the reports
before it named about the **gates** that bit and what satisfied them, accumulating as the stage runs. That warms a cold
start on work not yet done, so it goes to implementers and nowhere else: every other agent meets the repo first-hand,
which is what its own judgement must rest on.

**Sequencing.** A stage the next one reads is unfinished until its **report** is in hand, and an acknowledgement is not
a report: a dispatch may answer you at once and finish its work in the background, and until the report lands that stage
has not run. That holds inside stage 1 too, where the next implementer starts on the last one's report. Wait for the
report itself. A `sleep` or a poll stands in for none — pick a duration too short and you dispatch again, too long and
the epic waits on your guess.

## Stages

1. **Implement every ticket** — dispatch `implementer` once per ticket, in the order the epic lists them, one ticket at
   a time: they all commit to the one epic branch, so the next starts once the last one's report names its commits. Pass
   that one ticket besides. You are done when every ticket the epic lists has a report naming its commits.
2. **Open the change request** — dispatch `change-request-creator`. It opens the change request as a **draft** and
   mirrors every assumption the branch's commits recorded into an `ASSUMPTION` comment. Keep the URL it reports.
3. **Adjudicate and review together** — dispatch `assumption-reviewer` and `code-reviewer` in one message so they run
   concurrently. `assumption-reviewer` replies a verdict — `accept`, `override` or `escalate` — to every `ASSUMPTION`
   comment. `code-reviewer` drives one **round**, whose findings the tools server posts as comments itself.
4. **First fix wave** — dispatch `comments-addresser`. It works every unresolved comment: implementing the overrides and
   the findings, resolving what it implements or declines, and leaving the escalations for a human. Keep the
   **hand-off** list its report carries.
5. **Second round** — dispatch `code-reviewer` again. It reviews the fix wave's commits, so what the first round missed
   still gets caught.
6. **Second fix wave** — dispatch `comments-addresser` again, for what the second round raised.
7. **Flip it ready** — once two rounds have completed and the last fix wave reports the checks **green**, take the
   change request out of draft and report. Escalations and declined findings ride into the report rather than holding
   the flip:
   they are what the human review is for. When the checks are not green, leave it a draft and report that instead.

## Rounds

A round is one `code-reviewer` dispatch, and **two rounds that reached `completed`** is the bar stage 7 waits on.

- **`completed`** — one of the two. Its report carries the round's `review_id` and its prose; the findings are already
  comments on the change request.
- **`failed` or `cancelled`** — that round produced no review, so it is not one of the two. Dispatch `code-reviewer`
  again: it opens a fresh round under a fresh id.
- **Rounds leave nothing to count.** A resumed run cannot read off how many already ran. When the count is in doubt,
  spend a round — an extra round costs time, while flipping ready on one round ships a review nobody did.

## Progress

The task list is the human's window on the run. You write to it; you take your bearings from the branch and the change
request, as **Resume** has it.

**One dispatch, one task.** Create one per dispatch as the run opens, named from the stage it serves and prefixed with
the epic's slug so two epics can share a session — `<slug>: open the change request`. Stage 3's two concurrent
dispatches get a task each, `adjudicate assumptions` and `first round`. A resumed run opens the same set, with the
dispatches the branch and the change request already account for created `completed`. Mark a task `in_progress` as you
dispatch it and `completed` once you have read its report. `completed` says the dispatch is over rather than that it
succeeded, so a round that died carries its outcome in its subject — `<slug>: second round (failed — no review)` — and
its retry gets a task of its own.

Stage 1 is one task for all its tickets, relabelled as each lands: `<slug>: implement every ticket (4/21)` as the
subject and `Implementing ticket 4/21 — <ticket>` as the `activeForm`, both in the one `TaskUpdate`. The numerator is
how many tickets the `Ticket:` lines name, so a resumed run opens at the count it left off.

## What to report

Whoever reads this has your report and nothing else.

- the change request's URL, and whether it ended draft or ready
- how many tickets were implemented, and how many rounds completed
- what the rounds cost — each round's tokens and its provider-labelled dollar estimate, unknown where a round has none
- how many assumptions were adjudicated `accept`, `override` and `escalate`
- every hand-off, one line each — the escalations and anything else still waiting on a human
- every finding the fix waves declined, one line each, with its grounds
- whether the checks ended green
