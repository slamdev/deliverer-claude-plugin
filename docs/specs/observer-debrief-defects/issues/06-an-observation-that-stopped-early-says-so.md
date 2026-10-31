# 06 — An observation that stopped early says so

**What to build:** a human whose observer exited because a record could not be read finds a debrief that says the
observation stopped early, at which entry and why, so they do not forward a partial reading as a final one. Settled as
Solution item 9 and under **Stopped early** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] On the observer's exit because a record could not be read, the debrief's state is "observation stopped early",
      with the last entry read and the reason: neither final nor live.
- [x] A later re-armed observer whose reading succeeds replaces it as it would any non-final debrief.
- [x] A process killed with its container and never touched again stays out of scope.
- [x] Free replay of a record truncated mid-line gives a debrief that says it stopped early at that entry.
- [x] Free replay of an intact record is byte for byte as before.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.
