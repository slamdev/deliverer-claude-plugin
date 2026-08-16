# 02 — The refine happy path

Status: ready-for-agent

**Blocked by:** 01 — The installation smoke test.

**What to build:** `/deliverer:refine` under test end to end. An **idea** goes in, a **responder** answers the grilling
in the human's place, and the test asserts a published **spec** and one **ticket** per slice came out — then a
**verifier** judges whether what came out is any good. Both bars must pass, because a **run** that produces correctly
shaped rubbish is exactly the failure a shape-only assertion waves through.

The **fixture** arrives with it, as a directory: a small TypeScript library with unit tests, a typecheck and a CI
workflow, a `CLAUDE.md` declaring markdown files as the tracker convention so the writers publish somewhere the
assertions can name exactly, and the answers the **responder** reads. Adding a second fixture later must be a matter of
adding a directory, not of touching the harness.

The repository is a **standing repo**, and it can be one because refinement's two writers were checked and neither
commits nor pushes: everything a run produces stays in the working tree it cloned — the published epic, and whatever
stage 1's glossary and ADR work landed beside it — with the **brief** outside the tree altogether. With nothing written
back, no two runs can reach each other. The harness owns its contents. It is private, under the account the forge token
authenticates as, and named for the test and the fixture rather than the run: a repository that outlives every run
cannot take the run-identifying name the throwaway repo will. Each run confirms it exists and matches the fixture on
disk, creating it if absent and force-pushing the fixture if it has drifted, so nobody provisions anything by hand and
no test can run against a fixture that was changed months ago. What that bar forbids is a run executing against contents
that differ from the fixture on disk; comparing first and force-pushing unconditionally both clear it.

**The per-run temporary directory is load-bearing, not hygiene.** The brief is written to the operating system's
temporary directory under a name derived from the **epic**'s **slug**, and refinement treats a brief on disk as proof
that stage 1 already ran. A stable slug plus a shared temporary directory means the second run skips the grilling
entirely, the responder is never invoked, and the test passes having tested nothing. The trap has a second mouth, and
the words invite it: what the responder answers from is called the fixture's brief too, and a harness that stages it in
that directory under that name skips stage 1 on the first run rather than the second. It is the fixture's, it stays in
the fixture directory, and it reaches the responder from there — nothing the harness writes goes where refinement looks
for a brief of its own.

The **responder** answers from the fixture's own brief rather than improvising, so two runs produce comparable epics,
and it confirms the shared understanding once the **frontier** empties — the skill's own bar for stage 1 being done,
rather than a ceiling stopping it. Questions reach it as structured data through the session's permission callback;
nothing parses a terminal.

Everything a test writer touches is the fluent builder and the named matchers, because a second test for this skill
should cost a few lines.

Two of the spec's unchecked **claims** are this ticket's to settle, and §Further Notes carries both. The first is the
responder mechanism entire: the permission callback was measured against one trivial question, never across the rounds
a real grilling asks and never with the plugin's skill putting them. The second is the spend ceiling's, which exists as
an option nobody has confirmed binds against the provider the environment file selects. A claim that turns out false is
a decision to put back to a human with what you found, not a defect to code around — and never grounds for reaching
below the seam, or for a mechanism the spec rejected.

Record what the run actually took and cost as a comment on this ticket either way. Ticket 04 publishes measurements
where the spec carried estimates, and one ticket is one context: what is not written down here does not reach it.

Files: `e2e-tests/`. `docs/specs/end-to-end-tests/spec.md` §Implementation Decisions — The repositories, The fixtures,
The test surface; §Testing Decisions; §Further Notes.

- [x] A **fixture** is a directory, and the first one carries a small TypeScript library, its unit tests, its typecheck,
      a working CI workflow, and a `CLAUDE.md` naming markdown files as the tracker convention.
- [x] A second fixture can be added as a directory without changing the harness or disturbing the tests that exist.
- [x] The **standing repo** is created when absent and force-synced from the fixture when it has drifted, so a run
      cannot execute against a stale fixture; the run clones it and pushes nothing.
- [x] The **standing repo** is private, under the account the forge token authenticates as, and named for the test and
      the fixture rather than the run, since it outlives every run.
- [x] A test is written against a fluent builder, with every mechanical assertion behind a named matcher, so that when
      the plugin's output moves the matchers move once.
- [x] A run carries a wall-clock ceiling of ninety minutes and a spend ceiling of twenty-five dollars, both constants in
      one place, overridable per test, and both failing loud with what the run had reached.
- [x] A ceiling being reached is reported distinctly from a run that finished and failed its assertions, so a slow run
      can be told from a stuck one.
- [x] What the run actually took and cost is recorded as a comment on this ticket, because ticket 04 publishes
      measurements where the spec carried estimates and reads them from here.
- [x] Each run has its own temporary directory, and neither a brief left by a previous run nor anything the harness
      staged can cause refinement to skip stage 1.
- [x] The answers the **responder** reads live in the fixture directory and are never written where refinement looks
      for a brief of its own.
- [x] The **responder** runs on `sonnet`, answers each question from the fixture's brief, prefers the recommended option
      where the brief is silent, and confirms the shared understanding once the frontier empties.
- [x] Questions reach the responder as structured data through the session's permission callback; no terminal output is
      parsed and no keystrokes are sent.
- [x] Mechanical matchers assert a published **spec** and one file per **ticket**, numbered from `01`, each declaring
      its **blocking edges**, at the location the fixture's conventions name.
- [x] The **verifier** runs on `opus`, returns a structured verdict, and judges only what no assertion can settle —
      whether the spec coheres, whether the tickets cover its **user stories**.
- [x] Both the mechanical assertions and the verifier's verdict must pass for the test to pass.
- [x] Nothing is asserted below the seam of the whole run: no mid-run message stream, no tools-server interception.
- [x] The **run directory** keeps the session records of every dispatched agent, not only the orchestrator's, and
      survives whether the test passed or failed.
- [x] Where the permission callback does not carry a full grilling, or the spend ceiling does not bind against the
      provider the environment file selects, that is reported as the **claim** §Further Notes recorded rather than
      worked around.
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.

## Comments

> *This was generated by AI during triage.*

Triage kept this `ready-for-agent` and folded three gaps into the body rather than leaving them for the implementer to
invent: where the answers the **responder** reads live, so the fixture's copy cannot trip the very stage-1 skip the
temporary-directory criterion exists to prevent; the **standing repo**'s name and what its freshness bar forbids; and
the two §Further Notes **claims** — the permission callback across a real grilling, and the spend ceiling binding —
that this ticket is the one to settle. Every other claim in the body was checked against the plugin and held: the
brief's path and name (`plugin/skills/refine/SKILL.md:107`), a brief on disk standing for stage 1 (`:33-36`), the
frontier-empty bar (`:56`), questions through `AskUserQuestion` (`:72`), neither writer carrying a git verb, and
tickets numbered from `01` with blocking edges (`plugin/agents/tickets-writer.md:38,44,90`).

---

> *This was generated by AI during triage.*

Triaging ticket 04 added one criterion here: what the run actually took and cost is recorded as a comment on this
ticket. Ticket 04's central bar is that the figures it publishes are measurements rather than the spec's estimates, and
nothing named a place for a measurement to be written down. One ticket is one context, so what is not on a ticket file
does not reach it.

---

> *This was recorded by the implementation of this ticket.*

**What the run actually took and cost.** The **run** itself took **20m 12s** and cost **$5.82**. The whole test, which
also stages the plugin, installs it, brings the **standing repo** into step, clones it and runs the **verifier**, took
**21m 52s** and cost **$6.36** — the run, the **responder** at $0.16 over six rounds of questions (twelve in all), and
the verifier at $0.39. It published a **spec** and **six tickets**. Both ceilings were the spec's estimates and
**neither had to be raised**: the run finished inside a fifth of the ninety minutes and a quarter of the twenty-five
dollars, so ticket 04 publishes those two figures as the ceilings in force, in `e2e-tests/harness/ceilings.ts`. What
the build test costs is ticket 03's to measure, and a delivery is the more expensive of the two.

**Claim 1 held: the permission callback carries a whole grilling.** §Further Notes recorded it as measured on one
trivial question, never across the rounds a real refinement asks and never with the plugin's own skill putting them.
Across six rounds and twelve questions from `mattpocock-skills:grilling` under `/deliverer:refine`, every question
reached the callback as structured data — its text, its header, its options with their descriptions, and whether it
took more than one answer — and every answer returned through the callback reached the model verbatim, free text
included. Nothing parsed a terminal and no keystroke was sent. Three details worth carrying to ticket 03. The host
warns that `canUseTool` is not consulted under `permissionMode: bypassPermissions`, and that is true of every tool
*except* `AskUserQuestion`, which is a dialog rather than a permission and still arrives. An answer goes back as
`{behavior: "allow", updatedInput: {...input, answers}}`, keyed by each question's own text. And the rounds are not all
grilling: round six was a **fork** the `spec-writer` reopened by killing a **claim**, put back to the human exactly as
the skill says it should be — so a responder that only answers interview questions is not enough.

**Claim 2 held: the spend ceiling binds.** The SDK's `maxBudgetUsd` was measured against the provider `.env` selects
here — a subscription token — with a deliberately tiny ceiling: the run stopped after one turn with
`subtype: error_max_budget_usd`, `terminal_reason: budget_exhausted` and a non-zero `total_cost_usd`, so spend is both
reported and enforced. Two things a caller has to know. The host raises *after* reporting the result it stopped, so a
harness that only catches the throw loses the figures. And it injects the remaining budget into the run's own
conversation, so the run under test can see what it has left — which is worth knowing before reading a run that wrapped
up early.

**A third finding, which no claim had named: a one-shot prompt ends a run several stages early.** A **dispatch** does
not block the orchestrator — the agent goes away to work and a notification brings the orchestrator back when its
**report** lands — so a run's own turn ends several times before the run does. Driven with a one-shot prompt, the first
of those closed the session: `/deliverer:refine` ended `success` with its `spec-writer` still working, having published
nothing and reported nothing. A green light for a run that delivered a fraction of an epic. Holding the SDK's input
stream open for the whole run fixes it — the session then takes the notification and carries on by itself, exactly as
the interactive session a user drives does — and the harness decides a run is over on a report naming
`/deliverer:build`, with total silence for ten minutes as the backstop. This run came back to work twice that way.
**Ticket 03 inherits it**: a delivery has seven stages of dispatches, and every one of them would have ended its run.

**The brief does not land in the run's own temporary directory.** The spec's §How a run is set up gives each run its
own temporary directory because refinement writes the **brief** to the operating system's and treats one on disk as
proof that stage 1 already ran. That binds everything which *reads* `TMPDIR` and misses the writer it was for: an
orchestrator told to use the temporary directory of the user's OS writes `/tmp/<slug>-brief.md`, a path it knows. It
cost a run to find out — the first full run of this test reached stage 3 in ninety seconds, having taken its bearings
from a brief a probe had left there an hour earlier, and never grilled anything. The criterion is met a different way:
each run collects its own brief out of the shared directory when it finishes, into the **run directory** where a run's
leavings belong, and never touches one older than itself. The matcher that catches a grilling which never happened is
the backstop for a run killed before it could collect.

**Two things observed in passing.** The **standing repo**'s freshness bar fired for real: the fixture's `CLAUDE.md` was
edited between runs, the tree comparison saw the drift and force-pushed, so the run executed against the fixture on
disk rather than the one pushed an hour before. And the run pushed nothing — the clone ended with the epic, the
glossary and two ADRs all untracked, and the forge's branch at the commit the run cloned.
