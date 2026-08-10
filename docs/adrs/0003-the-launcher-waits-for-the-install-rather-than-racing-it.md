# The launcher waits for the install rather than racing it or performing it itself

The host spawns the tools server before the session-start install has finished. The server's entry point therefore waits
for a completed install to appear and then hands over to it. It never installs anything itself, and it gives up after a
bounded wait, naming what it was waiting for.

One installer means no lock between an installer and a launcher, no two package managers running over each other, and
one place where the decision to reinstall lives. The wait is bounded against the host's own startup timeout, which is
not the plugin's to extend: waiting past it turns a slow install into a failed server either way, so the launcher gives
up first and says something a reader can act on.

## Consequences

A session that loses that race has no review tool at all. That is caught at the delivery's first check for its tools and
refused there — loudly, at minute zero — rather than surfacing in the middle of a round. The session still leaves a
correct install behind it, so the next one starts warm, which makes "start another session" the whole recovery and is
why the documentation says exactly that.
