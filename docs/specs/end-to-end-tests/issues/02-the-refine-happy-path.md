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

- [ ] A **fixture** is a directory, and the first one carries a small TypeScript library, its unit tests, its typecheck,
      a working CI workflow, and a `CLAUDE.md` naming markdown files as the tracker convention.
- [ ] A second fixture can be added as a directory without changing the harness or disturbing the tests that exist.
- [ ] The **standing repo** is created when absent and force-synced from the fixture when it has drifted, so a run
      cannot execute against a stale fixture; the run clones it and pushes nothing.
- [ ] The **standing repo** is private, under the account the forge token authenticates as, and named for the test and
      the fixture rather than the run, since it outlives every run.
- [ ] A test is written against a fluent builder, with every mechanical assertion behind a named matcher, so that when
      the plugin's output moves the matchers move once.
- [ ] A run carries a wall-clock ceiling of ninety minutes and a spend ceiling of twenty-five dollars, both constants in
      one place, overridable per test, and both failing loud with what the run had reached.
- [ ] A ceiling being reached is reported distinctly from a run that finished and failed its assertions, so a slow run
      can be told from a stuck one.
- [ ] What the run actually took and cost is recorded as a comment on this ticket, because ticket 04 publishes
      measurements where the spec carried estimates and reads them from here.
- [ ] Each run has its own temporary directory, and neither a brief left by a previous run nor anything the harness
      staged can cause refinement to skip stage 1.
- [ ] The answers the **responder** reads live in the fixture directory and are never written where refinement looks
      for a brief of its own.
- [ ] The **responder** runs on `sonnet`, answers each question from the fixture's brief, prefers the recommended option
      where the brief is silent, and confirms the shared understanding once the frontier empties.
- [ ] Questions reach the responder as structured data through the session's permission callback; no terminal output is
      parsed and no keystrokes are sent.
- [ ] Mechanical matchers assert a published **spec** and one file per **ticket**, numbered from `01`, each declaring
      its **blocking edges**, at the location the fixture's conventions name.
- [ ] The **verifier** runs on `opus`, returns a structured verdict, and judges only what no assertion can settle —
      whether the spec coheres, whether the tickets cover its **user stories**.
- [ ] Both the mechanical assertions and the verifier's verdict must pass for the test to pass.
- [ ] Nothing is asserted below the seam of the whole run: no mid-run message stream, no tools-server interception.
- [ ] The **run directory** keeps the session records of every dispatched agent, not only the orchestrator's, and
      survives whether the test passed or failed.
- [ ] Where the permission callback does not carry a full grilling, or the spend ceiling does not bind against the
      provider the environment file selects, that is reported as the **claim** §Further Notes recorded rather than
      worked around.
- [ ] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.

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
