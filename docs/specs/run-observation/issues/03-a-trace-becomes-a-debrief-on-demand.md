# 03 — A trace becomes a debrief of the run's facts, on demand

Status: ready-for-agent

**Blocked by:** 02

**What to build:** one command, pointed at a past run's records, produces a readable **debrief** — the fixed header,
the footer naming where to send it, and a line saying no judging ran. This is **replay**, and it is the seam every
ticket after it is verified at: with no judging it costs nothing, calls no model and gives the same answer every time.
It is to the observer what the **scripted backend** is to the review. Settled as D13, D15, D16, D17 and D24 in
`../spec.md`.

- [ ] One command takes a past run's records and writes a debrief beside that run's trace.
- [ ] The header carries: which skill ran, the epic's slug, wall-clock, how many dispatches, how many **rounds** and
      how each one ended, the run's **spend**, what the observation itself cost, and the installed plugin's commit.
- [ ] A figure nobody measured reads `unknown` and never zero, as the glossary requires of spend.
- [ ] With no judging available the debrief carries no **defects**, and one line names what stopped the judging.
- [ ] The footer names where to send the debrief: an issue on the plugin's own repository. It states that the
      debrief is bounded and may be forwarded without being read for leaks first.
- [ ] The debrief names the trace and its path, and says in the same breath that the trace is not bounded and must
      not be forwarded — the third of the three refusals.
- [ ] A commit reported by a replay is the installed plugin's commit **now**. The debrief says so rather than
      implying it is the commit the run itself used.
- [ ] Replaying the same records twice produces the same debrief, byte for byte.
- [ ] Records that produce no trace produce no debrief, and the command says why.
- [ ] CONTRIBUTING § What CI does not check gains the replay procedure beside the scripted backend's: the command,
      what it needs, and what to read in what it leaves behind.
- [ ] Verified against the records of the runs already on disk, including one that did not finish.
