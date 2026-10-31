# 05 — A fix wave hands off a check no commit can clear, and leaves the description alone

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a **fix wave** stops waiting on a **check** no commit on the branch can clear, and hands it to the
human named with its cause. "Drive the checks green" has no case for one today: a wave outwaited a third-party outage
for 37 minutes after its work was done, and another re-ran a CI block no rerun could clear. And a wave rewrote the
change request's description, which stage 9 then rewrote again. Settled as change 4 in `../spec.md` § Solution.

The test is mechanical because `comments-addresser` runs at medium effort and is to apply it without judgement
(`../spec.md` § Modules touched).

- [ ] A check red for a cause outside the branch is a **hand-off**, named with its cause, and the wave stops waiting on
      it.
- [ ] Outside means, mechanically: the same check is red on the default branch's head, or it failed before running any
      of the branch's code. Every other red check is the wave's, one that was red before it started included.
- [ ] The wave never edits the change request's title or description; those are stage 9's.
- [ ] The file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap are kept.
