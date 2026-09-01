# The review's deliverable is prose

A round reports the reviewer's prose and nothing structured. The review's prompt instructs the reviewer to post its
**review findings** as comments on the change request, whatever forge that change request lives on; where it does not
post them, the round's prose is what carries them, and it reaches the **fix wave** unparsed. Nothing downstream
consumes a machine-readable result.

## Grounds

Asking the reviewer for a structured output format was measured at roughly 1.7 times the money and 1.9 times the
wall-clock to return zero findings while still reporting success — a silent failure with nothing to detect it by. There
is also nothing to parse for: a finding the reviewer posted is on the change request already, and one it did not post
exists only in the prose — which is what a human reads and what the fix wave is handed.

## Consequences

The prose is the whole result a round carries, and a poll publishes nothing of a judgement's shape beside it. A reader
will meet that absence and want to close it with a findings parser, a second turn that extracts them, or a tool the
reviewer reports findings through. None of those should be added.

Reading what a round **spent** is not an exception. Those figures say what the review cost and never what it found, so
no judgement is extracted and no structure of the reviewer's own is consumed. They are worth reading because nothing
else can see them: a run's own accounting sees only the agent that sat waiting, which on one measured epic was fifty
cents against the eight dollars sixty-one the review behind it spent.

## Amendment

The posting used to be stated here as a fact — the review posts its own findings as comments — and the grounds rested
on it: nothing to parse for, because the reviewer posted the comments itself. On a forge this decision was never taken
against, the posting was measured not to happen at all: the platform's review command answers that its comment flag was
ignored, prints the findings to a terminal nobody reads, and reports success. A round like that completes carrying
findings nobody can see, and counts toward the two rounds a change request is **flipped ready** against. So the fact is
now an instruction, the prose carries what the instruction does not place, and the grounds no longer lean on a posting
that may not have happened. The refusal of a structured result is unchanged, and so is every consequence of it.

## Amendment

The consequence used to open by naming two fields on a **poll** — a round's verdict and its finding count — and saying
that both read `unknown` on every real review. Neither is published now. Nothing but the scripted double could ever fill
either, so a payload carrying them stated this record's own finding as a pair of empty keys, and a field whose
documentation is an apology for its own emptiness teaches the agent reading it that there is a judgement to reason
about. Nothing in the grounds moves and nothing in the decision moves: the prose is still the whole deliverable, there
is still nothing to parse for, and the reader who meets the absence and wants to close it is still the reader this
record exists to answer. What changed is only that the absence is silence rather than a word.
