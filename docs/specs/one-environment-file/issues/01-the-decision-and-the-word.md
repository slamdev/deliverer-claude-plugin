# 01 — The decision and the word

Status: done

**Blocked by:** None — can start immediately.

**What to build:** a contributor reading why the plugin authenticates the way it does finds one decision record about
every model call the plugin makes, rather than one about the review with the observation's half missing — and a
contributor writing the next document about that file finds the word for it in the glossary. **Prefactoring**: it lands
first so that no ticket after it has to argue the decision while also implementing it, and so each of them cites a
record that already says what it rests on. Settled as D14 and D15 in `../spec.md`.

- [x] ADR-0009 keeps its number and loses the possessive from its name: the file becomes
      `0009-the-plugins-model-calls-run-under-an-environment-file-the-owner-names.md`, and the old name is gone rather
      than left beside it.
- [x] The rename breaks no link, and that is checked rather than assumed: every reference in the tree cites the ADR by
      number, and the search that establishes it is run.
- [x] Its subject is every model call the plugin makes — each **round**'s review, and the observation's **dispatch
      note**s and its synthesis. The review having been the first consumer reads as history rather than as the decision.
- [x] Everything the original settled survives with its reasoning intact: no fixed set of variables the plugin forwards,
      because a set decided when the plugin ships makes it single-provider; layered over the environment rather than
      replacing it, so the file need only carry what it changes; read once, so an edit takes effect the next time; and
      nothing the plugin reports ever echoes a value — every diagnostic names a line, and at most a key.
- [x] It carries the trade-off this change made. Every existing install already has the file, because the option is
      required, so an affected host is fixed by a plugin update with nothing to configure and no upgrade step — against
      a host that authenticates by inheritance today being redirected to the provider its file names, whose only
      recourse is the model option.
- [x] It carries the exposure the widening buys: one file now authenticates two unrestricted agents rather than one, and
      the second runs unattended with nothing reading its output before it is written. Filtering the file down to the
      variables the plugin recognises is named and refused there, on the same ground as the original decision.
- [x] It says that the review refuses where the observation degrades, and why the two postures differ: a review running
      as an unknown identity is worse than no review, while an observation that judged something is better than one that
      judged nothing, and nothing the observation does reaches the **run** either way.
- [x] It names no other ADR, no **spec** and no **ticket**. That is how every ADR in the tree already reads, and it is
      what keeps the doc stack citing downward only.
- [x] `CONTEXT.md` gains **Environment file** in its one `## Language` list: what it IS in one or two sentences, no
      option key, and an `_Avoid_` line naming the synonyms it displaces — credentials file, `.env`, secrets file,
      identity.
- [x] That term sits beside the terms about a **round** rather than among the observation's artefacts. **Trace**,
      **Dispatch note** and **Identity file** are things the **observer** writes; this is a thing the owner writes, and
      placing it among them would read as something the plugin produces.
- [x] **Identity file** is left exactly as it is, and no other term changes. The word "identity" is already spoken for,
      which is why this term is named for what the file is.
- [x] Nothing else in the tree is touched: no behaviour, no manifest copy, and none of the sentences elsewhere that
      still call the file the review's — those are ticket 06's, and correcting them here would leave two tickets editing
      one line.
