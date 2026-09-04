# 02 — The adjudication compares roads

Status: ready-for-agent

**Blocked by:** 01 — a better road needs a verdict to carry it before anything goes looking for one.

**What to build:** the adjudication stops grading the one road it was handed. For each assumption it names the
alternatives the **fork** left available, judges them on named **axis**es, and where the shipped choice wins the
`accept` names the roads it beat — so a human merging meets the fork and its options rather than a count. This is the
step whose absence made nearly every verdict an `accept`: no bar can compare against an option set nobody generated.
Settled as D1, D2, D3 and D6 in `../spec.md`.

- [ ] The legwork gains a step that names the alternatives the fork left available for the assumption in hand. It joins
      the five conformance checks rather than replacing any of them.
- [ ] The five axes are named: what a road does **under failure**, **under an adversary**, **at the limits**, **to the
      caller's contract**, and **to what the caller sees when it goes wrong**.
- [ ] How expensive the code is to change later breaks a tie between those and never carries a verdict on its own —
      written as the constraint it is, because it is the one axis the **fork** bar excludes as taste.
- [ ] Nothing widens what counts as a fork. The agent raises no fork that no **assumption comment** names, and what an
      `implementer` records is untouched, so the set this stage works does not grow at its source.
- [ ] An `accept` names the roads it beat and why, briefly. The option set is generated either way, so this costs
      nothing extra to produce.
- [ ] The step applies to every assumption including the last, and the existing instruction to give the last one the
      same scrutiny as the first still reads true against the heavier per-assumption reading.
- [ ] The whole-set read that precedes the per-assumption work is unchanged: this agent is still the only one that sees
      every fork against the finished branch, and a conflict between two of them is still **grounds**.
- [ ] Nothing bounds how many `improve` verdicts one adjudication may reach, and the prose invents no bound.
- [ ] It is still one **dispatch**: no agent is dispatched, nothing is written to the task list, and the option sets are
      not posted, filed or forwarded anywhere.
- [ ] Register and column width matched.
