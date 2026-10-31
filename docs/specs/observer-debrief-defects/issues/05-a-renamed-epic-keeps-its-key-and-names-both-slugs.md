# 05 — A renamed epic keeps its key and names both slugs

**What to build:** a human who renamed an epic during a run finds its debrief headed with the name it ended with, and
the first name beside it, so they can find it by either. Everything the observer keys by the slug keeps the first one.
Settled as Solution item 6 and under **The slug** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The trace keeps the first task update's slug as the key and also carries the last.
- [x] The debrief's headline takes the last slug, and names the first beside it whenever they differ.
- [x] The observation directory, the identity file and every earlier debrief's lookup keep using the key.
- [x] Free replay of a renamed epic's record: headed with the last slug, naming the first, its files under the first.
- [x] Free replay of a record whose slug never changed is byte for byte as before; two replays are identical.
- [x] `npm run typecheck && npm run lint` pass in the plugin's Node package.

## Comments

- "Every earlier debrief's lookup keeps using the key" was checked by reading, not by replay: the lookup
  (`continuity.ts`, reached only from the judged path) still reads `Trace.slug`, which this change does not move, and
  a free replay never performs it. The directory and the identity file were checked by replay of a renamed copy.
- The headline's last slug is the last one *inside the extent* (`RunFacts.lastSlug`), not the record's: one real record
  (a delivery whose session later opened another epic's tasks) would otherwise be headed with an epic the run never
  touched. The trace's own `last slug` row is the record's, and appears only where it differs from the key, so that
  record's trace gains that one row while its debrief stays byte for byte as before.
