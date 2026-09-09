# 05 — The README stops calling the new shape a fault

Status: ready-for-agent

**Blocked by:** None — can start immediately. It touches one file no other ticket touches, and nothing about a **run**'s
behaviour depends on it. It is not a prerequisite for the measurement in ticket 06 either: a document nobody reads at
runtime cannot move a figure.

**What to build:** the user-facing README says what a refinement now looks like from outside, and what that adds to the
cost of watching it. Two of its statements stop being true the moment this epic lands, and it is the document a user
reads before any other.

**It makes stages dispatched one at a time a requirement, and names its own violation as a misconfiguration.** The
requirements list justifies one host setting with "its stages stop being dispatched one at a time". The troubleshooting
list then names **"Stages run over each other, or a dispatch never reports back"** as the symptom of that setting being
on, and tells the reader to fix the setting. After this change a refinement runs several **sweep**s beside its
interview, concurrently and on purpose — which is exactly what that symptom looks like from outside. **A user who reads
that goes and checks a setting that is already correct**, and the plugin's own documentation is what sent them.

So both places separate the two shapes. An **epic**'s own stages overlapping is still a fault and still that setting:
one stage, one **dispatch**, reported before the next starts, which is what the delivery half of the plugin promises and
still does. Fact-finding running beside an interview is neither a fault nor that setting — it is this plugin sending
questions of fact out so the interview stops paying to read the repository itself.

**And it prices an observation off a dispatch count.** The README states "about ten cents a dispatch" for the cheap
per-dispatch reading, that "the figure follows how many dispatches your run made, not how long it took", and "$3.18 to
$3.48 for a refinement" — measured when a refinement made three or four dispatches. The **observer** grades every
dispatch, so every sweep is one more graded dispatch: a refinement that sweeps costs more to observe than that
arithmetic implies, on the user's own account, against the same rate limit as the run, with no back-off — all three of
which that section already says. What is missing is only that the count now includes fact-finding.

**No new figure.** Nobody has yet measured a refinement that sweeps; a figure derived from the per-dispatch one would be
a **claim** dressed as a measurement, which is the failure this whole epic is named for. Say that the count now includes
fact-finding and leave the arithmetic where it already sits. Ticket 06 measures the count on a real run, and it is
forbidden from coming back to edit this file.

Files: `README.md`, and nothing else. Decision D25, with D14 and D19, in
`docs/specs/the-interview-stops-reading/spec.md`.

- [ ] Every snippet being replaced was confirmed present in the current source **before** editing, and any mismatch was
      reported rather than guessed around.
- [ ] The requirements list no longer implies that a refinement dispatches one agent at a time for the whole of a run,
      and still requires the host setting it requires today, for the reason it requires it (D25).
- [ ] The troubleshooting entry **distinguishes an epic's stages overlapping from fact-finding beside an interview**, so
      the symptom still names a real fault and no longer names an expected one (D25).
- [ ] **The delivery half of the promise is untouched** — one stage, one dispatch, reported before the next starts.
- [ ] The observation section says that a refinement's **dispatch** count now includes its fact-finding, and that what
      observing it costs follows that count (D25).
- [ ] **No new dollar figure is stated, derived or otherwise**, and the figures already there keep the runs they were
      measured on (D25).
- [ ] Nothing here promises how many sweeps a refinement makes: the number is a run's own and this epic sets no target.
- [ ] The `Using it` walkthrough still reads as the same three steps a user takes, and stage 1 is still the one that
      needs them in the room.
- [ ] No model or effort tier, and no **ceiling**, is mentioned as changing, because none does (D14).
- [ ] Register holds: this file is written for a human rather than for a model, and its register is preserved (D19).
- [ ] The file's prevailing column width is matched — 120 **characters**, not bytes.
- [ ] The glossary's own words are used, and none of the synonyms its `_Avoid_` lists displace.
