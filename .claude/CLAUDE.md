# deliverer-claude-plugin

A Claude Code plugin: `plugin/` is the product, and everything outside it exists to build that.

- **`CONTRIBUTING.md`** — read for the contribution flow, the `./claude` container, the project tree, what CI does and
  does not check, or how to run the end-to-end tests; and before changing how contribution itself works.
- **`CONTEXT.md`** — the glossary. Read before naming a domain concept in prose, a commit, a spec or a ticket.

## What ships

Only `plugin/` reaches users. `.claude-plugin/marketplace.json` publishes that subdirectory straight from the default
branch — no build, no artifact, no version field and no release step to update. A merge inside `plugin/` is live on a
user's next plugin update; a change anywhere else never reaches them.

## No dogfooding

Contribute with the `mattpocock-skills` flow — `grill-with-docs` → `to-spec` → `to-tickets` → `implement`. `deliverer`
stays out of `enabledPlugins` in `.claude/settings.json` and `/deliverer:*` never runs against this repo: the absence is
deliberate, and CONTRIBUTING.md § No dogfooding gives the three reasons.

## What is checked

Two packages carry every automated check there is, and CI runs both of them and nothing else (`npm ci` first if
`node_modules/` is missing):

```
(cd plugin/mcp && npm run typecheck && npm run lint)   # the tools server
(cd e2e-tests  && npm run typecheck && npm run lint)   # the end-to-end harness
```

Both packages run unbuilt: `e2e-tests/tsconfig.json` holds the harness to the same three options as the server's, for
the reason the next section gives.

The end-to-end tests themselves are no part of those two commands and no part of CI. `e2e-tests/` installs the plugin
and drives whole **runs** against a real forge, so the two happy-path tests take tens of minutes and spend real money
each: they are run deliberately, by hand. CONTRIBUTING.md § The end-to-end tests says what they take, what they need
and how to run them.

Everything else is verified **by hand**: markdown, the manifests, the shell hooks, and the server's own behaviour. When
behaviour moves, exercise the review lifecycle against the **scripted backend** — a canned event timeline, no model and
no money — before calling the change done. CONTRIBUTING.md § What CI does not check has the command.

## The tools server (`plugin/mcp/`)

The server **ships unbuilt**: Node's type stripping runs the TypeScript as-is, so `tsc --noEmit` is the only thing
holding up the three options that make that possible. `plugin/mcp/tsconfig.json` names them and what each one prevents;
a violation gets past you and surfaces in a user's session.

Comments in `server/` carry the reasoning, citing the grill item or review round a decision came from. Keep them,
including the blocks `lifecycle.ts` marks as defensive.

## Writing

- **Use the glossary's words**: change request (not PR), ticket (not issue), fork, assumption, verdict, round, fix wave.
  `CONTEXT.md` lists the synonyms each term displaces under `_Avoid_`. A term you need that is missing is a signal —
  either the language is invented, or it is a real gap for `/mattpocock-skills:domain-modeling`.
- **The doc stack cites one way.** `CONTEXT.md` sits at the bottom, `docs/adrs/` above it, `docs/specs/` on top: a
  document cites downward only. `CONTEXT.md` cites nothing — it defines the words *spec*, *ticket* and *ADR*, and names
  no particular one. An ADR uses glossary terms and names no spec or ticket. A spec or ticket links the ADR that settled
  a decision instead of restating it, which keeps the ADR the one place that decision changes.
- ADRs in `docs/adrs/` are rare: hard to reverse, surprising without context, **and** the result of a real trade-off.
  Miss any of the three and skip it.
- `plugin/skills/*/SKILL.md` and `plugin/agents/*.md` are prose written to be read by a model, in a deliberate register.
  Use `/mattpocock-skills:writing-for-agents` when you touch them.
- Wrapping, enforced by nothing: server TypeScript ~100 columns, markdown 120.
- Commit subjects are plain lowercase imperative ("cleanup the docs"), and stay bare. The `Ticket:` / `Assumptions:`
  format is what the plugin imposes on the repositories it delivers into, not what this repo uses.

## How the contributor skills behave here

- **Ask with `AskUserQuestion`.** Every question to the human goes through that tool — the grilling rounds above all,
  and including where a skill's own text asks its questions in prose, which this rule overrides. Open-ended is not an
  exemption: put the plausible answers in the options and let the free-text escape carry anything else. Up to four
  questions per call, and `multiSelect` when the answers are not exclusive.
- **`docs/agents/issue-tracker.md`** — read when a skill says publish, fetch or triage an issue, spec or ticket: they
  live as markdown under `docs/specs/`, never as `gh issue`.
- **`docs/agents/triage-labels.md`** — read when setting an issue's `Status:` line; five canonical roles, used verbatim.
- **`docs/agents/domain.md`** — read when exploring the codebase or recording a decision; single-context, one
  `CONTEXT.md` plus `docs/adrs/`.
