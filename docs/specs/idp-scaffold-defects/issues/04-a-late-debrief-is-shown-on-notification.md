# 04 — A debrief finalised after `Stop` is shown on `Notification`

**What to build:** a human whose debrief was finalised after their run returned sees it announced while the session
sits waiting for input, without typing a prompt. The hook is registered for `Notification` and prints this session's
pending stop announcement there, as `Stop` does; the next-prompt route stays as the fallback. Settled under **The
Notification announcement** in `../spec.md`.

**Blocked by:** 03 — it is what makes a debrief finalised after `Stop` the ordinary case.

**Status:** ready-for-agent

- [ ] First, verified by hand: whether the host renders a `Notification` hook's `systemMessage` to the human. The answer
      and how it was reached are recorded under `## Comments` below.
- [ ] If it does not render, nothing ships: the ticket closes with that finding, and `../spec.md`'s Solution item 4 is
      marked as dropped on it.
- [ ] If it renders: the hooks manifest registers the hook script for `Notification`, with the same short timeout the
      other observer events carry.
- [ ] `Notification` prints this session's pending stop announcement and nothing otherwise, never fails the session,
      and waits on nothing.
- [ ] An announcement printed on any event is never printed again on another.
- [ ] Driven by hand: a debrief finalised after `Stop` is printed on the next `Notification`, once.
- [ ] The hook script's header comment names the fourth event and why it is there.
