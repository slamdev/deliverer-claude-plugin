# 04 — Collect from every comment channel, and let a reply be the mark

**What to build:** the two agents that collect **comments** find every one that exists rather than every one that lives
on a single channel, and both know what to do when a comment cannot be marked **resolved** — the reply saying what was
done is the mark that it was worked. The **orchestrator**'s **bearings** read the same way, so a delivered **epic**
whose comments can never be resolved stops reading as permanently owing a **fix wave**.

This lands *before* ticket 05 on purpose. Reading every channel is a strict superset, so it is safe against comments
posted the old way and the new way both; switching the poster first would leave the collectors querying a channel the
comments are no longer on. Settled as D5, D9 and D10 in `../spec.md`.

An observed run is the evidence: a second fix wave reported *"only two unresolved items, but the team lead mentioned
three escalations… they're likely issue comments rather than review threads"*, and recovered only because its dispatch
prompt happened to carry the number three.

**Blocked by:** 01 — the worked examples name two forges, which the carve-out is what permits.

**Status:** ready-for-agent

- [x] `assumption-reviewer` collects every comment carrying the **assumption** prefix from every channel the forge
      exposes, not from one.
- [x] `comments-addresser` collects every unresolved comment from every channel.
- [x] Each is taught the operation it performs — replying-and-resolving, and listing what is unresolved — with two
      worked examples, GitHub and GitLab, and the instruction to use the equivalent on any other forge.
- [x] The reviewer's `accept` path says what to do when the comment cannot be resolved: reply, and let the reply be the
      mark.
- [x] The addresser's done-mark says the same for work it implemented or declined.
- [x] The delivery skill's bearings say a comment whose reply records the work is not work still owed.
- [x] All three read consistently against "**unresolved** is the whole filter" — a reader meeting both does not conclude
      they conflict.
- [x] No rule anywhere branches on which forge is in play: the examples illustrate, per ADR-0012 as amended in 01.
- [x] `override` and `escalate` still leave their comments unresolved on purpose, and a **verdict** is still read from
      the reply rather than from resolution state, per ADR-0014.
- [x] Each file's register and column width are matched.
