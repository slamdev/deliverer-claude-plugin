# 02 — Build delivers on refine's branch for a forge-issue epic

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a delivery handed a forge-issue epic finds the epic branch a refinement left — its vocabulary commit
and its draft — and delivers every ticket onto it, so the vocabulary and the tickets share one branch and one change
request without the owner saying so. Where refine left none, delivery goes on as today. Settled in `../spec.md` under
Implementation Decisions › Build — finding the epic.

- [ ] Build's "Find the epic", for an epic on the forge's issues, reads the epic there and then looks for the remote
      branch named from the epic's **slug** with an open change request from it naming the epic's spec location.
- [ ] Found: its name goes on the first `implementer`'s dispatch, as the **Dispatch** rule already carries a branch
      found at that point. Not found: the first `implementer` creates the branch, as today.
- [ ] The claim the spec leaves open is settled and noted in this ticket's comments: how build reads the epic's slug off
      a forge-issue spec (title, label, or otherwise), from `spec-writer`'s publish step.
- [ ] Nothing else in build changes: the first implementer's merge of the default branch into a branch with no
      `Ticket:` commit, refine's commit read as no ticket's, and `change-request-creator` adopting the draft are relied on
      as they stand, each confirmed by reading.
- [ ] Verified by hand: the skill read against a forge-issue epic with and without refine's branch gives the behaviour
      above. `/mattpocock-skills:writing-for-agents` used for the prose.

## Comments
