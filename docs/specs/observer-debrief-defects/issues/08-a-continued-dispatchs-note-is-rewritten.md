# 08 — A continued dispatch's note is rewritten, and its duration runs to its record's end

**What to build:** a maintainer reading a debrief of a run with a **put-back** finds the continued stage's note
describing what it finally did, never a first attempt's state, and its time covering the same span as its tokens, so
the slow stage is the one named as slow. Settled as Solution item 3 and under **The replaced note** in `../spec.md`.

**Blocked by:** 01 — where a continue's entries land.

**Status:** ready-for-agent

- [ ] A dispatch keeps one note. When a continue to its agent finishes, the note is rewritten in place from the whole
      record at the note's existing input budget, as a first note is today.
- [ ] The note states how many continues it covers and the last entry it read. The synthesis only ever sees the latest.
- [ ] A re-armed observer rewrites a note only when the record has grown past that entry.
- [ ] A dispatch's tokens are still summed over its whole record; its duration runs from its start to the record's last
      entry.
- [ ] Free replay: a continued dispatch's duration runs to its record's last entry.
- [ ] Judged replay (`--judge`), on one refine and one build record with put-backs: one note per dispatch, and a
      continued dispatch's note covers its continues and names how many.
- [ ] Driven by hand through the hook script: an observer killed after a note and re-armed with the record unchanged
      rewrites no note.
- [ ] Free replay of a record with no put-back is byte for byte as before; two replays are identical.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
