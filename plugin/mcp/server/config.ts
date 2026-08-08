/**
 * The server's startup configuration: the plugin's `userConfig` options, substituted into this
 * process's environment by the host through `plugin/.mcp.json` (delegated-review issue 03).
 *
 * Nothing here re-defaults anything. The shipped defaults live in the manifest — measured to reach a
 * server's `env` even when nobody has opened the configuration dialog (ticket 02) — so a second copy
 * of them in here could only ever disagree with the first. An option this process was not given is
 * therefore reported ABSENT, not silently replaced with what the manifest happens to say today.
 *
 * That principle governs the three DECLARED options only. The variables added for the review
 * lifecycle (issue 04) — the backend selector, the scripted double's script and the store's TTL —
 * are not plugin options at all: the manifest declares exactly three, and these reach the process
 * through the inherited environment rather than through `${user_config.*}`. They therefore have
 * nowhere else to be defaulted, and their defaults live here. That is also why only the declared
 * three carry the `DELIVERER_CODE_REVIEW_` prefix that mirrors their option names: a knob nobody can
 * set from the configuration dialog is not an option, and naming it as one would say it was.
 *
 * The review DEADLINE used to be a fourth declared option and is now the constant below. It is the
 * one setting whose whole job is to bound a failure — an owner who can raise it can turn a hung
 * review into a hung session, and an owner who can lower it can make every honest review fail — so it
 * is the server's to state, not the owner's to tune.
 */
import * as fs from "node:fs";

import { REVIEW_COMMAND } from "./agent-backend.ts";
import { parseEnvFile } from "./env-file.ts";
import { DEFAULT_TTL_SEC } from "./store.ts";

/** The env var each declared option lands in. Mirrors the `env` map in `plugin/.mcp.json`. */
export const EFFORT_ENV = "DELIVERER_CODE_REVIEW_EFFORT";
export const MODEL_ENV = "DELIVERER_CODE_REVIEW_MODEL";
export const CLAUDE_ENV_FILE_ENV = "DELIVERER_CODE_REVIEW_CLAUDE_ENV_FILE";

/** The undeclared knobs: which backend runs a review, how it is scripted, how long records live. */
export const BACKEND_ENV = "DELIVERER_REVIEW_BACKEND";
export const SCRIPT_ENV = "DELIVERER_REVIEW_SCRIPT";
export const STORE_TTL_ENV = "DELIVERER_REVIEW_STORE_TTL_SEC";

/**
 * How long one review may run before the server aborts it and reports failure: SIXTY MINUTES, fixed.
 *
 * A round measured 122 s at the default effort on a twenty-line diff, so this is not a budget — it is
 * the ceiling that turns a wedged review into a reported failure instead of an in-flight slot held
 * for the life of the session. An hour is far above anything measured and far below "never", which is
 * what the whole range of sensible values collapses to once nobody has to pick one.
 */
export const DEADLINE_SEC = 60 * 60;

/**
 * The backend a server runs with when nothing selects one: the real delegated review. Naming it the
 * default rather than the double is the whole point — a server that silently replayed a script would
 * report a clean round nobody ran.
 */
export const DEFAULT_BACKEND = "agent";

/**
 * The effort tiers this server accepts, and the trade that comes with enumerating them.
 *
 * A tier is passed VERBATIM into `/code-review <tier> --comment <url>`, so an unrecognised one is an
 * owner-configuration defect with two possible outcomes, both bad and indistinguishable from here:
 * the review command errors or it ignores the
 * argument and reviews at its own default — a silent depth change the owner set the dial precisely to
 * avoid. So it FAILS CLOSED, in the same shape a malformed environment file already does.
 *
 * The accepted cost, chosen knowingly (PR #11 grill, agenda A15): **a tier the platform adds later is
 * refused by a server shipped before it**, and the owner's fix is a plugin update. This is the one
 * option in this file that breaks forward compatibility with a future platform tier; the alternative
 * was failing open on a value nobody has measured, which is what the ruling rejected.
 */
export const EFFORT_TIERS: readonly string[] = ["low", "medium", "high", "xhigh", "max"];

/** How the accepted set reads in a refusal, once, so message and check cannot drift apart. */
const TIER_LIST = "low, medium, high, xhigh or max";

/**
 * Why the configured effort tier was rejected, or null when it is absent, empty or usable.
 *
 * Absence is the manifest's business — this module re-defaults nothing — and an empty tier is a SET
 * value meaning "leave the command's own default", which `reviewPrompt` honours by omitting the
 * argument. Anything else must be a single word the review command knows.
 */
export function effortError(effort: string | null): string | null {
  if (effort === null) return null;
  const tier = effort.trim();
  if (tier === "") return null;
  if (/\s/.test(tier)) {
    return (
      `the review effort tier "${effort}" contains whitespace, so it cannot be passed as one ` +
      `argument to ${REVIEW_COMMAND}. Set the plugin's code_review_effort option to a single tier ` +
      `(${TIER_LIST}).`
    );
  }
  if (!EFFORT_TIERS.includes(tier)) {
    return (
      `the review effort tier "${effort}" is not one this server accepts, so no review can be ` +
      `run at a depth the owner asked for and none will be started. Set the plugin's ` +
      `code_review_effort option to one of: ${TIER_LIST}.`
    );
  }
  return null;
}

export interface ReviewConfig {
  /** the effort tier, verbatim, or null when the host set nothing */
  effort: string | null;
  /**
   * the model, verbatim — an alias or an id — or null when unset. An EMPTY value is a SET value,
   * meaning "take the default the configured environment already selects".
   */
  model: string | null;
  /**
   * why the effort tier that arrived was rejected, or null when none arrived or it was usable.
   *
   * A value that never arrived and one that arrived malformed are different facts. The first is the
   * manifest's business and this module re-defaults nothing; the second is a configuration DEFECT,
   * and treating it as absence would silently review at a depth nobody chose. So it is held here and
   * refused at every `code_review_start`, as the environment file's own defect is.
   */
  effortTierError: string | null;
  /**
   * the variables the owner's environment file assigned. Never empty in a server that has one:
   * the option is REQUIRED, so "no file" is not a configuration this server runs in — it is
   * `claudeEnvError`, and the empty map that comes with it never reaches a backend because every
   * `code_review_start` is refused first.
   */
  claudeEnv: Record<string, string>;
  /**
   * why the required environment file could not be used, or null when it was usable. Fails closed
   * for the same reason the effort tier does, and harder: the file exists to carry the review's
   * CREDENTIALS, so proceeding without it means a review that either cannot log in or — worse —
   * runs as whatever identity the environment happened to have lying around.
   */
  claudeEnvError: string | null;
  /** which backend runs a review; `DEFAULT_BACKEND` when nothing selects one */
  backend: string;
  /** the scripted double's script, verbatim and unparsed — only the double reads it */
  scriptRaw: string | null;
  /** how long a finished review stays addressable, in seconds */
  storeTtlSec: number;
  /** anything that arrived malformed, said on stderr at startup rather than swallowed */
  warnings: string[];
}

/** An env var that was never set and one set to the empty string are different facts here. */
const raw = (env: NodeJS.ProcessEnv, key: string): string | null => {
  const value = env[key];
  return value === undefined ? null : value;
};

/**
 * Read and parse the owner's environment file, or say why it could not be.
 *
 * Read ONCE, here, rather than per review: the path is startup configuration like everything else in
 * this file, so a defect in it is discovered at startup and refused at every start, instead of
 * arriving as a new failure mode in the middle of a round. The option's own description says an edit
 * takes effect in a new session, which is the honest reading of that.
 *
 * Every way this can go wrong is a REFUSAL, including the file being absent: the option is required,
 * so there is no "no file" configuration to fall back from. That is the one place this module does
 * not merely report absence — and it is not a re-defaulting of the manifest either, because the
 * manifest declares no default to disagree with. It is the same fact the manifest states, said where
 * a caller can act on it: the host refuses to expand `${user_config.*}` for an unset required option,
 * so a server reaching this branch was hand-run or spawned from a configuration that never resolved.
 *
 * A file that parses to NO variables is a rejection for the same reason. An owner who named a file
 * meant it to matter, so the two ways it can silently not matter — the wrong path (caught by the
 * read) and the right path with everything commented out (caught here) — are both defects rather
 * than a quiet fallback to the ambient environment.
 *
 * No message here contains a VALUE from the file; see `./env-file.ts`.
 */
function loadClaudeEnv(path: string | null): {
  env: Record<string, string>;
  error: string | null;
} {
  const file = path === null ? "" : path.trim();
  if (file === "") {
    return {
      env: {},
      error:
        `the plugin's code_review_claude_env_file option is required and this server was given no ` +
        `path for it, so no review can be given the environment it must run in and none will be ` +
        `started. Set that option to a file in .env format carrying the credentials the review ` +
        `should run under.`,
    };
  }

  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    return {
      env: {},
      error:
        `the environment file the plugin's code_review_claude_env_file option names (${file}) ` +
        `could not be read, so no review can be given the environment the owner configured and ` +
        `none will be started: ${(error as Error).message}. Point that option at a readable file ` +
        `in .env format.`,
    };
  }

  let variables: Record<string, string>;
  try {
    variables = parseEnvFile(text);
  } catch (error) {
    return {
      env: {},
      error:
        `the environment file the plugin's code_review_claude_env_file option names (${file}) is ` +
        `not in .env format, so no review can be given the environment the owner configured and ` +
        `none will be started: ${(error as Error).message}. Every line must be blank, a "#" ` +
        `comment, or KEY=value.`,
    };
  }

  if (Object.keys(variables).length === 0) {
    return {
      env: {},
      error:
        `the environment file the plugin's code_review_claude_env_file option names (${file}) ` +
        `assigns no variables, so it would change nothing about the review it was configured for ` +
        `and no review will be started. Put the variables the review needs in it — at least the ` +
        `credentials it runs under.`,
    };
  }

  return { env: variables, error: null };
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): ReviewConfig {
  const warnings: string[] = [];

  const effort = raw(env, EFFORT_ENV);
  const effortTierError = effortError(effort);
  if (effortTierError !== null) warnings.push(effortTierError);

  const claude = loadClaudeEnv(raw(env, CLAUDE_ENV_FILE_ENV));
  if (claude.error !== null) warnings.push(claude.error);

  const backendRaw = raw(env, BACKEND_ENV);
  const backend = backendRaw === null || backendRaw === "" ? DEFAULT_BACKEND : backendRaw;

  const ttlRaw = raw(env, STORE_TTL_ENV);
  let storeTtlSec = DEFAULT_TTL_SEC;
  if (ttlRaw !== null && ttlRaw !== "") {
    const parsed = Number(ttlRaw);
    if (Number.isFinite(parsed) && parsed > 0) storeTtlSec = parsed;
    else warnings.push(`${STORE_TTL_ENV}="${ttlRaw}" is not a positive number of seconds`);
  }

  return {
    effort,
    model: raw(env, MODEL_ENV),
    effortTierError,
    claudeEnv: claude.env,
    claudeEnvError: claude.error,
    backend,
    scriptRaw: raw(env, SCRIPT_ENV),
    storeTtlSec,
    warnings,
  };
}
