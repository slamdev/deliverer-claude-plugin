# 02 — An observer that stopped on a guess is started again

**What to build:** a human whose run outlived its observer — finalised on the idle bound or the waiting ceiling, and
exited since — is observed again the next time their session stops or they type, without doing anything. The fresh
observer reads the run whole and un-finalises the debrief already on disk when the run's **extent** has advanced, as a
watcher that never died would have. A session that ended through `SessionEnd` is never re-armed, and a live observer is
never doubled. Settled under **Re-arming a stopped observer** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] On `UserPromptSubmit` and on `Stop`, a marker whose state reads as finalised on the observer's own reading, with
      no observer alive, starts a fresh one through the existing spawn path, marker rewritten before the spawn.
- [ ] A marker reading as finalised on the session's end starts nothing.
- [ ] Whether an observer is alive is readable by the hook without waiting, and a crashed observer reads as not alive.
- [ ] Two hook events in a row start one observer, not two.
- [ ] The fresh observer rewrites the run's existing debrief rather than writing a second one, and announces it only if
      it un-finalises and later finalises it anew.
- [ ] `Stop` still prints nothing when there is nothing final to print, whether or not it re-armed.
- [ ] Driven by hand at shortened bounds: an idle finalise left to exit, then a grown record and a `Stop`, un-finalises
      the debrief and carries on; the same with a prompt instead of `Stop`; a `SessionEnd`-finalised session stays put.
- [ ] The hook script's header comment names the new behaviour of both events.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
