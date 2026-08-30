/**
 * The `.env` file the plugin's `code_review_claude_env_file` option names, parsed into the variables
 * every model call the **observation** makes is started with (one-environment-file ticket 02; D9).
 *
 * **This is a faithful copy of `../server/env-file.ts`, and the two are changed together.**
 * `observer/` never imports from `server/`: `hooks/install-mcp-server.sh` publishes them as two
 * independently symlinked trees, so an import across them would make the observation depend on a
 * tree a different process published — which is why `./model-call.ts` re-implements the review's
 * failure classification and `./records.ts` re-implements the end-to-end harness's token rule
 * rather than sharing either. The duplication is that same trade taken a third time.
 *
 * **A narrowed re-implementation is refused, on the record.** One file the owner named authenticates
 * the review and the observation both (ADR-0009), so a parser here that accepted less than its
 * sibling would produce a file that logs a **round** in and leaves an observation unauthenticated —
 * a failure nobody would think to look for, in the half of the plugin nothing else reads. The whole
 * dialect is kept below, unnarrowed, including the parts no credential needs.
 *
 * **Nothing here ever echoes a VALUE.** Every message this module can produce names a line number
 * and at most a key. The whole point of the file is that its values are credentials, and what its
 * caller writes them into is a **debrief** the human is told to forward without reading it — so the
 * one thing a diagnostic must not do is put them there. `./model-env.ts` holds the same line for the
 * file's PATH, which a debrief may not carry either.
 *
 * The dialect is the one `.env` readers agree on, and the one the repository's own launcher already
 * relies on (`grep -v '^#' .env` then `export`):
 *
 *  - blank lines, and lines whose first non-blank character is `#`, are skipped
 *  - `export KEY=value` is accepted, because a file meant to be `source`d as well as read is normal
 *  - the FIRST `=` splits; a key is `[A-Za-z_][A-Za-z0-9_]*`, which is what a variable name can be
 *  - a value wrapped in matching quotes keeps its surrounding whitespace, and `"…"` (only) unescapes
 *    `\n`, `\r`, `\t` and an escaped quote or backslash
 *  - an UNQUOTED value ends at the first `#` that follows whitespace, so a trailing comment is a
 *    comment. A value that really contains ` #` must be quoted — which is why quoting is supported at
 *    all, and is stated in the option's own description.
 *  - a repeated key takes the LAST assignment, matching what `export` in a shell does with the same
 *    file, so a file that reads correctly to a human cannot mean something else here
 *
 * Anything else THROWS rather than being skipped. A line this parser did not understand is a line
 * whose variable does not reach the observation, and a silently dropped credential arrives later as
 * a debrief that mysteriously could not log in — see `./model-env.ts`, which turns the throw into
 * one line saying the named source was not usable and that the observation inherited instead.
 */

/** What a variable may be called. Anything else is not a name an environment can carry. */
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** A whole value in matching quotes, with an optional trailing comment after it. */
const QUOTED = /^(['"])([\s\S]*)\1[ \t]*(?:#.*)?$/;

/** The escapes `"…"` honours. Single quotes are literal, as every `.env` dialect has them. */
const unescapeDoubleQuoted = (value: string): string =>
  value.replace(/\\([nrt\\"'`$])/g, (_match, char: string) =>
    char === "n" ? "\n" : char === "r" ? "\r" : char === "t" ? "\t" : char,
  );

function parseValue(raw: string): string {
  const trimmed = raw.trim();
  const quoted = QUOTED.exec(trimmed);
  if (quoted !== null) {
    const [, quote = '"', body = ""] = quoted;
    return quote === '"' ? unescapeDoubleQuoted(body) : body;
  }
  // Unquoted: a `#` that follows whitespace opens a trailing comment. A `#` with no space before it
  // is part of the value — plenty of tokens contain one, and `KEY=a#b` is not a commented `KEY=a`.
  const comment = /\s#/.exec(trimmed);
  return (comment === null ? trimmed : trimmed.slice(0, comment.index)).trimEnd();
}

/**
 * Every variable the text assigns, or a throw naming the first line that is not `.env`.
 *
 * The error's message is appended to a sentence about the file that named nothing of it, so it
 * starts lowercase and says only what is wrong with the line — never what was on it.
 */
export function parseEnvFile(text: string): Record<string, string> {
  const variables: Record<string, string> = {};
  // A BOM on the first line would become part of the first KEY, so it goes before anything else.
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const statement = line.trim();
    if (statement === "" || statement.startsWith("#")) continue;
    const body = statement.startsWith("export ")
      ? statement.slice("export ".length).trim()
      : statement;
    const split = body.indexOf("=");
    if (split <= 0) {
      throw new Error(
        `line ${lineNumber} is neither blank, nor a "#" comment, nor a "KEY=value" assignment`,
      );
    }
    const key = body.slice(0, split).trim();
    if (!KEY_PATTERN.test(key)) {
      throw new Error(
        `line ${lineNumber} assigns to "${key}", which is not a usable environment variable name ` +
          `(letters, digits and "_", not starting with a digit)`,
      );
    }
    variables[key] = parseValue(body.slice(split + 1));
  }
  return variables;
}
