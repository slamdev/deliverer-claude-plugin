# Refinement brief: word-wrap

Epic slug: `word-wrap`
Repository: `/tmp/deliverer-e2e/refine-typescript-library-2026-09-12T09-13-58-mfWFt4/clone`

This is the whole hand-off from the refinement conversation. Whoever writes the spec has this document and nothing
else of that conversation. Everything below under "Decisions" is settled and is not to be reopened; everything
under "Claims" is unverified and must be checked first-hand.

## The idea

> Add word wrapping to the library, so a caller can fit a long line of coloured text into a fixed-width terminal
> without cutting an ANSI escape in half or letting a colour bleed past the wrap.

The library already measures a coloured string (`visibleWidth`) and cuts one to a column (`truncate`). It cannot
lay one out across several lines. The two failure modes the user named are the whole point of the epic: an escape
sliced in half, and a colour still in effect when a line ends — which, on a real terminal, paints the rest of the
row and everything after it.

## Decisions

Each is settled, with the grounds it was settled on.

### The API

**1. `wrap(text, width, options?)` returns `string[]`, one element per line.**
Grounds: every layout job that builds on wrapping — clamping to a line budget, hanging indents, truncating the
last line, drawing a box — needs the lines apart, and re-splitting a coloured string on `\n` is exactly the
error-prone work this library exists to spare a caller. `join("\n")` recovers the other shape in one call; nothing
recovers the array as cheaply. Recorded as ADR 0001.

**2. The third parameter is an options object, and it carries exactly one key in this epic: `hard?: boolean`,
defaulting to `true`.**
Grounds: the user overrode a recommendation of purely positional arguments (which would have matched
`truncate(text, width, ellipsis = "…")`) in favour of somewhere for future knobs. An options bag with no keys is
incoherent, so the one behaviour with two genuinely defensible sides became the knob — see decision 4.

**3. Unknown option keys and wrong-typed values are ignored, not validated.**
Grounds: `options.hard` is read for truthiness and nothing else. Width validation exists because a bad width has
no coherent answer; a bad `hard` has one. The library's stated audience typechecks. No runtime validation code,
no tests for it.

**4. Greedy wrapping. A word that would fit on a line of its own moves down whole. A word wider than `width` is
hard-broken across as many lines as it needs.**
Grounds: the classic greedy algorithm, and the only option under which output never exceeds the width. Pure
character wrapping was rejected as not being word wrapping; unconditional overflow was rejected as breaking the
library's one promise.

**5. `hard: false` disables the hard break, so an over-long word overflows past the width instead.**
Grounds: someone wrapping URLs they need copy-pasteable wants this. Consequence to document: under `hard: false`
the "never exceeds the width" promise is conditional.

**6. `width` must be an integer `>= 1`; otherwise `RangeError`. This deliberately diverges from `truncate`, which
accepts `0`.**
Grounds: `truncate` discards text, so width 0 has an answer — nothing fits, you get nothing. `wrap` discards
nothing, so width 0 has no answer: under the hard-break rule no character ever fits, and the honest outcomes are
an endless loop or silently dropping the caller's text. Recorded as ADR 0002, including a note that the
inconsistency is deliberate and should not be "fixed".

**7. `wrap` always returns at least one line. `wrap("", 10)` is `[""]`.**
Grounds: `result.length` is then a line count a caller can rely on without a prior emptiness check, and
`join("\n")` round-trips. An escapes-only string yields one line carrying those escapes.

### Laying out

**8. A break opportunity is a run of ASCII spaces (U+0020) between words, and the run is consumed at the break.**
Grounds: smallest and most predictable rule, and what a help-text formatter needs. Broader Unicode whitespace was
rejected because it drags in how wide a tab is, which this library has no answer for — tabs and other whitespace
are ordinary visible characters costing one column each. Breaking after hyphens was rejected because it surprises
anyone wrapping a command line with flags like `--no-color`. Consuming the run means no line ends in a dangling
space, which in a coloured terminal would render as a block of background colour — the bleed problem in another
costume.

**9. A `\n` in the input is a forced break: wrapping restarts after it.**
Grounds: a caller who deliberately wrote a newline meant it. Treating `\n` as collapsible whitespace, and
rejecting input containing `\n` outright, were both rejected.

**10. No indentation logic. Leading spaces are ordinary characters that count toward the width; continuation lines
start at column 0.**
Grounds: a caller wanting a hanging indent wraps to `width - indent` and prefixes each line — one `map()` away,
precisely because decision 1 returns an array. Detecting indents needs its own rule for what counts as one and
interacts awkwardly with decision 8.

**11. No line budget / `maxLines` / height clamping in this epic.**
Grounds: `lines.slice(0, n)` plus `truncate()` on the last one already does it, again because the result is an
array. Keeps the epic to one idea.

### Colour

**12. `wrap` tracks the active SGR state. Each line ends with closers for whatever is open, and each continuation
line begins by re-emitting those openers. Closers go out in reverse order of opening.**
Grounds: this is what `wrap-ansi@10.0.1` does — `restoreStylesAcrossRows()`, `index.js` lines 484–549, whose own
header comment reads "Close the active styles and hyperlink before every row break and reopen them after, so each
row stands on its own"; the reverse-order rule is at lines 373–374. `slice-ansi@9.0.0` does the same at slice
boundaries (`index.js` lines 31–33, 168). The alternative of leaving escapes where they fall, as `truncate` does,
is the bleed the epic exists to prevent.

**13. Closers are per attribute. `wrap` never emits `[0m`.**
Grounds: `[0m` also cancels styling the caller set *around* the wrapped text, which we were not asked to
touch — the refusal in chalk#263, "`ESC[0m` means reset everything, `ESC[39m` means reset foreground color to
default". `wrap-ansi` explicitly deletes the reset code from the set it will ever emit (`index.js` lines 43–44).
Recorded as ADR 0003.

**14. The closer is emitted inside the line string, so it precedes any `\n` a caller joins with.**
Grounds: Background Colour Erase. chalk#92 quotes the VT520 spec — when a new line occurs the emulator erases the
next line with the *existing* render mode, so a reset issued after the newline is too late. `wrap-ansi` carries
the same comment and emits closers at line 529, before the break, reopening at 540. With decision 1 returning an
array this falls out naturally, but it is the reason the closer belongs at the end of the line's own string
rather than being something the caller could reasonably be asked to add.

**15. The open-to-close table is written out by hand and covers everything ECMA-48 §8.3.117 defines.**
That is: 1 and 2 → 22; 3 → 23; 4 and 21 → 24; 5 and 6 → 25; 7 → 27; 8 → 28; 9 → 29; 51 and 52 → 54; 53 → 55;
58 → 59; 30–37, 90–97 and 38 (all forms) → 39; 40–47, 100–107 and 48 (all forms) → 49.
Grounds: the ecosystem's table, `ansi-styles@7.0.0`, has no entry for 5, 6, 21, 51, 52 or 53, so `wrap-ansi@10.0.1`
lets blink, framed and overlined bleed past a wrap — reproduced by the sweep, e.g. `[5m…` wrapping to
`"ESC[5maaa bbb\nccc dddESC[25m"` with no close and no reopen. This library has no dependency to inherit that gap
from and the table is static data, so the extra rows cost nothing. Bug-compatibility with `wrap-ansi` was
considered and rejected.

**16. State is keyed by open code, not close code. Closing `[1m[2m` emits `[22m[22m`, and a
`[22m` arriving in the input clears both bold and dim.**
Grounds: bold and dim share the closer `22`, and singly and doubly underlined share `24`. `slice-ansi@9.0.0` keys
its state map by close code and therefore loses bold — reproduced:
`sliceAnsi("[1m[2maaaaaaaaaa[22m", 3, 8)` → `"ESC[2maaaaaESC[22m"`. `wrap-ansi` keys as
`modifier-${code}` and emits both closers. chalk#290 records the collision as a known, explicitly-unfixed problem
in chalk itself. Recorded in ADR 0003's consequences.

**17. A multi-code escape splits into individual styles and is re-opened as separate escapes: `[1;31m`
becomes `[1m[31m`.**
Grounds: one rule for one style everywhere, so decisions 15 and 16 apply without special cases. Remembering the
compound verbatim means a later `[22m` has to surgically remove "bold" from inside a remembered sequence,
which is decision 16's bug in another shape. Output is normalised rather than byte-identical to the input; tests
assert the normalised form.

**18. The last line is closed too, even though no continuation line follows it.**
Grounds: every line returned is self-contained — it opens what it needs and closes what it opened — so no line can
bleed into whatever the terminal draws next. Consequence: `wrap` can add a closing escape the input never
contained.

**19. No reopen-skipping optimisation.** `wrap` always closes and reopens what is active, without peeking ahead at
whether the next line immediately resets a style.
Grounds: `wrap-ansi` has this (`applyLeadingSgrResets()`, lines 356–371) and it produces tidier output, but it
adds a lookahead pass and a class of "what counts as immediately" edge cases, each needing a test, for a
difference no user can see. One rule, and every test asserts what that rule predicts.

### Touching what already ships

**20. The escape-aware walk is extracted and shared. It lives in `src/visible-width.ts`, beside `escapeAt`, and is
not re-exported from `src/index.ts`.**
Grounds: the user chose sharing over duplicating the subtlest logic in the library. `CLAUDE.md` says `src/` is
"one file per exported function plus `src/index.ts`", so a new `src/walk.ts` would need that rule amended;
`visible-width.ts` already holds the walking primitive, so no new file and no new rule. `truncate`'s private
`takeVisible` currently carries the walk (`src/truncate.ts` lines 28–47).

**21. `truncate`'s output stays byte-for-byte identical through the extraction, and the epic adds a test pinning
the coloured-width-0 case.**
Grounds: `truncate("[31mhello[0m", 0)` returns `"[31m[0m"`, not `""` — the "every escape
rides along" rule and the existing assertion `truncate("hello", 0) === ""` (`src/truncate.test.ts` lines 26–28)
quietly conflict for coloured input, and no test pins the coloured case. The user chose to preserve the behaviour
as intended and pin it, rather than silently preserve it or change it. This is a pure refactor: no existing
assertion changes.

**22. The escape regex widens to accept colon parameters, library-wide.** `/\[[0-9;:]*m/` in
`src/visible-width.ts`, replacing `/\[[0-9;]*m/` in both the sticky and global forms.
Grounds: xterm documents the colon form as canonical for extended colour — `CSI 38 : 2 : Pi : Pr : Pg : Pb m`
(ITU T.416 / ISO 8613-6). Today `[38:2::255:0:0m` matches neither regex, so `visibleWidth` counts its whole
payload as visible columns and `truncate` will slice it in half. Widening fixes existing wrong behaviour in
`visibleWidth` and `truncate` rather than changing intended behaviour — but it does touch shipped functions, so it
owes its own tests. Giving `wrap` a private broader grammar was rejected: two ideas of what an escape is inside
one library is the drift decision 20 exists to prevent.

### Scope and documentation

**23. OSC 8 hyperlinks are not in this epic**, and neither is real terminal width for wide characters, emoji and
combining marks. `wrap` inherits `visibleWidth`'s code-point counting exactly as it is.
Grounds: `visible-width.ts` lines 32–33 already declare the width limitation out of scope — "a wide character and
a combining mark are one column too, which is not what a terminal does — the library says so and leaves it
alone" — and one shared notion of width across the library means one place to fix it later. Fixing it needs a
Unicode data table or a dependency, and the library has zero runtime dependencies. OSC 8 is similarly library-wide:
handling links in `wrap` alone would be incoherent while `visibleWidth` still charges a link's URL for columns.

**24. Both are written up in a "Not in this epic" section of the spec** — with the reasoning and what a future epic
would have to change — rather than published as separate spec stubs or left only in doc comments.
Grounds: tracked where anyone reading the spec will see them, without leaving half-specified epics in
`docs/specs/` that nobody has been grilled on.

**25. The epic owes: a README example for `wrap`, the `CONTEXT.md` glossary, and the three ADRs.** No `CLAUDE.md`
amendment.
Grounds: the README's existing two-line example block is the first thing anyone sees, and should show a coloured
string surviving a break. `CONTEXT.md` and `docs/adr/` were written during refinement and are currently untracked;
the epic commits them. A `CLAUDE.md` amendment pointing at them was offered and declined.

## Open forks

None. The grilling ran to an empty frontier and the user confirmed shared understanding. Every decision above was
put to the user and answered; decisions 2 and 20's file-placement question were both answered against the
recommendation given, and are recorded as the user chose them.

## Artifacts landed or touched

Written during refinement, all currently untracked, all to be committed by this epic:

- `CONTEXT.md` — glossary. Defines SGR escape, Visible width, Visible character, Width, Truncate, Wrap, Line,
  Break opportunity, Hard break, Forced break, Bleed, each with an `_Avoid_` list of banned synonyms.
- `docs/adr/0001-wrap-returns-an-array-of-lines.md`
- `docs/adr/0002-wrap-requires-a-width-of-at-least-one.md`
- `docs/adr/0003-close-styles-per-attribute-never-with-a-full-reset.md`

Code and configuration the epic will read or change:

- `src/visible-width.ts` — `escapeAt`, `stripAnsi`, `visibleWidth`; the two escape regexes at lines 13 and 16; the
  width limitation stated at lines 32–33.
- `src/truncate.ts` — `truncate` and the private `takeVisible` at lines 28–47.
- `src/index.ts` — re-exports, grouped by source module, dependency-first, alphabetised within a line.
- `src/truncate.test.ts`, `src/visible-width.test.ts` — the existing 14 tests across 4 suites.
- `README.md`, `CLAUDE.md`, `tsconfig.json`, `package.json`, `.github/workflows/ci.yml`, `docs/specs/` (empty but
  for `.gitkeep`).

Where the looking happened during refinement — two sweeps, reporting these as the places their facts came from:

- The repository itself, including `git log --all --reflog` (a single fixture commit, `7d99e9c`) and
  `git branch -a` (only `main`).
- `wrap-ansi@10.0.1` — `index.js`, verified byte-identical to the v10.0.1 GitHub tag.
- `slice-ansi@9.0.0` — `index.js` and `tokenize-ansi.js`.
- `cli-truncate@6.1.1` — `index.js`, `readme.md`.
- `ansi-styles@7.0.0` — its `codes` map.
- ECMA-48, 5th edition (June 1991), §8.3.117 SGR and §7.2.8 GRCM —
  https://ecma-international.org/wp-content/uploads/ECMA-48_5th_edition_june_1991.pdf
- xterm control sequences — https://invisible-island.net/xterm/ctlseqs/ctlseqs.html
- https://en.wikipedia.org/wiki/ANSI_escape_code
- https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html
- GitHub issues chalk/chalk#92, #263, #290; chalk/wrap-ansi#43; chalk/slice-ansi#22.

## Claims

Every one of these is unverified — taken from a report, from precedent, or from the user — and the design leans on
it. Check each first-hand; the path that would settle it is given. A claim that turns out false is a decision to
reopen, not a detail to work around.

1. **The extraction in decision 20 can leave `truncate` byte-for-byte identical.** Nobody has attempted it. Settle
   by doing it and running `npm test` with `src/truncate.test.ts` unmodified, plus a direct comparison of
   `truncate` output before and after on coloured input at several widths.
2. **Widening the regex to `[0-9;:]*` breaks no existing behaviour.** Taken as obvious because colons cannot
   appear in a currently-matching sequence. Settle against `src/visible-width.test.ts` and `src/truncate.test.ts`,
   and by checking the widened pattern against a CSI sequence that is *not* SGR.
3. **The ECMA-48 closer table in decision 15 is complete and correct as listed.** Taken from a sweep's reading of
   the standard. Settle against the ECMA-48 PDF §8.3.117 directly. Note the sweep flagged two wrinkles it did not
   resolve: `21` is double-underline per ECMA-48 but disables bold on several terminals, and `58`/`59` are
   non-standard extensions ECMA-48 marks "reserved for future standardization".
4. **`node --test`, invoked with no path argument, will discover a new `src/wrap.test.ts` with no configuration
   change.** Taken from how the existing four suites are found. Settle by adding the file and running `npm test`.
5. **Nothing this design needs is a construct `erasableSyntaxOnly` forbids.** The design is plain functions, an
   options object type and a static lookup table, so this should hold — but it has not been typechecked. The
   banned list is enums, `const enum`, runtime `namespace`/`module`, parameter properties, angle-bracket type
   assertions, and `import =`/`export =`. Settle with `npm run typecheck`.
6. **The static closer table can be written inside the 100-column TypeScript limit `CLAUDE.md` sets.** Assumed,
   not attempted.
7. **`visibleWidth` counting an escape as zero columns is the only width notion `wrap` needs** — i.e. no part of
   the layout algorithm needs to know a character's *rendered* width beyond what `visibleWidth` already reports.
   This is what decision 23 assumes. Settle by checking the algorithm never needs to measure a partial line by any
   other means.
8. **The three ADRs and `CONTEXT.md` written during refinement are accurate and fit to commit as they stand.** They
   were written from the conversation, not from a fresh reading of the code. Settle by reading them against
   `src/` — in particular ADR 0002's characterisation of `truncate`'s width-0 behaviour, which decision 21 shows
   is subtler than "you get an empty result" for coloured input.
9. **`docs/specs/` has no prior epic whose conventions this one must match.** Reported as empty but for
   `.gitkeep`, in the working tree and in the single commit. Settle by listing `docs/specs/`.
