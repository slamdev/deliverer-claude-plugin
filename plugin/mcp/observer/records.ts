/**
 * The host's own session records, read as a CLAIM and never as a contract (run-observation ticket
 * 02; ADR-0017 accepts the cost of resting on a format the host owns).
 *
 * Nothing in a **run** is instrumented for observation, so this is the whole of the input: the
 * record the host writes for the session, and the one it writes beside it for every agent that
 * session **dispatch**ed. Everything here therefore reaches into `unknown` through the accessors at
 * the top rather than through an interface, and every field it wants is optional at the type level.
 * A field the records stop carrying costs an entry a detail; it may never cost the **trace**.
 *
 * Measured against Claude Code 2.1.241, on eight deliverer runs under
 * `~/.claude/projects/-root-workspace-preview-env-foundation/`. What was checked, and what each
 * criterion of ticket 02 it answers:
 *
 *  - **Attribution is two fields on assistant entries**, `attributionPlugin` and `attributionSkill`
 *    (`deliverer:refine` / `deliverer:build`). Nothing else identifies a run, and nothing has to:
 *    the plugin marks no record of its own.
 *  - **A mention is not attribution.** Eight other sessions in that same directory match the word
 *    `deliverer` while carrying neither field — seven because the host listed the agent types the
 *    install added (an `agent_listing_delta` attachment naming `deliverer:spec-writer` and the
 *    rest), and one because a human was asking about the plugin. That last one had CALLED the
 *    plugin's own tools, so it carries `attributionMcpServer: "plugin:deliverer:tools"` — which is
 *    exactly why `attributionOf` refuses to look at the MCP fields. Matching on them identifies a
 *    human's session about the plugin as a run of it.
 *  - **Tokens are per API request, never per entry.** One request writes several assistant entries
 *    repeating the same usage, and only the entry carrying the request's `stop_reason` carries its
 *    full `output_tokens`. One delivery's main record holds 169 assistant entries against 79
 *    request ids, so counting entries inflates every figure by more than double — and every figure
 *    a **debrief** carries downstream rests on this one. `e2e-tests/README.md` § The four things
 *    that make the arithmetic wrong settled the rule this implements; nothing in that package
 *    ships, so the rule is re-implemented here rather than imported.
 *  - **Each dispatch names itself.** Beside `agent-<id>.jsonl` sits `agent-<id>.meta.json` carrying
 *    `agentType`, `description` and the `toolUseId` of the `Agent` call that started it. Checked
 *    across three runs: 15, 13 and 4 dispatches, every sidecar matching a call and every call a
 *    sidecar. So the agent a dispatch ran is READ rather than inferred from its prompt.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

/* ────────────────────────────── reaching into unknown JSON ────────────────────────────── */

export type JsonObject = Record<string, unknown>;

export function asObject(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

export function asArray(value: unknown): readonly unknown[] | undefined {
  return Array.isArray(value) ? (value as readonly unknown[]) : undefined;
}

export function field(object: JsonObject | undefined, key: string): unknown {
  return object === undefined ? undefined : object[key];
}

export function stringField(object: JsonObject | undefined, key: string): string | undefined {
  const value = field(object, key);
  return typeof value === "string" ? value : undefined;
}

export function numberField(object: JsonObject | undefined, key: string): number | undefined {
  const value = field(object, key);
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function objectField(object: JsonObject | undefined, key: string): JsonObject | undefined {
  return asObject(field(object, key));
}

export function arrayField(object: JsonObject | undefined, key: string): readonly unknown[] {
  return asArray(field(object, key)) ?? [];
}

/* ─────────────────────────────────── reading one record ─────────────────────────────────── */

/**
 * One record file, and what could not be read of it.
 *
 * A line that is not JSON is COUNTED and skipped, never thrown on: a record the host is still
 * writing ends in a partial line, and a truncated or malformed one is the case ticket 02 requires a
 * trace for rather than a crash. `unreadable` is set only when the file could not be opened at all,
 * and then `entries` is empty — the caller decides whether that is a refusal (the main record) or a
 * loss the trace records and carries on from (a dispatch's).
 */
export interface RecordFile {
  readonly path: string;
  readonly entries: readonly JsonObject[];
  /** 1-based line numbers that were not JSON — a truncated tail, or a line still being written */
  readonly unreadableLines: readonly number[];
  /** why the file could not be opened at all; `entries` is empty when this is set */
  readonly unreadable: string | undefined;
}

export async function readRecordFile(path: string): Promise<RecordFile> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    return {
      path,
      entries: [],
      unreadableLines: [],
      unreadable: error instanceof Error ? error.message : String(error),
    };
  }
  const entries: JsonObject[] = [];
  const unreadableLines: number[] = [];
  const lines = text.split("\n");
  for (const [index, line] of lines.entries()) {
    if (line.trim() === "") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      unreadableLines.push(index + 1);
      continue;
    }
    const entry = asObject(parsed);
    if (entry === undefined) unreadableLines.push(index + 1);
    else entries.push(entry);
  }
  return { path, entries, unreadableLines, unreadable: undefined };
}

/* ───────────────────────────────────── identifying a run ───────────────────────────────────── */

/** The plugin's own name, as `plugin/.claude-plugin/plugin.json` declares it. */
export const PLUGIN_NAME = "deliverer";

/** The two skills a **run** can be. Recorded verbatim; a third would be reported, not refused. */
export const RUN_SKILLS = ["deliverer:refine", "deliverer:build"] as const;

/**
 * Which of the plugin's skills produced entries in this record, in first-seen order.
 *
 * Empty means this record holds no run — a mention of the plugin, or nothing to do with it. Both
 * fields are required together and `attributionSkill` must be the plugin's own namespace: a session
 * that ran another plugin's skill beside a deliverer one carries both, entry by entry, and is a run
 * (one refinement on disk carried `mattpocock-skills:grilling` alongside `deliverer:refine`).
 */
export function attributionOf(entries: readonly JsonObject[]): readonly string[] {
  const skills: string[] = [];
  for (const entry of entries) {
    if (stringField(entry, "attributionPlugin") !== PLUGIN_NAME) continue;
    const skill = stringField(entry, "attributionSkill");
    if (skill === undefined || !skill.startsWith(`${PLUGIN_NAME}:`)) continue;
    if (!skills.includes(skill)) skills.push(skill);
  }
  return skills;
}

/* ───────────────────────────────── tokens, per API request ───────────────────────────────── */

/** What one API request cost, taken from the one entry of that request that carries the total. */
export interface RequestUsage {
  readonly requestId: string;
  readonly model: string | undefined;
  readonly effort: string | undefined;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheWriteTokens: number;
  readonly cacheReadTokens: number;
}

export interface TokenTotals {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheWriteTokens: number;
  readonly cacheReadTokens: number;
}

export const NO_TOKENS: TokenTotals = {
  requests: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
};

/**
 * One usage record per API request, keyed by `requestId`, in the order the requests first appear.
 *
 * **Grouping is the whole point.** A response carrying a text block and two tool calls is written
 * as three assistant entries, all with the same `requestId` and the same request-level usage, and
 * only the last of them carries the request's full `output_tokens`. Keeping the entry with the
 * highest `output_tokens` is what `e2e-tests/README.md` reconciled against the tools server's own
 * SDK-reported figure, to the token — so it is the rule here too.
 *
 * `message.id` is the fallback key, because an entry with no `requestId` still belongs to exactly
 * one request and dropping it would under-count instead of over-counting.
 */
export function requestUsage(entries: readonly JsonObject[]): Map<string, RequestUsage> {
  const byRequest = new Map<string, RequestUsage>();
  for (const entry of entries) {
    if (stringField(entry, "type") !== "assistant") continue;
    const message = objectField(entry, "message");
    const usage = objectField(message, "usage");
    if (usage === undefined) continue;
    const requestId = stringField(entry, "requestId") ?? stringField(message, "id");
    if (requestId === undefined) continue;
    const cacheCreation = objectField(usage, "cache_creation");
    const candidate: RequestUsage = {
      requestId,
      model: stringField(message, "model"),
      effort: stringField(entry, "effort"),
      inputTokens: numberField(usage, "input_tokens") ?? 0,
      outputTokens: numberField(usage, "output_tokens") ?? 0,
      // `cache_creation` splits the write by lifetime; the flat field is the same total and is what
      // a record without the split carries. Their SUM is never taken — that would double it.
      cacheWriteTokens:
        cacheCreation === undefined
          ? (numberField(usage, "cache_creation_input_tokens") ?? 0)
          : (numberField(cacheCreation, "ephemeral_5m_input_tokens") ?? 0) +
            (numberField(cacheCreation, "ephemeral_1h_input_tokens") ?? 0),
      cacheReadTokens: numberField(usage, "cache_read_input_tokens") ?? 0,
    };
    const held = byRequest.get(requestId);
    if (held === undefined || candidate.outputTokens > held.outputTokens) {
      byRequest.set(requestId, candidate);
    }
  }
  return byRequest;
}

export function totalTokens(usages: Iterable<RequestUsage>): TokenTotals {
  let requests = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheWriteTokens = 0;
  let cacheReadTokens = 0;
  for (const usage of usages) {
    requests += 1;
    inputTokens += usage.inputTokens;
    outputTokens += usage.outputTokens;
    cacheWriteTokens += usage.cacheWriteTokens;
    cacheReadTokens += usage.cacheReadTokens;
  }
  return { requests, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens };
}

export function addTokens(left: TokenTotals, right: TokenTotals): TokenTotals {
  return {
    requests: left.requests + right.requests,
    inputTokens: left.inputTokens + right.inputTokens,
    outputTokens: left.outputTokens + right.outputTokens,
    cacheWriteTokens: left.cacheWriteTokens + right.cacheWriteTokens,
    cacheReadTokens: left.cacheReadTokens + right.cacheReadTokens,
  };
}

/* ──────────────────────────────── the records a dispatch left ──────────────────────────────── */

/** What the sidecar beside a dispatch's record says about it. Every field is a claim. */
export interface DispatchSidecar {
  readonly agentType: string | undefined;
  readonly description: string | undefined;
  readonly toolUseId: string | undefined;
  readonly spawnDepth: number | undefined;
}

export interface DispatchRecord {
  /** the host's own id for the dispatched agent, off the file name */
  readonly agentId: string;
  readonly sidecar: DispatchSidecar | undefined;
  readonly file: RecordFile;
}

/**
 * Every per-dispatch record beside a session's own, sorted by file name.
 *
 * Sorted rather than left in directory order because replaying the same records twice has to
 * produce the same trace byte for byte, and `readdir` promises no order at all.
 *
 * The layout is the host's: `<dir>/<session-id>.jsonl` with `<dir>/<session-id>/subagents/` beside
 * it. A session that dispatched nothing has no such directory, which is not a loss.
 */
export async function readDispatchRecords(recordPath: string): Promise<{
  readonly records: readonly DispatchRecord[];
  readonly losses: readonly string[];
}> {
  const sessionId = basename(recordPath).replace(/\.jsonl$/, "");
  const directory = join(dirname(recordPath), sessionId, "subagents");
  let names: string[];
  try {
    names = await readdir(directory);
  } catch {
    return { records: [], losses: [] };
  }
  const losses: string[] = [];
  const records: DispatchRecord[] = [];
  for (const name of names.filter((it) => it.endsWith(".jsonl")).sort()) {
    const path = join(directory, name);
    const file = await readRecordFile(path);
    if (file.unreadable !== undefined) {
      losses.push(`the dispatch record ${name} could not be read (${file.unreadable})`);
    }
    records.push({
      agentId: name.replace(/^agent-/, "").replace(/\.jsonl$/, ""),
      sidecar: await readSidecar(path.replace(/\.jsonl$/, ".meta.json"), name, losses),
      file,
    });
  }
  return { records, losses };
}

async function readSidecar(
  path: string,
  name: string,
  losses: string[],
): Promise<DispatchSidecar | undefined> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    // Not a loss worth a line on its own: the `Agent` call in the parent record names the agent
    // type too, and the trace falls back to it. Only a sidecar that EXISTS and is unreadable is
    // worth saying, because that one means the host's shape moved.
    return undefined;
  }
  let parsed: JsonObject | undefined;
  try {
    parsed = asObject(JSON.parse(text));
  } catch {
    parsed = undefined;
  }
  if (parsed === undefined) {
    losses.push(
      `the sidecar beside ${name} is not readable JSON, so its stage is read off the call`,
    );
    return undefined;
  }
  return {
    agentType: stringField(parsed, "agentType"),
    description: stringField(parsed, "description"),
    toolUseId: stringField(parsed, "toolUseId"),
    spawnDepth: numberField(parsed, "spawnDepth"),
  };
}
