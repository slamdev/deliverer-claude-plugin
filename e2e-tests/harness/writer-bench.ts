/**
 * The bench: one **spec-writer** **dispatch** and its **put-back** waves, driven on their own.
 *
 * **Why it exists.** A refinement of this **fixture** costs about $20 and spreads $13.45 to $36.46
 * across seven readings, so a change that moved a **writer** by a dollar is invisible in one — and
 * nobody is going to take six readings at $20 to see it. Stage 3 alone is about $5, and two arms of
 * it differing in one file are comparable with each other. That is the whole trade this module
 * makes: it buys a reading you can afford by giving up a figure you can quote.
 *
 * **An arm's absolute figures are inflated and must never be compared against a run's.** A dispatch
 * inside a run is a subagent, carrying the orchestrator's context and the host's subagent
 * scaffolding; an arm runs the writer as a TOP-LEVEL session with the `claude_code` preset, which
 * is a larger base context. Measured: the arm reproducing a real first pass that cost $3.39 came in
 * at $4.41, about 30% over. Two arms driven the same way carry the same inflation, which is why the
 * comparison survives and the quotation does not.
 *
 * **Ignore an arm's wall clock too.** Arms are ordinarily driven in pairs against one account, and
 * each inflates the other.
 *
 * **What an arm is.** A **run directory** of its own, exactly as a real run gets, holding the
 * fixture's `repository/` cloned locally, what stage 1 left in that working tree, the **brief**
 * stage 3 was dispatched with, and the agent definition under test. Nothing reaches a forge and
 * nothing is installed: the writer is driven from its own body as a system prompt, under the model,
 * the **effort** and the `disallowedTools` ITS OWN FRONTMATTER declares, so an arm measures what the
 * file says rather than what this harness assumed.
 * `fixtures/typescript-library/stage-3/provenance.md` says where the inputs came from and which
 * trap that reconstruction avoids.
 *
 * **Why it drives the put-backs and not just the dispatch.** The single largest line in the
 * measured run of 2026-09-12 was one extra put-back wave — $3.58 of a $7.41 difference — and a rig
 * that stops at the first **report** cannot see a wave at all. So the seat in `./put-back.ts` reads
 * each report, answers its **fork**s out of the fixture's brief, and the arm continues the same
 * session carrying them, which is what an orchestrator does. The reading then carries the one
 * figure the question is about: how many waves the writer's reports cost.
 */
import { query, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { cp, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CeilingReached, minutes, type Ceilings } from "./ceilings.ts";
import { execute } from "./command.ts";
import type { Fixture } from "./fixture.ts";
import { buildFixtureRepository } from "./forge.ts";
import { putBack, takeTheSeat, type AnsweredFork } from "./put-back.ts";
import {
  createRunDirectory,
  runEnvironment,
  sessionEnvironment,
  type RunDirectory,
} from "./run-directory.ts";

/**
 * What stage 3 was dispatched with, inside the fixture.
 *
 * A directory and no manifest key, so a fixture that wants a bench adds one and a fixture that does
 * not is unaffected — the same bargain `./fixture.ts` strikes for everything else it reads.
 */
const STAGE_3 = "stage-3";

/** How much of the host's stderr an arm keeps, so a failure can quote what it complained about. */
const STDERR_LINES_KEPT = 40;

/**
 * What the writer's thinking is displayed as, copied from `./run.ts` along with the reason.
 *
 * `omitted` is the default on these models and writes every thinking block to the **session
 * record** with its text empty, so a record would say which files the writer opened and never why.
 * It is not free — a summary is output tokens — which is one more reason an arm's absolute figure
 * is not a run's.
 */
const THINKING = { type: "adaptive" as const, display: "summarized" as const };

/** One arm: one agent definition, driven once. */
export interface ArmRequest {
  /** what to call it, which names its run directory and everything the reading says about it */
  readonly name: string;
  readonly fixture: Fixture;
  /** the agent definition under test — `plugin/agents/spec-writer.md`, or a variant of it */
  readonly agentFile: string;
  readonly ceilings: Ceilings;
  /**
   * How many put-back waves the arm will drive before it stops asking.
   *
   * A bound rather than an expectation. The measured run took two, and a writer that raised a fork
   * on every wave for ever would otherwise spend an arm's whole ceiling finding that out. An arm
   * that reaches it says so in the reading rather than reporting a stage that closed.
   */
  readonly maxWaves: number;
}

/** One segment of the stage: the dispatch, or one put-back after it. */
export interface Wave {
  /** 0 is the dispatch itself; 1 and up are the put-backs */
  readonly index: number;
  readonly prompt: string;
  readonly report: string;
  readonly subtype: string;
  readonly costUsd: number;
  readonly durationMs: number;
  readonly numTurns: number;
  /** the forks this wave's report raised, as the human's seat read and answered them */
  readonly forks: readonly AnsweredFork[];
  /** what the seat spent reading this report */
  readonly seatUsd: number;
}

/** What one arm measured. */
export interface Reading {
  readonly arm: string;
  readonly agentFile: string;
  /** where everything the arm touched is, and stays */
  readonly runDirectory: string;
  readonly waves: readonly Wave[];
  /** what the writer spent: every wave of it */
  readonly writerUsd: number;
  /** what the human's seat spent beside it */
  readonly seatUsd: number;
  readonly wallClockMs: number;
  /** the published spec, or null where the arm published nothing anywhere the fixture looks */
  readonly specPath: string | null;
  readonly specBytes: number;
  /** numbered items under the spec's User Stories heading: the bar a ticket set is measured on */
  readonly userStories: number;
  /** how many of the forks put back carried a road the report recommended, and how many took it */
  readonly recommendedRoads: number;
  readonly recommendationsTaken: number;
  /**
   * Whether the stage CLOSED: the last report raised no fork and nothing stopped the arm.
   *
   * The one thing a reader must not have to infer. An arm stopped with forks outstanding and an
   * arm whose writer finally raised none both end, and only the first of them says nothing about
   * how many waves this writer's reports cost.
   */
  readonly stageClosed: boolean;
  /** what stopped the arm short, or null where the stage closed on its own */
  readonly stoppedBy: string | null;
  /** the tail of the host's stderr */
  readonly stderr: readonly string[];
}

/**
 * One arm, built and driven, with everything it touched left on disk.
 *
 * It throws for a bench that could not be SET UP — a fixture with no `stage-3/`, an agent file that
 * is not there — and never for a stage that went badly. A writer that raised forks for ever, or an
 * arm a ceiling stopped, is a reading with `stoppedBy` set: that is a finding about the file under
 * test, and a thrown exception would lose every wave measured before it.
 */
export async function driveArm(request: ArmRequest): Promise<Reading> {
  const runDirectory = await createRunDirectory(`spec-writer-bench-${request.name}`);
  const inputs = await stageThreeInputs(request.fixture);
  const agent = await readAgent(request.agentFile);

  await buildClone(runDirectory, request.fixture, inputs);
  const briefPath = join(runDirectory.tempDir, "brief.md");
  await writeFile(briefPath, await readFile(join(inputs, "brief.md"), "utf8"));
  const dispatch = (await readFile(join(inputs, "prompt.md"), "utf8"))
    .replaceAll("{{BRIEF}}", briefPath)
    .replaceAll("{{CLONE}}", runDirectory.cloneDir);

  const driven = await drive(runDirectory, request, agent, dispatch);
  const published = await publishedSpec(runDirectory, request.fixture);
  const forks = driven.waves.flatMap((wave) => wave.forks);
  const reading: Reading = {
    arm: request.name,
    agentFile: request.agentFile,
    runDirectory: runDirectory.root,
    waves: driven.waves,
    writerUsd: driven.waves.reduce((total, wave) => total + wave.costUsd, 0),
    seatUsd: driven.waves.reduce((total, wave) => total + wave.seatUsd, 0),
    wallClockMs: driven.wallClockMs,
    specPath: published.path,
    specBytes: published.bytes,
    userStories: published.userStories,
    recommendedRoads: forks.filter((fork) => fork.recommended !== "").length,
    recommendationsTaken: forks.filter((fork) => fork.tookRecommendation).length,
    stageClosed: driven.stoppedBy === null && (driven.waves.at(-1)?.forks.length ?? 1) === 0,
    stoppedBy: driven.stoppedBy,
    stderr: driven.stderr,
  };
  await writeReading(runDirectory, reading);
  return reading;
}

/**
 * The writer driven across every wave, in ONE session.
 *
 * One session and not one per wave, because that is what an orchestrator continuing a dispatch
 * gets: the writer is still holding the context that wrote the document, and the correction costs a
 * patch where a cold dispatch pays for the whole write again (`plugin/skills/refine/SKILL.md`).
 * Measuring it any other way would price a move the skill tells the orchestrator not to make.
 */
async function drive(
  runDirectory: RunDirectory,
  request: ArmRequest,
  agent: AgentDefinition,
  dispatch: string,
): Promise<{
  waves: Wave[];
  wallClockMs: number;
  stoppedBy: string | null;
  stderr: string[];
}> {
  const started = Date.now();
  const stopped = new AbortController();
  let stoppedBy: string | null = null;
  const stop = (why: string): void => {
    stoppedBy ??= why;
    stopped.abort(new Error(why));
  };
  const timer = setTimeout(
    () => stop(`the wall-clock ceiling of ${minutes(request.ceilings.wallClockMs)}`),
    request.ceilings.wallClockMs,
  );
  timer.unref();

  // The turns the writer has yet to be handed. `null` closes the input stream, which is what ends
  // the session: the generator below waits on this queue rather than polling it, so a wave the seat
  // is still thinking about holds the session open and costs nothing while it does.
  const turns: (string | null)[] = [];
  let wake: (() => void) | undefined;
  const hand = (next: string | null): void => {
    turns.push(next);
    wake?.();
    wake = undefined;
  };
  async function* conversation(): AsyncGenerator<SDKUserMessage> {
    yield asUser(dispatch);
    for (;;) {
      while (turns.length === 0) {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      const next = turns.shift();
      if (next === undefined || next === null) return;
      yield asUser(next);
    }
  }

  const stderr: string[] = [];
  const session = query({
    prompt: conversation(),
    options: {
      cwd: runDirectory.cloneDir,
      // The clone's own `CLAUDE.md` and nothing else. Project scope is how a fixture's conventions
      // reach a writer, which is the same way they reach one in a run; user scope is the plugin
      // install a run has and a bench does not.
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      // The agent's own body as its system prompt, over the preset a dispatch runs under.
      systemPrompt: { type: "preset", preset: "claude_code", append: agent.body },
      // Its own frontmatter's, so an arm measures the file rather than this harness's memory of it.
      disallowedTools: [...agent.disallowedTools],
      model: agent.model,
      effort: agent.effort,
      thinking: THINKING,
      // The arm's whole ceiling. The seat's spend is beside it and held below, the way a run holds
      // the **responder**'s beside its own (`./run.ts`).
      maxBudgetUsd: request.ceilings.spendUsd,
      abortController: stopped,
      env: await sessionEnvironment(runDirectory),
      stderr: (data: string) => {
        for (const line of data.split("\n")) {
          if (line.trim() === "") continue;
          stderr.push(line);
          if (stderr.length > STDERR_LINES_KEPT) stderr.shift();
        }
      },
    },
  });

  const waves: Wave[] = [];
  let prompt = dispatch;
  let specLocation = "";
  let seatTotal = 0;
  try {
    for await (const message of session) {
      if (message.type !== "result") continue;
      const report = message.subtype === "success" ? message.result : "";
      const wave: Wave = {
        index: waves.length,
        prompt,
        report,
        subtype: message.subtype,
        costUsd: message.total_cost_usd,
        durationMs: message.duration_ms,
        numTurns: message.num_turns,
        forks: [],
        seatUsd: 0,
      };
      waves.push(wave);

      const next = await nextTurn(runDirectory, request, wave, {
        spentByWriter: waves.reduce((total, each) => total + each.costUsd, 0),
        spentBySeat: seatTotal,
        specLocation,
        stopped: stopped.signal,
        stop,
      });
      seatTotal += next.seatUsd;
      if (next.specLocation !== "") specLocation = next.specLocation;
      const measured = { ...wave, forks: next.forks, seatUsd: next.seatUsd };
      waves[wave.index] = measured;
      // Written as it lands rather than at the end: an arm runs for twenty minutes a wave, and a
      // contributor watching one wants to read the report the money just bought without waiting
      // for the arm to finish — or, where it never does, at all.
      await writeWave(runDirectory, measured);
      prompt = next.putBack ?? prompt;
      hand(next.putBack);
    }
  } catch (error) {
    // The host raises after reporting a session it stopped itself, so whatever was measured before
    // it is already in `waves`. What the reading loses is only the reason, which is recorded here.
    stoppedBy ??= `the session ended: ${String(error)}`;
  } finally {
    clearTimeout(timer);
    hand(null);
  }

  return { waves, wallClockMs: Date.now() - started, stoppedBy, stderr };
}

/** What the arm hands the writer next, and what finding it out cost. */
interface NextTurn {
  readonly putBack: string | null;
  readonly forks: readonly AnsweredFork[];
  readonly seatUsd: number;
  readonly specLocation: string;
}

/**
 * The human's seat, consulted on every report there is one to read.
 *
 * **A ceiling stops the next WAVE and never the reading**, which is the whole lesson of the first
 * comparison this bench drove. Its arm reached $12 after one put-back, the bound fired, and the
 * seat was never asked — so the wave the money bought was recorded as raising no **fork**, which
 * is what "the stage closed" looks like and what "nobody looked" looks like, and the reading could
 * not tell them apart. The seat is under half a percent of a wave's cost and the fork count is the
 * measurement, so it is always paid for. What a reached ceiling buys is never handing the writer
 * the put-back, which is where the dollars actually are.
 *
 * A report that raised no fork is then the one ending that is not a stop at all: it is the stage
 * closing, which is the thing the bench exists to see.
 */
async function nextTurn(
  runDirectory: RunDirectory,
  request: ArmRequest,
  wave: Wave,
  state: {
    spentByWriter: number;
    spentBySeat: number;
    specLocation: string;
    stopped: AbortSignal;
    stop: (why: string) => void;
  },
): Promise<NextTurn> {
  const none = { putBack: null, forks: [], seatUsd: 0, specLocation: "" };
  if (state.stopped.aborted) return none;
  if (wave.subtype !== "success") {
    state.stop(`wave ${wave.index} ended as ${wave.subtype} rather than reporting`);
    return none;
  }

  let seat;
  try {
    seat = await takeTheSeat(runDirectory, request.fixture, wave.report, state.stopped);
  } catch (error) {
    // A put-back carrying invented answers would measure a stage nobody drove, so the arm stops
    // here and the reading says at which wave. Nothing already measured is lost.
    state.stop(`the human's seat could not answer wave ${wave.index}: ${String(error)}`);
    return none;
  }
  const read = { forks: seat.forks, seatUsd: seat.costUsd, specLocation: seat.specLocation };
  if (seat.forks.length === 0) return { putBack: null, ...read };

  // Read, and then not driven: the reading carries what this report raised, and the arm stops
  // before the put-back that would have cost what a wave costs.
  if (wave.index + 1 > request.maxWaves) {
    state.stop(`the bound of ${request.maxWaves} put-back wave(s) was reached`);
    return { putBack: null, ...read };
  }
  const spent = state.spentByWriter + state.spentBySeat + seat.costUsd;
  if (spent > request.ceilings.spendUsd) {
    state.stop(`the spend ceiling of $${request.ceilings.spendUsd} was reached`);
    return { putBack: null, ...read };
  }
  const location = seat.specLocation === "" ? state.specLocation : seat.specLocation;
  return {
    putBack: putBack(seat.forks, location),
    forks: seat.forks,
    seatUsd: seat.costUsd,
    specLocation: seat.specLocation,
  };
}

function asUser(content: string): SDKUserMessage {
  return { type: "user", message: { role: "user", content }, parent_tool_use_id: null };
}

/** An agent definition as an arm drives it: its body, and the three things its frontmatter pins. */
interface AgentDefinition {
  readonly body: string;
  readonly model: string;
  readonly effort: "low" | "medium" | "high";
  readonly disallowedTools: readonly string[];
}

/**
 * The agent file read as the host reads it: the body is the system prompt, the frontmatter is the
 * session's options.
 *
 * Read rather than assumed, so an arm measuring a variant that pins a different model or a
 * different **effort** measures that variant, and a frontmatter key that moves does not leave the
 * bench quietly driving the old value. A key the file does not carry falls back to what the
 * plugin's seven agents all declare today, which is what a dispatch of an agent missing it would
 * also get.
 */
async function readAgent(path: string): Promise<AgentDefinition> {
  let source: string;
  try {
    source = await readFile(path, "utf8");
  } catch {
    throw new Error(
      `there is no agent definition at ${path}, so there is nothing for this arm to drive. An ` +
        `arm's agent file is \`plugin/agents/spec-writer.md\` or a copy of it edited for the ` +
        `change being measured.`,
    );
  }
  const matched = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  if (matched === null) {
    throw new Error(
      `${path} has no YAML frontmatter between two \`---\` lines, so it is not an agent ` +
        `definition a host would load — and an arm driving its whole text as a system prompt ` +
        `would measure something no dispatch has ever run.`,
    );
  }
  const frontmatter = matched[1] ?? "";
  const model = declared(frontmatter, "model") ?? "opus";
  const effort = declared(frontmatter, "effort") ?? "high";
  const tools = declared(frontmatter, "disallowedTools") ?? "";
  return {
    body: matched[2] ?? "",
    model,
    effort: effort === "low" || effort === "medium" ? effort : "high",
    disallowedTools: tools
      .split(",")
      .map((tool) => tool.trim())
      .filter((tool) => tool !== ""),
  };
}

/** One top-level scalar out of the frontmatter. Not a YAML parser, and it does not need to be. */
function declared(frontmatter: string, key: string): string | undefined {
  for (const line of frontmatter.split("\n")) {
    if (!line.startsWith(`${key}:`)) continue;
    return line.slice(key.length + 1).trim();
  }
  return undefined;
}

/** The fixture's `stage-3/` directory, confirmed to be there before an arm spends anything. */
async function stageThreeInputs(fixture: Fixture): Promise<string> {
  const inputs = join(fixture.root, STAGE_3);
  for (const file of ["brief.md", "prompt.md"]) {
    try {
      await stat(join(inputs, file));
    } catch {
      throw new Error(
        `the fixture ${fixture.name} carries no ${STAGE_3}/${file}, so there is no stage 3 to ` +
          `replay. A fixture the bench can drive carries ${STAGE_3}/ holding the **brief** stage 3 ` +
          `was dispatched with, the dispatch prompt, and a clone/ of what stage 1 left behind.`,
      );
    }
  }
  return inputs;
}

/**
 * The clone an arm's writer works in: the fixture's repository, with stage 1's leavings over it.
 *
 * The clone is local and the fixture repository is built exactly as a run builds it, so no forge is
 * touched and no token is needed — a bench is the one thing here that can be driven without one.
 *
 * **Stage 1's files are left UNCOMMITTED**, because that is how the writer meets them in a run: an
 * orchestrator writes the glossary and the ADRs into the clone's working tree during the grilling
 * and nothing commits them. A bench that committed them would hand the writer a repository whose
 * history claims those decisions were always there.
 */
async function buildClone(
  runDirectory: RunDirectory,
  fixture: Fixture,
  inputs: string,
): Promise<void> {
  await buildFixtureRepository(runDirectory, fixture, null);
  await execute("git", ["clone", "--quiet", runDirectory.fixtureRepoDir, runDirectory.cloneDir], {
    cwd: runDirectory.root,
    env: runEnvironment(runDirectory),
    purpose: `cloning the ${fixture.name} fixture for a bench arm`,
  });
  await cp(join(inputs, "clone"), runDirectory.cloneDir, { recursive: true });
}

/** What the arm published, found by the fixture's own conventions rather than by a guessed path. */
async function publishedSpec(
  runDirectory: RunDirectory,
  fixture: Fixture,
): Promise<{ path: string | null; bytes: number; userStories: number }> {
  const empty = { path: null, bytes: 0, userStories: 0 };
  const trackerRoot = join(runDirectory.cloneDir, ...fixture.tracker.root.split("/"));
  let found: string | null = null;
  try {
    const entries = await readdir(trackerRoot, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile() || entry.name !== fixture.tracker.specFile) continue;
      // The first by path, so two runs of one arm name the same file. A bench drives one epic, and
      // a second spec under the tracker root is itself worth seeing in the reading.
      const path = join(entry.parentPath, entry.name);
      if (found === null || path < found) found = path;
    }
  } catch {
    return empty;
  }
  if (found === null) return empty;
  const spec = await readFile(found, "utf8");
  return { path: found, bytes: Buffer.byteLength(spec, "utf8"), userStories: userStories(spec) };
}

/**
 * Numbered items under the spec's User Stories heading.
 *
 * Counted off the NUMBERING rather than off "As a", which misses a story worded differently — that
 * undercounted one arm by three when this was a throwaway script.
 */
function userStories(spec: string): number {
  let inside = false;
  let counted = 0;
  for (const line of spec.split("\n")) {
    if (line.startsWith("## User Stories")) {
      inside = true;
      continue;
    }
    if (inside && line.startsWith("## ")) break;
    if (inside && /^[0-9]+\./.test(line.trim())) counted += 1;
  }
  return counted;
}

/**
 * The reading: the numbers, written once the arm is over.
 *
 * The prose that explains them is beside it, one file per wave, put there as each wave landed. A
 * comparison read off the numbers alone is one nobody can check.
 */
async function writeReading(runDirectory: RunDirectory, reading: Reading): Promise<void> {
  await writeFile(join(runDirectory.root, "reading.json"), `${JSON.stringify(reading, null, 2)}\n`);
}

/** One wave: what the writer was asked, what it reported, and what the human's seat said back. */
async function writeWave(runDirectory: RunDirectory, wave: Wave): Promise<void> {
  const what = wave.index === 0 ? "the dispatch" : `put-back ${wave.index}`;
  await writeFile(
    join(runDirectory.root, `wave-${wave.index}.md`),
    [
      `# Wave ${wave.index} — ${what}`,
      ``,
      `${wave.subtype}, ${wave.numTurns} turns, $${wave.costUsd.toFixed(4)}, ` +
        `${minutes(wave.durationMs)}`,
      ``,
      `## What the writer was asked`,
      ``,
      wave.prompt.trim(),
      ``,
      `## What it reported`,
      ``,
      wave.report.trim(),
      ``,
      `## What the human's seat answered ($${wave.seatUsd.toFixed(4)})`,
      ``,
      wave.forks.length === 0
        ? "No fork. The stage closed here."
        : wave.forks
            .map(
              (fork) =>
                `- **${fork.fork}** — ${fork.answer}\n  - grounds: ${fork.grounds}\n  - the ` +
                `report recommended: ${fork.recommended === "" ? "nothing" : fork.recommended}` +
                `${fork.tookRecommendation ? " (taken)" : ""}`,
            )
            .join("\n"),
      ``,
    ].join("\n"),
  );
}

/** An arm stopped by a ceiling, in the wording every other ceiling in this harness uses. */
export function ceilingReached(reading: Reading, ceilings: Ceilings): CeilingReached {
  return new CeilingReached("spend", `$${ceilings.spendUsd}`, {
    elapsedMs: reading.wallClockMs,
    spentUsd: reading.writerUsd + reading.seatUsd,
    detail: `${reading.arm} reached ${reading.waves.length} wave(s): ${reading.stoppedBy}`,
  });
}
