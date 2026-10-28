# 03 — The harness knows two tracker kinds

Status: resolved

**Blocked by:** None — can start immediately.

**What to build:** a prefactor of the end-to-end harness, so a fixture can declare its tracker as the forge's issues as
well as files in the repository, and the harness can create, list and read issues on a **throwaway repo**. No behaviour
of the existing fixture or its tests changes. Settled in `../spec.md` under Implementation Decisions › End-to-end harness
and Further Notes.

- [x] The tracker conventions a fixture declares become a union of two kinds: in-repository (root, spec file, tickets
      directory, as today) and forge issues. A `fixture.json` names which; the existing fixture's declaration keeps
      meaning what it means.
- [x] The tracker kind branches in one place: the harness's reading and seeding of an epic. Every other caller is
      unchanged.
- [x] The forge module gains issue operations on a throwaway repo — create, list, read — carrying the triage label and
      each ticket's declared **blocking edges**, with credentials handled as the module already handles them.
- [x] Typecheck and lint pass in the end-to-end package. No paid run is owed here.

## Comments

**Notes for tickets 04 and 05** (from the implementation):

- **The tracker union** (`e2e-tests/harness/fixture.ts`): `TrackerConventions = InRepositoryTracker | ForgeIssueTracker`,
  discriminated on `kind`. `{ kind: "in-repository", root, specFile, ticketsDirectory }` is what a `fixture.json` with
  no `kind` declares, so `typescript-library` is unchanged. A forge-issue fixture declares
  `"tracker": { "kind": "forge-issues" }` and nothing else. `FixtureEpic.location` is now `string | null`: null on a
  forge-issue tracker, because the location is the spec issue's URL and exists only once seeded.
- **`inRepositoryTracker(fixture, purpose)`** narrows to the in-repository kind or throws naming the caller. The
  file-assuming callers use it today: `assertEpicBranchCarriesEpic` and the spec-writer bench's `publishedSpec`. Those
  are the matchers ticket 04 owes a forge-issue counterpart. `assertEpicPublished` already words its failure for both.
- **The one branch point** is `e2e-tests/harness/epic.ts`. Every function takes an `EpicSource`
  (`{ runDirectory, fullName }`) and the `Fixture`:
  - `listEpics(source, fixture)`: directory names under the root, or the numbers (as strings) of the issues that are
    no ticket. A ticket is an issue with a parent, a native blocked-by edge, or a `Blocked by:` line in its body.
  - `readEpic(source, fixture, slug)`: the same `PublishedEpic` shape for both kinds. On the forge, `slug` is the spec
    issue's number. `specPath` and each ticket's `path` are issue URLs, `file` is the issue title, `number` is the
    issue number, and `directory` is the repo's issues page. The tickets are the ticket issues parented on the spec or
    on nothing. `triageLabel` is the fixture's `readyForAgentLabel` where the issue carries it, else a body `Status:`
    line, else its first label. **Unresolved:** the epic's real slug (which the debrief is filed under, see
    `assertDebriefWritten`) is not yet read off a forge-issue spec. The spec's Further Notes leave that claim
    unchecked, and ticket 04 should settle it from a real run's spec issue (title or label).
  - `seedEpicInTree(fixture, epic)` returns the callback `buildFixtureRepository` takes (now
    `(runDirectory, fixture, seedTree?)`). It copies an in-repository epic and is `undefined` for forge issues.
  - `seedEpicOnForge(source, fixture, epic)` runs after the push in `createThrowawayRepo` and returns
    `epicLocation`. For in-repository it returns the path. For forge issues it **throws** today. Ticket 05 replaces
    the throw with publishing `epic/` as issues (via `createIssue`) plus the slug branch and the draft, and returns
    the spec issue's URL. `build-run.ts` still reads the epic by `fixture.epic.slug`, so ticket 05 must hand
    `readEpic` the spec issue's number instead.
- **Issue operations** (`e2e-tests/harness/forge.ts`), all through `gh api` as the token, so no credential touches a
  file:
  - `createIssue(runDirectory, fullName, { title, body, labels?, parent?, blockedBy? }) → ForgeIssue`
  - `listIssues(runDirectory, fullName) → ForgeIssue[]`: every state, ascending, change requests excluded
  - `readIssue(runDirectory, fullName, number) → ForgeIssue`
  - `ForgeIssue = { number, url, title, body, state: "OPEN"|"CLOSED", labels, parent: number|null, blockedBy: number[] }`.
    `parent` is GitHub's sub-issue link and `blockedBy` its native issue dependencies. A label the repo lacks is created
    with the issue, so no label setup is needed.
- **Exercised by hand** against a private scratch repo, `slamdev/deliverer-e2e-scratch-ticket03`: create with a
  parent, two edges and two labels, then read, list, and both `listEpics` and `readEpic` for the forge kind. It is
  still on the forge and needs removing by hand. Seen there: the list endpoint can lag an issue created a moment
  earlier, so a seeding step that lists right after creating should read by number, or retry.
