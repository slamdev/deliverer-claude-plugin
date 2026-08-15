# 01 — The installation smoke test

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** A contributor runs one command and, in seconds, learns whether the plugin they have on disk still
installs and still presents its whole surface. That is the first end-to-end test this repository has ever had, and it is
worth having on its own: a broken manifest, a `SessionStart` hook that leaves nothing installed, a launcher that cannot
find its data directory, or an option that stopped reaching the tools server are all total failures today, and all of
them are invisible to `tsc`, to `eslint` and to a human reading a diff.

The whole setup path arrives with it, because the test is that path. A **run directory** outside the repository holds
everything one run touches — its own plugin configuration directory, its own temporary directory and its session
records — so no run can reach another and nothing on the contributor's machine can reach either. The plugin under test
is a **staged copy**: the working tree committed into a temporary repository, so the test covers the change in front of
the contributor rather than the last commit. ADR-0016 records why the plugin is installed rather than attached by path
and what that costs; do not re-derive it, and do not reach for the path-attachment route it rejects.

The order of the install matters and the failure is legible: the marketplace entry for the plugin declares a dependency,
so the official marketplace is added first or the install refuses, naming it. The three options are written at **user**
scope in the run's own configuration directory — at project scope they are silently ignored and the server never starts,
which is the failure that looks exactly like a plugin with no review tool.

The session runs in an empty directory inside the **run directory**, and not in this repository. Project scope has to
load something, and what it would load here withholds `deliverer` from `enabledPlugins` under the no-dogfooding rule —
a plugin that is absent for a reason having nothing to do with the plugin, reported as the absence this test is for.

No repository on the forge is involved, and no model is asked to do more than answer trivially. This test should stay
cheap enough that nobody hesitates to run it.

Files: a new `e2e-tests/` at the repository root. `docs/specs/end-to-end-tests/spec.md` §Implementation
Decisions — What is built, How a run is set up, What the runs are configured with.
`docs/adrs/0016-the-end-to-end-tests-install-the-plugin-rather-than-attaching-it.md`.

- [x] `e2e-tests/` is its own package with its own manifest and TypeScript configuration, sharing nothing with the
      tools server's package.
- [x] TypeScript runs through Node's native type stripping — no transform, no build step, no emitted artifact — and the
      typecheck is the only thing that reads the TypeScript configuration, as ADR-0001 has it for the server.
- [x] The tests run under Node's own test runner, not Jest, which was measured unable to reach the criterion above: it
      loads modules through its own runtime and never reaches Node's stripper, so with no transform configured a type
      annotation fails to parse, and no option turns that off. The spec's §What is built carries the measurement.
- [x] Nothing under `e2e-tests/` is published; only `plugin/` ships, and the marketplace entry is untouched.
- [x] A run creates a **run directory** outside the repository carrying its own plugin configuration directory, its own
      temporary directory and its session records.
- [x] The plugin installed is a **staged copy** of the working tree, and its contents match the working tree's plugin
      directory including files that have not been committed.
- [x] The official marketplace is added before the plugin's own, and installing the plugin brings `mattpocock-skills`
      with it rather than anything installing it separately.
- [x] The three options are written at **user** scope in the run's own configuration directory: the effort tier `low`,
      the model `sonnet`, and the environment file the repository's own `.env`, handed over whole.
- [x] No individual credential is read, classified or forwarded by the harness, so it works unchanged whichever way the
      contributor authenticates.
- [x] The session runs in an empty directory inside the **run directory** and loads user and project setting sources
      only, so project scope has nothing to load — never the contributor's machine defaults, and never this
      repository's own settings or `CLAUDE.md`.
- [x] The test asserts both `/deliverer:*` commands, all seven agents, and all three review tools are present in the
      session.
- [x] The test involves no repository on the forge and asks no model for more than a trivial turn.
- [x] Every artefact the run produced is left in the **run directory** whether the test passed or failed.
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
