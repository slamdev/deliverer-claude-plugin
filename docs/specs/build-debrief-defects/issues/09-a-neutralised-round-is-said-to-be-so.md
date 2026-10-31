# 09 — A neutralised round is said to be so

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a **fix wave** knows when the **round** prose it carries was rewritten by the host, so it does not
read the host's text as the reviewer's finding. When a dispatch's hand-back matches the host's instruction-shaped
patterns, the host neutralises it and opens it with the line
`[harness: subagent output matched instruction-shaped pattern(s): …]`. It did so, in three runs, to round prose the
build skill carries verbatim into a fix wave, and the flag stayed with the orchestrator. Settled as change 8 in
`../spec.md` § Solution.

- [ ] When a `code-reviewer` hand-back opens with the host's flag line, the orchestrator carries that line beside the
      verbatim prose into the fix wave's brief — beside it, never in place of it.
- [ ] Reading the flag is a mechanical read; the orchestrator forms no view on the prose (ADR 0015).
- [ ] The build skill's What to report names the round that was neutralised.
- [ ] The prose still reaches the wave as the host returned it, with the declined findings and their grounds.
- [ ] The file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap are kept.
