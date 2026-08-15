/**
 * The verifier: the judgement no assertion can make (end-to-end-tests ticket 02).
 *
 * A run that produces correctly shaped rubbish is exactly the failure a shape-only assertion waves
 * through — a spec with every section present and nothing coherent in it, a ticket set that names
 * blocking edges and covers half the **user stories**. So both bars must pass: what a test can
 * check mechanically it checks mechanically, and what is left goes here.
 *
 * **It is never given work an assertion could do.** Where the epic landed, what the files are
 * called, whether they are numbered from `01`, whether each declares its blocking edges, whether
 * the triage label is there — all of that is settled in `./matchers.ts` on facts, and asking a
 * model about it would trade a fact for an opinion. Two questions are left, and they are the two it
 * gets: does the spec cohere, and do the tickets cover its user stories.
 *
 * On `opus`, because this is the one place in the harness where being wrong turns a green test into
 * a lie.
 *
 * It reads the epic first-hand rather than being handed its contents, so a document that is
 * enormous or split across files is judged whole. It reads and nothing else — the tools it is given
 * cannot write, and it runs against the clone a run has already finished with.
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Fixture } from "./fixture.ts";
import type { PublishedEpic } from "./epic.ts";
import { sessionEnvironment, type RunDirectory } from "./run-directory.ts";

/** The model the verdict is formed on. */
const VERIFIER_MODEL = "opus";

/** What a verdict may cost. It reads two documents and answers two questions. */
const VERDICT_CEILING_USD = 5;

/** Reading only. A verifier that could write could fix what it was judging. */
const VERIFIER_TOOLS = ["Read", "Glob", "Grep"];

export interface Judgement {
  /** which of the two questions this answers */
  readonly subject: string;
  readonly passed: boolean;
  /** what it stands on: a line, a section, a user story that no ticket meets */
  readonly grounds: string;
}

export interface Verdict {
  readonly passed: boolean;
  readonly summary: string;
  readonly judgements: readonly Judgement[];
  readonly costUsd: number;
}

export async function verifyEpic(
  runDirectory: RunDirectory,
  fixture: Fixture,
  epic: PublishedEpic,
  ceiling: AbortSignal,
): Promise<Verdict> {
  const stopped = new AbortController();
  if (ceiling.aborted) stopped.abort(ceiling.reason);
  else ceiling.addEventListener("abort", () => stopped.abort(ceiling.reason), { once: true });

  const session = query({
    prompt: promptFor(fixture, epic),
    options: {
      // The clone, so the paths in the prompt are the paths it can open.
      cwd: runDirectory.cloneDir,
      model: VERIFIER_MODEL,
      tools: VERIFIER_TOOLS,
      // No settings: the repository's own `CLAUDE.md` tells an agent how to work here, and the
      // verifier is not working here — it is judging what somebody else left behind.
      settingSources: [],
      permissionMode: "bypassPermissions",
      maxBudgetUsd: VERDICT_CEILING_USD,
      abortController: stopped,
      env: await sessionEnvironment(runDirectory),
      outputFormat: { type: "json_schema", schema: VERDICT_SCHEMA },
    },
  });

  let structured: unknown;
  let costUsd = 0;
  for await (const message of session) {
    if (message.type !== "result") continue;
    costUsd = message.total_cost_usd;
    if (message.subtype !== "success") {
      throw new Error(
        `the verifier's own turn ended as ${message.subtype}, so nothing was judged. This is the ` +
          `harness failing rather than a finding about the plugin.`,
      );
    }
    structured = message.structured_output;
  }
  return { ...readVerdict(structured), costUsd };
}

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["passed", "summary", "judgements"],
  properties: {
    passed: {
      type: "boolean",
      description: "true only when every judgement below passed",
    },
    summary: {
      type: "string",
      description: "one or two sentences a contributor reads first",
    },
    judgements: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "passed", "grounds"],
        properties: {
          subject: { type: "string", description: "coherence or coverage" },
          passed: { type: "boolean" },
          grounds: {
            type: "string",
            description:
              "what the judgement stands on — the contradiction, or the user stories no ticket " +
              "covers, quoted. Never taste.",
          },
        },
      },
    },
  },
};

function promptFor(fixture: Fixture, epic: PublishedEpic): string {
  return [
    "A refinement run has just turned one idea into an epic in this repository. Judge what it " +
      "produced, on two questions and no others.",
    "",
    `The idea it was given: ${fixture.idea}`,
    "",
    `The spec it published: ${epic.specPath ?? "(none — say so)"}`,
    `The tickets it published, ${epic.tickets.length} of them: ` +
      `${epic.tickets.map((ticket) => ticket.path).join(", ") || "(none — say so)"}`,
    "",
    "Read all of them in full, and then answer:",
    "",
    "1. **Coherence.** Does the spec hold together as one document? Its problem statement, its " +
      "solution, its user stories and its decisions have to be about the same feature and must " +
      "not contradict each other or the idea. A section that is present but empty, generic, or " +
      "about something else fails this.",
    "2. **Coverage.** Do the tickets between them cover the spec's user stories? Every numbered " +
      "story should be met by at least one ticket, and each ticket should be a narrow but " +
      "complete slice rather than one layer of the work. Name the stories nothing covers.",
    "",
    "Judge nothing else. Where the files are, what they are called, whether they are numbered, " +
      "whether each names what blocks it, whether a triage label is present, how they are " +
      "wrapped — all of that is asserted mechanically elsewhere and is none of your business. " +
      "Do not judge whether the FEATURE is a good idea, and do not judge the repository's own " +
      "code.",
    "",
    "Be strict and be specific: quote what you found. A pass here says a human reading this epic " +
      "would recognise it as a real one.",
  ].join("\n");
}

function readVerdict(structured: unknown): Omit<Verdict, "costUsd"> {
  const raw = structured as { passed?: unknown; summary?: unknown; judgements?: unknown };
  const judgements = Array.isArray(raw?.judgements)
    ? (raw.judgements as Record<string, unknown>[]).map((judgement) => ({
        subject: typeof judgement.subject === "string" ? judgement.subject : "(unnamed)",
        passed: judgement.passed === true,
        grounds: typeof judgement.grounds === "string" ? judgement.grounds : "",
      }))
    : [];
  if (typeof raw?.passed !== "boolean" || judgements.length === 0) {
    throw new Error(
      `the verifier returned no verdict this harness can read: ${JSON.stringify(structured)}. ` +
        `That is the harness failing rather than a finding about the plugin.`,
    );
  }
  return {
    // Both halves have to hold, and the summary flag is not taken on trust: a verdict that says it
    // passed while one judgement did not is a verdict that failed.
    passed: raw.passed && judgements.every((judgement) => judgement.passed),
    summary: typeof raw.summary === "string" ? raw.summary : "",
    judgements,
  };
}
