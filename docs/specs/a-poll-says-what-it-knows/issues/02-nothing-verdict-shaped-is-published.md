# 02 — Nothing verdict-shaped is published, because there is nothing there

Status: ready-for-agent

**Blocked by:** 01 — the record this rests on says so first.

**What to build:** a **poll** of a finished **round** stops carrying a judgement nothing could ever fill. `verdict`,
`counts.findings` and `partial` leave the payload and every type behind it, and the review agent stops being instructed
to report two fields it is told in the same breath read `unknown` on every real round. ADR-0005 makes the round's prose
the deliverable, the real backend has no findings parser and must not gain one, so only the scripted double ever filled
these. Settled as D5, D6, D16, D18 and D26 in `../spec.md`.

- [ ] `verdict` and `counts.findings` are gone from the published payload, from its output schema, and from the server's
      own account of what the status tool returns.
- [ ] They are gone from the record, from the completion event a backend emits and from the scripted event too, so a
      field coming back does not compile.
- [ ] The `unknown` literal they were the only two users of is gone with them, and nothing else in the server publishes
      that word.
- [ ] `partial` is gone. What it expressed does not move: a round that is not `completed` carries no prose at all, which
      is the stronger statement of the same thing.
- [ ] The scripted double's default timeline stops naming a verdict and a finding count, and goes on publishing every
      **spend** field it publishes today — a default that shows nothing reaching a caller cannot show whether the
      fields arrive.
- [ ] `code-reviewer`'s report section names none of the three. What it reports for a completed round is the prose,
      verbatim, and what the round spent; for a failed or cancelled one, the one-line reason and that the round produced
      no review.
- [ ] The status tool's description loses the passage explaining that every verdict-shaped field reads `unknown`,
      because no such field is left to explain.
- [ ] Verified against the scripted backend: a completed round, a failed round and a cancelled round each polled to a
      terminal status, and no answer carries a verdict, a finding count or a partial flag.
- [ ] `typecheck` and `lint` pass in `plugin/mcp`; each file's register and column width are matched.
