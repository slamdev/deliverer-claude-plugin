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

/**
 * The four verdicts, as an adjudication states them — read for the reader, and turned on by exactly
 * one matcher: `improve` is the one of the four that leaves a **fix wave** work owed, so
 * `assertImprovementsAnswered` finds it here (the-adjudication-compares-roads ticket 05). For the
 * other three the word stays a reading, because what an adjudication promises is a reply stating
 * its **grounds** rather than the word.
 */
const VERDICT = /\b(accept(?:ed)?|improve(?:s|d|ments?)?|override(?:n|s)?|escalat(?:e|ed|ion))\b/i;

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
 * says which fork it closed. That is what `answers` counts.
 *
 * **The word is the reading, and one matcher does now turn on it.** `improve` is the verdict that
 * agrees the choice was defensible and directs a better road anyway, so it is the one of the four
 * that leaves a **fix wave** work owed — and nothing else on the forge tells it from an `accept`.
 * `assertImprovementsAnswered` reads it for exactly that (the-adjudication-compares-roads ticket
 * 05); every other matcher still reports the word without turning on it. What is read is the
 * STANDING verdict — the NEWEST answer to name one, because later legwork can overturn a verdict
 * already posted and the newest reply is the one that stands — so an `accept` a further reply
 * corrected to an `improve` reads here as the `improve` it now is. `answeredAfterVerdict` is the
 * position beside it, and it is the reason a count of answers is not enough: what says a **fix
 * wave** came back to a comment is a reply landing AFTER the verdict that stands, and a correction
 * is a second answer that is the verdict itself.
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
  /**
   * the STANDING verdict — `accept`, `improve`, `override`, `escalate` — as the newest answer to
   * name one worded it, or null where none of them named any
   */
  readonly verdict: string | null;
  /**
   * whether any answer landed after the one that named the standing verdict, which is the mark a
   * **fix wave** leaves on a comment it worked; false where no answer named a verdict at all
   */
  readonly answeredAfterVerdict: boolean;
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
 * One thread on the channel that carries resolution: its comments in the order they were posted, and
 * whether it is resolved.
 */
interface ReviewThread {
  readonly resolved: boolean;
  readonly bodies: readonly string[];
}

/**
 * What the comment channels carry, in full, before anything has been read out of them.
 *
 * **Three of them, because three is what the plugin's own agents are told to read.** The review
 * threads carry resolution; the reviews' own summary bodies leave no thread behind; the change
 * request's conversation carries no resolution at all. An `ASSUMPTION` on any of them is an
 * assumption, and a harness that read two would fail a delivery for posting where it was told it may
 * post. The two with no threading are one pool, because an assumption on either is answered the same
 * way: by a comment opening `re: ASSUMPTION (<hash>)` wherever it sits.
 *
 * **It never leaves this module.** Two things read it — `readAssumptionComments`, which keeps a
 * count, a word and one opening line, and `writeAdjudication`, which puts the bodies straight on
 * disk for the **verifier** — and neither hands a body to the outcome the matchers are given, for
 * the reason `readCommits` gives about a commit message: prose kept in memory only invites an
 * assertion on prose.
 */
interface Channels {
  readonly threads: readonly ReviewThread[];
  /** the change request's own conversation and the reviews' summaries, as one pool */
  readonly unthreaded: readonly string[];
}

/** Every channel this forge carries, read whole. */
async function readChannels(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<Channels> {
  const [owner = "", repo = ""] = fullName.split("/");
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
  const conversation = await gh(runDirectory)(
    ["api", "--paginate", `repos/${fullName}/issues/${number}/comments`, "--jq", ".[] | {body}"],
    `reading the conversation on change request ${number}`,
  );
  const summaries = await graphql(
    REVIEW_SUMMARIES_QUERY,
    ".data.repository.pullRequest.reviews.nodes[] | {body}",
    `reading the reviews' summaries on change request ${number}`,
  );
  return {
    threads: jsonLines(threads.stdout).map((thread) => ({
      resolved: thread.resolved === true,
      bodies: Array.isArray(thread.bodies) ? thread.bodies.map(String) : [],
    })),
    unthreaded: [...jsonLines(conversation.stdout), ...jsonLines(summaries.stdout)]
      .map((entry) => String(entry.body ?? ""))
      .filter((body) => body.trim() !== ""),
  };
}

/** Every assumption those channels carry, and what answered each one. */
async function readAssumptionComments(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
): Promise<AssumptionComment[]> {
  const channels = await readChannels(runDirectory, fullName, number);
  const comments: AssumptionComment[] = [];
  for (const thread of channels.threads) {
    const opening = thread.bodies[0] ?? "";
    const named = ASSUMPTION.exec(opening);
    if (named === null) continue;
    // What answers an assumption is a REPLY, so the comment carrying the assumption is never one:
    // an entry whose own prose says "we accept that…" would otherwise adjudicate itself.
    const replies = thread.bodies.slice(1);
    comments.push({
      channel: "thread",
      commit: (named[1] ?? "").toLowerCase(),
      opening: firstLine(opening),
      answers: replies.length,
      ...standingVerdict(replies),
      resolved: thread.resolved,
    });
  }

  const { answersUnder, forksUnder } = sortUnthreaded(channels.unthreaded);
  for (const body of channels.unthreaded) {
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
 * The pool with no threading, sorted: which answers were posted under each commit, and how many
 * forks that commit's own comments carry. `dealt` below is what turns the two into one fork's share,
 * and `writeAdjudication` is what reads the answers whole.
 */
function sortUnthreaded(unthreaded: readonly string[]): {
  answersUnder: Map<string, string[]>;
  forksUnder: Map<string, number>;
} {
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
  return { answersUnder, forksUnder };
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
): { answers: number; verdict: string | null; answeredAfterVerdict: boolean } {
  const left = (forksUnder.get(commit) ?? 1) - 1;
  forksUnder.set(commit, left);
  const queue = answersUnder.get(commit) ?? [];
  const mine = queue.splice(0, left === 0 ? queue.length : 1);
  return { answers: mine.length, ...standingVerdict(mine) };
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

/**
 * The **verdict** these answers leave standing, and whether anything answered after it.
 *
 * **The newest to name one, not the first.** Later legwork can overturn a verdict already posted —
 * the correction is a further reply carrying the verdict that now stands, and an `accept` corrected
 * to an `improve` is the path the adjudication is instructed in — so reading forwards would report
 * the verdict that was corrected and hide the one that replaced it. The answers arrive in the
 * channel's own order, a thread's replies and the `re:` comments alike, so the newest is the last of
 * them to name a verdict at all.
 *
 * **`answeredAfterVerdict` is a position rather than a count**, which is what the one matcher that
 * turns on the word needs of it: an `improve` is work owed, and what says a **fix wave** came back
 * to it is a reply landing after the verdict — never the comment merely carrying two answers, since
 * a correction is a second answer that is the verdict itself
 * (the-adjudication-compares-roads ticket 05).
 */
function standingVerdict(answers: readonly string[]): {
  verdict: string | null;
  answeredAfterVerdict: boolean;
} {
  for (let index = answers.length - 1; index >= 0; index -= 1) {
    const named = VERDICT.exec(answers[index] ?? "");
    if (named === null) continue;
    return {
      verdict: (named[1] ?? "").toLowerCase(),
      answeredAfterVerdict: index < answers.length - 1,
    };
  }
  return { verdict: null, answeredAfterVerdict: false };
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

/**
 * The **adjudication**, written into the run directory beside the diff for the **verifier** to read:
 * every **assumption comment** on the change request and every reply under it, in full
 * (the-adjudication-compares-roads ticket 06).
 *
 * **In full is the whole of why it exists.** What `readAssumptionComments` above keeps of a reply is
 * a count and one word, and what it keeps of a comment is an opening line — the right thing for a
 * matcher, which asserts that a fork carries a verdict and quotes which fork it was, and nowhere
 * near enough to say whether that verdict was SOUND. Soundness is the question no assertion can
 * settle, so it is the verifier's, and a truncated reply cannot be judged for it: an `accept` rests
 * on **grounds** and the roads it says it beat, and an `improve` on the **axis** it names, all of it
 * prose that only reads as prose.
 *
 * **On disk rather than on the outcome**, which is what keeps the seam where it is: `./matchers.ts`
 * still cannot reach a word of this, so nothing mechanical can start turning on a wording the plugin
 * never promised. The channels are read again here rather than carried out of `readChangeRequest`
 * for the same reason — three requests against a forge the run has already finished with, against a
 * body of prose sitting on an outcome every matcher is handed.
 *
 * Read off the FORGE, like the diff beside it, because the replies exist nowhere else: the clone
 * carries no comment and the run's own report carries counts. The path comes back so a contributor
 * can read the same file the verifier was given.
 */
export async function writeAdjudication(
  runDirectory: RunDirectory,
  fullName: string,
  number: number,
  destination: string,
): Promise<string> {
  const channels = await readChannels(runDirectory, fullName, number);
  await writeFile(destination, adjudication(fullName, number, adjudicated(channels)), "utf8");
  return destination;
}

/** One assumption comment as that file carries it: the comment whole, and every answer under it. */
interface Adjudicated {
  readonly channel: "thread" | "conversation";
  /** the commit whose `Assumptions:` entry it mirrors, which is what the prefix names */
  readonly commit: string;
  readonly resolved: boolean;
  readonly body: string;
  readonly answers: readonly string[];
}

/**
 * Every assumption comment on the channels, paired with the answers posted under it.
 *
 * **The answers are not dealt out here, which is the one difference from `dealt` above.** That deal
 * exists because a matcher counts: an answer naming a commit that recorded two assumptions cannot
 * say which of the two it closed, and counting it for both would report a fork nobody adjudicated as
 * adjudicated. This file counts nothing. Its job is to lose no reply, and its reader judges only the
 * verdicts it can see — that every fork got one is asserted elsewhere and is none of that reader's
 * business — so an answer under a shared hash is listed under both comments and the file says that
 * is what it did, rather than assigned to one of them on a rule the channel cannot support.
 */
function adjudicated(channels: Channels): Adjudicated[] {
  const entries: Adjudicated[] = [];
  for (const thread of channels.threads) {
    const opening = thread.bodies[0] ?? "";
    const named = ASSUMPTION.exec(opening);
    if (named === null) continue;
    entries.push({
      channel: "thread",
      commit: (named[1] ?? "").toLowerCase(),
      resolved: thread.resolved,
      body: opening,
      answers: thread.bodies.slice(1),
    });
  }
  const { answersUnder } = sortUnthreaded(channels.unthreaded);
  for (const body of channels.unthreaded) {
    const named = ASSUMPTION.exec(body);
    if (named === null) continue;
    const commit = (named[1] ?? "").toLowerCase();
    entries.push({
      channel: "conversation",
      commit,
      resolved: false,
      body,
      answers: answersUnder.get(commit) ?? [],
    });
  }
  return entries;
}

/** What the file says wherever it carries a comment off the pool with no threading. */
const UNTHREADED_NOTE =
  "This channel carries no threading, so what answers a comment on it is a comment opening\n" +
  "`re: ASSUMPTION (<hash>)`. Those name the commit rather than the fork inside it, so where one\n" +
  "commit recorded two assumptions, every answer under that commit is listed under both of them.";

/**
 * The file itself: a heading per comment, the comment whole, then each answer whole and in order.
 *
 * It is written for two readers at once, which is the same arrangement the delivered diff has — the
 * verifier is handed the path, and a contributor reads the same file afterwards to see what the
 * verdict was formed on. Hence markdown, and hence the counts at the top: a delivery whose commits
 * recorded no fork leaves a file saying so in a line rather than an empty one saying nothing.
 */
function adjudication(fullName: string, number: number, entries: readonly Adjudicated[]): string {
  const answers = entries.reduce((total, entry) => total + entry.answers.length, 0);
  const lines = [
    `# The adjudication on ${fullName} change request #${number}`,
    "",
    "Every comment marked `ASSUMPTION` on this change request, and every reply under it, whole and",
    "in the order the forge has them. Written by the end-to-end harness off the forge once the run",
    "had finished; nothing here is a summary of anything.",
    "",
    `Assumption comments: ${entries.length}. Replies listed under them: ${answers}.`,
  ];
  if (entries.length === 0) {
    lines.push("", "No comment on this change request is marked `ASSUMPTION`.");
  }
  entries.forEach((entry, index) => {
    lines.push(
      "",
      `## Assumption ${index + 1} of ${entries.length}`,
      "",
      `Mirrored from commit \`${entry.commit}\`, posted on ${where(entry)}.`,
    );
    if (entry.channel === "conversation") lines.push("", UNTHREADED_NOTE);
    lines.push("", quoted(entry.body));
    if (entry.answers.length === 0) lines.push("", "Nothing is posted under it.");
    entry.answers.forEach((answer, position) => {
      lines.push("", `### Reply ${position + 1} of ${entry.answers.length}`, "", quoted(answer));
    });
  });
  return `${lines.join("\n")}\n`;
}

/** Which channel a comment sits on, and what that channel says about resolution. */
function where(entry: Adjudicated): string {
  if (entry.channel !== "thread") {
    return "the change request's conversation, which carries no resolution state";
  }
  return `a review thread, ${entry.resolved ? "resolved" : "unresolved"}`;
}

/**
 * One body carried whole: every line of it, prefixed, and nothing dropped.
 *
 * The prefix is the file's own and it is there for ambiguity rather than for looks. A comment body
 * carries whatever the agent wrote — its own headings, its own lists — and dropped in bare it would
 * leave a reader unable to tell the comment's structure from the file's. A fence would not do it: a
 * body carrying a fenced block of its own closes the fence early and the rest of the comment stops
 * being a comment.
 */
function quoted(body: string): string {
  const text = body.replaceAll("\r\n", "\n").trimEnd();
  if (text.trim() === "") return "> (this comment is empty)";
  return text
    .split("\n")
    .map((line) => (line === "" ? ">" : `> ${line}`))
    .join("\n");
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
