# 01 — The by-hand procedure reproduces a mid-run reading

Status: ready-for-agent

**Blocked by:** None (can start immediately).

**What to build:** the documented way to verify the **observer** gains the form that every other ticket in this epic is
checked with. **Replay** today points at a finished run's **session record** and produces that run's **trace** and
**debrief** — which is the reading that already works. Every failure this epic exists for lives in a reading taken
*while the run was still going*, and there is no documented way to take one. Truncating a copy of a record to a prefix
is that way: it costs nothing, calls no model, and reproduces exactly what the observer saw at any moment of the run.

**This is prefactoring and it lands first.** Tickets 02 to 06 are each verified by hand — CI reaches none of them — and
each of their procedures is "replay a prefix and read the figures". Writing that down once, before the changes, means
five tickets cite one procedure instead of inventing five, and it is immediately useful against the code as it stands
today: on the record that produced this epic, prefixes of 50, 120, 200 and 268 entries all read `1m38s · 0 dispatches ·
1 question round`, and 358 reads `3h50m · 2 dispatches · 8 rounds`. Settled as the first Testing Decision in
`../spec.md`.

**The host's layout is load-bearing and is the one thing a truncated copy gets wrong.** Per-**dispatch** records are
found by path — `<dir>/<session-id>/subagents/*.jsonl` with their `.meta.json` sidecars beside them — so a prefix copied
somewhere flat has no dispatches at all, and a contributor reads that as a defect in the reading rather than as their
own copy being wrong.

- [ ] `CONTRIBUTING.md` § Replaying a run's records gains the truncation form: copy the record, keep the first N
      entries, and replay the copy. One command a contributor can paste.
- [ ] It says what the copy has to preserve — the record named `<session-id>.jsonl` with a `<session-id>/subagents/`
      directory beside it holding each `agent-*.jsonl` and its `.meta.json` — and that a copy without that directory is
      a reading from before any stage landed, which is a legitimate thing to want and must be asked for deliberately.
- [ ] It says what the form is *for*: a reading taken mid-run is where the **extent**, the finalise and the cross-checks
      can be seen at all, and a whole-record replay cannot show any of them.
- [ ] It names the environment variables that make the observer's clocks walkable — the tick, the throttle, the idle
      bound, the after-finalise window and the patience — in one place, as `observer.ts` already documents them
      individually, so a lifecycle state is reachable in seconds rather than in half an hour.
- [ ] It says plainly that no run's records are checked into this repository and why: they carry the repository, the
      absolute paths, the username and every word of the human's own prose, which is what makes a **trace**
      do-not-forward in the first place.
- [ ] The free form's determinism claim is not weakened: the same prefix gives the same debrief byte for byte, and the
      section still says so.
- [ ] Markdown wraps at 120 columns and the section's existing register is matched.
