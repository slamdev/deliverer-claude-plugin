# 01 — `mechanical` and `base ref` are defined, the clause reaches the web, and ADR 0015 says what read-only covers

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** the words the rest of this epic stands on stop being undefined, and the clause the next ticket copies
reaches its final wording. **Mechanical** enters the glossary: a question about the tree, the forge or the web whose
answer is true or false rather than good or bad — and the fact that answers one — and the only kind an **orchestrator**
settles for itself. It is already bolded three times in the delivery skill and stated in ADR 0015, and defined nowhere;
bold marks a glossary term in this repository, so today it is a dangling one, and the refinement skill is about to make
it a fourth use in a second skill.

**Base ref** enters it too, for the same reason one ticket later: after this epic the phrase is a term in four shipping
files. What is being defined is not git's "ref" but **the** base ref — the one commit a **run** read the code at,
recorded in the **brief** and carried into every document a **writer** publishes, one per run and explicitly never one
per **claim**. That cardinality was a decision, and the glossary is the only place a rule of that shape survives.

**The clause gains the web here, in every place it is stated.** The rule reaches the tree, the forge and the web alike
on one test, and the next ticket's refinement rule copies this clause verbatim — so the delivery skill, ADR 0015 and
the glossary entry all say "the tree, the forge or the web", or the shared clause is not shared. That widens what a
delivering orchestrator may settle, which is inert in practice: delivery reads a branch and a change request.

**The sentence under the ADR's clause counts the sources, so it moves with them.** It reads "The two are one exception
and not two: whether a check is green is as mechanical as whether the tree builds, and reading it is the same move as
reading the branch" — true of two sources and false of three, with no web half to its argument. Keep the argument and
drop the count: whether a check is green, or whether a published document says what a report claims it says, is as
mechanical as whether the tree builds. **Edit the clause and leave this sentence and the ADR contradicts itself in
consecutive lines.**

And ADR 0015 says what its "read-only" is read-only over. It states that the orchestrator is read-only without naming
the thing, which was true of the orchestrator it was written for — a delivering one writes nothing. A refining
orchestrator writes the **brief**, and its first stage runs the domain-modeling skill precisely so terms and decisions
land in the project's glossary and ADRs as they crystallise. The amendment says: read-only over the code being
delivered into, while the **epic**'s own documents are the orchestrator's to write. Without it, the rule the next
ticket adds reads as forbidding a stage the skill mandates. `CONTEXT.md`'s own **Orchestrator** entry carries the same
unqualified claim and gets the same object — the glossary is the layer every other document cites.

**The one dangerous edit in this ticket:** you are editing `build/SKILL.md` for the web *and* amending the ADR's
read-only wording, in one context. **Do not carry the read-only qualification into `build/SKILL.md`.** Its "read only"
and "never fix" edges are correct unqualified, because a delivering orchestrator writes nothing — everything goes
through an agent, and "put a stage back rather than fix it" depends on that edge holding.

This is **prefactoring** — it lands first so the slice after it is smaller. Make the change easy, then make the easy
change.

Files: `CONTEXT.md`, `docs/adrs/0015-the-orchestrator-forms-no-judgement.md`, `plugin/skills/build/SKILL.md`,
`plugin/agents/tickets-writer.md`. Decisions D2, D3, D12, D13, D19 and D21a in
`docs/specs/the-interview-stops-reading/spec.md`.

- [ ] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [ ] The glossary carries a **Mechanical** entry: a question about the tree, the forge or the web whose answer is true
      or false rather than good or bad, and the fact that answers one, and the only kind an orchestrator settles for
      itself (D12).
- [ ] The entry carries an `_Avoid_` list, as every other entry in the glossary does, and sits in the section its
      neighbours' subject matter puts it in — *The run*, beside **Orchestrator**.
- [ ] The entry is consistent with the term's existing uses in `plugin/skills/build/SKILL.md` and in ADR 0015 —
      confirmed by reading both, not assumed. **That file uses the word four times, three of them bold**; all four
      modify a question or a fact and none needs rewording (D12).
- [ ] The glossary carries a **Base ref** entry: the one commit a **run** read the code at, recorded in the brief and
      carried into every document a writer publishes — **one per run and never one per claim**, with that cardinality
      stated in the entry rather than left to the skill (D21a).
- [ ] The **Base ref** entry carries an `_Avoid_` list too, and sits in the section its neighbours' subject matter puts
      it in.
- [ ] **The word's second sense keeps its meaning under another word.** `plugin/agents/tickets-writer.md` drops
      "mechanical" from "one mechanical change" and keeps its examples, which already carry the rote sense. The
      glossary's **Wide refactor** entry has none, so dropping the word there alone would leave nothing carrying it:
      that entry reads "one **rote** change — rename a column, retype a shared symbol — whose blast radius …", taking
      both the word and the examples from the agent file so the two finally read alike (D12).
- [ ] **No comment under `plugin/mcp/` is touched.** The rote sense appears there roughly twenty times — "the observer's
      mechanical half" and the like — unbolded and in no instruction a model reads, so the one-term rule is not broken
      and rewording them would put a large diff in the only package CI checks for no change in behaviour (D12).
- [ ] `plugin/skills/build/SKILL.md`, ADR 0015 and the glossary entry all state the test over **the tree, the forge or
      the web** (D3).
- [ ] **ADR 0015's next sentence no longer counts the sources.** "The two are one exception and not two" is rewritten to
      keep its argument and drop the count, so the record does not contradict itself in consecutive lines (D3).
- [ ] **`build/SKILL.md`'s "read only" and "never fix" edges are unchanged** — only the test clause moved there (D13).
- [ ] ADR 0015 states what its read-only edge is read-only over: the code being delivered into, while the epic's own
      documents — the brief, and the glossary entries and ADRs a refinement lands — are the orchestrator's to write
      (D13).
- [ ] `CONTEXT.md`'s **Orchestrator** entry carries the same object (D13).
- [ ] The amendment leaves intact that the orchestrator forms no view on a **review finding**, on a design, or on
      whether the work is good, and that what it does with a stage that went wrong is put it back or **report** it.
- [ ] **No new ADR is added** (D13).
- [ ] The doc stack holds: `CONTEXT.md` cites nothing, and the ADR uses glossary terms and names no **spec** and no
      **ticket**.
- [ ] Register holds: load-bearing bold, no hedging, and the register of each file preserved (D19).
- [ ] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
