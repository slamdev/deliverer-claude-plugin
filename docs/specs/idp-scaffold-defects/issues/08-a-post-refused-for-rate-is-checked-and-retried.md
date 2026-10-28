# 08 — A post refused for rate is checked and retried

**What to build:** `change-request-creator` mirroring a large epic's assumptions meets a forge's refusal of a burst as
a case it was told to expect: it checks whether that entry's comment landed, waits, and retries the same entry, the
wait growing with each further refusal — so the first pass of posting is the one that works and no assumption carries
two comments. Settled under **The refused post** in `../spec.md`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The posting step says a forge may refuse a burst of posts, and that a refusal for rate is expected.
- [x] It says to check whether the refused entry's comment landed before retrying it.
- [x] It says to retry the same entry after a wait that grows on each further refusal.
- [x] No forge, API or limit is named.
- [x] The rule that the next entry's anchor is found only once a comment is posted stands as written.
- [x] Edited with `/mattpocock-skills:writing-for-agents`; wrapped at 120 columns.

## Comments

Verified by hand against `plugin/agents/change-request-creator.md`:

- Step 6 gains one paragraph, after its three sub-steps and before the anchor rule: a forge may refuse a burst of
  posts and a refusal for rate is expected; read back whether that entry's comment landed (where it did, the entry is
  done); where it did not, wait and post the same entry again, each wait longer than the last.
- A case-insensitive grep of the new paragraph for forge names, status codes, "rate limit", "minute" and "hour" finds
  nothing: no forge, API or limit is named.
- "The next entry's anchor is found only once that comment is posted" and the rest of step 6 are untouched.
- Edited with `/mattpocock-skills:writing-for-agents` (positive phrasing, co-located with the posting sub-step); the
  new lines are 116–119 columns.
