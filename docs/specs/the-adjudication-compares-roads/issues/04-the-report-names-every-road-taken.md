# 04 — The report names every road taken, and the README says four

Status: ready-for-agent

**Blocked by:** 01, 03 — the count needs the verdict, and the line relays the wave's account.

**What to build:** a human reading a delivery's **report** learns which of their forks the run took a different road on,
and which **axis** carried each one. With no bound on how many proposals a run may implement and no setting that turns
the feature off, this line is the only control the design has — if it under-reports, the failure mode is silent redesign
with no trace. The README stops telling users there are three verdicts. Settled as D10, D11, D12, D13 and D17 in
`../spec.md`.

- [x] Stage 3's description says the stage compares roads and may direct a change, rather than only replying a verdict.
- [x] The report carries four verdict counts.
- [x] The report carries one line per implemented proposal — the fork, the road taken, the axis.
- [x] That line carries the **fix wave**'s account rather than the adjudication's, because a directive the wave declined
      or never reached is not a change to the code.
- [x] Where the two accounts disagree, the rule already applied to a **gate** a commit names and a report does not is
      the rule applied here: put the stage back rather than choose between them.
- [x] The **orchestrator** forms no view on any of it. It relays counts and lines; a report leaving it unsure is
      answered by putting the stage back, never by reading the comments itself.
- [x] Nothing bounds how many proposals a run may implement, and no owner setting is added.
- [x] The **round**s are untouched: no effort tier moves, and the deliberate overlap between this stage and a round is
      not resolved in either direction.
- [x] The README's account of what happens to an assumption names four verdicts and says a better road may be taken
      without being asked for.
- [x] The README's "What still needs a human" list is checked and nothing is added: an `improve` needs no human.
- [x] Register and column width matched, in both files.
