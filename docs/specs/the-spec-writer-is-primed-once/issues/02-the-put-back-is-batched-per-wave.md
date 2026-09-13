# 02 — The put-back is batched per wave

Status: ready-for-agent

**Blocked by:** 01 — as a **sequencing** edge and not a reuse one, which this line records honestly so nobody reads a
dependency into it that is not there. Nothing in this ticket needs the wording 01 lands: the batching rule names no
**grounds** and no closed fork, and it edits a different file. The chain exists because one agent works this branch at a
time and all four prose slices are best read in order.

**What to build:** the **orchestrator** stops re-priming stage 3 once per **fork**. It holds every fork a **writer**'s
**report** raised, closes them all with the human in one round of questions, and puts the stage back **once**, carrying
every answer.

**This is the single largest line in the measured run.** The **spec-writer** was put back four times, once per
late-surfacing fork, against a document that only ever grows: 168 model turns where the baseline plugin's same stage
took 89, a 243,036-token peak context, and 23.15M cached tokens re-read — more on its own than the whole-run cache read
of every other **run** ever measured here. The observer grounded it independently at 516,910 tokens of cache-write
across the three resume turns, 36% of the run's. And spend is quadratic in a stage's turn count, so each re-prime is
paid for twice: once for the turns it adds and again for the context every one of those turns re-reads.

**The wording to replace is singular throughout, and that is the whole bug.** Stage 3 today says a **claim** the
writer's reading killed took a decision down with it, so say what the writer found and put *that* decision back to the
human as a fork, "then put the stage back to the writer to fold **their answer** into the published spec". *That*
decision, *the* answer. Nothing in it is wrong; it simply never contemplates holding several closures for one put-back.
The baseline plugin had **no put-back loop at all** and its orchestrator improvised one — and batched: "Human closed
**all three** forks; fold into spec". So the loop that made the run more correct is the loop that made it quadratically
more expensive, because nothing told it to batch.

**State it as the rule, not as an allowance, and this is the half most likely to decide whether the ticket works.** The
measured run already had implicit permission to batch and did not take it. Wording that says the orchestrator *may* hold
closures, or *should where several are open*, reproduces the measurement. The plural is the default: the closures a
writer's reading forced are held, closed together, and folded in once.

**The wave boundary is the report, and it needs no new machinery.** A report is already the only thing a dispatch
returns, so the orchestrator already knows precisely when it holds the full set of forks that report raised. Do not
introduce a poll, a wait, a signal, or any guess about whether more forks are coming — there is nothing to guess and
nothing to wait for.

**A second wave is legitimate, and saying so is not optional.** Folding a wave's answers in can make the writer hit a
collision it could not have seen before; that report opens a new wave and the same rule applies to it, batched again. A
reader who concludes that "put the stage back once" caps stage 3 at one correction has been handed the worse failure: a
late fork would then have nowhere to go but the report, and the published spec ships wrong to save a re-prime. The
put-back loop exists for correctness, and this ticket makes it cheaper without making it optional (D2).

**The human's round is bounded by the Asking contract that already exists.** Four questions is one `AskUserQuestion`
call's limit and a wave may hold more; the skill's **Asking** section already says to carry the rest into further calls
rather than trimming the frontier to fit. A wave is one round in that sense — every fork reaches the human before the
stage goes back — however many calls the round takes. Do not restate the Asking rule here and do not contradict it
(D4).

**What stage 3's done-bar already says is kept.** "You are done when the spec's location is in hand and no decision a
killed claim took down is still open" is unchanged in substance; only the shape of getting there changes.

Files: `plugin/skills/refine/SKILL.md`, and nothing else. Decisions D1, D2, D3 and D4 in
`docs/specs/the-spec-writer-is-primed-once/spec.md`.

- [x] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [x] Stage 3 holds every fork a writer's report raised, closes them with the human in one round, and puts the stage
      back **once** carrying every answer (D1).
- [x] The **report is named as the wave boundary**, and no poll, wait, signal or guess about further forks is introduced
      (D1).
- [x] The rule reads as **the rule and not an allowance** — plural by default, with no wording that merely permits
      batching (D3).
- [x] A further wave is explicitly legitimate and uncapped, and a reader cannot conclude that stage 3 gets at most one
      correction (D2).
- [x] The prose does not read as forbidding a late-surfacing fork from reaching the human at all (D2).
- [x] The existing **Asking** contract is neither restated nor contradicted, and one wave may span more than one
      `AskUserQuestion` call (D4).
- [x] Stage 3's done-bar still requires the spec's location in hand and no decision a killed claim took down left open.
- [x] The clause about the answer riding the put-back "whether you continue the writer or dispatch a cold one" survives,
      because an answer reaching stage 4 any other way is one the record does not carry.
- [x] **Nothing in the Sweeps section, the Continue rule or the Sequencing rule is edited**, and no agent-type
      preference for a **sweep** is introduced (D16).
- [x] `plugin/agents/spec-writer.md` is not edited by this ticket.
- [x] The glossary's own words are used — fork, claim, report, writer, run — and none of the synonyms its `_Avoid_`
      lists displace.
- [x] Register holds: this file is prose written to be read by a model.
- [x] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [x] No **effort** tier, model or **ceiling** changes (D15).
