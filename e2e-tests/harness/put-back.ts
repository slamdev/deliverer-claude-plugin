/**
 * The human's seat at a **put-back**, filled from the fixture's **brief**.
 *
 * A **spec-writer**'s **report** raises **fork**s. In a real **run** the **orchestrator** reads
 * them, puts them to the human with `AskUserQuestion`, and continues the dispatch carrying every
 * answer — one round, one put-back, per `plugin/skills/refine/SKILL.md` stage 3. The **bench**
 * drives stage 3 with nobody around, so this module is that whole leg: it reads the report, finds
 * the forks in it, and answers each one as the human who wrote the fixture's brief would.
 *
 * **It collapses two agents the real run keeps apart**, and that is worth saying plainly. A run's
 * orchestrator turns the report into questions on `opus` and the **responder** picks answers out of
 * the brief on `sonnet`; here one turn does both. What that buys is an arm that can be driven at
 * all without standing a whole orchestrator up beside it. What it costs is that the put-back
 * message is composed by a smaller model than the one that composes it in a run — so an arm's
 * absolute figures are no more comparable to a run's than the dispatch's already were
 * (`fixtures/typescript-library/stage-3/provenance.md`), and two arms answered by the same seat
 * stay comparable with each other, which is the only comparison a bench makes.
 *
 * **The seat never reads the repository and never reads the writer's spec.** It is the human, who
 * has not read either: what it holds is the fixture's brief and the report in front of it. A seat
 * that went and looked would close forks on grounds the human never had, which is precisely the
 * failure the writer's own contract is written against.
 *
 * **A report that raises no fork ends the stage**, and saying so is the measurement. The question
 * this module exists to answer is how many waves a writer's reports cost, so "no forks" has to be
 * an answer it can give rather than a case it works around.
 */
import { askAgent } from "./agent.ts";
import { PUT_BACK_ROUND_CEILING_USD } from "./ceilings.ts";
import type { Fixture } from "./fixture.ts";
import type { RunDirectory } from "./run-directory.ts";

/** The model the seat answers on — the **responder**'s, for the same reason: it is a reading task. */
const SEAT_MODEL = "sonnet";

/** One fork the report put to the human, with the answer that closes it. */
export interface AnsweredFork {
  /** the fork as the report named it, so a reader can find it in the report */
  readonly fork: string;
  /** the road the human takes */
  readonly answer: string;
  /** why — what goes into the spec beside the decision as that fork's **grounds** */
  readonly grounds: string;
  /** whether the report itself recommended a road, and whether the human took it */
  readonly recommended: string;
  readonly tookRecommendation: boolean;
}

/** What one report put to the human, and what came back. */
export interface SeatAnswer {
  /** every fork the report raised. Empty means the stage is over: nothing is owed a put-back */
  readonly forks: readonly AnsweredFork[];
  /** where the report said it published the spec, or "" where it named nowhere */
  readonly specLocation: string;
  readonly costUsd: number;
}

/**
 * One report read, and every fork in it answered.
 *
 * Failure is not caught here. A seat that could not answer leaves the arm with no honest way to
 * continue — a put-back carrying invented answers would measure a stage nobody drove — so the
 * caller stops the arm and says which wave it stopped at.
 */
export async function takeTheSeat(
  runDirectory: RunDirectory,
  fixture: Fixture,
  report: string,
  ceiling: AbortSignal,
): Promise<SeatAnswer> {
  const answer = await askAgent({
    runDirectory,
    purpose: "the human's seat answering one writer's report",
    model: SEAT_MODEL,
    prompt: promptFor(fixture, report),
    schema: SEAT_SCHEMA,
    ceilingUsd: PUT_BACK_ROUND_CEILING_USD,
    // The run's own empty directory, and no tools: see the header. The seat has not read the
    // repository and must not start now.
    cwd: runDirectory.sessionDir,
    tools: [],
    ceiling,
  });
  return { ...read(answer.structured), costUsd: answer.costUsd };
}

/**
 * The put-back itself, in the **orchestrator**'s own shape.
 *
 * Taken from the measured run's two continuations verbatim in form: a line saying the human closed
 * them, the instruction to revise the published spec and re-check what sits downstream, and then one
 * bold-headed paragraph per fork carrying the road and its **grounds**. A bench that invented its
 * own wording would measure the wording rather than the writer.
 */
export function putBack(forks: readonly AnsweredFork[], specLocation: string): string {
  const where = specLocation === "" ? "the published spec" : `the published spec at ${specLocation}`;
  return [
    `${howMany(forks.length)} closed by the human. Revise ${where} so it carries these as settled ` +
      `decisions, and re-check anything downstream of them.`,
    "",
    ...forks.flatMap((fork) => [`**${fork.fork} — ${fork.answer}**`, "", fork.grounds, ""]),
  ]
    .join("\n")
    .trimEnd();
}

/** "All four forks are closed", and the one case where the plural would read wrong. */
function howMany(count: number): string {
  return count === 1 ? "The one fork you raised is" : `All ${count} forks you raised are`;
}

/** The shape an answer comes back in, so nothing here parses prose. */
const SEAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["specLocation", "forks"],
  properties: {
    specLocation: {
      type: "string",
      description:
        "the path the report says the spec was published at, copied exactly, or an empty string " +
        "where the report names none",
    },
    forks: {
      type: "array",
      description:
        "one entry per fork the report puts to the human, and none for anything else it reports. " +
        "A claim the writer settled, a seam it named and a spec location are not forks.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["fork", "answer", "grounds", "recommended", "tookRecommendation"],
        properties: {
          fork: {
            type: "string",
            description:
              "the fork as the report labels it, in a few words — its letter or number where the " +
              "report gives one, e.g. 'Fork A — how options.hard is read'",
          },
          answer: {
            type: "string",
            description: "the road taken, as one short sentence the writer can act on",
          },
          grounds: {
            type: "string",
            description:
              "why that road, in the human's own terms — this is what goes into the spec beside " +
              "the decision, so it is the reason and never a restatement of the answer",
          },
          recommended: {
            type: "string",
            description:
              "the road the report itself recommended for this fork, copied in a few words, or " +
              "an empty string where it recommended none",
          },
          tookRecommendation: {
            type: "boolean",
            description:
              "true only where the report recommended a road and the answer above is that road",
          },
        },
      },
    },
  },
};

function promptFor(fixture: Fixture, report: string): string {
  return [
    "You are standing in for the human who wrote the brief below. An agent was sent off to write " +
      "the specification for their idea, and has come back with the report below. Some of what it " +
      "reports are FORKS: decisions it will not take itself, because they are yours. Close every " +
      "one of them as that human would.",
    "",
    "<brief>",
    fixture.brief.trim(),
    "</brief>",
    "",
    "<report>",
    report.trim(),
    "</report>",
    "",
    "Rules:",
    "- List every fork the report puts to you, once each, and nothing else it reports. A claim it " +
      "checked and confirmed, a seam it named, a count and the spec's location are not forks.",
    "- A fork is a decision: two roads a reasonable engineer could take, where which one is taken " +
      "changes behaviour. A collision between two decisions the brief settled is a fork too, and " +
      "so is a decision that fell over because a claim in the brief turned out false.",
    "- Where the brief settles which road to take, take that road. Never contradict a decision " +
      "the brief records, and never invent one it does not carry.",
    "- Where the brief is silent, decide as its author would from what it does say, and take the " +
      "road the report recommends where it recommends one and nothing in the brief argues against " +
      "it. Say nothing about the brief being silent.",
    "- The grounds are the reason, in the human's terms. They go into the specification beside " +
      "the decision, so a restatement of the answer is worth nothing there.",
    "- Answer as the human. Ask nothing back, read nothing, and add no commentary.",
  ].join("\n");
}

/** The answer, narrowed defensively: this is another process's data. */
function read(structured: unknown): { forks: AnsweredFork[]; specLocation: string } {
  const given = structured as { forks?: unknown; specLocation?: unknown } | null;
  const location = typeof given?.specLocation === "string" ? given.specLocation.trim() : "";
  const raw = Array.isArray(given?.forks) ? (given.forks as Record<string, unknown>[]) : [];
  const forks: AnsweredFork[] = [];
  for (const entry of raw) {
    const fork = text(entry?.fork);
    const answer = text(entry?.answer);
    // A fork with no answer is not a closed fork, and putting one back would hand the writer a
    // heading with nothing under it. It is dropped rather than guessed at, and the wave carries on
    // with the ones that were answered.
    if (fork === "" || answer === "") continue;
    forks.push({
      fork,
      answer,
      grounds: text(entry?.grounds),
      recommended: text(entry?.recommended),
      tookRecommendation: entry?.tookRecommendation === true,
    });
  }
  return { forks, specLocation: location };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
