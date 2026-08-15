/**
 * The repository's environment file, read WHOLE and handed over whole (end-to-end-tests ticket 01).
 *
 * **No individual credential is read, classified or forwarded here.** Every `KEY=value` line
 * becomes an entry and none of them is looked at: which one authenticates what is never the
 * harness's business, which is exactly what lets a contributor authenticate with a subscription
 * token, an API key or something else and run these tests unchanged. ADR-0009 settles the same
 * arrangement for the delegated review, and the file this reads is the one a run then names as the
 * review's own environment file — read here for the session, named there for the review, inspected
 * in neither place.
 *
 * Nothing here ever echoes a VALUE, for the reason the server's own parser gives: the whole point
 * of the file is that its values are credentials.
 *
 * The dialect is the one `plugin/mcp/server/env-file.ts` and the `./claude` wrapper already read —
 * blank lines and `#` comments skipped, an optional `export ` prefix, the first `=` splitting, a
 * quoted value keeping what is inside the quotes, and an unquoted value ending at a `#` that
 * follows whitespace. It is a SEPARATE implementation of that dialect and not a shared one: this
 * package shares nothing with the tools server's, and the server's parser is the one that decides
 * what reaches a review. This one only decides what reaches a session, so it refuses nothing and
 * skips a line it cannot read — a harness that threw on a file the plugin accepts would fail a
 * test for a line the plugin was going to handle.
 */
import { readFile } from "node:fs/promises";

export async function readEnvFileWhole(path: string): Promise<Record<string, string>> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    throw new Error(
      `no environment file at ${path}. Every run hands that file to its session and names it as ` +
        `the delegated review's environment file, so the tests cannot run without one. It is the ` +
        `same .env the ./claude wrapper loads; CONTRIBUTING.md says what belongs in it.`,
    );
  }
  const variables: Record<string, string> = {};
  // A BOM on the first line would otherwise become part of the first KEY.
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const statement = line.trim();
    if (statement === "" || statement.startsWith("#")) continue;
    const body = statement.startsWith("export ")
      ? statement.slice("export ".length).trim()
      : statement;
    const split = body.indexOf("=");
    if (split <= 0) continue;
    variables[body.slice(0, split).trim()] = parseValue(body.slice(split + 1));
  }
  return variables;
}

function parseValue(raw: string): string {
  const trimmed = raw.trim();
  const quoted = /^(['"])([\s\S]*)\1[ \t]*(?:#.*)?$/.exec(trimmed);
  if (quoted !== null) return quoted[2] ?? "";
  // Unquoted: a `#` that FOLLOWS WHITESPACE opens a trailing comment. A `#` with nothing before it
  // is part of the value — plenty of tokens carry one, and `KEY=a#b` is not a commented `KEY=a`.
  const comment = /\s#/.exec(trimmed);
  return (comment === null ? trimmed : trimmed.slice(0, comment.index)).trimEnd();
}
