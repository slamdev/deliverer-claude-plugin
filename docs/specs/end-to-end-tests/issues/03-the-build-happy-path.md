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

- [x] The **throwaway repo** is created private under the account the forge token authenticates as, named so the test
      and the run can be told apart.
- [x] It is deleted when the test passes and left standing — with its branch and change request — when the test fails.
- [x] A cleanup that fails is reported and does not fail a test that had otherwise passed.
- [x] The build fixture carries a spec and three **tickets** with real **blocking edges**, on the default branch from
      the moment the repository is created.
- [x] The fixture's CI workflow runs on the change request, so green **checks** are a condition that was actually met.
- [x] The run drives `/deliverer:build` through all seven stages, with two real **rounds** and both **fix waves**; no
      scripted review backend is used anywhere.
- [x] Mechanical matchers assert every ticket has a commit naming it, every **assumption** has an `ASSUMPTION` comment
      carrying a **verdict** reply, two rounds completed, the change request **flipped ready** — out of draft, not left
      in it — and the checks are green.
- [x] No value of `DELIVERER_REVIEW_BACKEND` reaches the session from the contributor's environment file or shell, so a
      run cannot pass having reviewed nothing.
- [x] The **verifier** judges the delivered change request against the epic, and both it and the mechanical assertions
      must pass.
- [x] Nothing is asserted below the seam of the whole run: no mid-run message stream, no tools-server interception.
- [x] The ninety-minute and twenty-five-dollar ceilings apply to this run too, and reaching one is reported distinctly
      from a run that finished and failed its assertions.
- [x] Both tests run under one command, concurrently, with no retries.
- [x] The **run directory** keeps the session records of every dispatched agent and survives whether the test passed or
      failed.
- [x] Where the ceilings do not fit a three-ticket delivery with two real rounds, or a fresh repository's workflow runs
      do not reach the plugin as checks in time for stage 7, that is reported as the **claim** §Further Notes recorded
      rather than worked around, with what the run actually took and cost.
- [x] What the run actually took and cost is recorded as a comment on this ticket — along with any ceiling a human
      raised for it to finish — because ticket 04 publishes those measurements and reads them from here.
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes; em dashes make byte counts
      overrun a correctly-wrapped line.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.

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

---

> *This was recorded by the implementation of this ticket.*

**What the run actually took and cost.** Two whole deliveries were measured — the second on the code as this ticket
leaves it, after a review wave changed the matchers — and they agree closely:

| | the **run** | the verdict | tickets | commits | assumptions | rounds |
| --- | --- | --- | --- | --- | --- | --- |
| first | 21m 23s, $6.96 | $0.44 | 3 | 3 | 10 | 2 |
| second | 20m 26s, $6.43 | $0.42 | 3 | 3 | 7 | 2 |

Each whole test — the **staged copy**, the install, the **throwaway repo**, the clone, the run and the verdict — came to
**23m 12s and $7.40**, then **22m 14s and $6.85**. Both flipped the **change request** ready with its **checks** green.
**Neither ceiling had to be raised**: each run finished inside a quarter of the ninety minutes and spent a quarter of
the twenty-five dollars, so ticket 04 publishes the spec's two estimates as the ceilings in force, in
`e2e-tests/harness/ceilings.ts`. All three tests — the delivery, the refinement and the installation smoke test — ran
under one command, concurrently, with no retries: **23m 13s** and **23m 31s** for the suite, which is the slower of the
two long tests plus a rounding error, and **$13.28** then **$13.14** for the two runs and their verdicts together.

**Claim 3 held, with room to spare: a three-ticket delivery with two real rounds fits inside ninety minutes and
twenty-five dollars.** The measurement in evidence was a delivery of eight tickets that took three hours forty-three
minutes — about 28 minutes a ticket — which made both figures look tight. These ran at **7 minutes a ticket**: all
three tickets were committed 10 minutes in, the change request was open with its assumptions mirrored at 14, and the
flip came at 20. What made the difference is not visible in the numbers and is worth saying: the **fixture** is a small
library and its tickets are three functions with unit tests, where the eight-ticket delivery was this plugin's own
prose. A fixture with a service in it would move both figures, and the ceilings are the place that would be felt first.

**Claim 4 held: a freshly created private repository's workflow runs reach the plugin as checks in time for stage 7.**
The first repository was created at 14:40:34 and its `Typecheck and test` check was already `SUCCESS` when the change
request was read at 14:51 — before stage 3 had finished, let alone stage 7; the second behaved the same way. Nothing
had to be enabled by hand: a repository
created through `gh repo create --private` runs the workflows on its default branch as they arrive, and the
`pull_request` trigger fired on the epic branch's change request. What the run did NOT settle is a **check** that is
slow or a repository whose Actions an organisation policy holds — stage 7 waits on green either way, and this fixture's
whole workflow takes under a minute.

**Both fix waves ran and had nothing to do, because both rounds found nothing — in both runs.** All four rounds
(`column-alignment-review-1` and `-2`, ≈$0.15 to ≈$0.31 each) reached `completed` and raised no **review finding**, and
every **assumption** — ten, then seven — was adjudicated `accept`. So every comment on the change request was already
resolved when the waves met it, and each committed nothing and reported that. The stages ran; the work they exist for
did not. That is a real happy path and not a defect, but it means **this test has never exercised a wave that clears a
change request** — the criterion's "against real comments" is met in form only. Provoking a finding is a **fixture**'s
job rather than a matcher's, and a fixture whose codebase carries something a `low`-tier round would raise is the change
to make if that coverage is wanted.

**A defect in the harness that only a run could have found: the test runner's environment reached the run, and a gate
went green having run nothing.** These tests run under `node --test`, which marks its children with `NODE_TEST_CONTEXT`
and `NODE_TEST_WORKER_ID`; the harness hands a session the environment it inherited, so both reached every process a run
started — including the fixture's own `npm test`, which is `node --test` again. It sees the mark, takes itself for a
recursive run, **skips every test file and exits zero**. The second run's orchestrator reported meeting it in every
implementer, reviewer and fix wave. Nothing broken was delivered — the forge's **checks** run in an environment of their
own and were green throughout, which is exactly the second opinion they exist to be — but an implementer's `npm test`
**gate** was not being asked the question. The two variables are now kept out of a run the same way the scripted
backend's are (`e2e-tests/harness/run-directory.ts`), and the fix is verified directly rather than by a third delivery:
from inside the runner, the environment a run is handed carries neither, and the fixture's fourteen tests run instead of
skipping.

**The held-open input stream, and what varies between runs.** The first run reported **10 times over 6 turns** as its
dispatches came back; the second reported **once over 45**. So a one-shot prompt would have ended the first delivery
after its first ticket and would have survived the second — the two runs differ in when the host decides a turn is over,
not in what a delivery does, and only the held-open stream is safe against both.

**Two things the harness learned from a run rather than from reasoning.** The report words its rounds
`**Rounds:** 2/2 completed`, which the reader's tight patterns missed; the round ids it names carried the count instead,
and the wording has since been taught to it (`e2e-tests/harness/report.ts`). And each run left **11 dispatched agents'
session records** where the seven stages account for nine, so the floor is a floor and not a count — what the other two
were is not something a record's filename says, and nothing asserts it.
