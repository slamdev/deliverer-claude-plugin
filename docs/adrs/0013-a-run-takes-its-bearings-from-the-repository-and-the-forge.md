# A run takes its bearings from the repository and the forge, never from a state file

Every stage of a **run** is interruptible and resumable, and a resumed run works out how far the last one got by reading
what exists: the artifacts on disk, the commits on the **epic branch**, the **change request** and its comments. The
plugin keeps no progress file, no checkpoint and no state of its own between runs.

## Grounds

A state file is a second account of what happened, and the moment a run is interrupted — or a human does one of the
stages by hand — it is the account that is wrong. What actually exists cannot go stale.

It is also what makes re-dispatching a stage safe. Each stage reads what is there and adds only what is missing, so
running one twice is not a duplicate, and a run that is unsure whether a stage happened can simply run it again.

## Consequences

Anything a resumed run needs must leave a mark somewhere durable, and every stage is shaped so that it does: an
implemented **ticket** is named by the commit that implemented it, an adjudicated **assumption** carries its **verdict**
as a reply, an unresolved **comment** is work still owed.

A completed **round** is the one thing that leaves no mark — nothing on the forge counts them. A resumed run cannot
recover that count, so the rule is to spend a round whenever it is in doubt: an extra round costs time, while flipping a
change request ready on one round ships a review nobody did.

A refinement conversation is the other exception. It leaves nothing behind but the document written from it, so when
that document is gone the conversation is owed again.
