# 01 — Opus runs at medium

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** every place the plugin chooses an opus tier runs at `medium` instead of `high`, so a run costs less
without an owner configuring anything — while `spec-writer`, which every later stage rests on, is priced on the bench
before it moves. Settled in `../spec.md` under Implementation Decisions › Effort.

- [ ] Before anything is committed, one `spec-writer` bench arm runs at `medium` and is read against the existing
      `high` figures, with the caveats the contribution guide gives for an arm. A clear regression stops the ticket and
      goes to the human for the call: `spec-writer` stays at `high` only if they say so.
- [ ] `implementer`, `comments-addresser`, `tickets-writer`, `assumption-reviewer` and `spec-writer` declare `effort:
      medium` (subject to the item above). `code-reviewer` and `change-request-creator` are unchanged.
- [ ] The `code_review_effort` user option defaults to `medium`, and its description names that default wherever it
      names one. The accepted tiers and the refusal of anything else are unchanged.
- [ ] The observer's synthesis tier is `medium`. It is still its own fixed constant and still does not read the review's
      option; the comment saying why is kept and stays true.
- [ ] The writer bench falls back to `medium` for an agent file declaring no `effort`, and its comment's count of
      shipped agents is accurate.
- [ ] The review lifecycle runs to completion against the scripted backend with the effort option unset, and the tier
      that reaches the backend is `medium`.
- [ ] Typecheck and lint pass in both packages.

## Comments
