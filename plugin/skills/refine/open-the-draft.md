# Open the draft

Stage 5 of a refinement: what the refinement wrote into the repository, committed onto the epic's **epic branch**, with
a **draft** change request open from it. It runs for both tracker kinds and on every run, and it is **mechanical**
throughout — every step a git or forge operation, with no wording to choose.

## The paths

Read them off the project's tracker conventions, the same ones the writers published to:

- **Spec and tickets as files in the repository**: the paths are the epic's spec and tickets, plus every glossary and
  ADR file stage 1 landed.
- **Spec and tickets on the forge's issues**: the paths are the glossary and ADR files stage 1 landed, read off the
  brief, which lists by path every one the session landed.
  - **The brief lists none**: there is nothing to commit. Push nothing, open nothing, complete the task as
    `<slug>: open the draft (nothing to commit)`, and go to stage 6.
  - **The brief is gone**: no mechanical step tells this refinement's lines from the human's. Commit nothing, report
    every uncommitted glossary and ADR change in the tree as a **hand-off**, and complete the task the same way.

## The branch

Fetch first. The epic branch is a branch on the remote named from the epic's **slug** in the style of the branches
already there — the rule `implementer` names it by. Where the spec sits decides how you recognise it:

- **Spec in the repository**: the branch that carries the epic's spec at its location. Look under that name first, then
  across the remote's other branches.
- **Spec on the forge's issues**: the branch of that name with an open change request whose description names the
  epic's spec location. A branch of that name with no open change request is the epic's too when an earlier run pushed
  it and stopped short of the draft — the brief is in hand, and every commit it carries beyond the default branch has no
  `Ticket:` line and changes only paths the brief marks as landed. Take it as found, and open its draft at
  § The change request.

Then:

- **The epic branch exists**: switch to it and pull.
- **None exists**: create it from the up-to-date default branch on the remote, under that name.
- **A branch of that name exists that fits neither test** — without the spec, or without that change request or those
  commits: it is someone else's work. Report it and stop.

Switch with `--merge`, so the tree's uncommitted changes come along even where a file differs between the two branches.
Where that merge conflicts, stop and report the conflicting files as a **hand-off**; resolving them is the human's.

## The commit

Add exactly the paths, and name them on the commit itself (`git commit -- <paths>`), so nothing else the index held
rides in. Every other change in the tree stays as you found it, staged or not, and goes into your report. A path that
already carried uncommitted changes of the human's when the run opened goes in whole, since no mechanical step tells
their lines from yours: name it in your report.

The message follows the project's own commit conventions and carries no `Ticket:` line: this is no ticket's work.

## The change request

Push the branch and open its change request as a **draft**, titled with the spec's title. Its description is this text
and nothing else, the two placeholders filled in, passed through a file — on the command line the backticks would run as
a command:

```
The spec for this epic is at `<spec location>`, broken into <ticket count> tickets.

This description is a placeholder: the delivery rewrites it.
```

The placeholder stands because build writes the real description; `pr` is build's to run.

## Resume

The branch, its commits and the forge say how far this stage got:

- **The branch carries every path at its current content**: no commit is owed.
- **A path differs**: a new commit on top, pushed. History only grows — never an amend, never a force-push.
- **A change request is open for the branch**, draft or not: it is the change request. Push to it, its title and
  description left as they stand.
- **None is open** — never opened, or closed or merged since: open a fresh draft as above. One is open at a time.

## Done

The epic branch on the remote carries every one of the paths at its current content and a change request is open from
it — or, where the spec lives on the forge's issues, there were no paths to commit.
