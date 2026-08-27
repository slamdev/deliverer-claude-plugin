/**
 * What the **observer** left beside the run, read off the run's own configuration directory
 * (run-observation ticket 08).
 *
 * This reads; `./matchers.ts` judges. The split is `./epic.ts`'s and it is here for the same
 * reason: a failure has to be able to say what WAS there rather than only what was not.
 *
 * **Nothing here switches observation on, and nothing switches it off.** Both builders already send
 * `/deliverer:refine …` or `/deliverer:build …` as the run's first prompt, which is the observer's
 * own trigger, and the option that would turn it off is on by default — so it is left unset in
 * `./run-directory.ts`'s `HOST_SETTINGS` and out of the three options `./install.ts` writes. A run
 * meets the default a user meets, and this file only looks at what came of it.
 *
 * **The debrief's path is DERIVED and never searched for.** The host installs a plugin's data
 * directory at `<config>/plugins/data/<plugin>-<marketplace>`, and both of those names are already
 * read off the marketplace entry (`./repository.ts`) — so the derivation is the manifest plus the
 * host's own mangling of the two into one directory name. That mangling is a **claim**: nobody
 * promises it, it was read off a machine, and it can move. So it is stated in `derivedFrom` and
 * carried into every failure, and a host that renames its data directories fails saying which path
 * was looked at and what it was built from, rather than reading as a run that observed nothing.
 *
 * It is inside the **run directory** either way, because `./run-directory.ts` pins
 * `CLAUDE_CONFIG_DIR` per run — which is also why nothing the observer wrote can reach the clone,
 * the fixture repository or the **change request**: they are siblings of the configuration
 * directory rather than under it.
 */
import { readFile, readdir } from "node:fs/promises";
import { join, sep } from "node:path";
import { MARKETPLACE_MANIFEST, readMarketplaceEntry } from "./repository.ts";
import type { RunDirectory } from "./run-directory.ts";
import type { SessionRecords } from "./run.ts";

/** Where the host puts a plugin's data directory, relative to a configuration directory. */
const PLUGIN_DATA = ["plugins", "data"];

/** The directory the observer files every observation of every run under. */
const OBSERVATIONS = "observations";

/**
 * The one document a test looks at. The three `DO-NOT-FORWARD-*` files beside it are the
 * observer's own — a **trace**, its **dispatch note**s and an **identity file** — and no business
 * of an assertion's.
 */
const DEBRIEF_FILE = "debrief.md";

/**
 * The three header lines this reads, as the debrief writes them.
 *
 * Read with an expression rather than parsed, because the whole of what is wanted here is shallow:
 * that a debrief exists for this run and that its header names it. Depth lives at the replay seam,
 * which needs no forge, no host and no money. Each of the three sits at the head of its own bullet,
 * before anything the 120-column wrap could push onto a continuation line.
 */
const HEADER = {
  skill: /^- \*\*skill\*\* — `([^`\n]+)`/m,
  slug: /^- \*\*epic slug\*\* — `([^`\n]+)`/m,
  dispatches: /^- \*\*dispatches\*\* — (\d+)\b/m,
};

/**
 * What a debrief says when the run it is about is still going.
 *
 * The observer rewrites the file as each stage lands and flags it until it finalises, so this is
 * how a reader tells a whole reading of the run from a reading of it so far — and at the moment a
 * run returns it is usually the latter, since finalising is a model call that outlives the session.
 */
const STILL_GOING = "**This run is still going";

/** What the header says about the run, or `null` per line where it says nothing this recognises. */
export interface DebriefHeader {
  /** the skill, as the plugin names it: `deliverer:build` */
  readonly skill: string | null;
  readonly slug: string | null;
  readonly dispatches: number | null;
}

export interface Debrief {
  readonly path: string;
  /** the **slug** directory the observer filed it under */
  readonly filedUnder: string;
  /** the run's own first timestamp, which is the directory beneath that */
  readonly startedAt: string;
  /** false while the observer is still rewriting it as stages land */
  readonly finalised: boolean;
  readonly header: DebriefHeader;
}

export interface Debriefs {
  /** `<config>/plugins/data/<plugin>-<marketplace>`, derived rather than found */
  readonly dataDirectory: string;
  /** what that path was built out of, which every failure quotes */
  readonly derivedFrom: string;
  /** `<data>/observations` */
  readonly root: string;
  /** the plugin's own name, which is the first half of every skill a debrief names */
  readonly pluginName: string;
  /** when this was read: the moment the run returned, with no wait and no poll */
  readonly readAt: string;
  /** every debrief under the root, whatever slug the observer filed it under */
  readonly found: readonly Debrief[];
  /** why there are none, when the derived path itself is not there */
  readonly missing: string | null;
}

/**
 * Read the moment the run returns, with no wait and no poll.
 *
 * There is nothing to wait for: the observer keeps a readable debrief current as each stage lands
 * and rewrites it by staging and renaming, so a reader sees one whole file or the previous whole
 * file and never a prefix of either. What a poll would buy is the finalised one, which is a model
 * call long — money and minutes for a bar this assertion deliberately does not hold.
 *
 * Every debrief under the root is collected rather than the run's own alone, so a failure can quote
 * what the observer DID file and under which slug. `./matchers.ts` picks the run's out.
 */
export async function readDebriefs(runDirectory: RunDirectory): Promise<Debriefs> {
  const entry = await readMarketplaceEntry();
  const dataDirectory = join(
    runDirectory.configDir,
    ...PLUGIN_DATA,
    `${entry.pluginName}-${entry.marketplaceName}`,
  );
  const derivedFrom =
    `the plugin "${entry.pluginName}" and the marketplace "${entry.marketplaceName}", both read ` +
    `off ${MARKETPLACE_MANIFEST}, under the configuration directory this run was pinned to. The ` +
    `host mangles the two into one directory name — its own bookkeeping keys the same install ` +
    `${entry.pluginName}@${entry.marketplaceName} — and that mangling is a claim rather than a ` +
    `promise`;
  const root = join(dataDirectory, OBSERVATIONS);
  const readAt = new Date().toISOString();
  const nothing = { dataDirectory, derivedFrom, root, pluginName: entry.pluginName, readAt };

  let entries: string[];
  try {
    entries = await readdir(root, { recursive: true });
  } catch (error) {
    return { ...nothing, found: [], missing: `${root} could not be read: ${String(error)}` };
  }

  const found: Debrief[] = [];
  for (const relative of entries) {
    if (!relative.endsWith(`${sep}${DEBRIEF_FILE}`)) continue;
    const parts = relative.split(sep);
    const filedUnder = parts[0];
    const startedAt = parts[parts.length - 2];
    // The observer's own bookkeeping — the session markers and what a hook is to print — sits in
    // dot-directories beside the observations. Nothing in them is a debrief, and a run's is never
    // filed under one.
    if (filedUnder === undefined || startedAt === undefined || filedUnder.startsWith(".")) continue;
    const path = join(root, relative);
    const text = await readFile(path, "utf8");
    const dispatches = HEADER.dispatches.exec(text)?.[1];
    found.push({
      path,
      filedUnder,
      startedAt,
      finalised: !text.includes(STILL_GOING),
      header: {
        skill: HEADER.skill.exec(text)?.[1] ?? null,
        slug: HEADER.slug.exec(text)?.[1] ?? null,
        dispatches: dispatches === undefined ? null : Number(dispatches),
      },
    });
  }
  found.sort((left, right) =>
    left.filedUnder.localeCompare(right.filedUnder) ||
    left.startedAt.localeCompare(right.startedAt)
  );
  return { ...nothing, found, missing: null };
}

/** One debrief in a line, for a diagnostic and for a failure to quote. */
export function describeDebrief(debrief: Debrief): string {
  return (
    `${debrief.filedUnder}/${debrief.startedAt} — ${debrief.header.skill ?? "no skill named"}, ` +
    `epic ${debrief.header.slug ?? "none named"}, ` +
    `${debrief.header.dispatches ?? "no"} dispatches, ` +
    `${debrief.finalised ? "finalised" : "not yet final"}`
  );
}

/**
 * What was read and which state it was in, for the builder to report the moment the run returns.
 *
 * The state is said out loud rather than left to be inferred, because a debrief read at that
 * instant may be the observer's whole reading of the run or its reading so far, and the two are
 * held to different bars in `./matchers.ts`.
 */
export function describeDebriefs(debriefs: Debriefs): string {
  if (debriefs.found.length === 0) {
    return (
      `the observer had left no debrief under ${debriefs.root} the moment the run returned` +
      `${debriefs.missing === null ? "" : ` — ${debriefs.missing}`}`
    );
  }
  return (
    `the observer's debriefs, read the moment the run returned with no wait and no poll, under ` +
    `${debriefs.root}: ${debriefs.found.map(describeDebrief).join("; ")}`
  );
}

/**
 * The **session record**s of the agents THIS RUN **dispatch**ed, and no others.
 *
 * Scoped to the orchestrator's own `<session-id>/subagents/` rather than taken from
 * `SessionRecords.dispatched`, which is every such record anywhere under the run's configuration
 * directory. The observer runs in that same directory and makes model calls of its own, so the
 * unscoped figure is not a count of what the run dispatched — and this is the cross-check of the
 * debrief against the host's own files, so it has to be one.
 *
 * **A dispatch leaves TWO files**: the record, and the `.meta.json` sidecar the host writes beside
 * it. A file count is therefore twice a dispatch count — a miscount this epic has made twice — and
 * `.jsonl` is what keeps the two apart. `readSessionRecords` already filters that way; it is
 * repeated here because this figure is the one an assertion compares against a number.
 */
export function dispatchRecordsOfRun(
  records: SessionRecords,
  sessionId: string,
): readonly string[] {
  const own = `${join(sessionId, "subagents")}${sep}`;
  return records.dispatched.filter(
    (record) => record.includes(own) && record.endsWith(".jsonl"),
  );
}
