/**
 * Cutting a string to a column without slicing an escape sequence in half.
 */
import { escapeAt, visibleWidth } from "./visible-width.ts";

/**
 * The string cut to `width` visible columns, with `ellipsis` marking the cut.
 *
 * The escapes ride along whole: every one of them is copied, wherever it sits, so the colours a
 * caller asked for survive a cut that lands in the middle of them. A string already inside the
 * width is returned untouched.
 */
export function truncate(text: string, width: number, ellipsis = "…"): string {
  if (!Number.isInteger(width) || width < 0) {
    throw new RangeError(`width must be a non-negative integer, got ${width}`);
  }
  if (visibleWidth(text) <= width) return text;
  const marker = visibleWidth(ellipsis) <= width ? ellipsis : "";
  return takeVisible(text, width - visibleWidth(marker)) + marker;
}

/**
 * The first `width` visible characters, with every escape in the whole string kept.
 *
 * The walk continues past the cut rather than stopping at it, because the escape that closes a
 * colour usually sits at the very end and dropping it would leave the colour open.
 */
function takeVisible(text: string, width: number): string {
  let taken = "";
  let used = 0;
  let index = 0;
  while (index < text.length) {
    const escape = escapeAt(text, index);
    if (escape !== null) {
      taken += escape;
      index += escape.length;
      continue;
    }
    const character = String.fromCodePoint(text.codePointAt(index) ?? 0);
    index += character.length;
    if (used < width) {
      taken += character;
      used += 1;
    }
  }
  return taken;
}
