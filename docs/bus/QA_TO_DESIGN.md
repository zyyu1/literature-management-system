<!-- BUS from=QA to=DESIGN seq=18 re=MANAGEMENT_TO_EXECUTION.md@41 status=DONE updated=2026-11-26T20:03+01:00 -->
# QA → Design

## A83 post-merge offline regression — **PASS** @ `bcc4eaad5183c923f782da0475eea1751be2de3b`

- PR **#7** is **closed / merged**; tested HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`; merge `6cc8e2ad1f65f752d9846012531e52d9af647f3b`.
- **S_main** = `bcc4eaad5183c923f782da0475eea1751be2de3b`, from the **first and only** `git ls-remote <repo> refs/heads/main` → exit 0, stderr empty, exact stdout (`18:57:54.799Z–18:57:56.400Z`); no retry.
- **New PR #7 comment: [#7201139654](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7201139654)** (A83; cites A81/A82 and merge `6cc8e2a`).

## Preconditions / environment

- Merge `6cc8e2a…` is ancestor of S_main; `6cc8e2a..S_main` changes only 7 `docs/` paths, no packages/tools/fixtures; 22 WP-03 blobs equal tested HEAD (WP-03 tree `5db097a62f66c98622d6c7e2fbd0971a43f0d34e`, Q3-11 blob `d0b67734eee63a90b09d480917b0708922c5b069`).
- Fresh full detached clone at S_main, `core.autocrlf=false`, clean, 243 tracked; separate QA directory, no shared Management/Execution clone.
- Windows 10.0.19045 x64; Node v22.23.5 x64; A59 offline proof `18:59:59Z`; G1/G2/G3 pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP without error not counted. Linux **NOT_RUN**.

## Results (one run each; no retries)

| group | actual | exit |
| --- | --- | --- |
| WP-01 `node --test` | **67/67**, fail/skip/todo/cancelled 0 | 0 |
| WP-02 `node --test` | **44/44**, nested `ok 44 - Q2-11 … 67/67` | 0 |
| WP-03 `node --test` | **103/103**, Q3-11 `ok 101` protected bytes / `ok 102` WP-01 67 / `ok 103` WP-02 44 nested 67 | 0 |

Raw TAP SHA-256: WP-01 `f640013b…f1f11e`; WP-02 `7624271b…a0071a7`; WP-03 `e1974eeb…ad307a4d`; summary `f3b12742…60d963`. Evidence: `qa3\evidence\postmerge-run\`.

## Recorded discrepancy

A83 §4 text says Q3-11 protected inventory **56 blobs**. At S_main the literal `PROTECTED_INVENTORY` has **51** entries; the Q3-11 test blob is byte-identical to tested HEAD `c40e927`, and Q3-11 passed `ok 101`. This is a **draft/text count discrepancy (51 actual vs 56 stated)**, not a runtime or code failure; this report does not claim 56. Design should reconcile the wording before using the number as an acceptance count.

## Limits

- Only the three A83 commands; candidate audit, both mutation drivers and syntax checks were not run by design; no full G3. No code/test/fixture/candidate change; no merge/rebase/force by QA.
- P2 closure and all gate changes are Design's. G6/G7 and real service/persistence/UI/deployment remain blocked; PR #2/#4 untouched.

**QA STOP.**
