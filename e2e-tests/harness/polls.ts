/**
 * What a delivery's **round**s were answered when they were **poll**ed, read off the run's own
 * **session record**s (a-poll-says-what-it-knows ticket 06).
 *
 * This reads; `./matchers.ts` judges. The split is `./debrief.ts`'s and `./change-request.ts`'s and
 * it is here for the same reason: a failure has to be able to say what the answers DID carry.
 *
 * **Why a paid delivery is where this is read at all.** A round's **spend** is extracted from the
 * real backend's own result message, and the scripted review double's spend is *scripted* rather
 * than extracted — so this is the only seam of any kind that reaches that extraction, and the two
 * rounds of a build happy path are the only place it ever runs (the epic's spec, Testing Decisions).
 *
 * **The keys are written down here rather than imported from the server**, for the reason
 * `./matchers.ts` already states about the three tool names it keeps by hand: this package shares
 * nothing with `plugin/mcp`'s, and these keys are a contract — the **observer** reads a round's
 * spend under exactly this nesting on its way to a **debrief**, so a rename that reached only one
 * side of it is a defect this test should report rather than follow.
 *
 * **What is taken for a poll's answer is a payload rather than a tool call.** Every tool result in
 * the records is read, and one is a poll's answer when it parses as an object carrying `reviewId`
 * and `status` — the two of the four keys a poll always carries that say which round it is about and
 * what that round had reached. Nothing here matches on a tool's NAME: the host namespaces a plugin's
 * MCP tools and that mangling is the host's business rather than the plugin's contract. Neither of
 * the other two review tools can be mistaken for a poll either, because the start handle and the
 * cancel result both spell theirs `review_id`.
 *
 * **Every record under the run's own configuration directory is read**, rather than the run's
 * session and its **dispatch**es alone. That directory belongs to one run, so a poll answer
 * anywhere under it is this run's — and a round is ordinarily polled from the dispatch that started
 * it while the orchestrator can answer for one from its own record, so scoping to either would be
 * scoping to where a poll usually is instead of where it is.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SessionRecords } from "./run.ts";

/**
 * The keys of a poll's answer this test turns on, written down once.
 *
 * `spend` is the one object a poll publishes money in and both figures are read out of it: the
 * dollar estimate, and the provider that labels it — because the provider is what decides whether
 * that number is a price or arithmetic at another provider's list rate.
 */
const REVIEW_ID = "reviewId";
const STATUS = "status";
const SPEND = "spend";
const COST_USD = "costUsd";
const PROVIDER = "provider";

/**
 * The statuses that say a round reached a result.
 *
 * A completed round and a failed one both had a result message to read money off — a round that
 * burned twelve minutes and died spent that money exactly as one that finished did. The other three
 * are why the bar is the round's own outcome rather than every answer it gave: `preparing` and
 * `running` are answers given before there was anything to measure, and a `cancelled` round never
 * receives a result at all, so its spend is genuinely unrecoverable rather than missing.
 */
const REACHED_A_RESULT = ["completed", "failed"];

/** One answer a poll came back with, as much of it as this test reads. */
export interface PollAnswer {
  /** which of the run's records it was read out of, relative to their root */
  readonly where: string;
  /** the record entry's own timestamp, which is what orders the answers of one round */
  readonly at: string;
  readonly reviewId: string;
  readonly status: string;
  /**
   * What the round spent, read off the one object a poll publishes it in. `undefined` is a key the
   * answer did not carry, which is a poll saying nobody has measured that figure — never a zero.
   */
  readonly costUsd: number | undefined;
  readonly provider: string | undefined;
  /** every key the answer carried, and every key inside its spend, for a failure to quote */
  readonly keys: readonly string[];
  readonly spendKeys: readonly string[];
}

/** One round, and every answer the polls of it came back with. */
export interface PolledRound {
  readonly reviewId: string;
  /** every answer it was given, oldest first */
  readonly answers: readonly PollAnswer[];
  /** the statuses it was answered with, in the order they were first seen */
  readonly statuses: readonly string[];
  /**
   * Whether a poll ever reported it `completed` or `failed`, which is what makes a spend owed on
   * it. See `REACHED_A_RESULT` for why the other three statuses are not that.
   */
  readonly reachedAResult: boolean;
  /**
   * The last answer carrying both figures, which is what a round's spend is read off — `undefined`
   * for a round no answer ever reported one for.
   */
  readonly reported: PollAnswer | undefined;
}

/**
 * Every round this run polled, in the order they were first answered.
 *
 * Never throws over a record: a file that cannot be read or a line that will not parse contributes
 * nothing, because the assertion this feeds names what was missing far better than a stack trace
 * from inside the harness would. The host appends to these files while the run goes, so a
 * half-written last line is ordinary rather than a finding.
 */
export async function readPolledRounds(records: SessionRecords): Promise<readonly PolledRound[]> {
  const answers: PollAnswer[] = [];
  for (const relative of [...records.sessions, ...records.dispatched]) {
    answers.push(...pollAnswersIn(await entriesOf(join(records.root, relative)), relative));
  }
  // By the answer's own timestamp rather than by the record it sits in: the last word on a round is
  // the last poll of it, and that is not always in the record read last — a run's own record can
  // answer for a round after the dispatch that started it has stopped polling.
  answers.sort((left, right) => (left.at < right.at ? -1 : left.at > right.at ? 1 : 0));

  const order: string[] = [];
  const grouped = new Map<string, PollAnswer[]>();
  for (const answer of answers) {
    const held = grouped.get(answer.reviewId);
    if (held === undefined) {
      order.push(answer.reviewId);
      grouped.set(answer.reviewId, [answer]);
    } else held.push(answer);
  }

  return order.map((reviewId) => {
    const given = grouped.get(reviewId) ?? [];
    return {
      reviewId,
      answers: given,
      statuses: [...new Set(given.map((answer) => answer.status))],
      reachedAResult: given.some((answer) => REACHED_A_RESULT.includes(answer.status)),
      reported: given.findLast(
        (answer) => answer.costUsd !== undefined && answer.provider !== undefined,
      ),
    };
  });
}

/** One round in a line, for a diagnostic and for a failure to quote. */
export function describePolledRound(round: PolledRound): string {
  const reported = round.reported;
  const spend =
    reported === undefined
      ? "no answer of it carried a spend"
      : `$${(reported.costUsd ?? 0).toFixed(4)} on ${reported.provider}`;
  return (
    `${round.reviewId} — ${round.answers.length} ` +
    `${round.answers.length === 1 ? "answer" : "answers"}, ` +
    `${round.statuses.join(" then ")}, ${spend}`
  );
}

/**
 * What the round's last answer carried, for a failure that has to say why it was not enough — the
 * KEYS rather than the figures, since the keys are the contract and the figures are one round's own.
 */
export function describeLastAnswer(round: PolledRound): string {
  const last = round.answers.at(-1);
  if (last === undefined) return "it was never answered at all";
  const carried =
    last.spendKeys.length === 0
      ? `and no ${SPEND} at all`
      : `and a ${SPEND} carrying ${last.spendKeys.join(", ")}`;
  return (
    `its last answer, in ${last.where}, reported ${last.status} with ` +
    `${last.keys.join(", ")} ${carried}`
  );
}

/** Every poll answer in one record, in the order the record carries them. */
function pollAnswersIn(
  entries: readonly Record<string, unknown>[],
  where: string,
): readonly PollAnswer[] {
  const answers: PollAnswer[] = [];
  for (const entry of entries) {
    for (const block of contentBlocks(entry)) {
      // A tool RESULT and nothing else. The reviewer's prose carries figures forward and a
      // **trace** quotes whole payloads, so a reading that took any text with the right keys in it
      // would assert on what an agent said about a poll rather than on what the poll answered.
      if (block["tool_use_id"] === undefined) continue;
      const payload = parsedObject(resultText(block));
      const reviewId = stringOf(payload, REVIEW_ID);
      const status = stringOf(payload, STATUS);
      if (payload === undefined || reviewId === undefined || status === undefined) continue;
      const spend = objectOf(payload, SPEND);
      answers.push({
        where,
        at: stringOf(entry, "timestamp") ?? "",
        reviewId,
        status,
        costUsd: numberOf(spend, COST_USD),
        provider: stringOf(spend, PROVIDER),
        keys: Object.keys(payload),
        spendKeys: spend === undefined ? [] : Object.keys(spend),
      });
    }
  }
  return answers;
}

/** One record's entries, or none where the file is not there or not readable. */
async function entriesOf(path: string): Promise<readonly Record<string, unknown>[]> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    return [];
  }
  const entries: Record<string, unknown>[] = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    const entry = parsedObject(line);
    if (entry !== undefined) entries.push(entry);
  }
  return entries;
}

/** The content blocks of one entry's message, if it carries any. */
function contentBlocks(entry: Record<string, unknown>): readonly Record<string, unknown>[] {
  const content = objectOf(entry, "message")?.["content"];
  if (!Array.isArray(content)) return [];
  const blocks: Record<string, unknown>[] = [];
  for (const block of content) {
    if (typeof block === "object" && block !== null) blocks.push(block as Record<string, unknown>);
  }
  return blocks;
}

/** A tool result's text, which the host writes either as a string or as blocks of one. */
function resultText(block: Record<string, unknown>): string {
  const content = block["content"];
  if (typeof content === "string") return content;
  let text = "";
  for (const inner of Array.isArray(content) ? content : []) {
    if (typeof inner === "object" && inner !== null) {
      text += stringOf(inner as Record<string, unknown>, "text") ?? "";
    }
  }
  return text;
}

function parsedObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function stringOf(held: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = held?.[key];
  return typeof value === "string" ? value : undefined;
}

function numberOf(held: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = held?.[key];
  return typeof value === "number" ? value : undefined;
}

function objectOf(
  held: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const value = held?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
