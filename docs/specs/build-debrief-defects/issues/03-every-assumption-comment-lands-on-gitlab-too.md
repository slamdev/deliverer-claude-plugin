# 03 — Every assumption comment lands, on GitLab too

Status: resolved

**Blocked by:** None — can start immediately.

**What to build:** every **assumption** the tickets recorded is posted where the forge stores it, so no **fork** ships
unadjudicated because no anchor would take it. `change-request-creator`'s rung 3 GitLab example is a bare `commit_id`,
which GitLab accepts and stores nothing positional for: in each of the four runs that used it, it led to a post, a
delete and a repost, or to the anchor being written into the body. And where the file is not in the diff at all, both
the file-level and the commit anchor are refused, so one assumption was never posted. Settled as change 3 in
`../spec.md` § Solution and under § The anchoring ladder.

The positional form is a claim until checked, so the check comes first: a throwaway GitLab project under the owner's
personal namespace, one merge request of two commits, the second moving a line the first added. One **assumption
comment** is posted at each rung, every discussion is read back to confirm what it stored, and the project is deleted
(`../spec.md` § Testing Decisions).

- [x] The throwaway project's results are recorded in this ticket's comments: for each rung, the request posted and
      what GitLab stored, positional fields included. The project is deleted afterwards.
- [x] Rung 3's GitLab example is a positional `text` form against the recording commit's own diff — base and start at
      its parent, head at the commit — where the probe shows GitLab stores it. Where it does not, rung 3 on GitLab is
      the general comment, and the example says so.
- [x] Rung 3 keeps its meaning and its GitHub example.
- [x] A rung 4 that always holds joins below it: a general comment carrying the entry's `file:` and `line:`, its body
      opening with the same `ASSUMPTION (<hash>)` prefix, worked for both forges.
- [x] The file-level rung is described as covering a file the diff carries at a line it does not, not a file the diff
      never touched.
- [x] The rule that a comment at rung 3 is reported as "anchored anywhere but at a translated line on head" covers
      rung 4 too, in the agent and wherever the build skill restates it.
- [x] The GitLab and GitHub forms stay worked examples of one mechanism (ADR 0012).
- [x] The file is read against `/mattpocock-skills:writing-for-agents`, and its register and 120-column wrap are kept.

## Comments

### The anchor probe, 2026-10-31

A private project under the owner's namespace on `gitlab.audienzz.ch`, deleted afterwards (permanently: a plain delete
only schedules it, so a second `DELETE` with `permanently_remove=true` followed, and a read of the project then came
back `404`). `main` carried `a.txt` (ten lines) and `untouched.txt` at `C0`. The change request held two commits: `C1`
added `ALPHA` at line 3 and `BETA` at line 4; `C2` inserted five lines above `ALPHA`, moving it to line 8, and deleted
`BETA`. Its one diff version had base and start at `C0` and head at `C2`. Each body opened `ASSUMPTION (<C1>)`, and
every discussion was read back from `merge_requests/:iid/discussions`. Every one stored `resolvable: true` and
`individual_note: false`, and none stored a note `commit_id`.

| Rung                    | Request posted                                   | What GitLab stored                             |
|-------------------------|--------------------------------------------------|------------------------------------------------|
| 1                       | `text`, `new_line` 8, the version's shas         | `DiffNote`, `text`, `new_line` 8, head `C2`    |
| 2                       | `file` on `a.txt`, the version's shas            | `DiffNote`, `file`, `a.txt`, head `C2`         |
| 2, file off the diff    | `file` on `untouched.txt`, the version's shas    | `DiffNote`, `file`, `untouched.txt`: accepted  |
| 3, as shipped           | a bare `commit_id=<C1>`                          | `DiscussionNote`, `position: null`             |
| 3, `BETA`, gone on head | `text`, `new_line` 4; base, start `C0`; head `C1` | `DiffNote`, `text`, `new_line` 4, head `C1`   |
| 3, `ALPHA`, on head     | `text`, `new_line` 3; base, start `C0`; head `C1` | `DiffNote`, `text`, `new_line` 8, head `C2`   |
| 4                       | no position, the body alone                      | `DiscussionNote`, `position: null`             |

The positional form against the recording commit's own diff is stored, so rung 3's GitLab example ships as that form
rather than falling back to the general comment. Where the line survives to head, GitLab carries the position forward
itself: the `ALPHA` post came back at line 8 against `C2`. The bare `commit_id` is confirmed to store nothing
positional — a general comment with its anchor lost. GitLab did not refuse a file-level position on a file outside the
diff: it stored one against a file the change request's changes never show, which is why the ladder sends that case to
rung 4 rather than to rung 2.

### The rung-3 re-probe, 2026-10-31

The first probe's recording commit `C1` was the change request's first, so its parent was the diff base and its
rung-3 position matched the version's own base and start. A second private project under the owner's namespace probed
the normal case, and was deleted the same way (a `DELETE`, then a second with `permanently_remove=true` and the
project's renamed `full_path`; a read by id and by the original path then came back `404`). `main` carried `a.txt`
(ten lines) at `C0`. The change request held four commits: `C1` and `C2` each edited `a.txt`; `C3`, the recording
commit, added `GAMMA` at line 5 and `DELTA` at line 6; `C4` inserted two lines above `GAMMA`, moving it to line 7, and
deleted `DELTA`. Its one diff version had base and start at `C0` and head at `C4`, so `C3`'s parent `C2` is not the
base. Each body opened `ASSUMPTION (<C3>)`, both posts used base and start `C2` and head `C3`, and both discussions were
read back from `merge_requests/:iid/discussions`: each stored `resolvable: true`, `individual_note: false` and no note
`commit_id`.

| Line                   | `new_line` posted | What GitLab stored                                            |
|------------------------|-------------------|---------------------------------------------------------------|
| `DELTA`, gone on head  | 6                 | `DiffNote`, `text`, `new_line` 6; base, start `C2`; head `C3` |
| `GAMMA`, moved on head | 5                 | `DiffNote`, `text`, `new_line` 7; base, start `C0`; head `C4` |

GitLab accepts and stores the positional form against a recording commit whose parent is not the diff base, so rung
3's GitLab example stands as shipped. As in the first probe, a line that survives to head is carried forward onto the
change request's own version — here with its base and start moved from `C2` to `C0` as well — and a line gone on head
keeps the recording commit's position as posted.
