# 02 — A finished run's records become a trace

Status: ready-for-agent

**Blocked by:** 01

**What to build:** pointed at a session record on disk, a mechanical distiller finds the **run** in it, reads every
per-**dispatch** record beside it, and writes a **trace**: the whole run's shape in order, with timings and tokens, each
entry's content capped rather than dropped. Nothing judges anything here — the same records must give the same trace,
because that is what lets every ticket after this one be verified by replaying a record instead of spending a run.
Settled as D5, D6, D7, D18, D19 and D20 in `../spec.md`, and as
[ADR-0017](../../../adrs/0017-observation-happens-out-of-band-from-the-records-the-host-keeps.md).

- [ ] Given the path to a session record, the deliverer run in it is identified from the plugin and skill stamped on
      its entries — no marker of the plugin's own, and no argument naming the run.
- [ ] A record carrying no deliverer attribution produces no trace, and says so rather than producing an empty one.
- [ ] A mention of the plugin is not attribution. A session that names `deliverer:*` only where the host lists the
      agent types an install added, or a human's own session about the plugin, is not a run — three of the first and
      one of the second sit in the same directory as the runs on disk, and that second one called the plugin's own
      tools.
- [ ] Every per-dispatch record the run left is read alongside the main one. Without them everything below the
      **orchestrator** is invisible, which is most of a delivery — a round's polls among it.
- [ ] Each dispatch names itself: beside its record is a sidecar carrying the agent type, the stage's description and
      the id of the dispatch that started it, so the agent a dispatch ran is read rather than inferred from a prompt.
      That shape is a **claim** and not a contract — a field the records do not carry costs an entry a detail and
      never the trace.
- [ ] A round's review is deliberately not read. The session the server spawns for it is a top-level record of its
      own carrying no deliverer attribution — four of them on disk, 2.2 to 4.5 MB each — and what a round did is
      already in the `code-reviewer`'s own record, whose polls the criteria above keep. Leaving it out is a decision
      rather than an oversight.
- [ ] The trace carries, in order: each dispatch with the agent it ran and how long it took, each question round put
      to the human, each review poll, each task update and each tool call — with timestamps and per-turn token
      figures.
- [ ] Token figures are per API request and not per entry. One request writes several assistant entries, each
      repeating the same usage: one delivery's main record holds 169 of them against 79 distinct request ids, so
      counting entries inflates every figure by more than double. `e2e-tests/README.md` already carries the rule this
      repository settled on, and every figure in a **debrief** downstream rests on this one.
- [ ] A session that also held other work traces whole: every entry in the file, in order, whatever produced it. One
      refinement on disk carried another plugin's skills beside `deliverer:refine`, and a trace that cut them would
      lose the human's turns between them. Nothing about the debrief's bound moves with this — that stays the
      plugin's own machinery, as
      [ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md) has it.
- [ ] What an entry carried rides along as a capped excerpt. Nothing is dropped by kind: the cap bounds volume and
      nothing else.
- [ ] The cap tightens as a run grows, so a long delivery's trace stays inside a context window. One measured
      delivery's records were 6.7 MB.
- [ ] The cap is chosen against the records on disk rather than guessed: the largest run there is distilled and the
      trace's own size and token count are measured and reported. Those records are the delivery the spec measured —
      one main record and thirteen per-dispatch ones.
- [ ] Replaying the same records twice produces the same trace, byte for byte. Nothing samples, nothing randomises
      and no model is called.
- [ ] The timestamp in the key is the run's own, read off its first entry, and nothing in the trace's body records
      when it was distilled. A key or a line carrying the moment of distillation makes the criterion above
      unmeetable.
- [ ] The trace is written under the plugin's data directory, keyed by the epic's **slug** and a timestamp, and
      nothing already there is removed.
- [ ] The slug is read off the run's own task updates, whose subjects both skills prefix with it — `<slug>: implement
      every ticket (4/21)`. A run that fell over before it created a task carries a named stand-in in its place, and
      the trace says the slug could not be read: never a guess, and never a refusal to write a trace at all.
- [ ] The trace refuses forwarding in two places of its own: its filename, and its first line. It carries no bound
      and is not the document to send.
- [ ] Nothing is written inside any repository, and nothing outside the plugin's data directory.
- [ ] It runs by hand with no host in play: an entry point taking the record's path, and `CLAUDE_PLUGIN_DATA`
      required the way `launch.mjs` requires it — absent, it refuses and names the variable rather than inventing a
      second notion of where the plugin's data directory is.
- [ ] A record that is truncated, malformed or still being written produces a trace saying what was lost, never a
      crash and never a silently empty file.
- [ ] What lands is covered by the two commands CI already runs: inside `plugin/mcp/tsconfig.json`'s `include` and
      inside `eslint.config.js`'s TypeScript layer, both of which name `server/**/*.ts` and nothing else today.
      Uncovered, the new code is typechecked by nothing and linted by nothing while CI stays green — and
      `erasableSyntaxOnly`, which is the whole of what holds up the unbuilt shipping model
      ([ADR-0001](../../../adrs/0001-the-tools-server-ships-as-source-and-runs-unbuilt.md)), never reaches it.
- [ ] Exercised by hand against the records of runs already on disk. No test runner is added, no fixture is
      committed, and CI stays `typecheck` and `lint` over the two packages.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — stays `ready-for-agent`; ten criteria added, one reworded, none removed.**

Nothing here is built. `plugin/mcp/` holds `server/` and `launch.mjs` and nothing else: no observer, no distiller, no
trace. The search was by concept rather than by the request's wording — `observer`, `debrief`, `distill` and `trace`
across every source, manifest, hook and document outside `docs/specs/` — and the only hits are a different sense of the
word (`agent-backend.ts`'s `PreToolUse` liveness observer) and prior art that cannot be reused: `e2e-tests` reads these
same two record kinds in `harness/run.ts`, and documents the format in its README, but nothing in that package ships. No
prior rejection of this shape is on record; the repository keeps no `.out-of-scope/`.

**Every mechanical premise in the body was checked against real records rather than against the spec's notes.** Three
deliverer runs are on this machine under `~/.claude/projects/-root-workspace-preview-env-foundation/` — two
`deliverer:build` and one `deliverer:refine` — so the ticket's identification rule, its dispatch reading and its token
figures were all run against them. All three premises hold, and five things the checklist did not say came out of it.
Attribution is real and is two fields on assistant entries, but a **mention** is not attribution: four other sessions in
that same directory match the word `deliverer` while carrying none, three because the host listed the agent types the
install added and one because a human was asking about the plugin — and that one had called the plugin's own tools, so a
matcher reaching for MCP attribution instead misidentifies it too. Token figures double-count unless they are taken per
API request: one delivery's main record holds 169 assistant entries against 79 distinct request ids, and every figure a
debrief carries downstream rests on getting that right. The slug is readable, off the task subjects both skills prefix
with it. A round's polls are in the `code-reviewer`'s own dispatch record rather than the orchestrator's, which is
exactly what the third criterion buys. And each dispatch names itself in a sidecar beside its record, so no stage has to
be inferred from a prompt.

**Nothing would have checked the code.** `plugin/mcp/tsconfig.json`'s `include` and `eslint.config.js`'s TypeScript
layer both name `server/**/*.ts` and nothing else, so a distiller landing beside the server is typechecked by nothing
and linted by nothing while CI reports green — and `erasableSyntaxOnly`, which is the whole of what holds up the unbuilt
shipping model, would never reach it. The final criterion guarded CI's **scope**; it did not get the new code covered.
That is now its own criterion, and it is the one most worth reading first.

Four questions were the maintainer's and were settled with them. A round's own review session is **not** read: it is a
top-level record carrying no deliverer attribution, four of them on disk at 2.2 to 4.5 MB each, and what a round did is
already in the polls the trace keeps — so a criterion records the exclusion as a decision rather than leaving an
implementer to miss it silently or wander into 14 MB. A session that also held other work traces **whole**, every entry
in order whatever produced it, because one refinement on disk carried another plugin's skills beside `deliverer:refine`
and cutting them would lose the human's turns between them; a criterion notes that this moves nothing about the
debrief's bound, which stays what ADR-0018 says it is. A run that fell over before creating a task keys on a named
stand-in and says the slug could not be read, rather than producing no trace. And `CLAUDE_PLUGIN_DATA` is required the
way `launch.mjs` requires it, so the by-hand exercise the last criterion asks for has a command and no second notion of
where the plugin's data directory is.

Two smaller calls were made rather than asked. The determinism criterion was unmeetable as written — a trace keyed by
the moment of distillation cannot replay byte for byte — so the timestamp is now the run's own, read off its first
entry, with nothing in the body recording when the distiller ran. And the cap had no measurable target: it now names the
records on disk as what it is chosen against, with the resulting size and token count reported. Left alone: the
per-entry cap's mechanism, which is the implementer's, and everything ticket 03 already owns — the `unknown` convention
for a figure nobody measured, the CONTRIBUTING procedure, and the debrief's third refusal.
