# The review agent runs unrestricted inside the delivery repository

The delegated review runs with permission prompting bypassed and with nothing denied to it: no list of forbidden tools,
no per-call permission callback, and no hook that refuses anything. A review can therefore write, delete or push inside
the repository it is reviewing, and nothing in the plugin would stop it.

## Grounds

A round is unattended by design — there is nobody in the room to answer a permission prompt — and a review that cannot
read the repository, run its checks or post its findings is not a review. Every way of narrowing what it may do either
needs an answer nobody is there to give, or fixes a tool list at the moment the plugin is published, which goes stale as
soon as the reviewer's own behaviour changes.

## Consequences

This is an accepted risk rather than an oversight, and it is the largest one the plugin carries. It is bounded by where
a round runs, not by what the round may do.

One observer is installed on the review's tool calls, and it permits everything, every time. It is there because it is
the only real-time signal this seam has: the review's own message stream can stay silent for minutes while the agent
works, so without the observer a poller cannot tell a review that is working from one that is wedged. Anyone tempted to
make that observer refuse something is changing this decision rather than tightening a detail, and the decision belongs
here.
