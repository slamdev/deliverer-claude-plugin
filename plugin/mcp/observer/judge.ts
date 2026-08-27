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
 * reason. What is reused is the classification itself: the four failures are the ones the review
 * measured, anchored where it anchors them, and a fifth is not invented. They sit in
 * `./model-call.ts`, which is where they moved when ticket 06 gave them a second caller.
 *
 * **Every **dispatch note** this run has is read here too** (run-observation ticket 06). The trace
 * carries a dispatch's shape and the notes carry its inside, and the bound below has to hold over
 * both: ADR-0018 says so, and says that the cheapest calls the observation makes are the ones that
 * saw the most of somebody's repository.
 */
import { readdir } from "node:fs/promises";
import { earlierDebriefs, type Continuity, type ContinuitySummary } from "./continuity.ts";
import { installedDirectory } from "./plugin-commit.ts";
import { renderTrace } from "./trace-file.ts";
import { formatDuration, type Trace } from "./trace.ts";
import type { RunFacts } from "./run-facts.ts";
import {
  addCosts,
  bound,
  costFromResult,
  errorText,
  failureInText,
  loadQuery,
  NOTHING_MEASURED,
  NOTHING_SPENT,
  servedBy,
  type Query,
  type QueryMessage,
} from "./model-call.ts";
import { runNotes } from "./notes.ts";
import {
  NOTHING_JUDGES_YET,
  type Judging,
  type JudgedTree,
  type NotesSummary,
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
 *
 * **One item in it was measured in rather than reasoned to.** Ticket 06's paid verification judged
 * a refinement whose stages researched a third-party toolchain, and the debrief that came back
 * quoted a stage's own sentence naming two products the delivery repository builds on — an
 * assertion about the technology, which this text already called the repository's content wearing
 * the plugin's voice, and which a reader can nonetheless read as the plugin's conduct. So the names
 * of tools, packages, services and companies are now refused by name, the way `./notes.ts`'s own
 * bound refuses them: what a category rule leaves to judgement, a named rule does not.
 */
function synthesisPrompt(input: {
  readonly trace: Trace;
  readonly facts: RunFacts;
  readonly tree: JudgedTree;
  readonly traceText: string;
  readonly notesText: string | undefined;
  readonly earlier: Continuity;
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

**Cross-RUN is the other place, and the earlier debriefs below are the only reading of it.** An epic
takes several runs and a defect may exist only across two of them — a stage this run dispatched again
although an earlier run had finished it, a question asked in one run and asked again in this one, a
cost the epic paid twice. Nothing but you holds both accounts at once.

**Inside a dispatch is the other place, and the notes are the only reading of it.** The trace below
carries every dispatch's shape and a capped excerpt of what each of its entries held; what happened
in there — where an agent went round in circles, what it had to go and find because its brief did not
carry it, what it reported against what it actually did — is in the dispatch notes. Read them as
evidence about the run, not as conclusions: a note is a cheap reading of one stage, and it is your
job to decide what it amounts to.

# Grounds

**Grounds are what a maintainer holding this run's files can find in them.** There are three such
files and they are **equal grounds**: this run's trace, this run's dispatch notes, and the earlier
debriefs of this epic — all three below. A defect resting on a note, or on an earlier debrief, is as
well grounded as one resting on the trace. The only test is whether whoever holds that file finds
what you cited, doing what you say it does. What they do not have is the repository, the forge, or
you.

Cite each of the three the way it is written:

- **the trace** — a timestamp (\`[19:15:56.069]\`), a dispatch by its number and agent
  (\`#7 deliverer:comments-addresser\`), a question round by its number, a poll, a turn. Quote the
  short line you are pointing at.
- **a dispatch note** — name the dispatch it is about, the way the note's own heading names it, and
  say what the note reports. A note is the only reading there is of what happened INSIDE a stage, so
  a defect about a dispatch's interior rests on its note and needs nothing from the trace to stand.
- **an earlier debrief of this epic** — name the file it is, and the defect inside it, and name the
  run the way that debrief is keyed: the skill that ran and that run's own timestamp. It is on the
  same disk as the trace, so it is as locatable.

Where a run diverged from something the plugin told it to do, quote **both sides of the mismatch**:
what the run did — from whichever of the three shows it — and the line of the plugin it was supposed
to follow, from the tree below. That gap is the defect, and it is what makes the report actionable
rather than a complaint. Plenty of defects have no plugin line to quote against; they still name the
file the behaviour belongs to, and they are not lesser for it.

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
branch names, its comment text, anything from the forge — all of it stays in the trace and in the
notes. **And so does the name of every tool, package, library, service, product and company it
uses** — including the ones you recognise, and including the forge, the cloud, the language and
anything a stage was researching. Which technologies somebody builds on is their business and
nothing about the plugin's conduct needs it: "a third-party tool the run had to establish a fact
about" grounds a defect exactly as well as the tool's name would. What you may say about any of it is
countable: how many tickets, how large a diff, how long a stage took over it, how many comments a
wave worked.

**The notes are bounded by nothing, exactly as the trace is.** Each was written by a cheap reading of
one dispatch's own record — a dispatch's interior, which is where that repository's contents are
densest — and each was told this same bound. None of them was checked, and a note that broke it hands
you the repository's content in the plugin's voice. Treat every word of a note as you treat the
trace: a source you may read and may not copy out.

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

# The earlier debriefs of this epic

${earlierSection(input.earlier)}

# The dispatch notes

${input.notesText === undefined
      ? `There are none. Nothing read the inside of any dispatch of this run, so the trace's own ` +
        `lines are all you have of what happened in the stages. Say so where a defect would have ` +
        `needed one.`
      : `One per dispatch, written as that dispatch finished, each by a cheap reading of that
dispatch's own record and nothing else. This is byte for byte the file the human has beside the
debrief. A dispatch whose note failed says so in place of its note, and a note is a reading and not a
finding.

${input.notesText}`}

# The trace

This is the whole run in order, and it is byte for byte the file the human still has beside the
debrief. Everything you cite is findable in it.

${input.traceText}
`;
}

/**
 * The prompt's account of the earlier **debrief**s of this **epic** (run-observation ticket 07; D21).
 *
 * **Its own section, and the whole of what the synthesis is told about continuity.** The three states
 * `./continuity.ts` reports go in whether anything was read or not: a run with nothing before it is
 * told that in a sentence, because an epic's first run and an epic whose earlier debriefs could not
 * be read are different situations and only one of them is worth remarking on.
 *
 * The rules under it are the ones a whole-run reading cannot infer for itself: a repeat defect is
 * named again rather than suppressed, a cross-run defect says which runs it spans and whether they
 * ran a different plugin commit, and each debrief still stands alone for forwarding.
 */
function earlierSection(earlier: Continuity): string {
  const { read, unreadable, elsewhere, hole } = earlier.summary;
  const states = [
    read.length === 0
      ? `**None were read.** Nothing on this machine holds a debrief of an earlier run of this ` +
        `epic in this repository — this may be the epic's first run, or an earlier run's observer ` +
        `may never have started. Say nothing about earlier runs that this run's own files cannot ` +
        `ground.`
      : `**${read.length} of them, below, whole and oldest first.** Nothing was capped, sampled or ` +
        `summarised on the way in.`,
    unreadable.length === 0
      ? undefined
      : `**${unreadable.length} earlier run(s) of this epic have no debrief that could be read**, ` +
        `and are not below: ${unreadable.join("; ")}. ` +
        `That is a hole in the continuity and nothing more — the reading still stands on this ` +
        `run's own trace and notes.`,
    elsewhere === 0
      ? undefined
      : `${elsewhere} further debrief(s) under this epic's slug belong to a run in a DIFFERENT ` +
        `repository and were deliberately not read: one data directory holds every epic on the ` +
        `machine, and two epics of one name in two repositories are not one epic.`,
    hole === undefined ? undefined : `**Work of this epic preceded this run:** ${hole}`,
  ].filter((it) => it !== undefined);

  const rules =
    read.length === 0
      ? ""
      : `
## What these are, and what to do with them

- **They are the runs before this one, keyed by the skill that ran and that run's own timestamp.**
  Whichever skill wrote one — a refinement's debrief is an earlier debrief of a delivery, and a
  question asked in the refinement and asked again here is exactly what this exists to find.
- **Their traces and their notes are not here and are not to be asked for.** A debrief is a bounded
  document; an earlier run's trace and notes are neither bounded nor small. What an earlier debrief
  does not say about its run, you do not know about its run.
- **These are the one input to this reading that already carries the bound.** They were written to be
  forwarded, so quoting one is safe in a way that quoting the trace or a note is not. The rest of the
  bound above still holds over what you write.
- **A defect an earlier debrief already named, that this run shows too, is named AGAIN** — saying
  which earlier run reported it. Suppressing it would drop a live defect from the document actually
  being forwarded, and a defect that survived a run is worth more than one seen once.
- **A defect spanning two runs says which runs it spans**, the way their debriefs are keyed, and
  states in full what happened. Each debrief stands alone: the citation is where a maintainer may
  check it, never where the rest of it lives.
- **Where a run you span ran a different plugin commit, say so.** A defect assembled across a plugin
  update may be about a line that changed inside it.
- **An earlier defect is not evidence about this run.** An earlier debrief is a reading like yours,
  not a finding of fact — if this run does not show it, it is that run's defect and not this one's.
`;
  return `${states.join("\n\n")}\n${rules}${earlier.text === undefined ? "" : `\n${earlier.text}`}`;
}

/* ─────────────────────────── a success that is really a failure ─────────────────────────── */

/** What the review says about a model that had no room for what it was handed. */
const NO_ROOM =
  `The whole trace goes into this call's prompt, along with every dispatch note the run produced, ` +
  `so the synthesis needs a model with the room to hold them: \`${SYNTHESIS_MODEL}\` is the ` +
  `long-context alias asked for. Where the provider or the account behind this machine's ` +
  `credentials does not offer that window, no debrief on it carries defects — the observation is ` +
  `deliberately not configurable, so there is nothing to set.`;

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
  /**
   * This run's **dispatch note**s, already read off disk (run-observation ticket 06), or
   * `undefined` where none were written at all.
   *
   * Passed in rather than read here, because who wrote them decides which file they are in: the
   * live **observer** appends to the one it has been writing all run, and a replay writes a set of
   * its own beside whatever is already there (D19). `undefined` is a real answer — a machine that
   * cannot reach the cheap tier still gets a synthesis over the trace alone.
   *
   * **Only THIS run's.** An earlier run of the same **epic** contributes its **debrief** and
   * nothing else (ticket 07): a debrief is a bounded document, where an earlier run's notes are
   * neither bounded nor small.
   */
  readonly notes: string | undefined;
  /** what the notes half spent and what it could not write, carried onto the `Judging` */
  readonly notesCost?: ObservationCost;
  readonly notesSummary?: NotesSummary;
  /**
   * The earlier **debrief**s of this **epic**, already read off disk (ticket 07; D21), and what
   * continuity there was to be had.
   *
   * Passed in beside the notes for the same reason: what reached this reading is a fact about the
   * reading, and it is carried onto the `Judging` so the debrief can state it whether the call
   * succeeded, failed or was refused. `read` empty is a real answer and the ordinary one — an epic's
   * first run has nothing before it.
   *
   * **Only the earlier runs' debriefs.** Their traces and their notes are never read (ticket 06's
   * ground, extended), and this run's own debrief is excluded by its run key rather than by D23's
   * finalising flag.
   */
  readonly earlier: Continuity;
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
  // Every cost below is the notes' plus this call's, so the header's one figure covers the whole
  // observation at both tiers — up to thirteen cheap calls and one long-context reading (D8).
  const before = input.notesCost ?? NOTHING_SPENT;
  const notes = input.notesSummary;
  const failed = (reason: string, cost: ObservationCost): Judging =>
    notJudged(reason, addCosts(before, cost), notes, input.earlier.summary);

  const tree = await treeToJudge(input.facts, input.dataDirectory);
  if (tree === undefined) {
    return failed(
      `no installed plugin tree could be found to judge this run against — neither the directory ` +
        `the run's own records name nor the one the host's install bookkeeping points at is on ` +
        `this machine. Every defect names a file in the plugin, so a reading with no plugin to ` +
        `read is not one`,
      NOTHING_SPENT,
    );
  }

  const loaded = await loadQuery();
  if (loaded.kind === "missing") {
    return failed(`${loaded.why}, so nothing judged this run`, NOTHING_SPENT);
  }
  const query: Query = loaded.query;

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
        // The notes as their FILE too, and for the same reason: a defect grounded in a note has to
        // be findable in the copy the human still has beside the trace.
        notesText: input.notes,
        // And the earlier debriefs as THEIR files, whole: each is already a bounded document, so
        // there is nothing to distil out and nothing gained by summarising one (ticket 07).
        earlier: input.earlier,
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

  const carried = failureInText(text, "the synthesis", NO_ROOM);
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
    cost: addCosts(before, cost),
    notes,
    continuity: input.earlier.summary,
  };
}

/**
 * D17's answer, with the reason named — the shape every failure above lands in.
 *
 * The debrief keeps its header and every figure the code worked out, and says on its face what
 * stopped the judging. A diagnostic nobody can tell has stopped working is worse than one that is
 * plainly absent (D29).
 */
function notJudged(
  reason: string,
  cost: ObservationCost,
  notes: NotesSummary | undefined,
  // What continuity had been read by the time it failed, where the failure got that far (ticket 07).
  // A debrief that read two earlier runs and then could not be judged still read them, and saying so
  // is the difference between a diagnostic that degraded and one that lost the epic.
  continuity?: ContinuitySummary,
): Judging {
  return {
    kind: "none",
    reason:
      `The one synthesis this run's debrief rests on did not produce an answer, so what follows ` +
      `is the run's own facts and nothing that read them: ${reason}.`,
    cost,
    notes,
    continuity,
  };
}

/* ────────────────────────────── the judge the observer holds ────────────────────────────── */

/**
 * The whole judging half as one judge: **a note per dispatch as it lands, and one synthesis at the
 * end** (run-observation tickets 05 and 06).
 *
 * **One synthesis per run, held literally.** The live **observer** rewrites a debrief as each stage
 * lands (D23) and asks its judge every time, so without this the same run would be read — and paid
 * for — several times over. Before the one reading, the answer says nothing was judged yet:
 * "nothing has judged this yet" and "nothing was found" are different claims about the same file,
 * and only the second is a finding.
 *
 * **The notes are the other half of that same split.** Every rewrite catches the notes up with the
 * dispatches that have finished since the last one, so a note is written when its dispatch lands
 * rather than when the run ends — and each is written exactly once, however many rewrites follow
 * it. Those calls have already been paid for by the time a mid-run debrief is written, so the
 * answer before the synthesis carries their cost rather than a zero.
 *
 * **A failed synthesis is remembered too.** A refused model, a malformed answer or a stopped call
 * is a named failure and nothing else — no second call, which is what makes the failure the
 * debrief's whole answer rather than a retry loop spending on a machine that cannot judge at all.
 *
 * A run that was finalised on the idle bound, resumed, and finalised again keeps the answer it
 * already has, and writes no further notes. D23 makes that bound a guess whose cost is a label
 * rather than content, and paying for a second whole-run reading is not a cost a guess may impose —
 * and a note written after the synthesis has read them all is a note nothing would ever read.
 *
 * `beside` is the notes file's placement and the caller's to choose, exactly as the debrief
 * writer's two forms are: a **replay** writes a set beside whatever is there (D19), and the live
 * observer comes back to its own.
 */
export function synthesisJudge(
  dataDirectory: string,
  how: { readonly beside: boolean },
): (input: { trace: Trace; facts: RunFacts; finalising: boolean }) => Promise<Judging> {
  const notes = runNotes(dataDirectory, how);
  let made: Judging | undefined;
  return async (input) => {
    if (made !== undefined) return made;
    // The run's OWN dispatches and never the session's, which is the set `./run-facts.ts` already
    // bounds: a dispatch some later work in the same session made is not this run's to read.
    //
    // **Caught here because what spends must be what reports.** `./notes.ts` turns every failure it
    // can foresee into a missing note; a throw past all of those would reach
    // `./observer.ts`'s `judgeQuietly`, which knows nothing of the notes and would answer with a
    // cost of no calls and no dollars — so up to thirteen cheap calls already paid for would read
    // as `$0.00` in the one line that exists to say what the observation cost, which is the one
    // reading `CONTEXT.md`'s definition of **spend** forbids. Named as a loss of this half instead,
    // and the run is still judged on whatever notes did land.
    try {
      await notes.catchUp({
        trace: input.trace,
        dispatches: input.facts.dispatches,
        finalising: input.finalising,
      });
    } catch (error) {
      notes.lost(
        `the notes half of this observation failed where nothing expected it to, so some of this ` +
          `run's dispatches have no note: ${errorText(error)}`,
      );
    }
    if (!input.finalising) return stillWatching(notes.cost(), notes.summary());
    // Read here rather than inside `synthesise`, and read ONCE at the finalise: the earlier debriefs
    // are a whole-run reading by construction (they reach the one synthesis and no dispatch note),
    // and a listing done on every mid-run rewrite would be a listing nothing reads. It never throws
    // — a listing that fails is a state of the continuity, not of the observation (ticket 07; D29).
    const earlier = await earlierDebriefs({
      trace: input.trace,
      facts: input.facts,
      dataDirectory,
    });
    try {
      made = await synthesise({
        trace: input.trace,
        facts: input.facts,
        dataDirectory,
        notes: await notes.text(),
        notesCost: notes.cost(),
        notesSummary: notes.summary(),
        earlier,
      });
    } catch (error) {
      // `synthesise` answers rather than throws for every failure it can foresee, so this is the
      // one it cannot: a throw from somewhere none was expected. Held as this run's answer like any
      // other, both because the notes' own spend has to survive it and because a second whole-run
      // reading is not something a surprise may buy.
      made = notJudged(
        `it failed where nothing expected it to and nothing of its own spend was measured: ` +
          `${errorText(error)}`,
        notes.cost(),
        notes.summary(),
        earlier.summary,
      );
    }
    return made;
  };
}

/**
 * What a debrief says while its run is still going.
 *
 * `NOTHING_JUDGES_YET` verbatim until a note has been written, so a debrief of a run that has
 * dispatched nothing yet reads exactly as ticket 04 left it. Once notes exist the same claim
 * carries what they cost: a header reading nothing where thirteen cheap calls have already been
 * made would be the one thing the observation's own cost line exists to prevent.
 */
function stillWatching(cost: ObservationCost, notes: NotesSummary): Judging {
  if (cost.modelCalls === 0 && notes.attempted === 0) return NOTHING_JUDGES_YET;
  return {
    kind: "none",
    reason:
      `${NOTHING_JUDGES_YET.reason} ${notes.written} of this run's ${notes.attempted} finished ` +
      `dispatches carry a dispatch note already, each written as that dispatch landed, and the ` +
      `synthesis reads those as well as the trace.`,
    cost,
    notes,
  };
}
