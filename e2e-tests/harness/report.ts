/**
 * The one thing read out of a run's own **report**: how many **rounds** completed
 * (end-to-end-tests ticket 03).
 *
 * **Everything else a test asserts is read off the forge or the working tree, and a round is the
 * exception because there is nowhere else to read it.** A round leaves no record: the tools server
 * holds its state in memory for the life of the session that started it, and the **findings** it
 * posts are comments indistinguishable from any other. The spec settled the alternative and
 * rejected it — watching the review tool calls would be a second seam in a plan whose whole
 * argument is having one — and said what stands in its place: the round's own reported outcome
 * carries what is needed. This is that outcome, and the orchestrator is asked for it in so many
 * words (`plugin/skills/build/SKILL.md`, What to report).
 *
 * So this module reads PROSE, knowingly, and it is the only place where a test's OUTCOME turns on
 * prose — the marked prefixes elsewhere (`ASSUMPTION`, `re:`) are contracts an agent was handed
 * rather than wordings it chose. Two independent readings cover the wordings a report is likely to
 * use, and a report neither of them can read fails the matcher with the report quoted: a harness
 * that cannot read an honest run is a harness to fix, while one that assumed two rounds because it
 * could not tell is a green test that reviewed nothing.
 */

/** How a count reads when it is written out rather than in digits. */
const WRITTEN = new Map<string, number>([
  ["zero", 0],
  ["no", 0],
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
]);

const COUNT = `(\\d{1,2}|${[...WRITTEN.keys()].join("|")})`;

/** `code review` between the count and `rounds`, which a report often spells out. */
const KIND = "(?:code[- ]?review\\s+)?";

/**
 * The wordings that state a count of completed rounds, tightly: the count and the word `complete`
 * sit either side of `rounds` with nothing but a verb, an emphasis or a colon between them. A
 * sentence that puts them further apart than that — "two rounds were asked for and only one
 * completed" — is one this reader is meant to miss rather than to guess at.
 */
const STATED: readonly RegExp[] = [
  new RegExp(`${COUNT}\\s+${KIND}rounds?\\s+(?:were\\s+|have\\s+|had\\s+)?complet`, "i"),
  new RegExp(`rounds?\\s+completed\\s*[:=]?\\s*${COUNT}\\b`, "i"),
  new RegExp(`complet\\w*\\s+${COUNT}\\s+${KIND}rounds?\\b`, "i"),
  new RegExp(`${COUNT}\\s*/\\s*\\d{1,2}\\s+rounds?\\b`, "i"),
  // `**Rounds:** 2/2 completed`, which is how the one measured run worded it — a heading, then the
  // count, then the word. The emphasis and the colon are between them, and neither is a word.
  new RegExp(`rounds?[*_:\\s]*${COUNT}(?:\\s*/\\s*\\d{1,2})?[*_\\s]*complet`, "i"),
];

/** A **round**'s own id, which `code-reviewer` names in its report and the orchestrator carries. */
const ROUND_ID = /\breview-(\d{1,3})\b/gi;

interface RoundsReported {
  /** the count the report states, or null where it states none this reader can read */
  readonly stated: number | null;
  /** the distinct round ids the report names, which stand in when no count is stated */
  readonly ids: readonly string[];
}

function roundsReported(report: string): RoundsReported {
  let stated: number | null = null;
  for (const pattern of STATED) {
    const found = pattern.exec(report);
    if (found === null) continue;
    const count = countOf(found[1] ?? "");
    if (count !== null && (stated === null || count > stated)) stated = count;
  }
  return { stated, ids: [...new Set(report.match(ROUND_ID)?.map((id) => id.toLowerCase()) ?? [])] };
}

/**
 * How many rounds a report is evidence for: what it states, and failing that how many rounds it
 * named ids for.
 *
 * The ids are the weaker of the two and are only read when nothing was stated — a report naming
 * `epic-review-1` and `epic-review-2` is evidence of two rounds, while one that says "one round
 * completed, a second failed" has already answered the question in words.
 */
export function roundsCompleted(report: string): number | null {
  const reported = roundsReported(report);
  if (reported.stated !== null) return reported.stated;
  return reported.ids.length === 0 ? null : reported.ids.length;
}

function countOf(raw: string): number | null {
  const written = WRITTEN.get(raw.toLowerCase());
  if (written !== undefined) return written;
  const digits = Number(raw);
  return Number.isFinite(digits) ? digits : null;
}
