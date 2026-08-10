# Per-tool notes

Gotchas for the pinned tools in `hacks/claude.dockerfile` — the things a version number alone
doesn't tell you. Mechanics live in `../scripts/tools.sh`: it holds which tools are pinned, the
command that resolves each one's latest version, and the tag → `ARG` transform. What's here is
only what the script can't decide for you.

Most tools need nothing beyond the sweep. The three below do.

> **Last verified:** 2026-08-10 — every source resolved to the then-current pin.
> When a host reorganises its API, fix the matching `kind` branch in `tools.sh` so the fix is shared.

## node — nodejs.org, not GitHub

The Dockerfile downloads the static tarball from `nodejs.org/dist/${NODE_VERSION}/...`, so a
GitHub tag is not what's fetched, and the tarball's existence is what makes a version real.

The sweep **stays on whatever major the pin already tracks** (v24 LTS today), because crossing a
major is a deliberate call, not a routine bump. When the next LTS ships, raising the line is a
decision to put to the user — say so in the report rather than moving the pin silently.

Per-major changelog: <https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V24.md>.
The sweep drops each release's per-commit dump and keeps its Notable Changes; for the narrative
behind a major, <https://nodejs.org/en/blog>.

## claude (Claude Code) — npm index, separate binary host

Three things diverge here:

- **`latest` is the dist-tag to follow.** There is also a `stable` tag that commonly lags `latest`
  by a few patches. Don't switch to it — just don't be alarmed when the two disagree.
- **The binary host lags npm** by minutes after a publish. The sweep HEAD-checks
  `downloads.claude.ai/claude-code-releases/<version>/linux-x64/claude` before proposing a bump, so
  an `error:artifact not downloadable yet` row means the release is real but not yet mirrored —
  re-run shortly, or pin the newest version that does resolve.
- **The changelog skips patch numbers** now and then (no `## 2.1.164` section, say). A gap is
  expected, not a fetch failure.

Changelog: <https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md>.

## docker — static tarball, both arches

The Dockerfile pulls the **static** CLI tarball, so a published tarball is authoritative and the
GitHub tag isn't. The image builds for amd64 and arm64 and the two arch directories can publish
out of step, so the sweep confirms the aarch64 tarball exists before proposing the version it
found under x86_64.

Engine release notes cover the CLI, and they're HTML with no raw source — the sweep prints
<https://docs.docker.com/engine/release-notes/> for you to `WebFetch` rather than fetching it.

## ripgrep and fzf — richer changelog than the release body

Both keep a root `CHANGELOG.md` that's fuller than what the GitHub release body carries. The sweep
reads release bodies uniformly; if one comes back thin, `WebFetch` the raw `CHANGELOG.md` from the
repo's default branch before writing the summary.
