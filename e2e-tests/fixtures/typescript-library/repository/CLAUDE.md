# terminal-text-kit

A small TypeScript library of helpers for laying text out in a fixed-width terminal: it measures what a terminal
actually shows and cuts to a column without slicing an ANSI escape in half.

## The code

Everything ships from `src/`, one file per exported function plus `src/index.ts` as the entry point. Each file has its
unit tests beside it as `<name>.test.ts`, written with `node:test`.

The library runs **unbuilt** — Node strips the types — so there is no build step and no emitted artifact. Two things
follow and neither is optional: imports carry the real `.ts` extension, and no construct that type stripping cannot
erase may appear in the source. `tsconfig.json` is what enforces the second, and `npm run typecheck` is the only thing
that reads it.

## Checks

```
npm run typecheck && npm test
```

Both run on every push and every change request through `.github/workflows/ci.yml`. Green means both passed.

## Specs and tickets: local markdown

There is no remote issue tracker for this repository. Specs and tickets live as markdown files under `docs/specs/`,
committed beside the code — do not reach for `gh issue` even though the repository has a GitHub remote.

- One epic per directory: `docs/specs/<epic-slug>/`
- The spec is `docs/specs/<epic-slug>/spec.md`
- One file per ticket at `docs/specs/<epic-slug>/issues/<NN>-<ticket-slug>.md`, numbered from `01` — never a single
  combined tickets file
- Each ticket names what blocks it, on a `Blocked by:` line near the top, or says it can start immediately
- Triage state is a `Status:` line near the top of every spec and ticket file. The five roles are `needs-triage`,
  `needs-info`, `ready-for-agent`, `ready-for-human` and `wontfix`; work that is ready for an agent to pick up carries
  `ready-for-agent`
- Comments and conversation append at the bottom of the file under a `## Comments` heading

**Publishing to the issue tracker** means creating those files under `docs/specs/`, creating the directory where it
does not exist yet. **Fetching a ticket** means reading the file at the path you were given.

## Conventions

- British spelling in prose, American in code where an API already uses it.
- Markdown wraps at 120 columns; TypeScript at 100.
- Commit subjects are plain lowercase imperative.
