# WP-02 — Independent QA plan (Design-authored, NOT RUN)

**Host:** a separately user-opened Claude cloud session: Linux x86_64, Node v22.23.5.
- Run **all** tests and probes through `run-offline.sh` ([A54](../../architecture/D007_A54_WP01_EGRESS_BOUNDARY_AMENDMENT.md) §3, as hardened in A55). The egress probe must PASS first.
- Run git outside the network namespace.

## Preflight
1. Record `uname -sm` and `node --version`.
2. Run `git ls-remote origin refs/heads/exec/WP-02-project-paper-read` as the **first** remote attempt. It must exit 0 and return the exact SHA.
3. Make a fresh full clone and check out the exact SHA, detached. Confirm a clean tree.
4. Confirm the WP-02 G1 Base is an ancestor and that there are no merge commits.
5. The diff against Base may contain only whitelisted paths.
6. Confirm that `packages/wp-01-synthetic-auth-api/**` is **byte-unchanged**.
7. Check the fixture SHA-256 matches `c4fc68af…f888`.

## Required checks
| ID | Independent expectation (QA's own client and assertions) |
| --- | --- |
| Q2-01 | A6-01: `user/fakeLib01/XFAKE001` is one canonical paper in alpha, beta and gamma. The seeded re-import into gamma leaves the counts unchanged. |
| Q2-02 | A6-02: `group/fakeLib02/XFAKE001` and `user/fakeLib01/XFAKE002` (same title and DOI as XFAKE001) are distinct papers with their own status and note. |
| Q2-03 | The `state=active\|archived\|all` filters return exactly the fixture `expected` lists. The counts match `expected.projectCounts`. The foreign Project never appears. |
| Q2-04 | Global vs local: XFAKE001 has `Reading` and the same note through every Project. `important` is true only in alpha (E9-02, U6-L4-01). |
| Q2-05 | Detail `associations` lists alpha, beta (`archived:true`) and gamma only. The foreign Project never appears. |
| Q2-06 | FOREIGN, ANONYMOUS, foreign paper/Project and non-existent IDs each return a **byte-identical** 403 body and identical headers, apart from per-request noise that QA documents. |
| Q2-07 | WORKSPACE_READONLY: every GET succeeds. Every non-GET returns 405 with no state change. |
| Q2-08 | Read-only: a full state digest before and after all QA requests is equal. No route mutates state. |
| Q2-09 | The note's five keys come back byte-exact (UTF-8 compare against the fixture). |
| Q2-10 | Transport: loopback only. Path traversal and encoded separators in `{libraryId}`/`{itemKey}` are rejected. |
| Q2-11 | WP-01 regression: the unchanged WP-01 suite is still 67/67. |

## Runs and mutation
- **Full suite:** the full WP-02 suite plus the WP-01 suite, in 5 separate processes, each exit 0. Record the counts.
- **QA mutants:** at least 8, applied in a scratch copy, each killed by a named test. At least these must be included:
  - title/DOI merge of papers;
  - itemKey-only identity;
  - `important` made global;
  - foreign Project leaked into associations;
  - archived Project hidden from detail;
  - distinguishable 403 for missing vs foreign;
  - a non-GET mutating state;
  - note normalisation (NFC/trim/CRLF).
- **QA's own probe:** a raw-HTTP probe covering Q2-01..Q2-10.
- **Scans:** secret and dependency scan.

## Return
- Post the QA_REPORT on the PR. Write `bus/QA_TO_DESIGN.md` with the PR, exact SHA, comment ID, verdict, numbers and findings. Then STOP.
- Verdict `PASS_LOCAL` only if every check holds.
