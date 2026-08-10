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
- two rounds of code review, with the findings raised as comments and then fixed
- every judgement call the implementation had to make silently, raised as a comment on the change request and
  adjudicated — accepted with reasons, corrected, or escalated to you
- green checks, and the change request flipped out of draft (if the checks are red it stays a draft, and the report says
  so)
- a closing report: how many tickets landed, what the reviews cost, what was escalated, and what was declined and why

## Requirements

- **Claude Code**, and a Claude subscription or API credentials
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

**Code review model** — _default `opus`._ Which model reviews. An alias — `opus`, `sonnet`, `haiku` — travels between
providers; leave it empty to take whatever your credentials already default to.

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

## Costs

`/deliverer:build` runs real models over a whole epic, and each review round is a full review of the change request.
Every run reports what its reviews spent. If that is more than you want, turn the **code review effort** down; if a
change is high-stakes, turn it up.

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

**`/deliverer:refine` stops and says a skill is missing** — `mattpocock-skills` is not installed or not enabled. Check
`/plugin`.

**Specs and tickets land somewhere unexpected** — run `/mattpocock-skills:setup-matt-pocock-skills` in the repository to
record where your issues live.

## Credits

The refinement and writing stages build on [Matt Pocock's engineering skills](https://github.com/mattpocock/skills).
