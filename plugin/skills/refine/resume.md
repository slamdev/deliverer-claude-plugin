# Resuming a refinement

This idea is part-refined — by an earlier run of yours that was interrupted, or by hand. **The artifacts say how far it
got**, and you start from the earliest stage whose artifact you cannot find:

- the brief, ending on the line `Confirmed by the human.`, says stage 2 ran;
- a published spec says stage 3 ran;
- published tickets say stage 4 ran.

Re-dispatching either writer is safe: each resumes on its own and adds only what is missing.

## Where the artifacts sit

Once stage 5 has run, what it committed may sit on the **epic branch** alone, with the checkout on another branch. So
before judging anything, where the project keeps its spec in the repository:

- **The tree carries the spec**: judge from it.
- **The tree carries none**: find the epic branch as `open-the-draft.md` § The branch does. Where it carries the spec,
  switch to it with `--merge` and judge from there — the writers resume off what it carries.

## Stage 1 leaves only the brief

A conversation leaves nothing behind but the brief, so:

- **No brief**: the grilling is owed again, from the start.
- **A brief without its closing line**: stage 1 was cut short. Pick the grilling up from the brief, its settled
  decisions standing, and run stage 1 to its done bar. Two parts of that bar are always still owed, since nothing on
  disk says they happened: the sweep over the brief, and the human's confirmation.

## Stage 5 runs every time

An open change request says nothing about whether stage 5 is done — what it committed may have changed since it opened.
Stage 5 runs on every run and reads its own progress off the branch and the forge (`open-the-draft.md` § Resume).

## The pull question

On a run that skips stage 1 there is no first question round, so the pull question, where the checkout is behind, is
asked before the next dispatch.

## Tasks

Open the same five tasks as any run, creating `completed` the ones for stages whose artifacts you found — stage 5's
excepted: it is created pending and marked `completed` once its bar holds on this run.
