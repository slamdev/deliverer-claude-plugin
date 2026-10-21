# 04 — One hand-run delivery verifies the description

Status: ready-for-human

**Blocked by:** 01, 03

**What to build:** the description and its refresh seen working before the change ships. Nothing automated reads a
change request's description, and no assertion on it is added, since its headings are upstream's and the dependency
floats — so one delivery is run by hand and its change request read. It spends real money, tens of minutes and about
$20, which is why it is a human's ticket. Settled in `../spec.md` under Testing Decisions.

- [x] The build happy path is run by hand against a v1.3.1 install, as the contribution guide's section on the
      end-to-end tests says.
- [x] The change request it leaves is described in the `pr` template: Summary, Evidence and Merge Danger.
- [x] The description was written after the second fix wave rather than at stage 2 — the run's task list shows the
      refresh stage, and the description accounts for what the fix waves changed.
- [x] The run dispatched one agent at a time, and the refresh posted no assumption comment twice.
- [x] What the run cost and how long it took is appended under `## Comments` on this ticket.

## Comments

- Driven on 2026-10-21, run directory `build-typescript-library-2026-10-21T13-15-30-IMZ23S`, against the v1.3.1
  install the harness brings in from the official marketplace: **35m 01s and $8.98** for the run, plus **$0.79** for
  the verdict, over 3 tickets, 7 commits, 8 assumptions and 2 rounds. It passed every mechanical assertion and its
  verifier, with no ceiling reached, and sits inside the four deliveries of 2026-09-13 ($7.71 to $9.55, 26m to 38m).
- The harness deletes the throwaway repo on a pass and does not keep the description, so a watcher polled the change
  request's body and its edit history every 20 seconds while the run was live. The description was written at
  13:24:48, at stage 2, and edited once, at 13:49:52. Both rounds found nothing. The first fix wave committed
  `d5aadb3` (a caller-chosen ellipsis for `formatRow`) at 13:39, and the second fix wave ended at 13:49:07. The
  refresh, "refresh the description" in the task list, ran from 13:49:09 to 13:50:20 and continued the stage-2 agent
  with `SendMessage` rather than dispatching it cold. The flip came after: the change request was ready by 13:50:40.
- The refreshed description is in the `pr` template: a Summary with a file-tree diff and a call graph, Evidence with a
  before (`padEnd` counting escape codes) and an after (green tests, sample outputs), and a Merge Danger naming a
  two-way door with an additive blast radius. It accounts for the first fix wave's commit: its last paragraph describes
  the ellipsis parameter `d5aadb3` added.
- Every dispatch was waited on before the next one started, and none ran in the background. `adjudication.md` holds
  8 assumption comments, 3, 3 and 2 per ticket commit, matching the 8 the run reports. None was posted twice. The one
  other `ASSUMPTION` line is the fix wave's reply naming `d5aadb3`.
