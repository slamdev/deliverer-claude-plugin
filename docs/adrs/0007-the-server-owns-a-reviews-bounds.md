# The server owns a review's bounds: one at a time, and two bounds nobody can tune

One review runs at a time, and every review is bounded twice by figures the server states: an idle timeout of thirty
minutes with no event, and an absolute cap of four hours from the start. None of it is configurable. A second start
while one is in flight is refused, and a review still running when the first of its two bounds arrives is aborted and
reported as failed.

## Grounds

The bounds' whole job is to bound a failure, which is exactly why they are not an owner's to set. Raised, they turn a
wedged review into a wedged session; lowered, they fail honest reviews.

Which failure they bound is what decides their shape. A review nothing is coming back from reports nothing, so silence
is the signal and elapsed time is not: a round still emitting events is working, whatever its age, and aborting it is
the defect rather than the bound doing its job. So the idle timeout is the bound that catches the failure, measured from
the last event. The absolute cap catches nothing on its own account; it exists so that "never" stays out of reach,
because an inner agent emitting one event a minute for a week resets the idle clock every time. Four hours is above any
round anyone has seen finish and still finite.

**The idle figure is a judgement, and it is stated as one.** The bound has to survive the largest gap between two events
of a working review, and no such maximum was ever recorded — only an average, 26 events across 94.2 minutes. An average
says nothing about a tail, and the tail is the only thing this bound meets: an event means the inner agent called a
tool, and a review that does its work through sub-agents can spend one call on a long stretch of another agent's work.
So thirty minutes is fixed between two things that are known rather than derived from one that is not — well above the
sparsest density anyone has observed, and an eighth of the cap, so that a wedged round is half an hour of nothing rather
than four. What that leaves is stated rather than hidden: a working review whose silence crosses the bound is still
aborted, which is the failure the fixed hour had, and the maximum inter-event gap of a completed round is the one figure
that would replace this judgement with a measurement.

Serialising reviews is what makes those bounds sufficient. One slot, released only by a terminal status or by a bound
itself, means there is no state the server can be in where it waits on something nothing is able to end.

## Consequences

A refused start has to say something its caller can act on, and "poll it or cancel it" is not that: the only shipped
caller may do neither — it is forbidden to cancel, and an agent running a later round does not hold an earlier round's
handle. So a refusal names which review holds the slot, how long it has held it, and that it ends by itself without
anyone acting.

Running out of time is one cause with two ways of arriving at it, so a round aborted on either bound is reported the
same way, and its failure text names which bound ended it. Neither bound is published as a figure on a poll — both are
documented where a caller reads what the status tool does, so that either can be learned before a round ends on it.

There is no configuration under which a review runs unbounded, and adding one would reintroduce precisely the failure
the bounds exist to prevent.

## Amendment

The bound used to be a single fixed hour, and its grounds argued from a round measured near two minutes at the shipped
depth: an hour sat far above anything observed. That measurement was taken on a twenty-line diff, and an epic is a
different order of input. Two rounds against one observed 66-file, 1.17 MB change request were aborted at the hour
while still emitting events — 273 of them — so the bound whose whole job is to report a wedged review was instead
killing reviews that were plainly working, and the run it belonged to received no review on any axis.

So elapsed time stopped being the signal. What the server can actually tell a working review from a wedged one by is
silence, and a poll already reports what measures it — how many events have landed — so the bound that catches the
failure now measures exactly that: silence, with nothing arriving. The hour became the four-hour cap, kept only so that
no configuration reaches "never". One review at a time is unchanged, and so is the refusal to let an owner tune any of
it.

## Amendment

The cap used to travel on the answers as well as in the server: it was published as a figure on every poll, under a key
of its own, and the idle bound was documented beside it so that a caller could learn the bound a wedged round would more
likely end on. Neither is published now: both are documented where a caller reads what the status tool does, and no
answer a poll gives carries a bound at all.

The published figure was never something its reader could use. A caller cannot configure either bound, cannot act on
either, and is told by the refusal it meets on a second start that a round in flight ends by itself without anyone
acting — so all a figure on every answer offered was arithmetic, and arithmetic is what it invited: an agent told it has
a clock invents one, and one round that had already finished sat unnoticed for seventeen minutes by the one agent whose
whole job was to notice. Set against nothing, the same constant repeated over hundreds of answers to a long round takes
context from the one dispatch that also has to carry the review's prose back.

Two published figures used to measure silence — how many events have landed and when the last one did. There is one,
and by construction there only ever was: the record's own timestamp moves when an event is accepted and the count of
events increments with it, so the timestamp cannot differ between two answers where the count does not. The count alone
is the whole working-versus-wedged signal, and two answers agreeing on it need no clock to compare.

Nothing in the grounds above moves, because none of it ever rested on where a figure was written down. Silence is still
the signal, the idle bound still catches the failure, the cap still exists only so that "never" stays out of reach, both
bounds are still the server's own, and no owner can tune either. A refusal goes on naming both of them, because a caller
that has just been refused is the one caller with something to wait for.
