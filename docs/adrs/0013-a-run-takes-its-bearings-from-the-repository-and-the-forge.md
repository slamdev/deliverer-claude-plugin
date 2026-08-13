# A run takes its bearings from the repository and the forge, never from a state file

Every stage of a **run** is interruptible and resumable, and a resumed run works out how far the last one got by reading
what exists: the artifacts on disk, the commits on the **epic branch**, and whether a **change request** is open for the
branch. The plugin keeps no progress file, no checkpoint and no state of its own between runs.

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

Two stages leave a mark that is durable without being legible to the **orchestrator**, and they take the round's
treatment for the same reason. An adjudication and a **fix wave** both leave their record in a **comment**'s replies,
and telling a **verdict** that owes a change from a reply recording the change made is a judgement about what those
replies say rather than a fact about the forge — so it is not the orchestrator's to form. It counts no comments: on a
resumed run it dispatches both again and each reads its own filter, spending a dispatch whenever the position is in
doubt exactly as it spends a round. The marks themselves still matter, and to the agents that leave them: they are why
that re-dispatch adds only what is missing rather than a second copy.

A refinement conversation is the other exception. It leaves nothing behind but the document written from it, so when
that document is gone the conversation is owed again.
