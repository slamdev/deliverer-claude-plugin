# 05 — A poll reports what is known, and what a round cost is one object

Status: ready-for-agent

**Blocked by:** 02 and 03 — the fields they remove are not worth teaching this rule to.

**What to build:** a **poll** carries what is known about the **round** and stops. Nothing arrives as `null`, as the
literal `unknown` or as an empty string: while a round runs the answer is four keys, and when it ends the same answer
gains the ending, what the round **spent** under the glossary's own word for it, and the prose that is the whole
deliverable. The **observer** and both consumers of that spend move in the same slice, because a payload the **debrief**
cannot read is not a state this epic may land in. Settled as D1–D4, D11–D13, D23–D26 in `../spec.md`.

- [x] A key appears only when there is something to read: no `null`, no literal `unknown`, no empty string. This covers
      the spend a running round has not reported, the ending a live round has not reached, the reason a healthy round
      has no need of, and the prose an unfinished round does not have.
- [x] Four keys are always present because they are always known — the review's id, its status, when the record opened,
      and how many events have landed — and those four are required in the published output schema while every other
      key is optional there. That optionality is what makes the rule expressible rather than merely documented.
- [x] `events` is published at zero. Nothing has landed is a measurement, not an absence.
- [x] What a round spent is one object under the glossary's word for it, carrying the four token counters, the dollar
      estimate, the provider that labels those dollars and the model that provider served. The whole object is absent
      until a result arrives, so a running poll has no spend key rather than an empty one.
- [x] The four token classes stay separate. They are the figure that does not depend on a provider's price list, and
      each of the four is priced differently.
- [x] Time is not spend. How long the round ran inside the reviewer sits beside the record's own timestamps and the
      event count, outside that object.
- [x] That duration stays the reviewer's own figure rather than the difference between two timestamps. Deriving it
      would put the record's elapsed time — the figure removed for rising whether a review worked or wedged — under a
      claim about the reviewer that it cannot support.
- [x] The observer reads the new shape and only the new shape. A debrief's round line says exactly what it says today —
      the status, the reason, the calls and where they were made, the time inside the reviewer, the dollars and the
      provider — for a run whose records were written after this ticket.
- [x] Replaying a record written before this ticket reports its rounds' spend as unknown. That is the accepted
      consequence, not a defect to chase, and nothing is added to read the old key.
- [x] `code-reviewer` reports a round's total tokens and the provider-labelled dollar estimate, unknown where a key is
      absent, and stops carrying four token classes through prose into a human's report.
- [x] The delivery skill's report line follows: each round's total tokens and its provider-labelled dollar estimate,
      unknown where a round has none.
- [x] The status tool's description says that a key is present only when there is something to read.
- [x] The example payload in the **harness**'s README matches what the server now sends, so the price-table oracle
      beside it still describes a real answer.
- [x] Verified twice: the whole lifecycle against the scripted backend — running, completed, failed and cancelled —
      with no `null`, no `unknown` and no empty string in any answer; and a **replay** of a record written after the
      change, whose debrief's round line is unchanged.
- [x] `typecheck` and `lint` pass in `plugin/mcp`; each file's register and column width are matched.
