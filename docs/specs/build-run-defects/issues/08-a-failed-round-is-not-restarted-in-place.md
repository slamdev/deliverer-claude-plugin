# 08 — Report a failed round as the round it was

**What to build:** a **round** that ends `failed` or `cancelled` is reported as that round. Starting another one under a
fresh id inside the same dispatch is not the reviewer's to do — the **orchestrator** decides whether another round is
spent.

Of the four attempts an observed run made at its second round, two were the `code-reviewer` restarting under a fresh id
inside its own dispatch: behaviour its definition never grants it, which says to poll to a terminal status and report.
Settled as D23 in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The definition says a round ending `failed` or `cancelled` is reported as the round it was, and that starting
      another inside the same dispatch is not its to do.
- [x] The existing refusal branches at start are unchanged: an id that already names a finished review raises the
      number, and a review already in flight is waited on.
- [x] The resume behaviour is unchanged — starting again under a **live** id hands back that same review.
- [x] Nothing is added about the round budget, a retry cap, or classifying a failure as retryable: those are out of
      scope pending more observed occurrences.
- [x] What it reports on a dead round is unchanged: the `review_id`, the status, the one-line reason, that the round
      produced no review, and what it **spent**.
- [x] The file's register and column width are matched.
