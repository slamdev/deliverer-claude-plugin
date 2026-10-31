# 04 — A fix wave reads verdicts first and commits each piece as it lands

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a **fix wave** neither builds a fix a standing **verdict** already ruled out nor loses its finished
work to an interruption. Today it reads the verdicts on a finding's lines only after it has fixed it, so one wave built
and pushed a fix a standing `accept` had ruled out, then reverted it, at about 15 minutes of CI. And it commits only
once every comment is worked, so an interruption lost the whole of a wave and left its edits in the tree. Settled as
change 4 in `../spec.md` § Solution and under § The fix wave.

- [ ] Before working a finding, `comments-addresser` reads every verdict on the lines it would touch, resolved
      `accept`s included. A finding a standing verdict already ruled out is declined on that verdict's **grounds**, or
      handed off where the finding argues the verdict is wrong.
- [ ] The verdict read sits at the front of the per-comment loop; the existing rule for a verdict a fix outdates is
      unchanged.
- [ ] The steps that work the comments, work the prose's points and commit interleave as the implementer's do — each
      comment's fix, its gates, its commit — and one push follows once the comments are worked.
- [ ] The mark step stays after the push, because a mark names the commit that did the work.
- [ ] Each step's "you are done when" still states a bar the wave can check, including nothing of its own work left
      uncommitted.
- [ ] The file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap are kept.
