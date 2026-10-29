# 02 — A refused child link falls back to a plain ticket and is reported

**What to build:** a human whose forge refuses to make a ticket the spec's child, whether because the child type is
disabled on the project, the forge is too old, or the token lacks the permission, still gets the whole epic published.
That ticket goes out the way tickets do today, a plain ticket carrying its **Spec** line, at the number it would have
had. Publishing goes on to the next ticket, and the report names every ticket published without a parent and the
forge's reason. Settled in `../spec.md` § Implementation Decisions, "Refusal falls back per ticket". Stories 7–8.

**Blocked by:** 01 — A ticket published to the forge's issues is its spec's native child.

**Status:** ready-for-agent

- [x] Step 6 of `tickets-writer` says that a refused child link publishes that ticket without a parent, keeping its
      **Spec** line, and that publishing continues rather than stopping.
- [x] The report lists every ticket published without a parent, with the reason the forge gave.
- [x] **By hand:** one dispatch against a GitLab project where the Task type can't be created or the token can't set a
      parent. The ticket is a plain issue carrying its **Spec** line at the expected number, later tickets are still
      published, and the report names the refusal.
- [x] Typecheck and lint pass in both packages.

## Comments

**Hand check, 2026-10-29** (`gitlab.audienzz.ch`, `valentin.fedoskin/deliverer-handcheck-refusal-task`, $0.61):
- The spec was published as a Task, so GitLab refused every child link with "#1 cannot be added: it's not allowed to
  add this type of parent item".
- #2, #3 and #4 were published as plain Issues with no parent, each carrying its **Spec** line and `ready-for-agent`.
- Publishing went on past each refusal, and the report quotes the forge's reason for each ticket.

Three other ways of producing a refusal were tried first:
- **A confidential spec** (`deliverer-handcheck-refusal`). A manual probe was refused ("cannot assign a
  non-confidential task to a confidential parent"). The agent instead made its Tasks confidential, and all three
  were linked as children, so nothing fell back. The prose neither allows nor forbids changing a ticket's attributes
  to win the link. Left as is: confidential tickets under a confidential spec are arguably right.
- **A Guest-level project token** and **a closed, locked parent**. GitLab accepted the child link in both cases.
