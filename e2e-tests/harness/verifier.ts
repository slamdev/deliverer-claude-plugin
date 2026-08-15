/**
 * The verifier: the verdict no assertion can reach (end-to-end-tests tickets 02 and 03).
 *
 * A run that produces correctly shaped rubbish is exactly the failure a shape-only assertion waves
 * through — a spec with every section present and nothing coherent in it, a ticket set that names
 * blocking edges and covers half the **user stories**. So both bars must pass: what a test can
 * check mechanically it checks mechanically, and what is left comes here.
 *
 * **It is never given work an assertion could do.** Where the epic landed, what the files are
 * called, whether they are numbered from `01`, whether each declares its **blocking edges**,
 * whether the **triage label** is there — all of that is settled in `./matchers.ts` on facts, and
 * asking a model about it would trade a fact for an opinion. Two subjects are left of a refinement,
 * and they are the two it gets: does the spec cohere, and do the tickets cover its user stories.
 *
 * A delivery gets the same treatment and its own two subjects. That every **ticket** has a commit
 * naming it, that every **assumption** carries a **verdict**, that two **rounds** completed, that
 * the change request was **flipped ready** with its **checks** green — all facts, all asserted.
 * What is left is what a correctly shaped delivery of nothing would still pass: does the code
 * actually implement the epic, and is it code a reviewer would recognise as real work.
 *
 * On `opus`, because this is the one place in the harness where being wrong turns a green test into
 * a lie.
 *
 * It reads the epic first-hand rather than being handed its contents, so a document that is
 * enormous or split across files is read whole. It reads and nothing else — the tools it is given
 * cannot write, and it runs against the clone a run has already finished with.
 */
import { askAgent } from "./agent.ts";
import { VERIFIER_CEILING_USD } from "./ceilings.ts";
import type { Fixture } from "./fixture.ts";
import type { PublishedEpic } from "./epic.ts";
import type { RunDirectory } from "./run-directory.ts";

/** The model the verdict is formed on. */
const VERIFIER_MODEL = "opus";

/** Reading only. A verifier that could write could fix what it was judging. */
const VERIFIER_TOOLS = ["Read", "Glob", "Grep"];

/** The verdict on one of the two subjects, and what it stands on. */
export interface SubjectVerdict {
  /** which of the two this answers */
  readonly subject: string;
  readonly passed: boolean;
  /** the **grounds**: a line, a section, a user story no ticket meets. Never taste. */
  readonly grounds: string;
}

export interface Verdict {
  readonly passed: boolean;
  readonly summary: string;
  readonly subjects: readonly SubjectVerdict[];
  readonly costUsd: number;
}

/** The verdict on the epic a refinement published. */
export function verifyEpic(
  runDirectory: RunDirectory,
  fixture: Fixture,
  epic: PublishedEpic,
  ceiling: AbortSignal,
): Promise<Verdict> {
  return judge(runDirectory, "what the run published", refinementPrompt(fixture, epic), ceiling);
}

/**
 * The verdict on what a delivery built, against the epic it was handed.
 *
 * What the branch changed comes from the diff the harness took off the FORGE, so it is what was
 * published rather than whatever the run left lying in the clone. The clone is beside it for
 * reading a whole file in context, and the prompt says which of the two is the authority.
 */
export function verifyDelivery(
  runDirectory: RunDirectory,
  epic: PublishedEpic,
  delivered: Delivered,
  ceiling: AbortSignal,
): Promise<Verdict> {
  return judge(runDirectory, "what the delivery built", deliveryPrompt(epic, delivered), ceiling);
}

/** What a delivery left for the verifier to read: the branch, and everything it changed. */
export interface Delivered {
  readonly branch: string;
  /** the diff as the forge has it, written into the run directory (`./change-request.ts`) */
  readonly diffPath: string;
}

/** One turn, one verdict. The two above differ in their prompt and in nothing else. */
async function judge(
  runDirectory: RunDirectory,
  about: string,
  prompt: string,
  ceiling: AbortSignal,
): Promise<Verdict> {
  const answer = await askAgent({
    runDirectory,
    purpose: `the verifier's verdict on ${about}`,
    model: VERIFIER_MODEL,
    prompt,
    schema: VERDICT_SCHEMA,
    ceilingUsd: VERIFIER_CEILING_USD,
    // The clone, so the paths in the prompt are the paths it can open.
    cwd: runDirectory.cloneDir,
    tools: VERIFIER_TOOLS,
    ceiling,
  });
  return { ...readVerdict(answer.structured), costUsd: answer.costUsd };
}

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["passed", "summary", "subjects"],
  properties: {
    passed: {
      type: "boolean",
      description: "true only when every subject below passed",
    },
    summary: {
      type: "string",
      description: "one or two sentences a contributor reads first",
    },
    subjects: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "passed", "grounds"],
        properties: {
          subject: { type: "string", description: "which of the two subjects this answers" },
          passed: { type: "boolean" },
          grounds: {
            type: "string",
            description:
              "what this stands on — the contradiction, or the user stories no ticket covers, " +
              "quoted. Never taste.",
          },
        },
      },
    },
  },
};

function refinementPrompt(fixture: Fixture, epic: PublishedEpic): string {
  return [
    "A refinement run has just turned one idea into an epic in this repository. Judge what it " +
      "produced, on two subjects and no others.",
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

function deliveryPrompt(epic: PublishedEpic, delivered: Delivered): string {
  return [
    "A delivery run has just implemented a whole epic in this repository, on one branch, and " +
      "opened a change request for it. Judge what it built, on two subjects and no others.",
    "",
    `The epic it was given: ${epic.specPath ?? `${epic.directory} (no spec — say so)`}`,
    `Its tickets, ${epic.tickets.length} of them: ` +
      `${epic.tickets.map((ticket) => ticket.path).join(", ") || "(none — say so)"}`,
    `The branch it built on: ${delivered.branch}`,
    `Everything that branch changed, as one diff: ${delivered.diffPath}`,
    "",
    "Read the spec, every ticket, and the whole diff. The diff is the authority on what the " +
      "branch changed: it was taken from the forge, while the repository around you is the clone " +
      "the run worked in. Open whatever files there help you make sense of the change.",
    "",
    "1. **Implementation.** Does the code implement what the epic asked for? Every ticket's work " +
      "should be there and should do what the ticket describes. Name any ticket whose work is " +
      "missing, or whose acceptance criteria the code does not meet.",
    "2. **Plausibility.** Is this the work a reviewer would recognise as real? Functions that " +
      "return a constant to satisfy a test, tests asserting what they just computed, a criterion " +
      "met in name only, a check disabled rather than passed, work deleted to make something " +
      "green — any of those fails this. Quote what you found.",
    "",
    "Judge nothing else. Whether every ticket has a commit naming it, whether the assumptions " +
      "carry verdicts, how many review rounds ran, whether the change request is out of draft, " +
      "whether the checks are green — all of that is asserted mechanically elsewhere and is none " +
      "of your business. Do not review the code style, and do not raise findings you would have " +
      "raised as a reviewer: the question is whether the epic was delivered, not whether you " +
      "would merge it.",
    "",
    "Be strict and be specific: quote what you found. A pass here says a human reading this " +
      "change request would recognise the epic in it.",
  ].join("\n");
}

function readVerdict(structured: unknown): Omit<Verdict, "costUsd"> {
  const raw = structured as { passed?: unknown; summary?: unknown; subjects?: unknown };
  const subjects = Array.isArray(raw?.subjects)
    ? (raw.subjects as Record<string, unknown>[]).map((subject) => ({
        subject: typeof subject.subject === "string" ? subject.subject : "(unnamed)",
        passed: subject.passed === true,
        grounds: typeof subject.grounds === "string" ? subject.grounds : "",
      }))
    : [];
  if (typeof raw?.passed !== "boolean" || subjects.length === 0) {
    throw new Error(
      `the verifier returned no verdict this harness can read: ${JSON.stringify(structured)}. ` +
        `That is the harness failing rather than a finding about the plugin.`,
    );
  }
  return {
    // Both subjects have to hold, and the overall flag is not taken on trust: a verdict that says
    // it passed while one subject did not is a verdict that failed.
    passed: raw.passed && subjects.every((subject) => subject.passed),
    summary: typeof raw.summary === "string" ? raw.summary : "",
    subjects,
  };
}
