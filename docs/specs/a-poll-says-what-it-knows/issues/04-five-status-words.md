# 04 — Five status words

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** the statuses a **round** can hold name only states it can actually be in. `pending` is unreachable
through either tool: a record opens in it, and the real backend's first act inside its own start is to report
`preparing` — synchronously, before the handle is read back from the store. So no caller has ever seen the word, and
only a script could produce it. Settled as D14 and D15 in `../spec.md`.

- [x] `pending` is gone from the status type and from the published tuple of statuses, leaving five words.
- [x] A record opens `preparing`, which is honest for both of the states that word now covers: the server has accepted
      the review and is starting the backend.
- [x] A `text` event promotes `preparing` to `running`. This is the one behavioural difference the retirement forces —
      the branch it replaces promoted `pending` — and it is right for the same reason that one was: an inner agent
      saying something is running.
- [x] The terminal statuses and the absorption rule are untouched.
- [x] Every comment that names `pending` is corrected rather than left describing a word that is gone, the store's own
      eviction note among them.
- [x] Verified against the scripted backend: a review polled immediately after starting reads `preparing`, a script
      whose first event is text reads `running`, and no answer ever reads `pending`.
- [x] `typecheck` and `lint` pass in `plugin/mcp`; each file's register and column width are matched.
