# D007-A92 — P0-STORE Phase 1 probe G4 PASS_LOCAL; DEC-35 verdict limitation; DEC-36 Phase 2 preparation

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@d59d1176ac1b440f11ab322aa48b5f45c753d4b1`. Acted on explicit user poll. Receipt, ruling and user decisions in one commit (A47 R1).

## 1. Evidence received
- [Management48](https://github.com/zyyu1/literature-management-system/blob/d76560e/docs/bus/MANAGEMENT_TO_EXECUTION.md) matched Board R44 (QA only; all evidence at final head). Execution31: not involved.
- [QA21](https://github.com/zyyu1/literature-management-system/blob/d59d1176ac1b440f11ab322aa48b5f45c753d4b1/docs/bus/QA_TO_DESIGN.md) (`d59d117`) and PR #9 comment [#7218403149](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7218403149) (12:34:16Z, unedited) read in full; consistent.
- First and only `ls-remote refs/pull/9/head` 12:00:41Z (after Management48 11:58:10Z), exit 0, exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2`; all evidence at the final head; Windows offline proof 12:22:12Z; Node v22.23.5 x64; Linux NOT_RUN.
- Groups: syntax 24/24; suite 50/50 (P1-01..13); QA-strict upstream 67/44(nested 67)/103/91; audit positive + 6 **count-neutral** negatives each with its dedicated reason (AUD-02 `BASE_PATH_CHANGED_AT_HEAD` via `verifyBaseTree`, AUD-03 `PROTECTED_HEAD_BLOB_CHANGED` via `verifyProtectedInventory`, AUD-01/04/05/06 own reasons) — closes the A88 rule; QA 11-personality matrix 11/11; egress: 5 missing-precondition combinations with zero transport calls, static host scan clean, canary absent; committed mutants 13/13 + QA mutants QM01–QM06 6/6. P0/P1/P2 = 0. One earlier QA run had two QA-assertion crashes (harness only), not counted.

## 2. Design findings
- **LIM-P0S-1 (verdict semantics, Design gap):** `computeVerdict` maps any STOP without NO-GO evidence to `PARTIAL` with `unresolved: true`. Throttle/server-error/redirect/bad-cert stop at L0 and are labelled PARTIAL although no CAS evidence exists. A90 §6 defined PARTIAL as "CAS correct but…" and had no INCONCLUSIVE class. Not a safety defect (no GO; flag present) but misleading.
- INFO-1: for `stale-read` the final rule is `STOP_CLEANUP_UNVERIFIED` (L12) while the root cause (L3 immediate=false) appears only in step results.

## 3. User decisions (Design window)
- **DEC-35 = A:** accept G4 now with LIM-P0S-1; until fixed, `PARTIAL` with `unresolved: true` is read as **INCONCLUSIVE**. Adding an `INCONCLUSIVE` verdict and root-cause-first reasons is a **mandatory change before any Phase 3 live run** ([Phase 2 doc §4](../handoffs/P0-STORE/PHASE2_USER_PREPARATION.md)).
- **DEC-36 = A:** prepare Phase 2: user checklist U1–U7 and ACCESS-02 request packet draft published; no account, credential or connection authorized.

A90 §6 is amended: **INCONCLUSIVE** ⇔ STOP or unresolvable outcome before L6 completed all rounds, without NO-GO evidence → no conclusion; repeat only by a new approval.

## 4. Ruling
**G2 ACCEPTED (A91), G3 VERIFIED, G4 PASS_LOCAL at exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2`** for the P0-STORE Phase 1 local probe (LOCAL_MOCK_ONLY). Readiness status `PRE_G6_LOCAL_READY` **with LIM-P0S-1 open**. No G5 for the probe (not needed; Phase 3 uses an exact SHA). Phase 3/ACCESS-02/G6, G7 NOT_AUTHORIZED; P0-STORE BLOCKED; A70/A71 suspended; PR #2/#4 untouched.
