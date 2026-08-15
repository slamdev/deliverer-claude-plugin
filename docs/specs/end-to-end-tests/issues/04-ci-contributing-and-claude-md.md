# 04 — CI, CONTRIBUTING and CLAUDE.md

Status: ready-for-agent

**Blocked by:** 03 — The build happy path.

**What to build:** The harness stops rotting between the rare occasions anybody runs it, and somebody who was not in the
conversation that designed it can still run it.

CI gains a typecheck and a lint over `e2e-tests/`, in the job that already exists. It never runs the tests: they create
repositories on the forge and spend real money, and no credential of any kind is added as a repository secret. What CI
buys here is only that the harness still compiles and still lints — which is exactly what stops it decaying while nobody
is looking.

That job is shaped against the addition, so it is reshaped rather than appended to. It is named for the tools server,
and it defaults every step's working directory to `plugin/mcp` — so a harness step that does not name its own directory
checks the server a second time and reports green, which is the failure that looks exactly like a harness that passes.
Its `setup-node` is keyed on the server's lockfile alone, and the harness brings its own. And its lint step carries an
`!cancelled()` guard so a type error cannot bury the lint findings; the same reasoning reaches across the two packages,
because a failure in one must not decide whether the other was checked at all.

CONTRIBUTING gains a section next to its existing account of what CI does not check, because that section is where a
contributor looks and it is about to be partly wrong. It says what the two tests are, what they cost in time and money,
what they need in order to run, how to run them, and what a run leaves behind in its **run directory** for reading
afterwards.

A new section is not the whole of that file's debt. Three passages elsewhere in it stop being true the moment ticket 01
lands: the project tree, which has no `e2e-tests/` in it and annotates the workflow as typecheck plus lint; the CI
section, which opens by saying the one job is entirely inside `plugin/mcp` and then tabulates its four steps; and the
first bullet of what CI does not check, which says there is no test suite at all. That last one keeps its point while
losing its falsehood — the tests exist and CI still does not run them, which is a sharper thing to tell a contributor
than either half on its own.

CLAUDE.md carries a sentence that stops being true the moment ticket 01 lands: that the only checks which exist run from
the tools server. Correct it, and say where the end-to-end tests fit — that they are run deliberately, by hand, and are
not part of the two commands CI runs. Where that correction goes is part of the work rather than a formatting choice:
the sentence sits under a heading about the tools server, and the claim it makes is about the whole repository.

By this point both tests have actually run, so the figures in the documentation are measurements rather than the
estimates the spec carried. Tickets 02 and 03 record what their runs took and cost as comments on their own ticket
files, and that is where these come from: one ticket is one context, and nothing else carries a measurement across.

Publish the ceilings the harness carries when this ticket starts — not the ninety minutes and twenty-five dollars the
spec estimated — and say plainly where a measured run forced one up. Raising a ceiling is not this ticket's to do: its
files are three documents, the constants live in `e2e-tests/`, and a **claim** that turned out false was already put
back to a human while ticket 03 was in flight.

Files: `.github/workflows/ci.yml`, `CONTRIBUTING.md`, `.claude/CLAUDE.md`.
`docs/specs/end-to-end-tests/spec.md` §Implementation Decisions — What changes outside the new directory; §Out of Scope.
The measurements are read from the comments on `docs/specs/end-to-end-tests/issues/02-the-refine-happy-path.md` and
`docs/specs/end-to-end-tests/issues/03-the-build-happy-path.md`.

- [x] CI typechecks and lints `e2e-tests/` in the existing job, with the harness's steps naming their own working
      directory rather than inheriting the job's `plugin/mcp` default, so neither package's check stands in for the
      other's.
- [x] The job's name matches what it now checks, and its dependency cache is keyed on the harness's lockfile as well as
      the server's.
- [x] The tools server's typecheck and lint still run and still report independently, and a failure in either package
      does not decide whether the other was checked.
- [x] CI does not run the end-to-end tests, creates no repository, spends no money, and gains no repository secret.
- [x] CONTRIBUTING says what the tests are, what they cost in time and money, what they need to run, how to run them,
      and what a run leaves behind.
- [x] CONTRIBUTING's project tree, its CI section and its no-test-suite bullet are corrected with it, so the file does
      not contradict its own new section.
- [x] CLAUDE.md no longer claims the only checks that exist run from the tools server, and says where the end-to-end
      tests sit — run deliberately, by hand, and no part of the two commands CI runs.
- [x] The figures published are the ones the runs actually measured, read from the comments tickets 02 and 03 left on
      their own ticket files, and never the spec's estimates.
- [x] The ceilings published are the ones the harness carries, and where a measured run forced one up from the spec's
      figure, that is stated rather than left as a ceiling the happy path cannot fit inside.
- [x] Nothing under `e2e-tests/` is changed by this ticket; its files are the three documents.
- [x] Neither document contradicts the other, itself, the spec, or `CONTEXT.md`.
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.

## Comments

> *This was generated by AI during triage.*

Triage kept this `ready-for-agent` and folded four gaps into the body. The first was a handover with no location: this
ticket's central bar is that the published figures are measurements, and neither ticket 02 nor ticket 03 said where a
run's duration and cost get written down — ticket 03 said only "record" it and ticket 02 said nothing, though this
ticket's body assumes both tests have run. One ticket is one context, so a measurement that is not on a ticket file
does not reach here. Both tickets gained a criterion naming their own `## Comments` section as the place, and 03's
covers a ceiling a human raised as well.

The second was the workflow's shape. `.github/workflows/ci.yml:19-24` names the job for the tools server and sets
`defaults.run.working-directory: plugin/mcp`, so a harness step appended without its own working directory typechecks
the server twice and goes green; `setup-node` is keyed on `plugin/mcp/package-lock.json` alone (`:34`) while ticket 01
gives the harness its own manifest; and the `!cancelled()` guard on the lint step (`:50`) exists so one check cannot
bury another, which is a rule that now spans two packages. The old criterion protected "the two existing steps" and was
silent on all three.

The third was CONTRIBUTING contradicting itself outside the new section — the project tree (`CONTRIBUTING.md:113-154`),
the CI section's "One job, `check`, entirely inside `plugin/mcp`" and its step table (`:204-214`), and "**There is no
test suite.** `package.json` has exactly two scripts" (`:227`). The existing criterion barred contradicting the *other*
document, the spec and `CONTEXT.md`, but not the file itself.

The fourth was which ceiling gets published. A run that exceeds ninety minutes fails, so ticket 03 halts and puts the
**claim** back to a human rather than reaching the state this ticket described; by the time 04 runs, the constant in
`e2e-tests/` is whatever that human left. The body now says to publish the ceiling in force and name the raise, and a
criterion keeps this ticket out of `e2e-tests/` entirely.

Two things settled outside this ticket. `harness` was used throughout the spec and all four tickets while missing from
the glossary, so it is now defined in `CONTEXT.md` §Verification, displacing *framework*, *rig* and *test
infrastructure*; the spec's four uses of those were corrected in the same pass. That makes `CONTRIBUTING.md:264` — "what
keeps a rig from starting a real `npm ci`" — a one-word fix this ticket's last criterion already picks up, since it
opens that file anyway. The spec's twenty-one uses of *harness* were left unbolded, unlike every other glossary term it
names: the word is correct and only its emphasis is inconsistent, so re-marking them is churn this epic does not need.

Every other claim in the body was checked and held: the CLAUDE.md sentence to correct (`.claude/CLAUDE.md:23-24`), the
CONTRIBUTING section to sit beside (`:223`), the two scripts in `plugin/mcp/package.json`, and the spec's own account of
what changes outside the new directory (`spec.md:238-244`) and its bar on repository secrets (`:281-282`). Nothing here
is already built — there is no `e2e-tests/` and no occurrence of the string `e2e` in any tracked markdown, YAML or JSON
— and `.out-of-scope/` does not exist, so no prior rejection resembles it.
