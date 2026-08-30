# 06 — The records and the procedure tell the truth

Status: ready-for-agent

**Blocked by:** 02, 03, 04

**What to build:** a contributor reading the observation's own **spec** finds the decision that the **observer**
authenticates with the session's environment corrected rather than contradicted by the code, with the two host
measurements that settled it written down where a claim belongs — and a contributor exercising the judging half by hand
is told how to point it at an **environment file**. This is the completion pass: it lands last so that every correction
it makes is true when it is written. Settled as D16 in `../spec.md`, and the rest of D18.

- [x] run-observation's D27 is corrected: the observation authenticates from the environment file the owner names,
      layered over what it inherited, and the inheritance the decision used to rest on is where it falls back. It links
      the ADR rather than restating the decision, which keeps the ADR the one place that decision changes.
- [x] Its D28 is corrected where the widening changes what it is about — the observation may now draw on an account
      other than the run's — while what it decided stands unchanged: no back-off, no deferral, and no detection of what
      kind of credential is in hand.
- [x] Its claim C2 records the hook half as settled, with both measurements and the version they were taken on: the hook
      boundary withholds `CLAUDE_CODE_OAUTH_TOKEN` specifically, while an unrelated variable set in a project's own
      settings and an inherited `ANTHROPIC_AUTH_TOKEN` both survive it; and setting that name explicitly in the same
      settings block does not get it through either, so no consumer-side configuration could have fixed this.
- [x] That record is a **claim** about a version and never a contract: it says what was measured, on what, and that
      nothing in the plugin relies on the host continuing to behave that way.
- [x] The code that layers the credential carries a short comment citing that record, so the measurement is one hop from
      the line that depends on it.
- [x] `CONTRIBUTING.md`'s replay procedure shows the variable in its `--judge` form, so exercising the judging half no
      longer depends on the contributor's own shell carrying a credential. The free form stays free — no variable, no
      model, no spend.
- [x] That procedure also says what the four credential shapes are and which artefact answers each, so the next
      contributor to touch this walks them without re-deriving them.
- [x] The two citations of ADR-0009 in the end-to-end tests' spec, and the harness comment that cites it, are read and
      corrected where the widening makes them wrong. What they rest on is unchanged: a contributor authenticates however
      they like, and the harness names no provider.
- [x] Every remaining sentence in the tree that calls it the review's environment file, or says the observation reads no
      environment file of its own, is found and corrected. The sweep is done by search rather than from memory, and the
      search is stated.
- [x] No decision is reopened and no delivered spec grows a decision it was never grilled on. Each correction points at
      the ADR; this epic's own spec is where the reasoning lives.
- [x] Every document keeps its own register and its prevailing column width, and `e2e-tests` typechecks and lints if
      anything under it changed.
