/**
 * The responder: the human's place at the grilling, filled from the fixture's brief
 * (end-to-end-tests ticket 02).
 *
 * **Questions arrive as structured data and leave the same way.** The session's permission callback
 * is handed the `AskUserQuestion` tool call itself — every question with its header, its options
 * and their descriptions, and whether it takes more than one answer — and the answers go back
 * through the same callback, where they reach the model verbatim. Nothing parses a terminal and
 * nothing sends a keystroke: there is no screen to read and no timing to get wrong.
 *
 * It stands in for the human and for nobody else. It forms no view on whether the answers were used
 * well — that is the **verifier**'s, and only after the run.
 *
 * It answers from the fixture's **brief**, so two runs of this test produce comparable epics rather
 * than whatever a model felt like inventing that afternoon; where the brief is silent it takes the
 * recommended option, which the refinement skill puts at the head of the list. And it confirms the
 * shared understanding when it is asked for one — that is the skill's own bar for stage 1 being
 * done, so a responder that never confirms leaves the grilling running until a ceiling stops it,
 * which is exactly the pass this test must not produce.
 *
 * On `sonnet`, because answering from a brief is a reading task it performs many times per run.
 *
 * **A fallback is recorded, never hidden.** If the responder cannot answer — it failed, or it
 * answered nothing for a question — the recommended option goes back so the run is not left
 * hanging on a callback that never returns, and the record says it happened. A matcher fails the
 * test on it: a run answered by the harness's own default is a run the fixture's brief did not
 * drive.
 */
import type { CanUseTool, PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { askAgent } from "./agent.ts";
import { RESPONDER_ROUND_CEILING_USD } from "./ceilings.ts";
import type { Fixture } from "./fixture.ts";
import type { RunDirectory } from "./run-directory.ts";

/** The model it answers on. The harness's own choice; it says nothing about the plugin. */
const RESPONDER_MODEL = "sonnet";

/**
 * How many times a round is attempted before the fallback takes it.
 *
 * A grilling asks many rounds and each one is a session of its own, so a transient failure in any
 * of them would otherwise fail the whole test on the harness rather than on the plugin. Two
 * attempts, and then the fallback — which is recorded, and which a matcher fails the test on.
 */
const ROUND_ATTEMPTS = 2;

/** The tool a grilling asks its questions with, and the only one this callback treats specially. */
const ASK_TOOL = "AskUserQuestion";

/** One question as the callback receives it, narrowed to what an answer needs. */
interface AskedQuestion {
  readonly question: string;
  readonly header: string;
  readonly multiSelect: boolean;
  readonly options: readonly { readonly label: string; readonly description: string }[];
}

/** One question answered, kept so a reader can see what the grilling actually asked. */
export interface AnsweredQuestion {
  readonly question: string;
  readonly answer: string;
  /** true when the brief did not drive this answer — the recommended option went back instead */
  readonly fallback: boolean;
}

/** What the responder did over a whole run, read after it. */
export interface ResponderRecord {
  /** how many times the grilling put questions — the rounds a real refinement asks */
  readonly rounds: number;
  readonly answers: readonly AnsweredQuestion[];
  readonly fallbacks: number;
  readonly costUsd: number;
  /** every failure it met, so a claim is settled on what happened rather than on a guess */
  readonly failures: readonly string[];
}

export interface Responder {
  /** the session's permission callback: every tool allowed, every question answered */
  readonly canUseTool: CanUseTool;
  /** what it has done so far */
  record(): ResponderRecord;
}

export function createResponder(runDirectory: RunDirectory, fixture: Fixture): Responder {
  const answers: AnsweredQuestion[] = [];
  const failures: string[] = [];
  let rounds = 0;
  let costUsd = 0;

  const canUseTool: CanUseTool = async (toolName, input, options): Promise<PermissionResult> => {
    if (toolName !== ASK_TOOL) return { behavior: "allow", updatedInput: input };

    rounds += 1;
    const questions = askedQuestions(input);
    if (questions.length === 0) {
      // Nothing to answer and nothing to fall back to. Allowing it unchanged is what a host does
      // with a call it cannot serve, and the run's own report will say what came of it.
      failures.push(`round ${rounds} carried no questions this callback could read`);
      return { behavior: "allow", updatedInput: input };
    }

    let chosen = new Map<string, string>();
    for (let attempt = 1; attempt <= ROUND_ATTEMPTS && chosen.size === 0; attempt += 1) {
      try {
        const asked = await ask(runDirectory, fixture, questions, options.signal);
        costUsd += asked.costUsd;
        chosen = asked.answers;
      } catch (error) {
        failures.push(`round ${rounds}, attempt ${attempt}: ${String(error)}`);
      }
    }

    const answered: Record<string, string> = {};
    for (const question of questions) {
      const fromBrief = chosen.get(question.question);
      const answer = fromBrief ?? recommended(question);
      answered[question.question] = answer;
      answers.push({ question: question.question, answer, fallback: fromBrief === undefined });
    }
    return { behavior: "allow", updatedInput: { ...input, answers: answered } };
  };

  return {
    canUseTool,
    record: () => ({
      rounds,
      answers: [...answers],
      fallbacks: answers.filter((answer) => answer.fallback).length,
      costUsd,
      failures: [...failures],
    }),
  };
}

/**
 * The human's seat with nobody in it, for a run that is not supposed to ask (ticket 03).
 *
 * A delivery has no grilling: what it cannot settle it **escalates**, which is a comment left for a
 * human and a line in its report rather than a question put to one. So there is no **brief** to
 * answer from and nothing here reads one.
 *
 * It still answers, because a callback that never returns hangs the run until a ceiling stops it,
 * and a wedged delivery is the worst reading of a question this harness could give. The recommended
 * option goes back, every answer is recorded as the fallback it is, and a test reports what was
 * asked: a delivery that had to ask is worth a contributor's attention even when the run finished.
 */
export function createUnattendedSeat(): Responder {
  const answers: AnsweredQuestion[] = [];
  const failures: string[] = [];
  let rounds = 0;

  const canUseTool: CanUseTool = async (toolName, input): Promise<PermissionResult> => {
    if (toolName !== ASK_TOOL) return { behavior: "allow", updatedInput: input };

    rounds += 1;
    const questions = askedQuestions(input);
    if (questions.length === 0) {
      failures.push(`round ${rounds} carried no questions this callback could read`);
      return { behavior: "allow", updatedInput: input };
    }
    const answered: Record<string, string> = {};
    for (const question of questions) {
      const answer = recommended(question);
      answered[question.question] = answer;
      answers.push({ question: question.question, answer, fallback: true });
    }
    return { behavior: "allow", updatedInput: { ...input, answers: answered } };
  };

  return {
    canUseTool,
    record: () => ({
      rounds,
      answers: [...answers],
      fallbacks: answers.length,
      costUsd: 0,
      failures: [...failures],
    }),
  };
}

/** One round of questions, answered from the brief. */
async function ask(
  runDirectory: RunDirectory,
  fixture: Fixture,
  questions: readonly AskedQuestion[],
  signal: AbortSignal,
): Promise<{ answers: Map<string, string>; costUsd: number }> {
  const answer = await askAgent({
    runDirectory,
    purpose: "the responder's answers to one round of questions",
    model: RESPONDER_MODEL,
    prompt: promptFor(fixture, questions),
    schema: ANSWER_SCHEMA,
    ceilingUsd: RESPONDER_ROUND_CEILING_USD,
    // The run's own empty directory, so nothing the responder does lands in the clone and its
    // session records stay out of the run's.
    cwd: runDirectory.sessionDir,
    // No tools: the brief is in the prompt, and the responder has no business reading the
    // repository the grilling is about. It answers as the human, who has not read it either.
    tools: [],
    ceiling: signal,
  });
  return { answers: matched(answer.structured, questions), costUsd: answer.costUsd };
}

/** The shape an answer comes back in, so nothing here parses prose. */
const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "answer"],
        properties: {
          question: { type: "string", description: "the question, copied exactly" },
          answer: {
            type: "string",
            description:
              "the option's label exactly as written, several joined by ', ' where the question " +
              "takes more than one, or free text where no option says what the brief says",
          },
        },
      },
    },
  },
};

function promptFor(fixture: Fixture, questions: readonly AskedQuestion[]): string {
  return [
    "You are standing in for the human who wrote the brief below, in a design interview about " +
      "their own idea. Answer the questions as they would.",
    "",
    "<brief>",
    fixture.brief.trim(),
    "</brief>",
    "",
    "<questions>",
    JSON.stringify(questions, null, 2),
    "</questions>",
    "",
    "Rules:",
    "- Answer every question, once each, copying the question text exactly.",
    "- Where the brief settles the question, answer what the brief says. Never invent a decision " +
      "it does not carry, and never contradict one it does.",
    "- Where an option says what the brief says, answer with that option's label exactly as " +
      "written. Where none does, write the brief's answer as a short sentence of your own.",
    "- Where you are asked to confirm that the understanding is shared, that a summary is right, " +
      "that nothing is left open, or that the interview can move on: CONFIRM IT, and pick the " +
      "option that says so however it is worded and wherever it sits in the list. The brief is " +
      "the whole of what you think, so there is nothing further you are holding back. This rule " +
      "beats the one below.",
    "- Where the brief is silent, take the recommended option: the one whose label or " +
      "description says so, and otherwise the first one listed. Say nothing about the brief " +
      "being silent.",
    "- Where the question takes more than one answer, join the labels with ', '.",
    "- Answer as the human. Ask nothing back, and add no commentary.",
  ].join("\n");
}

/** The answers, keyed by the question they belong to. */
function matched(
  structured: unknown,
  questions: readonly AskedQuestion[],
): Map<string, string> {
  const given = Array.isArray((structured as { answers?: unknown })?.answers)
    ? ((structured as { answers: unknown[] }).answers as { question?: unknown; answer?: unknown }[])
    : [];
  const answers = new Map<string, string>();
  const spare: string[] = [];
  for (const entry of given) {
    const answer = typeof entry.answer === "string" ? entry.answer.trim() : "";
    if (answer === "") continue;
    const question = typeof entry.question === "string" ? entry.question : "";
    if (questions.some((asked) => asked.question === question)) answers.set(question, answer);
    else spare.push(answer);
  }
  // An answer whose question came back reworded is still an answer. It goes to the first question
  // that has none, in the order they were asked, which is the order the responder answered them in.
  for (const question of questions) {
    if (answers.has(question.question)) continue;
    const next = spare.shift();
    if (next !== undefined) answers.set(question.question, next);
  }
  return answers;
}

/** The option a question recommends: the one that says so, and otherwise the first. */
function recommended(question: AskedQuestion): string {
  const marked = question.options.find((option) => /recommend/i.test(option.label));
  return marked?.label ?? question.options[0]?.label ?? "yes";
}

/** The questions the callback was handed, narrowed defensively: this is another process's data. */
function askedQuestions(input: Record<string, unknown>): AskedQuestion[] {
  const raw = Array.isArray(input.questions) ? input.questions : [];
  const questions: AskedQuestion[] = [];
  for (const entry of raw as Record<string, unknown>[]) {
    const question = typeof entry?.question === "string" ? entry.question : "";
    if (question === "") continue;
    const options = Array.isArray(entry.options)
      ? (entry.options as Record<string, unknown>[])
      : [];
    questions.push({
      question,
      header: typeof entry.header === "string" ? entry.header : "",
      multiSelect: entry.multiSelect === true,
      options: options
        .filter((option) => typeof option?.label === "string")
        .map((option) => ({
          label: option.label as string,
          description: typeof option.description === "string" ? option.description : "",
        })),
    });
  }
  return questions;
}
