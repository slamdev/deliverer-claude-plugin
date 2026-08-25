# 02 — A finished run's records become a trace

Status: ready-for-agent

**Blocked by:** 01

**What to build:** pointed at a session record on disk, a mechanical distiller finds the **run** in it, reads every
per-**dispatch** record beside it, and writes a **trace**: the whole run's shape in order, with timings and tokens, each
entry's content capped rather than dropped. Nothing judges anything here — the same records must give the same trace,
because that is what lets every ticket after this one be verified by replaying a record instead of spending a run.
Settled as D5, D6, D7, D18, D19 and D20 in `../spec.md`, and as
[ADR-0017](../../../adrs/0017-observation-happens-out-of-band-from-the-records-the-host-keeps.md).

- [ ] Given the path to a session record, the deliverer run in it is identified from the plugin and skill stamped on
      its entries — no marker of the plugin's own, and no argument naming the run.
- [ ] A record carrying no deliverer attribution produces no trace, and says so rather than producing an empty one.
- [ ] Every per-dispatch record the run left is read alongside the main one. Without them everything below the
      **orchestrator** is invisible, which is most of a delivery.
- [ ] The trace carries, in order: each dispatch with the agent it ran and how long it took, each question round put
      to the human, each review poll, each task update and each tool call — with timestamps and per-turn token
      figures.
- [ ] What an entry carried rides along as a capped excerpt. Nothing is dropped by kind: the cap bounds volume and
      nothing else.
- [ ] The cap tightens as a run grows, so a long delivery's trace stays inside a context window. One measured
      delivery's records were 6.7 MB.
- [ ] Replaying the same records twice produces the same trace, byte for byte. Nothing samples, nothing randomises
      and no model is called.
- [ ] The trace is written under the plugin's data directory, keyed by the epic's **slug** and a timestamp, and
      nothing already there is removed.
- [ ] The trace refuses forwarding in two places of its own: its filename, and its first line. It carries no bound
      and is not the document to send.
- [ ] Nothing is written inside any repository, and nothing outside the plugin's data directory.
- [ ] A record that is truncated, malformed or still being written produces a trace saying what was lost, never a
      crash and never a silently empty file.
- [ ] Exercised by hand against the records of runs already on disk. No test runner is added, no fixture is
      committed, and CI stays `typecheck` and `lint` over the two packages.
