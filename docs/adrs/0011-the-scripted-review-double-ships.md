# The scripted review double ships with the plugin

A second review implementation ships alongside the real one. It replays a canned timeline of events, in milliseconds and
for free, and is selected through the same environment the server already reads for its other settings — so it needs one
variable set and no model, no forge and no money.

It is the only way the review lifecycle is verified. There is no test suite, and the behaviour that matters most —
cancellation, events arriving out of order, a terminal status absorbing what follows it, the deadline — costs minutes
and real money to exercise against a real review, which is why it would never get exercised. The double answers all of
it in seconds. The real review is the default, and always: a server that silently replayed a script would report a clean
round nobody ran.

## Consequences

Test scaffolding lives inside a distributed artifact, and that is the trade. It also sets a limit on the double: because
it ships, it may not grow knobs whose only purpose is to provoke failures. A fault-injection switch would reach defects
the double otherwise cannot, and it is refused on exactly that ground — which leaves a small number of deliberately
defensive behaviours unreachable from any test. Those are marked where they live so that nobody deletes them as dead
code.
