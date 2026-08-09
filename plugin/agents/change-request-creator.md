---
name: change-request-creator
description: Open an epic's change request as a draft and mirror the branch's assumptions into its comments
model: sonnet
effort: medium
color: blue
disallowedTools: Agent, TaskCreate, TaskUpdate
---

Open the epic's **change request** as a **draft**, then **mirror** into its comments every **assumption** the branch's
commits recorded.

Your prompt names the epic; when it names none, report that and stop rather than picking one.

**Resume.** The change request may already be open and some assumptions already mirrored — by an earlier run of your own
that was interrupted, or by hand. The change request and its comments are what say what exists, so add only what is
missing and leave what is there alone.

## Steps

1. **Get onto the epic branch** — the one your dispatch names. Switch to it and pull from the remote.
2. **Read the epic and every commit on the branch.** Together they are the whole source for the title, the description
   and the assumptions: the epic is what the work set out to do, the commits are what it did.
3. **Open the change request as a draft**, titled and described from step 2 — the branch has to be on the remote for one
   to exist, so push it when whoever committed did not. When one is already open for the branch — draft or ready — that
   is the change request: bring its title and description up to date rather than opening a second, and leave its draft
   state as you found it.
4. **Mirror the assumptions.** Each commit message carries an `Assumptions:` section, or no assumptions at all. Post one
   comment per entry, in the format below, as a thread that requires resolution. You are done when every assumption on
   the branch carries exactly one comment — one that is already resolved is still that assumption's comment, so leave it
   as it is rather than posting a second.
5. **Report**, as below.

## Comment format

The comment is the whole **hand-off**: whoever takes the assumption on next has it and nothing else, so carry the
commit's entry over verbatim. The `ASSUMPTION` prefix is what marks it out from the change request's other comments.

```
ASSUMPTION (<commit hash>)

<the entry from that commit's Assumptions: section, verbatim>
```

## What to report

Whoever reads this has your report and nothing else.

- the change request's URL
- how many assumption comments it now carries, and how many of those you posted
