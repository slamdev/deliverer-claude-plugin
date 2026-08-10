---
name: update-claude-dockerfile
description: Update the pinned tool versions in `hacks/claude.dockerfile` to their latest stable releases — sweeps every version source in one batched call, reads each outdated tool's changelog range, edits the pins in place, and reports what changed grouped by feature. Use when the user wants the dockerfile's tools bumped, refreshed, or checked for new versions, or names one pinned tool to update (node, claude code, gh, jq, docker, buildx, ripgrep, delta, fzf, yq).
---

# Update Claude Dockerfile

Bump the pinned versions in `hacks/claude.dockerfile` and tell the user what changed. Do the whole job here — `scripts/tools.sh` holds every version source, so a **sweep** costs one Bash call rather than a subagent per tool.

Batching is load-bearing. The sweep fetches all ten sources in parallel inside one call, and every changelog fetch belongs in one more. Firing these off one tool at a time is the slow path this skill exists to avoid.

## Workflow

1. **Sweep.** `.claude/skills/update-claude-dockerfile/scripts/tools.sh sweep` prints one TSV row per pinned tool: `tool, arg, current, latest, status`. Rows marked `outdated` are the work list; `error:...` rows carry the reason in the status column.
2. **Cross-check the Dockerfile against the sweep.** Read `hacks/claude.dockerfile` and confirm every `ARG *_VERSION` and every hardcoded version inside a download URL appears in the sweep output. Anything missing is a tool added since the script was last touched — add it to `TOOLS` in `scripts/tools.sh` in this same run (see [Keeping the tool list current](#keeping-the-tool-list-current)) and re-sweep.
3. **Read each outdated tool's changelog range** — every release between its current pin and the latest. One Bash call, one `tools.sh changelog <tool> <current>` per outdated tool:
   ```sh
   S=.claude/skills/update-claude-dockerfile/scripts/tools.sh
   $S changelog gh 2.97.0; $S changelog jq jq-1.8.2
   ```
   The script caps each range at 20 entries and trims node's per-commit dumps, so the combined output is safe to read inline. It prints an explicit elision note when a range overflows the cap — pass that note through to your report rather than dropping it.
4. **Summarise each range** using the categories below.
5. **Edit the Dockerfile in one pass**, so the user never sees a partial state.
6. **Report** per tool, plus a tail line for anything skipped.

## Summarising a range

Write one summary per tool covering its whole range — aggregate across versions rather than listing per-version. Keep only the categories with content:

- **New features**
- **Improvements** — performance, DX, ergonomics, refactors users notice
- **Bug fixes** — notable ones only; skip the routine patches
- **Breaking changes**
- **Deprecations / removals**
- **Security**

Aim for 2–6 tight bullets per category. The reader is scanning many tools at once, so keep it dense and skimmable.

`docker` has no raw changelog — `tools.sh changelog docker <current>` prints the release-notes URL to `WebFetch` instead.

## Editing the Dockerfile

- Use `Edit`, with enough surrounding context that each replacement is unambiguous.
- The sweep's `latest` column already carries the pin's own prefix style (`jq-1.8.2`, `v4.53.3`, bare `2.97.0`), so it drops in verbatim.
- `CLAUDE_VERSION` also appears as a path segment in the download URL — replace the version segment there too, leaving the rest of the path alone.
- Edit only the rows marked `outdated`. Leave `current` and `error:...` rows on their existing pins.

## Report

One section per tool, ordered as the tools appear in the Dockerfile:

```
## <tool>: <current> → <latest>

<the feature-grouped summary>
```

Close with a tail line naming what was skipped and why — `error:` rows from the sweep, and the out-of-scope pins below. Keep the report self-contained; the user should not have to scroll back through tool calls to learn what changed.

## Scope

In scope: anything pinned to an exact, immutable version — an `ARG *_VERSION`, a version segment hardcoded in a download URL, or a git ref pinned to a full commit SHA.

Out of scope, and worth naming in the tail line when the user might expect otherwise: the `FROM debian:*-slim` base image, everything installed via `apt-get`, and any ref that tracks a moving target — a literal `latest` tag, a branch name, or a tag head that resolves differently over time.

## Keeping the tool list current

`scripts/tools.sh` is the single source of truth for which tools are pinned and where their versions come from; `references/tool-sources.md` holds the per-tool gotchas that shape a judgement call. Both only stay useful while they mirror the Dockerfile, so when a run finds a pinned tool the script doesn't know about — or an entry for a tool that's been removed — fix it in the same run:

- **Added tool** → add a `TOOLS` row: `tool|ARG|kind|source`. The existing `kind`s (`gh`, `npm`, `node`, `docker`) cover both the version lookup and the changelog fetch; a tool whose source fits none of them needs a new `kind` branch in `latest_raw` and `changelog`.
- **Removed tool** → delete its `TOOLS` row, and its block in `references/tool-sources.md` if it has one.
- **A source that reorganised its API** → fix the `kind` branch, so every future run inherits the fix.

Read [`references/tool-sources.md`](references/tool-sources.md) before bumping `node`, `claude`, or `docker` — each carries a gotcha the sweep cannot decide for you.
