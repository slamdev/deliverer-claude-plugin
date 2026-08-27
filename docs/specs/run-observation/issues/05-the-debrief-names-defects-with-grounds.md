# 05 — The debrief names defects, with grounds

Status: ready-for-agent

**Blocked by:** 03

**What to build:** replayed against a past run, the debrief stops being a page of figures and starts saying what the run
cost the human that it did not have to — each **defect** carrying the **grounds** from the trace that show it. This is
the half that reproduces what a human got from watching a run in a second session, and it is built and verified entirely
through replay, so no live run is spent on it. Settled as D2, D8, D9, D10, D11, D12, D13, D14, D17, D27, D28 and D29 in
`../spec.md`, and as [ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md).

- [x] The debrief carries defects, each stating what happened, its grounds from the trace, which file in the
      installed plugin it is about, and — where one is obvious — a proposal, always marked as a proposal and never
      in place of stating the defect.
- [x] Grounds cite the trace by something a reader holding it can find: a timestamp, a dispatch, a poll, a question
      round. A maintainer who doubts a defect asks for the trace behind it, so a defect whose grounds cannot be
      located in that file is taste with a figure attached.
- [x] What counts as a defect is not constrained by a class list. The observer reports what it noticed.
- [x] An observation the trace cannot ground is a **hunch**: written down, in a section of its own, marked apart,
      and never mixed in among defects.
- [x] The observer is told which run it is watching and is given the installed plugin's own directory, so a defect can
      quote the line the run diverged from. Not that skill's text alone: a **dispatch**'s conduct is in `agents/`, a
      **round**'s is under `mcp/`, and D13 has every defect name a file — so the whole installed tree is what may be
      read and quoted, and the repository being delivered into never is.
- [x] The directory read is the one the run's own records name, so the text judged is the text the run ran. Every run
      on disk carries that path in its skill preamble, and the directory's name is the commit ticket 03 reports.
- [x] Where that directory is gone, the installed text now is read and the debrief says it was judged against a
      version other than the one the run ran. One commit's tree stands on this machine beside a marker naming it as in
      use, so nothing promises the tree before it survives an update — and a quotation from a line that has since
      changed is worse than no quotation. Ticket 03's commit line carries the same fallback for the same reason.
- [x] One synthesis reads the whole trace, on a long-context model. Depth is the plugin's choice and no option
      exposes it, so debriefs stay comparable between people.
- [x] The model is named as an alias and never as a pinned id, for the reason the review's own option already
      records: an alias resolves against whatever provider the environment authenticates to, where a pinned id only
      means the same thing on the provider it came from. Reasoning depth is the SDK's own option rather than prompt
      text — which is where the review's effort tier had to go, and this one does not.
- [x] A model that is refused is a named judging failure and nothing else: no fallback, no second call on a bare
      alias, and no option. The long-context suffix was measured on one provider, is refused outright on one alias,
      and may be refused on another provider or on an account without the entitlement — and where it is, every
      debrief on that machine is ticket 03's trace-facts-only one, with the model and the refusal named in it. D9's
      comparability is the whole reason: a debrief judged at a depth nobody can see is worse than one that says it was
      not judged.
- [x] The synthesis answers as prose in an instructed shape, and ticket 03's writer owns the document: the header, the
      footer and the three refusals stay the code's, and the defect and hunch sections are placed under them. No
      structured output format — measured at roughly 1.7× the money and 1.9× the time to return zero findings while
      reporting success, which `agent-backend.ts` records and forbids — and the model never writes the debrief file
      itself.
- [x] An answer that does not arrive in that shape is a named judging failure and never an empty defects section. The
      shape is held by instruction, exactly as ADR-0018's bound is, so the one outcome that must not exist is a
      malformed answer reading as a run with nothing wrong with it.
- [x] One synthesis per run, and a debrief read before it has run says the judging has not run yet rather than
      carrying an empty defects section. D23 keeps a readable debrief at every moment, and "nothing was found" and
      "nothing has judged this yet" are different claims about the same file.
- [x] The bound is instructed: the plugin's own machinery, never the repository being delivered into. A run's
      conversation with its human is carried by shape — counts, subjects, timings, who waited on whom — and never by
      the words of a question or an answer.
- [x] The instruction separates the two things the trace puts side by side: the plugin's own files, which may be
      named and quoted, and the repository's content, which may not. The trace carries excerpts of both — that is the
      accepted risk ADR-0018 records, and the failure mode it names is a contributor making a defect clearer by
      pasting in the very thing the bound excludes.
- [x] The judging call loads no project or local settings and no `CLAUDE.md`, so the delivery repository's own
      conventions and hooks never enter the observation. The SDK loads every settings source when told nothing, and it
      is the project source that carries a `CLAUDE.md`; the user's own settings stay, so an owner whose credentials
      come from there still authenticates.
- [x] The observer authenticates from the environment it inherits, with no configuration of its own. **C2 closes in
      two halves**: a replay reaching a model from the environment a terminal hands it is this ticket's, and a
      hook-launched observer reaching one is ticket 04's by-hand hook walk. Both answers are recorded in `../spec.md`'s
      claims section.
- [x] The review's environment file is never read, although the hook's environment does carry it — it is the one
      option users have saved, so it is the one that is present. It names the identity the *review* runs as, and
      `../spec.md`'s what-must-not-regress keeps it the review's.
- [x] Contention with the run is not managed: no back-off, no deferral, no detection of what kind of credential is
      in hand. The README says observation draws on the same account.
- [x] The judging call is bounded, so a synthesis that wedges ends as a named failure rather than as spend nobody
      asked for, beside a delivery that may run for a day. Nothing about the bound reaches the run.
- [x] A judging call that fails leaves ticket 03's trace-facts-only debrief with the reason named. A partial
      judgement is never presented as a complete one.
- [x] A call that reports success while its whole answer is the SDK's own failure text — not logged in, a prompt too
      long, a connection closed, no text at all — is a failed judging call and never a defects section. The
      classification the review already carries is reused rather than a second one invented, and the first of those
      four is exactly what an environment C2 turns out false on produces.
- [x] What the observation itself cost is read off the result message the way a round's **spend** already is:
      per-model usage summed, per API request, unknown for a figure nobody measured and never zero. A dollar figure
      *is* available here, where ticket 03 found none for the run itself — so this half of the header's spend can say
      what the other half cannot.
- [x] What lands stays inside the typecheck and lint coverage ticket 02 got for the observer's code. No test runner is
      added, no fixture is committed, and CI stays those two commands over the two packages.
- [x] Verified by replaying the deliverer runs whose records are on disk — five as this was triaged, three deliveries
      and two refinements — and reading each debrief against the run it is about. The runs behind
      `build-run-defects`, `orchestrator-contracts` and `review-reliability` are not among them and cannot be: every
      record on this machine postdates all three. Those specs stay the rubric for what a defect looks like rather than
      the material, and the runs on disk ran a plugin that already carries review-reliability's fixes — so finding
      those particular defects again is a false positive rather than a hit.
- [ ] Every debrief produced during that verification is read by a human for repository content and for quoted
      questions or answers. Nothing mechanical checks this, and ADR-0018 records that as an accepted risk.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — stays `ready-for-agent`; fifteen criteria added, three reworded, none removed.**

Nothing here is built. `plugin/` holds two skills, seven agents, one hook and `mcp/`, and `mcp/` holds `server/` and
`launch.mjs`; a search by concept rather than by the request's wording — `debrief`, `observer`, `hunch`, `grounds`,
`synthesis`, `defect`, `judg*` across every source, manifest, hook and document outside `docs/specs/` — finds only other
senses of the words: `agent-backend.ts`'s `PreToolUse` liveness observer, and ADR-0015's judgement, which is the
orchestrator's and not this. No prior rejection of this shape is on record; the repository keeps no `.out-of-scope/`.

**The closing criterion could not be met, and that is the largest thing this triage found.** It asked for the runs
behind `build-run-defects`, `orchestrator-contracts` and `review-reliability` to be replayed. Those records are gone:
the oldest **session record** of any kind on this machine begins `2026-08-23T20:11`, and the three specs were committed
`2026-08-11 22:54`, `2026-08-13 16:10` and `2026-08-24 19:42 +0200` — the last of them 80 minutes before the earliest
deliverer-attributed entry on disk, which is `2026-08-24T19:02Z`. Nothing is archived anywhere else; a sweep of the
filesystem for stray records found only the tools server's own MCP logs. What *is* on disk is five runs — three
`deliverer:build`, two `deliverer:refine` — and all five ran plugin commit `cbb4838`, which is the commit that merged
review-reliability. So the runs available are runs of a plugin that already carries the fixes those specs asked for. The
maintainer's call: **replay the runs on disk, and keep the three specs as the rubric** for what a defect looks like
rather than as the material. The criterion now says so, including the trap that falls out of it — finding
review-reliability's defects in these runs would be a false positive rather than a hit.

**What the observer reads was narrower than the ticket needed.** "That skill's own installed text" cannot support D13,
which has every defect name a file in the installed plugin: a **dispatch**'s conduct is in `agents/` — one of them 18 KB
— a **round**'s is under `mcp/`, and the whole installed tree is 29 files and 444 KB with `node_modules` excluded, so
reading it is cheap and quoting from it is what makes a defect actionable. Three criteria now cover the tree, the
directory to read it from, and what happens when that directory is gone. The path is better than the ticket assumed and
worse in one particular: every run on disk names its own installed directory in its skill preamble
(`…/cache/slamdev-deliverer/deliverer/cbb4838aa016/skills/build`), so the text the run actually ran is readable — but
only one commit's tree stands here, beside a marker naming it as in use, so nothing promises the tree a replayed run
used is still there. Quoting the current text as though it were the run's would misattribute a line that has since
changed, which is the same fallback ticket 03 already reasoned to for the commit.

Four decisions were the maintainer's. **A refused model is a named failure and nothing else** — no fallback, no second
call on a bare alias, no option — so D9's comparability holds whole and a user whose provider or account lacks the
long-context window gets ticket 03's facts-only debrief with the reason in it. **The synthesis answers as prose in an
instructed shape** and ticket 03's writer keeps the document, rather than a JSON output format (measured in this
repository at ~1.7× the money and ~1.9× the time to return zero findings while reporting success) or a per-defect tool
(the shim `agent-backend.ts` forbids). **C2 closes in two halves**, since this ticket is verified by replay and the hook
is 04's: a replay reaching a model from a terminal's environment is closed here, and a hook-launched observer reaching
one is closed in 04's hook walk. No blocker was added, so 04 and 05 stay buildable side by side. Evidence for the second
half, not enough to close it: this machine authenticates through `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` in the
environment, which a hook's child inherits, and it holds no credential file at all — so the interactively-logged-in case
has nothing here to test it with.

Five things were corrected rather than asked. **The judging call must not load the repository's settings**: the SDK
loads every settings source when told nothing, and it is the project source that carries a `CLAUDE.md` — so the delivery
repository's conventions and hooks would walk into the observation through a door ADR-0018 never looked at. The user's
own settings stay, because an owner whose credentials come from there still has to authenticate. **A success carrying
the SDK's own failure text is a failed judging call**: the review already classifies four of those — not logged in,
prompt too long, connection closed, no text at all — and the first is precisely what an environment C2 turns out false
on produces, so without this every debrief on such a machine would carry a login error where its defects belong. **A
malformed answer is a failure too**, for the same reason: the shape is instructed, so nothing but this stops it reading
as a run with nothing wrong with it. **"Not judged yet" and "nothing found" were the same empty section**, which D23's
always-readable debrief makes reachable on every run. And **the observation's own cost** is read the way a round's spend
is — per-model usage summed, per API request, unknown never zero — with one asymmetry worth knowing: a dollar figure
exists for the observer's own call, where ticket 03 found none for the run itself.

**Three things for the maintainer that are not this ticket's.** `../spec.md`'s user story 32 wants the observer checked
"on the runs that produced the existing specs", and those records no longer exist — the story is now unmeetable as
written, and its Testing Decisions counterpart reads as though the runs on disk *are* those runs. The run count in
Further Notes says three; ticket 03's triage said four this morning; it is five now, and the fifth had been running for
eleven minutes when this triage read it. And D32's README list has nowhere to say what the no-fallback answer above
costs: a user on a provider without the long-context window gets facts and never defects, and the README section ticket
04 owns is the only place they could be told.