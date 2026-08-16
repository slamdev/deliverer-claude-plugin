/**
 * One session against the installed plugin, and what it presents (end-to-end-tests ticket 01).
 *
 * This is the harness's whole seam. A test observes what a human could observe — the commands, the
 * agents, the plugins and the tools the session came up with, and what it answered — and never how
 * any of it got there.
 *
 * **The order the session is driven in is measured, not incidental.** The host emits `system/init`
 * only once the first user message arrives, while the tools server connects on its own before
 * that: driven with the message held back, the run observed the server reach `connected` at 1.0 s
 * and `init` arrive at 6.1 s already reporting it. Sent immediately instead, `init` arrives with
 * the server still `pending` and the review tools absent from a session that has them a second
 * later — a smoke test that would fail on timing rather than on the plugin. So the message waits
 * for the server to settle, and `init` then describes the session a user would meet.
 *
 * The tool NAMES come from the session's own view of the server (`mcpServerStatus`), which carries
 * them once it is connected. Nothing here speaks to the tools server directly: watching it from
 * outside would be a second seam, which the spec's whole argument is about not having.
 *
 * Streaming input is what keeps that possible. A one-shot prompt closes the session's control
 * channel with the result, and a status request after it fails; an input stream held open across
 * the turn does not.
 */
import {
  query,
  type Query,
  type SDKMessage,
  type SDKUserMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { sessionEnvironment, type RunDirectory } from "./run-directory.ts";

/**
 * What the session is asked. A whole turn is what proves the session can reach a model at all —
 * the failure mode it catches is a run that comes up perfectly configured and cannot answer — and
 * nothing more is asked of it than that.
 */
const TRIVIAL_PROMPT = "Reply with the single word: ready";

/**
 * The model that trivial turn runs on. Pinned so the smoke test costs the same for everybody
 * rather than whatever the contributor's default happens to be. It is the harness's own choice and
 * says nothing about the plugin: the seven agents keep the models their frontmatter declares.
 */
const SESSION_MODEL = "sonnet";

/**
 * How long the tools server has to leave `pending`, and how often it is asked.
 *
 * Generous against what it covers: the first session in a run's configuration directory is the one
 * that installs the server's dependencies, and the launcher waits on that install itself. Measured
 * at ~4 s for a cold `npm ci` on a warm host — but a slow registry is a slow install, and a
 * deadline that fired first would report a plugin defect that is not there. A server that has
 * FAILED says so at once, so this bound is only ever paid by a run that is genuinely still working.
 */
const MCP_SETTLE_DEADLINE_MS = 120_000;
const MCP_POLL_MS = 500;

/** How much of the host's stderr to keep for a failure to quote. It is unbounded; this is not. */
const STDERR_LINES_KEPT = 40;

/**
 * What the host reports a server's connection as. Named as a set rather than left a bare string
 * because two files decide on it — the wait below on `pending`, the matcher on `connected` — and a
 * typo in either is a test that waits forever or passes on a server that never came up.
 */
export type McpServerStatus = "connected" | "failed" | "needs-auth" | "pending" | "disabled";

/** One MCP server as the session sees it. */
export interface McpServerObservation {
  readonly name: string;
  readonly status: McpServerStatus;
  readonly tools: readonly string[];
  readonly error: string | null;
}

/** Everything one session presented, which is everything the assertions are made against. */
export interface SessionSurface {
  /** where the session ran — the run's own empty directory, never this repository */
  readonly cwd: string;
  readonly commands: readonly string[];
  readonly agents: readonly string[];
  readonly plugins: readonly { readonly name: string; readonly path: string }[];
  readonly mcpServers: readonly McpServerObservation[];
  /** what the trivial turn answered, and how the session classified it */
  readonly reply: string;
  readonly resultSubtype: string;
  /** the tail of the host's stderr, so a failure can quote what the session complained about */
  readonly stderr: readonly string[];
}

/**
 * One session in the run's own empty directory, observed.
 *
 * `ceiling` is the caller's, and it is required rather than optional: it is what stops a session
 * that is wedged rather than slow. Node's test runner aborts it when the test times out, and
 * without it the host would keep running with nothing left watching — the runner would report a
 * timeout and then wait on a process it had stopped caring about.
 */
export async function observeSession(
  runDirectory: RunDirectory,
  ceiling: AbortSignal,
): Promise<SessionSurface> {
  // The repository's environment file, layered over the contributor's own environment and under
  // the run's directories: whatever the file says wins over what the shell happened to export,
  // which is what the `./claude` wrapper does with the same file, and neither can move the run out
  // of its own configuration and temporary directories.
  const environment = await sessionEnvironment(runDirectory);

  // Everything the run produced is on disk by the time the ceiling fires, so the failure is still
  // readable afterwards — it is only the process that goes.
  const stopped = new AbortController();
  if (ceiling.aborted) stopped.abort(ceiling.reason);
  else ceiling.addEventListener("abort", () => stopped.abort(ceiling.reason), { once: true });

  const stderr: string[] = [];
  // Declared here, above the generator that reads it: the host reports an unauthenticated session
  // as a successful result whose TEXT says it was not logged in and only then tears the stream
  // down, so a collected failure is the fallback for when no message says what went wrong.
  const streamFailures: unknown[] = [];
  let openInput: (() => void) | undefined;
  let closeInput: (() => void) | undefined;
  const inputOpen = new Promise<void>((resolve) => {
    openInput = resolve;
  });
  const inputClosed = new Promise<void>((resolve) => {
    closeInput = resolve;
  });

  async function* turn(): AsyncGenerator<SDKUserMessage> {
    await inputOpen;
    // Nothing is sent to a session that has already died. The wait ahead of this ends early when
    // the host fails, and writing into a transport that is gone would raise a second failure over
    // the first — the less legible one, since it says nothing about why the host went.
    if (streamFailures.length > 0) return;
    yield {
      type: "user",
      message: { role: "user", content: TRIVIAL_PROMPT },
      parent_tool_use_id: null,
    };
    await inputClosed;
  }

  const session = query({
    prompt: turn(),
    options: {
      cwd: runDirectory.sessionDir,
      // User and project settings and nothing else. User scope is the run's own configuration
      // directory — the marketplaces, the install and the three options; project scope is whatever
      // the directory the session runs in declares, which for a run with no clone is nothing. The
      // contributor's own machine settings are not a source, and neither is this repository's.
      settingSources: ["user", "project"],
      model: SESSION_MODEL,
      maxTurns: 1,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      abortController: stopped,
      env: environment,
      stderr: (data: string) => {
        for (const line of data.split("\n")) {
          if (line.trim() === "") continue;
          stderr.push(line);
          if (stderr.length > STDERR_LINES_KEPT) stderr.shift();
        }
      },
    },
  });

  const messages: SDKMessage[] = [];
  const drained = (async () => {
    try {
      for await (const message of session) {
        messages.push(message);
        // The turn is over; releasing the input stream is what ends the session.
        if (message.type === "result") closeInput?.();
      }
    } catch (error) {
      streamFailures.push(error);
      closeInput?.();
    }
  })();

  const mcpServers = await settledMcpServers(session, stopped.signal);
  openInput?.();
  await drained;

  const init = messages.find(
    (message) => message.type === "system" && message.subtype === "init",
  ) as Extract<SDKMessage, { type: "system"; subtype: "init" }> | undefined;
  const result = messages.find((message) => message.type === "result");
  if (init === undefined || result === undefined) {
    throw new Error(
      `the session never ${init === undefined ? "started" : "finished"}, so there is nothing to ` +
        `assert about the plugin. This is the harness or the host failing rather than a finding.` +
        labelled("cause", streamFailures.map(String)) +
        labelled("stderr", stderr),
    );
  }

  return {
    cwd: init.cwd,
    commands: init.slash_commands,
    agents: init.agents ?? [],
    plugins: init.plugins.map((plugin) => ({ name: plugin.name, path: plugin.path })),
    mcpServers,
    reply: result.subtype === "success" ? result.result : "",
    resultSubtype: result.subtype,
    stderr,
  };
}

/**
 * The MCP servers once there is at least one and none of them is `pending` any more, or whatever
 * they are when the deadline runs out.
 *
 * It never throws on a server that failed or never settled: that is a finding about the plugin,
 * and a matcher naming it reads better than an exception from inside the harness. A control
 * request that itself fails ends the wait for the same reason — the surface then carries what was
 * last seen, and the assertion says what was missing.
 */
async function settledMcpServers(
  session: Query,
  signal: AbortSignal,
): Promise<McpServerObservation[]> {
  const deadline = Date.now() + MCP_SETTLE_DEADLINE_MS;
  let observed: McpServerObservation[] = [];
  for (;;) {
    if (signal.aborted) return observed;
    try {
      observed = (await session.mcpServerStatus()).map((server) => ({
        name: server.name,
        status: server.status,
        tools: (server.tools ?? []).map((tool) => tool.name),
        error: server.error ?? null,
      }));
    } catch {
      return observed;
    }
    // An EMPTY list is not a settled one. The host answers this before it has registered the
    // plugin's server, and `[].some(pending)` is false — so a wait that accepted it would release
    // the turn at once and `init` would arrive with the server absent, which is the timing failure
    // this whole module exists to prevent (a review round found it). A run whose install genuinely
    // brought up no server waits out the deadline and is then reported by the matcher, which names
    // the plugin's own defect rather than a race in the harness.
    if (observed.length > 0 && !observed.some((server) => server.status === "pending")) {
      return observed;
    }
    if (Date.now() >= deadline) return observed;
    await new Promise((resolve) => setTimeout(resolve, MCP_POLL_MS));
  }
}

/** One labelled block of detail, or nothing at all when there is none to give. */
function labelled(label: string, lines: readonly string[]): string {
  return lines.length === 0 ? "" : `\n  ${label}: ${lines.join("\n    ")}`;
}
