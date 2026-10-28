# 04 — A forge-issue fixture, and the refine happy path runs per fixture

Status: resolved

**Blocked by:** 03.

**What to build:** a second **fixture** whose tracker is the forge's issues, and the refine happy path run once per
fixture, so a refinement into the forge's issues is exercised end to end against a real forge — vocabulary commit,
branch and draft read off it. Settled in `../spec.md` under Implementation Decisions › End-to-end harness and Testing
Decisions.

- [x] A fixture directory beside `typescript-library`: the same repository, with a `CLAUDE.md` naming the forge's issues
      as its tracker and a `fixture.json` declaring that kind. Its brief has the human insist on one named term entering
      the glossary.
- [x] The refine happy path runs once per fixture; the in-repository fixture's assertions are unchanged.
- [x] For the forge-issue fixture it asserts: the spec and tickets published as issues carrying the ready-for-agent
      label; the default branch unmoved; exactly one new branch, named from the slug, whose commits carry the
      brief's glossary term with no `Ticket:` line; exactly one change request open from it, as a draft, its description
      carrying the placeholder line; no markdown left uncommitted in the clone.
- [x] Matchers that assume files get a forge-issue counterpart chosen by the fixture's tracker kind; those that already
      read the forge are reused.
- [x] Typecheck and lint pass in the end-to-end package. (The run itself is ticket 06's.)

## Comments

**Notes for tickets 05 and 06** (from the implementation):

- **The fixture** is `e2e-tests/fixtures/typescript-library-forge-issues/`: `typescript-library`'s repository less
  `docs/specs/`, its `CLAUDE.md` naming the repository's GitHub issues as the tracker (spec issue titled from the slug,
  tickets as its sub-issues, native blocked-by plus a `Blocked by:` line, `ready-for-agent` as a label) and naming
  `GLOSSARY.md` at the root and `docs/adrs/` for the vocabulary. Its brief is `typescript-library`'s plus one decision:
  the human insists `hard break` enters `GLOSSARY.md`. `fixture.json` declares `"tracker": { "kind": "forge-issues" }`
  and a new `"glossaryTerm": "hard break"`, read into `Fixture.glossaryTerm`. It carries **no `epic/` and no
  `epicSlug`**: those are ticket 05's, and `loadFixture` wants both or neither.
- **The slug, settled for refine.** `RefineOutcome.slug` is the run's own name for the epic. For in-repository it is
  the published directory (the same as `epic.slug`); for forge issues it is read off the one brief the run collected,
  `<slug>-brief.md`, not off the spec issue's title. `assertDebriefWritten` uses `outcome.slug` where the outcome has
  one and `epic.slug` otherwise, so **ticket 05's `BuildOutcome` still looks the debrief up by `epic.slug`**, which
  for a forge-issue epic is the spec issue's number. Ticket 05 should give `BuildOutcome` a `slug` (the fixture's
  `epicSlug`, which it seeds the branch under) and the matcher picks it up by the same `"slug" in outcome` test.
- **Matchers choose by the fixture's tracker kind inside each matcher**, so the test calls the same list for both:
  - `assertTicketsPublished`: the numbered-from-`01` and two-digit checks apply to files only (an issue's number is the
    forge's); blocking edges and the triage label are held of both.
  - `assertEpicBranchCarriesEpic`: exactly one new branch, no `Ticket:` line, markdown-only paths and nothing
    uncommitted, for both; then the files at the conventions' paths for in-repository, or, for forge issues, a branch
    whose name *includes* the slug and a commit whose added lines contain `glossaryTerm` (case aside). `BranchCommit`
    gained `added` (every line the commit added) for this; ticket 05's "the seeded glossary commit is on the delivered
    branch" can reuse it or match by SHA.
  - `assertDraftOpenedFromEpicBranch`: for forge issues the spec location may be the issue URL or `#<number>`, and the
    placeholder line must be there word for word. The in-repository run is held to what it was before.
  - `assertSpecPublished`, `assertEpicPublished`, `assertDefaultBranchUnmoved` and `assertSessionRecordsKept` are
    reused.
- **The verifier reads files only** (`Read`, `Glob`, `Grep`), so refine's `verify` now hands it
  `epicForReading(...)` from `epic.ts`: for forge issues each issue is written to `<run directory>/epic-issues/` and
  those paths swapped in; for in-repository the epic is returned as is. `PublishedTicket` gained `text` for this.
  Ticket 05's build `verify` needs the same call before `verifyDelivery`.
- **The test** loops over `["typescript-library", "typescript-library-forge-issues"]`; one alone runs with
  `node --test --test-name-pattern=<fixture> tests/refine-happy-path.test.ts`. The $40 spend ceiling rests on the
  in-repository fixture's evidence and is shared until ticket 06's run gives the forge-issue fixture its own.
- **Checked offline only:** typecheck and lint, and the new matcher branches exercised against hand-built outcomes,
  passing and failing. **For ticket 06 to watch on the real run:** that the brief is filed under the slug the debrief
  and branch use; that `listEpics` sees exactly one non-ticket issue (a spec issue whose body carries a `Blocked by:`
  line would be read as a ticket); that the branch name carries the slug; and that `listIssues` right after the run
  does not lag (ticket 03 saw the list endpoint lag a fresh create).
