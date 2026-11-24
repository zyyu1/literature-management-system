# D007-A37 — Q1e L3 Independent Synthetic Transaction Reference Prototype: Exact G1 Authorization

**User decision:** APPROVED D007-A37 Option A on 2026-11-24 (Europe/Berlin). This document authorizes precisely **ONE bounded local synthetic L3 G1**, separate from POC-001 R09, to construct a **deterministic, storage-neutral, in-memory logical transaction reference model**, independently test the **26 L3-applicable cases** from A36 and report honest limits. **This is NOT selection of an actual database product, cloud or physical persistence engine; NOT G2 evidence, G3, G4, a production transaction guarantee, Q1e closure, migration, live backup or ACCESS-02 approval.**

**Binding sources reviewed:** [A34 trusted manifest/snapshot/deletion and restore design](D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md), [A34 20-case matrix](D007_A34_Q1E_TRACEABILITY_QA_MATRIX.md), [A35 conditional L3 preference](D007_A35_Q1E_STORAGE_STRATEGY_DISPOSITION.md), [A35 F01..18 matrix](D007_A35_Q1E_OPTION_DECISION_MATRIX.md), [A36 L1/L3 future feasibility plan](D007_A36_Q1E_LOCAL_FEASIBILITY_DESIGN.md), [A36 35-case QA matrix](D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md), [A6/A7/A11/A17 existing constraints](D007_A6_DATA_SCHEMA_RECOVERY.md), [A32 R09 narrow G1](D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md), [A31 historical R08 G4 partial](D007_A31_POC001_R08_G4_PARTIAL_DISPOSITION.md). The complete original A36 35-case matrix remains unchanged; this G1 selects **12 common C01..12 + 7 L3 T01..07 + 7 recovery R01..07 = 26**, not the nine L1-only cases. New [Execution work order](../handoffs/Q1E-L3/EXECUTION_WORK_ORDER.md) and [independent QA plan](../handoffs/Q1E-L3/INDEPENDENT_G3_QA_PLAN.md) are binding.

## 1. Exact SHA, branch, PR and isolation gate

| Control | Fixed value |
| --- | --- |
| Repo | `zyyu1/literature-management-system` |
| **IMMUTABLE new implementation base** | `1dd8b51f84921d23dc0112e4056fa7220bbb73e8` (the A36 `main` commit verified at user approval; no floating main) |
| **New, initially absent execution branch** | `exec/Q1E-L3-synthetic-transaction-feasibility` |
| New PR | Execution may open **one new independent PR** from that branch targeting `main`, **OPEN / UNMERGED**; do not reuse PR #2. Record new PR number. Main may move due to later Design/governance; never merge/cherry-pick/rebase main into this implementation branch |
| A37 Design authority | Exact future `main` commit publishing this file, pinned and fetched separately without importing it into the execution branch |
| R09 protected branch / PR | `exec/POC-001-webdav-feasibility` / PR #2, current observed HEAD `49ad24e82f5895f4b6e5f30cb84b3294229df012`; A32 G1 and A33 separate G4 are unchanged |
| Allowed network | **ZERO HTTP, DNS, TLS, sockets or external-provider traffic by prototype/tests**. Git/GitHub access for source fetch/PR comments is the sole allowed remote coordination, not prototype data access |
| Change base for allowlist audit | `git diff --name-only 1dd8b51f84921d23dc0112e4056fa7220bbb73e8..FINAL_HEAD` and strict new file list below |
| Execution authorization | `G1 AUTHORIZED_LOCAL_SYNTHETIC / G2 NOT_STARTED / independent G3 NOT_RUN / G4 NOT_REVIEWED` |

**Preflight STOP:** verify `main` still contains the immutable A36 base as ancestor (it need NOT equal base because Design progresses), fetched A37 main Design commit and A34–A36 documents exist, **new execution branch does not already exist or is already exactly at the immutable base with zero divergence**, PR #2 unchanged from observed authorization state or explicitly report any concurrent R09 progression to Design without modifying it, clean full checkout from exact base, 0 merges/rebase/force push, no unknown files. Any branch already created with unreviewed commits or any base mismatch ⇒ **PENDING/STOP, no reset/rewrite**. If git remote authentication fails: report PENDING/STOP and restart full preflight after legitimate recovery, no one-time exceptions.

## 2. Rigid incremental write whitelist (relative to immutable base)

**Only create these new paths; do not modify any pre-existing source, dependency or policy files:**

- `poc/q1e-l3/README.md` — explicit mock-only capability, limits, STOP and commands.
- `poc/q1e-l3/src/model.mjs` — deterministic in-memory copy-on-write transactional **reference model** with confirmed catalog, revisions, relationships, operationId/UNKNOWN and controlled commit barriers. No actual database driver or filesystem durability claim.
- `poc/q1e-l3/src/snapshot.mjs` — schema-neutral trusted **predeclared synthetic** expected-ID inventory, pinned checkpoint, record/graph validation, fixture-only byte serialization and evidence statuses. No production manifest signing or universal inventory proof.
- `poc/q1e-l3/src/recovery.mjs` — separate *logical* fake high-watermark/deletion witness, simulated authenticated archive/key outcomes and **isolated stage-only** restore. No active cutover, no real keys or user backup.
- `poc/q1e-l3/test/l3-contract.test.mjs` — positive and negative mapped 26 A36 case assertions.
- `poc/q1e-l3/test/l3-faults.test.mjs` — deterministic adversarial barriers, two-writer schedules, kill/restart **simulation**, rollback and invalid-witness negatives.
- `poc/q1e-l3/scripts/check.mjs` — no-network, no-dependency case coverage and safety assertions; does not edit CI.
- `poc/q1e-l3/scripts/mutation-check.mjs` — disposable-source-copy meaningful mutation verifier (outside repository temp workspace), unchanged source in tracked tree.
- `poc/q1e-l3/evidence/**` — **new sanitized synthetic-only** evidence generated on this branch, never store secrets, private keys or real Notes.
- `docs/handoffs/Q1E-L3/QA_HANDOFF.md` — exact-SHA Execution-to-QA handoff and results, preserving prior signed provenance if any (new file expected).

All other paths **READ-ONLY**, including **`poc/001/**, `docs/handoffs/POC-001/**, Module 002 frozen UI, all apps/src packages, root README, existing `package.json`/locks, `.github/**/CI`, A1–A36/A32 governance and authorization, `docs/governance/**, real Zotero/WebDAV config, and original execution/QA instructions. Do not create a test folder outside this prefix, do not add any database package, plugin, bundler, shell script or workflow. Failure to complete within whitelist ⇒ STOP and request a **new** user/Design decision, not an unapproved fix.

## 3. Exact prototype meaning and built-in-only environment

Node.js **v22.23.5 reference runtime** (record actual version; if unavailable/mismatched, STOP rather than installing/switching silently) with built-in `node:test`, `node:assert/strict`, `node:crypto` and pure JS types only. A **reference transaction engine**, not a selected DB: emulate atomic commit of one in-memory logical aggregate containing website-owned confirmed records **plus** authoritative expected inventory, related IDs/revisions, confirmed deletion state and operation witnesses. A crash/restart test snapshots/rehydrates *explicitly modelled state*; this is a **simulated** durability boundary, not proof of fsync, WAL, power loss, multi-process atomicity, SQL isolation or real persisted key custody. When only model simulation is possible, evidence must say `MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN`.

Keep A5 `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN` honest; no blind retry when ACK lost. Copy-on-write transaction candidate may be published **only once** at the explicit commit barrier, with every constituent record/catalog/operationId/deletion entry updated together in the reference model. Use logically separate mock trust domains for the latest deletion high-watermark and archive to demonstrate **why external anti-rollback protection is necessary**, not to claim a real independent hardware/store witness. No real MAC/signature/key or canonical-JSON production standard is selected; if test needs fake authenticated tag, mark fixture-only and inject negative failures. Deterministic byte encoding for fixture probes is not an approved production serialization profile.

**Scope data:** confirmed website-owned owner/project/association/Important, scoped Zotero compound ID, shared ReadingStatus and whole five-field ResearchNote, KeyQuote with ordered confirmed SourceHistory; synthetic Project deletion affects only owned Project and Associations. Exclude Zotero original PDFs, annotations and attachments, local unconfirmed drafts, sessions, credentials and personal research.

## 4. Required 26 scenario gates

Run **all** mapped cases from [A36 matrix](D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md): `A36-C01..C12`, `A36-T01..T07`, `A36-R01..R07`. Every case must have positive control and fault/negative oracle, with a machine-readable observed case ID, expected and actual state/result and side-effect trace. `A36-C02` is an **honest impossibility demonstration**: unknown ID omitted from an untrusted listing and from a catalog derived only from that listing **cannot be detected**. Pass this as a correctly reported `UNSUPPORTED_COMPLETENESS`, not as a complete inventory proof. L3's independent known fixture catalog may detect *known* omission in `C01`; it cannot prove a trustworthy production catalog exists.

**Core cases:** owner/library identity with colliding Zotero item keys, whole-note Markdown byte preservation, per-Project deletion without shared-data cascade, Quote Relink+confirmed history atomicity, CAS and two-writer conflict, snapshot pinned at checkpoint K despite writer K+1, crash before commit/after commit-before-ACK, mismatch or uncertain opId remains UNKNOWN, lost witness fails closed, old valid archive containing deleted Project blocked, simulated wrong-key/auth failures, isolated stage only and no live cutover. If a future physical durability property is unimplementable in this model, **record PHYSICAL_UNPROVEN**, do not falsely satisfy it with in-memory assertion.

**No false PASS:** A future independent G3 can certify **model-level local correctness** for the tested schedules; only later G1 using a real approved backend and real durable evidence could support physical L3 feasibility. Q1e full-library completeness, trusted rollback-resistant deletion and BACKUP_KEY recovery remain **UNSUPPORTED / NOT_RUN**, even after a local model PASS.

## 5. Mutation and regression requirements

All 26 case IDs mapped unambiguously and deterministically. **At least 8 distinct meaningful synthetic fault mutants** must be built in disposable copies outside tracked files, including: (1) drop authoritative known ID; (2) split record/catalog commit; (3) publish partial Quote Relink/history; (4) lose CAS/write skew; (5) mix snapshot K and K+1; (6) false CONFIRMED after lost ACK; (7) accept old deleted Project when T3 witness newer; (8) write active state instead of isolated staging. Additional recommended wrong-owner/key, data loss in Note and forged hash mutants. **Each mutation must be killed by the intended corresponding named A36 assertion**, not syntax errors, setup failure or arbitrary timeout; report actual kill/survivor/not-run/wrong-reason. No fixed mutation totals are preapproved and no weakening of 26 gates to gain green tests.

Required runner: `node --check` every new JS file, `node --test poc/q1e-l3/test/*.test.mjs` (from repo root), independently repeated **5 separate full runs** if claiming x5, `node poc/q1e-l3/scripts/check.mjs`, `node poc/q1e-l3/scripts/mutation-check.mjs`, Git diff/path/secret scan, `git status --short`, zero external socket/host, zero new deps. No edits to root `package.json` or CI. If an execution needs a shell or packaged installer/DB engine, STOP; no workaround beyond scope.

## 6. Independent G3, Design G4 and mandatory STOP

1. Execution implements only whitelist on **new isolated branch from immutable base**. Post final new PR (not PR #2) OPEN/unmerged, exact 40-char SHA, complete path and source digest check, case results, honest limits `MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN`, zero network/secret proof and sanitized evidence. Update only new `docs/handoffs/Q1E-L3/QA_HANDOFF.md`. Then **EXECUTION STOP**.
2. **Execution coordinates separately user-opened independent QA**, never a same-Execution-session sub-agent. QA fresh clone new exact PR HEAD and A37 authority SHA, independent expected-inventory graph, two-writer/fault/rollback mutants, source/path verification and all applicable 26 named cases; posts a direct QA comment to the **new Q1E-L3 PR**, not PR #2. Then **QA STOP**. Execution returns the **unedited** comment ID/URL, full results, P0/P1/P2/INFO, NOT_RUN/UNSUPPORTED and exact SHA to Design. If QA cannot be arranged: `G3_INDEPENDENCE_PENDING` and STOP.
3. **Separate Design D007-A38** alone may accept or reject exact-SHA G4 *MODEL-LEVEL* local proof, and must separately state **physical L3 durability and production Q1e remain unproven**. No automatic next G1, database choice, merge, external access or deployment.
4. STOP on drifted branch/base/whitelist, new dependency/CI, actual external socket/real data, false Saved/Delete/Restore, stale Project resurrection, broken owner scope, mutation survivors in mandatory categories, missing independent witness/oracle, unexpected P0/P1, or QA scope divergence. Preserve last confirmed and rejected states; no silent repair outside G1.
5. **No effect on existing R09:** its original `exec/POC-001-webdav-feasibility` PR #2, immutable original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, fixed R09 start `49ad24e82f5895f4b6e5f30cb84b3294229df012` and exact A32 whitelist/QA/G4 remain separately controlled. Neither new prototype branch nor main Design docs are to be merged into R09.

## 7. Residual authorizations and risk state

`A37_G1=AUTHORIZED_LOCAL_SYNTHETIC_MODEL_ONLY`, `G2=NOT_STARTED`, `G3_INDEPENDENT_QA=NOT_RUN`, `G4=NOT_REVIEWED`. `Q1e=UNSUPPORTED_COMPLETENESS`, `BACKUP_NOT_RESTORE_CERTIFIED`; A36 26 applicable planned cases **NOT_RUN** and 9 L1 cases outside A37 scope; P2-R05-2 capacity policy pending and A31 P2-R08-QA-1/2/3 OPEN until separate R09 G3/A33. `G5 MERGE NOT_AUTHORIZED`, `G6 ACCESS-02 BLOCKED`, `G7 DEPLOYMENT NOT_AUTHORIZED`, `OVERALL POC-001 BLOCKED_REAL_SERVICE`.

**D007-A37 FINAL: EXACT BOUNDED G1 AUTHORIZED ONLY.** No product/backend selected, no branch/PR created by Design, no code or QA executed by Design.