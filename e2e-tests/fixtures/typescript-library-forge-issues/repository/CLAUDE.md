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

## Specs and tickets: GitHub issues

Specs and tickets live as issues on this repository's GitHub remote, never as files in the repository. Use `gh issue`
(or `gh api`) against the remote the checkout was cloned from.

- One issue per spec, titled from the epic's slug
- One issue per ticket, each a sub-issue of its spec — never a single combined tickets issue
- Each ticket names what blocks it with GitHub's own issue dependencies ("blocked by"), and also on a `Blocked by:` line
  near the top of its body, which is where it says that it can start immediately
- Triage state is a label. The five roles are `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human` and
  `wontfix`; work that is ready for an agent to pick up carries `ready-for-agent`
- Comments and conversation go on the issue as comments

**Publishing to the issue tracker** means creating those issues on the remote. **Fetching a ticket** means reading the
issue at the URL or number you were given.

## Domain language

The project's vocabulary lives in `GLOSSARY.md` at the repository's root, one entry per term, created where it does
not exist yet. Decisions worth recording go in `docs/adrs/`, one numbered file each. Both are files in the repository,
unlike the specs and tickets above.

## Conventions

- British spelling in prose, American in code where an API already uses it.
- Markdown wraps at 120 columns; TypeScript at 100.
- Commit subjects are plain lowercase imperative.
