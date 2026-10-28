# 02 — A refused child link falls back to a plain ticket and is reported

**What to build:** a human whose forge refuses to make a ticket the spec's child, whether because the child type is
disabled on the project, the forge is too old, or the token lacks the permission, still gets the whole epic published.
That ticket goes out the way tickets do today, a plain ticket carrying its **Spec** line, at the number it would have
had. Publishing goes on to the next ticket, and the report names every ticket published without a parent and the
forge's reason. Settled in `../spec.md` § Implementation Decisions, "Refusal falls back per ticket". Stories 7–8.

**Blocked by:** 01 — A ticket published to the forge's issues is its spec's native child.

**Status:** ready-for-agent

- [ ] Step 6 of `tickets-writer` says that a refused child link publishes that ticket without a parent, keeping its
      **Spec** line, and that publishing continues rather than stopping.
- [ ] The report lists every ticket published without a parent, with the reason the forge gave.
- [ ] **By hand:** one dispatch against a GitLab project where the Task type can't be created or the token can't set a
      parent. The ticket is a plain issue carrying its **Spec** line at the expected number, later tickets are still
      published, and the report names the refusal.
- [ ] Typecheck and lint pass in both packages.
