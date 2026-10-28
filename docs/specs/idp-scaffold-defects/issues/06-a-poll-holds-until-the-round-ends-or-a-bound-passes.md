# 06 — A poll holds until the round ends or a bound passes

**What to build:** a human paying for a delivery sees a review round's polling cost a handful of requests, whichever
host it runs on. Every `code_review_status` call holds while the review is not **terminal**, for a server-chosen bound
of about a minute, and answers at once when the review is or becomes terminal; `code-reviewer` needs no delay of its
own, which a host may refuse. Settled under **The held poll** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] First, verified by hand: the host's timeout on an MCP tool call. The figure and its source are recorded under
      `## Comments` below, and the held bound sits well inside it.
- [x] A poll on a non-terminal review answers after about the bound, with what is known then.
- [x] A poll answers at once on a review that is terminal on arrival, and as soon as one becomes terminal while held —
      completed, failed, cancelled, or aborted on either of the server's own bounds.
- [x] A rising `events` count does not end the hold.
- [x] A cancel during a held poll releases it promptly with `cancelled`.
- [x] An unknown id errors at once, without holding.
- [x] The answer's shape, its required keys and its omission rule are unchanged; the input schema is unchanged.
- [x] The bound is a constant beside the server's other two, and the tool's description says a poll may take that long.
- [x] `code-reviewer`'s step 4 says each poll holds until the round ends or a bound passes, and to call again on an
      answer that is not terminal — and nothing about delays of its own. Edited with
      `/mattpocock-skills:writing-for-agents`.
- [x] Every case above is exercised against the scripted backend over MCP stdio, with timelines longer than the bound,
      completing mid-hold, and dense with events.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

**The host's timeout on an MCP tool call**, established by hand on Claude Code 2.1.311 (the installed `claude`), from
two primary sources that agree:

- The env-vars reference, https://code.claude.com/docs/en/env-vars: `MCP_TOOL_TIMEOUT` is the timeout for MCP tool
  execution, "default: 100000000, about 28 hours"; HTTP, SSE and claude.ai connector servers also time out each request
  after 60 s by default, while "Stdio and WebSocket servers have no per-request timer".
  `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT` aborts a call whose server "sends no response and no progress notification" for 1800000 ms (30 minutes) on stdio and
  300000 ms (5 minutes) on a network server, capped at the effective `MCP_TOOL_TIMEOUT`.
- The installed binary, `/root/.local/share/claude/versions/2.1.311`, read with `strings`: the overall timeout resolves
  as the per-server `timeout` (if ≥ 1000) `?? MCP_TOOL_TIMEOUT ?? 1e8`, clamped to [1000, 2147483647] ms; the idle
  timeout as `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT ?? (stdio ? 1800000 : 300000)`, checked on a 30 s interval; the 60 s
  per-request floor (`60000`) is applied only on the network transports.

`plugin/.mcp.json` launches `tools` as a stdio server and sets no per-server `timeout`, so a held poll meets 28 hours
overall and 30 minutes of silence. The bound chosen, `POLL_HOLD_SEC = 50` in `plugin/mcp/server/config.ts`, sits well
inside both, and inside the 60 s network per-request limit as well. A user who sets `MCP_TOOL_TIMEOUT` below 50 s
would fail held polls; that is outside what the server can see.

**Verified by hand** — `/tmp/idp06/check-stdio.mjs` drives the server over MCP stdio with the scripted backend, one
server per case, all in parallel. Red before the change (six of eight failed: every poll answered in 1–2 ms), green
after:

- a timeline of 240 events 500 ms apart (longer than the bound, dense with events): the poll answered after 50003 ms,
  `running`, `events` 101 — no early return; keys `events,reviewId,startedAt,status`.
- completing at 8 s: the held poll answered at 8015 ms with `completed`; the next poll, terminal on arrival, in 1 ms.
- failing at 8 s: the same, 8015 ms with `failed`, then 1 ms.
- a cancel 5 s into a held poll: the poll released 4 ms after the cancel, `cancelled`, and the cancel said `cancelled`.
- an unknown id: an error result in 4 ms.
- `tools/list`'s input and output schemas for `code_review_status`, captured before and after: byte-identical.

The two bound aborts cannot be reached over stdio in reasonable time — both bounds are constants of 30 minutes and four
hours — so `/tmp/idp06/check-bounds.ts` drives them through `createLifecycle` with small `deadlineSec` /
`idleDeadlineSec` and the scripted backend, the seam those deps exist for: an idle bound of 2 s released a held poll at
2013 ms with `failed` and the idle bound named; an absolute bound of 3 s, with events every 200 ms, at 3001 ms with the
absolute deadline named. The same script shows the host's request signal releasing a hold (1003 ms, `running`), which
`index.ts` wires from the tool handler's `extra.signal`.

`code-reviewer` step 4 edited with `/mattpocock-skills:writing-for-agents`: one sentence, positive, naming no delay.
`npm run typecheck && npm run lint` pass in `plugin/mcp`. `POLL_AFTER_MS` stays on the start answer, unchanged, since
that answer's shape is not this ticket's to move; its comment now says the server no longer relies on it.
