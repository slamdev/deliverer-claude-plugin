# 05 — The options say what they now do

Status: ready-for-agent

**Blocked by:** 02, 04

**What to build:** an owner opening `/plugin` reads that the file they name authenticates the review **and** the
observation, and that leaving observation on spends on that identity — so what their file pays for is learned where they
configure it rather than from a **debrief** afterwards. Settled as D17 in `../spec.md`.

- [ ] `code_review_claude_env_file` is retitled off the review, keeps its key, and stays `required`.
- [ ] Renaming the key is refused, and the reason is worth stating once here: saved option values are keyed by name and
      this one is required, so a rename makes every **round** refuse until the owner re-picks the file — an upgrade that
      breaks the plugin for everyone who already configured it correctly.
- [ ] Its description says the variables are handed to every model call the plugin makes: each round's review, and the
      observation's **dispatch note**s and synthesis.
- [ ] Everything that description already promises survives: `.env` format with its quoting, layered OVER the process's
      own environment so the file need only carry what it changes, read once so an edit takes effect in a new session,
      and required because the plugin forwards no authentication of its own.
- [ ] `observe_runs`' description says the observation draws on that same identity, so leaving it on is an informed
      choice about spend.
- [ ] Everything that description already promises survives too: out of band, unable to slow, block, edit or fail a run,
      writing only under the plugin's own data directory, bounded to the plugin, a line naming the debrief when the run
      stops, and off meaning nothing starts at all.
- [ ] Neither description names a variable, a provider or a model id, and neither promises which of the plugin's calls
      costs more than the other.
- [ ] `code_review_model`'s description says the setting also carries the synthesis's model, in one clause, without
      restating what that model is for. It is the recourse ticket 03 exists to give an owner on another provider, and an
      owner who never reads the observation's option must still find it.
- [ ] The register of the file's existing copy is matched: second person, no hedging, and the sentence that says what
      goes wrong if the option is left wrong.
- [ ] The manifest still validates against its schema, and the four options are still four. No option is added, and none
      is removed.
- [ ] Read back through `/plugin` on a machine carrying the plugin, because that is where a user meets this text — and
      checked there rather than inferred from the JSON.
