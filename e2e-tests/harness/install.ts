/**
 * Installing the plugin the way a user does (ADR-0016, end-to-end-tests ticket 01).
 *
 * Nothing here points a session at `plugin/` by path. A path-attached plugin loads its skills, its
 * agents and its commands and silently starts NO tools server, because the required
 * `code_review_claude_env_file` option has no channel to arrive through — measured, and recorded in
 * ADR-0016. So a run installs, which drags the whole shipped path under test: the marketplace
 * entry, the declared dependency, the `SessionStart` install hook, `launch.mjs`, and
 * `${user_config.*}` substitution through `plugin/.mcp.json`.
 *
 * **The order matters and its failure is legible.** The marketplace entry declares a dependency on
 * `mattpocock-skills` in the official marketplace, so that marketplace is added FIRST or the
 * install refuses, naming the dependency it cannot resolve. Installing the plugin then brings the
 * dependency in by itself; nothing here installs it separately, and a session that carries it is
 * evidence the declaration works.
 *
 * **The three options are written at USER scope**, in the run's own configuration directory. At
 * project scope they are ignored, the tools server never starts, and the session comes up looking
 * exactly like a plugin with no review tool. The install command's own `--config` flag is what
 * writes them — the spec left that flag unverified and it was measured here: it lands them in
 * `settings.json` under `pluginConfigs`, through the same path the interactive configure flow uses.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execute } from "./command.ts";
import { readMarketplaceEntry } from "./repository.ts";
import { runEnvironment, type RunDirectory } from "./run-directory.ts";
import type { StagedCopy } from "./staged-copy.ts";

/** The host itself, taken from the path — the same binary a contributor installs a plugin with. */
const CLAUDE_CLI = "claude";

/**
 * The marketplace the plugin's declared dependency comes from, and where to add it from.
 *
 * The NAME is checked against what the manifest declares rather than assumed: an entry that grew a
 * dependency on some other marketplace would otherwise fail at install time with a message about a
 * missing plugin, when the real answer is that this harness never added the marketplace holding it.
 */
const OFFICIAL_MARKETPLACE = {
  name: "claude-plugins-official",
  source: "anthropics/claude-plugins-official",
};

/**
 * The plugin's three `userConfig` options, as a run sets them. The keys are the manifest's own
 * names rather than this package's spelling of them, because each one is handed to `--config`
 * verbatim and the host validates it against the manifest.
 */
export interface PluginOptions {
  readonly code_review_effort: string;
  readonly code_review_model: string;
  readonly code_review_claude_env_file: string;
}

export interface Installation {
  /** `plugin@marketplace` — how the host names the install, and the key its options sit under */
  readonly pluginId: string;
  /** the plugin's own half of that id, which is what a session names its agents and servers by */
  readonly pluginName: string;
  readonly options: PluginOptions;
}

export async function installPluginUnderTest(
  runDirectory: RunDirectory,
  staged: StagedCopy,
  options: PluginOptions,
): Promise<Installation> {
  const entry = await readMarketplaceEntry();
  const unknownMarketplaces = entry.dependencyMarketplaces.filter(
    (marketplace) => marketplace !== OFFICIAL_MARKETPLACE.name,
  );
  if (unknownMarketplaces.length > 0) {
    throw new Error(
      `the marketplace entry declares dependencies on ${unknownMarketplaces.join(", ")}, which ` +
        `this harness does not know how to add. It adds ${OFFICIAL_MARKETPLACE.name} only ` +
        `(from ${OFFICIAL_MARKETPLACE.source}); an install would refuse, naming the dependency.`,
    );
  }

  // Every command runs in the run's own directory, so nothing about the repository the harness
  // itself lives in — its settings, its marketplaces — reaches the install. The run's ROOT and not
  // its session directory: that one has to stay empty for a session's project scope to have
  // nothing to load, and a host that ever wrote a file beside a command's working directory would
  // take that away silently.
  const environment = runEnvironment(runDirectory);
  const claude = (args: readonly string[], purpose: string): Promise<{ stdout: string }> =>
    execute(CLAUDE_CLI, args, { cwd: runDirectory.root, env: environment, purpose });

  await claude(
    ["plugin", "marketplace", "add", OFFICIAL_MARKETPLACE.source],
    `adding the ${OFFICIAL_MARKETPLACE.name} marketplace, which the plugin's dependency comes from`,
  );
  await claude(
    ["plugin", "marketplace", "add", staged.marketplaceSource],
    "adding the staged copy of the working tree as a marketplace",
  );

  const pluginId = `${entry.pluginName}@${entry.marketplaceName}`;
  await claude(
    [
      "plugin",
      "install",
      pluginId,
      "--scope",
      "user",
      ...Object.entries(options).flatMap(([key, value]) => ["--config", `${key}=${value}`]),
      // Deliberately NOT `--yes`: that accepts a command a marketplace declares for a plugin to be
      // installed by, and this marketplace declares none. An entry that grew one should stop a run
      // rather than have the harness agree to run it.
    ],
    `installing ${pluginId} with its three options at user scope`,
  );

  return { pluginId, pluginName: entry.pluginName, options };
}

/**
 * The options the install left at user scope in the run's own configuration directory, exactly as
 * the host will read them at session start. `{}` when the settings file carries none for this
 * plugin — which is the failure the matcher exists to name, not one to throw over here.
 */
export async function readOptionsAtUserScope(
  runDirectory: RunDirectory,
  pluginId: string,
): Promise<Record<string, unknown>> {
  const settingsFile = join(runDirectory.configDir, "settings.json");
  let settings: unknown;
  try {
    settings = JSON.parse(await readFile(settingsFile, "utf8"));
  } catch {
    return {};
  }
  const pluginConfigs = (settings as { pluginConfigs?: Record<string, unknown> }).pluginConfigs;
  const configured = (pluginConfigs ?? {})[pluginId] as { options?: unknown } | undefined;
  const configuredOptions = configured?.options;
  return typeof configuredOptions === "object" && configuredOptions !== null
    ? (configuredOptions as Record<string, unknown>)
    : {};
}
