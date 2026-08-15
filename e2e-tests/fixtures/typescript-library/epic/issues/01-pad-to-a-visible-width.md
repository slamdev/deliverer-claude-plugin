# 01 — Pad a string to a visible width

Status: ready-for-agent

**Blocked by:** nothing. This is the primitive the other two are built on, so it can start immediately.

**What to build:** `padVisible(text, width, fill)`, exported from the library, adding fill characters to the right of
`text` until its visible width reaches `width`.

Width is what a terminal shows, which is `visibleWidth`'s answer and never `text.length`: a cell carrying an ANSI colour
pays eight code units for its escapes and none of them are columns. That is the whole point of the function — `padEnd`
is already there for anyone who wanted code units.

`fill` is the caller's, defaulting to a space, so a leader of dots is one call rather than a loop.

Files: `src/pad-visible.ts`, `src/pad-visible.test.ts`, `src/index.ts`.

- [ ] `padVisible(text, width, fill)` is exported from `src/index.ts` and lives in its own file under `src/`.
- [ ] The padding brings the string's **visible** width up to `width`, so a coloured cell and a plain one of the same
      visible width come back the same length on screen.
- [ ] `fill` defaults to a single space.
- [ ] Text whose visible width already reaches `width` comes back unchanged — padding never shortens anything.
- [ ] Unit tests beside the source, covering a plain string, a coloured one, one already wide enough, and a fill other
      than a space.
- [ ] `npm run typecheck && npm test` are green.
