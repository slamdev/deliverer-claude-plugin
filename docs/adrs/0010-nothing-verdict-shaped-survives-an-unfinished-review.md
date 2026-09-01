# Nothing verdict-shaped survives a review that did not complete

A review's prose is reported only when the review actually completed, and any status short of that carries none of it at
all. A review that has reached a terminal status cannot be moved by anything that arrives afterwards, a cancellation
included. The verdict and the finding count this rule once named beside the prose are gone; the amendments say why.

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

## Amendment

The rule used to turn entirely on the status the run reported, and that is not enough. Measured on one real epic: two
rounds reported success while the whole of what they returned was the SDK's own failure text — a connection closed
mid-response, a prompt over the model's context — so each published as a completed review whose prose said no review
had happened, and each counted toward the two completed rounds a **change request** is **flipped ready** against. The
only way to learn they were dead was to go and look for **comments** on the change request that never came.

So a result carrying the failure text of the thing that ran it, where the review belongs, is not a completed review,
however the SDK classified it: it is a failed **round**, reported with a reason like any other failure. That detection
is fixed strings anchored at the START of the prose, and the anchoring is the trade rather than an implementation
detail — a review whose findings *discuss* a dropped connection must not fail its own round. Prose the server does not
recognise stays completed, because this only ever demotes text it can identify as the SDK talking about itself and
never text it merely finds suspicious. It extracts no judgement and consumes no structure of the reviewer's, so it is
no more a findings parser than the status field it sets is.

Nothing else moves. What a round **spent** survives a manufactured failure exactly as the Consequences above say it
survives any other, and it is worth reporting for precisely that reason: one of those two rounds burned eight dollars
before it died.

## Amendment

The rule used to have three subjects — a review's verdict, its finding count and its prose — and two of them were never
things a real review had. The deliverable is prose and nothing structured: no judgement is extracted from it, the parser
that would extract one must not be added, and so on every real **round**, completed or not, the verdict and the count
read unknown. The only thing that could ever fill either was the scripted double. A rule about them was therefore a
promise about a test double in the clothes of a promise about reviews, and the two fields had reached the point of
documenting their own emptiness to the agent that read them. Both are gone, and the rule loses them as subjects.

The word went with them, for a second reason of its own. A **verdict** in this domain is the adjudication one
**assumption** receives — accept, override or escalate — and a round has nothing of that kind to hold. Spelling one on
every **poll** of every round gave the word a second meaning inside the one product that has to keep it to a single one.

Nothing verdict-shaped is weakened by their going. What this rule was written against was never a field beside the prose
but the prose itself reading clean, so a review that did not complete carrying no prose at all is the whole of what
there is left to guard — and a stronger statement than the partial marking it replaces, which restated the status a
caller had already been handed and qualified an empty string that is now simply not sent. Terminal states still absorb
whatever arrives after them, a cancellation included. What a round **spent** still survives a failed status, and no
figure of it is ever defaulted to zero: unknown is still the honest answer, said now by the absence of the figure rather
than by a key carrying nothing.
