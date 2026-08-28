/**
 * Which plugin a **run** used (run-observation ticket 03; D16, and claim C4 as its triage settled
 * it).
 *
 * `plugin.json` carries no version field and there is no release step, so the commit of the
 * checkout the host installed is the only thing that dates a **debrief**. Two routes reach it, and
 * they are not the same claim — which is why every answer here carries where it came from and the
 * debrief prints that beside the figure:
 *
 *  - **The run's own**, and the first answer. The skill preamble the host writes into a run's very
 *    first entries names the installed plugin's directory — `…/plugins/cache/<marketplace>/
 *    deliverer/cbb4838aa016/skills/refine` — and that directory's NAME is the commit. All eight
 *    runs on the machine this was written against carry it, refinements and deliveries alike. User
 *    story 20 asks for the commit the run USED, and this is the only route that answers it.
 *  - **The plugin installed now**, and the fallback D16 described. A run resumed by prose has no
 *    skill preamble, so its records name no directory; the host's own install bookkeeping still
 *    says what is installed on this machine at the moment of reading. That is a different fact and
 *    the debrief says so rather than passing it off as the first.
 *
 * **Nothing here runs `git`.** The installed plugin is not a checkout — it is a directory named by
 * a commit, with the full sha beside it in the host's bookkeeping — so both routes read a shape
 * the host owns, which makes them **claim**s in the glossary's sense exactly as the record format
 * is. Losing either costs the debrief one line and never the debrief (ADR-0017).
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { asArray, asObject, objectField, PLUGIN_NAME, stringField } from "./records.ts";

/** Where a commit was read from. The debrief labels its line with this; the two differ in kind. */
export type CommitSource = "the run's own" | "the plugin installed now" | "neither";

export interface PluginCommit {
  /** the commit as it was read — short from a directory name, full from the bookkeeping */
  readonly commit: string | undefined;
  readonly source: CommitSource;
  /** the whole line the debrief prints, already in the reader's words */
  readonly line: string;
}

/**
 * The installed plugin's directory inside the host's plugin cache, whose name is the commit.
 *
 * Hex and 7–40 characters, because that is what a commit looks like and a directory that is not
 * one is not evidence of anything. A host that renames that directory costs this route its answer
 * and reaches the fallback below, which is the degradation ADR-0017 requires.
 *
 * **The path in front of the commit is captured too** (run-observation ticket 05), and it is
 * optional. The whole directory is what the synthesis reads the run's own text out of, so it is
 * read off the same match rather than from a second one — a debrief that named one commit and
 * quoted a different tree would be worse than one that quoted nothing. Optional because the commit
 * is ticket 03's answer and must not start depending on a path: a record naming
 * `/deliverer/<commit>/` and nothing before it still dates the build, and the tree it does not name
 * falls to `installedDirectory` below.
 */
const COMMIT_DIRECTORY = new RegExp(
  `((?:/[^/\\s"']+)*/${PLUGIN_NAME}/([0-9a-fA-F]{7,40}))/`,
);

/**
 * The installed plugin directory named in a piece of a record: where it is, and the commit its name
 * is.
 */
export interface PluginDirectory {
  /** the installed plugin's root — `…/<marketplace>/deliverer/<commit>` — with no trailing slash */
  readonly directory: string;
  readonly commit: string;
}

export function pluginDirectoryInText(text: string): PluginDirectory | undefined {
  const found = COMMIT_DIRECTORY.exec(text);
  if (found?.[1] === undefined || found[2] === undefined) return undefined;
  return { directory: found[1], commit: found[2] };
}

/** The commit named by the plugin directory in a piece of a record, or `undefined`. */
export function commitInText(text: string): string | undefined {
  return pluginDirectoryInText(text)?.commit;
}

/**
 * The host's own record of what it installed, beside the plugin's data directory.
 *
 * The data directory is `<config>/plugins/data/<plugin>-<marketplace>` and the bookkeeping is
 * `<config>/plugins/installed_plugins.json`, so two levels up is the whole of the derivation. No
 * second notion of where the host keeps its files is invented here: absent or unreadable, this
 * answers `undefined` and the caller says the commit is unknown.
 */
async function installedNow(
  dataDirectory: string,
): Promise<{ commit: string | undefined; directory: string | undefined }> {
  const nothing = { commit: undefined, directory: undefined };
  const bookkeeping = join(dataDirectory, "..", "..", "installed_plugins.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(bookkeeping, "utf8"));
  } catch {
    return nothing;
  }
  const plugins = objectField(asObject(parsed), "plugins");
  if (plugins === undefined) return nothing;
  // The key is `<plugin>@<marketplace>` and the data directory is `<plugin>-<marketplace>`, so the
  // directory the caller was given picks its own entry out. A fork installed beside this plugin
  // therefore never answers for it.
  const wanted = basename(dataDirectory);
  const installs =
    Object.entries(plugins).find(([key]) => key.replace("@", "-") === wanted)?.[1] ??
    Object.entries(plugins).find(([key]) => key.split("@")[0] === PLUGIN_NAME)?.[1];
  const commits = new Set<string>();
  const directories = new Set<string>();
  for (const install of asArray(installs) ?? []) {
    const entry = asObject(install);
    const commit = stringField(entry, "gitCommitSha") ?? stringField(entry, "version");
    if (commit !== undefined) commits.add(commit);
    const directory = stringField(entry, "installPath");
    if (directory !== undefined) directories.add(directory);
  }
  // One project's install and another's may be different builds of the same plugin. Reporting one
  // of two would be a guess, and a guess is worse than the line the caller writes for `undefined`.
  // Both fields answer that way, and independently: the same tree can be recorded under two
  // commits, and the same commit can stand in two trees.
  return {
    commit: commits.size === 1 ? [...commits][0] : undefined,
    directory: directories.size === 1 ? [...directories][0] : undefined,
  };
}

export async function installedCommit(dataDirectory: string): Promise<string | undefined> {
  return (await installedNow(dataDirectory)).commit;
}

/**
 * Where the plugin installed on this machine **now** stands — the fallback the synthesis reads its
 * text out of when the tree the run itself ran is gone (run-observation ticket 05).
 *
 * A different fact from the run's own directory, exactly as `installedCommit` is a different fact
 * from the commit the records name, and the debrief says which of the two it read. One commit's
 * tree stands on the machine this was written against, beside a marker naming it as in use, so
 * nothing promises the tree a replayed run used survived an update — and a line quoted from a file
 * that has since changed is worse than no line at all.
 */
export async function installedDirectory(dataDirectory: string): Promise<string | undefined> {
  return (await installedNow(dataDirectory)).directory;
}

export interface PluginCommitInput {
  /** the commit this run's own records name, where they name one */
  readonly inRecords: string | undefined;
  readonly dataDirectory: string;
}

export async function resolvePluginCommit(input: PluginCommitInput): Promise<PluginCommit> {
  if (input.inRecords !== undefined) {
    return {
      commit: input.inRecords,
      source: "the run's own",
      line:
        `\`${input.inRecords}\` — the commit the run itself used, read from the plugin directory ` +
        `its own records name. Not obtained by running \`git\`: the installed plugin is a ` +
        `directory named by a commit rather than a checkout.`,
    };
  }
  const installed = await installedCommit(input.dataDirectory);
  if (installed !== undefined) {
    return {
      commit: installed,
      source: "the plugin installed now",
      line:
        `\`${installed}\` — **not the commit the run used.** This run's records name no plugin ` +
        `directory, which is what a run resumed by prose rather than by a \`/deliverer:\` command ` +
        `leaves, so what is reported instead is the plugin installed on that machine at the ` +
        `moment the debrief was written, read from the host's own install bookkeeping.`,
    };
  }
  return {
    commit: undefined,
    source: "neither",
    line:
      "unknown — this run's records name no plugin directory and the host's install bookkeeping " +
      "could not be read, so nothing here dates the build. Nothing runs `git` to find out.",
  };
}
