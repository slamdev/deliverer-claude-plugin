# 01 — The two decision records catch up

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a contributor reading why a **poll** publishes no bound and carries no verdict finds both decisions
already saying so, before any key moves. Two records state consequences this epic falsifies, and a **spec** that
contradicts an **ADR** reopens it rather than overriding it in silence. **Prefactoring**: it lands first so that no
ticket after it argues a decision while also implementing it, and so each of them cites a record that already says what
it rests on. Settled as D19–D22 in `../spec.md`.

- [ ] ADR-0007 keeps its number, its name and every ground it argued: silence is what tells a working review from a
      wedged one, the server owns both bounds, the four-hour cap exists so that no configuration reaches "never", and
      no owner can tune any of it.
- [ ] Its two falsified consequences are rewritten rather than dropped — that the cap is published as a figure, and
      that the payload publishes the two figures which measure silence. What replaces them says that no bound is
      published at all, that one figure measures silence, and where a caller does learn both bounds.
- [ ] ADR-0010 keeps its number, its name, both of its existing amendments and its whole force on the review's prose:
      prose is reported only for a review that completed, terminal states absorb, **spend** survives a failed **round**,
      and no figure is ever defaulted to zero.
- [ ] It loses the verdict and the finding count as subjects, and says why: neither could ever be filled on a real
      round, so a rule about them was a promise about the scripted double wearing the clothes of a promise about
      reviews.
- [ ] Nothing verdict-shaped is weakened. A review that did not complete still carries no prose at all, which after
      this epic is the whole of what the rule guards.
- [ ] Neither record names this spec, this ticket or any other, per the doc stack.
- [ ] `CONTEXT.md` already carries **Poll**, added while this epic was refined. It is read and left as it is: no term is
      added, renamed or displaced here.
- [ ] No new ADR is added. Every other decision in this epic is a key on a payload and reversible in an afternoon.
- [ ] Each file's register and column width are matched.
