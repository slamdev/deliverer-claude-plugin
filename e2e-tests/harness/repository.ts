/**
 * The repository under test: where it is, and the four things every run reads out of it
 * (end-to-end-tests ticket 01).
 *
 * The root is resolved from THIS FILE's own location and never from `process.cwd()`. The test
 * runner is started from `e2e-tests/` today, but nothing promises that, and a harness that resolved
 * the wrong root would stage some other directory and report on a plugin nobody edited.
 *
 * The two manifests are READ rather than repeated. The marketplace's name, the plugin's name and
 * the marketplace its dependency comes from are all facts the repository already states, and a
 * second copy of them here is a copy that goes stale silently — the install would fail naming a
 * plugin that no longer exists, which reads as a broken plugin rather than a stale harness.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** `e2e-tests/` sits at the repository root, so the root is two directories up from here. */
export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The product. Everything a run installs is a copy of this directory. */
export const PLUGIN_DIR = join(REPOSITORY_ROOT, "plugin");

/** The marketplace entry publishing it, and the source a run's own marketplace is added from. */
export const MARKETPLACE_MANIFEST = join(REPOSITORY_ROOT, ".claude-plugin", "marketplace.json");

/**
 * The repository's own environment file — gitignored, and the contributor's credentials.
 *
 * It is handed to a run whole and never inspected: see `./env-file.ts`.
 */
export const REPOSITORY_ENV_FILE = join(REPOSITORY_ROOT, ".env");

/** What `.claude-plugin/marketplace.json` says, narrowed to the three facts an install needs. */
export interface MarketplaceEntry {
  /** the marketplace's own name — half of the `plugin@marketplace` id an install is given */
  readonly marketplaceName: string;
  /** the plugin's name — the other half */
  readonly pluginName: string;
  /** the marketplaces the entry declares dependencies on, which decide the install ORDER */
  readonly dependencyMarketplaces: readonly string[];
}

export async function readMarketplaceEntry(): Promise<MarketplaceEntry> {
  const manifest: unknown = JSON.parse(await readFile(MARKETPLACE_MANIFEST, "utf8"));
  const plugins = (manifest as { plugins?: unknown }).plugins;
  const marketplaceName = (manifest as { name?: unknown }).name;
  if (typeof marketplaceName !== "string" || !Array.isArray(plugins) || plugins.length !== 1) {
    throw new Error(
      `${MARKETPLACE_MANIFEST} is not the manifest this harness knows how to install from: it ` +
        `needs a string "name" and exactly one entry under "plugins".`,
    );
  }
  const entry = plugins[0] as { name?: unknown; dependencies?: unknown };
  if (typeof entry.name !== "string") {
    throw new Error(`${MARKETPLACE_MANIFEST} declares a plugin with no string "name".`);
  }
  const dependencies = Array.isArray(entry.dependencies) ? entry.dependencies : [];
  return {
    marketplaceName,
    pluginName: entry.name,
    dependencyMarketplaces: dependencies
      .map((dependency) => (dependency as { marketplace?: unknown }).marketplace)
      .filter((marketplace): marketplace is string => typeof marketplace === "string"),
  };
}

/**
 * Everything the plugin ships that a session is supposed to present, named the way a session names
 * it: `deliverer:build`, `deliverer:implementer`.
 *
 * Read off disk rather than written down here, and that is a decision. The bar this test holds is
 * "everything the plugin ships loads", so a plugin that grows an eighth agent is covered by the
 * test the day it lands rather than the day somebody remembers to extend a list. What a derived
 * list cannot catch — a shipped file DELETED, which takes the expectation with it — is the one
 * thing a reader of the diff sees immediately, and it is not the failure this test exists for: an
 * agent that is present on disk and absent from the session is.
 *
 * The matchers refuse an empty set for the same reason (`./matchers.ts`): staging that copied
 * nothing would otherwise expect nothing and pass.
 */
export interface ShippedSurface {
  /** one per `plugin/skills/<name>/SKILL.md` */
  readonly commands: readonly string[];
  /** one per `plugin/agents/<name>.md` */
  readonly agents: readonly string[];
}

export async function readShippedSurface(pluginName: string): Promise<ShippedSurface> {
  const skillsDir = join(PLUGIN_DIR, "skills");
  const agentsDir = join(PLUGIN_DIR, "agents");
  const skillDirectories = await readdir(skillsDir, { withFileTypes: true });
  const agentFiles = await readdir(agentsDir, { withFileTypes: true });
  const commands = await Promise.all(
    skillDirectories
      .filter((entry) => entry.isDirectory())
      .map((entry) => declaredName(join(skillsDir, entry.name, "SKILL.md"))),
  );
  const agents = await Promise.all(
    agentFiles
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => declaredName(join(agentsDir, entry.name))),
  );
  return {
    commands: commands.map((name) => `${pluginName}:${name}`).sort(),
    agents: agents.map((name) => `${pluginName}:${name}`).sort(),
  };
}

/** The `name:` a skill or an agent declares in its frontmatter, and what a session calls it. */
async function declaredName(path: string): Promise<string> {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(await readFile(path, "utf8"));
  const name = frontmatter === null ? null : /^name:[ \t]*(.+)$/m.exec(frontmatter[1] ?? "");
  if (name === null) {
    throw new Error(
      `${path} declares no "name:" in its frontmatter, so nothing can be expected of it.`,
    );
  }
  return (name[1] ?? "").trim();
}
