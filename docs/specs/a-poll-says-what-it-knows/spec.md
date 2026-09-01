# A poll reports what is known about a round and nothing more

Status: ready-for-agent

## Problem Statement

Two **poll**s of the same **round**, observed on one delivery against a GitLab **change request** — the first taken
while the round was working, the second once it had finished:

```jsonc
// running, 11 minutes in
{"reviewId":"…-review-2","changeRequestUrl":"https://…/merge_requests/14","status":"running",
 "verdict":"unknown","counts":{"findings":"unknown"},
 "stats":{"startedAt":"…T15:41:06.923Z","endedAt":null,"events":36,"lastEventAt":"…T15:52:07.352Z",
          "costUsd":null,"turns":null,"inputTokens":null,"outputTokens":null,"cacheReadTokens":null,
          "cacheCreationTokens":null,"agentDurationMs":null,"model":null,"provider":null,
          "canonicalModel":null,"deadlineSec":14400},
 "reason":"","partial":true,"summary":""}

// completed, 9m53s later
{…,"status":"completed","verdict":"unknown","counts":{"findings":"unknown"},
 "stats":{…,"events":41,"costUsd":4.094196,"turns":1,"inputTokens":58,"outputTokens":38247,
          "cacheReadTokens":3281422,"cacheCreationTokens":149702,"agentDurationMs":592936,
          "model":"claude-opus-5[1m]","provider":"firstParty","canonicalModel":"claude-opus-5",
          "deadlineSec":14400},
 "reason":"","partial":false,"summary":"Reviewed MR !14 …"}
```

**Twenty-three leaf fields, and while the round is running fifteen of them carry nothing.** Eleven are `null`, two read
the literal `"unknown"`, two are the empty string, and a sixteenth — `deadlineSec` — carries the same constant it
carried on the poll before it and the poll before that. Of the seven that remain, two echo the start call and one
restates another; three can move while the round runs — `status`, `events` and `lastEventAt` — and the last dates the
record's own creation.

**Eight of the twenty-three have no reader anywhere in the repository**, and each is dead for its own reason:

- **`verdict` and `counts.findings` cannot ever hold a value on a real round.** ADR-0005 makes the review's deliverable
  its prose; the real backend has no findings parser and must not gain one. So only the scripted review double ever
  fills these, and the shipped review agent's own instructions say as much to itself — *"`verdict` and `counts.findings`
  read `unknown` on every real run"*. A field whose documentation is an apology for its own emptiness is not a field.
- **`verdict` also collides with the glossary.** `CONTEXT.md` defines **verdict** as the adjudication one **assumption**
  receives — `accept`, `override`, `escalate`. A round has no verdict in this domain's language, and this key has been
  spelling one for every poll of every round.
- **`partial` is `status !== "completed"`, restated.** The review agent is told both halves in one sentence, which is
  the tell.
- **`lastEventAt` cannot differ from one poll to the next unless `events` does.** It is the record's `updatedAt`, and
  the reducer moves that only when it accepts an event and increments `events`. As the change-detector it was kept for
  it is redundant by construction; what it adds beyond that is a clock, which is the thing `review-reliability`'s D19
  set out to take away.
- **`turns` reads `1` for a round that ran nine minutes and fifty-three seconds.** A measured round reported
  `num_turns: 0`, which is why the extraction carries a fallback to the count of assistant messages. Neither figure has
  a reader.
- **`canonicalModel` restates `model`** — `claude-opus-5` beside `claude-opus-5[1m]`.
- **`deadlineSec` is a constant of the server**, published on every answer to a caller that cannot configure it, cannot
  act on it, and is told elsewhere that the round ends by itself.
- **`changeRequestUrl` is an echo of the start call** that sits in the same session record, three lines above.

**The two figures the complaint calls useless are useless in different ways.** `inputTokens: 58` against
`cacheReadTokens: 3281422` is not a defect — fresh input really is a rounding error, and the four token classes are
priced differently, which is what makes the completed payload a free oracle for the price table the **harness**'s README
verifies its arithmetic against. `turns: 1` is a defect: nothing prices it, nothing reads it, and its own extraction
already distrusts it.

**What it costs.** The payload is pretty-printed at 727 characters — roughly 180 tokens — for the running case above.
The shipped polling interval is 15 seconds and the absolute bound is four hours, so a round that runs to that bound is
answered something like 960 times: on the order of 175,000 tokens of status payload, the great majority of it saying
nothing, in the one **dispatch** that also has to carry the round's whole prose back. That prose is the deliverable, and
`review-reliability`'s D19 already found one agent losing seventeen minutes to poll bookkeeping.

**One status word is unreachable.** The record opens `pending`, and the real backend's first act inside `start` is to
emit `preparing` — synchronously, before the handle is built from the store. So no caller of either tool can observe
`pending` on a real round; only a script can produce it.

**This is not a complaint about all of it.** Every spend field the **observer** reads is load-bearing and reaches the
human: the **debrief**'s round line prints the status, the reason, the dollars, the provider, the model and the time
inside the reviewer, verbatim, for every round of every run. The **round**'s dollars are also the only money any
**debrief** has, because the host records none — so this payload is the one place a measured figure exists at all.

**And there is precedent for the cut.** `review-reliability`'s D19 removed `stats.durationMs` from this same payload for
this same reason, leaving `lastEventAt` behind as the working-versus-wedged signal — which, by the construction above,
`events` was already providing on its own.

## Solution

A poll answers with what is known about the round and stops. Nothing is published as `null`, nothing is published as the
literal `"unknown"`, and no key appears carrying an empty string: absence makes the same claim, and it makes it in four
keys instead of twenty-three.

While a round runs, a poll is its id, its status, when it started and how many events have landed. When it ends, the
same answer gains the ending, what the round **spent** under the glossary's own word for it, and — where it completed —
the prose that is the whole deliverable. Where it failed or was cancelled, the one-line reason. Money is one object a
reader can point at, the four token classes intact inside it for anyone pricing them. What could never hold a value is
gone rather than documented, and the two bounds a round ends on are stated once, where a caller reads what the tool is,
instead of on every answer it gives.

```jsonc
// running
{"reviewId":"…-review-2","status":"running","startedAt":"…T15:41:06.923Z","events":36}

// completed
{"reviewId":"…-review-1","status":"completed","startedAt":"…","endedAt":"…","events":41,
 "agentDurationMs":592936,
 "spend":{"costUsd":4.094196,"provider":"firstParty","model":"claude-opus-5[1m]",
          "inputTokens":58,"outputTokens":38247,"cacheReadTokens":3281422,
          "cacheCreationTokens":149702},
 "summary":"Reviewed MR !14 …"}

// failed
{"reviewId":"…","status":"failed","startedAt":"…","endedAt":"…","events":12,
 "agentDurationMs":112430,
 "reason":"deadline_exceeded: the review exceeded its idle bound of 1800s with no event and was aborted",
 "spend":{"costUsd":8.61,"provider":"firstParty","model":"claude-opus-5[1m]", …}}
```

## User Stories

1. As a human running a delivery, I want the review agent's context spent on the round's findings rather than on
   thousands of tokens of `null`, so that a four-hour round can still hand me back the prose I paid for.
2. As a human running a delivery, I want a poll to tell me what is known about my round, so that reading one answers a
   question instead of raising sixteen.
3. As a human running a delivery, I want no field on a poll that could never hold a value, so that nothing invites the
   agent driving my review to reason about a judgement that does not exist.
4. As a human running a delivery, I want the word **verdict** to mean one thing in this product, so that the
   adjudication of an **assumption** is never confused with a review's own opinion.
5. As a human running a delivery, I want what a round cost me under one name, so that "what did this review spend" is
   one thing I can point at rather than nine fields to reassemble.
6. As a human running a delivery, I want the dollars to travel labelled with the provider that served them, so that I
   know whether I am reading a price or an estimate.
7. As a human running a delivery, I want the four token classes kept, so that the figure that does not depend on a
   provider's price list is still there when the dollars are list-rate arithmetic.
8. As a human running a delivery, I want a round's spend reported to me as a total and a dollar figure, so that my run
   report carries two numbers per round instead of six.
9. As a human running a delivery, I want a figure nobody measured to be absent rather than zero, so that a cheap review
   and an unmeasured one never read the same.
10. As a human running a delivery, I want a round that failed to still report what it burned, so that eight dollars
    spent on a round that died is money I am told about.
11. As a human running a delivery, I want a round that did not complete to carry no prose at all, so that a review that
    never finished can never be read as a clean one.
12. As a human running a delivery, I want the reason a failed round ended to be the only thing in its answer that could
    be mistaken for a result, so that the failure path stays impossible to skim past.
13. As a human running a delivery, I want the status words to name states my round can actually be in, so that a
    vocabulary of six does not describe five.
14. As a human running a delivery, I want the bounds my round ends on documented where I read what the tool does, so
    that they are stated once rather than repeated on every answer.
15. As a human running a delivery, I want nothing in the payload telling the review agent it has a clock, so that the
    seventeen minutes one round sat unnoticed cannot be spent on arithmetic again.
16. As the plugin's maintainer, I want each round's dollars, provider, model and time-inside-the-reviewer to keep
    reaching the **debrief**, so that the only measured money any debrief has is not lost to a tidy-up.
17. As the plugin's maintainer, I want the **observer** to read the round's spend under one obvious key, so that the
    one place a debrief gets money from is not a search through a bag of statistics.
18. As the plugin's maintainer, I want a debrief's round line unchanged in what it says, so that this change is
    invisible in the document that goes upstream.
19. As the plugin's maintainer, I want the completed payload to stay a usable oracle for the price table, so that every
    token total in a debrief still rests on something checkable.
20. As a contributor, I want the fields that left the payload to leave the event, the record and the spend types with
    them, so that the compiler tells me if one comes back.
21. As a contributor, I want the scripted double to stop scripting a verdict nothing can publish, so that the test
    double cannot teach me a shape the product does not have.
22. As a contributor, I want the scripted double to keep scripting spend, so that I can still exercise a failed round's
    money without spending any.
23. As a contributor, I want the whole lifecycle exercisable against the scripted backend after this change, so that
    the omission rule is verifiable in milliseconds with no model and no money.
24. As a contributor, I want the two decision records this contradicts reopened rather than quietly outvoted, so that
    the reasons for the bounds and for withholding a verdict stay in the one place they live.
25. As a contributor, I want the glossary to have the word for what a poll is, so that this change and every one after
    it can be discussed without inventing a term.
26. As a plugin owner, I want none of this configurable, so that no owner can put back the payload the shipped agent
    was measured drowning in.

## Implementation Decisions

### Modules touched

- **The tools server** (`plugin/mcp/server/`) — the projection and its published output schema, the review event, the
  record and the spend types behind it, the status vocabulary, the real backend's spend extraction, the scripted
  double's script and default timeline, and the status tool's own description.
- **The observer** (`plugin/mcp/observer/`) — the one place a round's spend and outcome are read off a poll.
- **The review agent** (`plugin/agents/code-reviewer.md`) — what it is told to read, and what it reports about spend.
- **The delivery skill** (`plugin/skills/build/SKILL.md`) — the run report's round-spend line.
- **Two decision records** (`docs/adrs/0007-…`, `docs/adrs/0010-…`) — amendments, not replacements.
- **The glossary** (`CONTEXT.md`) — one term, **Poll**, already landed.
- **The harness** (`e2e-tests/`) — one matcher on the build happy path, and the price-oracle example in its README.
- **Untouched, deliberately** — the start handle, the cancel result, the transcript resource, every hook, the plugin
  manifest, the refinement skill, and every agent but the review one. The first three were reviewed field by field in
  this epic's grilling and left as they are.

### A poll reports what is known

- **D1. A key appears only when there is something to read.** Unknown is absence: no `null`, no literal `"unknown"`,
  and no empty string. This covers the spend a running round has not reported, the ending a live round has not reached,
  the reason a healthy round has no need of, and the prose an unfinished round does not have. It replaces the fixed
  nine-key promise the payload used to make, which nothing consumed.
- **D2. Absence and `null` make the same claim, and the glossary's rule is unchanged.** A figure nobody measured is
  unknown and is never zero — `CONTEXT.md`'s **spend** entry, ADR-0010's Consequences. Omitting the key is a second way
  of saying the same thing, and the one that costs nothing to send.
- **D3. Four keys are always present**, because they are always known: the review's id, its status, when the record
  was opened, and how many events have landed. Those four are required in the published output schema and every other
  key is optional, which is what makes D1 expressible rather than merely documented.
- **D4. `events` is published even at zero.** Nothing has landed is a measurement, not an absence, and it is what the
  first poll of a round has to say.

### Eight fields leave

- **D5. `verdict` and `counts.findings` go.** They are unfillable by the real backend by design (ADR-0005), and their
  presence is the product's contract shaped by its test double. ADR-0010's rule then rests on the prose alone, which is
  the only verdict-shaped thing a real round ever produces.
- **D6. `partial` goes.** It restates the status. The rule it expressed does not move: a round that is not `completed`
  carries no prose at all, which is the stronger statement of the same thing.
- **D7. `lastEventAt` goes**, on the construction above: it cannot differ where `events` does not. `events` alone is the
  whole working-versus-wedged signal, and two polls agreeing on it need no clock to compare.
- **D8. `turns` and `canonicalModel` go.** Neither has a reader; one is unreliable at source and the other restates its
  neighbour.
- **D9. `changeRequestUrl` goes.** The start call in the same record names it, and the observer takes a poll's id off
  the call rather than the answer, so nothing joins on this.
- **D10. `deadlineSec` goes, and no bound is published as a figure.** Both — the absolute cap and the idle bound that
  ordinarily ends a wedged round — are stated in the status tool's description, where the server already interpolates
  its own constants, and the refusal a caller meets when a review is already in flight goes on naming both as it does
  today. This reopens ADR-0007; see D19.

### What the payload becomes

- **D11. Money moves under the glossary's word.** A `spend` object carrying exactly what `CONTEXT.md` defines as
  **spend** — the four token counters and the dollar estimate — plus `provider`, which labels the dollars, and `model`,
  which is what the provider served. The whole object is absent until a result arrives, so a running poll has no spend
  key rather than an empty one.
- **D12. Duration is not spend.** `agentDurationMs` sits at the top level beside `startedAt`, `endedAt` and `events`.
  It is what the round took inside the reviewer, which is a fact about the run rather than a figure about money.
- **D13. `agentDurationMs` stays even though the timestamps nearly derive it.** In the observed round it is 592,936 ms
  against 593,585 ms of record lifetime. Computing it instead would put the record's own elapsed — the figure D19
  removed for rising whether the review worked or wedged — under a claim about the reviewer that it cannot support.
- **D14. Five status words.** `pending` merges into `preparing`: the record opens `preparing`, which is honest for both
  states — the server has accepted the review and is starting the backend — and is the only thing a real caller could
  ever see anyway.
- **D15. A `text` event promotes `preparing` to `running`.** The branch it replaces promoted `pending`, and text is the
  reviewer's own words: an inner agent that is talking is running. This is the one behavioural difference D14 forces,
  and it is stated here so that nobody closes it silently.

### How deep the cut goes

- **D16. All the way down, so the compiler holds it.** `verdict` and `findings` leave the review event, the record and
  the scripted event; `turns` and `canonicalModel` leave the spend type, the recorded-spend type, its no-spend value,
  its merge and the real backend's extraction — taking the assistant-message counter that existed only as `turns`'
  fallback with it, and the measurement comment that justified it. The spend type's own note says a field added there is
  one the compiler then demands everywhere it travels; this is that in reverse.
- **D17. `updatedAt` stays.** Eviction uses it as the fallback for a terminal record with no ending timestamp, so it is
  load-bearing internally even with `lastEventAt` gone.
- **D18. The scripted double keeps its spend and loses its verdict.** It carries the spend type whole, terminal kinds
  included, and that is what makes a failed round's money exercisable for nothing; its default timeline stops
  publishing a verdict and a finding count, and keeps publishing every spend field so that a by-hand run still shows
  whether they reach a caller.

### What is written down, and where

- **D19. ADR-0007 is amended.** Its grounds are untouched — silence is still what tells a working review from a wedged
  one, the server still owns both bounds, and no owner can tune either. Two of its consequences stop being true and are
  rewritten: that the cap is published as a figure, and that the payload publishes the two figures which measure
  silence. After this, no bound is published, one figure measures silence, and both bounds are documented on the tool.
- **D20. ADR-0010 is amended.** The rule loses two of its three subjects, because they never existed on a real round,
  and keeps its whole force on the third: prose is reported only for a review that completed, terminal states still
  absorb, spend still survives a failure, and nothing is ever defaulted to zero. The amendment says why the other two
  went — a field only a test double could fill was pretending to be a promise about real rounds.
- **D21. The glossary gains the word for what a poll is** — one call asking after a round and what it reports back.
  Landed in this epic's grilling, so a ticket has nothing to do here beyond leaving it alone.
- **D22. No new ADR.** Each of these is a key on a payload and reversible in an afternoon; the decisions live in this
  spec, and the two that touch settled trade-offs are amendments to the records that already hold them.

### What the reader of a round sees

- **D23. The observer reads the new shape only.** No fallback to the old key. The consequence is accepted and named:
  replaying a session record written before this change reports each round's spend as unknown, though the figures are
  in the file under the old name. Nothing else about the debrief's round line changes — the same six facts, printed the
  same way.
- **D24. The review agent reports a total and a dollar figure.** Total tokens, and the dollar estimate labelled with
  its provider; unknown where a key is absent, and no round invents one. The four classes stay in the payload for the
  oracle and for anyone pricing them, and stop travelling through two hops of prose into a human's report.
- **D25. The delivery skill's report line follows** — each round's total tokens and its provider-labelled dollar
  estimate, unknown where a round has none.
- **D26. The status tool's description shrinks to what remains, and gains the bounds.** The paragraph explaining that
  every verdict-shaped field reads `"unknown"` goes with the fields; what replaces it says that a key is present only
  when there is something to read, and names both bounds a round can end on.

## Testing Decisions

**A good check here reads what the tool answers, never how it built the answer.** The whole change is observable at two
surfaces — the payload a poll returns and the round line a debrief prints — and both are already reachable by
procedures this repository prescribes. `plugin/mcp` has no test runner, behaviour in it is verified by hand, and this
change proposes **no new seam**. The projection is deliberately not one: its own header says so, and everything it
decides is visible at the tool surface.

**The seams, highest first, and what each reaches:**

- **The build happy path's matchers** (`e2e-tests/`) are the only automated seam, and the only seam of any kind that
  reaches the real backend's spend extraction — the scripted double's spend is *scripted* rather than extracted, so
  nothing free exercises the function this change edits. One assertion, on the grounds that file already states for the
  three tool names it writes down by hand — a rename that reached only the server and not the observer is a defect this
  test should report rather than follow. Every round that reached `completed` or `failed` has a poll answer carrying a
  `spend` with a `costUsd` and a `provider`; a running poll carries none and a cancelled round never gets one, so the
  assertion is on the round's own outcome rather than on every answer it gave.
- **The tool surface against the scripted backend** is the primary by-hand seam and it is free — no model, no forge, no
  money. It reaches everything else: the four-key running answer, the completed answer with its spend object, a failed
  round's reason and surviving spend, a cancelled round with no spend at all, terminal absorption, the five status
  words, and the absence of every key D5 to D10 removed.
- **An observer replay of a record written after this change** reaches the `spend` read and the debrief's round line.
  It must print the same six facts it prints today. Read on a record written *before* the change it will report the
  rounds' spend as unknown, which is D23 behaving as decided and not a defect to chase.
- **`typecheck` and `lint` in both packages** prove the cut compiles all the way down and that the server still runs
  unbuilt. They say nothing about behaviour.

**Prior art** is the server's own by-hand procedure in the contribution guide — the scripted backend driven through an
MCP stdio client — and the observer's replay beside it. This change adds no method to either.

**What must also be true, and is read rather than run:** no payload carries a `null`, an `"unknown"` or an empty string;
no bound is published as a figure and both are documented on the status tool; the glossary's words are used and the
synonyms its `_Avoid_` lists displace are not; the two amended decision records name no spec and no ticket; and each
file's register and column width are preserved.

## Out of Scope

- **The start handle, the cancel result and the transcript resource.** All three were reviewed field by field in this
  epic's grilling and deliberately left unchanged — including the handle's always-`preparing` status and the transcript
  URI nothing is instructed to fetch. Whether that resource ships at all is a separate question about a feature, not a
  field.
- **A findings parser, structured output, or any judgement extracted from a review.** ADR-0005 forbids it and the real
  backend's own header records what it measured. Dropping `verdict` and `counts.findings` is not a step toward adding
  one later; it is the acknowledgement that there is nothing there.
- **The bounds themselves, the polling hint, and any configuration of either.** ADR-0007's decision stands whole: four
  hours absolute, half an hour of silence, neither tunable. Only where the figures are written changes.
- **Compatibility for session records already on disk.** Decided, not deferred: D23.
- **A test runner for `plugin/mcp`.** The package has none, this change does not add one, and nothing here is testable
  only below the tool surface.
- **The trace's excerpt cap and everything else the observer does.** The poll payload sits inside a trace under that
  cap, but the observer reads a round's spend from the record directly rather than from the excerpt, so a smaller
  payload changes nothing about what the cap elides.
- **The debrief's wording**, beyond the key the round line reads its spend from.
- **Any change to how a round is counted, dispatched, resumed or reported as one of the two** that flip a change
  request ready.

## Further Notes

### The measurements this rests on

Every figure in the Problem Statement is off the two payloads quoted or off the source that produced them: the 727
characters is the running payload pretty-printed as the server sends it; the 15-second interval and the four-hour bound
are the server's own constants; 592,936 ms against 593,585 ms is the completed payload's own two timestamps against its
own duration; `num_turns: 0` on a round measured at $0.65 over 170 seconds is recorded in the extraction's comment,
which is why `turns` has a fallback at all. The ~175,000-token figure is arithmetic on the interval and the bound, not
a measurement, and is labelled as such.

### The two decision records this reopens

Neither loses its grounds, and that is why both are amendments rather than replacements. ADR-0007 argued its way from a
fixed hour to a four-hour cap plus a silence bound, on two rounds aborted at the hour while still emitting 273 events;
all of that stands. ADR-0010 was written against a prototype that reported an approving verdict beside prose describing
two crash-level bugs, and amended again when two rounds published the SDK's own failure text as a completed review; all
of that stands too. What changes in both is a consequence about what the payload publishes.

### A claim this spec does not close

The projection's own header says it is deliberately not a seam because *"every behaviour above is observable at the tool
surface, and the suite pins it there"*. There is no suite: `plugin/mcp` carries no test outside its dependencies, and
`review-reliability`'s triage of D19 confirmed the same thing when it went looking. The first half of that sentence is
true and is the reason this spec adds no seam; the second half is a claim about coverage that does not exist. Correcting
it is not this epic's, and it is written down here so that nobody reads it as coverage while working on this change.

### What a reader of an old debrief should know

A debrief already written is unaffected — it is prose on disk. A debrief *produced later from an older record* is the
case D23 accepts: it will say a round's spend is unknown where the record holds it under the old key. Anyone doing
archaeology on a pre-change run wants the record itself, where the figures are, rather than a fresh debrief of it.
