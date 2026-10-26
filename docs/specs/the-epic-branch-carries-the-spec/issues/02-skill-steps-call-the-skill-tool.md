# 02 — Skill steps call the Skill tool

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** the two places the plugin hands a step to a `mattpocock-skills` skill say so as explicit Skill tool
calls, one per skill, because upstream measured that a skill named in prose does not reliably load. Settled in
`../spec.md` under Implementation Decisions › Skill invocation.

- [ ] Refine's stage 1 tells the orchestrator to call the Skill tool twice — once with `grilling`, once with
      `domain-modeling` — rather than naming both in one sentence. What follows (the overrides for asking and sweeps,
      the stop-and-report when either is missing, the done bar) is unchanged.
- [ ] `change-request-creator` tells the agent to call the Skill tool with `pr` for the description. Its installed check
      before step 1, and its writing the description it produces with nothing added, are unchanged.
- [ ] No other instruction in either file moves; the prose keeps the register `writing-for-agents` describes.

## Comments
