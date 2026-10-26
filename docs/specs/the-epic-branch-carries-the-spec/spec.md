# The epic branch carries the spec, and a delivery is read against it

Status: ready-for-agent

## Problem Statement

Three things a plugin owner meets, each on its own.

**Every judgement agent runs at the deepest tier it can.** Five of the seven shipped agents — `implementer`,
`comments-addresser`, `tickets-writer`, `assumption-reviewer` and `spec-writer` — run on opus at effort `high`. So does
the delegated review behind every **round**, by default, and the observer's synthesis of a **debrief**. A **run** costs
what those tiers cost, and nothing about the work they do has been shown to need them. `change-request-creator`, the one
opus agent already at `medium`, is the only one priced as if it had been asked.

**A refinement leaves its work lying in the working tree.** Where a project keeps its spec and tickets as files in the
repository, `/deliverer:refine` writes them — and the glossary entries and ADRs its grilling landed — into whatever
checkout it ran in, and stops. Nothing commits them, nothing puts them where a human reviews things, and the next
`/deliverer:build` creates its **epic branch** from the default branch, where none of them is. A human who wants to read
the spec before delivery starts has a diff on their own disk and no **change request** to read it in or comment on.

**The plugin forked mattpocock-skills at v1.0 and the dependency is at v1.3.1.** The rename and `pr` were adopted in the
last migration; three changes between the versions that bear on the forked skills were not:

- `tdd` and `implement` carry a testing discipline — test at agreed seams, never tautologically, no refactoring inside
  the loop, in the glossary's vocabulary — and `implementer` says nothing about tests at all.
- Upstream found that naming a skill in prose does not reliably load it, and rewrote every such step as an explicit call
  to the Skill tool, one call per skill. Refine's stage 1 names two skills in one prose sentence, and
  `change-request-creator` names `pr` in prose.
- Upstream's `code-review` reads a diff against its spec — what the spec asked for and is missing, what the diff does
  that nothing asked for, and what looks implemented but wrong. Nothing in a delivery does that: `tickets-writer` says
  outright that nothing downstream measures the set against the user stories, and a round is the host's correctness
  review, which never sees the spec.

## Solution

**Opus runs at `medium` everywhere the plugin chooses its tier.** The five agents' frontmatter, the default of the
`code_review_effort` option, and the synthesis's fixed tier all move from `high` to `medium`. An owner who wants a
deeper review still sets the option. `spec-writer` is priced on the bench before the change lands, and keeps `high` only
if its figures show a clear regression — a call brought back to the human, not taken by the implementer.

**A refinement into an in-repository tracker publishes on the epic branch.** When the project's conventions put specs
and tickets as files in the repository, refine gains a stage after the tickets are written: it creates the epic branch
from an up-to-date default branch, named from the slug, commits exactly the paths the run wrote, pushes it, and opens
the epic's change request as a **draft** under a fixed description. The epic branch is now where the epic is carried
from the first commit — its spec and tickets, then every ticket's commits — so a human reviews the spec where they will
later review the code, and `/deliverer:build` picks the same branch up. Where the conventions put specs on the forge's
issues, nothing changes. ADR-0015 already carries the widening this needs.

**A delivery gets a spec review.** A new agent, `spec-reviewer`, reads the epic's change request against its spec and
tickets once — after the assumptions are adjudicated, before the first round — and posts every **spec finding** as a
comment the first **fix wave** works like any other. It is no round: the bar a change request is **flipped ready**
against is unchanged.

**The implementer tests the way the spec agreed, and two skill steps name the tool.** `implementer` gains the testing
discipline; refine's stage 1 and `change-request-creator` each call the Skill tool explicitly, once per skill.

## User Stories

### Effort

1. As a plugin owner, I want every shipped opus agent to run at effort `medium`, so that a run costs less without my
   configuring anything.
2. As a plugin owner, I want the delegated review to default to `medium`, so that a round costs less and raises fewer
   comments for a fix wave to resolve.
3. As a plugin owner, I want to still set `code_review_effort` to any of the five tiers, so that I can buy a deeper
   review when an epic warrants it.
4. As a plugin owner, I want the observer's synthesis at `medium`, so that observing a run costs less too.
5. As a plugin owner, I want the option's description to name `medium` as its default, so that what I read in the
   settings is what runs.
6. As a contributor, I want `spec-writer` benched at `medium` against `high` before the change lands, so that the
   saving is a measured figure rather than a hope.
7. As a contributor, I want `spec-writer` kept at `high` if its arm regresses clearly, with that call brought to me, so
   that a cost cut never silently degrades the spec every later stage rests on.
8. As a contributor, I want the bench's fallback tier to match what the shipped agents declare, so that an arm driving
   an agent without an `effort` key measures what a dispatch of it would get.

### Refine publishes on the epic branch

9. As a project owner whose tracker is markdown in the repository, I want refine to commit the spec and tickets to the
   epic branch, so that they are versioned rather than left in my working tree.
10. As that owner, I want refine to open the epic's change request as a draft, so that I can read the spec and tickets
    in the place I review everything else.
11. As that owner, I want the glossary entries and ADRs the grilling landed in the same commit, so that the vocabulary
    the spec uses travels with it.
12. As that owner, I want refine to commit only the paths it wrote, so that unrelated changes sitting in my working
    tree are never swept into the epic.
13. As that owner, I want refine's report to name any unrelated change it left in the tree, so that I know it is still
    there and why it was not committed.
14. As that owner, I want the epic branch created from an up-to-date default branch, so that the epic does not start
    from a stale or unrelated checkout.
15. As that owner, I want the epic branch named from the epic's slug in the style of the branches already there, so
    that build, a human and the forge all find it by the same name.
16. As that owner, I want the draft's description to be a fixed text naming the spec's location and the ticket count,
    so that the orchestrator forms no judgement about what to say.
17. As that owner, I want the draft's title taken from the spec's title, so that the change request reads as the epic.
18. As that owner, I want the draft's description to say build will rewrite it, so that nobody mistakes the placeholder
    for the final account.
19. As that owner, I want refine's report to carry the change request's URL, so that I go straight to it.
20. As that owner, I want refine's hand-over call unchanged — `/deliverer:build <epic location>` — so that I deliver an
    epic the way I always have.
21. As that owner, I want a re-run of refine on an epic whose draft is open to add a new commit and push it, so that an
    updated spec reaches the same change request without rewriting its history.
22. As that owner, I want a re-run never to open a second change request for the same branch, so that the epic has one
    place a human reads it.
23. As that owner, I want an interrupted refine to resume its publishing stage from what the branch and forge carry, so
    that a re-run neither loses work nor duplicates the commit.
24. As a project owner whose tracker is the forge's issues, I want refine to push nothing and open nothing, so that my
    workflow is untouched.
25. As a human watching a refinement, I want the publishing stage as its own task, `<slug>: open the draft`, so that the
    task list shows the step.
26. As a human watching a refinement into a forge tracker, I want four tasks as today, so that a stage that never runs
    shows nowhere.
27. As a reviewer of the spec, I want to comment on the draft before build runs, so that my objections are on record
    where the delivery will see them.

### Build adopts the epic branch

28. As a project owner, I want build to find an epic the default branch does not carry on the branch named from its
    slug, so that a refinement's draft is delivered without my checking anything out.
29. As a project owner, I want build to still deliver an epic the default branch does carry, so that an epic refined
    before this change, or written by hand, delivers as before.
30. As a project owner, I want the first implementer to adopt an existing epic branch rather than create one, so that
    the tickets' commits land on top of the spec.
31. As a project owner, I want build to dispatch `change-request-creator` at stage 2 every run, so that a change request
    refine opened still gets its assumptions mirrored.
32. As a project owner, I want stage 2 to leave the draft refine opened as the change request and rewrite its
    description with `pr`, so that the placeholder is replaced by a real account.
33. As a reviewer of the spec, I want the comments I left on the draft worked by the first fix wave, so that they are
    answered like any other comment.
34. As a project owner, I want the spec and tickets in the diff every round reads, so that the reviewer can see what the
    code set out to do.
35. As a project owner, I want a resumed build to read the epic branch the way it does today, so that a commit carrying
    no `Ticket:` line — refine's among them — is never taken for a ticket begun.

### Spec review

36. As a project owner, I want each delivery's change request read against its spec and tickets, so that a requirement
    the code silently dropped is caught before a human reviews.
37. As a project owner, I want a spec review to report requirements missing or partial, so that the gap between asked
    and delivered is named.
38. As a project owner, I want it to report behaviour nothing asked for, so that scope creep is visible.
39. As a project owner, I want it to report requirements that look implemented but wrong, so that a plausible-looking
    implementation is not taken on trust.
40. As a project owner, I want every spec finding to quote the spec or ticket line it rests on, so that the fix wave and
    I can check it in one look.
41. As a project owner, I want spec findings posted as comments marked `SPEC`, so that they survive an interrupted run
    and I can tell them from review findings and assumption comments.
42. As a project owner, I want the spec review to run after the assumptions are adjudicated and before the first round,
    so that the first fix wave addresses its findings and the second round reviews those fixes.
43. As a project owner, I want the spec review to run once per delivery, so that it costs one dispatch.
44. As a project owner, I want the first fix wave to work spec findings as it works review findings — implement by
    default, decline only with grounds — so that nothing new governs them.
45. As a project owner, I want a resumed build always to re-dispatch the spec review, with it posting only findings no
    `SPEC` comment already carries, so that a resume neither skips nor duplicates it.
46. As a project owner, I want the spec review counted toward nothing the flip waits on, so that the bar stays two
    completed rounds and green checks.
47. As a project owner, I want a spec review that never reports to ride into build's report as a hand-off, so that I
    know the change request went unread against its spec.
48. As a project owner, I want the spec review to work whether the spec lives in the repository or on the forge's
    issues, so that every tracker gets it.
49. As a project owner, I want build's report to carry how many spec findings were posted, so that I know what to read.
50. As a project owner, I want `spec-reviewer` on opus at `medium`, so that it is priced like the other judgement
    agents.
51. As a project owner, I want `spec-reviewer` to dispatch no agent and write nothing to the task list, so that it obeys
    the same contract as every shipped agent.
52. As a project owner, I want `spec-reviewer` to change no code, so that the fix wave remains the one place code moves
    after implementation.

### The implementer's tests

53. As a project owner, I want the implementer to write tests at the seams the spec's testing decisions name, so that
    tests sit where the epic agreed they would.
54. As a project owner, I want the implementer to write no test at a seam nobody agreed, so that tests do not pin
    internals the spec left free.
55. As a project owner, I want every expected value to come from an independent source — a known-good literal, a worked
    example, the spec — so that no test passes by recomputing what the code does.
56. As a project owner, I want the implementer not to refactor inside a ticket, so that refactoring stays with the
    rounds and fix waves and a ticket's diff stays its own.
57. As a project owner, I want the implementer to read the glossary before naming tests and interfaces, so that they
    speak the project's language.

### Skill invocation

58. As a user of refine, I want stage 1 to call the Skill tool twice, once for `grilling` and once for
    `domain-modeling`, so that both load reliably.
59. As a user of build, I want `change-request-creator` to call the Skill tool for `pr`, so that the description
    template loads reliably.

### Verification

60. As a contributor, I want the refine happy path to run against a throwaway repo, so that the branch and change
    request it now pushes never reach another run.
61. As a contributor, I want the refine happy path to assert the default branch untouched, one epic branch carrying the
    epic, and one draft change request under the fixed description, so that the new stage is checked on the forge.
62. As a contributor, I want the build happy path to count the spec review among its dispatches, so that a delivery
    that skipped it fails.
63. As a contributor, I want the installation smoke test to expect eight agents, so that a missing `spec-reviewer`
    fails installation.
64. As a contributor, I want the review lifecycle exercised against the scripted backend under the new default tier, so
    that the change to the server's configuration is checked without money.

## Implementation Decisions

### Effort

- The five agents' `effort` frontmatter moves from `high` to `medium`. `code-reviewer` stays sonnet at `low`;
  `change-request-creator` is already `medium`.
- The `code_review_effort` user option's default moves to `medium`. The accepted tiers, the refusal of anything outside
  them, and the option's being startup configuration rather than a caller input are unchanged. The option's description
  names the new default wherever it names one.
- The synthesis's fixed tier moves to `medium`. It stays its own fixed constant and does not start reading the review's
  option — the comment that says why is kept.
- The writer bench's fallback for an agent file without an `effort` key moves to `medium`, and its comment's count of
  shipped agents moves to eight.
- Order: the `spec-writer` arm at `medium` is run against the existing `high` figures before the effort change is
  committed. A clear regression keeps `spec-writer` at `high` and is reported to the human for the call.

### Refine's publishing stage

- **When it runs**: only where the project's conventions put the spec and tickets as files inside the repository —
  read from the same conventions the writers publish to. Otherwise the stage does not exist for the run, and neither
  does its task.
- **Stage order**: grill, write the brief, write the spec, break it into tickets, **open the draft**, hand the epic
  over. The task list carries one task per stage that runs: five for an in-repository tracker, four otherwise.
- **The branch**: the branch on the remote carrying the epic's spec, looked for under the slug's name first and then
  across the rest; where none carries it, a new one from the up-to-date default branch on the remote, named from the
  slug in the style of the branches already there — the same rule `implementer` uses today, so build and refine name
  it the same way. A branch of that name already on the remote without the spec is someone else's, and the stage stops
  rather than committing on it. The switch is `--merge`, so the working tree's uncommitted changes ride across it even
  where a file differs between the two; a conflict stops the stage as a hand-off.
- **The commit**: exactly the paths the run wrote — the epic's directory (spec and tickets), and every glossary and ADR
  file stage 1 landed — named on the commit itself, so nothing else the index held rides in. Every other change in the
  tree is left as found and named in the report, and so is any of those files that already carried the human's own
  changes, which goes in whole. The commit message follows the project's own conventions and carries no `Ticket:`
  line: it is not a ticket's work.
- **The change request**: opened as a draft. Title from the spec's title. Description is a fixed text, passed through
  a file: the spec's location, the ticket count, and a line saying the delivery will rewrite it. Refine does not run
  `pr`.
- **Resume and re-run**: the branch, its commits and the forge say how far the stage got. A branch already carrying
  refine's paths at their current content owes no commit; a difference owes a new commit on top, never an amend or a
  force-push. A change request already open for the branch is the change request, draft or not; where none is open —
  never opened, or closed or merged since — a fresh draft is opened, so there is one open at a time and never two.
- **Resume off the branch**: once the stage has run, the spec and tickets may sit on the epic branch alone. Where the
  checkout carries no spec, refine finds the epic branch the same way and switches to it before judging how far the
  writers got.
- **The report** additionally names the epic branch, the change request's URL, and every change left uncommitted.
- **Mechanical, not judgement**: every step is a git or forge operation with no choice of wording in it, which is what
  ADR-0015 now allows the orchestrator. No new agent is introduced for it.

### Build

- **Finding the epic**: an epic on the forge's issues is read there, as today. One in the repository is read off the
  default branch where it carries the epic location; where it does not, build fetches and reads the epic off the
  branch on the remote that carries it, looking under the slug's name first. Where none carries it, build reports that
  and stops.
- **The first implementer** is handed the epic branch's name whenever build found one, and adopts it — switching to it
  and pulling — rather than creating a branch. Where no ticket's work is on it yet, it merges the up-to-date default
  branch in, so a delivery starts from the default branch as it is now rather than as it was at refinement. The rule
  for creating one, when none exists, is unchanged.
- **Stage 2 always runs**: an open change request is no longer evidence that stage 2 ran, so a resumed build always
  dispatches `change-request-creator`. Its existing resume rules already make that safe: an open change request is
  brought up to date rather than duplicated, and assumptions mirrored only where no assumption comment carries them.
  It puts the change request back to draft where someone took it out, since a draft is what a change request stays
  while a round is owed.
- **Stage 1 on resume**: a change request whose description is no longer refine's placeholder was written by stage 2,
  so stage 1 is over and no implementer is dispatched again.
- **New stage, after the adjudication and before the first round**: dispatch `spec-reviewer` with the epic and the
  change request's URL. Its report names the spec findings it posted. The first fix wave picks them up as unresolved
  comments; the dispatch to it changes in nothing else.
- **Resume**: build cannot tell from the comments whether a spec review finished — that reading is a judgement — so a
  resumed run dispatches `spec-reviewer` again, as it already does `assumption-reviewer`.
- **Flip**: unchanged. A spec review that never reported, or reported a document it could not read, is a hand-off in
  the report, not a reason to stay a draft.
- **Report**: carries the count of spec findings posted, and a hand-off where the spec review never reported.

### `spec-reviewer`

- A new shipped agent, opus at `medium`, with the same disallowed tools and the same first-person preamble as the
  others: it dispatches nothing, writes nothing to the task list, and changes no code.
- **Input**: the epic (its location, from which it reads the spec and every ticket, in the repository or on the forge)
  and the change request's URL. It switches to the epic branch and reads the diff first-hand, against the remote's
  copy of the base. Refine's commit and the fix waves' commits are not held against the spec's scope.
- **What it reports**, in upstream's three kinds: requirements the spec or a ticket asked for that are missing or
  partial; behaviour the diff carries that nothing asked for; requirements that look implemented but wrong. Each
  quotes the spec or ticket line it rests on.
- **How**: each finding is posted as one resolvable comment on the change request whose body begins `SPEC`, anchored
  to the file and line it is about where the forge allows, and at the change request otherwise. The forge-neutral
  channel handling `change-request-creator` and `comments-addresser` already describe is the prior art.
- **Resume**: a finding a `SPEC` comment already carries is posted again by nobody; the agent posts only the rest.
- **Not a round**: it opens no review through the tools server and goes through no review lifecycle.
- **Credits**: upstream's `code-review` skill, as the other forked agents credit theirs.

### `implementer`

- Gains a testing discipline in its implementing step: tests at the seams the spec's testing decisions name and no
  other; expected values from an independent source — a known-good literal, a worked example, the spec — and never
  recomputed the way the code computes them; no refactoring beyond what the ticket asks, which belongs to the fix
  waves; the project's glossary read before tests and interfaces are named.
- Gains the adoption rule above for an existing epic branch.
- Credits upstream's `implement` and `tdd`.

### Skill invocation

- Refine's stage 1 says to call the Skill tool twice — once with `grilling`, once with `domain-modeling` — rather than
  naming both in one sentence. Its stop-and-report when either is missing is unchanged.
- `change-request-creator` says to call the Skill tool with `pr`. Its check that the skill is installed before step 1
  is unchanged.

### Glossary and ADRs

- `GLOSSARY.md` already carries the widened **Epic branch**, and **Spec review** and **Spec finding**; the agent and
  skill prose uses them.
- ADR-0015 already carries the widening that lets refine publish its own documents. No new ADR: a spec review that is
  no round is easy to reverse.

## Testing Decisions

- **A good test observes what a human could observe**: the forge (branches, commits, change requests, comments), the
  session surface, and the session records. No assertion reads an agent's prose for wording.
- **The refine happy path moves to a throwaway repo** — the fixture's repository, created per test and destroyed once
  it passes, left standing when it fails. The standing repo stays the bench's, cloned from only. The assertion that
  nothing was pushed is replaced by three facts read off the forge: the default branch did not move; exactly one new
  branch exists, carrying the epic's spec and tickets at the paths the fixture's conventions name; and exactly one
  change request is open from it, as a draft. The existing assertions on the published epic, spec, tickets, session
  records and debrief are kept. Prior art: the build happy path's throwaway repo and its change-request matchers.
- **The build happy path's dispatch floor rises by one** and its description of what a delivery dispatches names the
  spec reviewer. Its fixture's epic sits on the default branch, so the run also stands as the check that an epic the
  default branch carries delivers as before. No assertion on spec findings: a clean delivery may have none.
- **The installation smoke test expects eight shipped agents.** Prior art: its existing count and presence checks.
- **The bench drives one `spec-writer` arm at `medium`** against the existing `high` figures, read with the caveats the
  contribution guide gives for an arm's figures.
- **The review lifecycle is exercised against the scripted backend** with the option unset, so the default tier is
  the one that reaches the backend.
- **Typecheck and lint in both packages**, as CI runs them.
- **The new refine stage's resume and the forge-tracker branch are verified by hand**: once by re-running refine on the
  throwaway repo the happy path left (one new commit, no second change request), and once by reading that the stage
  never runs against a fixture whose conventions name the forge's issues.

## Out of Scope

- **Changing what a round reviews.** The spec review is a separate agent precisely so the review prompt, the tools
  server's inputs and ADRs 0004 and 0005 stay as they are.
- **Gating the flip on the spec review.** It counts toward nothing the flip waits on.
- **Running the spec review more than once per delivery.**
- **Refine running `pr`** for its draft's description; build's stage 2 writes the real one.
- **Refine opening a change request for a forge-issue tracker**, even when its grilling landed glossary entries or
  ADRs: those stay in the working tree as today.
- **Holding build while the draft carries unresolved human comments.** They go to the first fix wave.
- **Keeping the spec and tickets out of a round's diff.**
- **Where a prototype's code goes** when the brief sends `spec-writer` to build one. Upstream's throwaway-branch rule
  was considered and not taken up.
- **Upstream's parallel pickup and `implement-spec`**, already out of scope in the last migration for the reasons it
  gives.
- **Any change to `code-reviewer`'s own tier**, which is sonnet at `low` and not opus.

## Further Notes

### The spec review is the one place a delivery reads its spec

Before this change, the spec reached a delivery only through the tickets an implementer read, and only the user stories
a ticket happened to cover. `tickets-writer` says so. The spec review is the first reading of the change request as a
whole against the document behind it, and its findings land before the first round so that the first fix wave works
them and the second round reviews the fixes they cause.

### Refine's commit is not a ticket's, and build already reads it that way

Build's resume counts only commits carrying a `Ticket:` line as tickets begun, and `change-request-creator` mirrors only
those commits' assumptions. Refine's commit carries neither a `Ticket:` line nor an `Assumptions:` section, so both
already pass it over. Its `Gates:` reading finds nothing on it either.

### The bench's fallback is a statement about the shipped agents

The bench falls back to the tier the shipped agents declare when an arm's file declares none. Leaving it at `high` after
the agents move would have an arm measure a tier no dispatch of that agent would get.
