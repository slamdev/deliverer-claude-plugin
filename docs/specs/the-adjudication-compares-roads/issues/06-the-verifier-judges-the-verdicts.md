# 06 — The verifier judges whether the verdicts were sound

Status: ready-for-agent

**Blocked by:** 02, 05 — soundness means little before the comparison exists, and 05 touches the same reader first.

**What to build:** the **verifier**'s judgement on a delivery covers whether the adjudication was sound, not only
whether the code is plausible. That is exactly the question no assertion can settle, which is what the verifier is for —
and it needs the verdict replies, which the harness keeps today only as an opening line and a count. Settled under
Testing Decisions in `../spec.md`.

- [ ] The adjudication — each assumption comment and the verdict replies under it, in full — is written into the **run
      directory** for the verifier to read, the way the delivered diff already is, and the path comes back so a
      contributor can read the same file the verifier was given.
- [ ] The delivery prompt gains a third subject: were the verdicts sound? An `accept` whose **grounds** do not hold, an
      `improve` whose **axis** does not carry it, an `escalate` that had a defensible default — each fails it.
- [ ] The delivery prompt no longer says "two subjects and no others". The refinement prompt's own two are untouched.
- [ ] The third subject is given nothing an assertion already settles: that every assumption carries a verdict, and
      that a wave answered every `improve`, are facts asserted elsewhere and are none of its business.
- [ ] The verdict schema still requires grounds per subject and still forbids taste.
- [ ] The verifier still reads and nothing else, still forms its verdict on `opus`, and still runs against the clone a
      run has already finished with.
- [ ] `typecheck` and `lint` pass in the harness package.
