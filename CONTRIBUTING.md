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
│   │   ├── assumption-reviewer.md         assumption → accept / improve / override / escalate
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
│   │   ├── observer/continuity.ts         the earlier debriefs of this epic, read for the one
│   │   │                                  synthesis: only the same repository's, newest per run,
│   │   │                                  never an earlier run's trace or notes
│   │   ├── observer/{judge,notes,notes-file,model-call}.ts  the judging half: one long-context
│   │   │                                  reading of a whole run · a dispatch note per dispatch, on
│   │   │                                  a cheap tier as each lands · where those notes live and
│   │   │                                  how they refuse forwarding · what one model call the
│   │   │                                  observation makes looks like, shared by both tiers
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
  `typecheck`. The **observer** is no exception — no runner, no fixture and nothing recorded stands behind it, and
  § Replaying a run's records below is the whole of how it is checked.
- **No markdown is checked.** The skills, the agents, `README.md` and `CONTEXT.md` are the bulk of the product and
  nothing lints, wraps or spell-checks them.
- **Nothing in CI runs the server, either launcher, or any of the four hook events.** `SessionStart` installs and
  publishes; `UserPromptSubmit`, `Stop` and `SessionEnd` are the **observer**'s. No manifest is validated against its
  `$schema` either.

So behaviour is verified deliberately: by hand with the three procedures below — the server's, the **observer**'s and
the launcher's — or in one command by the end-to-end tests after them, which spend real money every time. The
**scripted backend** is what makes the server's half of that cheap: it replays a canned event timeline in
milliseconds, so you can exercise the whole lifecycle — cancellation, ordering, terminal absorption, the deadline —
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

### Replaying a run's records

The **observer** has a by-hand route of exactly the same shape, and **replay** is what makes it cheap: point it at a
session record the host has already written and it produces that **run**'s **trace** and its **debrief**. It comes in
two forms, and they answer two different questions.

**The observer is verified by hand, and this section is how.** CI runs none of it. The one automated check standing
above it is in the two paid end-to-end tests, which assert that a debrief exists for the run they drove and that its
header names it — that one appeared, and nothing at all about whether it is right.

**With nothing judging, replay is free.** It calls no model, reaches no forge and spends nothing; the same records
give the same debrief byte for byte, and no **dispatch note** is written at all. This is the form the mechanical half
is verified at — the distillation, the header, every figure in it, the files — and what it answers is whether that
half still holds.

```
CLAUDE_PLUGIN_DATA=$(mktemp -d) \
  node plugin/mcp/observer/debrief.ts ~/.claude/projects/<munged-cwd>/<session-id>.jsonl
```

**What it needs** is a record of a run of your own — they are under `~/.claude/projects/`, one `<session-id>.jsonl` per
session with a directory of per-**dispatch** records beside it — and `CLAUDE_PLUGIN_DATA`, which is required and has no
default. Point that at a throwaway directory to keep the output out of your own, or at
`~/.claude/plugins/data/deliverer-<marketplace>/` to write exactly where the plugin itself would.
`plugin/mcp/observer/distil.ts` takes the same argument and stops after the trace.

Three exit codes, and a first line that names what was written: `0` with the debrief's path, and under it what the
judging half did and where the trace and the **identity file** went; `2` with why this record holds no run (a session
that merely names the plugin is not one, and several on any machine do), `1` with what could not be read.

**A prefix of a record is a reading taken mid-run, and it is the only cheap way to see one.** A whole record already
carries the run's ending, so replaying one shows the reading that works and none of the readings that go wrong: the
**extent** the observer settled on while the run was still delegating, the finalise it made while a human was still
thinking about a question, and any cross-check that fires on a reading disagreeing with what is on disk are all states
the observer was in *during* the run. Keeping the first N entries of a copy reproduces exactly what it saw at entry N,
and it costs what the form above costs — no model, no forge, nothing spent.

```
record=~/.claude/projects/<munged-cwd>/<session-id>.jsonl   # a run of your own
entries=268                                                 # where to cut it
id=$(basename "$record" .jsonl) && copy=$(mktemp -d)
head -n "$entries" "$record" > "$copy/$id.jsonl"
mkdir -p "$copy/$id" && cp -r "$(dirname "$record")/$id/subagents" "$copy/$id/"
CLAUDE_PLUGIN_DATA=$(mktemp -d) node plugin/mcp/observer/debrief.ts "$copy/$id.jsonl"
```

One entry is one line, so `head` cuts at an entry boundary — this is not the corrupted record the cases below end with,
which stops mid-line and has to say what it lost.

**The host's layout is what the copy has to preserve, and it is the one thing a copy gets wrong.**
`plugin/mcp/observer/records.ts` finds a **dispatch**'s own record by path and by nothing else: the copy has to be named
`<session-id>.jsonl` with a `<session-id>/subagents/` directory beside it holding each `agent-<id>.jsonl` and its
`agent-<id>.meta.json` sidecar, which is what the `basename`, the `mkdir` and the `cp` above are between them for. A
prefix dropped somewhere flat has no dispatches at all, and that reads as a defect in the reading rather than as a
broken copy.

**Leaving the `cp` line out asks for a reading from before any stage landed** — a legitimate thing to want, and one to
ask for deliberately rather than by accident. A dispatch's record is a whole file that a prefix of the session's record
does not cut, so a copy keeping the directory keeps every stage the run ever ran, however early the cut. On the record
this procedure was written against, a 268-entry prefix copied flat reads `1m38s · 0 dispatches · 1 question round`,
while the same prefix with the directory beside it reads `3h46m · 2 dispatches` against that same one question round —
the wall clock coming off the dispatch records' own entries while the extent stays where it froze. Both are real
shapes: the second is what a reading that disagrees with the disk looks like, and the first is the run before it
delegated anything.

**Determinism survives all of it**, because a prefix is a record like any other: replay one twice into one
`CLAUDE_PLUGIN_DATA` and `debrief-2.md` is byte for byte identical to `debrief.md`, exactly as it is for a whole record.

**No run's records are checked into this repository, and none is going to be.** Every record this procedure wants is a
run of somebody's own, and it carries the repository it ran in, the absolute paths on that machine, the username inside
each of them and every word the human typed — which is what makes a **trace** refuse forwarding in the first place. So
there is no fixture here: what you replay is a run of your own, or a synthetic record you wrote for the shape you are
walking, and the copies either one leaves behind belong in a `mktemp -d` rather than in the tree.

**With `--judge`, the same command runs the judging half**, which nothing else exercises: one cheap-tier call per
**dispatch** as each is read from the inside, and one long-context synthesis over the whole run — thirteen-plus calls
for a delivery. What it answers is the only question worth asking of that half: whether the observer finds what you
found by hand in a run you remember.

```
CLAUDE_PLUGIN_DATA=$(mktemp -d) \
CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE=$PWD/.env \
  node plugin/mcp/observer/debrief.ts --judge ~/.claude/projects/<munged-cwd>/<session-id>.jsonl
```

**The credentials come from the file that variable names, and from nothing else.** One **environment file** the owner
names authenticates every model call the plugin makes — each **round**'s review and every call an observation makes
alike, per ADR-0009 — and the observation reads its path from the host's own
`CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE`, which is the second line above and is the same variable a live
observer is handed. So the shell you replay from needs to carry no credential of its own: name the repository's own
`.env`, the one `./claude` already loads, and the judged run authenticates as that file does. The free form takes
none of it — no variable, no model, no spend. Replay's own output is how you check that the file you named is the file
that was read: under the line saying what the judging did it prints an `environment:` line naming that path, or saying
it inherited and why. And a judged replay cannot reproduce byte for byte — determinism is the free form's claim and
only the free form's.

**Four credential shapes, and the artefact that answers each.** Change what the variable names and read the answer in
what the run left behind rather than in the observer's internals:

- **a file assigning a real credential** — `debrief.md` carries the **defect**s, its header has the notes line, its
  cost line attributes the spend to the identity the option names, and `DO-NOT-FORWARD-notes.txt` holds one
  **dispatch note** per dispatch. This is the shape the costs below were measured on;
- **a file assigning a bogus credential** — `debrief.md` says once, where its defects belong, that no credential
  reached the observation, naming the option and that the file it named was read and used. Exactly one model call is
  attempted and no synthesis is: the notes file holds that one dispatch's `NO NOTE` saying the judging stopped there,
  and the header's notes figure says the same rather than counting dispatches nobody called for. Two things about
  getting there. The file is layered OVER your shell's environment rather than replacing it, so assign the bogus value
  to the very variable your shell authenticates with, or replay from a shell carrying nothing — a bogus
  `ANTHROPIC_API_KEY` beside an inherited working token authenticates perfectly well, and you will have paid for the
  first shape by accident. And this shape needs a provider that refuses the credential as a login: measured against a
  gateway, a bad token came back as an answer in no instructed shape at all, which is a failed note per dispatch and a
  malformed synthesis, not the one credential statement;
- **an unreadable or malformed file**, or one that assigns nothing at all — the same one statement, worded for a named
  source that could not be used: it gives a line number or the errno code and never a value, and says the observation
  ran on the environment it inherited instead. Replay's `environment:` line says `inherited` with the same reason;
- **no variable at all** — that same fallback, worded for a source nobody named. From a plain container shell both
  fallback shapes then end in `not_logged_in` too, since the shell authenticates nothing either; from a terminal
  carrying a credential they are how you see the inherited path still work.

**What it costs, and how little that rests on.** Measured all in — the notes and the one synthesis together — a judged
refinement is **$3.18–$3.48** and a judged delivery **about $6.70**. That is four readings of three runs: three of two
refinements (three and four dispatches), one of a single thirteen-dispatch delivery. The notes are roughly **$0.40**
of a refinement and **$1.30** of that delivery, at about ten cents a dispatch. Two things to know before quoting any
of it: the same delivery came to **$5.52** before the notes were widened to re-read each dispatch's own record, so
figures from before that are not comparable; and the whole measurement is replays on one machine, priced from what the
calls themselves reported. It is an order of magnitude and not a price list — `README.md` and `e2e-tests/README.md`
carry the same two numbers and nothing further.

**Continuity takes two runs of one epic, replayed in order.** The earlier debriefs a run reads are the ones already
in the same data directory, under the same **slug**, matched on the identity file beside each — so it is exercised by
pointing both replays at ONE `CLAUDE_PLUGIN_DATA`, the earlier run first. Only the later one need carry `--judge`,
since all the first has to leave behind is a debrief and its identity file, which the free form writes. The judged
replay's own output says how many earlier debriefs it read, how many it could not, and how many were another
repository's epic of the same name. Judged both times, the cheapest real pair on the records this was measured
against came to about **$9.40**.

**What to read in what it leaves behind**, all of it in `<data>/observations/<slug>/<the run's first timestamp>/`:

- **`debrief.md`** — the document, and the only file here that is ever sent anywhere. Its header is the point: the
  skill, the epic's slug, the run's own wall clock, its dispatch count, its **round**s and the word each one ended on,
  how the run itself ended, its **spend**, what the observation cost, and the plugin commit the run used — then the
  **defect**s with their **grounds**, the **hunch**es under them, and a footer naming where to send it. With nothing
  judging it carries the header and the facts, and one line saying what stopped the judging; judged, its header gains
  a line for the notes and, where the epic had earlier runs, the document gains what the reading had of them.
- **`DO-NOT-FORWARD-trace.txt`** — every entry of the run in order, which is where a figure in the debrief is checked.
  It refuses forwarding twice, in its file name and in its first line, because it is bounded by nothing at all.
- **`DO-NOT-FORWARD-notes.txt`** — one **dispatch note** per dispatch, appended as each one lands, refusing forwarding
  the same two ways. Written on the judged path only: with nothing judging there is no notes file at all.
- **`DO-NOT-FORWARD-identity.txt`** — the run's key (its slug and its first timestamp), the skill, the repository it
  ran in, the plugin commit and a `finalised` flag. It is what a later run of the same epic matches its earlier
  debriefs on, and it names the repository the run delivered into, which the debrief never does — so it refuses
  forwarding too, and no debrief ever mentions it. Paths on this machine are not the difference between the two: a
  debrief prints its own trace's path, its notes' path and the installed plugin's.
- **the earlier debriefs of the same slug**, in the sibling directories beside this one — what a judged run read of
  the runs before it, whole and oldest first, and never their traces and never their notes. The debrief's continuity
  section says how many it had. Nothing prints there where nothing judged: it read nothing because nothing read
  anything.

**Read every debrief for what it must not carry.** ADR-0018 holds that bound by instruction alone — no code redacts
anything, and no second reader checks the first — so the human replaying is the check. Verifying this epic found
three real leaks that had reached a debrief and closed each in the instruction: a repository's own directory name
quoted out of `git status`, the human's word "continue", and a question round's headers carrying a product name and a
command-line flag. That last one no paid run has exercised since, which makes it the first thing to look for on the
next one. The read is checkable rather than heroic — sweep the fenced quotations with
``grep -oE '`[^`]+`' debrief.md`` and account for every one, then sweep for the names of technologies the delivered
repository uses and the plugin does not. That is your own checklist and not a second reader, so it takes nothing away
from ADR-0018.

Nothing already there is rewritten: a second replay of one run lands beside the first as `debrief-2.md`, byte for byte
identical to it where nothing judged. The cases worth walking after any change to the observer, each of which reads
differently: a delivery and a refinement, a run that stopped mid-stage (the header names the stage), a run whose task
list was laid out and never updated (the header says **stopped**, because nothing there ended anything), a session that
carried unrelated work after its run (the header says how many of its entries lie outside, and none of that work is in
the wall clock, the dispatch count or the time the run spent waiting), a session that ran **two** runs (the debrief is
about the first, and a loss says the second is outside it), and a record you have truncated or corrupted by hand — that
last one has to say what was lost rather than read as a run with nothing wrong with it. A synthetic record hand-written
to one of those shapes is a legitimate way to walk one: replay needs no host, and the shapes above are a few dozen
lines of JSONL each.

**The hook states worth walking.** Replay reaches everything the observer does with a record already on disk; what it
cannot reach is the decision that there is a run to observe at all, which is `hooks/observe-run.sh`'s and the live
loop's. Walk these after any change to either, each with what it should do:

- **a session with no run in it** — nothing starts: no process, no marker under `observations/.sessions/`, no trace.
  This is every session of every other project on the machine, so it also has to cost nothing;
- **a `/deliverer:` command typed** — an observer starts on that prompt, and no later prompt of that session is
  scanned again;
- **a run resumed by prose in a fresh session** — an observer starts on attribution instead, off the plugin's own
  stamp in the session's record;
- **a run that finished while its session stays open** — nothing is finalised and nothing is announced: the debrief
  goes on being rewritten, and the line waits for one of the finalisers below. What a run's records say about how it
  ended is a reading rather than a signal — nothing about a task list forbids a run passing through "every stage
  completed, last word prose" between two stages — so the observer has three finalisers, the session's end, the idle
  bound and the ceiling on one **waiting** run's wait, and no fourth;
- **a session ended mid-run** — `SessionEnd` signals and never finalises anything itself; the observer picks the
  signal up on its next tick and finalises the debrief;
- **a terminal killed**, with no `SessionEnd` to be had — the idle bound finalises it, and the line naming the debrief
  waits for the next prompt of any session;
- **a question on screen and nobody answering** — a run **waiting** is not that killed terminal, and the two are the
  same silence on disk, so the idle bound does not fire while the run's own last act is an unanswered
  `AskUserQuestion`: the debrief keeps being rewritten, nothing is announced, and answering carries the run and its
  debrief on. Walk it by cutting a record to a prefix that ends on the question and appending the answer under the
  watcher;
- **a terminal killed with a question on screen** — the wait's own ceiling finalises it, twelve hours after the
  question was asked rather than after the watcher started, with a marker saying so rather than claiming silence, and
  then the watcher stops by itself;
- **a record that stops being readable after a debrief was written** — move or `chmod` it and leave it that way. The
  patience bounds the wait: the observer announces the debrief already on disk and stops, rather than ticking for the
  rest of the machine's uptime over a record that is never coming back;
- **observation switched off** (`CLAUDE_PLUGIN_OPTION_OBSERVE_RUNS=false`) — nothing starts at all: no process, no
  trace and no debrief.

**The nine `DELIVERER_OBSERVER_*` bounds are what make that walk minutes rather than half-hours** — the killed
terminal is the idle bound's thirty minutes and nothing else, and the terminal killed on a question is twelve hours.
`observer.ts` documents each beside the constant that reads it; they are named together here because a lifecycle state
is otherwise reachable only by waiting for it, and the six clocks of the loop are the ones a walk turns down:

- `DELIVERER_OBSERVER_TICK_MS` (2 s) — how often the records' own footprint is looked at, so it is the floor under
  every state below it;
- `DELIVERER_OBSERVER_REFRESH_MS` (15 s) — the throttle between two rewrites while the run is merely proceeding; a
  stage landing jumps it;
- `DELIVERER_OBSERVER_IDLE_MS` (30 min) — how long everything has to be silent before the debrief is finalised on the
  observer's own reading, which is the killed terminal's finalise and the one a thinking human must not be given;
- `DELIVERER_OBSERVER_WAITING_MS` (12 h) — how long a **waiting** run may sit on one unanswered question before the
  idle bound above is allowed to fire after all, measured from when that question was asked rather than from the
  watcher's own start, so a record whose question is already old is already partway through it;
- `DELIVERER_OBSERVER_AFTER_FINALISE_MS` (30 min) — how long the watcher keeps going after a finalise nothing
  signalled, which is the whole of the window a resumed run has to get its label back in;
- `DELIVERER_OBSERVER_PATIENCE_MS` (10 min) — how long a record gets to show a run in it at all, and how long one that
  stopped being readable gets to come back;
- `DELIVERER_OBSERVER_INSTALL_WAIT_MS` (2 min) — how long `observe.mjs` waits for the install to put the observer on
  disk before there is nothing to start;
- the judging half's `DELIVERER_OBSERVER_NOTE_MS` (5 min) and `DELIVERER_OBSERVER_JUDGE_MS` (30 min) — one **dispatch
  note**'s deadline and the synthesis's, which nothing but a `--judge` replay or a judging observer ever reaches.

Unset and set-but-empty both mean no override, told apart from a real `0` — which is honoured and fires that bound at
once. Anything that is not a finite number at or above zero falls back to the default rather than failing.

### Tallying a run

**This measures a run after the fact; it asserts nothing and gates nothing.** There is no script, no assertion and
nothing here CI or a test could go red on — it is a reading, and what it is for is the question the observer cannot yet
answer for you: where a **run**'s model turns and its context actually went, per agent, when a change to the machinery
claims to have moved them.

**It takes the same input and the same entry point as the replay above** — one session record of a run of your own, and
`CLAUDE_PLUGIN_DATA` — and stops after the **trace**, so it calls no model and spends nothing:

```
CLAUDE_PLUGIN_DATA=$(mktemp -d) \
  node plugin/mcp/observer/distil.ts ~/.claude/projects/<munged-cwd>/<session-id>.jsonl
```

Its first line is the trace's path, and the line under it already gives the run's skill, its **slug**, its wall clock,
its **dispatch** count and its whole-run tokens. Everything below is read out of that file —
`DO-NOT-FORWARD-trace.txt`, so read it where it lies and send the **debrief** instead.

**Nothing here re-reads the raw records.** The trace has already deduplicated them — `observer/records.ts` keeps the
record with the highest `output_tokens` per request id, because one response is written as several entries and only one
of them carries the true figure — and it has already named each dispatch's agent off the host's own sidecar. So no `jq`
over the records, and no reading of the `agent-<id>.meta.json` sidecars beside them: a second path through them is
`records.ts` rewritten in shell, waiting to drift from the figures the plugin itself reports.

**Model turns and tokens by kind are rows, not arithmetic.** The `== tokens, per API request and never per entry ==`
section carries one per agent:

- `the run's own` — the **orchestrator**, which for a refinement is the interview itself;
- `#<ordinal> <agent>` — one per dispatch, in the order the run made them, named by the agent that ran it;
- `whole run` — the two together, which is what to check the rest against.

Each reads `N req · in … out … cache-write … cache-read …`: `N req` is that agent's model turns, and the four figures
are its tokens by kind. Counting the `#` rows is also how many dispatches the run made, and to which agents.

**Peak context is the one figure you work out yourself** — the largest `in + cache-write + cache-read` of any single
turn. Take it from the `== the run, in order ==` section, where a turn's figures are stated once, on the first line of
the turn that produced them (the shape, not a measurement):

```
[19:02:13.586] tool       Bash grep for the caller turn 41 req_011… · in 4 out 1103 cache-write 21903 cache-read 246515
  #2 [19:14:07.994] think      claude-opus-5/high turn 12 req_011… · in 3 out 891 cache-write 18220 cache-read 155031
```

Every line of a dispatch's slice is prefixed `#n`, so the orchestrator's turns are the unprefixed lines and each agent's
peak is over its own `#n` ones. Later lines of one turn carry `turn <N>` and no figures, which is deliberate rather than
missing. Two lines not to read as a turn: the one opening a slice, `#n record <path> — N entries · N req · in …`, which
is that dispatch's totals again, and the section's own legend, which announces `req <id>` where the renderer writes the
turn number, the request id and the four figures — read the lines rather than the legend.

**The peak needs no deduplication of its own.** The placeholder that makes a naive tally wrong is in `output_tokens`
alone; every record of one response repeats the same input and cache figures, and what the trace prints has had
`records.ts`'s rule applied to it already.

**Report what the observation cost beside what the run did.** The **observer** grades every dispatch, so a run that
dispatches more costs more to observe — **spend** that lands out of band, in neither the run's own figures nor a
**ceiling**, and a before-and-after that leaves it out flatters itself. It is a read rather than a sum: `debrief.md`'s
header carries it on its `what this observation cost` line, in the dollars the calls themselves reported where they
reported any, and priced from the table below where they did not — the line says which of the two it is.

**Both dollar figures in a debrief are read rather than worked out, and the run's own is an estimate.** The host records
no money anywhere in a session record, only per-request tokens, so `the run's spend` line is those tokens priced by
`plugin/mcp/observer/rates.ts` — a dated table in the plugin's own code, reaching no network, so replaying a record
reproduces the figure. The line states its own basis: the table's date, the models it priced, the message id prefix the
requests carry, and any request it could not price at all. **The rates in that table are not written from memory.** They
come from the `claude-api` skill's own model table, which is where a contributor updates them from — and the date beside
them is that source's, not the day the file was edited. First-party rates only: a run whose message ids carry a partner
prefix such as `msg_bdrk_` is priced at first-party rates anyway, and the debrief says both facts, so a difference
against that platform's own bill has its explanation in the document.

**The pricing is the one thing here with an exactly right answer, so check it against a hand count.** Replay a record,
add up its `usage` fields yourself — `input_tokens` and `output_tokens` at the model's rates, `cache_read_input_tokens`
at 0.1× input, and `usage.cache_creation`'s `ephemeral_5m_input_tokens` at 1.25× input and `ephemeral_1h_input_tokens`
at 2× — and the debrief's figure matches to the cent or the table is wrong. The replay command prints it on its own
first summary line, so a mismatch needs no reading of the file. A model the table has no rate for is the other half to
walk: it prices nothing, is named in `What this observation lost`, and never reads as a cheap run.

### Exercising the install by hand

`launch.mjs` is the other piece nothing runs for you, and it decides whether a session has a review tool at all. Point
it at a throwaway data directory and it behaves exactly as it does under the host:

```
CLAUDE_PLUGIN_DATA=$(mktemp -d) node plugin/mcp/launch.mjs < /dev/null
```

Empty, that installs the dependencies, publishes the source and starts the server. The states worth walking after any
change to the launcher or the install hook, each of which reports differently: an install already present (starts at
once), one still running when the wait runs out (`DELIVERER_REVIEW_INSTALL_WAIT_MS=1000` against an empty directory),
one that runs and fails (`PATH` without `npm`), a hook that cannot be started (`chmod -x` it — the launcher retries
through `bash`, which is the only recovery from an install that dropped the executable bit), and the launcher's own
installer switched off (`DELIVERER_REVIEW_SELF_INSTALL=0`, which is also what keeps a caller that must not install
from starting a real `npm ci`).

Two launchers and the install hook against one empty data directory is the case the install's lock exists for, and it
is worth re-running whenever either side of it moves: exactly one `npm ci`, one stamp, no `ERR_MODULE_NOT_FOUND` and
no lock left behind.

### The end-to-end tests

`e2e-tests/` is the **harness**: it installs the plugin the way a user does — from a **staged copy** of your working
tree, so a test covers what is in front of you rather than what is on the branch — and drives whole **runs** against it.
It is the automated counterpart to the three procedures above, at a much higher seam: nothing is asserted below a
complete run, only what a human could read afterwards. Three tests, and CI runs none of them:

- **The installation smoke test.** One command and, in seconds, you know the plugin still installs and still presents
  both commands, all seven agents and all three review tools. No repository on the forge and no model asked for more
  than one trivial turn — cheap enough to run after any change to a manifest, either hook or the launcher.
- **The refine happy path.** `/deliverer:refine` against a **standing repo**, with a **responder** answering the
  grilling in your place out of the **fixture**'s own **brief**. It asserts a published **spec** and one file per
  **ticket**, and then a **verifier** judges whether what came out is any good.
- **The build happy path.** `/deliverer:build` against a **throwaway repo** created for the run: all eight stages, two
  real **rounds** through the tools server and both **fix waves**. It asserts a commit naming every ticket, a
  **verdict** on every **assumption**, a fix wave's answer to every `improve` among them, and the **change request**
  **flipped ready** with its **checks** green — then the verifier judges the code behind it against the **epic**, and
  whether those verdicts were sound.

**No paid run has yet produced an `improve`, so part of what the build path asserts has never fired.** All three runs
since the fourth **verdict** shipped came back without one — 10 `accept` and no `override` over ten **assumption**s in
the observed run of 2026-09-06, 6 and 1 over seven on 2026-09-05, and 8 and 1 over nine in an earlier reading whose
artefacts are gone — each reaching zero for stated reasons rather than by ignoring the verdict. The last of those is the
narrowest reading yet: every one of its ten **verdict**s named the roads it beat and the **axis** each lost on, two of
them said outright that a road differs on no axis and is therefore a shape preference rather than grounds, and still
nothing was directed. That leaves every branch behind the word unexercised: the **fix wave** implementing a
**directive**, the report's `improve` line, and the failing half of the harness's own assertion that each one was
answered. The passing half is vacuous by design — a run that honestly found no `improve` must not fail — so this is a
limit on what a green build path demonstrates rather than a defect in it. Closing it takes a **fixture** contrived to
force one, which no test has.

**Both paid tests are observed, and each asserts a debrief.** The plugin observes runs by default and the harness
leaves that default alone, so an **observer** runs beside each of the two and the test asserts what a human would look
for first: that a **debrief** exists for the run and that its header names it — the right skill, the right **slug**,
and a dispatch count consistent with the records the **run directory** itself holds. It is shallow on purpose; depth
lives at the replay seam above. The observation is a separate process on the same account and the same credentials the
run uses, its **spend** is in none of the figures below, and `e2e-tests/README.md` says what it costs.

**What they take and spend, measured rather than estimated.** The refinement, measured on 2026-09-11 and the first
reading taken with the model pinned, took **41m 36s and $15.38** — the run itself 41m 36s and $14.49, the responder
$0.32 across eleven rounds of questions, the verifier $0.57 — and published a spec and eight tickets over sixty-two
user stories. An earlier reading of the same test put it at **21m 52s and $6.36**, over six rounds and six tickets.
**Both are the same test against the same fixture, and the gap between them is what a single reading is worth here**:
seven refinements of this fixture, every one of them on `opus`, spread from **$13.45 to $36.46** on the tokens their
own records carry, a mean of $20.94 either side of a standard deviation of $7.55. A figure below is one run, so a
change that moved a refinement by a dollar or two would be invisible in it, and none of them is a saving anybody has
measured. The delivery, measured on 2026-09-06, took **59m 18s and $10.58** — the run itself 55m 29s and $9.75,
the verifier $0.83 — and flipped its change request ready with green checks over three tickets, five commits, ten
**assumption**s and two **rounds**. It was measured twice before that, at **23m 12s and $7.40** and **22m 14s and
$6.85**, and both of those readings predate the **adjudication** that compares roads: that step is now the longest and
most expensive of a delivery's eight, and `e2e-tests/README.md` prices the difference per stage. Run together, which is
what `npm test` does, the whole suite took **23m** and the two runs with their verdicts came to **$13.28**, then
**$13.14** — the two long tests overlap, so the suite is the slower of them plus a rounding error. That pair predates
the delivery above too, and nothing has driven the two together since; the arithmetic on the two latest readings puts a
suite at about an hour and about $26, which is derived rather than measured. The smoke test is seconds and effectively
free.

Those are the figures the harness reports, which are the **orchestrator** and its **dispatches** and nothing else — a
delivery's **rounds** and the observation both run as their own processes, and neither's **spend** is in them. **Every
reading above the refinement's was taken before `run.ts` pinned the model a run runs on**, so each inherited whichever
model the machine that took it defaulted to. Checked against the records afterwards, every refinement of this fixture
had in fact run on `opus` — so the spread above is what one fixture does run to run, and not two models being
compared — but nothing in a run directory said so at the time, which is why the pin is there now.
`e2e-tests/README.md` breaks a measured pair of runs down per stage, says what the reported figure leaves out — the
observation among the four kinds it names — and gives the method for doing it again from any **run directory**.

**The ceilings.** A run may take **ninety minutes** and spend **twenty-five dollars**: `DEFAULT_CEILINGS` in
`e2e-tests/harness/ceilings.ts`, overridable per test. Neither has been raised, and neither is far off any more: the
longest run measured took **55m 29s** — 62% of the ninety, the delivery of 2026-09-06 above — and the most expensive
spent **$14.49**, 58% of the twenty-five, the refinement of 2026-09-11. Both halves of the room the spec estimated are
now spoken for, and which one a run reaches first is no longer a settled question: the spread above puts a refinement
of this fixture past **$25** on its own tokens more than once, and a refinement driven against a change that sent more
than one **sweep** out has stopped short of stage 4 on budget rather than publishing its tickets. Reaching either is
reported as a ceiling rather than as a failed assertion, so a slow run can be told from a stuck one — but a run that
stops on spend fails whatever assertion covered the stage it never reached. What would move them is a bigger
**fixture**: this one's tickets are three functions with unit tests, and a fixture with a service in it would be felt
here first. Wall clock is also the one
figure here a busy machine inflates — every stage runs in series, so anything else on the box is in it.

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

- `config/` — the run's own `CLAUDE_CONFIG_DIR`: both marketplaces, the install, three of the plugin's four options at
  user scope (`observe_runs` is left at its default, so the run meets the observer a user meets), and under
  `projects/` the session records of every dispatched agent, not only the orchestrator's — the observer's own model
  calls leave plain top-level records there too, so what is under `projects/` over-counts the run's own sessions.
- `config/plugins/data/deliverer-<marketplace>/observations/` — what the observer left: the run's **debrief**, with
  its **trace**, its **dispatch note**s and its identity file beside it. Worth reading after a failure — it is the run
  as the observer saw it, and it is inside the run directory because the configuration directory is.
- `clone/` — the working tree the run published into: a refinement's whole **epic**, or a delivery's commits.
- `staged-plugin/` and `fixture-repo/` — the copy of the plugin that was installed, and the fixture as it was built
  into a repository before the forge was brought into step with it.
- `tmp/` and `session/` — the run's own temporary directory, and where a session with no clone runs.
- the root itself — the **brief** the run wrote, collected out of the shared temporary directory when it finished,
  `delivered.diff`, the diff a delivery's change request carried, and `adjudication.md`, every **assumption comment**
  on it and every reply under it in full. Those last two are what the **verifier** is given to read, and the second one
  exists because whether the **verdict**s were sound is the subject no assertion settles.

On the forge, the refine test's **standing repo** stays — it is cloned and never written back to, so it is brought into
step with the fixture rather than recreated. The build test's **throwaway repo** is deleted when the test passes and
left standing, with its branch and change request, when it fails: the change request is the evidence.

## Shipping

`.claude-plugin/marketplace.json` publishes the `plugin/` subdirectory of this repository. There is no build, no
artifact and no release step, and `plugin.json` carries no version field.

**What lands on `main` is what users get on their next plugin update.** A change inside `plugin/` is live to them on
merge; a change anywhere else never reaches them at all.
