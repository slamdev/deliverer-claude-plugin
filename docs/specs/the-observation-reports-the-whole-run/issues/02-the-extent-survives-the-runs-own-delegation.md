# 02 — The extent survives the run's own delegation

Status: ready-for-agent

**Blocked by:** 01 — a sequencing edge and a verification one, not a reuse edge. Nothing in this ticket reads a line 01
lands; 01 is what lets this ticket be checked at all, because the failure it fixes is visible only in a reading taken
mid-run.

**What to build:** a `Skill` call the **orchestrator** itself made is one of the run's own signals, so a run that
delegates keeps its **extent**. Today `isOwnSignal` (`plugin/mcp/observer/run-facts.ts:441`) accepts three things —
deliverer attribution, a call to the plugin's own review tools, and a **dispatch** of one of the plugin's own agents. A
`Skill` call is none of them, and the host re-attributes every entry underneath a third-party skill to *that* plugin. So
the last own signal goes stale for as long as the delegation lasts, and step 1's ceiling closes on the next turn the
human typed — which, in a refinement, is the idea the run's own first question asked them for. Settled as D1, D2, D3 and
D4 in `../spec.md`.

**The measured run, in figures.** Attribution to `deliverer` stops at entry 44. At 09:11:47 stage 1 invoked
`mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling` — **because `plugin/skills/refine/SKILL.md` tells
it to** — and entries 55 to 270 carry `attributionPlugin: mattpocock-skills`. The next own signal is the `spec-writer`
dispatch at 11:59:51, 2h48m later. The extent became 1m38s and stayed there for every reading in between, which is where
the debrief's `0 dispatches`, its one question round and its 1.6% of the token spend all come from.

**Counting any `Skill` call is safe, and the reason is the ceiling itself.** A new piece of a human's own work always
begins with a turn they typed, and that still closes the ceiling — which is why the same measured record leaves the
human's own `claude-api` work at 13:20 correctly outside the extent, after the prose they typed at 13:13:42.

**The one hazard: this must not become evidence that a session holds a run at all.** `distil.ts` decides that from
`attributionOf`, and a record with no deliverer attribution anywhere is not a run — several sessions on any machine name
the plugin while being nothing of the kind. If third-party attribution or a `Skill` call were ever allowed to answer
*that* question, every session that used any skill would produce a debrief.

- [x] `isOwnSignal` accepts a fourth signal: an assistant entry carrying a `tool_use` block named `Skill`.
- [x] Any skill counts, not a list of the ones the plugin's own skills name. The comment carries why: a list would go
      stale the moment a skill's text changes, and the ceiling is what bounds over-reach.
- [x] Step 1's ceiling rule, step 2 and step 3 are otherwise untouched, and the module's opening comment about the two
      strengths of signal still reads true with four in the strong set.
- [x] The run-detection gate is untouched: `attributionOf` and `distil.ts`'s no-run answer still turn on deliverer
      attribution alone, and a comment says why this ticket does not widen it.
- [x] The debrief names the third-party skills the run invoked, distinct from the plugin's own skill in the header. The
      skills' names only: nothing of what they did, said or read travels with them, per ADR-0018's bound.
- [x] The one-line announcement's existing `runSkills` opening still names the plugin's own skill first, so the line
      does not start with somebody else's plugin.
- [x] Comments cite this ticket and the decisions behind it, as everything in `observer/` already does.
- [x] **Verified by hand with 01's procedure**: prefixes of the measured record taken during the delegation report the
      run's real wall clock, its question rounds so far, and — once the dispatch records are present — its dispatches,
      instead of the same frozen 1m38s at every length. A whole-record replay still reports what it reports today.
- [x] `(cd plugin/mcp && npm run typecheck && npm run lint)` passes.
