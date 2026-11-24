# D007-A45 — Q1E-L3 two-P2 minimal remediation G1 authorization

**USER APPROVED OPTION A / 2026-11-24 Europe/Berlin. G1 = AUTHORIZED_LOCAL_SYNTHETIC_TWO_P2_ONLY; G2 NOT_STARTED; new G3 NOT_RUN; new G4 NOT_REVIEWED.** User approval separately recorded and verified at `main@5b7a438004c7d38d102788c1670b9a4670f6d5b6`. Binding [A44 design](D007_A44_Q1E_L3_MINIMAL_REMEDIATION_DESIGN.md) and [A44 QA matrix](D007_A44_Q1E_L3_REMEDIATION_QA_MATRIX.md), immutable design source commit `684121fcf92adac48e0f0b68d0c319ed1fb2551b`; [A38 G4](D007_A38_Q1E_L3_MODEL_G4_PARTIAL_DISPOSITION.md), [A37](D007_A37_Q1E_L3_SYNTHETIC_G1_AUTHORIZATION.md), [A36](D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md) remain historic binding constraints. [Management work order](../handoffs/Q1E-L3/A45_MINIMAL_REMEDIATION_WORK_ORDER.md) and [independent QA plan](../handoffs/Q1E-L3/A45_INDEPENDENT_G3_QA_PLAN.md) govern this one bounded remediation. No other implementation, repair or production authority.

## 1. Fixed identity and preflight

- Repository `zyyu1/literature-management-system`, existing PR #4 OPEN / NOT MERGED, branch `exec/Q1E-L3-synthetic-transaction-feasibility`, original immutable merge-base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8`, exact remediation START `49cb8d264fa7c9d76705e03161421149a4557167`. No new branch/PR, no merge/rebase/cherry-pick/reset/force, no import of Design main into execution branch. Compare original Base..FINAL and incremental START..FINAL; both must comply, only fast-forward commits, no merges. Observed original 25 paths/two commits and [historical independent QA #7127584107](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7127584107) unchanged.
- PR #2 protected at `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`, R10 deferred A43 ENVIRONMENT_BLOCKED/STOP, A42 G4 PARTIAL, REG OPEN. If another workstream advances independently, report drift and STOP for Design; never alter it.
- Management dispatches already-approved scope to Execution, then coordinates separately user-opened independent QA only after compliant G2 STOP, exact final SHA and QA host preflight. No immediate G3 on START, no Management self-QA or same-session subagent. The user opens independent QA; if no supported environment, report ENVIRONMENT_BLOCKED / NOT_RUN / STOP. No implicit repeat dispatch, waiver or expansion. Execution and QA must independently verify their actual supported host and Node v22.23.5. Prior Linux QA is historical, not evidence of host availability today.

## 2. Exact incremental whitelist

| Path | Only allowed delta |
| --- | --- |
| poc/q1e-l3/src/recovery.mjs | Explicit minWitnessSeq anchor admission only |
| poc/q1e-l3/test/l3-contract.test.mjs | Valid retained fixture floors and additive regression assertions |
| poc/q1e-l3/test/l3-faults.test.mjs | Valid retained fixture floors and additive regression assertions |
| poc/q1e-l3/scripts/mutation-check.mjs | Add two or more specific new mutants, keep original 12 unchanged |
| poc/q1e-l3/README.md | Append actual bounded model evidence |
| poc/q1e-l3/evidence/A44-* | NEW sanitized result files only under this prefix, no modification of old evidence |
| docs/handoffs/Q1E-L3/QA_HANDOFF.md | Append-only; original raw blob bytes retained as exact prefix |

No other path authorized. Protected blobs at START: snapshot.mjs `b2d6c0dbfaab6edc0cb8ffcd85883803f7090fbf`, model.mjs `8ba2572ef4fe725a926b774e6c6520d6f7f8b21f`, scripts/check.mjs `a58135dd28813e0d61906862086793ac8bc25be0`; old QA_HANDOFF blob `38de9db72e9bf7c0bb93158ce8718250ce5d8643` must remain exact raw prefix. No modification of previous evidence, A44/A37/A38 or other original instructions, CI, frozen UI, application, packages or dependencies. Any need outside scope STOP.

## 3. Two target changes only

**P2-L3-QA-1:** Follow A44 §2 verbatim in scope. Remove implicit minWitnessSeq=0. Explicit independently retained/predeclared fixture floor must be a non-negative safe integer; no default or coercion. Missing/undefined/null, NaN, infinities, negative, fractional, unsafe integers, strings, booleans and objects rejected. After archive authentication and witness presence/domain checks, before reconciliation/rollback comparisons and staging, return RESTORE.WITNESS / DELETION_WITNESS_UNVERIFIABLE, reason ROLLBACK_RESISTANCE_UNVERIFIED, stage:null for absent/invalid anchor. Zero staging callbacks and no active/witness mutation. Preserve existing gate order and precise outcomes for valid anchors; hw.seq below floor rejects. Explicit zero is known fixture genesis only, never derive it or any floor from a replayable candidate during restore. No production trust-origin proof from a number. Supply independent fixture floors in previous call sites where required to preserve every old assertion and intended gate. Keep cutover prohibited; real T3 remains unproven.

**P2-L3-QA-2:** No snapshot source change. Add deterministic historical K1 after successful K2 Note/Quote+history and K3 status/Project-delete commits, predeclared owner-scoped K1 ID/revision/data oracle independent of SUT. Assert exact K1 checkpoint, full record graph and UTF-8 bytes, old beta/associations in export only, absence of later data, owner exclusion, quiet K1 digest equality, unchanged active state. Negative K3 vs K1 oracle no bundle. Preserve existing C07/T04 interleaving. Add named A44-C07-HISTORICAL-K exact pinned checkpoint assertion. Add separate M-SNAP-HEAD whole pinned-state selection mutant in addition to existing per-record M-SNAP; add M-ANCHOR-BYPASS missing/invalid floor gate mutant. Every mutant must reach intended assertion, not syntax/setup/timeout or unrelated failure.

## 4. Acceptance and limits

Execution and independent QA each record all 26 applicable A36 IDs (C01–C12/T01–T07/R01–R07), preserve prior 27 named tests and 12 driver mutants, at least 29 named tests total and at least 14 intended driver mutant kills, actual counts, five distinct complete suite processes each all tests pass/exit 0, zero survivors/wrong-reason/not-run, syntax/check.mjs, zero prototype sockets/HTTP/DNS/TLS and no secrets/dependencies. QA additionally independently creates original eight defect-class variants and anchor bypass/invalid-coercion probes/variants; run A44 matrix with independently authored fixture and compare active/witness digests. C02 only correctly reports UNSUPPORTED. No cross-platform claim or assumption. See A45 QA plan. No G4 candidate on incomplete evidence.

Historical A38 G4 remains PARTIAL_NOT_ACCEPTED@49cb8d264fa7c9d76705e03161421149a4557167; both P2 OPEN until separate new exact-SHA Design G4. A42 R10 unchanged. MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN / REAL_T3_NOT_RUN / UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED. G5 MERGE NOT_AUTHORIZED, G6 ACCESS-02 BLOCKED, G7 DEPLOY NOT_AUTHORIZED, POC-001 BLOCKED_REAL_SERVICE. No real Nutstore/Zotero/WebDAV, database/cloud selection, live backup/cutover, actual keys or private data. No further authority after STOP.
