# 01 — Refine carries its vocabulary on the epic branch

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** where a project keeps its spec and tickets on the forge's issues, a refinement whose grilling landed
glossary entries or ADRs ends with them committed to the **epic branch**, pushed, and the epic's **change request** open
as a **draft**, exactly as a repository tracker's refinement already ends. One that landed nothing pushes nothing and
opens nothing. Settled in `../spec.md` under Implementation Decisions › Refine — stage 5, and Refine — progress, report,
hand-over; this reverses story 24 of `../../the-epic-branch-carries-the-spec/spec.md` for the non-empty case.

- [ ] Stage 5 runs for both tracker kinds: unchanged for a repository tracker; for a forge-issue tracker, run when stage
      1 landed at least one glossary or ADR path and skipped otherwise.
- [ ] For a forge-issue tracker, the paths committed are exactly the glossary and ADR files stage 1 landed, read off the
      brief on a resumed run; where the brief is gone, nothing is committed and the tree's uncommitted glossary and ADR
      changes are reported as a **hand-off**.
- [ ] For a forge-issue tracker, the epic branch is the remote branch named from the epic's **slug** with an open change
      request from it naming the epic's spec location; none such is created from the up-to-date default branch; a
      slug-named branch without such a change request stops the stage and is reported.
- [ ] The fetch, pull, `--merge` switch, conflict-as-hand-off, commit rules (paths named on the commit, other changes
      left and reported, files with the human's changes committed whole and named, no `Ticket:` line) and resume rules
      (new commit on a difference, never amend or force-push, one open change request at a time) apply to both kinds.
- [ ] The draft's placeholder is one text for both kinds — "The spec for this epic is at `<spec location>`, broken into
      <ticket count> tickets." — and the `This description is a placeholder: the delivery rewrites it.` line is kept
      word for word.
- [ ] The task list carries five tasks for both kinds from run open; a skipped stage 5 is completed as
      `<slug>: open the draft (nothing to commit)`.
- [ ] The report carries stage 5's lines whenever it ran, whatever the tracker; the hand-over call is unchanged.
- [ ] Verified by hand: the skill read against an in-repository tracker's conventions and a forge-issue tracker's, with
      and without landed paths, gives the behaviour above. `/mattpocock-skills:writing-for-agents` used for the prose.

## Comments
