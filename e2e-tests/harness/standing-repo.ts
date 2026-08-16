/**
 * The standing repo: one private repository the refine test clones and never writes back to
 * (end-to-end-tests ticket 02).
 *
 * It can be standing at all because refinement's two **writers** were checked and neither commits
 * nor pushes. Everything a run produces stays in the working tree it cloned, so no two runs can
 * reach each other and no repository needs creating or destroying per run — which is the whole
 * difference from the **throwaway repo** a delivery needs (`./throwaway-repo.ts`).
 *
 * **The harness owns its contents.** Each run confirms it exists and that it matches the fixture on
 * disk, creating it when it is absent and force-pushing the fixture when it has drifted. Nobody
 * provisions anything by hand, and no test can run against a fixture somebody changed months ago.
 * The comparison is between TREES and not commits: a tree hash is the content and nothing else, so
 * a rebuild of the same files is not drift, and a run does not rewrite history for a timestamp.
 *
 * **It carries no epic.** The fixture's is a delivery's, and a tracker root that already held one
 * would let a refinement publish its own on top of it (`./fixture.ts`).
 *
 * **It is named for the test and the fixture, never for the run.** A repository that outlives every
 * run cannot take the run-identifying name a throwaway one will, and two fixtures under one test
 * get one repository each.
 *
 * The git plumbing under all of that — the credentials, the branch, the fixture's own commit — is
 * `./forge.ts`, shared with the repository a delivery gets.
 */
import type { Fixture } from "./fixture.ts";
import {
  buildFixtureRepository,
  cloneRepository,
  createPrivateRepository,
  DEFAULT_BRANCH,
  fixtureTree,
  forcePushFixture,
  forgeAccount,
  git,
  GIT_CREDENTIALS,
  remoteHead,
  repositoryVisibility,
} from "./forge.ts";
import type { RunDirectory } from "./run-directory.ts";

export interface StandingRepo {
  /** `owner/name` on the forge */
  readonly fullName: string;
  readonly url: string;
  /** the commit the branch was at when the run started — half of the "pushes nothing" bar */
  readonly headBeforeRun: string;
  /** whether this run had to create it, and whether it had drifted from the fixture */
  readonly created: boolean;
  readonly forcePushed: boolean;
}

/**
 * The standing repo for one test and one fixture: confirmed, brought into step with the fixture on
 * disk, and cloned into the run directory.
 *
 * `testName` is the test's half of the name and never the run's — `refine`, not a timestamp.
 */
export async function cloneStandingRepo(
  runDirectory: RunDirectory,
  fixture: Fixture,
  testName: string,
): Promise<StandingRepo> {
  const owner = await forgeAccount(runDirectory);
  const fullName = `${owner}/deliverer-e2e-${testName}-${fixture.name}`;
  const url = `https://github.com/${fullName}.git`;

  await buildFixtureRepository(runDirectory, fixture, null);
  const created = await confirmRepository(runDirectory, fullName);
  const forcePushed = await syncFixture(runDirectory, url);
  await cloneRepository(runDirectory, url, fullName);

  return {
    fullName,
    url,
    headBeforeRun: await remoteHead(runDirectory, url),
    created,
    forcePushed,
  };
}

/** The repository on the forge, created private when it is absent. */
async function confirmRepository(
  runDirectory: RunDirectory,
  fullName: string,
): Promise<boolean> {
  const visibility = await repositoryVisibility(runDirectory, fullName);
  if (visibility === null) {
    await createPrivateRepository(runDirectory, fullName);
    return true;
  }
  if (visibility !== "PRIVATE") {
    throw new Error(
      `${fullName} is ${visibility} and the standing repo must be private. This harness will not ` +
        `force a fixture onto a public repository, and it will not change the visibility of one ` +
        `somebody else made — decide which of the two this is and say so on the forge.`,
    );
  }
  return false;
}

/**
 * The fixture pushed, if what the forge has is not the fixture on disk.
 *
 * A repository that has just been created has no branch to fetch, which is drift of the widest
 * kind and takes the same push.
 */
async function syncFixture(runDirectory: RunDirectory, url: string): Promise<boolean> {
  const inFixture = git(runDirectory, runDirectory.fixtureRepoDir);
  const onDisk = await fixtureTree(runDirectory);
  let onForge: string;
  try {
    await inFixture(
      [...GIT_CREDENTIALS, "fetch", "--quiet", url, DEFAULT_BRANCH],
      "fetching what the forge has",
    );
    onForge = (
      await inFixture(["rev-parse", "FETCH_HEAD^{tree}"], "reading the tree the forge has")
    ).stdout.trim();
  } catch {
    onForge = "";
  }
  if (onForge === onDisk) return false;

  await forcePushFixture(runDirectory, url);
  return true;
}
