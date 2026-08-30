# One environment file authenticates every model call the plugin makes

Status: ready-for-agent

## Problem Statement

A human installs the plugin on a machine where their Claude session is authenticated by `CLAUDE_CODE_OAUTH_TOKEN` in its
own environment, with no credential file on disk. They configure the plugin's one required option, point it at a `.env`
file, and run `/deliverer:build`. The delivery works. The **observer** starts, watches the run, distils its **session
record**s into a **trace**, and writes a **debrief** — which carries every mechanical figure it owes and not one word of
judgement.

**The observer inherits no credential, because the host removes the only one there is.** Measured on this machine
against Claude Code 2.1.251, on a session launched by a daemon rather than from a terminal:

- The session process's environment carries `CLAUDE_CODE_OAUTH_TOKEN`. There is no `~/.claude/.credentials.json`
  anywhere on the host, so that variable is the whole of the machine's Anthropic credential.
- The detached observer's environment carries none of it. Everything else crossed the hook boundary intact —
  `GITHUB_TOKEN`, `CLAUDE_PLUGIN_DATA` and `CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE` are all present. The
  Anthropic credential alone is gone.
- The plugin is not the one dropping it: the detached re-spawn passes its whole environment through, and the variable
  was already absent when the hook ran.

**So every model call the observation makes fails, and the debrief says so in triplicate.** The SDK answers `subtype:
success` carrying `Not logged in · Please run /login`; the `not_logged_in` classification catches it, exactly as it was
built to. One affected debrief reads *"No note for 3 dispatches"*, and repeats the same sixty-word disclaimer once per
**dispatch** where the account of each stage's interior belongs. The synthesis then runs and fails the same way, so the
**defect**s section says nothing judged this run.

**The debrief keeps its whole shape and loses all of its substance.** What survives is read from the records: wall
clock, dispatch count and identities, **round**s, how the run ended, the run's own **spend**, the human's-own-time
shape, the plugin commit. What is lost is every **dispatch note** — the only account of what happened *inside* a stage —
and the synthesis, which is the defects-with-**grounds** the whole feature exists to produce. For the purpose it was
built for, telling the plugin's maintainer how the plugin behaved, it returns nothing on this host.

**This is not one unlucky machine, and observation is on by default for everybody.** Any daemon-launched,
environment-credentialled session with no credential file lands in the same case, which is how this machine and
presumably every other one managed the same way is set up. On such a host the default experience of the feature is an
observer that starts, watches, writes — and judges nothing, forever.

**Three things the diagnosis of it corrected, each measured rather than reasoned about:**

- **The hook boundary is not credential-blind.** A variable set in a project's `.claude/settings.json` `env` block
  reaches a hook, and so does `ANTHROPIC_AUTH_TOKEN` from a terminal. It is `CLAUDE_CODE_OAUTH_TOKEN` specifically that
  does not survive.
- **A consumer-side workaround does not exist.** Setting `CLAUDE_CODE_OAUTH_TOKEN` explicitly in that same `env` block
  does not get it through either, while a neighbouring variable in the same block does. There is nothing a user of the
  plugin can put in their own configuration that fixes this.
- **No live observer has ever judged anything on this machine.** The eight debriefs that predate the affected ones all
  read `0 model calls, 0 tokens, $0.00` — they are **replay**s of the mechanical half, which calls no model. So the two
  affected debriefs are the only evidence there is of the hook-launched path reaching a model at all, and both of them
  are the failure.

**Meanwhile the review has had an answer to this since ADR-0009.** The owner names an **environment file**, its
variables are layered over the server's own environment, and the review runs under whatever the owner put in it — no
enumeration, no provider assumption, no inheritance. The observation never got the equivalent: its design assumes it
authenticates with whatever the session it was started beside authenticates with, which is true when the credential is a
file the SDK can find and false when it is an environment variable the host withholds.

**And the credential is already on the machine, named by an option the observer can already see.** On the affected host,
`CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE` is in the observer's own environment, and the file it names assigns
`CLAUDE_CODE_OAUTH_TOKEN` among its keys. The observation is standing next to the answer and does not read it.

## Solution

**The environment file stops being the review's and becomes the plugin's.** One file the owner names authenticates every
model call the plugin makes — each **round**'s review as it does today, and the observation's **dispatch note**s and
synthesis as well. Its variables are layered over the observer's own environment exactly as they are over the server's,
read once when the observer starts, and passed whole and uninterpreted, which is what keeps the plugin from being
single-provider.

Nothing is added to `/plugin`. The option is already required, so every existing install has one and every affected host
is fixed by a plugin update alone, with no configuration to discover and no upgrade step. `code_review_model` is widened
the same way to carry the synthesis's model, because an owner whose file points at another provider is exactly the owner
whose `opus[1m]` may be refused.

**Where it still cannot authenticate, the observation says so once and stops spending.** A file that cannot be read or
parsed falls back to inheriting rather than refusing — an observation that judged something beats one that judged
nothing, which is the opposite of the review's fail-closed posture and deliberately so. The first `not_logged_in`
abandons the remaining notes and the synthesis instead of rediscovering the same fact thirteen times, and the human
learns it from the line they were going to be shown anyway rather than from a document that looks complete.

**What it costs.** An owner whose host authenticates the observation by inheritance today is redirected to the provider
their environment file names, and their recourse for a refused model is `code_review_model`. And one file now
authenticates two unrestricted agents rather than one. Both are accepted, and both are written into the ADR rather than
left to be discovered.

## User Stories

1. As a human running a delivery on a daemon-launched host, I want the observation to authenticate, so that the
   **debrief** I am shown carries the judgement it was built to carry rather than a login error where its **defect**s
   belong.
2. As a human running a delivery, I want that to work from a plugin update alone, so that I do not have to discover a
   new option to get the feature I already have switched on.
3. As a human running a delivery, I want the plugin to have one place I name my credentials, so that I configure the
   thing once rather than once per part of it.
4. As a human running a delivery, I want the observation to stop calling a model the moment it learns it cannot
   authenticate, so that a broken environment costs me one call rather than fourteen.
5. As a human running a delivery, I want to be told at the end of the run that nothing was judged, so that I do not open
   a debrief expecting substance and find its shape.
6. As a human running a delivery, I want that message to name the option that controls it, so that I know where to look
   without reading the plugin's source.
7. As a human running a delivery, I want the observation to keep never touching my run, so that a credential problem in
   a diagnostic stays a problem with the diagnostic.
8. As a human running a delivery whose environment file is malformed, I want the observation to fall back rather than
   give up, so that a stray quote in a file costs me a line in a debrief and not the debrief.
9. As a human running a delivery, I want the debrief to say which identity paid for the observation, so that I can tell
   whether it came out of the account my run did.
10. As a human forwarding a debrief, I want it to name the option and never the file's path, so that a document I was
    told was safe to send unread does not carry my filesystem or my repository's name.
11. As a human forwarding a debrief, I want no credential value or variable name anywhere in it, so that the promise
    that it is safe to forward keeps meaning what it says.
12. As an owner whose environment file points at another provider, I want the synthesis's model to follow the setting I
    already used for the review, so that a provider without the long-context window has a knob rather than a permanent
    hole in every debrief.
13. As an owner who left that setting alone, I want the synthesis to run on the model it runs on today, so that widening
    it changes nothing for the common case.
14. As an owner who set that option deliberately empty, I want the synthesis to take my provider's own default, so that
    the option means the same thing everywhere it is read.
15. As an owner, I want the option's own description to tell me it authenticates the observation too, so that I learn
    what my file pays for where I configure it and not by reading a debrief.
16. As an owner, I want the observation option's description to say it draws on that same identity, so that switching
    observation on is an informed choice about spend.
17. As an owner, I want my option's saved value to survive this change, so that a plugin update does not leave every
    **round** refusing until I re-pick a file.
18. As an owner, I want the plugin to keep enumerating no variables, so that whatever I authenticate with keeps working
    without the plugin having to know what it is.
19. As the maintainer of the plugin, I want debriefs from hosts of this shape to arrive judged, so that the signal the
    feature exists to collect stops being available on one machine only.
20. As the maintainer, I want a debrief that could not authenticate to say so in one place, so that I can tell an
    unjudged run from a clean one at a glance.
21. As a contributor, I want the decision recorded in the one ADR that already owns it, so that the next person to
    change how the plugin authenticates finds one document and not two.
22. As a contributor, I want the glossary to carry **environment file** as the plugin's file rather than the review's,
    so that the next document written about it does not re-attach it to the review.
23. As a contributor, I want the earlier **spec**'s decision that the observer inherits the session's environment
    corrected where it stands, so that a delivered spec does not assert something the code no longer does.
24. As a contributor, I want the two host measurements written down with the version they were taken on, so that the
    next person meeting this does not re-derive them from a running process.
25. As a contributor, I want the code that layers the credential to carry its reasoning, so that the exception it takes
    to this repo's own rule about reading option values in a hook is visible where it is taken.
26. As a contributor, I want **replay** to read the same variable the live observer does, so that the by-hand route
    exercises the path users get rather than a second one.
27. As a contributor, I want the replay procedure to say how to point it at an environment file, so that verifying the
    judging half does not depend on remembering to export a shell.
28. As a contributor, I want the parser duplicated faithfully rather than narrowed, so that one file cannot authenticate
    a review and fail to authenticate an observation.
29. As a contributor, I want the duplication to name its sibling and its reason, so that the two copies are changed
    together.
30. As a contributor, I want the sentences that call the file "the review's" swept, so that no document is left saying
    the observation reads no environment file of its own.
31. As a contributor, I want the exposure this widens to be stated as a decision, so that nobody discovers by accident
    that an unattended synthesis holds every credential in the owner's file.
32. As a contributor, I want no new option, no credential enumeration and no reading of another process's environment,
    so that the three routes that were considered and rejected stay rejected.

## Implementation Decisions

### Modules touched

- **The observer** (`plugin/mcp/observer/`) — where the environment file is read and layered, the model resolution for
  the synthesis, the `not_logged_in` short-circuit, the wording of the debrief's spend and judging lines, and the clause
  the stop line gains.
- **The plugin manifest** (`plugin/.claude-plugin/plugin.json`) — the title and description of
  `code_review_claude_env_file`, and one addition to `observe_runs`'.
- **The decision record** (`docs/adrs/0009-…`) — renamed off "the review's" and rewritten to be about every model call
  the plugin makes, carrying this change's own trade-off and the exposure it accepts.
- **The glossary** (`CONTEXT.md`) — one term.
- **The earlier spec** (`docs/specs/run-observation/spec.md`) — D27, D28 and claim C2, corrected minimally and pointing
  at the ADR.
- **The contribution guide** (`CONTRIBUTING.md`) — the replay procedure's `--judge` form.
- **Untouched, deliberately**: the tools server, every hook, both skills, every agent definition, and `e2e-tests/`.

### The file becomes the plugin's

- **D1. One environment file authenticates every model call the plugin makes.** The **round**'s review as today, and the
  observation's **dispatch note**s and synthesis as well. The plugin still forwards no authentication of its own and
  still enumerates nothing: whatever the owner writes in the file is what the calls run under.
- **D2. Layered OVER the observer's own environment, exactly as the review layers it over the server's.** The SDK's
  `env` option replaces the subprocess environment wholesale, so the layering spreads the current environment first and
  the file's variables second — the same construction the review already uses, for the same reason. A host that
  authenticates by inheritance today is therefore redirected to the file's provider where the file assigns the same
  variables, which is the accepted cost in the Solution and the reason D7 widens the model.
- **D3. Read once, when the observation starts.** One **run** has one identity, a parse failure is reported once, and a
  file edited during a delivery cannot change who is paying halfway through a debrief. This is the same promise the
  option's own description already makes for the review: an edit takes effect the next time.
- **D4. The whole file, unfiltered.** Forwarding only the variables the plugin guesses are credentials is the
  single-provider trap ADR-0009 exists to avoid, and the server retired exactly that mechanism when it stopped copying
  `CLAUDE_CODE_OAUTH_TOKEN` and three `ANTHROPIC_*` variables out of the spawning session. The cost is that the file's
  other assignments — on the affected host, a cloud token, an OAuth client secret and a package-registry token — are in
  the environment of the synthesis, which runs unrestricted under `bypassPermissions` on a prompt carrying content
  distilled from the user's own repository, unattended, with nothing reading its output before it is written. The review
  already holds that same file under the same permissions per ADR-0006, so this is a second holder rather than a new
  kind of exposure. Accepted, and stated in the ADR rather than left to be found.

### How the file and the model reach the observer

- **D5. The path comes from the host's own `CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE`.** This repo's install
  hook records the rule that a hook must never read a `CLAUDE_PLUGIN_OPTION_<KEY>` variable to learn an effective
  *value*, because an option sitting at its manifest default is absent to a hook entirely. The exception this takes is
  the option's own `required`: an option that has no default is saved whenever it is set at all, and the plugin refuses
  every review when it is not — so on any machine where the plugin works, the variable is there. Verified present in a
  live observer's environment. The rule and its exception are recorded where the variable is read, and the install
  hook's own note gains the exception so the two do not contradict each other.
- **D6. One variable name, for both routes.** The live observer and **replay** read the same one. The server's
  `DELIVERER_`-prefixed name for the same option is not read by the observer, which never receives it — the observer is
  launched by a hook and not by the MCP configuration. `CONTRIBUTING.md`'s `--judge` form gains the variable, so
  verifying the judging half no longer depends on the contributor's shell carrying a credential.
- **D7. The synthesis's model follows `code_review_model`, read the same way.** Variable present and non-empty → passed
  verbatim, as the review passes it. Set and empty → no model is named at all, which is what that option's description
  promises means the environment's own default. Absent → the constant the synthesis uses today, which is the manifest
  default for that option anyway, so the common case is unchanged. A **dispatch note** stays on the bare `haiku` alias:
  an alias is the portable way to name a model, and the notes never needed the long-context window that makes the
  synthesis's model provider-sensitive.
- **D8. Effort is not widened.** `code_review_effort` stays the review's. The model became configurable for a
  portability reason — a long-context suffix that some providers refuse — and effort has no such failure mode: the
  observation's two depths were chosen deliberately, and tying them to a review tier would let an owner who wants cheap
  reviews quietly halve every debrief's depth.
- **D9. The parser is duplicated into the observer, faithfully.** `observer/` never imports from `server/`: the install
  hook publishes them as two independently symlinked trees, which is why the review's failure classification and the
  end-to-end harness's token rule are already re-implemented rather than shared. The copy keeps the dialect whole —
  comments, `export` prefixes, first-`=` splitting, quoting and its escapes, trailing comments, last-assignment-wins —
  and its header names its sibling and this reason, because a file that authenticates a review and not an observation is
  a failure nobody would think to look for. A narrowed re-implementation is rejected on exactly that ground.

### Where it still cannot authenticate

- **D10. An unusable file inherits, and says so.** Unreadable, unparseable, assigning nothing, or the variable absent
  altogether: the observation falls back to the environment it inherited and records that the named source was not
  usable and why, naming a line and at most a key. This is deliberately not the review's fail-closed posture: a review
  running as an unknown identity is worse than no review, while an observation that judged something is strictly better
  than one that judged nothing, and nothing the observation does can reach the run either way.
- **D11. The first `not_logged_in` ends the judging, once.** The remaining **dispatch note**s are not attempted and the
  synthesis is not attempted; the debrief says in one place that no credential reached the observation and which option
  names one. The fact is sticky for the life of the observation, because the notes half catches up on every rewrite of a
  live debrief and the synthesis runs at the finalise. The other three classifications — no result, prompt too long,
  connection lost — do not short-circuit: they are per-call conditions, and one oversized slice must not cost a run
  every remaining note.
- **D12. The debrief says which identity paid, and never where it lives.** Where the file was used, the spend line
  attributes the observation's own spend to the identity that option names; where the observation inherited, it keeps
  today's wording, which is then true. The option's key is the most a debrief may carry: the file's path is on the
  user's filesystem and routinely names their repository, which is the one thing a document that is safe to forward
  unread may not hold. Replay's own stdout is not that document and may name the path there.
- **D13. The stop line gains one clause.** Where nothing was judged for want of a credential, the line that names the
  debrief also says so and names the option. The human meets the fact where they already meet this feature, rather than
  by opening a document whose shape looks complete. The prompt-time line carries the same clause, since a human meets
  exactly one of the two.

### What is written down, and where

- **D14. ADR-0009 keeps its number, loses "the review's" from its name, and is rewritten.** The decision is that the
  plugin's model calls run under a file the owner names; the review being its first consumer is a fact about history.
  One decision belongs in one document, which is what makes an ADR the place a decision changes — so this is an edit
  rather than a second ADR. Nothing links it by path; the three references cite it by number and stay valid. The rewrite
  carries this change's own trade-off (zero configuration on every existing install, against redirecting hosts that
  authenticate by inheritance) and D4's exposure.
- **D15. The glossary gains one term, `Environment file`, and nothing else.** One or two sentences, naming the concept
  and not the option key, with the synonyms it displaces listed. It is the phrase the repo already uses in some forty
  places, and what this change breaks is the possessive rather than the word. **Identity file** is a different term
  already, so "identity" is not available for this concept in prose.
- **D16. The earlier spec is corrected, minimally, and links the ADR.** Its D27 asserts that the observer authenticates
  with the session's own environment and that there is nothing to configure; its D28 accepts contention on one account;
  its claim C2 records the inheritance assumption as narrowed-not-closed. Each is corrected to point at the rewritten
  ADR rather than to restate it, and C2 records both measurements and the version they were taken on: that the hook
  boundary drops `CLAUDE_CODE_OAUTH_TOKEN` specifically while other variables survive, and that setting it in a
  project's settings `env` block does not get it through either. A short comment at the code site cites that record.
- **D17. The manifest's copy is widened and its keys are not touched.** `code_review_claude_env_file` is retitled off
  the review and its description says it authenticates the review and the observation both; `observe_runs`' description
  gains that the observation draws on that same identity. Renaming the key is rejected: saved values are keyed by name
  and the option is required, so a rename makes every round refuse until the owner re-picks the file.
- **D18. The possessive is swept.** The sentences that call it the review's environment file, and in particular the
  `not_logged_in` detail text that today tells the reader the option "names the identity the REVIEW runs as and stays
  the review's", are corrected — that one currently says the opposite of what will be true, in the document a maintainer
  reads. The two citations of ADR-0009 in the end-to-end tests' spec are checked and corrected where the widening makes
  them wrong.
- **D19. Rejected, and recorded as rejected**: a new observation-only option; filtering the file to variables the plugin
  recognises; reading the session's own environment through `/proc/$CLAUDE_PID/environ`, which is Linux-only, impossible
  on macOS and defeats a protection the host applies deliberately; and retrying inherited credentials after a
  file-authenticated call fails. The last is what makes one run have one identity.

## Testing Decisions

**Every seam here is an existing by-hand one.** This repo has no test runner: `plugin/mcp` ships `lint` and `typecheck`
and nothing else, and CI runs those two commands for two packages and nothing more. A good check here is one that reads
the observation's own output rather than its internals — the **debrief** is the assertion surface for everything the
observer does, and all four credential outcomes surface in it, which is why this change proposes **no new seam**.

**The seams, highest first, and what each reaches:**

- **Replay with `--judge`** is the primary seam and the only one that reaches the model-calling half with no host and no
  **run** in flight. Four shapes, and the criteria are what the debrief says in each: a real file → notes and a
  synthesis, and the spend line attributing them to the identity the option names; a file assigning a bogus credential →
  one statement that nothing was judged for want of a credential, exactly one model call attempted, no synthesis
  attempted, and the option named; an unreadable or unparseable file → a debrief that says the named source was unusable
  and that the observation inherited instead, naming a line and no value; no variable at all → the same fallback, worded
  for a source nobody named.
- **Replay with nothing judging** is the regression guard, and it is free — no model, no forge, no spend. The same
  records must give the same mechanical debrief they give today, byte for byte, because nothing in this change belongs
  to that half.
- **The hook events driven by hand** are the only seam that reaches the stop line's new clause and the prompt-time
  line's, which is the procedure this repo already prescribes for the third part of the observer.
- **One live `/deliverer:` run on the affected host** is what closes the question the Problem Statement opens. It is the
  only evidence the hook-launched path can ever have of reaching a model successfully, and there is none today. One
  **dispatch** is enough.
- **`typecheck` and `lint` in `plugin/mcp`** must pass. They prove the package still runs unbuilt after the parser is
  duplicated, and nothing about behaviour.
- **`e2e-tests` is untouched.** Extending the paid end-to-end test that asserts a debrief exists so that it requires a
  judged one was considered and declined: it costs tens of minutes and real money per run in a suite that is run by hand
  anyway, and the replay seam above answers the same question for nothing.

**Prior art** is the observer's own verification procedure, which is written down for exactly this: replay for the
mechanical half, `--judge` replay for the judging half, hook events by hand for the live loop. This change adds one line
to that procedure — how to name an environment file for the `--judge` form — rather than a new method.

**What must also be true, and is read rather than run:** no credential value or variable name appears in a debrief, a
note, a trace or the stop line; the debrief names the option key and never the file's path; the duplicated parser
accepts and rejects exactly what its sibling does; the glossary's words are used and the synonyms its `_Avoid_` lists
displace are not; each file's register and column width are preserved.

## Out of Scope

- **A new option of any kind.** Per D19 — the widening is what makes this a plugin update rather than a configuration
  change.
- **Observation-specific model or effort options**, per D7 and D8.
- **Filtering the environment file**, per D4, and **reading another process's environment**, per D19.
- **Retrying inherited credentials after the file's fail**, per D19.
- **Any change to the review**, to the tools server, or to how a round is driven. The review already had this decision;
  only the document that records it changes.
- **The contention decision itself.** The observation may now draw on a different account than the run, which changes
  what that decision is about but not what it decided: no back-off, no deferral, no detection of what kind of credential
  is in hand. D28 is corrected, not reopened.
- **A judged-debrief assertion in `e2e-tests`**, declined with grounds above.
- **Making observation refuse to start where it cannot authenticate.** A header and its figures are worth having on
  their own, which is a standing decision of the earlier spec and not this change's to revisit.
- **The host's behaviour.** That `CLAUDE_CODE_OAUTH_TOKEN` is withheld from hooks is recorded as a **claim** about a
  version, never as something the plugin relies on staying that way — and nothing here asks the host to change.

## Further Notes

### The measurements behind the Problem Statement

All of it was taken on one machine against Claude Code 2.1.251, and the two host facts are reproducible from the
description in D16 rather than from anything that survives: a probe project whose hook dumps what it inherits, run once
with an ordinary variable in its settings `env` block and once with `CLAUDE_CODE_OAUTH_TOKEN` in the same block. The
first crosses the boundary; the second does not. The affected debriefs and the live observer's environment were read
where the plugin had written them, under its own data directory, and the observation directory is outside every
repository by construction.

### This is not the enumeration the server retired

The plugin once copied `CLAUDE_CODE_OAUTH_TOKEN` and three `ANTHROPIC_*` variables out of the spawning session into the
review's environment, and ADR-0009 exists because that made the plugin single-provider: the set was fixed when the
plugin shipped, so an owner authenticating any other way had no way in. Widening the file to the observation is the
opposite move — the plugin learns nothing about what a credential is, and the observation stops depending on a variable
name the plugin would otherwise have had to know.

### What an affected host gets, and what a working one risks

An owner on the affected shape gets a judged debrief from a plugin update, with no configuration and no upgrade step,
because their file already assigns the credential their session uses. An owner whose host authenticates the observation
by inheritance today may be redirected to the provider their file names, and their recourse for a model that provider
refuses is `code_review_model` — which is why D7 widens it in the same change rather than leaving it for the first
person to hit it.

### Open forks

None. Every decision above was settled with the human in the room, including the four that were recommended against an
alternative: the file being used always rather than behind a new option, the layering being over rather than
gap-filling, the fallback being inheritance rather than refusal, and the short-circuit triggering on `not_logged_in`
alone.
