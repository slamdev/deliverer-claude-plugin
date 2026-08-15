/**
 * How wide a string is once a terminal has rendered it.
 *
 * The colour codes a terminal swallows take up no columns, so measuring a coloured string by its
 * length is always wrong — `\u001B[31mred\u001B[0m` is nine columns of `length` and three of
 * anything a user can see.
 */

/**
 * One SGR escape sequence: the colour and style codes. Sticky rather than global, so a caller can
 * ask whether one starts at a given index instead of searching from there.
 */
const SGR_ESCAPE = /\u001B\[[0-9;]*m/y;

/** Every SGR escape in the string, for the callers that only want them gone. */
const EVERY_SGR_ESCAPE = /\u001B\[[0-9;]*m/g;

/** The escape sequence starting exactly at `index`, or null when a visible character does. */
export function escapeAt(text: string, index: number): string | null {
  SGR_ESCAPE.lastIndex = index;
  return SGR_ESCAPE.exec(text)?.[0] ?? null;
}

/** The string with every colour and style escape removed. */
export function stripAnsi(text: string): string {
  return text.replace(EVERY_SGR_ESCAPE, "");
}

/**
 * How many columns the string occupies.
 *
 * Counted in code points, so a surrogate pair is one column. A wide character and a combining mark
 * are one column too, which is not what a terminal does — the library says so and leaves it alone.
 */
export function visibleWidth(text: string): number {
  return [...stripAnsi(text)].length;
}
