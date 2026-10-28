# 05 — The build happy path runs per fixture, seeded as refine would leave it

Status: ready-for-agent

**Blocked by:** 03, 04.

**What to build:** the build happy path run once per fixture, the forge-issue one handed an epic on the throwaway repo's
issues together with the epic branch and draft a refinement would have left, so build's lookup of refine's branch is
exercised without paying for a refinement first. Settled in `../spec.md` under Implementation Decisions › End-to-end
harness and Testing Decisions.

- [ ] The forge-issue fixture carries an `epic/` that the harness publishes as issues on the throwaway repo, with the
      label and blocking edges intact, and seeds a slug-named branch carrying one glossary commit with no `Ticket:` line
      and a draft from it naming the spec, with the placeholder description.
- [ ] The build happy path runs once per fixture; the in-repository fixture's assertions are unchanged.
- [ ] For the forge-issue fixture it keeps every assertion the in-repository run makes, and adds: the change request
      flipped is the seeded draft and no second one was opened; the seeded glossary commit is on the delivered branch.
- [ ] Typecheck and lint pass in the end-to-end package. (The run itself is ticket 06's.)

## Comments
