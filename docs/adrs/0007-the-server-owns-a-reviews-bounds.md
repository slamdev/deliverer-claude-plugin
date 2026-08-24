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
same way, and its failure text names which bound ended it. Only the cap is published as a figure — the idle bound is
documented where a caller reads the published one, so that it can be learned before a round ends on it.

There is no configuration under which a review runs unbounded, and adding one would reintroduce precisely the failure
the bounds exist to prevent.

## Amendment

The bound used to be a single fixed hour, and its grounds argued from a round measured near two minutes at the shipped
depth: an hour sat far above anything observed. That measurement was taken on a twenty-line diff, and an epic is a
different order of input. Two rounds against one observed 66-file, 1.17 MB change request were aborted at the hour
while still emitting events — 273 of them — so the bound whose whole job is to report a wedged review was instead
killing reviews that were plainly working, and the run it belonged to received no review on any axis.

So elapsed time stopped being the signal. What the server can actually tell a working review from a wedged one by is
silence, and it already publishes the two figures that measure it — how many events have landed and when the last one
did — so the bound that catches the failure now measures exactly that: silence, with nothing arriving. The hour
became the four-hour cap, kept only so that no configuration reaches "never", and that cap is the figure the status tool
goes on publishing under the name it always had. One review at a time is unchanged, and so is the refusal to let an
owner tune any of it.
