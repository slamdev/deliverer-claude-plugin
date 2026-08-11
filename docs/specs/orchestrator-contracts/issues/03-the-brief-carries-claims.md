# 03 — The brief carries claims, not facts

Status: ready-for-agent

**Blocked by:** 02 — Hold the questions a sweep in flight could reprice.

**What to build:** The brief stops handing the **writer** anything to take on trust. It names the statements the design
rests on that the session never verified, each with the path that would settle it, and it names them as **claims** —
never as findings, because the writer's own first-hand reading is what promotes one to a fact or kills it, and a claim
dressed as a fact is the one nobody thinks to check. The contract also forbids any section that hands the writer facts
to trust: making the right section available does not make the wrong one unavailable, and an orchestrator with no claims
list to reach for invented a "facts established" heading unprompted.

Downstream of that, the spec writer checks every marked claim before writing it up. One that does not survive goes to
its report as a correction. One it can neither confirm nor kill also goes to its report — not into the spec as a fork,
because a fork is a decision a reasonable engineer could go either way on while a claim is a question of fact nobody
chose. The refinement skill's report then relays both outcomes to the human, since that list is enumerated rather than
open-ended and an item not named on it is one an orchestrator has no reason to add.

The tickets writer is deliberately unchanged: by publication every claim is a fact, a correction, or a reported unknown,
so the spec carries none for it to check.

This is the last ticket in the chain, so it is also where the whole change gets read as one.

Files: `plugin/skills/refine/SKILL.md`, `plugin/agents/spec-writer.md`, and confirming `CONTEXT.md`. Decisions D13–D19,
D21 and D23 in `docs/specs/orchestrator-contracts/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] The brief's contract requires an unverified-claims list, each entry carrying the path that would settle it (D13).
- [x] The contract states the claims-not-findings distinction and why it matters (D14).
- [x] The contract forbids any section that hands the writer facts to trust (D15).
- [x] The spec writer checks every marked claim before writing it up, and a claim that does not survive goes to its
      report as a correction rather than into the spec (D16).
- [x] The spec writer's report carries every claim it could neither confirm nor kill, and such a claim does **not** ride
      into the spec as a fork (D17).
- [x] The refinement skill's report list names claims the writers killed **or** could not settle — both outcomes (D18).
- [x] The tickets writer is unchanged (D19).
- [x] Paths-rather-than-contents and the writer's first-hand read of the repository are unchanged, and the brief does
      not become a channel for findings the writer can trust (D21).
- [x] The **Claim** entry is present in the glossary, consistent with the prose written here, and committed — it already
      exists in the working tree, so confirm it rather than re-adding it.
- [x] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D23).
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [x] **With tickets 01 and 02 landed, the three changes read as one**: the new named section sits consistently beside
      the existing carve-out, no rule contradicts another, and in particular the hold rule and the non-blocking property
      do not read as conflicting.
