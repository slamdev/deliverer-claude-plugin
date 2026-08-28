# Every run is observed, and what it cost the human comes back as a debrief

Status: ready-for-agent

## Problem Statement

**Three of this repository's four specs were written by one human watching a run in a second Claude session.** The
method was the same each time: start `/deliverer:refine` or `/deliverer:build`, start a parallel session beside it, and
ask that session to watch the run for optimisations, inconsistencies and involvements of the human that were not
needed. What came back became `build-run-defects` ("the machinery underneath it cost the human six things it did not
have to"), `orchestrator-contracts` ("an observed end-to-end run cost the human three things it did not have to") and
`review-reliability` (four **rounds** driven, all four failed, in three distinct ways, and not one **review finding**
ever posted).

That method works and does not scale. It needs a second session, a human who already knows what a defect looks like,
and the willingness to sit beside a delivery that on one measured occasion ran 29h36m.

**So only one person's runs are ever observed.** Everybody else on a team runs the plugin, meets the same defects, works
around them, and the maintainer never hears. The signal that produced three specs is available on exactly one machine.

**Nothing in the plugin reports on its own conduct.** A **run**'s **report** says what it delivered — tickets, rounds,
**assumptions**, **hand-offs**, whether the **checks** ended green. It says nothing about what the run cost the human on
the way: a question answered twice, a stage dispatched cold that could have been continued, a **dispatch** that lost
context it was holding, a poll loop that filled a context window, forty minutes spent on something that produced
nothing. Those are invisible by construction, because the only account of a run is written by the **orchestrator**,
whose own conduct is what is in question.

**The material already exists and nobody reads it.** The host writes a record of every session and of every agent
dispatched inside it, stamped with the plugin and skill that were running, carrying per-turn token usage, timings, every
tool call and every question put to the human. It is on disk after every run, including the runs that fell over. It has
never been read by anything.

## Solution

A team member runs `/deliverer:refine` or `/deliverer:build` exactly as they do today and changes nothing about how they
work. While the run proceeds, an **observer** — a separate process outside the run, which the run never learns about —
reads what the host is already writing down and judges each stage as it lands. When the run stops, a line names a
**debrief**: a short document saying what this run cost the human that it did not have to, each **defect** carrying the
**grounds** from the run's own conduct that show it.

The debrief is bounded to the plugin's own machinery and never to the repository being delivered into, which is what
makes it forwardable without being read first. It names where to send it. The team member sends it; the maintainer
receives the same signal from six people that they previously had only from themselves.

Nothing about the delivery changes. The observer cannot slow it, block it, edit it or fail it, and a run that fell over
is observed exactly as one that finished — which matters, because the runs worth reporting are the ones that went wrong.

## User Stories

1. As a team member, I want every run I start to be observed without my doing anything, so that reporting a defect costs
   me nothing.
2. As a team member, I want the observation to happen outside my run, so that it can never slow, block or break a
   delivery I am waiting on.
3. As a team member, I want to be told where the debrief is the moment my run stops, so that I do not have to remember
   to go looking for it.
4. As a team member who closed the terminal, I want to be told about an unread debrief next time I type, so that one
   that finished after my session ended is not lost.
5. As a team member, I want the debrief to say plainly that it is safe to forward, so that I can send it without reading
   it for leaks first.
6. As a team member, I want the debrief to name where to send it, so that I do not have to work out who maintains the
   plugin or where they take feedback.
7. As a team member, I want the debrief to carry nothing from my repository, so that forwarding it cannot disclose my
   employer's code, specs or tickets.
8. As a team member refining an idea, I want my answers to the grilling never quoted, so that unreleased product
   decisions stay inside my company.
9. As a team member, I want the debrief to say how many questions I was asked and how long I was waited on, so that the
   time the plugin took from me is visible rather than felt.
10. As a team member, I want a debrief even when my run fell over, so that the runs most worth reporting are the ones
    that actually get reported.
11. As a team member whose epic took several runs, I want the observer to know about the runs before it, so that a
    defect spanning two of them is still found.
12. As a team member, I want to turn observation off, so that I can decline to spend money on a diagnostic.
13. As a team member, I want observation to touch no file in my repository, so that nothing of its own can be swept into
    a commit or a **change request**.
14. As a team member, I want to know what observation costs me before I meet the bill, so that spend on my own account
    is never a surprise.
15. As a team member on a machine that cannot reach a model, I want a debrief of the run's facts anyway, so that its
    timings and **spend** are still recorded.
16. As a team member, I want the trace kept beside the debrief, so that a debrief I doubt has something behind it.
17. As a team member, I want the trace marked as not-for-forwarding in its own name and its first line, so that I cannot
    attach the wrong file by being helpful.
18. As a team member starting a session with no run in it, I want observation to cost nothing at all, so that it does
    not tax the rest of my work.
19. As a team member, I want a defect to quote the line of the plugin my run diverged from, so that I can see it is
    about the tool rather than about me.
20. As a maintainer, I want each debrief to name the plugin commit the run used, so that I can tell a defect I fixed
    last week from one I have not.
21. As a maintainer, I want every defect to carry its grounds from the run's own conduct, so that I do not spend an
    evening on taste.
22. As a maintainer, I want each defect to name the file in the plugin it is about, so that a debrief becomes a spec
    without a second investigation.
23. As a maintainer, I want **hunches** kept but marked apart from defects, so that I get the insight without mistaking
    it for evidence.
24. As a maintainer, I want a proposal where one is obvious and marked as a proposal, so that it costs me nothing to
    ignore and occasionally saves me a round of thinking.
25. As a maintainer, I want what counts as a defect left open, so that the observer can report what no rubric of mine
    anticipated.
26. As a maintainer, I want cross-stage defects found, so that "the same question was asked in two rounds" is
    reportable at all rather than invisible to a judge holding one stage.
27. As a maintainer, I want a fixed header on every debrief, so that debriefs from six people can be compared and
    counted even though their defects are open-ended.
28. As a maintainer, I want the run's duration, dispatch count, rounds, outcomes and spend in that header, so that I can
    see what the machinery cost without asking anybody.
29. As a maintainer, I want the debrief to state what the observation itself cost, so that I can judge whether the
    feature earns its keep.
30. As a maintainer, I want debriefs grouped by the epic's **slug**, so that one epic's several runs read together.
31. As a maintainer, I want to ask a team member for the trace behind a debrief, so that a defect I doubt can be
    checked against what actually happened.
32. As a maintainer, I want to replay a finished run's records, so that I can check the observer finds what I found by
    hand.
33. As a maintainer, I want debriefs to keep arriving from people outside my team, so that the plugin improves from runs
    I will never see.
34. As a maintainer, I want a debrief written to be pasted into an issue, so that a team member forwarding one needs no
    tooling of mine.
35. As a contributor, I want the deterministic half of the observer verifiable without spending money, so that a change
    to it can be checked before it merges.
36. As a contributor, I want a broken distiller to fail visibly rather than to produce an empty debrief, so that
    observation cannot silently stop working.
37. As a contributor, I want the end-to-end tests to assert a debrief appeared, so that the feature is covered by the
    one automated seam this repository has.
38. As a contributor, I want a by-hand procedure for the hooks and the detached launch, so that the parts CI cannot
    reach are still exercised deliberately.
39. As a contributor, I want one observer covering both skills, so that a change to either does not mean editing two
    prompts that will drift.
40. As a contributor, I want the observer's own degradation stated in the debrief, so that a diagnostic that stopped
    working does not read as a run with nothing wrong with it.
41. As an owner, I want observation configured where the plugin's other options already are, so that the switch for
    something on by default is where somebody would look for it.
42. As an owner, I want the README to state plainly what observation does, what it spends and what it writes, so that
    nobody discovers it by accident.

## Implementation Decisions

### The observer and where it stands

- **D1. Observation is out of band.** The observer is a separate process, started by the plugin's own hook, that reads
  the records the host already keeps for a session and for every agent dispatched inside it. The orchestrator does not
  dispatch it, is not instrumented for it, keeps no task for it and never learns it exists.
  [ADR-0017](../../adrs/0017-observation-happens-out-of-band-from-the-records-the-host-keeps.md) settles this and names
  the two alternatives it displaces — hooks emitting a purpose-built trace, and an orchestrator narrating its own
  stages — along with the accepted cost of resting on a format the host owns.

- **D2. One observer, told which run it is watching.** The trace says whether a refinement or a delivery is under way,
  and the observer reads that skill's own installed text to know what should have happened. One prompt, one debrief
  shape, one thing to change when either skill changes.

- **D3. It stands in the plugin's data directory and never in the repository.** Its inputs are the session records and
  its output is the debrief, and both live outside every repository. It is alive while an `implementer` is committing to
  the **epic branch**, so a working directory inside that tree is the one thing between an unrestricted agent and a
  stray write inside somebody's change request.

- **D4. It runs unrestricted, and that is recorded rather than accidental.** No denied-tool list and no pre-tool guard,
  consistent with the review backend and with
  [ADR-0006](../../adrs/0006-the-review-agent-runs-unrestricted.md). The protection is D3's standing rather than an
  enforced restriction: an agent whose working directory is not the delivery repository has to go looking before it can
  do harm.

### What it reads

- **D5. The source is the host's own session records.** A run is identified mechanically: the records carry the plugin
  and skill that produced each entry, so a deliverer run needs no marker of its own. Read alongside the main record is
  the per-dispatch record the host keeps for every agent the run dispatched — without those, everything below the
  orchestrator is invisible.

- **D6. The trace keeps the whole run's shape, capped per entry.** Every dispatch, question round, review poll, task
  update and tool call is kept, in order, with its timings and its tokens, and a capped excerpt of whatever each one
  carried. Nothing is dropped by kind; volume is all the cap bounds, and the cap tightens as a run grows. This is what
  reconciles two facts that cannot both be met by a raw read: a measured delivery's records ran to 6.7 MB, and the
  synthesis is meant to see the whole run.

- **D7. Distillation is mechanical.** It is code and not a model: no judgement is formed while the trace is built, and
  the same records produce the same trace. That is what makes replay reproduce a debrief rather than generate a new one.

### How it judges

- **D8. Each dispatch is judged as it lands, and one synthesis reads everything at the end.** A **dispatch note** is
  written when a dispatch finishes, from that dispatch's own record, re-read at the note's own budget and never narrowed
  from the trace's already-capped lines: a note fed the trace's cut sees exactly as little of a dispatch's interior as
  the whole-run reading already does, which is the whole of what a note is for. It is not the live half that buys this —
  a session record decays no faster than the disk it is on, and a stage that hung, a human who waited and a dispatch
  that came back with nothing are all mechanical in a finished record, which is why they are the trace's and D13's
  rather than a note's. What a note buys is a dispatch's interior: the per-dispatch records are the bulk of a run —
  5.9 MB of one delivery's 6.7 MB — so under D6's cap the whole-run reading sees a stage's shape and never its inside.
  The synthesis then reads the whole trace **and** every note: the notes are the only reading of what happened inside
  a stage, and the whole trace is what makes a cross-stage defect findable, which is where the existing specs' best
  findings live. Ticket 06's triage settled the unit as the dispatch and not the numbered stage, and settled the word.

- **D9. Depth is the plugin's choice, not the owner's.** Dispatch notes run on a cheap tier; the one synthesis per run
  runs on a long-context model, for the same reason the review's default carries a long-context alias — it has a whole
  run to hold. No option exposes either, so every debrief is judged at the same depth and debriefs stay comparable
  across a team.

- **D10. What counts as a defect is open.** No fixed class list. The observer reports what it noticed, which is what the
  method being automated actually did.

- **D11. Every defect carries grounds; anything ungrounded is a hunch.** What makes something **grounds** is that a
  maintainer holding the file can find it — a timestamp, a dispatch, a poll count, a question round — and the glossary's
  rule holds: never taste. Three files satisfy that test today: the trace, this run's dispatch notes, and the earlier
  debriefs of the same epic, the last two locatable because a note names its dispatch and a debrief names its run. An
  observation none of them can ground is still written down, in a section of its own, marked as a hunch and never mixed
  in with defects. The test is what is settled here, so a later source that meets it needs no amendment to this.

- **D12. A proposal is allowed where it is obvious and is always marked as one.** Never in place of stating the defect.
  A marked proposal costs the reader nothing to ignore; an unmarked one pre-empts the grilling that is supposed to
  happen on the maintainer's end.

### What a debrief says

- **D13. A fixed header, and a fixed shape per defect.** The header: which skill ran, the epic's slug, wall-clock, how
  many dispatches, how many rounds and how each ended, the run's spend, what the observation itself cost, and the
  installed plugin's commit. Each defect then states what happened, its grounds, which file in the installed plugin it
  is about, and a marked proposal where there is one. Then the hunches. Then a footer.

- **D14. The debrief is bounded to the plugin's own machinery.**
  [ADR-0018](../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md) settles the bound, the treatment of
  a run's conversation with its human — shape, never words — the slug as the one deliberate exception, and the decision
  that the bound is held by instruction alone, with no mechanical distillation and no second reader, recorded there as
  an accepted risk with its failure mode named.

- **D15. The footer names where to send it:** an issue on the plugin's own repository. A debrief that does not say
  where to go is one that gets read and closed. Naming a destination decides nothing about the plugin's behaviour, so
  it does not touch [ADR-0012](../../adrs/0012-the-plugin-names-no-forge.md) — no rule holds on one forge and not
  another, and no instruction becomes reachable only where a particular tool is installed.

- **D16. Which plugin this was, read off the installed clone.** `plugin.json` carries no version field and there is no
  release step, so the commit of the checkout the host installed is the only thing that dates a debrief. Without it
  every debrief received is about an unknown build.

- **D17. The header is worth having on its own.** Where no judging can run — no credentials on that machine, the SDK
  missing, the model refusing — the debrief ships with its header, no defects, and a line naming what stopped the
  judging.

### Where things live and how long

- **D18. Debriefs and traces live in the plugin's data directory**, under the epic's slug and a timestamp, which is
  where the plugin's dependencies and published source already go
  ([ADR-0002](../../adrs/0002-dependencies-and-source-are-installed-into-the-plugins-data-directory.md)). Outside every
  repository by construction, and it survives a reboot where the temporary directory the **brief** uses does not.

- **D19. The trace is kept and nothing is ever removed.** Kept because a debrief that looks wrong needs something
  behind it; never removed, which is the rule `e2e-tests` already follows for its run directories. The disk cost falls
  on users and is stated in the README rather than managed.

- **D20. The trace refuses forwarding in three places** — the debrief's mention of it, the trace file's own first line,
  and its filename — because somebody attaching a file reads the filename and nothing else. The trace carries no bound
  of its own and is not the document to send.

- **D21. An observer reads the earlier debriefs for its epic's slug.** They are already in the same directory, so
  continuity across the several runs an epic takes costs a directory listing. It is what makes "the resumed run
  re-dispatched a stage that had already finished" findable. Each debrief still stands alone for forwarding.

### Lifecycle

- **D22. A prompt-level hook starts the observer.** It fires on every prompt, costs nothing when the answer is no, and
  starts an observer when the prompt is a `/deliverer:` command or the session's records already carry deliverer
  attribution — which covers a run resumed by prose rather than re-typed. Both skills declare
  `disable-model-invocation`, so a run can only ever begin with a human typing the command: this trigger is complete
  rather than best-effort.

- **D23. The debrief is always current, and finalising is a flag.** It is rewritten as each stage lands, so a readable
  one exists at every moment. Session end finalises it; a generous idle bound — no new record anywhere, main or
  per-dispatch — finalises the one left by a killed terminal. Getting that bound wrong costs a label and never the
  content, which is why silence is allowed to be a poor signal here. **Those two and nothing else**: what the run's
  own records say about how it ended is a reading and not a signal, true of any pause between stages, and finalising
  on it would spend D9's one synthesis on a run still going. Where the idle bound is wrong anyway, the label comes
  back and the kept answer says which extent it read — so the guess costs neither a second whole-run reading nor a
  claim the reading cannot support.

- **D24. Replay is a capability in its own right.** The same code path can be pointed at the records of a run that is
  already over. It costs almost nothing given where the trace comes from, and it is what lets a team member re-run a
  debrief that looks wrong, lets the maintainer replay the runs whose records are still on disk, and gives a debrief
  to a run whose observer never started.

- **D25. Two lines carry the debrief to the human.** One when the run stops, naming the headline and the path, and
  printing nothing at all when there is no debrief to name — so a refinement's per-question stop firings cost nothing.
  One on the next prompt, mentioning an unread debrief, so a debrief finalised after the session closed is not lost.
  Both carry what the debrief is, that it is bounded and safe to forward, where it is, and the option that turns
  observation off.

### Configuration, cost and failure

- **D26. Observation is on by default**, for every user of the plugin, and a `userConfig` option turns it off — the
  product's established idiom, visible in `/plugin` beside the three options that exist. **C1 is settled** (below), and
  it decides the surface: the switch is read from `CLAUDE_PLUGIN_OPTION_<KEY>` in the hook's own environment and never
  through `${user_config.*}`: an option at its manifest default reaches a hook with no value by either route, and only
  the variable's absence is survivable — a `${user_config.*}` reference refuses the hook outright.

- **D27. The observer authenticates with the session's own environment.** A hook-launched process inherits what the
  human authenticated the session with, so there is nothing to configure — which is what on-by-default requires, since
  a required file could not be added to existing installs without breaking them. **Claim (C2).**

- **D28. Contention with the run is accepted and documented.** Drawing on the same account means the observer and the
  delivery it watches can compete for one rate limit on a subscription. No back-off, no deferral, no detection of what
  kind of credential is in hand: dispatch notes run cheap and a delivery spends most of its wall-clock inside
  dispatches, so contention is expected to be rare. The README states that observation draws on the same account.

- **D29. Failure never reaches the run, and is never silent.** No error in the session, no exit code that matters,
  nothing the human must act on — and the degradation is recorded where a human meets it: the debrief says what the
  observer lost and where, and where there is no debrief at all, the end-of-run line says why. A diagnostic nobody can
  tell has stopped working is worse than one that is plainly absent, which is the same reasoning the tools server
  applies to a warning in a log nobody opens.

### Structure and documentation

- **D30. The observer ships as a second entry point inside `plugin/mcp/`.** One install, one lockfile, one
  `tsconfig.json`, one lint config, one CI package — and the Agent SDK the hook already installs there is what the
  observer needs. Session-start time is unchanged and no second `npm ci` is added.

- **D31. `plugin/mcp/` stops meaning "the tools server".** It means the plugin's Node code, of which the tools server
  is one part. CONTRIBUTING's project tree and `.claude/CLAUDE.md`'s section on the server are corrected to say so,
  rather than left describing a directory that no longer holds only what they claim.

- **D32. The README gains a section on observation** — what it does, that it is on by default, what it writes and
  where, that it draws on the same account as the run, that nothing is ever removed, what a debrief may and may not
  contain, and how to turn it off.

## Testing Decisions

**A good check here tests external behaviour and nothing else**: records in, a debrief out. Nothing reaches for a
private function and nothing asserts on how a judgement was reached.

**One seam, and it falls out of the architecture rather than being built for testing.** Replay (D24) is the highest
point at which anything here is observable, and it subsumes everything deterministic: point the observer at a record
already on disk and read what comes out.

- **With judging unavailable, replay is deterministic, model-free and free.** It takes D17's path, so one artifact
  exercises distillation, D6's per-entry cap, D13's header, the fallback wording, the debrief writer, D15's footer and
  D20's refusal. This is the role the **scripted backend** plays for the review — the cheap by-hand route that needs no
  model, no forge and no money — and it is added to CONTRIBUTING § What CI does not check beside it.
- **With judging on, the same seam runs the whole feature** against the deliverer runs whose records are on disk.
  What that answers is the only question that matters about the judging half: whether the observer finds what a human
  found by hand. The runs behind `build-run-defects`, `orchestrator-contracts` and `review-reliability` are **not**
  among them and cannot be — every record on the machine this epic was written on postdates all three — so those specs
  are the rubric for what a **defect** looks like and never the material. Every run on disk ran a plugin that already
  carries review-reliability's fixes, which makes finding those particular defects again a false positive rather than a
  hit.

**What a good check looks like at that seam:**

- A record with no deliverer attribution in it produces no debrief and no trace.
- A refinement's record and a delivery's record each produce a debrief whose header names the right skill, the right
  slug, the right dispatch count and the right rounds with their outcomes.
- A record whose run ended mid-stage still produces a debrief, with the run's state at the point it stopped.
- A record for a slug that already has debriefs beside it produces one that has read them (D21).
- A record containing an enormous tool result produces a trace with that entry present and capped, not dropped (D6).
- Replaying the same record twice produces the same trace (D7).
- A truncated or malformed record produces a debrief that says what was lost, rather than an empty one or a crash
  (D29).
- No debrief produced from any of the above quotes repository content or a question's or answer's words (D14) — read by
  a human, since nothing mechanical checks it and ADR-0018 records that.

**Above it, the end-to-end tests assert a debrief appeared.** The two happy-path tests already drive whole runs, so a
debrief is produced whether or not anybody asserts it, and a matcher for it costs no extra money or time. It is a
shallow check by design — that a debrief exists for the run and its header names it — since depth lives at the replay
seam.

**Prior art, and the shape it takes:** there is no test suite in this repository and none is added; the server package
has exactly two scripts and CI stays `typecheck` and `lint` over the two packages. Replay is run by hand, the way the
scripted backend and `launch.mjs` already are.

**The hooks have no seam and are exercised by hand**, like the install already is (CONTRIBUTING § Exercising the
install by hand). The states worth walking: a session with no deliverer run in it (nothing starts), a `/deliverer:`
command typed (an observer starts), a run resumed by prose in a fresh session (an observer starts on attribution), a
session ended mid-run (the debrief finalises), a terminal killed (the idle bound finalises it), and observation switched
off (nothing starts at all).

**What is deliberately not tested:** whether a debrief is *right*. Whether a defect is real, whether a hunch is worth
having and whether a proposal is any good are judgements no check in this repository can settle — only a human reading
a replayed debrief against a run they remember.

## Out of Scope

- **Anything on the maintainer's side.** No aggregation, no dashboard, no counting across debriefs, no automation that
  files them. A debrief is a document a human forwards.
- **Automatic submission.** Nothing posts, opens an issue, or sends a debrief anywhere. The footer names a destination;
  the human decides.
- **Interrupting the run.** The observer never speaks into the session mid-run, never raises anything with the human
  while a run is going, and never asks the orchestrator for anything.
- **Changing either `SKILL.md`'s stages.** No stage, task or dispatch is added to a refinement or a delivery, and
  neither skill learns that observation exists.
- **Mechanical redaction, and any check on the finished debrief.** Both were weighed and declined; ADR-0018 records the
  decision and the failure mode, so adding one later is an improvement rather than a reversal. The cost argument behind
  the second has since moved, and is recorded here rather than lost: a checker was weighed as one more agent on every
  run, and a delivery now makes up to thirteen cheap calls of its own for its **dispatch note**s, so a fourteenth is a
  smaller objection than the one that was answered. Still declined — declined against the real figure.
- **Observing anything but deliverer runs.** Other sessions, other plugins and hand-driven work are not observed.
- **Rate-limit back-off, deferral or credential detection** (D28).
- **Pruning, expiry or any cleanup** of debriefs or traces (D19).
- **A version field in `plugin.json`** (D16). The commit stands in for one; the shipping model is untouched.
- **Configurable depth.** No option for the observer's model or effort (D9).
- **Renaming `plugin/mcp/`.** The honest rename is a **wide refactor** across the manifest, the hook, the launcher, CI
  and two ADRs; D31 corrects the prose instead.

## Further Notes

### The measurements this rests on

Taken from this machine, on Claude Code 2.1.241, against runs of this plugin that have already happened:

- Session records live at `~/.claude/projects/<munged-cwd>/<session-id>.jsonl`, with one file per dispatched agent under
  `<session-id>/subagents/`.
- Assistant entries carry the plugin and skill that produced them; runs of both skills are already tagged that way.
  Each also carries an ISO timestamp, the model, the effort, the git branch and full per-turn token usage — the last of
  which is the **spend** figure `e2e-tests/README.md` records as invisible to the harness.
- Tool calls are all present and named, dispatches and review polls among them, as are the human's own messages with
  their timestamps.
- One delivery's records: 812 KB in the main file plus 5.9 MB across 26 per-dispatch files. One refinement's: 890 KB
  plus 1.2 MB across 8. Roughly 1.7M tokens for the smaller delivery, against a 29h36m delivery on record — which is
  what D6's cap exists for.
- **Those file counts are not dispatch counts.** A dispatch leaves two files, a record and a `.meta.json` sidecar, so
  the 26 above are **13** dispatches and the 8 are 4. The runs measured here made 3, 3, 4, 13 and 13 — the figure
  anything costing per dispatch is priced against. The number of runs on the machine is not a standing fact and no
  decision here rests on one: it went three, four, five across three days of triage, and a ticket that needs a count
  carries it with the date it was taken.
- **A dispatch's interior is where a run's volume is**: 5.9 MB of that delivery's 6.7 MB sits in per-dispatch
  records, one of them alone 1.5 MB (≈390k tokens, past a cheap tier's window twice over). D8 rests on this.
- Every dispatch's tool result carries `status`, `agentType`, `resolvedModel`, `totalDurationMs`, `totalTokens` and
  `totalToolUseCount` — so a stage's duration, spend and tool count need no model. `status` is not a claim about what
  came back: one dispatch on disk reads `status: completed` while its whole text is an API-error termination.
- A dispatch launched in the background returns `async_launched` in milliseconds and reports its finish later as a
  `<task-notification>` entry carrying the same tool-use id. Five dispatches, spread across three of the runs measured
  here, were launched that way.

### The claims this spec rests on

Each is a **claim** in the glossary's sense: a statement this design rests on that nobody had checked. Two are now
settled, and their answers are recorded here rather than in the ticket that needed them, because more than one ticket
reads them.

1. **C1 — a hook can read `${user_config.*}`. SETTLED: in exec form, and never for an option at its default.** A
   plugin hook's command and arguments are substituted the way `.mcp.json`'s are, but only in **exec form** —
   `{"command": "<executable>", "args": ["${user_config.KEY}"]}`. A shell-form command carrying the reference is
   refused before it runs, and the plugin's one hook today is shell form. The larger fact is the map being substituted
   from: a hook reads the **saved** option values alone, where the MCP path merges the manifest's defaults first, which
   is why the server sees `high` although nobody set it. An option nobody has set is therefore absent to a hook, and
   `${user_config.KEY}` throws `Plugin option "…" isn't set` — the common case for a switch that defaults to on. The
   host also exports `CLAUDE_PLUGIN_OPTION_<KEY>` into every plugin hook's environment — the key upper-cased, with
   every character outside `A-Za-z0-9_` replaced by `_` — from those same saved values. **D26's opt-out reads that
   variable**: absent means nobody set it, which for a default of on is the answer rather than a gap. Read off Claude
   Code 2.1.241's own implementation and confirmed against a machine carrying this plugin's three options, where the
   one that is `required` is saved and the two that carry defaults are absent. `plugin/hooks/install-mcp-server.sh`
   already recorded the second half of this.
2. **C2 — a hook-launched detached process inherits enough environment to authenticate an Agent SDK query.** D27 rests
   on it, and so does on-by-default working without configuration. **Narrowed, not closed**: the host injects
   credentials into a plugin hook's environment for plugins on an allowlist of its own, which a third-party plugin is
   not on — so nothing is handed to this hook, and what is left is whatever the human's own environment and credential
   store already give the SDK. It closes in two halves, and ticket 05's triage split them: a **replay** reaching a
   model from the environment a terminal hands it, and a hook-launched observer reaching one.
   **The replay half: SETTLED, both ways.** A replay run from a terminal carrying this machine's own credential — the
   repository's `.env`, which `./claude` exports into every session it starts — authenticated an Agent SDK query with
   no configuration of its own, on nine runs' records: the alias `opus[1m]` resolved and was served, and the debriefs
   carry the **defect**s and the dollar figure to show it. Nothing was read out of that file by the observer and no
   variable was named; it inherits an environment and that is the whole mechanism. The negative case was measured on
   the same machine, from a terminal carrying no Anthropic credential at all: the SDK answers `subtype: success`
   carrying `Not logged in · Please run /login`, with `total_cost_usd: 0` and an empty `modelUsage` — which is why the
   review's `not_logged_in` classification is reused rather than a second one invented, and why that debrief names a
   judging failure instead of putting a login error where its defects belong. So D27 holds where the environment
   carries a credential and degrades exactly as D17 and D29 require where it does not.
   **The hook half stays ticket 04's**, and nothing here closes it: what a `UserPromptSubmit` hook's detached child
   inherits is not what a terminal hands a command.
3. **C3 — a stop-time hook's output actually reaches the human. SETTLED: through `systemMessage` and nothing else.**
   A hook's JSON output carries `systemMessage`, which the host displays to the human on every event, and the host's
   own hook documentation gives a `Stop` hook printing one as its worked example. `hookSpecificOutput.additionalContext`
   is not that channel: on `Stop` it is feedback for the model and the conversation continues on it, which would prod a
   run this feature must never touch. Read the same way as C1, on the same version.
4. **C4 — the installed plugin's checkout exposes a readable commit.** D16 rests on it. Triaging ticket 03 found it
   settled three ways over, and better than D16 assumed; that ticket's criteria carry the answer.
5. **C5 — the record format is stable enough to rest on.** Verified as present today, never as a contract. ADR-0017
   accepts this and requires that losing it degrade the debrief rather than the run.

### What must not regress

- No stage, task or dispatch is added to either skill, and neither learns that observation exists.
- Nothing the observer does can slow, block, edit or fail a run, and nothing it writes lands inside a repository.
- CI stays `typecheck` and `lint` over the two packages, and no end-to-end test is added to it.
- The plugin's three existing configuration options keep their meanings, and the review's environment file stays
  required and stays the review's.
- Session-start time does not grow: no second `npm ci`, no additional install.
