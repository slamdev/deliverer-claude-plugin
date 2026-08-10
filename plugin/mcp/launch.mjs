#!/usr/bin/env node
/**
 * The MCP server's entry point as `plugin/.mcp.json` spawns it — and the ONE file of the server that
 * runs out of the plugin directory (delegated-review ticket 03).
 *
 * It exists because the server must not run from here. Its dependencies are installed into the
 * plugin's persistent data directory by the `SessionStart` hook, and the source is copied in beside
 * them, because:
 *
 *  - the documented environment-variable approach for pointing Node at modules installed elsewhere
 *    (`NODE_PATH`) resolves CommonJS only — it does **not** resolve ESM imports, which is what this
 *    server uses; and
 *  - the plugin's own directory may be a read-only cache, so nothing may be written into it.
 *
 * `${CLAUDE_PLUGIN_DATA}` is deliberately not referenced in `plugin/.mcp.json`: whether the host
 * substitutes that variable at config-expansion time is unmeasured, whereas its presence in the
 * environment of every process the host spawns IS measured (delegated-review ticket 02). So this
 * launcher reads it at runtime, and the shipped configuration stays install-agnostic.
 *
 * Plain `.mjs`, not TypeScript: it is the file that checks whether this Node can run TypeScript at
 * all, so it cannot itself depend on the answer.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The floor unbuilt execution implies: type stripping is on by default from 22.18.0 / 23.6.0. */
const NODE_FLOOR = "^22.18.0 || >=23.6.0";

/** Where the install hook puts the source, relative to the persistent data directory. */
const SERVER_ENTRY = ["server", "index.ts"];

/**
 * The install hook, relative to THIS FILE — the same script the host runs at `SessionStart`, and the
 * only thing this launcher ever runs to install anything (see the wait's own comment below).
 *
 * Resolved from `import.meta.url` rather than `CLAUDE_PLUGIN_ROOT` for the reason the whole file is
 * built around: that variable reaches the hook COMMAND, not necessarily this process's environment.
 * The hook derives its own `PLUGIN_ROOT` from `BASH_SOURCE` for the same reason, so the two agree.
 */
const INSTALL_HOOK = ["..", "hooks", "install-mcp-server.sh"];

/**
 * The hook's completed-install marker, relative to the same directory (`hooks/install-mcp-server.sh`
 * keeps its copy of the bundled dependency manifest here).
 *
 * Gating on this rather than on `node_modules` is what makes the wait mean "a COMPLETED install":
 * the stamp is removed before an install starts and written only after one succeeds, whereas
 * `node_modules` exists throughout an in-progress `npm install`. An update that changes the bundled
 * manifest reinstalls into the existing tree in place, so on a warm host the old directory and a
 * previous session's copied source would both be present while the modules this server statically
 * imports are being rewritten under it — and `import(entry)` would fail with `ERR_MODULE_NOT_FOUND`,
 * the exact silent no-review-tool outcome this wait exists to prevent.
 */
const INSTALL_STAMP = [".deliverer-deps-stamp", "package.json"];

/**
 * How long to wait for the install hook, and why waiting is necessary at all.
 *
 * **Measured (delegated-review ticket 03, Claude Code 2.1.220): the host spawns this server BEFORE the
 * `SessionStart` install hook has finished.** On a cold host the first session therefore reaches this
 * file while `node_modules` and the copied source are still arriving — and without a wait, that
 * session's review tool is simply absent, which is a silent packaging failure for exactly the session
 * a new user runs first. So the launcher waits for the hook rather than racing it.
 *
 * It also STARTS that hook when the wait begins with nothing installed, because waiting alone assumes
 * an install is coming and there is a measured case in which none is (Claude Code 2.1.226): a plugin
 * installed from inside a running session has its MCP server spawned immediately, while `SessionStart`
 * fires only at `startup`, `resume`, `clear` and `compact` — never on install. That session waits the
 * full bound for a hook that will not run, and the failure lands in the middle of the documented
 * install flow. What is started here is the HOOK ITSELF, never `npm` directly: the decision to
 * reinstall stays in one place, and `acquire_install_lock` already serialises whatever else is
 * installing into this data directory, so a launcher and a hook racing is the case that lock covers.
 *
 * 25 s is chosen against the OTHER clock in play — the host's own MCP handshake timeout, which is not
 * ours to extend. Waiting past it converts a slow install into a failed server either way, so the
 * launcher gives up first and says what it was waiting for. A session that loses that race still
 * leaves a correct install behind, so the next session finds it warm.
 *
 * `DELIVERER_REVIEW_INSTALL_WAIT_MS` overrides it: upwards for a host where a cold `npm install` is
 * genuinely slower than the handshake, and downwards for the suite's own rig, which drives this file
 * directly and must not pay a 25 s wait to prove the refusal.
 */
const INSTALL_WAIT_DEFAULT_MS = 25_000;
const INSTALL_POLL_MS = 250;

// A var that was never set and one set to the EMPTY STRING are the same fact here — both mean "no
// override" — and they have to be told apart from a real `0`, because `Number("")` is `0`: a
// set-but-empty var would otherwise switch the cold-host wait off entirely and turn the race this
// block exists for back on. `server/config.ts`'s `raw()` draws the same distinction.
const waitRaw = process.env.DELIVERER_REVIEW_INSTALL_WAIT_MS;
const waitOverride = waitRaw === undefined || waitRaw.trim() === "" ? Number.NaN : Number(waitRaw);
const INSTALL_WAIT_MS =
  Number.isFinite(waitOverride) && waitOverride >= 0 ? waitOverride : INSTALL_WAIT_DEFAULT_MS;

// Whether to start the hook at all. Drawn the same way as the wait above — unset and empty both mean
// "no override", and only a literal `0` switches it off — and it exists for the same consumer: a rig
// that drives this file to prove the refusal must not start a real `npm ci` to do it.
const selfInstallRaw = process.env.DELIVERER_REVIEW_SELF_INSTALL;
const SELF_INSTALL = selfInstallRaw === undefined || selfInstallRaw.trim() !== "0";

const die = (message) => {
  process.stderr.write(`deliverer tools server: ${message}\n`);
  process.exit(1);
};

const dataDir = process.env.CLAUDE_PLUGIN_DATA;
if (dataDir === undefined || dataDir === "") {
  // Deliberately says nothing about installing: this is the host not telling us where the plugin's
  // persistent directory is, which no re-run of anything fixes.
  die(
    "CLAUDE_PLUGIN_DATA is not set in this process's environment, so the plugin's persistent data " +
      "directory cannot be resolved. This server is spawned by the host from the plugin's " +
      "MCP configuration; running it by hand needs CLAUDE_PLUGIN_DATA set to that directory.",
  );
}

const entry = join(dataDir, ...SERVER_ENTRY);
const installed = () =>
  existsSync(entry) &&
  existsSync(join(dataDir, "node_modules")) &&
  existsSync(join(dataDir, ...INSTALL_STAMP));

const installHook = join(dirname(fileURLToPath(import.meta.url)), ...INSTALL_HOOK);

/**
 * What this launcher did about a missing install, which is the only thing the failure below reports
 * that a reader cannot see for themselves. "The hook never ran" and "the hook ran and failed" are
 * the same empty directory from outside, and telling them apart is most of the diagnosis.
 *
 * It starts at the state nothing below overrides: `off` when the fallback is switched off, and
 * otherwise `missing`, which is what remains true when the hook is not where this file expects it.
 */
let installState = SELF_INSTALL ? "missing" : "off";
let installErrorText = "";

/** Resolves `null` once the hook has exited, or the spawn error if it could not be run at all. */
const runInstallHook = (command, args) =>
  new Promise((resolve) => {
    // stdout is IGNORED rather than inherited, because fd 1 of THIS process is the JSON-RPC
    // transport the host is speaking to. The hook is careful to send npm's output to stderr, but a
    // child that can reach this stdout at all is one stray `echo` away from corrupting the protocol
    // — and a corrupted handshake is far harder to read than a missing line of install output.
    // stderr DOES inherit: the host logs it beside this server's own errors, which is exactly where
    // the failure below tells a reader to look, and until now there was nothing there to find.
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "inherit"] });
    // The install must never hold a session open: unreferenced, it cannot keep this process alive
    // past the work that actually matters, and it is not killed either (see the deadline below).
    child.unref();
    // A spawn that never happened emits `error`, and MAY also emit `exit` — whose order against it
    // Node does not promise. Settling on whichever arrived first would sometimes report a failed
    // spawn as a hook that ran, and would skip the retry below, which is decided by the error code.
    // So `exit` yields a tick to any `error` behind it; `resolve` after the first call is a no-op.
    let spawnError = null;
    child.on("error", (error) => {
      spawnError = error;
      resolve(error);
    });
    child.on("exit", () => setImmediate(() => resolve(spawnError)));
  });

if (SELF_INSTALL && !installed() && existsSync(installHook)) {
  installState = "running";
  // Started, deliberately NOT awaited: the poll loop below already watches the thing that decides
  // this — a completed install appearing in the data directory — and that install may equally be
  // the `SessionStart` hook's, with this one blocked behind it on the lock. Waiting on the child
  // rather than on the gate would make the launcher slower than the fact it is waiting for.
  void (async () => {
    let failure = await runInstallHook(installHook, []);
    // An archive-based install can drop the executable bit the repository sets on the hook, which
    // takes the host's own `SessionStart` run down with it — so this is the one case in which the
    // launcher can recover an install nothing else can. The shebang names bash; so does the retry.
    if (failure && (failure.code === "EACCES" || failure.code === "ENOEXEC")) {
      failure = await runInstallHook("bash", [installHook]);
    }
    installErrorText = failure ? failure.message : "";
    installState = failure ? "unstartable" : "ran";
  })();
}

// The wait ends early once the hook STARTED HERE has finished without producing an install, because
// the remaining seconds are then being spent on nothing: the bound exists to cover an install that
// is still arriving, and on an offline or npm-less host there is no longer one. Paying it in full
// would stall every session on such a host for the whole handshake budget before saying so.
//
// What that gives up: a second installer racing this one, whose own `npm` succeeds after this one's
// failed. It needs two concurrent installers AND a failure that is transient between them, and the
// far commoner shape — no network, no npm — fails for both. `missing` and `off` do NOT end early;
// nothing was started here, so the `SessionStart` hook the bound was written for may still be going.
const installerSettled = () => installState === "ran" || installState === "unstartable";

const waitedFrom = Date.now();
while (!installed() && !installerSettled() && Date.now() - waitedFrom < INSTALL_WAIT_MS) {
  await new Promise((resolve) => setTimeout(resolve, INSTALL_POLL_MS));
}
if (!installed()) {
  // One sentence per state, and they are not interchangeable: each names a different next move.
  const outcome = {
    running:
      "The install hook (hooks/install-mcp-server.sh) was started from here because nothing had " +
      "installed the server yet, and it is still running — it is left alone rather than killed, " +
      "since killing it mid-install would strand its lock. Start a new session once it settles.",
    ran:
      "The install hook (hooks/install-mcp-server.sh) was run from here and exited without " +
      "producing them. Its own output is above this line and says why.",
    unstartable:
      `The install hook at ${installHook} could not be run (${installErrorText}), so nothing ` +
      "installed the server. Check that the file is present and executable.",
    missing:
      `No install hook was found at ${installHook}, so this launcher could not install the ` +
      "server itself. The plugin looks incompletely installed; reinstall it.",
    off:
      "Installing from here is switched off (DELIVERER_REVIEW_SELF_INSTALL=0), so only the " +
      "plugin's SessionStart install hook (hooks/install-mcp-server.sh) installs anything; start " +
      "a new session, and read that hook's own output if this repeats.",
  }[installState];
  die(
    `nothing is installed at ${dataDir} after waiting ` +
      `${Math.round((Date.now() - waitedFrom) / 1000)}s (looked for ${SERVER_ENTRY.join("/")} ` +
      `beside node_modules and the completed-install stamp ${INSTALL_STAMP.join("/")}). ` +
      outcome,
  );
}

// `strip` is what a Node that can run this server reports; `false` means type stripping was turned
// off (--no-strip-types) and `undefined` means this Node is older than the floor. Checked here so
// the failure names the requirement instead of arriving as a syntax error inside a `.ts` file.
if (process.features.typescript !== "strip" && process.features.typescript !== "transform") {
  die(
    `this Node (${process.version}) does not strip TypeScript types, so the server cannot run ` +
      `unbuilt. The plugin needs Node ${NODE_FLOOR} with type stripping enabled ` +
      "(process.features.typescript === 'strip').",
  );
}

await import(pathToFileURL(entry).href);
