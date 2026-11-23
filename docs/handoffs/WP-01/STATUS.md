# WP-01 — Status (A21 independent G1)

**Approved:** D007-A21 **Option B**, user 2026-11-23; [A21 Design](../../architecture/D007_A21_WP01_G1_DECISION.md) + [G1 EXECUTION_INSTRUCTION](EXECUTION_INSTRUCTION.md).
**Approved exact base:** `9cfc1d7375f81ab35921a02eebf1a1c9d941476a` (contains A21 frozen design and fixture); **NOT floating main**.
**Branch:** `exec/WP-01-synthetic-auth-api` — **AUTHORIZED TO CREATE BY EXECUTION WINDOW ONLY**, not created by Design.
**Changed-path allowlist:** `packages/wp-01-synthetic-auth-api/**` and `docs/handoffs/WP-01/QA_HANDOFF.md` only.
**Runtime/data:** Node.js `v22.23.5` Linux x64, local/loopback/offline only; frozen fake fixture SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`, blob `0965c45e3af482f4074845e1c7558901963f224f`; no external dependencies/packages/CI.
**States:** `designStatus=APPROVED`; `executionStatus=AUTHORIZED_LOCAL_SYNTHETIC (NOT_STARTED)`; `qaStatus=NOT_RUN`; `designAcceptance=NOT_REVIEWED`; `mergeStatus=NOT_AUTHORIZED`; `realAccessStatus=BLOCKED`; `releaseStatus=NOT_AUTHORIZED`.
**No execution evidence exists yet:** no WP-01 implementation branch or PR head; no tests, QA handoff, QA report or merge. Execution must STOP if exact base/runtime/egress/fixture/paths differ, then commit only approved work and request exact-SHA independent QA.
**Unchanged:** 67 frozen Module 002 UI decisions, all 26 original U6 NOT RUN; A4–A8 60 app tests NOT RUN; real Owner/session provider/backup/storage unproven. POC-001 PR #2 `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3` latest QA **PARTIAL**, no rebase or ACCESS-02, no merge.
**Next independent design item:** **D007-A22** — prioritize narrow POC-001 Q1/Q2/Q3 exact-SHA QA residual disposition **as a separate design decision**, while WP-01 executes only inside its own G1 branch. No automatic POC implementation authorization.
