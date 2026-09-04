# 05 — The harness reads the fourth verdict and notices one nobody took

Status: ready-for-agent

**Blocked by:** 01, 03 — the verdict must exist to be read, and the assertion would fail every run until a wave honours
one.

**What to build:** an end-to-end delivery that leaves an `improve` nobody answered fails a test instead of passing one.
The **harness** already collects every **assumption comment** with the verdict word it named and its resolution state,
so this reads off the seam that exists and creates no new one. Settled under Testing Decisions in `../spec.md`.

- [x] The verdict reader's pattern matches `improve` alongside the three it matches today, and the comment calling them
      "the three verdicts" says four.
- [x] A new matcher fails a delivery where an assumption comment's standing verdict is `improve` and nobody answered it:
      it must end resolved, or carry a reply posted after that verdict.
- [x] The bar is *answered-after* rather than *resolved*, and the reason is written down: a wave may put an improvement
      on its **hand-off** list, that list lives only in report prose, and a stricter assertion would fail an honest run.
- [x] A delivery whose adjudication reached no `improve` passes this vacuously and says so.
- [x] The failure message quotes the comments it failed on, in the shape its sibling uses — the one asserting every
      assumption carries a verdict reply.
- [x] Nothing new is read out of report prose. The one module that turns a test's outcome on prose is untouched, because
      verdict counts are on the forge where the matchers already read them.
- [x] No assertion that an `improve` occurred: whether a **fixture**'s code offers a better road is not the plugin's to
      guarantee, and such an assertion would be flaky by construction on a test costing tens of minutes and real money.
- [x] `typecheck` and `lint` pass in the harness package.
