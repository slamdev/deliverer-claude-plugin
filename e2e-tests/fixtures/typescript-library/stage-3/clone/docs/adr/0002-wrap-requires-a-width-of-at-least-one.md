# wrap() requires a width of at least 1

`truncate()` accepts a width of `0` and answers it sensibly — nothing fits, so you get an empty result and the
text is knowingly discarded. `wrap()` discards nothing, so a width of `0` has no answer: under the hard-break
rule no character ever fits, and the honest outcomes are an endless loop or silently dropping the caller's text.
`wrap()` therefore throws a `RangeError` unless width is an integer `>= 1`, diverging from its sibling on purpose.

## Consequences

Two layout functions in the same library validate the same argument differently. This is deliberate and should
not be "fixed" into consistency — the divergence follows from truncate discarding text and wrap not.
