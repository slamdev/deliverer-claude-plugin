# 01 — The three facts are established by hand

**What to build:** a maintainer picking up any later ticket finds the spec's three open facts answered, with the
evidence beside each answer, so that no ticket builds on a guess. Where a `SendMessage` continue's entries land, how a
`SendMessage` names its target, and what the 100K prompt threshold measures. Listed under **Facts to establish by hand
before the first ticket** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] **Where a continue's entries land**: read off real session records of a run with a put-back. Either the continue
      appends to the continued agent's existing record, as the replaced note and the duration assume, or it starts a
      record of its own.
- [x] **How a target is named**: read off the same records. The `SendMessage` input names its target by the id the
      dispatch's result carried, by the name the dispatch gave it, or by either.
- [x] **What counts as a prompt for the tier**: read off the provider's pricing page at the time of the check, not
      recalled. Either input plus cache-read and cache-write tokens, as the tier assumes, or uncached input alone.
- [x] Each answer is recorded under this ticket's `## Comments` with the records, entries or page it was read from.
- [x] Any answer that contradicts the spec's assumption is named against the tickets it affects (02, 08, 09) before
      they start.

## Comments

**Read off by hand, 2026-10-31 — all three facts hold as the spec assumes; no contradiction.**

Records read: every `<session-id>.jsonl` under `~/.claude/projects/*/` carrying a `SendMessage` `tool_use`, with its
`subagents/` beside it, written by Claude Code 2.1.311. Among them, 73 `SendMessage` calls to a `deliverer:*` agent
across 35 sessions. The worked example is session `672f1723-a726-4256-8e8e-06968ee874b8`, a refine run that put its
**spec-writer** back twice.

### 1. Where a continue's entries land: the continued agent's existing record

The continue appends to the continued agent's own record. No new record is started.

- In `672f1723…`, the `Agent` call at line 194 dispatched `deliverer:spec-writer`. Its result at line 195 carried
  `toolUseResult.agentId: "a1b44118be0c3b899"`. The orchestrator's `SendMessage` calls at lines 215 and 235 both name
  that id.
- `subagents/agent-a1b44118be0c3b899.jsonl` runs from line 1 (the dispatch's prompt) through line 306 (the first
  attempt's `end_turn`), then continues. Line 307 is a `user` entry with `origin: {"kind":"coordinator"}` stamped at
  the first `SendMessage`. Line 346 is the second one. The record's last entry falls at the second continue's finish.
  Its sidecar `agent-a1b44118be0c3b899.meta.json` still names the original `toolUseId` (the `Agent` call at line 194).
  No other record in `subagents/` starts in the same minute.
- Across all 73 continues to a `deliverer:*` agent, the target's `agent-<id>.jsonl` exists and gains a `user` entry
  with `origin.kind: "coordinator"` after the `SendMessage`'s timestamp. Only one of them has another record starting
  in the same minute, and that record is an unrelated, separately claimed dispatch.
- A continue's finish reaches the orchestrator's own record in two places: a `queue-operation` `enqueue` entry, and a
  `user` entry with `origin.kind: "task-notification"`, both carrying `<task-notification>`. That notification's
  `<task-id>` is the agent id and its `<tool-use-id>` is the **`SendMessage`'s** `tool_use` id, not the `Agent`
  call's. The `SendMessage`'s own `tool_result` lands within milliseconds and says only that the agent is resuming.
- Seen only outside deliverer runs: a message sent to an agent that is still running lands as an `attachment` entry of
  type `queued_command` with `origin.kind: "coordinator"`, in the same record.

What the observer sees today: `readDispatchRecords` (`plugin/mcp/observer/records.ts`) reads the whole file, and
`trace.ts` attaches it to its `Agent` call through the sidecar's `toolUseId`. So the continue's tokens are already
summed into the original dispatch, as the spec states. Its duration is not. `buildDispatch` takes
`toolUseResult.totalDurationMs` from the first result before it ever looks at the record's last entry, so ticket 08 has
to reverse that precedence. The `<task-notification>` the continue produces is collected into `notificationsByToolUse`
under the `SendMessage`'s id, and nothing looks it up.

### 2. How a target is named: by either, and the result resolves both to the id

The `SendMessage` input names its target by the agent id or by the name the dispatch gave it. The host records which
one in the input itself.

- Input keys, as written: `to`, `recipient` (both carry the same target), `recipient_kind` (`"agent"` for an id,
  `"name"` for a name), `type: "message"`, `summary`, plus `message` and `content`, which both carry the text. Older
  records (`3fcacc9c…`, `a9f97f77…`) lack `recipient_kind`, and some lack `summary`.
- In every deliverer run, the target is the agent id: all 73 calls have `recipient_kind: "agent"` or no kind with a
  17-hex-character `to`. No `Agent` call with a `deliverer:*` `subagent_type` passes `name` in any record found (42
  named dispatches, none deliverer). The orchestrator copies the id from the dispatch's result text, which ends
  `agentId: <id> (use SendMessage with to: '<id>', …)`, and from its `toolUseResult.agentId`.
- By name, outside deliverer runs: in `9c40a8ac-3244-4b17-842d-e4920c0a6c3e` (lines 366–367) and
  `ff216f8c-044e-4711-9241-467bcf1686b3` (lines 329–330), `to` is the dispatch's `name` with `recipient_kind: "name"`.
  A named dispatch's sidecar carries `"name"` beside `toolUseId`. A continue addressed by name lands in
  `agent-<id>.jsonl` exactly as one addressed by id does.
- Either way, the `SendMessage`'s `toolUseResult` resolves the target. On success it carries
  `pin: {id, name, ref}`, where `pin.id` is the agent id, plus `resumedAgentId` when the agent had finished. On
  failure it carries `success: false` and a message (`8ee8df25…` line 298, an id that has no record), with no
  `pin`.

What the observer sees today: nothing. No code path in `plugin/mcp/observer/` names `SendMessage`. The agent id is
available as `DispatchRecord.agentId` (off the file name) and as `toolUseResult.agentId`. The dispatch's name is in the
`Agent` input's `name`, and in the sidecar's `name`, which `readSidecar` does not read yet. Ticket 09's rule ("by the
id its dispatch's result named, and by the name the dispatch gave it if it gave one") matches what the records show,
and `pin.id` on the result gives a third, direct path. A failed `SendMessage` (`success: false`) is still a call whose
`to` may match an own agent. Ticket 09 should decide whether it counts, since nothing was continued.

### 3. What counts as a prompt for the tier: input plus cache reads and cache writes

Read from https://platform.claude.com/docs/en/about-claude/pricing on 2026-10-31, § Long context pricing:

> Claude Haiku 5.5 is priced by prompt length: a request whose prompt is over 100,000 tokens pays higher prices. A
> request's prompt length counts all of its input tokens, including cache reads and cache writes. Each request is
> priced on its own […]

- Model pricing table: "Claude Haiku 5.5 (for prompts up to 100,000 tokens)" is $0.10 base input and $0.50 output.
  "(for prompts over 100,000 tokens)" is $0.50 base input and $2.50 output. Both rates are confirmed.
- The threshold is exclusive. "Up to 100,000" takes the low tier and "over 100,000" the high one, so a prompt of
  exactly 100,000 tokens is priced low.
- Cache prices in both tiers keep the standard multipliers on that tier's input rate. 5m write: $0.125 and $0.625
  (1.25×). 1h write: $0.20 and $1 (2×). Read: $0.01 and $0.05 (0.1×). So the row needs no `cacheReadMultiplier`.
- The page also names a 1.1× multiplier for `inference_geo` US-only inference that applies to both tiers. The rate table
  ignores that multiplier for every model today.

### Against the spec's assumptions

No answer contradicts one, so tickets 02, 08 and 09 start as written. Two points sharpen what they build:

- **08**: the duration's precedence has to change, not just its fallback, because `totalDurationMs` from the first
  result wins today. A duration that runs to the record's last entry includes any time between the first return and
  the continue. In `672f1723…` that time was spent with the human.
- **09**: count a `SendMessage` by its `to` (or `pin.id`) resolving to an own agent's id or name. Decide what a
  `success: false` call does.
