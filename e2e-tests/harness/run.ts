/**
 * One whole **run**, driven and observed from outside it (end-to-end-tests ticket 02).
 *
 * This is the seam, and it is the only one. A test hands the session a command, waits for the
 * report, and then reads what a human could read afterwards: the files in the working tree, what
 * the forge has, and the run's own session records. **Nothing below that is watched** — not which
 * agents were dispatched, not in what order, not a single tool call to the tools server. That is
 * the spec's whole argument, and it is why no test here is coupled to how a stage happens to be
 * implemented.
 *
 * So this module keeps the result and the host's stderr, and deliberately keeps no message stream.
 * The one thing it does reach into mid-run is the permission callback, which is not an observation:
 * it is where the human would have been sitting.
 *
 * The ceilings are enforced here because this is the only place that knows both what a run has
 * spent and how long it has been going. The wall clock is the harness's own timer, since nothing
 * else would stop a wedged orchestrator; the spend is the SDK's, whose option was measured to bind
 * against the provider the environment file selects (ticket 02 settled it) and which reports a run
 * it stopped rather than raising a failure of its own.
 *
 * **The input stream is held open for the whole run, and that is load-bearing.** A **dispatch**
 * does not block the orchestrator: the agent goes away to work and a notification brings the
 * orchestrator back when its **report** lands. So a run's own turn ends several times before the
 * run does — and a one-shot prompt closes the session at the first of them. Measured (ticket 02):
 * driven that way, `/deliverer:refine` ended `success` with its spec writer still working, having
 * published no tickets and reported nothing, which is a green light for a run that delivered half
 * an epic. Held open, the same session takes the notification and carries on by itself, exactly as
 * the interactive one a user drives does.
 *
 * That leaves the harness to decide when a run is OVER, and it has two answers rather than one.
 * The run's own last word is the first: a report that names the call that delivers what it built is
 * a run that reached its final stage. Silence is the backstop — nothing at all for the grace period
 * below — because a report whose wording moves must not hang a test until the wall clock.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  query,
  type CanUseTool,
  type SDKMessage,
  type SDKUserMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { CeilingReached, type Ceilings } from "./ceilings.ts";
import { sessionEnvironment, type RunDirectory } from "./run-directory.ts";

/** How much of the host's stderr to keep for a failure to quote. It is unbounded; this is not. */
const STDERR_LINES_KEPT = 60;

/**
 * How long a run may say nothing at all before it is taken to be over.
 *
 * Generous, and deliberately so. A session waiting on a **dispatch** is not silent — the host
 * reports the dispatched agent's progress while it works — but a single long turn inside a writer
 * running at `opus` and `high` effort can be, and ending a run in the middle of one would fail a
 * test on the harness's impatience. It is only ever paid by a run whose report did not say it had
 * finished, and the wall clock sits above it either way.
 */
const IDLE_GRACE_MS = 10 * 60 * 1000;

/** How often that silence is checked. */
const IDLE_POLL_MS = 15_000;

export interface RunOptions {
  readonly runDirectory: RunDirectory;
  /** where the session runs: the clone, which is how a fixture's conventions reach the plugin */
  readonly cwd: string;
  /** what the session is asked — `/deliverer:refine <idea>` */
  readonly command: string;
  readonly ceilings: Ceilings;
  /** the human's seat: everything allowed, every question answered (`./responder.ts`) */
  readonly canUseTool: CanUseTool;
  /** what the harness's own agents have spent, so one ceiling covers the whole run */
  readonly spentElsewhere: () => number;
  /**
   * How far the run had got, in one line, for a ceiling to report.
   *
   * A stopped run leaves no outcome for a test to read, so whatever the caller knows about its
   * progress has to reach the failure from here or not at all — and "it answered nine rounds of
   * questions" is the difference between a slow run and a stuck one.
   */
  readonly progress: () => string;
  /**
   * Whether a report is the run's last word, so a finished run is not waited out.
   *
   * Optional: the grace period stands in for it, and a run whose report this does not recognise
   * finishes late rather than not at all.
   */
  readonly finished?: (report: string) => boolean;
}

export interface RunOutcome {
  /** how the session classified the run: `success`, or what stopped it */
  readonly resultSubtype: string;
  /** the orchestrator's last report — a run's own last word, and the last thing it does */
  readonly report: string;
  /** what the run cost in all: the host reports a session's running total on every result */
  readonly costUsd: number;
  readonly durationMs: number;
  /** how many times the run came back to work after a dispatch went away with a stage */
  readonly turnsTaken: number;
  readonly numTurns: number;
  readonly sessionId: string;
  readonly stderr: readonly string[];
}

export async function driveRun(options: RunOptions): Promise<RunOutcome> {
  const { runDirectory, ceilings } = options;
  const environment = await sessionEnvironment(runDirectory);

  const started = Date.now();
  const stopped = new AbortController();
  let wallClockReached = false;
  const timer = setTimeout(() => {
    wallClockReached = true;
    stopped.abort(new Error("the wall-clock ceiling"));
  }, ceilings.wallClockMs);
  // Everything a run produced is on disk by the time the ceiling fires, so a failure stays readable
  // afterwards — it is only the process that goes.
  timer.unref();

  // The input stream, held open until the run is over. Closing it is what ends the session.
  let closeInput: (() => void) | undefined;
  const inputClosed = new Promise<void>((resolve) => {
    closeInput = resolve;
  });
  async function* held(): AsyncGenerator<SDKUserMessage> {
    yield {
      type: "user",
      message: { role: "user", content: options.command },
      parent_tool_use_id: null,
    };
    await inputClosed;
  }

  const stderr: string[] = [];
  const session = query({
    prompt: held(),
    options: {
      cwd: options.cwd,
      // User and project settings and nothing else. User scope is the run's own configuration
      // directory — the marketplaces, the install and the plugin's three options; project scope is
      // the clone's, which is how a fixture tells the plugin what its repository's conventions are.
      // The contributor's own machine settings are never a source, and neither are this
      // repository's.
      settingSources: ["user", "project"],
      // The measured arrangement, and the reason a question can reach the responder at all: the
      // callback is what the host asks when it has an `AskUserQuestion` to put and no human to put
      // it to.
      permissionMode: "bypassPermissions",
      canUseTool: options.canUseTool,
      maxBudgetUsd: Math.max(ceilings.spendUsd - options.spentElsewhere(), 0),
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

  let result: Extract<SDKMessage, { type: "result" }> | undefined;
  let turnsTaken = 0;
  let streamFailure: unknown;
  let lastHeardFrom = Date.now();
  // Silence is the backstop: a run that has reported at least once and then said nothing at all
  // for the grace period is over, whatever its report happened to say.
  const idle = setInterval(() => {
    if (result !== undefined && Date.now() - lastHeardFrom >= IDLE_GRACE_MS) closeInput?.();
  }, IDLE_POLL_MS);
  idle.unref();

  try {
    for await (const message of session) {
      lastHeardFrom = Date.now();
      if (message.type !== "result") continue;
      result = message;
      turnsTaken += 1;
      const report = message.subtype === "success" ? message.result : "";
      if (options.finished?.(report) === true) closeInput?.();
    }
  } catch (error) {
    // The host raises after reporting a run it stopped itself — a budget it reached arrives as a
    // result and then as a throw. The result is the better of the two, so it wins where there is
    // one.
    streamFailure = error;
  } finally {
    clearTimeout(timer);
    clearInterval(idle);
    closeInput?.();
  }

  const elapsedMs = Date.now() - started;
  const spentUsd = (result?.total_cost_usd ?? 0) + options.spentElsewhere();
  if (wallClockReached) {
    throw new CeilingReached("the ninety-minute wall clock", {
      elapsedMs,
      spentUsd,
      detail: `it had reached ${options.progress()}, ` +
        `${result === undefined ? "still going" : `at ${result.num_turns} turns`}, when it was ` +
        `stopped. Its session records are in ${runDirectory.configDir}.`,
    });
  }
  if (result?.subtype === "error_max_budget_usd") {
    throw new CeilingReached("the spend", {
      elapsedMs,
      spentUsd,
      detail: `the host stopped the run itself at the ceiling of $${ceilings.spendUsd}. It had ` +
        `reached ${options.progress()}, at ${result.num_turns} turns. Its session records are in ` +
        `${runDirectory.configDir}.`,
    });
  }
  if (result === undefined) {
    throw new Error(
      `the run never finished, so there is nothing to assert about what it produced. This is the ` +
        `harness or the host failing rather than a finding about the plugin.` +
        `${streamFailure === undefined ? "" : `\n  cause: ${String(streamFailure)}`}` +
        `${stderr.length === 0 ? "" : `\n  stderr: ${stderr.join("\n    ")}`}`,
    );
  }

  return {
    resultSubtype: result.subtype,
    report: result.subtype === "success" ? result.result : "",
    costUsd: result.total_cost_usd,
    durationMs: elapsedMs,
    turnsTaken,
    numTurns: result.num_turns,
    sessionId: result.session_id,
    stderr,
  };
}

/**
 * What a run left in its own configuration directory: one record per session, and one per
 * **dispatch**.
 *
 * Every agent the run dispatched wrote its own, beside the orchestrator's, because the whole
 * configuration directory belongs to this run. That is what makes a failure inside one writer
 * readable rather than inferred from its report — and it is only true because the directory is per
 * run, so nothing here has to work out which of a contributor's sessions was this one.
 */
export interface SessionRecords {
  readonly root: string;
  /** one per session: the orchestrator's, and the harness's own agents' */
  readonly sessions: readonly string[];
  /** one per dispatched agent */
  readonly dispatched: readonly string[];
}

export async function readSessionRecords(runDirectory: RunDirectory): Promise<SessionRecords> {
  const root = join(runDirectory.configDir, "projects");
  const sessions: string[] = [];
  const dispatched: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(root, { recursive: true });
  } catch {
    return { root, sessions, dispatched };
  }
  for (const entry of entries) {
    if (!entry.endsWith(".jsonl")) continue;
    if (entry.includes("subagents")) dispatched.push(entry);
    else sessions.push(entry);
  }
  return { root, sessions, dispatched };
}
