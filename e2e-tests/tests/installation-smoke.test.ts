/**
 * The installation smoke test (end-to-end-tests ticket 01).
 *
 * One command, and in seconds a contributor learns whether the plugin they have on disk still
 * installs and still presents its whole surface. A broken manifest, a `SessionStart` hook that
 * leaves nothing installed, a launcher that cannot find its data directory, an option that stopped
 * reaching the tools server: every one of those is total, and every one is invisible to `tsc`, to
 * `eslint` and to a human reading a diff.
 *
 * It involves no repository on the forge and asks no model for more than one trivial turn. Nothing
 * it produces is cleaned up — the run directory it names outlives it, passed or failed.
 */
import { test } from "node:test";
import {
  assertAgentsPresent,
  assertCommandsPresent,
  assertDependencyBroughtIn,
  assertOptionsAtUserScope,
  assertPluginMatchesWorkingTree,
  assertReviewToolsPresent,
  assertTrivialTurnAnswered,
  loadedPluginPath,
} from "../harness/matchers.ts";
import {
  installPluginUnderTest,
  readOptionsAtUserScope,
  type PluginOptions,
} from "../harness/install.ts";
import { directoryContents, workingTreePluginContents } from "../harness/working-tree.ts";
import { observeSession } from "../harness/session.ts";
import { readShippedSurface, REPOSITORY_ENV_FILE } from "../harness/repository.ts";
import { createRunDirectory } from "../harness/run-directory.ts";
import { stageWorkingTree } from "../harness/staged-copy.ts";

/**
 * The three options this run configures the plugin with, set through the plugin's own option
 * channel so the path an owner configures is the path under test.
 *
 * The delegated review is pointed at the cheapest thing that is still the real arrangement — the
 * `sonnet` model and the `low` effort tier — and at the repository's own environment file, handed
 * over whole. This test never starts a round; a build run against the same install would, and
 * these are the values it would run at.
 */
const REVIEW_OPTIONS: PluginOptions = {
  code_review_effort: "low",
  code_review_model: "sonnet",
  code_review_claude_env_file: REPOSITORY_ENV_FILE,
};

/** The plugin's declared dependency, which `/deliverer:refine` stops at stage 1 without. */
const DECLARED_DEPENDENCY = "mattpocock-skills";

/**
 * What the plugin ships, as the ticket states it: both commands, all seven agents. WHICH ones is
 * read off the plugin directory, so one added later is covered the day it ships; these are the
 * floor under that, so one deleted is an edit somebody makes here on purpose.
 */
const SHIPPED_COMMANDS = 2;
const SHIPPED_AGENTS = 7;

/**
 * The whole test, ceiling included. Measured at well under a minute on a warm host; the bound is
 * for the two things that can genuinely take time — cloning the official marketplace, and the cold
 * `npm ci` the plugin's install hook runs — and for saying so rather than hanging when one of them
 * never finishes.
 *
 * This test's own, and deliberately not the epic's: the wall-clock and spend ceilings the spec sets
 * for a whole delivery arrive with the tests that can spend, and this one asks for a single trivial
 * turn.
 */
const CEILING_MS = 10 * 60 * 1000;

test("the installed plugin comes up with both commands, every agent and all three review tools", {
  timeout: CEILING_MS,
}, async (t) => {
  const runDirectory = await createRunDirectory("installation-smoke");
  // Named first, because a failing run is read here rather than reproduced.
  t.diagnostic(`run directory: ${runDirectory.root}`);

  const staged = await stageWorkingTree(runDirectory);
  t.diagnostic(`staged ${staged.fileCount} files of the working tree at ${staged.commit}`);
  const installed = await installPluginUnderTest(runDirectory, staged, REVIEW_OPTIONS);
  // The runner's own ceiling, handed to the session so a wedged host is stopped rather than left
  // running behind a test that has already given up on it.
  const surface = await observeSession(runDirectory, t.signal);

  const written = await readOptionsAtUserScope(runDirectory, installed.pluginId);
  assertOptionsAtUserScope(written, REVIEW_OPTIONS);
  assertTrivialTurnAnswered(surface);

  const shipped = await readShippedSurface(installed.pluginName);
  assertCommandsPresent(surface, shipped.commands, SHIPPED_COMMANDS);
  assertAgentsPresent(surface, shipped.agents, SHIPPED_AGENTS);
  assertReviewToolsPresent(surface, installed.pluginName);
  assertDependencyBroughtIn(surface, DECLARED_DEPENDENCY);

  const loadedPath = loadedPluginPath(surface, installed.pluginName);
  assertPluginMatchesWorkingTree(
    loadedPath,
    await directoryContents(loadedPath),
    await workingTreePluginContents(runDirectory),
  );
});
