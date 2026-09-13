# Stage 3 as it was dispatched — where every file beside this one came from

The **bench** (`harness/writer-bench.ts`) replays one **spec-writer** **dispatch** out of this directory, so a change
to the writer can be read for about $5 instead of the $24 a whole **refinement** costs. These files are that
dispatch's inputs, taken from one **run** and never edited since.

**The run is `refine-typescript-library-2026-09-12T09-13-58-mfWFt4`**, driven on 2026-09-12 against this fixture:
`claude-opus-5` at effort `high`, Claude Code 2.1.220. It spent $21.61 over 47m 47s and published a 55.9 KB spec over
ten **ticket**s, its **spec-writer** taking $8.47 of that across three segments — one dispatch and two **put-back**
waves.

## The trap this directory exists to avoid

**The **brief** left on disk at the end of a run is not the brief the writer was dispatched with.** Six `Edit` calls at
09:44, after the writer's first **report** had already landed, folded the human's answers to that report's **fork**s
back into `tmp/word-wrap-brief.md`. Read that file and you hand the writer the answers to the forks it is supposed to
raise, and the reading measures a stage that cannot happen.

The difference is not small, and the same happened to every other input:

| file | as dispatched, here | left on disk at the end of the run |
|---|---|---|
| `brief.md` | 18,655 characters | 23,595 bytes |
| `clone/CONTEXT.md` | 2,046 characters | 2,968 bytes |
| `clone/docs/adr/0002-…` | 720 characters | 866 bytes |
| `clone/docs/adr/0003-…` | 1,389 characters | 2,555 bytes |

So every file here was reconstructed from the **orchestrator**'s own `Write` calls in its session record, taking each
file's last write **before `09:29:20`** — the moment the `deliverer:spec-writer` dispatch went out. ADR 0001 is
byte-identical either way, which is the control: it is the one the put-backs never touched.

## What each file is

- **`brief.md`** — the brief stage 2 wrote and stage 3 was handed the path to. It carries the idea, the decisions the
  grilling settled with their **grounds**, the forks it left open, the artifacts the session landed, and the numbered
  **claim**s the session never checked. The bench copies it into the arm and hands the writer its path, exactly as an
  orchestrator does.
- **`prompt.md`** — the dispatch prompt, verbatim from that orchestrator's `Agent` call, with the two paths it named
  replaced by `{{BRIEF}}` and `{{CLONE}}`. It is the orchestrator's wording and not the bench's: the writer is being
  measured against what this plugin's skill actually produces.
- **`clone/`** — what stage 1 landed in the working tree before the dispatch, laid over the fixture's own
  `repository/` when an arm's clone is built. One glossary and three ADRs, which is what the brief's artifacts section
  points the writer at.

## What is not here, and why

**No `node_modules/`.** A real run clones the **standing repo**, which carries none, so the writer meets a repository
it has to install before it can run anything — and building a prototype is where this stage's output tokens go. An arm
that started with the dependencies installed would be measuring a stage no run has.

**No answers to the forks.** The **put-back** waves are driven by `harness/put-back.ts`, which stands in the human's
seat and answers out of the fixture's own `brief.md` one directory up — the human's prior, not this one. Answers
written down here would be answers the writer could read.
