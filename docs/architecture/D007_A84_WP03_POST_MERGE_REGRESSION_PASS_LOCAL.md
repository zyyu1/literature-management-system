# D007-A84 — WP-03-R1 post-merge offline regression PASS_LOCAL; P2 runtime closure

**Design ruling — 2026-11-26 Europe/Berlin.** Observed parent `main@65fd261e418fd9323fa9cfc4fd19f6c0d8cc1ab4`. Acted on explicit user poll. Receipt and ruling in one commit (A47 R1).

## 1. Evidence received
- [Management41](https://github.com/zyyu1/literature-management-system/blob/65fd261e418fd9323fa9cfc4fd19f6c0d8cc1ab4/docs/bus/MANAGEMENT_TO_EXECUTION.md) DEC-23=A dispatched A83 §2–§4 unchanged; Execution27 ack only.
- [QA18](https://github.com/zyyu1/literature-management-system/blob/65fd261e418fd9323fa9cfc4fd19f6c0d8cc1ab4/docs/bus/QA_TO_DESIGN.md) (commit `65fd261`) and original PR #7 comment [#7201139654](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7201139654) (19:02:57Z, unedited) read in full; they agree.
- S_main = `bcc4eaad5183c923f782da0475eea1751be2de3b` (= Management41 commit) from QA's first and only `ls-remote refs/heads/main` (18:57:54Z, exit 0, no retry), after the dispatch commit.
- Windows 10.0.19045 x64, Node v22.23.5 x64, A59 offline proof 18:59:59Z, pre/post guard+probe PASS for all three groups, children ended before reconnect; separate QA clone, `core.autocrlf=false`, clean, 243 tracked. Linux NOT_RUN.
- Results, one run each: WP-01 `node --test` 67/67; WP-02 44/44 with nested WP-01 67/67 (`ok 44`); WP-03 103/103 with Q3-11 `ok 101` protected bytes, `ok 102` WP-01 67, `ok 103` WP-02 44 nested 67; all fail/skip/todo/cancelled 0, exit 0. Raw TAP SHA-256 recorded in the comment. Exclusions (candidate audit, mutation drivers, syntax) respected.

## 2. Design independent checks
- `6cc8e2a` is an ancestor of S_main; `6cc8e2a..S_main` = 7 `docs/` paths only (board, A82, A83, STATUS, two buses, handoff); S_main has 243 tracked paths.
- At S_main the WP-03 package tree is `5db097a62f66c98622d6c7e2fbd0971a43f0d34e` and the Q3-11 blob is `d0b67734eee63a90b09d480917b0708922c5b069`, both equal to tested HEAD; the 22 paths are unchanged from `c40e927`.
- Every pinned Q3-11 inventory blob is identical at B, merge `6cc8e2a` and S_main.

## 3. Correction (Design error)
QA correctly flagged the count. `PROTECTED_INVENTORY` pins **51 file blobs**. The figure “56” in A81 §3/§4, A82 §2/§3 and A83 §4 was a Design extraction error: it also counted the three protected directory names (`packages/wp-01-synthetic-auth-api`, `packages/wp-02-project-paper-read`, `tools/offline`) and the two fixture paths again from `PROTECTED_FILES`. The underlying A82 check still holds: all 51 blobs were equal to B, and those three directory trees plus both fixture directories were compared by tree ID and were equal. Read “56/56” in those documents as “51/51 pinned blobs + 3 protected directory trees equal to B”. No gate changes because of this.

## 4. Ruling
**Post-merge regression PASS_LOCAL on S_main `bcc4eaad5183c923f782da0475eea1751be2de3b`** (Windows offline host). **P2-WP03-DESIGN-2 CLOSED_LOCAL with runtime evidence**: Q3-11 and the ordinary WP-01/02/03 suites pass on real main carrying main-only docs absent from Base. A81 G4 PASS_LOCAL and A82 G5 VERIFIED are unchanged. Linux NOT_RUN; no claim of real storage, R2, P0-STORE, UI, real services or deployment. G6/G7 NOT_AUTHORIZED; A70/A71 suspended; PR #2/#4 untouched.

## 5. Next
WP-03-R1 is complete at the local-synthetic level (G4, G5, post-merge regression). No open Execution or QA task. Next scope is a new user decision (Board R36, DEC-24).

**Design WAIT — DEC-24.**
