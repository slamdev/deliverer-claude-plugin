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

The other half is the outlet, and the two ship together because the limit without it would leave the interview with
nowhere to send what it may no longer do itself. The **Sweeps** section gains the one thing it lacks: when to send one
out. All four of its bullets today govern a sweep already in flight — what it holds back, what it releases, what it
reopens — and an observed run that was told twice to sweep dispatched none and made 47 shell calls inside an interview
whose context reached 308K. The trigger is stated as a condition the orchestrator tests, not a permission it may
decline, because two instructions phrased as permissions already produced nothing.

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

**The one dangerous edit in this epic is here.** Stage 1's sentence carries a clause carving out how a question reaches
the human, and the **Sweeps** section's four existing bullets are a prior epic's whole deliverable. Replacing either
region wholesale silently reverts work that is already landed. New text goes **alongside** what is there.

Files: `plugin/skills/refine/SKILL.md`. Decisions D1–D8, D18 and D19 in
`docs/specs/the-interview-stops-reading/spec.md`.

- [ ] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [ ] The orchestrator settles a mechanical question for itself and sends a thread out to a sweep, with the distinction
      stated rather than left to judgement (D1).
- [ ] **No call count or turn count appears** as the test — a number in prose is advisory, and the observed run issued
      single calls carrying six subcommands each (D1).
- [ ] The rule binds for the whole run, not stage 1 alone, and reading that checks what a writer reported is permitted
      by it (D2).
- [ ] The rule reaches the tree, the forge and the web alike, on one test (D3).
- [ ] **One wording per shared rule, bounded**: the bolded **test clause** reads identically to the one landed in
      `plugin/skills/build/SKILL.md` by ticket 01 — copied from that file, not reconstructed. The examples and the
      edges around it are this skill's own (D2).
- [ ] The rule does **not** read as forbidding the **brief**, or the glossary entries and ADRs stage 1 lands — the
      delivery skill's read-only and never-fix edges are not carried over (D4). **This is the single most dangerous
      misreading in the change.**
- [ ] The Sweeps section states when to send a sweep out, as a condition the orchestrator tests rather than a permission
      (D5).
- [ ] The section states what a sweep is handed and what it must report back, and names no agent (D6).
- [ ] **The subject names the thread-closing question of fact, not the next file to open** (D6a).
- [ ] **Where no sweep can be dispatched, the interview says so and reads inline**, and the run's report carries that as
      a hand-off. It does not stop, and it does not silently ignore the rule (D6b).
- [ ] More than one sweep may be in flight, one subject each (D7).
- [ ] **A sweep still goes out where the interview has to wait on it**, and that case is plainly not the read-inline
      one: the reading is what costs and the waiting only costs time (D6c).
- [ ] **The four existing Sweeps bullets survive** — the subject test, the empty round, the landed sweep releasing its
      subject, and the contradicted decision reopening as a **fork** — and the new text sits alongside them.
- [ ] **The existing clause carving out how a question reaches the human survives**, and stage 1 still delegates the
      interview in one bullet.
- [ ] The trigger and the non-blocking property do not read as contradictory: a reader meeting both must not conclude
      the interview stalls.
- [ ] The sweep's subject is still written to neither the brief nor the task list, and no task is created per sweep.
- [ ] Interview format and pacing are still delegated to the two interview skills.
- [ ] Prose is cut only where the new prose makes it redundant; nothing still doing work is removed (D18).
- [ ] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D19).
- [ ] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
