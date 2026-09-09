# 04 — A claim carries the base ref it was read at, and no writer spans two

Status: ready-for-agent

**Blocked by:** None — can start immediately. It edits `refine/SKILL.md`, which ticket 02 also edits; if both are in
flight, land 02 first so the second edit is made against settled text.

**What to build:** the **base ref** recorded once and carried into what every **writer** publishes, and a standing rule
that a writer is never continued across a moved one.

The observed **run** read a feature branch and wrote the default branch's names over it. `spec-writer` was dispatched,
finished, and was **continued nineteen minutes later with the working tree on a different ref**; the line numbers
already in its notes went into the published **spec** unchanged while the prose around them was rewritten. Four of the
run's eleven wrong claims are that one mistake, including a caller count that is right on one ref and wrong on the
other. A resumed agent cannot be told to distrust its own notes.

**The test is the ref, not the working tree.** Stage 1 runs the domain-modeling skill precisely so glossary entries and
ADRs land as decisions crystallise — that dirties the working tree without moving the ref, so a rule written over "a
changed working tree" would forbid continuing a writer after nearly every refinement and delete the measured
continue-over-cold preference of `docs/specs/orchestrator-contracts/spec.md` D9, which ran at 71% of a cold write.
Reading the ref and comparing it against the one the brief records is a single look, and so **mechanical**.

Two edits close it. `refine/SKILL.md` states that the **brief** records the base ref every `file:line` **claim** was
read at — once, for the run, not per claim — and states that a writer is never continued across a moved one: a ref that
moved means re-dispatching cold with the new one. Each writer then carries that ref into what it publishes, so a claim
in a spec or a **ticket** can be checked against the ref it came from long after the tree has moved on.

**Three placements, each named, because each document has a fixed shape.** In the brief, a line **above** the five
bullets rather than a sixth: the stage's own bar reads "every one of the **five** things it carries is written out of
the conversation or stated to hold nothing", and the ref is a mechanical fact about the environment rather than
something the conversation settled, so it must not be counted by that bar. In the spec, a line in **Further Notes**,
which already collects this class of document-level fact. In a ticket, a **`Base ref:` line beside `Status:`** — it
stays literal text on every tracker, since `Spec`, `Blocked by` and `Status` are replaced by platform mechanisms where
a forge has them and no forge has one for a ref.

**The brief's own prohibition has to name that line as not one of them.** Its section closes "the brief carries what the
session decided and what it never checked — and no section of established facts, however that section is headed", which
is the contract that makes a **claim** get checked by a writer rather than trusted. A stated fact above the bullets
meets that head-on, and a reader resolves it one of two wrong ways: leave the ref out, or take the prohibition as soft
and open the facts section it exists to forbid. So extend the clause rather than trusting the placement to dodge it —
**the base ref line says where the reading happened, not what the reading found.**

Files: `plugin/skills/refine/SKILL.md`, `plugin/agents/spec-writer.md`, `plugin/agents/tickets-writer.md`. Decisions
D21, D21a and D22, bounded by D24, in `docs/specs/the-interview-stops-reading/spec.md`. The **Base ref** glossary entry
landed with ticket 01.

- [ ] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [ ] `refine/SKILL.md` states that the brief records the base ref every `file:line` claim was read at (D21).
- [ ] The ref is recorded **once, for the run** — a per-claim ref was declined as noise (D21).
- [ ] **The brief's line sits above its five bullets, and the stage bar still reads "five"** — the count is not changed
      and the ref is not made a sixth thing the conversation settled (D21).
- [ ] **The brief's ban on a section of established facts survives, and names the ref line as not one of them** — that
      ban is what makes a claim get checked rather than trusted, so it is extended rather than weakened, and the line is
      distinguished as saying where the reading happened rather than what it found (D21).
- [ ] `refine/SKILL.md` states that a writer is **never continued across a moved base ref**, and that a moved ref means
      dispatching a cold writer carrying the new one (D22).
- [ ] **The test is the ref and not the working tree** — uncommitted edits, including the glossary entries and ADRs
      stage 1 lands, do not trip it, and the continue-over-cold preference survives for the ordinary case (D22).
- [ ] That rule reads as a condition the orchestrator tests, not a permission it may decline — the same shape D5 uses.
- [ ] The spec writer carries the base ref into the spec it publishes, as a line in the template's **Further Notes**
      (D21).
- [ ] The tickets writer carries it into every ticket, as a **`Base ref:`** line beside `Status:` in the template
      (D21).
- [ ] **Nothing instructs any agent to re-check a claim or verify a ref mechanically** (D24).
- [ ] Neither writer's first-hand read of the repository, nor paths rather than contents, is weakened (D10).
- [ ] The `model` and `effort` frontmatter of every file touched is **unchanged** (D14).
- [ ] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D19).
- [ ] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [ ] Nothing from the observed repository — its name, paths, domain or the idea it refined — appears in any edit.
