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
  for await (const message of session) {
    if (message.type !== "result") continue;
    costUsd = message.total_cost_usd;
    if (message.subtype !== "success") {
      throw new Error(`${request.purpose} ended as ${message.subtype} rather than answering`);
    }
    structured = message.structured_output;
  }
  return { structured, costUsd };
}
