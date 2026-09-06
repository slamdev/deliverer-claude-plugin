# 01 — The adjudication states a fourth verdict

Status: ready-for-agent

**Blocked by:** None (can start immediately)

**What to build:** an **assumption** whose choice is defensible can receive a **verdict** that still changes the code.
`improve` joins `accept`, `override` and `escalate`, carrying a **directive** for a **fix wave** to implement and
leaving its comment unresolved so the wave's existing filter collects it. Nothing else about the adjudication moves yet:
this ticket gives the better road somewhere to go, and 02 is what goes looking for one. Settled as D4, D5, D7, D8 and
D15 in `../spec.md`, and by
[ADR-0019](../../../adrs/0019-a-defensible-assumption-may-be-bettered-without-ratification.md).

- [x] `improve` is a fourth bullet in the agent's **Verdicts** section, ordered `accept`, `improve`, `override`,
      `escalate`.
- [x] Its warrant is three things — the **axis**, the alternative, and why the alternative is better — and all three, or
      the verdict is `accept`. That mirrors `override`'s existing three-part requirement rather than inventing a second
      shape.
- [x] Where two axes conflict, the reply names both and says which won and why. There is no priority order between the
      axes and none is introduced.
- [x] The reply carries a **directive** and leaves the comment unresolved, exactly as an `override` does. No new posting
      path and no new mark: the wave's unresolved filter is already what collects it.
- [x] On a **channel** with no threading it opens `re: ASSUMPTION (<commit hash>)` like every other verdict, and never
      with the `ASSUMPTION` prefix — a verdict wearing that prefix comes back as a fork nobody made.
- [x] The correction rule covers it: an `improve` correcting an earlier `accept` unresolves that comment again
      wherever the channel has resolution state, and the newest verdict reply is still the one that stands.
- [x] **Resume** is unchanged, and the prose confirms rather than re-states it: an `improve` reply is a verdict
      reply, so an assumption carrying one is already done by the filter that exists.
- [x] `escalate` is untouched, and the boundary is stated once: an `improve` is the case where the default *is*
      defensible, an `escalate` where no defensible default exists.
- [x] **Grounds** is untouched. An improvement that can cite a spec line, an ADR, a caller that breaks or a concrete
      failure scenario is an `override` and always was; `improve` names an axis instead.
- [x] The agent's report counts four verdicts rather than three, and names the `improve`s it directed.
- [x] The existing sentence that accepting every one is a fine outcome, as is overriding every one, with no target rate,
      is checked against four verdicts and either still reads true or is amended to cover them.
- [x] Register and the file's prevailing column width are matched.
