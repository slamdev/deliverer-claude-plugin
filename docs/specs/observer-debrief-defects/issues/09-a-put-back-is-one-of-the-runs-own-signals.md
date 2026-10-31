# 09 — A put-back to an own agent is one of the run's own signals

**What to build:** a human whose run put a stage back, including after handing back to them, finds the put-back's
rounds, spend and outcome counted in the debrief, so the figures they forward are of the whole run. A `SendMessage` to
anything the run did not dispatch is left out, so the human's later work is never counted as the run's. Settled as
Solution item 4 and under **The own signal** in `../spec.md`.

**Blocked by:** 01 — where a continue's entries land, and how a target is named.

**Status:** ready-for-agent

- [ ] An own agent is identified by the id its dispatch's result named, and by the name the dispatch gave it if it gave
      one. A `SendMessage` counts only when its target resolves to one of those, as 01 established it is named.
- [ ] Such a `SendMessage` moves the **extent**'s ceiling, and with it the **round**s, the continues, the spend and the
      outcome. Nothing else about the ceiling moves.
- [ ] Free replay: a put-back after the hand-over ends the extent at the put-back's return, with its rounds, spend and
      outcome included.
- [ ] Free replay: a later `SendMessage` to an agent the run did not dispatch keeps today's ceiling.
- [ ] Free replay of a record with no put-back is byte for byte as before; two replays are identical.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
