# 07 — One hand run verifies refine and build

Status: ready-for-agent

**Blocked by:** 01, 02, 03, 04, 05, 06.

**What to build:** the end-to-end evidence that the epic works as a whole, gathered by hand because the runs take tens
of minutes and spend real money. Settled in `../spec.md` under Testing Decisions.

- [ ] The refine happy path passes against its throwaway repo, with the three forge assertions green.
- [ ] Refine is re-run once on a throwaway repo its happy path left standing: it adds one commit where the spec changed,
      or none where nothing did, and opens no second change request. The repo is destroyed by hand afterwards.
- [ ] Reading a fixture whose conventions name the forge's issues, the "open the draft" stage is confirmed not to run —
      by reading the stage's condition against those conventions, not by a paid run.
- [ ] The build happy path passes, the spec reviewer among its dispatches — which also stands as the check that an epic
      the default branch carries delivers as before.
- [ ] Each run's cost, from its records, is noted in this ticket's comments beside the figures the contribution guide
      quotes.

## Comments
