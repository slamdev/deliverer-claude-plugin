# 03 — A trace becomes a debrief of the run's facts, on demand

Status: ready-for-agent

**Blocked by:** 02

**What to build:** one command, pointed at a past run's records, produces a readable **debrief** — the fixed header,
the footer naming where to send it, and a line saying no judging ran. This is **replay**, and it is the seam every
ticket after it is verified at: with no judging it costs nothing, calls no model and gives the same answer every time.
It is to the observer what the **scripted backend** is to the review. Settled as D13, D15, D16, D17 and D24 in
`../spec.md`.

- [x] One command takes a past run's records and writes a debrief beside that run's trace.
- [x] The run's extent is settled before a single figure is computed, and attribution does not settle it: it
      identifies the run and does not bound it. The run runs from the `/deliverer:` command that started it to the
      last entry it or any of its **dispatch**es left. Every figure below is the run's own, never the session's.
- [x] The header carries: which skill ran, the epic's slug, wall-clock, how many dispatches, how many **rounds** and
      how each one ended, how the run itself ended, the run's **spend**, what the observation itself cost, and the
      plugin's commit.
- [x] Wall-clock is the run's, and neither of the two figures lying nearest to hand. Taken from the entries carrying
      deliverer attribution it is wrong by an order of magnitude — one delivery on disk attributes 2h28m of a 5h48m
      run and neither of its two review rounds, another 17m47s of 10h16m, and a refinement 32 seconds of 1h50m,
      because the rounds after its own turns are attributed to the skills a refinement delegates to. Taken from the
      session it is wrong the other way: one of those sessions holds the human's unrelated work the next afternoon.
- [x] A dispatch count counts dispatches and not the files they leave. Thirteen dispatches leave 26 files — a record
      and a `.meta.json` sidecar each — and `../spec.md`'s Further Notes count the files.
- [x] Rounds are counted per review id across the main record and every per-dispatch record, since the run's own
      record holds only the polls the **orchestrator** made itself. Each round's end is the last poll's own word —
      `completed`, `failed` carrying the reason that poll names, or `cancelled` — and never a vocabulary of the
      debrief's own. Ids skip and a round can be started and cancelled: the unfinished delivery on disk dispatched
      five rounds and cancelled one, and its polls sit in both records.
- [x] How the run itself ended is stated: it finished, or it stopped, naming the stage it stopped in. The run most
      worth reporting is the one with no closing report of its own — the unfinished delivery on disk simply stops
      after a third fix wave — and
      [ADR-0018](../../../adrs/0018-a-debrief-is-bounded-to-the-plugins-own-machinery.md) has the debrief say how the
      run ended.
- [x] The run's own spend is tokens, per API request. The host records no money at all — no cost, dollar or price
      field exists anywhere in a record — so the dollar half of the run's own spend reads `unknown`, which is what the
      glossary requires. Each round's spend **is** measured in dollars with the provider that served it, in the poll
      payload the trace already carries, and a failed round reports it too. The two are never added into one figure
      that presents a measured amount as covering the unmeasured part.
- [x] A figure nobody measured reads `unknown` and never zero. A figure measured at zero says zero: with no judging,
      the observation cost nothing, which is not the same claim as not knowing what it cost.
- [x] With no judging available the debrief carries no **defects**, and one line names what stopped the judging.
- [x] What the observation lost is in the debrief. A trace that says what was truncated, malformed or unreadable
      carries that forward, so a run whose records were damaged does not read as a run with nothing wrong with it.
- [x] A facts section carries the human's own time: how many question rounds the run put to them, and how long the
      run spent waiting on them. Both are mechanical and both are in the trace — one delivery paused 2h06m on its
      human mid-run, and a refinement is mostly question rounds. Shape only, never a subject and never the words of
      a question or an answer, which is ADR-0018's bound. D13's header is unchanged; this sits below it.
- [x] The footer names where to send the debrief: an issue on the plugin's own repository, as one fixed destination
      in the observer's own text rather than read off the host's install bookkeeping. It decides nothing about the
      plugin's behaviour, so ADR-0012 is untouched, which is what D15 says. It states that the debrief is bounded and
      may be forwarded without being read for leaks first.
- [x] The debrief names the trace and its path, and says in the same breath that the trace is not bounded and must
      not be forwarded — the third of the three refusals.
- [x] The commit is the run's own where the records carry it, labelled as the commit the run used. The skill preamble
      names the installed plugin's directory and that directory's name **is** the commit — every run on disk carries
      it. Where it is absent — a run resumed by prose, of which no run on disk is one — the installed plugin's commit
      now is reported instead and the debrief says that is what it is; where neither is readable it reads `unknown`.
      This is D16's route made the fallback rather than the first answer, because user story 20 asks for the commit the
      run used. No replay reaches that fallback: all five runs on disk opened with an explicit `/deliverer:` command
      and all five carry `…/deliverer/cbb4838aa016` in their preamble, so ticket 04's by-hand walk is where it is
      exercised.
- [x] Nothing runs `git` to obtain it. The installed plugin is not a checkout — its directory is named by the commit
      and the host's install bookkeeping carries the full one beside it — so the shape being read is a **claim** in
      the glossary's sense, exactly as the record format is, and losing it costs the debrief that line and never the
      debrief.
- [x] Replaying the same records twice produces the same debrief, byte for byte. Nothing in it records when the
      replay ran, which is the trap ticket 02's trace met, and its key is the run's own. The commit line is read from
      the machine, so a debrief replayed after a plugin update differs there by design. This holds on the path this
      ticket builds — no judging, no model — and ticket 06 is where it stops holding: once a **dispatch note** is
      written per dispatch, a replay calls a model up to thirteen times and no debrief carrying notes reproduces byte
      for byte, and no option turns notes off by themselves. Say so where the criterion lands, so the ticket after
      this one does not read as having broken it.
- [x] A replay of a run that already has a debrief writes beside it. Nothing already there is rewritten, appended to
      or removed, which is D19 holding for the debrief as it does for the trace.
- [x] The debrief lands under the plugin's data directory beside the trace, nothing is written inside any repository,
      and `CLAUDE_PLUGIN_DATA` is required the way ticket 02's entry point requires it.
- [x] An **identity file** lands beside each debrief, carrying the run's key — ticket 02's slug and first timestamp —
      the skill that ran, the repository the run ran in and the plugin commit. It exists because ticket 07 has a later
      run of one epic read the earlier debriefs under its slug, and the data directory is one per machine: a debrief
      cannot say which repository its run ran in, since ADR-0018 makes the slug the one thing of the user's own domain
      it carries. Written on this ticket's own facts-only path too, because a debrief nothing judged is still an
      earlier debrief for the run after it.
- [x] That file refuses forwarding in its own filename and its own first line, the two places the trace already does —
      it carries a repository path. The debrief does not mention it: the trace is named there because a doubting
      maintainer asks for the trace, and nothing about this one is ever wanted upstream. It is never rewritten,
      appended to or replaced, and a replay writes beside it as it does beside the debrief. Not called a sidecar: that
      word is already the host's own `.meta.json` beside a dispatch's record.
- [x] Records that produce no trace produce no debrief, and the command says why.
- [x] What lands is covered by the typecheck and lint ticket 02 got reaching the observer's code. No test runner is
      added, no fixture is committed, and CI stays those two commands over the two packages.
- [x] CONTRIBUTING § What CI does not check gains the replay procedure beside the scripted backend's: the command,
      what it needs, and what to read in what it leaves behind.
- [x] Verified against the records of every deliverer run on the machine this epic was written on — four when this
      was triaged and five a day later, deliveries and refinements, one delivery unfinished, one refinement whose
      session also carried another plugin's skills — with the debrief each one produces read by hand. The count is not
      a standing fact: take it fresh, and never fewer than what is there.

## Comments

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — stays `ready-for-agent`; twelve criteria added, four reworded, none removed.**

Nothing here is built. `plugin/mcp/` holds `server/` and `launch.mjs`; a search by concept rather than by the request's
wording — `observer`, `debrief`, `replay`, `distill` across every source, manifest, hook and document outside
`docs/specs/` — finds a different sense of the word (`agent-backend.ts`'s `PreToolUse` liveness observer) and prose in
the two ADRs. No prior rejection of this shape is on record; the repository keeps no `.out-of-scope/`.

**Every figure in the header was computed against the real records, and two of them would have been wrong.** The first
is the run's extent. `attributionSkill` stops partway through every run on disk: in one delivery the last attributed
entry is the change-request stage, and both review rounds and both fix waves after it carry none — so a wall-clock
taken from attribution reports 2h28m of a 5h48m run, seven dispatches instead of thirteen and **zero rounds instead of
two**. The unfinished delivery attributes 17m47s of 10h16m; a refinement attributes 32 seconds of 1h50m, because what
follows its own turns is attributed to the skills a refinement delegates to. The session's span is wrong the other way
— one of those sessions ran 20h25m because the human came back the next afternoon for unrelated work. Ticket 02's
identification rule is untouched by this: attribution is how the run is **found**, and three criteria now say it is not
how the run is **bounded**.

The second is spend. The host records no money anywhere — no cost, dollar or price field exists in any record, only
per-request tokens — so the dollar half of a run's own spend is unmeasured and the glossary's `unknown`-never-zero rule
lands on it. Each round's spend, though, **is** measured in dollars with its provider and model, in the
`code_review_status` payload sitting in the polls ticket 02's trace already keeps, and it survives a failed round. A
criterion now separates the two and forbids the total that would present the measured half as covering the unmeasured
one. Round outcomes came out of the same reading: the poll's own three terminal words are what `review-state.ts`
publishes, ids skip, and the unfinished delivery dispatched five rounds and cancelled one — so rounds are counted per id
across the main record and every dispatch record, in the server's vocabulary rather than the debrief's.

Four decisions were the maintainer's. **The commit is the run's own where the records carry it.** C4 turned out to be
settled three ways and better than D16 assumed: the installed plugin is not a git checkout, but its directory is *named*
by the commit, the host's install bookkeeping carries the full sha, and every record on disk contains that path itself
in the skill preamble — so the commit the run actually used is readable, which is what user story 20 asks for. D16's
installed-clone route becomes the fallback for a run resumed by prose, labelled as such, with `unknown` under both. The
ticket's old criterion assumed the opposite and spent a line explaining why the header could not say what the run used.
**The footer's destination is one fixed string** in the observer's own text rather than read from the host's marketplace
bookkeeping — a fork's debriefs go upstream, and D15 already permits the name. **The human's time is carried on the free
path**, as a facts section below the header rather than in it: ADR-0018 and user story 9 both want the question rounds
counted and timed, both figures are mechanical, and without this a debrief on a machine that cannot judge says nothing
about the 2h06m one delivery spent waiting mid-run. D13's fixed header is left as the spec settled it. **A replay writes
beside an existing debrief** rather than over it, so D19 holds for the debrief as it does for the trace — which matters
once ticket 05 makes two replays of one run differ.

Three smaller things were corrected rather than asked. The determinism criterion had the hole ticket 02's trace had —
nothing in the debrief may record when the replay ran — with the commit line named as the one part that legitimately
changes between machines. `unknown` and a measured zero were pulled apart, because the free path's observation cost is
genuinely nothing and reporting that as unknown throws away the fact the header exists to carry. And a dispatch count
counts dispatches: thirteen dispatches leave 26 files, and the spec's Further Notes count the files.

**Two things for the maintainer that are not this ticket's.** Ticket 06's closing criterion reads "one measured delivery
made 26" dispatches; the delivery made thirteen and left 26 files. And `../spec.md` says three deliverer runs are on
disk where there are now four — a `deliverer:refine` started this morning — which only makes the last criterion here
easier to meet.

`CONTEXT.md`'s **Spend** entry was widened in passing: it defined spend as what one *round* cost, while this header and
the entry for **Debrief** both use it of a whole run, and it now says either half can be known while the other is not,
which is the fact the spend criterion above rests on.

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — state unchanged.** Touched only while triaging 06. The byte-for-byte criterion was unqualified,
and it is only true while nothing judges: ticket 06 writes a **dispatch note** per dispatch, so a replay there calls a
cheap model up to thirteen times and its debrief cannot reproduce. The criterion now says which path it holds on.
Nothing else here was evaluated.

> *This was generated by AI during triage.*

**Triage, 2026-08-26 — state unchanged.** Touched only while triaging 07. That ticket's continuity reads the earlier
debriefs under an epic's slug, and the data directory is one per plugin for the whole machine — so two epics of one name
in two repositories would read each other, and the filter that prevents it needs a fact no debrief may carry: ADR-0018
makes the slug the one thing of the user's own domain a debrief holds. Hence the **identity file** beside each debrief,
which this ticket's writer owns because it owns the document. Two criteria were added.

The commit criterion was corrected in the same pass. It read "Where it is absent, a run resumed by prose among them",
which claims one of the runs on disk is one: none is. All five opened with an explicit `/deliverer:` command and all
five carry `…/deliverer/cbb4838aa016` in their preamble, so no replay reaches D16's fallback and ticket 04's walk is
where it is exercised — a step now added there. Nothing else here was evaluated.
