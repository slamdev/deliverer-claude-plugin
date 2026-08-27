/**
 * The earlier **debrief**s of this **epic**, read for the one synthesis (run-observation ticket 07;
 * D21, with D11's grounds rule, D19's never-removed rule, D23's finalising flag, D29's honest
 * degradation and ADR-0018 holding the bound).
 *
 * **An epic takes more than one run.** Runs are interruptible by design and one measured delivery
 * ran 29h36m, so a defect that exists only across two runs — a stage the resumed run dispatched
 * again although an earlier one had finished it, a question asked in two different runs — is
 * findable nowhere else. The debriefs are already in the same directory, so continuity costs one
 * directory listing.
 *
 * Five things here are load-bearing, and each is easy to undo by accident:
 *
 *  - **Only the same repository's.** There is one data directory per machine and per plugin, and
 *    ticket 02 keys what lands in it by the **slug** alone — so two epics of one name in two
 *    repositories share one roof and would otherwise read each other. That is not a missing defect
 *    but a false one arriving with **grounds** attached, which is worse than a debrief saying it
 *    lost the run before it (D29). The **identity file** beside each debrief is what the match is
 *    made on, and a debrief with no readable one is not read.
 *  - **The run's own debrief is excluded by its run key**, never by the finalising flag: D23 has the
 *    live observer rewriting it from the first stage onwards, so it is in the listing throughout.
 *  - **One debrief per earlier run, the newest of each.** A replay writes BESIDE an existing debrief
 *    rather than over it (D19), so a run replayed twice leaves two debriefs of itself — and
 *    re-replaying a debrief they doubt is precisely what a maintainer does. Without this the
 *    synthesis reads one run twice and names it as two.
 *  - **Whole, all of them, oldest first.** A debrief is prose written to be pasted into an issue and
 *    the most any epic on disk has taken is three runs, so nothing is capped, sampled or summarised
 *    on the way in — the cap the trace needs (D6) buys nothing here.
 *  - **An earlier run's trace and its notes are never read.** Ticket 06 refused an earlier run's
 *    notes as neither bounded nor small, and a trace is refused on the same ground. An earlier
 *    debrief is the one input to the synthesis that already carries ADR-0018's bound, where the
 *    trace and every note do not — which is also why a defect may cite it as grounds.
 *
 * Nothing here writes, renames or removes anything. The reading is one listing and the files it
 * names (D19).
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { debriefNames, identityOrdinal, isDebriefName, parseIdentity } from "./debrief-file.ts";
import { OBSERVATIONS_DIRECTORY, observationDirectory } from "./trace-file.ts";
import type { RunFacts } from "./run-facts.ts";
import type { Trace } from "./trace.ts";

/* ──────────────────────────────── what continuity there was ──────────────────────────────── */

/**
 * What continuity this debrief had, as the document states it: **three states kept apart**
 * (ticket 07).
 *
 * They are three different claims about the same epic and running them together is what this shape
 * prevents. `read` empty is a number rather than silence — a first run says so — `unreadable` is
 * what a later debrief lost and D29 puts where a human meets it, and `hole` is the third state the
 * ticket's triage found: the first delivery on disk opened its task list at 16 of 18 tickets
 * already done, so work no record on that machine holds preceded it, and "no earlier debriefs"
 * would otherwise be indistinguishable from a first run.
 */
export interface ContinuitySummary {
  /** one line per earlier debrief read, oldest first, already in the reader's words */
  readonly read: readonly string[];
  /** the ones under this slug that could not be read, and why, in a reader's words */
  readonly unreadable: readonly string[];
  /**
   * How many debriefs under this slug are another repository's run, and were therefore not read.
   *
   * Not a loss and not a defect: they are a different epic that happens to share a name. Stated
   * because a maintainer holding the directory sees them there, and a count of zero read beside two
   * directories on disk would otherwise read as a failure.
   */
  readonly elsewhere: number;
  /** where this run's own trace shows it resumed work no earlier debrief covers */
  readonly hole: string | undefined;
}

export interface Continuity {
  /**
   * The earlier debriefs as one document, as the synthesis reads them, or `undefined` where none
   * were read at all — which is a real answer and the normal one for a first run.
   */
  readonly text: string | undefined;
  readonly summary: ContinuitySummary;
}

/** What a run with nothing before it has, and what a failed listing degrades to. */
function nothingRead(unreadable: readonly string[], hole: string | undefined): Continuity {
  return { text: undefined, summary: { read: [], unreadable, elsewhere: 0, hole } };
}

/** A path that is simply not there — the ordinary answer for an epic's first run. */
function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "ENOENT"
  );
}

/* ─────────────────────────────────── one earlier debrief ─────────────────────────────────── */

/** One earlier run's newest debrief, with what its identity file says about that run. */
interface EarlierDebrief {
  /** the run's own first timestamp, off its identity file — how the debriefs are keyed */
  readonly startedAt: string;
  readonly skill: string;
  readonly commit: string;
  readonly finalised: boolean;
  /** the file it is, so a maintainer holding this epic's directory opens the same one */
  readonly file: string;
  /** how many debriefs of that one run are on disk, of which this is the newest */
  readonly held: number;
  readonly text: string;
}

/* ────────────────────────────────────── the reading ────────────────────────────────────── */

/**
 * Every earlier debrief for this run's slug, in this run's repository, oldest first.
 *
 * **It never throws.** Continuity is worth exactly what it costs the rest of the debrief, which is
 * nothing: a listing that fails, an identity file nobody can parse and a debrief that will not read
 * all land as lines in the summary, and the synthesis still runs on this run's own trace and notes
 * (D29).
 */
export async function earlierDebriefs(input: {
  readonly trace: Trace;
  readonly facts: RunFacts;
  readonly dataDirectory: string;
}): Promise<Continuity> {
  // The contract held in ONE place rather than by every branch below remembering it. Continuity is
  // worth what it costs the rest of the debrief, which is nothing (D29) — so a surprise in here is
  // a hole in the continuity account and never a run that went unjudged, and a later contributor
  // adding a branch cannot take that guarantee away by forgetting it.
  try {
    return await readEarlierDebriefs(input);
  } catch (error) {
    return nothingRead(
      [
        `every earlier debrief under this epic's slug — the reading itself failed where nothing ` +
          `expected it to: ${error instanceof Error ? error.message : String(error)}`,
      ],
      holeBefore(input.facts),
    );
  }
}

async function readEarlierDebriefs(input: {
  readonly trace: Trace;
  readonly facts: RunFacts;
  readonly dataDirectory: string;
}): Promise<Continuity> {
  const { trace, facts, dataDirectory } = input;
  const hole = holeBefore(facts);
  const epic = join(dataDirectory, OBSERVATIONS_DIRECTORY, trace.slug);
  // The run's own directory, by the key ticket 02 already builds — the slug and the run's first
  // timestamp. This is the whole of how the observer's own debrief is kept out (D23 has it in the
  // listing from the first stage onwards, so the finalising flag could not do this job).
  const own = observationDirectory(dataDirectory, trace);

  // A run that left before creating a task is keyed by ticket 02's stand-in rather than by a slug,
  // and every such run on the machine shares that key: the directory is not an epic, so nothing in
  // it is this epic's earlier debrief.
  if (!trace.slugRead) {
    return nothingRead(
      [
        `every debrief under this run's key — no task update of this run carried a slug, so it is ` +
          `filed under a stand-in that other runs share, and none of them is known to be this epic`,
      ],
      hole,
    );
  }

  // No repository in this run's own records means there is nothing to match on, and matching on
  // nothing is how an unrelated epic's defect arrives with grounds attached. Refused, and said.
  if (facts.repository === undefined) {
    return nothingRead(
      [
        `every earlier debrief under this epic's slug — this run's own records do not say which ` +
          `repository it ran in, and a debrief of another repository's epic of the same name is ` +
          `worse read than skipped`,
      ],
      hole,
    );
  }

  let runDirectories: readonly string[];
  try {
    const listed = await readdir(epic, { withFileTypes: true });
    runDirectories = listed.filter((it) => it.isDirectory()).map((it) => it.name);
  } catch (error) {
    // Almost always the ordinary answer: the first run of an epic has no directory to list yet.
    const why = [`this epic's own directory could not be listed`];
    return nothingRead(isMissing(error) ? [] : why, hole);
  }

  const read: EarlierDebrief[] = [];
  const unreadable: string[] = [];
  let elsewhere = 0;
  for (const name of runDirectories.toSorted()) {
    if (join(epic, name) === own) continue;
    const found = await newestDebrief(join(epic, name));
    if (found.kind === "none") {
      unreadable.push(`the run at \`${name}\` in this epic's directory — ${found.why}`);
      continue;
    }
    if (found.repository !== facts.repository) {
      elsewhere += 1;
      continue;
    }
    read.push(found.debrief);
  }
  // Oldest first, on the run's own first timestamp — the same key the directories carry, so the
  // order the synthesis reads them in is the order they happened in.
  read.sort((a, b) => (a.startedAt < b.startedAt ? -1 : a.startedAt > b.startedAt ? 1 : 0));

  return {
    text: read.length === 0 ? undefined : renderEarlier(read, facts),
    summary: { read: read.map((it) => readLine(it, facts)), unreadable, elsewhere, hole },
  };
}

/** What one earlier run's directory yielded: its newest debrief, or the reason there is none. */
type Found =
  | { readonly kind: "found"; readonly debrief: EarlierDebrief; readonly repository: string }
  | { readonly kind: "none"; readonly why: string };

/**
 * The newest debrief of one earlier run, matched through its identity file.
 *
 * **The identity files are what is enumerated, not the debriefs**, because the identity file is what
 * says which run and which repository a debrief is about — a debrief cannot (ADR-0018) — and it is
 * also what the newest-per-run rule is keyed on. The highest replay ordinal is the newest: every
 * ordinal after the first is a replay written beside what was already there (D19).
 */
async function newestDebrief(directory: string): Promise<Found> {
  let names: readonly string[];
  try {
    names = await readdir(directory);
  } catch {
    return { kind: "none", why: "that run's directory could not be listed" };
  }
  const identities = names
    .map((name) => ({ name, ordinal: identityOrdinal(name) }))
    .filter((it): it is { name: string; ordinal: number } => it.ordinal !== undefined)
    .toSorted((a, b) => b.ordinal - a.ordinal);
  if (identities.length === 0) {
    // Two different states, and only one of them is a debrief: a run whose observer wrote a trace
    // and stopped before its first debrief has left nothing to read, and saying it "could not be
    // read" would name a document that was never there.
    return {
      kind: "none",
      why: names.some(isDebriefName)
        ? `its debrief has no identity file beside it, so nothing says which repository that run ` +
          `ran in. It may be another repository's epic of this name`
        : `that run left no debrief at all — only its trace, which is never read for continuity`,
    };
  }

  const newest = identities[0];
  if (newest === undefined) return { kind: "none", why: "that run's directory could not be read" };
  let fields: Readonly<Record<string, string>>;
  try {
    fields = parseIdentity(await readFile(join(directory, newest.name), "utf8"));
  } catch {
    return { kind: "none", why: `its identity file \`${newest.name}\` could not be read` };
  }
  const repository = fields.repository;
  if (repository === undefined || repository === "" || repository === "unknown") {
    return {
      kind: "none",
      why:
        `its identity file \`${newest.name}\` does not say which repository its run ran in, so ` +
        `it cannot be told from another repository's epic of this name`,
    };
  }
  // The debrief the identity file itself names, so the pair stays the pair its writer made even if
  // this listing's idea of the ordinal ever drifts from the writer's.
  const file = fields.debrief ?? debriefNames(newest.ordinal).debrief;
  let text: string;
  try {
    text = await readFile(join(directory, file), "utf8");
  } catch {
    return { kind: "none", why: `the debrief \`${file}\` its identity file names could not be read` };
  }
  return {
    kind: "found",
    repository,
    debrief: {
      startedAt: fields["run-started-at"] ?? "unknown",
      skill: fields.skill ?? "unknown",
      commit: fields["plugin-commit"] ?? "unknown",
      // Absent means finalised: nothing written before D23's flag existed carries the field, and a
      // finished run's replay always writes `yes`.
      finalised: (fields.finalised ?? "yes") !== "no",
      file,
      held: identities.length,
      text,
    },
  };
}

/* ───────────────────────────── the hole continuity may have ───────────────────────────── */

/**
 * Whether this run resumed work no debrief here covers (ticket 07).
 *
 * The first delivery on disk opened its task list at `16/18`, so sixteen tickets were delivered by
 * something no record on that machine holds. That is a third continuity state, and without it a
 * debrief reading "no earlier debriefs" is indistinguishable from a first run. Only the two counts
 * are read and never the subject that carried them: a task's subject is the repository's own domain
 * past the slug (ADR-0018).
 */
function holeBefore(facts: RunFacts): string | undefined {
  const opened = facts.openedAt;
  if (opened === undefined || opened.completed === 0) return undefined;
  return (
    `this run opened its task list with ${opened.completed} of ${opened.total} items already ` +
    `done, so work of this epic happened before it. Whether any debrief above covers that work ` +
    `cannot be told from here — a run whose observer never started, or whose records are off this ` +
    `machine, leaves none.`
  );
}

/* ──────────────────────────────── what the two readers get ──────────────────────────────── */

/** One line of the debrief's continuity account. Nothing here is the model's. */
function readLine(debrief: EarlierDebrief, facts: RunFacts): string {
  return (
    `\`${debrief.skill}\`, run started ${debrief.startedAt} — \`${debrief.file}\`, plugin commit ` +
    `\`${debrief.commit}\`` +
    (sameCommit(debrief, facts) ? "" : ", which is not the commit this run ran") +
    (debrief.finalised
      ? ""
      : ". **That run was still going** when this was read, so its debrief is not final") +
    (debrief.held === 1
      ? ""
      : `. The newest of ${debrief.held} debriefs of that one run — a replay writes beside rather ` +
        `than over`)
  );
}

/**
 * Whether an earlier run ran the same installed plugin as this one.
 *
 * Read off the run's OWN records rather than off `plugin-commit.ts`'s resolution, because that is
 * the comparison user story 20 wants: a defect spanning a plugin update may be about a line that
 * changed inside it, and a commit this machine merely has installed now says nothing about either
 * run. Unknown on either side is not a difference and is never reported as one.
 */
function sameCommit(debrief: EarlierDebrief, facts: RunFacts): boolean {
  const mine = facts.commitInRecords;
  return mine === undefined || debrief.commit === "unknown" || debrief.commit === mine;
}

/**
 * The earlier debriefs as the synthesis reads them.
 *
 * Each block names the run the way its debrief is keyed — the skill and the run's own timestamp —
 * so a cross-run **defect** can say which runs it spans and a maintainer holding the directory can
 * find both. The markers are the `==` shape the notes file already uses, for the reason ticket 05
 * gives: a marker that cannot occur inside a markdown document is what keeps a quoted heading from
 * reading as the start of the next block.
 */
function renderEarlier(read: readonly EarlierDebrief[], facts: RunFacts): string {
  const out: string[] = [];
  for (const [index, debrief] of read.entries()) {
    const which = `${index + 1} of ${read.length}`;
    out.push(
      `== earlier debrief ${which}: \`${debrief.skill}\`, run started ${debrief.startedAt} ==`,
    );
    out.push(`file: \`${debrief.file}\`, in this epic's own directory on the human's machine`);
    out.push(
      `plugin commit: \`${debrief.commit}\`` +
        (sameCommit(debrief, facts)
          ? ""
          : ` — NOT the commit this run ran (\`${facts.commitInRecords ?? "unknown"}\`). A defect ` +
            `spanning that run has to say so: the line either run diverged from may have changed ` +
            `between them.`),
    );
    out.push(
      debrief.finalised
        ? `finalised: yes — that run was over when this debrief was written.`
        : `finalised: NO — that run was still going when this was read, so this is a half-written ` +
          `account. Two runs of one epic in flight at once is itself worth reporting; presenting ` +
          `this as a finished account of that run is not.`,
    );
    if (debrief.held > 1) {
      out.push(
        `this is the newest of ${debrief.held} debriefs of that one run: a replay writes beside ` +
          `what is there rather than over it, so the run has been read more than once and this is ` +
          `the latest reading of it. It is ONE run.`,
      );
    }
    out.push("");
    out.push(debrief.text.trimEnd());
    out.push("");
    out.push(`== end of earlier debrief ${which} ==`);
    out.push("");
  }
  return out.join("\n");
}
