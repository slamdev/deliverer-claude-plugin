# 01 — The glossary becomes GLOSSARY.md

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a repository whose glossary is the file `mattpocock-skills` v1.3 reads. Every skill that reads or
writes the glossary now looks for `GLOSSARY.md` and nothing else, so a grilling here today would start a second glossary
beside `CONTEXT.md` rather than sharpen the one this repository has. The glossary moves, every live document that points
at it follows, and a user upgrading the plugin is told to do the same in their own repository. Past specs stay as
written. Settled in `../spec.md` under Implementation Decisions.

- [x] The glossary is moved, not copied, so its history follows it; no `CONTEXT.md` is left at the root.
- [x] The project instructions name `GLOSSARY.md` wherever they named the old file, the doc-stack paragraph included —
      the glossary still sits at the bottom of the stack and still cites nothing.
- [x] The contribution guide names `GLOSSARY.md` throughout, and its project tree says the dependency on
      `mattpocock-skills` is declared in the marketplace entry rather than the plugin manifest.
- [x] The domain conventions file under the agents docs names `GLOSSARY.md` (and `GLOSSARY-MAP.md` where it mentioned a
      map), and goes on directing ADRs to this repository's plural ADR directory.
- [x] Every comment in the plugin's Node code that cites the glossary by filename cites the new one; no behaviour
      changes, and typecheck and lint pass in the plugin's package.
- [x] The stage-3 fixture's clone carries `GLOSSARY.md` in place of `CONTEXT.md`, and the fixture's brief and provenance
      record name it — the provenance figures for that file unchanged, since its contents are.
- [x] The README carries a migration note: a repository with a `CONTEXT.md` moves it to `GLOSSARY.md`, or its next
      refinement writes a second glossary beside it.
- [x] A search of the repository finds `CONTEXT.md` only under the specs directory.
- [x] The contributor's own install of `mattpocock-skills` is at v1.3.1.

## Comments

- The search criterion holds in intent, with one exception beside the specs directory: the README's migration note,
  which has to name `CONTEXT.md` (and `CONTEXT-MAP.md`) to tell a user what to move. No live document points at a
  `CONTEXT.md` of this repository's. The stage-3 provenance names the old file only as "its pre-v1.3 name" for the
  same reason, and records the rename as the fixture's one edit; the brief's figure moves from 18,655 to 18,659
  characters, the glossary's stays at 2,046.
- The contributor install was moved to v1.3.1 for this repository's project scope
  (`claude plugin update mattpocock-skills@claude-plugins-official --scope project`); the user-scope install is
  still 1.2.3.
