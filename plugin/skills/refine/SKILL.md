---
name: refine
description: Refine one idea into an epic — grilled with you, written up as a spec, broken into tickets ready to build.
disable-model-invocation: true
argument-hint: "<epic-idea>"
metadata:
  credits: |
    All credits belong to https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md
    and https://github.com/mattpocock/skills/blob/main/skills/productivity/handoff/SKILL.md
---

You **refine** one **idea** into an **epic** ready to deliver: the idea **grilled** with the human until no decision is
left silently assumed, the conversation written down as a **brief**, and the brief turned into a published **spec** and
one published **ticket** per slice of work.

Three files sit beside this one, each read at the point that names it: `resume.md`, `open-the-draft.md` and
`bounds.md`.

## Who does what

- **The interview is yours.** The human is in the room and the decisions are theirs; you hold the conversation from
  the first question to their confirmation. What leaves stage 1 is fact-finding, as **sweep**s (**Sweeps**).
- **The writing is the writers'.** Stages 3 and 4 are one dispatch each, `spec-writer` then `tickets-writer`. A
  **writer** reads the codebase first-hand and never sees the conversation, so a decision the brief leaves out is one
  the writer makes again on its own, maybe the other way: **the brief is load-bearing**. The writer's **report** is all
  you get back — what it names is what you know.
- **A wrong document goes back to its writer.** Where a report leaves you unsure, or a writer's document is wrong,
  **put the stage back** naming what it got wrong. The writer holds the context the document needs; the fix is its.
- **The rest is yours**: grill, sweep, write the brief, dispatch the writers in order, read their reports, commit what
  the refinement wrote into the repository onto the **epic branch**, and hand the epic over.

## The mechanical bar

A question of fact that answers true or false in a **single look** is **mechanical**, and yours to settle: does this
symbol exist, what does this file say, what does a published spec carry, does this tool's documentation name the
feature. A **thread** — a search whose results decide what to search next — goes out as a sweep, however cheap each
step of it looks.

The bar holds for the whole run: checking what a writer reported is a single look, so yours. It bounds your reading
only — the brief, and the glossary entries and ADRs stage 1 lands, are yours to write.

## Dispatching

- **What a dispatch carries.** The epic's **slug**, and the environment facts earlier sweeps established — how a cluster
  or a service is reached — so none rediscovers them. Hand documents by path: the writer opens the whole of it and
  reads the repository first-hand on top. The workspace checkout is read as it stands, so it goes unnamed; a checkout a
  sweep kept is named by its path and ref.
- **A stage is unfinished until its report is in hand.** An acknowledgement is no report: a writer you continue may
  answer at once and finish in the background. Wait for the report itself by ending your turn — the notification wakes
  you. A `sleep`, a poll, or a dispatch spent only on waiting stands in for none.
- **Continue before you re-dispatch.** To put a stage back, or to ask after a report that never came, continue the
  dispatch while it is addressable: the writer still holds the context, so a correction costs a patch where a cold
  dispatch pays for the whole write again. Dispatch cold once it is no longer addressable, or once a continue brings no
  report — the same move at a higher price, and it keeps the run going where stopping leaves the human a half-written
  epic.

## Opening the run

1. **The idea.** Your argument names it; when it names none, ask the human for one. Name the epic from it once, as a
   short **slug**: the brief's filename, the tasks and the published artifacts all carry it, so two epics never collide.
2. **The default branch.** Fetch it before anything else. Where the checkout is behind, say so and ask whether to pull
   — in the first question round. The pull is the human's call.
3. **How far it got.** Look for the epic's artifacts: `<slug>-brief.md` in the OS temporary directory, a published spec,
   a remote branch named from the slug. **Where any exists, read `resume.md`**: it says where this run starts. Where
   none does, start at stage 1.
4. **The tasks**, all five at once (**Progress**).

## Stages

1. **Grill the idea.** Call the Skill tool twice — `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`
   — and run the grilling with domain-modeling alongside, so terms and decisions land in the project's glossary and
   ADRs as they crystallise. When either skill is missing, report that and stop: the interview is theirs to run. They
   own it except for how a question reaches the human (**Asking**) and how a question of fact is settled (**Sweeps**).
   The first question round states that an epic delivers into one repository, as the glossary bounds it, and carries
   the pull question where there is one.

   Before each question round, take every question on the **frontier** through:
   1. **Sort it.** A decision is the human's and goes toward the round. A question of fact meets the mechanical bar: a
      single look you settle now; a thread goes out as a sweep the moment its subject is clear — a feature traced from
      file to file, a second repository read, a document fetched and read for what to fetch next. A decision's
      **premise** — the fact its recommended answer rests on — meets the same bar. The reach of a removal above all:
      "nothing else depends on this" is a fact to find before the question is asked.
   2. **Hold it or ask it.** A decision that turns on a sweep in flight — one you cannot ask well without what that
      sweep is out to find, its premise included — is held until the sweep lands. Every other question goes into the
      round now: a sweep holds only the questions it touches.
   3. **Ask the round** (**Asking**). Where the holds emptied it, end your turn and wait for the sweep instead.

   **A sweep that lands releases what it held** into the next round, each premise corrected where its facts changed it.
   A decision already settled on a premise those facts undercut goes back to the human as a **fork**, saying what
   changed: an answer resting on a false premise is a decision silently assumed, the one thing this stage exists to
   prevent.

   Once the frontier is empty, draft the brief (**The brief**) and send the sweep over it (**Sweeps**).

   **Done when** the frontier is empty with no question held, the sweep over the brief has reported and every input it
   raised is answered, the human has confirmed you reached a shared understanding, and every term a settled decision
   relies on is in the glossary or listed in the brief as missing from it.
2. **Write the brief.** Finish the draft from stage 1 (**The brief**) and close it on the line `Confirmed by the human.`
   — written now, at the end, since that line is how a resumed run tells a finished stage 1 from one cut short. **Done
   when** each of the five things the brief carries is written out of the conversation or stated to hold nothing, a
   fresh agent could carry the design forward from the brief alone, and the line closes it.
3. **Write the spec.** Dispatch `spec-writer` with the slug and the brief's path. It publishes the spec to the project's
   issue tracker, and its report raises the **fork**s its reading forced — among them each decision a killed **claim**
   took down. Every report goes through **one report, one question round, one put-back**:
   1. keep the spec location it names;
   2. close every fork it raises with the human in one question round (**Asking**), saying what the writer found. The
      forks one report raises are a single set, held the moment it lands;
   3. put the stage back once, carrying every answer as the human gave it — the option picked and any free text, quoted
      — to the writer continued, or cold where it is no longer addressable. The put-back is what writes the answer into
      the published spec, the only record stage 4 reads;
   4. take the corrected report as the next one, through the same loop: folding the answers in can raise forks the
      writer could not see before.

   **Done when** the spec's location is in hand and no fork any of its reports raised is still open.
4. **Break it into tickets.** Dispatch `tickets-writer` with the slug and the spec's location — once published, the
   spec is the record, so the tickets are cut from it rather than from the brief. It publishes one ticket per slice,
   numbered in dependency order, and its report raises the forks its reading found against the spec. Those go through
   stage 3's loop with the put-back going to `spec-writer`; then stage 4 is put back carrying the corrected spec's
   location, and its corrected report goes through the loop in turn. **Done when** its report is in hand, the ticket
   count and locations it names are kept, and no fork it raised is still open.
5. **Open the draft.** Read `open-the-draft.md` and run it: every step is a git or forge operation. It runs on every
   run, resumed or not. **Done when** its own done bar holds.
6. **Hand the epic over**: report as **What to report** has it, closing on the call that delivers it,
   `/deliverer:build <epic location>` — the location where the spec and its tickets sit together, as the project's
   conventions have it.

## Asking

Every question you put to the human — the grilling's, and the forks a writer's report raises — is **written, then
picked**, both in the same turn. The tool's fields are too narrow to carry a question, so the text carries it and the
tool takes the answer:

1. **Written.** The whole question round as text first, in grilling's numbered format: each question's title; a body
   with the context the human needs to decide — what raised it, what hangs on it; every plausible answer with what
   follows from choosing it; and your recommended answer.
2. **Picked.** Then `AskUserQuestion` on the same round, as the answer pad: each question named by its number and
   title, each option a short label pointing back at an answer the text spelled out (`Q2 · B: one queue per tenant`),
   your recommended answer first. An open-ended question gets its plausible answers as options, and the free-text
   escape carries anything else.

One call holds four questions, and a round often holds more: spread the round across as many calls as it needs, all
sent in the same message before any answer is waited on. The whole frontier reaches the human at once, for one wait.
Every call points back into the one text at the head of the round.

## Sweeps

A **sweep** is a fact-finding dispatch to whatever general-purpose agent your host offers — this plugin ships no
sweeper. One subject each, several in flight at once, so two questions of fact never queue behind one another: facts
that different frontier questions turn on go out as different sweeps, and the points one held question needs stay in
one sweep. Send each the moment its subject is clear, **even where dispatching blocks you until the report**: there the
interview runs send, wait, ask, send — the reading is the cost, and the waiting only takes time.

Each sweep's dispatch carries:

- **the subject**, named as the question of fact it is out to close — the question, never the next file to open — and
  the frontier questions it holds, worded as the human will be asked them. The sweep follows the thread itself,
  however many looks that takes, and reports once its facts put every question it holds on a checked premise;
- **that the looking is first-hand**: the sweep reads everything itself and dispatches no agent of its own — a half
  handed on comes back late, or to you long after the sweep reported without it. A subject broad enough to split is
  yours to split into sibling sweeps, because the frontier is what says which split you are owed;
- **what it owes back**: the facts and where it found them. The view on the design is the human's to form with you;
- **the subjects of the sweeps already in flight**, so it leaves a sibling's fact to that sibling;
- **the environment facts** (**Dispatching**);
- **the full path of `bounds.md`** beside this file, for the sweep to read word for word;
- **that a checkout or clone it makes is kept**, its path and ref named in its report, for the brief to hand on.

**The sweep over the brief** goes out once, when the frontier is first empty and before the human confirms. Write the
brief as **The brief** has it, short of its closing line, and send a sweep carrying its path. Its subject: which inputs
the settled decisions leave unanswered or contradictory — inputs derived from the decisions themselves: the empty one,
the edge of each threshold, and those where two decisions' triggers meet. It holds no frontier question, and owes back
each such input with the decisions it involves. Each input goes through stage 1's sort as any decision does — its
premise may still go out as a sweep — and then to the human in one question round, the brief taking the answers. An
input those answers raise in turn is the writer's to find, as any other fork is.

Sweeps are the interview's bookkeeping, and stay there: the brief hands the writer the design, and the task list
carries one task per stage.

**Where your host offers no agent to sweep with, read inline** and name each such question as a **hand-off** in your
report. The reading has nowhere else to go, and a human cannot fix a host's configuration from the interview.

## The brief

The brief is the whole **hand-off** of stage 1: the spec writer has it and nothing else of the conversation. Write it to
the OS temporary directory as `<slug>-brief.md`, where a later run can find it; the workspace holds only what this run
publishes. It carries five things:

1. **The idea**, and the problem behind it in the human's own terms.
2. **Every decision the grilling settled**, each with its **grounds**. What a sweep settled rides here, in the grounds
   of the decision it settled.
3. **Every fork the grilling left open**, marked as the human's to close.
4. **The artifacts the session landed or touched**, by path and never copied in: glossary entries, ADRs, prior specs,
   code, every path a sweep reported, and every checkout a sweep kept by its path and ref. Mark each glossary or ADR
   file the session wrote as **landed** — stage 5 commits those. List every term a settled decision relies on that the
   glossary lacks as missing from it. This is where the looking happened, not what it found.
5. **Every claim** the design rests on that the session never checked — a fact the human handed you, a precedent you
   took to generalise, a tool you took to have a feature — each with the **cheapest** path that settles it.

A **claim** is written as a claim: the writer's first-hand look is what turns it into a fact or kills it, and a claim
dressed as a fact is one nobody thinks to check. So the brief carries what was decided and what was never checked, and
holds no section of established facts under any heading.

**Cheapest is counted in the writer's reading.** A claim about what a file says is settled by opening that file, what a
test covers by reading its body, what a tool does by running it once: name the file, the body or the command. A path
that says "do the work" sends the writer off to build the thing and run the suite before a line of the spec exists.
**A claim only a prototype settles gets that path, and says so** — an extraction nobody has attempted, an output
nothing has compared: a writer sent to prototype knowingly is worth what it spends.

Redact secrets and personal data: the brief outlives the session, on a disk nobody watches.

## Progress

The task list is the human's window on the run. **One stage, one task**, for stages 1 to 5 — stage 6 is the report
itself. Create all five as the run opens, whatever the tracker, named for the stage and prefixed with the slug:
`<slug>: grill the idea`, `<slug>: open the draft`.

- **Entering a stage** marks its task `in_progress`.
- **Its artifact existing** marks it `completed` — for stages 3 and 4, once you have read the writer's report; for
  stage 5, once its bar holds, renamed `<slug>: open the draft (nothing to commit)` where it had no paths, so the skip
  shows.
- **A put-back** flips the stage's task back to `in_progress`, and to `completed` once the corrected report lands: a
  correction is the same stage, with no task of its own. A fork stage 4 raises flips stage 3's task, then stage 4's.

## What to report

The human sat through stage 1, so report what came of it:

- the epic's location, the spec's within it, and the brief's path
- how many tickets, and which can start immediately
- stage 5's outcome:
  - where it committed: the epic branch, the change request's URL, every change left uncommitted in the tree (one line
    each — none of it was this run's to commit), and every file the commit took whole with the human's changes in it
  - where it had nothing to commit: that no branch was pushed and no change request opened, and why — the brief marks
    no glossary or ADR file as landed, or the brief was gone, its uncommitted glossary and ADR changes then among the
    hand-offs
- every fork the grilling left open, one line each — the human's to close
- every fork the tickets writer raised against the spec, one line each, and how it closed
- every glossary entry and ADR the session landed
- what the writers raised for a human — a seam newly proposed, an ADR the spec contradicts, a claim a writer killed or
  could settle neither way, a user story no ticket covers, two tickets the set does not build in number order, a term
  the glossary lacks — or that every claim you marked survived
- every **hand-off**, one line each: anything still waiting on a human, and each question of fact read inline for want
  of an agent to sweep with
- every scratch path the sweeps and writers kept — checkouts, scratch copies, prototypes — one line each, for the human
  to remove
- the call that delivers the epic: `/deliverer:build <epic location>`
