---
name: refine
description: ...
disable-model-invocation: true
argument-hint: "<epic-idea>"
metadata:
  credits: All credits belong to https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md
---

Run a `/mattpocock:grilling` session, using the `/mattpocock:domain-modeling` skill.

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the
temporary directory of the user's OS - not the current workspace.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference
them by path or URL instead.

Dispatch the brief to `spec-writer` and get back the reference to the published spec.

Dispatch the spec to `tickets-writer` and get back the reference to the published tickets.

Present the summary of the work to the user and suggest calling `build` skill with the reference to the published spec.
