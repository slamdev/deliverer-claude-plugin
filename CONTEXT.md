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
The adjudication one assumption receives — `accept`, `override` or `escalate` — recorded as a reply on its comment. The
newest reply on an assumption is the verdict that stands, since later legwork can overturn an earlier one. An assumption
a **fix wave** recorded has no comment, so it receives none and ships unratified. _Avoid_: ruling, judgement, review

**Grounds**:
The evidence a verdict, a declined finding or a reopened ADR stands on: a spec line, an ADR, a caller that breaks, a
concrete failure scenario. For a **defect**, what the observation itself kept — the **trace**, a **dispatch note**, an
earlier **debrief** of the same **epic**. What makes any of them grounds is that whoever holds the file can find the
thing cited in it. Never taste. _Avoid_: reason, justification, rationale

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
from **over the comments**: the channel's own resolution state where it has one, and carrying no reply recording the
work where it has none. What a wave works besides them is the **fix wave** entry's to say. _Avoid_: thread, note,
discussion

**Assumption comment**:
A comment carrying one assumption verbatim from the commit that recorded it, marked out from every other comment by an
`ASSUMPTION` prefix.

**Review finding**:
Something a round raised about the code, posted as a comment. Implementing one is the default; declining it takes
grounds. _Avoid_: bug, issue, nit, suggestion

**Round**:
One delegated code review of a change request. What it hands back is its **review findings**: posted as comments on the
change request where the reviewer can post them, and carried by its prose where it cannot. Two completed rounds is the
bar a change request is flipped ready against, and a round that produced no review is not one of the two. _Avoid_:
review, pass, iteration

**Transcript**:
Everything one **round**'s reviewer said as it arrived, in order, and the reason the round ended where it did not
complete. A round hands back its prose; the transcript is the whole of what landed behind it, pulled by whoever wants it
rather than carried in what a round reports. _Avoid_: log, output, stream, history

**Fix wave**:
One pass over every unresolved comment on a change request and over the preceding **round**'s prose, ending with each
comment resolved or on the hand-off list and each point the prose raised fixed, declined or handed off. Prose carries no
resolution state, so a wave interrupted part-way works its points again. _Avoid_: fix pass, cleanup, follow-up commit

**Spend**:
What one round — or one whole **run** — cost: its tokens, and a dollar estimate labelled with the provider that served
it. Either half can be known while the other is not. Unknown is the honest answer for a figure nobody measured, and
never zero. _Avoid_: cost, usage, price

**Gate**:
Whatever the repository enforces before a commit lands. Work that was asked for is never undone to turn one green; a
gate red for work nobody asked for stays red, and is recorded on the commit as well as in the report. What was asked for
is the ticket where a ticket is being committed, and the comments being cleared where one is not. _Avoid_: guard,
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
repository first-hand — with one deliberate exception: a **fix wave**'s dispatch carries the preceding **round**'s
prose, because that is the only form a finding the reviewer did not post exists in. _Avoid_: call, delegation, spawn

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

### Observation

**Session record**:
The host's own account of one session, written as it happens, with one beside it for every agent that session
**dispatch**ed. Each entry carries the plugin and skill that produced it, its timings and its tokens — which is what
lets a **run** be found in a record the plugin never marked. The format is the host's, so it is read as a **claim** and
never as a contract. _Avoid_: transcript, log, history, session file

**Observer**:
The process that watches one **run** as it happens and writes its **debrief** — started by the plugin's own hook, and
running outside the run entirely. It changes nothing it watches: read-only over what the run leaves behind, never in
touch with the orchestrator, and never reaching the repository or the forge. Nothing that happens to it reaches the run.
_Avoid_: monitor, watcher, supervisor, critic

**Trace**:
What an **observer** reads in place of a run's own **session record**s: the whole run's shape in order — a line for each
**dispatch**, question round, poll and task update, with its timings and its tokens — and a capped excerpt of whatever
each one carried. Nothing is left out by kind, and volume is all the cap bounds: a delivery's records outrun any context
window, so the trace is what makes a run readable at all. _Avoid_: log, transcript, timeline

**Dispatch note**:
What an **observer** made of one **dispatch** the moment that dispatch finished, read on a cheap tier from that
dispatch's own **session record** — re-read at the note's own budget, wider than the **trace**'s — and kept for the
one synthesis at the end. It exists because a dispatch's interior is the part of a **run** nothing else ever reads:
the per-dispatch **session record**s outweigh a delivery's main one several times over, so under the trace's cap the
whole-run reading sees a stage's shape and never its inside. Carries no bound of its own and is never forwarded,
exactly as the trace is not. _Avoid_: stage note, note, summary, annotation, commentary

**Debrief**:
What observing one **run** produced, written for the human who ran it to forward to whoever maintains the plugin.
Bounded to the plugin's own machinery — the skills, the agents, the dispatches, the timings and the **spend** — and
never the repository being delivered into, which is what makes it sendable unread. _Avoid_: report, summary, analysis,
feedback

**Identity file**:
The small file beside a **debrief** saying which **run** and which repository that debrief is about — the one fact a
debrief may not carry itself, since it is bounded to the plugin's own machinery. It is read by the **observer** of a
later run of the same **epic** and by nothing else, and like the **trace** and every **dispatch note** it is never
forwarded. _Avoid_: sidecar (which is the host's own file beside a dispatch's record), index, manifest, marker

**Defect**:
One thing a **run** cost the human that it did not have to, named in a **debrief** with the **grounds** that show it: a
question nobody needed to answer, a stage that ran twice, a **dispatch** that lost context it was holding, **spend**
nothing came back for. Never about the work a run delivered — that is a **review finding**.
_Avoid_: bug, issue, finding, regression, waste

**Hunch**:
Something an **observer** noticed that nothing it kept can ground, carried in the **debrief** and marked apart from
every **defect**. It is the observer's nose rather than its evidence, and it is written down on those terms. _Avoid_:
guess, suspicion, gut feeling

### Verification

**Harness**:
Everything an end-to-end test is written against and runs under: the builder a test is written with, the matchers it
asserts through, the fixtures it runs against and the run directory it leaves behind. It verifies the plugin and is no
part of it — nothing in it ships. _Avoid_: framework, rig, test infrastructure

**Throwaway repo**:
One private repository on the forge that a test creates for its own use, drives a run against, and destroys once it
passes. A failing test leaves it standing — the change request is the evidence. What a run pushes is why it exists: a
repository the next run inherits would hand it a branch to resume rather than a happy path to walk. _Avoid_: sandbox,
scratch repo, test repo, fixture repo

**Standing repo**:
One private repository on the forge that outlives every test and is only ever cloned from. It is what a run that pushes
nothing needs instead of a throwaway repo — with nothing written back, no two runs can reach each other. _Avoid_: shared
repo, permanent repo, upstream, origin

**Fixture**:
What a throwaway repo or a standing repo is built from: a codebase, the conventions it declares, and — where the run
under test is a build — the epic already published in it. One directory per fixture, named, so a new test brings its own
rather than bending the last one's. _Avoid_: template, scaffold, seed, sample

**Staged copy**:
The plugin's working tree committed into a temporary repository, so an install takes what is on disk rather than what is
on the branch. It is what makes a test cover work nobody has committed yet. _Avoid_: snapshot, build, artifact, checkout

**Run directory**:
Everything one test's run left on disk — the session records, the install it ran against, the staged copy and the
verdict. It outlives the test, in a location no repository is watching, because a run that went wrong is only readable
afterwards. _Avoid_: workspace, temp dir, output, artifacts

**Ceiling**:
What one **run** under test may take and may cost before the **harness** stops it — a wall clock and a **spend**
figure, declared once by the test that runs under them. Reaching one is not a failing assertion and is never reported as
one: it is a finding about the run rather than about the plugin, and it carries what the run had reached when it was
stopped. It covers the run and what the harness spent in the human's seat beside it, and nothing spent out of band —
a **round**'s own review, an **observer** — is in it. _Avoid_: budget, limit, threshold, timeout

**Responder**:
The agent that answers a grilling's questions in the human's place, from the fixture's own brief, and confirms the
shared understanding once the frontier empties. It stands in for the human and for nobody else: it forms no view on
whether the answers were used well. _Avoid_: user simulator, stand-in, answerer

**Verifier**:
The agent that judges what a run delivered, on exactly the questions no assertion can settle — whether a spec coheres,
whether the tickets cover the user stories, whether the code is plausible. What a test can assert mechanically is never
its business. _Avoid_: judge, grader, evaluator, reviewer
