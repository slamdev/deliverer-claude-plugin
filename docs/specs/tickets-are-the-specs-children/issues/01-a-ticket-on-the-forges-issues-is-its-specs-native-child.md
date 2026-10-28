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

- [ ] `tickets-writer`'s section on numbers and the tracker states the native-child property, and says that a
      mention, a cross-reference or a `relates to` link is not a child.
- [ ] The rule that a ticket takes the child type a forge's issues accept is stated as a property of the forge, and
      no sentence in the agent branches on a named forge.
- [ ] The GitHub example creates the ticket as a sub-issue of the spec issue. The GitLab example creates a Task with
      its parent, labels and description in one call, since the forge CLI's work-item creation sets no parent or label.
- [ ] Step 6 links each ticket as a child before the next is published.
- [ ] The resume paragraph says a published ticket's type and links stay as found.
- [ ] The report says, beside where the tickets are published, whether each is the spec's native child, naming the
      child type where it is not the issue type.
- [ ] **GitLab arm, by hand:** one `tickets-writer` dispatch against a throwaway project on a GitLab without Epics,
      with forge-issue conventions and a spec issue already published. Every ticket is a Task whose parent is the spec,
      the spec's Child items list them in number order, each carries the ready-for-agent label, and none carries a
      **Spec** line.
- [ ] **GitHub arm, by hand:** the same against a throwaway GitHub repo. Every ticket is a sub-issue of the spec, in
      number order, with no **Spec** line.
- [ ] **One `implementer` dispatch, by hand,** on the GitLab arm, handed one child-Task ticket. It reads the ticket by
      number, reaches the spec through the parent, and commits with a `Ticket:` line. Whether a closing reference on
      the merged change request closes the Task is recorded under `## Comments`. Where the implementer cannot reach
      the spec through the parent, that is recorded as a fork and not worked around in this ticket.
- [ ] `/mattpocock-skills:writing-for-agents` was used for the edit.
- [ ] Typecheck and lint pass in both packages.
