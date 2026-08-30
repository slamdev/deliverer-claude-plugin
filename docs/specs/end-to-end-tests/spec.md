# End-to-end tests that deliver a real epic with the plugin under test

Status: ready-for-agent

## Problem Statement

Nothing has ever run this plugin against a repository and checked what came out.

CI typechecks and lints the tools server. That is the whole of it, and CONTRIBUTING says so plainly: no test suite, no
markdown checked, nothing that runs the server, the launcher or the `SessionStart` hook, no manifest validated. The two
**skills** and the seven agents are the product — prose written to be read by a model — and they are held up by nobody
reading them but a human, once, at review time.

So the failures that reach a user are the ones no reader catches. A **skill** whose wording quietly stops a stage
running. An agent whose `disallowedTools` line makes its own job impossible. A manifest option that no longer reaches
the server. An install hook that leaves a session with no review tool. Each of those is invisible to `tsc`, invisible to
`eslint`, and invisible to a careful human reading a diff — and each of them is total: the plugin still loads, still
answers, and delivers nothing.

The scripted review double (ADR-0011) covers the review lifecycle in milliseconds and for free, and it is deliberately
the only thing verified that way. Everything above it — whether `/deliverer:refine` turns an **idea** into a published
**spec** and its **tickets**, whether `/deliverer:build` turns an **epic** into a **change request** a human can merge —
has never been executed by anything but a person deciding to try it.

A contributor who edits a `SKILL.md` today has no way to find out whether they broke delivery, short of delivering
something.

## Solution

Two end-to-end tests, one per skill, each driving a whole **run** against a real repository on a real forge with real
models, and each judged on what a human would look at afterwards.

They live in `e2e-tests/` at the repository root, written in TypeScript and run by Node's own test runner. A contributor
runs them deliberately, on their own machine, before a merge that touches the product. CI never runs them and never
spends money; it gains only a typecheck and a lint over the new directory so the harness cannot rot silently between the
rare occasions anybody runs it.

Each test installs the plugin the way a user does, from a **staged copy** of the working tree, so what passes is the
change in front of the contributor rather than the last commit (ADR-0016). The build test creates a **throwaway repo**,
delivers a three-**ticket** **epic** through all seven stages — including two real **rounds** and both **fix waves** —
and asserts the **change request** was **flipped ready** with **checks** green. The refine test clones a **standing
repo**, hands the skill an **idea**, and a **responder** answers the grilling in the human's place until the
**frontier** empties.

What a test can check mechanically, it checks mechanically. What no assertion can settle — whether the spec coheres,
whether the tickets cover the **user stories**, whether the code is plausible — goes to a **verifier**, and both must
pass. Everything a run left behind is kept in a **run directory** outside the repository, so a failure can be read
afterwards rather than reproduced.

The harness is built to be extended: adding a test is a few lines against a fluent builder, and adding a **fixture**
is a directory.

## User Stories

1. As a contributor, I want one command that runs every end-to-end test, so that checking my change is a decision rather
   than a project.
2. As a contributor, I want the tests to exercise my uncommitted working tree, so that a pass tells me about the change
   I am about to merge and not about the last one somebody else made.
3. As a contributor, I want a happy-path test for `/deliverer:build`, so that a change to the delivery skill or any of
   its agents is caught before a user meets it.
4. As a contributor, I want a happy-path test for `/deliverer:refine`, so that a change to the refinement skill or its
   two writers is caught the same way.
5. As a contributor, I want the build test to run all seven stages, so that no stage can quietly stop running while the
   test still passes.
6. As a contributor, I want the build test to complete two real **rounds** through the tools server, so that the
   delegated review is proven to start, poll to a terminal status and post its findings as comments.
7. As a contributor, I want both **fix waves** to run against real comments, so that the wave that clears a change
   request is exercised rather than assumed.
8. As a contributor, I want the build test to assert the change request ended **flipped ready** with **checks** green,
   so that the bar stage 7 waits on is the bar the test holds.
9. As a contributor, I want the refine test's grilling answered by a **responder**, so that the interactive stage runs
   without a human sitting through it.
10. As a contributor, I want the responder to answer from the **fixture**'s own brief, so that two runs of the same test
    produce comparable epics instead of whatever the responder felt like inventing.
11. As a contributor, I want the responder to confirm a shared understanding once the **frontier** empties, so that the
    grilling terminates the way the skill says it does rather than running until a ceiling stops it.
12. As a contributor, I want a **verifier** to judge what a run delivered, so that a run producing correctly shaped
    rubbish fails instead of passing.
13. As a contributor, I want everything checkable asserted mechanically, so that the verdict does not rest on a model's
    opinion where a fact was available.
14. As a contributor, I want a failing test to name what failed, so that I learn whether the plugin broke or the harness
    did.
15. As a contributor, I want everything a run left behind kept in a **run directory**, so that I can read what happened
    instead of paying for another run to find out.
16. As a contributor, I want the session records of every dispatched agent kept too, so that a failure inside one agent
    is readable rather than inferred from its **report**.
17. As a contributor, I want the plugin installed the way a user installs it, so that the manifest, the marketplace
    entry, the `SessionStart` hook, the launcher and the `userConfig` wiring are all under test.
18. As a contributor, I want `mattpocock-skills` present in the refine test's session, so that stage 1 runs instead of
    the skill reporting a missing dependency and stopping.
19. As a contributor, I want each run isolated from my own machine's settings, so that a test passing for me means it
    passes for everyone.
20. As a contributor, I want each run isolated from every other run, so that a test can never pass on state a previous
    run left behind.
21. As a contributor, I want the build test's repository created fresh and destroyed when it passes, so that no run ever
    inherits a branch it would **resume** instead of a happy path it should walk.
22. As a contributor, I want a failed run's repository, branch and change request left standing, so that the evidence
    survives the failure.
23. As a contributor, I want the refine test's **standing repo** brought into step with the **fixture** on disk
    automatically, so that a test can never run against a fixture I changed months ago.
24. As a contributor, I want the delegated review configured cheaply, so that two **rounds** per run is affordable
    enough that people actually run the tests.
25. As a contributor, I want the plugin's own agents left exactly as shipped, so that a green test means the shipped
    configuration works rather than a cheaper one nobody uses.
26. As a contributor, I want a ceiling on how long and how much a run may take, so that a wedged **orchestrator** is
    stopped instead of spending for an afternoon.
27. As a contributor, I want to be told what a run reached when a ceiling stops it, so that I can tell a slow run from a
    stuck one.
28. As a contributor, I want the two tests to run concurrently, so that the suite finishes in the time of the slower
    one.
29. As a contributor, I want adding a new test to be a few lines, so that the second test for a skill costs nothing to
    write.
30. As a contributor, I want adding a new **fixture** to be a directory, so that a test needing a different codebase
    does not have to change the harness or disturb the tests that exist.
31. As a contributor, I want the assertions to live behind named matchers, so that when the plugin's output moves I
    change one place rather than every test.
32. As a contributor, I want credentials taken from the repository's environment file as-is, so that the harness works
    whether I authenticate with a subscription token or an API key and never learns which.
33. As a maintainer, I want the harness typechecked and linted in CI, so that it does not decay between the occasions
    somebody runs it.
34. As a maintainer, I want CI to keep spending no money, so that adding these tests does not turn every change request
    into a bill.
35. As a maintainer, I want CONTRIBUTING to say what the tests cost, what they need and how to run them, so that a
    contributor who did not sit through the design can still run them.
36. As a maintainer, I want CLAUDE.md corrected, so that it stops telling every agent that the only checks in the
    repository run from the tools server.
37. As a maintainer, I want the harness excluded from what ships, so that users continue to receive only the plugin.
38. As a maintainer, I want the **fixture** epic to carry three tickets with real **blocking edges**, so that dependency
    ordering and the implement-every-ticket loop are exercised rather than a single dispatch.
39. As a maintainer, I want the **fixture**'s codebase to carry a working CI workflow, so that **checks** are a real
    condition and an implementer meets real **gates**.
40. As a maintainer, I want the **fixture** to declare its own conventions, so that both skills publish somewhere the
    assertions can name exactly.

## Implementation Decisions

### What is built

- A new top-level `e2e-tests` directory, with its own package manifest and TypeScript configuration. It is not part of
  the tools server's package and shares nothing with it.
- Nothing in it ships. Only the plugin directory is published, as CONTRIBUTING already states.
- TypeScript runs through Node's native type stripping, with no transform and no build step, on the same reasoning as
  ADR-0001: a `--noEmit` typecheck is the only thing that reads the configuration, and the source is what executes. The
  harness is therefore held to erasable syntax exactly as the server is.
- The tests run under Node's own test runner, because Jest cannot reach the arrangement above. Measured on Node 24.19
  with Jest 30.4: configured with no transform, a plain type annotation fails to parse, because Jest loads modules
  through its own runtime and so never reaches Node's stripper — and no option turns that behaviour off. The same file
  passes unchanged under `node --test`. Keeping Jest would mean adding back the transform ADR-0001 exists to avoid, so
  the runner is what gives way. Running each test file concurrently and never retrying, the only two behaviours asked
  of a runner here, are what it does by default.

### How a run is set up

- Both tests drive the Claude Agent SDK. Neither drives a terminal emulator. This was measured: the SDK's permission
  callback receives an `AskUserQuestion` tool call as structured data — every question with its header, its options and
  their descriptions, and whether it accepts multiple answers — and an answer returned through that callback reaches the
  model verbatim, including free text that matches no option. A terminal emulator would add screen parsing and keystroke
  timing to buy coverage of the dialog's rendering, which is not what these tests are for.
- Each run owns a directory outside the repository, holding its plugin configuration directory, its temporary directory,
  its **staged copy**, its clone, and its session records. That directory is the **run directory** and it is what
  survives the test.
- The plugin is installed rather than attached by path, from a **staged copy** of the working tree. ADR-0016 records
  why, what was measured, and what it costs.
- The official marketplace is added before the plugin's own, because the marketplace entry for the plugin declares a
  dependency on `mattpocock-skills` and the install fails naming that dependency otherwise. Installing the plugin brings
  it in automatically; nothing installs it separately.
- The plugin's three options are written at **user** scope in the run's own configuration directory. At project scope
  they are ignored and the tools server silently never starts — the failure that looks like a plugin with no review
  tool. Because the configuration directory is created per run inside the **run directory**, user scope is the harness's
  own scope and carries nothing of the contributor's.
- Sessions load user and project settings and nothing else. User scope is the run's own; project scope is the clone's,
  which is how a **fixture** tells the plugin about the repository it has landed in. The contributor's own machine
  settings are never loaded, and neither is this repository's.
- A run with no clone — the installation smoke test, which needs no **fixture** — puts its session in an empty
  directory inside the **run directory** instead, so project scope has nothing to load. Left in this repository the
  session would read its settings, and those deliberately withhold `deliverer` from `enabledPlugins` under the
  no-dogfooding rule, which is indistinguishable from the failure the smoke test exists to catch.
- Every run gets its own temporary directory. This is not hygiene: the **brief** is written to the operating system's
  temporary directory under a name derived from the **epic**'s **slug**, and refinement treats a brief on disk as proof
  that stage 1 already ran. A stable slug plus a shared temporary directory means the second run skips the grilling
  entirely and the **responder** is never exercised — a pass that tested nothing.
- The whole of the repository's environment file is handed to the session and named as the plugin's environment file —
  which since ADR-0009 authenticates every model call the plugin makes, so an observed run's own calls draw on it too.
  The harness does not read, classify or forward any individual credential, so it works unchanged whether the
  contributor authenticates with a subscription token, an API key or something else — which is the arrangement ADR-0009
  exists to allow.

### What the runs are configured with

- The delegated review runs at the `sonnet` model and the `low` effort tier, set through the plugin's own options so the
  path an owner configures is the path under test.
- The plugin's seven agents keep the models and effort tiers their frontmatter declares. Nothing remaps them. A test
  that passed on cheaper models would be evidence about a configuration nobody ships.
- The harness's own two agents are chosen against the job: the **responder** on `sonnet`, because answering from a brief
  is a reading task it performs many times per run, and the **verifier** on `opus`, because it is the one place in the
  harness where being wrong turns a green test into a lie.
- A run carries a wall-clock ceiling of ninety minutes and a spend ceiling of twenty-five dollars. Both are constants in
  one place, overridable per test, and both fail loudly with what the run had reached. They are a first estimate to be
  revised once real durations and costs exist.

### The repositories

- The build test uses a **throwaway repo**: created private, delivered against, deleted when the test passes, left
  standing when it fails. A change request cannot be deleted on this forge — only closed — so reusing a repository would
  accumulate closed change requests permanently. More seriously, a run killed before cleanup would leave an **epic
  branch**, and delivery takes its **bearings** from that branch's commits and from whether a change request is open, so
  the next run would resume a half-delivered epic while reporting a happy path.
- The refine test uses a **standing repo**. Refinement's two writers were checked and neither commits nor pushes: the
  whole output is an untracked directory in the working tree plus the brief. With nothing written back, no two runs can
  reach each other, and no repository needs creating or destroying.
- The harness owns the standing repo's contents. Each run confirms it exists and that it matches the **fixture** on
  disk, creating it if absent and force-pushing the fixture if it has drifted. Nothing is provisioned by hand, and a
  test cannot run against a stale fixture.
- Repositories are created under the account the forge token authenticates as, private, under a name that identifies the
  test and the run.

### The fixtures

- A **fixture** is a directory: a codebase, the conventions the repository declares, a CI workflow, and — for the build
  test — the **epic** already published in it.
- The first fixture is a small TypeScript library with unit tests, a typecheck and a CI workflow, so **checks** are a
  real condition rather than vacuously green and an implementer meets real **gates**.
- The fixture declares markdown files as its tracker convention, in the shape this repository already uses, so both
  skills publish somewhere the assertions can name exactly.
- The build fixture's epic carries three **tickets** with real **blocking edges**, which is the smallest epic that
  exercises dependency ordering, the implement-every-ticket loop and the stage-1 progress counter rather than a single
  dispatch.
- The **epic** is part of the build fixture rather than something a test seeds afterwards, so it is on the default
  branch of the **throwaway repo** from the moment it is created — which is how delivery finds an epic it was handed the
  location of.

### The test surface

- A test is written against a fluent builder that seeds the repository and drives the run, with the mechanical
  assertions behind named matchers. A new test is a few lines; when the plugin's output moves, the matchers move once.
- The runner runs the two tests concurrently, with no retries. A retry would hide the flakiness these tests exist to
  surface, and would double the cost of a legitimately failing run.

### What changes outside the new directory

- CI gains a typecheck and a lint over the harness, in the existing job. It never runs the tests.
- CONTRIBUTING gains a section on what the tests are, what they cost, what they need and how to run them, alongside its
  existing account of what CI does not check.
- CLAUDE.md is corrected: it currently states that the only checks that exist run from the tools server, which stops
  being true when this lands.

## Testing Decisions

The deliverable is itself a test harness, so this section says where it bites and what holds it up.

- **One seam, and it is the whole run.** A test drives a complete `/deliverer:refine` or `/deliverer:build` **run** and
  observes only what a human could observe afterwards: the files in the working tree, the commits on the **epic
  branch**, the **change request** and its comments and **checks**, and the run's own session records. Nothing is
  asserted below that. This is the highest seam available and it is the only one, which is what `CONTEXT.md` asks of a
  seam — and it means no test is coupled to how a stage happens to be implemented, only to what it produced.
- **Rejected: observing the message stream mid-run.** Asserting which agents were dispatched and in what order would
  catch orchestration errors that leave correct artifacts behind. It also couples every test to the plugin's internal
  dispatch sequence, so re-ordering a stage would break tests that should not care. Left out.
- **Rejected: intercepting the tools server.** Watching the review tool calls directly would be precise about the effort
  tier and model each **round** ran at. It is a second seam in a plan whose whole argument is having one. Left out; the
  round's own reported outcome carries what is needed.
- **A good test here asserts outcomes, never mechanism.** That the change request was **flipped ready**, that every
  ticket has a commit naming it, that each **assumption** got a **verdict**, that two rounds completed, that checks are
  green, that a spec and its tickets exist where the fixture's conventions put them. Never which tool was called, in
  what order, or what any prose said.
- **The verifier is scoped to what no assertion can settle** — whether a spec coheres, whether the tickets cover the
  spec's **user stories**, whether the implementation is plausible against the epic. It is never given work an assertion
  could do, and both it and the mechanical assertions must pass.
- **The harness itself gets no tests.** This repository has no test suite and no test-runner conventions; introducing
  the first one here would be a large convention change to buy faster debugging of a small amount of code. The
  typecheck, the lint and the two runs are the whole guard. The cost is accepted knowingly: a defect in a matcher or in
  fixture staging will surface as a confusing end-to-end failure rather than a clear local one.
- **No rehearsal mode.** The scripted review double would let someone iterate on the harness without paying for rounds,
  and it was rejected to keep one code path: a mode that runs the pipeline with the rounds faked is a mode whose passing
  proves nothing about the plugin, and it would be mistaken for a passing test.
- **Prior art.** There is none in this repository — it has never had an automated test. The closest thing is the manual
  procedure CONTRIBUTING documents for exercising the review lifecycle against the scripted backend and the install by
  hand; that is what these tests are the automated counterpart to, at a much higher seam.

## Out of Scope

- **Running the tests in CI.** They are local and deliberate. Nothing in this work adds a paid job, a schedule, or a
  manual dispatch, and no credentials are added as repository secrets.
- **Unhappy paths.** One happy path per skill. A failed **round**, a red **check**, an **escalation** nobody answers, a
  resumed run, a repository with no conventions — all are natural next tests against this harness, and none is in this
  work.
- **A test for the terminal dialog.** Both tests answer the grilling through the SDK. Whether the `AskUserQuestion`
  dialog renders and accepts input in a terminal is untested by this work.
- **A test for path-attached plugins.** Nothing here exercises a plugin loaded by path; ADR-0016 records why and when
  that would be worth revisiting.
- **Cost reporting.** A run has a spend ceiling, but nothing aggregates or tracks what runs cost over time.
- **Any change to the plugin itself.** If a test finds a defect, fixing it is separate work with its own **epic**.
- **A second fixture, or a fixture in another language.** The harness must make one cheap to add; this work adds one.

## Further Notes

### Claims this spec rests on that were not checked

Each of these is a statement of fact nobody has verified. They were reached by reasoning, not measurement, and the
implementation is where they get settled — one that turns out false is a decision that needs revisiting, not a bug.

1. **The permission-callback interception holds across a full grilling.** It was measured on a single trivial question,
   not across the many rounds a real refinement asks, and not with the plugin's skill driving the questions.
2. **The SDK's spend ceiling is honoured against the provider the environment file selects.** The option exists; that it
   binds on a subscription token was never confirmed.
3. **A three-ticket delivery with two real rounds fits inside ninety minutes and twenty-five dollars.** Both figures are
   estimates. A previously observed real delivery of eight tickets took three hours forty-three minutes, which is the
   only measurement in evidence and suggests these ceilings are tight rather than generous.
4. **A freshly created private repository's workflow runs reach the plugin as checks in time for stage 7.** A new
   repository's first workflow run may be delayed or require enabling, and stage 7 waits on green.
5. **Plugin options can be set at install time through the install command's own flag.** An attempt to re-run the
   install with a force flag failed because no such flag exists; the settings-file route is the one that was proven, and
   the flag remains unverified.

### A concern recorded rather than resolved

The **fixture**'s codebase is a pure TypeScript library with no input or output. A **tracer bullet** is defined as a
narrow but complete path through every layer, and a library has few layers to cut through, so the `tickets-writer` may
produce thinner slices than a service fixture would provoke. This was raised during refinement and decided in favour
of the library for its speed and simplicity. If ticket quality turns out to be what the refine test is really
measuring, a service fixture is the change to make.

### Forks left open for a human

None. Every decision this spec rests on was settled during refinement.

### Related decisions

- ADR-0016 settles installing the plugin rather than attaching it by path, and staging the working tree so a test covers
  uncommitted work.
- ADR-0011 settles that the scripted review double ships and is how the review lifecycle is verified cheaply; this work
  deliberately does not use it.
- ADR-0009 settles that the plugin's model calls run under an environment file the owner names, which is what lets the
  harness stay ignorant of how a contributor authenticates.
- ADR-0001 settles that the tools server ships as source and runs unbuilt; the harness follows the same arrangement for
  the same reason.
