# 04 — The spec writer patches on a put-back and marks its roads

**What to build:** a put-back to `spec-writer` costs the change and not the whole document, and a human answering a
fork knows which roads anyone has seen work. A continued dispatch edits the published spec in place; only a cold
dispatch, **Resume** among them, writes it whole. Every road a fork offers, open or recommended, is marked *proven* —
a prototype ran, a test passed, the code already does it — or *unchecked*, in the spec's Further Notes and in the
report. A decision the reading raised that the brief never addressed is a fork the brief left open, and closes the same
way. Settled under **`spec-writer`** in `../spec.md`; stories 17 (the spec's half), 19, 20.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] A put-back clause: a continued dispatch edits the published spec in place, and only a cold dispatch, including
      **Resume** finding a spec already published, writes it whole.
- [x] Every fork road, open or recommended, is marked *proven* or *unchecked* in Further Notes and in the report, with
      what makes a road proven.
- [x] **Forks** gains one sentence: a decision the reading raised that the brief never addressed is a fork the brief
      left open. **Forks** keeps its two states and no third.
- [x] `spec-writer` is read against `/mattpocock-skills:writing-for-agents`.
- [x] The bench is run with two arms, `current` against `before=<main>:plugin/agents/spec-writer.md`, `--waves 1`, on
      the existing fixture; the put-back wave's output tokens in each arm's `wave-1.md` and `reading.json` are recorded,
      the current arm coming in well under its own first-dispatch output, and whether every fork road in each arm's
      first report carries *proven* or *unchecked*. Arms are compared only with each other.

## Comments

Implemented on `refine-debrief-defects`. Bench, 2026-10-31, on claude-opus-5, `--waves 1`, typescript-library fixture, $17.99 for both arms. Output tokens, first dispatch / put-back wave: `current` 55,583 / 13,308 (24%), `before` 34,827 / 17,109 (49%). The current arm's put-back edited `spec.md` and never wrote it whole; the before arm also patched (9 edits), so the patch is not clearly this change's. In dollars the current put-back wave ($6.60) cost more than its first dispatch ($4.60), all of it in context re-read. Every road in the current arm's first report is marked *proven* or *unchecked* (4 of 4); the before arm marks none. Runs: `/tmp/deliverer-e2e/spec-writer-bench-current-2026-10-31T20-08-19-vGJSLv`, `/tmp/deliverer-e2e/spec-writer-bench-before-2026-10-31T20-23-47-IERu6M`.
