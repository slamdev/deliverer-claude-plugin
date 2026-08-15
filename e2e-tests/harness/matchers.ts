/**
 * The named matchers every test asserts through (end-to-end-tests ticket 01).
 *
 * They exist so that when the plugin's output moves, one place moves with it rather than every
 * test — and so that a failure names what was missing instead of printing two arrays and leaving
 * the reader to diff them.
 *
 * Each of them asserts an OUTCOME a human could have checked by hand: what the session came up
 * with, what the install wrote, what the loaded plugin contains. None of them asserts a mechanism.
 */
import assert from "node:assert/strict";
import type { PluginOptions } from "./install.ts";
import type { SessionSurface } from "./session.ts";
import type { FileFingerprint } from "./working-tree.ts";

/**
 * The three tools the tools server registers. Written down here rather than imported from
 * `plugin/mcp/server/index.ts`: this package shares nothing with the server's, and these three
 * names are a contract — they are what the shipped `code-reviewer` agent calls by name, so a rename
 * that reached only one side of it is a defect this test should report rather than follow.
 */
const REVIEW_TOOLS = ["code_review_start", "code_review_status", "code_review_cancel"];

/** The host's own answer when a session has no credentials, which it reports as a SUCCESS. */
const NOT_LOGGED_IN = /^\s*not logged in\b/i;

/** Everything in `expected` that `actual` does not have, in the order it was expected. */
function missingFrom(expected: readonly string[], actual: readonly string[]): string[] {
  const present = new Set(actual);
  return expected.filter((name) => !present.has(name));
}

/**
 * Everything the plugin ships of one kind is in the session, and the plugin ships at least as many
 * of them as it is supposed to.
 *
 * The two halves catch opposite failures, and neither is enough on its own. `expected` is read off
 * the plugin directory rather than written down (`./repository.ts` says why), so a skill or an
 * agent added later is covered the day it ships — but a shipped file DELETED takes its own
 * expectation with it, and staging that copied nothing would expect nothing at all. `floor` is the
 * bar the ticket states in words: two commands, seven agents. It is a FLOOR and not a count, so
 * growing the plugin costs nothing and shrinking it is a deliberate edit here.
 */
function assertAllPresent(
  kind: string,
  floor: number,
  expected: readonly string[],
  present: readonly string[],
): void {
  if (expected.length < floor) {
    assert.fail(
      `the plugin ships ${expected.length} ${kind} where this test expects at least ${floor}: ` +
        `${expected.join(", ") || "none at all"}. Either the plugin lost one, or nothing was ` +
        `staged — and the assertion below would pass on both.`,
    );
  }
  const missing = missingFrom(expected, present);
  if (missing.length > 0) {
    assert.fail(
      `the session is missing ${missing.length} of the plugin's ${expected.length} ${kind}: ` +
        `${missing.join(", ")}. It came up with: ${present.join(", ")}`,
    );
  }
}

/** Both `/deliverer:*` commands are in the session. */
export function assertCommandsPresent(
  surface: SessionSurface,
  expected: readonly string[],
  floor: number,
): void {
  assertAllPresent("commands", floor, expected, surface.commands);
}

/** All seven agents are in the session. */
export function assertAgentsPresent(
  surface: SessionSurface,
  expected: readonly string[],
  floor: number,
): void {
  assertAllPresent("agents", floor, expected, surface.agents);
}

/**
 * The tools server is connected and all three review tools are in the session.
 *
 * This is the assertion the whole installation exists for. A plugin whose options never reached it
 * comes up exactly like this one but with no server at all, and a delivery against it reaches its
 * first round and finds no review tool.
 */
export function assertReviewToolsPresent(surface: SessionSurface, pluginName: string): void {
  // The host namespaces a plugin's servers — `plugin:deliverer:tools` for the `tools` server in
  // `plugin/.mcp.json` — and the harness matches on the plugin's name rather than on that prefix,
  // which is the host's business and not the plugin's.
  const servers = surface.mcpServers.filter((server) => server.name.includes(pluginName));
  if (servers.length === 0) {
    const started = surface.mcpServers.map((server) => `${server.name} (${server.status})`);
    assert.fail(
      `the session started no tools server for ${pluginName}. Its three options are what start ` +
        `one, and at project scope they are ignored silently. The session's servers: ` +
        `${started.join(", ") || "none"}`,
    );
  }
  for (const server of servers) {
    if (server.status !== "connected") {
      assert.fail(
        `the tools server ${server.name} is ${server.status} rather than connected` +
          `${server.error === null ? "" : `: ${server.error}`}. A session that reaches a round ` +
          `with this server would find no review tool.`,
      );
    }
    const missing = missingFrom(REVIEW_TOOLS, server.tools);
    if (missing.length > 0) {
      assert.fail(
        `the tools server ${server.name} is connected but does not carry ${missing.join(", ")}. ` +
          `It offers: ${server.tools.join(", ") || "no tools at all"}`,
      );
    }
  }
}

/**
 * The plugin brought its declared dependency in with it.
 *
 * Nothing installs `mattpocock-skills` separately: the marketplace entry declares it, the install
 * resolves it, and a session carrying both when the harness asked for one is the evidence that the
 * declaration works. Refinement's stage 1 is what stops running when it does not.
 */
export function assertDependencyBroughtIn(surface: SessionSurface, dependency: string): void {
  const loaded = surface.plugins.map((plugin) => plugin.name);
  if (!loaded.includes(dependency)) {
    assert.fail(
      `the session does not carry ${dependency}, which the marketplace entry declares as a ` +
        `dependency and the install should have brought in. It loaded: ` +
        `${loaded.join(", ") || "no plugins"}`,
    );
  }
}

/** Where the session loaded the plugin from — the copy its contents are compared against. */
export function loadedPluginPath(surface: SessionSurface, pluginName: string): string {
  const loaded = surface.plugins.find((plugin) => plugin.name === pluginName);
  if (loaded === undefined) {
    assert.fail(
      `the session did not load ${pluginName} at all. It loaded: ` +
        `${surface.plugins.map((plugin) => plugin.name).join(", ") || "no plugins"}`,
    );
  }
  return loaded.path;
}

/**
 * What the session loaded is the working tree, file for file.
 *
 * The point of the staged copy is that a pass is about the change in front of the contributor
 * rather than the last commit somebody else made, and this is what holds it to that: an
 * uncommitted edit is in the working tree, so it has to be in the install too.
 */
export function assertPluginMatchesWorkingTree(
  loadedPath: string,
  loaded: ReadonlyMap<string, FileFingerprint>,
  workingTree: ReadonlyMap<string, FileFingerprint>,
): void {
  assert.notEqual(workingTree.size, 0, "the working tree's plugin directory is empty");
  const differences: string[] = [];
  for (const [path, expected] of workingTree) {
    const installed = loaded.get(path);
    if (installed === undefined) {
      differences.push(`${path} is missing from the install`);
    } else if (installed.digest !== expected.digest) {
      differences.push(`${path} differs from the working tree`);
    } else if (installed.executable !== expected.executable) {
      // The install hook is the file this is here for: without its executable bit the launcher
      // recovers through `bash` and the session that a user's install gives them is never tested.
      differences.push(
        installed.executable
          ? `${path} is executable in the install and not in the working tree`
          : `${path} lost its executable bit somewhere in the install`,
      );
    }
  }
  for (const path of loaded.keys()) {
    if (!workingTree.has(path)) {
      differences.push(`${path} is in the install and not in the working tree`);
    }
  }
  if (differences.length > 0) {
    const counted = `${differences.length} ` +
      `${differences.length === 1 ? "difference" : "differences"}`;
    assert.fail(
      `the plugin the session loaded is not the working tree ` +
        `(${counted}, loaded from ${loadedPath}):\n` +
        `  ${differences.slice(0, 20).join("\n  ")}` +
        `${differences.length > 20 ? `\n  … and ${differences.length - 20} more` : ""}`,
    );
  }
}

/**
 * The three options are at user scope in the run's own configuration directory, with the values the
 * run set.
 *
 * At project scope they are ignored and the server never starts — the failure that looks exactly
 * like a plugin with no review tool — so the write is checked where the host will read it.
 */
export function assertOptionsAtUserScope(
  written: Record<string, unknown>,
  expected: PluginOptions,
): void {
  const wrong = Object.entries(expected)
    .filter(([key, value]) => written[key] !== value)
    .map(([key, value]) => `${key} should be "${value}" and is ${JSON.stringify(written[key])}`);
  if (wrong.length > 0) {
    assert.fail(
      `the install did not leave the plugin's options at user scope: ${wrong.join("; ")}`,
    );
  }
}

/**
 * The session answered.
 *
 * Nothing about the answer matters beyond its existing, except for one string: the host classifies
 * an unauthenticated run as a SUCCESSFUL result whose text says it was not logged in — the same
 * misclassification `plugin/mcp/server/agent-backend.ts` manufactures a failure from — so a smoke
 * test that only checked the subtype would pass on a session that reached no model at all.
 */
export function assertTrivialTurnAnswered(surface: SessionSurface): void {
  if (surface.resultSubtype !== "success") {
    assert.fail(
      `the session's trivial turn ended as ${surface.resultSubtype} rather than success` +
        `${surface.stderr.length === 0 ? "" : `\n  stderr: ${surface.stderr.join("\n    ")}`}`,
    );
  }
  if (NOT_LOGGED_IN.test(surface.reply)) {
    assert.fail(
      `the session ran but was NOT LOGGED IN, so it reached no model: ${surface.reply.trim()}. ` +
        `The credentials come from the repository's .env, handed to the session whole.`,
    );
  }
  if (!surface.reply.toLowerCase().includes("ready")) {
    assert.fail(
      `the session answered something other than the word it was asked for: ${surface.reply}`,
    );
  }
}
