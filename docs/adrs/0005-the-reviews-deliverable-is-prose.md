# The review's deliverable is prose

A round reports the reviewer's prose and nothing structured. The review posts its own findings as comments on the change
request, and nothing downstream consumes a machine-readable result.

## Grounds

Asking the reviewer for a structured output format was measured at roughly 1.7 times the money and 1.9 times the
wall-clock to return zero findings while still reporting success — a silent failure with nothing to detect it by. There
is also nothing to parse for: the comments are posted by the reviewer itself, and the prose is what a human reads.

## Consequences

A round's verdict and its finding count read unknown on every real review, completed or not, and the prose is the whole
result a round carries. A reader will meet that absence and want to close it with a findings parser, a second turn that
extracts them, or a tool the reviewer reports findings through. None of those should be added.

Reading what a round **spent** is not an exception. Those figures say what the review cost and never what it found, so
no judgement is extracted and no structure of the reviewer's own is consumed. They are worth reading because nothing
else can see them: a run's own accounting sees only the agent that sat waiting, which on one measured epic was fifty
cents against the eight dollars sixty-one the review behind it spent.
