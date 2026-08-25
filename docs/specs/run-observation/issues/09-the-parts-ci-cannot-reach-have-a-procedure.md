# 09 — The parts CI cannot reach have a procedure

Status: ready-for-agent

**Blocked by:** 06, 07

**What to build:** a contributor who changes the observer knows what to run before calling it done. Nothing here is
covered by CI and only the shallowest part of it is covered by a paid test, which is exactly the position the tools
server is already in — so this is the section that does for observation what § Exercising the install by hand does for
the launcher. Settled under Testing Decisions in `../spec.md`.

- [ ] CONTRIBUTING § What CI does not check names the hook states worth walking, each with what it should do: a
      session with no run in it, a command typed, a run resumed by prose, a session ended mid-run, a killed
      terminal, and observation switched off.
- [ ] The replay procedure is complete in both forms — with judging unavailable, which is free and deterministic,
      and with judging on, which costs one call and is what actually exercises the judgement.
- [ ] It says which artifacts to read afterwards and what each one should contain.
- [ ] It states plainly that the observer is verified by hand and that CI runs none of it.
- [ ] Nothing anywhere claims this repository has a test suite.
- [ ] The list of what CI does not check is accurate again once observation exists — it currently names the server,
      the launcher and the hook, and observation joins them.
