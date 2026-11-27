# D007-A95 — P0-STORE Phase 1 R2 G4 PASS_LOCAL; LIM-P0S-1 closed; Phase 3 readiness gap

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@2a8fc20800acfed6818d33a357fc70ec3844fce4`. Acted on explicit user poll.

## 1. Evidence received
- Management50 dispatched QA only, matching Board R47. [QA22](https://github.com/zyyu1/literature-management-system/blob/2a8fc20800acfed6818d33a357fc70ec3844fce4/docs/bus/QA_TO_DESIGN.md) (`2a8fc20`) and PR #9 comment [#7220233158](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7220233158) read in full; consistent.
- First and only `ls-remote refs/pull/9/head` 13:36:03Z (after Management50 13:35:10Z), exit 0, exact `b6fec8e3b0ec217b142b428080454588e6866744`; all evidence at that head; Windows offline 13:38:27Z; Node v22.23.5 x64 **via full path, non-elevated**; Linux NOT_RUN.
- 8 groups PASS: syntax 25/25; suite 65/65 (P1-01..14); QA-strict upstream 67/44(nested 67)/103/91; audit positive + count-neutral negatives with dedicated reasons; **QA 11-personality matrix with root-cause-first order** — strong GO, weak-etag PARTIAL (`WEAK_VALIDATOR@L3`), stale-read PARTIAL (`STALE_READ_VISIBILITY@L2` first), lost-update/create-overwrite NO-GO, late-ack GO, unresolvable-ack PARTIAL (`UNRESOLVABLE_LATE_ACK@L8` first), throttle/server-error/redirect/bad-cert **INCONCLUSIVE**; egress zero transport calls in 5 combinations, canary absent; committed mutants 16/16 + QA QM01–QM03 3/3 (QM03 patch target narrowed after an ambiguous first patch, disclosed); **byte proof 8/8 frozen paths identical to `88e1bd7`**, `PHASE1_LIVE_ENABLED = false`; P1-03 = exactly 2 assertions + 2 comments. P0/P1/P2 = 0.

## 2. Ruling
**G2 ACCEPTED (A94), G3 VERIFIED, G4 PASS_LOCAL at exact `b6fec8e3b0ec217b142b428080454588e6866744`.** **LIM-P0S-1 CLOSED**: the probe now distinguishes INCONCLUSIVE from PARTIAL and reports root cause first. Phase 1 status: `PRE_G6_LOCAL_READY` without open limitations (Linux NOT_RUN remains INFO). PR #9 stays OPEN; no G5 for the probe.

## 3. Phase 2 status
U1–U4 and U7 complete (empty test account; app password generated; same A59 machine; pinned Node by full path; free plan 1 GB/3 GB); U5/U6 happen at run time → **`PHASE2_READY`**.

## 4. Gap before Phase 3 (Design finding)
`b6fec8e` is inert by construction (`PHASE1_LIVE_ENABLED = false`; plans loopback-only). A live run therefore needs a **Phase 3 readiness slice (R3)** first: enable live mode only when an exact approval ID, the pinned real host and the user-set credential are all present; add a frozen live plan for `dav.jianguoyun.com:443`, WebDAV root `/dav/`, run prefix `/dav/LMS-P0STORE/<random-run-id>/`; keep every Phase 1 guard; offline G2 + targeted G3 proving the live path still refuses without approval and never touches the network in tests. Only after R3 G4 can the user approve the single live run (ACCESS-02/G6) at R3's exact SHA. P0-STORE remains BLOCKED; G6/G7 NOT_AUTHORIZED.
