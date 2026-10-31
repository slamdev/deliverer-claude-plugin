# 10 — One hand-run build verifies the delivery

Status: ready-for-agent

**Blocked by:** 01, 02, 04, 05, 06, 07, 08, 09.

**What to build:** the end-to-end evidence that the epic works as a whole, gathered by hand because a run takes tens of
minutes and spends real money: one build happy path on the repository-tracker fixture (CONTRIBUTING.md § The
end-to-end tests), read through its debrief and records. A good check asserts what a human or the next agent would
see, never how an agent phrased its reasoning. The fixture runs on GitHub and does not conflict, so it exercises
neither ticket 03's GitLab rungs nor the merge; those, the outside-cause hand-off and the flag on a neutralised round
are left to the next observed deliveries' debriefs. Settled in `../spec.md` § Testing Decisions.

- [ ] The build happy path passes.
- [ ] No turn of the run carries two status polls.
- [ ] `Evidence:` sits on the commits whose ticket asked for a demonstration, and is mirrored into the description as
      reported.
- [ ] The ledger is in every implementer brief after the first and in each fix wave's, with a mark-delivered
      convention found absent carried as absent.
- [ ] A mergeability read precedes each fix wave and the flip.
- [ ] Each fix wave committed per piece and pushed once.
- [ ] The run's cost, from its records, is noted in this ticket's comments beside the figures the contribution guide
      quotes, and the throwaway repository is gone afterwards.
