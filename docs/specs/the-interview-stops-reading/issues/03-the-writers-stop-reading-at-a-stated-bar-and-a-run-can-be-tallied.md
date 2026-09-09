# 03 — The writers stop reading at a stated bar, and a run can be tallied

Status: ready-for-agent

**Blocked by:** None — can start immediately. It edits the same two **writer**s as ticket 04, in different steps; either
order works, and the bar this ticket adds is the one ticket 04's bar must not read as contradicting.

**What to build:** Everything outside the refinement skill: a bar on each **writer**'s exploration, and the instrument
that says whether any of this worked.

Step 2 of the spec writer and step 2 of the tickets writer are the only **exploration** steps in either document that
state no completion condition, and they are the steps that ran longest in the observed run — 83 shell calls and 39. Each
gains the bar its neighbouring steps already have, and **both are keyed on reading alone**, with no count in either.

**Each bar names something the step was handed, not something the step decides.** A bar reading "every module the spec
will touch" is graded against a set the writer defines as it goes, which is no bar at all — it can be called met at any
point, in either direction. So: the spec writer is done exploring when every path the **brief** names has been opened,
along with the ADRs that touch the area, and any module the work turns out to reach beyond them. The tickets writer is
done when every module the **spec**'s implementation decisions name has been read well enough to size a ticket against
it, and any the slices turn out to cut through beyond them. **The open clause is what stops the floor becoming a
ceiling**, and it carries no number either.

Two facts the wording has to respect. The brief is already required to carry "the artifacts the session landed or
touched … by path", which is what makes the first bar checkable by someone other than the writer — and ticket 02 keeps
that list from shrinking as the interview stops reading. A spec, by a standing rule of its own template, carries **no
paths at all**: "write behaviour and decisions, not file paths or code snippets". What it does carry, required, is "the
modules that will be built or modified", which is what the second bar keys to.

**Neither bar names what a later step owns.** The spec writer's step 3 already closes on every **claim** the **brief**
marks being settled first-hand, killed or recorded as unsettleable — and the brief is required to carry the path that
would settle each one, which that step reads "down the path it names beside each one", so a claims-shaped bar on step 2
would be true before the step began. The tickets writer's step 3 already closes on every user story being covered by at
least one slice, and nothing downstream measures the set against the user stories. Each step 3 keeps sole ownership of
its own bar, and no reader meets two near-identical ones two steps apart. **Neither bar mentions the user stories** for
that reason — the paths and the modules are what they key to.

**And a bar ends its step, not the reading.** Say so once in each file: a later step that has to open a file still opens
it — ticket 04 puts exactly such a bar in a step after this one, on what an existing test covers. A bar never says a
writer may take something on trust either: meeting the repository first-hand is what makes the reading worth anything,
and it is untouched.

**No other agent file is touched, and that is a change from what this ticket first said.** It carried one identical
parallel-lookup line into six of the seven agents; D11 is withdrawn and D26 has the grounds. The short of it: this
spec's own evidence says there is no headroom — the agents already compound 69–97% of their shell calls and already
issue two lookups together about half the time — while the line needed an exclusion clause in the two files that forbid
batching what they write to be safe at all. **Add nothing about batching to any agent**, `code-reviewer` included, and
leave `change-request-creator`'s "never a batch" and `assumption-reviewer`'s "one at a time" exactly as they stand.

And the contribution guide gains a way to tally one **run**: per agent, model turns, peak context and tokens by kind. It
measures a run after the fact, asserts nothing and gates nothing.

**It reads the trace the observer already writes, not the records underneath it.**
`plugin/mcp/observer/distil.ts` runs by hand with no model and no money and writes the run's **trace**, and that file
already holds all of this but one figure. Its token section carries a row per **dispatch** labelled `#<ordinal> <agent>`
— `N req · in … out … cache-write … cache-read …`, which is turns and tokens by kind, per agent, already deduplicated by
`records.ts` and already attributed to the agent that ran. Its ordered section prefixes every line of a dispatch's slice
with `#n` and states each turn's own figures once, on that turn's first line.

**So the only arithmetic the guide describes is the peak**: the largest `in + cache-write + cache-read` among a slice's
turn lines. No `jq` over raw records, and no reading of `agent-<id>.meta.json` sidecars for `agentType` — the trace has
already done both, and a second path through the records is `records.ts` reimplemented in shell, waiting to drift from
the figures the plugin itself reports. **Describe the lines and not the trace's own legend**, which announces `req <id>`
where the renderer writes a turn number, its request id and its four token figures.

**And the observation's own cost is reported beside the run's**, read off the **debrief** header where it already sits.
The **observer** grades every dispatch, so every sweep this epic adds is another graded dispatch — spend that a
**ceiling** excludes by definition and that this tally would otherwise miss, leaving a before-and-after to flatter
itself.

Files: `plugin/agents/spec-writer.md`, `plugin/agents/tickets-writer.md`, and `CONTRIBUTING.md` — **no other agent
file**. Decisions D9, D9a, D10, D12, D14, D16, D19 and D26 in `docs/specs/the-interview-stops-reading/spec.md`.

- [ ] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [ ] The spec writer's step 2 states its bar **keyed on reading alone**: every path the brief names has been opened,
      along with the ADRs that touch the area, and any module the work turns out to reach beyond them. **It says nothing
      about claims** — step 3 owns those, and the brief already carries the path beside each one, so a claims-shaped bar
      would be true before the step began (D9).
- [ ] The tickets writer's step 2 states its bar **keyed on reading alone**: every module the spec's implementation
      decisions name has been read well enough to size a ticket against it, and any the slices turn out to cut through
      beyond them. **It names no slices and no user stories**, and step 3's existing coverage bar is untouched (D9).
- [ ] **Each bar keys to what the step was handed rather than to what it decides** — the brief's paths, the spec's named
      modules — and **not** to "every module the document will touch", which the writer defines as it goes (D9).
- [ ] **Neither bar carries a number**, and each carries the open clause that keeps its floor from becoming a ceiling
      (D9).
- [ ] **Each file says once that the bar ends its step and not the writer's reading** — a later step that has to open a
      file still opens it, which is what keeps this bar and ticket 04's coverage bar from reading as a contradiction
      (D9).
- [ ] Neither bar weakens paths-rather-than-contents or a writer's first-hand read of the repository, and neither reads
      as licence to take something on trust (D10).
- [ ] **No parallel-lookup line, and nothing about batching, is added to any agent** — not the two writers, not the four
      delivery agents, not `code-reviewer.md`. The only agent files this ticket touches are the two writers, and the
      only thing it adds to them is the step-2 bar (D26).
- [ ] `change-request-creator.md`'s "never a batch" and `assumption-reviewer.md`'s "one at a time" are **unchanged**,
      and neither file is opened for an edit (D26).
- [ ] The `model` and `effort` frontmatter of every agent is **unchanged** (D14).
- [ ] `CONTRIBUTING.md` carries a **`Tallying a run`** subsection, straight after `Replaying a run's records`, opening
      by saying plainly that it measures and gates nothing so nobody reads it as a check (D16).
- [ ] It reports, per agent, model turns, peak context and tokens by kind, over one run (D16).
- [ ] **It reads the trace `distil.ts` writes**, and reimplements nothing: turns and tokens by kind are the trace's own
      per-dispatch rows, `#<ordinal> <agent>`, which `records.ts` has already deduplicated and already attributed to an
      agent (D16).
- [ ] **Peak context is the only figure the guide computes**: the largest `in + cache-write + cache-read` among a
      dispatch slice's turn lines. The guide says why it needs no dedup — the placeholder problem affects
      `output_tokens` alone, and every record of one response repeats the same input and cache figures (D16).
- [ ] **No `jq` over raw session records, and no reading of `agent-<id>.meta.json` sidecars** — both are work the trace
      has already done, and a second path through the records is `records.ts` rewritten in shell, waiting to drift from
      the figures the plugin itself reports (D16).
- [ ] The guide describes the trace's **lines** rather than its legend, which announces `req <id>` where the renderer
      writes a turn number, its request id and its four token figures. Correcting the legend is a hand-off, not this
      ticket.
- [ ] **What the observation itself cost is reported beside the run's**, read off the debrief's own header — every sweep
      is another graded dispatch, and that spend sits outside both the **ceiling** and the run's own figures (D16).
- [ ] **No script is committed** — nothing outside `plugin/` ships and CI checks neither (D16).
- [ ] **`CONTRIBUTING.md`'s own use of `mechanical` in the *asserted by a test* sense says what it means instead**,
      since this ticket edits that file and ticket 01 defines the word (D12). The glossary's own use lands with ticket
      01.
- [ ] The **spend** reported is labelled with the provider that served it, as the glossary requires.
- [ ] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D19).
- [ ] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
