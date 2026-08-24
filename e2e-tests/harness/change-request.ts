/**
 * What a delivery left on the forge, read the way a human would read it afterwards
 * (end-to-end-tests ticket 03).
 *
 * This reads; `./matchers.ts` judges. Everything here is asked of the FORGE rather than of the
 * clone, because the forge is what a human opens: the **change request**, whether it is still a
 * **draft**, the commits on the **epic branch**, the comments on both **channels** this forge
 * carries, and the **checks**. Nothing is asked of the run — no message stream, no tools-server
 * traffic, nothing about which agent did what.
 *
 * **The commits are the second source, and they are the one that survives.** A ticket's commit
 * carries a `Ticket:` line naming the ticket it implements and an `Assumptions:` section for the
 * forks it left open. That is what lets a matcher check the change request against the branch rather
 * than against itself: an **assumption** with no comment is a fork nobody adjudicated, and no report
 * is needed to see it. A **fix wave**'s commit carries no `Ticket:` line and is not mirrored, so the
 * line is read rather than assumed and `ticket` is null for those.
 *
 * Both comment channels are read for the same reason the plugin's own agents read both — a comment
 * where there is no resolution to read is still a comment, and an `ASSUMPTION` posted to the
 * conversation carries its **verdict** as a reply beginning `re:` rather than as a threaded one.
 */
import { writeFile } from "node:fs/promises";
import { gh, git, GIT_CREDENTIALS } from "./forge.ts";
import type { RunDirectory } from "./run-directory.ts";

/** What a commit says about the ticket it implemented: the number, and nothing else. */
const TICKET_LINE = /^[ \t]*Ticket:[ \t]*#?(\d{1,3})\b/m;

/** A section of a commit message — `Assumptions:`, `Gates:` — on a line of its own. */
const SECTION = /^[ \t]*([A-Z][A-Za-z-]*):[ \t]*$/;

/** One numbered entry inside such a section. */
const ENTRY = /^[ \t]*\d+\.[ \t]+\S/;

/** What marks a comment out as an **assumption comment**, and the commit it names. */
const ASSUMPTION = /^[ \t]*ASSUMPTION[ \t]*\(([0-9a-f]{7,40})\)/i;

/**
 * What marks a comment out as an answer to one, on a channel that carries no threading.
 *
 * The prefix is the agent's own contract rather than this harness's reading of prose: a verdict
 * with no thread to sit under has to name the assumption it answers, and is told to open `re:` so
 * that step 3's collection of `ASSUMPTION` does not take it for a fork nobody made.
 */
const RE_ASSUMPTION = /^[ \t]*re:[ \t]*ASSUMPTION[ \t]*\(([0-9a-f]{7,40})\)/i;

/** The three verdicts, as an adjudication states them — read for the reader, never asserted on. */
const VERDICT = /\b(accept(?:ed)?|override(?:n|s)?|escalat(?:e|ed|ion))\b/i;

/** One change request, as the forge lists it. */
export interface ChangeRequestSummary {
  readonly number: number;
  readonly url: string;
  readonly title: string;
  /** whether it is still a **draft** — the whole of what **flipped ready** means */
  readonly isDraft: boolean;
  /** the **epic branch** it was opened from */
  readonly branch: string;
  readonly state: string;
}

/** One commit on the epic branch, and what it records about the work it did. */
export interface DeliveredCommit {
  readonly hash: string;
  readonly subject: string;
  /** the ticket its `Ticket:` line names, or null where it carries none */
  readonly ticket: number | null;
  /** how many entries its `Assumptions:` section carries */
  readonly assumptions: number;
}

/**
 * One `ASSUMPTION` comment, and whether anything answered it.
 *
 * **`answers` is the fact and `verdict` is the reading.** A **verdict** is what an adjudication
 * replies, and the agent that writes one is told to state its **grounds** rather than to spell
 * `accept` — so an answer that never says the word is an ordinary verdict, and failing a delivery
 * for it would be this harness holding the plugin to a wording nobody promised. What IS promised is
 * structural: a reply on the thread, or — where the channel carries no threading — a comment
 * opening `re: ASSUMPTION (<hash>)`, which the agent's own instructions require so that a verdict
 * says which fork it closed. That is what `answers` counts. The word is kept beside it because a
 * reader wants to see which way the forks went, and a matcher reports it without turning on it.
 */
export interface AssumptionComment {
  /** which channel it sits on: a resolvable thread, or one carrying no resolution at all */
  readonly channel: "thread" | "conversation";
  /** the commit the prefix names, which is what ties it to the entry that recorded it */
  readonly commit: string;
  /** its first line, so a failure can quote the fork rather than only count it */
  readonly opening: string;
  /**
   * how many answers it carries: the replies on its thread, or the `re:` comments dealt to it where
   * several forks share the hash that names them (`dealt` below says why they are dealt)
   */
  readonly answers: number;
  /** the verdict one of them named — `accept`, `override`, `escalate` — where one did */
  readonly verdict: string | null;
  /** whether the channel's own resolution state says resolved; false where it has none */
  readonly resolved: boolean;
}

/** One **check** the forge ran, however the forge names it. */
export interface Check {
  readonly name: string;
  /** `COMPLETED`, `IN_PROGRESS`, `QUEUED` — or empty where the forge reports none */
  readonly status: string;
  /** `SUCCESS`, `FAILURE`, `SKIPPED` — or empty while it is still running */
  readonly conclusion: string;
}

/** Everything a delivery left on one change request. */
export interface ChangeRequest extends ChangeRequestSummary {
  readonly commits: readonly DeliveredCommit[];
  readonly assumptionComments: readonly AssumptionComment[];
  readonly checks: readonly Check[];
}

/**
 * Every change request the repository carries, whatever state it is in.
 *
 * All of them rather than the one, because "exactly one" is a matcher's to hold: a delivery that
 * opened a second change request is a finding, and a reader wants to be told which two it opened.
 */
export async function listChangeRequests(
  runDirectory: RunDirectory,
  fullName: string,
): Promise<ChangeRequestSummary[]> {
  const listed = await gh(runDirectory)(
    [
      "pr",
      "list",
      "--repo",
      fullName,
      "--state",
      "all",
      "--limit",
      "50",
      "--json",
      "number,url,title,isDraft,headRefName,state",
    ],
    `listing the change requests on ${fullName}`,
  );
  const raw = JSON.parse(listed.stdout || "[]") as Record<string, unknown>[];
  return raw.map((entry) => ({
    number: Number(entry.number),
    url: String(entry.url ?? ""),
    title: String(entry.title ?? ""),
    isDraft: entry.isDraft === true,
    branch: String(entry.headRefName ?? ""),
    state: String(entry.state ?? ""),
  }));
}

/** One change request read whole: its commits, its assumption comments and its checks. */
export async function readChangeRequest(
  runDirectory: RunDirectory,
  fullName: string,
  summary: ChangeRequestSummary,
): Promise<ChangeRequest> {
  return {
    ...summary,
    commits: await readCommits(runDirectory, fullName, summary.number),
    assumptionComments: await readAssumptionComments(runDirectory, fullName, summary.number),
    checks: await readChecks(runDirectory, fullName, summary.number),
  };
}

/**
 * The commits the change request carries, newest last.
 *
 * The whole message is read and then thrown away: what a matcher needs is the ticket it names and
 * the assumptions it recorded, and a commit body kept in memory only invites an assertion on prose.
 */
async function readCommits(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<DeliveredCommit[]> {
  const listed = await gh(runDirectory)(
    [
      "api",
      "--paginate",
      `repos/${fullName}/pulls/${number}/commits`,
      "--jq",
      ".[] | {hash: .sha, message: .commit.message}",
    ],
    `reading the commits on change request ${number}`,
  );
  return jsonLines(listed.stdout).map((entry) => {
    const message = String(entry.message ?? "");
    return {
      hash: String(entry.hash ?? ""),
      subject: message.split("\n")[0] ?? "",
      ticket: ticketNumber(message),
      assumptions: entriesIn(message, "Assumptions"),
    };
  });
}

/** The ticket a commit's `Ticket:` line names. */
function ticketNumber(message: string): number | null {
  const named = TICKET_LINE.exec(message);
  return named === null ? null : Number(named[1]);
}

/**
 * How many numbered entries one section of a commit message carries.
 *
 * The section runs to the next `<Word>:` section or to the end of the message, which is the same
 * bound the plugin's own agents read it under: a commit may carry other sections numbering their
 * entries just the way this one does, and an entry from one of those is not an assumption.
 */
function entriesIn(message: string, section: string): number {
  const lines = message.split("\n");
  let inside = false;
  let entries = 0;
  for (const line of lines) {
    const heading = SECTION.exec(line);
    if (heading !== null) {
      inside = heading[1] === section;
      continue;
    }
    if (inside && ENTRY.test(line)) entries += 1;
  }
  return entries;
}

/**
 * Every channel this forge carries, read as one list of assumptions and what answered them.
 *
 * **Three of them, because three is what the plugin's own agents are told to read.** The review
 * threads carry resolution; the reviews' own summary bodies leave no thread behind; the change
 * request's conversation carries no resolution at all. An `ASSUMPTION` on any of them is an
 * assumption, and a harness that read two would fail a delivery for posting where it was told it
 * may post.
 */
async function readAssumptionComments(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<AssumptionComment[]> {
  const [owner = "", repo = ""] = fullName.split("/");
  const comments: AssumptionComment[] = [];
  const graphql = (query: string, filter: string, purpose: string) =>
    gh(runDirectory)(
      [
        "api",
        "graphql",
        "--paginate",
        "-F",
        `owner=${owner}`,
        "-F",
        `repo=${repo}`,
        "-F",
        `number=${number}`,
        "-f",
        `query=${query}`,
        "--jq",
        filter,
      ],
      purpose,
    );

  const threads = await graphql(
    REVIEW_THREADS_QUERY,
    ".data.repository.pullRequest.reviewThreads.nodes[] " +
      "| {resolved: .isResolved, bodies: [.comments.nodes[].body]}",
    `reading the review threads on change request ${number}`,
  );
  for (const thread of jsonLines(threads.stdout)) {
    const bodies = Array.isArray(thread.bodies) ? thread.bodies.map(String) : [];
    const opening = bodies[0] ?? "";
    const named = ASSUMPTION.exec(opening);
    if (named === null) continue;
    // What answers an assumption is a REPLY, so the comment carrying the assumption is never one:
    // an entry whose own prose says "we accept that…" would otherwise adjudicate itself.
    const replies = bodies.slice(1);
    comments.push({
      channel: "thread",
      commit: (named[1] ?? "").toLowerCase(),
      opening: firstLine(opening),
      answers: replies.length,
      verdict: verdictIn(replies),
      resolved: thread.resolved === true,
    });
  }

  // The two channels with no threading are read as one pool: an assumption on either is answered
  // the same way, by a comment opening `re: ASSUMPTION (<hash>)` wherever it sits.
  const conversation = await gh(runDirectory)(
    ["api", "--paginate", `repos/${fullName}/issues/${number}/comments`, "--jq", ".[] | {body}"],
    `reading the conversation on change request ${number}`,
  );
  const summaries = await graphql(
    REVIEW_SUMMARIES_QUERY,
    ".data.repository.pullRequest.reviews.nodes[] | {body}",
    `reading the reviews' summaries on change request ${number}`,
  );
  const unthreaded = [...jsonLines(conversation.stdout), ...jsonLines(summaries.stdout)]
    .map((entry) => String(entry.body ?? ""))
    .filter((body) => body.trim() !== "");
  const answersUnder = new Map<string, string[]>();
  const forksUnder = new Map<string, number>();
  for (const body of unthreaded) {
    const answer = RE_ASSUMPTION.exec(body);
    if (answer !== null) {
      const commit = (answer[1] ?? "").toLowerCase();
      answersUnder.set(commit, [...(answersUnder.get(commit) ?? []), body]);
      continue;
    }
    const fork = ASSUMPTION.exec(body);
    if (fork === null) continue;
    const commit = (fork[1] ?? "").toLowerCase();
    forksUnder.set(commit, (forksUnder.get(commit) ?? 0) + 1);
  }
  for (const body of unthreaded) {
    const named = ASSUMPTION.exec(body);
    if (named === null) continue;
    const commit = (named[1] ?? "").toLowerCase();
    comments.push({
      channel: "conversation",
      commit,
      opening: firstLine(body),
      ...dealt(commit, answersUnder, forksUnder),
      resolved: false,
    });
  }

  return comments;
}

/**
 * The answers one fork gets, where several forks share the hash that names them.
 *
 * An answer on this channel names the COMMIT and never the entry inside it — the prefix
 * `plugin/agents/change-request-creator.md` gives it carries the hash and nothing else — so one
 * `re:` under a commit that recorded two assumptions cannot say which of the two it closed. Counting
 * it for both is what a review round found: two forks would come back adjudicated on one reply, and
 * `assertAssumptionsAdjudicated` would pass a change request carrying a fork nobody closed.
 *
 * So the answers are DEALT OUT rather than matched: one apiece, in the order both were posted, which
 * is the most a channel with no threading can honestly support — N answers close N forks and the
 * rest carry none. The last fork under a hash takes whatever is left over, so a single fork answered
 * three times still reads as answered three times and only a genuine shortfall reads as a shortfall.
 *
 * Both maps are the state of the deal and are consumed as it goes, so this is called once per fork
 * in the order the forks were posted and never twice for the same one.
 */
function dealt(
  commit: string,
  answersUnder: Map<string, string[]>,
  forksUnder: Map<string, number>,
): { answers: number; verdict: string | null } {
  const left = (forksUnder.get(commit) ?? 1) - 1;
  forksUnder.set(commit, left);
  const queue = answersUnder.get(commit) ?? [];
  const mine = queue.splice(0, left === 0 ? queue.length : 1);
  return { answers: mine.length, verdict: verdictIn(mine) };
}

/**
 * `--paginate` on a GraphQL query does nothing unless the query takes `$endCursor` and asks for
 * `pageInfo` — without them the first hundred come back as the whole answer, with no error and
 * nothing to notice. The plugin's own agents are given these two queries in the same shape.
 */
const REVIEW_THREADS_QUERY =
  "query($owner:String!,$repo:String!,$number:Int!,$endCursor:String){" +
  "repository(owner:$owner,name:$repo){pullRequest(number:$number){" +
  "reviewThreads(first:100, after:$endCursor){pageInfo{hasNextPage endCursor}" +
  "nodes{isResolved comments(first:100){nodes{body}}}}}}}";

const REVIEW_SUMMARIES_QUERY =
  "query($owner:String!,$repo:String!,$number:Int!,$endCursor:String){" +
  "repository(owner:$owner,name:$repo){pullRequest(number:$number){" +
  "reviews(first:100, after:$endCursor){pageInfo{hasNextPage endCursor}nodes{body}}}}}";

/** Which verdict one of these answers named, where one named any. Reported, never asserted on. */
function verdictIn(answers: readonly string[]): string | null {
  for (const answer of answers) {
    const verdict = VERDICT.exec(answer);
    if (verdict !== null) return (verdict[1] ?? "").toLowerCase();
  }
  return null;
}

/**
 * The checks the forge ran on the change request.
 *
 * Two shapes arrive under one roll-up — a check run, which has a `name`, a `status` and a
 * `conclusion`, and a commit status, which has a `context` and a `state` — so both are read into
 * the one shape and the difference stops here.
 */
async function readChecks(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<Check[]> {
  const viewed = await gh(runDirectory)(
    [
      "pr",
      "view",
      String(number),
      "--repo",
      fullName,
      "--json",
      "statusCheckRollup",
      "--jq",
      "(.statusCheckRollup // [])[] " +
        "| {name: (.name // .context // \"\"), status: (.status // \"\"), " +
        "conclusion: (.conclusion // .state // \"\")}",
    ],
    `reading the checks on change request ${number}`,
  );
  return jsonLines(viewed.stdout).map((entry) => ({
    name: String(entry.name ?? ""),
    status: String(entry.status ?? ""),
    conclusion: String(entry.conclusion ?? ""),
  }));
}

/**
 * What the epic branch changed, written into the run directory for the **verifier** to read.
 *
 * Taken against what the forge has rather than against the clone's own refs: the clone is where the
 * run worked, and a diff of its working tree would carry whatever the run had not committed. The
 * path comes back so a contributor can read the same file the verifier was given.
 */
export async function writeDeliveredDiff(
  runDirectory: RunDirectory,
  url: string,
  branch: string,
  destination: string,
  baseBranch: string,
): Promise<string> {
  const inClone = git(runDirectory, runDirectory.cloneDir);
  await inClone(
    [
      ...GIT_CREDENTIALS,
      "fetch",
      "--quiet",
      "--force",
      url,
      `${baseBranch}:refs/e2e/base`,
      `${branch}:refs/e2e/delivered`,
    ],
    `fetching ${branch} and ${baseBranch} as the forge has them`,
  );
  const diff = await inClone(
    ["diff", "refs/e2e/base...refs/e2e/delivered"],
    `reading what ${branch} changed`,
  );
  await writeFile(destination, diff.stdout, "utf8");
  return destination;
}

/** One object per line, which is what `gh --jq` emits and what `--paginate` concatenates. */
function jsonLines(stdout: string): Record<string, unknown>[] {
  const entries: Record<string, unknown>[] = [];
  for (const line of stdout.split("\n")) {
    if (line.trim() === "") continue;
    try {
      entries.push(JSON.parse(line) as Record<string, unknown>);
    } catch {
      // A line this harness cannot read is one the forge worded differently, and dropping it is
      // what leaves the matcher to say what was missing rather than the parser to say it was odd.
    }
  }
  return entries;
}

/** Enough of a comment for a failure to quote the fork rather than only count it. */
function firstLine(body: string): string {
  const collapsed = body.replace(/\s+/g, " ").trim();
  return collapsed.length <= 160 ? collapsed : `${collapsed.slice(0, 160)}…`;
}
