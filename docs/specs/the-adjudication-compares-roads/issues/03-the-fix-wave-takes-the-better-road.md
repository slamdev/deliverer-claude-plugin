# 03 — The fix wave takes the better road

Status: ready-for-agent

**Blocked by:** 01 — the verdict has to exist before a wave can be told what to do with it.

**What to build:** a **fix wave** meeting an `improve` implements the **directive** it carries, and says in its
**report** what it implemented. Declining is available and costs **grounds**, so a directive that cannot land has a
legal move that is neither stalling nor forcing something worse onto the branch. Settled as D9 and D10 in `../spec.md`.

- [ ] `improve` joins the verdicts that decide the wave's work, beside `override`: the reply states the change, and the
      wave implements that directive.
- [ ] An `improve` is work **owed** rather than work done, so a comment carrying one is collected however that verdict
      was replied — the sentence that says this for `override` and `escalate` covers four verdicts.
- [ ] Implementing it is the default and declining takes grounds, exactly as a **review finding** does. A declined one
      rides the report's existing declined line rather than a new one.
- [ ] The report names every `improve` it implemented, one line each: the fork, the road taken and the **axis**.
- [ ] An `improve` may reach the **hand-off** list the way any unresolved comment may, and the report says so when it
      does.
- [ ] The wave's own commits still record the forks it closed silently and still carry no `Ticket:` line. Implementing a
      directive is executing one, not closing a new fork, so nothing new is mirrored for it.
- [ ] The agent's own test of doneness reaches an `improve`: it stops when every collected comment has a fix, a reply or
      a place on the hand-off list, and an `improve` must fall inside that condition rather than beside it.
- [ ] Register and column width matched.
