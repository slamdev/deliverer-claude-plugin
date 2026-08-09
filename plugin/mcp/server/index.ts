/**
 * The deliverer plugin's tools server (delegated-review issues 03 and 04).
 *
 * It publishes the three tools the Review actor drives — start a review, poll it, cancel it — plus a
 * pull-only transcript resource. It owns no forge contract, forms no judgment and reads no document:
 * it drives a review backend and reports what that backend said.
 *
 * The contract, verbatim and binding (PRD, "The MCP server"):
 *
 *   code_review_start(pr_url, cwd?, review_id?)
 *     → { review_id, status, transcript_uri, poll_after_ms }      returns in <1s
 *   code_review_status(review_id)
 *     → { reviewId, prUrl, status, verdict, counts, stats, reason, partial, summary }
 *   code_review_cancel(review_id)
 *     → { review_id, status }   the status the review HOLDS after the attempt: "cancelled" for one
 *                               that was still running, the existing terminal status for one that
 *                               had already finished (terminal states absorb)
 *
 * Note what is absent relative to the prototype this came from: no `effort` and no commenting input.
 * Both are startup configuration, substituted into this process's environment by the host, so no
 * caller can quietly review at a different depth than the owner configured.
 *
 * `code_review_status` is the only result-bearing tool and the only one carrying an output schema.
 * Everything a caller could mistake for a verdict reads `unknown` unless the run reached
 * `completed` — see `./review-state.ts` for why that is not a defensive nicety.
 *
 * Runs UNBUILT: Node strips the types (see `../tsconfig.json` for the constraints that keeps), so
 * there is no build step and no artifact to drift from this source.
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  AGENT_BACKEND_ID,
  AGENT_SDK_PACKAGE,
  createAgentBackend,
  type AgentQuery,
} from "./agent-backend.ts";
import { configFromEnv, BACKEND_ENV, DEADLINE_SEC, SCRIPT_ENV } from "./config.ts";
import type { ReviewBackend } from "./backend.ts";
import {
  createLifecycle,
  reviewIdFromTranscriptUri,
  ToolError,
  TRANSCRIPT_SCHEME,
} from "./lifecycle.ts";
import { STATUSES_TUPLE } from "./review-state.ts";
import { createScriptedBackend, parseScript, SCRIPTED_BACKEND_ID } from "./scripted-backend.ts";
import { createMemoryStore } from "./store.ts";

/** The server's identity as the host sees it; the version tracks the plugin's own. */
export const SERVER_NAME = "tools";
export const SERVER_VERSION = "0.1.0";

export const START_TOOL = "code_review_start";
export const STATUS_TOOL = "code_review_status";
export const CANCEL_TOOL = "code_review_cancel";

const config = configFromEnv();

/**
 * Anything the host configured that arrived malformed, said ONCE on stderr at startup.
 *
 * `./config.ts` collects these rather than swallowing them, and this is the only place that reads
 * them: stderr is the one channel a stdio server has that is not the protocol stream, and the host
 * keeps it in the MCP log. The two owner-configuration defects that would change what a review IS —
 * an unusable effort tier and an unusable environment file — are ALSO refused at every
 * `code_review_start` (see `requireUsableEffort` / `requireUsableClaudeEnv` below), because a line in
 * a log nobody opens is not a refusal. The rest, a malformed store TTL among them, are only reported
 * here.
 */
for (const warning of config.warnings) {
  process.stderr.write(`deliverer tools server: ${warning}\n`);
}

/* ────────────────────────── which backend runs a review ────────────────────────── */

/**
 * Selecting the backend is the one startup decision that can fail, and it must not take the server
 * down with it: a process that exits here publishes NO tools at all, so the actor meets "no such
 * tool" — which names nothing to fix and reads the same whether the plugin is misconfigured or
 * simply not installed. Instead the failure is held and returned as an error result from
 * `code_review_start` — the tool that could not do its job — naming what to fix.
 */
async function selectBackend(): Promise<{ backend: ReviewBackend | null; error: string | null }> {
  if (config.backend === SCRIPTED_BACKEND_ID) {
    try {
      return { backend: createScriptedBackend(parseScript(config.scriptRaw)), error: null };
    } catch (error) {
      return { backend: null, error: `${SCRIPT_ENV} is unusable: ${(error as Error).message}` };
    }
  }
  if (config.backend === AGENT_BACKEND_ID) {
    // Imported DYNAMICALLY, and only on this branch. A static import would make the WHOLE server
    // unstartable on a host whose install has not finished, so that session would have no review
    // tools at all instead of tools that say what is missing (issue 03's whole lesson). The scripted
    // double therefore needs no Agent SDK at all, which is what keeps the fast gate independent of
    // it.
    let query: AgentQuery;
    try {
      ({ query } = (await import(AGENT_SDK_PACKAGE)) as { query: AgentQuery });
    } catch (error) {
      return {
        backend: null,
        error:
          `the Agent SDK (${AGENT_SDK_PACKAGE}) could not be loaded, so no delegated review can ` +
          `be run: ${(error as Error).message}. The plugin's SessionStart install hook ` +
          `(hooks/install-mcp-server.sh) installs it beside this server; start a new session, and ` +
          `read that hook's own output if this repeats.`,
      };
    }
    return { backend: createAgentBackend({ query }), error: null };
  }
  return {
    backend: null,
    error:
      `no review backend named "${config.backend}" is available in this build of the tools ` +
      `server. The real delegated review is ${BACKEND_ENV}=${AGENT_BACKEND_ID} (the default); the ` +
      `scripted test double is ${BACKEND_ENV}=${SCRIPTED_BACKEND_ID}.`,
  };
}

const selected = await selectBackend();

const lifecycle = createLifecycle({
  // never reached while `selected.error` is set — every entry point checks it first
  backend: selected.backend ?? { id: config.backend, start: () => ({ abort: () => undefined }) },
  store: createMemoryStore({ ttlMs: config.storeTtlSec * 1000 }),
  effort: config.effort,
  model: config.model,
  claudeEnv: config.claudeEnv,
  deadlineSec: DEADLINE_SEC,
});

/* ────────────────────────── tool plumbing ────────────────────────── */

type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

const errorResult = (message: string): ToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

const jsonResult = (value: unknown, structured?: Record<string, unknown>): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  ...(structured === undefined ? {} : { structuredContent: structured }),
});

/**
 * Run a tool body, turning a `ToolError` into an MCP error result and anything else into one too —
 * a crashed handler would take the whole stdio server with it, and an unreviewed delivery must fail
 * loudly at the caller rather than silently at the transport.
 */
function guarded(body: () => ToolResult): ToolResult {
  try {
    return body();
  } catch (error) {
    if (error instanceof ToolError) return errorResult(error.message);
    return errorResult(`the tools server failed to handle the call: ${(error as Error).message}`);
  }
}

const requireBackend = (): void => {
  if (selected.error !== null) throw new ToolError(selected.error);
};

/**
 * An effort tier that arrived malformed is refused HERE rather than treated as absence: absence
 * leaves the review command's own default in place by design (the manifest owns the shipped value),
 * whereas a rejected value would review at a depth nobody chose and say so in a warning nothing
 * polls. It is checked WHATEVER backend is selected — the tier is the owner's configuration, not the
 * backend's, and a defect in it that only the real backend refused would be a defect the fast gate
 * could not see (PR #11 grill, agenda A15). No stored review and no occupied in-flight slot is left
 * behind, because nothing has been started yet.
 */
const requireUsableEffort = (): void => {
  if (config.effortTierError !== null) throw new ToolError(config.effortTierError);
};

/**
 * And the owner's environment file, for the same reason and in the same place. The check itself
 * lives in `./config.ts` beside the effort tier's, so the two owner-configuration defects have one
 * shape and one refusal point.
 *
 * It matters more than the tier does. A review that cannot be given the environment its owner
 * configured is a review running as whatever identity happened to be around — which either fails to
 * log in, or succeeds against the wrong account and reports a clean round from somewhere nobody
 * looked.
 */
const requireUsableClaudeEnv = (): void => {
  if (config.claudeEnvError !== null) throw new ToolError(config.claudeEnvError);
};

const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

/* ────────────────────────── the three review tools ────────────────────────── */

server.registerTool(
  START_TOOL,
  {
    title: "Start a delegated code review",
    description:
      "Start a code review of a change request (pull request / merge request) and return a handle " +
      "immediately — the review runs in the background and NOTHING arrives unsolicited, so " +
      `polling ${STATUS_TOOL} is the only way to see progress. Effort and model are this server's ` +
      "startup configuration and are not arguments. One review runs at a time.",
    inputSchema: {
      pr_url: z
        .string()
        .describe("the change request's URL, on any forge — the review is run against this URL"),
      cwd: z
        .string()
        .optional()
        .describe("the working directory to run the review in; defaults to the server's own"),
      review_id: z
        .string()
        .optional()
        .describe(
          "an id to give this review, so the handle is held before anything can go wrong. " +
            "Starting again with the same id addresses the SAME review rather than making a second.",
        ),
    },
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  (args) =>
    guarded(() => {
      requireBackend();
      requireUsableEffort();
      requireUsableClaudeEnv();
      return jsonResult(lifecycle.start(args));
    }),
);

server.registerTool(
  STATUS_TOOL,
  {
    title: "Read a review's status and result",
    description:
      "Report everything known about one review: its status, the reviewer's prose, and whether " +
      "what is reported is partial. This is the only result-bearing tool. A review that found " +
      "problems is a SUCCESSFUL call; an error result means the call could not be answered at all " +
      "(an unknown id). Every verdict-shaped field reads \"unknown\" unless the status is " +
      '"completed" — a review that did not complete is not a clean review — and on a real ' +
      "delegated review they read \"unknown\" even then, because it reports no verdict and no " +
      "finding count; its prose is the whole result.",
    inputSchema: {
      review_id: z.string().describe("the id returned by the start tool"),
    },
    outputSchema: {
      reviewId: z.string(),
      prUrl: z.string(),
      status: z.enum(STATUSES_TUPLE),
      verdict: z
        .string()
        .describe(
          'the backend\'s verdict. The real delegated review reports NONE, so this reads "unknown" ' +
            "on every real run, completed or not — only a scripted backend ever populates it. The " +
            "prose in `summary` is the whole result.",
        ),
      counts: z.object({
        findings: z
          .union([z.number(), z.literal("unknown")])
          .describe(
            'the number of findings. The real delegated review reports none, so this reads "unknown" ' +
              "on every real run, completed or not (there is no findings parser, by design) — only a " +
              "scripted backend ever populates it.",
          ),
      }),
      stats: z.object({
        startedAt: z.string(),
        endedAt: z.string().nullable(),
        durationMs: z.number(),
        events: z
          .number()
          .describe(
            "how many events have landed. It RISES while the review works — the inner agent's tool " +
              "calls are observed as they happen — so two polls with the same number and a moving " +
              "`durationMs` mean nothing has happened since the last one.",
          ),
        lastEventAt: z
          .string()
          .nullable()
          .describe(
            "when the last event landed, or null before any has. With `events`, this is the whole " +
              "of what says a live review is working rather than wedged.",
          ),
        costUsd: z
          .number()
          .nullable()
          .describe(
            "what the round cost in dollars, as the SDK's OWN list-rate arithmetic rather than an " +
              "invoice: on a partner provider (see `provider`) it says what these tokens would " +
              "have cost first-party. The token counters beside it are the provider-neutral " +
              "figure. Null — never zero — whenever no result message arrived, which is every " +
              "cancelled round.",
          ),
        turns: z.number().nullable(),
        inputTokens: z.number().nullable(),
        outputTokens: z.number().nullable(),
        cacheReadTokens: z.number().nullable(),
        cacheCreationTokens: z.number().nullable(),
        agentDurationMs: z
          .number()
          .nullable()
          .describe(
            "how long the INNER review agent ran, in milliseconds. Not `durationMs`, which is this " +
              "record's own wall-clock and counts every second the poller waited around it.",
          ),
        model: z.string().nullable(),
        provider: z
          .string()
          .nullable()
          .describe(
            "what served `model` — \"firstParty\", \"bedrock\", \"vertex\" and so on. It is what " +
              "`costUsd` has to be labelled with, because it is what decides whether that number " +
              "is a price or an estimate.",
          ),
        canonicalModel: z
          .string()
          .nullable()
          .describe("the pricing-lookup id behind `model`, which is not always the same string"),
        deadlineSec: z
          .number()
          .describe(
            "the ceiling this review is aborted at, in seconds. A constant of the server, not " +
              "configuration — so it is always present and the same for every review.",
          ),
      }),
      reason: z
        .string()
        .describe(
          "why a failed or cancelled run ended, in one line; empty while the run is alive and " +
            "empty when it completed. The full stream is pull-only, at " +
            "code-review://transcript/<id>",
        ),
      partial: z.boolean().describe('true whenever the status is not "completed"'),
      summary: z
        .string()
        .describe('the reviewer\'s prose; empty whenever the status is not "completed"'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  (args) =>
    guarded(() => {
      const result = lifecycle.status(args.review_id);
      return jsonResult(result, result as unknown as Record<string, unknown>);
    }),
);

server.registerTool(
  CANCEL_TOOL,
  {
    title: "Cancel a running review",
    description:
      "Abort a review that is still running and keep whatever it had already produced. Reports the " +
      "status the review actually holds afterwards: a review that had already reached a terminal " +
      "status is not moved by a cancellation, so this reports that status rather than " +
      '"cancelled".',
    inputSchema: {
      review_id: z.string().describe("the id returned by the start tool"),
    },
    annotations: { readOnlyHint: false, openWorldHint: false },
  },
  (args) => guarded(() => jsonResult(lifecycle.cancel(args.review_id))),
);

/* ────────────────────────── the pull-only transcript resource ────────────────────────── */

server.registerResource(
  "code_review_transcript",
  new ResourceTemplate(`${TRANSCRIPT_SCHEME}://transcript/{reviewId}`, { list: undefined }),
  {
    title: "Review transcript",
    description:
      "Everything a review has said so far, as plain text. Pull-only: the server pushes nothing.",
    mimeType: "text/plain",
  },
  (uri) => {
    const reviewId = reviewIdFromTranscriptUri(uri.href);
    if (reviewId === null) throw new Error(`not a review transcript URI: ${uri.href}`);
    const transcript = lifecycle.transcript(reviewId);
    if (transcript === null) throw new Error(`unknown review id "${reviewId}"`);
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: transcript }],
    };
  },
);

await server.connect(new StdioServerTransport());
