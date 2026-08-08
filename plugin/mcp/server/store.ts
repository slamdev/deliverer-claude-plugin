/**
 * The review store: `get` / `put` / `list` / `evict`, with TTL eviction (delegated-review issue 04).
 *
 * The interface exists so that a daemon deployment is later a swap rather than a rewrite (PRD, "The
 * MCP server"). Today the only implementation keeps records in memory for the life of the stdio
 * process, which is exactly as long as the session that spawned it.
 *
 * **Only terminal records expire.** A review that is still `pending`, `preparing` or `running` is
 * never evicted, however long it has been quiet: a deep round can go minutes without an event, and
 * evicting one out from under its own poll loop would turn a slow review into an unknown-id error —
 * the one error the Review actor is told means "this handle was never real". The clock therefore
 * starts at the terminal timestamp, not at the last update.
 */
import type { ReviewRecord } from "./review-state.ts";
import { isTerminal } from "./review-state.ts";

export interface ReviewStore {
  get(id: string): ReviewRecord | undefined;
  put(record: ReviewRecord): void;
  /** every record still held, oldest first */
  list(): ReviewRecord[];
  /** drop every expired terminal record; returns the ids dropped */
  evict(now: number): string[];
}

/** How long a finished review stays addressable when nothing says otherwise. */
export const DEFAULT_TTL_SEC = 3600;

export function createMemoryStore(options: { ttlMs: number }): ReviewStore {
  const records = new Map<string, ReviewRecord>();
  return {
    get(id) {
      return records.get(id);
    },
    put(record) {
      records.set(record.reviewId, record);
    },
    list() {
      return [...records.values()].sort((a, b) => a.createdAt - b.createdAt);
    },
    evict(now) {
      const dropped: string[] = [];
      for (const record of records.values()) {
        if (!isTerminal(record.status)) continue;
        const endedAt = record.endedAt ?? record.updatedAt;
        if (now - endedAt >= options.ttlMs) {
          records.delete(record.reviewId);
          dropped.push(record.reviewId);
        }
      }
      return dropped;
    },
  };
}
