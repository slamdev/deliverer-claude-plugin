# 03 — The agents stop reading at a stated bar, and a run can be tallied

Status: ready-for-agent

**Blocked by:** None — can start immediately. It edits the same two **writer**s as ticket 05, in different steps; either
order works, and the bar this ticket adds is the one ticket 05's bar must not read as contradicting.

**What to build:** Everything outside the refinement skill: a bar on each **writer**'s exploration, one batching line
across six agents, and the instrument that says whether any of this worked.

Step 2 of the spec writer and step 2 of the tickets writer are the only **exploration** steps in either document that
state no completion condition, and they are the steps that ran longest in the observed run — 83 shell calls and 39.
Each gains the bar its neighbouring steps already have, and **both are keyed on reading alone**, with no count in
either. The spec writer is done exploring when every module the **spec** will touch has been read, along with the ADRs
that touch the area. The tickets writer is done when every module the slices will cut through has been read well enough
to size a ticket against it, and nothing on the spec's user-story list points at code it has not opened.

**Neither bar names what a later step owns.** The spec writer's step 3 already closes on every **claim** the **brief**
marks being settled first-hand, killed or recorded as unsettleable — and the brief is required to carry the path that
would settle each one, which that step reads "down the path it names beside each one", so a claims-shaped bar on step 2
would be true before the step began. The tickets writer's step 3 already closes on every user story being covered by at
least one slice, and nothing downstream measures the set against the user stories. Each step 3 keeps sole ownership of
its own bar, and no reader meets two near-identical ones two steps apart.

**And a bar ends its step, not the reading.** Say so once in each file: a later step that has to open a file still opens
it — ticket 05 puts exactly such a bar in a step after this one, on what an existing test covers. A bar never says a
writer may take something on trust either: meeting the repository first-hand is what makes the reading worth anything,
and it is untouched.

**Six agents then gain one identical line**: independent reads go out together in one turn rather than one per turn.
**It names reads and says what it does not reach**, because two of the six forbid batching in almost those words —
`change-request-creator` is told "Post one comment per entry carrying none — **never a batch**", and
`assumption-reviewer` "**Adjudicate them one at a time**, giving the last one the same scrutiny as the first". So the
line names a search, a file and a listing, and closes on what the agent writes being unaffected: a post, a reply, a
**verdict** and a commit each keep the rule they already have. Without that, the line is one inference from batched
comments or batched verdicts, and the second takes down the per-assumption scrutiny the adjudication rests on.

`code-reviewer` is **excluded** — it runs at `model: sonnet`, `effort: low` and opens no file, only starting a review,
polling it to a **terminal** status and reporting the prose. The grounds for extending the line to unmeasured agents
are that the delivery agents are heavy readers, which does not cover one that reads nothing; the line would be inert
there and sits badly beside the **Poll** contract and the agent's own "One dispatch, one round". The spec's D11 is
where that exclusion is recorded, for whoever reaches for symmetry later.

And the contribution guide gains a way to tally one **run**'s **session record**s: per agent, model turns, peak context
and tokens by kind. It measures a run after the fact, asserts nothing and gates nothing. **It reuses the observer
rather than reimplementing it** — `plugin/mcp/observer/distil.ts` already runs by hand with no model and no money and
already prints per-turn ids and token figures with a run total, and `records.ts` already resolves the split-record
problem. Only peak context is new.

**Per agent takes one step more than a maximum, and the guide states it.** The host names each dispatch's record with an
opaque id, `agent-<id>.jsonl`, and the agent it ran is in neither the file name nor its lines — it is in the
`agent-<id>.meta.json` sidecar beside it, as `agentType`. A bare maximum therefore yields a column keyed by ids, and per
agent is the whole point: it is the figure that says whether the interview's context shrank. `records.ts` already reads
those sidecars and records having checked every one against the **dispatch** that made it, so cite it rather than
re-deriving the layout.

**And the observation's own cost is reported beside the run's**, read off the **debrief** header where it already sits.
The **observer** grades every dispatch, so every sweep this epic adds is another graded dispatch — spend that a
**ceiling** excludes by definition and that this tally would otherwise miss, leaving a before-and-after to flatter
itself.

Files: six of `plugin/agents/*.md` (all but `code-reviewer.md`), and `CONTRIBUTING.md`. Decisions D9–D11, D14, D16 and
D19 in `docs/specs/the-interview-stops-reading/spec.md`.

- [ ] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [ ] The spec writer's step 2 states its bar **keyed on reading alone**: every module the spec will touch has been
      read, along with the ADRs that touch the area. **It says nothing about claims** — step 3 owns those, and the brief
      already carries the path beside each one, so a claims-shaped bar would be true before the step began (D9).
- [ ] The tickets writer's step 2 states its bar **keyed on reading alone**: every module the slices will cut through
      has been read well enough to size a ticket against it, and nothing on the user-story list points at code it has
      not opened. **It names no slices**, and step 3's existing coverage bar is untouched (D9).
- [ ] **Neither bar carries a number** (D9).
- [ ] **Each file says once that the bar ends its step and not the writer's reading** — a later step that has to open a
      file still opens it, which is what keeps this bar and ticket 05's coverage bar from reading as a contradiction
      (D9).
- [ ] Neither bar weakens paths-rather-than-contents or a writer's first-hand read of the repository, and neither reads
      as licence to take something on trust (D10).
- [ ] **Six** agents carry the parallel-lookup line, and it is **identical** in each. `code-reviewer.md` does **not**
      carry it (D11).
- [ ] The line says that independent reads go out together in one turn; it does **not** instruct a preference for the
      dedicated read and search tools over the shell, which was declined as token-neutral.
- [ ] **The line names reads and says what it does not reach** — a post, a reply, a **verdict** and a commit each keep
      the rule they already have. Confirmed by reading the two files it would otherwise contradict:
      `change-request-creator.md`'s "never a batch" and `assumption-reviewer.md`'s "one at a time", both of which
      survive unchanged (D11).
- [ ] The `model` and `effort` frontmatter of every agent is **unchanged** (D14).
- [ ] `CONTRIBUTING.md` carries a **`Tallying a run`** subsection, straight after `Replaying a run's records`, opening
      by saying plainly that it measures and gates nothing so nobody reads it as a check (D16).
- [ ] It reports, per agent, model turns, peak context and tokens by kind, over a run's session records (D16).
- [ ] **It is built on `distil.ts` rather than reimplementing `records.ts` in shell.** The dedup rule is stated the way
      `plugin/mcp/observer/records.ts` states it and cites that file: key on `requestId`, falling back to `message.id`
      where a record carries none — an agent record carries no request id, and counting each content block separately
      overstates a run's requests roughly threefold.
- [ ] For `output_tokens` the stated rule is the record with the **highest** count per id — the repository's own
      settled answer, reconciled against the tools server's figures — and **not** "the last". One response is split
      across several records, one per content block, and only one carries the true count; the others hold placeholders
      of 1 to 4, and summing the first undercounts a run's output roughly fivefold.
- [ ] Peak context is computed over `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`, maxed per
      agent, and the guide says why it needs no dedup: the placeholder problem affects `output_tokens` alone, and every
      record of one response repeats the same input and cache figures.
- [ ] **The per-agent figures are attributed to agents rather than to record ids.** The guide names the step: read
      `agentType` from the `agent-<id>.meta.json` sidecar beside each dispatch's record, citing
      `plugin/mcp/observer/records.ts`, which already does this and records having checked every sidecar against the
      dispatch that made it (D16).
- [ ] **What the observation itself cost is reported beside the run's**, read off the debrief's own header — every sweep
      is another graded dispatch, and that spend sits outside both the **ceiling** and the run's own figures (D16).
- [ ] **No script is committed** — nothing outside `plugin/` ships and CI checks neither (D16).
- [ ] The **spend** reported is labelled with the provider that served it, as the glossary requires.
- [ ] Register holds: load-bearing bold, no hedging, second person, "you are done when…" (D19).
- [ ] Each file's prevailing column width is matched — 120 **characters**, not bytes.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
