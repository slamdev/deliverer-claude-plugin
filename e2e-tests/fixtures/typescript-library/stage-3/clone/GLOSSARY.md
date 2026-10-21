# terminal-text-kit

Helpers for laying text out in a fixed-width terminal. The context is the gap between what a string *contains* and
what a terminal *shows*: escape sequences that cost no columns, and columns that must not be exceeded.

## Language

### What a terminal shows

**SGR escape**:
An escape sequence that sets colour or style and occupies no columns on screen. The only kind of escape this library
recognises.
_Avoid_: ANSI code, colour code, control character

**Visible width**:
How many columns a string occupies once a terminal has swallowed its SGR escapes.
_Avoid_: length, display length, string length

**Visible character**:
A unit of a string that costs one column of visible width. Counted in code points, so a surrogate pair is one.
_Avoid_: char, glyph, grapheme

### Laying out

**Width**:
The column budget a caller gives a layout helper — the number of columns the result may occupy, never exceed.
_Avoid_: columns, size, max, limit

**Truncate**:
To cut a string down to a width, marking the cut with an ellipsis. Produces one line and discards what did not fit.
_Avoid_: clip, trim, shorten, ellipsize

**Wrap**:
To lay a string out across as many lines as its width requires, discarding nothing.
_Avoid_: fold, break, reflow, split

**Line**:
One element of a wrap's result: a string whose visible width is within the given width.
_Avoid_: row, segment, chunk

**Break opportunity**:
A place in a string where a wrap is permitted to start a new line — a run of spaces between two words.
_Avoid_: break point, split point, boundary

**Hard break**:
A break taken mid-word, because the word is wider than the width and no break opportunity could avoid exceeding it.
_Avoid_: force break, character break, hard wrap

**Forced break**:
A break the input demanded rather than the width — a newline the caller wrote.
_Avoid_: explicit break, manual break, hard break

**Bleed**:
A colour or style still in effect at the end of a line, continuing onto whatever the terminal draws next.
_Avoid_: leak, spill, carry-over
