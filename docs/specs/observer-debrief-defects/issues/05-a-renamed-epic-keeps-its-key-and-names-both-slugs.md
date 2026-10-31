# 05 — A renamed epic keeps its key and names both slugs

**What to build:** a human who renamed an epic during a run finds its debrief headed with the name it ended with, and
the first name beside it, so they can find it by either. Everything the observer keys by the slug keeps the first one.
Settled as Solution item 6 and under **The slug** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The trace keeps the first task update's slug as the key and also carries the last.
- [ ] The debrief's headline takes the last slug, and names the first beside it whenever they differ.
- [ ] The observation directory, the identity file and every earlier debrief's lookup keep using the key.
- [ ] Free replay of a renamed epic's record: headed with the last slug, naming the first, its files under the first.
- [ ] Free replay of a record whose slug never changed is byte for byte as before; two replays are identical.
- [ ] `npm run typecheck && npm run lint` pass in the plugin's Node package.
