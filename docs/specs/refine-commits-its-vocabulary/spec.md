# A refinement into the forge's issues carries its vocabulary on the epic branch

Status: ready-for-agent

## Problem Statement

Where a project keeps its spec and tickets on the forge's issues, `/deliverer:refine` publishes them there and nothing
else. But its grilling still writes into the repository: the glossary entries and ADRs that domain-modeling lands as
terms and decisions crystallise. Those stay uncommitted in whatever checkout refine ran in, and refine says nothing more
about them. That was deliberate: story 24 of
[the-epic-branch-carries-the-spec](../the-epic-branch-carries-the-spec/spec.md) asked that a forge-issue refinement
"push nothing and open nothing", and its Out of Scope left those files in the working tree.

The owner meets this two ways:

- **Build never commits them unless told to.** The first `implementer` creates the **epic branch**, and its rule for
  uncommitted work outside its ticket is to leave it as found: not adopted, not committed, not discarded. The owner has
  to tell each `/deliverer:build` to commit the vocabulary, even though it belongs to the epic. Until someone does, a
  **round** may read that work in the checkout and review it as the epic's, and the published spec can cite an ADR
  that no branch carries.
- **A gap between refine and build can lose them.** A checkout is not a store. If refine and build run on different
  days, in a different worktree or a fresh clone, the vocabulary the spec was written in is gone, and nothing records
  that it ever existed.

## Solution

Refine's stage 5, **open the draft**, runs for both tracker kinds. On a forge-issue tracker it commits exactly the
glossary and ADR paths stage 1 landed onto the epic branch, pushes it, and opens the same placeholder **draft** change
request a repository tracker gets. When the grilling landed nothing, the stage has nothing to commit and is skipped, so
story 24 still holds for that case.

`/deliverer:build`, handed a forge-issue epic, looks for that branch first and delivers on it. Where refine left none,
it falls back to today's behaviour: the first `implementer` creates the branch.

The end-to-end harness gains a forge-issue **fixture**, so both happy paths can be run by hand against the new
behaviour as well as the existing one.

## User Stories

1. As a project owner whose tracker is the forge's issues, I want the glossary entries and ADRs a refinement's
   grilling landed committed onto the epic branch, so that they are versioned with the epic rather than left in my
   working tree.
2. As that owner, I want refine to push that branch, so that a day's gap, another worktree or a fresh clone between
   refine and build loses nothing.
3. As that owner, I want refine to open the epic's change request as a draft, so that I can read and comment on the
   vocabulary the spec was written in before delivery starts.
4. As that owner, I want build to commit those files without being told, so that I stop repeating that instruction on
   every delivery.
5. As that owner, I want refine to commit only the glossary and ADR paths its grilling wrote, so that unrelated changes
   in my working tree are never swept into the epic.
6. As that owner, I want a glossary or ADR file that already carried my own uncommitted changes named in the report
   when it is committed whole, so that I know my lines rode in with refine's.
7. As that owner, I want every other change in my tree left as I had it and named in the report, so that nothing of mine
   is lost or committed behind my back.
8. As that owner, I want refine to push nothing and open nothing when its grilling landed no glossary entry or ADR, so
   that an epic with no new vocabulary changes my workflow no more than it did before.
9. As a human watching a forge-issue refinement, I want the `<slug>: open the draft` task on the list from the start,
   so that the task list has the same shape for both tracker kinds.
10. As that human, I want that task completed as `<slug>: open the draft (nothing to commit)` when stage 5 is skipped,
    so that the skip is visible rather than looking like a stage that never ran.
11. As that owner, I want the epic branch recognised by its slug's name together with an open change request from it
    that names this epic's spec, so that refine never commits onto someone else's branch that happens to share the
    name.
12. As that owner, I want refine to stop and report a slug-named branch that has no such change request, so that
    someone else's work is never written to.
13. As that owner, I want the branch switch to carry my tree's uncommitted changes across, and a conflict reported as a
    **hand-off** rather than resolved, as it already is for a repository tracker, so that the two tracker kinds fail
    the same way.
14. As that owner, I want the draft titled with the spec's title, so that I can find it beside the spec's issue.
15. As that owner, I want the draft's placeholder to read correctly for an issue URL as well as a path, so that it never
    points me at tickets "beside" an issue.
16. As a delivery resuming on that draft, I want the `This description is a placeholder` line kept word for word, so
    that build's resume still tells refine's draft from the description build writes.
17. As that owner, I want a re-run of refine to add a new commit only where the paths differ from what the branch
    carries, and never a second draft, so that re-running is safe.
18. As that owner, I want a refine that resumes after its brief is gone to report the tree's uncommitted glossary and
    ADR changes as a hand-off rather than commit them, so that nothing guesses which lines were refine's and which were
    mine.
19. As that owner, I want refine's report to name the epic branch and the draft's URL for a forge-issue tracker as it
    does for a repository one, so that I know where the vocabulary went.
20. As that owner, I want build handed a forge-issue epic to find refine's branch and deliver on it, so that the
    vocabulary and the tickets' commits share one branch and one change request.
21. As that owner, I want build to fall back to the first `implementer` creating the branch when refine left none, so
    that an epic refined before this change, or with nothing to commit, still delivers.
22. As a delivery, I want the first `implementer` to merge the up-to-date default branch into refine's branch before its
    first ticket, as it already does for a branch with no `Ticket:` commit, so that a branch cut days earlier is
    current.
23. As a delivery, I want refine's vocabulary commit read as no ticket's work, as it already is for a repository
    tracker's spec commit, so that resume and the assumption mirror pass it over.
24. As a delivery, I want `change-request-creator` to adopt refine's draft and rewrite its description, as it already
    does for a repository tracker, so that one change request carries the whole epic.
25. As a contributor, I want a forge-issue fixture in the end-to-end harness, so that the new path is exercised against
    a real forge rather than only read.
26. As a contributor, I want the refine and build happy paths to run once per fixture, so that both tracker kinds are
    covered by the same assertions without a second copy of either test.
27. As a contributor, I want the forge-issue fixture's brief to have the human insist on a named glossary term, so that
    a run reliably reaches the non-empty path rather than leaving it to the model.
28. As a contributor, I want the forge-issue refine run to assert the vocabulary commit, the draft and a clean tree off
    the forge, so that the outcome rests on facts rather than on a report's wording.
29. As a contributor, I want the forge-issue build run seeded with the issues, the slug branch and the draft refine
    would have left, so that build's new lookup is exercised without paying for a refinement first.
30. As a contributor, I want the in-repository fixture's runs to pass unchanged, so that the existing path is shown not
    to have moved.
31. As a reader of the doc stack, I want this spec to name the reversal of story 24 rather than edit that spec, so that
    each spec stays a record of what its delivery decided.

## Implementation Decisions

### Refine — stage 5, open the draft

- **Runs for both tracker kinds.** Where the project's conventions put the spec and tickets in the repository, the
  stage is unchanged. Where they put them on the forge's issues, it runs when stage 1 landed at least one glossary or
  ADR path, and is skipped otherwise.
- **The paths** for a forge-issue tracker are exactly the glossary and ADR files stage 1 landed. On a resumed run they
  are read from the brief, which already lists by path every glossary entry and ADR the session landed. Where the
  brief is gone, the stage commits nothing and reports the tree's uncommitted glossary and ADR changes as a hand-off.
- **The branch** for a forge-issue tracker has no spec file to identify it by. It is the remote branch named from the
  epic's **slug**, in the style of the branches already there (the rule `implementer` and `change-request-creator`
  already use), and it counts as the epic's only when an open change request from it names this epic's spec location.
  If none exists, it is created from the up-to-date default branch on the remote. If a slug-named branch exists with no
  such change request, the stage stops and reports it. The fetch, the pull and the `--merge` switch, with a conflict
  stopping the stage as a hand-off, are the same as for a repository tracker.
- **The commit**: unchanged rules. The paths are added and named on the commit itself, every other change stays as
  found and goes into the report, a file that carried the human's changes goes in whole and is named, and there is no
  `Ticket:` line.
- **The change request**: unchanged rules: a draft titled with the spec's title, its description passed through a file.
  The placeholder becomes one text for both tracker kinds, dropping "beside it":

  ```
  The spec for this epic is at `<spec location>`, broken into <ticket count> tickets.

  This description is a placeholder: the delivery rewrites it.
  ```

- **Resume**: unchanged rules. A difference owes a new commit on top, never an amend or a force-push, and an open
  change request is the change request.
- **Done** for a forge-issue tracker: the epic branch on the remote carries every landed path at its current content
  and a change request is open from it, or nothing landed.

### Refine — progress, report, hand-over

- **Five tasks for both tracker kinds.** The stage-5 task is created at run open, because whether the grilling will land
  anything is not known yet. When the stage is skipped, it is completed as `<slug>: open the draft (nothing to commit)`.
- **The report** carries stage 5's lines (the epic branch, the draft's URL, what was left uncommitted, what was
  committed whole) whenever stage 5 ran, whatever the tracker.
- The hand-over call is unchanged: `/deliverer:build <epic location>`.

### Build — finding the epic

- **A forge-issue epic** is read on the forge, as today. The orchestrator then looks for refine's branch: the remote
  branch named from the epic's slug with an open change request from it that names the epic's spec location. If it is
  found, its name goes on the first `implementer`'s dispatch, as the **Dispatch** rule already carries a branch found
  at this point. If it is not found, the first `implementer` creates the branch, as today.
- Nothing else in build moves. A branch with no `Ticket:` commit already gets the default branch merged in by the first
  implementer. Refine's commit is already "no ticket's". `change-request-creator` already adopts an open draft and
  rewrites the placeholder.

### Glossary and ADRs

- `GLOSSARY.md`'s **Epic branch** is already widened to "whatever its refinement wrote into the repository (its spec
  and tickets where they live there, and the glossary entries and ADRs its grilling landed)". The skill prose uses it.
- No new ADR: the change is easy to reverse, and unsurprising once written down. ADR-0015 already lets refine publish
  its own documents.
- This spec reverses story 24 and the matching Out of Scope line of
  [the-epic-branch-carries-the-spec](../the-epic-branch-carries-the-spec/spec.md) for the case where the grilling landed
  something. That spec is left as written.

### End-to-end harness

- **A second fixture directory** beside `typescript-library`: the same repository, with a `CLAUDE.md` that names the
  forge's issues as its tracker, a `fixture.json` that declares that tracker kind, and an `epic/` that holds the spec
  and tickets as the issues a delivery is handed. Its brief has the human insist on one named term entering the
  glossary.
- **The tracker conventions become a union of the two kinds**: in-repository (root, spec file, tickets directory) or
  forge issues. The tracker kind branches in one place, the harness's reading and seeding of an epic. For a forge-issue
  fixture, the epic a refinement published is read off the throwaway repo's issues. For a delivery, the harness
  publishes `epic/` as issues and also seeds what refine would have left: the slug-named branch with a glossary commit
  and a draft that names the spec.
- **Matchers** that assume files get a forge-issue counterpart, chosen by the fixture's tracker kind. Those that
  already read the forge are reused.

## Testing Decisions

- **A good test observes what a human could observe**: the forge (issues, branches, commits, change requests), the
  session records and the debrief. No assertion reads an agent's prose for wording.
- **The seam is the two existing happy-path tests**, each run once per fixture. No new test file and no new seam above
  the harness. Prior art: `buildRun(fixtureName)` and `refineRun(fixtureName)` are already parameterised by fixture,
  and `fixture.ts` already promises that adding a fixture is adding a directory.
- **The forge-issue refine run asserts**:
  - the spec and tickets are published as issues carrying the ready-for-agent label;
  - the default branch did not move;
  - exactly one new branch exists, named from the slug, whose commits carry the glossary term the brief insisted on,
    with no `Ticket:` line;
  - exactly one change request is open from it, as a draft, whose description carries the placeholder line;
  - no markdown is left uncommitted in the clone.

  Prior art: `assertDefaultBranchUnmoved`, `assertEpicBranchCarriesEpic`, `assertDraftOpenedFromEpicBranch`, and the
  uncommitted-markdown reading in the refine run.
- **The forge-issue build run** keeps every assertion the in-repository one makes. It also asserts that the change
  request it flips is the seeded draft, not a second one, and that the seeded glossary commit is on the delivered
  branch. Prior art: `assertChangeRequestOpened` and `assertEveryTicketCommitted`.
- **The in-repository fixture's runs pass unchanged**, as the regression check on the existing path.
- **Both happy paths are run by hand on both fixtures** before the change is called done. They take tens of minutes
  and real money each, so they stay out of CI. Typecheck and lint in both packages run as CI runs them.

## Out of Scope

- **Prototype code** a `spec-writer` leaves behind. Where it goes is still the open question the earlier spec deferred.
- **Committing anything else refine leaves in the tree.** Only the glossary and ADR paths stage 1 landed.
- **Opening a draft for a forge-issue refinement that landed nothing.**
- **Changing `implementer`'s rule for uncommitted work outside its ticket.** Once refine commits its vocabulary, nothing
  of refine's is left for that rule to meet.
- **Writing the branch or the draft's URL back onto the spec's issue.**
- **Landing glossary entries and ADRs on the default branch through a change request of their own.**
- **Chaining refine and build in one end-to-end test.**

## Further Notes

- **Claim, unchecked:** that build can derive the epic's slug from a forge-issue epic. `spec-writer` publishes the spec
  "named from the epic's slug", so the slug should be readable off the spec issue's title or labels. The cheapest check
  is to read `spec-writer`'s publish step and one issue the forge-issue fixture's refine run publishes.
- **The harness's forge module has no issue operations today.** Creating, listing and reading issues on the throwaway
  repo (with their label and the blocking edges each ticket declares) is new work in that module. It is not a reuse of
  existing plumbing.
