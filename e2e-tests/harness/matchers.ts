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
import type { BuildOutcome } from "./build-run.ts";
import { minutes } from "./ceilings.ts";
import type { ChangeRequest, DeliveredCommit } from "./change-request.ts";
import { DEFAULT_BRANCH } from "./forge.ts";
import type { PluginOptions } from "./install.ts";
import type { RefineOutcome } from "./refine-run.ts";
import type { ObservedRun } from "./run.ts";
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
        `${surface.stderr.length === 0 ? "" : `\n  stderr: ${quoted(surface.stderr)}`}`,
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
 * A whole run, of either skill (end-to-end-tests tickets 02 and 03).
 *
 * Every one of these asserts an OUTCOME: what is in the working tree the run published into, what
 * the forge has, what the responder was asked, what the run directory kept. None of them looks
 * inside the run — not at a message, not at a dispatch, not at a tool call.
 * -------------------------------------------------------------------------------------------- */

/** The run reached its report rather than stopping on the way. */
export function assertRunFinished(outcome: ObservedRun): void {
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
      `the run finished and reported nothing. The last stage of either skill is the report, and ` +
        `a run that hands the human nothing has not finished — whatever it left behind.`,
    );
  }
}

/**
 * The run directory kept the session records — the orchestrator's and every dispatched agent's.
 *
 * A run with no dispatched records at all is one whose failures are only readable as the reports
 * that summarised them, which is the whole reason every run gets a configuration directory of its
 * own. `dispatches` is what the skill under test dispatches, in words, so a floor that is not met
 * says what was expected rather than only how many were counted.
 */
export function assertSessionRecordsKept(
  outcome: ObservedRun,
  dispatchedFloor: number,
  dispatches: string,
): void {
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
        `least ${dispatchedFloor} were expected — ${dispatches}, and a failure inside any of ` +
        `them is only readable from its own record. Kept: ` +
        `${records.dispatched.join(", ") || "none"}`,
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
  const published = outcome.epicsPublished;
  if (published.length !== 1) {
    assert.fail(
      `the run published ${published.length} epics under ` +
        `${outcome.fixture.tracker.root}/ where exactly one was expected: ` +
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
  // Whether it is a REAL spec — coherent, about this idea, with user stories worth cutting — is
  // the verifier's, and a length floor here would be an opinion dressed as a fact.
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

/* -------------------------------------------------------------------------------------------- *
 * A whole run of `/deliverer:build` (end-to-end-tests ticket 03).
 *
 * All of these read the forge — the **change request**, the commits on the **epic branch**, its
 * comments and its **checks** — except the one that counts **rounds**, which a round leaves no
 * record of anywhere else (`./report.ts` says why, and why that is the spec's own answer).
 * -------------------------------------------------------------------------------------------- */

/**
 * The one change request a delivery opened.
 *
 * Every matcher below needs it, so each of them fails the same way when there is none rather than
 * throwing on a null — a delivery that opened nothing has already been reported by
 * `assertChangeRequestOpened`, and a reader should not have to read a stack trace to hear it twice.
 */
function delivered(outcome: BuildOutcome, what: string): ChangeRequest {
  if (outcome.changeRequest === null) {
    assert.fail(
      `there is no single change request on ${outcome.repo.fullName} to check ${what} against. ` +
        `The repository carries ${outcome.changeRequests.length}: ` +
        `${outcome.changeRequests.map((request) => request.url).join(", ") || "none at all"}`,
    );
  }
  return outcome.changeRequest;
}

/**
 * The delivery opened exactly one change request, from a branch of its own.
 *
 * One, because a second is a delivery that lost its **bearings** — it takes them from whether a
 * change request is open for the branch, so two of them is a run that would resume itself wrongly.
 */
export function assertChangeRequestOpened(outcome: BuildOutcome): void {
  if (outcome.changeRequests.length !== 1) {
    assert.fail(
      `the delivery left ${outcome.changeRequests.length} change requests on ` +
        `${outcome.repo.fullName} where exactly one was expected: ` +
        `${outcome.changeRequests.map((request) => `${request.url} (${request.state})`).join(", ")
          || "none at all"}. Stage 2 opens one for the epic branch.`,
    );
  }
  const opened = delivered(outcome, "the branch it was opened from");
  if (opened.branch === "" || opened.branch === DEFAULT_BRANCH) {
    assert.fail(
      `${opened.url} was opened from ${opened.branch || "no branch this harness could read"} ` +
        `rather than from an epic branch of its own.`,
    );
  }
}

/**
 * No value of the scripted review double's selector reached the session.
 *
 * The double is opt-in and the real review is the default, so this is not about what the harness
 * chose — it is about what a contributor's own environment file or shell would have handed it. One
 * line left in either and every **round** replays a canned timeline: all seven stages pass having
 * reviewed nothing, which is a green test that reviewed nothing.
 */
export function assertNoScriptedBackend(outcome: BuildOutcome): void {
  const reached = Object.entries(outcome.scriptedBackend.reachedSession);
  if (reached.length === 0) return;
  assert.fail(
    `the session was given ${reached.map(([name, value]) => `${name}=${value}`).join(", ")}, so ` +
      `its tools server may have replayed a scripted review instead of running one. Nothing in ` +
      `the harness sets it; it arrives from the contributor's environment file or shell, and the ` +
      `run directory is supposed to keep it out.`,
  );
}

/**
 * The commits carrying no `Ticket:` line, split into the ones a **fix wave** accounts for and the
 * ones it does not.
 *
 * `ticket === null` alone is NOT "a fix wave's commit" — it is "carries no `Ticket:` line, for any
 * reason", and an implementer now commits several times per ticket, so a piece landing with that
 * line dropped or misspelled is likelier than it was. What separates the two is ORDER: the waves
 * run after stage 1 has finished every ticket, so every one of their commits is newer than every
 * ticket commit. An anonymous commit with a ticket commit still to come after it is a ticket's
 * piece that lost its line — `stray` — and stays held to all a ticket commit is held to. One after
 * the last ticket commit is `wave`'s, exempt from the mirror and required NOT to be mirrored.
 *
 * A branch where nothing names a ticket has no wave to attribute anything to — stage 1 produced
 * nothing for a wave to follow — so every anonymous commit there is stray, which is also the case
 * where a differently-worded `Ticket:` line is the likeliest explanation of all.
 *
 * `commits` arrives newest last (`./change-request.ts`), which is what makes this readable off the
 * data already parsed (PR #4 review).
 */
function anonymousCommits(commits: readonly DeliveredCommit[]): {
  readonly stray: readonly DeliveredCommit[];
  readonly wave: readonly DeliveredCommit[];
} {
  let lastTicketed = -1;
  commits.forEach((commit, index) => {
    if (commit.ticket !== null) lastTicketed = index;
  });
  const anonymous = commits
    .map((commit, index) => ({ commit, index }))
    .filter(({ commit }) => commit.ticket === null);
  return {
    stray: anonymous.filter(({ index }) => index < lastTicketed).map(({ commit }) => commit),
    wave: anonymous.filter(({ index }) => index > lastTicketed).map(({ commit }) => commit),
  };
}

/**
 * Every ticket the epic lists has a commit naming it.
 *
 * The `Ticket:` line is the contract — delivery takes its own bearings from it — so a ticket with
 * no commit is a ticket stage 1 never implemented, whatever the run reported.
 */
export function assertEveryTicketCommitted(outcome: BuildOutcome): void {
  const request = delivered(outcome, "the tickets it implemented");
  const expected = outcome.epic.tickets.map((ticket) => ticket.number);
  if (expected.length === 0 || expected.some((number) => number === null)) {
    assert.fail(
      `the epic at ${outcome.epic.directory} carries no numbered tickets, so there is nothing to ` +
        `hold the commits to. This is the fixture failing rather than the plugin.`,
    );
  }

  const committed = new Set(
    request.commits
      .map((commit) => commit.ticket)
      .filter((ticket): ticket is number => ticket !== null),
  );
  const missing = expected.filter((number) => !committed.has(number ?? -1));
  if (missing.length > 0) {
    // The commits that named no ticket are quoted, because the likeliest way to reach here is a
    // `Ticket:` line worded differently rather than a ticket nobody implemented — and delivery
    // takes its own bearings from that line, so the two are both findings and want telling apart.
    // A fix wave's commits carry no line either and are supposed to, so quoting them here would
    // list correct commits as suspicious: only the ones a wave cannot account for are listed.
    const anonymous = anonymousCommits(request.commits).stray.map(
      (commit) => `${commit.hash.slice(0, 12)} ${commit.subject}`,
    );
    assert.fail(
      `${missing.length} of the epic's ${expected.length} tickets have no commit naming them on ` +
        `${request.url}: ${missing.join(", ")}. The branch carries ${request.commits.length} ` +
        `commits, naming tickets ${[...committed].sort().join(", ") || "none"}.` +
        `${anonymous.length === 0 ? "" : `\n  naming no ticket:\n  ${anonymous.join("\n  ")}`}`,
    );
  }
}

/**
 * Every **assumption** the branch recorded carries an **assumption comment**, and each of those
 * carries a **verdict** reply.
 *
 * Both halves, because they are different stages failing. A commit's entry with no comment is stage
 * 2 not mirroring it — a fork the human never sees. A comment with no verdict is stage 3 not
 * adjudicating it — a fork nobody closed, on a change request that was flipped ready anyway.
 *
 * **Only a ticket's commits are held to the first half**, because only they are mirrored. A **fix
 * wave**'s commit carries no `Ticket:` line and records the forks that wave closed for a human to
 * meet on the commit itself; stage 2's mirror passes it over deliberately, and a comment for one of
 * its entries would be a fork nothing can adjudicate. Holding those commits here would fail a
 * correct delivery for doing what it was told (review-reliability ticket 11). Which commits those
 * are is decided by `anonymousCommits` above and not by `ticket === null` alone, so a ticket's
 * piece that lost its line is still held.
 *
 * **And the exemption is not a hole, because the inverse is asserted.** Skipping those commits
 * would on its own make a wave's entries being mirrored and NOT being mirrored both pass — the
 * exact regression ticket 11 was written against, reachable because the delivery skill calls a cold
 * re-dispatch of stage 2 safe. So no assumption comment may name one of those commits either: such
 * a comment is a fork nothing can adjudicate, put in front of the human after the adjudication
 * stage has already run (PR #4 review).
 *
 * **The verdict is counted structurally and not read.** What the adjudication promises is a reply
 * on the thread, or a comment opening `re: ASSUMPTION (<hash>)` where the channel carries no
 * threading; what it does NOT promise is the word `accept` in the prose, because a verdict is
 * stated as its **grounds**. So an answer is what this asserts, and which verdict it named rides
 * along for the reader (`./change-request.ts`).
 *
 * A branch that recorded no assumptions at all passes this vacuously, and says so: an implementer
 * that had no fork to leave open is an ordinary outcome, not something to fail a delivery over.
 */
export function assertAssumptionsAdjudicated(outcome: BuildOutcome): void {
  const request = delivered(outcome, "its assumptions");

  const { stray, wave } = anonymousCommits(request.commits);
  const strayHashes = new Set(stray.map((commit) => commit.hash));
  const waveHashes = new Set(wave.map((commit) => commit.hash));

  const uncommented: string[] = [];
  for (const commit of request.commits) {
    if (commit.assumptions === 0) continue;
    if (commit.ticket === null && !strayHashes.has(commit.hash)) continue;
    const comments = request.assumptionComments.filter((comment) =>
      commit.hash.startsWith(comment.commit),
    );
    if (comments.length < commit.assumptions) {
      uncommented.push(
        `${commit.hash.slice(0, 12)} (${commit.subject}) recorded ${commit.assumptions} and ` +
          `carries ${comments.length}`,
      );
    }
  }
  if (uncommented.length > 0) {
    assert.fail(
      `${uncommented.length} commits recorded more assumptions than the change request carries ` +
        `comments for, so a fork the code closed silently is in front of nobody:\n` +
        `  ${uncommented.join("\n  ")}`,
    );
  }

  const waveMirrored = request.assumptionComments.filter((comment) =>
    [...waveHashes].some((hash) => hash.startsWith(comment.commit)),
  );
  if (waveMirrored.length > 0) {
    assert.fail(
      `${waveMirrored.length} assumption comments on ${request.url} name a commit carrying no ` +
        `\`Ticket:\` line, so a fix wave's own fork was mirrored into a comment nothing can ` +
        `adjudicate — the adjudication stage had already run when that commit landed:\n` +
        `  ${waveMirrored.map((comment) => comment.opening).join("\n  ")}`,
    );
  }

  const unadjudicated = request.assumptionComments.filter((comment) => comment.answers === 0);
  if (unadjudicated.length > 0) {
    assert.fail(
      `${unadjudicated.length} of ${request.assumptionComments.length} assumption comments on ` +
        `${request.url} carry no verdict reply, so the fork each one names was never closed:\n` +
        `  ${unadjudicated.map((comment) => comment.opening).join("\n  ")}`,
    );
  }
}

/**
 * Two **rounds** completed, which is the bar stage 7 waits on.
 *
 * Read out of the run's own report, because a round leaves no other record: the tools server holds
 * its state in memory for the life of the session, and the findings it posts are comments like any
 * other. The spec rejected watching the review tool calls as a second seam and said the round's own
 * reported outcome carries what is needed; this is that outcome (`./report.ts`).
 */
export function assertRoundsCompleted(outcome: BuildOutcome, floor: number): void {
  const completed = outcome.roundsCompleted;
  if (completed === null) {
    assert.fail(
      `the run's report does not say how many rounds completed, and nothing else records one. ` +
        `Stage 7 waits on ${floor}, and the report is asked for the count in so many words — so ` +
        `this is either a report that stopped saying it or a reader that stopped recognising how ` +
        `it says it. The report:\n  ${quoted(outcome.run.report.split("\n"))}`,
    );
  }
  if (completed < floor) {
    assert.fail(
      `the run reported ${completed} completed rounds where stage 7 waits on ${floor}. A change ` +
        `request flipped ready on fewer is one shipping a review nobody did.`,
    );
  }
}

/**
 * The change request was **flipped ready** — taken out of draft.
 *
 * That is stage 7 having run, and it is earned by two completed rounds and green checks and by
 * nothing else. A delivery that left it a draft reported why; this says it happened.
 */
export function assertFlippedReady(outcome: BuildOutcome): void {
  const request = delivered(outcome, "whether it was flipped ready");
  if (request.isDraft) {
    assert.fail(
      `${request.url} is still a draft. Stage 7 takes it out of draft once two rounds have ` +
        `completed and the checks are green, so either it did not run or it found one of those ` +
        `wanting. The run reported:\n  ${quoted(outcome.run.report.split("\n"))}`,
    );
  }
}

/**
 * The **checks** are green — all of them, and there is at least one.
 *
 * The empty case is the interesting one, and it is reported as what it is rather than as a pass: a
 * change request with no checks at all is not green, it is unjudged, and the fixture ships a CI
 * workflow precisely so that green means something. §Further Notes recorded exactly this as a
 * **claim** — that a freshly created private repository's workflow runs reach the plugin as checks
 * in time for stage 7 — and a run that finds none has settled it the other way.
 */
export function assertChecksGreen(outcome: BuildOutcome): void {
  const request = delivered(outcome, "its checks");
  if (request.checks.length === 0) {
    assert.fail(
      `${request.url} carries no checks at all, so "the checks are green" says nothing. The ` +
        `fixture ships a CI workflow that runs on every change request; a fresh private ` +
        `repository whose workflow runs never reached the plugin is the claim §Further Notes ` +
        `recorded, and this run has settled it.`,
    );
  }
  const red = request.checks.filter((check) => !isGreen(check.status, check.conclusion));
  if (red.length > 0) {
    const named = red.map((check) => `${check.name} (${check.conclusion || check.status})`);
    assert.fail(
      `${red.length} of ${request.checks.length} checks on ${request.url} are not green: ` +
        `${named.join(", ")}. Stage 7 flips a change request ready on green, so either the fix ` +
        `waves left the branch red or the flip did not wait.`,
    );
  }
  // A check the forge skipped is not a check that passed. Counting one as green is right — a job
  // that had no work for this change request is nobody's failure — but a change request whose
  // every check was skipped is as unjudged as one carrying none, which is the case above.
  if (!request.checks.some((check) => check.conclusion === "SUCCESS")) {
    const named = request.checks.map((check) => `${check.name} (${check.conclusion})`);
    assert.fail(
      `no check on ${request.url} actually ran and passed — ${named.join(", ")}. A workflow that ` +
        `was skipped leaves the change request as unjudged as one with no checks at all, and the ` +
        `fixture ships its CI workflow so that green means something.`,
    );
  }
}

/** What the forge calls a check that passed, or one it had no work for. */
function isGreen(status: string, conclusion: string): boolean {
  if (status !== "" && status !== "COMPLETED") return false;
  return ["SUCCESS", "SKIPPED", "NEUTRAL"].includes(conclusion);
}

/** The verifier passed on both of the questions no assertion could settle. */
export function assertVerdictPassed(verdict: Verdict): void {
  if (verdict.passed) return;
  const failed = verdict.subjects
    .filter((subject) => !subject.passed)
    .map((subject) => `${subject.subject}: ${subject.grounds}`);
  assert.fail(
    `the verifier judged what the run delivered and failed it: ${verdict.summary}\n` +
      `  ${failed.join("\n  ") || "(it named no failing subject, which is a verdict this " +
        "harness cannot read)"}`,
  );
}
