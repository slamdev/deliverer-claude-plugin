# 02 — The smoke test asserts the skills invoked by name

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** an installation smoke test that fails, in seconds on a contributor's machine, when the dependency no
longer provides a skill the plugin invokes by name. The dependency floats, and the test asserts today only that
`mattpocock-skills` was brought in — so an upstream rename or removal of `grilling`, `domain-modeling` or `pr` would
first surface as a user's refinement stopping at its grilling or a user's delivery stopping at its change request stage.
Settled in `../spec.md` under Implementation Decisions and Testing Decisions.

- [x] The test names the three skills — `grilling`, `domain-modeling`, `pr` — beside the dependency's name, fixed in the
      test so adding an invocation in shipped prose is an edit somebody makes there on purpose.
- [x] It asserts each is present on the installed session's surface under the dependency's namespace, read from what the
      session loaded and nothing inside the dependency's own files.
- [x] Where the session surface does not yet carry the skills a session loaded, it gains them from the session's own
      initialisation; no new seam is added to the harness.
- [x] A failure names every missing skill and lists what the dependency does provide, so a rename is told apart from a
      removal without rerunning.
- [x] The smoke test passes against a v1.3.1 install, and typecheck and lint pass in the end-to-end package.

## Comments

- The session surface gains `skills` straight from the host's `init` message, which already lists every invocable
  skill as `plugin:skill`; the matcher strips the dependency's namespace before comparing. Run against the v1.3.1
  install, the dependency provided 27 skills, `grilling`, `domain-modeling` and `pr` among them. A run with a bogus
  fourth name failed as `mattpocock-skills is loaded but provides no no-such-skill, … It provides: ask-matt, …`.
- The list's comment names `change-request-creator` as the agent invoking `pr`, which is true once ticket 03 lands.
