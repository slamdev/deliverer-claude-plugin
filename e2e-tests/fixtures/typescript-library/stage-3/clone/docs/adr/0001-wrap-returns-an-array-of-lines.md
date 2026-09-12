# wrap() returns an array of lines

Most terminal wrappers in the wild hand back one newline-joined string, so a reader will expect that here.
`wrap()` returns `string[]` instead, because every layout job that builds on wrapping — clamping to a maximum
number of lines, hanging indents, truncating the last visible line, drawing a box — needs the lines apart, and
re-splitting a coloured string on `\n` is precisely the error-prone work this library exists to spare a caller.
`lines.join("\n")` recovers the other shape in one call; nothing recovers the array as cheaply.

## Consequences

Line-budget clamping and indentation are deliberately left out of this library: `lines.slice(0, n)` and
`lines.map(indent)` are the caller's, and they are only that cheap because the result is an array.
