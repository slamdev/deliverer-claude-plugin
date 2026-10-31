# 03 — Every assumption comment lands, on GitLab too

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** every **assumption** the tickets recorded is posted where the forge stores it, so no **fork** ships
unadjudicated because no anchor would take it. `change-request-creator`'s rung 3 GitLab example is a bare `commit_id`,
which GitLab accepts and stores nothing positional for: in each of the four runs that used it, it led to a post, a
delete and a repost, or to the anchor being written into the body. And where the file is not in the diff at all, both
the file-level and the commit anchor are refused, so one assumption was never posted. Settled as change 3 in
`../spec.md` § Solution and under § The anchoring ladder.

The positional form is a claim until checked, so the check comes first: a throwaway GitLab project under the owner's
personal namespace, one merge request of two commits, the second moving a line the first added. One **assumption
comment** is posted at each rung, every discussion is read back to confirm what it stored, and the project is deleted
(`../spec.md` § Testing Decisions).

- [ ] The throwaway project's results are recorded in this ticket's comments: for each rung, the request posted and
      what GitLab stored, positional fields included. The project is deleted afterwards.
- [ ] Rung 3's GitLab example is a positional `text` form against the recording commit's own diff — base and start at
      its parent, head at the commit — where the probe shows GitLab stores it. Where it does not, rung 3 on GitLab is
      the general comment, and the example says so.
- [ ] Rung 3 keeps its meaning and its GitHub example.
- [ ] A rung 4 that always holds joins below it: a general comment carrying the entry's `file:` and `line:`, its body
      opening with the same `ASSUMPTION (<hash>)` prefix, worked for both forges.
- [ ] The file-level rung is described as covering a file the diff carries at a line it does not, not a file the diff
      never touched.
- [ ] The rule that a comment at rung 3 is reported as "anchored anywhere but at a translated line on head" covers
      rung 4 too, in the agent and wherever the build skill restates it.
- [ ] The GitLab and GitHub forms stay worked examples of one mechanism (ADR 0012).
- [ ] The file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap are kept.
