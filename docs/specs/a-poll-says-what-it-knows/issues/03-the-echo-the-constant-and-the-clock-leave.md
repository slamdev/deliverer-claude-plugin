# 03 — The echo, the constant, the clock and the two restatements leave

Status: ready-for-agent

**Blocked by:** 01 — ADR-0007 records that no bound is published before this stops publishing one.

**What to build:** a **poll** answers with facts about the **round** rather than with an echo of the call that started
it, a constant nobody can act on, a timestamp that cannot move on its own, and two figures that restate their
neighbours. The two bounds a round can end on are stated once, where a caller reads what the tool is, instead of on
every answer it gives. Settled as D7–D10, D16, D17 and D26 in `../spec.md`.

- [x] `changeRequestUrl` is gone from the payload and its schema. The call that started the review names it in the same
      session record, and the **observer** takes a poll's review id off the call rather than off the answer, so nothing
      joins on this.
- [x] `lastEventAt` is gone. `events` alone is the whole working-versus-wedged signal: the record's own update stamp
      moves only when an event is accepted and `events` increments, so two polls could never disagree about them.
- [x] That update stamp itself stays, because eviction still reads it for a terminal record with no ending timestamp.
- [x] `turns` and `canonicalModel` are gone from the payload, from the spend type, from its recorded form, from its
      no-spend value, from its merge, and from the real backend's extraction.
- [x] The count of assistant messages that existed only as `turns`' fallback is gone, and so is the measurement comment
      that justified it. Nothing else counted turns.
- [x] `deadlineSec` is gone, and no bound is published as a figure at all.
- [x] The status tool's description names both bounds — the absolute cap, and the idle bound that ordinarily ends a
      wedged round — interpolated from the server's own constants as a neighbouring description already does, so a
      caller learns both before a round ends on either.
- [x] The refusal a caller meets when a review is already in flight goes on naming both bounds, unchanged.
- [x] Verified against the scripted backend: no answer carries any of the five keys, and the status tool's description
      carries both figures.
- [x] `typecheck` and `lint` pass in `plugin/mcp`; each file's register and column width are matched.
