# 02 — Every agent backgrounds a long wait, reads a large file once and uses no secret

Status: resolved

**Blocked by:** None — can start immediately.

**What to build:** no dispatch burns turns sleeping, pays for the same bytes twice or leaks a credential into the run's
record. One working-habits block, worded identically, sits in the build skill and in the five agents that run commands
— `implementer`, `comments-addresser`, `change-request-creator`, `assumption-reviewer` and `spec-reviewer` — each
placing it where its instructions on working sit. The observed runs: a sleep loop beside a job already in the
background burned 26 turns, a blocking wait left a failed **gate** unread for nine minutes, a 44 KB spec was read three
times, and credentials found in a repository were used literally in commands, twice. Settled as change 2 in
`../spec.md` § Solution and under § The working-habits block.

- [x] **A long wait is backgrounded**: work that takes minutes runs in the background and its completion notice wakes
      the agent, and before waiting again the agent reads the state of what it waits on, so a wait never outlives its
      answer.
- [x] **A large file or a persisted output is read once, in ranges,** with the file-reading tool — never dumped through
      the shell and read again.
- [x] **A secret is never used or shown**: configuration is read by key, a secret's value is never printed or
      interpolated into a command, and two secrets are compared by hash or length. A credential found in the
      repository authenticates nothing: it is reported, and the agent goes on without it.
- [x] The block names no host, no tool timeout and no command (ADR 0012).
- [x] The block is byte-identical across the six files — checked by diffing it out of each.
- [x] `code-reviewer`, `spec-writer` and `tickets-writer` do not carry it.
- [x] Every touched file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap
      are kept.
