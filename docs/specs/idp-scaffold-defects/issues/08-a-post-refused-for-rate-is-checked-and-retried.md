# 08 — A post refused for rate is checked and retried

**What to build:** `change-request-creator` mirroring a large epic's assumptions meets a forge's refusal of a burst as
a case it was told to expect: it checks whether that entry's comment landed, waits, and retries the same entry, the
wait growing with each further refusal — so the first pass of posting is the one that works and no assumption carries
two comments. Settled under **The refused post** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The posting step says a forge may refuse a burst of posts, and that a refusal for rate is expected.
- [ ] It says to check whether the refused entry's comment landed before retrying it.
- [ ] It says to retry the same entry after a wait that grows on each further refusal.
- [ ] No forge, API or limit is named.
- [ ] The rule that the next entry's anchor is found only once a comment is posted stands as written.
- [ ] Edited with `/mattpocock-skills:writing-for-agents`; wrapped at 120 columns.
