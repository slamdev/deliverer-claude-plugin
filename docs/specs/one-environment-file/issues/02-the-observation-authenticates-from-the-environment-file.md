# 02 — The observation authenticates from the environment file

Status: ready-for-agent

**Blocked by:** 01

**What to build:** on a machine whose only Anthropic credential is one the host withholds from hooks, a **replay** with
`--judge` produces a **debrief** that has **dispatch note**s and a synthesis in it — because the observation now runs
under the **environment file** the owner named, exactly as each **round**'s review does. Where no usable file is named
it inherits as it does today, and says so. Settled as D1 to D6, D9, D10 and D12 in `../spec.md`, and as
[ADR-0009](../../../adrs/0009-the-plugins-model-calls-run-under-an-environment-file-the-owner-names.md).

- [ ] The observation reads the file's path from the host's own `CLAUDE_PLUGIN_OPTION_CODE_REVIEW_CLAUDE_ENV_FILE`.
- [ ] The code that reads it records why that is allowed here, because the repo's own install hook forbids it in
      general: a hook must never read a `CLAUDE_PLUGIN_OPTION_<KEY>` variable to learn an effective value, since an
      option sitting at its manifest default is absent to a hook entirely. This option is `required`, so it has no
      default, is saved whenever it is set at all, and the plugin refuses every review when it is not — which is why on
      any machine where the plugin works, the variable is there. The install hook's own note gains the exception, so the
      two do not contradict each other.
- [ ] The file's variables are layered OVER the observation's own environment for every model call it makes: the
      dispatch notes and the synthesis both, with nothing else in either call changed.
- [ ] The layering spreads the current environment first and the file second. The SDK's environment option replaces a
      subprocess's environment wholesale, so anything but that construction would hand a model call an environment
      carrying only what the file happens to name — and it is the construction the review already uses, for the same
      reason.
- [ ] The file is read ONCE, when the observation starts, and never per call. One **run** has one identity, a parse
      failure is reported once, and a file edited during a delivery cannot change who is paying halfway through a
      debrief.
- [ ] The whole file is forwarded, uninterpreted. No variable name is enumerated, no provider is recognised, and nothing
      about what a credential looks like is encoded anywhere in the observation.
- [ ] The `.env` dialect is parsed exactly as the review parses it, by a copy that lives with the observation: blank
      lines and comments skipped, an `export` prefix accepted, the first `=` splitting, keys as an environment can carry
      them, quoting with its escapes, a trailing comment after an unquoted value, and the last assignment of a repeated
      key winning. A line the parser does not understand is a refusal rather than a silent skip.
- [ ] That copy's header names its sibling and says why it is a copy rather than an import: the two source trees are
      published independently of each other, which is why the review's failure classification and the harness's token
      rule are already re-implemented rather than shared. A narrowed parser is refused on the record — one file that
      authenticates a review and fails to authenticate an observation is a failure nobody would think to look for.
- [ ] A file that cannot be read, cannot be parsed, or assigns nothing at all falls back to the inherited environment
      rather than refusing, and the debrief says that the named source was unusable and why — naming a line and at most
      a key, never a value.
- [ ] The variable being absent altogether is the same fallback, worded for a source nobody named. That is what a
      **replay** run without it meets, and it is a state rather than an error.
- [ ] The debrief's spend line says which identity paid for the observation: the identity that option names where the
      file was used, and today's wording where the observation inherited, which is then true.
- [ ] Neither the debrief nor a **dispatch note** ever carries the file's path. It is on the user's filesystem and
      routinely names their repository, which is the one fact a document that is safe to forward unread may not hold.
      **Replay**'s own stdout is not that document, and may name it there.
- [ ] Replay reads the same variable the live observation reads, so the by-hand route exercises the path users get
      rather than a second one. The server's `DELIVERER_`-prefixed name for the same option is not read here: the
      observation is started by a hook and never by the MCP configuration, so it never receives that name.
- [ ] Verified by replay from a terminal carrying no Anthropic credential of its own, in three shapes: a file assigning
      a real one → notes and a synthesis, with the spend line attributing them; an unreadable or malformed file → the
      fallback and its line; no variable → the same fallback.
- [ ] A run replayed with nothing judging still gives the same mechanical debrief it gives today, byte for byte. Nothing
      in this ticket belongs to that half.
- [ ] `plugin/mcp` typechecks and lints, and the package still runs unbuilt.
- [ ] Nothing in the run's own path changes: no hook, no skill, no agent definition, and nothing in the tools server.
