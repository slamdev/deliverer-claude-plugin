# 05 — The build happy path runs per fixture, seeded as refine would leave it

Status: resolved

**Blocked by:** 03, 04.

**What to build:** the build happy path run once per fixture, the forge-issue one handed an epic on the throwaway repo's
issues together with the epic branch and draft a refinement would have left, so build's lookup of refine's branch is
exercised without paying for a refinement first. Settled in `../spec.md` under Implementation Decisions › End-to-end
harness and Testing Decisions.

- [x] The forge-issue fixture carries an `epic/` that the harness publishes as issues on the throwaway repo, with the
      label and blocking edges intact, and seeds a slug-named branch carrying one glossary commit with no `Ticket:` line
      and a draft from it naming the spec, with the placeholder description.
- [x] The build happy path runs once per fixture; the in-repository fixture's assertions are unchanged.
- [x] For the forge-issue fixture it keeps every assertion the in-repository run makes, and adds: the change request
      flipped is the seeded draft and no second one was opened; the seeded glossary commit is on the delivered branch.
- [x] Typecheck and lint pass in the end-to-end package. (The run itself is ticket 06's.)

## Comments

**Notes for ticket 06** (from the implementation):

- **The fixture's epic** is `e2e-tests/fixtures/typescript-library-forge-issues/epic/`, the same `column-alignment` epic
  `typescript-library` delivers, laid out for issues: `spec.md` (no `Status:` line, since triage is a label there),
  `issues/NN-*.md` (each opening with the heading that becomes its title, a `#{NN}` on its `Blocked by:` line naming
  the ticket file numbered `NN`), and `vocabulary/GLOSSARY.md`, the file a grilling would have landed. `fixture.json`
  gained `"epicSlug": "column-alignment"`.
- **The seeding** is `seedEpicOnForge` in `e2e-tests/harness/epic.ts`, which now returns `{ location, epic,
  refinement }` instead of a location. For forge issues it creates the spec issue titled with the slug (so build reads
  the slug off the title verbatim and the draft is titled the same), then each ticket in filename order as a
  sub-issue with the `ready-for-agent` label and native blocked-by edges, `#{NN}` written over with the forge's
  numbers. Then, where `epic/vocabulary/` exists, `pushSeededBranch` (`forge.ts`) commits those files at the same
  paths onto a branch named `column-alignment` — one commit, subject `add the column-alignment vocabulary to the
  glossary`, no `Ticket:` line — made in the fixture repo and switched back to `main` so `readBranch` keeps working,
  and `openDraftChangeRequest` opens the draft with refine's placeholder naming the spec issue's URL, which is also
  the location `/deliverer:build` is handed. A fixture with no `vocabulary/` seeds no branch or draft, which is the
  fallback path (not exercised by any test).
- **No list right after create.** The seeded `PublishedEpic` is built from the issues as `createIssue` read each back
  by number, and carried on `ThrowawayRepoWithEpic.epic`; `build-run.ts` uses that instead of `readEpic`, for both
  tracker kinds (the in-repository one reads the clone at seed time exactly as before).
- **`BuildOutcome.slug`** is the fixture's `epicSlug`, and `assertDebriefWritten` now reads `outcome.slug` for both
  outcomes. Build's `verify` hands the verifier `epicForReading(...)`, as refine's does.
- **The new matcher** is `assertRefinementCarriedOn`, called right after `assertChangeRequestOpened`: the one change
  request is the seeded draft by number, and the seeded commit's SHA is among the delivered change request's commits.
  It passes vacuously where nothing was seeded (every in-repository run). The seeded commit sits before every ticket
  commit, so `anonymousCommits` reads it as "stray"; it records no assumptions, so `assertAssumptionsAdjudicated` passes
  it over, but a ticket missing its `Ticket:` line would be quoted beside it in `assertEveryTicketCommitted`'s failure.
- **Ticket numbers are issue numbers** (2, 3, 4 on a fresh repo), so `assertEveryTicketCommitted` wants `Ticket: #2`
  and so on — `TICKET_LINE` already takes an optional `#`.
- **Exercised by hand, no model**: seeding against `slamdev/deliverer-e2e-seedcheck05-2026-10-28T22-59-44-4an3Yr`
  (private, still on the forge, remove by hand). Seen there: spec #1, tickets #2–#4 as its sub-issues, #3 blocked by
  #2 and #4 by #2 and #3, all labelled; `listEpics` saw exactly `1`; branch `column-alignment` one commit touching only
  `GLOSSARY.md`; draft #5 from it titled `column-alignment` with the placeholder word for word; `epicForReading` wrote
  the four files. Not exercised: a model's build against it.
- **For the run to watch**: that build's "Find the epic" takes `column-alignment` as found (a second change request, or
  the first `implementer` creating `feat/…` or similar, fails `assertRefinementCarriedOn`); that `implementer`'s merge
  of `main` into the branch, if it makes one, does not count as a stray ticket commit; that the debrief is filed under
  `column-alignment`. `--test-name-pattern=typescript-library` matches both fixtures' names, in this test and refine's;
  use `--test-name-pattern='\(typescript-library\)'` for the in-repository one alone. The spend ceiling is shared with
  the in-repository fixture's until this run gives the forge-issue one its own.
