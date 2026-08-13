# Deliverer

Deliverer carries one feature from a rough idea to a change request a human can merge. Its domain is the delivery
pipeline itself: the artifacts a feature turns into, the decisions nobody was in the room for, and the review that
catches them.

## Language

### The work

**Epic**:
One feature's whole unit of delivery — a spec and its numbered tickets, sitting together at one location. _Avoid_:
feature, project, initiative

**Idea**:
The rough intent a refinement starts from, in the user's own terms, before anything has been decided. _Avoid_: request,
feature request

**Brief**:
The written record of a refinement conversation — every decision it settled, every fork it left open. The only part of
that conversation that outlives it. _Avoid_: notes, transcript, summary

**Spec**:
The published document stating the problem, the solution, the user stories and the settled decisions. Once published it
is the record, and tickets are cut from it rather than from the conversation behind it. _Avoid_: PRD, design doc,
requirements

**User story**:
One numbered `As an <actor>, I want <feature>, so that <benefit>` line in a spec. Between them they are the coverage bar
a ticket set is measured against. _Avoid_: requirement, acceptance criterion

**Ticket**:
One vertical slice of an epic, sized to fit a single fresh context — because that is exactly what it gets: one ticket,
one agent, one context. _Avoid_: issue, task, story, card

**Tracer bullet**:
The shape a ticket has to have — a narrow but complete path through every layer, verifiable on its own. _Avoid_:
horizontal slice, layer cake

**Blocking edge**:
The declared dependency from one ticket to the tickets that must complete before it can start. _Avoid_: dependency,
blocker, prerequisite

**Slug**:
An epic's short name, carried by the brief, the task list and every artifact, so two epics never collide. _Avoid_: name,
id, title

**Prefactoring**:
A refactor that lands in a ticket of its own, first, to make the slices after it smaller. Make the change easy, then
make the easy change. _Avoid_: cleanup, refactor ticket

**Wide refactor**:
One mechanical change whose blast radius — how many call sites a single edit breaks at once — crosses the whole
codebase, so no tracer bullet can land green. The one exception to vertical slicing. _Avoid_: sweeping change, mass
rename

**Expand–contract**:
The sequence a wide refactor lands in: add the new form beside the old, migrate the call sites in batches sized by blast
radius, delete the old form once no caller remains. _Avoid_: parallel change, migration

**Seam**:
The point in the code a test bites at. Fewer across a codebase is better and one is ideal, and the highest seam that
works beats a lower one. _Avoid_: boundary, interface, injection point

**Triage label**:
The role recorded on an issue as its `Status:` line — one of `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. _Avoid_: state, tag, bare "status"

### Decisions

**Fork**:
A decision the spec leaves open where a different reasonable engineer could have gone the other way, **and** where going
the other way would change behaviour the spec cares about. Both clauses, or it is not a fork. _Avoid_: open question,
ambiguity, gap, TBD

**Assumption**:
A fork the implementing code closed silently and nobody has ratified — the default is already shipped, and the only
thing missing is a human's agreement. Not a bug, and not a question anyone asked. _Avoid_: guess, decision, TODO, caveat

**Verdict**:
The adjudication one assumption receives — `accept`, `override` or `escalate` — recorded as a reply on its comment.
_Avoid_: ruling, judgement, review

**Grounds**:
The evidence a verdict, a declined finding or a reopened ADR stands on: a spec line, an ADR, a caller that breaks, a
concrete failure scenario. Never taste. _Avoid_: reason, justification, rationale

**Claim**:
A statement of fact a document rests on that nobody has checked. Never a finding: the reader's own first-hand look is
what makes it a fact or kills it. _Avoid_: fact, finding, established, given

**ADR**:
A repository's record of one architectural decision — hard to reverse, surprising without context, and the result of a
real trade-off. Standing grounds: a verdict or a declined review finding may rest on one, and a spec that contradicts
one reopens it explicitly rather than overriding it in silence. _Avoid_: design doc, decision record, RFC

**Directive**:
The change an `override` verdict states, for a fix wave to implement as written. _Avoid_: instruction, request, fix

**Escalation**:
A fork a run refused to close because it is genuinely not the run's to close — a product question, or a policy or
security tradeoff with no defensible default. _Avoid_: blocker, question, deferral

**Hand-off**:
An item a run finished without settling and left for someone else, named one line each in its report. _Avoid_: TODO,
follow-up, outstanding item

### Delivery

**Epic branch**:
The one branch every ticket of an epic commits to, and the branch its change request is opened from. _Avoid_: feature
branch, topic branch

**Change request**:
The unit of delivery a human reviews and merges, on whatever forge the repository uses. _Avoid_: PR, MR, pull request,
merge request

**Draft**:
The state a change request is opened in, and stays in while a round is still owed or its checks are red. _Avoid_: WIP,
unready

**Flipped ready**:
Taking a change request out of draft — earned by two completed rounds and green checks, and by nothing else. Escalations
and declined findings ride into the report rather than holding it. _Avoid_: approved, signed off, done

**Channel**:
One of the places a forge carries a change request's comments. Which channels exist, and whether one can mark a comment
resolved, are the forge's own. _Avoid_: stream, surface, location

**Comment**:
One conversation on a change request, carried on one of its channels. Unresolved is the whole filter a fix wave works
from: the channel's own resolution state where it has one, and carrying no reply recording the work where it has none.
_Avoid_: thread, note, discussion

**Assumption comment**:
A comment carrying one assumption verbatim from the commit that recorded it, marked out from every other comment by an
`ASSUMPTION` prefix.

**Review finding**:
Something a round raised about the code, posted as a comment. Implementing one is the default; declining it takes
grounds. _Avoid_: bug, issue, nit, suggestion

**Round**:
One delegated code review of a change request. Two completed rounds is the bar a change request is flipped ready
against, and a round that produced no review is not one of the two. _Avoid_: review, pass, iteration

**Fix wave**:
One pass over every unresolved comment on a change request, ending with each one resolved or on the hand-off list.
_Avoid_: fix pass, cleanup, follow-up commit

**Spend**:
What one round cost — its tokens, and a dollar estimate labelled with the provider that served it. Unknown is the honest
answer for a figure nobody measured, and never zero. _Avoid_: cost, usage, price

**Gate**:
Whatever the repository enforces before a commit lands. Work a ticket asked for is never undone to turn one green; a
gate red for work outside the ticket stays red, and is recorded on the commit as well as in the report. _Avoid_: guard,
pre-commit, local checks

**Check**:
Whatever the forge runs on a change request; **green** is all of them passing. A fix wave owns them whether or not it
was what made them red. _Avoid_: CI, build, pipeline, gate

### The run

**Run**:
One invocation of `/deliverer:refine` or `/deliverer:build`, from its first dispatch to its report. Interruptible by
design: a later run takes its bearings and carries on rather than starting over. _Avoid_: stretch, session, job,
execution

**Orchestrator**:
The agent that reads the epic, dispatches every stage and keeps the task list — and never forms a view on a finding, a
design, or whether the work is good. Read-only: what it does with a stage that went wrong is put it back to an agent —
continued or cold — or report it, never fix it. _Avoid_: coordinator, driver, manager

**Dispatch**:
One agent invocation. It carries paths rather than contents, so the agent opens the document for itself and meets the
repository first-hand. _Avoid_: call, delegation, spawn

**Report**:
The only thing a dispatch returns. What it names is what the orchestrator knows, so what it leaves out is invisible.
_Avoid_: output, result, summary

**Writer**:
A dispatched agent that meets the codebase first-hand but never the conversation — which is what makes the brief
load-bearing. _Avoid_: author, generator

**Bearings**:
What a resumed run reads its position from: the artifacts on disk, the commits on the branch, and whether a change
request is open. Never a task list, never what a finding says, and never a comment's replies — a stage whose only
evidence would be those is dispatched again instead. _Avoid_: state, progress, checkpoint

**Frontier**:
The open questions a grilling still has to close. Stage 1 of a refinement is done when it is empty and the human
confirms a shared understanding. _Avoid_: backlog, queue, open items

**Sweep**:
A fact-finding dispatch a grilling makes to settle a question of fact, carrying the subject it was asked to settle. A
question on the frontier that turns on that subject waits for the sweep; every other question is asked now. _Avoid_:
sub-agent, exploration, lookup, research
