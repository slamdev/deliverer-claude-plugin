# 04 — Nothing contradictory publishes as settled

Status: ready-for-agent

**Blocked by:** 03 — this ticket's bar is stated over the category 03 defines. Read the landed definition of a collision
out of `plugin/agents/spec-writer.md` and state the bar against it; do not define the category a second time here, and
do not let the two wordings drift.

**What to build:** the **spec-writer**'s publish step will not write two contradicting decisions up as **settled**. It
is the backstop behind ticket 03: 03 makes collisions surface early, and this makes it impossible for one that slipped
through to reach a published **spec** looking like a decision anybody made.

**The bar, exactly.** No two decisions in the published spec contradict each other on an input the spec names *and* are
both written up as settled. It is a bar on **what may be written up as settled** — not a bar on publishing (D9).

**It does not block the spec, and getting that wrong is the failure mode.** The writer cannot resolve a contradiction:
which of two decisions stands is the human's call, and step 3's whole treatment of a killed claim rests on that
distinction. So a bar that reads as "do not publish until this is resolved" costs a put-back *before the spec exists at
all* — the exact re-prime this epic removes — and hands the human a half-refined epic with nothing to read. One caught
here publishes, as an open fork (D9).

**Both roads are named, and which settled decision each came from.** The writer holds the context that found the
collision; nobody downstream does. Reconstructing it later costs the human a re-read of the brief or the orchestrator a
cold dispatch that pays for the whole write again. Naming the two roads and their origins is what makes the human's
single answer enough to close it in the wave ticket 02 established — and it is the difference between this bar buying
something and merely recording that something is wrong (D10).

**It goes where the template already carries open forks.** The spec template's **Further Notes** section already names
"every **fork** still open — the ones the brief left open, and any a killed **claim** reopened — each marked as the
human's to close, so no ticket closes it silently". A collision's fork belongs in that list, extended rather than
duplicated: one place in the published document where a downstream reader finds every open fork, whatever surfaced it.

**Step 5's existing done-bar is extended, not rewritten.** It closes today on the published spec carrying the triage
label and every section of the template, every surviving claim written up as the fact it now is, and every decision and
open fork from step 1 — with the note that a decision whose claim step 3 killed counts as carried in either of the two
forms step 3 gives it. This adds one clause to it. Do not disturb the rest, and in particular do not weaken the
requirement that the spec carries every section of the template.

**Nothing here makes the writer re-read its own spec looking for contradictions.** Across all four measured runs the
writer already spends 42-68% of its tool calls on the document it is writing, and re-grepping its own spec for a phrase
it may have contradicted is part of what that measures. This is a bar on what the writer may *write*, discharged from
what it already knows while writing — not an instruction to sweep the finished document. A reader who turns it into the
latter has bought a cost this epic is trying to remove.

Files: `plugin/agents/spec-writer.md`, and nothing else. Decisions D9 and D10 in
`docs/specs/the-spec-writer-is-primed-once/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] Step 5's done-bar forbids two decisions that contradict each other on an input the spec names from **both being
      written up as settled** (D9).
- [x] The bar **does not block publication**, and no reader can conclude that a collision found here stops the spec
      being published (D9).
- [x] A collision caught at this point publishes as an **open fork** marked the human's to close (D9).
- [x] The fork names **both roads** and which settled decision each came from, so one answer from the human closes it
      (D10).
- [x] It lands in the template's existing **Further Notes** list of open forks, extended rather than duplicated (D10).
- [x] Step 5's existing bar is otherwise intact: the triage label, every section of the template, every surviving claim
      written up as fact, and every decision and open fork from step 1.
- [x] **The bar is not an instruction to re-read the published spec hunting for contradictions**, and the prose cannot
      be read that way.
- [x] The collision category is not redefined here — the landed wording from ticket 03 is used, and the two do not
      drift.
- [x] Steps 1 to 4 and step 6 are untouched by this ticket.
- [x] `plugin/skills/refine/SKILL.md` and `CONTEXT.md` are not edited by this ticket.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [x] Register holds: this file is prose written to be read by a model.
- [x] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] No **effort** tier, model or **ceiling** changes (D15).
