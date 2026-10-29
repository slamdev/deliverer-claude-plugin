# A ticket published to the forge's issues is its spec's native child, on GitLab as on GitHub

Status: ready-for-agent

## Problem Statement

A human refines an **epic** with `/deliverer:refine` in a repository whose conventions put the **spec** and its
**tickets** on the forge's issues. On GitHub the result is what they expect: every ticket is a sub-issue of the spec
issue, so the spec lists its tickets and each ticket names its spec, in the forge's own UI. On GitLab the same run
leaves the spec issue's **Child items** panel empty. The tickets are plain issues standing beside it, unlinked, and the
only thing tying one to its spec is a `**Spec:** #N` line in its body.

The `retire-ws-scheduler` epic on `gitlab.audienzz.ch` shows it: spec `audienzz/audienzz#24338` and about thirty tickets
from `#24339` to `#24378`, every one an `issue`, none carrying a link of any type to the spec or to each other. A human
looking at the spec can't see its tickets, and a human looking at a ticket finds its spec only by reading the body.

The cause is in `tickets-writer`. Its rule for a real tracker is that "the platform's own parent, blocking and label
mechanisms replace the **Spec**, **Blocked by** and **Status** lines where it has them". That leaves the agent to find
the mechanism on its own, and on GitLab the obvious search finds none, correctly as far as it goes. `gitlab.audienzz.ch`
runs GitLab CE 19.5.1 (`enterprise: false`), where there are no Epics, and its work item hierarchy, read from the live
instance, lets an `Issue` hold children of exactly one type: `Task`. An issue cannot be put under an issue there. The
mechanism that fills the panel exists, but only for a ticket published as a Task, and nothing told the agent that.

## Solution

`tickets-writer` publishes every ticket to the forge's issues as the spec's **native child**, the child item the forge
lists under the spec and names on the ticket. It learns this as a property with two worked examples, under ADR
[0012](../../adrs/0012-the-plugin-names-no-forge.md): a GitHub sub-issue, and a GitLab Task whose parent is the spec
issue. Where a forge's issues can't hold issues as children but can hold another child type, the ticket takes that
type. On GitLab without Epics that type is Task, the only one an issue accepts.

Each ticket is linked as it is published, so the spec's children list in the order the tickets are numbered, which is
dependency order. The existing rule for the **Spec** line holds unchanged on every forge: the native parent names the
spec, so the line goes. Where the forge refuses the child link for a ticket, that ticket is published the way it is
today, a plain ticket carrying its **Spec** line, and the refusal goes into the report. The epic is still published in
full.

Nothing else moves. Blocking edges stay a **Blocked by** line wherever the forge has no blocking mechanism, as they are
today. Build reads the epic's tickets the way it does now. Tickets an earlier run published stay exactly as found when
a resumed run picks the epic up.

## User Stories

1. As a human who refined an epic onto GitLab issues, I want the spec issue's Child items panel to list every ticket,
   so that I can see the whole epic from the spec.
2. As a human who refined an epic onto GitLab issues, I want each ticket to show the spec as its parent, so that I
   can reach the spec from a ticket without reading its body.
3. As a human who refined an epic onto GitHub issues, I want every ticket to stay a sub-issue of the spec, so that
   this change costs me nothing I had.
4. As a human reading an epic's children, I want them listed in ticket-number order, so that the panel reads in the
   order the epic will be built.
5. As a human reading a ticket on GitLab, I want it to carry the triage label it carries today, so that the board
   and the filters I use keep finding it.
6. As a human reading a ticket on GitLab, I want it to carry the same title, body and acceptance criteria a plain
   issue would, so that the change of type changes nothing I read.
7. As a human whose forge refused the child link for a ticket, I want that ticket published anyway with its **Spec**
   line, so that the epic is complete and every ticket still names its spec.
8. As a human whose forge refused the child link, I want the report to name each ticket that is not a child and why,
   so that I can link them by hand or fix the project's settings.
9. As a human delivering an epic whose tickets are child Tasks, I want `/deliverer:build` to find and implement every
   ticket as it does today, so that the change in type costs the delivery nothing.
10. As an `implementer` handed a ticket that is a child Task, I want to reach the spec through the ticket's parent, so
    that the ticket and what it points at are still the whole of what I read.
11. As a human merging an epic's change request on GitLab, I want each delivered child Task closed the way a delivered
    ticket is closed today, so that the spec's Child items show what is done.
12. As a human resuming a refinement whose tickets were published as plain issues, I want them left as they are and
    not retyped or relinked, so that a resume never rewrites what someone may already be working from.
13. As a human resuming a refinement that published some tickets as children, I want the rest published as children
    at the next free numbers, so that a resume finishes the panel instead of leaving a half-linked epic.
14. As a human whose project puts specs and tickets in the repository as files, I want nothing about the published
    files to change, so that this epic only touches forge-issue trackers.
15. As a human on a forge other than GitHub or GitLab, I want the agent to look for that forge's equivalent native
    parent, so that the behaviour comes from the property and not from a list of known forges.
16. As a plugin owner, I want no behaviour in the plugin to branch on which forge is in play, so that ADR 0012 still
    holds after this change.
17. As a human reading a ticket's **Blocked by** line on GitLab CE, I want it kept in prose as today, so that the
    edges are still written down where the forge has no blocks link.

## Implementation Decisions

- **One agent changes: `tickets-writer`.** Its section on numbers and the tracker, step 6's publishing sub-steps and
  its report change. No other agent, skill, hook or line of the tools server moves. The prose is written to be read by
  a model, so `/mattpocock-skills:writing-for-agents` is used when touching it.
- **The property is "each ticket is the spec's native child".** It means the child item the forge itself lists under
  the spec issue and names on the ticket. A mention, a cross-reference or a `relates to` link is not a child: GitLab
  lists those under Linked items, not Child items.
- **When the child type differs from the issue type.** Where a forge's issues cannot hold issues as children but can
  hold another type, the ticket is published as that type. The agent takes this from what the forge accepts, never
  from which forge it is: under ADR 0012 the rule holds on any forge and the forge names appear only as examples.
- **The two worked examples**, each one an illustration the rule stands without:
  - GitHub: the ticket is created as a sub-issue of the spec issue (`gh issue create --parent <spec>`).
  - GitLab: the ticket is created as a Task work item whose parent is the spec issue, carrying its labels and body.
    `glab work-items create --type task` creates a Task but takes no parent or label, so the example is one GraphQL
    `workItemCreate` call carrying the Task's `workItemTypeId`, `hierarchyWidget.parentId`, `labelsWidget.labelIds`
    and the description. Those input fields were read from the live instance's schema.
- **Linked at publish.** Each ticket is created and attached as a child in one step, before the next ticket is
  published. Children therefore list in publish order, which is number order, which is dependency order.
- **The Spec line follows the existing rule unchanged.** A native parent that names the spec replaces the line, on
  every forge. A ticket published without a parent keeps the line.
- **Status is a label, as today.** GitLab Tasks take labels (live instance: Tasks carrying `P1`, `Testing`), so the
  label the project's conventions name for work ready for an agent goes on the Task.
- **Refusal falls back per ticket.** Where the forge refuses the child, whether the type is disabled on the project,
  the forge is too old for it, or the token lacks the permission, that ticket is published as a plain ticket carrying
  its **Spec** line, at the same number it would have had. Publishing goes on to the next ticket. The report names
  every ticket published without a parent and the forge's reason.
- **Resume leaves what it finds.** A published ticket's type and links stay exactly as the resumed run found them,
  whether or not it is a child. A ticket the resumed run publishes is a child where the forge accepts it. This extends
  the agent's existing rule that the spec and any parent issue stay as found.
- **The report says where children landed.** Beside "where the tickets are published", it says whether each ticket
  is the spec's native child, naming the child type where it is not the forge's issue type, and lists the refusals.
- **Number space.** A GitLab Task shares the project's `#` number space with its issues, and the REST issues API
  returns it with `issue_type: task`. A ticket is still addressed by its number, so build's ordering by number and the
  `Ticket:` line on commits are unaffected.

## Testing Decisions

- **A good check observes what a human could observe**: the published tickets read off the forge (type, parent, the
  spec's children and their order, labels, body), the agent's report, and the commits and change request a delivery
  leaves. No check reads the agent's prose for wording.
- **No automated seam covers this, and none is added.** The refine happy path's fixture publishes its spec and tickets
  as files, so it never reaches a forge's issues. The change is verified by hand at one seam, a `tickets-writer`
  dispatch, run once per forge:
  - **GitLab arm**: a throwaway project on a GitLab without Epics, whose conventions put specs and tickets on the
    forge's issues, with a spec issue already published. After one dispatch, check that every ticket is a Task, that
    each one's parent is the spec issue, that the spec's Child items list them in number order, that each carries the
    ready-for-agent label, and that none carries a **Spec** line.
  - **GitHub arm**: the same against a throwaway GitHub repo. Check that every ticket is a sub-issue of the spec, in
    number order, with no **Spec** line, which is today's behaviour and so the regression check.
- **One `implementer` dispatch** on the GitLab arm, handed one child-Task ticket. Check that it reads the ticket by
  number, reaches the spec through the parent, and commits with a `Ticket:` line. Merging that change request checks
  whether a closing reference closes a Task as it closes an issue.
- **The refusal branch is checked once by hand**, on a GitLab project where the Task type can't be created (or with a
  token that can't set a parent). Check that the ticket is published as a plain issue with its **Spec** line and that
  the report names it.
- **The local-files path** needs no new check: the refine happy path keeps asserting one file per ticket, and stands
  as the check that file publishing did not move. It is not re-run for this change unless the edit reaches the
  section on local files.
- **Typecheck and lint in both packages**, as CI runs them. Nothing in them changes, but CI runs them on every change.

## Out of Scope

- **Native blocking links.** **Blocked by** stays a prose line wherever the forge has no blocks mechanism, GitLab CE
  included, where only `relates_to` exists. Making blocking edges native where a forge does have them is a separate
  epic.
- **Build reading the epic off the spec's children.** Build keeps reading the epic's tickets the way it does today. It
  is checked only to still find and read child Tasks.
- **Retyping or relinking tickets already published**, on resume or otherwise, including `retire-ws-scheduler`'s.
- **Publishing the spec as a GitLab Epic** where the forge has them. The spec stays an issue on every forge.
- **`spec-writer`**: the spec issue is published exactly as today.
- **A forge-issues fixture for the end-to-end tests** or a bench arm for `tickets-writer`.

## Further Notes

### Why a Task and not an Issue on GitLab

Read from `gitlab.audienzz.ch`'s work item types: `Issue`, `Incident` and `Ticket` each allow `Task` as their only
child type, and none of them allows a parent at all. `Task` allows `Issue`, `Incident` and `Ticket` as parents. On this
instance, a ticket listed under the spec's Child items is a Task or it is not listed there. A `relates to` link, the one
link type CE offers, lands under Linked items and was considered and not taken up for that reason.

### The glossary's _Avoid_: task is untouched

The domain term stays **ticket**. That GitLab's type for it is called *Task* is a forge name of the kind ADR 0012
allows in a worked example, as a merge request is: the agent's prose and its report go on saying ticket.

### Two facts the hand checks settle

- Whether a closing reference on a merged change request closes a GitLab Task as it closes an issue.
- Whether `glab issue view <n>`, the call an `implementer` most likely reaches for, reads a Task and shows its parent.
  Where it does not, the implementer's dispatch on the GitLab arm is where that shows up, and the GitLab example in
  `tickets-writer` is no help to it. That finding would be a new **fork**, not something this spec settles.
