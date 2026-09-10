# 02 — The interview settles mechanical questions and sends the rest out

Status: ready-for-agent

**Blocked by:** 01 — the shared test clause reaches its final wording in `plugin/skills/build/SKILL.md` before this
ticket copies it. That is the whole of the edge: `CONTEXT.md` and `docs/adrs/` **do not ship** — the marketplace
publishes the `plugin/` directory alone — so no runtime agent reads either, and this rule carries its own meaning in
its own prose regardless. Read the landed clause out of `build/SKILL.md` and copy it; do not reconstruct it from here.

**What to build:** A refinement's interview stops reading the repository for itself. The **orchestrator** settles a
**mechanical** question — one that answers true or false in a single look, in the tree, on the forge or on the web —
and nothing more. Following a thread is not one, however cheap each step of it looks: a search whose results are read
to decide what to search next goes out to a **sweep**. The rule binds for the whole **run**, and it is the rule the
delivery skill already carries and ADR 0015 already states; this is where the refinement skill was missing it.

**One clause is shared, not the paragraph.** The delivery skill's sentence continues into examples about a branch and a
change request, and closes on edges — "read only", "never fix" — that a refining orchestrator cannot have, because it
writes the **brief** and stage 1 lands glossary entries and ADRs. Copy the **bolded test clause verbatim**; write this
skill's own examples and its own edges around it.

**The test itself is this file's to state in full.** A single look, and a thread — a search whose results are read to
decide what to search next — is not one. That clause is in the glossary entry ticket 01 lands, and the glossary **does
not ship**, so a runtime agent meets it only where a skill states it. State it here; `build/SKILL.md` deliberately does
not carry it, and re-arguing that is no part of this ticket.

**The two sentences that say this interview dispatches nothing are narrowed, and that is the half of this ticket most
likely to decide whether any of it works.** The file opens on "**Stage 1 is yours and nobody else's**" beside "Every
stage after it is one agent dispatch", and ends its third paragraph on "Yours is the work no agent does: grill the idea,
write the brief, dispatch the two writers in order …". Between them they say the interview sends out nothing and that
the two **writer**s are the whole list. They sit pages above the Sweeps section, so a trigger added down there argues
with the opening and loses — and the interview skill this stage runs already carries an imperative to dispatch a
sub-agent for a fact, which produced none. Narrow the ownership sentence to the conversation and the decisions; give the
enumeration its sweeps.

**The narrowed sentence states its own limit, in the same sentence.** What stage 1 owns is the conversation and the
decisions, and neither is ever an agent's; what goes out is fact-finding, never the interview. Split the permission from
the limit and a reader is one inference from dispatching an agent to conduct the grilling — **a worse failure than the
one this epic exists to fix**, because the human is in the room for exactly one stage, an agent cannot be in it, and the
brief is all that survives of it.

The other half is the outlet, and the two ship together because the limit without it would leave the interview with
nowhere to send what it may no longer do itself. The **Sweeps** section gains the one thing it lacks: when to send one
out. All four of its bullets today govern a sweep already in flight — what it holds back, what it releases, what it
reopens — and an observed run that was told twice to sweep dispatched none and made 47 shell calls inside an interview
whose context reached 308K. State it as a condition the orchestrator tests rather than a permission it may decline.
**Not because softness was the defect** — the interview skill's own instruction is already imperative, and it fired
nothing — but because a condition is the shape a rule the orchestrator tests every turn has to have. What was overruling
it is the opening this ticket narrows.

Beside it goes the sweep's contract: what a sweep is handed — the subject it exists to close — and what it must report
back, being the facts and where they were found, never a view on the design. The agent it dispatches to stays
deliberately unnamed, so the rule holds on a host whose agents are named differently. More than one sweep may be in
flight, one subject each, so moving the reading out does not buy **spend** with wall clock. **And the subject names the
question of fact, not the next file to open** — a sweep follows the thread itself, however many looks that takes.
Without that, the change relocates the spend: the waste measured here was a chain where each answer decides the next
question, and a subject scoped to one link just moves the round trips.

**Two things must not become dead ends.** Where no sweep can be dispatched at all — a host offering no general-purpose
agent — the interview says so and reads inline rather than stalling, and the fact rides into the run's **report** as a
**hand-off**. And the reading stage 3 does, checking what a **writer** reported, is mechanical under this rule and so
already permitted.

**A host that makes you wait is not one of those, and must not be given that answer.** This plugin states what has to be
true and never the mechanism, so nothing here can make a dispatch non-blocking; where one blocks, the interview
serialises its sweeps. Send it anyway. The reading is what costs, because it lands in a context every later turn
re-reads, and the waiting costs only time — so reading inline to protect the clock would trade away the whole saving.

**Which means the section's opening sentence is narrowed to what it always meant.** "Dispatching a **sweep** never holds
up the interview" was written when nothing went out, and what it holds is that the questions a sweep does not touch keep
moving — which is exactly what its four bullets govern. Left as it stands, a reader meets it and "send it even where you
will wait" a few lines apart with nothing on the page to reconcile them. Narrow it; do not delete it, and do not touch
the four bullets under it.

**One more clause, in the brief.** Its artifact list — "the artifacts the session landed or touched … by path" — is what
the next ticket's reading bar keys to, and **this change shrinks that list by construction**: the interview stops
opening the code, so what it touched is less. State that the list carries the artifacts a sweep named. Nothing new has
to be found for it: a sweep already reports where its facts were found. And **it is where the looking happened, never
what the looking found** — the ban on a section of established facts is what makes a **claim** get checked by a writer
rather than trusted, so say which of the two this is. That clause is the only part of the ban this epic touches, and it
extends it rather than softening it.

**The one dangerous edit in this epic is here.** Stage 1's bullet carries a clause carving out how a question reaches
the human, and the **Sweeps** section's four existing bullets are a prior epic's whole deliverable. Replacing either
region wholesale silently reverts work that is already landed. New text goes **alongside** what is there.

**Three sentences are the deliberate exceptions to that**, and they are the only ones: the file's ownership sentence,
the enumeration in its third paragraph, and the Sweeps section's opening line. Each is narrowed in place, keeping what
it was doing and dropping what it now says wrongly. Everything else is addition.

Files: `plugin/skills/refine/SKILL.md`. Decisions D1 to D8 — D5a and D6a to D6c among them — with D9a, D18 and D19, in
`docs/specs/the-interview-stops-reading/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] The orchestrator settles a mechanical question for itself and sends a thread out to a sweep, with the distinction
      stated rather than left to judgement (D1).
- [x] **No call count or turn count appears** as the test — a number in prose is advisory, and the observed run issued
      single calls carrying six subcommands each (D1).
- [x] The rule binds for the whole run, not stage 1 alone, and reading that checks what a writer reported is permitted
      by it (D2).
- [x] The rule reaches the tree, the forge and the web alike, on one test (D3).
- [x] **One wording per shared rule, bounded**: the bolded **test clause** reads identically to the one landed in
      `plugin/skills/build/SKILL.md` by ticket 01 — copied from that file, not reconstructed. The examples and the
      edges around it are this skill's own (D2).
- [x] **The test is stated here in full** — a single look, and a thread is not one — because the glossary entry carrying
      it does not ship (D1, D2).
- [x] **"Stage 1 is yours and nobody else's" is narrowed to the conversation and the decisions**, and the enumeration of
      what the orchestrator does — "grill the idea, write the brief, dispatch the two writers" — names the sweeps too,
      so neither reads as saying the interview dispatches nothing (D5a).
- [x] **The narrowed sentence carries its own exclusion, in the same sentence**: what goes out is fact-finding and never
      the interview, which stays the orchestrator's with the human in the room (D5a). **This is the worse of the two
      dangerous misreadings in this change** — the other is D4's.
- [x] Nothing anywhere reads as licence to dispatch an agent to run the grilling, and the existing rule that a missing
      interview skill stops the run rather than improvising one is untouched (D5a).
- [x] **"Dispatching a sweep never holds up the interview" is narrowed rather than deleted or left verbatim** — it says
      that a sweep never holds up the questions it does not touch, and this file owns the wall-clock case openly (D6c).
- [x] **The brief's artifact list carries the artifacts a sweep named**, stated as where the looking happened rather
      than what it found, so the next ticket's reading bar does not shrink as the interview stops reading (D9a).
- [x] The rule does **not** read as forbidding the **brief**, or the glossary entries and ADRs stage 1 lands — the
      delivery skill's read-only and never-fix edges are not carried over (D4). **This is the single most dangerous
      misreading in the change.**
- [x] The Sweeps section states when to send a sweep out, as a condition the orchestrator tests rather than a permission
      (D5).
- [x] The section states what a sweep is handed and what it must report back, and names no agent (D6).
- [x] **The subject names the thread-closing question of fact, not the next file to open** (D6a).
- [x] **Where no sweep can be dispatched, the interview says so and reads inline**, and the run's report carries that as
      a hand-off. It does not stop, and it does not silently ignore the rule (D6b).
- [x] More than one sweep may be in flight, one subject each (D7).
- [x] **A sweep still goes out where the interview has to wait on it**, and that case is plainly not the read-inline
      one: the reading is what costs and the waiting only costs time (D6c).
- [x] **The four existing Sweeps bullets survive** — the subject test, the empty round, the landed sweep releasing its
      subject, and the contradicted decision reopening as a **fork** — and the new text sits alongside them.
- [x] **The existing clause carving out how a question reaches the human survives**, and stage 1 still delegates the
      interview in one bullet.
- [x] The trigger and the non-blocking property do not read as contradictory: a reader meeting both must not conclude
      the interview stalls.
- [x] The sweep's subject is still written to neither the brief nor the task list, and no task is created per sweep.
- [x] Interview format and pacing are still delegated to the two interview skills.
- [x] Prose is cut only where the new prose makes it redundant; nothing still doing work is removed (D18).
- [x] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D19).
- [x] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
