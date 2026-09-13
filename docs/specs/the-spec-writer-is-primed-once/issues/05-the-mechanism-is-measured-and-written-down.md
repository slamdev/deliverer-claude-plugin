# 05 — The mechanism is measured and written down

Status: ready-for-agent

**Blocked by:** 01, 02, 03 and 04 — every slice that changes what a **run** does lands first, because this measures the
finished branch. There is no "before" run to take: the baseline figures this epic argues from are already published in
`docs/specs/the-spec-writer-is-primed-once/spec.md` § *The measurement this change rests on*, measured on 2026-09-10
from two runs, and nothing here re-measures them.

**What to build:** the evidence that the rule fired. This epic bets that one prose change will make an orchestrator
batch where singular wording made it re-prime, and nothing in the four slices before this one takes a figure — so
without this slice the epic can be implemented, reviewed and merged with the bet unsettled.

**Run `e2e-tests/tests/refine-happy-path.test.ts` once.** It drives a whole refinement against a committed **fixture**
with a **responder** in the human's seat, and leaves a **run directory** and a **trace** behind. **No assertion is added
and the test file is not edited** — what this ticket produces is a reading.

**The done-bar is the trace, and it is read for mechanism rather than for money.** `grep 'SendMessage' <trace>` shows
each put-back and what it carried. What must be true: where the **spec-writer** raised several **fork**s, one put-back
carried several closures rather than one carrying one. The measured NEW run's four put-backs carried one fork each —
"Decision 20 closed: skip reset when prefix empty", "Decision 21: wide indent may stand alone" — against the baseline's
"Human closed **all three** forks; fold into spec". That contrast is the shape to look for, and a single run settles it.

**A run that raises no fork settles nothing, and that is a real outcome to report rather than a failure.** The rule
fires only when the writer's reading forces closures; a run whose brief happened to leave nothing colliding will show
one dispatch and no put-back at all. Report that as inconclusive on the mechanism. Do **not** pay for another run
chasing a fork, and do not conclude the rule works because nothing contradicted it.

**Report the spend, and label what the figure is.** A single run cannot state a saving: run-to-run spread on this
fixture has never been measured, so the difference between $36.65 and whatever this run costs cannot be separated from
it. Write the figure down with that stated, alongside the spec writer's turns, its peak context and its cache read per
agent, which are the **trace**'s own `== tokens ==` rows. Every dollar figure is the host's own estimate at first-party
rates while the calls bill through a partner-operated provider, so it supports a same-provider ratio and never a bill —
say so.

**Raise the ceilings locally and do not commit the raise.** `DEFAULT_CEILINGS` is ninety minutes and twenty-five
dollars; the plugin as measured takes 97m56s and $36.36, so a run at today's cost is reported as a **ceiling** rather
than as a measurement and the money is spent for nothing. `e2e-tests/harness/ceilings.ts` is no part of what a run
measures — only `plugin` and `.claude-plugin` are staged — so a local uncommitted raise changes when the harness stops a
run and nothing else. Committing one would let the ceiling drift up behind a regression, which is the thing it exists to
catch. Revert the raise when the run is done.

**One attempt, and the spend clause is part of the ticket.** One run, roughly $40 and roughly a hundred minutes
including the **verdict** and the observation. **Do not repeat a run to improve a figure.** A failed **verifier**
verdict is a finding about the epic and is reported as one, never retried as a flake. A run that never started, or one
the harness stopped on a ceiling you had raised too little, may be started once more; anything beyond that is a
**hand-off** with the figures it reached, not another attempt.

**This ticket is forbidden from editing any of this epic's prose.** Not the four slices' files, not the spec's
decisions, not its measurement section's published figures. A flat figure, a worse figure, or an inconclusive mechanism
reading is reported as what it is — the levers it reopens are already named as hand-offs, and editing the machinery to
move a number this ticket is measuring would make the measurement worthless.

Files: this epic's spec, gaining the run's reading; and `e2e-tests/harness/ceilings.ts` locally and uncommitted.
Decisions D15 and D17, with the *Testing Decisions* section, in
`docs/specs/the-spec-writer-is-primed-once/spec.md`.

- [x] The working tree is clean before the run, because the harness stages it.
- [x] `DEFAULT_CEILINGS` is raised locally, the raise is **not committed**, and it is reverted once the run is done.
- [x] `e2e-tests/tests/refine-happy-path.test.ts` ran once, and no assertion was added and the test file was not edited.
- [x] The trace's `SendMessage` lines are read, and the reading states **whether a put-back carrying several closures
      happened where several forks were raised** (D1).
- [x] A run that raised no fork is reported as **inconclusive on the mechanism**, and no further run is paid for chasing
      one.
- [x] The spend is reported and **labelled as not a measured saving**, with run-to-run spread named as unmeasured.
- [x] The spec writer's turns, peak context and cache read are reported per agent from the trace's own `== tokens ==`
      rows.
- [x] Every dollar figure is labelled with the provider that served it, and no figure is presented as a bill.
- [x] **No run is repeated to improve a figure**, and a failed **verifier** verdict is reported as a finding rather than
      retried.
- [x] **No prose in this epic is edited to move a figure** — not the four slices' files, not the spec's decisions, not
      its published measurement (D17).
- [x] Nothing from the **fixture**'s own repository, and no **trace** path, appears in what is written down.
- [x] The spec's prevailing column width is matched — 120 **characters**, not bytes.
