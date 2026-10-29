# 06 — One hand run verifies both fixtures

Status: resolved

**Blocked by:** 01, 02, 04, 05.

**What to build:** the end-to-end evidence that the epic works, gathered by hand because the runs take tens of minutes
and spend real money. Settled in `../spec.md` under Testing Decisions.

- [x] The refine happy path passes on both fixtures; the forge-issue run's vocabulary commit, branch and draft
      assertions green.
- [x] Refine is re-run once on the forge-issue throwaway repo its happy path left standing: one new commit where a
      landed path changed, or none, and no second change request. The repo is destroyed by hand afterwards.
- [x] The build happy path passes on both fixtures; on the forge-issue one it delivered on the seeded branch and flipped
      the seeded draft.
- [x] Each run's cost, from its records, is noted in this ticket's comments beside the figures the contribution guide
      quotes.

## Comments

**The hand runs, 2026-10-28** (from the implementation). Every figure is the one the harness reports — the host's own
running total for the orchestrator and its dispatches, the **responder** inside it on a refinement — which is the
figure CONTRIBUTING.md § The end-to-end tests quotes; the **verifier**, the two **rounds** and the observation sit
outside it, as there. The refine file and the build file ran concurrently, as `npm test` runs them, and the re-run came
after the forge-issue refinement had passed. All on `opus`, every mechanical assertion and every verifier passed, no
**ceiling** reached.

| | refine, in-repository `DC9T59` | refine, forge issues `tbWTv0` | its re-run | build, in-repository `i3j5x4` | build, forge issues `T7rdmi` |
|---|---:|---:|---:|---:|---:|
| wall clock | 15m 39s | 30m 29s | 0m 56s | 20m 56s | 23m 13s |
| the run | $6.07, responder $0.45 over 11 rounds | $8.99, responder $0.50 over 12 rounds | $0.57, no questions | $8.03 | $7.54 |
| the verifier, on top | $0.32 | $0.32 | — | $0.56 | $0.44 |
| the two rounds, outside both | — | — | — | $0.38 | $0.30 |
| what came out | 6 tickets over 51 stories | 7 tickets over 49 stories | nothing new | 8 commits, 8 `accept` | 6 commits, 9 `accept` |

**Beside the guide's figures**: both refinements sit inside the $7.81 to $24.75 spread of the in-repository fixture or
under it — the in-repository one, at $6.07, is the cheapest refinement of it on record, and one reading licenses no claim
that anything changed. Both deliveries sit inside the $7.31 to $9.55 the guide has measured. The forge-issue fixture
now has one reading of each test, $8.99 and $7.54, well inside the $40 and $25 ceilings it shares, so nothing argues
for a ceiling of its own yet. The whole session came to **$33.52** with verifiers and rounds, the observation aside.
The debriefs' own estimates, priced by `rates.ts`, came lower — $2.92, $4.66, $0.42, $4.87 and $4.47 — the same gap
`e2e-tests/README.md` already records for the 2026-10-26 pair.

**The re-run** was driven by hand: the forge-issue test run with `DELIVERER_E2E_KEEP_REPO=1`, a switch added for this
ticket that leaves a passing refinement's repository standing, then `/deliverer:refine` with the fixture's idea sent
again into the same run directory and clone, with the brief the first run wrote put back in the temporary directory so
stage 1 resumes rather than re-grills. Branch `word-wrap` carried the one commit `80d61ca` (`GLOSSARY.md` and
`docs/adrs/0001-…`) before and after, and draft #9 stayed the only change request: the paths matched, so no commit was
owed and none was made. The repository was then deleted by hand, as was the in-repository refinement's.

**What tickets 03, 04 and 05 asked this run to watch**, each seen holding:

- the slug, `word-wrap`, was the brief's filename, the epic branch's name and the debrief's directory alike;
- `listEpics` saw exactly one non-ticket issue, the spec #1 over tickets #2–#8, and no list lag showed;
- build took the seeded `column-alignment` as the epic branch and flipped the seeded draft #5 rather than opening a
  second, and the debrief was filed under `column-alignment`.

**Two things seen that no assertion covers**:

- **The brief sweep took another session's brief.** The in-repository refinement collected `repo-linters-brief.md`
  besides its own `word-wrap-brief.md`: a contribution session elsewhere on the machine wrote it to the shared `/tmp`
  while the run was going, so it was as new as the run and `harness/brief.ts` moved it. It was copied back by hand. The
  collector's "as new as the run" rule does not protect a concurrent refinement on the same machine; matching the
  slug the run itself used would.
- **The agent SDK warns** `canUseTool will not be invoked` under `bypassPermissions` on every run. It is wrong about
  `AskUserQuestion`: the responder answered 30-odd questions through that callback in each refinement.
