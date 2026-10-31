# 08 — A sweep is cut by the questions it holds

**What to build:** sweeps cut along the questions they hold rather than along a count of points. Facts that different
frontier questions turn on go out as different sweeps, so one never reports late on another's account; the points one
held question needs stay in one sweep. This replaces **Sweeps**' numbered-points sentence, which failed in both
hand-driven runs. Settled under **A sweep is cut by the questions it holds** in `../spec.md`; story 29.

**Blocked by:** 07 — A sweep is bounded by what it holds.

**Status:** resolved

- [x] **Sweeps**' numbered-points sentence, checklist clause included, is replaced by the held-question cut.
- [x] Ticket 03's numbered-points items are marked superseded by this ticket.
- [x] The refine skill is read against `/mattpocock-skills:writing-for-agents`.
- [x] Recorded from a hand-driven refine run: every sweep's dispatch maps to one set of held questions, and no two
      sweeps carry facts for the same held question.

## Comments

Run `/tmp/deliverer-e2e/refine-typescript-library-2026-10-31T22-26-33-8nIwZM` on `7daf0a0`, 2026-10-31: passed every assertion and the verifier, 58m 38s, $28.87. Two sweeps, one holding three frontier questions and the other one, with no held question shared — the cut held. Cost did not follow: $2.60 and $2.81 (39 and 37 requests, 6.3m and 9.0m), and the grilling sat idle 6.0m on them. Each premise was framed as what "established implementations" do, and each dispatch named four ecosystems to read; both sweeps cloned `muesli/reflow`, and between them they packed npm tarballs, cloned three Go repositories and pulled a Rust crate. Reading a remote primary source counts as a look (07), so the cheapest-look clause did not bind any of it.
