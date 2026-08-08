# Tool sources & changelogs

Cached "where to look" for every pinned tool in `hacks/claude.dockerfile`. The slow part
of this skill is reading changelogs; the *avoidable* slow part is each subagent
rediscovering where a tool's releases and notes even live. This file removes that
rediscovery: paste the matching **latest-version command**, **changelog URL**, and
**tag → ARG transform** straight into the subagent's `[source_hint]` so it goes directly
to fetching and summarising.

The version values shown below (e.g. `v24.16.0`) are illustrative — they show the
*style* to preserve, not a target. The command always tells you the real latest.

> **Last verified:** 2026-08-06 — every command below was run and returned the then-current
> pinned version. If a host reorganises its API, fix the entry here so the fix is shared.

## Keeping this file in sync

This file only stays useful if it mirrors the Dockerfile's pinned tools. Whenever a run
notices the Dockerfile has **gained** a pinned tool absent from this file, or **lost** one
that's still here, fix it in the same pass:

- New tool → add it to the GitHub table (if it's a plain GitHub `releases/latest` tool) or
  give it its own block (if it needs a non-GitHub source or special handling). Record its
  latest-version command, changelog URL, and tag → ARG transform.
- Removed tool → delete its entry.

A tool missing from this file isn't fatal — the subagent falls back to source discovery —
but it's slow, which is exactly what this file exists to prevent. The skill's
`SKILL.md` tells you to do this.

## GitHub tools (standard `releases/latest`)

For every tool in this table, the latest **stable** version is:

```sh
curl -fsSL https://api.github.com/repos/<owner>/<repo>/releases/latest | jq -r .tag_name
```

`releases/latest` already excludes pre-releases and drafts. The **changelog** for each tag
is that release's **body**: browse `https://github.com/<owner>/<repo>/releases`, or read
`.body` from `https://api.github.com/repos/<owner>/<repo>/releases` to walk the whole range
in one fetch.

| Tool | ARG | `owner/repo` | Tag → ARG value | Changelog notes |
|------|-----|--------------|-----------------|-----------------|
| jq | `JQ_VERSION` | `jqlang/jq` | `jq-1.8.1` → **as-is** (keep `jq-`) | |
| yq | `YQ_VERSION` | `mikefarah/yq` | `v4.53.3` → **as-is** (keep `v`) | |
| buildx | `BUILDX_VERSION` | `docker/buildx` | `v0.34.1` → **as-is** (keep `v`) | |
| ripgrep | `RG_VERSION` | `BurntSushi/ripgrep` | `15.1.0` → **as-is** (no prefix) | Root `CHANGELOG.md` is richer than the release body |
| gh | `GH_VERSION` | `cli/cli` | `v2.93.0` → **strip leading `v`** → `2.93.0` | URL re-adds the `v` |
| delta | `DELTA_VERSION` | `dandavison/delta` | `0.19.2` → **as-is** (no prefix) | |
| fzf | `FZF_VERSION` | `junegunn/fzf` | `v0.73.1` → **strip leading `v`** → `0.73.1` | Root `CHANGELOG.md`; URL re-adds the `v` |

## Special cases (non-GitHub or extra handling)

### node (Node.js) — nodejs.org

- **ARG:** `NODE_VERSION`, `v24.16.0` (keep the leading `v`). The Dockerfile pins the **v24 LTS** line and
  downloads the static tarball from `nodejs.org/dist/${NODE_VERSION}/...`, so the GitHub tag isn't what's fetched.
- **Latest stable (within the pinned v24 LTS line):**
  ```sh
  curl -fsSL https://nodejs.org/dist/index.json \
    | jq -r 'map(select(.version | startswith("v24.")))[0].version'
  ```
  `index.json` is sorted newest-first, so the first `v24.*` entry is the latest v24 release. Crossing a major
  (to v26 when it ships as the next LTS) is a deliberate call — don't do it silently; note it instead.
- **Changelog:** <https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V24.md> (per-major
  changelog; narrative notes at <https://nodejs.org/en/blog>).

### claude (Claude Code) — Anthropic

- **ARG:** `CLAUDE_VERSION`, bare `2.1.170` (also appears as a path segment in the download URL).
- **Latest stable:** `curl -fsSL https://registry.npmjs.org/@anthropic-ai/claude-code | jq -r '."dist-tags".latest'`
  The `latest` dist-tag is the one to use. Note there is also a `stable` dist-tag that commonly lags
  `latest` by a few patch releases — don't switch to it, just don't be alarmed when the two disagree.
- **Verify it's downloadable before bumping** — the binary host can lag npm by a few minutes:
  ```sh
  curl -fsIL -o /dev/null -w '%{http_code}\n' \
    https://downloads.claude.ai/claude-code-releases/<version>/linux-x64/claude
  ```
  must be `200`. If not yet published, use the newest version that is.
- **Changelog:** <https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md>
  (raw markdown, one `##` section per version — easy to walk the range). The changelog
  occasionally skips a patch number (e.g. no `2.1.164` section); a 404 there is expected, not an error.

### docker (Docker CLI, static binary) — download.docker.com

- **ARG:** `DOCKER_CLI_VERSION`, bare `29.5.3`. The Dockerfile pulls the **static** tarball, so the
  GitHub tag isn't authoritative — a published tarball is.
- **Latest stable:**
  ```sh
  curl -fsSL https://download.docker.com/linux/static/stable/x86_64/ \
    | grep -oE 'docker-[0-9]+\.[0-9]+\.[0-9]+\.tgz' | sort -V | tail -1
  ```
  → highest `docker-<version>.tgz`. The `X.Y.Z`-only regex skips `-rc`/`-beta`/`-tp` and the
  `docker-rootless-extras-*` siblings. Confirm the same version also exists under
  `.../static/stable/aarch64/` (the build targets both arches).
- **Changelog:** <https://docs.docker.com/engine/release-notes/> (Engine notes cover the CLI).

## Not pinned — do not add rows for these

- **`debian:13.3-slim`** base image — out of scope; apt manages its packages.
- Anything installed via **`apt-get`**, and anything still pulled with a literal `latest` tag, or a ref
  that tracks a **moving** branch head / tag (something that resolves differently over time). A git ref
  pinned to an immutable **commit SHA** would be in scope (its own special-case block + the commit-pinned
  prompt variant in `SKILL.md`), but the Dockerfile currently has none.
