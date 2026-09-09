# 06 — The before-and-after is measured and written down

Status: ready-for-agent

**Blocked by:** 01, 02, 03, 04, 05 — the "after" figure measures the finished branch, so every other slice lands first.
The "before" figure waits on none of them: it is taken from a **separate clean checkout** of the default branch, which
is independent of the working tree, so it can be taken at any point.

**What to build:** the evidence. This epic bets that one prose condition will fire where two existing instructions did
not, and nothing in the five slices before this one takes a figure — so without this slice the epic can be implemented,
reviewed and merged with the bet unsettled, and the **hand-off** it names, giving the sweep a target agent, stays
"revisitable with evidence" that never exists.

Run `e2e-tests/tests/refine-happy-path.test.ts` twice and compare. It drives a whole refinement against a committed
**fixture**, with a **responder** in the human's seat and **ceiling**s of ninety minutes and twenty-five dollars, and it
already prints its measured wall clock and **spend** as a diagnostic. **No assertion is added and the test file is not
edited** — what it already prints, read through the tally ticket 03 documented, is the whole instrument.

**The "before" must come from a clean checkout of the default branch.** The **harness** installs from a **staged copy**
of the working tree, so a run started from a part-edited tree measures a part-edited plugin and says nothing about
which. `CONTRIBUTING.md` § The end-to-end tests says what a run needs to get off the ground, and § Tallying a run is how
its records are read afterwards.

**Three attempts a figure, and every attempt is written up** — its figures, and why it ended. A branch that passed on
the third attempt must not read like one that passed first time. What may be repeated is a run that **never started** —
a missing credential, an install that refused — or one that **failed a mechanical assertion**. A failed **verifier**
verdict on the branch **ends this slice and is reported as the finding it is**: it is the one signal nothing in this
repository can assert, so a second run buys over exactly the evidence that reading less produced a worse **spec**. A
ceiling reached is a reported outcome carrying what the run had got to, and never a failed assertion.

**Nothing here edits the epic's prose to move the number.** The fixture is three functions with unit tests and D17 says
outright that it will understate the saving. A worse or flat figure is a finding to report, and the levers it would
reopen — model and effort tiers, naming the sweep's target — are hand-offs by decision, not this slice's work.

Files: `docs/specs/the-interview-stops-reading/spec.md`, and nothing else. Decisions D16, D17 and D17a in that spec.

- [ ] The "before" figure was taken from a clean checkout of the default branch, and the write-up names the commit.
- [ ] The "after" figure was taken on the finished branch, with the five other slices landed.
- [ ] Both report, per agent, **model turns, peak context and tokens by kind**, read through the guide's own tally
      (D16).
- [ ] Each run's **spend** is reported labelled with the provider that served it, and **what the observation itself
      cost** is reported beside it (D16).
- [ ] Each run's measured wall clock is reported — sweeps buying spend with wall clock is what only this measurement
      would catch before a user does.
- [ ] **Every attempt is written up**, not only the one that passed, with its figures and why it ended (D17a).
- [ ] **At most three attempts per figure** (D17a).
- [ ] Only a run that never started or one that failed a mechanical assertion was repeated. **A failed verifier verdict
      ended the slice and was reported as the finding** (D17a).
- [ ] A **ceiling** reached was reported as a ceiling and never as a failed assertion.
- [ ] **No file outside the spec was edited** — not the test, not the **harness**, and none of the prose the five slices
      landed (D17a).
- [ ] The results sit in a **dated section of the spec's Further Notes**, beside the figures it already carries for the
      run that motivated this epic.
- [ ] The write-up says plainly what the figure does not settle, the fixture's smallness included.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [ ] Nothing from the observed repository — its name, paths, domain or the idea it refined — appears in any of it.
