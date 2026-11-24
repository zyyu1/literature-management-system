# Q1E-L3 — D007-A37 Independent G3 QA Plan (NOT_RUN)

**AUTHORITY: D007-A37 exact user-approved G1, MODEL-ONLY LOCAL SYNTHETIC.** Read [A37 G1](../../architecture/D007_A37_Q1E_L3_SYNTHETIC_G1_AUTHORIZATION.md), [A36 L1/L3 35-case matrix](../../architecture/D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md), [Execution work order](EXECUTION_WORK_ORDER.md) and A34/A35. This file is a **design-time QA plan, NOT a QA result**, and does not permit live tests until the new bounded G1 Execution has produced an exact PR HEAD. **ALL 26 case checks NOT_RUN; no independent G3 accepted yet; no database selected.**

## 1. Independently opened session and authority preflight

Execution—not Design—coordinates a **separately user-opened QA session**, not an Execution same-session subagent. QA works from a **fresh complete clone** of the NEW Q1E-L3 PR on exact immutable final 40-char SHA, reads pinned A37 Design main authority, and independently checks:

- Frozen initial execution base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8`; branch `exec/Q1E-L3-synthetic-transaction-feasibility`; new PR to `main` OPEN/UNMERGED; no merge commits, rebase/force, unauthorized branch ancestry or old PR #2 reuse. Rolling target main is not the frozen base.
- **ALL changed files** relative to fixed base exactly among `poc/q1e-l3/README.md`, `src/model.mjs`, `src/snapshot.mjs`, `src/recovery.mjs`, `test/l3-contract.test.mjs`, `test/l3-faults.test.mjs`, `scripts/check.mjs`, `scripts/mutation-check.mjs`, `evidence/**`, and `docs/handoffs/Q1E-L3/QA_HANDOFF.md`; no edits to pre-existing files, `poc/001/**`, R09 branch/PR #2, apps, packages, CI, Module 002 frozen UI, original instructions or Design/governance documents.
- Authorized Node v22.23.5 baseline and no new installed dependencies; **zero actual prototype HTTP/DNS/TLS/socket** calls, real credentials, PDFs, device drafts or data. Existing GitHub clone/comment is permissible coordination, but must not be mislabeled as prototype network test.
- Independent expected-fixture digest and QA-owned barriers/negative scenarios separate from Execution's sample fixtures. First Git/auth failure ⇒ STOP/PENDING and restart preflight if credentials restored; do not grant historical A28 waiver.
- Distinguish **logical in-memory copy-on-write model** from any real database WAL, disk fsync, power loss, cross-process durability, active storage authority, externally protected deletion witness, genuine cryptographic key custody. **Never report these as proven.**

## 2. Mandatory 26 named case audit

Run and individually record **12 common C01–C12, 7 L3 T01–T07, 7 recovery R01–R07** from A36. QA must independently challenge each, not accept repository 26 green assertions as sole proof:

| Group | Mandatory independent negatives |
| --- | --- |
| **C01–C03** | Valid DAV-like listing omits **known** ID (trusted predeclared fixture catches); unknown omission from both untrusted sources => **UNSUPPORTED** rather than a false complete claim; cross-owner/mixed Zotero library-ID collisions and dangling links fail |
| **C04–C07** | Two fake writer conflicts/CAS, whole five-field Note+status atomicity; Project deletion retains global Note/Quote and confirms only scoped associations; Quote Relink and SourceHistory always together; before/after commit lost ACK and UNKNOWN not replayed; reader snapshot pinned K despite K+1 |
| **C08–C12** | Valid old backup with later deleted Project refuses despite old internal hash/auth; missing newest fake outside-archive witness refuses; wrong-owner/auth/key failure not mistaken for missing/empty Note; staging exception never updates active state; no extra paths, data or outside socket |
| **T01–T03** | Inject crash at every simulated commit step, no half catalog/record; committed-but-unacknowledged result still honest; attempt conflicting operation ID and concurrent write skew/Project delete+Relink tests |
| **T04–T07** | Pinned revision graph under concurrent writer, independent fake T3 newer than rolled-back fake store (and fail if T3 rolled back too), serialization abort vs UNKNOWN no blind replay, external manifest failure does not falsely certify backup |
| **R01–R04** | Stale archive after confirmed Project deletion, missing/stale fake witness, both ordering races between deletion and witness; staged exact UTF-8/Markdown five fields and Quote SourceHistory or clear failure without live mutation |
| **R05–R07** | Lost/mismatched synthetic BACKUP key/auth scope, missing key => KEY_UNAVAILABLE, half stage/cutover never changes active state, unchosen tombstone retention => POLICY_PENDING not invented days |

**Special truth-status:** `C02` is satisfied only by the **correctly reported inability to infer unknown completeness**, not by inventing a trusted catalog. Tests proving an independent fake inventory detect a known missing item (C01) do not certify general Q1e. All PASS statements refer **only to modeled logical invariants**; `PHYSICAL_DURABILITY_UNPROVEN` and `BACKUP_NOT_RESTORE_CERTIFIED` remain even on 26/26 modeled behaviors.

## 3. QA-owned independent mutation test

At minimum independently create **eight deliberately faulty versions in disposable out-of-repo copies**, preserve original repo clean:
- **M-INV**: discard a known inventory ID while falsely claiming complete.
- **M-COMMIT**: split record update and catalog/revision/operation witness.
- **M-HISTORY**: Relink Quote without history event, or delete global Note with Project.
- **M-CAS**: ignore a concurrent conflict / write-skew.
- **M-SNAP**: replace a pinned K revision with K+1 mid-export.
- **M-ACK**: after lost ACK fabricate CONFIRMED or DEFINITE_FAILURE.
- **M-DELETE**: ignore newer deletion high watermark, resurrect old deleted Project.
- **M-STAGE**: route isolated restore record into active confirmed state.

Every QA-owned mutant must reach intended control/failure, be caught by a named **case-specific assertion**, and be recorded as `KILLED_BY_INTENDED_ORACLE`; syntax/setup errors, host timeout or unrelated mutation-failure do not count. Probe also wrong owner/authentication, lost key, truncated UTF-8, fake rollback of T3 if practical; mark NOT_RUN rather than “equivalent” for unavailable probes.

## 4. Run and evidence verification

Run `node --check` for every changed JS file, `node --test poc/q1e-l3/test/*.test.mjs` in independently separate processes (5 distinct executions if claiming ×5), `node poc/q1e-l3/scripts/check.mjs`, `node poc/q1e-l3/scripts/mutation-check.mjs`, zero-new-dependency/secret scan, exact base→head changed paths and source blobs, no-prototype-network trap, actual CPU/OS/Node/timings/memory. Report **actual** case count and mutation totals; 26 is the minimum **case ID coverage**, not a prediction of count of `node:test` assertions. A failure to create 26 independent QA observations is PARTIAL/NOT_RUN, not PASS.

Independent evidence must include QA fixture expected ID/revision graph and digest, fault-injection timing/barrier, operation result and active/expected stored state, invalid/foreign owner, snapshot checkpoint K and K+1, accepted vs rejected fake archive deletion witness versions, exact staged records/count, BOUNDARY: no actual fsync or real key/witness, and every NOT_RUN/UNSUPPORTED. No private key/cert, real PDF/Note or password in repo or report.

## 5. QA report, risks, escalation and STOP

QA posts **direct GitHub PR conversation comment on NEW Q1E-L3 PR**, with full SHA and independently authored verdict:
- `Q1E-L3 LOCAL_MODEL_STAGE = PASS / PARTIAL / FAIL`;
- `G3_INDEPENDENCE = VERIFIED / PENDING`;
- `26 CASES = [C01..C12, T01..T07, R01..R07] individually accounted`;
- `MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN / Q1e UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED`;
- all P0/P1/P2/INFO, wrong-reason and surviving mutants, NOT_RUN/UNSUPPORTED;
- `OVERALL POC-001 = BLOCKED_REAL_SERVICE` and G5/G6/G7 NOT_AUTHORIZED.

If all modeled obligations pass under independent G3, QA may recommend **`PASS_MODEL_ONLY_CANDIDATE_FOR_D007_A38`**, **not a G4 or physical-durability certification**. Explicit security/consistency defect, false Confirmed/Deleted/Restored, resurrected Project, scope drift, external egress, secret exposure or branch interference => FAIL/STOP and report. If QA cannot directly post, Execution must report provenance limitation; Design decides independence. **QA STOP**. Execution relays full unedited QA text/comment URL/ID to Design; no same-session subagent accepted. Only separate Design **D007-A38** may decide exact-SHA G4 model-level acceptance, never automatically close Q1e or authorize production/migration/merge/ACCESS-02/deploy.

**Current: all 26 planned NOT_RUN; G1 AUTHORIZED_LOCAL_SYNTHETIC_MODEL_ONLY; G2 NOT_STARTED; G3 NOT_RUN; G4 NOT_REVIEWED; G5 NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 NOT_AUTHORIZED; POC BLOCKED_REAL_SERVICE.**