# 01 — A ticket published to the forge's issues is its spec's native child

**What to build:** a human who refines an epic into a repository whose conventions put the spec and tickets on the
forge's issues opens the spec issue and finds every ticket listed as its child, in ticket-number order, on GitLab as on
GitHub. Each ticket names the spec as its parent. `tickets-writer` learns the property "each ticket is the spec's
native child", meaning the child item the forge itself lists under the spec. It gets two worked examples, a GitHub
sub-issue and a GitLab Task whose parent is the spec issue, and the rule that a ticket takes the child type a forge's
issues accept where that is not the issue type. ADR 0012 bounds the wording: the forge names illustrate, and no
behaviour turns on which forge is in play. Each ticket is linked in the same step that publishes it. The existing
**Spec** line rule holds. The ready-for-agent label goes on the child. A resumed run leaves published tickets exactly
as found and publishes the rest as children. The report says whether each ticket is a child and names the child type
where it differs from the issue type. Settled in `../spec.md` § Solution and § Implementation Decisions. Stories 1–6
and 9–16.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `tickets-writer`'s section on numbers and the tracker states the native-child property, and says that a
      mention, a cross-reference or a `relates to` link is not a child.
- [x] The rule that a ticket takes the child type a forge's issues accept is stated as a property of the forge, and
      no sentence in the agent branches on a named forge.
- [x] The GitHub example creates the ticket as a sub-issue of the spec issue. The GitLab example creates a Task with
      its parent, labels and description in one call, since the forge CLI's work-item creation sets no parent or label.
- [x] Step 6 links each ticket as a child before the next is published.
- [x] The resume paragraph says a published ticket's type and links stay as found.
- [x] The report says, beside where the tickets are published, whether each is the spec's native child, naming the
      child type where it is not the issue type.
- [x] **GitLab arm, by hand:** one `tickets-writer` dispatch against a throwaway project on a GitLab without Epics,
      with forge-issue conventions and a spec issue already published. Every ticket is a Task whose parent is the spec,
      the spec's Child items list them in number order, each carries the ready-for-agent label, and none carries a
      **Spec** line.
- [x] **GitHub arm, by hand:** the same against a throwaway GitHub repo. Every ticket is a sub-issue of the spec, in
      number order, with no **Spec** line.
- [x] **One `implementer` dispatch, by hand,** on the GitLab arm, handed one child-Task ticket. It reads the ticket by
      number, reaches the spec through the parent, and commits with a `Ticket:` line. Whether a closing reference on
      the merged change request closes the Task is recorded under `## Comments`. Where the implementer cannot reach
      the spec through the parent, that is recorded as a fork and not worked around in this ticket.
- [x] `/mattpocock-skills:writing-for-agents` was used for the edit.
- [x] Typecheck and lint pass in both packages.

## Comments

**Hand checks, 2026-10-29**, each dispatching `tickets-writer` top-level from the branch's prose through `--agents`.

- **GitLab arm** (`gitlab.audienzz.ch`, CE 19.5.1, no Epics, `valentin.fedoskin/deliverer-handcheck-children`):
  - At 5f9fd32 it failed twice. Every child Task kept its **Spec** line, and the spec's children read back 4, 3, 2,
    because GitLab lists a newly attached child first.
  - c5a57bf fixed both: an explicit "a child ticket carries no Spec line", and a move after the child numbered before
    it, through `workItemsHierarchyReorder`.
  - Re-run on spec #5 ($0.54): #6, #7 and #8 are Tasks with parent #5, read back 6, 7, 8, each carries
    `ready-for-agent`, and none has a **Spec** line. **Blocked by** stays a prose line, since the forge refused a
    native block link.
- **GitHub arm** (`slamdev/deliverer-handcheck-github-20261029000524`):
  - Spec #1 ($0.49): #2 to #5 are sub-issues in number order.
  - Spec #6 at c5a57bf ($0.44): #7 to #9 are sub-issues in number order.
  - All carry `ready-for-agent` and none has a **Spec** line. GitHub's own blocked-by links replaced the **Blocked by**
    line, which the existing rule allows.
- **Implementer dispatch** (GitLab, ticket #2, a child Task, $0.23): it read the ticket with `glab issue view 2` and
  committed `595d503` with `Ticket: 2` to the epic branch. Merging !1 with `Closes #2` **closed the Task**, which settles
  the spec's first open fact.
- **Fork, recorded and not worked around:** `glab issue view` reads a Task but shows **no parent**, in either its text
  or JSON output. The implementer reached the spec through the prompt and a leftover **Spec** line, never through the
  parent. Now that a child carries no **Spec** line, an implementer handed only the ticket number has no route to the
  spec unless it queries the work item's hierarchy. Story 10 needs a follow-up: either `implementer` learns to read a
  ticket's native parent, or the dispatch prompt names the spec.
- **Noted, out of scope:** the agent writes scratch files to fixed `/tmp` paths and ignores `TMPDIR`, so two
  dispatches on one machine collided once.
