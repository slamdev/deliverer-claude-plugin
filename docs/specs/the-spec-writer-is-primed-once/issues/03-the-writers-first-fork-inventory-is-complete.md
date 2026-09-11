# 03 — The writer's first fork inventory is complete

Status: ready-for-agent

**Blocked by:** 02, and through it 01. The reuse edge is on **01**: a collision this ticket surfaces becomes a fork that
a put-back's answer closes, and what a closed fork records is the wording 01 lands — read it out of the landed file
rather than reconstructing it here. The edge on 02 is sequencing, as 02's own line records.

**What to build:** the **spec-writer** looks for the one category of **fork** that actually surfaced in the measured
run, so its **first** report names every fork there is. Today the writer checks **claim**s — statements of fact the
**brief** rests on that nobody has verified — and nothing else. That is why the re-primes happened: the forks were not
killed claims at all.

**The category, stated narrowly: two decisions the brief settled that cannot both hold on an input the spec names.** It
is not a claim, which is a question of fact nobody chose. It is not a fork the brief left open, which the human already
knows about. It is two *closed* decisions in conflict — and the conflict was invisible from the brief alone, becoming
visible only once the writer traced one settled decision's consequences against the code and hit another. The measured
run surfaced two of them mid-write, each arriving as a fresh re-prime: "Decision 20 closed: skip reset when prefix
empty", "Decision 21: wide indent may stand alone".

**It goes at step 3, and where it goes is the point.** Step 3 is already where the brief's contents meet the writer's
own first-hand reading, which is exactly the pairing the check needs. Step 1 is too early — reading the brief cannot
show you a consequence in the code. A new numbered step was declined as work belonging to one that already exists. Step
5 is too late: a collision found at publish time is a fork found after the document is written, which is the expensive
case this epic is removing (D5).

**A collision rides in as a fork, and the glossary carries no new word for it.** Once the writer finds it, the decision
*is* open again and both of **Fork**'s clauses hold: a different reasonable engineer could take either road, and which
road is taken changes behaviour the spec cares about. It goes into the spec marked the human's to close, beside the
forks the brief left open and the ones a killed claim reopened. Do **not** call it a claim — that would name a decision
a statement of fact, which the glossary explicitly forbids — and do not introduce a term for it (D6, D7).

**The writer finds it and never settles it.** This is the misreading to write against: a writer that resolves a
collision by picking the road it prefers has closed a decision that is the human's, silently, which is the one thing the
whole refinement exists to prevent. Step 3's existing treatment of a killed claim is the model — the claim dies, the
*decision* goes to the human — and this follows it exactly. Where the writer's own dispatch already carries the human's
answer, the decision goes in closed on that answer as its grounds, per 01.

**The report gains a line of its own, and merging it into the open-forks line loses the thing that matters.** Every
collision found between decisions the brief settled, with the fork it became. It is separate because the two carry
different weight for whoever reads the report: a fork the brief left open is one the human has already seen, while a
collision is **new information they have to be told**. The orchestrator needs that distinction to know what its next
question round is actually about — and after 02 that round is the whole wave (D8).

**Step 3's existing done-bar is extended, not replaced.** It closes today on every claim being settled first-hand,
killed, or recorded as unsettleable. The collisions the step found join it; nothing about claims changes.

Files: `plugin/agents/spec-writer.md`, and nothing else. Decisions D5, D6, D7 and D8, with D14, in
`docs/specs/the-spec-writer-is-primed-once/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] Step 3 checks for **collisions between decisions the brief already settled** — two that cannot both hold on an
      input the spec names (D5, D6).
- [x] The category is stated narrowly enough that a reader cannot mistake it for a claim or for a fork the brief left
      open (D6).
- [x] A collision rides into the spec as a **fork** marked the human's to close, beside the brief's open forks and any a
      killed claim reopened (D7).
- [x] **The writer never settles a collision itself**, and the prose says so in the same passage that tells it to look —
      the most dangerous misreading in this ticket (D7).
- [x] Where the writer's dispatch already carries the human's answer, the decision goes in closed on that answer as its
      **grounds**, in the wording ticket 01 landed and read out of the landed file (D11).
- [x] The writer's report carries **its own line** for collisions found, with the fork each became, distinct from the
      open-forks line beside it (D8).
- [x] A reader of the report contract cannot merge the two lines and lose which forks the human has already seen (D8).
- [x] Step 3's done-bar still closes on every claim being settled first-hand, killed or recorded as unsettleable, and
      now also on the collisions the step found.
- [x] **No new glossary term is added and `CONTEXT.md` is not edited by this ticket** (D7, D14).
- [x] Steps 1, 2 and 4 are untouched, and no new numbered step is added (D5).
- [x] Step 5 is not edited by this ticket — the publish gate is ticket 04.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [x] Register holds: this file is prose written to be read by a model.
- [x] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] No **effort** tier, model or **ceiling** changes (D15).
