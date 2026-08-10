# Owner configuration that would change what a review is fails closed

Two pieces of owner configuration decide what a review actually is: the depth it runs at, and the environment it runs
in. When either arrives unusable, every review is refused, naming the defect and what to set instead. Neither is quietly
replaced with a default, and neither is treated as though it were absent.

## Grounds

Absence and malformation are different facts. An option nobody set leaves the shipped default in place, which is correct
and is the only thing that should happen. An option set to something unusable is a defect, and both ways of absorbing
one are silent: review at a depth nobody chose, or review as whatever identity happened to be lying around. A line in a
log nobody opens is not a refusal.

The depth is refused whatever performs the review, because it is the owner's configuration rather than any reviewer's. A
defect that only the real reviewer rejected would be a defect no cheap check could ever see.

## Consequences

The accepted cost is forward compatibility. The set of depths is enumerated, so a depth the platform adds later is
refused by a plugin published before it, and the owner's fix is a plugin update. That was chosen knowingly over failing
open on a value nobody has measured, where the review either errors outright or silently runs at its own default — the
one outcome the owner set the dial to avoid.
