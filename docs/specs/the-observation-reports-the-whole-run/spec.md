# The observation reports the whole run, and prices it

Status: ready-for-agent

## Problem Statement

One `/deliverer:refine` **run**, 2026-09-08 09:09:47 → 13:13:42: four hours, 146 API requests, 25.94M tokens, two
**dispatch**es, eight question **round**s. Its **debrief** reported ninety-eight seconds, five requests, no dispatch,
one question round, `unknown-slug`, and **In dollars: unknown**. **It saw 1.6% of the token spend and neither
dispatch**, and then reasoned *from* the gaps: its first **defect** was built on a missing task list and on a stand-in
**slug** for an **epic** that had a real one by 11:59.

Nothing in `plugin/mcp/observer/` has changed since that run. Replaying its three **session record**s reproduces every
failure below, and separates them from the parts that worked.

**The reading half is not the problem.** Handed the whole record, **replay** gets the run right today: `3h50m · 2
dispatches · 8 question rounds · 138 req`, both dispatches named and attached, per-request tokens summing exactly to the
header's total. Dispatch discovery, token accounting, the `unknown-slug` gate, the prose and the forwarding contract all
hold. So does the debrief's own list of defects — those are about the refine skill, and they stand on their own. What
failed is which part of the record the observer read, and when it stopped reading.

### The extent freezes when the run delegates

`run-facts.ts` bounds a run in three steps, and step 1 sets a ceiling past which nothing is the run's: the first turn
the human typed after the run's **last own signal**. Only three things are the run's own — deliverer attribution, a call
to the plugin's own review tools, and a **dispatch** of one of the plugin's own agents (`isOwnSignal`,
`run-facts.ts:441`).

This run's attribution stops at entry 44. At 09:11:47 stage 1 invoked `mattpocock-skills:grilling` and
`mattpocock-skills:domain-modeling` — **because `plugin/skills/refine/SKILL.md` tells it to** — and the host
re-attributed every entry from 55 to 270 to `mattpocock-skills`. The next own signal is the `spec-writer` dispatch at
11:59:51, **2h48m later**. So the ceiling closed on the idea the human typed at 09:11:29, which the run's own first
question had asked them for, and the **extent** became 1m38s. Replaying prefixes of the same record:

| record truncated at | what the observer reads |
|---|---|
| 50, 120, 200, 268 entries | `1m38s · 0 dispatches · 1 question round` — identical every time |
| 300 entries | `3h10m · 1 dispatch · 7 rounds` |
| 358 entries | `3h50m · 2 dispatches · 8 rounds` |

That is the rule working as written. Any run that follows the refine skill does this, and the plugin's own instructions
are what defeat its own attribution.

### A waiting human is finalised as a dead terminal

`observer.ts` finalises on the idle bound — `IDLE_FINALISE_MS = 30 min`, nothing written anywhere — and keeps watching
`AFTER_FINALISE_MS = 30 min` after a finalise it was not signalled into. The comment on the first names the case it must
not mistake: *"A human thinking about a grilling question for half an hour is what it must not mistake for a dead
terminal — and where it does, the run resuming un-finalises it again."*

**The human thought for 1h56m.** The largest silence is 7,004s, 09:24:42 → 11:21:26, an unanswered `AskUserQuestion`
from stage 1. The observer finalised around 09:54, watched until about 10:24, and exited roughly an hour before the
human came back. Five further silences over ten minutes sit in the same run (997s, 1133s, 858s, 783s, 735s), so this is
the rhythm of a refinement and not a freak.

**The un-finalise cannot fire, for two independent reasons.**

- **No process.** `observer.ts:349` is unreachable once the watcher has exited, and `hooks/observe-run.sh:128` refuses
  to start a replacement while the marker the dead watcher left is on disk — deliberately, per `clearMarker`'s own
  comment in `announce.ts:274`.
- **No event to recover on.** The record's own `stop_hook_summary` entries show `observe-run.sh` running at 09:11:26 and
  then **not again until 12:00:07** — a turn that ends by asking a question is not a turn boundary, so nothing fired for
  the whole 2h48m. Nor is answering a question a prompt submission: the host's hook reference scopes `UserPromptSubmit`
  to "when you submit a prompt", and its own input documentation says an `AskUserQuestion` answer returns as the tool
  call's result, "different from normal conversation turns where Claude finishes and waits for your next message". This
  run contains **no typed human turn at all** between 09:11:29 and 13:13:42.
- **And the reversal's own test is inert anyway.** `observer.ts:345` reverses a finalise when the extent advances or a
  dispatch appears. While the extent is frozen at 09:11:26 by the defect above, `endedAt` does not move — so a watcher
  that had never died would not have un-finalised at 11:21 either. The two failures compound, and neither fix alone is
  enough.

### The trace and the debrief are not written as one unit

`debrief.ts:119` writes the **trace** first (`distil.ts:111`), then runs judging — a whole-run synthesis, minutes of
model call — then writes the debrief (`debrief.ts:142`). Anything that stops the process in between leaves a newer trace
beside an older debrief, and both are what a human forwards. That is what the artefacts show: the trace ends at
11:23:52, while `debrief.md`'s own **hunch** section says the trace it read "run[s] to `[09:24:42]`", and the **identity
file** still says `finalised: yes`. The debrief spent one of its three hunches noticing its own inconsistency and being
unable to resolve it.

### The debrief cannot price the run

**There is no price table anywhere in `plugin/mcp/observer/`.** `model-call.ts:260` reads `total_cost_usd` off the SDK's
own reply, which is why a debrief can price its own observation at $1.22 while reporting the run it observed as
`unknown`. Yet the record carries every input: per-request `input_tokens`, `output_tokens`, `cache_read_input_tokens`,
`message.model` — and `usage.cache_creation`, which splits cache writes by TTL into `ephemeral_5m_input_tokens` and
`ephemeral_1h_input_tokens`. Every write in this run is 5-minute, so there is not even a TTL ambiguity to hedge.

`CONTEXT.md` has defined **Spend** as "its tokens, and a dollar estimate labelled with the provider that served it"
since the term was written. The dollar half has never been delivered.

**What the absence cost, measured.** Because the observation could not report the run, the run analysed *itself*: twelve
orchestrator requests after the hand-over, at 250,960–307,711 tokens of context, costing **$5.29 — 16.8% of the run** —
and arriving at $77.22, wrong by two and a half times. Priced from the same records at first-party Opus 5 rates, the
run's extent comes to **$28.19**. The alternative to a priced debrief is not "no figure"; it is a sixth of a run's
budget spent on a wrong one.

### Nothing cross-checks a reading against the record's own shape

The two dispatch records sat in the directory `records.ts:280` reads, named `agent-*.jsonl` with `.meta.json` sidecars
naming `deliverer:spec-writer` and `deliverer:tickets-writer`, while the debrief reported "dispatches — 0 — none" and
treated it as normal: *"no review round was started, which is what a refinement looks like"*. A comparison against what
is on disk, with no model call at all, would have caught it. Replay shows the same shape from the other side: truncate
the record to 268 entries with both dispatch records present and the debrief reads `3h46m · 2 dispatches` beside `1
question round · 15s waited on the human` over a 35-entry extent — internally inconsistent, and nothing notices.

## Solution

Five changes, one epic, in dependency order.

1. **A `Skill` call the orchestrator made is one of the run's own signals**, so the extent survives the delegation the
   plugin's own skill instructs. This lands first: everything below reads an extent, and the waiting fix cannot see a
   pending question that the extent excludes.
2. **A run waiting on its human is not a dead terminal.** An `AskUserQuestion` the run asked and nobody has answered
   suspends the idle bound; a ceiling on that one wait, not on the watcher's life, stops a watcher whose terminal was
   killed.
3. **The trace and the debrief move into place together**, so a death during judging leaves the previous consistent
   pair.
4. **Two cheap cross-checks**, reported where an observation records what it lost.
5. **The debrief prices the run** from a dated table in the plugin's own code, with the basis it used stated.

What is deliberately not being done: making a guessed finalise recoverable across processes. The record and the host's
own documentation agree that no hook event fires while a question is pending, so a restart could not have covered the
stretch this epic exists for; the reversal that already exists (D23) is left as it is, working again once the extent
does.

## User Stories

1. As a human who ran a refinement, I want the debrief's wall clock, dispatch count and question rounds to be the whole
   run's, so that a four-hour run does not report as ninety-eight seconds.
2. As a human who ran a refinement, I want the time my run spent inside skills my plugin told it to use to count as the
   run's, so that the plugin's own instructions do not shrink its own report.
3. As a human who took two hours over a grilling question, I want my run still being watched when I come back, so that
   answering a question does not cost me the report of everything after it.
4. As a human who took two hours over a grilling question, I want the debrief I am eventually shown to cover the stages
   that ran after I answered, so that the two dispatches and the spend that followed are in it.
5. As a human whose terminal was killed while a question was on screen, I want the watcher to stop by itself, so that a
   process is not left ticking on my machine indefinitely.
6. As a human whose run resumed after a wrong finalise, I want the debrief to lose the finalised label rather than gain
   a second document, so that one run still has one debrief.
7. As a human forwarding a debrief and its trace, I want the two to be from the same reading, so that I am not sending a
   maintainer two documents that contradict each other.
8. As a human forwarding a debrief, I want its identity file to agree with it about whether the run finished, so that
   the file the next observation reads is not claiming a finalise the debrief does not have.
9. As a human who opened a debrief to find out what a run cost, I want a figure in dollars, so that I do not have to
   spend a sixth of another run's budget working it out by hand.
10. As a human reading a priced debrief, I want the basis stated — the rate table's date, the model it priced and the
    vendor the run's message ids name — so that I can tell a close figure from an exact one.
11. As a human whose run billed through a partner rather than first-party, I want the debrief to say so beside the
    figure, so that a discrepancy against my AWS bill has an explanation in the document rather than none.
12. As a human whose run used a model the table has never heard of, I want the debrief to say that and name the model,
    so that a missing rate does not read as a cheap run.
13. As a human who has not opened the debrief yet, I want the one line the plugin prints to carry the figure, so that
    the question I would have opened it for is already answered.
14. As a human reading a debrief, I want the observation's own cost priced when the host reports no money for it, so
    that the observation is held to the standard it holds the run to.
15. As a human reading a debrief, I want a reading that does not account for a dispatch record on disk to say so, so
    that "0 dispatches" is never presented to me as normal.
16. As a human reading a debrief, I want a reading that left the run's own entries outside its extent to say so, so that
    a frozen extent announces itself instead of being reported as a short run.
17. As a human reading a debrief of a four-hour refinement, I want the third-party skills the run invoked to be named,
    so that where the time went is in the document.
18. As a contributor changing a bound in the observer, I want the reasoning beside the constant, so that the next reader
    learns why twelve hours and not thirty minutes.
19. As a contributor, I want the waiting-versus-dead distinction to be one word in the glossary, so that the spec, the
    tickets and the code comments all say the same thing.
20. As a contributor, I want the term for which part of a session record is the run defined in the glossary, so that a
    figure "of the extent and not of the record" is a sentence a reader can check.
21. As a contributor verifying this by hand, I want the procedure documented — replay a record, and truncate it to a
    prefix to reproduce a mid-run reading — so that the next person can reproduce a lifecycle failure without waiting
    half an hour for a bound to fire.
22. As a contributor verifying this by hand, I want every bound in this change overridable from the environment, so that
    a twelve-hour ceiling can be walked in seconds.
23. As a contributor, I want no run's records checked into this repository, so that verifying the observer never means
    committing somebody's repository, paths and prose.
24. As a contributor, I want the rate table to live where the plugin's own code can read it with no network, so that a
    debrief stays reproducible from a record on disk.
25. As a maintainer receiving a debrief, I want the figures in it to be of one extent throughout, so that a wall clock
    from one reading and a waiting time from another cannot appear in the same document.

## Implementation Decisions

### Modules touched

- **The observer** (`plugin/mcp/observer/`) — the run's bounds and its own signals (`run-facts.ts`), the idle bound and
  the wait ceiling (`observer.ts`), the order the trace and the debrief reach disk (`debrief.ts`, `distil.ts`,
  `trace-file.ts`), the cross-checks and the losses they write, the rate table and the spend and headline wording
  (`debrief-file.ts`, `model-call.ts`).
- **The glossary** (`CONTEXT.md`) — two terms.
- **The contribution guide** (`CONTRIBUTING.md`) — the by-hand procedure gains the truncation form and the new bounds.
- **Untouched, deliberately**: the tools server, every hook script, both skills, every agent definition, `e2e-tests/`,
  and the plugin manifest. No `userConfig` option is added and no hook event is registered.

### The extent survives delegation

- **D1. A `Skill` call the orchestrator made inside the run is one of the run's own signals.** It joins the three in
  `isOwnSignal`. The plugin's own skill text is what sends a run into a third-party skill, so the time it spends there
  is the plugin's business and belongs inside the extent.
- **D2. That alone unfreezes the extent, and the ceiling rule does not move.** Step 1 closes on the first turn the human
  typed *after* the run's last own signal; with the `Skill` calls counted, the last own signal becomes the
  `tickets-writer` dispatch, the idea typed at 09:11:29 sits before it, and the ceiling lands correctly at 13:13:42. The
  "next afternoon" protection that step 1 exists for holds wherever a human's own later work is prose and tools — it
  begins with a turn they typed, and that still closes the ceiling — **and it does not hold where that work itself
  invokes a skill.** Any `Skill` call is one of the run's own signals now, the human's own is one too, and it moves the
  last own signal *past* the turn they typed: step 1 then finds no typed turn to close on and the extent runs to the
  last host built-in that later work made. Walked on a record of the measured shape: a 4h03m run reads 5h20m, with the
  human's own `claude-api` work — the skill it invoked and the `TaskCreate` under it — inside the extent and its tokens
  priced into the run's spend. That residual is recorded beside the rule it comes from, in `isOwnSignal`'s own comment
  (`run-facts.ts`), and D3 is why nothing here guards it: in the record the two shapes are one shape, since the run's
  own delegation also follows a turn the human typed.
- **D3. A typed turn that answers what the run asked for is NOT given an exemption.** It was considered and is not being
  built, and the grounds are that no record we hold demands it: the shape it covers — the run asking for input and the
  human typing it before the run makes any signal of its own — appears in none of them. **What is not grounds for it is
  a cross-check.** D10's two both look outward — entries the extent left *out*, and dispatch record files the reading's
  account places *nowhere* — and neither reports this. Walked on a record of exactly this shape, where the run asks, the
  human types the answer as prose and the run then carries on for half an hour under a third party's attribution alone:
  the extent reads 4m00s of a 35m run, five entries lie outside it, and not one loss comes from either check — because
  those entries carry the third party's attribution and check two reads this plugin's own. D2's residual is invisible to
  both from the other direction, a swallowed stretch being the opposite of what either looks for, and the same walk
  reports nothing there either. A rule this fuzzy is still not worth writing against a case nobody has seen; what is
  corrected here is only the claim that something would notice. Both checks say as much where they are written
  (`run-facts.ts`).
- **D4. Third-party skills the run invoked are named in the debrief, separately from the plugin's own skill.** The
  header still says which of the plugin's skills ran; the skills it delegated to are listed beside it. Naming them is
  what makes 2h48m of a four-hour refinement legible, and it does not widen ADR-0018's bound: a skill's name is the
  plugin's own machinery, and nothing of what those skills did or said travels with it.

### A waiting run is not a dead one

- **D5. An unanswered question the run asked suspends the idle bound.** While the run's own last signal is an
  `AskUserQuestion` with no answer inside the extent, silence is not evidence of a dead terminal — it is the run
  waiting, which is categorically different. `humanTimeOf` already keeps every question by its tool-use id and matches
  answers by `tool_use_id`, so what this needs is the pending ones and when they were asked, not a new reading of the
  record.
- **D6. A ceiling of twelve hours on that one wait, measured from when the question was asked.** Not on the watcher's
  lifetime: `observer.ts`'s own tick comment puts the longest delivery on record at thirty hours, and a lifetime ceiling
  short of that would kill a live run. Twelve hours is six times the longest wait measured, covers an afternoon away,
  and leaves nothing running overnight from a terminal killed at five. When it expires the debrief finalises on exactly
  the guess the idle bound makes today, with its own wording, and the watcher exits.
- **D7. Nothing else in the lifecycle moves.** `AFTER_FINALISE_MS`, `RUN_PATIENCE_MS`, the throttle, the settling tick,
  D23's reversal and the marker contract are all left as they are — and the reversal starts working again as a
  consequence of D1, because an extent that advances is what its test reads. In particular **a guessed finalise is not
  made recoverable across processes**: it was the obvious remedy and the evidence rules it out, since the host fires no
  hook event for the whole of a wait, so a restart could only ever have picked the run up after the stage that followed
  it. `hooks/observe-run.sh` is not touched by this epic.
- **D8. Every new bound is overridable from the environment**, exactly as the existing ones are and for the same reason
  `observer.ts` gives: a twelve-hour ceiling is otherwise walkable only by waiting twelve hours.

### One pair on disk

- **D9. The trace is staged and renamed into place only after the debrief has been written.** The pair appears together
  or not at all, and a death during judging leaves the previous consistent pair untouched rather than a fresh trace
  beside a stale debrief. The identity file is written in the same breath as the debrief, as it is today, so it cannot
  outlive it either. Rewriting the debrief on every trace write was rejected: it would overwrite a judged debrief with a
  facts-only one, which is content lost rather than a label.

### The cross-checks

- **D10. Two comparisons, both against what is on disk, neither costing a model call.** A dispatch record file in the
  directory the reading reads that the reading's own account of the run mentions nowhere; and an entry carrying the
  run's own attribution that falls outside the extent the reading chose. Either writes a loss.
- **D11. They report where an observation records what it lost, and not among the run's defects.** A **defect** is
  something the run cost its human; these are faults in the reading, and the section that exists for "a run whose
  records were damaged, and an observation that degraded" is where a reader already looks for them.

### The run in dollars

- **D12. A rate table in the plugin's own Node code, beside a "rates as of" date the debrief prints.** No network: an
  observation must stay reproducible from a record on disk, and it has never needed a network for anything.
- **D13. First-party rates only, and the debrief says so.** Partner platforms are priced separately from Anthropic
  first-party, and the message id prefix is the only vendor signal a record carries — so a run whose ids name a partner
  is priced at first-party rates, with the prefix and that fact stated beside the figure. The reader learns the number
  is close rather than exact, and why. This is a knowing trade: one rate set to maintain, against an approximation on a
  partner-billed run.
- **D14. Cache is priced per TTL from `usage.cache_creation`.** Writes cost 1.25× input at the five-minute TTL and 2× at
  the one-hour one, and reads 0.1× — and the record splits the two, so the figure needs no range and must not be
  presented as one.
- **D15. A model id the table does not know prices nothing, names the model, and writes a loss.** Unknown stays the
  honest answer for a figure nobody could compute, and never zero — the rule `CONTEXT.md`'s **Spend** already states.
- **D16. The figure appears in the debrief's spend line and in the one-line announcement.** The announcement is what a
  human meets first, and the question it can now answer is the one that made anybody open a debrief at all.
- **D17. The observation's own cost prefers the SDK's measured figure and falls back to the table**, saying which of the
  two it used. Measured beats computed; computed beats unknown.
- **D18. The existing token split is what gets priced** — the whole run, and the orchestrator's own turns within it. No
  third breakdown and no per-model split is added.

### Docs

- **D19. Two glossary terms, already written.** `Extent` names which part of a **session record** is one run and carries
  the rule that every figure in a debrief is of the extent and never of the record; `Waiting` names a run whose own last
  act is an unanswered question, and its definition is the whole distinction — nothing is written while it waits, which
  is what a killed terminal looks like, so the two are told apart by the pending question and never by the silence. Both
  land with this spec, so no ticket carries them. No ADR: every decision here is a constant or a condition, reversible
  in a commit, and this spec is the right place for the reasoning.
- **D20. Comments cite their grill item or decision, as everything in `observer/` already does.** A constant changed
  without its reasoning updated is a regression in itself.

## Testing Decisions

**CI reaches none of this.** `plugin/mcp` typecheck and lint are the only mechanical checks any file here touches, and
they cover the package still building unbuilt. Everything else is verified by hand.

- **Replay is the seam, and truncation is the new half of it.** Pointing `observer/debrief.ts` at a finished run's
  record reproduces the reading exactly and costs nothing; truncating that record to a prefix reproduces a *mid-run*
  reading, which is how every windowing failure in the Problem Statement was demonstrated and is the only cheap way to
  see one. `CONTRIBUTING.md` § Replaying a run's records gains the truncation form.
- **The lifecycle is walked with the bounds turned down.** D8 keeps every constant overridable, so the wait, the ceiling
  and the reversal are each reachable in seconds rather than in hours. The states to walk are: a question asked and not
  answered past the old idle bound; the same run answered afterwards and carrying on; a wait that runs past the ceiling;
  and a killed watcher leaving nothing behind that a later run trips over.
- **The pricing is checked against a hand-count of the same record.** One record, one figure computed by hand from
  `usage`, one figure from the debrief. They match or the table is wrong. This is the only assertion in the epic that
  has an exactly right answer.
- **No fixture is checked in.** The records that reproduce all of this carry a human's repository, absolute paths,
  username and every word of their grilling — the reason they are marked do-not-forward in the first place. A synthetic
  record was considered and rejected: it would only ever contain the shapes we already thought of, and the procedure
  above works with a run of the contributor's own.
- **`e2e-tests/` gains nothing.** The two paid tests assert that a debrief exists and that its header names the run;
  neither this epic's extent nor its dollars is a thing they can cheaply assert, and both tests cost tens of minutes and
  real money per run.
- **The scripted backend does not reach it.** That exercises the tools server's review lifecycle, and no server code
  changes here.

## Out of Scope

- **Making a guessed finalise recoverable across processes**, and any change to `hooks/observe-run.sh` or to the marker
  contract. D7 rules it out on the evidence.
- **Registering a new hook event**, or reading one to detect that a question was answered. No such event exists.
- **The solicited-typed-turn exemption** in step 1's ceiling. D3 defers it to a record that demands it.
- **Partner and third-party rate tables.** D13 takes first-party only, knowingly.
- **Fetching rates at observation time.** Rejected: it would make a debrief unreproducible from a record on disk.
- **A per-model or per-dispatch dollar breakdown.** D18 keeps the existing split.
- **Any `userConfig` option.** Nothing here is configurable by an owner.
- **Anything about the four defects the debrief under examination reported.** They are about `/deliverer:refine`, not
  about the observer, and they stand on their own.
- **The tools server, the review lifecycle, both skills and every agent definition.** No prose the model reads at run
  time changes in this epic.

## Further Notes

**The failure was never in the reading.** Handed the whole record, the mechanical half already produces the right
figures — which is why nothing here rewrites the distillation, the trace, the token accounting or the prose. A future
reader who takes this spec as "the observer misreads runs" will go looking in the wrong module.

**Two defects compounded, and that is the lesson worth keeping.** The frozen extent made the reversal's own test inert,
so the guard D23 built against a wrong finalise could not have fired even in a watcher that never died. Neither fix is
sufficient alone, and the order matters: the extent must be right before a pending question can be seen inside it.

**The cost of an unpriced debrief is measurable, and it was measured.** A run that could not be reported analysed itself
for $5.29 and got the answer wrong by two and a half times. That is the strongest argument in this document for a figure
with a stated basis, and it is also a warning: a figure presented as exact would be worse than either.
