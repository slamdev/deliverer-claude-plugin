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
left silently assumed, that conversation written down as a **brief**, and the brief turned into a published **spec** and
one published **ticket** per slice of work.

Your argument names the idea; when it names none, ask the user for it rather than picking one. Name the epic from it
once, as a short **slug** — the brief's filename, the task list and the published artifacts all carry it, so two epics
never collide.

**Stage 1 is yours and nobody else's** — the human is in the room and the decisions are theirs. Every stage after it is
one agent dispatch — **one stage, one task** (**Progress**) — and the dispatched agent's **report** is all you get back:
what it names is what you know. The writing goes out because it wants a fresh context reading the repo first-hand rather
than yours, spent on the interview. That is what makes the brief load-bearing: a **writer** meets the codebase for
itself but never the conversation, so a decision the brief leaves out is one the writer closes again on its own —
silently, and maybe the other way. Where a report leaves you unsure, or a writer's document is wrong, re-dispatch that
stage naming what it got wrong rather than editing the document yourself: the writer holds the context the document
needs. Yours is the work no agent does: grill the idea, write the brief, dispatch the two writers in order, read their
reports, and hand the epic to the human.

**Resume.** This idea may be part-refined — by an earlier run of your own that was interrupted, or by hand. The
artifacts are what say how far it got: the brief on disk says stage 2 ran, a published spec says stage 3 ran, published
tickets say stage 4 did. Start from the earliest stage whose artifact you cannot find — re-dispatching either writer is
safe, because each one resumes on its own and adds only what is missing. Stage 1 is the exception: a conversation leaves
nothing behind but the brief, so when the brief is gone the grilling is owed again.

**Dispatch.** Every dispatch carries the epic's **slug**. Stage 3's carries the brief's path; stage 4's carries the
spec's location instead — once the spec is published it is the record, so the tickets are cut from it rather than from
the conversation behind it. Paths rather than contents: a writer handed the path opens the whole document for itself,
and reads the repo first-hand on top of it.

## Stages

1. **Grill the idea** — run the `mattpocock-skills:grilling` skill on it, with `mattpocock-skills:domain-modeling`
   alongside, so terms and decisions land in the project's glossary and ADRs as they crystallise. Those two skills own
   how the interview runs, apart from how a question reaches the human, which is **Asking** below; when either is not
   installed, report that and stop rather than improvising an interview. You are done on grilling's own bar: the
   frontier empty, and the user's confirmation that you have reached a shared understanding.
2. **Write the brief** — as **The brief** below. You are done when a fresh agent could carry the design forward from it
   without the conversation.
3. **Write the spec** — dispatch `spec-writer`. It publishes the spec to the project's issue tracker. Keep the location
   it reports.
4. **Break it into tickets** — dispatch `tickets-writer`. It publishes one ticket per slice, numbered in dependency
   order. Keep the count and the locations it reports.
5. **Hand the epic over** — report as below, and name the call that delivers it: `/deliverer:build <epic location>`, the
   location being where the spec and its tickets sit together, as the project's conventions have it.

## Asking

Every question the grilling puts to the human goes through the `AskUserQuestion` tool, including where grilling's own
text formats its questions as numbered prose — this overrides that. Open-ended is not an exemption: the plausible
answers become the options, the free-text escape carries anything else, and your recommended answer leads the list.

Four questions is one call's limit and a frontier is often wider. Carry the rest into further calls rather than trimming
the frontier to fit — the human answers in batches, and every question the round holds still reaches them.

## The brief

The brief is the whole **hand-off** of stage 1: whoever writes the spec has it and nothing else of the conversation.
Write it to the temporary directory of the user's OS — not the workspace, which is for the artifacts this run
publishes — as `<epic-slug>-brief.md`, so a later run can find the one you left. It carries:

- the idea, and the problem behind it in the user's own terms
- every decision the grilling settled, each with the grounds it was settled on
- every **fork** the grilling left open, and that it is the human's to close
- the artifacts the session landed or touched — glossary entries, ADRs, prior specs, code — by path, never copied in

Redact secrets and personal data: the brief outlives the session, on a disk nobody is watching.

## Progress

The task list is the human's window on the run. **One stage, one task** — one each for stages 1 to 4, since stage 5 is
the report itself. Create all four as the run opens, named from the stage they serve and prefixed with the epic's slug
so two epics can share a session: `<slug>: grill the idea`. Mark a task `in_progress` as you enter its stage and
`completed` once its artifact exists — for stages 3 and 4, once you have read the writer's report. A resumed run opens
the same four, with the stages whose artifacts it found created `completed`.

## What to report

The human who ran this sat through stage 1, so your report is what came of it rather than a retelling.

- the epic's location, the spec's within it, and the brief's path
- how many tickets, and which of them can start immediately
- every fork the grilling left open, one line each — those are the human's to close
- every glossary entry and ADR the session landed
- what the writers raised for a human — a seam newly proposed, an ADR the spec contradicts, a user story no ticket
  covers, a term the glossary does not carry
- the call that delivers the epic: `/deliverer:build <epic location>`
