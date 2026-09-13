/**
 * The spec-writer bench, driven from a command line.
 *
 * ```
 * node bench/spec-writer.ts current=plugin/agents/spec-writer.md \
 *                          before=fe8f052:plugin/agents/spec-writer.md
 * ```
 *
 * One arm per argument, `<name>=<agent file>`. A file named `<rev>:<path>` is read out of git
 * rather than off disk, which is how an arm measures a file as it WAS without a stale copy of it
 * being checked in anywhere — the thing that goes stale is then the revision, and a revision does
 * not go stale. With no arguments at all it drives one arm off the working tree, which is the
 * cheapest way to find out that the bench itself still works.
 *
 * **This asserts nothing and is no part of `npm test`.** It is an instrument: it spends real money
 * and reports figures, and what they mean is the reader's to decide. `harness/writer-bench.ts` says
 * what an arm is, what its figures are worth and what they cannot be compared against — read that
 * before reading a number out of this.
 *
 * Arms run one after another by default so each one's wall clock means something and so a first arm
 * that went wrong can be seen before a second one is paid for. `--together` overlaps them, which is
 * faster and makes every wall clock here worthless.
 */
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execute } from "../harness/command.ts";
import { minutes, WRITER_BENCH_CEILINGS, type Ceilings } from "../harness/ceilings.ts";
import { loadFixture, type Fixture } from "../harness/fixture.ts";
import { REPOSITORY_ROOT } from "../harness/repository.ts";
import { driveArm, type Reading } from "../harness/writer-bench.ts";

/** The fixture a bench drives, unless `--fixture` names another. The one with a `stage-3/`. */
const DEFAULT_FIXTURE = "typescript-library";

/** How many put-back waves an arm drives before it stops asking. The measured run took two. */
const DEFAULT_MAX_WAVES = 3;

interface Invocation {
  readonly arms: readonly { name: string; agentFile: string }[];
  readonly fixtureName: string;
  readonly ceilings: Ceilings;
  readonly maxWaves: number;
  readonly together: boolean;
}

const invocation = read(process.argv.slice(2));
const fixture = await loadFixture(invocation.fixtureName);
const started = Date.now();

console.log(
  `driving ${invocation.arms.length} arm(s) ${invocation.together ? "together" : "in turn"} ` +
    `against the ${fixture.name} fixture, at most ${invocation.maxWaves} put-back wave(s) each, ` +
    `under $${invocation.ceilings.spendUsd} and ${minutes(invocation.ceilings.wallClockMs)} each.`,
);

const readings: Reading[] = [];
if (invocation.together) {
  readings.push(...(await Promise.all(invocation.arms.map((arm) => drive(arm, fixture)))));
} else {
  for (const arm of invocation.arms) readings.push(await drive(arm, fixture));
}

console.log(`\n${table(readings)}`);
console.log(
  `\n${readings.length} arm(s), $${total(readings).toFixed(2)} all in, ` +
    `${minutes(Date.now() - started)} wall clock.`,
);
for (const reading of readings) console.log(`  ${reading.arm}: ${reading.runDirectory}`);

// The comparison lands in the FIRST arm's directory: a reading has to outlive the terminal it
// printed in, and everything else a bench leaves is already under a run directory that nothing
// cleans up.
const first = readings[0];
if (first !== undefined) {
  const document = join(first.runDirectory, "bench-report.md");
  await writeFile(document, `${report(readings, Date.now() - started)}\n`);
  console.log(`\nthe comparison: ${document}`);
}

async function drive(
  arm: { name: string; agentFile: string },
  against: Fixture,
): Promise<Reading> {
  const agentFile = await materialise(arm.agentFile);
  console.log(`\n── ${arm.name} — ${arm.agentFile}`);
  const reading = await driveArm({
    name: arm.name,
    fixture: against,
    agentFile,
    ceilings: invocation.ceilings,
    maxWaves: invocation.maxWaves,
  });
  console.log(
    `   ${reading.waves.length} wave(s), $${(reading.writerUsd + reading.seatUsd).toFixed(2)}, ` +
      `${minutes(reading.wallClockMs)}, ${reading.specBytes} bytes of spec` +
      `${reading.stoppedBy === null ? "" : `, stopped: ${reading.stoppedBy}`}`,
  );
  return reading;
}

/**
 * An agent file on disk, whether it started there.
 *
 * `<rev>:<path>` is read out of git into a temporary file beside the bench's own run directories,
 * so an arm can measure a file as it was at any commit without a copy of it living in the tree and
 * drifting from what it claims to be. Anything else is a path — resolved against the repository
 * root, so the usual `plugin/agents/…` works from wherever the bench was started, and an absolute
 * path is left alone.
 */
async function materialise(named: string): Promise<string> {
  const at = named.indexOf(":");
  if (at === -1) return resolve(REPOSITORY_ROOT, named);
  const rev = named.slice(0, at);
  const path = named.slice(at + 1);
  const shown = await execute("git", ["show", `${rev}:${path}`], {
    cwd: REPOSITORY_ROOT,
    env: process.env,
    purpose: `reading ${path} as it was at ${rev}`,
  });
  const materialised = join(
    process.env.TMPDIR ?? "/tmp",
    `spec-writer-bench-${rev.replace(/[^A-Za-z0-9]/g, "-")}.md`,
  );
  await writeFile(materialised, shown.stdout);
  return materialised;
}

/** The comparison, as the table a reader scans first. */
function table(all: readonly Reading[]): string {
  const rows: [string, (reading: Reading) => string][] = [
    ["waves", (r) => String(r.waves.length)],
    ["forks put back", (r) => String(r.waves.reduce((n, w) => n + w.forks.length, 0))],
    ["roads recommended", (r) => String(r.recommendedRoads)],
    ["recommendations taken", (r) => String(r.recommendationsTaken)],
    ["writer $", (r) => r.writerUsd.toFixed(2)],
    ["seat $", (r) => r.seatUsd.toFixed(2)],
    ["arm $", (r) => (r.writerUsd + r.seatUsd).toFixed(2)],
    ["turns", (r) => String(r.waves.reduce((n, w) => n + w.numTurns, 0))],
    ["wall clock", (r) => minutes(r.wallClockMs)],
    ["spec.md bytes", (r) => String(r.specBytes)],
    ["user stories", (r) => String(r.userStories)],
    ["the stage closed", (r) => (r.stageClosed ? "yes" : "no")],
    ["stopped by", (r) => r.stoppedBy ?? "—"],
  ];
  const width = 22;
  const lines = [`${"".padEnd(width)}${all.map((r) => r.arm.padStart(20)).join("")}`];
  for (const [label, value] of rows) {
    lines.push(`${label.padEnd(width)}${all.map((r) => value(r).padStart(20)).join("")}`);
  }
  return lines.join("\n");
}

/** The same thing as a document, beside the arms: a reading outlives the terminal it printed in. */
function report(all: readonly Reading[], elapsedMs: number): string {
  const overlapped = invocation.together
    ? " (driven together — every wall clock here is worthless)"
    : "";
  return [
    `# The spec-writer bench, ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `${all.length} arm(s) against the ${fixture.name} fixture, $${total(all).toFixed(2)} all in, ` +
      `${minutes(elapsedMs)}${overlapped}.`,
    ``,
    "```",
    table(all),
    "```",
    ``,
    `**An arm's absolute figures are inflated by roughly 30% against a real dispatch and must ` +
      `not be quoted against a run.** Arms are comparable with each other and with nothing else ` +
      `— \`harness/writer-bench.ts\` says why.`,
    ``,
    ...all.flatMap((reading) => [
      `## ${reading.arm}`,
      ``,
      `- agent: \`${reading.agentFile}\``,
      `- arm: \`${reading.runDirectory}\``,
      `- spec: ${reading.specPath ?? "nothing was published anywhere the fixture looks"}`,
      ``,
      ...reading.waves.flatMap((wave) => [
        `### Wave ${wave.index}${wave.index === 0 ? " — the dispatch" : ""}`,
        ``,
        `${wave.subtype}, ${wave.numTurns} turns, $${wave.costUsd.toFixed(4)}, ` +
          `${wave.forks.length} fork(s) put back`,
        ``,
        ...wave.forks.map(
          (fork) =>
            `- **${fork.fork}** — ${fork.answer}` +
            `${fork.recommended === "" ? "" : ` (recommended: ${fork.recommended}` +
              `${fork.tookRecommendation ? ", taken" : ", not taken"})`}`,
        ),
        ``,
      ]),
    ]),
  ].join("\n");
}

function total(all: readonly Reading[]): number {
  return all.reduce((sum, reading) => sum + reading.writerUsd + reading.seatUsd, 0);
}

/** The command line, with everything it does not carry taking its default. */
function read(argv: readonly string[]): Invocation {
  const arms: { name: string; agentFile: string }[] = [];
  let fixtureName = DEFAULT_FIXTURE;
  let maxWaves = DEFAULT_MAX_WAVES;
  let ceilings = WRITER_BENCH_CEILINGS;
  let together = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? "";
    if (argument === "--together") {
      together = true;
      continue;
    }
    if (argument === "--fixture") {
      fixtureName = argv[(index += 1)] ?? DEFAULT_FIXTURE;
      continue;
    }
    if (argument === "--waves") {
      maxWaves = Number(argv[(index += 1)] ?? DEFAULT_MAX_WAVES);
      continue;
    }
    if (argument === "--ceiling") {
      ceilings = { ...ceilings, spendUsd: Number(argv[(index += 1)] ?? ceilings.spendUsd) };
      continue;
    }
    const at = argument.indexOf("=");
    if (at === -1) {
      throw new Error(
        `\`${argument}\` is not an arm. An arm is \`<name>=<agent file>\`, the file being a path ` +
          `from the repository root or \`<rev>:<path>\` to read it out of git.`,
      );
    }
    arms.push({ name: argument.slice(0, at), agentFile: argument.slice(at + 1) });
  }
  if (arms.length === 0) {
    arms.push({ name: "current", agentFile: "plugin/agents/spec-writer.md" });
  }
  return { arms, fixtureName, ceilings, maxWaves, together };
}
