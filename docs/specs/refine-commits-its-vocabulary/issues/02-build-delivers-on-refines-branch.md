# 02 — Build delivers on refine's branch for a forge-issue epic

Status: resolved

**Blocked by:** None — can start immediately.

**What to build:** a delivery handed a forge-issue epic finds the epic branch a refinement left — its vocabulary commit
and its draft — and delivers every ticket onto it, so the vocabulary and the tickets share one branch and one change
request without the owner saying so. Where refine left none, delivery goes on as today. Settled in `../spec.md` under
Implementation Decisions › Build — finding the epic.

- [x] Build's "Find the epic", for an epic on the forge's issues, reads the epic there and then looks for the remote
      branch named from the epic's **slug** with an open change request from it naming the epic's spec location.
- [x] Found: its name goes on the first `implementer`'s dispatch, as the **Dispatch** rule already carries a branch
      found at that point. Not found: the first `implementer` creates the branch, as today.
- [x] The claim the spec leaves open is settled and noted in this ticket's comments: how build reads the epic's slug off
      a forge-issue spec (title, label, or otherwise), from `spec-writer`'s publish step.
- [x] Nothing else in build changes: the first implementer's merge of the default branch into a branch with no
      `Ticket:` commit, refine's commit read as no ticket's, and `change-request-creator` adopting the draft are relied on
      as they stand, each confirmed by reading.
- [x] Verified by hand: the skill read against a forge-issue epic with and without refine's branch gives the behaviour
      above. `/mattpocock-skills:writing-for-agents` used for the prose.

## Comments

**The slug claim, settled by reading.** `spec-writer`'s publish step (step 6) publishes the spec "named from the epic's
slug" and carrying the triage label for work ready for an agent, and nothing more: on the forge's issues the only name
an issue has is its title, and the one label it gets is the triage label, which carries no slug. So build reads the
slug off the spec issue's title. That reading is approximate on both ends — the title is only *named from* the slug,
and so is the branch, in the style of the branches already there — so build does not rest on it alone: it looks for an
open change request whose description names the epic's spec location, from a branch named from the slug. Refine's
placeholder names that location verbatim, which makes the change request the exact half of the match and the name the
check that keeps someone else's branch out. Not yet confirmed against an issue a real forge-issue refine run published:
that run first exists with ticket 04's fixture, and ticket 06's hand run is where a title that strays far from the slug
would show.

**Confirmed by hand.** `plugin/skills/build/SKILL.md` read against a forge-issue epic:

- *With refine's branch:* "Find the epic" fetches, finds the open draft naming the spec's issue from the slug-named
  branch, and takes that branch as found; **Dispatch** already sends "the branch's name from the first stage-1 dispatch
  where you found the epic branch". **Resume** reads the draft's placeholder description as stage 1 not over, and
  refine's commit (no `Ticket:` line) as no ticket begun, so every ticket is dispatched.
- *Without it:* no such change request, so no branch is found and the first `implementer` creates the branch, as before.
- *Relied on as they stand:* `implementer` step 1 switches to the named branch, pulls, and merges the up-to-date default
  branch into a branch with no `Ticket:` commit yet; its step 2 counts only `Ticket:` commits as a ticket's work.
  `change-request-creator` step 2 takes the named branch, step 4 adopts the change request already open for it and
  rewrites its title and description, and **Which entries** mirrors only `Ticket:` commits' assumptions, so refine's
  commit is passed over.
- One wording change beyond "Find the epic": **Resume**'s example of a commit with no `Ticket:` line now reads "a
  refinement's commit of what it wrote into the repository" rather than "of the spec and tickets", since for a
  forge-issue epic that commit carries only the vocabulary.
