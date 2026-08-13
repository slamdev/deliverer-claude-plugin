# 06 — A round reports what it really spent

**What to build:** a **round**'s token counters come back as the figures they were, not as zeros. The tools server takes
them from the per-model usage the result message carries — the same map it already reads to label the model that served
the round — and publishes unknown where nothing was measured.

An observed run reported *"Round 1 completed — 3 findings, $5.01 (token counts came back as zeros, so cost is the only
real figure)"* while the round's real cost was roughly 48,200 output and 344,100 cache-creation tokens. The **spend** a
delegating review leaves on the aggregate counters is zero, because the work happens a level deeper. Settled as D14–D18
in `../spec.md`; the diagnosis the observation report offered was wrong, and Further Notes there records why.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The token counters come from the per-model usage on the result message, summed across its entries — a review calls
      more than one model and every one of those tokens is real spend.
- [x] The model label stays the costliest entry, which is a decision the module already records and which this must not
      disturb.
- [x] The aggregate counters remain the fallback, for a review that did its own work rather than delegating it.
- [x] A counter absent from both publishes as unknown; a zero publishes as unknown too, per the glossary's **spend** —
      unknown is the honest answer for a figure nobody measured, and never zero.
- [x] The dollar estimate, the provider, the canonical model, and the turn count with its existing fallback are
      unchanged.
- [x] The published status payload gains no field.
- [x] Nothing reads a transcript from disk, and the module still imports nothing from the SDK — not even a type — and
      still narrows every field structurally.
- [x] `npm run typecheck && npm run lint` pass from `plugin/mcp`.
- [x] A throwaway script exercises the message-to-event extraction against the five properties in the spec's Testing
      Decisions — zeros beside real per-model counters, per-model absent, absent from both, a genuine zero, and more
      than one entry summing — and is **not** committed.
- [x] The review lifecycle is exercised against the scripted backend, per the standing rule, to show the change did not
      regress the lifecycle around it.
