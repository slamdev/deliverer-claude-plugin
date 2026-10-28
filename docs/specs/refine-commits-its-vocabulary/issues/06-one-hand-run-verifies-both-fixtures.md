# 06 — One hand run verifies both fixtures

Status: ready-for-agent

**Blocked by:** 01, 02, 04, 05.

**What to build:** the end-to-end evidence that the epic works, gathered by hand because the runs take tens of minutes
and spend real money. Settled in `../spec.md` under Testing Decisions.

- [ ] The refine happy path passes on both fixtures; the forge-issue run's vocabulary commit, branch and draft
      assertions green.
- [ ] Refine is re-run once on the forge-issue throwaway repo its happy path left standing: one new commit where a
      landed path changed, or none, and no second change request. The repo is destroyed by hand afterwards.
- [ ] The build happy path passes on both fixtures; on the forge-issue one it delivered on the seeded branch and flipped
      the seeded draft.
- [ ] Each run's cost, from its records, is noted in this ticket's comments beside the figures the contribution guide
      quotes.

## Comments
