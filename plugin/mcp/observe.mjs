#!/usr/bin/env node
/**
 * The **observer**'s entry point as `hooks/observe-run.sh` spawns it — the second of the two files
 * that run out of the plugin directory, beside `launch.mjs` (run-observation ticket 04).
 *
 * ```
 * node mcp/observe.mjs <session-id> <path to that session's record.jsonl>
 * ```
 *
 * It does four things and then gets out of the way:
 *
 *  1. **Detaches itself.** Own session, own process group, stdio closed. A child holding the
 *     hook's stdout open keeps the host waiting on the pipe long after the hook has exited — the
 *     run waiting on the observer, arriving through a door nobody would look at. Node's
 *     `detached: true` is a real `setsid(2)`, which is what `setsid(1)` would have given on Linux
 *     and does not exist at all on macOS. The host's own `async` hook option is deliberately NOT
 *     used: that backgrounds a hook but leaves the host tracking it and delivering its later
 *     output into the session as an attachment, which is the one thing an out-of-band observer may
 *     never do (D1).
 *  2. **Stands in the plugin's data directory** (D3). A hook is spawned in the project's own
 *     directory, and the observer is alive while an `implementer` is committing to the **epic
 *     branch** — so a working directory inside that tree is the one thing between an unrestricted
 *     process and a stray write inside somebody's change request. This is its own first act,
 *     because nothing hands it one.
 *  3. **Waits for the install rather than racing it**, exactly as `launch.mjs` does and for the
 *     reason [ADR-0003](../../docs/adrs/0003-the-launcher-waits-for-the-install-rather-than-racing-it.md)
 *     gives: the host spawns hooks on the first prompt of a cold host while the `SessionStart`
 *     install is still arriving. It starts NOTHING itself — this hook always runs after that one
 *     began, so there is nothing here to kick off and session-start time does not grow.
 *  4. **Imports the published observer** out of the data directory, never out of the plugin's own,
 *     so the Agent SDK the install put there resolves as an ESM sibling
 *     ([ADR-0002](../../docs/adrs/0002-dependencies-and-source-are-installed-into-the-plugins-data-directory.md)).
 *
 * Plain `.mjs`, not TypeScript, for `launch.mjs`'s own reason: it is the file that checks whether
 * this Node can run TypeScript at all, so it cannot itself depend on the answer.
 *
 * **Nothing here can reach the run.** Every failure ends in a line written into the announcement
 * directory — the line the human was going to be shown anyway (D29) — and an exit code nobody
 * reads.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The floor unbuilt execution implies: type stripping is on by default from 22.18.0 / 23.6.0. */
const NODE_FLOOR = "^22.18.0 || >=23.6.0";

/** Where the install hook publishes the observer, relative to the persistent data directory. */
const OBSERVER_ENTRY = ["observer", "observer.ts"];

/** The hook's completed-install marker, which is what `launch.mjs` gates on and why. */
const INSTALL_STAMP = [".deliverer-deps-stamp", "package.json"];

/**
 * Where a line waiting to be printed goes. **This is `observer/announce.ts`'s layout**, repeated
 * here because the one failure this file has to report — a published tree that never arrived — is
 * the failure that happens before that module can be imported at all.
 */
const ANNOUNCE = ["observations", ".announce"];

/**
 * How long to wait for the install.
 *
 * Far more generous than `launch.mjs`'s 25 s, because the clock that bounded that one is not in
 * play: there is no MCP handshake here and no session waiting on this process. A cold `npm ci` on
 * a slow link is the case it covers, and paying two minutes for it costs a detached process two
 * minutes.
 */
const INSTALL_WAIT_MS = envNumber("DELIVERER_OBSERVER_INSTALL_WAIT_MS", 120_000);
const INSTALL_POLL_MS = 500;

/** Set on the re-spawn, so the detached copy knows it is the detached copy. */
const DETACHED = "DELIVERER_OBSERVER_DETACHED";

function envNumber(name, fallback) {
  // Unset and set-but-empty both mean "no override", told apart from a real `0` — `launch.mjs`
  // draws the same distinction and for the same reason: `Number("")` is `0`.
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const [sessionId, recordPath] = process.argv.slice(2);
if (sessionId === undefined || recordPath === undefined) {
  process.stderr.write(
    "deliverer observer: usage: node mcp/observe.mjs <session-id> <record.jsonl>\n",
  );
  process.exit(1);
}

/* ─────────────────────────────────── 1. detach, once ─────────────────────────────────── */

if (process.env[DETACHED] !== "1") {
  // `unref` as well as `detached`, so this process can exit the moment the child is spawned rather
  // than waiting on it. What is left behind is a process in its own session with no descriptor
  // pointing back at the hook's pipes.
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), sessionId, recordPath], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, [DETACHED]: "1" },
  });
  child.unref();
  process.exit(0);
}

/* ──────────────────────── 2. stand outside every repository (D3) ──────────────────────── */

const dataDir = process.env.CLAUDE_PLUGIN_DATA;
if (dataDir === undefined || dataDir === "") {
  // Nothing can be said about this: the announcement directory is inside the data directory, so
  // with no data directory there is nowhere to write a line and nowhere to write a debrief. The
  // `SessionStart` install hook already warns about the same absence on its own stderr, which is
  // where a reader is sent.
  process.exit(1);
}
try {
  mkdirSync(dataDir, { recursive: true });
  process.chdir(dataDir);
} catch {
  process.exit(1);
}

/** Writes both halves of one announcement, in `observer/announce.ts`'s own format. */
const announce = (systemMessage) => {
  try {
    const directory = join(dataDir, ...ANNOUNCE);
    mkdirSync(directory, { recursive: true });
    const text = `${JSON.stringify({ systemMessage })}\n`;
    writeFileSync(join(directory, `${sessionId}.stop.json`), text, "utf8");
    writeFileSync(join(directory, `${sessionId}.prompt.json`), text, "utf8");
  } catch {
    // Nowhere left to report anything to. The run is untouched either way, which is the property
    // that matters.
  }
};

/** How to turn it off, in the words `observer/announce.ts` uses. Repeated for the same reason. */
const SWITCH_OFF =
  'To stop observing runs: /plugin → deliverer → "Observe runs". It is on by default, and ' +
  "turning it off stops the whole thing — no process, no trace and no debrief.";

const giveUp = (what) => {
  announce(
    `deliverer could not observe your run, so there is no debrief of it: ${what}\n\n` +
      "Your run itself was not affected in any way — observation runs outside it, in its own " +
      "process, and nothing it does reaches the run.\n\n" +
      SWITCH_OFF,
  );
  releaseLock();
  process.exit(1);
};

/* ────────────────────────── one observer per session, and no more ────────────────────────── */

/**
 * The lock that keeps two observers off one run.
 *
 * The hook's own marker already stops a second prompt asking, so this covers what that cannot: two
 * prompts submitted before the first observer had written anything, and a session resumed twice.
 * `wx` is the whole mechanism — the create either wins or throws — and the pid inside is what
 * makes a lock whose holder is gone not a lock, the same liveness rule
 * `hooks/install-mcp-server.sh` uses for the install's.
 */
const lockPath = join(dataDir, "observations", ".sessions", `${sessionId}.lock`);

function takeLock() {
  mkdirSync(join(dataDir, "observations", ".sessions"), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      writeFileSync(lockPath, `${process.pid}\n`, { encoding: "utf8", flag: "wx" });
      return true;
    } catch {
      const holder = Number(readFileSync(lockPath, "utf8").trim());
      if (Number.isInteger(holder) && holder > 0 && alive(holder)) return false;
      // A holder that is gone, or a lock with no readable pid in it: reclaimed once, and if the
      // second attempt loses too then somebody else won the race fairly and this copy stands down.
      rmSync(lockPath, { force: true });
    }
  }
  return false;
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try {
    if (readFileSync(lockPath, "utf8").trim() === String(process.pid)) rmSync(lockPath);
  } catch {
    // Somebody else's lock, or none. Either way there is nothing here to release.
  }
}

if (!takeLock()) {
  // Not a failure and not worth a line: an observer for this session is already running, and it is
  // the one that will write the debrief.
  process.exit(0);
}

/* ───────────────────── 3. wait for the install rather than racing it ───────────────────── */

if (process.features.typescript !== "strip" && process.features.typescript !== "transform") {
  giveUp(
    `this Node (${process.version}) does not strip TypeScript types, so the observer cannot run ` +
      `unbuilt. It needs Node ${NODE_FLOOR} with type stripping enabled.`,
  );
}

const entry = join(dataDir, ...OBSERVER_ENTRY);
const stamp = join(dataDir, ...INSTALL_STAMP);
const waitedFrom = Date.now();
while (!existsSync(entry) && Date.now() - waitedFrom < INSTALL_WAIT_MS) {
  await new Promise((resolve) => setTimeout(resolve, INSTALL_POLL_MS));
}
if (!existsSync(entry)) {
  giveUp(
    `the plugin's own setup has not published the observer's source to ${entry} yet, and it was ` +
      `waited on for ${Math.round((Date.now() - waitedFrom) / 1000)}s. That is the plugin's ` +
      "SessionStart hook (hooks/install-mcp-server.sh); its output is in this session's logs and " +
      "says why. The next session observes as usual once it has succeeded.",
  );
}

/**
 * What the observation lost before it began, folded into the debrief's own "what this observation
 * lost" section (D29).
 *
 * A published source with no completed install beside it is a real state on a cold host, and today
 * it costs nothing at all — the mechanical half imports nothing but Node's own builtins. It is
 * reported anyway, because the half that judges resolves the Agent SDK from exactly there.
 */
const startupLosses = existsSync(stamp)
  ? []
  : [
      `the plugin's dependencies were not fully installed when this observation started (no ` +
        `completed-install stamp at ${stamp}), so anything the observer needs from them was ` +
        `unavailable to it`,
    ];

/* ───────────────────────────── 4. run the published observer ───────────────────────────── */

try {
  const { observeRun } = await import(pathToFileURL(entry).href);
  await observeRun({ recordPath, dataDirectory: dataDir, sessionId, startupLosses });
} catch (error) {
  giveUp(
    `the observer stopped with an error (${error instanceof Error ? error.message : error}). ` +
      "This is a fault in the plugin's own diagnostic and nothing to do with your run.",
  );
}

// Nothing reads this process's exit code — the hook that started it returned long ago — and that
// is the point.
releaseLock();
process.exit(0);
