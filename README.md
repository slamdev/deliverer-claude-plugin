# deliverer

A Claude Code plugin that takes a feature from a rough idea to a change request that is ready for your review.

Two commands:

- **`/deliverer:refine`** — you talk the idea through with Claude, and it comes back as a written spec plus a numbered
  set of tickets in your issue tracker.
- **`/deliverer:build`** — Claude implements every ticket on one branch, opens a change request, reviews it, fixes what
  the review found, and hands it back when the checks are green.

You are needed for the conversation at the start and the merge at the end. Everything in between runs unattended.

## What you get

**From `/deliverer:refine`:**

- a spec published to your issue tracker, written from the decisions you actually made in the conversation
- one ticket per slice of work, numbered in dependency order, each sized for a single agent to pick up
- the questions the conversation deliberately left open — those stay yours to answer
- the exact `/deliverer:build` call that delivers the epic

**From `/deliverer:build`:**

- a change request with every ticket implemented, on one branch
- two rounds of code review, with the findings raised as comments where your forge lets the reviewer raise them, and
  fixed either way
- every judgement call the tickets' implementation had to make silently, raised as a comment on the change request and
  adjudicated — accepted with reasons, corrected, or escalated to you; the fixes made after the review record theirs on
  their own commits instead, where you meet them unratified rather than adjudicated
- green checks, and the change request flipped out of draft (if the checks are red it stays a draft, and the report says
  so)
- a closing report: how many tickets landed, what the reviews cost, what was escalated, and what was declined and why

## Requirements

- **Claude Code**, and a Claude subscription or API credentials
- **two settings in Claude Code itself** — the todo tools on, the experimental agent teams off (see [Claude Code's own
  settings](#claude-codes-own-settings)). Without the first a run has no task list to report its progress on; with the
  second its stages stop being dispatched one at a time
- **Node.js** 22.18+ or 23.6+, and **npm**, on your `PATH`
- a **git repository with a remote**, and the CLI for your forge authenticated (`gh` for GitHub, `glab` for GitLab) —
  the plugin works through change requests, so it has to be able to open and comment on them
- a **credentials file** for the code review (see [Configuration](#configuration)) — this one is required, and no review
  runs without it

## Install

1. Add the marketplace and install the plugin:

   ```
   /plugin marketplace add slamdev/deliverer-claude-plugin
   /plugin install deliverer@slamdev-deliverer
   ```

   The plugin depends on [`mattpocock-skills`](https://github.com/mattpocock/skills), which Claude Code installs
   alongside it.

2. **Point the code review at credentials.** Claude Code asks for the plugin's options when you enable it, and you can
   change them later from `/plugin`. The one that must be set is the **code review environment file** — see below.

3. **Give it a few seconds.** The first time on a new machine, the plugin sets itself up in the background — from the
   session you installed in, or from the next one you start, whichever comes first. If a review fails before that
   finishes, starting another session fixes it.

4. **Tell the skills where your issues live** — once per repository:

   ```
   /mattpocock-skills:setup-matt-pocock-skills
   ```

   This records whether you track work in GitHub issues, GitLab issues, local markdown files or something else, so
   `/deliverer:refine` publishes specs and tickets where you actually keep them.

## Configuration

Set these from `/plugin` → **deliverer**.

**Code review environment file** — _required, no default._ Path to a file in `.env` format holding the credentials the
code review runs under. Read once when a session starts, so an edit takes effect in your next session.

**Code review effort** — _default `high`._ How deep each review goes: `low`, `medium`, `high`, `xhigh` or `max`. Deeper
costs more time and money, and raises more findings for the fix waves to work through.

**Code review model** — _default `opus[1m]`._ Which model reviews. The `[1m]` suffix is the one-million-token context
window, and it is what lets a review read a large diff at all: the whole diff goes into the review's prompt before the
model runs, so a bare alias meets an epic-sized change request with a "prompt is too long" failure and no review.
Whatever you set is used verbatim, so a bare alias gives that window up. An alias travels between providers; the `[1m]`
suffix does not — it selects a long-context beta, measured only against the first-party provider, where it works on
`opus` and `sonnet` and is refused on `haiku`. On another provider, or on an account without that window, it may be
refused as well; a round that meets that fails with a reason naming this option, and a bare alias is what you set
instead. Leave it empty to take whatever your credentials already default to.

**Observe runs** — _default on._ Whether each run is observed and comes back as a debrief. See
[Observation](#observation) for what that means; turning it off stops the whole thing.

### The environment file

Each review runs as its own Claude agent, and this file is how it logs in. One `KEY=value` per line; blank lines and `#`
comments are fine. Put in whatever authenticates Claude Code for you, for example:

```
CLAUDE_CODE_OAUTH_TOKEN=...
```

or an API key, or the variables for Bedrock or Vertex if that is how you are set up. Keep the file out of version
control — it holds a credential.

If the file is missing, unreadable, not in `.env` format, or assigns nothing, every review is refused with a message
saying exactly that, rather than quietly running as whatever identity happened to be lying around.

### Claude Code's own settings

Two more settings belong to Claude Code rather than to the plugin, and `/plugin` does not reach them. Put them in your
settings file — `~/.claude/settings.json`, or a repository's `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "0"
  }
}
```

**`CLAUDE_CODE_ENABLE_TODO_TOOLS=1`** — required. The task list is where both commands report progress, and Claude Code
leaves the todo tools off by default: without them an unattended run that takes an hour tells you nothing until it
finishes.

**`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=0`** — required. Agent teams change how Claude Code runs the agents a session
dispatches, which cuts across the orchestration both commands are built on — one stage, one dispatch, reported before
the next starts. Set it to `0` explicitly rather than trusting the default: a value from a wider settings scope, or from
your shell, is enough to turn it back on.

Both are read when a session starts, so an edit to either takes effect in your next session.

## Using it

### 1. Refine the idea

```
/deliverer:refine add rate limiting to the public API
```

Claude interviews you about the idea — what problem it solves, what it must not do, the decisions it cannot make for
you — until nothing important is left silently assumed. **Stay in the room for this part**; it is the only stage that
needs you.

It then writes the spec and cuts the tickets, and reports back with the questions it could not close and the command
that builds the epic.

### 2. Build it

```
/deliverer:build docs/specs/rate-limiting
```

Hand it the location the refine step reported. From here it runs on its own: ticket after ticket onto one branch, a
draft change request, review rounds, fixes, checks. The task list shows where it has got to.

When it finishes you get the change request and a report. Read the escalations and the declined findings first — those
are the places where it deliberately stopped and left the call to you.

### Stopping and resuming

Both commands can be interrupted and re-run. They work out how far the previous attempt got — from the branch, the
tickets and the change request itself — and carry on from there rather than starting over or duplicating work. The one
exception is the refine conversation: if it never reached the point of writing anything down, you get asked those
questions again.

### What still needs a human

- the interview at the start of `/deliverer:refine`
- the open questions the refinement left for you
- any assumption the run escalated instead of deciding
- the final review and merge of the change request

## Observation

Every run is observed, and what it cost you comes back as a **debrief** — a short document you can forward to whoever
maintains the plugin. It is on by default and you do not have to do anything to get one.

**What it does.** When you type `/deliverer:refine` or `/deliverer:build`, the plugin starts a separate process beside
your run. It reads the session records Claude Code already writes for every session and every agent a session
dispatches, and turns them into a debrief: what the plugin's own machinery did, how long each stage took, how many
questions it put to you, how long it waited on you, what the reviews ended on, and what the whole run spent in tokens.
It then reads all of that — and each dispatch from the inside — and names the **defects**: the things the run cost you
that it did not have to, each with the grounds from the run's own conduct that show it. When your run stops, a line
names the debrief and where it is. If you closed the terminal before it finished, the line comes on your next prompt
instead.

**It cannot affect your run.** The observer runs outside the run entirely, in its own process, with its own session and
its input and output closed. It never speaks into your session while a run is going, never asks the run for anything,
and never touches your repository or your forge. If it fails, it says so in that same line and your run carries on
untouched. A run that fell over is observed exactly like one that finished — those are the ones most worth reporting.

**What a debrief may and may not contain.** It is bounded to the plugin's own machinery: its skills, its agents, its
dispatches, its timings and its spend. It carries **nothing from your repository** — no code, no spec, no ticket, no
branch and no path — and **no word of what you and the run said to each other**: how many questions you were asked and
how long you were waited on, never the questions or the answers. The one thing of yours it names is the epic's short
name, which is what groups an epic's several runs together. That bound is what makes it safe to forward without
reading it first, and the debrief says so at the top and again at the bottom, along with where to send it.

Kept beside the debrief is the **trace** it was worked out from. That one is bounded by nothing — it holds whatever the
run touched — so it is named `DO-NOT-FORWARD-trace.txt` and says the same thing on its first line. It is there so you
can check a figure you doubt. Do not attach it. The same goes for the `DO-NOT-FORWARD-identity.txt` beside it, which
records which repository the run was in so that a later run of the same epic can find its own earlier debriefs.

**What it writes, and where.** Everything goes under the plugin's own data directory — the same place it installs
itself — and never inside a repository, so nothing of its own can be swept into a commit or a change request. One
directory per run, under the epic's name:

```
~/.claude/plugins/data/deliverer-<marketplace>/observations/<epic>/<when the run started>/
```

**Nothing is ever removed.** No pruning, no expiry, no cleanup. A run's records are a few hundred kilobytes of debrief,
trace and notes, and they stay until you delete them yourself.

**What it costs.** Observation calls models of its own, and they are drawn on the **same account your run
authenticates with** — it inherits the environment your session started in, so on a subscription your run and its
observer can compete for the same rate limit. There is no back-off and nothing to configure. It makes two kinds of
call:

- **One per dispatch, on a cheap tier**, the moment that dispatch finishes. A dispatch is one agent your run sent off
  to do one stage's work; a refinement makes three or four of them, and a delivery a dozen or more. Each of those calls
  reads that one agent's own record — the part of a run nothing else can see, since a delivery's per-dispatch records
  outrun any context window — and writes a short note.
- **One at the end, over the whole run**, on a long-context model, which reads the run's shape and all of those notes
  together and writes the defects.

**What that came to when it was measured.** The reading at the end was measured over the runs on the machine this was
written on: **$2.05 to $6.43 for a run, averaging $3.68**. It is the larger of the two by a distance, and it is one call
however long the run was. The per-dispatch notes were then measured over two of those runs — a four-dispatch refinement
and a thirteen-dispatch delivery — at **$0.19 and $0.96**, which is **five to eight cents a dispatch**. Two runs is
a narrow sample and a note costs what its dispatch left behind, so read that as an order of magnitude: the notes are the
smaller half by a distance, and they are the half that grows with your run. So the figure follows **how many dispatches
your run made, not how long it took**: a ten-hour delivery costs no more to observe than a two-hour one, and observing a
whole delivery is a dozen-odd cheap calls and one expensive one against the hundreds of model calls the delivery itself
makes.

Your own figures will differ — with the size of your epic, with how many stages a run needed, and with what your
account is charged. Treat them as an order of magnitude and read your own debrief for what your run actually cost.

The debrief's own line, "what this observation cost", is the figure for your run: model calls at both tiers, tokens
counted per API request, and the dollar figure the calls themselves reported. It is measured rather than assumed, and a
figure nothing measured reads *unknown* rather than zero. Beside the models it spends a little CPU on the machine the
run is on — it re-reads the run's records every few seconds while the run is going — and disk for what it keeps.

Kept beside the debrief and the trace is `DO-NOT-FORWARD-notes.txt`, one file holding those per-dispatch notes. Like
the trace it is bounded by nothing — a note reads what one agent read and wrote, which is where your repository is —
so it is named and opened the same way. Do not attach it.

**If your account has no long-context window**, that final reading is refused and your debrief carries the facts and
never the defects. It says so on its face: which model was asked for (`opus[1m]`), and that the provider or account
behind your credentials refused it. There is nothing to set — which models are used is the plugin's choice, not an
option, so that every debrief a team produces was judged at the same depth.

**Turning it off.** `/plugin` → **deliverer** → **Observe runs**. With it off nothing starts at all: no process, no
trace and no debrief.

## Costs

`/deliverer:build` runs real models over a whole epic, and each review round is a full review of the change request.
Every run reports what its reviews spent. If that is more than you want, turn the **code review effort** down; if a
change is high-stakes, turn it up.

Observation spends models too, on the same account — see [Observation](#observation). Most of it is the one reading at
the end of a run, measured at $2.05 to $6.43 a run and averaging $3.68, with one cheap-tier call per dispatch beside it.
Turning it off is one setting.

## Troubleshooting

**"the review round will not work in this session"** — Node or npm was not on the `PATH` when the session started, or
the very first session on this machine started faster than the setup behind it. Check `node --version` (22.18+ or
23.6+), then start a new session.

**"nothing is installed at …"** — the tools server started before its setup had produced anything, so this session
has no review tool. The sentence right after it says which case you are in, and they need different things: the setup is
still running (start another session once it settles), it ran and failed (its own output is immediately above and says
why), or nothing could start it at all (the plugin looks incompletely installed — reinstall it).

**Reviews are refused, mentioning the environment file** — the path is wrong, the file is unreadable, it is not in
`.env` format, or everything in it is commented out. Fix the file and start a new session; it is read at session start.

**Reviews are refused, mentioning the effort tier** — the effort option must be exactly one of `low`, `medium`, `high`,
`xhigh` or `max`.

**A run reports nothing until it ends, and no task list appears** — the todo tools are off. Set
`CLAUDE_CODE_ENABLE_TODO_TOOLS=1` (see [Claude Code's own settings](#claude-codes-own-settings)) and start a new
session.

**Stages run over each other, or a dispatch never reports back** — the experimental agent teams feature is on, and it
changes how a session's agents are run. Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=0` and start a new session.

**`/deliverer:refine` stops and says a skill is missing** — `mattpocock-skills` is not installed or not enabled. Check
`/plugin`.

**Specs and tickets land somewhere unexpected** — run `/mattpocock-skills:setup-matt-pocock-skills` in the repository to
record where your issues live.

## Credits

The refinement and writing stages build on [Matt Pocock's engineering skills](https://github.com/mattpocock/skills).
