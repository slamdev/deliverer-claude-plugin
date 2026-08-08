---
name: update-claude-dockerfile
description: Update every pinned tool version in `hacks/claude.dockerfile` to its latest stable release. Spawns one subagent per tool to fetch the latest version, walk every changelog between the current and latest, and summarise the changes grouped by feature; then applies the version bumps in-place and prints a per-tool summary. Use this skill whenever the user asks to "update tools in claude dockerfile", "bump claude dockerfile versions", "refresh the claude dockerfile", "upgrade dockerfile dependencies", "check for new tool versions", "update bun / plannotator / claude code in the dockerfile", or otherwise signals they want the dockerfile's pinned tools brought up to date — even if they don't say the word "skill" or name a specific tool.
---

# Update Claude Dockerfile

This skill upgrades pinned tool versions in `hacks/claude.dockerfile`, fanning out research to one subagent per tool so changelog work runs in parallel. The user sees a single coherent report at the end and the file is edited in place.

The parallel fan-out is load-bearing — running subagents one at a time turns a fast operation into a long wait, and the changelog reading is the slow part. Always launch every subagent in a single message.

## Workflow

1. **Read** `hacks/claude.dockerfile`.
2. **Identify pinned tools** (see next section). Skip anything that isn't explicitly pinned — `latest` tags, the base image, and apt-managed packages have nothing to bump.
3. **Spawn one subagent per pinned tool, in parallel.** Use a single message with multiple `Agent` tool calls, `subagent_type: "general-purpose"`. Pass each one the prompt template below, filled in for that tool — drawing each `[source_hint]` (latest-version command + changelog URL + tag→ARG transform) from `references/tool-sources.md` so the subagents skip source discovery.
4. **Collect** structured results from every subagent.
5. **Edit** the Dockerfile, replacing each pinned version with its latest. Preserve the exact surrounding syntax (prefixes like `jq-`, leading `v`, position inside a URL path). Skip tools that are already on the latest version or where the subagent returned `LATEST: unknown`.
6. **Report** to the user: one section per tool with its feature-grouped summary, plus a tail line noting anything that was skipped and why.

## Identifying pinned tools

Two patterns cover everything in this dockerfile today, and the same heuristic generalises:

- **`ARG <NAME>_VERSION=<value>`** declarations. The ARG name tells you the tool; cross-reference how it's used later in the file (in a `curl`/`wget`/install line) to find the source URL.
- **Hardcoded version strings inside download URLs** (e.g. `.../claude-code-releases/2.1.143/...`). Treat the URL host + path as the source hint; the version segment is what you'll update.

For each tool, capture:
- a short name (e.g. `bun`, `plannotator`, `claude`),
- the current version string exactly as it appears (keep any `v` or `jq-` prefix),
- a source hint to pass to the subagent — ideally a canonical releases URL or `owner/repo`.

If you can't confidently identify a tool's release source, don't guess — skip it and mention it in the final report so the user can investigate.

Do **not** treat any of these as pinned tools: the `FROM` base image, anything installed via `apt-get`, anything pulled with a literal `latest` tag (`releases/latest/download/...`), and refs that follow a **moving** target — a branch name or tag head that resolves differently over time. A git ref pinned to an immutable **commit SHA** (e.g. `MATTPOCOCK_SKILLS_REF`, now pinned to a `mattpocock/skills` `main` commit) *is* in scope — but its mechanics differ from a versioned release, so it gets its own subagent prompt: see [Commit-pinned git refs](#commit-pinned-git-refs) below.

### Use — and maintain — the cached source list

`references/tool-sources.md` records, for every pinned tool, the exact command that returns its latest stable version, the changelog URL, and how the upstream tag maps to the `ARG` value. Read it during identification and feed those into each subagent's `[source_hint]` (next section) — that's what lets the subagents skip source discovery and spend their time reading changelogs.

The file only helps while it mirrors the Dockerfile. If identification turns up a pinned tool that **isn't** in `references/tool-sources.md` — someone added a tool since the file was last touched — add it there in the same run: record its latest-version command, changelog URL, and tag → ARG transform. Likewise drop entries for tools that have been removed. A tool missing from the file isn't fatal (the subagent falls back to slow discovery), but keeping it current is the whole reason the file exists.

## Commit-pinned git refs

Some refs point at an immutable **commit SHA** on a tracked branch instead of a released version. Today that's `MATTPOCOCK_SKILLS_REF`, pinned to a commit on `mattpocock/skills` `main`. "Upgrading" it means moving the pin to the branch's **latest commit** and summarising the **commit messages** in between — there are no release notes to read.

Treat it like any other pinned tool (one subagent, launched in the same parallel message as the rest), but hand it the **commit-pinned prompt variant** below instead of the versioned template, and pull its `[repo]`/`[branch]` from the `mattpocock-skills` block in `references/tool-sources.md`. When the subagent returns, edit the SHA in place (full 40-char SHA) exactly as you would a version, and report its commit-message summary in the same per-tool format.

### Commit-pinned subagent prompt variant

> You are researching a git-pinned dependency so a Dockerfile can be upgraded. Reply with one structured response, no preamble.
>
> **Tool:** `[tool_name]` (git ref, pinned to a commit SHA)
> **Current commit:** `[current_sha]`
> **Repo / branch:** `[repo]` @ `[branch]` — e.g. `mattpocock/skills` @ `main`.
>
> Do the following:
>
> 1. **Find the latest commit on the branch.** `curl -fsSL https://api.github.com/repos/[repo]/commits/[branch] | jq -r .sha` returns the full head SHA. Fall back to `WebFetch` on `https://github.com/[repo]/commits/[branch]` only if the API fails.
> 2. **Enumerate the commits added since the current pin.** `curl -fsSL "https://api.github.com/repos/[repo]/compare/[current_sha]...<latest_sha>" | jq -r '.commits[].commit.message'` lists every commit reachable from the latest but not from the current pin (oldest → newest). If the range has more than ~30 commits, take the most recent ~30 and note in your summary that older entries were elided. If `compare` 404s (the current SHA was force-pushed away or rewritten), say so under `SUMMARY:` and still report the latest SHA.
> 3. **Synthesise one combined summary, grouped by feature category** from the commit messages (subject + body). Use the same categories as the versioned template (New features, Improvements, Bug fixes, Breaking changes, Deprecations / removals, Security), including only those with content. Fold release-automation noise (changeset version-bump commits, bot commits like `chore: version skills`, merge commits with no extra context) into at most one line — don't enumerate it.
> 4. **Return your response in exactly this format,** with no surrounding prose:
>
>    ```
>    TOOL: [tool_name]
>    CURRENT: [current_sha]
>    LATEST: <latest_full_sha>
>    SOURCE: https://github.com/[repo]/commits/[branch]
>
>    SUMMARY:
>    ### New features
>    - ...
>    ```
>
>    (Include only the categories with content. Drop the rest.)
>
> Edge cases:
> - If the current pin already equals the branch head, return the header lines and `SUMMARY: already up to date.` with no categories.
> - If you genuinely can't reach the API after a reasonable search, return `LATEST: unknown` and one short paragraph under `SUMMARY:` explaining what you tried.

## Subagent prompt template

Each subagent starts cold — it can't see this conversation or the Dockerfile. The prompt has to stand alone. Use this template, substituting the bracketed fields:

> You are researching a single tool so a Dockerfile can be upgraded. Reply with one structured response, no preamble.
>
> **Tool:** `[tool_name]`
> **Current version:** `[current_version]` (keep this exact string, prefix and all, when echoing it back)
> **Source hint:** `[source_hint]` — e.g. a GitHub repo like `cli/cli`, a releases page URL, or a downloads host.
>
> Do the following:
>
> 1. **Find the latest stable release.** Exclude pre-releases, release candidates, betas, and nightlies unless that's the only thing the project ships. Prefer the project's official releases page or API. For GitHub-hosted tools, `curl -s https://api.github.com/repos/<owner>/<repo>/releases` (then `jq`) is usually the most reliable; fall back to `WebFetch` on the releases page. Use `WebSearch` only if neither works.
> 2. **Enumerate every release** strictly between the current version and the latest (inclusive of the latest, exclusive of the current). If there are more than ~20 versions in the range, take the most recent ~20 and explicitly note in your summary that older entries were elided.
> 3. **For each release in the range, fetch its changelog / release notes** (GitHub release body, CHANGELOG.md, or equivalent).
> 4. **Synthesise one combined summary, grouped by feature category** across the whole range — do not list per-version. Only include categories that actually have content. Suggested categories:
>    - **New features**
>    - **Improvements** (performance, DX, ergonomics, refactors users notice)
>    - **Bug fixes** — notable ones only; don't enumerate every patch
>    - **Breaking changes**
>    - **Deprecations / removals**
>    - **Security**
>
>    Within each category, aim for 2–6 tight bullets that aggregate similar items across versions. The reader is scanning many tools; keep it dense and skimmable.
>
> 5. **Return your response in exactly this format,** with no surrounding prose:
>
>    ```
>    TOOL: [tool_name]
>    CURRENT: [current_version]
>    LATEST: <latest_version_with_same_prefix_style_as_current>
>    SOURCE: <canonical releases URL>
>
>    SUMMARY:
>    ### New features
>    - ...
>    ### Improvements
>    - ...
>    ```
>
>    (Include only the categories with content. Drop the rest.)
>
> Edge cases:
> - If the current version is already the latest, return the header lines and `SUMMARY: already up to date.` with no categories.
> - If you genuinely can't determine the latest after a reasonable search, return `LATEST: unknown` and one short paragraph under `SUMMARY:` explaining what you tried and where you got stuck.

Fill each `[source_hint]` from `references/tool-sources.md` — it lists, per tool, the exact latest-version command, the changelog URL, and the tag → `ARG` transform (e.g. `jq` keeps its `jq-` prefix; `gh`/`fzf` drop the leading `v`; `delta`/`ripgrep` have no prefix). Pasting those in keeps each subagent focused on reading changelogs rather than rediscovering where they live.

## Editing the Dockerfile

Wait until every subagent has returned, then edit in one pass so the user never sees a partial state.

- Use the `Edit` tool with enough surrounding context that the replacement is unambiguous.
- Preserve the exact prefix and surrounding characters (see the tag → `ARG` transform column in `references/tool-sources.md`). `jq-1.8.1` → `jq-<new>`; `v4.53.3` → `v<new>`; the bare `2.1.143` in the claude download URL → `<new>` (just the version segment, not the path).
- For the commit-pinned ref (`MATTPOCOCK_SKILLS_REF`), replace the full 40-char SHA with the new head SHA, and update the `Pinned <date>` note in the comment directly above it to today's date.
- Skip tools whose `LATEST` equals their `CURRENT`, and skip tools where the subagent returned `LATEST: unknown` (mention them in the report instead).

## Final report

Print one section per tool in the order the tools appear in the Dockerfile:

```
## <tool>: <current> → <latest>

<the SUMMARY body returned by the subagent — already grouped by feature>
```

After the per-tool sections, add a short tail line listing anything skipped and why, e.g.:

> Skipped: `debian` base image (out of scope), `<tool>` (latest could not be determined).

Keep the report self-contained — the user shouldn't have to scroll back through your tool calls to know what changed.
