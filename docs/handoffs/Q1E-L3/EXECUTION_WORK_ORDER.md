# Q1E-L3 — D007-A37 Exact Execution Work Order (G1 LOCAL/SYNTHETIC MODEL ONLY)

**User-approved D007-A37 Option A. No second permission needed; absolutely no extension allowed.** Read [A37 G1](../../architecture/D007_A37_Q1E_L3_SYNTHETIC_G1_AUTHORIZATION.md), [A36 case/QA matrix](../../architecture/D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md), [A34/A35](../../architecture/D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md), and [new independent G3 plan](INDEPENDENT_G3_QA_PLAN.md) from the **full future A37 Design main SHA**. Never merge/cherry-pick Design main into the implementation branch.

## Identity and preflight

- Repo `zyyu1/literature-management-system`.
- Fixed immutable execution base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8` (A36 commit); do NOT use latest floating `main`.
- **Create only after verification** new branch `exec/Q1E-L3-synthetic-transaction-feasibility` at exact base. At A37 approval it was ABSENT; if it exists, STOP unless it exactly equals base and branch ownership is independently verified, do not reset/force or adopt unknown commits.
- Open only **new Q1E-L3 PR** to `main`, OPEN/unmerged; record number, exact final head, original base ancestry, zero merges. The rolling PR target `main` is not the frozen execution base.
- Existing R09 PR #2 on `exec/POC-001-webdav-feasibility` at `49ad24e82f5895f4b6e5f30cb84b3294229df012` is **READ-ONLY** for this job. If it independently advances due to R09, report its status, but never alter it. No CI change or build on that branch.
- Fresh clean checkout from base; Git credentials working and exact SHA/original file blobs verified. Any first-access or ancestry failure ⇒ **PENDING/STOP** and restart preflight after authorized recovery.

## Only allowed new repository paths

`poc/q1e-l3/README.md`
`poc/q1e-l3/src/model.mjs`
`poc/q1e-l3/src/snapshot.mjs`
`poc/q1e-l3/src/recovery.mjs`
`poc/q1e-l3/test/l3-contract.test.mjs`
`poc/q1e-l3/test/l3-faults.test.mjs`
`poc/q1e-l3/scripts/check.mjs`
`poc/q1e-l3/scripts/mutation-check.mjs`
`poc/q1e-l3/evidence/**`
`docs/handoffs/Q1E-L3/QA_HANDOFF.md`

All other files unchanged, including `poc/001/**`, `docs/handoffs/POC-001/**`, `docs/governance/**`, original A1..A37 instructions/decisions, frozen Module 002 UI, package/lock, CI/workflows, root README, original POC and all real app files. No dependencies, no package installs, no database product, no Docker/cloud. If unavailable within this list, STOP to Design.

## Design deliverables and truthful model boundaries

Implement an **in-memory only reference transaction model** of the website-owned confirmed logical data: Project, scoped Zotero compound identity, ProjectPaperAssociation/Important, shared three-state ReadingStatus and whole five-field ResearchNote, KeyQuote and ordered SourceHistory, confirmed deletion/operation witnesses. Atomic copy-on-write candidate/state publish at an explicit deterministic commit barrier. Provide trusted **predeclared fake expected-ID inventory**, one checkpoint-pinned snapshot read, version/owner/ref constraints, concurrent writer CAS/serial-equivalent or conflict, crash before/after commit-before-ACK **simulation**, and A5 `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN` distinction. **No actual fsync/WAL/SQL DB or physical crash durability.** Must label proof `MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN`, not `BACKUP_CERTIFIED`.

Provide isolated fake restore staging and logically separate **fake latest deletion high-watermark**; an old internally valid backup that contains a later deleted Project must refuse restore, but mock witness is **not** independent production custody. Never restore live records, access true keys, forge a signature as real or include a real personal PDF/Note/credential. An idealized transaction model passing is **not** database product validation.

## Mandatory 26 A36 cases

From A36 [matrix](../../architecture/D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md): **C01..C12** (12 common), **T01..T07** (7 L3), **R01..R07** (7 recovery), all with **case-ID-specific** positive control + fail-closed negative/fault and observed result. Do NOT implement L1-L01..L09 or L2.

- C01..C03: known omitted ID fail, unknown omission **truthfully UNSUPPORTED** if no independently trusted external oracle, cross-owner/library-key collision/graph closure.
- C04..C07: concurrent full Note/ReadingStatus, Project deletion/Quote Relink/history all-or-nothing, crash+lost ACK UNKNOWN, mixed checkpoint K/K+1 blocked.
- C08..C12: old deleted Project blocked, missing/rolled-back independent witness fails closed, fake authentication/key mismatch refusal, isolated stage prevents live overwrite, no network/secret/cross-branch edit.
- T01..T07: atomic record+catalog+operation/marker commit barrier, crash after committed before ACK, write skew/serialization conflict, pinned snapshot, independent logical deletion witness, non-replay conflict abort and failure of external manifest write **cannot certify backup**.
- R01..R07: newer deletion state blocks valid old archive, missing/stale witness STOP, deletion/witness crash-order unresolved STOP, exact UTF-8/5-field/history staged restore, lost BACKUP key honesty, stage/cutover fault no active mutation, retention/privacy conflict unresolved without invented days.

**C02 is not an actual completeness proof:** it passes only if it explicitly declares unknown omission `UNSUPPORTED_COMPLETENESS`; it cannot be reported as certified backup.

All outputs include expected fake inventory digest, recorded operation/writer/commit IDs, state counts, snapshot revision graph, rollback/reject reason, stored/active state equality and no unintended side-effects. Preserve last confirmed state and local drafts. No bytes of real Zotero PDFs/annotations or true secrets.

## Mutation/stability/test evidence gates

- At least **8 independently meaningful mutants**, one each known inventory omission, split catalog/record commit, partially changed Quote Relink/history, no CAS/write-skew conflict, mixed snapshot K/K+1, false CONFIRMED on ACK loss, ignored newest deletion witness, stage accidentally mutates active store. Kill only for intended named A36 assertion (not harness syntax, timeout or unrelated crash); report actual kill/survivors/notrun/wrong-reason, no fake totals.
- Run `node --check` on every new JS file; `node --test poc/q1e-l3/test/*.test.mjs`; `node poc/q1e-l3/scripts/check.mjs`; `node poc/q1e-l3/scripts/mutation-check.mjs`; repeat **five separate full processes if claiming x5**; no `npm install`. Node v22.23.5 baseline, ensure no HTTP/DNS/TLS/sockets used by prototype, record actual runtime/OS.
- Evidence in `poc/q1e-l3/evidence/**` only; digest and fixture synthetic, no real data or keys. Full 26 case-ID outcomes, preflight SHA, changed paths/blobs, environment/exits/time/RSS, all known LIMITATIONS and NOT_RUN. Every positive control must have a negative control.
- Commit/push only allowlist files to the new branch fast-forward; open separate PR to `main`, verify SHA/ancestry/diff, post factual Execution PR report + `docs/handoffs/Q1E-L3/QA_HANDOFF.md`. **EXECUTION STOP.**

## Independent QA and design return

**Execution coordinates a separately user-opened independent QA window**; it must freshly clone the new exact SHA, independently author fake expected inventory, schedule/barrier and destructive mutation copies, run all **26 applicable A36 tests** and the 8 defect classes, audit true all-file whitelist, verify zero external sockets, no POC/R09 changes and exact report provenance. QA **directly posts to the NEW PR** and STOP. Execution returns its own PR comment URL, QA comment URL, final full SHA, per-case outcome, mutation count/reasons, P0/P1/P2/INFO, NOT_RUN/UNSUPPORTED unchanged to Design. Same-session subagent **NOT G3**. Only independent future **D007-A38** may G4 accept *MODEL_ONLY* exact-SHA proof; still not physical L3 durability or Q1e closure.

**Absolute STOP:** source/base/branch drift, unknown PR, any real provider or network access, file outside whitelist, data PDF/credential, failing side-effect/cross-owner case, false Confirmed/Delete/Restore, stale resurrection, scope expansion, missing independent QA or P0/P1. Do not self-remediate beyond G1.

**Status:** `A37 G1 AUTHORIZED_LOCAL_SYNTHETIC_MODEL_ONLY / G2 NOT_STARTED / G3 NOT_RUN / G4 NOT_REVIEWED`. `R09 independent G1 and A33 G4 unaffected`, `Q1e UNSUPPORTED_COMPLETENESS`, `BACKUP_NOT_RESTORE_CERTIFIED`, `G5 MERGE NOT_AUTHORIZED`, `G6 ACCESS-02 BLOCKED`, `G7 DEPLOY NOT_AUTHORIZED`, `OVERALL POC-001 BLOCKED_REAL_SERVICE`.