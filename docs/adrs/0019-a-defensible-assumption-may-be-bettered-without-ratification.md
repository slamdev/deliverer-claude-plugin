# A defensible assumption may be bettered without ratification

An **assumption** whose choice is defensible still receives a **verdict** that changes the code. Where the adjudication
finds a better road on a named **axis**, that verdict is `improve`: it carries a **directive**, the **fix wave**
implements it, and nothing ratifies the change before it lands. The human meets it on the branch and in the **run**'s
**report**, one line for each one the wave implemented.

The adjudication reaches it by comparing roads rather than by checking one. For every assumption it names the
alternatives the **fork** left available and judges them on what each does under failure, under an adversary, at the
limits, to the caller's contract, and to what the caller sees when it goes wrong — with how expensive the code is to
change later breaking a tie between those and never carrying a verdict on its own. Where two axes disagree it weighs
them for that fork alone and says in the reply which won and why. Where the assumed choice wins, the verdict is `accept`
and the reply names the roads it beat.

## Grounds

A verdict set that can only say *wrong* cannot say *better*. The legwork behind it could only check conformance — what
the **ticket** asked, what the code does, the conventions, the callers, the other assumptions — so nothing in it ever
produced the alternative a choice would have to be better than, and across a dozen delivered **epic**s nearly every
assumption was accepted. That is the instruction working rather than failing, which is why what changes is the legwork
and the verdict set rather than the bar on the verdict that already existed.

What a review is worth says the same thing from outside the plugin. Across 759 defects classified from nine industrial
and 23 student code reviews, 75 per cent did not affect the software's visible functionality at all; they made it easier
to understand and to change — Mäntylä and Lassenius, IEEE Transactions on Software Engineering, 2009. Hundreds of
classified review comments at one large vendor put the creation of alternative solutions among review's documented
products, beside knowledge transfer and finding defects — Bacchelli and Bird, ICSE 2013. An adjudication that only
rejects what is wrong forgoes the larger part of what the reading is worth.

**Grounds** does not move, and that is why this is a fourth verdict rather than a wider bar on the third. Grounds is a
spec line, an ADR, a caller that breaks or a concrete failure scenario, and never taste — and a declined **review
finding**, a reopened ADR and a **defect** all rest on it too, so widening it here would widen it everywhere. An
`improve` stands on an axis instead.

## Consequences

The run redesigns code nobody ratified, and nothing bounds how often. Three ways of avoiding that were available and
each was rejected for a reason:

- **Naming the better road without taking it** was rejected because the code already exists by then. A road named and
  not taken costs the human a further run to take, which is less than the reading was worth.
- **Taking it only where the choice is expensive to reverse** was rejected because that filters out the ordinary case:
  the cheap improvement a reader would have taken in a second and which nobody now takes at all.
- **Putting the fork to the human mid-run** was rejected because a delivery runs unattended by design. What it cannot
  close becomes an **escalation**, and an interview in the middle of one would make a human sit through the whole run.

So the report line is the only control there is, and it is load-bearing rather than decorative: it is where a human
learns that code they would have called finished was changed on a judgement nobody checked. What that line carries is
the **fix wave**'s own account of what it implemented, because a directive the wave declined or never reached is not a
change to the code. Implementing one is the default and declining it takes grounds, exactly as a review finding does —
a directive that cannot land needs a legal move that is not stalling.

The **round**s keep their scope and overlap this deliberately. A round reads the code as written and is never told a
fork existed; the adjudication reads the fork and never sees the round's findings. Two stages proposing the same change
costs a round's tokens, where either one deferring to the other costs a change neither of them makes.

There is no owner setting that turns this off. One that half the runs had set would make the design unmeasurable, and
that is the cost that cannot be paid while the report line is the only bound there is.
