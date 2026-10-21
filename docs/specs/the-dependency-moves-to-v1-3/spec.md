# The plugin and this repository move to mattpocock-skills v1.3

Status: ready-for-agent

## Problem Statement

`mattpocock-skills` released v1.3.0 and v1.3.1 on the same day. It is a dependency twice over: contributors to this
repository work with its skills, and the plugin declares it in its marketplace entry, unversioned, so every user gets
whatever is current on their next plugin update.

**The glossary was renamed, and nothing falls back.** Every skill that reads or writes the domain glossary now looks for
`GLOSSARY.md` (and `GLOSSARY-MAP.md`) and only for those: `domain-modeling`, `grill-with-docs`, `tdd`, `triage`,
`diagnosing-bugs`, `improve-codebase-architecture`, `wait-what`, `pr` and `setup-matt-pocock-skills`. A repository
whose glossary is `CONTEXT.md` is not read at all, and the first term a grilling resolves lands in a second glossary
created beside the first.

- **This repository** keeps its glossary in `CONTEXT.md`. The project instructions, the contribution guide, the domain
  conventions file the skills are pointed at, and comments in the plugin's Node code all name it.
- **A user's repository** meets the same rename through `/deliverer:refine`, whose stage 1 runs `grilling` with
  `domain-modeling` alongside. A user whose repository was set up before v1.3 has a `CONTEXT.md` that the refinement now
  writes past. The shipped agents say "the glossary" and never a filename, so they follow whatever file the project has
  — but nothing tells the user that the file changed.
- **The end-to-end fixture** for the third stage stages a clone carrying `CONTEXT.md`.

**A change request's description has no shape.** `change-request-creator` titles and describes the change request from
the epic and the branch's commits, and says nothing more about what the description is for. It is written once, at
stage 2, before either **round** and either **fix wave** — so by the time a human reads a change request **flipped
ready**, or one left a **draft** with a **hand-off**, its description accounts for the tickets' work and none of what
the delivery did to it afterwards. v1.3 ships `pr`, a model-invoked skill that defines a description as a Summary (the
smallest visual that makes the change clear), Evidence (a before and an after) and a Merge Danger (one-way or two-way
door, and a blast radius).

**Nothing checks that the skills the plugin invokes by name still exist.** The dependency floats, and the installation
smoke test asserts only that the plugin was brought in — not that it still provides the skills refinement stops
without.

## Solution

**This repository renames its glossary.** `CONTEXT.md` becomes `GLOSSARY.md` by a move, so its history follows it, and
every live document that points at it points at the new name. Past specs stay as written: they are accounts of past
changes rather than standing contracts.

**The README tells a user how to follow.** A migration note says that a repository with a `CONTEXT.md` should move it to
`GLOSSARY.md`, and the troubleshooting entry for a missing skill covers a delivery that stops at its change request
stage as well as a refinement that stops at its grilling.

**`change-request-creator` describes the change request with `pr`.** It invokes the skill and writes the description
the skill produces, and the skill is the whole of the guidance: where its Evidence comes from is the skill's to say.
When the skill is not installed, the agent reports that and stops, the way refinement does when its interview's skills
are missing.

**The delivery refreshes the description before it ends.** A new stage, between the second fix wave and the last stage,
dispatches `change-request-creator` once more, so the description a human reads accounts for the whole delivery. It
runs whether the change request is then flipped ready or left a draft.

**The smoke test asserts the skills the plugin invokes by name.** `grilling`, `domain-modeling` and `pr` must be on the
installed session's surface, so an upstream rename or removal surfaces in seconds on a contributor's machine rather
than in a user's run.

## User Stories

1. As a contributor, I want this repository's glossary to be the file the skills read, so that a grilling here sharpens
   the existing glossary instead of starting a second one.
2. As a contributor, I want the glossary's history to follow it to its new name, so that `git log` on the glossary still
   tells me where each term came from.
3. As a contributor, I want the project instructions to name the glossary by its new name, so that the doc-stack rule
   they state — the glossary at the bottom, citing nothing — still names a file that exists.
4. As a contributor, I want the contribution guide to name the glossary by its new name, so that the flow it walks me
   through matches what the skills do.
5. As a contributor, I want the domain conventions file to name `GLOSSARY.md`, so that a skill told to look there finds
   the glossary on the first read.
6. As a contributor, I want the comments in the plugin's Node code that cite the glossary to cite it by its new name, so
   that following a citation lands on a file.
7. As a contributor, I want any ADR that names the glossary file to name the new one, so that the ADRs stay true without
   my knowing about the rename.
8. As a contributor, I want past specs left as they were written, so that an account of a past change is not rewritten
   to describe a repository that did not exist when it was made.
9. As a contributor, I want the contribution guide's project tree to say the dependency is declared in the marketplace
   entry, so that I look for it in the file that holds it.
10. As a contributor, I want my own install of `mattpocock-skills` at v1.3.1, so that the skills I contribute with are
    the ones a user's install brings in.
11. As a contributor, I want the end-to-end fixture's clone to carry `GLOSSARY.md`, so that a stage-3 run stages the
    repository shape the skills now expect.
12. As a user upgrading the plugin, I want the README to tell me to move `CONTEXT.md` to `GLOSSARY.md`, so that my next
    refinement grows my glossary instead of starting a new one beside it.
13. As a user whose delivery stopped at its change request stage, I want the README's troubleshooting to name a missing
    skill as the cause and say how to check, so that I fix my install rather than my repository.
14. As a user, I want the dependency to keep floating, so that improvements upstream reach me without waiting on a
    release of this plugin.
15. As a human reviewing a delivered change request, I want a Summary that shows the change in the smallest visual that
    makes it clear, so that I understand its shape before I read the diff.
16. As a human reviewing a delivered change request, I want Evidence that the change works, with a before and an after,
    so that I can see what the delivery proved rather than taking it on trust.
17. As a human reviewing a delivered change request, I want a Merge Danger naming whether it is a one-way or a two-way
    door and its blast radius, so that I know how carefully to merge it.
18. As a human reviewing a delivered change request, I want the description written in my project's domain language, so
    that it reads in the terms my glossary defines.
19. As a human reviewing a change request flipped ready, I want its description to account for both fix waves, so that
    what I read is what I am being asked to merge.
20. As a human handed a change request left a draft, I want its description refreshed all the same, so that the Merge
    Danger and the Evidence are current when the delivery fell short and I have the most to judge.
21. As a human running a delivery on a stale `mattpocock-skills`, I want the change request stage to stop and report the
    missing skill, so that I am not handed a change request described in a shape I did not ask for.
22. As a human running a delivery, I want the refresh dispatched as its own stage, waited on like every other, so that a
    run still dispatches one agent at a time.
23. As a human resuming an interrupted delivery, I want the refresh to be safe to run again, so that a run that dies
    after it neither duplicates an assumption comment nor opens a second change request.
24. As a human running a delivery, I want the refresh to leave the assumption comments as the first dispatch left them,
    so that a fix wave's silently closed forks are still not mirrored as forks nothing will adjudicate.
25. As a contributor, I want the installation smoke test to fail when the installed dependency no longer provides
    `grilling`, `domain-modeling` or `pr`, so that an upstream rename reaches me before it reaches a user.
26. As a contributor, I want that failure to name the missing skill and list what the dependency does provide, so that I
    can tell a rename from a removal without rerunning anything.
27. As a contributor, I want the change verified by one hand-run delivery whose change request I read, so that the new
    description and its refresh are seen working before the change ships.

## Implementation Decisions

- **The glossary moves, it is not copied.** One move of the file, then an edit of every live pointer to it: the project
  instructions (including the doc-stack paragraph naming it as the bottom of the stack), the contribution guide, the
  domain conventions file under the agents docs, the plugin's Node code comments, any ADR that names it, and the
  stage-3 fixture's clone. Specs under the specs directory are not edited.
- **The domain conventions file keeps redirecting ADRs.** Upstream still writes ADRs to a singular `adr` directory; this
  repository's plural one stays, and the conventions file goes on saying so. Only the glossary's name changes in it.
- **No version is pinned on the dependency.** Each upstream release gets an impact check like the one behind this spec.
- **`change-request-creator` invokes `mattpocock-skills:pr`.** It is the second skill of the dependency the plugin
  invokes by name, after the pair refinement's stage 1 runs. The agent adds no guidance of its own on top: no source it
  must read Evidence from, and no line linking the epic — the template is the skill's.
- **A missing `pr` stops the agent.** It reports the skill as missing and opens or edits nothing, as refinement does for
  its interview. The **orchestrator** treats that report as a stage that cannot be completed, and reports it as a
  **hand-off**; nothing else in the delivery runs.
- **The refresh is a new stage of the delivery skill**, between the second fix wave and the last stage, and it runs on
  every path that reaches the last stage — whether the change request is flipped ready or left a draft. It is a
  **dispatch** of `change-request-creator` under the **Sequencing** rule like any other: cold, unless the stage-2 agent
  is still addressable. The agent's existing contract already covers it: an open change request has its title and
  description brought up to date rather than a second one opened, its draft state is left as it was found, the
  assumption comments already posted are not posted again, and a fix wave's commits are passed over by the mirror.
- **The stages after the refresh renumber**, and every cross-reference inside the delivery skill that names a stage by
  number moves with them, as `one-dispatch-at-a-time` did for its two new stages.
- **The smoke test's dependency check grows by the skills invoked by name.** The plugin's dependency must be loaded, as
  today, and the session must also carry `grilling`, `domain-modeling` and `pr` under the dependency's namespace. The
  list is fixed in the test, beside the dependency's name, so adding an invocation in shipped prose is an edit someone
  makes there on purpose.

## Testing Decisions

- **A good test observes what a human could observe.** The harness's one seam is the session surface: what an installed
  session loaded. The new assertion reads from that surface and from nothing inside the dependency's own files, so it
  holds for as long as the skills are invocable by those names, whatever upstream does to their text.
- **The installation smoke test carries the new assertion.** Prior art is its existing check that the dependency was
  brought in, and its checks that every command and agent is present, each failing with what was expected and what the
  session loaded instead. If the session surface does not yet list the skills a plugin provides, it gains them from the
  session's own initialisation — the seam grows, and no new seam is added.
- **The description and its refresh are verified by hand, once.** Run the build happy path by hand — tens of minutes and
  about $20 — and read the change request it leaves: a description in the `pr` template, and one written after the
  second fix wave rather than at stage 2. No assertion on the description is added, since its headings are upstream's
  and the dependency floats.
- **Typecheck and lint in both packages**, as CI runs them.
- **The rename is checked by a search.** No live document names `CONTEXT.md` after it; the specs directory is the
  expected exception.

## Out of Scope

- **Parallelising stage 1 across worktrees.** v1.3's `implement-spec` builds a spec's tickets as a task graph, many
  implementers at once each in its own worktree. It is the largest speed lever on a delivery, and it reverses D3 of
  `one-dispatch-at-a-time`, which rejected concurrent dispatches because a dispatch run in the background has been
  observed never to report. `build-run-defects` already said it needs its own grilling and its own spec; it gets them,
  as a separate epic, starting from that objection. When it does, upstream's "frontier" of ready tickets is a different
  thing from this glossary's **Frontier**, and its "integration branch" is this glossary's **epic branch**.
- **`retro`.** Suggesting environment changes from a run's debrief was considered and not taken up.
- **Migrating a user's glossary for them.** The plugin does not detect or move a `CONTEXT.md`; the README note is the
  whole of it.
- **`resolving-merge-conflicts`**, removed upstream. Nothing in this repository or the plugin uses it.

## Further Notes

### The installed version is not the one its directory names

The contributor install this impact was measured on sits in a cache directory labelled 1.2.3, but it is a checkout of
upstream's default branch from 2026-08-24 that already carries most of v1.3.0 as pending changes. The figures above are
from diffing both the v1.2.3 tag and that checkout against v1.3.1; the second diff is what a contributor's update
actually changes.

### Skills hidden from the listing still exist

`grill-with-docs`, `to-spec`, `to-tickets`, `implement` and `setup-matt-pocock-skills` are absent from a session's
model-visible skill listing because they are invocable by the human only. They exist in v1.3.1 under the same names,
and the contribution flow that names them is unchanged.

### Invoking `pr` couples the description to a floating dependency, deliberately

Adapting the template into the agent's own prose, credited the way `spec-writer` credits `to-spec`, was the alternative.
Invoking was chosen so the description improves as upstream does; the price is that an upstream edit changes delivered
change requests without a change here, and the smoke test guards only that the skill exists.
