/**
 * The throwaway repo: one private repository a delivery is driven against, and destroyed when the
 * test passes (end-to-end-tests ticket 03).
 *
 * **It has to be per run, and not for tidiness.** A **change request** cannot be deleted on this
 * forge — only closed — so a reused repository accumulates them permanently. More seriously, a run
 * killed before cleanup leaves an **epic branch** behind, and delivery takes its **bearings** from
 * that branch's commits and from whether a change request is open: the next run would **resume** a
 * half-delivered epic while the test reported a happy path.
 *
 * **A failing run leaves everything standing.** The change request is the evidence, so nothing is
 * removed until every assertion has passed — which is why the deletion is the last line of the test
 * rather than a hook that runs whatever happened. And a cleanup that fails is reported and nothing
 * more: a repository this harness could not delete is a repository to remove by hand, never a
 * passing test turned red.
 *
 * **The epic is on the default branch from the moment the repository exists.** It is part of the
 * fixture rather than something seeded afterwards, which is how a delivery finds an epic it was
 * handed the location of.
 *
 * The name carries the test and the run both, and it is the run directory's own name: a repository
 * left standing by a failure names the directory holding that run's session records, so the two are
 * read together rather than matched up by timestamp.
 */
import { basename } from "node:path";
import type { Fixture } from "./fixture.ts";
import {
  buildFixtureRepository,
  cloneRepository,
  createPrivateRepository,
  deleteRepository,
  forcePushFixture,
  forgeAccount,
  remoteHead,
} from "./forge.ts";
import type { RunDirectory } from "./run-directory.ts";

export interface ThrowawayRepo {
  /** `owner/name` on the forge */
  readonly fullName: string;
  readonly url: string;
  /** the fixture commit, which is what the epic and the whole codebase arrived as */
  readonly headAtCreation: string;
  /** where the delivery is told the epic is, relative to the repository's root */
  readonly epicLocation: string;
}

/**
 * A repository created private under the account the token authenticates as, carrying the fixture
 * and its epic, and cloned into the run directory.
 *
 * The run directory's own name is the repository's, which is where both halves of the name come
 * from: the run directory is named for the test and the moment it was made.
 */
export async function createThrowawayRepo(
  runDirectory: RunDirectory,
  fixture: Fixture,
): Promise<ThrowawayRepo> {
  const epic = fixture.epic;
  if (epic === null) {
    throw new Error(
      `the fixture ${fixture.name} carries no epic, so a delivery has nothing to deliver. An ` +
        `epic is an epic/ directory beside repository/ and an "epicSlug" in fixture.json.`,
    );
  }

  const owner = await forgeAccount(runDirectory);
  const fullName = `${owner}/deliverer-e2e-${basename(runDirectory.root)}`;
  const url = `https://github.com/${fullName}.git`;

  await buildFixtureRepository(runDirectory, fixture, epic);
  await createPrivateRepository(runDirectory, fullName);
  // Force, though nothing is there: a repository the forge initialised with a file of its own would
  // otherwise refuse the push, and this repository is a moment old and nobody's.
  await forcePushFixture(runDirectory, url);
  await cloneRepository(runDirectory, url, fullName);

  return {
    fullName,
    url,
    headAtCreation: await remoteHead(runDirectory, url),
    epicLocation: epic.location,
  };
}

/**
 * The repository removed, and whatever went wrong reported rather than thrown.
 *
 * The caller has already passed every assertion by the time this runs, so there is nothing left for
 * a failure here to say about the plugin — only about the token's scopes or the forge's mood, which
 * a contributor reads and acts on themselves.
 */
export async function deleteThrowawayRepo(
  runDirectory: RunDirectory,
  repo: ThrowawayRepo,
): Promise<string | null> {
  try {
    await deleteRepository(runDirectory, repo.fullName);
    return null;
  } catch (error) {
    return (
      `${repo.fullName} could not be deleted and is still on the forge — remove it by hand. ` +
      `A token without the scope to delete a repository is the ordinary cause.\n  ${String(error)}`
    );
  }
}
