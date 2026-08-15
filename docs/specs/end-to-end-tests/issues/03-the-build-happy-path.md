# 03 — The build happy path

Status: ready-for-agent

**Blocked by:** 02 — The refine happy path.

**What to build:** `/deliverer:build` under test end to end, against a real repository on a real forge. An **epic** goes
in; all seven stages run, including two real **rounds** through the tools server and both **fix waves**; and the test
asserts the **change request** ended **flipped ready** with its **checks** green. Then the **verifier** judges whether
the code behind that change request actually implements the epic.

Nothing is faked. The rounds are real delegated reviews at the effort tier and model the options already select, the
findings are posted as comments by the reviewer itself, and the fix waves work real unresolved comments. A scripted
round would make every stage pass by having nothing to do.

**That failure arrives by accident rather than by choice.** The real backend is the default and the double is opt-in
through `DELIVERER_REVIEW_BACKEND`, so nothing in the harness need select it — but the harness hands the repository's
whole environment file to the session, and CONTRIBUTING teaches that same variable as the way to exercise the lifecycle
cheaply. Left in a contributor's environment file or shell it reaches the session, and every stage passes having
reviewed nothing. Keep it from arriving rather than trusting it to be absent.

The repository is a **throwaway repo**, created per run and destroyed when the test passes. It has to be, for two
reasons that are not about tidiness. A change request cannot be deleted on this forge — only closed — so a reused
repository accumulates them permanently. More seriously, a run killed before cleanup leaves an **epic branch** behind,
and delivery takes its **bearings** from that branch's commits and from whether a change request is open: the next run
would resume a half-delivered epic while the test reported a happy path. A failing run leaves everything standing,
because the change request is the evidence, and a cleanup that itself fails must never turn a passing test red.

The build fixture carries the **epic** on its default branch from the moment the repository is created — three
**tickets** with real **blocking edges**, which is the smallest epic that exercises dependency ordering, the
implement-every-ticket loop and the stage-1 progress counter rather than a single **dispatch**. The fixture's CI
workflow is what makes **checks** a real condition instead of vacuously green, and what gives an implementer real
**gates** to satisfy.

Assertions read only what a human would read afterwards. Whether a stage happened is inferred from what it left behind,
never from watching it happen.

Two more of the spec's unchecked **claims** are this ticket's to settle, and §Further Notes carries both. The first is
the ceilings: that a three-**ticket** delivery with two real **rounds** fits inside ninety minutes and twenty-five
dollars. The only measurement in evidence is a real delivery of eight tickets that took three hours forty-three
minutes, which makes both figures tight rather than generous. The second is that a freshly created private repository's
workflow runs reach the plugin as **checks** in time for stage 7, which may be delayed or need enabling. A claim that
turns out false is a decision to put back to a human with what you found, not a defect to code around — and never
grounds for reaching below the seam, or for loosening an assertion until it passes.

Record what the run actually took and cost as a comment on this ticket, and record it whichever way the claims fell.
Ticket 04 publishes measurements where the spec had estimates, and one ticket is one context: what is not written down
here does not reach it. If a ceiling had to be raised for the run to finish, that figure and the raise are part of what
is recorded, because 04 publishes the ceiling in force rather than the one the spec estimated.

Files: `e2e-tests/`. `docs/specs/end-to-end-tests/spec.md` §Implementation Decisions — The repositories, The fixtures;
§Testing Decisions.

- [ ] The **throwaway repo** is created private under the account the forge token authenticates as, named so the test
      and the run can be told apart.
- [ ] It is deleted when the test passes and left standing — with its branch and change request — when the test fails.
- [ ] A cleanup that fails is reported and does not fail a test that had otherwise passed.
- [ ] The build fixture carries a spec and three **tickets** with real **blocking edges**, on the default branch from
      the moment the repository is created.
- [ ] The fixture's CI workflow runs on the change request, so green **checks** are a condition that was actually met.
- [ ] The run drives `/deliverer:build` through all seven stages, with two real **rounds** and both **fix waves**; no
      scripted review backend is used anywhere.
- [ ] Mechanical matchers assert every ticket has a commit naming it, every **assumption** has an `ASSUMPTION` comment
      carrying a **verdict** reply, two rounds completed, the change request **flipped ready** — out of draft, not left
      in it — and the checks are green.
- [ ] No value of `DELIVERER_REVIEW_BACKEND` reaches the session from the contributor's environment file or shell, so a
      run cannot pass having reviewed nothing.
- [ ] The **verifier** judges the delivered change request against the epic, and both it and the mechanical assertions
      must pass.
- [ ] Nothing is asserted below the seam of the whole run: no mid-run message stream, no tools-server interception.
- [ ] The ninety-minute and twenty-five-dollar ceilings apply to this run too, and reaching one is reported distinctly
      from a run that finished and failed its assertions.
- [ ] Both tests run under one command, concurrently, with no retries.
- [ ] The **run directory** keeps the session records of every dispatched agent and survives whether the test passed or
      failed.
- [ ] Where the ceilings do not fit a three-ticket delivery with two real rounds, or a fresh repository's workflow runs
      do not reach the plugin as checks in time for stage 7, that is reported as the **claim** §Further Notes recorded
      rather than worked around, with what the run actually took and cost.
- [ ] What the run actually took and cost is recorded as a comment on this ticket — along with any ceiling a human
      raised for it to finish — because ticket 04 publishes those measurements and reads them from here.
- [ ] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.

## Comments

> *This was generated by AI during triage.*

Triage kept this `ready-for-agent` and folded three gaps into the body. The first was a contradiction that would have
sent the matchers the wrong way: the prose had the change request ending **flipped ready** while the criterion had it
"left **draft**", which the glossary and `plugin/skills/build/SKILL.md:74-79` settle the other way — stage 7 takes it
out of draft once two rounds have completed and the checks are green. The spec's §Testing Decisions carried the same
phrase and was corrected with it, so no later ticket inherits it. The second was the two §Further Notes **claims** this
ticket owns — the ceilings, and a fresh repository's workflow runs arriving as **checks** in time for stage 7 — which
no ticket had picked up, though ticket 04 publishes what this run measures. The third was the scripted backend: the
criterion forbade it in the abstract while `DELIVERER_REVIEW_BACKEND` can reach the session inside the environment file
the harness hands over whole, which is the accident the body's own warning describes.

Every other claim in the body was checked against the plugin and held: seven stages in that order
(`plugin/skills/build/SKILL.md:58-79`), two completed rounds as stage 7's bar (`:83`), the stage-1 progress counter
(`:109-111`), **bearings** taken from the `Ticket:` lines and an open change request (`:24-29`), `ASSUMPTION` comments
mirrored from the commits (`plugin/agents/change-request-creator.md:38,52`), **verdict** replies
(`plugin/agents/assumption-reviewer.md:17-18`), and a `Ticket:` line on every commit
(`plugin/agents/implementer.md:58`).

---

> *This was generated by AI during triage.*

Triaging ticket 04 gave this ticket's "record what the run took and cost" a location: a comment on this ticket, which is
where 04 now reads the measurements it publishes. One ticket is one context, so what is not written down here does not
reach it. A ceiling a human raised for the run to finish is part of what gets recorded, because 04 publishes the ceiling
in force rather than the ninety minutes and twenty-five dollars the spec estimated.
