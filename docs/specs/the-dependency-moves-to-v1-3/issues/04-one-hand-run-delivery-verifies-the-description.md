# 04 — One hand-run delivery verifies the description

Status: ready-for-human

**Blocked by:** 01, 03

**What to build:** the description and its refresh seen working before the change ships. Nothing automated reads a
change request's description, and no assertion on it is added, since its headings are upstream's and the dependency
floats — so one delivery is run by hand and its change request read. It spends real money, tens of minutes and about
$20, which is why it is a human's ticket. Settled in `../spec.md` under Testing Decisions.

- [ ] The build happy path is run by hand against a v1.3.1 install, as the contribution guide's section on the
      end-to-end tests says.
- [ ] The change request it leaves is described in the `pr` template: Summary, Evidence and Merge Danger.
- [ ] The description was written after the second fix wave rather than at stage 2 — the run's task list shows the
      refresh stage, and the description accounts for what the fix waves changed.
- [ ] The run dispatched one agent at a time, and the refresh posted no assumption comment twice.
- [ ] What the run cost and how long it took is appended under `## Comments` on this ticket.
