# 11 — Record a fix wave's own forks and red gates on its commit

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a **fork** a fix wave closed silently is recorded where every other durable fact about this branch
is recorded — on the commit — and nothing pretends it will be adjudicated. In an observed run a fix wave's commit
carried two assumptions that had no comment and so could never receive a **verdict**, and they were caught only because
that wave's report happened to mention it. The wave was never told to record them either: it copied the format off the
branch. Settled as D21 and D24 in `../spec.md`.

- [ ] `comments-addresser` has a commit format of its own, in a section of its own. It has none at all today: step 5
      sends it to "the project's conventions and the nearest existing call sites", which is how the observed wave came
      to copy the implementer's format off the branch rather than being given one.
- [ ] The format carries **no** `Ticket:` line, and says so and why — the commit is not a ticket's work. The delivery
      skill counts tickets by that line in two places, **Resume** ("one without it is not a ticket") and **Progress**
      ("how many tickets the `Ticket:` lines name"); neither needs anything from *this* ticket, and the absence is also
      what `change-request-creator` discriminates on below. Both sentences do change, for ticket 09's reason rather
      than this one's: interleaved commits make a present `Ticket:` line mean a ticket *begun* (PR #4 review, recorded
      on 09).
- [ ] It records the forks the wave closed as **assumption** entries in the same shape the implementer's commits use —
      numbered, with `file:`, `line:`, `assumed:` and `reason:` — and omits the `Assumptions:` section when there were
      none.
- [ ] That same section carries the bar for what counts, rather than a section of its own: a different reasonable
      engineer could have gone the other way, **and** going the other way would change behaviour the spec cares about.
      The entry shape without the bar is an invitation to record taste. `implementer` keeps its own fuller treatment,
      and the two are not cross-referenced — each agent's instructions are complete on their own.
- [ ] The format carries a `Gates:` section too, in the implementer's shape, gone when every gate is green. The wave
      commits, so **gates** apply to it; the delivery skill reads `Gates:` off every commit on the branch every run;
      and `comments-addresser.md` does not mention a gate once — so a gate a wave leaves red is today recorded nowhere.
- [ ] What a wave may leave red is stated, because its boundary is not the implementer's. It has no ticket, so what
      stays red is a gate for work **no comment asked for**, and the entry's `outside:` field names that work.
      Everything a comment did ask for is the wave's to turn green — implementer step 3 already hands it the gates that
      agent left red.
- [ ] The wave's **report** names every gate it left red, one line each, the way the implementer's does.
- [ ] The delivery skill's stage 4 says nothing mirrors or adjudicates what a fix wave recorded, so no stage is owed
      for it. Stage 6 inherits that without restating it.
- [ ] `change-request-creator` stops mirroring those entries, or the sentence above is false in shipped code. Its step
      5 mirrors "every assumption the branch's commits recorded", discriminating on the `Assumptions:` section name
      alone and de-duplicating per entry rather than per author, while the skill's **Resume** says re-dispatching it is
      safe — so a resumed run puts a wave's entries in front of the human as `ASSUMPTION` comments after the
      adjudication stage has already run, and the second wave collects them as hand-offs nobody can close. Scope that
      mirror to commits carrying a `Ticket:` line. Step 2's sentence — the commits are "the whole source for the title,
      the description and the assumptions" — changes with it rather than standing false beside it.
- [ ] The consequence is stated rather than implied, in the agent and in the README: such a fork ships unratified, and
      a human meets it on the commit rather than as an adjudicated comment. The delivery skill does not need it — the
      orchestrator forms no judgement on it either way.
- [ ] The README's promise that every silent judgement call is adjudicated is narrowed to the implementation stage.
- [ ] `CONTEXT.md`'s **Gate** entry is widened: "a gate red for work outside the ticket" is ticket-framed, and the rule
      now has two holders with different boundaries. This is a separate edit from D23's **Round** amendment already in
      the working tree, which is neither reverted nor re-added.
- [ ] The delivery skill's two ticket-framed gate sentences go with it — the `Gates:` paragraph ("a gate its ticket
      left red for work outside it") and the report bullet ("every gate left red for work outside its ticket"). A fix
      wave's commit has no ticket, so both read false of exactly the commits this ticket creates (PR #4 review).
- [ ] What a wave may leave red is told apart from what it inherits by **when the gate went red**, not by what the gate
      waits on: a gate an earlier commit handed down and a gate the wave's own work left red are both "red for work no
      comment asked for", so one illustration cannot carry both and the wave is left choosing (PR #4 review).
- [ ] ADR-0014 is amended, which makes four rather than D22's three. It states unconditionally that a fork the
      implementing code closed silently is mirrored into a comment and adjudicated by a verdict, which this ticket
      makes false for every fork a wave closes — and the repository's rule is that the ADR is the one place a decision
      changes, so a carve-out living only in two agent contracts, a README bullet and a matcher comment is one the next
      reader of 0014 will not find. The amendment says what changed and why, in the shape D22's other three take
      (PR #4 review).
- [ ] What the wave reports is otherwise unchanged — its commits, declined findings with **grounds**, every
      **hand-off**, and whether the **checks** ended green.
- [ ] Register and the file's prevailing column width are matched. `comments-addresser.md` wraps at 120 with three
      lines sitting exactly on it; count characters, not bytes, since the file's em-dashes are three bytes each.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-23 — stays `ready-for-agent`; the claim verifies in full, and seven questions are settled. The ticket
as written would have had an implementer write a false sentence into the delivery skill. Seven criteria became
fourteen, and the title widened to name the gates.**

**Every part of the claim checks out, and the mechanism is where the ticket says it is.**
`plugin/agents/comments-addresser.md` carries no commit format at all — its step 5 says only "following the project's
conventions and the nearest existing call sites", which is precisely the instruction that produced the copied format
D21 describes. `plugin/agents/implementer.md:56–75` holds the only commit format in the plugin. The delivery skill
mirrors assumptions at stage 2 and dispatches the first fix wave at stage 4, so nothing mirrors what a wave records.
`README.md:27–28` carries the adjudication promise verbatim. Searched by domain concept rather than the request's
wording — commit format, `Ticket:`, `Assumptions:`, `Gates:`, mirror — nothing in `plugin/` implements any of this, and
no `.out-of-scope/` exists, so there is no prior rejection to weigh.

**The blocking defect: criterion 3 was not true of shipped code, and this ticket could not have made it true.**
`change-request-creator` step 5 mirrors "every **assumption** the branch's commits recorded", discriminating on the
`Assumptions:` section name alone — its one exclusion is that "a commit may carry other sections numbering their
entries just the way this one does" — and de-duplicating per entry, not per author. The delivery skill's **Resume**
then says re-dispatching any agent but `code-reviewer` is safe. So on a resumed run, which is the case this whole spec
exists for, a re-dispatched `change-request-creator` would mirror a fix wave's entries into `ASSUMPTION` comments after
stage 3 had already run, and the second wave would collect them as unadjudicated **hand-offs**. Writing "nothing
mirrors them" into the skill while that contract stands makes the skill false. On your call the mirror is scoped, and
step 2's sentence promising the commits are the whole source of the assumptions changes with it.

**The `Ticket:` line had no answer in the ticket and three inequivalent ones available.** D21 requires the format to
state what that line carries; the ticket restated the requirement without settling it. Carrying the fixed code's ticket
number asks the wave to guess, since a **review finding** often spans tickets or none. A marker naming the fix wave
inflates **Progress**'s numerator, which counts "how many tickets the `Ticket:` lines name". On your call there is no
line, said explicitly — which leaves both of the skill's counting sentences correct untouched, **Resume**'s "one
without it is not a ticket" doing the work for free, and hands the scoped mirror its discriminator.

**D21's gate clause was ambiguous, and reading it as decorative would have left a real hole.** "A **gate** left red is
recorded the same way" reads either as precedent for using the commit or as a second requirement. On your call the
format carries `Gates:`. The hole is real: `comments-addresser.md` does not mention a gate once, while `implementer`
step 3 names the fix wave as the downstream owner of gates it left red, and the skill reads `Gates:` off every commit
on the branch every run. The boundary could not be borrowed — the implementer's is "outside this ticket" and a wave has
no ticket — so what stays red is a gate for work no comment asked for. That made criterion 6's freeze on the report
untenable: the report now names red gates too, matching the implementer, and the freeze covers everything else.

**Shape without the bar records taste.** Criterion 2 gave the wave the implementer's entry *shape* but not its
two-clause test, and `comments-addresser` has no equivalent of "What counts as an assumption". On your call both
clauses sit inside the new commit-format section rather than in a section of their own, and the two agents are not
cross-referenced — each file already tells its agent its instructions are complete.

**One glossary edit, deliberately scoped.** `CONTEXT.md`'s **Gate** entry says "a gate red for work outside the ticket
stays red, and is recorded on the commit as well as in the report", which is now the boundary of only one of the rule's
two holders. It is widened. `CONTEXT.md` is already modified in the working tree for D23's **Round** amendment, so the
criterion says explicitly that this is a separate edit and D23's is neither reverted nor re-added.

**Collisions checked in five directions, and none of them blocks.** Ticket 08 cites `change-request-creator` as
precedent and puts it explicitly out of scope, so this ticket is the only one writing to that file. Ticket 09 leaves
the implementer's commit format alone, and its own triage already anticipated this ticket borrowing the entry shape as
a read. Tickets 05, 06, 07 and 09 touch the delivery skill in other sentences than stage 4's. Ticket 12 edits the
README bullet immediately above this one — they land in either order, but neither should reflow the other's lines.
`assumption-reviewer` needs nothing: with the mirror scoped these entries never become comments, so it never sees them.
"Blocked by: None" therefore still holds, and D25's internal dependency — the format existing before the rule that uses
it — is satisfied inside this one ticket.

**No ADR.** A commit-message section, three contract sentences and a glossary clause are all trivially reversible, and
D21 and D24 already hold these decisions in the one place each of them changes.
