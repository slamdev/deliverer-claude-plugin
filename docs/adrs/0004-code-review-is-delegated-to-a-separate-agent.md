# Code review is delegated to a separate agent behind a start, poll and cancel contract

A round is performed by a separate agent, run out of process, and driven through three operations: start a review and
get a handle back immediately, poll that handle for status, and cancel it. Nothing arrives unsolicited, so polling is
the only way to observe progress, and only the poll reports a result.

The platform's own review cannot be reached from inside the run that needs it, and a round takes long enough that
holding a call open for its whole duration is not an option. Returning a handle before the work exists is what makes a
round addressable: the caller may supply the handle's id, so it holds the handle before anything can go wrong, and a
retry under that id addresses the same review rather than starting a second one.

A round that finds problems is a successful call. Only a call that could not be answered at all — an unknown handle, a
malformed URL, a second review while one is in flight — is an error, so a review's own failure is reported as a fact
about the review rather than as a failure of the question.
