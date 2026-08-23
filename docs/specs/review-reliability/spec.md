# A round's findings reach the human, and a round that failed says so

Status: ready-for-agent

## Problem Statement

A human delivered one 17-ticket **epic** with `/deliverer:build` against a repository on GitLab: 88 commits, all
carrying `Ticket:` lines, 89 **assumptions** mirrored, 29h36m wall-clock. The **change request** it produced was
correct and was correctly left a **draft**. The **orchestrator**'s judgement held throughout.

**The branch received no code review on any axis.** Four **rounds** were driven against that change request. All four
failed, in three distinct ways, and not one **review finding** was ever posted:

| Round | Duration | Failure | Reported spend |
|---|---|---|---|
| 1 | 40.4 min | `API Error: Connection closed mid-response` | $7.97, 87,959 output tokens |
| 2 | 94.2 min | `Prompt is too long`, at turn 1 | $2.10, 8,094 output tokens |
| 3 | ~60 min | the server's 3600s deadline | every figure `null` |
| 4 | ~60 min | the server's 3600s deadline | every figure `null` |

The change request was 66 files, 18,632 insertions, **1.17 MB of diff** — a large epic, not a pathological one.

Five things cost that human more than they should have.

**A round that succeeds on that forge posts nothing either.** Measured directly during the grilling behind this spec:
the platform's review command posts findings only when its target is a GitHub pull request, and on a GitLab merge
request it answers *"`--comment` was ignored: the target is a GitLab merge request, not a GitHub PR"* and prints them
to a terminal nobody reads. Three real findings, zero comments. The four failures hid this: had any round completed,
the run would have recorded a completed round, the **fix wave** would have correctly reported nothing to work, and two
such rounds would have satisfied the bar for **flipping ready** with no review reaching the branch or the human. The
plugin's central quality gate can be passed by a round that reviewed nothing anyone can see.

**A failure reads as a success, and the skill instructs the retry.** All four rounds were reported through a status
whose failure the caller had to read out of prose: rounds 1 and 2 carried their error text where reviewer prose
belongs. Round 2's is a *deterministic* size rejection — the diff overflows the context before the model runs — so
retrying it was known-futile, and the delivery skill's own text pushes the other way: a failed round "is not one of
the two — dispatch `code-reviewer` again", and "when the count is in doubt, spend a round". Only the orchestrator's
own judgement stopped it at four, and stage 7 defines no outcome at all for "no round can complete", so it had to
invent one.

**Work that dies is discarded whole.** The adjudicator ran 256.5 minutes and died having posted **0 of 89** verdicts —
confirmed against the forge, 89 threads with no replies — discarding 535,499 billable tokens and 4h16m. Its
re-dispatch posted **incrementally** and finished the same 89 in ~33 minutes. Nothing in the agent's contract asked for
either behaviour. Four other agents died mid-work, discarding a further 1,333,341 tokens. Two of them died at the
same point, emitting a 700–900 line file in a single write, and 760,091 of those tokens went with them; a third
landed the ticket once it was told to grow the file instead. A fourth left a 12.7 KB draft uncommitted on disk,
which its retry rewrote rather than adopted — finding two real shell bugs in it — but only because the orchestrator
thought to flag the file.

**A fix wave's own decisions reach nobody.** Assumptions are mirrored into comments once, before any fix wave exists.
Fix wave 1's commit recorded two new assumptions that had no comment and so could not be adjudicated, and they were
caught only because that wave's report happened to mention it.

**The driver reasons about a clock it cannot read.** It waits with `sleep`, which is killed at two minutes, and then is
not rescheduled for 17 to 45 — while reasoning aloud about "the 60-minute deadline". One round finished
server-side and sat unnoticed for 17 minutes by the one agent whose whole job was to notice.

In total **8,125,329 billable tokens — 38.6% of the run — produced nothing.**

## Solution

A round's findings reach the change request on whatever forge the repository uses, and where the reviewer will not post
them, they reach the fix wave that will act on them. A round that failed is reported as failed, with a reason a caller
can act on rather than prose it has to parse. A review that is merely slow is no longer killed for it, while one that
is wedged still is. Nothing tells the orchestrator to retry a failure it can see is deterministic, and the outcome it
had to invent — an un-reviewed change request left a draft and reported as a **hand-off** — has a name.

Around that, four contracts stop discarding work: a **verdict** is posted the moment it is reached, a large file is
grown across writes and committed early, an agent that stopped with its context intact is resumed rather than restarted
cold, and a branch ends clean. And a fix wave's own silent **forks** are recorded where every other durable fact about
this branch is recorded — on the commit.

## User Stories

1. As a human running a delivery, I want a round's findings posted on my change request whatever forge I use, so that
   the review I paid for reaches the code rather than a terminal.
2. As a human running a delivery on a forge that is not GitHub, I want the review stage to work, so that the plugin's
   central gate is not silently decorative for me.
3. As a human running a delivery, I want the findings of a round the reviewer did not post to still be acted on, so
   that prose I paid for is not thrown away.
4. As a human running a delivery, I want a round that died to be reported as failed, so that I never count it toward
   the two that flip my change request ready.
5. As a human running a delivery, I want the reason a round failed in one machine-readable word, so that I can tell a
   dropped connection from a diff that will never fit.
6. As a human running a delivery, I want a review that is still working left alone, so that an honest hour-long round
   on a large epic can finish.
7. As a human running a delivery, I want a review that has stopped saying anything aborted, so that a wedge costs
   fifteen minutes rather than four hours.
8. As a human running a delivery, I want no round re-dispatched against a failure that cannot change, so that a dead
   round costs one attempt rather than four and 5h51m.
9. As a human running a delivery, I want "no round could complete" to be a named outcome, so that the run leaves my
   change request a draft and tells me why instead of improvising.
10. As a human running a delivery, I want the epic's whole diff to fit the review, so that a 17-ticket epic is
    reviewable at all.
11. As a human running a delivery, I want 89 verdicts to survive the death of the agent writing them, so that four
    hours of adjudication is not lost to one API timeout.
12. As a human running a delivery, I want an implementer's death to cost minutes rather than a ticket, so that a large
    generated file is not paid for twice.
13. As a human running a delivery, I want an agent that stopped with its context intact resumed rather than restarted,
    so that I do not pay to re-read the epic, the ticket and the codebase.
14. As a human running a delivery, I want the branch to end with nothing uncommitted, so that a dead agent's draft is
    not silently reviewed as though someone had written it deliberately.
15. As a human merging a change request, I want a fork a fix wave closed silently recorded on its commit, so that a
    decision nobody ratified is at least visible where I am reading.
16. As a human merging a change request, I want the run's report to tell me what the review actually produced, so that
    I know whether the branch in front of me was reviewed.
17. As an owner configuring the plugin, I want the model I name to be the model that reviews, so that the setting means
    what it says.
18. As an owner configuring the plugin, I want the shipped default to have room for an epic-sized diff, so that the
    common case works before I read any documentation.
19. As a **code-reviewer**, I want a failure I can name rather than prose I have to interpret, so that the round I
    report is the round that happened.
20. As a code-reviewer, I want no instruction implying I control my own polling cadence, so that I do not reason about
    elapsed time I cannot measure.
21. As a code-reviewer, I want the round's prose carried back whole, so that findings the reviewer did not post are not
    lost with my dispatch.
22. As an **assumption-reviewer**, I want to post each verdict as I reach it, so that dying at assumption 70 costs one
    verdict rather than seventy.
23. As an assumption-reviewer, I want to read the whole set before I adjudicate any of it, so that a conflict between
    two assumptions is still available to me as **grounds**.
24. As an **implementer**, I want to be told to grow a large file across writes, so that I do not die emitting 900
    lines in one call, twice.
25. As an implementer, I want to be told to commit as soon as a coherent piece exists, so that an interruption costs
    minutes of my work rather than all of it.
26. As an implementer, I want pre-existing uncommitted work treated as untrusted, so that I re-derive a dead agent's
    draft instead of adopting its bugs.
27. As a **comments-addresser**, I want the round's findings in a form I can act on, so that a round whose comments
    never landed still gets fixed.
28. As a comments-addresser, I want the commit format for a fork I closed spelled out, so that I record it the way
    every other commit on this branch records one instead of copying a format off the branch.
29. As an **orchestrator**, I want a failed round's reason as a fact rather than a judgement, so that deciding whether
    to spend another round is grounded in something I am allowed to read.
30. As an orchestrator, I want nothing in my instructions pushing me to retry, so that my own judgement is what decides
    it.
31. As a contributor, I want the decision behind the review's bound to say what it now bounds, so that the next reader
    does not restore a wall-clock ceiling on the grounds the old one gave.
32. As a contributor, I want the measured behaviour of the platform's review command written down, so that nobody
    re-derives it from a 30-hour run.
33. As a contributor, I want the posting sentence's wording marked as measured, so that an edit to it is understood as
    invalidating the measurement.
34. As a contributor, I want the plugin's promises to describe what it does on my forge, so that the README is not
    making a claim only one forge keeps.

## Implementation Decisions

- **D1. The server appends the posting instruction to the review prompt.** The review's prompt is built by the tools
  server from the change request's URL and the configured depth; the instruction joins it there. No caller gains an
  input: which forge the change request lives on is not a parameter, and nothing a `code-reviewer` says can change what
  a review is — the same reason depth and model are startup configuration rather than arguments
  ([ADR-0004](../../adrs/0004-code-review-is-delegated-to-a-separate-agent.md)).

- **D2. The wording is the measured wording, and it names no forge.** Verbatim:

  > — the target is a change request on whatever forge this repository uses. Post every finding as a comment on that
  > change request, through the forge CLI already authenticated in this repository, using a comment mechanism the forge
  > can mark resolved, and anchored to the file and line the finding is about wherever that mechanism allows it.

  It asks for a capability rather than naming a host, so it needs no illustration carve-out
  ([ADR-0012](../../adrs/0012-the-plugin-names-no-forge.md)). Because its behaviour rests on measurement rather than on
  a contract, **an edit to this text invalidates the evidence for it** — see *The measurements* below — so a change
  either carries a fresh measurement or is not made.

- **D3. Nothing verifies that the findings landed.** A round that posted nothing still reports `completed` and still
  counts toward the bar. The alternatives were weighed and declined: having the driver count the change request's
  comments before and after would make it the fourth agent carrying a hand-copied set of comment-channel commands and
  the first one to touch the forge, and having the orchestrator count leaves the prose reaching nobody. What replaces
  the check is D4, which makes the findings actionable whether or not any comment exists.

- **D4. Each fix wave dispatch carries the preceding round's prose, and that is a stated exception.** A **dispatch**
  otherwise carries paths rather than contents, so the delivery skill says why this one does not: the prose is the only
  form some findings exist in, and the fix wave is the only agent that can act on them. The exception is written where
  the rule is, or the next reader removes it as an inconsistency. Three consequences are accepted rather than solved: a
  fix wave interrupted part-way re-works findings it already fixed, because prose carries no resolution state and
  **unresolved** is that agent's whole filter; on a forge where the reviewer *did* post, the wave meets each finding
  twice, once as a **comment** and once in the prose; and no record of the round lands on the change request, so a
  human sees the review only in the run's **report**.

- **D5. A terminal failure carries a machine-readable reason code, prefixed into the reason it already publishes.** The
  vocabulary is closed and documented on the status tool: `prompt_too_long`, `deadline_exceeded`, `connection_lost`,
  `not_logged_in`, `no_result`, `backend_error`. No key is added — the published payload is documented as exactly the
  keys the tool contract names, and a prefix on an existing one-line string keeps that true.

- **D6. A result the harness marked successful while saying it failed is a failed round, detected by fixed strings
  anchored at the start of the prose.** The mechanism already exists for the not-logged-in case and its trade is the
  same one: anchoring at the start is what stops a review whose findings *discuss* a dropped connection from failing
  its own round. **Prose the server does not recognise stays `completed`** — the classification only ever demotes text
  it can identify as the harness talking about itself, never text it merely finds suspicious. It extracts no judgement
  and consumes no structure of the reviewer's, so it is not the findings parser that
  [ADR-0005](../../adrs/0005-the-reviews-deliverable-is-prose.md) forbids.

- **D7. The review's bound becomes an idle timeout plus a hard cap: fifteen minutes without an event, four hours
  absolute.** The clock resets on every event the backend reports, including the liveness observer's, so a review still
  calling tools is never aborted for being slow. This is what
  [ADR-0007](../../adrs/0007-the-server-owns-a-reviews-bounds.md) already says the bound is *for* — bounding a failure
  — and the server already treats the event counter and the last-event time as the whole of what distinguishes a
  working review from a wedged one. Fifteen minutes is four times the largest average gap observed (26 events across
  94.2 minutes); four hours is above any round anyone has seen finish and still finite, so no configuration exists in
  which a review runs unbounded.

- **D8. The published deadline figure keeps its name and reports the hard cap.** The idle bound appears in a failed
  round's reason rather than as a second key, for D5's reason.

- **D9. Both bounds stay the server's own constants.** They are declared beside the server's other constants and handed
  to the review lifecycle the way the single deadline already is — not host configuration, so an owner can neither
  raise the cap into a wedged session nor lower it into failing honest rounds (ADR-0007, unchanged on that point).

- **D10. The manifest's default review model gains the one-million-context suffix; the server re-defaults nothing.**
  The default lives where every shipped default lives, so a model an owner names still runs verbatim and
  [ADR-0008](../../adrs/0008-owner-configuration-that-changes-what-a-review-is-fails-closed.md) is untouched. Measured:
  the suffix is accepted on the opus and sonnet aliases and refused outright on haiku, which is exactly why the server
  does not append it to whatever it was given. An owner whose account lacks the entitlement meets a failed round whose
  reason names the option to change, rather than a silent depth change.

- **D11. The delivery skill stops instructing a retry.** The imperative to dispatch `code-reviewer` again after a
  failed round goes, and so does "when the count is in doubt, spend a round". No rule replaces them: the reason code
  from D5 is the fact the orchestrator was previously forced to infer from prose, and the decision is its own to make.
  The bar itself is unchanged — two rounds that reached `completed`, and a round that produced no review is not one of
  them.

- **D12. Stage 7 names the outcome for "no round could complete".** The change request stays a draft and the review
  stage is reported as a hand-off, with the reason codes the rounds ended on. This is the one thing judgement is not
  left to invent, because the run's end state is what the report is *about*.

- **D13. No round budget, no retry cap, and no retryable/not-retryable classification in the skill.** Deliberate, and
  the second time it has been deliberate: the codes describe what happened and the orchestrator decides what it means.

- **D14. An agent that stopped without a report is resumed before it is re-dispatched cold.** The delivery skill says
  so, and says what to do when resume is unavailable — re-dispatch, as today. The cheaper path exists because a cold
  start re-reads the epic, the ticket and the codebase, which is most of what the implementers' cache reads were.

- **D15. One verdict decided is one verdict posted, before the next assumption's legwork begins.** Reading the whole
  set first stays, because it is what makes a conflict between two assumptions available as grounds; what changes is
  that deciding and posting are no longer separated by 88 other assumptions. The reply on the comment is already the
  durable, idempotent record, so this needs no new state — only the instruction not to accumulate.

- **D16. The adjudicator is not batched across dispatches.** 89 assumptions stay one dispatch. The observed
  re-dispatch averaged ~22 seconds per assumption, which is either the honest cost of the legwork or evidence that
  it skimmed; nobody has established which, and splitting the set on an unresolved question would be guessing.
  Recorded as a claim, not a decision.

- **D17. A large generated file is grown across writes, and committed as soon as a coherent piece exists.** In the
  implementer's contract. Two agents died at the same point emitting one 700–900 line write, and a third landed the
  ticket once told this.

- **D18. The branch ends clean, and pre-existing uncommitted work is untrusted input to be re-derived.** Also the
  implementer's contract. It is not only tidiness: on a forge where the review command cannot fetch the change
  request it reviews the *local* tree instead — measured — so uncommitted work on the branch is work the round may
  silently review, and a dead agent's draft is work nobody wrote on purpose.

- **D19. The driver stops sleeping and stops reasoning about elapsed time.** Every phrase implying it controls its
  cadence or can measure a deadline goes. The interval is unenforceable — a two-minute sleep was not rescheduled for
  17 to 45 minutes under concurrency — and an agent told it has a clock invents one: the shipped instruction said
  fifteen seconds and the observed agent slept two minutes, for the second run running.

- **D20. The server keeps publishing its polling hint, and stops claiming a shipped sleep is kept in step with it.**
  The hint is advice for any caller; the comment asserting a hand-maintained pairing with the driver's `sleep` becomes
  false the moment D19 lands, and a false comment about a load-bearing pairing is worse than none.

- **D21. A fix wave records the forks it closed on its commit, and nothing mirrors or adjudicates them.** The commit is
  where this repository already puts the fact that has to survive a report not arriving, and a **gate** left red is
  recorded the same way. The consequence is stated rather than hidden: such a fork ships unratified, and a human meets
  it in the commit rather than as an adjudicated comment. This requires giving `comments-addresser` a commit format it
  does not currently have at all — it recorded assumptions in the observed run only by copying the format off the
  branch — including what its `Ticket:` line carries.

- **D22. Three ADRs are amended and no new one is written.**
  [ADR-0005](../../adrs/0005-the-reviews-deliverable-is-prose.md) says the review posts its own findings as comments;
  that is measured false on a forge it was never run against, so it becomes: the prompt instructs the posting, and
  where the reviewer does not post, the prose is what carries the findings — into the fix wave's dispatch, unparsed.
  [ADR-0007](../../adrs/0007-the-server-owns-a-reviews-bounds.md) takes D7 and D9.
  [ADR-0010](../../adrs/0010-nothing-verdict-shaped-survives-an-unfinished-review.md) gains D6's clause: a result the
  harness marked successful while saying it failed is not a completed review, however the SDK classified it. Each
  amendment says what changed and why, because a decision changes in the one place it lives. ADR-0008 and ADR-0012 are
  untouched, by D10 and D2 respectively.

- **D23. The glossary work is already done.** `CONTEXT.md`'s **Round** entry was amended during the grilling and is in
  the working tree: a round hands back its review findings, posted as comments where the reviewer can post them and
  carried by its prose where it cannot. An implementer confirms it is present and consistent with the prose it writes,
  and does not re-add it. No other entry needs touching — **comment**, **channel**, **spend** and **hand-off** all
  already say what this change needs them to say.

- **D24. Two of the README's promises narrow.** "The findings raised as comments" becomes what the forge allows, and
  "every judgement call the implementation had to make silently … adjudicated" becomes a promise about the
  implementation stage, per D21. A promise the plugin cannot keep on the forge in front of the reader is worse than a
  smaller one it can.

- **D25. The changes stay independent.** Several of them touch the delivery skill in different sentences and several
  touch the tools server in different functions, so they can land in any order and be reviewed apart. Only D21 has a
  hard internal dependency: the commit format has to exist before the rule that a fix wave uses it means anything.

- **D26. Register and wrapping are preserved per file** — load-bearing bold, no hedging, second person in the agents
  and the skills, and each file's prevailing column width matched.

- **D27. Nothing outside this repository.** Four defects this change rests on belong to the platform, and are recorded
  as hand-offs rather than worked around beyond what is above. See *Out of Scope*.

## Testing Decisions

**A good check here tests external behaviour and nothing else**: a message in and an event out, a prompt string built
from its inputs. Nothing reaches for a private function, and nothing asserts on how a result was reached.

**Three seams, and all three already exist.** No new seam is introduced and nothing is rearranged to reach one.

- **The review prompt builder** is exported and pure — a change request URL and a depth in, the prompt string out. The
  posting sentence of D1/D2 is checkable there, at the highest point it exists.
- **The message-to-event narrowing** is exported and pure — one backend-shaped result message in, one lifecycle event
  or nothing out. D5 and D6 are checkable there. It is the same seam the previous server change used, for the same
  reason: the alternative is a private function reached through the SDK.
- **The review lifecycle** already takes its bound and its clock as injected dependencies, so D7's idle timeout and
  hard cap are reachable with a fake clock and small numbers. They remain the server's constants, declared beside the
  others and injected at the tool layer — injectable is not the same as configurable, and the host boundary still
  offers no knob.

**What a good check looks like, per seam:**

- The prompt carries the posting instruction whatever the depth, including when the depth is absent or empty and the
  argument is omitted entirely.
- A successful result whose text begins with the harness's own error prose becomes a failed event carrying the matching
  code; a successful result whose text merely *mentions* an API error stays completed; the not-logged-in case keeps its
  own code and its existing message.
- A failed result from the backend keeps carrying its **spend**, as it does today, and gains its code.
- An event arriving after fifteen fake minutes of silence does not abort; one arriving after sixteen finds the review
  already failed, with the idle bound named in its reason.
- A review that keeps emitting events past the hard cap is aborted at the cap, and the failure says which bound ended
  it.

**Prior art, and the shape it takes:** there is no test suite in this repository — the server package has exactly two
scripts — so these are throwaway scripts that import the function, feed it hand-written inputs and print what comes
back, run by hand and **not committed**. That is what the previous server change did at the same seam, and CI stays
`typecheck` and `lint` in the two packages.

**The scripted backend is still run**, because the project requires the review lifecycle exercised against it whenever
server behaviour moves. What it proves is that D7's rewritten bound did not regress the lifecycle around it: the
one-in-flight rule, the caller-supplied handle, terminal states absorbing, and cancellation.

**The prose changes have no seam, and that is the finding rather than an omission.** Nothing lints or wraps markdown,
`deliverer` is deliberately absent from this repository's own enabled plugins, and no forge is reachable from CI. They
are verified by hand:

- Every snippet an implementer intends to replace is confirmed present in the current source **before** editing, and a
  mismatch is reported rather than guessed around.
- The exception in D4 reads as an exception where the rule it bends is in view, not as a contradiction.
- Nothing anywhere conditions behaviour on which forge is in play; the capability is what is named.
- D19's deletions leave no sentence implying the driver has a clock, and D20's comment no longer names a `sleep` that
  does not exist.
- The glossary's own words are used, and the synonyms its `_Avoid_` lists displace are not.

**What is deliberately not tested:** the posting sentence's *effect*. It rests on the reviewer complying with an
instruction, which no check in this repository can observe — only the measurements below, and only for the wording
they were taken against.

## Out of Scope

- **Any check that a round's findings landed**, per D3, and therefore any definition of a completed round that turns on
  it.
- **Scoping or splitting a round.** A caller-supplied scope was rejected outright: a driver that under-scoped a review
  would report a completed round that read three files of sixty-six, and nothing downstream could tell — the same
  shape as a round inheriting another's result. Server-side splitting is out too: the review command takes one
  free-text target, so "only these paths" is a model-mediated instruction nothing enforces, and if it is ignored one
  failure becomes several. To be reopened only if an epic still cannot be reviewed once D7 and D10 have removed the two
  limits actually observed.
- **Rounds interleaved into stage 1**, triggered by the accumulated diff's size. The most promising structural answer
  and the largest: it changes stage ordering, opens the change request early, and redefines the bar. Its own grilling
  and its own spec.
- **Bounding an epic's size at refinement.** It changes the other command on evidence nobody has yet.
- **A blocking or long-polling status tool.** It would move the driver's waiting into the server where it is
  measurable, and it turns on the host's own tool-call timeout, which nobody has established. D19 is the honest change
  meanwhile.
- **Anchoring findings on a forge that will not anchor them.** Measured: the comments arrive as resolvable discussions
  with no diff position, and the reviewer reports the opposite. Nothing here promises anchoring.
- **Any new automated test, and any change to CI.** Per the Testing Decisions above.
- **A real run against a forge as part of this change.** The two end-to-end tests stay as they are; neither covers the
  review stage's posting.
- **Parallelising stage 1 across worktrees** — still deferred, on its own grounds.
- **Host defects.** Four are worth someone's time and none is this change:
  - the Agent SDK classifying an API error as a successful result whose text is the error;
  - the platform's review command posting findings only when its target is a GitHub pull request;
  - that command reporting comments as anchored to file and line when it posted them unanchored;
  - sub-agent scheduling: a two-minute sleep not rescheduled for 17 to 45 minutes under concurrency.

## Further Notes

### The measurements this rests on

Taken during the grilling that produced this spec, against a live GitLab merge request and a throwaway GitHub
repository, both since deleted. Total spend under a dollar. Reproduced here because the observation record they came
from lives under a gitignored path and does not survive.

1. **The posting flag alone, against a GitLab merge request** — 3 findings, **0 comments**. The reviewer's own
   closing line: *"`--comment` was ignored: the target is a GitLab merge request, not a GitHub PR"*.
2. **The same, plus a posting instruction naming GitHub as an illustration** — 2 findings, **2 resolvable comments**.
3. **The same, with D2's forge-neutral wording** — 3 findings, **3 resolvable comments**, none of them anchored, and
   the reviewer reporting that they were.
4. **GitHub control, the posting flag alone** — 3 findings, 3 **anchored** inline comments.
5. **GitHub, with D2's wording** — 2 findings, 2 **anchored** inline comments and none unanchored: the forge's own
   mechanism is not displaced.
6. **The one-million-context suffix, on three model aliases** — accepted on opus and on sonnet; on haiku,
   `400 The long context beta is not yet available`.

Two structural facts fell out of runs 3 and 5, both instrumented: the review made **no tool calls at all** in the
process the server observes, and reported zero turns. The diff is placed in its prompt by the harness before the model
runs, and the work happens in sub-agents whose events never reach the server. That is why a 1.17 MB diff is rejected at
turn 1, why no instruction can make the review chunk its own input, and why the run's own accounting sees a fraction of
what a round spent.

**One caveat on D2's wording.** Across the instructed runs the finding counts were 2, 3 and 2 against controls of 3
and 3 — the weakest finding is the one that drops. One run each, at the shallowest depth, where the finding count is
capped anyway, so this is a caveat rather than a conclusion. It is an argument for keeping the sentence short, and
against growing it.

### Why the failures were complementary rather than repeatable

Round 2's rejection is deterministic in the input's size: the diff is in the prompt, so no retry of the same round can
succeed. Rounds 3 and 4 show the other half — 273 events of genuine progress that did not traverse the input inside an
hour. The two together are why D7 and D10 are both here: one gives the review room to load the diff, the other gives it
time to walk it, and neither alone was enough.

### What the run got right, and what must not regress

The orchestrator's discipline is why this run failed honestly instead of shipping an unreviewed branch marked ready.
Four properties carried it, and each is load-bearing:

- **The forge is the account of record, never an agent's self-report.** It caught the rounds reporting success while
  carrying an error, the 89 threads with no replies, and it confirmed 17 of 17 tickets by counting `Ticket:` lines.
  Measurement 3 above is a fresh instance: the reviewer said "anchored" and the API said otherwise.
- **Red **gates** read off the commits rather than the reports** — the record that survives a report not arriving.
- **Refusing to flip ready.** Four rounds said completed; counting two of them would have been easy and wrong.
  Whatever D11 and D12 do, a round that produced no review must not become countable.
- **One dispatch, one task, with the outcome carried in the subject.** It made the failure sequence legible from
  outside with no extra logging.

### The two claims this spec does not close

**Whether the adjudicator's incremental re-run adjudicated or skimmed** (D16), and **whether D2's sentence costs a
finding** (above). Both are recorded as claims, both are cheap to settle with one more measurement each, and neither
blocks anything here.
