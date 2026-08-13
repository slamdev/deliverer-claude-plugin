# 05 — Post an assumption comment the forge can actually resolve

**What to build:** every **assumption comment** goes onto the **change request** through a conversation mechanism the
forge can mark **resolved**, anchored at the file and line the assumption entry already names, with the entry's text
carried over verbatim. The requirement that these comments require resolution stops being a property nobody was told how
to obtain.

An observed run posted all 43 assumption comments and all 43 **verdict** replies through the general comment channel,
which carries no resolution state at all — 90 comments that can never be resolved against 10 that can — while every one
of the 43 entries carried an exact `file:` and `line:` that was rendered as prose. Settled as D5, D7, D8, D11, D12 and
D13 in `../spec.md`.

**Blocked by:** 01 — the worked examples name two forges. 04 — the collectors must be able to see the new channel before
the poster starts using it.

**Status:** ready-for-agent

- [x] The requirement names the capability: the comment goes through whatever conversation mechanism the forge can mark
      resolved.
- [x] Two worked examples for posting — GitHub and GitLab — plus the instruction to use the equivalent on any other
      forge.
- [x] The entry's file and line are used as the anchor the mechanism needs, rather than being left in prose only.
- [x] The comment body is carried over verbatim whichever way it is anchored, per ADR-0014.
- [x] Where the anchor no longer exists on the head commit, the comment anchors to the commit that recorded the
      assumption — the one its prefix already names.
- [x] The fallback is stated, so an agent does not invent one per assumption; anchoring to a nearest surviving line is
      not it.
- [x] Every channel is read before posting, so a change request whose comments were posted the old way gains no
      duplicates and the resume contract still holds — add only what is missing.
- [x] Nothing verifies the mechanism at write time, per D11, and no counts are reconciled, per D12.
- [x] One comment per assumption, unbatched, per ADR-0014.
- [x] The file's register and column width are matched.
