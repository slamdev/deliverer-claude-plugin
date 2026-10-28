# 06 — A poll holds until the round ends or a bound passes

**What to build:** a human paying for a delivery sees a review round's polling cost a handful of requests, whichever
host it runs on. Every `code_review_status` call holds while the review is not **terminal**, for a server-chosen bound
of about a minute, and answers at once when the review is or becomes terminal; `code-reviewer` needs no delay of its
own, which a host may refuse. Settled under **The held poll** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] First, verified by hand: the host's timeout on an MCP tool call. The figure and its source are recorded under
      `## Comments` below, and the held bound sits well inside it.
- [ ] A poll on a non-terminal review answers after about the bound, with what is known then.
- [ ] A poll answers at once on a review that is terminal on arrival, and as soon as one becomes terminal while held —
      completed, failed, cancelled, or aborted on either of the server's own bounds.
- [ ] A rising `events` count does not end the hold.
- [ ] A cancel during a held poll releases it promptly with `cancelled`.
- [ ] An unknown id errors at once, without holding.
- [ ] The answer's shape, its required keys and its omission rule are unchanged; the input schema is unchanged.
- [ ] The bound is a constant beside the server's other two, and the tool's description says a poll may take that long.
- [ ] `code-reviewer`'s step 4 says each poll holds until the round ends or a bound passes, and to call again on an
      answer that is not terminal — and nothing about delays of its own. Edited with
      `/mattpocock-skills:writing-for-agents`.
- [ ] Every case above is exercised against the scripted backend over MCP stdio, with timelines longer than the bound,
      completing mid-hold, and dense with events.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
