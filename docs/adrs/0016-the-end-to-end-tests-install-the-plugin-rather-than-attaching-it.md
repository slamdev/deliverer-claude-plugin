# The end-to-end tests install the plugin rather than attaching it

Every end-to-end run installs the plugin the way a user does: a marketplace is added, `deliverer` is installed from it,
and its options are set. Nothing is pointed at `plugin/` directly, even though the Agent SDK offers exactly that and it
is one line.

The one line does not work, and the way it fails is the reason this is written down. A plugin attached by path loads its
skills, its agents and its commands — and silently starts no tools server, because `code_review_claude_env_file` is
required and a path-attached plugin has no channel through which an option can be given. Measured: the session comes up
with the two commands, all seven agents, and `mcp_servers: []`. A build run against it would reach its first round and
find no review tool. The channel that does exist is keyed by `plugin@marketplace`, so only an installed plugin has a key
— and it is read at user scope, not project scope, which is its own quiet failure: the option sits in the settings file,
is ignored, and the server never starts.

So the tests install. That drags in the whole shipped path — the marketplace entry, the declared dependency on
`mattpocock-skills` that `refine` refuses to run without, the `SessionStart` install hook, `launch.mjs`, and
`${user_config.*}` substitution through `plugin/.mcp.json`. None of that is checked by anything else, and all of it is
between a user and a working plugin.

An install takes what a marketplace's source has committed, which is the branch and not the working tree. A test that
covered the last commit rather than the change in front of the contributor would be worse than no test, so what the
marketplace is pointed at is a **staged copy** — the working tree committed into a temporary repository, made fresh for
each run.

## Consequences

Two things exist only to make this work, and both are load-bearing: the staged copy, and a configuration directory
created per run and populated by adding two marketplaces and installing into it. That directory is also what the run's
transcripts land in, so the isolation and the record are the same decision.

The cost is paid in wall-clock and in reach. Every run clones the official marketplace before it can install, so the
tests need the network to be up and a run cannot start instantly. Runs stay independent for exactly that price, and a
stale plugin from a previous run — the one failure that would invalidate a test while looking green — cannot happen.

What is untested is the arrangement this rejected: nothing here exercises a plugin loaded by path, so if that route ever
grows an option channel, this decision is worth reopening against a fresh measurement rather than on the strength of
this one.
