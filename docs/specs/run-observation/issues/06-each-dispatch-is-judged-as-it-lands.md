# 06 — Each dispatch is judged as it lands

Status: ready-for-agent

**Blocked by:** 04, 05

**What to build:** each **dispatch** is judged the moment it finishes, as a **dispatch note**, and the synthesis reads
those notes as well as the whole **trace**. A dispatch's interior is the one part of a **run** nothing else ever reads:
one measured delivery's thirteen per-dispatch **session record**s are 5.9 MB of its 6.7 MB — roughly 1.5M tokens, past
even a long-context window — so by the time the whole run is judged, what happened inside a stage is out of reach. A
note is what recovers it. Settled as D8 and D9 in `../spec.md`.

- [x] A dispatch note is written for each dispatch when that dispatch finishes, from that dispatch's slice of the
      trace, on a cheap tier.
- [x] The unit is the dispatch and never the numbered stage. One delivery on disk ran six `implementer` dispatches
      inside stage 1 alone, so a note per stage would wait for the last of them and then read six records at once.
- [x] A foreground dispatch is finished when its tool result lands. A background one is not: its tool result
      returns `async_launched` in milliseconds and the finish arrives later as a separate `<task-notification>` entry
      carrying the same tool-use id, its status and its result. Five dispatches across three of the five runs on disk
      were launched that way, one pair nine seconds apart — so keying the note to the tool result writes notes on
      stages that have not run, and writes two of them at once.
- [x] Every dispatch the run made gets a note, including one of an agent the plugin does not ship. Half of one
      refinement's four dispatches were `general-purpose` and `context7:docs-researcher` **sweep**s the grilling made
      to settle a question of fact: the run chose to make them, so their conduct is the plugin's machinery even though
      the agent is not.
- [x] A dispatch the human refused at the permission prompt gets a note saying it never ran — two of one delivery's
      thirteen. The refusal is worth reporting on its own: the **orchestrator** asked for something the human would
      not allow.
- [x] A dispatch still in flight when the run is finalised gets a note from what its record holds so far, marked as a
      dispatch that had not finished. The stage a run died inside is the one most worth reporting, which is the
      argument ticket 03 already makes for how a run ended — and it is reachable: the delivery running on this machine
      as this was triaged had a dispatch in flight whose own record was still growing while the main record had been
      silent for nineteen minutes.
- [x] A note carries what only reading a dispatch's interior gives: what the agent did in there, where it went round
      in circles, what it had to go and find because its brief did not carry it, what it held and lost, and what it
      reported against what it actually did.
- [x] A note never restates a figure the code already holds. How long a dispatch ran, what it spent, how many tools
      it called and which model served it are mechanical and sit in one field of the run's own record — every
      dispatch's tool result carries `status`, `agentType`, `resolvedModel`, `totalDurationMs`, `totalTokens` and
      `totalToolUseCount`. Those belong to ticket 02's trace and ticket 03's facts, not to a cheap model that can get
      a number wrong.
- [x] `status` is not evidence that a dispatch produced anything. One delivery on disk holds a dispatch whose result
      reads `status: completed` while its whole text is `Agent terminated early due to an API error: You've hit your
      individual spend limit`, and a second whose result is that same text under `Error:`. A dispatch that came back
      with nothing is read from what came back and never from the status field.
- [x] Each note names the dispatch it is about the way the trace does — the agent type, the stage description the
      host's sidecar carries, the tool-use id and the timestamps — so a **defect** the synthesis grounds in a note is
      locatable by a maintainer holding the file. That is ticket 05's rule for **grounds**, extended to the second
      place grounds can now come from.
- [x] The slice a note reads is bounded. One per-dispatch record on disk reaches 1.5 MB — roughly 390k tokens, past a
      cheap tier's window twice over — so what a note is given is capped the way D6 caps the trace's own entries, and
      a note never fails for a prompt too long.
- [x] One notes file per run, beside the trace, under the same **slug** and timestamp, appended as each dispatch
      lands — so a run killed mid-flight keeps every note already written, and the synthesis has one file to read.
- [x] That file refuses forwarding in the two places the trace does: its filename and its first line. It carries no
      bound of its own and is not the document to send. The debrief's mention of it says the same, which is where
      ticket 03's third refusal already stands for the trace.
- [x] The bound is the synthesis's and never the note's, on the terms
      [ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md) now sets out for a dispatch
      note: ticket 05's instruction is what holds, and it names notes as an unbounded source alongside the trace.
- [x] A replay writes notes beside what is already there rather than rewriting them, which is D19's rule for the
      trace and ticket 03's for the debrief.
- [x] The synthesis reads every note as well as the whole trace, so a cross-stage defect stays findable and one
      inside a dispatch becomes findable.
- [x] Only this run's notes. An earlier run of the epic contributes its **debrief** and nothing else — ticket 07 has
      the observer read those, and a debrief is a bounded document where an earlier run's notes are neither bounded
      nor small.
- [x] A note that could not be written costs the debrief that dispatch's interior and nothing else. The synthesis
      still runs, and the debrief names which dispatches it has no note for.
- [x] A note call that reports success while its whole answer is the SDK's own failure text is a failed note, and a
      note that does not come back in the instructed shape is a failed note. Ticket 05's classification is reused
      rather than a second one invented, for the same reason it exists there: the one outcome that must not exist is
      an SDK error reading as a dispatch nothing was wrong with.
- [x] The cheap tier is named as an alias and never as a pinned id, for the reason ticket 05 and the review's own
      option already record. A model that is refused is a named failure and nothing else — no fallback, no second
      call, no option — and where every note fails that way the debrief says so and the synthesis still runs on the
      trace alone.
- [x] Each note call is bounded, so a note that wedges ends as a named missing note rather than as spend nobody
      asked for beside a delivery that may run for a day. Nothing about the bound reaches the run.
- [x] The note calls load no project or local settings and no `CLAUDE.md`, exactly as ticket 05 requires of the
      synthesis. There are up to thirteen of them per run, so the cheap half is the likelier door for a delivery
      repository's conventions and hooks to walk into the observation through.
- [x] Cost scales with the number of dispatches rather than with wall-clock: 3, 3, 4, 13 and 13 across the five runs
      on disk. Never 26 — that is the file count, a record and a `.meta.json` sidecar per dispatch, and it is the
      miscount `../spec.md`'s Further Notes and this ticket both carried.
- [x] What the observation itself cost, in ticket 03's header, covers every note call and the synthesis at both
      tiers — read the way a **round**'s **spend** is, per-model usage summed, per API request, `unknown` for a
      figure nobody measured and never zero.
- [ ] Verification splits, and the procedure says which half costs money. Judging unavailable, replay stays D17's
      free, model-free, byte-for-byte seam that tickets 02 and 03 are verified at, and no note is written at all.
      Judging on, a replay of one delivery makes up to thirteen cheap calls and one long-context synthesis, and the
      debrief it produces cannot reproduce byte for byte — no option turns notes off on their own, so this is the
      difference between the two paths CONTRIBUTING § What CI does not check already documents, not a third one.
      Ticket 03's determinism criterion was amended during this triage to say which path it holds on, so nothing here
      re-opens it.
- [ ] Verified by replaying the deliverer runs on disk — five as this was triaged, three deliveries and two
      refinements — and reading each debrief for the thing this ticket exists to buy: a defect found inside a
      dispatch that the whole-run trace, capped, could not have grounded.
- [x] Every note and every debrief produced during that verification is read by a human for repository content and
      for quoted questions or answers. Nothing mechanical checks it, ADR-0018 records that as accepted, and notes are
      where the exposure actually is.
- [x] What lands stays inside the typecheck and lint coverage ticket 02 got for the observer's code. No test runner
      is added, no fixture is committed, and CI stays those two commands over the two packages.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — stays `ready-for-agent`; 7 criteria became 28.** Five of the original seven survive reworded,
one of them split in two; two were replaced; twenty-two are new; none was dropped. The ticket is renamed: its old title
named a premise the records do not support.

Nothing here is built. `plugin/` holds two skills, seven agents, one hook and `mcp/`, and `mcp/` holds `server/` and
`launch.mjs`. The search was by concept rather than by the request's wording — `stage note`, `per-stage`, `cheap tier`,
`as it lands`, `haiku` and every sense of `note` across every source, manifest, hook and document outside
`docs/specs/` — and the only hits are `plugin.json`'s review-model option and `agent-backend.ts` reasoning about the
long-context suffix, both of which this ticket reuses rather than duplicates. No prior rejection of this shape is on
record; the repository keeps no `.out-of-scope/`.

**The title's premise did not survive the records, and that is the largest thing this triage found.** "What only showed
live" claims a finished record flattens three things: how long a stage ran, where the human was waited on, and a
dispatch that produced nothing. All three are mechanical and still on disk hours later. Every dispatch's tool result
carries `status`, `agentType`, `resolvedModel`, `totalDurationMs`, `totalTokens` and `totalToolUseCount` in one field;
start and finish timestamps sit on the entries either side of it; and ticket 03 already computes the human's wait from
the same record. Nothing in a session record decays — it is append-only, and none of the five runs on disk compacted.
What *is* out of reach when the whole run is judged is a dispatch's interior: one delivery's thirteen per-dispatch
records are 5.9 MB of its 6.7 MB, ≈1.5M estimated tokens, past even a long-context window, so under D6's cap the
synthesis sees a dispatch's shape and never its inside. The maintainer's call was to reground the ticket there: notes
read the interior, the three figures become the trace's and ticket 03's, and a criterion now forbids a cheap model
restating a number the code already has. The file is renamed to match.

One thing does argue for writing as it lands, and the ticket did not claim it: a debrief and its notes are never removed
(D19), where the records are the host's to keep and not the plugin's — every session record on this machine, of any
kind, begins within the last three days. A note is the only durable reading of a dispatch's interior. That is a reason
to write it early, not evidence that a record forgot.

**The unit was wrong twice over.** The ticket priced itself at "one measured delivery made 26" — 26 is the *file* count,
a record plus a `.meta.json` sidecar per dispatch, and that delivery made **13**. It is the same miscount ticket 03's
triage found in `../spec.md`'s Further Notes, and the spec now says so. And a stage is not a dispatch: delivery
`eee497f5` ran **six** `implementer` dispatches inside stage 1 alone. The maintainer settled the unit as the dispatch,
so the measured cost is 3, 3, 4, 13 and 13 notes across the five runs, and D8, D9 and D28's "stage note" is now the
**dispatch note** the glossary defines.

**`note` was a word the glossary told writers to avoid.** It sits under **Hunch**'s `_Avoid_` list, displaced as a
synonym for it, while this ticket makes it a first-class concept meaning something else and neither the spec nor
`CONTEXT.md` defined it. Settled as **Dispatch note**, now an entry in `CONTEXT.md`'s Observation section, with `note`
dropped from Hunch's list and `stage note` added to the new entry's.

**Four traps came out of reading the records rather than the ticket.** A background dispatch's tool result is
`async_launched`, returned in milliseconds — the finish arrives later as a `<task-notification>` entry with the same
tool-use id, and five dispatches across three of the five runs were launched that way, one pair nine seconds apart. Key
the note to the tool result and it fires on a stage that has not run, twice at once. A dispatch's `status` is not
evidence it produced anything: one delivery holds a dispatch reading `status: completed` whose whole text is `Agent
terminated early due to an API error: You've hit your individual spend limit`, and a second carrying that text under
`Error:`. A single per-dispatch record reaches **1.5 MB** — ≈390k tokens, past a cheap tier's window twice over — so
the slice handed to a note needs its own cap or the note fails on every large stage. And two of one delivery's thirteen
dispatches were **refused by the human at the permission prompt**: they never ran, and the maintainer's call is that
each gets a note saying so, because an orchestrator asking for something the human will not allow is worth reporting.

Three further decisions were the maintainer's. **Every dispatch gets a note, including agents the plugin does not
ship** — half of one refinement's four dispatches were `general-purpose` and `context7:docs-researcher` **sweep**s, and
the run chose to make them. **One notes file per run**, appended as each dispatch lands, so a killed terminal keeps
every note already written and the synthesis reads one file. **A dispatch in flight when the run finalises is noted
from its partial record**, marked unfinished — reachable today: the delivery running on this machine while this was
triaged had one in flight, its own record still growing while the main record had been quiet for nineteen minutes.

**Verification had to split, and the ticket claimed otherwise.** It said replay verifies this "the same cheap way as the
ones before it". It cannot: tickets 02 and 03 rest on a replay that is free, model-free and byte-for-byte reproducible,
and a notes-on replay of one delivery makes up to thirteen cheap calls plus one long-context synthesis and can never
reproduce byte for byte. The no-judging replay stays that seam; a replay that judges is a deliberate paid run, and
ticket 03's determinism criterion now says which path it holds on. No option turns notes off by themselves — D9 keeps
depth out of the owner's hands — so the split is between judging and not judging, which the replay procedure already
distinguishes.

Five things were carried over from ticket 05 rather than left to be rediscovered: each note call is bounded; a success
carrying the SDK's own failure text is a failed note; a malformed note is a failed note; the cheap tier is an alias and
never a pinned id, with a refusal a named failure and no fallback; and the note calls load no project or local settings
and no `CLAUDE.md` — there are up to thirteen of them, so the cheap half is the likelier door for a delivery
repository's conventions to enter the observation through. Two more follow from the notes existing at all: a defect
grounded in a note has to be locatable in it, so a note names its dispatch the way the trace does; and the observation's
own cost in ticket 03's header now covers every note call and the synthesis, at both tiers.

**Two things this triage found that were not this ticket's, both since addressed.** ADR-0018's accepted risk grew here
rather than staying put — notes read dispatch interiors, which is where a delivery repository's content actually is, so
the instruction that holds the bound now has to hold at fourteen calls rather than one, and the cheapest of them see the
most. The ADR says so as of this triage, which is why the criterion above links it instead of arguing it, and the spec's
Out of Scope now declines a checker against the real figure rather than the one-call figure it was first weighed
against. `../spec.md`'s user story 32 was unmeetable for the reason ticket 05's triage recorded — the runs behind the
three existing specs are gone and every run on disk ran commit `cbb4838` — and the story, D24 and the Testing Decisions
line that repeated it now ask for the runs that exist, with those specs named as the rubric and the false positive they
invite named with them.
