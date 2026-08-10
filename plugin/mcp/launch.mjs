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
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The floor unbuilt execution implies: type stripping is on by default from 22.18.0 / 23.6.0. */
const NODE_FLOOR = "^22.18.0 || >=23.6.0";

/** Where the install hook puts the source, relative to the persistent data directory. */
const SERVER_ENTRY = ["server", "index.ts"];

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
 * a new user runs first. So the launcher waits for the hook rather than racing it. It never installs
 * anything itself: one installer means no lock, no concurrent `npm`, and one place where the decision
 * to reinstall lives.
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

const waitedFrom = Date.now();
while (!installed() && Date.now() - waitedFrom < INSTALL_WAIT_MS) {
  await new Promise((resolve) => setTimeout(resolve, INSTALL_POLL_MS));
}
if (!installed()) {
  die(
    `nothing is installed at ${dataDir} after waiting ` +
      `${Math.round((Date.now() - waitedFrom) / 1000)}s (looked for ${SERVER_ENTRY.join("/")} ` +
      `beside node_modules and the completed-install stamp ${INSTALL_STAMP.join("/")}). ` +
      "The plugin's SessionStart install hook " +
      "(hooks/install-mcp-server.sh) puts them there on first use; start a new session, and read " +
      "that hook's own output if this repeats.",
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
