# 03 — The harness knows two tracker kinds

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a prefactor of the end-to-end harness, so a fixture can declare its tracker as the forge's issues as
well as files in the repository, and the harness can create, list and read issues on a **throwaway repo**. No behaviour
of the existing fixture or its tests changes. Settled in `../spec.md` under Implementation Decisions › End-to-end harness
and Further Notes.

- [ ] The tracker conventions a fixture declares become a union of two kinds: in-repository (root, spec file, tickets
      directory, as today) and forge issues. A `fixture.json` names which; the existing fixture's declaration keeps
      meaning what it means.
- [ ] The tracker kind branches in one place: the harness's reading and seeding of an epic. Every other caller is
      unchanged.
- [ ] The forge module gains issue operations on a throwaway repo — create, list, read — carrying the triage label and
      each ticket's declared **blocking edges**, with credentials handled as the module already handles them.
- [ ] Typecheck and lint pass in the end-to-end package. No paid run is owed here.

## Comments
