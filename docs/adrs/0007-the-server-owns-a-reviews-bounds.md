# The server owns a review's bounds: one at a time, and a deadline nobody can tune

One review runs at a time, and every review is bounded by a fixed deadline the server states. Neither is configurable. A
second start while one is in flight is refused, and a review still running when its deadline arrives is aborted and
reported as failed.

## Grounds

The deadline's whole job is to bound a failure, which is exactly why it is not an owner's to set. Raised, it turns a
wedged review into a wedged session; lowered, it fails honest reviews. A round measured near two minutes at the shipped
depth, so a fixed ceiling of an hour sits far above anything observed and far below "never" — which is what the range of
sensible values collapses to once nobody has to pick a number.

Serialising reviews is what makes that deadline sufficient. One slot, released only by a terminal status or by the
deadline itself, means there is no state the server can be in where it waits on something nothing is able to end.

## Consequences

A refused start has to say something its caller can act on, and "poll it or cancel it" is not that: the only shipped
caller may do neither — it is forbidden to cancel, and an agent running a later round does not hold an earlier round's
handle. So a refusal names which review holds the slot, how long it has held it, and that it ends by itself without
anyone acting.

There is no configuration under which a review runs unbounded, and adding one would reintroduce precisely the failure
the deadline exists to prevent.
