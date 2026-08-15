# The fixture's brief — word wrapping for `terminal-text-kit`

This is what the human who asked for the feature already thinks. The **responder** answers the grilling out of it, so
that two runs of the same test produce comparable epics instead of whatever the responder felt like inventing.

It is the **fixture's** brief and nobody else's. Refinement writes a brief of its own, to the operating system's
temporary directory, and treats one it finds there as proof that the grilling already ran — so this file stays here, is
read from here, and is never copied to where refinement looks.

## The problem, in the user's terms

`terminal-text-kit` already measures and truncates coloured text: `visibleWidth` counts what a terminal actually shows
and `truncate` cuts to a column without slicing an escape sequence in half. What it cannot do is fill a paragraph. Every
caller ends up writing the same fold-at-a-space loop, and every one of them gets the colours wrong — either the escape
lands in the middle of a wrap or the colour bleeds off the end of the line into whatever the terminal prints next.

The library is the right place for it, because the library is the only thing here that already knows what a visible
character is.

## Decisions already made, and what they rest on

- **The entry point is `wrap(text, width, options?)`, exported from `src/index.ts` beside the two that exist.** It
  returns an **array of lines** rather than one string joined with newlines: the callers that already exist are building
  boxes and columns and need the lines individually, and a caller that wants a paragraph can join them.
- **Width is counted with the library's own `visibleWidth`.** Escape sequences cost nothing, so a coloured word wraps at
  the same column as a plain one. Anything else would contradict the function beside it.
- **A colour never bleeds past a wrap.** A line that ends with an escape still open is closed with a reset, and the next
  line re-opens the escapes that were open when it started. This is the whole reason the feature belongs in the library
  rather than in each caller.
- **A word longer than the width is broken at the width** rather than allowed to overflow. Terminal output that
  overflows is worse than a word split across two lines, and the caller asked for a fixed width.
- **Existing newlines are hard breaks and are preserved.** A `\n` ends the line wherever it falls, and a blank line
  stays a blank line — paragraphs survive wrapping. `\r\n` is normalised to `\n` first.
- **Trailing whitespace on a wrapped line is dropped; whitespace inside a line is left exactly as it was.** Nothing
  collapses runs of spaces, because aligned output depends on them.
- **`width` must be a positive integer.** A negative or a fraction is a `RangeError` carrying the value, the way
  `truncate` already refuses one — and zero is refused too, which `truncate` allows. Truncating to zero columns has an
  answer, the empty string; wrapping to zero columns has none, because every word would break forever.
- **No new dependencies, and no change to the two functions that exist.** The tests are `node:test` files beside the
  source, the typecheck stays `tsc --noEmit`, and CI keeps running both.

## Deliberately out of scope

- **Tabs are not expanded.** A tab counts as one visible character, exactly as it does in `visibleWidth` today.
  Expanding to tab stops is a change to the whole library, not to this feature.
- **East Asian wide characters and combining marks are still one column each.** That is what `visibleWidth` does
  now, and fixing it is its own piece of work — the wrap must not disagree with the measure beside it.
- **No hanging indents, no bullet awareness, no hyphenation dictionary.** A caller that wants an indent can pass a
  narrower width and prefix the lines itself.
- **No streaming or incremental API.** The whole string goes in and the whole array comes out.

## What is genuinely open, and how to close it

Where the grilling asks something this brief has no answer for, take the recommended option. These are small enough that
either way is fine and none of them is worth stopping the work for:

- what the option bag is called and what else it eventually holds
- whether the hard-break of an over-long word gets an option to turn it off
- how the tests are split across files, and how many cases each carries
- the order the tickets land in, as long as each one is verifiable on its own

## The shared understanding

Once the frontier is empty, the understanding above is the whole of it: a `wrap` that measures like `visibleWidth`,
keeps colour from bleeding, breaks over-long words, preserves the newlines it was given, and refuses a width that is not
a positive integer — with tabs, wide characters and indentation left alone.
