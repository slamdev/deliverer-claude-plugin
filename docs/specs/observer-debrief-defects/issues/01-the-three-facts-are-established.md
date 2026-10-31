# 01 — The three facts are established by hand

**What to build:** a maintainer picking up any later ticket finds the spec's three open facts answered, with the
evidence beside each answer, so that no ticket builds on a guess. Where a `SendMessage` continue's entries land, how a
`SendMessage` names its target, and what the 100K prompt threshold measures. Listed under **Facts to establish by hand
before the first ticket** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] **Where a continue's entries land**: read off real session records of a run with a put-back. Either the continue
      appends to the continued agent's existing record, as the replaced note and the duration assume, or it starts a
      record of its own.
- [ ] **How a target is named**: read off the same records. The `SendMessage` input names its target by the id the
      dispatch's result carried, by the name the dispatch gave it, or by either.
- [ ] **What counts as a prompt for the tier**: read off the provider's pricing page at the time of the check, not
      recalled. Either input plus cache-read and cache-write tokens, as the tier assumes, or uncached input alone.
- [ ] Each answer is recorded under this ticket's `## Comments` with the records, entries or page it was read from.
- [ ] Any answer that contradicts the spec's assumption is named against the tickets it affects (02, 08, 09) before
      they start.
