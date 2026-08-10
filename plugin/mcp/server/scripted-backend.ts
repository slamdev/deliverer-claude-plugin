/**
 * The scripted review backend — a shipped test double, not scaffolding (delegated-review ticket 04).
 *
 * It replays a short event sequence with a delay multiplier and answers, in seconds and for free,
 * every question about the lifecycle that a real review answers in minutes and for money:
 * cancellation, ordering, terminal absorption and the deadline. In the prototype this design came
 * from it was the single highest-leverage piece, which is why it ships rather than being thrown away
 * (spec user story 27).
 *
 * It is selected through `DELIVERER_REVIEW_BACKEND=scripted` and scripted through
 * `DELIVERER_REVIEW_SCRIPT` — the same environment the server already reads for effort and model.
 * With no script given it replays a short, ordinary review, so the double is useful with one
 * variable set.
 */
import type { ReviewBackend, ReviewRequest, ReviewRun } from "./backend.ts";
import type { ReviewEvent, ReviewSpend } from "./review-state.ts";

export const SCRIPTED_BACKEND_ID = "scripted";

/**
 * One scripted event. `afterMs` is the delay BEFORE it, relative to the previous event, so a script
 * reads as a timeline rather than as a set of absolute offsets to keep consistent by hand.
 *
 * It carries `ReviewSpend` whole, on the terminal kinds as much as the rest, because a double that
 * cannot produce a shape the real backend produces is useless for exactly the case you reach for it
 * in — and the spend on a FAILED round is the half most likely to be got wrong.
 */
export interface ScriptedEvent extends ReviewSpend {
  afterMs?: number;
  kind: "preparing" | "running" | "text" | "completed" | "failed";
  text?: string;
  summary?: string;
  verdict?: string;
  findings?: number;
  message?: string;
}

export interface Script {
  /** every delay is multiplied by this — one knob to slow a whole script down, or speed it up */
  delayMultiplier?: number;
  events: ScriptedEvent[];
}

const KINDS = ["preparing", "running", "text", "completed", "failed"];

/** A short, ordinary review: prepares, runs, says something, finds nothing, finishes. */
export const DEFAULT_SCRIPT: Script = {
  events: [
    { afterMs: 10, kind: "preparing" },
    { afterMs: 10, kind: "running" },
    { afterMs: 10, kind: "text", text: "reviewing the change request" },
    {
      afterMs: 10,
      kind: "completed",
      summary: "Scripted review: no findings.",
      verdict: "approved",
      findings: 0,
      // A spend, rather than the zero this used to report: a default script that publishes nothing
      // to read cannot show whether the fields reach a caller at all. The provider says `scripted`
      // so nobody mistakes these for a measurement, and the duration is the timeline above.
      costUsd: 0.42,
      turns: 1,
      inputTokens: 1_200,
      outputTokens: 340,
      cacheReadTokens: 8_600,
      cacheCreationTokens: 2_400,
      agentDurationMs: 40,
      model: "scripted-model",
      provider: "scripted",
      canonicalModel: "scripted-model",
    },
  ],
};

/**
 * Parse a script from its environment variable. Throws with the specific defect named: a malformed
 * script is a configuration error the caller must see, never a review that quietly does nothing.
 */
export function parseScript(raw: string | null): Script {
  if (raw === null || raw.trim() === "") return DEFAULT_SCRIPT;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `the scripted review backend's script is not valid JSON: ${(error as Error).message}`,
      { cause: error },
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      'the scripted review backend\'s script must be an object of the form {"events": [...]}',
    );
  }
  const candidate = parsed as { events?: unknown; delayMultiplier?: unknown };
  if (!Array.isArray(candidate.events) || candidate.events.length === 0) {
    throw new Error("the scripted review backend's script must carry a non-empty `events` array");
  }
  const events: ScriptedEvent[] = [];
  candidate.events.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`scripted event ${index} is not an object`);
    }
    const event = entry as ScriptedEvent;
    if (!KINDS.includes(String(event.kind))) {
      throw new Error(
        `scripted event ${index} has kind "${String(event.kind)}"; expected one of ${KINDS.join(", ")}`,
      );
    }
    if (event.kind === "text" && typeof event.text !== "string") {
      throw new Error(`scripted event ${index} is a text event with no \`text\``);
    }
    if (event.kind === "failed" && typeof event.message !== "string") {
      throw new Error(`scripted event ${index} is a failed event with no \`message\``);
    }
    events.push(event);
  });
  let delayMultiplier = 1;
  if (candidate.delayMultiplier !== undefined && candidate.delayMultiplier !== null) {
    const value = Number(candidate.delayMultiplier);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `the scripted review backend's delayMultiplier must be a non-negative number, got ` +
          `"${String(candidate.delayMultiplier)}"`,
      );
    }
    delayMultiplier = value;
  }
  return { events, delayMultiplier };
}

/**
 * The spend a script named, lifted out of the event that named it. Written out field by field
 * rather than spread wholesale, so a script's `kind` and `afterMs` cannot ride into the lifecycle's
 * vocabulary — and so adding a field to `ReviewSpend` fails here until this double reports it too.
 * What a script left out stays absent, exactly as it does on a real round that never measured it.
 */
const scriptedSpend = (event: ScriptedEvent): ReviewSpend => ({
  costUsd: event.costUsd,
  turns: event.turns,
  inputTokens: event.inputTokens,
  outputTokens: event.outputTokens,
  cacheReadTokens: event.cacheReadTokens,
  cacheCreationTokens: event.cacheCreationTokens,
  agentDurationMs: event.agentDurationMs,
  model: event.model,
  provider: event.provider,
  canonicalModel: event.canonicalModel,
});

const toEvent = (event: ScriptedEvent): ReviewEvent => {
  switch (event.kind) {
    case "preparing":
      return { type: "preparing" };
    case "running":
      return { type: "running" };
    case "text":
      return { type: "text", text: event.text ?? "" };
    case "failed":
      return {
        ...scriptedSpend(event),
        type: "failed",
        message: event.message ?? "the scripted review failed",
      };
    case "completed":
    default:
      return {
        ...scriptedSpend(event),
        type: "completed",
        summary: event.summary,
        verdict: event.verdict,
        findings: event.findings,
      };
  }
};

export function createScriptedBackend(script: Script): ReviewBackend {
  const multiplier = script.delayMultiplier ?? 1;
  return {
    id: SCRIPTED_BACKEND_ID,
    start(_request: ReviewRequest, emit: (event: ReviewEvent) => void): ReviewRun {
      let index = 0;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let stopped = false;

      const step = (): void => {
        if (stopped) return;
        const entry = script.events[index];
        if (entry === undefined) return;
        index += 1;
        emit(toEvent(entry));
        schedule();
      };

      const schedule = (): void => {
        if (stopped) return;
        const next = script.events[index];
        if (next === undefined) return;
        timer = setTimeout(step, Math.max(0, (next.afterMs ?? 0) * multiplier));
      };

      schedule();

      return {
        abort() {
          // Deliberately silent about WHY: the lifecycle owns the cancellation and deadline events,
          // so a backend that emitted its own would be a second source of truth for the same fact.
          stopped = true;
          if (timer !== null) clearTimeout(timer);
          timer = null;
        },
      };
    },
  };
}
