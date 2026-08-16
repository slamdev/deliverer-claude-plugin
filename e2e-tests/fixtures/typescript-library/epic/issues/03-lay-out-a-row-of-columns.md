# 03 — Lay out a row of columns

Status: ready-for-agent

**Blocked by:** 01 — Pad a string to a visible width, and 02 — Align a cell inside a fixed width. A row is those two
applied per cell, so it is written once both exist.

**What to build:** `formatRow(cells, columns, separator)`, exported from the library, returning one row of a table:
each cell cut to its column's width, aligned inside it, and the columns joined.

Each column carries a `width` and an `alignment`. A cell wider than its column is cut with `truncate` — never folded,
and never left to push every column after it out of line — and then aligned inside what is left. The separator between
columns is the caller's, defaulting to a single space.

This is the slice a caller actually reaches for: a table is then a `map` over rows rather than a nest of loops.

Files: `src/format-row.ts`, `src/format-row.test.ts`, `src/index.ts`.

- [ ] `formatRow(cells, columns, separator)` is exported from `src/index.ts` and lives in its own file under `src/`.
- [ ] Each cell is cut to its column's width with `truncate` and aligned inside it with `align`, rather than either
      being reimplemented here.
- [ ] Every column's `alignment` is honoured, so a right-aligned number and a left-aligned label sit in one row.
- [ ] `separator` defaults to a single space.
- [ ] A row of coloured cells lines up with a row of plain ones of the same visible widths.
- [ ] Unit tests beside the source, covering mixed alignments, a cell too long for its column, a coloured cell, and a
      separator other than a space.
- [ ] `npm run typecheck && npm test` are green.
