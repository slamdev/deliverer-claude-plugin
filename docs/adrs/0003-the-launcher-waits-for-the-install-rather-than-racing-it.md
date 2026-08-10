# The launcher waits for the install rather than racing it, and starts it when nothing else will

The host spawns the tools server before the session-start install has finished. The server's entry point therefore waits
for a completed install to appear and then hands over to it, giving up after a bounded wait and naming what it was
waiting for. When that wait begins with nothing installed at all, the entry point also starts the session-start install
itself, and goes on waiting for the same completed install to appear.

Waiting alone assumes an install is coming, and there is a case in which none is: a plugin installed from inside a
running session has its server spawned immediately, while the session-start event that installs fires only when a
session begins. That session waits the whole bound for something that will never happen, and the failure lands in the
middle of the documented install steps, on the one path every new owner walks.

What the entry point starts is the session-start install itself, never a package manager directly. One place still
decides whether to reinstall, and two installs in one data directory are already serialised by the lock that install
takes — an entry point and a session start racing is the case that lock was written for. The bound is unchanged and
still measured against the host's own startup timeout, which is not the plugin's to extend: waiting past it turns a slow
install into a failed server either way. It ends early only when the install this entry point started has itself
finished without producing one, because the remaining seconds are then being spent on nothing.

## Consequences

A session that loses the race still has no review tool at all. That is caught at the delivery's first check for its
tools and refused there — loudly, at minute zero — rather than surfacing in the middle of a round. An install left
running is left alone rather than killed, since killing one mid-flight strands the lock it holds; it completes in the
background and the next session starts warm, which keeps "start another session" the whole recovery.

Giving up early gives up on one case: a second install racing this one, whose package manager succeeds after this one's
failed. It takes two installs at once *and* a failure transient between them, where the commoner shape — no network,
no package manager — fails for both, and paying the full bound would stall every session on such a host before saying
so.

The entry point now reports which of these happened, because from outside they are the same empty directory: nothing was
started, something was started and is still running, it ran and failed, or it could not be started at all. Telling them
apart is most of the diagnosis, and the install's own output now reaches the same place the failure does.
