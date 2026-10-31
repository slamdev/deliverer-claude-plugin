# 08 — The orchestrator reads whether the change request can merge

Status: ready-for-agent

**Blocked by:** 04 — the merge goes in front of the restructured per-comment loop; 07 — the conflict and a red check
reach the wave as the orchestrator's own mechanical reads in the ledger.

**What to build:** a change request that cannot merge is never **flipped ready**, and a **fix wave** is told of a
conflict or a red **check** before it starts. One run flipped a conflicting change request ready and its human spent
17 minutes fixing it; in another the default branch moved mid-delivery, turned a check red, and the next wave spent
its first turns working out what broke. Settled as change 6 in `../spec.md` § Solution and under § The fix wave.

- [ ] The orchestrator reads whether the change request can merge before each fix wave and at stage 10 — a mechanical
      read of the forge, forming no view (ADR 0015).
- [ ] A conflict goes into the wave's brief as a fact, as a ledger entry; a check read red goes in the same way.
- [ ] `comments-addresser` merges the default branch in before the first comment is worked, where its brief names a
      conflict — a merge commit, never a rebase or a force-push.
- [ ] At stage 10 a change request that cannot merge stays a draft, with the conflict reported as a **hand-off**.
- [ ] Clearing a conflict before stage 3 stays out of scope (`../spec.md` § Out of Scope).
- [ ] Every touched file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap
      are kept.
