# Nothing verdict-shaped survives a review that did not complete

A review's verdict, its finding count and its prose are reported only when the review actually completed. Every one of
them reads unknown or empty otherwise, and any status short of completed is reported as partial. A review that has
reached a terminal status cannot be moved by anything that arrives afterwards, a cancellation included.

## Grounds

The failure this prevents is a clean-looking verdict on a review that never finished — an approving line sitting beside
prose describing crash-level bugs. It is the worst thing this pipeline can do: a round that reads clean is a round
nobody opens again, and a change request is **flipped ready** against rounds that completed.

Terminal states absorbing is what makes a cancellation mean anything. A reviewer's final message can arrive after the
cancellation that stopped it, and treating that as ordinary rather than as an error is the only way the status reported
stays the one the review actually holds.

## Consequences

What a round **spent** is the deliberate exception, and survives a failed status: what a round cost is a fact about the
run rather than a claim about the code, and a round that burned twelve minutes and died spent that money exactly as one
that finished did.

No such figure is ever defaulted to zero. Unknown is the honest answer for anything nobody measured, and a confident
zero reads exactly like a cheap review. The same holds for the dollar estimate, which is list-rate arithmetic rather
than an invoice — so it travels labelled with the provider that served the round, because that is what decides whether
the number is a price or a guess.
