# Assumptions are adjudicated in the change request's own comment threads

A **fork** a **ticket**'s code closed silently is recorded in the commit that closed it, mirrored into a **comment** on
the **change request** under a fixed prefix that marks it out from every other comment, and adjudicated by a reply
carrying exactly one **verdict** — accept, improve, override or escalate. That exchange lives in the comment threads
and the plugin stores none of it anywhere else. A fork a **fix wave** closed is the one that is not mirrored — see the
amendment.

It puts every silent decision in front of the human who merges, in the place they are already reading, and it gives the
stages downstream a filter they can trust: unresolved is exactly the work still owed.

Resolution state alone is not enough to read a verdict from, which is why the verdict is a reply rather than a state
change — an **improve**, an **override** and an **escalation** all leave their comment deliberately unresolved, the
first two because a **fix wave** owes them a change and the last because a human does.

## Amendment

This held for every fork on a branch while every commit on a branch was a **ticket**'s. A **fix wave** commits after the
mirroring and the adjudication have both run, so a fork it closes has nothing left to mirror it and nothing left to
adjudicate it: a comment posted for one would be a fork no verdict can reach, and the next wave would collect it as a
**hand-off** nobody can close.

So the scope narrows to what it was always about — the forks a ticket's commits recorded. A fork a fix wave closed is
recorded in that wave's own commit and nowhere else, and it ships **unratified**: the human meets it on the commit and
in the run's **report**, rather than as an adjudicated comment. That is the same reasoning as the rule above, not an
exception to it — the commit is where this design already puts what has to survive, and an assumption in front of nobody
is worse than one in front of a human reading a commit. What is unchanged is everything about an assumption that *is*
mirrored: the prefix, the reply carrying exactly one verdict, and the plugin storing none of it anywhere else.
