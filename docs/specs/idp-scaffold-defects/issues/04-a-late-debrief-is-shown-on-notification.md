# 04 — A debrief finalised after `Stop` is shown on `Notification`

**What to build:** a human whose debrief was finalised after their run returned sees it announced while the session
sits waiting for input, without typing a prompt. The hook is registered for `Notification` and prints this session's
pending stop announcement there, as `Stop` does; the next-prompt route stays as the fallback. Settled under **The
Notification announcement** in `../spec.md`.

**Blocked by:** 03 — it is what makes a debrief finalised after `Stop` the ordinary case.

**Status:** wontfix

- [x] First, verified by hand: whether the host renders a `Notification` hook's `systemMessage` to the human. The answer
      and how it was reached are recorded under `## Comments` below.
- [x] If it does not render, nothing ships: the ticket closes with that finding, and `../spec.md`'s Solution item 4 is
      marked as dropped on it.
- [ ] If it renders: the hooks manifest registers the hook script for `Notification`, with the same short timeout the
      other observer events carry.
- [ ] `Notification` prints this session's pending stop announcement and nothing otherwise, never fails the session,
      and waits on nothing.
- [ ] An announcement printed on any event is never printed again on another.
- [ ] Driven by hand: a debrief finalised after `Stop` is printed on the next `Notification`, once.
- [ ] The hook script's header comment names the fourth event and why it is there.

## Comments

**It does not render.** The host runs a `Notification` hook and discards its `systemMessage`; nothing reaches the
human. Per the drop path nothing ships: no `hooks.json` registration and no hook-script change. `../spec.md`'s
Solution item 4 is marked dropped. The remaining five boxes don't apply.

How it was reached, on Claude Code 2.1.311 with `--model haiku`, in a throwaway project under `/tmp/idp-04/probe`:

- A project `.claude/settings.json` registered one `Notification` command hook (timeout 10). The hook appended its
  stdin to a log and printed `{"systemMessage":"NOTIF-PROBE"}`. An interactive `claude --permission-mode default` ran
  in a detached tmux session, and its pane was read with `tmux capture-pane -S -200`.
- `permission_prompt`: a prompt asked for `touch /tmp/idp-04/probe/x`. The hook fired; its stdin carried
  `"hook_event_name":"Notification","notification_type":"permission_prompt"`. NOTIF-PROBE did not show, either while the
  permission dialog was up or after it was approved and the turn ended.
- `idle_prompt`: the session sat idle about a minute. The hook fired (`"notification_type":"idle_prompt"`), and
  NOTIF-PROBE did not show.
- Control: in a second session the same script (printing `STOP-PROBE`) was also registered for `Stop`. After a trivial
  prompt the pane showed `⎿  Stop says: STOP-PROBE`, so the probe's output shape renders when the event honours it.
  The hook then fired again on `idle_prompt` and nothing showed. One more prompt after that showed only the Stop line,
  so the Notification message is not shown late on the next turn either. Neither session record contains NOTIF-PROBE.
- Docs: the hooks reference (code.claude.com/docs/en/hooks) lists `Notification` under "No decision control. Used for
  side effects like logging or cleanup". It also says `terminalSequence` "works on events that discard `systemMessage`
  and `continue`, such as `Notification` and `StopFailure`".

Not pursued: `terminalSequence` (for example an OSC 777 desktop notification) is the one output the host honours on
`Notification`. It is a different feature from printing the announcement, it depends on the terminal, and it is out of
this ticket's scope.
