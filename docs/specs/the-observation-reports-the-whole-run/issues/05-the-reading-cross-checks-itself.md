# 05 — The reading cross-checks itself against what is on disk

Status: ready-for-agent

**Blocked by:** 02, and through it 01. **A reuse edge:** the second check counts the run's own entries left outside the
**extent**, and against the frozen extent 02 fixes it would fire on every run that ever delegated — 226 entries of the
measured record alone. It has to be written against the extent 02 lands, or it is noise by construction.

**What to build:** two comparisons against what is on disk, neither costing a model call, so a reading that does not
account for the record's own shape says so. Today nothing checks: the two **dispatch** records sat in the directory
`records.ts:280` reads, with `.meta.json` sidecars naming `deliverer:spec-writer` and `deliverer:tickets-writer`, while
the **debrief** reported "dispatches — 0 — none" and called it normal — *"no review round was started, which is what a
refinement looks like"*. Settled as D10 and D11 in `../spec.md`.

**Where they report.** Under what the observation lost, and never among the run's **defect**s. A defect is something the
run cost its human; these are faults in the reading, and the section that already exists for "a run whose records were
damaged, and an observation that degraded" is where a reader looks for them.

**Both checks must be worded as what they are, which is unaccounted-for rather than missing.** Neither can claim the
files or the entries are the run's:

- A session can hold **two runs**, and the ceiling closes on the second `/deliverer:` command deliberately — those
  entries carry the run's own attribution and are correctly outside this debrief's extent. The reading already records a
  loss saying so, and this check must not repeat it as a fault.
- A human dispatches agents of their own in the same session, and those records land in the same `subagents/` directory.
  A file this check cannot place is a file it cannot place; that is worth telling a reader and is not evidence of a lost
  dispatch.

- [x] Check one: dispatch record files in the directory the reading reads that the reading's own account of the run
      mentions nowhere. It counts them and names them, and says it cannot place them rather than claiming they are the
      run's.
- [x] Check two: entries carrying the run's own attribution that fall outside the extent the reading chose. It reports
      the count and where they sit relative to the extent.
- [x] Check two does not fire on an extent whose ceiling was closed by a second `/deliverer:` command, because that case
      already has its own loss and is not a fault.
- [x] Both are written as losses in the debrief, in the section that exists, and neither becomes a defect or a
      **hunch**.
- [x] Both run on the facts-only path too — an observation that nothing judged is exactly the one whose reading nobody
      checked — and neither makes a model call.
- [x] Both run in **replay** as well as in the live observer, since it is one code path.
- [x] Comments cite this ticket and name the reading that would have been caught.
- [x] **Verified by hand with 01's procedure**: a prefix truncated before a dispatch landed, with that dispatch's record
      present on disk, reports the file it cannot place; a whole-record replay of a clean run reports neither check; and
      a record holding two runs still reports the second-run loss and not a spurious one.
- [x] `(cd plugin/mcp && npm run typecheck && npm run lint)` passes.
