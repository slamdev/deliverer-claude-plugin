# 01 — A stage is unfinished until its report is in hand

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** Neither orchestrator can any longer mistake an acknowledgement for a **report**. A stage that a later
stage reads is unfinished until its report arrives, and no `sleep` or poll stands in for one — too short and the
orchestrator asks again, too long and the epic waits on its guess. Alongside that, the refinement skill starts
preferring to continue a **writer** that is still addressable over dispatching a cold one, because a correction that
keeps the document's context costs a patch rather than a rewrite. The ADR above both skills stops implying the
orchestrator has exactly two moves.

The delivery skill gets the sequencing half of this and not the cost preference. That asymmetry is deliberate and its
grounds are in the spec: the measurement behind the preference was taken on a spec writer, and the delivery skill's own
resume contract already makes cold re-dispatch safe for every agent but the code reviewer, which has a rule of its own
because rounds are counted.

Files: `plugin/skills/refine/SKILL.md`, `plugin/skills/build/SKILL.md`,
`docs/adrs/0015-the-orchestrator-forms-no-judgement.md`. Decisions D7–D12 and D23 in
`docs/specs/orchestrator-contracts/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] The refinement skill prefers continuing an addressable writer over a fresh dispatch, and says why (D9).
- [x] Both skills state that a stage a later one reads is unfinished until its report is in hand, and that an
      acknowledgement is not a report (D7).
- [x] Both skills rule out `sleep`- or poll-based waiting explicitly (D8).
- [x] The delivery skill does **not** carry the continue-over-re-dispatch preference (D10).
- [x] No host mechanism is named anywhere in the change — the prose says what must be true and what is forbidden, not
      the tool that makes it so (D11).
- [x] The ADR no longer implies the orchestrator has exactly two moves, and states that a continuation finishing in the
      background has not reported (D12).
- [x] Continuations are not forbidden anywhere in the change.
- [x] **No new ADR is created** — amending 0015 is the whole of the ADR work for this epic (D20).
- [x] Register holds per file: load-bearing bold, no hedging, second person, "you are done when…" (D23).
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
