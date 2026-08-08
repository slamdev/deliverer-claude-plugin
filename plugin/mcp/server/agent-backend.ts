/**
 * The real review backend: the platform's own code review, driven through the Agent SDK
 * (delegated-review issue 05).
 *
 * It is the DEFAULT backend — a server nobody configured runs this one, because the alternative
 * default would be a server that replayed a script and reported a Round nobody ran. It owns nothing
 * of the lifecycle: it starts one SDK query, narrows what comes back to the lifecycle's five events,
 * and stops when told to. The state machine, the store, the deadline and the tool contract all live
 * in `./lifecycle.ts` and `./review-state.ts`.
 *
 * Three things about it are decisions rather than details, and each one is load-bearing:
 *
 *  - **The prompt form is what decides what gets reviewed.** `/code-review <effort> --comment <url>`
 *    reviews the change request AND posts the findings as inline comments itself. A bare ref reviews
 *    the local working diff and finds nothing, because the PR's commits are not in that tree.
 *  - **No structured output format.** Measured across three identical prototype runs, setting one
 *    cost roughly 1.7× the money and 1.9× the time to return ZERO findings while still reporting
 *    success — a silent failure with nothing to detect it by. There is also nothing to parse for:
 *    nothing downstream consumes structured findings, the prose is the deliverable, and the Threads
 *    are posted by the reviewer itself. So there is no findings parser here, no two-turn extraction
 *    and no findings-tool shim, and there must not be one added.
 *  - **No denied-tool list and no pre-tool guard.** The inner agent runs with permission prompting
 *    bypassed: no `disallowedTools`, no `canUseTool`, and no hook that DENIES anything. The failure
 *    mode is that a review can write, delete or push inside the delivery repository and nothing
 *    here would stop it. That absence is deliberate; do not "harden" it here without recording the
 *    decision somewhere a reader can find.
 *
 *    One `PreToolUse` hook IS installed, and it is an OBSERVER: it returns `{}` for every tool
 *    every time, so it changes nothing about what the inner agent may do, and the accepted risk
 *    above is exactly as it was. It is here because it is the only real-time signal this seam has.
 *    Measured on one review: the hook fired at 3.6 s, 8.2 s, 11.9 s and 20.4 s while the message
 *    iterable stayed silent until 27.3 s — when `system/init`, the assistant text and the result
 *    all arrived within 2 ms of each other. Without it `code_review_status` reports `preparing` with
 *    `events: 1` for a whole 170-second review, and a poller cannot tell a review that is working
 *    from one that is wedged; both shipped `code-reviewer` runs answered that by inventing
 *    exponential backoff, and one noticed its round ~70 s late. The alternatives were measured
 *    first and are not alternatives: `includePartialMessages: true` yields NOTHING (zero
 *    `stream_event` messages, same one-batch arrival), and the child writes no stderr at all.
 *
 * Effort, model and the inner agent's environment come from the server's startup configuration
 * (`./config.ts`), never from a caller: no Review actor can quietly review at a different depth, on
 * a different model, or as a different identity than the owner configured. The model is passed
 * VERBATIM and unchecked — an alias (`opus`, the shipped default) resolves against whatever provider
 * the environment file selects, which is why one is portable where a pinned id is not — and an EMPTY
 * model means take that environment's own default instead.
 *
 * **How the review is authenticated.** Nothing here reads, forwards or names a credential. The
 * plugin's `code_review_claude_env_file` option — required — names a `.env` file, `./config.ts`
 * parses it, and its variables are layered over this process's own environment for the SDK
 * subprocess. That is the whole mechanism. The alternative it replaced — copying a fixed set of
 * `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_*` variables through the MCP configuration — made the
 * plugin quietly single-provider and gave an owner authenticated any other way no way in.
 */
import type { ReviewBackend, ReviewRequest, ReviewRun } from "./backend.ts";
import type { ReviewEvent } from "./review-state.ts";

export const AGENT_BACKEND_ID = "agent";

/** The package the Agent SDK ships as, installed beside this source by the `SessionStart` hook. */
export const AGENT_SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";

/** The platform's own review command. The pipeline cannot reach it in-session; the SDK can. */
export const REVIEW_COMMAND = "/code-review";

/**
 * How many lines of the SDK's stderr to keep. It is the only diagnostic a dead agent leaves, and it
 * is unbounded, so a window is kept rather than the whole stream or nothing.
 */
const STDERR_LINES_KEPT = 20;

/**
 * The `query` function this backend needs, stated structurally rather than imported as a type.
 *
 * The SDK is loaded through a dynamic import at server startup (see `./index.ts`), so this file
 * carries no static dependency on it: the review tools must still register on a host where the
 * install has not finished — so a caller is told what is missing rather than meeting no tool at all
 * — and a static import would take the whole server down with it.
 */
export interface AgentQueryParams {
  prompt: string;
  options: Record<string, unknown>;
}
export type AgentQueryMessage = Record<string, unknown>;
export type AgentQuery = (params: AgentQueryParams) => AsyncIterable<AgentQueryMessage>;

/**
 * Build the review prompt. The effort tier is passed VERBATIM, and it has already been checked
 * against the accepted set (`./config.ts`'s `effortError`, refused at every `code_review_start`).
 * That check is the trade PR #11's grill accepted knowingly: a tier the platform adds later is
 * refused by a server shipped before it, and the owner's fix is a plugin update — chosen over
 * failing open, where an unrecognised tier either errors the round or silently reviews at the
 * command's own default. An absent or empty tier is omitted entirely, leaving that default.
 */
export function reviewPrompt(prUrl: string, effort: string | null): string {
  const tier = effort === null ? "" : effort.trim();
  return tier === ""
    ? `${REVIEW_COMMAND} --comment ${prUrl}`
    : `${REVIEW_COMMAND} ${tier} --comment ${prUrl}`;
}

/** The text of every text block in an assistant message, or null when there is none. */
function assistantText(message: AgentQueryMessage): string | null {
  const inner = message.message as { content?: unknown } | undefined;
  const content = inner?.content;
  if (!Array.isArray(content)) return null;
  const parts = content
    .filter(
      (block): block is { type: string; text: string } =>
        typeof block === "object" &&
        block !== null &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string",
    )
    .map((block) => block.text.trim())
    .filter((text) => text !== "");
  return parts.length === 0 ? null : parts.join("\n");
}

/**
 * The SDK's own not-logged-in answer, anchored to the START of the result so a REVIEW whose prose
 * discusses a login bug cannot fail its own Round. The separator between the two clauses has been
 * seen as both `·` and `-`, so only the first clause is matched.
 */
const NOT_LOGGED_IN = /^\s*not logged in\b/i;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Narrow one SDK message to a lifecycle event, or null for the ones that say nothing the lifecycle
 * has a vocabulary for. Everything verdict-shaped is deliberately absent from the `completed` event:
 * there is no findings parser (above), so `code_review_status` reports the count and the verdict as
 * `unknown` and the prose as the whole answer.
 *
 * `assistantTurns` is how many assistant messages the caller has seen on this run, and it is what
 * the `completed` event's turn count falls back to. Passed in rather than counted here so this
 * stays a pure function of one message.
 */
export function eventFromMessage(
  message: AgentQueryMessage,
  assistantTurns: number,
): ReviewEvent | null {
  if (message.type === "system" && message.subtype === "init") return { type: "running" };
  if (message.type === "assistant") {
    const text = assistantText(message);
    return text === null ? null : { type: "text", text };
  }
  if (message.type === "result") {
    const costUsd = asNumber(message.total_cost_usd);
    // `||`, not `??`. A round measured at $0.65 over 170s reported `num_turns: 0`, and 0 is a
    // finite number — so `asNumber` accepts it and the reducer's own `?? record.turns` never falls
    // back, publishing a zero that looks trustworthy beside the two fields the Review actor is
    // told to distrust. The assistant messages this run actually yielded are the honest floor, so
    // they stand in whenever the SDK's own number is absent OR zero.
    const turns = asNumber(message.num_turns) || assistantTurns;
    if (message.subtype === "success") {
      const summary = typeof message.result === "string" ? message.result : "";
      // The ONE invisible failure this design can mechanically detect (PR #11 grill, agenda A11).
      // An unauthenticated run is classified by the SDK as `success` with an empty `errors` array
      // and this exact prose — an agent did start, emit text and exit cleanly, so nothing upstream
      // is lying — and mapping it to `completed` publishes a Round whose whole prose says nobody
      // reviewed anything, which is the PRD's largest named risk arriving green. There is no error
      // to propagate: MCP's error channel works and the domain status field works; the
      // misclassification is upstream, so the server has to manufacture the failure from the one
      // observable that differs. It is a FIXED STRING, not a judgment, and it extracts nothing and
      // consumes no structure — so it is not the findings parser this module's header forbids. A
      // preflight on the configured environment is not a substitute, in either direction: an
      // interactively logged-in host keeps its credentials on disk rather than in any variable, and
      // no variable being present proves the credential in it is still good.
      if (NOT_LOGGED_IN.test(summary)) {
        return {
          type: "failed",
          message:
            `the delegated review ran but was NOT LOGGED IN, so nothing was reviewed — the ` +
            `reviewer answered: ${summary.trim()}. The review runs in this server's own ` +
            `environment, plus whatever the plugin's code_review_claude_env_file option names; ` +
            `authentication the host holds some other way does not reach it. Point that option at ` +
            `a .env file carrying the credentials the review should run under, then run the round ` +
            `again.`,
        };
      }
      return { type: "completed", summary, costUsd, turns };
    }
    const errors = Array.isArray(message.errors) ? message.errors.map(String) : [];
    const detail = errors.length === 0 ? "" : `: ${errors.join("; ")}`;
    return {
      type: "failed",
      message: `the delegated review ended as ${String(message.subtype)}${detail}`,
    };
  }
  return null;
}

export interface AgentBackendDeps {
  /** the SDK's `query`, loaded by the caller so this module has no static dependency on it */
  query: AgentQuery;
}

export function createAgentBackend(deps: AgentBackendDeps): ReviewBackend {
  return {
    id: AGENT_BACKEND_ID,
    start(request: ReviewRequest, emit: (event: ReviewEvent) => void): ReviewRun {
      const controller = new AbortController();
      let aborted = false;
      const stderr: string[] = [];

      // The review is under way the instant this returns; `preparing` says so before the SDK has
      // spawned anything, which is the difference a poller sees between a handle and a run.
      emit({ type: "preparing" });

      const model = request.model === null ? "" : request.model.trim();

      /**
       * The liveness observer. It returns an empty result for every tool every time, so it permits
       * exactly what the permission mode already permitted — see this module's header for why it is
       * here and what was measured before it.
       *
       * It reports `running`, which is the honest reading: an inner agent that is calling a tool is
       * running, whatever the message stream has got round to saying. Each firing is one more event,
       * so `events` rises for the whole review, and the reducer's "terminal states absorb" rule
       * discards any firing that races the result.
       *
       * It cannot fail a review. A throw here would cross the SDK's control channel and take the
       * round with it, and a lost heartbeat is a cosmetic loss against a review that is plainly
       * still working — so the emit path is guarded and the hook always answers.
       */
      const liveness = async (): Promise<Record<string, never>> => {
        if (!aborted) {
          try {
            emit({ type: "running" });
          } catch {
            // Deliberately silent: the lifecycle owns the record, and there is nowhere here to say
            // it that would not itself be a new failure path.
          }
        }
        return {};
      };

      const options: Record<string, unknown> = {
        // Bypassed prompting, and nothing that DENIES: no `disallowedTools`, no `canUseTool`, and
        // one `PreToolUse` observer that refuses nothing. See this module's header — the accepted
        // risk is precisely those absences, and the observer does not narrow them.
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        hooks: { PreToolUse: [{ hooks: [liveness] }] },
        abortController: controller,
        stderr: (data: string) => {
          for (const line of data.split("\n")) {
            if (line.trim() === "") continue;
            stderr.push(line);
            if (stderr.length > STDERR_LINES_KEPT) stderr.shift();
          }
        },
      };
      // Handed the delivery worktree when the caller named one; the SDK's own default otherwise.
      if (request.cwd !== null) options.cwd = request.cwd;
      // An empty model is a SET value meaning "take the configured environment's own default", so
      // the option is left off entirely rather than sent as an empty id no provider recognises.
      if (model !== "") options.model = model;
      // The owner's environment file, layered OVER this process's own environment rather than
      // replacing it: the SDK's `env` is documented to replace the subprocess environment entirely,
      // so a bare map would take `PATH` and `HOME` away from the agent and it would not start at
      // all. Set unconditionally, because the option is required — and an empty map, which only a
      // server that already refuses every start can hold, spreads to exactly the environment the
      // SDK would have inherited anyway.
      options.env = { ...process.env, ...request.claudeEnv };
      // Deliberately NOT set: `outputFormat`. See this module's header — it is the measured trap.

      const run = async (): Promise<void> => {
        let sawResult = false;
        // Counted here because this is the only place that sees the whole stream, and it is what
        // `eventFromMessage` reports when the SDK's own `num_turns` says zero.
        let assistantTurns = 0;
        for await (const message of deps.query({
          prompt: reviewPrompt(request.prUrl, request.effort),
          options,
        })) {
          if (aborted) return;
          if (message.type === "assistant") assistantTurns += 1;
          if (message.type === "result") sawResult = true;
          const event = eventFromMessage(message, assistantTurns);
          if (event !== null) emit(event);
        }
        if (!sawResult && !aborted) {
          // The agent stopped talking without ever reporting a result. Reported as a FAILURE rather
          // than left running: a review that did not complete is not a clean review, and a poller
          // that never saw a terminal status would wait for its deadline for nothing.
          emit({
            type: "failed",
            message:
              "the delegated review ended without reporting a result" + stderrSuffix(stderr),
          });
        }
      };

      void run().catch((error: unknown) => {
        if (aborted) return; // the lifecycle owns the cancellation and deadline events
        emit({
          type: "failed",
          message:
            `the delegated review failed: ${(error as Error).message}` + stderrSuffix(stderr),
        });
      });

      return {
        abort(reason: string) {
          aborted = true;
          controller.abort(reason);
        },
      };
    },
  };
}

const stderrSuffix = (stderr: string[]): string =>
  stderr.length === 0 ? "" : `\nlast stderr from the review agent:\n${stderr.join("\n")}`;
