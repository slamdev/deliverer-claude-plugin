# What fifty-one debriefs exposed in the observer: put-backs it never saw, and readings it never took

Status: ready-for-agent

## Problem Statement

A maintainer read the **debrief**s of 26 `/deliverer:refine` **run**s and 25 `/deliverer:build` runs back to back,
and collected the defects that sat in how each debrief was produced rather than in the skills and agents it judged.
Checked against the observer on the default branch, every one is still real except the two rates already added
(`claude-opus-5-5`, `claude-sonnet-5-5`). They fall into four kinds.

**A put-back is invisible to the observer.** When a stage fell short, the **orchestrator** continued its agent with
`SendMessage`. The observer recognises none of that. A **dispatch note** is written once per **dispatch**, the moment
it first returns, so a continued agent's later work gets no note and the note shows a state that a later put-back
superseded: in refine #3 the note says "nothing published" for the stage that did publish. A dispatch's duration ends
at its first return, so the put-back's time goes missing (about four minutes in refine #23), while its tokens are added
to the original. Worst of all, a `SendMessage` is not one of the run's own signals, so a put-back made after the run
handed back to its human lies past the **extent**'s ceiling. Its rounds, its continues, its **spend** and the outcome
it produced fall outside every figure in the debrief (refine #6).

**A resumed run is never judged again.** The observer reads a run once. When the idle bound finalises a run that later
resumes, the label comes back but the reading does not: an observer started again reuses the answer its predecessor
held. Six build debriefs were read mid-run and never again (#9, #10, #15, #23, #24, #25). #25 was read at entry 423 of
773. And main's new settle finaliser, two minutes of quiet after a `finished` reading, makes a reading taken between
two stages more likely, not less.

**A reading in the wrong shape is thrown away.** The synthesis is told to answer under a `== DEFECTS ==` line and a
hunches line. An answer missing either is reported as a failure, and the debrief carries no judgement at all. This
happened in 3 refine runs and 7 build runs. The reading was paid for and then discarded.

**Smaller defects.**
- **Pricing.** `claude-haiku-5-5` is still unpriced. Ticket 05 of `idp-scaffold-defects` left it out on purpose, because
  its rate depends on how long the prompt is.
- **Slug.** An epic's slug is taken from the run's first task update and never revised, so a renamed epic's debrief
  carries the old name (refine #9).
- **Announcements.** The prompt hook prints any session's pending announcement, so a human mid-run in one worktree is
  told about another epic's debrief (refine #26).
- **Note length.** A dispatch note has no length cap, so the synthesis input grows with whatever a cheap-tier note
  chose to write (build #2).
- **Early stop.** An observer that stops because a record became unreadable leaves the debrief looking as finished as
  any other (refine #1, #21, #22).
- **Rewritten prose.** On the build side, the host's guard against instruction-shaped subagent output rewrote **round**
  prose that the build skill carries verbatim into a **fix wave**, and nothing told anyone (build #3, #9, #24).

## Solution

Ten changes. Nine of them are in the observer. They make it follow every **put-back**, read a resumed run again, keep
a reading it cannot parse, and fix five smaller faults. One is in the build skill's prose.

### 1. The 5-5 haiku is priced by prompt length

The rate table learns a tier by prompt length, and a request is priced at the tier its own prompt falls in.
`claude-haiku-5-5` is priced at $0.10 / $0.50 per million tokens for prompts up to 100K tokens and $0.50 / $2.50 above
that. This reverses ticket 05's exclusion, for the reason it gave: a single row would have understated long prompts
fivefold, and a tier does not.

### 2. A synthesis answer in the wrong shape is kept, but not forwarded

When the synthesis answer lacks either line, the observer does not retry. Its raw prose goes into the do-not-forward
notes file, headed as the run's unparsed reading. The debrief says, where its defects belong, that the run went
unjudged because the reading came back in the wrong shape, and points at the notes file by its role, not by quoting
it. The debrief stays within its bound (ADR-0018). The human can still read what the observer made of the run.

### 3. A continued put-back is noted and timed

A dispatch whose agent is continued gets one more dispatch note each time a continue finishes in it. Each note covers
that continue's span of the agent's own **session record**, and is marked as a put-back's note. The synthesis reads
them all. A dispatch's duration runs from its start to the last entry of its own record, so a put-back's wall clock is
counted in the stage it belongs to. Notes for continue spans survive an observer being started again: one that is
re-armed recognises the spans already noted and writes only the new ones.

### 4. A put-back is one of the run's own signals

A `SendMessage` whose target is an agent the run itself dispatched counts as one of the run's own signals, alongside
its **dispatch**es of the plugin's own agents (the glossary's **Extent**). A put-back after the hand-over therefore
moves the extent's ceiling, and with it the **round**s, the continues, the spend and the outcome. A `SendMessage` to
anything else, such as a peer session or an agent of the human's own, does not count.

### 5. A run that resumes after its debrief was final is read again

When a final debrief is un-finalised because the extent has gained an own signal since the reading it holds, the
observer takes one more whole-run reading at the next finalise, over the grown extent. That is one reading per
resumption, on whichever signal finalises it next. It is not one reading per new signal, and never one taken while the
run is still going. The debrief says which extent the reading it carries is of, and that it replaced an earlier one.
This lifts the run-observation spec's "one synthesis per run" (D9, D23) exactly as far as a resumption: a guess still
costs no second reading, and a run that really did resume earns one.

### 6. A renamed epic keeps its key and names both slugs

The observation directory stays keyed by the first slug, so a later observer still finds the notes and the
**identity file** where it left them. The debrief's headline uses the last slug the run's task updates gave, and
names the first one beside it whenever the two differ.

### 7. Another session's announcement waits until this run is over

While this session has a live run under observation, the prompt hook shows only this session's own debrief
announcements. Other sessions' announcements are held, not dropped, and are printed on the first prompt after this
session's run is over. Outside a live run, the run-observation spec's "from any session" (D25) stands unchanged.

### 8. A dispatch note is capped in length

Each dispatch note, a continue span's included, is held to about 8,000 characters. The note prompt states the cap.
A note that overruns it is cut at the cap, with an elision mark saying how much was cut. The cap is on what a note
writes, not on what it reads, and its input budget is unchanged. A note still carries no bound on what it names, and
is still never forwarded.

### 9. An observation that stopped early says so

When the observer stops because a record became unreadable, the debrief it leaves behind says the observation stopped
early, at which entry and why, in place of a final label it did not earn. A process killed with its container, and
never touched again, stays out of scope (see `the-observation-reports-the-whole-run`, D7).

### 10. A round's prose the host altered is said to be altered

The build skill's account of a round says that when the host marks a dispatch's output as rewritten (instruction-shaped
output neutralised), the prose it carries into a fix wave is not verbatim. The flag is carried with that prose, and
named in the run's report.

## User Stories

1. As a human who ran a refinement with a put-back, I want the debrief to count the put-back's rounds and spend, so that
   the figures I forward are of the whole run.
2. As a human whose run put a stage back after handing back to me, I want that put-back inside the run, so that the
   outcome the debrief reports is the one the run ended with.
3. As a maintainer, I want a dispatch note for each continue span, so that a stage that was put back is described by
   what it finally did and not by its first attempt.
4. As a maintainer reading a note, I want a put-back's note marked as one, so that I can tell a first attempt from its
   correction.
5. As a maintainer, I want a stage's duration to include its put-backs, so that the slow stage is the one the debrief
   names as slow.
6. As a maintainer, I want a stage's tokens and its time to cover the same span, so that a per-minute cost read off
   the debrief means something.
7. As a maintainer, I want a `SendMessage` to a peer session or to the human's own agent left out of the extent, so that
   the human's later work is never counted as the run's.
8. As a human who resumed a run after its debrief went final, I want the debrief read again once the run settles, so
   that the defects it names are of the run I finished.
9. As a human, I want a resumed run's reading to say it replaced an earlier one, and of which extent, so that I know
   which debrief to forward.
10. As a maintainer paying for the observation, I want at most one extra reading per resumption, so that a run resumed
    once costs one more synthesis and not one per stage.
11. As a maintainer, I want an observer started again after an idle finalise to leave the notes it already wrote
    alone, so that a restart pays for nothing twice.
12. As a human, I want a debrief whose reading came back in the wrong shape to say so plainly, so that I do not mistake
    "no defects" for "not judged".
13. As a human, I want the unparsed reading kept in the do-not-forward notes, so that what I paid for is still readable.
14. As a maintainer, I want an unparsed reading kept out of the debrief, so that a debrief stays safe to forward unread
    even when the instruction that bounds it was not followed.
15. As a human whose run used `claude-haiku-5-5`, I want its requests priced, so that the debrief's dollar figure is of
    the whole run.
16. As a maintainer, I want a long haiku-5-5 prompt priced at its long-prompt rate, so that the figure does not
    understate exactly the requests that cost most.
17. As a maintainer, I want the other models' prices unchanged by the tier, so that adding it moves no other figure.
18. As a human who renamed an epic during a run, I want the debrief headed with the name it ended with, so that I can
    find it by the name I now use.
19. As a maintainer, I want the first name kept beside it, so that a debrief can still be matched to the observation
    directory and to earlier debriefs of the same epic.
20. As a human mid-run in one worktree, I want no announcement of another epic's debrief, so that a line about someone
    else's run never reads as news about mine.
21. As a human running several worktrees, I want another session's announcement shown once my run is over, so that
    nothing is lost by holding it.
22. As a maintainer, I want a dispatch note capped in length, so that a delivery's synthesis input stays affordable
    however much each note writes.
23. As a maintainer, I want a cut note to say how much was cut, so that a short note is never read as a dispatch that
    did little.
24. As a human, I want a debrief whose observation stopped early to say so, so that I do not forward a partial reading
    as a final one.
25. As a maintainer, I want the entry it stopped at named, so that I can replay the record from there by hand.
26. As a maintainer reading a build debrief, I want to know when the host rewrote a round's prose, so that a fix wave
    that misread a finding is not blamed on the fix wave.
27. As a human reading a build run's report, I want a rewritten round named in it, so that I know which carry-forward
    was not verbatim.
28. As a maintainer, I want the free replay of a record to stay byte-for-byte deterministic, so that the mechanical half
    can still be verified by diffing two replays.
29. As a maintainer, I want a run with no put-backs, no rename and no resumption to produce the same debrief it does
    today, so that these changes cost nothing where they do not apply.

## Implementation Decisions

### Modules touched

- **The observer's rate table**: a prompt-length tier, and the 5-5 haiku's row in it.
- **The observer's trace and its records reader**: a dispatch's end taken from its own record's last entry, and the
  continue spans inside that record made visible to the note step.
- **The observer's run facts**: a `SendMessage` to an own agent counted as an own signal, and the last slug read
  alongside the first.
- **The observer's notes and notes file**: one note per continue span, keyed so a re-armed observer recognises the
  spans it already noted; the output cap; the unparsed synthesis reading as an entry of its own.
- **The observer's judge**: a malformed answer kept, not just failed; and the reading taken again after a resumption.
- **The observer's loop and its debrief file**: when the extra reading fires; the "stopped early" state; the headline
  naming both slugs.
- **The observer's hook script**: holding other sessions' announcements while this session's run is live.
- **The build skill**: the round carry-forward's line about the host's rewrite flag. Prose, written against
  `/mattpocock-skills:writing-for-agents`.
- **The glossary**: already done. **Put-back** is added, the **Extent** entry counts put-backs to own agents, and the
  **Dispatch note** entry covers continue spans and the length cap.

### The tier

- A row may carry one prompt-length threshold, and an input and output rate above it. Every existing row carries none,
  and is priced exactly as today.
- Which tier a request falls in is decided by that request's own prompt: its input, cache-read and cache-write tokens
  together. Never by the run's total, nor by an average.
- The as-of date and the source stay as the table already takes them, from the `claude-api` skill's model table. The
  comment that names haiku-5-5 as deliberately absent is replaced by the row.

### Continue spans

- A continue span is the stretch of an own agent's record from the entry a `SendMessage` to it resumes at, to the
  entry it returns at. The first span is the original dispatch.
- A span is noted when it finishes, exactly as a dispatch is today, from that span's slice of the record, at the
  note's existing input budget.
- A span's note is keyed by the dispatch and the span's ordinal. A re-armed observer reads the keys already in the
  notes file and notes only the spans it does not find there.
- A dispatch's tokens are still summed over its whole record. Its duration now runs from its start to its record's last
  entry, so the two cover the same span.

### The own signal

- An own agent is identified by the id its dispatch's result named, and by the name the dispatch gave it if it gave
  one. A `SendMessage` counts only when its target resolves to one of those.
- Nothing else about the ceiling moves. The first turn the human typed after the run's last own signal still closes
  the extent, and the run's last own signal can now be a put-back.

### The extra reading

- **The trigger.** An un-finalise caused by the extent gaining an own signal past the extent of the reading the
  debrief holds. A finalise of the same extent, as when an idle finalise is followed by nothing, does not trigger it.
- **The timing.** The reading is taken at the next finalise, whichever finaliser that is, never immediately on the new
  signal.
- **The cap.** One reading per un-finalise, so a run resumed twice can be read three times.
- **Restarts.** A re-armed observer that inherits a held answer applies the same rule. It reuses the answer when the
  extent has not grown, and reads again at the next finalise when it has.
- **What the debrief shows.** The extent of the reading it carries, and that an earlier reading of a shorter extent
  was replaced.

### The unparsed reading

- **Recognising it.** Either marker missing, or the two out of order, the cases the judge already distinguishes.
- **Where it goes.** The raw answer goes into the notes file under a heading of its own, after the dispatch notes.
- **What the debrief says.** One statement where its defects belong: unjudged, with why. It quotes nothing from the
  answer.
- **No retry.** Structured output stays off, for the cost the judge already records against it.

### The slug

- The trace keeps the first task update's slug as the key, and also carries the last.
- The debrief's headline takes the last. The header names the first as well whenever they differ.
- The observation directory, the identity file and every earlier debrief's lookup keep using the key.

### Holding announcements

- **What "live" means.** The session's own observation marker is present and its observer alive, the same liveness
  test the re-arm already uses.
- **Mid-run.** While this session is live, the prompt hook prints only announcements this session wrote. Other
  announcements stay pending on disk, untouched.
- **After.** On the first prompt after this session is no longer live, the pending announcements are printed as today.

### The note cap

- About 8,000 characters, stated in the note's prompt.
- An overrun is cut at a line boundary under the cap, with an elision mark naming the characters cut. The overrun is
  never sent back to the model.

### Stopped early

- **When it applies.** The observer's exit because a record could not be read.
- **What it writes.** The debrief's final state becomes "observation stopped early", with the last entry read and the
  reason. It is neither final nor live.
- **What still finalises it.** A later re-armed observer whose reading succeeds replaces it as it would any
  non-final debrief.

## Testing Decisions

Nothing here is covered by CI beyond typecheck and lint. Each behaviour is verified by hand at the four existing seams.
Each check asserts what a human or a maintainer would see: a debrief's figures and statements, the notes file's
entries, a hook's output. It never asserts an internal call. The prior art for every seam is the `idp-scaffold-defects`
spec's Testing Decisions and CONTRIBUTING.md § Replaying a run's records.

- **Free replay of a record or a prefix of one.**
  - **Pricing.** A run with haiku-5-5 requests carries a dollar figure and names no unpriced model. A synthetic record
    with one prompt each side of 100K is priced at the two tiers. Every other model's figure is unchanged on a record
    that has no haiku-5-5.
  - **The extent.** A record with a put-back after the hand-over has an extent that ends at the put-back's return, and
    its rounds, spend and outcome include it. A record whose later `SendMessage` targets an agent the run did not
    dispatch keeps today's ceiling.
  - **Duration.** A continued dispatch's duration runs to its record's last entry.
  - **Slug.** A record whose task updates rename the epic is headed with the last slug and names the first, while its
    files stay under the first.
  - **Early stop.** A record truncated mid-line, so that it becomes unreadable, gives a debrief that says it stopped
    early at that entry.
  - **No change elsewhere.** A record with none of these shapes replays byte for byte the same as before the change.
    Two replays of any record are identical.
- **Judged replay (`--judge`).** This spends money, so it is run on one refine record and one build record with
  put-backs.
  - **Notes per span.** The notes file holds one note per continue span, each marked as a put-back's. No note exceeds
    the cap, and a cut note carries its elision mark.
  - **A malformed answer.** The run-observation procedure already names one cheap way to get one: a bogus token
    through a gateway. With it, the notes file holds the raw answer under its heading, and the debrief says unjudged
    and quotes none of it.
- **The observer loop driven by hand through the hook script**, at shortened bounds. A copy of a record is grown entry
  by entry while the hook events are fired.
  - **Resuming.** A run left idle until it finalises, then grown with a put-back and left to settle, is read a second
    time, and its debrief names the replaced extent. Left to settle again with nothing grown, it is not read a third
    time.
  - **Restarting.** An observer killed after its first note and re-armed writes only the spans it had not noted.
  - **Announcements.** With two sessions sharing one plugin data directory, a prompt in the live one prints only its
    own announcement. Once its run finalises, the next prompt prints the other's.
- **Reading the prose.** The build skill's change is read against `/mattpocock-skills:writing-for-agents`, and then
  confirmed by the next observed delivery whose round the host rewrites.

## Out of Scope

- **Retrying the synthesis, and structured output.** Decided against: the reading is kept, not paid for twice.
- **A check that a dispatch note does not leak repository content.** ADR-0018 would welcome one. The notes stay
  do-not-forward, and only their length is capped here.
- **A killed observer, container or machine that nothing touches again.** Its debrief keeps its last label, as
  `the-observation-reports-the-whole-run` D7 already decided.
- **Forbidding an epic's rename in the skills.** The debrief copes with a rename rather than the skills preventing one.
- **Reading a resumed run again on every new signal.** One reading per resumption is the cap.
- **The skill and agent findings in the same debriefs**, such as the continued writer that rewrote its whole document
  instead of patching it. They are for a session about the skills, not the observer.
- **Fast mode's rates for `claude-opus-5-5`.** Nothing in a session record says whether a request ran fast, so the table
  prices it at the standard rate.

## Further Notes

### The source

The debriefs and the findings drawn from them sit outside this repository: a maintainer's collection of 26 refine and
25 build debriefs, with the observer's own defects extracted from them. Each finding was checked against the default
branch at `a733395`. Run numbers in the Problem Statement are those of that collection.

### Facts to establish by hand before the first ticket

- **Where a continue's entries land.** Whether a `SendMessage` continue appends to the continued agent's existing
  record, which Solution 3 assumes, or starts a record of its own. Read one put-back from a record of your own.
- **How a target is named.** Whether the `SendMessage` input names its target by the id the dispatch's result carried,
  by the name the dispatch gave it, or by either.
- **What counts as a prompt for the tier.** Whether the 100K threshold is measured against input plus cache tokens,
  which the tier assumes, or against uncached input alone. Check against the provider's pricing page.

### Load-bearing behaviour this change must not disturb

- The free replay stays free and byte-for-byte deterministic.
- A `SessionEnd` finalise still exits at once.
- A re-armed observer still never doubles a live one.
- A debrief stays bounded to the plugin's own machinery (ADR-0018). Nothing an unparsed reading, a cut note or a held
  announcement carries reaches it.
- A run with no put-back, no rename and no resumption costs exactly what it costs today.
