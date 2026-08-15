/**
 * The harness's own agents, and the one thing they both are (end-to-end-tests ticket 02).
 *
 * Two of them exist — the **responder** answering a grilling from the fixture's brief, and the
 * **verifier** judging what a run delivered — and they are the same shape underneath: one turn, on
 * a named model, under a ceiling of its own, answering as DATA rather than as prose. A schema is
 * what makes that last part true, so nothing here parses an answer out of a paragraph and no
 * agent's wording can quietly change what a caller reads.
 *
 * Neither of them is the plugin. They are the harness standing where a human would stand, so they
 * carry the harness's own choices — the model, the ceiling, the tools — and none of the plugin's.
 *
 * The abort signal is mirrored rather than passed on, because the caller's is the whole test's: a
 * ceiling that stops a run has to stop the agent it was waiting on too, and an agent that outlived
 * the test would spend after the test had given up on it.
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import { sessionEnvironment, type RunDirectory } from "./run-directory.ts";

export interface AgentRequest {
  readonly runDirectory: RunDirectory;
  /** what it is for, so a failure says it in the harness's words rather than the host's */
  readonly purpose: string;
  readonly model: string;
  readonly prompt: string;
  /** the shape the answer comes back in */
  readonly schema: Record<string, unknown>;
  /** what one turn may cost — the harness's guard on an agent that started thinking */
  readonly ceilingUsd: number;
  /** where it runs. The run's own empty directory unless it has to read something */
  readonly cwd: string;
  /** what it may use. Nothing, unless reading first-hand is the point */
  readonly tools: readonly string[];
  readonly ceiling: AbortSignal;
}

export interface AgentAnswer {
  /** what the schema asked for, still unread: the caller knows what it wanted */
  readonly structured: unknown;
  readonly costUsd: number;
}

/**
 * A turn that ended without an answer, carrying what it spent getting there.
 *
 * **A failed turn costs money, and the caller has to be able to add it up.** A turn that reasons its
 * way to its own ceiling and is stopped has spent that ceiling; a turn the host classified as
 * anything but `success` has spent whatever it did before it stopped. Thrown bare, that figure goes
 * with the exception — and the **responder**, which retries a round and carries on, would then
 * report a spend short by every attempt that failed. A review round found exactly that: the spend
 * ceiling under-counted by whatever the harness's own agents burned on the way to a retry.
 *
 * So every path out of `askAgent` carries the cost, and a caller that keeps accounting reads it off
 * the failure the same way it reads it off the answer.
 */
export class AgentFailed extends Error {
  readonly costUsd: number;

  constructor(message: string, costUsd: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AgentFailed";
    this.costUsd = costUsd;
  }
}

/** What a caught failure spent: this agent's own figure, and nothing for anything else thrown. */
export function costOf(failure: unknown): number {
  return failure instanceof AgentFailed ? failure.costUsd : 0;
}

export async function askAgent(request: AgentRequest): Promise<AgentAnswer> {
  const stopped = new AbortController();
  if (request.ceiling.aborted) stopped.abort(request.ceiling.reason);
  else {
    request.ceiling.addEventListener("abort", () => stopped.abort(request.ceiling.reason), {
      once: true,
    });
  }

  const session = query({
    prompt: request.prompt,
    options: {
      cwd: request.cwd,
      model: request.model,
      tools: [...request.tools],
      // No settings of any kind. A repository's own `CLAUDE.md` tells an agent how to work there,
      // and neither of these is working there: one is standing in for a human who has not read it,
      // the other is judging what somebody else left behind.
      settingSources: [],
      permissionMode: "bypassPermissions",
      maxBudgetUsd: request.ceilingUsd,
      abortController: stopped,
      env: await sessionEnvironment(request.runDirectory),
      outputFormat: { type: "json_schema", schema: request.schema },
    },
  });

  let structured: unknown;
  let costUsd = 0;
  try {
    for await (const message of session) {
      if (message.type !== "result") continue;
      costUsd = message.total_cost_usd;
      if (message.subtype !== "success") {
        throw new AgentFailed(
          `${request.purpose} ended as ${message.subtype} rather than answering`,
          costUsd,
        );
      }
      structured = message.structured_output;
    }
  } catch (error) {
    // Whatever went wrong, the cost leaves with it. A turn stopped by the abort signal or dropped
    // by the transport reports nothing of its own, so what is carried is what the last result said
    // — nothing at all where none arrived, which is the honest figure rather than a guess.
    if (error instanceof AgentFailed) throw error;
    throw new AgentFailed(`${request.purpose} failed: ${String(error)}`, costUsd, { cause: error });
  }
  return { structured, costUsd };
}
