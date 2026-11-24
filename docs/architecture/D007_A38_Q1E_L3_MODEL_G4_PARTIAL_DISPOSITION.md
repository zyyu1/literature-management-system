# D007-A38 — Q1E-L3 Independent G3 / Exact-SHA MODEL_ONLY G4 PARTIAL Disposition

**Design G4 review, 2026-11-24 Europe/Berlin.** **G3_INDEPENDENCE=VERIFIED, Q1E-L3_LOCAL_MODEL_STAGE=PARTIAL, D007-A38 G4_MODEL_ONLY=PARTIAL_NOT_ACCEPTED / REMEDIATION_REQUIRED** on exact `49cb8d264fa7c9d76705e03161421149a4557167`; not `PASS_MODEL_ONLY_CANDIDATE`. All Q1e production/physical storage capacities remain NOT_PROVEN. **G5 MERGE NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 DEPLOYMENT NOT_AUTHORIZED / OVERALL POC-001 BLOCKED_REAL_SERVICE.** No new implementation G1.

## Authority and independent provenance

- [A37 fixed local MODEL_ONLY G1](D007_A37_Q1E_L3_SYNTHETIC_G1_AUTHORIZATION.md), [A36 L1/L3 test matrix](D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md), [Execution order](../handoffs/Q1E-L3/EXECUTION_WORK_ORDER.md) and [G3 plan](../handoffs/Q1E-L3/INDEPENDENT_G3_QA_PLAN.md), Design authority SHA `968dd0fe55170a84699dca683ef4194e8d11a093`.
- New [PR #4](https://github.com/zyyu1/literature-management-system/pull/4) OPEN/UNMERGED, fixed independent execution Base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8`, branch `exec/Q1E-L3-synthetic-transaction-feasibility`, two fast-forward commits `2cfc4ba6c1269264a7370a4681725a3111e7c60a` and `49cb8d264fa7c9d76705e03161421149a4557167`, no merges, **25 all-new allowlisted files** and **0 changes to old code, CI, UI, packages, R09 PR #2**. No database chosen.
- [Execution report 7127237452](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7127237452), [QA request 7127245285](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7127245285), **[independent direct QA report 7127584107](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7127584107)**. Separate user-opened QA window, fresh full clone, QA-owned 16-record/12-expected-ID fixture, barriers and own mutants; `ls-remote` passed first attempt with exact SHA; same runtime profile is INFO only.
- QA independently ran all **26 named A36 C01–C12/T01–T07/R01–R07 model-level cases** (C02 correctly reports UNSUPPORTED rather than fake completeness), 27/27 repo tests ×5 separate processes, 12/12 existing Execution mutants, 0 prototype sockets, no secrets. QA's own **eight mutants: 7/8 killed by repository suite, 8/8 by QA probes**; M-SNAP survives original repository suite.

## Risk findings and severity

| Finding | Exact-SHA disposition | Source fact and decision |
| --- | --- | --- |
| **P2-L3-QA-1** | **OPEN / MODEL_G4_HARD_BLOCKER / P2** | Final `poc/q1e-l3/src/recovery.mjs` `stageRestore` defaults `minWitnessSeq=0`; a replay of BOTH active store and synthetic deletion witness to an older internally consistent checkpoint **with no external minimum anchor** returns `STAGED_ONLY_NOT_CUTOVER`, with a formerly deleted Project present and no warning. This violates A34/A36 fail-closed anti-rollback requirement. QA reproduced and source inspected. Mitigation: only fresh isolated stage; active store unchanged and `cutover()` throws. Thus **P2 / G4 PARTIAL**, not a demonstrated active-data resurrection or P1/production incident. A later actual cutover without separate verified anchor would be a much higher-severity failure. |
| **P2-L3-QA-2** | **OPEN / MODEL_G4_TEST_GAP / P2** | M-SNAP swaps correct `stateAt(K)` use for `current()` in snapshot. **All 27 repository tests still pass**, but independently authored QA C07 catches incorrect historic-K data when K+1/K+2 already committed. `snapshot.mjs` actual implementation is correct; a **new deterministic regression** must kill the mutation via named C07/T04 pinned-historical-K assertion. |

**No P0/P1** in QA-observed model scope, not a production safety proof. Direct source confirms `minWitnessSeq=0` default and correct `snapshot.mjs` `stateAt(checkpoint)`. Not RUN: actual filesystem durability/fsync/WAL/power-loss, real multi-process serializability, other OS/hardware, raw invalid UTF-8 byte probe. UNSUPPORTED: real independent deletion trust anchor/key custody, general Q1e complete inventory, authenticated production backup or cutover, physical DB engine, Nutstore/Zotero/provider. `MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN / Q1e UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED` are mandatory.

**INFO remain informational:** deterministic model `reconcile()` deciding no witness ⇒ DEFINITE_FAILURE cannot be carried to real DB; witnessed/store divergence requires operator reconciliation; network modules imported solely by zero-actual-socket QA traps; minor bus title/header mismatch; QA/Execution run in similar environment.

## Gates, future candidate (NO NEW G1)

| Gate | Decision |
| --- | --- |
| A37 G1 | `AUTHORIZED_LOCAL_SYNTHETIC_MODEL_ONLY` historical; completed and Execution STOP at `49cb8d2` |
| G3 independent QA | `INDEPENDENCE_VERIFIED / MODEL_STAGE_PARTIAL` |
| **D007-A38 G4** | **`PARTIAL_NOT_ACCEPTED@49cb8d264fa7c9d76705e03161421149a4557167`** |
| Q1e & backup | `UNSUPPORTED_COMPLETENESS / NOT_RESTORE_CERTIFIED` |
| Physical DB / latest trust witness | `PHYSICAL_DURABILITY_UNPROVEN / REAL_T3_NOT_RUN` |
| G5 / G6 / G7 | `NOT_AUTHORIZED / BLOCKED / NOT_AUTHORIZED` |
| Overall | `POC-001 BLOCKED_REAL_SERVICE` |

**Potential new L3 narrow remediation, NOT AUTHORIZED:** user must separately approve another G1 with current PR #4 same new branch, immutable A36 base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8` and new fixed start `49cb8d264fa7c9d76705e03161421149a4557167`. Candidate change scope: `poc/q1e-l3/src/recovery.mjs` and new/extended within-whitelist L3 regression tests (contract/faults) and mutation driver, sanitized new evidence, README, QA_HANDOFF only; `snapshot.mjs` **must remain unmodified** unless a separately approved finding justifies it. Make missing/invalid external `minWitnessSeq` **fail closed by default before any staging**, e.g. `ROLLBACK_RESISTANCE_UNVERIFIED` (while permitting valid explicitly supplied mock anchor where deletion state is consistent); negative case rollback both store and witness without anchor asserts **stage=null and active unchanged**, anchored positive case allowed only for authorized mock; existing 26 named model cases retained. Add historic checkpoint K after K+1 already exists, and require original repo tests kill M-SNAP for intended pinned-K assertion. Preserve 27 prior tests and 12 Execution mutants, 0 network and no real T3 claim. After new Execution report and separately user-opened QA G3 on exact new SHA, distinct new Design G4. If any extra source path needed STOP. This is a **proposal**, not a work order or permission to edit.

**D007-A38 FINAL: G3 VERIFIED, MODEL_ONLY G4 PARTIAL_NOT_ACCEPTED, two P2 OPEN, no new G1; Q1e, real durability and real backup remain unproven; G5/G6/G7 blocked.**