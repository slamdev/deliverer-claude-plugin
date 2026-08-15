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
import { minutes } from "./ceilings.ts";
import type { PluginOptions } from "./install.ts";
import type { RefineOutcome } from "./refine-run.ts";
import type { SessionSurface } from "./session.ts";
import type { Verdict } from "./verifier.ts";
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

/** A collected stream, one line per line, indented under whatever labelled it. */
function quoted(lines: readonly string[]): string {
  return lines.join("\n    ");
}

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

/* -------------------------------------------------------------------------------------------- *
 * A whole run of `/deliverer:refine` (end-to-end-tests ticket 02).
 *
 * Every one of these asserts an OUTCOME: what is in the working tree the run published into, what
 * the forge has, what the responder was asked, what the run directory kept. None of them looks
 * inside the run — not at a message, not at a dispatch, not at a tool call.
 * -------------------------------------------------------------------------------------------- */

/** The run reached its report rather than stopping on the way. */
export function assertRunFinished(outcome: RefineOutcome): void {
  if (outcome.run.resultSubtype !== "success") {
    assert.fail(
      `the run ended as ${outcome.run.resultSubtype} rather than success after ` +
        `${minutes(outcome.run.durationMs)} and ${outcome.run.numTurns} turns. Its session ` +
        `records are in ${outcome.runDirectory.root}.` +
        `${outcome.run.stderr.length === 0 ? "" : `\n  stderr: ${quoted(outcome.run.stderr)}`}`,
    );
  }
  if (outcome.run.report.trim() === "") {
    assert.fail(
      `the run finished and reported nothing. Stage 5 is the report, and a run that hands the ` +
        `human nothing has not finished — whatever it left in the working tree.`,
    );
  }
}

/**
 * The grilling ran, and the responder answered it out of the fixture's brief.
 *
 * Two failures hide here and neither is the other. A run that asked NOTHING skipped stage 1: a
 * brief an earlier run left in the operating system's temporary directory is proof to a refinement
 * that the grilling already happened, which is what `./brief.ts` collects each run's own away to
 * prevent and this catches when prevention did not reach. A run whose questions were answered by
 * the harness's fallback was answered by nobody: the recommended option went back because the
 * responder could not, so the epic that came out is not the one the fixture's brief describes.
 */
export function assertGrillingAnswered(outcome: RefineOutcome): void {
  const answered = outcome.responder;
  if (answered.rounds === 0) {
    assert.fail(
      `the run never put a question to the responder, so stage 1 did not run and this epic is ` +
        `whatever an earlier one left behind. A refinement treats a brief in the operating ` +
        `system's temporary directory as proof that the grilling already happened, and one was ` +
        `already sitting there when this run started: ` +
        `${outcome.briefs.beforeRun.join(", ") || "none that this harness could see"}. A run ` +
        `collects its own on the way out; one a killed run left behind is removed by hand.`,
    );
  }
  // A round that failed and was answered on the retry is not a finding: the answer still came from
  // the brief. What is a finding is an answer that never did.
  if (answered.fallbacks > 0) {
    const fell = answered.answers
      .filter((answer) => answer.fallback)
      .map((answer) => answer.question);
    assert.fail(
      `${answered.fallbacks} of ${answered.answers.length} questions were answered by the ` +
        `harness's own fallback rather than from the fixture's brief, so this epic is not ` +
        `the one the brief describes.\n` +
        `  fell back on: ${fell.join("; ") || "none"}\n` +
        `  the responder reported: ${answered.failures.join("; ") || "nothing"}`,
    );
  }
}

/** Exactly one epic appeared in the working tree, where the fixture's conventions put one. */
export function assertEpicPublished(outcome: RefineOutcome): void {
  const published = outcome.epicsAfter.filter((slug) => !outcome.epicsBefore.includes(slug));
  if (published.length !== 1) {
    assert.fail(
      `the run published ${published.length} epics under ` +
        `${outcome.fixture.trackerRoot}/ where exactly one was expected: ` +
        `${published.join(", ") || "none at all"}. Before the run there were ` +
        `${outcome.epicsBefore.join(", ") || "none"}; after it, ` +
        `${outcome.epicsAfter.join(", ") || "none"}.`,
    );
  }
}

/** The spec is published, where the conventions put it, carrying the label they name. */
export function assertSpecPublished(outcome: RefineOutcome): void {
  const epic = outcome.epic;
  if (epic.specPath === null) {
    assert.fail(
      `the run published no spec at ${epic.directory}/spec.md, which is where this fixture's ` +
        `conventions put one. What it left there instead: ` +
        `${[...epic.otherFiles, ...epic.tickets.map((ticket) => ticket.path)].join(", ")
          || "nothing"}`,
    );
  }
  if (epic.specText.trim().length < 500) {
    assert.fail(
      `the spec at ${epic.specPath} is ${epic.specText.trim().length} characters long, which is ` +
        `too short to be one. A spec states the problem, the solution, its user stories and the ` +
        `decisions behind them.`,
    );
  }
  assertTriageLabel(outcome, epic.specPath ?? "", epic.specTriageLabel, "the spec");
}

/**
 * One file per ticket, numbered from `01`, each declaring what blocks it.
 *
 * The numbers are the contract and not the presentation: delivery records a ticket on its commits
 * by number, so a set that skips one or starts at `1` is a set whose edges name something that is
 * not there.
 */
export function assertTicketsPublished(outcome: RefineOutcome): void {
  const epic = outcome.epic;
  if (epic.tickets.length === 0) {
    assert.fail(
      `the run published no tickets under ${epic.directory}/issues/. A spec with no tickets is ` +
        `half an epic: stage 4 is what cuts it into slices.` +
        `${epic.otherFiles.length === 0 ? "" : ` It left ${epic.otherFiles.join(", ")} instead.`}`,
    );
  }

  const unnumbered = epic.tickets.filter((ticket) => ticket.number === null);
  if (unnumbered.length > 0) {
    assert.fail(
      `${unnumbered.length} ticket files carry no number: ` +
        `${unnumbered.map((ticket) => ticket.file).join(", ")}. Tickets are numbered from ` +
        `01, and a blocking edge names a ticket by its number.`,
    );
  }

  const numbers = epic.tickets
    .map((ticket) => ticket.number ?? 0)
    .sort((left, right) => left - right);
  const expected = numbers.map((_, index) => index + 1);
  if (numbers.join(",") !== expected.join(",")) {
    assert.fail(
      `the tickets are numbered ${numbers.join(", ")} where a set of ${numbers.length} is ` +
        `numbered ${expected.join(", ")} — from 01, with nothing skipped and nothing repeated.`,
    );
  }
  const unpadded = epic.tickets.filter((ticket) => !/^\d\d/.test(ticket.file));
  if (unpadded.length > 0) {
    assert.fail(
      `${unpadded.map((ticket) => ticket.file).join(", ")} do not carry a two-digit number, so ` +
        `they sort out of order the moment there are ten of them.`,
    );
  }

  const silent = epic.tickets.filter((ticket) => !ticket.declaresBlockingEdges);
  if (silent.length > 0) {
    assert.fail(
      `${silent.length} of ${epic.tickets.length} tickets declare no blocking edges: ` +
        `${silent.map((ticket) => ticket.file).join(", ")}. Every ticket says what blocks it, or ` +
        `that nothing does — that is what puts them in dependency order.`,
    );
  }

  for (const ticket of epic.tickets) {
    assertTriageLabel(outcome, ticket.path, ticket.triageLabel, `ticket ${ticket.file}`);
  }
}

/** The label this fixture's conventions name for work ready for an agent, where they name one. */
function assertTriageLabel(
  outcome: RefineOutcome,
  path: string,
  found: string | null,
  what: string,
): void {
  const expected = outcome.fixture.readyForAgentLabel;
  if (expected === null || found === expected) return;
  assert.fail(
    `${what} at ${path} carries ` +
      `${found === null ? "no triage label" : `the triage label ${found}`} where this ` +
      `fixture's conventions name ${expected} for work that is ready for an agent. ` +
      `Whatever picks the work up next reads that line.`,
  );
}

/**
 * The run pushed nothing.
 *
 * This is what lets the repository stand rather than be thrown away: with nothing written back, no
 * two runs can reach each other. Asked of the FORGE and not of the clone, because a clone whose own
 * branch moved says nothing about what was published to it.
 */
export function assertNothingPushed(outcome: RefineOutcome): void {
  if (outcome.remoteHeadAfterRun !== outcome.standingRepo.headBeforeRun) {
    assert.fail(
      `${outcome.standingRepo.fullName} moved from ${outcome.standingRepo.headBeforeRun} to ` +
        `${outcome.remoteHeadAfterRun} during the run. A refinement pushes nothing, and a ` +
        `standing repo one run can write to is one the next run inherits.`,
    );
  }
}

/**
 * The run directory kept the session records — the orchestrator's and every dispatched agent's.
 *
 * Refinement dispatches two **writers**, so a run with no dispatched records at all is one whose
 * failures are only readable as the reports that summarised them.
 */
export function assertSessionRecordsKept(outcome: RefineOutcome, dispatchedFloor: number): void {
  const records = outcome.records;
  if (records.sessions.length === 0) {
    assert.fail(
      `the run left no session records under ${records.root}, so nothing about it can be read ` +
        `afterwards. Every run gets its own configuration directory precisely so they land there.`,
    );
  }
  if (records.dispatched.length < dispatchedFloor) {
    assert.fail(
      `the run kept ${records.dispatched.length} dispatched agents' session records where at ` +
        `least ${dispatchedFloor} were expected — refinement dispatches a spec writer and a ` +
        `tickets writer, and a failure inside either is only readable from its own record. Kept: ` +
        `${records.dispatched.join(", ") || "none"}`,
    );
  }
}

/** The verifier passed on both of the questions no assertion could settle. */
export function assertVerdictPassed(verdict: Verdict): void {
  if (verdict.passed) return;
  const failed = verdict.judgements
    .filter((judgement) => !judgement.passed)
    .map((judgement) => `${judgement.subject}: ${judgement.grounds}`);
  assert.fail(
    `the verifier judged what the run delivered and failed it: ${verdict.summary}\n` +
      `  ${failed.join("\n  ") || "(it named no failing judgement, which is a verdict this " +
        "harness cannot read)"}`,
  );
}
