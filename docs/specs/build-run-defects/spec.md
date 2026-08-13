# Six defects an observed delivery run exposed in the plugin's own machinery

Status: ready-for-agent

## Problem Statement

A human delivered one **epic** with `/deliverer:build` against a repository on GitHub: eight **tickets**, six of them
`ready-for-agent`, twelve **dispatches**, three hours forty-three minutes. It worked. The **change request** it produced
was correct, and the **orchestrator**'s judgement was sound throughout — it refused to **flip** the change request
**ready** on one completed **round** and reported that plainly rather than dressing it up.

The machinery underneath it cost the human six things it did not have to.

**The filter three agents depend on did not exist.** All 43 **assumption comments** and all 43 **verdict** replies were
posted through the forge's general comment channel, which carries no resolution state at all — 90 comments that can
never be resolved, against 10 that can. `comments-addresser` says *"**Unresolved** is the whole filter, and it is what
makes a re-run safe"*, and for 86 of 90 comments there was no "open" state to read. Three agents noticed and each
invented a *different* substitute. Then the consequence bit: a second **fix wave** searched for outstanding work and
reported *"only **two** unresolved items, but the team lead mentioned **three** escalations… they're likely issue
comments rather than review threads"*. It recovered only because the orchestrator's dispatch prompt independently
carried the number three. Without that cross-check an **escalation** waiting on a human would have been dropped silently
— the exact failure the unresolved filter exists to prevent. The anchoring data was present and thrown away into prose:
43 of 43 assumption entries carry an exact `file:` and `line:`.

**An agent re-delegated its whole job to a second copy of itself.** Dispatched once as `change-request-creator`, the
agent reasoned *"there's a specialized agent designed exactly for this task—deliverer:change-request-creator—that opens
an epic's change request as a draft and mirrors branch assumptions into comments. That's what I should be using instead
of handling this manually"* — and dispatched it. It did not know it *was* the change-request-creator. The sentence it
quoted is its own `description:` frontmatter, restated back to it by the host's registry of available agents, and the
"find the right specialist" heuristic fired correctly and pointed at itself. It then re-ran `git status`, `git log` and
two forge commands it had already run, purely to build the delegate's prompt. The same reasoning appeared two days later
in a `code-reviewer`. Separately, an `implementer` ran `find / -name "*.md" -path "*deliverer*"` to read **its own agent
definition** — for a convention that was already in its prompt — and the search turned up two plugin trees it then had
to disambiguate.

**Every round reports its tokens as zero.** Stage 7 is required to report *"each round's tokens and its
provider-labelled dollar estimate"*. The orchestrator reported *"Round 1 completed — 3 findings, $5.01 (**token counts
came back as zeros**, so cost is the only real figure)"*. The dollars survive and the tokens do not, on every round,
forever — and `CONTEXT.md` is explicit that unknown is the honest answer for a figure nobody measured, and never zero.
The round's true **spend** was roughly 48,200 output and 344,100 cache-creation tokens, none of it reported.

**A stage's report never arrived, and the orchestrator is forbidden to read the one fact it needed.** Seven of twelve
dispatches signalled idle without delivering a **report** — all six implementers and the first fix wave — costing 9m 09s
of recovery. Recovery worked because the commits are self-describing, an undocumented second channel that rescued the
run six times. It does not cover everything: *"Six fix-wave commits landed and the branch is in sync with origin… **But
I still need its report for the check status and hand-off list**."* Meanwhile the delivery skill tells the orchestrator
its bearings say which stage is owed *"not what a finding says or whether a **check** is green"* — narrower than
ADR-0013, which is titled for the repository **and the forge** — and stage 7 flips on what the fix wave *reports* about
the checks rather than on the checks. So the one fact the flip turns on is the one fact a missing report takes away.

**A failed round was restarted twice by an agent no file authorised to do it.** The second round's four attempts all
died on the same server-side rejection outside the plugin. Two of those four were the `code-reviewer` restarting under a
fresh `review_id` inside its own dispatch — behaviour its definition never grants it, which says to poll to a terminal
status and report.

**The orchestrator narrates events that need no action.** Four near-identical messages of the form *"Post-report idle
signal from the assumption reviewer — already accounted for"*, in a run where the task list already exists as the
human's window.

## Solution

Six changes, each landable and reviewable on its own.

### 1. Every agent knows what it is, and that its prompt is complete

Each **agent** definition asserts three things about itself before it states its task: that it *is* this agent, that
there is no better-suited agent to hand the work to, and that its instructions are complete — nothing on disk adds to
them. The prohibitions its frontmatter already declares are restated in prose, because the frontmatter is not holding.

### 2. A comment that can actually be resolved

An assumption comment is posted through whatever conversation mechanism the forge can mark **resolved**, and each agent
is taught the operation it performs — posting, replying-and-resolving, or listing what is unresolved — with two worked
examples and the instruction to use the equivalent elsewhere. The entry's `file:` and `line:` are the anchor that
mechanism needs rather than prose, falling back to the commit that recorded the assumption when the anchor no longer
exists. Every agent that counts or matches a comment reads every channel the forge has, so nothing posted the old way is
invisible. And where a forge or an existing change request offers no resolution at all, the reply is the mark that the
comment was worked.

### 3. A round's spend comes from where the SDK actually reports it

The token counters come from the per-model usage the result message carries — which the server already reads for the
model label — rather than from the aggregate counters that the delegating shape of a review leaves at zero. A zero
publishes as unknown.

### 4. A check's state is a mechanical fact

Whether a check is green is a fact about the forge, exactly as mechanical as whether the tree builds. The orchestrator
reads it, stage 7's flip turns on what it read, and the fix wave still reports it — a disagreement is a re-dispatch. A
**gate** left red for work outside the ticket is recorded on the commit as well as in the report.

### 5. A failed round is reported, never restarted in place

A round that ends `failed` or `cancelled` is reported as the round it was. Starting another one inside the same dispatch
is not the reviewer's to do.

### 6. A signal that needs no action needs no message

Progress goes to the task list that already exists for it.

## User Stories

1. As a human merging a change request, I want every **assumption** on it to sit in a conversation I can resolve, so
   that my review has the same affordances as any other review I do.
2. As a human merging a change request, I want an **escalation** to stay visibly open, so that the one thing waiting on
   me cannot be mistaken for settled work.
3. As a human merging a change request, I want an `accept` to look different from an `escalate` without reading prose,
   so that the state of the branch is legible at a glance.
4. As a human running a delivery, I want an escalation never to be silently dropped, so that a fix wave under-counting
   outstanding work is a reported mismatch rather than an invisible loss.
5. As a human running a delivery, I want each round's tokens in the report, so that I can tell an expensive round from a
   cheap one.
6. As a human running a delivery, I want a figure nobody measured reported as unknown, so that a confident zero never
   reads as a cheap review.
7. As a human running a delivery, I want the change request flipped on the forge's own account of its checks, so that a
   missing report cannot cost me the flip.
8. As a human running a delivery, I want a **gate** left red recorded on the commit, so that the reason survives a
   report that never arrives.
9. As a human running a delivery, I want no dispatch spent on a round the reviewer already knows it cannot run, so that
   a dead round costs one attempt rather than four.
10. As a human running a delivery, I want the run's narration to carry only what needs my attention, so that the signal
    is not diluted by events that required no action.
11. As a human running a delivery on a forge that is not the one this plugin was observed on, I want the rules stated as
    capabilities, so that my forge is not quietly unsupported.
12. As a human running a delivery, I want an in-flight change request opened before this change to keep working, so that
    landing it does not strand the epic I am mid-way through.
13. As a **change-request-creator**, I want to know that I am the change-request-creator, so that I do the work instead
    of looking for the specialist who does it.
14. As a change-request-creator, I want to be told there is no better-suited agent, so that a registry entry describing
    my own task cannot read as a recommendation.
15. As a change-request-creator, I want the mechanism for a resolvable comment named, so that the obvious verb is not
    the wrong one.
16. As a change-request-creator, I want two worked examples and the instruction to find the equivalent elsewhere, so
    that an unfamiliar forge is a translation rather than a guess.
17. As a change-request-creator, I want to read every comment channel before I post, so that resuming over a change
    request whose comments were posted the old way does not duplicate 43 of them.
18. As a change-request-creator, I want the fallback for an anchor that no longer exists stated, so that I do not invent
    one per assumption.
19. As a change-request-creator, I want the comment body to stay verbatim whichever way it is anchored, so that the
    **hand-off** the comment carries is unchanged by the mechanism carrying it.
20. As an **assumption-reviewer**, I want to collect from every comment channel, so that an assumption posted on the
    other one is not silently left unadjudicated.
21. As an assumption-reviewer, I want the resolving operation taught, so that an `accept` I mean to close is actually
    closed.
22. As an assumption-reviewer, I want to know what to do when resolution is unavailable, so that an `accept` on a legacy
    comment still records that it was adjudicated.
23. As a **comments-addresser**, I want to collect from every comment channel, so that my filter counts the work that
    exists rather than the work one channel happens to hold.
24. As a comments-addresser, I want a durable mark for work I did on a comment I cannot resolve, so that a re-run does
    not implement the same **directive** twice.
25. As a comments-addresser, I want my own instructions to be complete, so that I never search the filesystem for a
    convention I was already given.
26. As an **implementer**, I want a red gate to have a place in the commit, so that the fact survives whether or not my
    report does.
27. As an implementer, I want to be told my prompt carries every convention I need, so that I do not walk the filesystem
    and find two plugin trees to choose between.
28. As a **code-reviewer**, I want the boundary of my dispatch stated, so that a round that could not run is reported
    rather than retried under a new id.
29. As a code-reviewer, I want a round's **spend** to be a real figure, so that the one thing I am asked to carry back
    about cost is not always zero.
30. As an orchestrator, I want a check's state to be mine to read, so that the fact stage 7 turns on does not depend on
    a report arriving.
31. As an orchestrator, I want to know that a reply can be the mark that a comment was worked, so that a delivered epic
    whose comments cannot be resolved does not read as perpetually owing a fix wave.
32. As an orchestrator, I want to spend no message on a signal that needs no action, so that the human's window stays
    the task list.
33. As an orchestrator, I want my agents not to dispatch agents of their own, so that the roster stays the one I can
    account for in my report.
34. As an orchestrator, I want to be the only writer to the task list, so that a task I never marked cannot appear
    complete.
35. As a contributor, I want the decision that permits naming a forge as an illustration recorded where the rule against
    it lives, so that the shipped prose and the decision above it do not contradict each other.
36. As a contributor, I want the decision about which facts the orchestrator may read recorded in the ADR that scopes
    it, so that the skill is not the only place a reader can find it.
37. As a contributor, I want the diagnoses this change rests on checked against the source before they are implemented,
    so that a **claim** from an observation report is not built on as a fact.
38. As a contributor, I want the six changes independent, so that one of them being wrong does not hold the other five.
39. As a contributor, I want each file's register and wrapping preserved, so that the change reads as though it was
    always there.

## Implementation Decisions

### Modules touched

- **The seven agent definitions** (`plugin/agents/*.md`) — identity and the prose prohibitions, all seven. Three of them
  also gain the comment mechanism, one the commit trailer, one the round boundary.
- **The delivery skill** (`plugin/skills/build/SKILL.md`) — the bearings and the flip, the reply-as-mark rule, and the
  narration clause. Three of the six changes touch this file, in different sentences.
- **The review backend** (`plugin/mcp/server/agent-backend.ts`) — the spend extraction only.
- **The ADR on the plugin naming no forge** (`docs/adrs/0012-the-plugin-names-no-forge.md`) — amended.
- **The ADR on the orchestrator's judgement** (`docs/adrs/0015-the-orchestrator-forms-no-judgement.md`) — amended.
- **The glossary** (`CONTEXT.md`) — **already landed**, see Further Notes.

### Identity

- **D1. Three clauses, in the body, in all seven agents.** That it *is* this agent, that no better-suited agent exists
  to hand the work to, and that its instructions are complete. The `name:` frontmatter was already correct and did not
  prevent the self-delegation, so the fix has to be prose the agent reads. It goes before the task imperative: the
  imperative is what the registry entry paraphrases, so identity has to be met first.
- **D2. The completeness clause goes in all seven, not only where the disk hunt was observed.** The convention the
  implementer went looking for was already in its prompt, so inlining conventions is not the fix and nothing about the
  behaviour is specific to that agent.
- **D3. The prohibitions are restated in prose: no dispatching an agent, no writing to the task list.**
  `disallowedTools` is declared correctly in all seven definitions and does not hold — two blocked calls went through
  and took effect, one of them spawning the duplicate agent above. The frontmatter stays; prose is the only layer the
  plugin fully controls.
- **D4. Identity is asserted, not argued.** One or two sentences per file in that file's own register — not a shared
  block, because the plugin has no include mechanism and seven copies of one paragraph would drift.

### Comments that can be resolved

- **D5. The requirement names a capability, and each file teaches only the operation it performs.** The creator learns
  posting, the reviewer replying-and-resolving, the addresser listing what is unresolved. Two worked examples each —
  GitHub and GitLab — and the instruction to use the equivalent on any other forge. Teaching only the posting verb was
  rejected: the reviewer and the fix wave each invented a *different* substitute in the observed run, so both need an
  answer, and on at least one forge the resolving and listing operations are not the same interface as posting.
- **D6. ADR-0012 is amended with an illustration carve-out** rather than left to contradict the shipped prose. Naming a
  forge to illustrate a mechanism is permitted; conditioning behaviour on a host stays forbidden; the vocabulary rule is
  untouched. A separate ADR for the exception was declined — two documents would then state the same rule differently.
- **D7. The entry's `file:` and `line:` are the anchor, and the body stays verbatim.** The data is already produced on
  every assumption and was being rendered as text. Carrying the entry over verbatim is ADR-0014's requirement and is
  unchanged by anchoring it.
- **D8. The property is non-negotiable; the anchor is best-effort.** Where the anchor no longer exists on the head
  commit, the comment anchors to the commit that recorded the assumption, which the comment's prefix already names.
  Anchoring to the nearest surviving line was rejected — it puts the comment somewhere misleading.
- **D9. Every agent that counts or matches a comment reads every channel the forge has.** This is what makes the
  under-count impossible rather than merely unlikely, and it is what keeps a change request opened before this change
  working: its comments are on the old channel, and a creator that cannot see them posts duplicates while a collector
  that cannot see them skips work. **Amended by the review wave** — the orchestrator is not one of the agents this
  covers, because it no longer counts comments at all: see D10. The three agents that do also read the reviews' own
  summary bodies, a channel this decision missed, and their reads are paginated and field-filtered, without which
  "reads every channel" was satisfied by a call that returned the first hundred of them.
- **D10. Where a comment cannot be resolved, the reply is the mark, and two places say so** — the reviewer's `accept`
  path and the addresser's done-mark. **Amended by the review wave**, which cut the third: on a channel with no
  resolution the reply is also the only evidence the orchestrator could read, and a **verdict** owing a change is
  indistinguishable from a reply recording one without judging what the two say. So the orchestrator reads no comments,
  and a resumed run dispatches the adjudication and the fix wave again — which answers the failure this decision was
  guarding better than the bearings clause did, since a delivered epic now has its wave dispatched, finds nothing, and
  flips ready. The mark also carries a back-reference now: a reply naming nothing is unattributable on a change request
  carrying dozens of comments, so an interrupted run cannot tell which one it answers.
- **D11. Nothing verifies the mechanism at write time.** A proof on the first comment before posting the rest was
  considered and declined: the worked examples plus reply-as-mark absorb a wrong verb, and the check costs a round-trip
  on every run to catch a class of error the examples exist to prevent.
- **D12. No count reconciliation between the fix wave and its dispatch.** Reading every channel closes the under-count
  at its source, which is a better fix than asserting on a number the dispatch happened to carry.
- **D13. Legacy comments are not re-posted.** Reply-as-mark covers them without putting a second copy of 43 comments on
  a change request a human is already reading.

### Spend

- **D14. The token counters come from the per-model usage on the result message, summed across its entries.** A review
  calls more than one model — a cheap one for subtasks beside the one the round was configured with — and every one of
  those tokens is real spend. The model *label* stays the costliest entry, which is a separate decision the module
  already records and which this must not disturb.
- **D15. The aggregate counters remain the fallback.** They are correct whenever the review does its own work rather
  than delegating it, and absent is still what a result reporting neither says.
- **D16. A zero publishes as unknown.** `CONTEXT.md` defines **spend** so that unknown is the honest answer for a figure
  nobody measured and never zero, and the observed run is exactly the case: a confident zero beside a real dollar
  figure.
- **D17. Nothing reads a transcript off disk.** Summing usage across the spawned session's sub-agent transcript files
  was the observation report's own suggestion and is rejected: it makes the module depend on a filesystem layout that is
  an implementation detail of the SDK, in a module that deliberately imports nothing from the SDK — not even a type —
  and narrows every field structurally for exactly that reason. The counters are already on the message it reads.
- **D18. The published status shape does not grow.** No field is added; this is a change to what one existing field is
  read from.

### Checks and gates

- **D19. A check's state is a mechanical fact the orchestrator may read.** The clause forbidding it is narrower than
  ADR-0013, which already scopes bearings to the repository *and the forge*, and it predates the stage-7 requirement
  that depends on it. What stays forbidden is unchanged: a **review finding**, a design, whether the work is good.
- **D20. Stage 7's flip turns on the checks as read, and the fix wave still reports them.** Two accounts of one fact is
  not a conflict to resolve in the flip: a disagreement means a report and the forge disagree, which is a re-dispatch.
  Reading them only when the report is missing was rejected — a second path that runs only when something has already
  gone wrong is the path least likely to work.
- **D21. A gate left red for work outside the ticket is recorded on the commit as well as in the report.** The commit is
  the durable channel that rescued the observed run six times; this makes the last fact that lived only in a report
  durable too. The glossary entry for **gate** already says so. **Amended by the review wave** — a trailer with no
  reader is not durable, only written down, so the orchestrator reads `Gates:` off the branch and its report names them.
  It
  reads them every run rather than only when a report is missing, on the grounds this section already gives for the
  checks. The creator also learned where `Assumptions:` ends, since both sections number their entries the same way and
  the only parser of the format was never told there was a second one.
- **D22. ADR-0015 is amended to cover the forge as well as the tree.** The amendment is not a substitute for the skill
  text: no file under `plugin/` cites an ADR and `docs/adrs/` does not ship, so a rule recorded only there reaches no
  runtime agent.

### The round boundary

- **D23. A round that ends `failed` or `cancelled` is reported and never restarted inside the same dispatch.** Two of
  the observed run's four attempts were the reviewer restarting under a fresh id, which no file grants it — its
  definition says poll to a terminal status and report. This is the contract half only: no circuit breaker, no change to
  the round budget, and no classification of a failure as retryable or not. See Out of Scope.

### Narration

- **D24. One clause: a signal that needs no action needs no message, and progress goes to the task list.** The clause
  lands without the observation report's cost attribution, which does not survive checking — see Further Notes.

### Bounds on the change

- **D25. Two ADR amendments and no new ADR.** Both amendments exist because a shipped rule would otherwise contradict
  the decision above it. Neither change clears the bar for a new one. **Amended by the review wave** — three amendments
  now. ADR-0013 listed the change request's comments as what a resumed run reads its position from, which is what D10 as
  amended removes. Still no new ADR: extending a precedent that ADR already sets for rounds is not a fresh trade-off.
- **D26. The six changes stay independent.** Three of them touch the delivery skill, in different sentences, so they can
  land in any order. **Spent by the review wave** — its clusters rewrite prose that three of the six tickets share, and
  one of them reverses a clause another landed. The wave's own commits are ordered instead: the mark's identity first,
  because the worked commands and the boundary rule both edit prose it rewrites.
- **D27. Register and wrapping are preserved per file** — load-bearing bold, no hedging, second person in the agents and
  the skills, and each file's prevailing column width.
- **D28. Nothing outside this repository.** The harness defects and the infrastructure fault the run also exposed are
  hand-offs, not work: see Out of Scope.

## Testing Decisions

**One seam, and it already exists.** `eventFromMessage` in the review backend is exported and pure — one SDK-shaped
message in, one lifecycle event or nothing out — so the spend change is checkable at the highest point it can be, with
no new seam and nothing rearranged to reach it. Preferring it is not a close call: the alternative is a private function
reached through the SDK.

**The scripted backend cannot reach this change, and that is not a gap.** It replaces the whole backend the extraction
lives in, so it exercises the lifecycle, the reducer and the projection — none of which is where the defect is. It is
still run, because `CLAUDE.md` requires the review lifecycle exercised against it whenever server behaviour moves, and
what it proves here is that the change did not regress the lifecycle around it.

**What a good check looks like for the spend change** — external behaviour of the extraction, not its internals:

- A result message with zeros in the aggregate counters and real per-model counters publishes the real figures.
- A result message with real aggregate counters and no per-model usage still publishes the aggregate ones.
- A counter absent from both publishes as unknown, and a genuine zero publishes as unknown rather than as zero.
- More than one per-model entry sums, while the model label stays the costliest entry.
- Every other field the extraction already produces is unchanged — the dollar estimate, the provider, the canonical
  model, the turn count and its existing fallback.

**Added by the review wave**, because the property above was satisfiable by a version that mixes two scopes in one row:

- A result message carrying a genuine per-model zero **beside** real aggregate counters publishes the per-model reading
  for every counter, and unknown for the zeroed ones — never one counter from each source. The source is chosen once per
  message, not once per counter.
- An empty per-model map is a message with no per-model usage, and falls back whole.

**Prior art:** none in-repo, because there is no test suite — `plugin/mcp/package.json` has exactly two scripts. So the
check is a throwaway script that imports the function, feeds it hand-written messages and prints what comes back, run by
hand and **not committed**, alongside `npm run typecheck && npm run lint` from `plugin/mcp`, which is the whole of CI.

**The five prose changes have no seam, and that is the finding rather than an omission.** Nothing lints, wraps or
spell-checks markdown, `deliverer` is deliberately absent from this repository's own `enabledPlugins`, and no forge is
reachable from CI. They are verified by hand, which is how everything outside `plugin/mcp` is verified:

- Every snippet an implementer intends to replace is confirmed present in the current source **before** editing, and a
  mismatch is reported rather than guessed around.
- The reply-as-mark rule reads consistently in all three places it appears, and does not contradict "unresolved is the
  whole filter" where both are in view.
- The worked examples read as illustrations of a mechanism and never as a branch in behaviour — no rule anywhere
  conditions on which forge is in play.
- The glossary's own words are used, and the synonyms its `_Avoid_` lists displace are not.
- The register bar in D27 holds, and each file's prevailing column width is matched.

**Nothing exercises the comment mechanism before a user does.** That is the honest state of the largest change here: the
plugin does not run against this repository, and no forge is available to CI. It is the reason D5 states a capability
and a test an agent can evaluate first-hand, rather than a procedure nobody can check.

## Out of Scope

- **Parallelising stage 1 across worktrees.** The largest speed lever observed — six serial implementer dispatches, 59%
  of the run's wall-clock — and declined here with grounds. It changes the **epic branch** model, the accumulating
  dispatch context the observation report itself measures as load-bearing, and stage 1's single-task progress model. It
  needs its own grilling and its own spec, not a bullet in this one.
- **A circuit breaker, a failure classification, and the round budget.** Four identical failures were paid for, and the
  decision is to observe more occurrences before choosing a policy. The judgement in the delivery skill that says to
  spend a round when the count is in doubt is unchanged, as is the orchestrator's freedom to re-dispatch a failed round.
  D23 is the contract half only.
- **A machine-readable reason code on the review status.** It belongs to the deferred classification above, and the
  published shape is documented as exactly the keys the tool contract names.
- **A write-time proof of the posting mechanism**, per D11, and **a count reconciliation**, per D12.
- **Re-posting comments that cannot be resolved**, per D13.
- **Reading spend from transcript files**, per D17.
- **Naming a forge's API as the requirement**, per D5 and D6. The carve-out permits illustration, not a host check.
- **A new glossary term for the items in the observation report.** **Claim** already covers the unverified ones and this
  repository's domain is the delivery pipeline rather than its own quality process.
- **Anything under `plugin/hooks/`, `plugin/mcp/launch.mjs`, or the rest of the tools server.**
- **Host bug reports.** Two are worth someone's time and neither is this change: an agent that signals idle without ever
  delivering its report, which happened on 7 of 12 dispatches; and `disallowedTools` going unenforced for a named
  dispatch, together with the true agent type being lost when a name is passed and a guard whose remediation text names
  the way around it. The plugin has declared the restriction correctly everywhere it can, and D3 is the defence it can
  ship meanwhile.
- **The infrastructure fault.** The observed run's second round died four times on a server-side rejection of the review
  backend's own outbound call, at an edge outside this plugin. It is a hand-off to whoever owns that edge.

## Further Notes

### The review wave, and why it amended this spec instead of writing tickets

Every ticket here was implemented and every criterion ticked before a code review over `main...HEAD` raised 15 findings,
6 more below the cap, and this spec's own decisions as the thing several of them were about. They were fixed on the same
branch, before the change request merged, because `.claude-plugin/marketplace.json` publishes `plugin/` from the default
branch: a merge is live on a user's next plugin update, and two of the clusters break at the scale the observed run
already reached.

Six commits, one per cluster and one for this record: the mark's identity, the worked commands, the `Gates:` boundary
and its reader, the spend source, the glossary, and the amendments above. Each amended decision says what changed and
why, because a decision changes in the one place it lives — which is also why the wave wrote no tickets. What it fixed
is prose these tickets had just written, not work independently deliverable from them, and the grilling that settled it
stands in for the ticket criteria that would have restated it.

**What the wave deliberately did not do**, so the next reader does not mistake it for oversight:

- **No new automated check.** CI is `typecheck` and `lint` from `plugin/mcp`, and every one of these findings passed
  both. Widening it changes how contribution works, which is its own change request.
- **The `## Comment channels` block stays hand-copied into three agents.** There is no include mechanism, and a check
  that the three agree was declined with the point above. Three of the wave's edits landed in it three times.
- **Two findings below the cap stay open**: the identity clause's "no file on disk adds to what you were told to do"
  reads against the same files' "following the project's conventions"; and the nine tickets here write `**Status:**`
  bolded and below the body, where `docs/agents/issue-tracker.md` wants a plain line near the top, so
  `grep '^Status:' docs/specs/` misses all nine.
- **One claim stayed unverified**: whether a GitLab batch review's summary note lands in the discussions list the agents
  already read. The GitHub half of that channel was confirmed against a live change request; the GitLab half rests on
  this spec's existing "one list holds them all", and `gitlab.com` refuses unauthenticated reads.

### The glossary work is already done

One entry was amended during the grilling rather than left for implementation, and is in the working tree now:

- **Gate** — a gate red for work outside the ticket *"stays red, and is recorded on the commit as well as in the
  report."*

An implementer should confirm it is present and consistent with the trailer wording it writes, not re-add it. No other
entry needs touching: **spend** already rules out a zero, **comment** already defines a comment as resolvable, and
**claim** already covers a statement of fact nobody has checked.

**Corrected by the review wave: it was not done, and the reason given here inverted the problem.** That **comment**
defines a comment as resolvable is exactly what the shipped prose went on to deny, in three files — so the entry needed
amending precisely because it already said something. *Channel* also shipped as vocabulary in three agents with no entry
at all, and **bearings** kept listing comments as what a resumed run reads its position from. All three are amended now.

### Three claims the observation report rests on that did not survive checking

The report was produced by direct observation of a running delivery, and its evidence is sound. Three of its *diagnoses*
are not, and were checked against the current source during the grilling:

- **The spend defect is not "the server reads the wrong session."** Nothing in the server reads a session. It reads the
  SDK's result message, and the per-model counters it needs are on that same message — it already reads that map for the
  model label. This is why D17 rejects the transcript-scraping fix the report proposed, and why D14 is a change to one
  function.
- **"Inline the conventions" is already shipped.** The implementer definition carries the commit format, the `Ticket:`
  line and the exact assumption entry shape in its own body. The agent walked the filesystem for a convention it had
  been given, which is why D2 makes the completeness clause the fix rather than more inlining.
- **The orchestrator's share of the run's output is not attributed.** The report measures it at 21.3% and names verbose
  narration as a driver, citing four one-line messages against 147,936 output tokens over 226 minutes, with the
  accumulating dispatch prompts and per-event reasoning unmeasured. The clause in D24 is cheap and costs nothing in
  transparency, so it lands — but as a rule, not as a measured saving.

### The observation record does not survive

It was written under `.claude-tmp/`, which is gitignored, so this spec is the only durable account of the run behind it.
Every figure and quotation above is reproduced here for that reason rather than cited.

### Load-bearing behaviour this change must not disturb

The observed run exercised all of these successfully, and several are the reason a correct change request came out of a
run with six defects in it:

- Refusing to flip the change request ready on one completed round.
- The accumulating dispatch context for implementers — measurably effective: only the first implementer read the epic's
  design document in full, and cache creation fell to a quarter of the first ticket's after it.
- Stage 3's two concurrent dispatches, which put a whole round inside the adjudication's window.
- The model tiering that keeps `code-reviewer` a thin shim over an unrestricted reviewer.
- One comment per assumption, unbatched, per ADR-0014.
- Empirical adjudication: the reviewer ran the base image and counted its certificates rather than taking an ADR's claim
  about it.
- Every escalation tracing to the human-blocked ticket and being left untouched.
- Paths rather than contents in every dispatch, and each agent's first-hand read of the repository.

### The epic behind the observation was later delivered

The second round ran after the observed window once the rejection cleared, a second fix wave ran, and the change request
was flipped ready. The figures above cover the observed window only. Two of this spec's defects — the self-delegation in
a second agent type, and the fix wave under-counting escalations — were observed in that later activity, and are cited
because they are what makes those two findings reproducible rather than one-off.

### Open forks

None. Every decision above was settled with the human in the room.
