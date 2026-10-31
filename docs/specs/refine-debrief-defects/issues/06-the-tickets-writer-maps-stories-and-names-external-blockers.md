# 06 — The tickets writer maps stories and names external blockers

**What to build:** a human checks the tickets' coverage in one look, and knows what the set waits on beyond itself.
`tickets-writer`'s per-story check produces a mapping from every user story number to the ticket numbers that cover it,
and the report carries that mapping in place of a one-line coverage assertion. A blocker outside the ticket set — a
pending change request, another epic's ticket — is named in the ticket body by its link, never as a native blocking
link or a **blocking edge**, and every one goes to the report. Settled under **`tickets-writer`** in `../spec.md`;
stories 25, 26.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Step 5's per-story check produces a mapping from every user story number to the ticket numbers that cover it.
- [x] The report carries that mapping in place of the one-line coverage assertion, and still names an uncovered story
      with why.
- [x] A blocker outside the ticket set is named in the ticket body by its link, never as a native blocking link and
      never as a blocking edge; step 4's rule that every blocking edge names a slice in the set still holds.
- [x] The report lists every external blocker, by ticket.
- [x] `tickets-writer` is read against `/mattpocock-skills:writing-for-agents`.
