#!/usr/bin/env bash
# The observer's three hook events, in one script (run-observation ticket 04; D22, D23, D25, D26
# and D29). `hooks.json` registers this same file for all three, and it branches on the event the
# host names in its payload:
#
#   UserPromptSubmit  start an observer when this prompt begins or resumes a run, and print a
#                     debrief nobody has been shown yet — from ANY session, which is what a debrief
#                     finalised after its terminal closed needs.
#   Stop              print this session's debrief if the observer has one ready, and NOTHING at
#                     all if it has not. A refinement stops for every question it asks, so silence
#                     here is the common case and has to cost nothing.
#   SessionEnd        tell the running observer to finalise, and return. It never finalises
#                     anything itself: the host gives a SessionEnd hook 1500 ms before it aborts it
#                     and force-exits about five seconds later, and the only way to raise that is
#                     to declare a `timeout` — which would make EVERY exit of EVERY session wait,
#                     observed or not.
#
# THE SWITCH IS READ FROM THE ENVIRONMENT, NEVER FROM `${user_config.*}` (D26, claim C1). A hook
# reads the SAVED option values, where the MCP path merges the manifest's defaults first — so an
# option sitting at its default is absent to a hook by either route, and only the environment
# variable's absence is survivable: a `${user_config.*}` reference in a shell-form command is
# refused before the hook runs at all, and in exec form it throws `Plugin option "…" isn't set`.
# For a switch that defaults to ON that is nearly every user. Absent here means nobody set it,
# which is the answer rather than a gap.
#
# EVERYTHING THIS SCRIPT PRINTS IS `systemMessage` AND NOTHING ELSE (claim C3). The observer writes
# the whole JSON document, already escaped, into `.announce/` — so this script `cat`s a file and
# has no opinion about wording, no `jq` and nothing to escape. `hookSpecificOutput.additionalContext`
# is never used: on `Stop` it is feedback for the MODEL and the conversation continues on it, which
# would prod a run this feature must never touch.
#
# IT NEVER FAILS A SESSION and never delays one. Every path exits 0, the observer is spawned
# detached with its stdio closed, and nothing here is ever waited on.
set -uo pipefail

# Derived from this script's own location for `install-mcp-server.sh`'s reason: `CLAUDE_PLUGIN_ROOT`
# is guaranteed in the hook COMMAND, not in the hook's environment.
PLUGIN_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

# ── the switch (D26) ──
# Anything that reads as "off" switches the whole feature off; everything else, including an absent
# variable, leaves it on. Spelled out rather than lower-cased with `${x,,}`, which bash 3.2 — what
# macOS ships as /bin/bash — does not have.
case "${CLAUDE_PLUGIN_OPTION_OBSERVE_RUNS:-}" in
  false|False|FALSE|0|off|Off|OFF|no|No|NO|disabled|Disabled) exit 0 ;;
esac

DATA="${CLAUDE_PLUGIN_DATA:-}"
# No data directory means nowhere to put a trace, a debrief or a line about either. The
# SessionStart install hook already says so on its own stderr; there is nothing to add here.
[[ -n "$DATA" ]] || exit 0

OBSERVATIONS="$DATA/observations"
SESSIONS="$OBSERVATIONS/.sessions"
ANNOUNCE="$OBSERVATIONS/.announce"

PAYLOAD="$(cat)"

# One JSON string field out of the payload. Values that carry a backslash stop the match, which for
# the three fields read here — a uuid, a POSIX path and an event name — never happens.
field() {
  if [[ "$PAYLOAD" =~ \"$1\"[[:space:]]*:[[:space:]]*\"([^\"\\]*)\" ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
  fi
}

EVENT="$(field hook_event_name)"
SESSION_ID="$(field session_id)"
RECORD="$(field transcript_path)"

# The id is concatenated into a path on both sides of this contract, so it is checked before it is:
# `observer/announce.ts` carries the same pattern and the two must stay the same.
[[ "$SESSION_ID" =~ ^[A-Za-z0-9._-]{1,200}$ ]] || exit 0

MARKER="$SESSIONS/$SESSION_ID.observer"

# ── printing a line the observer left (D25) ──
# The file IS the hook's whole stdout. Printing it is what "the human has now been shown this"
# means, so both halves go the moment either is printed.
print_announcement() {
  local shown="$1" other="$2"
  [[ -f "$shown" ]] || return 1
  cat "$shown" 2>/dev/null || return 1
  rm -f "$shown" "$other"
  return 0
}

case "$EVENT" in

  Stop)
    # Nothing at all unless the observer has finalised a debrief for THIS session. A refinement
    # stops for every question it puts to its human, and none of those is a debrief to name.
    print_announcement "$ANNOUNCE/$SESSION_ID.stop.json" "$ANNOUNCE/$SESSION_ID.prompt.json"
    exit 0
    ;;

  SessionEnd)
    # Signals and never performs. Two `mkdir`s and a `printf`, so the session's exit waits on
    # nothing measurable; the observer picks the file up on its next tick, and its own idle bound
    # catches a signal that did not land in time.
    if [[ -f "$MARKER" ]]; then
      mkdir -p "$SESSIONS" 2>/dev/null &&
        printf 'session ended\n' > "$SESSIONS/$SESSION_ID.finalise" 2>/dev/null
    fi
    exit 0
    ;;

  UserPromptSubmit) ;;

  # An event this script was not registered for. Nothing to do, and nothing to say about it.
  *) exit 0 ;;
esac

# ── UserPromptSubmit ──

# A debrief nobody has been shown yet, from any session — including one whose terminal was closed
# days ago, which is the whole reason this line exists beside the stop one. Oldest first, and one
# per prompt: a hook has one stdout and it carries one JSON document.
if [[ -d "$ANNOUNCE" ]]; then
  for pending in "$ANNOUNCE"/*.prompt.json; do
    [[ -f "$pending" ]] || continue
    print_announcement "$pending" "${pending%.prompt.json}.stop.json" && break
  done
fi

# Once an observer exists for this session, nothing below is asked again — which is what keeps the
# scan underneath from running on every prompt of a run that is already being watched.
[[ -e "$MARKER" ]] && exit 0

# Is this prompt the command that starts a run? Both skills declare `disable-model-invocation`, so
# a run can only ever begin with a human typing one of them.
starts_a_run() {
  case "$PAYLOAD" in
    *'"prompt":"/deliverer:'*) return 0 ;;
    *'"prompt": "/deliverer:'*) return 0 ;;
    *'"prompt":"<command-name>/deliverer:'*) return 0 ;;
  esac
  return 1
}

# Does this session's record already carry deliverer attribution? That is how a run RESUMED by
# prose rather than re-typed is covered (D22).
#
# BOUNDED, because this runs on every prompt of every session on the machine and not only on
# deliverer's. Measured on the eight runs on the machine this was written against: every one of
# them carries its first attributed entry between 60 KB and 64 KB into the record — the skill
# preamble, right after the host's own opening — while the LAST one sits between 460 KB and 1.6 MB
# from the end. So the head is what finds a run and the tail finds none of them; the tail half is
# here for the other shape, a session whose first quarter-megabyte is somebody else's work. Whole
# records run to 812 KB beside 5.9 MB of per-dispatch records, and reading one of those per prompt
# is the criterion this bound exists to meet.
#
# Measured at 29 ms per prompt on a session with no run in it, against an 872 KB record — of which
# 11 ms is this shell starting at all and the rest is process creation rather than bytes: 64 KB
# windows measure the same 29 ms, so the generous margin over the 60 KB the runs actually need
# costs nothing. Once an observer exists for the session the marker above short-circuits all of it.
HEAD_BYTES=262144
TAIL_BYTES=262144
ATTRIBUTION='"attributionPlugin":"deliverer"'

already_a_run() {
  [[ -f "$RECORD" ]] || return 1
  local found=1
  # `pipefail` is off for exactly these two pipelines, and leaving it on is a defect that looks
  # like a run nobody observed: `grep -q` exits on its first match, `head` is then killed by
  # SIGPIPE with its quarter-megabyte half-written, and `pipefail` reports the pipeline as failed —
  # so the EARLIER the attribution, the more certainly the scan says there is none. Every run
  # measured carries its first attributed entry around 60 KB in, which is as early as it gets.
  set +o pipefail
  head -c "$HEAD_BYTES" "$RECORD" 2>/dev/null | grep -q -F "$ATTRIBUTION" && found=0
  if (( found )); then
    tail -c "$TAIL_BYTES" "$RECORD" 2>/dev/null | grep -q -F "$ATTRIBUTION" && found=0
  fi
  set -o pipefail
  return "$found"
}

if starts_a_run || already_a_run; then
  # The marker goes down BEFORE the spawn, so two prompts submitted back to back cannot start two
  # observers. The observer rewrites it with its own state, and removes it in exactly one case:
  # having waited out its patience and found no run in this record at all, so that a real
  # `/deliverer:` command later in the same session is still observed.
  mkdir -p "$SESSIONS" 2>/dev/null &&
    printf 'started by the UserPromptSubmit hook\n' > "$MARKER" 2>/dev/null

  # DETACHED, with stdio closed. A child holding this hook's stdout open keeps the host waiting on
  # the pipe long after the hook has exited — the run waiting on the observer. `mcp/observe.mjs`
  # re-spawns itself into its own session as its first act, which is a real `setsid(2)` on every
  # platform where `setsid(1)` exists on none of them.
  #
  # NOT the host's own `async` hook option, which backgrounds a hook but leaves the host tracking
  # it and delivering its later output into the session as an attachment — the one thing an
  # out-of-band observer may never do (D1).
  if command -v nohup >/dev/null 2>&1; then
    nohup node "$PLUGIN_ROOT/mcp/observe.mjs" "$SESSION_ID" "$RECORD" \
      </dev/null >/dev/null 2>&1 &
  else
    node "$PLUGIN_ROOT/mcp/observe.mjs" "$SESSION_ID" "$RECORD" </dev/null >/dev/null 2>&1 &
  fi
  disown 2>/dev/null || true
fi

exit 0
