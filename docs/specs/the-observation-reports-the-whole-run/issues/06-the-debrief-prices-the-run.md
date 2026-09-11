# 06 — The debrief prices the run

Status: ready-for-agent

**Blocked by:** 01 — a sequencing and verification edge only. The pricing reads the tokens the reading already sums and
depends on no other ticket's wording; it lands last because it is the largest single addition and the one with an
exactly right answer to check against.

**What to build:** the **debrief** answers the question that makes anybody open one. There is no price table anywhere in
`plugin/mcp/observer/`: `model-call.ts:260` reads `total_cost_usd` off the SDK's own reply, which is why an observation
can price *itself* at $1.22 while reporting the run it observed as **In dollars: unknown**. A dated table in the
plugin's own code, applied to the tokens the reading already has, is the whole of the change. Settled as D12 through D18
in `../spec.md`, and `CONTEXT.md`'s **Spend** has defined the figure as owed since the term was written: "its tokens,
and a dollar estimate labelled with the provider that served it."

**Every input is already in the record**, per request: `input_tokens`, `output_tokens`, `cache_read_input_tokens`,
`message.model`, and `usage.cache_creation`, which splits cache writes by TTL into `ephemeral_5m_input_tokens` and
`ephemeral_1h_input_tokens`. So there is no TTL ambiguity to hedge and no range to invent — every write in the measured
run is five-minute.

**What the absence cost, measured.** The run analysed itself in twelve orchestrator requests at 250,960–307,711 tokens
of context, for **$5.29 — 16.8% of the run** — and arrived at $77.22, wrong by two and a half times. Priced from the
same records at first-party Opus 5 rates, its extent comes to **$28.19**. A figure with a stated basis beats "unknown";
a figure presented as exact would be worse than either.

**First-party rates only, knowingly.** Partner platforms are priced separately, and a record's only vendor signal is its
message id prefix — the measured run's are all `msg_bdrk_*`. A partner-billed run is therefore priced at first-party
rates **and the debrief says both facts**, so a reader comparing against their own bill finds the explanation in the
document.

**Do not write rates from memory.** The reference this repository uses for them is the `claude-api` skill; the table
below is what it gave for the model the measured run used, and the same source is what a later contributor updates the
table from.

- [ ] A rate table in the plugin's own Node code: per model id, input and output per million tokens, beside a single
      "rates as of" date the debrief prints. No network, so an observation stays reproducible from a record on disk.
- [ ] Cache is priced per TTL from `usage.cache_creation`: a write is 1.25× input at the five-minute TTL and 2× at the
      one-hour one, and a read is 0.1× input.
- [ ] The spend line carries the figure and its basis: the rate table's date, the model it priced, and the message id
      prefix the run's requests carry with the fact that rates are first-party regardless.
- [ ] A model id the table does not know prices nothing, is named in the debrief, and writes a loss. Unknown stays the
      honest answer for a figure nobody could compute, and never zero.
- [ ] The one-line announcement carries the figure, so the question a human would have opened the debrief for is
      answered before they do.
- [ ] The observation's own cost prefers the SDK's measured figure where it exists and falls back to the same table
      where it does not, saying which of the two it used.
- [ ] The existing token split — the whole run, and the **orchestrator**'s own turns within it — is what gets priced. No
      third breakdown and no per-model split.
- [ ] The wording that says the host records no money anywhere in a session record is corrected rather than left
      standing beside a figure that contradicts it.
- [ ] Comments cite this ticket, and the rate constants carry the date and the source they came from.
- [ ] **Verified by hand**: one record, one figure computed by hand from its `usage` fields, one figure from the debrief
      — they match, or the table is wrong. This is the only check in the epic with an exactly right answer. A record
      whose model the table does not know reads as a named gap rather than as a cheap run.
- [ ] `(cd plugin/mcp && npm run typecheck && npm run lint)` passes.
