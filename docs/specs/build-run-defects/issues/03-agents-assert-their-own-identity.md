# 03 — Every agent knows what it is, and that its prompt is complete

**What to build:** each of the seven **agent** definitions, read cold, tells the agent that it *is* this agent, that
there is no better-suited agent to hand the work to, and that its instructions are complete — nothing on disk adds to
them. The prohibitions the frontmatter already declares are restated in prose, because the frontmatter is not holding.

An observed run produced the failure this closes twice, in two different agent types: an agent quoted its own
`description:` back to itself as "a specialized agent designed exactly for this task" and dispatched a second copy of
itself, and an implementer walked the whole filesystem to read its own definition for a convention that was already in
its prompt. Settled as D1–D4 in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] All seven definitions assert identity, in the body, before the task imperative — the imperative is what the
      registry entry paraphrases, so identity has to be met first.
- [x] Each states that no better-suited agent exists for the work it was handed.
- [x] Each states that its instructions are complete and nothing on disk adds to them — all seven, not only the two
      where the disk hunt was observed.
- [x] Each states in prose that it does not **dispatch** an agent and does not write to the task list.
- [x] The `disallowedTools` frontmatter is unchanged in all seven: the prose is an addition, not a replacement.
- [x] No shared block is introduced — each file says it in its own register, at its own column width.
- [x] Read cold, no definition invites its agent to look for the specialist that handles its task.
