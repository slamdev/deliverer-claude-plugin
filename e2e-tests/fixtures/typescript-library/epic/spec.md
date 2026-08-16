# Columns that line up when the text is coloured

Status: ready-for-agent

## Problem Statement

`terminal-text-kit` can measure what a terminal shows and cut a string to a column. It cannot lay two strings out
side by side.

Anyone printing a table today reaches for `String.prototype.padEnd`, which counts UTF-16 code units. A cell carrying an
ANSI colour pays for the escape twice — once in the opening sequence and once in the reset — so a red cell is padded
eight columns short of a plain one and the column to its right starts in a different place on every row. `visibleWidth`
already knows the right answer; nothing in the library uses it to pad.

The same gap shows up three times: padding one cell, aligning one cell inside a fixed width, and laying a whole row of
cells out at fixed widths. Each is a line of arithmetic on top of the one before it, and every caller writes all three
by hand.

## Solution

Three exported functions, each built on the one before it, all measuring with `visibleWidth` and cutting with
`truncate`.

- `padVisible(text, width, fill)` — the primitive. Add fill characters until the string's visible width reaches
  `width`.
- `align(text, width, alignment)` — `"left"`, `"right"` or `"centre"` inside a field of `width` columns, on top of
  `padVisible`.
- `formatRow(cells, columns)` — one row of a table: each cell cut to its column's width, aligned inside it, and the
  columns joined by a separator.

Nothing here prints, and nothing owns a terminal. They return strings, exactly as `truncate` does, and the caller
decides where they go.

## User Stories

1. As a caller, I want to pad a coloured string to a column count, so that a cell carrying an escape ends in the same
   place as one that does not.
2. As a caller, I want to choose the fill character, so that a leader of dots is a padding call rather than a loop of
   my own.
3. As a caller, I want a string already wider than the field left alone, so that padding never silently loses text.
4. As a caller, I want to align a cell left, right or centred inside a fixed width, so that numbers and labels can sit
   in the same table.
5. As a caller, I want a whole row of cells laid out at fixed widths in one call, so that a table is a `map` over rows
   rather than a nest of loops.
6. As a caller, I want a cell too long for its column cut to fit, so that one long value cannot push every column after
   it out of line.
7. As a caller, I want the separator between columns to be mine to choose, so that a row can be spaces, pipes or
   anything else.

## Implementation Decisions

- One file per exported function under `src/`, with its unit tests beside it as `<name>.test.ts`, and the function
  re-exported from `src/index.ts`. That is what every function in this library already does.
- Visible width is `visibleWidth`'s answer and never `String.length`. Cutting is `truncate`'s job and is never
  reimplemented: a row that cuts a cell calls it.
- The library runs unbuilt, so the source stays inside what Node's type stripping can erase and imports carry the real
  `.ts` extension.
- No new dependency. These are three functions of arithmetic over two the library already ships.

## Testing Decisions

- Unit tests beside each function, with `node:test` and `node:assert/strict`, in the shape `truncate.test.ts` already
  uses.
- Every function is tested against a coloured string as well as a plain one. A test suite that only ever passes plain
  ASCII would pass on `padEnd` and prove nothing.
- The tests are the gate: `npm run typecheck && npm test`, which is what CI runs on the change request.

## Out of Scope

- **Printing anything.** No function here writes to a stream, reads `process.stdout.columns`, or knows a terminal is
  attached.
- **A table.** Headers, per-column widths worked out from the data, borders and multi-line cells are all somebody
  else's feature; this delivers one row at fixed widths.
- **Wrapping.** A cell too long is cut, never folded onto a second line.
- **East Asian width.** `visibleWidth` counts what it counts today, and this work does not change it.
