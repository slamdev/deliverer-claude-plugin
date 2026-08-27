/**
 * The one synthesis per **run**: the whole **trace** read at once, and the **defect**s that come
 * back (run-observation ticket 05; D2, D8, D9, D10, D11, D12, D14, D17, D27, D28 and D29, with
 * ADR-0018 holding the bound).
 *
 * **This is the half that reproduces what a human got from watching a run in a second session.**
 * Everything before it is mechanical — the same records give the same trace and the same figures —
 * and everything a maintainer actually wants is here: what this run cost its human that it did not
 * have to, each item carrying the grounds from the run's own conduct that show it.
 *
 * Five decisions in this file are load-bearing, and each is easy to undo by accident:
 *
 *  - **The whole trace goes into the prompt, as the file.** Not a path to read and not a summary:
 *    what the model is handed is byte for byte what `DO-NOT-FORWARD-trace.txt` holds, so a
 *    timestamp it cites is a timestamp a maintainer can grep for in the file the human still has.
 *    That is what makes **grounds** grounds (D11) rather than a figure with a citation shape.
 *  - **The answer is prose in an instructed shape, and the model never writes the debrief.**
 *    `./debrief-file.ts` owns the document: the header, the footer and the three refusals are the
 *    code's, and only the two blocks below are the model's. No structured output format — measured
 *    in this repository at ~1.7× the money and ~1.9× the time to return ZERO findings while
 *    reporting success, which `../server/agent-backend.ts` records and forbids — and no per-defect
 *    tool shim, which the same file forbids for the same reason.
 *  - **An answer that does not arrive in that shape is a failed judging call.** The shape is held
 *    by instruction, exactly as the bound is, so nothing but this check stands between a malformed
 *    answer and a debrief reading as a run with nothing wrong with it.
 *  - **A refused model is a named failure and nothing else.** No fallback, no second call on a bare
 *    alias, no option. D9's comparability is the whole reason: a debrief judged at a depth nobody
 *    can see is worse than one that says it was not judged, so a machine whose provider or account
 *    lacks the long-context window gets the facts-only debrief with the refusal named in it.
 *  - **Nothing here is configured.** The call authenticates from the environment the observer
 *    inherited (D27) and reads no environment file of its own — the review's is the review's, and
 *    `../../../docs/specs/run-observation/spec.md`'s what-must-not-regress keeps it that way.
 *    Contention with the run is not managed either (D28): no back-off, no deferral, and no
 *    detection of what kind of credential is in hand.
 *
 * **The classification of a success that is really a failure is the review's, re-implemented rather
 * than imported.** `hooks/install-mcp-server.sh` publishes `server/` and `observer/` as two
 * independent trees, so an import across them would make observation depend on a tree published by
 * a different process — `./records.ts` re-implements `e2e-tests`' token rule for the same shape of
 * reason. What is reused is the classification itself: the four failures below are the ones the
 * review measured, anchored where it anchors them, and a fifth is not invented here.
 */
import { readdir } from "node:fs/promises";
import { installedDirectory } from "./plugin-commit.ts";
import { NO_TOKENS } from "./records.ts";
import { renderTrace } from "./trace-file.ts";
import { formatDuration, type Trace } from "./trace.ts";
import type { RunFacts } from "./run-facts.ts";
import {
  NOTHING_JUDGES_YET,
  type Judging,
  type JudgedTree,
  type ObservationCost,
} from "./debrief-file.ts";

/* ──────────────────────────────── the model, and its bounds ──────────────────────────────── */

/**
 * The model the one synthesis runs on (D9).
 *
 * **An alias, never a pinned id**, for the reason the review's own `code_review_model` option
 * already records: an alias resolves against whatever provider the environment authenticates to,
 * where a pinned id only means the same thing on the provider it came from. The `[1m]` suffix
 * carries no such portability — it selects a long-context beta, measured on one provider, accepted
 * on the opus and sonnet aliases and refused outright on haiku — and it is here because this call
 * holds a whole run: a delivery's trace is capped at 600,000 characters, which is roughly a
 * quarter of that window and past a bare alias's outright.
 *
 * **Where it is refused, the debrief says so and carries no defects.** That is the whole of the
 * handling: no fallback to a bare alias, no second call, and no option to change it (D9 keeps
 * depth out of the owner's hands, so debriefs stay comparable across a team).
 */
export const SYNTHESIS_MODEL = "opus[1m]";

/**
 * Reasoning depth, as the SDK's own option rather than as prompt text.
 *
 * This is where the review's effort tier had to go and this one does not: the review reaches its
 * model through a slash command whose depth is an argument, and this call reaches the SDK
 * directly. `high` is the review's own shipped default, and it is stated rather than left to
 * whatever the SDK's default becomes.
 */
export const SYNTHESIS_EFFORT = "high";

/**
 * How long the synthesis gets before it is stopped and reported as a failure.
 *
 * **Bounded so that a call that wedges ends as a named failure rather than as spend nobody asked
 * for**, beside a delivery that may run for a day — one on this machine ran 29h36m. Generous
 * against what it is: the largest trace measured is 573 KB and one reading of it plus a walk
 * through the installed tree is minutes, not tens of them.
 *
 * Nothing about this bound reaches the run. The observer is a detached process outside it, and the
 * only thing a stopped synthesis costs is this section of one debrief.
 */
const SYNTHESIS_DEADLINE_MS = bound("DELIVERER_OBSERVER_JUDGE_MS", 30 * 60_000);

/**
 * How many turns the synthesis may take. The second half of the bound above: a call that loops
 * reading files rather than hanging is stopped by this one, and the wall clock never sees it.
 */
const MOST_TURNS = 60;

/** Overridable for the reason `./observer.ts`'s own bounds are, and told apart from a real `0`. */
function bound(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** The package the Agent SDK ships as, installed beside this source by the `SessionStart` hook. */
const AGENT_SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";

/**
 * The `query` this file needs, stated structurally rather than imported as a type.
 *
 * The SDK is loaded through a dynamic import, so nothing here carries a static dependency on it:
 * an observation on a host whose install has not finished must still produce a debrief saying what
 * was missing, and a static import would take the whole observer down instead.
 */
type QueryMessage = Record<string, unknown>;
type Query = (params: {
  prompt: string;
  options: Record<string, unknown>;
}) => AsyncIterable<QueryMessage>;

/* ───────────────────────────────── the shape of the answer ───────────────────────────────── */

/**
 * The two markers the answer is split on.
 *
 * Deliberately not markdown headings: the answer's own defects are headings, and the plugin's files
 * quoted inside them carry headings of their own. A marker that cannot occur inside a quotation is
 * what makes the split a split rather than a parse.
 */
export const DEFECTS_MARKER = "== DEFECTS ==";
export const HUNCHES_MARKER = "== HUNCHES ==";

/** How a section says it has nothing in it — checked as a prefix, so a reason may follow. */
const NOTHING_IN_SECTION = /^none\b/i;

/** One defect opens with this, and it is what a defect is counted by. */
const DEFECT_HEADING = /^### /gm;

/**
 * The answer with its fenced blocks taken out, which is the only text a defect is counted over.
 *
 * The plugin's own files are markdown and full of headings, and a defect quoting one of them in a
 * fence would otherwise be counted as a second defect — measured, on the first run judged. The
 * instruction asks for quotations inline or fenced for exactly this reason; stripping fences here
 * is what makes the count right rather than merely likely.
 */
function withoutFences(text: string): string {
  return text.replace(/^```[\s\S]*?^```/gm, "");
}

export type Answer =
  | {
      readonly kind: "read";
      readonly defects: string;
      readonly hunches: string;
      readonly count: number;
    }
  /** the answer did not arrive in the instructed shape, which is a failed call and never an empty
   *  defects section */
  | { readonly kind: "malformed"; readonly why: string };

/**
 * The answer, split into the two blocks the debrief places — or refused.
 *
 * **Every refusal here ends the judging call.** The shape is instructed, so an answer that ignores
 * it is an answer nothing can tell apart from a run with nothing wrong with it, and that is the one
 * outcome this epic must not produce. What is checked is only what the split needs: both markers,
 * in order, each section carrying either its own items or the word that says it has none.
 */
export function readAnswer(text: string): Answer {
  const defectsAt = text.indexOf(DEFECTS_MARKER);
  const hunchesAt = text.indexOf(HUNCHES_MARKER);
  if (defectsAt === -1 || hunchesAt === -1) {
    return {
      kind: "malformed",
      why:
        `the answer carries no \`${defectsAt === -1 ? DEFECTS_MARKER : HUNCHES_MARKER}\` line, so ` +
        `it did not come back in the instructed shape and nothing here can tell a run it found ` +
        `nothing wrong with from an answer about something else`,
    };
  }
  if (hunchesAt < defectsAt) {
    return {
      kind: "malformed",
      why: `the answer carries \`${HUNCHES_MARKER}\` before \`${DEFECTS_MARKER}\`, so the two ` +
        `sections cannot be told apart`,
    };
  }
  const defects = text.slice(defectsAt + DEFECTS_MARKER.length, hunchesAt).trim();
  const hunches = text.slice(hunchesAt + HUNCHES_MARKER.length).trim();
  if (defects === "" || hunches === "") {
    return {
      kind: "malformed",
      why: `the answer's ${defects === "" ? "defects" : "hunches"} section is empty, where the ` +
        `shape asks for either its items or the word saying it has none`,
    };
  }
  const empty = NOTHING_IN_SECTION.test(defects);
  const counted = withoutFences(defects).match(DEFECT_HEADING) ?? [];
  if (!empty && counted.length === 0) {
    return {
      kind: "malformed",
      why:
        `the answer's defects section neither opens with "none" nor carries a single \`### \` ` +
        `heading, so there is no way to tell how many defects it means to be naming`,
    };
  }
  return { kind: "read", defects, hunches, count: empty ? 0 : counted.length };
}

/* ────────────────────────────────────── the instruction ────────────────────────────────────── */

/**
 * What the synthesis is told, and the whole of what holds ADR-0018's bound.
 *
 * **There is no mechanical redaction and no second reader.** The trace this prompt carries holds
 * whatever the run touched — the repository's contents and the human's own words among them — and
 * what keeps those out of the debrief is this text and nothing else. ADR-0018 records that as an
 * accepted risk and names the failure mode: a debrief that quotes what it should not while saying
 * on its face that it is safe to forward. The instruction is therefore written to separate the two
 * things the trace puts side by side — the plugin's own files, which may be quoted, and the
 * repository's content, which may not — rather than to forbid a list of things.
 */
function synthesisPrompt(input: {
  readonly trace: Trace;
  readonly facts: RunFacts;
  readonly tree: JudgedTree;
  readonly traceText: string;
}): string {
  const { trace, facts, tree } = input;
  const skill = trace.skills.join(", ") || facts.extent.command || "a deliverer run";
  return `You are observing one finished run of the **deliverer** plugin — a Claude Code plugin that
carries one feature from a rough idea to a change request a human can merge. You took no part in the
run. You are reading what the host wrote down while it happened, and you are writing the part of that
run's **debrief** that says what the run cost its human that it did not have to.

The human who started the run forwards that debrief, **without reading it**, to whoever maintains the
plugin. Everything below follows from those two words.

# The run you are reading

- skill: \`${skill}\`
- epic slug: \`${trace.slug}\`
- wall clock: ${formatDuration(facts.extent.durationMs)}, ${facts.extent.startedAt ?? "unknown"} to ${facts.extent.endedAt ?? "unknown"}
- dispatches: ${facts.dispatches.length}
- review rounds: ${facts.rounds.length}${facts.rounds.length === 0 ? "" : ` — ${facts.rounds.map((it) => it.status ?? "no status ever reported").join(", ")}`}
- how it ended: ${facts.ending.kind}${facts.ending.stage === undefined ? "" : ` in \`${facts.ending.stage}\``}
- question rounds put to the human: ${facts.human.questionRounds}, and ${formatDuration(facts.human.totalWaitMs)} of the run spent waiting on them

Those figures are already in the debrief, worked out by code. **Use them; never restate them as a
finding of your own, and never recompute one.** A figure you disagree with is worth a hunch, not a
correction.

# What you are looking for

A **defect** is one thing this run cost its human that it did not have to. The glossary's own
illustrations: a question nobody needed to answer, a stage that ran twice, a dispatch that lost
context it was holding, spend nothing came back for. **Those are illustrations and not a list** —
report what you noticed, including the thing no rubric anticipated. That openness is the point of
having you read the whole run rather than a checklist.

The run may have worked perfectly. Three of this plugin's own specs were written from runs that
delivered exactly what was asked for; the defects were what the machinery underneath cost on the way.
A defect is the gap between what this run cost and what it had to cost.

**Four things are not defects here:**

- **The work the run delivered.** Whether the code, the spec or the tickets are any good is a review
  finding and somebody else's job. You are reading the plugin's conduct.
- **The judgement of the agents.** An orchestrator that reasoned well inside a contract that did not
  bind is a defect in the contract. Say so about the file, not about the reasoning.
- **A feature the plugin does not have.** "It should also do X" is a proposal at best, and usually
  nothing.
- **Anything you cannot ground.** That is a hunch, and there is a section for it below.

**Cross-stage is where the best ones are.** A judge holding one stage cannot see that the same
question was asked in two rounds, that a stage was dispatched cold when it could have been continued,
or that a fix wave undid what an earlier one did. You are holding the whole run in one reading, which
is the only place those are visible.

# Grounds

**Grounds are what a maintainer holding this run's trace can find in it.** They have that file; they
do not have the repository, the forge, or you. So cite the trace the way the trace is written: a
timestamp (\`[19:15:56.069]\`), a dispatch by its number and agent (\`#7 deliverer:comments-addresser\`),
a question round by its number, a poll, a turn. Quote the short line you are pointing at.

The strongest defect quotes **both sides of the mismatch**: what the run did, from the trace, and the
line of the plugin it was supposed to follow, from the tree below. That gap is the defect, and it is
what makes the report actionable rather than a complaint.

**A count, a duration or a spend figure beats an adjective**, every time. "Seven of twelve dispatches
signalled idle without delivering a report, costing 9m09s of recovery" is a defect. "The reporting is
unreliable" is not.

# What you may write, and what stays out

The debrief is bounded to the plugin's own machinery, and that bound is what lets it be forwarded
unread. **You are the only thing holding it.** Nothing downstream redacts anything, and no second
reader checks what you wrote before the human sends it.

**In bounds, and quotable freely:** the plugin's own files — every skill, every agent definition,
every line of its Node source, its hooks and its manifest, all of them in the tree named below. Its
skills, its agents, its dispatches, its stages, its timings, its **spend**, its **round**s and how
the run ended.

**The repository this run delivered into travels as shape and never as content.** Its code, its
diffs, its file names and paths, its spec and ticket prose, its commit messages and hashes, its
branch names, its comment text, anything from the forge — all of it stays in the trace. What you may
say about it is countable: how many tickets, how large a diff, how long a stage took over it, how
many comments a wave worked.

**Point at anything the run put into that repository by its place in the run**, which is the form
that is always both precise and in bounds: "the branch's first commit", "the sixth of eight
tickets", "a file the implementer had already written", "a diff too large for the round's model".
That form carries a timestamp with it, so it grounds better than a quotation would — the maintainer
finds the line in the trace either way, and this one is sendable.

**The run's own words split the same way, and this is the split that is easy to miss.** An agent's
sentence about the machinery — what it was told to do, what it decided to do next, what it reported
back about a stage — is the plugin's conduct, and quoting it is the whole point. The same agent's
sentence about the repository — a line it wrote into a spec, a ticket, a brief or a commit, or an
assertion about the code it was working on — is the repository's content wearing the plugin's voice.
**Say what the run did with it, in your own words, and give the timestamp.** "The brief carried the
sweep's measurement in the decision's grounds rather than in its claims" grounds a defect exactly as
well as the sentence would have, and it is sendable.

**The conversation between the run and its human travels as shape too.** Count the question rounds,
time them, say which earlier round or **sweep** had already covered the same ground, and name the
subject in as few words as it takes to show two rounds are the same ground. **Quote neither the
questions nor the answers.** The human's answers are their own product decisions, and a question the
plugin generated out of somebody's idea carries their domain inside it — so quoting the plugin's own
output there discloses the user by the other door.

The epic's slug is the one thing of the user's own domain that this document carries, and the header
already carries it.

**The trap this is written against:** the obvious way to make any defect clearer is to paste in more
context, and the context nearest to hand is the repository's. A defect made clearer that way is not
clearer. It is unsendable, and the human who was told this file is safe to forward will not be told
otherwise.

# The plugin, as this run ran it

You are standing in \`${tree.directory}\`. ${tree.source === "the run's own"
    ? "That is the installed tree this run actually ran, named by the run's own records."
    : "**That is not the tree this run ran** — the tree the run ran is gone from this machine, or its records never named one, so this is what is installed there now. Say so beside any line you quote from it: a file that has changed since the run would make a quotation evidence about nothing."}

What is in it: \`skills/refine/SKILL.md\` and \`skills/build/SKILL.md\` (the two commands, and the
stages each run), \`agents/*.md\` (the seven agents a run dispatches — a dispatch's whole conduct is
one of these), \`mcp/\` (the tools server behind a **round**, and the plugin's other Node code),
\`hooks/\`, and
\`.claude-plugin/plugin.json\`. Read what you need of it. **Start with the skill this run ran**, and
open an agent's file whenever a dispatch behaved in a way you want to check against its contract.

Every defect names the file in that tree it is about. A defect that cannot name one is usually a
hunch.

# Proposals

Where the fix is obvious, say it — **marked as a proposal, and never in place of stating the
defect**. A marked proposal costs the maintainer nothing to ignore. An unmarked one pre-empts the
grilling that is supposed to happen at their end. Most defects have none, and that is the normal
case.

# Hunches

Anything you noticed that this trace cannot ground is a **hunch**: written down, in its own section,
marked apart from the defects, on exactly those terms. It is your nose rather than your evidence, and
saying so is what makes it worth keeping. A hunch that names what would ground it is worth twice one
that does not.

**Never promote a hunch to a defect by finding a number that is merely nearby.** The test is whether
a maintainer holding the trace can find the thing you cited, doing what you say it does.

# Answer in exactly this shape

Two sections, both present, in this order, each marker on a line of its own. Nothing before the first
marker and nothing after the last section. Wrap at 120 columns.

${DEFECTS_MARKER}

### One sentence naming what it cost, in the past tense

**What happened.** A short paragraph. The mechanism, and why the run survived it if it did.

**Grounds.** What in the trace shows it — timestamps, dispatch numbers, counts, durations — and the
line of the plugin it diverged from, quoted. **Quote inline with backticks, or inside a fenced
block** — the plugin's files are markdown, and a heading of theirs written bare would read as
another defect of yours.

**File.** \`the/path/inside/the/plugin\`

**Proposal.** Only where one is obvious. Leave the whole line out otherwise.

### The next one, same four parts

…

${HUNCHES_MARKER}

- **One sentence naming what you noticed** — why the trace cannot ground it, and what would.

## Two rules about that shape

- A section with nothing in it is the single word \`none\`, on its own line, and a sentence after it
  if you want one. **"none" in the defects section is a finding**: it says you read the whole run and
  it cost its human nothing it did not have to. Write it when it is true, and only then.
- There is no quota. A run with three real defects gets three. Every defect you write survives the
  grounds test above, or it moves to the hunches.

# The trace

This is the whole run in order, and it is byte for byte the file the human still has beside the
debrief. Everything you cite is findable in it.

${input.traceText}
`;
}

/* ─────────────────────────── a success that is really a failure ─────────────────────────── */

/**
 * The SDK's own not-logged-in answer, anchored to the START of the result.
 *
 * **The first of these four is exactly what an environment with no usable credential produces**, and
 * without this branch every debrief on such a machine would carry a login error where its defects
 * belong. The anchor is what keeps a synthesis whose own prose discusses a login defect from failing
 * its own call.
 */
const NOT_LOGGED_IN = /^\s*not logged in\b/i;

/** The other answers the SDK reports as a SUCCESS while the whole result is its own failure text. */
const SDK_FAILURES: readonly { readonly pattern: RegExp; readonly code: string }[] = [
  { pattern: /^\s*API Error:\s*Connection closed mid-response\b/i, code: "connection_lost" },
  { pattern: /^\s*Prompt is too long\b/i, code: "prompt_too_long" },
];

/** What the review says about a model that had no room for what it was handed. */
const NO_ROOM =
  `The whole trace goes into this call's prompt, so the synthesis needs a model with the room to ` +
  `hold it: \`${SYNTHESIS_MODEL}\` is the long-context alias asked for. Where the provider or the ` +
  `account behind this machine's credentials does not offer that window, no debrief on it carries ` +
  `defects — the observation is deliberately not configurable, so there is nothing to set.`;

/** The failure a success-shaped result is really carrying, or `undefined` for a real answer. */
function failureInText(text: string): { code: string; detail: string } | undefined {
  if (text.trim() === "") {
    return {
      code: "no_result",
      detail:
        "the synthesis was reported as successful, but its result carries no text at all, so " +
        "there is nothing to read as defects",
    };
  }
  if (NOT_LOGGED_IN.test(text)) {
    return {
      code: "not_logged_in",
      detail:
        `the synthesis ran but was NOT LOGGED IN, so nothing was judged — it answered: ` +
        `${text.trim().slice(0, 300)}. The observer authenticates with whatever the session it was ` +
        `started beside authenticates with, and it reads no credential file of its own: the ` +
        `plugin's code_review_claude_env_file names the identity the REVIEW runs as and stays the ` +
        `review's`,
    };
  }
  const self = SDK_FAILURES.find(({ pattern }) => pattern.test(text));
  if (self !== undefined) {
    return {
      code: self.code,
      detail:
        `the synthesis was reported as successful, but its result opens with the SDK's own ` +
        `failure text rather than with an answer, so nothing was judged — it answered: ` +
        `${text.trim().slice(0, 300)}` + (self.code === "prompt_too_long" ? `. ${NO_ROOM}` : ""),
    };
  }
  return undefined;
}

/* ───────────────────────────── what the observation itself cost ───────────────────────────── */

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

/**
 * A counter nobody measured and a counter measured at zero are the same answer: unknown.
 * `CONTEXT.md` defines **spend** so that unknown is the honest answer for a figure nobody measured
 * and never zero.
 */
const measured = (count: number | undefined): number | undefined =>
  count === undefined || count === 0 ? undefined : count;

/** One token counter summed across every `modelUsage` entry, which is where a delegating call's
 *  tokens are — the same rule a **round**'s spend is read by, and the reason it sums rather than
 *  picking one entry: every model in that map is real spend. */
function summed(perModel: Record<string, unknown>, field: string): number | undefined {
  let total: number | undefined;
  for (const value of Object.values(perModel)) {
    const count = asNumber(asRecord(value)?.[field]);
    if (count === undefined) continue;
    total = (total ?? 0) + count;
  }
  return total;
}

/**
 * What the result message says this call spent.
 *
 * Read the way a **round**'s spend already is: the per-model usage whenever the message carries
 * any, and the aggregate counters otherwise, with the source chosen ONCE per message rather than
 * once per counter — mixing the two scopes into one row is a measured failure the review already
 * met. The dollar figure is the SDK's own, and it is the one real money figure a debrief holds:
 * ticket 03 found none for the run itself, because the host records no money anywhere.
 */
function costFromResult(message: QueryMessage, assistantTurns: number): ObservationCost {
  const perModel = asRecord(message.modelUsage) ?? {};
  const aggregate = asRecord(message.usage);
  const fromPerModel = Object.keys(perModel).length > 0;
  const counter = (perModelField: string, aggregateField: string): number =>
    (fromPerModel
      ? summed(perModel, perModelField)
      : asNumber(aggregate?.[aggregateField])) ?? 0;
  // A result carrying NEITHER shape measured nothing, and `TokenTotals` says that by counting no
  // requests — which is what makes the debrief's line read "no tokens reported" rather than four
  // confident zeros. Inside a shape that IS there, an absent field rides as 0, exactly as
  // `./records.ts` treats an absent counter on a request that happened.
  const nothingMeasured = !fromPerModel && aggregate === undefined;
  return {
    modelCalls: 1,
    tokens: nothingMeasured
      ? NO_TOKENS
      : {
          // The SDK reports turns, not API requests, and one turn is one request here: there is no
          // second reader and no sub-agent in this call. `num_turns` reading zero is the review's
          // measured case, so the turns actually seen stand in — never a confident zero.
          requests: measured(asNumber(message.num_turns)) ?? assistantTurns,
          inputTokens: counter("inputTokens", "input_tokens"),
          outputTokens: counter("outputTokens", "output_tokens"),
          cacheWriteTokens: counter("cacheCreationInputTokens", "cache_creation_input_tokens"),
          cacheReadTokens: counter("cacheReadInputTokens", "cache_read_input_tokens"),
        },
    costUsd: measured(asNumber(message.total_cost_usd)),
  };
}

/** Which model actually served the call, off the per-model usage the result carries. */
function servedBy(message: QueryMessage): string | undefined {
  const perModel = asRecord(message.modelUsage) ?? {};
  const keys = Object.keys(perModel);
  return keys.length === 0 ? undefined : keys.join(", ");
}

/** What a call that never got as far as a result cost: nothing measurable, and never zero. */
const NOTHING_MEASURED: ObservationCost = { modelCalls: 1, tokens: NO_TOKENS, costUsd: undefined };

/* ──────────────────────────────── which tree is read ──────────────────────────────── */

/**
 * The installed tree the synthesis reads the plugin's own text out of.
 *
 * **The run's own directory first**, because a line quoted from the tree a run actually ran is
 * evidence about that run and the same line quoted from a later build is not. Every run on the
 * machine this was written against names its directory in the skill preamble the host writes into
 * its first entries — but only one commit's tree stands there, beside a marker naming it as in use,
 * so nothing promises the tree survived an update. Where it is gone the tree installed now is read
 * and the debrief says which it got, which is the same fallback ticket 03 reasoned to for the
 * commit and for the same reason.
 */
async function treeToJudge(
  facts: RunFacts,
  dataDirectory: string,
): Promise<JudgedTree | undefined> {
  const named = facts.pluginDirectoryInRecords;
  if (named !== undefined && (await isThere(named))) {
    return {
      directory: named,
      source: "the run's own",
      line:
        `the installed plugin tree this run actually ran, at \`${named}\` — the directory the ` +
        `run's own records name, so a line quoted below is the line that run read.`,
    };
  }
  const now = await installedDirectory(dataDirectory);
  if (now !== undefined && (await isThere(now))) {
    return {
      directory: now,
      source: "the plugin installed now",
      line:
        `\`${now}\` — **not the tree this run ran.** ` +
        (named === undefined
          ? `This run's records name no plugin directory, which is what a run resumed by prose ` +
            `rather than by a \`/deliverer:\` command leaves. `
          : `The tree they name, \`${named}\`, is no longer on that machine — a plugin update ` +
            `replaces it. `) +
        `What was read instead is the plugin installed there at the moment this debrief was ` +
        `written, so a line quoted below may have changed since the run.`,
    };
  }
  return undefined;
}

async function isThere(directory: string): Promise<boolean> {
  try {
    await readdir(directory);
    return true;
  } catch {
    return false;
  }
}

/* ────────────────────────────────────── the call ────────────────────────────────────── */

export interface SynthesisInput {
  readonly trace: Trace;
  readonly facts: RunFacts;
  readonly dataDirectory: string;
}

/**
 * One run, read once, judged once.
 *
 * **It never throws.** Every path out is a `Judging`, because the two callers — a detached observer
 * whose exceptions nobody would ever see, and a replay a contributor is watching — both need the
 * debrief written either way. A judging that fell over leaves ticket 03's facts-only debrief with
 * the reason named in it (D29), and a partial judgement is never presented as a complete one.
 */
export async function synthesise(input: SynthesisInput): Promise<Judging> {
  const tree = await treeToJudge(input.facts, input.dataDirectory);
  if (tree === undefined) {
    return failed(
      `no installed plugin tree could be found to judge this run against — neither the directory ` +
        `the run's own records name nor the one the host's install bookkeeping points at is on ` +
        `this machine. Every defect names a file in the plugin, so a reading with no plugin to ` +
        `read is not one`,
      { modelCalls: 0, tokens: NO_TOKENS, costUsd: 0 },
    );
  }

  let query: Query;
  try {
    ({ query } = (await import(AGENT_SDK_PACKAGE)) as { query: Query });
  } catch (error) {
    return failed(
      `the Agent SDK (${AGENT_SDK_PACKAGE}) could not be loaded, so nothing judged this run: ` +
        `${errorText(error)}. The plugin's SessionStart install hook installs it beside the ` +
        `observer's own source; a later run is judged as usual once that has succeeded`,
      { modelCalls: 0, tokens: NO_TOKENS, costUsd: 0 },
    );
  }

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort("deadline"), SYNTHESIS_DEADLINE_MS);
  let assistantTurns = 0;
  let result: QueryMessage | undefined;
  try {
    for await (const message of query({
      prompt: synthesisPrompt({
        trace: input.trace,
        facts: input.facts,
        tree,
        // The trace as its FILE, so a timestamp cited in a defect is a timestamp a maintainer can
        // find in the copy the human still has. Rendering it a second way here would make grounds
        // point at something nobody holds.
        traceText: renderTrace(input.trace),
      }),
      options: {
        model: SYNTHESIS_MODEL,
        effort: SYNTHESIS_EFFORT,
        // D3's standing, as an option: the reading happens inside the installed plugin's own tree,
        // which is outside every repository. It is what lets the synthesis open an agent's file for
        // itself and quote the line a dispatch diverged from.
        cwd: tree.directory,
        // D4: unrestricted, and recorded rather than accidental. No denied-tool list and no
        // pre-tool guard, consistent with the review backend and ADR-0006. The protection is where
        // this stands and not what it is forbidden.
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        // The whole of what keeps the delivery repository's own conventions out of the
        // observation. The SDK loads every settings source when told nothing, and it is the
        // PROJECT source that carries a `CLAUDE.md` — so a repository's instructions and hooks
        // would walk into this reading through a door ADR-0018 never looked at. The user's own
        // settings stay, because an owner whose credentials live there still has to authenticate.
        settingSources: ["user"],
        maxTurns: MOST_TURNS,
        abortController: controller,
      },
    })) {
      if (message.type === "assistant") assistantTurns += 1;
      if (message.type === "result") {
        result = message;
        break;
      }
    }
  } catch (error) {
    clearTimeout(deadline);
    return failed(
      controller.signal.aborted
        ? `the synthesis was still going after ${formatDuration(SYNTHESIS_DEADLINE_MS)} and was ` +
          `stopped, so this run was not judged. Nothing about that bound reached the run itself`
        : `the synthesis failed: ${errorText(error)}`,
      NOTHING_MEASURED,
    );
  }
  clearTimeout(deadline);

  if (result === undefined) {
    return failed(
      "the synthesis ended without ever reporting a result, so nothing judged this run",
      NOTHING_MEASURED,
    );
  }
  const cost = costFromResult(result, assistantTurns);
  if (result.subtype !== "success") {
    const errors = Array.isArray(result.errors) ? result.errors.map(String).join("; ") : "";
    return failed(
      `the synthesis ended as ${String(result.subtype)}${errors === "" ? "" : `: ${errors}`}, so ` +
        `nothing judged this run. A model or a long-context window the provider behind this ` +
        `machine's credentials refuses is reported here and nowhere else: there is no second call ` +
        `on a bare alias and no option to change the model, so that every debrief a team produces ` +
        `was judged at the same depth`,
      cost,
    );
  }
  // A non-string result narrows to the empty string, which `failureInText` reads as the review
  // reads it: a call reported successful whose whole deliverable is absent is a failed call.
  const text = typeof result.result === "string" ? result.result : "";

  const carried = failureInText(text);
  if (carried !== undefined) return failed(`${carried.code}: ${carried.detail}`, cost);

  const answer = readAnswer(text);
  if (answer.kind === "malformed") {
    return failed(
      `the synthesis answered, but ${answer.why}. Its answer is held to a shape by instruction ` +
        `alone, so an answer that ignores it is reported as a failure rather than shown — a ` +
        `malformed answer reading as a run with nothing wrong with it is the one outcome this must ` +
        `not produce`,
      cost,
    );
  }

  return {
    kind: "judged",
    defects: answer.defects,
    hunches: answer.hunches,
    defectCount: answer.count,
    model: SYNTHESIS_MODEL,
    servedBy: servedBy(result),
    judgedAgainst: tree,
    cost,
  };
}

/**
 * D17's answer, with the reason named — the shape every failure above lands in.
 *
 * The debrief keeps its header and every figure the code worked out, and says on its face what
 * stopped the judging. A diagnostic nobody can tell has stopped working is worse than one that is
 * plainly absent (D29).
 */
function failed(reason: string, cost: ObservationCost): Judging {
  return {
    kind: "none",
    reason:
      `The one synthesis this run's debrief rests on did not produce an answer, so what follows ` +
      `is the run's own facts and nothing that read them: ${reason}.`,
    cost,
  };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/* ────────────────────────────── the judge the observer holds ────────────────────────────── */

/**
 * The synthesis as a judge: asked on every rewrite, and answering with a model exactly once.
 *
 * **One synthesis per run, held literally.** The live **observer** rewrites a debrief as each stage
 * lands (D23) and asks its judge every time, so without this the same run would be read — and paid
 * for — several times over. Before the one reading, the answer is `NOTHING_JUDGES_YET`: "nothing
 * has judged this yet" and "nothing was found" are different claims about the same file, and only
 * the second is a finding.
 *
 * **A failed synthesis is remembered too.** A refused model, a malformed answer or a stopped call
 * is a named failure and nothing else — no second call, which is what makes the failure the
 * debrief's whole answer rather than a retry loop spending on a machine that cannot judge at all.
 *
 * A run that was finalised on the idle bound, resumed, and finalised again keeps the answer it
 * already has. D23 makes that bound a guess whose cost is a label rather than content, and paying
 * for a second whole-run reading is not a cost a guess may impose.
 */
export function synthesisJudge(
  dataDirectory: string,
): (input: { trace: Trace; facts: RunFacts; finalising: boolean }) => Promise<Judging> {
  let made: Judging | undefined;
  return async (input) => {
    if (made !== undefined) return made;
    if (!input.finalising) return NOTHING_JUDGES_YET;
    made = await synthesise({ trace: input.trace, facts: input.facts, dataDirectory });
    return made;
  };
}
