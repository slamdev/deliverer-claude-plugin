# 06 — A demonstration rides on its commit as evidence

Status: resolved

**Blocked by:** None — can start immediately.

**What to build:** a human reading a change request finds every demonstration its tickets asked for on the branch,
with what it showed and whether it was watched, so it is not run again. Today an implementer runs the proof, the
timing or the probe pair its ticket asks for and has no slot for what that showed: `change-request-creator` writes the
description's evidence from commit messages, `spec-reviewer` correctly posts each one as missing, and a fix wave runs
every demonstration again — 18 **spec finding**s in one run. And a full-suite pass served from cache was reported as
watched, in two runs. Settled as change 5 in `../spec.md` § Solution and under § Evidence.

- [x] The `implementer` and `comments-addresser` commit formats gain an `Evidence:` section after `Gates:`, numbered
      the same way and left out when empty: one entry per demonstration the ticket or spec asks for — what was run,
      what it showed, and `observed` or `cached`.
- [x] Routine green gates get no entry.
- [x] `change-request-creator` reads `Evidence:` the way it reads `Assumptions:` — to the next `<Word>:` line — but
      from every commit, a fix wave's included, and mirrors the entries into the description marked as reported.
- [x] A fix wave's forks are still neither mirrored nor adjudicated; only its evidence is mirrored.
- [x] `spec-reviewer` reads `Evidence:` as what was demonstrated.
- [x] An `implementer` or fix-wave report that says a gate passed says whether it watched it run.
- [x] Every touched file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap
      are kept.
