# 02 — Hold the questions a sweep in flight could reprice

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** A human being interviewed stops answering questions that a **sweep** already in flight is about to
invalidate. Before asking anything, the orchestrator tests each pending question against the subject it sent the sweep
to settle: a question that needs those facts waits, and every other question is asked now. When holding leaves the round
with nothing in it, the sweep is the only thing left to wait for, so it waits — nothing is delayed that the
non-blocking property covers. And when a sweep lands facts contradicting something already settled, that decision goes
back to the human as a **fork** rather than being carried on a premise that turned out false.

The three rules live in a named section of their own, and stage 1 keeps delegating the interview in a single bullet with
one added clause pointing at it — the shape the existing carve-out for how a question reaches the human already
established.

**The one dangerous edit in this epic is here.** Stage 1's sentence already carries a clause carving out how a question
reaches the human, added after the analysis this spec was built from. The new clause goes **alongside** it. Replacing
that sentence wholesale silently reverts the carve-out; the spec's Further Notes records this under "One known stale
snippet".

Files: `plugin/skills/refine/SKILL.md`, and confirming `CONTEXT.md`. Decisions D1–D6 and D23 in
`docs/specs/orchestrator-contracts/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] The existing clause carving out how a question reaches the human **survives**, and the new clause sits alongside
      it (D5).
- [x] The orchestrator tests each pending question against the subject it sent the sweep to settle, and holds the ones
      that need those facts (D1).
- [x] The subject is named when the sweep is dispatched, and written to neither the brief nor the task list (D2).
- [x] The empty-round case is stated: when holding leaves nothing to ask, waiting is correct, and the text says why the
      non-blocking property is not violated (D3).
- [x] A sweep landing facts that contradict an already-settled decision reopens it as a fork rather than carrying the
      answer held (D4).
- [x] The three rules sit in a named section, and stage 1 still delegates the interview in one bullet (D5).
- [x] Interview format and pacing are still delegated to the two interview skills, and sweep dispatch is still
      non-blocking (D6).
- [x] The **Sweep** entry is present in the glossary, consistent with the prose written here, and committed — it already
      exists in the working tree, so confirm it rather than re-adding it.
- [x] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D23).
- [x] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
