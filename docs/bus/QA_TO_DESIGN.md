<!-- BUS from=QA to=DESIGN seq=19 re=MANAGEMENT_TO_EXECUTION.md@45 status=DONE updated=2026-11-27T10:10+01:00 -->
# QA → Design

## WP-04-R1 independent full G3 — **PASS** @ `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`

- **PR #8** `exec/WP-04-research-notes-r1` → `main`: OPEN / non-draft / 2 commits; exact HEAD `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`; Base `bcc4eaad5183c923f782da0475eea1751be2de3b`.
- **New PR #8 comment: [#7214349421](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7214349421)** — itemized Q4-01..12 / groups / audit / mutants / traceability table.
- Authority: Management seq 45 / DEC-29=A, A87 §4, WP-04 QA_INSTRUCTION §5 + DESIGN §8; both read from main.

## Preflight / environment

- **First and only** `git ls-remote <repo> refs/pull/8/head` → exit 0, stderr empty, exact `f951f71…	refs/pull/8/head` (`08:46:12.336Z–08:46:13.952Z`); no retry.
- Fresh full non-shallow clone, `core.autocrlf=false`, detached, clean; Base ancestor; B..HEAD **2 single-parent commits, 0 merges**; **23 additions / 0 M-D**; Base 243 / HEAD 266; 0 symlinks; `6056b59..f95171` only QA_HANDOFF. Static audit `CANDIDATE_SCOPE_OK`.
- Windows 10.0.19045 x64; Node **v22.23.5 x64**; A59 offline proof `09:04:16Z`; every group pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP no-error not counted. Linux **NOT_RUN**.

## Seven groups (all PASS)

| # | group | actual |
| --- | --- | --- |
| 1 | syntax | **20/20** `.mjs` |
| 2 | WP-04 `node --test` | **91/91**, zero fail/skip/todo/cancelled; Q4-01..12 all present |
| 3 | QA-strict upstream TAP | WP-01 **67/67**, WP-02 **44/44** nested 67, WP-03 **103/103** |
| 4 | candidate audit | positive + 6 negatives; **8/8** QA checks |
| 5 | QA raw HTTP | **24/24** |
| 6 | QA byte/export oracle | **8/8**; INFO-1 recorded |
| 7 | mutants | committed **14/14**, QA independent **6/6** killed |

- Audit actual: AUD-01/02/03/05 full exits `CUMULATIVE_ADDITION_COUNT: 24`; AUD-04 `CLEAN_CHECKOUT`; AUD-05b exact `BASE_PATH_MODE_CHANGED_AT_HEAD: README.md (100644 -> 100755)`; AUD-06 `SYMLINK_TREE_NON_REGULAR_MODE: link-to-readme (120000)`.
- QA mutants: Q01 NFC, Q02 CRLF→LF, Q03 per-field partial write, Q04 saved-on-UNKNOWN, Q05 cross-library note, Q06 export mutates revision. All killed by intended B02/B02/R10/R16/R02/B07.
- **INFO-1:** empty-metadata export = **131 B**, SHA-256 `7bce7e561f808a09d23cb553c8a5a02f26649e5c3a2c230a33fc26639f8677f5`; bytes after H1 exactly `\n\n## Research Question\n\n\n\n## Arguments & Content\n\n\n\n## Theories & Methods\n\n\n\n## Contributions & Innovations\n\n\n\n## Limitations\n\n\n` (observation, not a defect).

## Findings / limits

- **P0 = 0, P1 = 0, P2 = 0** new product findings. INFO-1 only observation.
- **NOT_RUN:** Linux; real persistence/P0-STORE; real identity/Zotero/Nutstore; R2 success; local drafts/recovery/autosave; Typora certification; UI; performance; provider/deploy; G6/G7.
- Three earlier offline attempts of this round failed **only on QA harness defects** (syntax count, client abort detection, CR test string, trailing-LF assertion, mutant patch ambiguity, quarantine sequencing); candidate unchanged; final clean run `09:04:13–09:06:41 +01:00` is the evidence.
- Candidate clean at exact HEAD; no commit/push/merge/rebase/reset/force; G4 Design only; G5 separate DEC.

**QA STOP.**
