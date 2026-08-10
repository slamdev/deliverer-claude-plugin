# deliverer-claude-plugin

A Claude Code plugin. `plugin/` is the product — everything published lives there, nothing outside it ships.
`CONTRIBUTING.md` is the contributor's manual (structure, the contribution flow, the container, CI); `CONTEXT.md` is the
glossary.

## What ships, and when

- Only `plugin/` reaches users. `.claude-plugin/marketplace.json` publishes that subdirectory from `main` — no build, no
  artifact, no version field, no release step. A merge inside `plugin/` is live on a user's next plugin update; a change
  anywhere else never reaches them.
- **Never** add `deliverer` to `enabledPlugins` in `.claude/settings.json`, and never run `/deliverer:*` against this
  repo. Its absence is deliberate — see CONTRIBUTING.md § No dogfooding. Contribute with the `mattpocock-skills` flow
  (`grill-with-docs` → `to-spec` → `to-tickets` → `implement`) instead.

## The tools server (`plugin/mcp/`)

- The only checks that exist — run both from `plugin/mcp` (`npm ci` first if `node_modules/` is missing):

  ```
  npm run typecheck && npm run lint
  ```

  There is no test suite. No markdown, manifest or shell script is checked anywhere. Behaviour is verified by hand.
- The server **ships unbuilt** — Node strips the types at runtime, so `tsc --noEmit` is the only thing enforcing what
  makes that possible: no enums, namespaces, decorators or parameter properties (`erasableSyntaxOnly`); import the
  extension the file really has (`./config.ts`, never `./config.js`); mark every type-only import `type`
  (`verbatimModuleSyntax`). Break one and it fails in a user's session, not here.
- Exercise the review lifecycle with the **scripted backend** — a canned event timeline, no model and no money. Command
  in CONTRIBUTING.md § What CI does not check.
- Comments in `server/` carry the reasoning, citing the grill item or review round a decision came from, and
  `lifecycle.ts` marks defensive code that must not be deleted. Don't strip them as dead code.

## Writing

- **Use `CONTEXT.md`'s words**: change request (never PR/MR), ticket (never issue/task), round, fix wave, fork,
  assumption, verdict. Every entry lists the synonyms it displaces under `_Avoid_`. A term you need that is missing is a
  signal — either the language is invented, or it is a real gap for `/mattpocock-skills:domain-modeling`.
- `plugin/skills/*/SKILL.md` and `plugin/agents/*.md` are prose written to be read by a model, in a deliberate register.
  Use `/mattpocock-skills:writing-for-agents` when you touch them.
- Wrapping, enforced by nothing: server TypeScript ~100 columns, markdown 120.
- Commit subjects are plain lowercase imperative ("cleanup the docs"). This repo does **not** use the
  `Ticket:` / `Assumptions:` commit format — that is what the plugin imposes on repositories it delivers into.
- ADRs in `docs/adrs/` are rare: hard to reverse, surprising without context, **and** the result of a real trade-off.
  Miss any of the three and skip it.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `docs/specs/<feature-slug>/` in this repo. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, used verbatim as `Status:` values on each issue file. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adrs/` at the repo root. See `docs/agents/domain.md`.
