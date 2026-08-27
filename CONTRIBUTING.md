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
│   ├── .claude-plugin/plugin.json         manifest: name, mattpocock-skills dependency, 4 userConfig options
│   ├── skills/{refine,build}/SKILL.md     the two commands
│   ├── agents/                            the seven dispatched agents
│   │   ├── spec-writer.md                 brief   → published spec
│   │   ├── tickets-writer.md              spec    → one ticket per vertical slice
│   │   ├── implementer.md                 ticket  → commits on the epic branch
│   │   ├── change-request-creator.md      branch  → draft change request + ASSUMPTION comments
│   │   ├── assumption-reviewer.md         assumption → accept / override / escalate
│   │   ├── code-reviewer.md               drives one review round via the MCP server
│   │   └── comments-addresser.md          unresolved comments → fixes, declines, hand-offs
│   ├── mcp/                               the plugin's Node code, one package — ships UNBUILT (Node strips
│   │                                      the types). What it holds today: the tools server, and the
│   │                                      observer — its distiller, its debrief and the process that
│   │                                      watches a live run
│   │   ├── launch.mjs                     what .mcp.json runs; resolves the staged copy, starts the
│   │   │                                  install hook when nothing else has
│   │   ├── observe.mjs                    the observer's entry point, beside the server's: what the
│   │   │                                  prompt hook spawns; detaches, stands in the data directory,
│   │   │                                  waits for the install and imports the staged copy
│   │   ├── server/index.ts                the three tools + the transcript resource
│   │   ├── server/lifecycle.ts            start / poll / cancel, one-in-flight, the deadline
│   │   ├── server/review-state.ts         the record, the reducer, the published projection
│   │   ├── server/{agent,scripted}-backend.ts  the real review, and the shipped test double
│   │   ├── server/{backend,store,config,env-file}.ts
│   │   ├── observer/distil.ts             a run's records → its trace; run by hand, CLAUDE_PLUGIN_DATA
│   │   │                                  required, no host and no model in play
│   │   ├── observer/{records,trace,trace-file}.ts  the host's format as a claim · the trace · where it
│   │   │                                  lives and how it refuses forwarding
│   │   ├── observer/debrief.ts            replay: a run's records → its debrief, beside that run's
│   │   │                                  trace; the observer's cheap by-hand seam
│   │   ├── observer/{run-facts,debrief-file,plugin-commit}.ts  the run's extent and every figure
│   │   │                                  bounded by it · the debrief and the identity file beside
│   │   │                                  it · which plugin the run used
│   │   ├── observer/{observer,announce}.ts  the loop that watches a live run and finalises its
│   │   │                                  debrief · the two lines to the human, and the files the
│   │   │                                  hooks read them out of
│   │   └── package.json · tsconfig.json · eslint.config.js
│   ├── hooks/install-mcp-server.sh        SessionStart: install deps, republish both source trees
│   ├── hooks/observe-run.sh               UserPromptSubmit / Stop / SessionEnd: start an observer,
│   │                                      name a debrief, signal the finalise; reads the switch from
│   │                                      CLAUDE_PLUGIN_OPTION_OBSERVE_RUNS and never ${user_config.*}
│   └── .mcp.json                          wires userConfig → the server's environment
├── .claude-plugin/marketplace.json      the marketplace entry (git-subdir → plugin/)
├── CONTEXT.md                           the glossary / ubiquitous language
├── docs/
│   ├── adrs/                              architectural decisions — eighteen, all on the plugin itself
│   ├── specs/<slug>/                      specs and tickets for work on THIS repo
│   └── agents/                            how the contributor skills behave here
│       ├── issue-tracker.md                → local markdown under docs/specs/, never gh issue
│       ├── triage-labels.md                → the five Status: values
│       └── domain.md                       → single-context: CONTEXT.md + docs/adrs/
├── e2e-tests/                           the end-to-end harness — installs the plugin, drives whole runs
│   ├── README.md                          what a run costs per stage, and how to work that out from its records
│   ├── harness/                           the run directory, the staged copy, the builder and the matchers
│   ├── fixtures/typescript-library/       the repository a run is driven against, its brief and its epic
│   └── tests/                             three tests; CI never runs them, two spend real money
├── hacks/claude.dockerfile              the pinned image
├── claude                               the wrapper
├── .claude/settings.json                model opus[1m], effort xhigh, enabled plugins, bypassPermissions
├── .claude/CLAUDE.md                    project instructions
├── .claude/skills/                      repo-local skills
└── .github/workflows/ci.yml             typecheck + lint over both packages; never the tests
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

`.github/workflows/ci.yml` runs on pushes to `main` and on every change request. One job, `check`, over both packages
this repository has: the plugin's Node code in `plugin/mcp` — today, the tools server and the **observer**, which
distils a **run**'s records, writes its **debrief** and watches a live run to its end — and the end-to-end **harness**
in `e2e-tests`. One `setup-node`, then the other three steps once for each package:

| Step                | What and why                                                                                |
|---------------------|---------------------------------------------------------------------------------------------|
| `setup-node`        | pinned to **24.19.0** — the dockerfile's `NODE_VERSION`, so green in CI means green locally |
| `npm ci`            | **with** dev dependencies, unlike the install hook's `--omit=dev`: the linter is a dev dep  |
| `npm run typecheck` | `tsc --noEmit` — the only thing that ever reads either `tsconfig.json`                      |
| `npm run lint`      | `eslint .`, guarded by `if: '!cancelled()'` so one failure cannot hide another's findings   |

Its dependency cache is keyed on both lockfiles, and every step names its own working directory while the job sets no
default. That default used to be `plugin/mcp`, which is how a harness step appended without one would have checked the
server a second time and gone green — the failure that looks exactly like a harness that passes. From the server's lint
onwards every step carries `!cancelled()`, so a failure in one package never decides whether the other was checked.

The typecheck matters more than it looks. The server **ships unbuilt** — Node strips the types at runtime — so there is
no build step to catch anything. `tsc` is what enforces `erasableSyntaxOnly` and `verbatimModuleSyntax`, and without it
those failures surface only when Node's type stripping hits them in a user's session. The harness runs unbuilt the same
way and is held to the same three options, so that one step is equally all that stands between it and a test that dies
parsing itself.

**CI never runs the end-to-end tests**, and § The end-to-end tests below says what running them takes. They install the
plugin, create repositories on the forge and spend real money, so nothing here adds a paid job, a schedule, or a button
on the forge that starts one — and no credential of any kind is a repository secret. Typechecking and linting the
harness is what keeps it from rotting between the rare occasions anybody runs it.

Superseded runs are cancelled per branch; `main` is exempt (its concurrency group includes the run id) because its runs
are the record of what each commit did.

### What CI does not check

Know this before you rely on a green tick:

- **The tests exist and CI runs none of them.** `e2e-tests/` drives whole `/deliverer:refine` and `/deliverer:build`
  **runs**, and CI typechecks and lints that harness without ever running it — a run spends real money, so somebody
  has to mean it. Nothing else has tests at all: `plugin/mcp/package.json` has exactly two scripts, `lint` and
  `typecheck`.
- **No markdown is checked.** The skills, the agents, `README.md` and `CONTEXT.md` are the bulk of the product and
  nothing lints, wraps or spell-checks them.
- **Nothing in CI runs the server, either launcher, or any of the four hook events.** `SessionStart` installs and
  publishes; `UserPromptSubmit`, `Stop` and `SessionEnd` are the **observer**'s. No manifest is validated against its
  `$schema` either.

So behaviour is verified deliberately: by hand with the three procedures below, or in one command by the end-to-end
tests after them, which spend real money every time. The **scripted backend** is what makes the by-hand route cheap: it
replays a canned event timeline in milliseconds, so you can exercise the whole lifecycle — cancellation, ordering,
terminal absorption, the deadline — with no model, no forge and no money.

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

### Replaying a run's records

The **observer** has a by-hand route of exactly the same shape, and **replay** is what makes it cheap: point it at a
session record the host has already written and it produces that **run**'s **trace** and its **debrief**. With nothing
judging — which is all there is today — it calls no model, reaches no forge and spends nothing, and the same records
give the same debrief byte for byte.

```
CLAUDE_PLUGIN_DATA=$(mktemp -d) \
  node plugin/mcp/observer/debrief.ts ~/.claude/projects/<munged-cwd>/<session-id>.jsonl
```

**What it needs** is a record of a run of your own — they are under `~/.claude/projects/`, one `<session-id>.jsonl` per
session with a directory of per-**dispatch** records beside it — and `CLAUDE_PLUGIN_DATA`, which is required and has no
default. Point that at a throwaway directory to keep the output out of your own, or at
`~/.claude/plugins/data/deliverer-<marketplace>/` to write exactly where the plugin itself would.
`plugin/mcp/observer/distil.ts` takes the same argument and stops after the trace.

One line of output and three exit codes: `0` with the debrief's path, `2` with why this record holds no run (a session
that merely names the plugin is not one, and several on any machine do), `1` with what could not be read.

**What to read in what it leaves behind**, all of it in `<data>/observations/<slug>/<the run's first timestamp>/`:

- **`debrief.md`** — the document, and the only one of the three that is ever sent anywhere. Its header is the point:
  the run's own wall clock, its dispatch count, its **round**s and the word each one ended on, how the run itself
  ended, its **spend**, what the observation cost, and the plugin commit the run used. With nothing judging it carries
  no **defect**s and one line saying what stopped the judging.
- **`DO-NOT-FORWARD-trace.txt`** — every entry of the run in order, which is where a figure in the debrief is checked.
- **`DO-NOT-FORWARD-identity.txt`** — which run and which repository that debrief is about, for the observer of a later
  run of the same epic. Neither of these two is the document to send.

Nothing already there is rewritten: a second replay of one run lands beside the first as `debrief-2.md`, byte for byte
identical to it. The cases worth walking after any change to the observer, each of which reads differently: a delivery
and a refinement, a run that stopped mid-stage (the header names the stage), a session that carried unrelated work
after its run (the header says how many of its entries lie outside), and a record you have truncated or corrupted by
hand — that last one has to say what was lost rather than read as a run with nothing wrong with it.

### Exercising the install by hand

`launch.mjs` is the other piece nothing runs for you, and it decides whether a session has a review tool at all. Point
it at a throwaway data directory and it behaves exactly as it does under the host:

```
CLAUDE_PLUGIN_DATA=$(mktemp -d) node plugin/mcp/launch.mjs < /dev/null
```

Empty, that installs the dependencies, publishes the source and starts the server. The states worth walking after any
change to the launcher or the hook, each of which reports differently: an install already present (starts at once), one
still running when the wait runs out (`DELIVERER_REVIEW_INSTALL_WAIT_MS=1000` against an empty directory), one that runs
and fails (`PATH` without `npm`), a hook that cannot be started (`chmod -x` it — the launcher retries through `bash`,
which is the only recovery from an install that dropped the executable bit), and the launcher's own installer switched
off (`DELIVERER_REVIEW_SELF_INSTALL=0`, which is also what keeps a caller that must not install from starting a real
`npm ci`).

Two launchers and a hook against one empty data directory is the case the install's lock exists for, and it is worth
re-running whenever either side of it moves: exactly one `npm ci`, one stamp, no `ERR_MODULE_NOT_FOUND` and no lock left
behind.

### The end-to-end tests

`e2e-tests/` is the **harness**: it installs the plugin the way a user does — from a **staged copy** of your working
tree, so a test covers what is in front of you rather than what is on the branch — and drives whole **runs** against it.
It is the automated counterpart to the two procedures above, at a much higher seam: nothing is asserted below a complete
run, only what a human could read afterwards. Three tests, and CI runs none of them:

- **The installation smoke test.** One command and, in seconds, you know the plugin still installs and still presents
  both commands, all seven agents and all three review tools. No repository on the forge and no model asked for more
  than one trivial turn — cheap enough to run after any change to a manifest, the hook or the launcher.
- **The refine happy path.** `/deliverer:refine` against a **standing repo**, with a **responder** answering the
  grilling in your place out of the **fixture**'s own **brief**. It asserts a published **spec** and one file per
  **ticket**, and then a **verifier** judges whether what came out is any good.
- **The build happy path.** `/deliverer:build` against a **throwaway repo** created for the run: all seven stages, two
  real **rounds** through the tools server and both **fix waves**. It asserts a commit naming every ticket, a
  **verdict** on every **assumption**, and the **change request** **flipped ready** with its **checks** green — then
  the verifier judges the code behind it against the **epic**.

**What they take and spend, measured rather than estimated.** The refinement took **21m 52s and $6.36** — the run
itself 20m 12s and $5.82, the responder $0.16 across six rounds of questions, the verifier $0.39 — and published a spec
and six tickets. The delivery was measured twice: **23m 12s and $7.40**, then **22m 14s and $6.85**, each flipping its
change request ready with green checks. Run together, which is what `npm test` does, the whole suite took **23m**, and
the two runs with their verdicts came to **$13.28**, then **$13.14** — the two long tests overlap, so the suite is the
slower of them plus a rounding error. The smoke test is seconds and effectively free.

Those are the figures the harness reports, which are the **orchestrator** and its **dispatches** and nothing else — a
delivery's **rounds** run as their own processes and their **spend** is not in them. `e2e-tests/README.md` breaks a
measured pair of runs down per stage, says what the reported figure leaves out, and gives the method for doing it
again from any **run directory**.

**The ceilings.** A run may take **ninety minutes** and spend **twenty-five dollars**: `DEFAULT_CEILINGS` in
`e2e-tests/harness/ceilings.ts`, overridable per test. Neither has been raised — the longest run measured took 21m 23s
and the most expensive spent $6.96, so both figures are still the spec's own estimates. Reaching one is reported as a
ceiling rather than as a failed assertion, so a slow run can be told from a stuck one. What would move them is a bigger
**fixture**: this one's tickets are three functions with unit tests, and a fixture with a service in it would be felt
here first.

**What they need.** The `./claude` container has all of it already, which is where to run them from:

- **`.env` at the repository root**, the same file the wrapper loads. It is handed to every session whole and no
  individual credential is read out of it, so it works whichever way you authenticate to a model.
- **A forge token `gh` can see.** `gh` and `git` are run with the environment the harness inherited rather than with
  that file, so `GITHUB_TOKEN` has to be exported — which is what `./claude` does with the line already in your `.env`.
- **Permission to create private repositories**, and to delete them for the build test. A deletion the harness cannot
  make is reported and leaves the repository standing, never a test that had otherwise passed turned red.
- **Node, `git`, `gh` and the Claude CLI** — the versions the dockerfile pins; the plugin is installed with the same
  binary you would install it with. The harness runs unbuilt under Node's type stripping, so its manifest asks for
  `^22.18.0 || >=23.6.0`.
- **Disk**: roughly 350 MB per run under the operating system's temporary directory, nearly all of it the tools
  server's installed dependencies and the official marketplace's clone. Nothing is cleaned up.

**Two host settings they set for themselves.** A **run** needs Claude Code's todo tools on and its experimental agent
teams off — the two settings the README asks a user for — so `HOST_SETTINGS` in `e2e-tests/harness/run-directory.ts`
pins both above the environment file and above your shell, rather than hoping they arrive. They would not: the todo
tools are off by default, and this repository's own `.claude/settings.json` turns agent teams **on** for the
contribution flow and Claude Code passes that to every command a session runs, so `npm test` from inside a contribution
session would hand a run exactly the pair of values it must not have.

One thing they deliberately do **not** take is the **scripted backend**. `DELIVERER_REVIEW_BACKEND` and
`DELIVERER_REVIEW_SCRIPT` are stripped from every process a run starts, so the variable the section above taught you to
set cannot reach a delivery and leave every stage passing having reviewed nothing.

**How to run them.**

```
cd e2e-tests
npm ci
npm test                                       # all three, concurrently, with no retries
node --test tests/installation-smoke.test.ts   # one of them: here, the cheap one
```

**What a run leaves behind.** Each test makes a **run directory** under the operating system's temporary directory, at
`deliverer-e2e/<test>-<timestamp>-<suffix>/`, and prints its path as its first diagnostic — a failing run is read there
rather than reproduced. Nothing in it is ever removed, passed or failed:

- `config/` — the run's own `CLAUDE_CONFIG_DIR`: both marketplaces, the install, the plugin's three options at user
  scope, and under `projects/` the session records of every dispatched agent, not only the orchestrator's.
- `clone/` — the working tree the run published into: a refinement's whole **epic**, or a delivery's commits.
- `staged-plugin/` and `fixture-repo/` — the copy of the plugin that was installed, and the fixture as it was built
  into a repository before the forge was brought into step with it.
- `tmp/` and `session/` — the run's own temporary directory, and where a session with no clone runs.
- the root itself — the **brief** the run wrote, collected out of the shared temporary directory when it finished, and
  `delivered.diff`, the diff a delivery's change request carried.

On the forge, the refine test's **standing repo** stays — it is cloned and never written back to, so it is brought into
step with the fixture rather than recreated. The build test's **throwaway repo** is deleted when the test passes and
left standing, with its branch and change request, when it fails: the change request is the evidence.

## Shipping

`.claude-plugin/marketplace.json` publishes the `plugin/` subdirectory of this repository. There is no build, no
artifact and no release step, and `plugin.json` carries no version field.

**What lands on `main` is what users get on their next plugin update.** A change inside `plugin/` is live to them on
merge; a change anywhere else never reaches them at all.
