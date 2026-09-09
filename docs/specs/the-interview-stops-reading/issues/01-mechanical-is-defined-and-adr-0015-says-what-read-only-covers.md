# 01 — `mechanical` is defined, the clause reaches the web, and ADR 0015 says what read-only covers

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** the words the rest of this epic stands on stop being undefined, and the clause the next ticket copies
reaches its final wording. **Mechanical** enters the glossary: a question about the tree, the forge or the web whose
answer is true or false rather than good or bad — and the fact that answers one — and the only kind an **orchestrator**
settles for itself. It is already bolded three times in the delivery skill and stated in ADR 0015, and defined nowhere;
bold marks a glossary term in this repository, so today it is a dangling one, and the refinement skill is about to make
it a fourth use in a second skill.

**The entry carries the test and not only the label.** A mechanical question is answerable **in a single look**, and
following a thread — a search whose results are read to decide what to search next — is not one, however cheap each step
of it looks. That clause is the load-bearing half of the rule, and the glossary is where it lives because the glossary
is the one document a reader of either skill meets. `build/SKILL.md` is **not** given it: a prohibition needs an outlet,
and a delivering orchestrator has none — it dispatches this plugin's own named agents, one at a time, and its edges are
read only and never fix. The next ticket states the test in the refinement skill's own prose as well, because that file
ships and this one does not.

**The word carries two other senses, and both are dealt with here.** One is *rote or automatable* — "one mechanical
change" in the glossary's **Wide refactor** entry and in `tickets-writer.md`. The other is *asserted by a test rather
than by a reader* — the glossary's own **Verifier** entry closes on "What a test can assert **mechanically** is never
its business". A glossary that defines a word on one line and uses it otherwise a few hundred lines later is the
sharpest instance of what this epic exists to prevent, so neither is left standing beside the new entry.

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
`plugin/agents/tickets-writer.md`. Decisions D1, D2, D3, D7, D12, D13, D19 and D26 in
`docs/specs/the-interview-stops-reading/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] The glossary carries a **Mechanical** entry: a question about the tree, the forge or the web whose answer is true
      or false rather than good or bad, and the fact that answers one, and the only kind an orchestrator settles for
      itself (D12).
- [x] **That entry carries the test.** Answerable in a single look, and a thread — a search whose results are read to
      decide what to search next — is not one, however cheap each step of it looks (D1, D2).
- [x] **`build/SKILL.md` is not given the thread clause**, and the decision that says why is not re-argued here: a
      delivering orchestrator has nowhere to send a thread (D2).
- [x] **ADR 0015 does not restate the test either.** It uses the term the glossary now defines, as the doc stack
      requires of an ADR, so the test has one wording and not two (D2).
- [x] The entry carries an `_Avoid_` list, as every other entry in the glossary does, and sits in the section its
      neighbours' subject matter puts it in — *The run*, beside **Orchestrator**.
- [x] The entry is consistent with the term's existing uses in `plugin/skills/build/SKILL.md` and in ADR 0015 —
      confirmed by reading both, not assumed. **That file uses the word four times, three of them bold**; all four
      modify a question or a fact and none needs rewording (D12).
- [x] **No `Base ref` entry is added**, and no glossary entry mentions one: that term went with the withdrawn D21a
      (D26).
- [x] **The word's second sense keeps its meaning under another word, and both places use that word.**
      `plugin/agents/tickets-writer.md` says "one **rote** change" where it said "one mechanical change", keeping its
      examples. The glossary's **Wide refactor** entry has no examples, so it takes those: "one **rote** change — rename
      a column, retype a shared symbol — whose blast radius …". **Dropping the word on one side and adding a different
      one on the other would leave them not matching**, which is the whole point of this criterion (D12).
- [x] **The third sense is gone from the glossary as well.** `CONTEXT.md`'s **Verifier** entry says what it means —
      asserted by a test — rather than leaning on the word the new entry defines. Its own use in `CONTRIBUTING.md` lands
      with ticket 03, which edits that file anyway (D12).
- [x] The glossary's **Sweep** entry states the cardinality the refinement skill is about to rely on: one subject each,
      and more than one may be in flight (D7).
- [x] **No comment under `plugin/mcp/` is touched.** The rote sense appears there roughly twenty times — "the observer's
      mechanical half" and the like — unbolded and in no instruction a model reads, so the one-term rule is not broken
      and rewording them would put a large diff in the only package CI checks for no change in behaviour (D12).
- [x] `plugin/skills/build/SKILL.md`, ADR 0015 and the glossary entry all state the test over **the tree, the forge or
      the web** (D3).
- [x] **ADR 0015's next sentence no longer counts the sources.** "The two are one exception and not two" is rewritten to
      keep its argument and drop the count, so the record does not contradict itself in consecutive lines (D3).
- [x] **`build/SKILL.md`'s "read only" and "never fix" edges are unchanged** — only the test clause moved there (D13).
- [x] ADR 0015 states what its read-only edge is read-only over: the code being delivered into, while the epic's own
      documents — the brief, and the glossary entries and ADRs a refinement lands — are the orchestrator's to write
      (D13).
- [x] `CONTEXT.md`'s **Orchestrator** entry carries the same object (D13).
- [x] The amendment leaves intact that the orchestrator forms no view on a **review finding**, on a design, or on
      whether the work is good, and that what it does with a stage that went wrong is put it back or **report** it.
- [x] **No new ADR is added** (D13).
- [x] The doc stack holds: `CONTEXT.md` cites nothing, and the ADR uses glossary terms and names no **spec** and no
      **ticket**.
- [x] Register holds: load-bearing bold, no hedging, and the register of each file preserved (D19).
- [x] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
