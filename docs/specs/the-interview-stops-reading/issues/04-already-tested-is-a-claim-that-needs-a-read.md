# 04 — "Already tested" is a claim that needs a read

Status: ready-for-agent

**Blocked by:** None — can start immediately. It edits the same two **writer**s as ticket 03; either order works, and
each edit is a separate step in a separate section.

**One interaction to get right, whichever lands first.** Ticket 03 puts a stopping point on each writer's step 2, keyed
on the modules the document touches — and a test file is not one of those, so satisfying that bar never discharges this
one. This bar sits in a later step and the read happens there. Ticket 03 says in each file that its bar ends its step
rather than the writer's reading; nothing here depends on that having landed, but nothing here may contradict it either.

**What to build:** one bar in each writer — a **claim** about what an existing test covers is settled by reading the
test body.

Three of the observed **run**'s wrong claims assert coverage a test file does not have, read off its class name: an
integration test said to cover a create-and-update round trip, which in fact looks one resource up four times; a
converter fallback said to be exercised by the only entity in the file that cannot reach it; and a model test said to
assert a field through both of its conversions, where both assertions follow one of them. All three landed in the
**spec**'s testing table, and two were restated as **ticket** acceptance criteria — as prior art an implementer is told
to extend.

**A wrong line number is caught on the first checkout. "This is already tested" is believed**, and the cost is a test
nobody writes. So the bar is a read: the claim comes from the test body or it is not made. Coverage claims are **not**
forbidden; an implementer needs to know what already exists, and silence would only move the guess downstream.

**Each bar sits where its claim is made, and the two writers differ in where that is.** The spec writer has a step
whose job is the seams and the **prior art** beside them — the tests this codebase already has for the area — and the
bar goes there, at the point of authorship. The tickets writer has **no testing step at all**: it reads the spec,
explores, drafts the slices, publishes. It does not author coverage claims, it *restates* them, turning the spec's
table into acceptance criteria — and that restatement is the observed failure, where a claim that arrived wrong was
repeated with more authority than it was made with.

**So its bar goes in the step that writes those criteria, which is the publishing step and not the drafting one.** Read
both before choosing: the drafting step drafts slices and their **blocking edges** and says nothing about criteria,
while the publishing step is where each slice is written to the ticket template that carries them. The bar sits where
the claim is made or it is decoration. Filtering on intake in step 1 was rejected for the same reason, and more so: it
puts the bar pages away from the moment of restatement.

Files: `plugin/agents/spec-writer.md`, `plugin/agents/tickets-writer.md`. Decision D23, bounded by D10 and D24, in
`docs/specs/the-interview-stops-reading/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] The spec writer states that a claim about what an existing test covers is settled by **reading the test body**,
      in the step that sketches the seams and the prior art beside them (D23).
- [x] The tickets writer states the same bar for the coverage claims it inherits from the spec, **in the step that
      writes the acceptance criteria** — which is the publishing step, where each slice meets the ticket template. Not
      the drafting step, which writes no criteria; not a preamble; not an intake filter (D23).
- [x] Both steps were read before the bar was placed, and the placement matches what each step's own text says it does
      (D23).
- [x] Coverage claims are **not** forbidden — the bar is on their evidence, not on making them (D23).
- [x] The bar names what a read settles: what the test asserts, not what its name suggests it asserts.
- [x] **The read happens in the step the bar sits in.** Having read the modules a slice cuts through — ticket 03's
      step-2 stopping point — does not discharge it, because a test's body is no part of that bar, and nothing here
      reads as contradicting it (D9, D23).
- [x] Neither bar weakens paths rather than contents or a writer's first-hand read of the repository (D10).
- [x] **No verification pass, no re-check of a landed claim, and no second agent** (D24).
- [x] The `model` and `effort` frontmatter of both agents is **unchanged** (D14).
- [x] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D19).
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [x] Nothing from the observed repository — its name, paths, domain or the idea it refined — appears in any edit.
