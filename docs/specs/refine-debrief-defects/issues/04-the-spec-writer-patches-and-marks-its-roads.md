# 04 — The spec writer patches on a put-back and marks its roads

**What to build:** a put-back to `spec-writer` costs the change and not the whole document, and a human answering a
fork knows which roads anyone has seen work. A continued dispatch edits the published spec in place; only a cold
dispatch, **Resume** among them, writes it whole. Every road a fork offers, open or recommended, is marked *proven* —
a prototype ran, a test passed, the code already does it — or *unchecked*, in the spec's Further Notes and in the
report. A decision the reading raised that the brief never addressed is a fork the brief left open, and closes the same
way. Settled under **`spec-writer`** in `../spec.md`; stories 17 (the spec's half), 19, 20.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] A put-back clause: a continued dispatch edits the published spec in place, and only a cold dispatch, including
      **Resume** finding a spec already published, writes it whole.
- [x] Every fork road, open or recommended, is marked *proven* or *unchecked* in Further Notes and in the report, with
      what makes a road proven.
- [x] **Forks** gains one sentence: a decision the reading raised that the brief never addressed is a fork the brief
      left open. **Forks** keeps its two states and no third.
- [x] `spec-writer` is read against `/mattpocock-skills:writing-for-agents`.
- [ ] The bench is run with two arms, `current` against `before=<main>:plugin/agents/spec-writer.md`, `--waves 1`, on
      the existing fixture; the put-back wave's output tokens in each arm's `wave-1.md` and `reading.json` are recorded,
      the current arm coming in well under its own first-dispatch output, and whether every fork road in each arm's
      first report carries *proven* or *unchecked*. Arms are compared only with each other.
