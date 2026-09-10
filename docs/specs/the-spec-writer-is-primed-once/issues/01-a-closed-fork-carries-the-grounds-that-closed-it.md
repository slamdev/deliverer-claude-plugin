# 01 — A closed fork carries the grounds that closed it

Status: ready-for-agent

**Blocked by:** None (can start immediately).

**What to build:** a **fork** the published **spec** says is closed says what closed it. Today a fork can be written up
as settled on nothing at all, and the next **dispatch** is what discovers it: the **observer** watching the measured run
named exactly that as a **defect** with **grounds** — the spec declared every fork closed while the **tickets-writer**'s
own reading found one still open, which reopened two dispatches that had already reported complete. That is the same
re-priming this epic exists to remove, one stage later, and it is fixed in the file that produces the document rather
than in the file that reads it.

**This generalises a clause `spec-writer.md` already carries rather than inventing one.** Step 3 already says that where
the writer's dispatch carries the human's answer to a decision a killed **claim** took down, "the answer is what it is
settled on instead … on that answer as its **grounds**". That is this rule, stated for one case. The step's own reading
is what it applies to; nothing yet says it of a fork the *brief* left open and a put-back later closed, and nothing says
what a fork closed on no answer at all is. State it once, for every closed fork, wherever the writer records one.

**A fork this rule leaves nowhere to go is an open fork, not a closed one with a blank.** If the writer has no answer,
it has no grounds, and the fork rides into the spec still open and marked the human's to close — which the contract
already provides for. There is no third state, and this ticket must not invent one: "closed, grounds unknown" is
precisely the shape the observer caught.

**The bar is on the document, not on the report.** The report already names every open fork the spec carries. What this
adds is that the *published spec* is where a closed fork's grounds are readable, because the spec is what the tickets
writer and every implementer downstream reads and the report is not.

**`CONTEXT.md`'s Grounds entry gains the fourth thing that stands on grounds.** The entry today reads as an exhaustive
list — "The evidence a verdict, a declined finding or a reopened ADR stands on … For a **defect**, what the observation
itself kept" — and after this ticket the plugin's own prose uses **grounds** of a closed fork too. Add that, and nothing
else: the entry's closing test ("whoever holds the file can find the thing cited in it") and its "Never taste" already
carry the meaning, and it stays one entry about evidence rather than becoming a list of rules. Do **not** amend
**Fork**: the requirement belongs where grounds are defined, not duplicated into the term it constrains (D13).

**The glossary does not ship.** `.claude-plugin/marketplace.json` publishes the `plugin/` directory alone, so no runtime
agent ever reads `CONTEXT.md`. The two edits are therefore not one wording copied between two readers — the agent file
must carry this rule's whole meaning in its own prose, and the glossary entry exists for the contributor. Write each for
its own reader; do not make either a pointer to the other.

Files: `plugin/agents/spec-writer.md` and `CONTEXT.md`. Decisions D11 and D13, with D14, in
`docs/specs/the-spec-writer-is-primed-once/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] `spec-writer.md` requires that a fork the published spec declares **closed** names the **grounds** it was closed
      on (D11).
- [x] The rule reads as covering every closed fork — one the brief left open and a put-back closed, and one a killed
      claim took down and an answer settled — rather than only the case step 3 already names (D11).
- [x] **A fork with no grounds is an open fork**, and the prose says so, so no reader concludes that a closed fork may
      carry a blank where its grounds go (D11).
- [x] The requirement lands on what the **published spec** carries, not only on what the **report** names (D11).
- [x] `CONTEXT.md`'s **Grounds** entry names a closed fork alongside a verdict, a declined finding and a reopened ADR
      (D13).
- [x] The **Grounds** entry keeps its closing test and its `_Avoid_` list, and still reads as one entry about evidence
      (D13).
- [x] **`CONTEXT.md`'s Fork entry is untouched**, and no new glossary term is added (D13, D14).
- [x] The agent file's prose carries this rule's whole meaning without depending on the glossary, which does not ship.
- [x] No **ADR** is written or amended (D14).
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
- [x] Register holds: `plugin/agents/spec-writer.md` is prose written to be read by a model, and `CONTEXT.md` is a
      glossary and nothing else — no implementation detail reaches it.
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] No **effort** tier, model or **ceiling** changes (D15).
