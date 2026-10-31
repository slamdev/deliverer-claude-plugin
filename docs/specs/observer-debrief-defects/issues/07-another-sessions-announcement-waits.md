# 07 — Another session's announcement waits until this run is over

**What to build:** a human mid-run in one worktree is told nothing about another epic's debrief until their own run is
over, and loses nothing by the wait. Outside a live run, the run-observation spec's "from any session" (D25) stands.
Settled as Solution item 7 and under **Holding announcements** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] **Live** is the session's own observation marker present and its observer alive, the liveness test the re-arm
      already uses.
- [ ] While this session is live, the prompt hook prints only announcements this session wrote. Others stay pending on
      disk, untouched.
- [ ] Held announcements print on the first prompt after this session is no longer live.
- [ ] Driven by hand through the hook script at shortened bounds, two sessions sharing one plugin data directory: a
      prompt in the live one prints only its own announcement; once its run finalises, the next prompt prints the
      other's.
- [ ] The hook script's header comment names the held announcements.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
