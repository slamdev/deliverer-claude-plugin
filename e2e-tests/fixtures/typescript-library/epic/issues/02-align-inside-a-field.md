# 02 — Align a cell inside a fixed width

Status: ready-for-agent

**Blocked by:** 01 — Pad a string to a visible width. `align` is padding on both sides, so it is written on top of
`padVisible` rather than beside it.

**What to build:** `align(text, width, alignment)`, exported from the library, placing `text` inside a field of `width`
columns — `"left"`, `"right"` or `"centre"` — and filling the rest.

`left` pads on the right, `right` pads on the left, `centre` pads on both. All three measure with `visibleWidth` through
`padVisible`, so a coloured label sits where a plain one of the same visible width would.

The alignment is a string of those three values, defaulting to `"left"`, which is what a caller laying out labels wants
without saying so.

Files: `src/align.ts`, `src/align.test.ts`, `src/index.ts`.

- [ ] `align(text, width, alignment)` is exported from `src/index.ts` and lives in its own file under `src/`.
- [ ] `"left"`, `"right"` and `"centre"` all fill to the field's width, measured visibly.
- [ ] `alignment` defaults to `"left"`.
- [ ] The padding is `padVisible`'s rather than a second implementation of the same arithmetic.
- [ ] Text already at or beyond the field's width comes back unchanged, whichever alignment was asked for.
- [ ] Unit tests beside the source, covering all three alignments, a coloured string, and text wider than the field.
- [ ] `npm run typecheck && npm test` are green.
