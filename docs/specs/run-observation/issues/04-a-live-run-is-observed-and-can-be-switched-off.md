# 04 — A live run is observed without anyone asking, and can be switched off

Status: ready-for-agent

**Blocked by:** 03

**What to build:** typing `/deliverer:refine` or `/deliverer:build` starts an **observer** out of band, which keeps a
debrief current as the run proceeds and finalises it when the run is over; a line names it when the run stops, and again
on the next prompt. One option turns the whole thing off. This is the ticket that makes the feature reach a user at all,
and merging it is what ships it — so the switch and the disclosure land with it rather than after. Settled as D1, D3,
D22, D23, D25, D26, D29 and D32 in `../spec.md`.

- [x] **C1 is settled, and its answer is recorded** in `../spec.md`'s claims section: a hook substitutes
      `${user_config.*}` only in exec form, and for an option sitting at its manifest default it substitutes nothing
      at all, because a hook reads the saved option values where the MCP path merges the manifest's defaults first.
      Nothing here re-opens it — the criteria below are written to that answer.
- [x] A prompt that is a `/deliverer:` command starts an observer. So does a prompt in a session whose records
      already carry deliverer attribution, which is how a run resumed by prose rather than re-typed is covered.
- [x] The attribution check is bounded, because it runs on every prompt of every session on the machine and not only
      on deliverer's. Once an observer exists for a session it is not asked again, and where none exists only a
      bounded slice of the record is read. One measured delivery's main record is 812 KB beside 5.9 MB of
      per-dispatch records, so a whole-record read per prompt is the criterion below failing.
- [x] Any other prompt starts nothing, and the hook costs a session with no run in it nothing worth measuring.
- [x] The observer is detached by the hook itself — its own session, its own process group, and **stdio closed**,
      because a child holding the hook's stdout open keeps the host waiting on the pipe long after the hook has
      exited, which is the run waiting on the observer. The hook returns at once and the process outlives it.
- [x] It is not detached through the host's own `async` hook option. That backgrounds the process, but the host goes
      on tracking it and delivers its later output into the session as an attachment — which is the one thing an
      out-of-band observer may never do (D1, and `../spec.md`'s non-goal on interrupting the run).
- [x] Its working directory is the plugin's data directory and never a repository — it is alive while an
      `implementer` is committing to the **epic branch**. A hook is spawned in the project's own directory, so this
      is the observer's own first act rather than something the launch site hands it.
- [x] The debrief is rewritten as each stage lands, so a readable one exists at every moment rather than only at the
      end. Each rewrite is atomic — staged and renamed into place, never written over in situ — because "at every
      moment" includes the moments something is reading it, and a debrief caught half-written is one nobody can tell
      apart from a debrief the observer got wrong. Ticket 08's assertion reads the current one with no wait and no
      poll, and rests on this.
- [x] Session end **signals** the finalising and never performs it. A `SessionEnd` hook is given 1500 ms before the
      host aborts it and force-exits about five seconds later, and the only way to raise that bound is to declare a
      `timeout` — which makes every exit of every session wait, observed or not. So the hook tells the running
      observer to finalise and returns in milliseconds.
- [x] A generous idle bound — no new record anywhere, main or per-dispatch — finalises the debrief a killed terminal
      left, and catches a session end whose signal did not land. Nothing waits forever.
- [x] A line when the run stops names the headline and the path. It prints nothing at all when there is no debrief
      to name, so a refinement's per-question stops stay silent.
- [x] A line on the next prompt mentions a debrief that has not been read.
- [x] Both lines reach the human as a hook's `systemMessage`, never as `additionalContext` and never as bare stdout.
      On a `Stop` hook `additionalContext` is feedback for the model and the conversation continues on it, which
      would prod a run this feature must not touch. C3 in `../spec.md` records the channel and how it was settled.
- [x] Both lines say what the debrief is, that it is bounded and safe to forward, where it is, and how to turn
      observation off.
- [x] A `userConfig` option turns observation off entirely: no process starts, no trace is written and no debrief
      appears. Its default is on.
- [x] The switch is read from `CLAUDE_PLUGIN_OPTION_<KEY>` in the hook's own environment. An absent variable means
      nobody set the option, which for a default of on is the answer rather than a gap — where a hook referencing
      `${user_config.<key>}` would be refused outright for exactly the users who never touched it. No hook of this
      plugin's references `${user_config.*}` at all, in either form.
- [x] The `SessionStart` install hook publishes the observer's source into the plugin's data directory alongside the
      server's, and the observer resolves the Agent SDK from there — the same arrangement
      [ADR-0002](../../../adrs/0002-dependencies-and-source-are-installed-into-the-plugins-data-directory.md) and
      [ADR-0003](../../../adrs/0003-the-launcher-waits-for-the-install-rather-than-racing-it.md) already settled for
      the server. No second `npm ci`, and session-start time does not grow.
- [x] That publish keeps every property the server's already has: a path that never resolves to nothing, one atomic
      replacement, per-process staging names, and a leftover sweep that knows every name the new tree can leave
      behind. The block being extended is the product of two review rounds against precisely those failures — an
      absent-path window a launcher spawned into, and two concurrent hooks interleaving into a nested tree — and a
      second tree published beside it by a less careful mechanism reopens them for the server too.
- [x] An observer starting before the install has finished behaves the way `launch.mjs` does rather than dying on a
      missing SDK: the host spawns hooks on the first prompt of a cold host while the install is still arriving,
      which is the race [ADR-0003] exists for. Whatever it decides, giving up is reported through the line that was
      going to be printed anyway rather than being silent.
- [x] Nothing the observer does can slow, block, edit or fail a run. Any failure of its own leaves no error in the
      session, no exit code that matters and nothing the human must act on.
- [x] A failure that stops a debrief being produced still reaches the human, through the line that was going to be
      printed anyway.
- [x] The README gains a section: what observation does, that it is on by default, what it writes and where, that it
      draws on the same account as the run, that nothing is ever removed, what a debrief may and may not contain,
      and how to turn it off.
- [x] CONTRIBUTING's project tree carries what this ticket adds: the observer's entry point stands beside the
      server's under `plugin/mcp/`, and the manifest's line agrees with the number of `userConfig` options there now
      are. Ticket 01 leaves both lines shaped so this is an addition rather than a rewrite.
- [x] The hook states are walked by hand and reported: a session with no run in it, a command typed, a run resumed
      by prose, a session ended mid-run, a killed terminal, and observation switched off.
- [x] In the resumed-by-prose state, the debrief's commit line is read as well as whether the observer started. That
      record carries no skill preamble, so it is the only one that reaches ticket 03's fallback — the installed
      plugin's commit, labelled as not the one the run used — and no replay can get there, because every run on disk
      typed its command. Without this the fallback ships exercised by nothing.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — state unchanged.** Touched only while triaging 01. That ticket's closing criterion promises the
framing it lands is durable, so a later ticket "only extends the list of what the directory holds" — but no ticket in
the epic carried that extension, and this is the one that adds the entry point and the fourth `userConfig` option. One
criterion was added here for both of the project tree's lines. Nothing else was evaluated.

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — stays `ready-for-agent`; seven criteria added (one of them a split), four reworded, none
removed. C1 and C3 are settled, and their answers are recorded in the spec.**

Nothing here is built. `hooks.json` declares `SessionStart` and nothing else, no other hook event is named anywhere in
the repository outside `docs/specs/`, `plugin/mcp/` holds `server/` and `launch.mjs`, the manifest declares three
options and the README has no observation section. The search was by concept rather than by the request's wording. No
prior rejection of this shape is on record; the repository keeps no `.out-of-scope/`.

**C1 is settled, and the answer is neither yes nor no.** Read off Claude Code 2.1.241 — the version `../spec.md`'s
measurements were taken on — and confirmed against this machine's own configuration. A plugin hook *can* substitute
`${user_config.*}`, but only in **exec form**; a shell-form command carrying the reference is refused before it runs,
and the plugin's one hook today is shell form. The larger fact is the map being substituted from: a hook reads the
**saved** option values alone, where the MCP path merges the manifest's defaults first — which is why
`server/config.ts` sees `high` although nobody set it. So an option at its default is absent to a hook, and
`${user_config.<key>}` throws `Plugin option "…" isn't set` — for a switch that defaults to on, that is nearly every
user. The host also exports `CLAUDE_PLUGIN_OPTION_<KEY>` into every plugin hook's environment, from those same saved
values, and absence there means nobody set it: exactly what a default of on needs. Confirmed on this machine, where
`pluginConfigs["deliverer@slamdev-deliverer"].options` holds only the `required` option and neither of the two that
carry defaults. `plugin/hooks/install-mcp-server.sh` had already recorded half of this from ticket 02. **The opt-out
reads the variable**, the answer is in the spec's claims section as the first criterion asked, and that criterion now
says so rather than asking for the work again.

**C3 settles the same way, and names a channel that would otherwise have been got wrong.** A hook's `systemMessage`
is displayed to the human on every event, and the host's own hook documentation gives a `Stop` hook printing one as
its worked example — so D25's first line has a channel. `hookSpecificOutput.additionalContext` is *not* it: on `Stop`
it is feedback for the model and the conversation continues on it, which would prod the run this feature must not
touch. A criterion now names the channel and forbids the other two.

**C2 is narrowed by the same read and is ticket 05's to close.** The host injects credentials into a plugin hook's
environment only for plugins on an allowlist of its own, which a third-party plugin is not on — so nothing is handed
to this hook and D27 rests entirely on what the human's own environment and credential store give the SDK. Recorded in
the spec beside the other claims; no criterion here, since D27 belongs to the ticket that runs the judging.

Four decisions were the maintainer's. **Session end signals rather than finalises**: a `SessionEnd` hook is given
1500 ms before the host aborts it and force-exits about five seconds later, and the only way to raise that is to
declare a `timeout` — which makes *every* exit of *every* session wait, observed or not. So the hook pokes the running
observer and returns in milliseconds, and the idle bound is what catches a signal that did not land. **The hook
detaches the observer itself** rather than using the host's `async` hook option: that option backgrounds the process
but leaves the host tracking it and delivering its later output into the session as an attachment, which is the one
thing an out-of-band observer may never do. The detachment criterion also now says *stdio closed*, because a child
holding the hook's stdout open keeps the host waiting on the pipe after the hook has exited — the run waiting on the
observer, arriving through a door nobody would look at. **The attribution check is bounded**: it fires on every prompt
of every session on the machine, and the resumed-by-prose trigger asks it to read records measured at 812 KB beside
5.9 MB, so a marker per session short-circuits it and only a bounded slice is ever read.

Three things were corrected rather than asked. The **publish** criterion said the observer's source lands beside the
server's and said nothing about how: the block it extends is the product of two review rounds against an absent-path
window a launcher spawned into and two concurrent hooks interleaving into a nested tree, so a criterion now requires
the new tree keep every property the existing publish has. The **cold-host race** had no criterion at all, though the
ticket cites [ADR-0003](../../../adrs/0003-the-launcher-waits-for-the-install-rather-than-racing-it.md) for where the
source goes: the host spawns hooks on the first prompt while the install is still arriving, and an observer that meets
that dies on a missing SDK unless it behaves the way `launch.mjs` does. And the **working directory** criterion read
as though the launch site provided one — a hook is spawned in the project's own directory, so standing in the data
directory is the observer's own first act.

Nothing was measured by firing a real hook: C1 and C3 were read off the host's implementation and confirmed against
this machine's configuration and this repository's own earlier measurement. The final criterion — walking the hook
states by hand — is where both meet a running session, and it is unchanged.

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — state unchanged.** Touched only while triaging 07. Ticket 03's commit fallback — the installed
plugin's commit where a record carries no skill preamble — turns out to be reachable by nothing that replays: all five
runs on disk opened with an explicit `/deliverer:` command and all five carry `…/deliverer/cbb4838aa016` in their
preamble. The resumed-by-prose state this ticket's walk already visits is the only record that lacks one, so the walk
now reads the debrief's commit line there as well as whether the observer started. One criterion was added and nothing
else here was evaluated.

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — state unchanged.** Touched only while triaging 08. That ticket's assertion reads the debrief the
moment the run returns, with no wait for the finalise and no poll, on the strength of D23 keeping a readable one current
— which leaves the whole of the race on this side. The rewrite criterion said a readable one exists at every moment and
said nothing about how, so it now requires each rewrite be staged and renamed rather than written over in place. It is
the same property the `SessionStart` hook's source publish already has and for the same reason. One criterion was
extended and nothing else here was evaluated.
