# 01 — Refine carries its vocabulary on the epic branch

Status: resolved

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

**Implementer, by-hand verification.** `plugin/skills/refine/SKILL.md` read against the four cases:

- *Repository tracker, glossary or ADR landed*: the paths are the spec, the tickets and the landed files; the branch is
  found by the spec it carries; commit, push, draft. Unchanged but for the placeholder, which drops "beside it".
- *Repository tracker, nothing landed*: the spec and tickets are still paths, so the stage runs as before.
- *Forge-issue tracker, something landed*: the paths are read off the brief; the branch is the slug-named one with an
  open change request naming the spec location, created from the default branch where none exists, stop-and-report
  where the name is held without that change request; the same `--merge`, commit, draft and resume rules.
- *Forge-issue tracker, nothing landed*: push nothing, open nothing, task completed as
  `<slug>: open the draft (nothing to commit)`, no stage-5 lines in the report.

Five tasks are created at run open for both kinds; the report's stage-5 bullet now reads "whatever the tracker".

**Decisions a reviewer should know.**

- **The brief marks landed files.** Its artifacts bullet listed what the session "landed or touched" as one list, so a
  stage 5 reading paths off it could not tell an ADR read from one written. The bullet now marks each glossary or ADR
  file the session wrote as landed. Nothing else in the brief's contract moved.
- **Brief gone is completed as a skip.** The spec says what to commit (nothing) and report (a hand-off), not how to
  complete the task; it is completed under the same `(nothing to commit)` name. The top-level **Resume** rule re-grills
  when the brief is gone, so stage 5 meets this case only defensively.
- **A closed change request on a forge-issue branch.** Stage 5's resume rule opens a fresh draft where the epic branch's
  change request was closed or merged since, but for a forge-issue tracker the open change request is what identifies
  the branch as the epic's (stories 11 and 12), so a slug-named branch whose draft was closed stops the stage as
  someone else's work. The spec forces this; it reaches the human as a stop rather than a silent reopen.
- `implementer`'s step 2 still calls refine's commit "a refinement's commit of the spec and tickets"; for a forge-issue
  epic it carries glossary and ADR files instead. Left alone as build's side (ticket 02); the "no ticket's work" reading
  it encodes still holds.
