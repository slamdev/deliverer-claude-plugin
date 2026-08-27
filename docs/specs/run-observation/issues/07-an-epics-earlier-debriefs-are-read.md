# 07 — An epic's earlier debriefs are read

Status: ready-for-agent

**Blocked by:** 05

**What to build:** an **epic** usually takes more than one run — runs are interruptible by design, and one measured
delivery ran 29h36m. An observer for a later run reads the debriefs the earlier ones left, so a defect that exists only
across two runs is findable at all. Settled as D21 in `../spec.md`; D11's grounds rule, D19's never-removed rule, D23's
finalising flag and D29's honest degradation all bear on it, and
[ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md) holds the bound — an earlier
debrief is the one input to the synthesis that already carries it, where the **trace** and every **dispatch note** do
not.

- [x] An observer whose epic already has debriefs under its slug in the plugin's data directory reads them: all of
      them, whole, oldest first. A debrief is prose written to be pasted into an issue and the most any epic on disk
      has taken is three runs, so nothing is capped, sampled or summarised on the way in.
- [x] Only the same repository's. There is one data directory per machine and per plugin — the measured one is
      `~/.claude/plugins/data/deliverer-slamdev-deliverer/` — and ticket 02 keys what lands in it by the **slug**
      alone. So every epic from every repository on the host shares one roof, and two epics of one name in two
      repositories would otherwise read each other: a defect assembled from an unrelated epic, arriving with grounds
      attached. The comparison is the observer's alone, and no repository name, path or branch is written into a
      debrief — ADR-0018 makes the slug the one thing of the user's own domain a debrief carries, and that holds
      unchanged.
- [x] A debrief cannot say which repository its run ran in, so an identity file beside it does. Ticket 03's writer
      gains one per debrief, carrying that run's key — the slug and its first timestamp — the skill that ran, the
      repository the run ran in and the plugin commit. It is what this ticket's reading matches on, and it is written
      on the facts-only path too, since a debrief nothing judged is still an earlier debrief for the run after it. Not
      called a sidecar: that word is already the host's own `.meta.json` beside a dispatch's record, in `../spec.md`
      and in tickets 02, 03 and 06.
- [x] The identity file refuses forwarding in its own filename and its own first line, the two places the trace and
      the notes file already do — it carries a repository path, so it is not the document to send. The debrief does not
      mention it: the trace is named there because a doubting maintainer asks for the trace, and nothing about this
      file is ever wanted upstream. Nothing already written is rewritten, appended to or replaced.
- [x] A debrief with no readable identity file is not read for continuity, and is counted among the ones that could
      not be read. It may be another repository's, and a false cross-run defect carrying grounds is worse than a
      debrief that says it lost the run before it.
- [x] Every earlier debrief for that slug, whichever skill wrote it. One epic on disk ran delivery → refinement →
      delivery, so a delivery's earlier debriefs include a refinement's — and a question asked in the refinement and
      asked again in the delivery is exactly what this exists to find.
- [x] One debrief per earlier run, the newest of each. Ticket 03 has a replay write *beside* an existing debrief
      rather than over it, so a run replayed twice leaves two debriefs of itself; without this a re-replayed run is
      read twice and the criterion below names one run as two. The run is identified by the key its identity file
      carries — ticket 02's own, the slug and the run's first timestamp — and the debrief says the newest of each was
      taken.
- [x] Its own debrief is never among them, excluded by that key rather than by the finalising flag: D23 has it written
      and rewritten while the run is still going, so it is present in the listing from the first stage onwards.
- [x] An earlier debrief that is not yet finalised is read, and marked as unfinalised where it is used. D23 keeps a
      readable debrief at every moment, and two runs of one epic in flight at once is itself worth reporting — but a
      half-written account presented as a finished one is not.
- [x] A defect spanning two runs of one epic is reportable, and names which runs it spans the way their debriefs are
      keyed — the skill that ran and the run's own timestamp — so a maintainer holding the directory can find both.
      A stage the resumed run dispatched again although an earlier one had finished it, a question asked in two
      different runs.
- [x] A cross-run defect's **grounds** may cite an earlier debrief, named by its file and the defect inside it. D11
      has grounds come from the trace, and this widens it by one document deliberately: the earlier debrief sits on
      the same disk as the trace a doubting maintainer would ask for, so it is locatable, which is ticket 05's test of
      whether something is grounds or taste with a figure attached.
- [x] An earlier run's trace and its dispatch notes are never read. Ticket 06 already refused an earlier run's notes —
      neither bounded nor small — and an earlier trace is refused on the same ground, which is why the citation above
      is to the debrief and stops there.
- [x] The earlier debriefs reach the one synthesis and no dispatch note. A note reads its own dispatch's slice and
      nothing else (ticket 06), it runs on a cheap tier up to thirteen times in a delivery, and continuity is a
      whole-run reading by construction.
- [x] A defect an earlier debrief already named is named again, and says which earlier run reported it. Suppressing it
      would drop a live defect from the document actually being forwarded, and a defect that survived a run is worth
      more than one seen once — so the recurrence is stated rather than left for a maintainer to notice across two
      debriefs they may not both hold.
- [ ] Where an earlier debrief names a different plugin commit, a defect spanning that run says so. Every debrief
      carries the commit its run used (ticket 03), user story 20 exists to tell a defect fixed last week from one still
      live, and a defect assembled across an update may be about a line that changed inside it.
- [x] Each debrief still stands alone for forwarding: nothing in a later one requires an earlier one to be read
      alongside it. A cross-run defect states in full what happened, and the citation is where a maintainer may check
      it rather than where the rest of it lives.
- [x] Earlier debriefs are never rewritten, appended to or replaced — D19's rule, holding for the debrief exactly as
      ticket 03 has it for a replay. The reading is read-only, and it touches neither the traces nor the notes files
      beside them.
- [x] What continuity the debrief had is stated, in three states kept apart: how many earlier debriefs it read, zero
      being a number rather than silence; which ones it could not read; and — where the run's own trace shows it
      resumed work no debrief covers — that the continuity has a hole in it. The first delivery on disk opened its
      task list at `golden-image-bake: implement every ticket (16/18)`, so sixteen tickets were delivered by something
      no record here holds, and "no earlier debriefs" would otherwise be indistinguishable from a first run.
- [x] A debrief that cannot be read costs the later one its continuity and nothing else, and the later one says so.
      The synthesis still runs on this run's own trace and notes, and D29 puts the reason where a human meets it.
- [x] That continuity account sits below D13's fixed header, where ticket 03 put the human's own time, rather than
      inside it. The header is what makes debriefs comparable across a team, and ticket 03 left it as the spec settled
      it.
- [x] Nothing is written outside the plugin's data directory and nothing inside any repository. The only reading this
      ticket adds is one directory listing and the files it names.
- [x] What lands stays inside the typecheck and lint coverage ticket 02 got for the observer's code. No test runner is
      added, no fixture is committed, and CI stays those two commands over the two packages.
- [x] Verified by replaying two runs of one epic in order, the second replay reading the debrief the first left. Two
      epics on the machine this was triaged on have several runs each — `golden-image-bake` three (a delivery, then a
      refinement, then a delivery) and `molecule-image-tests` two (a refinement, then a delivery) — so the
      delivery→delivery pair and the refinement→delivery pair are both available. Take the runs fresh rather than
      trusting this count, and replay each epic in its own order.
- [x] Verified alongside it: an epic whose directory holds two debriefs of one run — replay one run twice — produces
      a later debrief that names that run once; and an epic with no earlier debriefs at all produces the zero line
      rather than silence. Both cost a directory and no money.
- [x] The same-repository rule is exercised by putting a debrief for the same slug from another repository's run
      beside the epic's own and reading whether it is ignored, and again with its identity file removed. No records on
      disk collide that way — both epics there live in one repository — so the second debrief is made by hand from one
      a replay produced; nothing is committed.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — stays `ready-for-agent`; nineteen criteria added, five reworded, none removed.**

Nothing here is built. `plugin/` holds two skills, seven agents, one hook and `mcp/`, and `mcp/` holds `server/` and
`launch.mjs`; a search by concept rather than by the request's wording — `debrief`, `observer`, `earlier debrief`,
`continuity`, `across runs`, `dispatch note`, `hunch`, `grounds`, `slug` across every source, manifest, hook and
document outside `docs/specs/` — finds nothing that reads an earlier run's account of itself. The plugin's own resume
idiom is the opposite one: **bearings** from the artifacts on disk, in `plugin/skills/build/SKILL.md:31` and the same
paragraph in all seven agents, never a previous run's report. No prior rejection of this shape is on record; the
repository keeps no `.out-of-scope/`.

**The closing criterion is meetable, and the material is better than the ticket assumed — which is the largest thing
this triage found.** The five deliverer runs on disk are not five singletons. All five ran in
`/root/workspace/preview-env-foundation` on plugin commit `cbb4838aa016`, and they group into **two epics**:
`golden-image-bake` has three runs — a delivery `08-24 19:02`→`08-25 15:27`, a refinement `15:42`→`17:31`, a delivery
`17:32`→`08-26 09:02` — and `molecule-image-tests` has two, a refinement `08-26 10:06`→`12:03` and a delivery
`12:35`→`14:19`. Both pairs the feature needs are therefore available: delivery→delivery and refinement→delivery.

Three things fall out of that reading. **An earlier debrief may be a refinement's**, because one epic's runs ran
delivery → refinement → delivery, and a question asked in the refinement and asked again in the delivery is exactly the
defect D21 exists to reach — a criterion now says every debrief for the slug is read whichever skill wrote it. **The
first delivery on disk was itself a resumption**: its opening task is `golden-image-bake: implement every ticket
(16/18)`, so sixteen tickets were delivered by something no record on this machine holds. That is a third continuity
state the ticket had no line for, and without it a debrief reading "no earlier debriefs" is indistinguishable from a
first run. And **`gitBranch` is not epic identity** — the two `golden-image-bake` deliveries ran on
`epic/golden-image-bake` and `epic/golden-image-bake-ansible` — so ticket 02's slug, read off the task subjects, stays
the only identity that holds.

**The data directory is machine-wide, which the ticket did not reckon with.** It is one directory per plugin —
`/root/.claude/plugins/data/deliverer-slamdev-deliverer/` on this machine — and ticket 02 keys what lands in it by the
slug alone. So every epic from every repository on the host shares one roof, and two epics of one name in two
repositories would read each other's debriefs: a defect assembled from an unrelated epic, arriving with grounds
attached. The maintainer's call is to read only the same repository's, filtered at read time rather than by changing
ticket 02's key, so user story 30's grouping by slug survives.

That answer had a hole in it, and closing it is the one thing this triage adds to a sibling. **A debrief cannot say
which repository its run ran in** — ADR-0018 makes the slug the one thing of the user's own domain a debrief carries —
and this ticket forbids reading an earlier **trace**, which is where that fact would otherwise be. So ticket 03's
writer gains an **identity file** per debrief, carrying the run's key, the skill, the repository and the plugin commit,
refusing forwarding in its own filename and first line, and unmentioned in the debrief because nothing about it is ever
wanted upstream. It is also what the de-duplication below matches on. Not called a sidecar: that word is already the
host's own `.meta.json` beside a dispatch's record, in `../spec.md` and in tickets 02, 03 and 06.

**Nine decisions were the maintainer's.** Earlier debriefs are read **whole, all of them, oldest first** — a debrief is
prose written to be pasted into an issue and three runs is the most any epic here has taken, so nothing is capped or
summarised on the way in. **Only the same repository's**, through the identity file above. **An earlier debrief is
citable grounds**, named by its file and the defect inside it: D11 widens by one document deliberately, on the ground
that the debrief sits on the same disk as the trace a doubting maintainer would ask for, so it is locatable — ticket
05's test. **A repeat defect is named again**, saying which earlier run reported it, because suppressing it would drop
a live defect from the document actually being forwarded and a defect that survived a run is worth more than one seen
once. **Continuity is reported in three states** rather than one. **An unfinalised sibling debrief is read and marked
as unfinalised**, since D23 guarantees a readable one at every moment and two runs of an epic in flight at once is
itself worth reporting. **One debrief per earlier run, newest wins.** **A commit difference is stated** on a defect
that spans it, which is what user story 20 exists for. And **an identity file that cannot be read costs that run's
continuity**, because a false cross-run defect carrying grounds is worse than a debrief that says what it lost.

**Replay duplicates were nobody's decision and are a real trap.** Ticket 03 has a replay write *beside* an existing
debrief rather than over it, so a run replayed twice leaves two debriefs of itself in the directory — and re-replaying
a debrief they doubt is precisely what a maintainer does. Without the newest-per-run rule a re-replayed run is read
twice and "which runs it spans" names one run as two.

Four things were corrected rather than asked. **The earlier debriefs reach the one synthesis and no dispatch note**: a
note reads its own dispatch's slice and nothing else (ticket 06), it fires on a cheap tier up to thirteen times in a
delivery, and continuity is a whole-run reading by construction. **An earlier run's trace is refused on the same ground
ticket 06 refused its notes** — neither bounded nor small — which is what makes the citation stop at the debrief. **The
observer's own debrief is excluded by its run key and not by the finalising flag**, because D23 has it written from the
first stage onwards, so it is in the listing throughout. And **the continuity account sits below D13's fixed header**,
where ticket 03 put the human's own time, rather than inside a header whose fixedness is what makes debriefs comparable
across a team.

**The word `seam` was the glossary telling on the ticket.** It read "a defect that exists only across the seam between
two runs", and `CONTEXT.md` defines **Seam** as the point in the code a test bites at — with `_Avoid_: boundary`, so
neither word is available for what lies between two runs. The ticket now says "across two runs", and no new term was
invented for it: the plain phrasing carries it, and `continuity` is free prose displacing nothing.

**Three things reached past this ticket, and the maintainer's direction was to close all three rather than leave them
flagged.**

`../spec.md`'s **user story 11 used `seam` the glossary's testing way** — the one of the spec's seven uses that did —
and now reads "a defect spanning two of them".

**D11 had been overtaken twice, not once.** It said grounds come from the trace; ticket 06's own criterion already
called a **dispatch note** "the second place grounds can now come from" without amending it, and this ticket makes an
earlier debrief the third. Enumerating a third time would only invite a fourth, so D11 now states the test — what makes
something grounds is that whoever holds the file can find the thing cited — and names those three as what satisfies it
today.
`CONTEXT.md` follows in three entries: **Grounds** carries the three, **Defect** stops naming the trace and leaves it to
**Grounds**, and a **hunch** becomes what nothing the observer kept can ground. ADR-0018's opening paragraph says the
same; its reasoning is untouched, because all three are accounts of the plugin's own conduct and the bound still costs a
defect nothing it needed.

**Ticket 03's commit fallback shipped exercised by nothing.** All five runs on disk opened with an explicit
`/deliverer:` command and all five carry `…/cache/slamdev-deliverer/deliverer/cbb4838aa016` in their skill preamble, so
no replay reaches D16's route at all. That criterion no longer claims one does, and ticket 04's by-hand walk gains a
step: in the resumed-by-prose state — the one record with no preamble — the debrief's commit line is read as well as
whether the observer started.

Two documents below this one were edited in passing, both because the **identity file** exists.
[ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md) closed by counting the files beside
a debrief that must not be forwarded — "two files beside the one that may be sent" — and there are now three, the
newcomer being the least sendable of them, since the fact it carries is exactly the one a debrief may not. And
`CONTEXT.md` gained an **Identity file** entry in its Observation section: the term is bolded in three documents now,
and its `_Avoid_` list carries `sidecar` for the reason above — that word already means the host's own file beside a
dispatch's record.

