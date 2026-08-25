# 04 — A live run is observed without anyone asking, and can be switched off

Status: ready-for-agent

**Blocked by:** 03

**What to build:** typing `/deliverer:refine` or `/deliverer:build` starts an **observer** out of band, which keeps a
debrief current as the run proceeds and finalises it when the run is over; a line names it when the run stops, and again
on the next prompt. One option turns the whole thing off. This is the ticket that makes the feature reach a user at all,
and merging it is what ships it — so the switch and the disclosure land with it rather than after. Settled as D1, D3,
D22, D23, D25, D26, D29 and D32 in `../spec.md`.

- [ ] **C1 is settled by hand first**, before anything here is built: whether a hook can read `${user_config.*}` the
      way `.mcp.json` does. The answer is recorded in the spec's claims section, and if it is false the fallback
      surface for the opt-out is chosen and recorded there before the rest of this ticket proceeds.
- [ ] A prompt that is a `/deliverer:` command starts an observer. So does a prompt in a session whose records
      already carry deliverer attribution, which is how a run resumed by prose rather than re-typed is covered.
- [ ] Any other prompt starts nothing, and the hook costs a session with no run in it nothing worth measuring.
- [ ] The observer is detached: the hook returns at once and the process outlives it. The run never waits on it.
- [ ] Its working directory is the plugin's data directory and never a repository — it is alive while an
      `implementer` is committing to the **epic branch**.
- [ ] The debrief is rewritten as each stage lands, so a readable one exists at every moment rather than only at the
      end.
- [ ] Session end finalises the debrief. A generous idle bound — no new record anywhere, main or per-dispatch —
      finalises the one a killed terminal left, so nothing waits forever.
- [ ] A line when the run stops names the headline and the path. It prints nothing at all when there is no debrief
      to name, so a refinement's per-question stops stay silent.
- [ ] A line on the next prompt mentions a debrief that has not been read.
- [ ] Both lines say what the debrief is, that it is bounded and safe to forward, where it is, and how to turn
      observation off.
- [ ] A `userConfig` option turns observation off entirely: no process starts, no trace is written and no debrief
      appears. Its default is on.
- [ ] The `SessionStart` install hook publishes the observer's source into the plugin's data directory alongside the
      server's, and the observer resolves the Agent SDK from there — the same arrangement
      [ADR-0002](../../../adrs/0002-dependencies-and-source-are-installed-into-the-plugins-data-directory.md) and
      [ADR-0003](../../../adrs/0003-the-launcher-waits-for-the-install-rather-than-racing-it.md) already settled for
      the server. No second `npm ci`, and session-start time does not grow.
- [ ] Nothing the observer does can slow, block, edit or fail a run. Any failure of its own leaves no error in the
      session, no exit code that matters and nothing the human must act on.
- [ ] A failure that stops a debrief being produced still reaches the human, through the line that was going to be
      printed anyway.
- [ ] The README gains a section: what observation does, that it is on by default, what it writes and where, that it
      draws on the same account as the run, that nothing is ever removed, what a debrief may and may not contain,
      and how to turn it off.
- [ ] The hook states are walked by hand and reported: a session with no run in it, a command typed, a run resumed
      by prose, a session ended mid-run, a killed terminal, and observation switched off.
