<!-- BUS from=QA to=DESIGN seq=20 re=MANAGEMENT_TO_EXECUTION.md@46 status=DONE updated=2026-11-27T10:31+01:00 -->
# QA → Design

## Combined-G5 post-merge regression on S_main — **PASS**

- **PR #8** is **merged** at merge commit **`d7dd4237f04559e1097f8dcfc8155164cd73f1c2`** (parents main `c42174d…` + tested `f951f71…`).
- **S_main = `61df6b14dfb8c9c9081af2a5d3217f6855ddbffc`**; first and only `ls-remote refs/heads/main` exit 0, stderr empty, exact SHA (`09:27:03.057Z–09:27:04.640Z`); no retry.
- **New PR #8 comment: [#7214763357](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7214763357)** — itemized four-group / Q4-01..12 / preconditions table (DEC-27 §1).

## Preflight / S_main

- Fresh full non-shallow clone, `core.autocrlf=false`, detached, clean, 273 tracked paths; independent QA directory.
- **M `d7dd423…` is ancestor of S_main**; `M..S_main` only `docs/bus/MANAGEMENT_TO_EXECUTION.md` (no non-docs path).
- WP-04 tree at S_main = **`74ef86b38c10646fccb8aaf4d863be358d215445`** = `f951f71` (23 paths identical).
- WP-03 tree at S_main = **`5db097a62f66c98622d6c7e2fbd0971a43f0d34e`** = `c40e927` (22 paths identical).

## Environment

Windows 10.0.19045 x64; Node **v22.23.5 x64**; A59 offline proof `09:28:24Z`; every group pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP no-error not counted. Linux **NOT_RUN**.

## Four suites (one run each, exit 0)

| group | actual | assertion |
| --- | --- | --- |
| G1 WP-01 | **67/67** | fail/skip/todo/cancelled 0 |
| G2 WP-02 | **44/44** | nested WP-01 **67/67** present |
| G3 WP-03 | **103/103** | fail/skip/todo/cancelled 0 |
| G4 WP-04 | **91/91** | Q4-01..12 all present; fail/skip/todo/cancelled 0 |

Q4 counts on merged S_main: 4/4/4/7/4/9/10/7/5/9/13/4 (Q4-01..Q4-12); 80 Q4-named + 11 tally = 91.

## Excluded / limits / findings

- **Excluded by seq 46:** candidate-scope audit scripts (pinned to PR history; expected to reject on main) and both mutation drivers → **NOT_RUN by design**, not failures.
- **NOT_RUN:** Linux; real persistence/P0-STORE; real identity/Zotero/Nutstore; R2 success; drafts/recovery/autosave; Typora/UI; performance; provider/deploy; G6/G7.
- **P0 = 0, P1 = 0, P2 = 0.** No failure, no repair, no candidate change, no rollback; merge stays in history for Design's combined-G5 verification.
- Evidence: `qa5\evidence\postmerge5-run\` — `summary.json` SHA-256 `07bb59f3…e149516b`; G1 `ebfb7a9c…49fbf17`, G2 `56513905…ed2427d`, G3 `0ef855bb…e3fd194`, G4 `b80b1065…ea1f0b0e258a`.

**QA STOP.**
