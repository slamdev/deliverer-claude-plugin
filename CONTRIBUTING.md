# Contributing

This repository is a Claude Code plugin. Everything users install lives in `plugin/`; everything else here exists to
build it.

Two rules shape all the rest, and they are easy to get backwards:

1. **Changes are made by Claude Code, running in the container, never by hand.**
2. **The deliverer plugin is not used to build the deliverer plugin.** We do not dogfood. You contribute with a
   different set of skills entirely.

## Two sets of skills, and why they never mix

The word "skill" means two different things in this repository, and confusing them is the fastest way to make a mess.

### The skills this repo ships — the product

These are artifacts we write. They are never run against this repository.

| Artifact                        | What it is                                                            |
|---------------------------------|-----------------------------------------------------------------------|
| `plugin/skills/refine/SKILL.md` | `/deliverer:refine` — an idea becomes an epic: a spec and its tickets |
| `plugin/skills/build/SKILL.md`  | `/deliverer:build` — an epic becomes a reviewed change request        |
| `plugin/agents/*.md`            | the seven agents those two skills dispatch                            |

### The skills you contribute with — the toolkit

These are installed, and they are what you actually run. `.claude/settings.json` enables them:

| Plugin                 | Used for                                                                              |
|------------------------|---------------------------------------------------------------------------------------|
| `mattpocock-skills`    | the contribution flow below — `grill-with-docs`, `to-spec`, `to-tickets`, `implement` |
| `plugin-dev`           | plugin structure, agent/skill/hook authoring, manifest validation                     |
| `skill-creator`        | creating and revising skills                                                          |
| `claude-md-management` | keeping `CLAUDE.md` honest                                                            |
| `.claude/skills/`      | this repo's own skills — today, `update-claude-dockerfile`                            |

### No dogfooding

`deliverer` is deliberately **absent** from `enabledPlugins` in `.claude/settings.json`. That is not an oversight, and
please do not add it:

- **It would be circular.** A change that broke `/deliverer:build` would break the tool you need in order to make the
  next change, and the failure would look like your change misbehaving rather than the plugin being broken.
- **A plugin cannot review its own uncommitted self.** The plugin users get is published from `plugin/` on the default
  branch. An installed copy is a *released* copy, so running it here means an old build passing judgement on the source
  of its replacement.
- **The flow is the same either way.** `/deliverer:refine` is a packaged version of `grill-with-docs` → `to-spec` →
  `to-tickets` (its `spec-writer` and `tickets-writer` agents credit exactly those skills). Contributors run that flow
  by hand; the plugin's job is to run it for *users*. You lose nothing by driving it yourself, and you can see every
  step.

## Everything goes through Claude Code

Do not hand-edit files in this repository. Describe what you want and let Claude make the change.

This is not ceremony. The reasons are specific:

- **Most of this repo is prose written to be read by a model.** `plugin/skills/*/SKILL.md` and `plugin/agents/*.md` are
  instructions to an agent, and they have a deliberate register — load-bearing bold, no hedging, "you are done when…"
  completion bars. A human editing them by feel drifts that register a sentence at a time. Use
  `/mattpocock-skills:writing-for-agents` when you touch them.
- **The vocabulary is enforced by a document, not by a compiler.** `CONTEXT.md` is the glossary, and it lists the
  synonyms each term displaces under `_Avoid_`. Changing the model means running
  `/mattpocock-skills:domain-modeling`, which challenges the term and updates the glossary in the same pass.
- **The server's comments carry the reasoning, not just the what.** Headers in `plugin/mcp/server/` cite the grill
  agenda item or review round a decision came from, and some of them explicitly say *do not remove this as dead
  defensive code* (see `lifecycle.ts`). That context is only preserved by someone who has read it.

What stays yours: the conversation, the decisions, the open questions, reviewing the diff, and the merge.

## Running Claude: `./claude`

```
./claude                 # interactive session
./claude -p "…"          # one-shot
```

The wrapper does five things:

1. **Loads `.env`** from the repo root — every `KEY=value` is exported, with `#` comments and blank lines skipped. This
   file is gitignored and holds your credentials.
2. **Builds the image on demand.** The tag is the **md5 of `hacks/claude.dockerfile`**, so editing the dockerfile
   changes the tag and the next `./claude` rebuilds. A pin bump can never be half-applied.
3. **Truncates `claude.log`** and creates `.claude-sandbox/` and `.claude-tmp/` (all gitignored).
4. **Detects the host timezone** so container timestamps and git commit times match your machine.
5. **Runs the container** with the repo mounted at `/opt/project`, plus `--verbose --debug --debug-file=/tmp/claude.log
   --no-chrome --effort=xhigh`.

You need Docker, Bash, and a `.env`. The variables the wrapper passes through are `ANTHROPIC_BASE_URL`,
`ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL`,
`CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`, `GITHUB_TOKEN` (also as `GITHUB_PERSONAL_ACCESS_TOKEN`) and
`CONTEXT7_API_KEY` — set whichever your setup needs.

### Why a container

- **The session runs with no permission prompts at all.** `.claude/settings.json` sets
  `permissions.defaultMode: bypassPermissions` and the image sets `IS_SANDBOX=1`. That is what makes long unattended
  work possible, and it is only reasonable because a mistake lands in a container and the mounted repo rather than in
  your home directory.
- **One pinned toolchain for everyone.** Node, the Claude CLI, `gh`, `jq`, `yq`, `rg`, `delta`, `fzf`, the Docker CLI
  and buildx are all pinned in the dockerfile. CI pins Node to the same `NODE_VERSION`, so green in CI means green in
  the container.
- **Agent state lives in the repo, not your host.** `.claude-sandbox/` is mounted at `/root/.claude/`, so history and
  sessions survive between runs without touching your real `~/.claude`.

**Be clear-eyed about the boundary.** `/var/run/docker.sock` and `~/.ssh` are mounted in. This isolates you from
*accidents*, not from hostile code — anything in the container can reach your Docker daemon and your SSH keys.

To bump the pinned versions, run `/update-claude-dockerfile`; it sweeps every version source in one call and reports
what moved.

## Project structure

```
.
├── plugin/                              ← THE PRODUCT. Everything published; nothing outside ships.
│   ├── .claude-plugin/plugin.json         manifest: name, mattpocock-skills dependency, 3 userConfig options
│   ├── skills/{refine,build}/SKILL.md     the two commands
│   ├── agents/                            the seven dispatched agents
│   │   ├── spec-writer.md                 brief   → published spec
│   │   ├── tickets-writer.md              spec    → one ticket per vertical slice
│   │   ├── implementer.md                 ticket  → commits on the epic branch
│   │   ├── change-request-creator.md      branch  → draft change request + ASSUMPTION comments
│   │   ├── assumption-reviewer.md         assumption → accept / override / escalate
│   │   ├── code-reviewer.md               drives one review round via the MCP server
│   │   └── comments-addresser.md          unresolved comments → fixes, declines, hand-offs
│   ├── mcp/                               the tools server — ships UNBUILT (Node strips the types)
│   │   ├── launch.mjs                     what .mcp.json runs; resolves the staged copy
│   │   ├── server/index.ts                the three tools + the transcript resource
│   │   ├── server/lifecycle.ts            start / poll / cancel, one-in-flight, the deadline
│   │   ├── server/review-state.ts         the record, the reducer, the published projection
│   │   ├── server/{agent,scripted}-backend.ts  the real review, and the shipped test double
│   │   ├── server/{backend,store,config,env-file}.ts
│   │   └── package.json · tsconfig.json · eslint.config.js
│   ├── hooks/install-mcp-server.sh        SessionStart: install deps, republish source every session
│   └── .mcp.json                          wires userConfig → the server's environment
├── .claude-plugin/marketplace.json      the marketplace entry (git-subdir → plugin/)
├── CONTEXT.md                           the glossary / ubiquitous language
├── docs/
│   ├── adrs/                              architectural decisions (empty today)
│   ├── specs/<slug>/                      specs and tickets for work on THIS repo
│   └── agents/                            how the contributor skills behave here
│       ├── issue-tracker.md                → local markdown under docs/specs/, never gh issue
│       ├── triage-labels.md                → the five Status: values
│       └── domain.md                       → single-context: CONTEXT.md + docs/adrs/
├── hacks/claude.dockerfile              the pinned image
├── claude                               the wrapper
├── .claude/settings.json                model opus[1m], effort xhigh, enabled plugins, bypassPermissions
├── .claude/CLAUDE.md                    project instructions
├── .claude/skills/                      repo-local skills
└── .github/workflows/ci.yml             typecheck + lint
```

## The contribution flow

Run these in order, in a `./claude` session. Each one is a slash command; each hands the next one its input.

### 0. Setup — already done

`/mattpocock-skills:setup-matt-pocock-skills` records where issues live and what the triage vocabulary is. It has
already been run: the answers are the three files in `docs/agents/`. Don't re-run it unless you are deliberately
changing those conventions.

### 1. `/mattpocock-skills:grill-with-docs <your idea>`

A relentless interview that sharpens the idea until no decision is left silently assumed. **Stay in the room** — this is
the only stage that needs you, and the decisions are yours.

It runs `/grilling` with `/domain-modeling` alongside, so new terms land in `CONTEXT.md` and hard, surprising,
genuinely-traded-off decisions land in `docs/adrs/` as they crystallise rather than afterwards.

You are done when the frontier of open questions is empty and you agree you have a shared understanding.

### 2. `/mattpocock-skills:to-spec`

Synthesises the conversation into a spec — no second interview — and publishes it to
`docs/specs/<feature-slug>/spec.md` carrying `Status: ready-for-agent`. The spec is the record from here on: it states
the problem, the solution, an extensive numbered list of user stories, the settled decisions, the testing seams, and
every fork left open for a human.

### 3. `/mattpocock-skills:to-tickets`

Cuts the spec into **tracer-bullet vertical slices** — each a narrow but complete path through every layer, sized for a
single fresh context — and publishes one file per ticket at `docs/specs/<feature-slug>/issues/NN-<slug>.md`, numbered
from `01`, each declaring its `Blocked by:` edges. Prefactoring gets tickets of its own and lands first.

### 4. `/mattpocock-skills:implement <spec or ticket path>`

Implements the work, using `/tdd` at the seams the spec named. Work one ticket at a time, in dependency order.

### House conventions

- **Use the glossary's words.** If a term you need is missing from `CONTEXT.md`, that is a signal: either you are
  inventing language the project doesn't use, or there is a real gap worth running `/mattpocock-skills:domain-modeling`
  over.
- **Wrapping.** Server TypeScript wraps at ~100 columns, markdown at 120. Nothing enforces this — keep it by hand.
- **Commit messages are plain imperative subjects.** This repo does **not** use the `Ticket:` / `Assumptions:` commit
  format. That is a convention the plugin imposes on repositories it delivers into, not one we follow here.
- **ADRs are rare.** Only when a decision is hard to reverse, surprising without context, *and* the result of a real
  trade-off. Miss any of the three and skip it.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on every pull request. One job, `check`, entirely inside
`plugin/mcp`:

| Step                | What and why                                                                                |
|---------------------|---------------------------------------------------------------------------------------------|
| `setup-node`        | pinned to **24.19.0** — the dockerfile's `NODE_VERSION`, so green in CI means green locally |
| `npm ci`            | **with** dev dependencies, unlike the install hook's `--omit=dev`: the linter is a dev dep  |
| `npm run typecheck` | `tsc --noEmit` — the only thing that ever reads `tsconfig.json`                             |
| `npm run lint`      | `eslint .`, guarded by `if: '!cancelled()'` so a type error cannot hide lint findings       |

The typecheck matters more than it looks. The server **ships unbuilt** — Node strips the types at runtime — so there is
no build step to catch anything. `tsc` is what enforces `erasableSyntaxOnly` and `verbatimModuleSyntax`, and without it
those failures surface only when Node's type stripping hits them in a user's session.

Superseded runs are cancelled per branch; `main` is exempt (its concurrency group includes the run id) because its runs
are the record of what each commit did.

### What CI does not check

Know this before you rely on a green tick:

- **There is no test suite.** `package.json` has exactly two scripts: `lint` and `typecheck`.
- **No markdown is checked.** The skills, the agents, `README.md` and `CONTEXT.md` are the bulk of the product and
  nothing lints, wraps or spell-checks them.
- **Nothing runs the server, the launcher, or the SessionStart hook.** No manifest is validated against its `$schema`
  either.

So behaviour is verified by hand. The **scripted backend** exists for exactly this: it replays a canned event timeline
in milliseconds, so you can exercise the whole lifecycle — cancellation, ordering, terminal absorption, the deadline —
with no model, no forge and no money.

```
printf 'ANTHROPIC_API_KEY=not-a-real-key\n' > /tmp/review.env
DELIVERER_REVIEW_BACKEND=scripted \
DELIVERER_CODE_REVIEW_CLAUDE_ENV_FILE=/tmp/review.env \
  node plugin/mcp/server/index.ts
```

That speaks JSON-RPC on stdio, so drive it with an MCP stdio client rather than by typing. Two things to know: the
environment file is **required even scripted** (its absence is refused at `code_review_start` on purpose — a review with
no configured identity must never run), and `DELIVERER_REVIEW_SCRIPT` takes JSON
(`{"events":[{"afterMs":10,"kind":"completed",…}]}`) if you need a timeline other than the default happy path, such as a
failed or cancelled round.

## Shipping

`.claude-plugin/marketplace.json` publishes the `plugin/` subdirectory of this repository. There is no build, no
artifact and no release step, and `plugin.json` carries no version field.

**What lands on `main` is what users get on their next plugin update.** A change inside `plugin/` is live to them on
merge; a change anywhere else never reaches them at all.
