/**
 * What every model call the **observation** makes runs under: the **environment file** the owner
 * named, layered over this process's own environment (one-environment-file ticket 02; D1 to D6, D10
 * and D12, with ADR-0009 holding the decision).
 *
 * **The plugin forwards no authentication of its own, and neither does this.** One file the owner
 * writes authenticates every model call the plugin makes — each **round**'s review, which has read
 * it since ADR-0009, and this observation's **dispatch note**s and its synthesis, which is what this
 * module adds. Nothing here enumerates a variable, recognises a provider or encodes anything about
 * what a credential looks like: the file is parsed and forwarded whole (D4). Any fixed set this
 * chose to carry would be a set decided when the plugin shipped, which is the single-provider trap
 * the server already retired when it stopped copying `CLAUDE_CODE_OAUTH_TOKEN` and three
 * `ANTHROPIC_*` variables out of the spawning session.
 *
 * **Layered OVER, and read ONCE.** The SDK's `env` replaces a subprocess's environment wholesale, so
 * the construction below spreads this process's environment first and the file's variables second —
 * a bare map would hand a model call an environment carrying only what the file happens to name, and
 * it would not start at all. It is the same construction `../server/agent-backend.ts` uses, for the
 * same reason. And it is read once, when the observation starts (D3): one **run** has one identity,
 * a parse failure is reported once, and a file edited mid-delivery cannot change who is paying
 * halfway through a **debrief**.
 *
 * **Where the named source cannot be used, this INHERITS rather than refusing** (D10). Unreadable,
 * unparseable, assigning nothing, or nothing named at all: the observation goes on, on the
 * environment it was started in, and says which of those happened. That is deliberately not the
 * review's fail-closed posture — a review running as an identity nobody chose writes in the owner's
 * repository and posts in their name, while an observation that judged something is strictly better
 * than one that judged nothing, and nothing the observation does reaches the run either way.
 *
 * **Nothing this module hands a debrief carries a VALUE or the file's PATH.** A value is a
 * credential and a path is on the owner's filesystem and routinely names their repository, which is
 * the one fact a document the human is told to forward unread may not hold (D12). So `why` below
 * names a line and at most a key, exactly as `./env-file.ts` does, and `path` is for **replay**'s own
 * stdout — which is not that document — and for nothing else.
 */
import { readFileSync } from "node:fs";
import { parseEnvFile } from "./env-file.ts";

/**
 * The option's key, as a **debrief** may name it.
 *
 * The most a debrief may carry about the file, and the reason it carries anything: a human told
 * their observation authenticated as somebody else needs to know which knob decided that, without
 * reading the plugin's source (D12).
 */
export const ENV_FILE_OPTION = "code_review_claude_env_file";

/**
 * The host's own variable for that option, and the ONE name both routes read (D5, D6).
 *
 * **Reading a `CLAUDE_PLUGIN_OPTION_<KEY>` variable to learn an effective value is forbidden in this
 * repository, and this is the one exception.** `hooks/install-mcp-server.sh` records the rule and
 * why: the variable reaches a hook only where the option was explicitly set, so an option sitting at
 * its manifest default is absent to a hook entirely, and a hook that read one would silently take
 * absence for the owner's answer. What lifts that here is the option's own `required` — it has no
 * manifest default to sit at, it is saved whenever it is set at all, and the plugin refuses every
 * review while it is not, so on any machine where the plugin works this variable is there. It was
 * verified present in a live observer's environment on the host this ticket came from. The install
 * hook's own note carries the same exception, so the two cannot be read against each other.
 *
 * The server's `DELIVERER_`-prefixed name for the same option is deliberately not read: the
 * observation is started by a hook and never by the MCP configuration, so that name never reaches
 * it. One name for the live observer and for **replay** is what keeps the by-hand route exercising
 * the path users get rather than a second one (D6).
 */
export const ENV_FILE_OPTION_ENV = "CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE";

/**
 * The environment this observation's model calls run under, and which of the two it is.
 *
 * Two members because a debrief has to be able to tell them apart: `file` is the owner's own
 * identity paying, and `inherited` is whatever the process the observation was started from
 * authenticates with — on the host this ticket came from, nothing at all.
 */
export type ModelEnvironment =
  | {
      readonly kind: "file";
      /** this process's environment with the file's variables over it, for the SDK's `env` */
      readonly env: NodeJS.ProcessEnv;
      /** what the option named. **Never for a debrief** — replay's own stdout only (D12). */
      readonly path: string;
    }
  | {
      readonly kind: "inherited";
      /** why, in the reader's words: a line and at most a key, and never a value (D10) */
      readonly why: string;
      /** what the option named, where it named anything. **Never for a debrief** (D12). */
      readonly path: string | undefined;
    };

/**
 * The SDK's `env` option for one call, spread into the call's own options.
 *
 * Spread rather than assigned, so an inheriting observation passes NO `env` at all and takes the
 * SDK's own default. Handing it a copy of this process's environment instead would be a second
 * construction of the same thing, which would then have to stay identical to the one above for ever.
 */
export function envOption(environment: ModelEnvironment): { env?: NodeJS.ProcessEnv } {
  return environment.kind === "file" ? { env: environment.env } : {};
}

/** Where a read failure says what went wrong without saying what it was reading (D12). */
function whyUnreadable(error: unknown): string {
  const code: unknown = (error as { code?: unknown }).code;
  return typeof code === "string" ? `\`${code}\`` : "a reason Node put no code on";
}

/**
 * Read the owner's environment file, or say why this observation is inheriting instead.
 *
 * Called ONCE per observation, by `./judge.ts`'s factory — which the live **observer** builds when it
 * starts watching and **replay** builds when it is asked to judge (D3).
 */
export function readModelEnvironment(from: NodeJS.ProcessEnv = process.env): ModelEnvironment {
  const named = from[ENV_FILE_OPTION_ENV];
  const path = named === undefined ? "" : named.trim();
  if (path === "") {
    // A source nobody named, which is a STATE and not an error: it is what a replay run without the
    // variable meets, and what a host that never set the option would have. Still said out loud,
    // because a debrief whose spend went somewhere the owner did not choose has to say so.
    return {
      kind: "inherited",
      path: undefined,
      why:
        `No environment file was named to this observation — the plugin's ${ENV_FILE_OPTION} ` +
        `option is not in the environment it was started in — so its model calls ran on whatever ` +
        `that environment authenticates with.`,
    };
  }

  const inherited = (because: string): ModelEnvironment => ({
    kind: "inherited",
    path,
    why:
      `The environment file the plugin's ${ENV_FILE_OPTION} option names ${because}, so this ` +
      `observation's model calls ran on the environment it inherited rather than on the one the ` +
      `owner configured. That file's own path is not named here, and neither is anything in it.`,
  });

  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    // The errno CODE and never the message: Node puts the path it was opening into the message, and
    // this string is bound for a document that may not carry it (D12).
    return inherited(`could not be read (${whyUnreadable(error)})`);
  }

  let variables: Record<string, string>;
  try {
    variables = parseEnvFile(text);
  } catch (error) {
    return inherited(`is not in .env format (${(error as Error).message})`);
  }

  // A file that parses to nothing is an unusable file and not an empty layering: an owner who named
  // one meant it to matter, so the right path with everything commented out reads here as the wrong
  // path does. Layering it would also make `kind` claim the file paid when the environment did.
  if (Object.keys(variables).length === 0) {
    return inherited("assigns no variables at all");
  }

  // D2, and the whole of it: this process's environment first, the file's variables second.
  return { kind: "file", path, env: { ...from, ...variables } };
}
