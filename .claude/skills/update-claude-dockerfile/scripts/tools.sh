#!/usr/bin/env bash
# Version sources for every pinned tool in hacks/claude.dockerfile.
#
# This script is the single source of truth for WHICH tools are pinned, WHERE
# their versions come from, and how an upstream tag maps onto the ARG value.
# Per-tool judgement calls (what a bump means, what to double-check) live in
# ../references/tool-sources.md.
#
# Usage:
#   tools.sh sweep [dockerfile]            # current vs latest for every tool, as TSV
#   tools.sh changelog <tool> <current>    # release notes for everything newer than <current>
#
# sweep output: tool<TAB>arg<TAB>current<TAB>latest<TAB>status
#   status = outdated | current | error:<what failed>

set -uo pipefail

SELF_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEFAULT_DOCKERFILE="$(cd "$SELF_DIR/../../../.." && pwd)/hacks/claude.dockerfile"

# tool | ARG | kind | source
# kind drives both the version lookup and the changelog fetch:
#   gh     — GitHub releases (source = owner/repo)
#   npm    — npm dist-tag (source = package); changelog from the repo's CHANGELOG.md
#   node   — nodejs.org dist index, staying on the pinned major
#   docker — download.docker.com static tarball listing
TOOLS=(
  "node|NODE_VERSION|node|"
  "jq|JQ_VERSION|gh|jqlang/jq"
  "yq|YQ_VERSION|gh|mikefarah/yq"
  "claude|CLAUDE_VERSION|npm|@anthropic-ai/claude-code"
  "docker|DOCKER_CLI_VERSION|docker|"
  "buildx|BUILDX_VERSION|gh|docker/buildx"
  "ripgrep|RG_VERSION|gh|BurntSushi/ripgrep"
  "gh|GH_VERSION|gh|cli/cli"
  "delta|DELTA_VERSION|gh|dandavison/delta"
  "fzf|FZF_VERSION|gh|junegunn/fzf"
)

MAX_SECTIONS=20 # cap on changelog entries per tool; overflow is reported, never silent

gh_auth=()
[[ -n "${GITHUB_TOKEN:-}" ]] && gh_auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")

lookup() { # tool -> "arg|kind|source", or empty if unknown
  local tool="$1" entry
  for entry in "${TOOLS[@]}"; do
    [[ "${entry%%|*}" == "$tool" ]] && { printf '%s' "${entry#*|}"; return 0; }
  done
  return 1
}

bare() { # strip any non-digit prefix: jq-1.8.2 -> 1.8.2, v4.53.3 -> 4.53.3
  printf '%s' "${1#"${1%%[0-9]*}"}"
}

restyle() { # re-apply the pin's own prefix to an upstream tag
  printf '%s%s' "${1%%[0-9]*}" "$(bare "$2")"
}

# ---------------------------------------------------------------- version lookup

latest_raw() {
  local kind="$1" source="$2" current="$3"
  case "$kind" in
    gh)
      curl -fsSL --max-time 30 "${gh_auth[@]}" \
        "https://api.github.com/repos/${source}/releases/latest" | jq -er .tag_name
      ;;
    npm)
      curl -fsSL --max-time 30 \
        "https://registry.npmjs.org/${source}" | jq -er '."dist-tags".latest'
      ;;
    node)
      # Stay on the major the pin already tracks — crossing a major is a
      # deliberate call, not something this sweep makes silently.
      local major="${current#v}"
      curl -fsSL --max-time 30 https://nodejs.org/dist/index.json \
        | jq -er --arg m "v${major%%.*}." 'map(select(.version | startswith($m)))[0].version'
      ;;
    docker)
      # X.Y.Z only, which skips -rc/-beta/-tp and the rootless-extras siblings.
      curl -fsSL --max-time 30 https://download.docker.com/linux/static/stable/x86_64/ \
        | grep -oE 'docker-[0-9]+\.[0-9]+\.[0-9]+\.tgz' \
        | sed -e 's/^docker-//' -e 's/\.tgz$//' \
        | sort -V | tail -1 | grep .
      ;;
  esac
}

# Where an upstream index can run ahead of a downloadable artifact, HEAD-check the
# artifact so the sweep never proposes a version the build cannot pull.
verify() {
  local tool="$1" version="$2" code url
  case "$tool" in
    claude) url="https://downloads.claude.ai/claude-code-releases/${version}/linux-x64/claude" ;;
    docker) url="https://download.docker.com/linux/static/stable/aarch64/docker-${version}.tgz" ;;
    *) return 0 ;;
  esac
  code=$(curl -fsIL --max-time 30 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)
  [[ "$code" == "200" ]] && return 0
  echo "artifact not downloadable yet (HTTP ${code:-000} on ${url##*/})"
  return 1
}

sweep() {
  local dockerfile="${1:-$DEFAULT_DOCKERFILE}"
  [[ -f "$dockerfile" ]] || { echo "no such dockerfile: $dockerfile" >&2; exit 1; }

  local workdir entry tool arg kind source
  workdir=$(mktemp -d)
  trap 'rm -rf "$workdir"' RETURN

  for entry in "${TOOLS[@]}"; do
    IFS='|' read -r tool arg kind source <<<"$entry"
    (
      local_current=$(grep -m1 -E "^ARG ${arg}=" "$dockerfile" | cut -d= -f2-)
      if [[ -z "$local_current" ]]; then
        printf '%s\t%s\t\t\terror:no ARG %s in dockerfile\n' "$tool" "$arg" "$arg" >"$workdir/$tool"
        exit 0
      fi

      if ! tag=$(latest_raw "$kind" "$source" "$local_current") || [[ -z "$tag" ]]; then
        printf '%s\t%s\t%s\t\terror:could not fetch latest\n' "$tool" "$arg" "$local_current" >"$workdir/$tool"
        exit 0
      fi

      latest=$(restyle "$local_current" "$tag")
      if [[ "$latest" == "$local_current" ]]; then
        status=current
      elif ! why=$(verify "$tool" "$(bare "$latest")"); then
        status="error:${why}"
      else
        status=outdated
      fi

      printf '%s\t%s\t%s\t%s\t%s\n' "$tool" "$arg" "$local_current" "$latest" "$status" >"$workdir/$tool"
    ) &
  done
  wait

  printf 'tool\targ\tcurrent\tlatest\tstatus\n'
  for entry in "${TOOLS[@]}"; do
    cat "$workdir/${entry%%|*}" 2>/dev/null
  done
}

# ------------------------------------------------------------------- changelogs

# Keep every `## ` section whose version is newer than $cur, capped at $max.
SLICE_AWK='
function vgt(a, b,   x, y, i) {
  split(a, x, "."); split(b, y, ".")
  for (i = 1; i <= 3; i++) {
    if ((x[i]+0) > (y[i]+0)) return 1
    if ((x[i]+0) < (y[i]+0)) return 0
  }
  return 0
}
/^## / {
  ver = ""
  if (match($0, /[0-9]+\.[0-9]+\.[0-9]+/)) ver = substr($0, RSTART, RLENGTH)
  keep = (ver != "" && vgt(ver, cur))
  if (keep) { seen++; if (seen > max) keep = 0 }
}
keep { print }
END { if (seen > max) printf "\n_(%d older entries elided — only the %d most recent are shown.)_\n", seen - max, max }
'

changelog() {
  local tool="$1" current="${2:-}"
  local spec arg kind source cur
  spec=$(lookup "$tool") || { echo "unknown tool: $tool" >&2; exit 1; }
  IFS='|' read -r arg kind source <<<"$spec"
  [[ -n "$current" ]] || { echo "usage: tools.sh changelog <tool> <current-version>" >&2; exit 1; }
  cur=$(bare "$current")

  case "$kind" in
    gh)
      # Newest-first, prereleases dropped, anything newer than $cur kept. jq compares
      # [major,minor,patch] arrays elementwise, so this is a real version comparison.
      curl -fsSL --max-time 60 "${gh_auth[@]}" \
        "https://api.github.com/repos/${source}/releases?per_page=100" \
        | jq -r --arg cur "$cur" --argjson max "$MAX_SECTIONS" '
            def ver(s): [ (s | capture("(?<v>[0-9]+\\.[0-9]+\\.[0-9]+)").v | splits("\\.") | tonumber) ];
            [ .[] | select(.prerelease | not) | select(ver(.tag_name) > ver($cur)) ] as $rs
            | ($rs[:$max][] | "\n## \(.tag_name)\n\n\(.body // "_(no release notes)_")")
            , (if ($rs | length) > $max
               then "\n_(\(($rs|length) - $max) older releases elided — only the \($max) most recent are shown.)_"
               else empty end)'
      ;;
    npm)
      # claude-code publishes to npm but keeps its notes in the repo CHANGELOG.
      curl -fsSL --max-time 60 https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md \
        | awk -v cur="$cur" -v max="$MAX_SECTIONS" "$SLICE_AWK"
      ;;
    node)
      # Each node section ends with a full commit dump an order of magnitude
      # longer than its Notable Changes, so drop it and keep the notes.
      curl -fsSL --max-time 60 \
        "https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V${cur%%.*}.md" \
        | awk -v cur="$cur" -v max="$MAX_SECTIONS" "$SLICE_AWK" \
        | awk '/^### Commits/ { skip = 1 } /^## / { skip = 0 } !skip'
      ;;
    docker)
      # Engine release notes are HTML with no per-version raw source; read them directly.
      echo "No raw changelog. WebFetch https://docs.docker.com/engine/release-notes/${cur%%.*}/ for everything after ${cur}."
      ;;
  esac
}

case "${1:-}" in
  sweep) shift; sweep "$@" ;;
  changelog) shift; changelog "$@" ;;
  *) sed -n '2,20p' "${BASH_SOURCE[0]}" >&2; exit 1 ;;
esac
