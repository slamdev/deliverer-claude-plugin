# 09 — A put-back to an own agent is one of the run's own signals

**What to build:** a human whose run put a stage back, including after handing back to them, finds the put-back's
rounds, spend and outcome counted in the debrief, so the figures they forward are of the whole run. A `SendMessage` to
anything the run did not dispatch is left out, so the human's later work is never counted as the run's. Settled as
Solution item 4 and under **The own signal** in `../spec.md`.

**Blocked by:** 01 — where a continue's entries land, and how a target is named.

**Status:** resolved

- [x] An own agent is identified by the id its dispatch's result named, and by the name the dispatch gave it if it gave
      one. A `SendMessage` counts only when its target resolves to one of those, as 01 established it is named.
- [x] Such a `SendMessage` moves the **extent**'s ceiling, and with it the **round**s, the continues, the spend and the
      outcome. Nothing else about the ceiling moves.
- [x] Free replay: a put-back after the hand-over ends the extent at the put-back's return, with its rounds, spend and
      outcome included.
- [x] Free replay: a later `SendMessage` to an agent the run did not dispatch keeps today's ceiling.
- [x] Free replay of a record with no put-back is byte for byte as before; two replays are identical.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

**Built, 2026-10-31.** `putBacksIn` in `plugin/mcp/observer/run-facts.ts` finds every `SendMessage` whose target is an
own agent, and `boundsOf` counts each one as an own signal in step 1. In step 2 it is the run's machinery, so its
result and its `<task-notification>` (keyed by the `SendMessage`'s id) count as well. An own agent is one started by an
`Agent` call to one of the plugin's own agents, the same calls `isOwnSignal` trusts. It is known by its result's
`toolUseResult.agentId` and by the input's `name`. The target is read from `to` (or `recipient`), against the id when
`recipient_kind` is `agent`, the name when it is `name`, and either when the field is absent. `RunExtent.putBacks`
counts the put-backs inside the extent. Nothing prints it. It is there so that ticket 10 can tell a reading that grew
because of a put-back.

**Decided: a `SendMessage` whose result is `success: false` is not an own signal.** It continued nothing. The host
could not resume the agent, appended nothing to its record, and no task notification follows. Counting it would move
the ceiling past a turn the human typed for an act that never happened. A `SendMessage` whose result has not landed yet
(a prefix read mid-run) does count, because its result follows within milliseconds. The code comment on `putBacksIn`
gives the same reasoning.

**Verified by free replay**, 99 records from `~/.claude/projects/`: 74 carrying a `SendMessage` and 25 without one.
Every replay went into the same `CLAUDE_PLUGIN_DATA` path. The baseline was `debrief-observer-fixes` from `git archive`.
- Put-back after the hand-over: `dc246bd1…` (refine) read entries 3–190 and now reads 3–389. Its last put-back returns
  at 378–380 and the run's report follows, so the extent stops before the human's next turn at 390. Question rounds go
  from 7 to 13 and spend from $31.54 to $33.21. The outcome is `finished`. `3fcacc9c…` is an older record with no
  `recipient_kind`. It reads 3–361 instead of 3–175, and the two `general-purpose` dispatches made between its
  put-backs move from lost to counted. `c7ba8412…` (build) reads 3–459 instead of 3–278. There the human wrote
  "proceed with the next steps on my behalf" and the run put back three implementers. Prefixes of `dc246bd1…` cut
  mid-put-back (239, 245) end at the cut.
- Target the run did not dispatch: a copy of `dc246bd1…` whose post-hand-over `SendMessage`s target an unknown id gives
  a debrief, trace and identity byte for byte the baseline's (3–190). A copy whose put-back results are rewritten to
  `success:false` does the same.
- Target named by its dispatch's name: a copy whose `Agent` calls carry a `name` and whose `SendMessage`s name it with
  `recipient_kind: "name"` reads 3–389, the same as the id form.
- No change elsewhere: 95 of the 99 records replay byte for byte as on the integration branch. The other four are the
  three above and `a7e1e98f…`, a live session that grew between the two replays. A frozen copy of it is byte for byte
  identical. A second replay of all 98 static records is identical to the first.
