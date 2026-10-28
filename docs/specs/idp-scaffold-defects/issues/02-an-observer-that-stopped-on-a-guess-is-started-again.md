# 02 — An observer that stopped on a guess is started again

**What to build:** a human whose run outlived its observer — finalised on the idle bound or the waiting ceiling, and
exited since — is observed again the next time their session stops or they type, without doing anything. The fresh
observer reads the run whole and un-finalises the debrief already on disk when the run's **extent** has advanced, as a
watcher that never died would have. A session that ended through `SessionEnd` is never re-armed, and a live observer is
never doubled. Settled under **Re-arming a stopped observer** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] On `UserPromptSubmit` and on `Stop`, a marker whose state reads as finalised on the observer's own reading, with
      no observer alive, starts a fresh one through the existing spawn path, marker rewritten before the spawn.
- [x] A marker reading as finalised on the session's end starts nothing.
- [x] Whether an observer is alive is readable by the hook without waiting, and a crashed observer reads as not alive.
- [x] Two hook events in a row start one observer, not two.
- [x] The fresh observer rewrites the run's existing debrief rather than writing a second one, and announces it only if
      it un-finalises and later finalises it anew.
- [x] `Stop` still prints nothing when there is nothing final to print, whether or not it re-armed.
- [x] Driven by hand at shortened bounds: an idle finalise left to exit, then a grown record and a `Stop`, un-finalises
      the debrief and carries on; the same with a prompt instead of `Stop`; a `SessionEnd`-finalised session stays put.
- [x] The hook script's header comment names the new behaviour of both events.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

Verified by hand on 2026-10-28, against a scratch `CLAUDE_PLUGIN_DATA=/tmp/idp-02/data` with the observer tree copied in
(no `node_modules` beside it, so nothing judging could spend), a copy of the `/deliverer:build` record cut to 150
entries and grown to 250, and bounds of tick 200 ms, refresh 500 ms, idle 3 s, after-finalise 4 s, patience 5 s. The
scripts were `/tmp/idp-02/{lib,walk-stop,walk-end}.sh`; hook events were fired at `plugin/hooks/observe-run.sh`.

- Idle finalise, then `Stop` inside the observer's window: its line printed, no second observer.
- After it exited, `Stop` with the record unchanged: stdout empty, a fresh observer started (marker rewritten to
  `re-armed by the Stop hook: …` first), debrief stayed `finalised: yes`, nothing announced, and on exit the marker
  read the original `finalised — nothing was written anywhere for the idle bound` again.
- Record grown to 250, two `Stop`s back to back: both stdouts empty, one observer; it un-finalised the same
  `debrief.md` (`finalised: no`, one debrief in the directory, header 48m12s → 1h43m), re-finalised on the idle bound and
  announced once.
- The same three walks with `UserPromptSubmit` instead of `Stop`: identical results.
- `SessionEnd`-finalised session, record grown, then `Stop` and a prompt: no observer started.
- A fresh observer `kill -9`ed mid-window leaves its pid in `.lock`; the next `Stop` read it as not alive and
  re-armed.
- `npm run typecheck && npm run lint` pass in `plugin/mcp`.

Decisions taken on the spec's behalf:

- Liveness is the existing `.sessions/<id>.lock` pid from `observe.mjs`, probed with `kill -0`; no new file.
- The re-arm condition is any marker state beginning `finalised — ` other than `finalised — the session ended`
  (`SESSION_ENDED_STATE` in `announce.ts`), so ticket 03's finished-and-settled guess joins it with no hook change.
- The hook overwrites the marker, so a finalise on a guess also writes `.sessions/<id>.final-reading` (the state,
  the extent's end, the dispatch count, the debrief's path). A fresh observer inherits it: it treats the debrief as
  already final and reads off disk only (no write, no judge) until the extent advances past it. If it does, it
  un-finalises as the old watcher would have. If not, it exits after `AFTER_FINALISE_MS` with nothing changed. A
  `SessionEnd` signal arriving while it probes marks the session ended and exits, with no rewrite.
- A re-armed observer that un-finalises and later finalises again runs a fresh synthesis. The old observer's
  answer lived only in its memory, so this costs a second whole-run reading, which a watcher that never died would
  not have paid.
- A marker left by an observer from before this change has no `.final-reading` beside it. Its re-armed observer
  starts from nothing, un-finalises without checking whether the extent moved, and announces again at its own
  finalise.
