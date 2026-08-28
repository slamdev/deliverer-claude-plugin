#!/usr/bin/env bash
# SessionStart hook — put the plugin's Node code and its dependencies in the plugin's PERSISTENT
# DATA DIRECTORY, and keep them current (delegated-review ticket 03; extended to the observer's
# source by run-observation ticket 04).
#
# Why a hook at all: the plugin ships its Node code as source with no build step and no vendored
# dependencies, so something has to install them on the user's machine. Doing it at session start
# means the owner never builds anything by hand (spec user story 11), and because the data directory
# survives plugin updates the install is paid ONCE PER HOST rather than per session or per bed
# (user story 13).
#
# Why the data directory rather than the plugin's own: the plugin directory may be a read-only cache,
# and the documented `NODE_PATH` approach for pointing Node at modules installed elsewhere resolves
# CommonJS only — it does NOT resolve the ESM imports this server uses. So the source is copied to sit
# BESIDE the installed `node_modules`, which is the only arrangement in which those imports resolve,
# and `mcp/launch.mjs` and `mcp/observe.mjs` run it from there.
#
# Why a stamp rather than an existence check: an update that changes the bundled dependency manifest
# leaves `node_modules` exactly as present as before (spec user story 12). So a copy of the bundled
# manifest and lockfile is kept under the data directory and compared byte for byte; a difference in
# either reinstalls. The stamp is written ONLY after a successful install and removed before one
# starts, so a failed install can never leave behind the marker that would skip the next session's
# retry.
#
# This hook NEVER fails a session. Every problem it can hit — no data directory, a registry outage —
# is reported on stderr and exits 0: a delivery that cannot review is a loud failure later
# (the server's own launcher says exactly what is missing), while a session that will not start is a
# plugin nobody can use at all.
#
# THIS hook reads its options from NOTHING. `CLAUDE_PLUGIN_OPTION_<KEY>` reaches a hook only when the
# option was explicitly set — at the manifest default the variable is absent entirely (measured,
# ticket 02) — so a hook must not read one to learn an effective VALUE. Effort, model and the review's
# environment file reach the server through the MCP `env` map instead, which has no such gap. What a
# hook CAN read that way is a switch whose default is on, where absence is the answer rather than a
# gap: `hooks/observe-run.sh` reads exactly one, and nothing here does.
set -uo pipefail

# Derived from this script's own location, not from `CLAUDE_PLUGIN_ROOT`: that variable is guaranteed
# in the hook COMMAND (the host substitutes it) but not in the hook's environment, and the location is
# unambiguous anyway.
PLUGIN_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$PLUGIN_ROOT/mcp"

warn() { printf 'deliverer: %s\n' "$*" >&2; }

DATA="${CLAUDE_PLUGIN_DATA:-}"
if [[ -z "$DATA" ]]; then
  warn "CLAUDE_PLUGIN_DATA is not set, so the tools server's dependencies were not installed." \
       "The plugin's review round will not work in this session."
  exit 0
fi

if ! mkdir -p "$DATA"; then
  warn "cannot create the plugin data directory $DATA — the tools server was not installed."
  exit 0
fi

STAMP="$DATA/.deliverer-deps-stamp"
LOCK="$DATA/.deliverer-install.lock"

# ── does anything need installing? ──
install_needed() {
  [[ -d "$DATA/node_modules" ]] || return 0
  cmp -s "$SRC/package.json" "$STAMP/package.json" || return 0
  cmp -s "$SRC/package-lock.json" "$STAMP/package-lock.json" || return 0
  return 1
}

# The install's mutual exclusion, which the source publish below has by construction and this block
# had not. Concurrent SessionStart hooks in one data directory are routine, and `npm ci` DELETES
# `node_modules` before repopulating it — so two of them is not merely a wasted install: hook A
# writes the stamp while hook B has the tree wiped, and a launcher spawned in that window passes its
# whole gate (source, `node_modules`, stamp all present) and dies on `ERR_MODULE_NOT_FOUND`. That is
# the silent no-review-tool outcome the stamp exists to prevent, arriving through the door the
# source publish closed (PR #11 review round 2).
#
# `mkdir` and not `flock`: the atomic-create primitive every POSIX filesystem has, where `flock(1)`
# is a Linux-ism absent on macOS. The holder's pid goes inside, because the cost of a lock in a
# directory designed to survive everything is that a killed holder would wedge every later install
# — so a lock whose holder is gone is not a lock, the same liveness rule the leftover sweep uses.
# The waiter is bounded and then gives up rather than installing anyway: a holder still running
# after the bound is still going to write the stamp, and a second `npm ci` is the defect above.
LOCK_POLL_SEC=0.2
LOCK_WAIT_POLLS=3000  # ~600 s, matched to the hook's own registered timeout
# A lock directory whose `pid` file never appears belongs to a holder killed between the two, which
# no liveness check can see. Treated as stale after this many consecutive polls (~5 s).
LOCK_NO_PID_POLLS=25

# 0 if the lock is now ours, 1 if the wait ran out with someone else holding it.
acquire_install_lock() {
  local polls=0 no_pid=0 holder
  while true; do
    if mkdir "$LOCK" 2>/dev/null; then
      printf '%s\n' "$$" > "$LOCK/pid"
      return 0
    fi
    holder="$(cat "$LOCK/pid" 2>/dev/null || true)"
    if [[ "$holder" =~ ^[0-9]+$ ]]; then
      no_pid=0
      if ! kill -0 "$holder" 2>/dev/null; then rm -rf "$LOCK"; continue; fi
    else
      no_pid=$(( no_pid + 1 ))
      if (( no_pid >= LOCK_NO_PID_POLLS )); then rm -rf "$LOCK"; continue; fi
    fi
    (( polls++ >= LOCK_WAIT_POLLS )) && return 1
    sleep "$LOCK_POLL_SEC"
  done
}

# Ownership-checked, and it DISARMS the trap — both halves for one reason (PR #11 review round 2).
# This runs twice: explicitly once the install is decided, and again from the `EXIT` trap that
# backstops a kill between the two. An unconditional `rm -rf` on the second call deletes whatever
# lock is at that path by then, which is the lock the NEXT hook took the moment this one released —
# and a third session then finds no lock and runs a second `npm ci` beside it, the very defect the
# lock exists to close. `trap - EXIT` makes the second call not happen at all; the ownership check
# makes it harmless if it somehow does (a kill between the two calls, which the trap is for).
# `return 0` because a non-owner release is a no-op, not a hook failure.
release_install_lock() {
  if [[ "$(cat "$LOCK/pid" 2>/dev/null || true)" == "$$" ]]; then rm -rf "$LOCK"; fi
  trap - EXIT
  return 0
}

if install_needed; then
  if acquire_install_lock; then
    trap 'release_install_lock' EXIT
  else
    warn "another session has been installing the tools server's dependencies in $DATA for a" \
         "long time; leaving it to finish rather than running a second install over it."
  fi
fi

# Re-read the world now that the lock is ours: the hook we waited behind may have installed exactly
# the manifest this one wanted, in which case there is nothing left to do.
need_install=0
install_needed && need_install=1
# Nothing is installed without the lock — a second `npm ci` in this directory is the defect above,
# and a session that skips the install still publishes the source and still exits 0.
[[ -d "$LOCK" && "$(cat "$LOCK/pid" 2>/dev/null || true)" == "$$" ]] || need_install=0

if (( need_install )); then
  if ! cp -f "$SRC/package.json" "$SRC/package-lock.json" "$DATA/"; then
    warn "cannot copy the server's dependency manifest into $DATA — nothing was installed."
    exit 0
  fi
  # Removed BEFORE the install, so an interrupted or failed run cannot leave a stamp that claims the
  # current manifest is installed when it is not.
  rm -rf "$STAMP"
  # `npm ci`, not `npm install`: the plugin SHIPS `mcp/package-lock.json` and it was copied into
  # `$DATA` a few lines above, precisely so the tools server's dependency tree is the one that was
  # tested. `install` is free to resolve something else, which also made the stamp dishonest — it
  # compares manifests, so it can only mean "the installed tree is the manifests' tree" if the
  # install honoured the lock (PR #11 grill, agenda A14).
  # `--omit=dev` because a user installs no test tooling; stdout is redirected to stderr because a
  # SessionStart hook's stdout is context for the model, and npm's progress is not.
  if ( cd "$DATA" && npm ci --omit=dev --no-audit --no-fund --loglevel=error >&2 ); then
    if mkdir -p "$STAMP" && cp -f "$SRC/package.json" "$SRC/package-lock.json" "$STAMP/"; then
      :
    else
      warn "installed the tools server's dependencies but could not stamp $STAMP;" \
           "the next session will reinstall them."
    fi
  else
    warn "installing the tools server's dependencies in $DATA failed (see npm's output above)." \
         "No stamp was written, so the next session retries. The review round will not work until" \
         "it succeeds."
  fi
fi

# Released as soon as the install is decided, not at exit: the source publish below needs no
# exclusion (per-process staging, atomic `ln -sfn`), so holding it there would make every concurrent
# session wait for a copy it could have done itself. The release checks ownership and disarms the
# `EXIT` trap that backstopped a kill between the two, so the publish below can no longer end by
# deleting the lock the next hook has already taken.
release_install_lock

# ── the source, every session ──
# Checked unconditionally: a plugin update can change the source without touching its dependency
# manifest, and the copy is a handful of small files.
#
# TWO TREES ARE PUBLISHED THROUGH ONE FUNCTION (run-observation ticket 04): the tools server, which
# `mcp/launch.mjs` imports, and the observer, which `mcp/observe.mjs` imports. Everything below was
# written for the first and is the product of two review rounds against precisely the failures a
# second, less careful mechanism would reopen for BOTH of them — an absent-path window a launcher
# spawned into, and two concurrent hooks interleaving into a nested tree. So the observer's tree is
# published by the same code rather than beside it, and every property below holds for each: a path
# that never resolves to nothing, one atomic replacement, per-process staging names, and a leftover
# sweep that knows every name either tree can leave behind.
#
# `$DATA/<name>` is a SYMLINK to a per-process directory, published with `ln -sfn`, which replaces
# the link in one atomic rename. The two-rename swap this replaced (move the published tree away,
# move the staged tree in) left `$DATA/server` genuinely absent between the renames — and the host
# is measured to spawn the MCP server BEFORE this hook finishes, so a launcher could be resolving
# modules right through that window and come up with no review tool for the session. It also let two
# concurrent hooks interleave into a nested tree (`mv` onto a path that had become a directory again;
# `mv -T` is not portable to BSD `mv`), which had to be detected and repaired after the fact.
# Publishing through a link makes both unrepresentable rather than rare: the path always resolves,
# and a racing hook's `ln -sfn` merely replaces the link with an equivalent one — each points at that
# hook's own complete tree, and both trees hold the same source (PR #11 grill, agenda A16/A17).
#
# Consumers, all checked: `mcp/launch.mjs` resolves `$DATA/server/index.ts`, `mcp/observe.mjs`
# resolves `$DATA/observer/observer.ts`, and Node resolves ESM imports straight through a symlinked
# directory (the modules they need sit beside them in `$DATA/node_modules`, reached from the REAL
# path, which is a sibling — so nothing depends on the link being preserved in the resolved path).
# And the leftover sweep knows all three names of each tree, so neither a link nor the tree it
# points at is ever swept as debris.
publish_tree() {
  local name="$1" what="$2" staged published link current leftover leftover_pid publish_seq

  # The staging and published paths are PER PROCESS. Concurrent SessionStart hooks in one data
  # directory are routine (two windows on one host, or a suite driving two sessions), and this runs
  # unconditionally in every one of them: with fixed names, the second hook's opening `rm -rf`
  # deletes files the first is mid-copy into, `cp -R` can still exit 0 having copied a subset, and
  # the partial tree is what every later session's launcher imports. A name no other process can
  # guess removes that collision without needing a lock. Each is still cleared first, so a stale
  # tree left by a crashed run that happened to hold this pid cannot be published.
  staged="$DATA/$name.staged.$$"
  published="$DATA/$name.d.$$"
  link="$DATA/$name"
  rm -rf "$staged"
  # Sweep the pid-named leftovers of runs that are gone: a killed hook's staging tree, and any
  # published tree that is no longer what the link points at. Only this pid's staging name is
  # cleared above, so without this they accumulate in a directory whose whole point is that it
  # survives everything. Two trees are NEVER swept — a live pid's (it is a concurrent hook's work in
  # progress, or its freshly published tree) and whatever the link currently resolves to, however
  # long dead the pid that published it, because that one is the running server's source. The glob
  # is the tree's OWN name, so one tree's sweep can never reclaim the other's.
  current=""
  [[ -L "$link" ]] && current="$(readlink "$link" 2>/dev/null || true)"
  for leftover in "$DATA/$name.staged."* "$DATA/$name.d."*; do
    [[ -e "$leftover" ]] || continue
    [[ "$leftover" == "$current" ]] && continue
    leftover_pid="${leftover##*.}"
    [[ "$leftover_pid" =~ ^[0-9]+$ ]] || continue
    kill -0 "$leftover_pid" 2>/dev/null || rm -rf "$leftover"
  done
  if cp -R "$SRC/$name" "$staged"; then
    if [[ -L "$link" ]] && diff -r -q "$staged" "$link" >/dev/null 2>&1; then
      # Byte for byte what is already published, so there is nothing to publish. Any non-zero exit —
      # a difference, or no `diff` on this host — falls through to the publish.
      rm -rf "$staged"
    else
      # A pre-symlink layout (an older plugin version published a real directory here) is migrated
      # once: `ln -sfn` onto an existing DIRECTORY would create the link inside it rather than
      # replace it. This is the only path that removes the published tree before linking, and it
      # runs at most once per data directory.
      #
      # That removal REOPENS the absent-path window the symlink publish exists to close, and the
      # window is ACCEPTED rather than engineered away (PR #11 grill, agenda A11). A launcher
      # spawning inside it finds no entry, so that session has no review tool and P0's tool check
      # refuses the delivery naming this hook — loud, at minute zero, and recovered by starting a
      # second session. The alternatives are worse: renaming the old tree aside keeps a rollback
      # copy nothing ever reads and gives the sweep above one more case to reason about, and a
      # fixed-name target (`server.current`) would make the window PERMANENT, since swapping a fixed
      # name is not atomic against a concurrent launcher. Once-per-data-directory beats forever.
      if [[ -d "$link" && ! -L "$link" ]]; then rm -rf "$link"; fi
      # PID REUSE, the one case in which this pid's publish name is already the LIVE one (PR #11
      # review round 2). The data directory survives every reboot, so a hook can be handed a pid an
      # earlier hook published under; with a changed source the `diff` short-circuit above is not
      # taken, and removing `$published` would then delete the tree `$link` resolves to — leaving it
      # resolving to nothing until the `mv` below, which is precisely what the symlink publish exists
      # to make unrepresentable. Publish under a different name instead, and keep the PID LAST in it
      # so the leftover sweep above can still read a pid off the tree and reclaim it once the link
      # moves on (a name it cannot parse is never swept, in a directory that survives everything).
      if [[ "$published" == "$current" ]]; then
        publish_seq=2
        while [[ -e "$DATA/$name.d.$publish_seq.$$" ]]; do publish_seq=$(( publish_seq + 1 )); done
        published="$DATA/$name.d.$publish_seq.$$"
      fi
      rm -rf "$published"
      mv "$staged" "$published"
      # The whole publish, atomically: after this rename the link resolves to a complete tree, and
      # before it, it resolved to the previous complete one. There is no instant in which it
      # resolves to nothing.
      ln -sfn "$published" "$link"
    fi
  else
    rm -rf "$staged"
    warn "cannot copy $what into $DATA — $what will not run."
  fi
}

if [[ -d "$SRC/server" ]]; then
  publish_tree server "the tools server's source"
else
  warn "the plugin ships no server source at $SRC/server — the review round will not work."
fi

# The observer's own tree. Its absence costs observation and nothing else: no run, no review and no
# session depends on it, which is why this warns and carries on exactly as the block above does.
if [[ -d "$SRC/observer" ]]; then
  publish_tree observer "the observer's source"
else
  warn "the plugin ships no observer source at $SRC/observer — runs will not be observed."
fi

exit 0
