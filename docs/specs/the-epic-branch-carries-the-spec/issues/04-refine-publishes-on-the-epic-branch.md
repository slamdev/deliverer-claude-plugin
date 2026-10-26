# 04 — Refine publishes on the epic branch

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** where a project keeps its spec and tickets as files in the repository, a refinement ends with them
committed to the **epic branch** and the epic's **change request** open as a **draft**, so a human reads the spec where
they will later read the code. Where the tracker is the forge's issues, nothing changes. Settled in `../spec.md` under
Implementation Decisions › Refine's publishing stage; ADR-0015 already allows it.

- [ ] Refine gains an "open the draft" stage between breaking the epic into tickets and handing it over, which runs only
      when the project's conventions put the spec and tickets as files in the repository.
- [ ] The stage creates the epic branch from an up-to-date default branch, named from the slug in the style of the
      branches already there — the same rule `implementer` uses.
- [ ] It commits exactly the paths the run wrote — the epic's spec and tickets, and every glossary and ADR file stage 1
      landed — and nothing else, in a message following the project's conventions with no `Ticket:` line.
- [ ] It pushes the branch and opens the change request as a draft, titled from the spec's title and described with a
      fixed text naming the spec's location, the ticket count, and that the delivery will rewrite it. It does not run
      `pr`.
- [ ] Resume and re-run: a branch already carrying the paths at their current content owes no commit; a difference owes
      a new commit on top, never an amend or force-push; a change request already open for the branch is the change
      request.
- [ ] The task list carries `<slug>: open the draft` when the stage runs, and four tasks as today when it does not; a
      resumed run never creates it `completed`, since the stage runs on every run, and marks it `completed` once the
      stage's bar holds on this one.
- [ ] The report additionally names the epic branch, the change request's URL, and every change left uncommitted in the
      tree; the hand-over call stays `/deliverer:build <epic location>`.
- [ ] The refine happy path runs against a throwaway repo instead of the standing repo, which nothing drives any
      longer and is removed.
- [ ] The assertion that nothing was pushed is replaced by three read off the forge: the default branch did not move;
      exactly one new branch exists, carrying the spec and tickets at the paths the fixture's conventions name; exactly
      one change request is open from it, as a draft. The other refine assertions are kept.
- [ ] Typecheck and lint pass in the end-to-end package. (The run itself is ticket 07's.)

## Comments
