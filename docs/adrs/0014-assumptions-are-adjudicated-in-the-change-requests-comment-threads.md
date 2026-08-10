# Assumptions are adjudicated in the change request's own comment threads

A **fork** the implementing code closed silently is recorded in the commit that closed it, mirrored into a **comment**
on the **change request** under a fixed prefix that marks it out from every other comment, and adjudicated by a reply
carrying exactly one **verdict** — accept, override or escalate. That exchange lives in the comment threads and the
plugin stores none of it anywhere else.

It puts every silent decision in front of the human who merges, in the place they are already reading, and it gives the
stages downstream a filter they can trust: unresolved is exactly the work still owed.

Resolution state alone is not enough to read a verdict from, which is why the verdict is a reply rather than a state
change — an **override** and an **escalation** both leave their comment deliberately unresolved, the first because a
**fix wave** owes it a change and the second because a human does.
