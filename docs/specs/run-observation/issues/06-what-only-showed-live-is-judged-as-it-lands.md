# 06 — What only showed live is judged as it lands

Status: ready-for-agent

**Blocked by:** 04, 05

**What to build:** a stage is judged the moment its dispatch finishes rather than only in hindsight, and the synthesis
reads those notes as well as the whole trace. A finished record flattens the things worth reporting most — a stage that
hung for forty minutes, a human who sat on a question, a dispatch that ran long and produced nothing — and this is what
recovers them. Settled as D8 and D9 in `../spec.md`.

- [ ] A note is written for a stage when its dispatch finishes, from that stage's slice of the trace, on a cheap
      tier.
- [ ] The synthesis reads every note as well as the whole trace, so a cross-stage defect is still findable and a
      live-only one is now findable too.
- [ ] The notes carry what a finished record flattens: how long a stage actually ran, where the human was waited on
      and for how long, and a dispatch that produced nothing.
- [ ] Notes live beside the trace, under the same slug and timestamp, and are covered by the same refusal to
      forward.
- [ ] Replay produces notes too, by walking a finished record in order — so this ticket is verified the same cheap
      way as the ones before it.
- [ ] A note that could not be written costs the debrief that stage's live detail and nothing else. The synthesis
      still runs, and the debrief says which stages it is missing notes for.
- [ ] Cost scales with the number of dispatches rather than with wall-clock: one measured delivery made 26.
