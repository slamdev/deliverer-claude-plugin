# 07 — One hand run verifies refine and build

Status: ready-for-agent

**Blocked by:** 01, 02, 03, 04, 05, 06.

**What to build:** the end-to-end evidence that the epic works as a whole, gathered by hand because the runs take tens
of minutes and spend real money. Settled in `../spec.md` under Testing Decisions.

- [x] The refine happy path passes against its throwaway repo, with the three forge assertions green.
- [x] Refine is re-run once on a throwaway repo its happy path left standing: it adds one commit where the spec changed,
      or none where nothing did, and opens no second change request. The repo is destroyed by hand afterwards.
- [x] Reading a fixture whose conventions name the forge's issues, the "open the draft" stage is confirmed not to run —
      by reading the stage's condition against those conventions, not by a paid run.
- [x] The build happy path passes, the spec reviewer among its dispatches — which also stands as the check that an epic
      the default branch carries delivers as before.
- [x] Each run's cost, from its records, is noted in this ticket's comments beside the figures the contribution guide
      quotes.

## Comments

**2026-10-26, the hand run.** Both happy paths were driven concurrently from one working tree, the integration branch at
`48f8738`, which both runs staged as the same 50 files. Run directories:
`/tmp/deliverer-e2e/refine-typescript-library-2026-10-26T17-59-30-moPSe1` and
`/tmp/deliverer-e2e/build-typescript-library-2026-10-26T17-59-31-ZfkXSD`.

- **The refine happy path passed**: every mechanical assertion, the three forge facts among them, and the verifier. The
  default branch stayed at `3bc92a8`. One new branch, `word-wrap`, carried the spec, seven tickets, `GLOSSARY.md` and
  one ADR in one commit, `dc7a968`. One draft, `Spec: word-wrap`, was open from it. Eleven rounds of questions, 32
  answers.
- **The re-run on the standing repo, driven twice.** The test was run from an uncommitted copy without its cleanup line,
  so the repo stayed standing. Refine was then driven again in the same run directory and clone, with the collected
  brief put back in the run's `TMPDIR`. **Nothing changed**: stages 1 to 4 were found done and nothing was dispatched.
  Stage 5 found the remote branch carrying every path at its current content, so it committed nothing, pushed nothing
  and opened no second change request. **The spec changed**: a paragraph was appended to `spec.md` by hand,
  uncommitted, and refine was run again. Stage 5 added exactly one commit, `06d2c0c update the word-wrap spec`, touching
  `spec.md` alone. It pushed with no force, left the draft's title and description as they stood, and opened no second
  change request. The repo was then deleted by hand.
- **The forge-tracker branch, by reading.** No fixture names the forge's issues. The check read `typescript-library`
  with its "Specs and tickets: local markdown" section replaced by `mattpocock-skills`' own
  `setup-matt-pocock-skills/issue-tracker-github.md`, which says specs and tickets "live as GitHub issues" and that
  publishing to the tracker "Create[s] a GitHub issue". Stage 5 of `plugin/skills/refine/SKILL.md` runs "only where
  the project's conventions put the spec and tickets as files in the repository" and says "Where they put them on the
  forge's issues, this stage is not part of the run: go to stage 6". Against those conventions the stage does not run.
  **Progress** agrees: it creates four tasks rather than five where they "live on the forge's issues". **Resume**
  agrees too: stage 5 re-runs only "where it is part of the run". Nothing else in the skill pushes, branches or opens a
  change request.
- **The build happy path passed**: every mechanical assertion and the verifier. It made 10 dispatches, the
  `spec-reviewer` among them: 3 implementers, the change-request creator, the assumption reviewer, the spec reviewer, 2
  code reviewers and 2 comments addressers. It made 7 commits over 3 tickets, raised 6 assumptions that all got
  `accept`, ran 2 rounds, and flipped the change request ready. The repo was deleted by the test.

| | wall clock | the run | beside it | verifier | observation |
|---|---:|---:|---:|---:|---:|
| refine happy path | 21m 40s | $8.32 | responder $0.43 | $0.33 | $2.06 |
| refine re-run, nothing changed | 1m 11s | $0.69 | none asked | none | $0.24 |
| refine re-run, the spec changed | 1m 22s | $0.55 | none asked | none | $0.34 |
| build happy path | 20m 22s | $5.95 | 2 rounds $0.31 | $0.44 | $5.00 |

Each "run" figure is the session's `total_cost_usd`, which covers the orchestrator and its dispatches. Each
observation figure is the debrief's own `what this observation cost` line. **Against the guide's figures**: the
refinement's $8.75 with its responder is under both of the 2026-09-13 pair, $9.80 and $12.40. Its wall clock is under
their 26m 29s and 35m 57s too. The delivery's $5.95 is under all four 2026-09-13 deliveries, $7.71 to $9.55, and so is
its 20m 22s against 26m to 38m. Its rounds' $0.31 is under their $0.65 to $0.75. Each figure is one reading inside a
spread the guide says one reading cannot resolve. The staged plugin is not the baseline's either, so none of this
measures a change.

**One finding, unfixed because no run failed on it.** Both runs were served by `claude-opus-5-5`, which
`plugin/mcp/observer/rates.ts` has no rate for. So both debriefs read the run's own spend as "In dollars: unknown", and
every one of their requests is listed as unpriced. The observation's own dollars are unaffected: they are the SDK's
figure.

**Left on the forge**: nothing from this ticket. Both throwaway repos are gone.
