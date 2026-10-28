# 04 — A forge-issue fixture, and the refine happy path runs per fixture

Status: ready-for-agent

**Blocked by:** 03.

**What to build:** a second **fixture** whose tracker is the forge's issues, and the refine happy path run once per
fixture, so a refinement into the forge's issues is exercised end to end against a real forge — vocabulary commit,
branch and draft read off it. Settled in `../spec.md` under Implementation Decisions › End-to-end harness and Testing
Decisions.

- [ ] A fixture directory beside `typescript-library`: the same repository, with a `CLAUDE.md` naming the forge's issues
      as its tracker and a `fixture.json` declaring that kind. Its brief has the human insist on one named term entering
      the glossary.
- [ ] The refine happy path runs once per fixture; the in-repository fixture's assertions are unchanged.
- [ ] For the forge-issue fixture it asserts: the spec and tickets published as issues carrying the ready-for-agent
      label; the default branch unmoved; exactly one new branch, named from the slug, whose commits carry the
      brief's glossary term with no `Ticket:` line; exactly one change request open from it, as a draft, its description
      carrying the placeholder line; no markdown left uncommitted in the clone.
- [ ] Matchers that assume files get a forge-issue counterpart chosen by the fixture's tracker kind; those that already
      read the forge are reused.
- [ ] Typecheck and lint pass in the end-to-end package. (The run itself is ticket 06's.)

## Comments
