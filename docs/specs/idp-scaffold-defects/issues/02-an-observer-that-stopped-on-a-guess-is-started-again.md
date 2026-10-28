# 02 — An observer that stopped on a guess is started again

**What to build:** a human whose run outlived its observer — finalised on any finaliser, and exited since — is observed
again the next time their session stops or they type, without doing anything. The fresh observer reads the run whole and
un-finalises the debrief already on disk when the run's **extent** has advanced, as an observer that never died would
have. A session that ended through `SessionEnd` is re-armed only when an event shows it resumed, and a live observer is
never doubled. Settled under **Re-arming a stopped observer** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] On `UserPromptSubmit` and on `Stop`, a marker whose state reads as finalised, with a final reading beside it and
      no observer alive, starts a fresh one through the existing spawn path, marker rewritten before the spawn.
- [x] A marker reading as finalised on the session's end is re-armed like the rest, and a `SessionEnd` signal still on
      disk is removed before the spawn (change request review).
- [x] Whether an observer is alive is readable by the hook without waiting, and a crashed observer reads as not alive.
- [x] Two hook events in a row start one observer, not two.
- [x] The fresh observer rewrites the run's existing debrief rather than writing a second one, and announces it only if
      it un-finalises and later finalises it anew.
- [x] `Stop` still prints nothing when there is nothing final to print, whether or not it re-armed.
- [x] Driven by hand at shortened bounds: an idle finalise left to exit, then a grown record and a `Stop`, un-finalises
      the debrief and carries on; the same with a prompt instead of `Stop`.
- [x] Driven by hand at shortened bounds: a `SessionEnd`-finalised session, then a grown record and a `Stop`,
      un-finalises the debrief and carries on; a `SessionEnd` signal after a settled finish exits at once.
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
  `debrief.md` (`finalised: no`, one debrief in the directory, header 48m12s → 1h43m), re-finalised on the idle bound
  and announced once.
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
  un-finalises as the old observer would have. If not, it exits after `AFTER_FINALISE_MS` with nothing changed. A
  `SessionEnd` signal arriving while it probes marks the session ended and exits, with no rewrite.
- *(Superseded by the review fixes below.)* A re-armed observer that un-finalises and later finalises again runs a
  fresh synthesis. The old observer's answer lived only in its memory, so this costs a second whole-run reading, which
  an observer that never died would not have paid.
- *(Superseded by the review fixes below.)* A marker left by an observer from before this change has no
  `.final-reading` beside it. Its re-armed observer starts from nothing, un-finalises without checking whether the
  extent moved, and announces again at its own finalise.

Review fixes, 2026-10-28, verified by hand with the same harness and bounds — `lib`, `t-legacy`, `t-reuse`,
`walk-stop` and `walk-end` under `/tmp/idp-rev/`, scratch `CLAUDE_PLUGIN_DATA=/tmp/idp-rev/data`, and no `node_modules`
beside the published tree:

- **No final reading, no re-arm.** The hook re-arms only where `.sessions/<id>.final-reading` exists beside the
  marker. A marker from before this change leaves none, so its run is left as that observer left it rather than
  un-finalised unconditionally and announced again. `t-legacy.sh`: idle finalise, observer exited, `.final-reading`
  removed, record grown to 250, then `Stop` and a prompt: both stdouts empty, no observer started, debrief still
  `finalised: yes`, nothing announced. Before the fix the same walk started an observer that un-finalised it.
- **The held answer is carried across the restart.** The finalise also writes what its judge answered into
  `.final-reading` (`judging`, minus `modelEnvironment`, which carries the process's whole environment and is never
  written). The fresh observer seeds its judge with it, so its later finalise reuses that answer exactly as a judge
  that never left memory does — no further notes, no second synthesis. `t-reuse.sh`: after the idle finalise the file
  carried `judging` with no `modelEnvironment`; its `reason` was overwritten with a canary, the record grown, `Stop`
  fired; the fresh observer un-finalised, re-finalised on the idle bound, and the debrief carried the canary — which
  only the file could have supplied. Before the fix the debrief carried a fresh judging's own reason instead.
- `walk-stop.sh` (with `Stop` and with a prompt) and `walk-end.sh` give the results listed above unchanged.

**Change request review (PR #18).** Four review findings reshape this ticket:

- `claude --resume` and `--continue` keep a session's id and append to its record (2.1.311, probed with `-p` and
  matched against the CLI reference), so `SessionEnd` is not a final end. Every finalise now leaves a final reading, the
  session's end included; the hook re-arms any `finalised — ` state that has one, and removes a stale `.finalise`
  first. The observer consumes the signal when it acts on it.
- A `SessionEnd` signal landing after a finalise on a guess was ignored, leaving the observer up for
  `AFTER_FINALISE_MS` after its session was gone. It now restates the final reading as the session's end and exits.
- The probe's un-finalise is folded into the main loop: a probe is the main loop's reading taken off disk while
  `probing`, and a probe that finds the run moved past its inheritance takes the one reversal.

Verified by hand on 2026-10-28 with the same harness and bounds under `/tmp/idp-rev2/`, adding `t-resume.sh`:

- `walk-stop.sh` (with `Stop` and with a prompt), `t-legacy.sh` and `t-reuse.sh` give the results listed above; the
  un-finalise now reads `watching — a run that had gone quiet resumed` under a fresh observer too.
- **A late signal.** Idle finalise, then `SessionEnd` inside the observer's window: it exited 137 ms later (window
  4 s) with marker and final reading both `finalised — the session ended`, the signal gone, nothing re-announced.
- **Quit, then resume.** That session's record grown and a `Stop` fired: one observer re-armed, un-finalised the same
  `debrief.md`, re-finalised on the idle bound and announced once. `walk-end.sh`'s `SessionEnd` case now does the same
  where it used to start nothing.
- **A stale signal.** Idle finalise, observer exited, `SessionEnd` with nobody alive, record grown, `Stop`: the hook
  removed the signal before the spawn, and the fresh observer un-finalised (48m12s → 1h43m) instead of marking the
  session ended.
- `kill -9` and the switched-off feature: unchanged.
