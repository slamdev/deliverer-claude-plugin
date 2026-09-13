# Close styles per attribute, never with a full reset

To stop a colour bleeding past a wrap, `wrap()` ends each line by closing whatever styles are open and starts the
next by re-opening them. It closes them **per attribute** — `39` for a foreground colour, `49` for a background,
`22` for bold — and never emits `[0m`. A full reset would also cancel styling the caller set *around* the
wrapped text, which they never asked us to touch; and the closer must sit inside the line string rather than after
the newline, because a terminal erasing the next line under Background Colour Erase applies the rendition still in
effect when the newline arrives.

The open-to-close table is written out by hand and covers everything ECMA-48 §8.3.117 defines — including blink
(5/6→25), framed and encircled (51/52→54), overlined (53→55) and double underline (21→24). The ecosystem's table,
`ansi-styles`, has no entries for those, so `wrap-ansi` lets them bleed. We have no dependency to inherit the gap
from and the table is static data, so the extra rows cost nothing to carry.

## Consequences

State is keyed by **open** code, not close code. Bold and dim both close with `22`, as do singly and doubly
underlined with `24` — keying by the closer loses one of each pair, which is a bug `slice-ansi` ships. So closing
`[1m[2m` emits `[22m[22m`, and a `[22m` arriving in the input clears both.
