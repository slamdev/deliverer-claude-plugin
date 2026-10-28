# What two observed runs of one epic exposed: an observer that stopped watching, and a delivery that paid twice

Status: ready-for-agent

## Problem Statement

A human ran one **epic**, `idp-scaffold`, through both skills on plugin commit `6a9b56f39b51` — a `/deliverer:refine`
**run** and then the `/deliverer:build` run that followed it — and forwarded both **debrief**s. Read against the
**session record**s still on the machine they ran on, they expose two kinds of cost: an **observer** whose lifecycle
lost or delayed the debrief it exists to write, and a delivery whose agents paid for the same work more than once.

**The refinement's debrief describes seven minutes of a two-and-a-half-hour run.** The run asked its first question
round at 15:38:32 and its four background **sweep**s reported by 15:43:31; after that it was **waiting** on its human,
who answered at 16:55:58. The observer never saw the wait. Its test for whether a question is the run's own last act
counts every entry after the question as the run writing, except a `queue-operation` — and the first entry after this
question was the host's own `tools-used` bookkeeping, with no timestamp and nothing of the run's in it, followed by
`last-prompt` and `atis-latch` of the same kind. Read as not waiting, the silence was read as a killed terminal: the
idle bound finalised the debrief at 16:16, the observer exited half an hour later, and the human's answer — a tool
result, not a typed prompt — started nothing. The eight further rounds, 26 more questions and the rest of the run to
18:17 went unobserved. The debrief says one round, no waiting, a run stopped mid-grilling, and three **defect**s based
on its first wave alone. Every later wait in the same record has the same shape, so the misreading was not a one-off:
the record's own bookkeeping defeats the test every time a question is asked.

**An observer that finalised on its own reading never comes back.** The marker the hook writes for a session is never
removed once an observer has finalised, so every later hook event short-circuits on it — a typed prompt included. A
run that resumes after an idle finalise has outlived its observer and nothing restarts one, which is why the
refinement's `SessionEnd` signal at 18:30 was left on disk with nobody to read it.

**A delivery that finished in a session left open waited for its debrief on the human.** `/deliverer:build` finished at
21:32:36 — nine of nine stages, closing with its own report — in a long-lived session that stayed open. `SessionEnd`
never fired, and a run reading `finished` is deliberately not a finaliser, so the only thing left was the thirty-minute
idle bound; and even then the `Stop` hook had already fired at the run's return, so a debrief finalised afterwards
would only be shown on the human's next prompt. The human killed the session by hand to get it. Meanwhile the reason
`finished` was not a finaliser has been measured away: across the ten measured runs that reach it, `finished` first
reads within twelve entries of the run's own last entry.

**Neither debrief could put a dollar on the run.** Both runs were served by `claude-opus-5-5` and `claude-sonnet-5-5`,
and the observer's rate table predates both — 1,405 requests across the two runs priced at nothing, and each debrief's
headline reading "spend unknown".

**The second review round spent 432 requests and 32.1M cache-read tokens polling.** Both rounds were the same agent
doing the same thing — start a review, **poll** it to a **terminal** status. The first paced its polls with a delay
wrapped in a timeout and made 11 requests in the whole dispatch. The second was refused a bare delay by the host, fell
back to a tool that returns at once, and from then on every turn was one poll — 29% of the whole run's cache-read, for
a dispatch whose only output is a status and a block of prose. Nothing in the contract says how often to poll, and
nothing in the server makes the answer matter.

**A fix wave hunted for a toolchain thirteen implementers had already used.** Every `implementer` used a copy of the
build toolchain under a scratch path; the first **fix wave** installed its own instead, and the second ran a
filesystem-wide search for it that hit the host's 120-second tool timeout — two minutes of an eight-minute dispatch.
What satisfied a **gate** travels to each implementer after the first, and to no fix wave at all.

**Mirroring 57 assumptions died on the 53rd.** `change-request-creator` posted each **assumption comment** one at a
time, as it is told to, and the forge refused the 53rd for posting too quickly. The agent checked that the comment had
not landed, rewrote its posting with backoff, and finished — paying for a batch that died part-way and a second
implementation of the same loop, because its contract says nothing about a forge refusing a burst.

## Solution

Six changes, in two halves. The observer's half makes it see a whole run, come back when it was wrong to stop, finish
promptly when the run does, and price the models that ran. The plugin's half paces a round's polls in the server, and
narrows two contracts where a run paid twice.

### 1. A wait is told by the run's own turns

Whether a question is the run's own last act is decided by the run's own turns alone: an assistant entry, or a user
entry that carries a tool result or text the human typed. Host bookkeeping of every kind — with a timestamp or without,
of a kind that exists today or one the host adds later — and a `<task-notification>` landing mid-wait are not the run
writing, and a question followed only by them is a run **waiting**.

### 2. An observer that stopped on a guess is started again

When a hook event arrives for a session whose observer finalised on its own reading — the idle bound or the waiting
ceiling, never `SessionEnd` — and that observer is no longer alive, the hook starts a fresh one. Both `UserPromptSubmit`
and `Stop` do this: `Stop` is the event an answered question produces, since an answer is a tool result rather than a
prompt. The fresh observer reads the run whole and un-finalises the debrief on disk if the run's **extent** has
advanced, exactly as an observer that never died would have.

### 3. A finished run that settles finalises its debrief

A run whose reading is `finished`, and whose records then stay silent for two minutes, has its debrief finalised. It is
a guess rather than a signal, and it is treated as one: reversible exactly as an idle finalise is, watched for the same
while afterwards, and un-finalised if the run turns out to be alive.

### 4. A debrief finalised after `Stop` is shown without waiting for a prompt

**Dropped.** Verified by hand: the host runs a `Notification` hook but discards its `systemMessage` — nothing reaches
the human on `permission_prompt` or `idle_prompt`, then or later — and its hooks reference says the same. Nothing
ships, and the next-prompt route stands alone; [ticket 04][t04] has the finding. As specified before that:

The hook is registered for `Notification` — the event the host raises when a session sits waiting for input — and prints
this session's pending debrief announcement there, as `Stop` does today. The next-prompt route stays as the fallback.

### 5. The models that ran are priced

The rate table carries `claude-opus-5-5` and `claude-sonnet-5-5`, from the source it already takes every rate from, with
its as-of date moved to match.

### 6. A poll holds, a fix wave carries the gates, and a refused post is retried

- **The server paces a round's polls.** Every `code_review_status` call holds for a bounded while before answering, and
  answers at once when the review is, or becomes, **terminal**. Its input schema is unchanged, so no caller can opt out
  and no host's refusal of a bare delay matters. `code-reviewer`'s step 4 says a poll holds and to call again.
- **What satisfied a gate includes where the toolchain is and how it was got**, and the accumulated gates account goes
  to each `comments-addresser` as well as to each implementer after the first.
- **`change-request-creator`'s posting step says a forge may refuse a burst**: a refusal for rate is expected, and met
  by checking whether that comment landed, backing off, and retrying the same entry — naming no forge and no limit.

## User Stories

1. As a human who ran a refinement, I want its debrief to describe every question round the run asked, so that the
   debrief I forward is of the run I actually had.
2. As a human who spent an hour thinking about a question, I want that hour reported as the run waiting on me, so that
   it reads as the run's own time and not as a stop.
3. As a human who answered a question long after it was asked, I want the observer still to be watching, so that the
   rest of the run reaches the debrief.
4. As a maintainer reading a debrief, I want a defect grounded only on what the run really did, so that I do not act on
   an artefact of an observation cut short.
5. As a maintainer, I want host bookkeeping entries the observer has never seen before to leave a wait standing, so that
   a host change does not silently reintroduce this defect.
6. As a maintainer, I want a background dispatch's notification landing during a wait to leave the wait standing, so
   that a refinement with sweeps in flight is read as waiting.
7. As a maintainer, I want an answered question to end the wait, so that the idle bound still catches a terminal killed
   after the answer.
8. As a maintainer, I want a question the human typed over to read exactly as it does today, so that the change only
   widens what does not count and never what does.
9. As a human whose run resumed after its observer gave up, I want a fresh observer started on my next prompt, so that
   the run's later stages reach the debrief.
10. As a human whose run resumed by my answering a question, I want a fresh observer started when that turn stops, so
    that I do not have to type anything to be observed again.
11. As a human, I want a fresh observer to rewrite the debrief already on disk rather than write a second one beside
    it, so that one run has one debrief.
12. As a human whose session ended through `SessionEnd`, I want no observer restarted for it, so that a signalled end
    stays the one certain end there is.
13. As a human whose observer is still alive, I want no second observer started beside it, so that two processes never
    write the same debrief.
14. As a human who keeps one long-lived session open, I want a finished delivery's debrief finalised within minutes of
    the run returning, so that I do not have to kill the session to get it.
15. As a human, I want a finished-and-settled debrief to be un-finalised if the run turns out to carry on, so that a run
    passing through `finished` between two stages is not cut off.
16. As a human, I want the debrief's own "still going" wording to stay true of a session that stays open, so that the
    document does not promise a timing it cannot keep.
17. *(Dropped with Solution item 4, [ticket 04][t04].)* As a human whose debrief was finalised after the run
    returned, I want it shown to me while the session sits waiting, so that I see it without having to type a prompt.
18. *(Dropped with Solution item 4, [ticket 04][t04].)* As a human, I want a debrief announced exactly once,
    whichever hook event shows it, so that I am not shown the same line twice.
19. As a human, I want the debrief's headline to carry what the run cost in dollars, so that the question that made me
    open it is answered.
20. As a maintainer, I want the rate table's as-of date to move with the rates, so that the debrief's account of what it
    could not price stays honest.
21. As a human paying for a delivery, I want a review round's polling to cost a handful of requests, so that driving a
    round costs roughly what the round itself does.
22. As a `code-reviewer`, I want each poll to hold until there is news or a bound passes, so that I need no delay of my
    own that the host may refuse.
23. As a `code-reviewer`, I want a poll to answer at once when the review is terminal, so that a finished round is
    reported without a wasted wait.
24. As a `code-reviewer` that was continued rather than dispatched cold, I want a poll on a review that is already
    terminal to answer at once, so that resuming costs nothing.
25. As a maintainer, I want the poll's shape — its keys, its omission rule, its error on an unknown id — unchanged, so
    that every caller and every document describing a poll stays right.
26. As a maintainer, I want the held poll bounded well inside any timeout a host puts on a tool call, so that the wait
    never turns into a failed call.
27. As a maintainer, I want a cancelled round to release a held poll at once, so that cancellation still reads promptly.
28. As a fix wave, I want the gates the implementers met and what satisfied them, including where the toolchain is and
    how it was got, so that I do not install or search for one already on disk.
29. As an implementer after the first, I want the toolchain's location in what I am carried, so that I start warm on it
    as I already do on the gates.
30. As a maintainer, I want the carried gates account to stay an account of what bit and what satisfied it, so that it
    does not grow into a second channel for repository conventions every agent must read first-hand.
31. As a `change-request-creator`, I want to know a forge may refuse a burst of posts, so that a refusal is a case I was
    told to expect rather than a failure I must diagnose.
32. As a `change-request-creator`, I want to check whether a refused comment landed before retrying it, so that no
    assumption carries two assumption comments.
33. As a maintainer, I want that instruction to name no forge and no limit, so that the plugin keeps naming no forge.

## Implementation Decisions

### Modules touched

- **The observer's run facts** — the reading that decides whether a pending question is the run's own last act.
- **The observer's loop** — the new finaliser on a finished, settled run.
- **The observer's rate table** — two models and the as-of date.
- **The observer's hook script and the hooks manifest** — re-arming on `UserPromptSubmit` and `Stop`. The new
  `Notification` registration was dropped with Solution item 4 ([ticket 04][t04]).
- **The tools server's status tool and its lifecycle** — the held poll.
- **`code-reviewer`, `change-request-creator`, and the build skill's dispatch section** — prose.
- **The glossary's Poll entry** — already sharpened to say a poll may hold a bounded while before it answers.

### The run's last act

- What follows a pending question counts as the run writing only when it is an `assistant` entry, or a `user` entry that
  carries a tool result or text the human typed. The existing test for "what the human typed" — which already excludes
  meta entries and `<task-notification>` — is the definition reused, rather than a new list of kinds.
- The direction of the test inverts: from "everything counts but `queue-operation`" to "nothing counts but the run's own
  turns". Unknown kinds are therefore skipped by construction. The safe direction the existing comment argues for is
  kept where it matters: a question the human escaped and typed over is followed by typed text, and still ends the wait.
- No timestamp test is used. A timestamped bookkeeping entry — `attachment`, `system` — would defeat it, and the
  refinement's own record holds both.

### Re-arming a stopped observer

- The marker's state already says why the observer finalised. The hook re-arms only when that state reads as a finalise
  on the observer's own reading (idle bound or waiting ceiling), and never when it reads as finalised on the session's
  end.
- "No observer alive" must be a fact the hook can read cheaply and without waiting, on every `Stop` of every observed
  session. The observer leaves whatever it needs for this — a pid it can probe, or a liveness file it removes on exit;
  the choice is the implementer's, with the constraint that a crashed observer must read as not alive.
- Re-arming reuses the existing spawn path, and the marker is rewritten before the spawn, so two hook events in a row
  cannot start two observers.
- The fresh observer reuses the run's existing observation directory and debrief, as the original observer would have.
  A debrief already announced is not announced again unless it is un-finalised and later finalised anew.
- `Stop` stays silent where it has nothing to print, whether or not it re-armed: a refinement stops for every question.

### The finished-and-settled finaliser

- It joins the existing finalisers as a third guess beside the idle bound and the waiting ceiling: `finished` on the
  latest reading, and two minutes of silence across the run's records measured the way the idle bound measures its own.
- It is not a signal. The observer watches for the same while after it as after an idle finalise, and the existing
  un-finalise on an advancing extent applies unchanged.
- The two minutes are a bound in the same family as the others, overridable from the environment the same way, so the
  loop can be driven by hand at shortened bounds.
- The comment that argued `finished` is not a finaliser is rewritten to carry this decision and its grounds — the ten
  measured runs, and that the reversal covers the case it guarded — citing this spec. There is no ADR: a constant and a
  condition reverse it.
- The debrief's own "still going" paragraph is brought into line with the new finaliser.

### The Notification announcement

**Dropped** with Solution item 4: the check below was made, and the host does not render the message
([ticket 04][t04]).

- The hook script handles `Notification` by printing this session's pending stop announcement, exactly as `Stop` does,
  and nothing otherwise. The one-print-per-announcement rule is unchanged: printing removes both halves.
- Whether the host renders a `Notification` hook's `systemMessage` to the human is a claim, and it is verified by hand
  before the registration ships. If it does not render, this change is dropped and the next-prompt route stands alone.

### The held poll

- `code_review_status` holds while the review is not terminal, for a server-chosen bound of about a minute, and then
  answers with what it knows. It answers at once when the review is terminal on arrival or becomes terminal while held —
  completed, failed, cancelled, or aborted on either of the server's own bounds.
- It does **not** answer early on a rising `events` count. That count rises with every tool call the inner reviewer
  makes, which on the measured round was about every three seconds; answering on it would restore the cost this exists
  to remove.
- The bound is a constant, like the server's other two bounds, and is named in the tool's description so a caller knows
  a poll may take that long. It must sit well inside the host's timeout on an MCP tool call; that timeout is checked by
  hand before the constant is chosen.
- An unknown id still errors at once, without holding.
- The answer's shape, its required keys and its omission rule are unchanged. The status read becomes asynchronous, which
  the lifecycle's interface reflects; the scripted backend needs nothing new to drive it.
- `code-reviewer`'s step 4 says that each poll holds until the round ends or a bound passes, and to call again on an
  answer that is not terminal — and nothing about delays of its own.

### The gates account

- The build skill's first carry-forward exception widens two ways: what satisfied a gate explicitly includes where the
  toolchain the gate needed lives and how it was obtained; and the account goes to each `comments-addresser` too.
- Its reason is restated for the wider audience — a cold start on work not yet done is what a fix wave is too — and the
  rule that every other fact is met first-hand stays as written.

### The refused post

- `change-request-creator`'s posting step gains one instruction: a forge may refuse a burst of posts; a refusal for rate
  is met by checking whether that entry's comment landed, waiting, and retrying the same entry, with the wait growing on
  each further refusal. No forge, API or limit is named.

## Testing Decisions

Nothing here is covered by CI beyond typecheck and lint. Each behaviour is verified by hand at the three existing seams,
and each check asserts what a human or a caller would see — a debrief's figures, a marker's state, a hook's output, a
poll's answer and timing — never an internal call.

- **Replaying a prefix of a record** (CONTRIBUTING.md § Replaying a run's records). The refinement's record cut just
  after the first question's last bookkeeping entry must read as **waiting** — the debrief says so, and the facts carry
  the question's time. The same record cut after the answer must not. Every later wait in that record, cut the same way,
  must also read as waiting. The whole record must produce a debrief with nine question rounds and thirty questions. The
  delivery's record cut just after its closing report must read `finished`.
- **The observer loop driven by hand**, at shortened bounds. A copy of a record is grown entry by entry while the hook
  events are fired at the hook script: a finished run that stops growing finalises after the settle bound and is
  announced; growing it again un-finalises it; an idle finalise left to exit and then followed by a `Stop` or a prompt
  starts a fresh observer that un-finalises and carries on; a `SessionEnd`-finalised session starts nothing; a live
  observer is never doubled. (A `Notification` printing a pending announcement once was dropped with Solution item
  4, [ticket 04][t04].)
- **The scripted backend over MCP stdio** (CONTRIBUTING.md § What CI does not check). A timeline longer than the held
  bound: a poll returns after about the bound with a non-terminal status. A timeline that completes mid-hold: the poll
  returns at completion. A terminal review: the poll returns at once. A cancel during a held poll: the poll returns
  promptly with `cancelled`. An unknown id: an immediate error. Many events during a hold: no early return.
- **The prose changes** — `code-reviewer`, `change-request-creator`, the build skill — have no seam short of a paid run.
  They are read against `/mattpocock-skills:writing-for-agents`, and confirmed by the next observed delivery's debrief.
- **The rate table** is confirmed by replaying either record: the headline carries a dollar figure, and the debrief's
  account of unpriced requests no longer names the two models.

## Out of Scope

- **All three of the refinement debrief's defects.** The observation was cut off after the first wave of sweeps.
  Overlapping sweeps and over-loaded sweeps were grounded on that wave alone, and the unasked-questions defect is an
  artefact: the run went on to ask eight more rounds.
- **Carrying an earlier fix wave's implemented directives forward.** The second wave's reversal of the first wave's
  change was arguably right — the unconditional directive did fail on hosts without that address family — and the
  forwarding rule stays as it is.
- **The implementer's anchor read-back ordering.** The contract already says it plainly and with its reason; one lapse
  in thirteen dispatches, which landed correctly, is not a contract gap.
- **A process-management line in the implementer's contract.** Four dispatches matched their own shell with a pattern
  kill; it is a hunch with no line to cite against, and is left for a further run to ground.
- **Carrying repository conventions between implementers**, such as whether the project marks a ticket delivered. They
  stay first-hand reading.
- **Pacing the posts up front.** A fixed pause between posts costs every run to spare the ones a forge refuses.
- **The build debrief's hunches about adjudication yield and spec review depth.** Judgements about the work, which a
  trace cannot settle.

## Further Notes

### The source

The two debriefs and the two corrections beneath them are GitHub issue #17 on the plugin's own repository. The
corrections — the waiting misreading and the open-session gap — were checked against the refinement's session record
on the machine the runs happened on: the first entry after the first question is `tools-used`, with no timestamp; the
sweeps' notifications arrived during that wait only as `queue-operation`s; the run's last own entry is at 18:17:32;
and the `SessionEnd` signal at 18:30 was left with no observer to read it.

### Two facts to establish by hand before the constants are chosen

- The host's timeout on an MCP tool call, which bounds the held poll.
- Whether a `Notification` hook's `systemMessage` reaches the human. Established: it does not ([ticket 04][t04]).

### Load-bearing behaviour this change must not disturb

- The waiting ceiling still catches a terminal killed with a question on screen.
- A `SessionEnd` finalise still exits at once and is never reversed.
- `Stop` still prints nothing when there is nothing final to print.
- A poll still carries what is known when it answers and no more, with every key absent until measured.

[t04]: issues/04-a-late-debrief-is-shown-on-notification.md
