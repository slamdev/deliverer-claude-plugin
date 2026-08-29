# 03 — The synthesis's model follows the owner's setting

Status: ready-for-agent

**Blocked by:** 02

**What to build:** an owner whose **environment file** points at a provider that refuses the long-context suffix still
gets a synthesis, because the model it runs on is the one they already set for the review. Ticket 02 is what makes this
matter: once the observation runs under a file the owner named, the provider it reaches is the owner's choice, and the
model the synthesis hard-codes is the one that provider may refuse. Settled as D7 and D8 in `../spec.md`.

- [ ] Where `CLAUDE_PLUGIN_OPTION_CODE_REVIEW_MODEL` carries a value it is passed verbatim, exactly as the review passes
      it: an alias resolves against whatever provider the environment file names, a pinned id only means the same thing
      on the provider it came from, and the plugin interprets neither.
- [ ] Where it is set and EMPTY, no model is named at all and the provider's own default serves the call. That is what
      the option's own description already promises, and telling set-empty apart from absent is the whole reason the
      variable is read rather than defaulted.
- [ ] Where it is ABSENT the synthesis runs on the model it runs on today. An option at its manifest default is absent
      to a hook, so absent is the common case rather than a gap, and the constant the observation already carries is
      that manifest default — so nothing changes for an owner who never touched the option.
- [ ] A **dispatch note** stays on the bare cheap alias. A note never needed the long-context window that makes the
      synthesis's model provider-sensitive, and an alias is the portable way to name a model.
- [ ] Reasoning depth is untouched, and the review's effort tier stays the review's. The model became configurable for a
      portability reason — a long-context suffix some providers refuse — and depth has no such failure mode: tying the
      observation's depth to a review tier would let an owner who wants cheap reviews quietly halve every debrief's.
- [ ] A model the provider refuses stays a named judging failure with no fallback, no second call on a bare alias and no
      new option, exactly as it is today. What this ticket adds is a knob the owner already has, not a retry.
- [ ] The comment ticket 02 wrote about reading an option value in a hook-launched process is extended rather than
      duplicated. This is the case that variable's absence does NOT settle — one option is required and the other
      carries a default — and the difference between the two is what a reader needs.
- [ ] The debrief still names the model each call was served by, so a reader can tell which of the three cases they are
      looking at without being told.
- [ ] Verified by replay in three shapes: the variable set to a bare alias, set empty, and absent. The debrief's own
      cost line names what served the call in each.
- [ ] `plugin/mcp` typechecks and lints.
