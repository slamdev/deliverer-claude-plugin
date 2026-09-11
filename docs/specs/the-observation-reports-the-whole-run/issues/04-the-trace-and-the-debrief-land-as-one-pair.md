# 04 — The trace and the debrief land as one pair

Status: ready-for-agent

**Blocked by:** 01 — a sequencing and verification edge only. This ticket shares no wording and no reading with 02 or 03
and could be implemented against the code as it stands; it is numbered here because one agent works this branch at a
time.

**What to build:** the two documents a human forwards can no longer disagree. `debriefRun`
(`plugin/mcp/observer/debrief.ts:119`) writes the **trace** first, through `distil()`
(`plugin/mcp/observer/distil.ts:111`), then runs judging — a whole-run synthesis, minutes of model call — and only then
writes the **debrief**. Anything that stops the process in that window leaves a newer trace beside an older debrief. The
trace is staged under a temporary name and renamed into place only once the debrief has been written, so the pair
appears together or the previous consistent pair stays. Settled as D9 in `../spec.md`.

**This is what the artefacts under examination show.** The trace on disk ends at 11:23:52 while `debrief.md`'s own
**hunch** section says the trace it read "run[s] to `[09:24:42]`", and the **identity file** beside them still says
`finalised: yes`. The debrief spent one of its three hunches noticing its own inconsistency and being unable to resolve
it — a whole hunch of the three D12 allows, on the observer's own bookkeeping.

**The trap: the debrief names the trace's path.** `renderDebrief` embeds `tracePath`, and the identity file names the
debrief. A staged name that reaches either document is worse than the inconsistency this fixes, because it points a
reader at a file that does not exist. The rename target is what both documents must carry.

**Rewriting the debrief on every trace write was considered and rejected**, in the spec: a facts-only rewrite would
overwrite a judged debrief with an unjudged one, which loses content rather than a label.

- [x] The trace is written to a staging name in its own directory and renamed into place after the debrief write
      succeeds.
- [x] Both documents carry the trace's final path, never the staged one.
- [x] A failure between the two leaves the previous pair on disk untouched, and leaves no staged file behind.
- [x] The identity file continues to be written in the same breath as the debrief, so it cannot outlive it either.
- [x] The live **observer**'s repeated rewrites still work: the file is staged and renamed on every reading, as the
      debrief already is, and the `writeWhen` gate that holds an unnamed **epic**'s observation off disk is unchanged.
- [x] **Replay** still prints the trace's final path on stdout, and the free form is still byte-for-byte deterministic
      on the same record.
- [x] Comments cite this ticket and say what the window was.
- [x] **Verified by hand with 01's procedure**: a replay produces a matching pair; a replay interrupted between the two
      writes leaves the earlier pair intact and no stray file; and a judged replay names the same path in the debrief
      that the trace is written to.
- [x] `(cd plugin/mcp && npm run typecheck && npm run lint)` passes.
