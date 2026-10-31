# What fifty-one debriefs exposed in the observer: put-backs it never saw, and readings it never took

Status: resolved

## Problem Statement

A maintainer read the **debrief**s of 26 `/deliverer:refine` **run**s and 25 `/deliverer:build` runs back to back,
and collected the defects that sat in how each debrief was produced rather than in the skills and agents it judged.
Checked against the observer on the default branch, every one is still real except the two rates already added
(`claude-opus-5-5`, `claude-sonnet-5-5`). They fall into four kinds.

**A put-back is invisible to the observer.** When a stage fell short, the **orchestrator** continued its agent with
`SendMessage`. The observer recognises none of that. A **dispatch note** is written once per **dispatch**, the moment
it first returns, so it shows a state that a later put-back superseded: in refine #3 the note says "nothing published"
for the stage that did publish. A dispatch's duration ends at its first return, so the put-back's time goes missing
(about four minutes in refine #23), while its tokens are added to the original. Worst of all, a `SendMessage` is not
one of the run's own signals, so a put-back made after the run handed back to its human lies past the **extent**'s
ceiling, and its rounds, spend and outcome fall outside every figure in the debrief (refine #6).

**A resumed run is never judged again.** The observer reads a run once. When the idle bound finalises a run that later
resumes, the label comes back but the reading does not. Six build debriefs were read mid-run and never again (#9, #10,
#15, #23, #24, #25); #25 was read at entry 423 of 773. Main's settle finaliser, two minutes of quiet after a `finished`
reading, makes a reading taken between two stages more likely, not less.

**A reading in the wrong shape is thrown away.** The synthesis is told to answer under a `== DEFECTS ==` line and a
hunches line. An answer missing either is reported as a failure, and the debrief carries no judgement at all. This
happened in 3 refine runs and 7 build runs: the reading was paid for and then discarded.

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

## Solution

Nine changes, all of them in the observer.

1. **The 5-5 haiku is priced by prompt length.** The rate table learns a prompt-length tier, which reverses ticket 05's
   exclusion for the reason it gave: a single row would have understated long prompts fivefold, and a tier does not.
2. **A synthesis answer in the wrong shape is kept, but not forwarded.** Its raw prose goes into the do-not-forward
   notes file. The debrief says the run went unjudged and why, and stays within its bound (ADR-0018).
3. **A continued dispatch's note is rewritten.** When a **put-back** continues an agent, its dispatch's one note is
   rewritten from the whole record, and its duration is its working time: every attempt, never the gaps between.
4. **A put-back is one of the run's own signals.** A `SendMessage` to an agent the run itself dispatched moves the
   extent's ceiling, and with it the **round**s, the continues, the spend and the outcome.
5. **A run that resumes after its debrief was final is read again**, once per resumption, at its next finalise. This
   lifts the run-observation spec's "one synthesis per run" (D9, D23) exactly as far as a resumption.
6. **A renamed epic keeps its key and names both slugs.** The observation directory stays keyed by the first slug; the
   headline names the last.
7. **Another session's announcement waits until this run is over.** Outside a live run, the run-observation spec's
   "from any session" (D25) stands unchanged.
8. **A dispatch note is capped** at about 8,000 characters of output. Its input budget is unchanged.
9. **An observation that stopped early says so**, in place of a final label it did not earn.

## User Stories

1. As a human whose run put a stage back, including after handing back to me, I want the put-back's rounds, spend and
   outcome counted, so that the figures I forward are of the whole run.
2. As a maintainer, I want a continued stage's note to describe what it finally did, so that a first attempt's state
   is never read as the stage's result.
3. As a maintainer, I want a stage's tokens and its time to cover the same span, so that the slow stage is the one the
   debrief names as slow.
4. As a maintainer, I want a `SendMessage` to a peer session or to the human's own agent left out of the extent, so that
   the human's later work is never counted as the run's.
5. As a human who resumed a run after its debrief went final, I want it read again once the run settles, and told which
   extent that reading is of, so that I know which debrief to forward.
6. As a maintainer paying for the observation, I want at most one extra reading per resumption, so that a run resumed
   once costs one more synthesis and not one per stage.
7. As a human, I want a debrief whose reading came back in the wrong shape to say so plainly, and the reading kept out
   of it but in the notes, so that I neither mistake "not judged" for "no defects" nor lose what I paid for.
8. As a human whose run used `claude-haiku-5-5`, I want its requests priced at the tier each one fell in, so that the
   dollar figure is of the whole run and no other model's figure moves.
9. As a human who renamed an epic during a run, I want the debrief headed with the name it ended with and the first
   name beside it, so that I can find it by either.
10. As a human mid-run in one worktree, I want no announcement of another epic's debrief until my run is over, so that
    nothing about someone else's run reads as news about mine, and nothing is lost by waiting.
11. As a human, I want a debrief whose observation stopped early to say so, at which entry, so that I do not forward a
    partial reading as a final one.
12. As a maintainer, I want a run with no put-backs, no rename and no resumption to produce the same debrief it does
    today, and the free replay to stay byte-for-byte deterministic.

## Implementation Decisions

### Modules touched

- **The observer's rate table**: a prompt-length tier, and the 5-5 haiku's row in it.
- **The observer's trace and its records reader**: a continued dispatch's working time taken from its own record.
- **The observer's run facts**: a `SendMessage` to an own agent counted as an own signal, and the last slug read
  alongside the first.
- **The observer's notes and notes file**: a dispatch's note rewritten after each continue; the output cap; the
  unparsed synthesis reading as an entry of its own.
- **The observer's judge**: a malformed answer kept, not just failed; and the reading taken again after a resumption.
- **The observer's loop and its debrief file**: when the extra reading fires; the "stopped early" state; the headline
  naming both slugs.
- **The observer's hook script**: holding other sessions' announcements while this session's run is live.
- **The glossary**: already done — **Put-back**, the **Extent** entry counting put-backs to own agents, and the
  **Dispatch note** entry covering the rewrite and the length cap.

### The tier

- A row may carry one prompt-length threshold, and an input and output rate above it. Every existing row carries none,
  and is priced exactly as today.
- `claude-haiku-5-5` is $0.10 / $0.50 per million tokens for prompts up to 100K tokens and $0.50 / $2.50 above.
- A request's tier is decided by its own prompt: its input, cache-read and cache-write tokens together. Never by the
  run's total, nor by an average.
- The as-of date and source stay as the table already takes them. The comment naming haiku-5-5 as deliberately absent
  is replaced by the row.

### The replaced note

- A dispatch keeps one note. When a continue to its agent finishes, the note is rewritten in place from the whole
  record at the note's existing input budget, as a first note is today.
- The note states how many continues it covers and the last entry it read. The synthesis only ever sees the latest.
- A re-armed observer rewrites a note only when the record has grown past that entry.
- A dispatch's tokens are still summed over its whole record; its duration is now its working time — the first attempt,
  plus each continue from its first entry to its last — so the two cover the same work. The idle gap before a continue
  is no part of it: a stage that sat waiting on its human is not the slow one.

### The own signal

- An own agent is identified by the id its dispatch's result named, and by the name the dispatch gave it if it gave
  one. A `SendMessage` counts only when its target resolves to one of those.
- Nothing else about the ceiling moves. The first turn the human typed after the run's last own signal still closes
  the extent, and that signal can now be a put-back.

### The extra reading

- **The trigger.** An un-finalise caused by the extent gaining an own signal past the extent of the reading the
  debrief holds. A finalise of the same extent does not trigger it.
- **The timing.** At the next finalise, whichever finaliser that is, never immediately on the new signal.
- **The cap.** One reading per un-finalise, so a run resumed twice can be read three times.
- **Restarts.** A re-armed observer that inherits a held answer reuses it when the extent has not grown, and reads
  again at the next finalise when it has.
- **What the debrief shows.** The extent of the reading it carries, and that an earlier reading of a shorter extent
  was replaced.

### The unparsed reading

- **Recognising it.** The cases the judge already distinguishes: either marker missing, or the two out of order.
- **Where it goes.** The raw answer goes into the notes file under a heading of its own, after the dispatch notes.
- **What the debrief says.** One statement where its defects belong: unjudged, with why, pointing at the notes file by
  its role. It quotes nothing from the answer.
- **No retry.** Structured output stays off, for the cost the judge already records against it.

### The slug

- The trace keeps the first task update's slug as the key, and also carries the last.
- The debrief's headline takes the last, and names the first beside it whenever they differ.
- The observation directory, the identity file and every earlier debrief's lookup keep using the key.

### Holding announcements

- **Live** means the session's own observation marker is present and its observer alive — the liveness test the
  re-arm already uses.
- While this session is live, the prompt hook prints only announcements this session wrote. Others stay pending on
  disk, untouched, and print on the first prompt after this session is no longer live.

### The note cap

- About 8,000 characters, stated in the note's prompt.
- An overrun is cut at a line boundary under the cap, with an elision mark naming the characters cut, and is never
  sent back to the model.

### Stopped early

- Applies to the observer's exit because a record could not be read.
- The debrief's state becomes "observation stopped early", with the last entry read and the reason: neither final nor
  live. A later re-armed observer whose reading succeeds replaces it as it would any non-final debrief.
- A process killed with its container and never touched again stays out of scope
  (`the-observation-reports-the-whole-run`, D7).

## Testing Decisions

Nothing here is covered by CI beyond typecheck and lint. Each behaviour is verified by hand at the three existing seams,
asserting what a human or maintainer would see — a debrief's figures and statements, the notes file's entries, a hook's
output — never an internal call. The prior art is the `idp-scaffold-defects` spec's Testing Decisions and
CONTRIBUTING.md § Replaying a run's records.

- **Free replay of a record or a prefix of one.**
  - **Pricing.** A run with haiku-5-5 requests carries a dollar figure and names no unpriced model. A synthetic record
    with one prompt each side of 100K is priced at the two tiers. Every other model's figure is unchanged.
  - **The extent.** A put-back after the hand-over ends the extent at the put-back's return, and its rounds, spend and
    outcome are included. A later `SendMessage` to an agent the run did not dispatch keeps today's ceiling.
  - **Duration.** A continued dispatch's duration is its first attempt plus each continue's own span, and no gap.
  - **Slug.** A renamed epic is headed with the last slug and names the first, while its files stay under the first.
  - **Early stop.** A record truncated mid-line gives a debrief that says it stopped early at that entry.
  - **No change elsewhere.** A record with none of these shapes replays byte for byte as before. Two replays of any
    record are identical.
- **Judged replay (`--judge`).** This spends money, so it is run on one refine and one build record with put-backs.
  - **Notes.** The notes file holds one note per dispatch; a continued dispatch's note covers its continues and names
    how many. No note exceeds the cap, and a cut note carries its elision mark.
  - **A malformed answer.** A bogus token through a gateway, as the run-observation procedure names, leaves the raw
    answer in the notes file under its heading, and a debrief that says unjudged and quotes none of it.
- **The observer loop driven by hand through the hook script**, at shortened bounds, a copy of a record grown entry by
  entry while the hook events are fired.
  - **Resuming.** A run left idle until it finalises, then grown with a put-back and left to settle, is read a second
    time and names the replaced extent. Left to settle again with nothing grown, it is not read a third time.
  - **Restarting.** An observer killed after a note and re-armed with the record unchanged rewrites no note.
  - **Announcements.** With two sessions sharing one plugin data directory, a prompt in the live one prints only its
    own announcement. Once its run finalises, the next prompt prints the other's.

## Out of Scope

- **Retrying the synthesis, and structured output.** The reading is kept, not paid for twice.
- **A separate note per put-back.** One note per dispatch, rewritten, already shows what the stage finally did.
- **A check that a dispatch note does not leak repository content.** ADR-0018 would welcome one; here the notes stay
  do-not-forward and only their length is capped.
- **A killed observer, container or machine that nothing touches again** (`the-observation-reports-the-whole-run` D7).
- **Forbidding an epic's rename in the skills.** The debrief copes with a rename instead.
- **Reading a resumed run again on every new signal.** One reading per resumption is the cap.
- **The skill and agent findings in the same debriefs**, such as the continued writer that rewrote its whole document
  instead of patching it, or the round prose the host's guard rewrote before the build skill carried it into a fix wave.
  They belong to specs of their own for the refine and build skills.
- **Fast mode's rates for `claude-opus-5-5`.** Nothing in a session record says whether a request ran fast, so the table
  prices it at the standard rate.

## Further Notes

### The source

The debriefs and the findings drawn from them sit outside this repository: a maintainer's collection of 26 refine and
25 build debriefs. Each finding was checked against the default branch at `a733395`. Run numbers in the Problem
Statement are those of that collection.

### Facts to establish by hand before the first ticket

- **Where a continue's entries land.** Whether a `SendMessage` continue appends to the continued agent's existing
  record, which the replaced note and the duration assume, or starts a record of its own.
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
