# POC-001 ACCESS-02 — Pre-Request Readiness Matrix (D007-A32 R09 G1 pending)

**D007-A32 CURRENT PRE-G6 MATRIX OVERLAY (2026-11-24 Europe/Berlin; Option A APPROVED):** [R09 narrow local G1](../../architecture/D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md), [R09 Execution](REMEDIATION_09.md), [QA plan](REMEDIATION_09_QA_PLAN.md). **M29-09/10 ACCESS-01 cleanup reserve at `49ad24e82f5895f4b6e5f30cb84b3294229df012` remains FAIL (P2-R08-QA-1)**; R09 local-only fix has **G1 AUTHORIZED / evidence NOT_RUN**. **M29-12 mutation sufficiency remains PARTIAL (P2-R08-QA-2 B5 and P2-R08-QA-3 Q4b)**; R09 regression+mutation plan authorized, not passed. R09 fixed start PR SHA `49ad24e82f5895f4b6e5f30cb84b3294229df012` on original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, no CI/old test/ACCESS_POLICY or external access changes. Legacy R08 local HTTPS/SSRF/Q4/Q5/CAP results are **technical limited observations**, not global G4 PASS; P2-R05-2 scale policy and Q1e completeness pending. Provider M29-P01..06 still NOT_RUN, separate empty account/host/credentials USER_CONFIGURATION_PENDING, M29-13 G6 ACCESS-02 NOT_AUTHORIZED. Future independent G3 at new R09 exact SHA and Design D007-A33 G4 required. **G5 MERGE NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 DEPLOY NOT_AUTHORIZED / OVERALL BLOCKED_REAL_SERVICE.** Previous overlays are historical and must not be read as fresh R09 evidence.


**D007-A31 CURRENT PRE-ACCESS-02 MATRIX OVERLAY (2026-11-24 Europe/Berlin):** [A31 exact-SHA partial decision](../../architecture/D007_A31_POC001_R08_G4_PARTIAL_DISPOSITION.md), [QA #7123738287](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7123738287). R08 final `49ad24e82f5895f4b6e5f30cb84b3294229df012` has independently observed local HTTPS, SSRF, Q4 absolute 1000ms body behavior, Q5 nonterminal safety, CAP fixture N=1665/1666, but **R08 LOCAL_STAGE PARTIAL / G4 NOT ACCEPTED**. A29 M29-09/10 cleanup admission **FAIL / P2-R08-QA-1 OPEN**, under 2-writer early-cleanup straggler scenario with 5 synthetic files left even though 100 requests cap enforced. M29-12 repository mutation coverage **PARTIAL / P2-R08-QA-2 + QA-3 OPEN**: unsafe refused-write mutant B5 and idle-timeout Q4b survive all 191 repo tests. Preserve M29-02 as only **SYNTHETIC_FIXTURE_OBSERVED**; capacity production policy still PENDING; Q1e unknown omission UNSUPPORTED. M29-08 USER_CONFIGURATION_PENDING, M29-13/G6 ACCESS-02 BLOCKED, all M29-P01..P06 provider cases NOT_RUN. New R09 test+minimal code work is **NOT AUTHORIZED** by A31. No source/CI/UI/old instruction or ACCESS-01 policy changes. **G5 MERGE NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 DEPLOY NOT_AUTHORIZED / OVERALL BLOCKED_REAL_SERVICE**. A30/A29 historical matrix rows below remain requirements/evidence, not fresh PASS claims.


**D007-A30 CURRENT MATRIX OVERLAY (2026-11-24 Europe/Berlin, user APPROVED Option A):** [R08 bounded G1](../../architecture/D007_A30_R08_LOCAL_READINESS_G1_AUTHORIZATION.md), [Execution instruction](REMEDIATION_08.md), [independent QA plan](REMEDIATION_08_QA_PLAN.md). Mandatory starting PR #2 head `ace7b1e610529c1f139dc06371d9f531ccf0e28b`, immutable original POC base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, existing branch `exec/POC-001-webdav-feasibility`. **R08 G1 LOCAL_SYNTHETIC AUTHORIZED / EXECUTION NOT_STARTED / G3 QA NOT_RUN**. A29 rows M29-02,04,05,06,07,09-12 are now **AUTHORIZED_TO_EXECUTE_LOCAL_ONLY, EVIDENCE_PENDING**, not PASS; only A30 strict source/test whitelist may change. M29-03 Q1e arbitrary missing-item and snapshot proof still UNSUPPORTED. M29-08 actual separate account USER_CONFIGURATION_PENDING; M29-13 ACCESS-02 NOT_AUTHORIZED; all M29-Pxx provider results NOT_RUN. Prior A28 **G4 local exact SHA `ace7b1e610529c1f139dc06371d9f531ccf0e28b`** remains historical, not acceptance of a new R08 SHA. Local HTTPS may only contact loopback, non-loopback remains denied. **G5 merge NOT_AUTHORIZED, G6 ACCESS-02 BLOCKED, G7 deploy NOT_AUTHORIZED, OVERALL BLOCKED_REAL_SERVICE**. Historical A29 matrix rows below remain the requirements.


**Status: DESIGN MATRIX APPROVED / ALL NEW EVIDENCE PENDING; NOT AN ACCESS TICKET.** Normative [A29 decision](../../architecture/D007_A29_PRE_ACCESS02_READINESS_DESIGN.md), [A28 G4](../../architecture/D007_A28_POC001_G4_LOCAL_DISPOSITION.md), [ACCESS-01](ACCESS_POLICY.md), [risk register](POST_G4_RISK_REGISTER.md). Reviewed local exact SHA: `ace7b1e610529c1f139dc06371d9f531ccf0e28b`, original branch `exec/POC-001-webdav-feasibility` and base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; no new source/test execution granted. Independent QA [#7121490151](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7121490151) covers bounded local R06+R07 only.

**State tags:** `LOCAL_ACCEPTED_A28`; `LOCAL_PROOF_REQUIRED`; `DESIGN_ONLY_PENDING_NUMBERS`; `USER_CONFIRMATION_PENDING`; `AFTER_SEPARATE_G6_ONLY`; `PRODUCTION_NOT_CERTIFIED`; `NOT_RUN`. A row's test is only a **proposal** until separately approved. For every future evidence row require exact reviewed SHA, independent QA direct PR comment ID, fixture digest, environment, actual commands/exits, source/tree diff, risk verdict, measured result and limits. Execution returns independent QA evidence to Design; QA does not self-close a risk.

## A. Exact pre-G6 matrix

| ID | Risk / assertion | Type / current status | Independent PASS / mandatory STOP evidence |
| --- | --- | --- | --- |
| M29-01 | Exact SHA, approved branch/base/scope | `LOCAL_ACCEPTED_A28` at `ace7b1e610529c1f139dc06371d9f531ccf0e28b` | Reverify PR OPEN/unmerged, exact SHA, 0 merge, 67 original allowlisted changed paths; changed SHA requires new evidence |
| M29-02 | P2-R05-2 known parser ceiling | `LOCAL_PROOF_REQUIRED` (export-level) | Synthetic N=1665/1666, declared `8+6*N` and real body bytes/depth/memory/time; when over limit fail closed 503, zero partial/GET/writes; do not claim universality |
| M29-03 | Q1e known-fixture identity oracle | `LOCAL_PROOF_REQUIRED` if proposing bounded live listing | Set up fake IDs independent of PROPFIND, missing-known/duplicate/foreign/ambiguous result rejects; stable counts and hashes; **does not** prove invisible arbitrary real records or global snapshot |
| M29-04 | Q4 admission and slow request | `DESIGN_ONLY_PENDING_NUMBERS + LOCAL_PROOF_REQUIRED` | Fix finite quota/body/deadline values in later scoped G1; two actors plus saturation, body stall, different payload same operationId, 429 and restart; no unbounded queue, false confirmation or overflow |
| M29-05 | Q5 late acknowledgment/UNKNOWN fence | `LOCAL_PROOF_REQUIRED` | Inject applied-but-unconfirmed PUT, missing/stale ETag, failed readback/5xx, quota exhaustion/restart; no blindly repeated PUT, `UNKNOWN` held, dependent writes blocked, manual evidence/STOP |
| M29-06 | TLS peer/hostname and redirection | `LOCAL_PROOF_REQUIRED`, current real HTTPS NOT IMPLEMENTED/UNVERIFIED | Independently run synthetic HTTPS fixtures and negative CA/CN/expiry/downgrade/redirect; reject before credential dispatch; no `rejectUnauthorized=false`; real host not contacted |
| M29-07 | Target/SSRF/canonical path, scope | `LOCAL_PROOF_REQUIRED` | Exact pinned host/port/path, deny wrong origin, private-IP rebinding, redirect, encoded traversal/cross-run scope, arbitrary URL and credential forwarding; zero egress on refusal |
| M29-08 | Out-of-band secrets and accounts | `USER_CONFIRMATION_PENDING` | User attests **second disposable empty account**, not Zotero sync, separate app password mechanism, safe injection, controlled operator/host and revocation; never reveal credential; no login now |
| M29-09 | Authorized HTTP verbs, cleanup | `DESIGN_ONLY_PENDING_RUN_SHEET + LOCAL_PROOF_REQUIRED` | One run namespace, deny root/recursive delete and MOVE, approve individual synthetic ID allowlist; ambiguous data/cleanup ⇒ STOP |
| M29-10 | 100 requests / rolling 30 minutes | `DESIGN_ONLY_PENDING_RUN_SHEET + LOCAL_PROOF_REQUIRED` | Include auth/PROPFIND/GET/PUT/cleanup/readback; pre-reserve cleanup slots, reject before exceeding cap; 401/429 STOP, no unbounded retry |
| M29-11 | Max files/data/writers | `DESIGN_ONLY_PENDING_RUN_SHEET` | ≤20 fake files; ≤1 MiB per file and ≤20 MiB total; ≤2 independent writers; no PDF/actual Zotero IDs; fixed per-test plan and measured counters |
| M29-12 | Independent fresh G3 → Design G4 | `LOCAL_PROOF_REQUIRED` on any new readiness SHA | New execution only after explicit scoped G1; separate QA window and fresh clone, own faults/recording, exact final SHA comment, Design G4; no same-session self QA |
| M29-13 | ACCESS-02 request identity | `G6_BLOCKED` | Proposed **exact** POC source/test SHA, user-defined host/operator/path and approval, safe config, known request count, before/after and STOP; requires **new affirmative user approval** before first real request |

## B. Provider-only verification design (never pre-authorized)

| ID | Actual provider capability | Test oracle for **future separately authorized G6** | Status now |
| --- | --- | --- | --- |
| M29-P01 | Real HTTPS certificate/host/DNS | Only the specifically user-approved endpoint; strict cert and pinned host, no redirects/credential leakage; STOP on mismatch | `AFTER_SEPARATE_G6_ONLY / NOT_RUN` |
| M29-P02 | Real PROPFIND shape/lock/foreign href | Explicit 114-byte resourcetype PROPFIND; legal lock-related properties; exact root/kind listing; 503 safe on malformed/unexpected | `AFTER_SEPARATE_G6_ONLY / NOT_RUN` |
| M29-P03 | Strong ETag and CAS | Cross-process two-writer stale expected revision, observable 412/conflict and preserved winning bytes; PUT ETag and GET ETag consistency, same-byte update semantics | `AFTER_SEPARATE_G6_ONLY / NOT_RUN` |
| M29-P04 | MKCOL/If-None-Match/create-only | Authorized run namespace only, reject duplicate creates without overwrite, read back authoritative state | `AFTER_SEPARATE_G6_ONLY / NOT_RUN` |
| M29-P05 | Real quota, retries and failure results | Count requests against stronger of provider quota and ACCESS-01 cap; 401/429/423/5xx and lost ack ⇒ STOP/UNKNOWN, no blind retries | `AFTER_SEPARATE_G6_ONLY / NOT_RUN` |
| M29-P06 | Synthetic cleanup and isolated restoration | Inventory only own ≤20 fake files; per-ID controlled deletion and verify emptiness; ambiguous outcome quarantine/STOP; no account-root ops | `AFTER_SEPARATE_G6_ONLY / NOT_RUN` |

**No circular prerequisite:** M29-Pxx success is **not demanded before first G6 authorization**; the pre-G6 approval must instead verify *safe test code, expected outcomes, oracles, failure STOP and account controls*. Any real failure returns to Design.

## C. Production-not-certified ledger

| Item | Current boundary | Explicit future decision |
| --- | --- | --- |
| Q1e arbitrary missing record | `UNSUPPORTED_COMPLETENESS` | Trusted manifest/inventory and snapshot consistency architecture before certified full backup |
| Q4 global fairness / durable ledger | `RESIDUAL_POLICY_REQUIRED` | Cross-instance ledger or restricted single-instance profile plus tested admission; no production throughput guarantee |
| Q5 indefinite `indeterminate` | `RESIDUAL_POLICY_REQUIRED` | Durable authoritative recovery/fence operator design or permanent safe refusal; no liveness or exactly-once claim |
| P2-R05-2 production paging/scale | `CAPACITY_POLICY_PENDING` | Real workload and provider-specific verified page/listing limits, separate Design cap |
| Backup/restore/encryption | `PRODUCTION_NOT_CERTIFIED` | Trusted snapshot and manifest, encryption custody, independent restore, deletion anti-resurrection, RPO/RTO decisions |
| G5/G6/G7 | `NOT_AUTHORIZED` | Separate affirmative user decisions; no implication from A29 |

## D. Evidence and next handoff checklist

- [ ] Independent pre-G6 synthetic exact-SHA evidence for M29-02..07, 09..12 (new G1 required; **all NOT_RUN here**).
- [ ] User-controlled account/operator and out-of-band secret mechanism confirmed; no credential pasted or account touched.
- [ ] Run sheet supplies **exact** host, allowed method/path, synthetic fixture IDs, timeout/abort, max requests and cleanup reservations.
- [ ] Failure escalation for unsafe TLS, unauthorized scope, P0/P1, ambiguous UNKNOWN, quota overflow and inability to clean.
- [ ] Design separately reviews matrix and explicitly creates/denies a specific ACCESS-02 G6 request. Without it all provider calls remain BLOCKED.

**Overall: `ACCESS02_REQUEST_NOT_READY / BLOCKED_REAL_SERVICE`.**
