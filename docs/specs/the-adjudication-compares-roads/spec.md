# The adjudication compares roads, and the better one is taken

Status: ready-for-agent

## Problem Statement

A human delivered a dozen **epic**s with `/deliverer:build`. Stage 3 adjudicated every **assumption** on every
**change request**, and in roughly 95% of cases the **verdict** was `accept`. The rate held across all dozen, so it is
the design rather than a bad run.

Before the plugin existed, the same human did the same step by hand: they ran a grilling over the list of assumptions,
it offered options per **fork** with one marked as recommended, and **on roughly half of them the recommendation was not
the road the code had taken, and they took it.** Their own account of why: *"I cannot say the current setup produces
wrong choices from the functional point of view, but the options I was given were simply better — code quality,
security, usability."*

**The accepts are the instruction working, not a model drifting.** `assumption-reviewer` is told that `accept` is "the
default", that it is "catching choices that are *wrong* — against the spec, a documented decision, or the rest of the
codebase — rather than choices you would have made differently", that `override` requires all three of what the code
does, what it should do instead and **grounds**, and that "All three, or the verdict is `accept`". It is even told there
is no target rate. An agent following that text to the letter produces exactly the observed rate.

**The cause is one level below the bar.** The legwork behind the verdict is five conformance checks — what the ticket
asked, what the code does today, the conventions and nearest call sites, who calls this and what breaks if the choice
flips, and the other assumptions on the branch. Not one of them asks *what else could this have been, and is one of
those better?* The grilling the human ran by hand **generated an option set**; the adjudication only ever **grades the
one option it was handed**. A verdict set that can only say *wrong* cannot say *better*, and no bar on `override`
changes that, because there is nothing on the other side of the comparison to weigh.

Three further costs ride on the same gap.

**An `accept` is written for nobody.** It resolves its comment, and resolved threads are collapsed on the forge where
the human is reading. Its **grounds** — the interesting part, and the only record that a fork was even considered —
reach the run's **report** as a bare count. Whatever the adjudication understood about the branch, the human merging
never sees it.

**Two of the three axes the human named are covered by nothing in the pipeline.** Every **round** delegates to the
host's own `/code-review`, whose scope is correctness bugs plus reuse, simplification and efficiency cleanups. Security
and usability are outside it. And no round is ever told a fork existed, so it reads the code as written and never the
road not taken.

**What review is worth says the same thing from outside the plugin.** Across 759 defects classified from nine industrial
and 23 student code reviews, 75% did not affect the software's visible functionality at all; they made it easier to
understand and to change (Mäntylä and Lassenius, IEEE Transactions on Software Engineering, 2009). Hundreds of
classified review comments at one large vendor put *the creation of alternative solutions* among review's documented
products, beside knowledge transfer and finding defects (Bacchelli and Bird, ICSE 2013). An adjudication that only
rejects what is wrong forgoes the larger part of what the reading is worth — and the human above measured that loss
against their own earlier practice, twelve times over.

## Solution

Stage 3 stops grading one road and starts comparing roads.

For each assumption the adjudication names the alternatives the fork left available and judges them on named **axis**es.
Where the shipped choice wins, the verdict is `accept` **and its reply names the roads it beat**, so the human merging
meets the fork and the alternatives the way the hand-run grilling showed them. Where a better road exists, the verdict
is a fourth one — `improve` — carrying a **directive**, and the **fix wave** implements it. Nothing ratifies that change
before it lands: the human meets it on the branch and as one line per implemented proposal in the run's report.

[ADR-0019](../../adrs/0019-a-defensible-assumption-may-be-bettered-without-ratification.md) settles the decision, the
three alternatives that were rejected, and why **grounds** does not move to accommodate it. This spec does not restate
it.

Nothing about a delivery's autonomy changes. It still runs unattended, it still asks the human nothing, and what it
cannot close is still an **escalation**.

## User Stories

1. As a human merging a change request, I want each assumption's adjudication to have compared the road taken against
   the roads available, so that a defensible-but-worse default is caught rather than ratified.
2. As a human merging a change request, I want an `accept` to name the alternatives it beat, so that I meet the fork and
   its options the way I did when I ran the grilling myself.
3. As a human merging a change request, I want a better road to have been *taken* rather than only noted, so that
   acting on it does not cost me a further **run**.
4. As a human merging a change request, I want the code the run redesigned to be named in the report, so that I learn
   my code changed on a judgement nobody ratified instead of finding out by reading the diff.
5. As a human merging a change request, I want that line to say which **axis** carried each change, so that I can tell
   a security fix from a naming preference without opening the thread.
6. As a human merging a change request, I want the account in that line to be what the fix wave actually implemented,
   so that a directive the wave declined or never reached is not reported to me as a change.
7. As a human reading a report, I want a count for each of the four verdicts, so that the shape of the adjudication is
   legible before I open anything.
8. As a human running a delivery, I want it to keep running unattended, so that gaining this costs me no time in the
   room.
9. As a human running a delivery, I want an improvement whose axes conflict to say which axis won and why, so that the
   weighing that changed my code is on the record rather than in a model's head.
10. As a human running a delivery, I want a security or reliability defect in a defensible choice to still be an
    `override` where it can cite a concrete failure scenario, so that the new verdict does not soften what already
    worked.
11. As a human running a delivery, I want an `escalate` to still mean a fork that is genuinely not the run's to close,
    so that the new verdict does not swallow the ones that need me.
12. As a human running a delivery, I want a fix wave that meets a directive it cannot land to have a legal move, so
    that an unimplementable improvement does not stall the wave or force something worse onto the branch.
13. As a human running a delivery, I want a declined improvement to arrive with its grounds, so that I can see the wave
    disagreed rather than silently skipped it.
14. As a human resuming an interrupted delivery, I want an assumption already carrying an `improve` to be left alone, so
    that a resumed run does not adjudicate the same fork twice.
15. As a human resuming an interrupted delivery, I want an `improve` whose directive was never implemented to still be
    picked up by the next fix wave, so that a dead dispatch does not ship an unimplemented directive.
16. As a human whose epic recorded no assumptions, I want stage 3 to cost what it costs today and report that it found
    nothing, so that the new step does not invent work where there is none.
17. As an owner of a repository, I want maintainability to weigh only as a tie-breaker between roads that already differ
    in behaviour, so that the run does not restructure code on taste.
18. As an owner of a repository, I want the **fork** bar left where it is, so that the set of assumptions recorded
    against my branch does not multiply.
19. As a contributor maintaining the plugin, I want the axes written down where the agent that applies them can read
    them, so that the plugin still ships as prose with nothing to build.
20. As a contributor maintaining the plugin, I want the glossary to define the fourth verdict and the word `axis`, so
    that a reader of `CONTEXT.md` alone is not met with a term nothing defines.
21. As a contributor maintaining the plugin, I want the decision and its rejected alternatives recorded once in an ADR,
    so that nobody re-proposes propose-only or a reversibility gate in six months.
22. As a contributor maintaining the plugin, I want the end-to-end harness to notice an `improve` the fix wave never
    reached, so that a run shipping an unimplemented directive fails a test rather than passing one.
23. As a contributor maintaining the plugin, I want the **verifier** asked whether the verdicts were sound, so that a
    correctly-shaped adjudication of nothing does not pass.
24. As a contributor maintaining the plugin, I want the cost of the new step measured from a real epic's **debrief**, so
    that the decision to split the dispatch rests on a figure rather than on a guess.
25. As a user reading the README, I want it to name four verdicts, so that the published description of what happens to
    my assumptions is true.

## Implementation Decisions

- **D1. The legwork gains a step that generates the option set, and that is the load-bearing change.**
  `assumption-reviewer`'s five conformance checks stay as they are; a step is added that names the alternatives the fork
  left available for the assumption in hand. Without it there is nothing to compare against, so no change to any bar
  would move the observed rate.

- **D2. The axes are five, and maintainability is only ever a tie-breaker.** The five are what a road does **under
  failure**, **under an adversary**, **at the limits**, **to the caller's contract**, and **to what the caller sees when
  it goes wrong**. How expensive the code is to change later breaks a tie between those and never carries a verdict
  alone. The five are the ones that survive the **fork** bar — each changes behaviour the spec cares about — and the tie
  breaker is the one that does not, which is why it cannot stand on its own.

- **D3. The `Fork` definition does not move, and neither does what an `implementer` records.** Maintainability weighs
  when *choosing between* roads that already differ in behaviour, never as a fork of its own. So no new assumption
  becomes recordable and the set stage 3 works does not grow at its source.

- **D4. `improve` is the fourth verdict, and mechanically it is `override`.** Its reply carries a directive and leaves
  the comment unresolved; the fix wave collects it by the filter it already uses. Its **warrant** is three things — the
  axis, the alternative, and why the alternative is better — and all three, or the verdict is `accept`. That mirrors
  `override`'s three-part requirement rather than inventing a second shape.

- **D5. Cross-axis conflicts are weighed per fork, with the weighing disclosed.** There is no priority order between the
  axes. An `improve` that had to resolve a conflict names both axes and says which won and why; a single-axis one names
  one axis and adds nothing. Per-instance disclosure is what keeps case-by-case weighing auditable instead of silent.

- **D6. An `accept` names the roads it beat, briefly.** The option set is generated either way, so this costs nothing
  extra to produce, and it is the artefact the hand-run grilling delivered. It also makes the accept rate auditable
  afterwards, which is how the question behind this spec gets settled empirically on the next epic rather than argued.

- **D7. `Grounds` is untouched and `improve` does not rest on it.** Grounds stays a spec line, an ADR, a caller that
  breaks or a concrete failure scenario, and never taste — it is also what a declined **review finding**, a reopened ADR
  and a **defect** rest on, so widening it here would widen it everywhere. An `improve` names an axis instead. Where an
  improvement *can* cite grounds — a security hole with a concrete failure scenario — it is an `override` and was always
  one.

- **D8. `escalate` is untouched.** It still means a fork genuinely not the run's to close: a product question, or a
  policy or security tradeoff with **no defensible default**. An `improve` is the case where the default *is*
  defensible, so the two do not overlap.

- **D9. Implementing an `improve` is the fix wave's default, and declining it takes grounds.** The wave already works
  this way for a review finding, and the report already carries declined findings with their grounds; an `improve` joins
  that path. A directive that cannot land therefore has a legal move that is neither stalling nor forcing.

- **D10. The wave's account is what the report's line carries.** `assumption-reviewer` reports what it directed and
  `comments-addresser` reports what it implemented; where they differ the wave's is the record of what happened to the
  code. This is the rule the delivery skill already applies to a **gate** a commit names and a report does not.

- **D11. The delivery's report gains a fourth count and one line per implemented proposal.** The line names the fork,
  the road taken and the axis. With no reversibility gate and no owner setting, this line is the only control on the
  design, which makes `comments-addresser`'s report the most load-bearing edit in the change.

- **D12. Nothing bounds how many proposals one adjudication may make, and no owner setting turns the feature off.** A
  setting half the runs had applied would make the design unmeasurable while the report line is its only bound.

- **D13. The rounds are untouched and overlap this deliberately.** Stage 3 runs before round 1, so the wave
  implements stage 3's version and round 1 reviews the result. Two stages proposing the same change costs a round's
  tokens; either one deferring to the other costs a change neither makes.

- **D14. One dispatch, not two.** Option generation lands inside the existing `assumption-reviewer`, which keeps the
  cross-set view that is its stated reason for existing — the only agent that sees every fork against the finished
  branch. Splitting is deferred until a real epic's **debrief** shows context or **spend** binding; the split to reach
  for then is per-assumption notes, the way an **observer** already uses **dispatch note**s, and not a second agent.
  A naive split is additionally blocked: option sets moved as contents break the paths-not-contents rule, and written to
  disk they break the rule that the plugin stores none of this exchange anywhere but the comments.

- **D15. Resume is untouched.** An `improve` reply is a verdict reply, so an assumption carrying one is already done by
  the existing filter, and one whose directive was never implemented is already collected by the wave's unresolved
  filter. No new bearing is read and no new mark is invented.

- **D16. `CONTEXT.md` and the ADR are already written.** `Verdict` enumerates four and says what makes `improve`
  different; `Directive` covers both verdicts that state a change; `Axis` is defined, with the tie-breaker constraint in
  the definition and the five axes deliberately left out, because the glossary carries no implementation detail. The
  axes themselves live in `assumption-reviewer.md`, which is what a user's install actually reads — no agent can follow
  a link into `docs/`.

- **D17. The README's enumeration goes to four.** It currently tells users their assumptions are "accepted with reasons,
  corrected, or escalated to you". Leaving it would publish a false description of what the plugin does to their code.

## Testing Decisions

**The seam is the one that already exists: the forge.** `readChangeRequest` in the harness already collects every
assumption comment with the verdict word it named and its resolution state, and `matchers.ts` already asserts off that
data. So the whole mechanical bar for this epic reads off something the harness captures today, and no new seam is
created. What a good test looks like here is what it looks like everywhere in this harness: a fact read off the forge or
the working tree, never a wording an agent chose.

- **The verdict reader gains the fourth verdict.** `change-request.ts`'s `VERDICT` pattern matches three words and its
  comment says so; it becomes four. That reader is documented as "read for the reader, never asserted on", and D-below
  is the first thing that asserts on it.
- **One new matcher: the fix wave reached every `improve`.** An assumption comment whose standing verdict is `improve`
  must end either resolved or carrying a reply posted after that verdict. Both facts are already captured. The bar is
  deliberately *answered-after* rather than *resolved*: a wave may put an improvement on its **hand-off** list, the
  hand-off list lives only in report prose, and a stricter assertion would fail an honest run.
- **The verifier gains a third subject.** Whether the verdicts were sound is exactly what no assertion can settle, which
  is what the verifier is for. It needs the verdict replies, which the harness currently keeps only as an opening line
  and a count — so a writer alongside the one that writes the delivered diff puts the adjudication into the **run
  directory**, and the delivery prompt goes from "two subjects and no others" to three.
- **`report.ts` gains nothing, and this is deliberate.** It documents itself as the only place a test's outcome turns on
  prose, and gives the reason: a round leaves no record anywhere else. Verdict counts are not like that — they are on
  the forge, where the matchers already read them. Asserting them out of report prose would add a second prose reader
  for facts the forge holds, against the harness's own one-seam argument.
- **No assertion that an `improve` occurred.** Whether a **fixture**'s code offers a better road is not the plugin's to
  guarantee, so such an assertion would be flaky by construction — on a test that costs tens of minutes and real money
  per run.
- **`typecheck` and `lint` in `e2e-tests`** are the only mechanical checks any file in this change touches, and they
  cover the harness package still building. They prove nothing about the prose.
- **Everything in `plugin/` is verified by hand**, as every markdown change in this repository is. The **scripted
  backend** does not reach it: that exercises the tools server's review lifecycle, and no Node code changes here at all.

**Prior art.** The existing matcher that asserts every assumption carries a verdict reply is the direct precedent for
the new one — same data, same failure message shape, same vacuous pass when a branch recorded no assumptions. The
verifier's two existing delivery subjects are the precedent for the third.

## Out of Scope

- **Widening the `Fork` bar** so maintainability forks are recorded in their own right. D3 rules it out; it would
  multiply the assumption set at its source.
- **Widening `Grounds`.** D7 rules it out, and ADR-0019 records why.
- **Any bound on how many proposals an adjudication makes** — no reversibility gate, no cap. Rejected knowingly.
- **An owner setting that disables the fourth verdict.** Rejected knowingly; ADR-0008's fail-closed shape is the pattern
  if a user ever asks.
- **Asking the human anything during a delivery.** The run stays unattended.
- **Changing what a round reviews**, including raising its effort tier or widening `/code-review`'s scope. The rounds
  are untouched.
- **Splitting the adjudication into a proposer and an adjudicator.** Deferred to a measurement, per D14.
- **Any change to the tools server, the observer, or the review lifecycle.** No Node code moves in this epic.

## Further Notes

The question that produced this spec was "is a 95% accept rate good or bad?", and the answer it reached is that the rate
was never the defect — the missing comparison was. That distinction is worth keeping: a future reader who reads this
as "make the reviewer stricter" will lower the `override` bar, get more wrong overrides, and still never see an
alternative.

The design has exactly one control on it. D11's report line is what a human learns from, and D12 removed both of the
other candidates on purpose. If that line under-reports, the failure mode is silent redesign with no trace, which is
strictly worse than the invisible `accept` this spec set out to fix.

The empirical loop closes on the next epic. Because D6 makes an `accept` name the roads it beat, the accept rate becomes
auditable from the change request itself — so whether the reviewer is now catching what it should be catching is a thing
to read rather than a thing to argue about.
