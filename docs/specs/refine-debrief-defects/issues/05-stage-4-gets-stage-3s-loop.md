# 05 — Stage 4 gets stage 3's loop

**What to build:** a spec the tickets writer finds wrong reaches a human instead of being worked around, and the epic is
handed over only once its tickets agree with its spec. `tickets-writer` reports every place its reading found the spec
wrong as a fork, with what it found. In the refine skill, those forks go through stage 3's "one report, one round, one
put-back" by reference, the put-back going to `spec-writer`; stage 4 is then put back carrying the corrected spec's
location, and a continued `tickets-writer` edits its published tickets in place, keeping their numbers. Stage 4 is done
when no fork its report raised is still open. Settled under **The refine skill** and **`tickets-writer`** in
`../spec.md`; stories 17 (the tickets' half), 21–24.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] `tickets-writer` sends every place its reading found the spec wrong — a mechanism that would not achieve what
      the spec intends, a decision the code makes impossible — to its report as a fork with what it found, never
      worked around silently in the tickets.
- [x] A put-back clause in `tickets-writer`: a continued dispatch edits its published tickets in place and keeps their
      numbers; only a cold dispatch writes a ticket whole, and **Resume**'s fixed numbers still hold.
- [x] Stage 4 takes a report's forks through stage 3's loop by reference, with the put-back to `spec-writer`, then puts
      stage 4 back carrying the corrected spec's location, its corrected report going through the same.
- [x] Stage 4's done bar: no fork the tickets writer raised is still open.
- [x] **Progress** flips stage 3's and stage 4's tasks back to `in_progress` and on to `completed` the same way a
      stage 3 put-back does today.
- [x] **What to report** gains a line for every fork the tickets writer raised and how it closed.
- [x] The refine skill and `tickets-writer` are read against `/mattpocock-skills:writing-for-agents`.
