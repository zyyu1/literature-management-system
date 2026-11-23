# D007-A9 — Cross-Module QA Strategy, Independent Evidence and Release Gates

**Decision:** D007-A9 **Option B APPROVED**, 2026-11-23 (Europe/Berlin).  
**Status:** **DESIGN APPROVED / NO NEW TESTS EXECUTED / NO APPLICATION OR QA CODE AUTHORIZED**.  
**Scope:** cross-module requirement→fixture→end-to-end→evidence mapping, fault and concurrency matrix, physical-device evidence requirements, independent QA gates, release authorization workflow.  
**Companion:** [D007-A9 synthetic catalog and full frozen 26-case crosswalk](D007_A9_TRACEABILITY_FIXTURES.md).  
**Design inputs:** [D007-A4 auth](D007_A4_AUTH_SESSION_SECURITY.md), [A5 API contract](D007_A5_API_CONTRACT.md), [A6 data/recovery](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 lifecycle/privacy](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A8 Zotero/device contract](D007_A8_ZOTERO_INTEGRATION.md), and frozen [Module 002 26-scenario catalog](../ui/002/ACCEPTANCE_TRACEABILITY.md).  
**Source preservation:** Module 002 **67 approved UI-D decisions** and **26 original U6-L1..L4 scenarios** remain exactly as published; their original status is **NOT RUN**. This file does not amend their ID, scope, count or recorded result.

## 1. Scope firebreak and pre-existing POC evidence

| Source/track | Current grounded status | Rule |
| --- | --- | --- |
| **Module 002 UI** | 67 approved decisions; 26 planned U6 scenarios, **all NOT RUN** | Original [DESIGN_APPROVED.md](../ui/002/DESIGN_APPROVED.md) and [ACCEPTANCE_TRACEABILITY.md](../ui/002/ACCEPTANCE_TRACEABILITY.md) remain canonical, unchanged. These proposed crosswalk rows are **references only**, never a replacement acceptance list |
| **D007-A4–A8** | Planned design tests A4-01..08 (8), A5-01..10 (10), A6-01..12 (12), A7-01..14 (14), A8-01..16 (16): **60 design-only scenarios, NOT RUN** | Keep native numbered specifications and labels; this document neither creates execution scope nor claims proof. Eight **A8 M1–M8 device matrices** are separate device coverage groups, not eight measured successes |
| **POC-001 independent local QA** | [PR #2](https://github.com/zyyu1/literature-management-system/pull/2), independent [QA report comment 7088088675](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675), **reviewed head `65e14afc81e6de37ba5fac90c2937a27876c5614`**: 33/33 synthetic tests independently repeated five times; 4 P1 + P2 findings; **LOCAL_STAGE PARTIAL** | Preserve the *historical exact SHA* and actual QA disposition. 33/33 green and heuristic 0 secret-scan findings **are not LOCAL PASS**. A replacement SHA requires fresh independent QA, not this document |
| **POC-001 remediation** | [REMEDIATION_01](../handoffs/POC-001/REMEDIATION_01.md) authorized strictly within original branch/base/path allowlist; PR #2 remains in the independently governed review track | **Do not** rebase, merge, expand `poc/001/**` scope, access real WebDAV, or change POC-001's existing review/STOP on the authority of D007-A9 |
| **Real Nutstore** | **BLOCKED**, pending explicit POC-001-ACCESS-02 user authorization after local re-QA and secure preflight | Mock HTTP CAS and QA design **never** prove actual provider ETag/If-Match, file durability or multi-object atomicity |
| **Zotero physical devices/API** | D007-A8 **design only**; API, stored/linked mobile file sync, `zotero://` L1/L2/L3 **not physically tested** | No real account/PDF/annotation, app launch, credential or live-device test is authorized here |

**Interpretation:** The full D007-A4..A8 planned tests are **60**, original frozen UI planned tests **26**, and current POC tests **a separate existing suite**, not 93+ new executed tests. Do not add their IDs to a “passed tests” figure without exact artifact-specific evidence.

## 2. Unified traceability ledger (normative schema, not an implementation)

Every future authorized test result should be keyed to the immutable original requirement and a separately approved execution task:

| Field | Required meaning |
| --- | --- |
| `sourceRef` | Exact D007-A4..A8 / Module 002 / POC-001 file, pinned blob/commit SHA and anchor/section; never a vague “approved” label |
| `requirementId` | Frozen `UI-D...`, `U6-Lx-yy`, POC-xx or A4/A5/A6/A7/A8-xx ID (retain its namespace) |
| `contractInvariant` | Deterministic ownership/access, exact data-mutation scope, explicit correctness/conflict/Unknown outcome |
| `fixtureId` | Synthetic/dummy fixture case and schema revision, with no real user account or paper |
| `testCaseId` | Original U6 or A4..A8 ID, or **proposed** `E9` end-to-end/negative case ID; never overwrite a frozen ID |
| `executionPermission` | Explicit bounded Design handoff ID, allowed paths, branch, permitted network/device/secret scope |
| `codeSha` | Full **40-character** actual tested implementation HEAD; exact base and dependency lock hash where relevant |
| `expectedObserved` | Separate expected result, actual observed result, logs/trace/screenshot hashes, sanitized evidence and exceptions |
| `qaDisposition` | Independent reviewer, review timestamp, environment, PASS/PARTIAL/FAIL/NOT_RUN/UNSUPPORTED, P0/P1/P2 links |
| `designDisposition` | Separate Design acceptance/rework and merge authority; a QA PASS never self-authorizes release |

A planned row with no execution evidence must remain **NOT RUN**; a mock test with an unproven real backend remains **PASS_LOCAL** at most, and may still be **PARTIAL** for its acceptance area. Unknown platform capabilities must remain **UNVERIFIED** or **UNSUPPORTED**, not silently omitted.

## 3. Cross-module end-to-end candidate flows (NOT RUN)

| New proposed ID | Authorized synthetic future flow and invariant | Native requirement IDs / design dependencies |
| --- | --- | --- |
| **E9-01** | Project create→edit→archive→restore same ID→exactly confirmed permanent delete; no cascade into global Note/Quote/Zotero; Cancel/Escape no mutation | U6-L2-01, U6-L3-02; A5-01/02, A6-06, A7-01..04 |
| **E9-02** | Same canonical Zotero fake paper in 3 Projects; global 3-state status + one five-field Note, per-Project Important and correct tab counts/unlink scope | U6-L2-03/04, U6-L4-01; A5-06, A6-01/02, A7-03/04 |
| **E9-03** | User-selected fake Zotero Collection >100 items: bounded pagination/duplicates, attachment and annotation identity without full-library background sync | U6-L2-02; A8-01..07 |
| **E9-04** | Five-field UTF-8 Markdown note edit→preview→save/confirmed ack→Typora-compatible Saved export; separate unsynced draft export, no false Saved or auto-clean while newer edits exist | U6-L2-06, U6-L3-05; A5-04/05/07, A6-03/04, A7-05/06 |
| **E9-05** | Fake annotation picker→explicit selected Key Quotes→changed source→manual Relink, SourceHistory/quote/comment preserved; missing annotation retains excerpt | U6-L2-07, U6-L3-06; A5-07, A6-05, A8-09..12 |
| **E9-06** | Phone Select across hidden tabs/filters→exact Current/All-Project batch confirmation→parallel batches with item-level `CONFIRMED/CONFLICT/UNKNOWN` and guarded Retry Failed | U6-L2-05, U6-L3-03/04; A5-08, A7-02/03 |
| **E9-07** | Two independent simulated clients: stale note/relink, late PUT after client timeout, same operation ID sent concurrently, reauth/reload, acknowledged/unknown state and unmodified local draft | U6-L3-01/05, U6-L4-02/04; A5-02/03/05/09, A6-04/12, A7-07 |
| **E9-08** | Device layouts and accessibility: modal/safe area, IME composition, keyboard-only focus, screen-reader announcements, safe cancellation on phone/tablet/desktop | U6-L1-04/05, U6-L3-08; A4-07/08 |
| **E9-09** | Open in Zotero: per-device L1 app handoff vs L2 correct stored PDF vs L3 exact annotation, linked attachment negative, explicit user-selected fallback | U6-L3-07, U6-L4-03; A8-07..09/13..16; M1–M8 |
| **E9-10** | Unauthorized user/project, CSRF, credentialed CORS, session revoke, malicious Zotero pagination URL, stored WebDAV path, masked audit and inaccessible user data | U6-L4-05; A4-01..06/08, A5-01/10, A8-02/03/16 |
| **E9-11** | Personal Workspace separate principal reads only approved metadata/deep links; rejects status/Important/notes/Key Quote writes, session replay and foreign scope | U6-L4-06; A4-05, A5-10, A7-12 |
| **E9-12** | Consistent synthetic export→manifest/hash/parent closure→staged restore→anti-resurrection for deleted Project; corrupt snapshots and concurrent restore must **STOP rather than claim Restored** | A5-09, A6-07..11, A7-09..14; POC-07 (not a new POC test authority) |

**`E9-01..12` are proposed future synthetic integration cases only.** Their coverage does not re-label any original U6, A4..A8 or POC status. A separate Design-approved execution instruction is required to create these tests or UI/API implementation artifacts.

## 4. Concurrency, adversarial and fault-injection matrix (NOT RUN)

| ID | Trigger / risk | Required future observation and STOP rule |
| --- | --- | --- |
| **F9-01** | Upstream delayed commit *after* client timeout; verification briefly sees original ETag | MUST remain `UNKNOWN/not_yet_observed` until authoritative fencing; no final `not_committed`; POC-001 QA P1-1 history cannot be rewritten |
| **F9-02** | Two concurrent requests same `operationId`, one slow request body; same key with different payload | No duplicate dispatch within tested same-instance reservation; cross-process exactly-once not claimed without durable ledger; POC-001 QA P1-2 |
| **F9-03** | Malformed `If-Match`: weak, wildcard, list, CR/LF, `*, "x"`; independent stale writer | No invalid tag forwarded, no last-write-wins; POC-001 QA P1-3 |
| **F9-04** | Fake `https:` URL accidentally handled by plaintext `node:http`, hidden Authorization header | Fail closed before dispatch; no plaintext credential; POC-001 QA P1-4; **NO live TLS test permission** |
| **F9-05** | `constructor`, `__proto__`, `toString` as kind; path traversal, SSRF, hostile redirect | Strict own-key whitelist and URL/host/path normalization; no upstream request or private data leak |
| **F9-06** | 401/403/409/412/423/429/5xx, connection reset, offline, lost ack, restart | Distinct final rejection vs conflict vs Unknown; no blind retry or false Saved/Deleted |
| **F9-07** | Same Key Quote Relink two clients; active source commit but history event fails | STOP without inventing provenance; require proven same-unit consistency |
| **F9-08** | Project delete with surviving shared Note/Quote plus canceled all-Project unlink | Preserve global content, exact approved scope; no destructive side effect |
| **F9-09** | Missing/corrupt export item, malformed restore envelope, unsupported schema, stale backup and concurrent restore | Not restore-certified/NOT COMPLETE, no silent skipped files or resurrected deleted item; atomic snapshot remains unproven |
| **F9-10** | Session revoked in flight, malicious Origin/CSRF, leaked cookie/secret and cross-user foreign ID | Server-authoritative denial without false noncommit, no secret exposure, private data scope intact |
| **F9-11** | Zotero API paginated 100+ items, `Backoff`, 429, permission change, missing attachment/annotation | No dropped pages, aggressive retry, fake empty list or wrong PDF, no deleted local Key Quote |
| **F9-12** | Native mobile URI unsupported, app absent, linked vs stored PDF, wrong attachment/annotation | L1/L2/L3 proof separate; visible, manual fallback; no auto-redirect chain |

The F9 identifiers are **QA design references**, not changes to the current `poc/001/**` fix list. POC-001 remediation and its exact test probes are governed by [its own instruction](../handoffs/POC-001/REMEDIATION_01.md); do not copy F9 into that task without separate authorization.

## 5. Minimum independent QA evidence package (future, not performed)

Each separate, explicitly authorized PR must hand QA a fixed immutable candidate:

1. **Provenance:** repository, task/decision ID, exact intended base SHA, branch, full 40-char PR head SHA, parent SHA, all changed paths and allowlist diff, dependent PRs, identity of executor/reviewer and evidence SHA (not a floating `main`).
2. **Reproduction:** literal test commands and process exit codes, runtime/OS/browser/device/AT version, fixture version, network allowed/blocked mode, seed and clock policy, observed request counts, exact expected and actual outcomes, recorded mock/provider kind. If 5 reruns are claimed, provide evidence of **five** reruns.
3. **Scope/safety:** dependency/license check, high-confidence credential scan, changed file audit, SSRF/authZ and path controls, fake-asset attestations, redacted logs; scans are heuristic, not guarantees.
4. **Defect ledger:** P0/P1/P2 with severity, reproduction link, result at exact SHA, mitigations, residual uncertainty and owner. Evidence must distinguish “observed PASS”, “not exercised”, “not supported” and “planned.”
5. **UI/physical devices:** for real device test (separately approved) include OS/app/browser versions, exact user-visible behavior, L1/L2/L3 separately and **sanitized** screenshots or short screen recording metadata. A generated URI or button click is not proof of app opening.
6. **Output artifact:** a QA report in PR comment/approved handoff with exact SHA, timestamp, test matrix statuses, blockers, privacy-safe links and clear `PASS / PARTIAL / FAIL` at **the defined stage**. QA must not mutate implementation while claiming independent review.

**Proposed report record:**
```json
{
  "workItem": "D007-FUTURE-SYNTHETIC-ONLY",
  "designAuthorization": "PENDING_SEPARATE_EXECUTION_INSTRUCTION",
  "prHeadSha": "REPLACE_WITH_VERIFIED_FULL_40_CHAR_SHA",
  "testedEnvironment": {"os": "SYNTHETIC", "browser": "NOT_RUN", "provider": "MOCK"},
  "fixtureId": "FIX-NOTE",
  "requirementIds": ["U6-L2-06", "A5-05", "A6-03"],
  "testCaseId": "E9-04",
  "stepsAndCommands": "MUST_BE_CAPTURED_DURING_ACTUAL_QA",
  "expected": "No Saved before authoritative persistence; draft retained on Unknown",
  "observed": "NOT_RUN",
  "exitCodes": [],
  "redactedEvidenceUris": [],
  "riskSeverity": "NOT_ASSESSED",
  "qaResult": "NOT_RUN",
  "designDisposition": "PENDING"
}
```
This is illustrative schema, **not an executed result or a real SHA**. Evidence should be uniquely tied to each tested commit; no re-use of passing artifacts after a rebase or changed head.

## 6. Risk taxonomy, blocked claims and independent ownership

| Class | Examples and disposition |
| --- | --- |
| **P0 — STOP** | Credential/PDF/private-note exposure; cross-user write/read; false Saved/Deleted; lost unconfirmed draft; silent stale overwrite; unauthorized source mutation; destructive restore; active-backup resurrection. STOP tests/rollout, quarantine sanitized evidence and escalate to Design |
| **P1 — BLOCK STAGE** | Reproducible critical user workflow failure, unverifiable operation identity, unguarded batch/cross-device conflict, essential accessible navigation blocked, TLS/ETag enforcement lacking for intended real service. Remediation and full independent re-QA required |
| **P2 — TRACK / REVIEW** | Truly noncritical UI polish, portability/documentation issues with contained risk. Design must **explicitly** decide whether acceptance can proceed; a P2 that threatens data integrity must be reclassified, not waived automatically |
| **Unverified provider capability** | State `UNSUPPORTED/NOT_RUN/BLOCKED`; never call verified when a mock-only test passed |

**Three-window authority:** Design sets/fixes scope and acceptance, Execution implements only in authorized isolated branch/paths, independent QA reviews *exact* head and reports reproducible evidence. Only Design may separately accept a stage and authorize merging, procurement, device test, cloud access or release. PR author or green CI cannot self-promote a gate.

## 7. Phase / release gate state machine (separate decisions required)

| Gate | Condition | Allowed next event / blocked action |
| --- | --- | --- |
| **G0 — Design frozen** | Approved requirements, data/security constraints and test/fixture plan, explicit task allowlist and no real data | Design docs alone do **not** start code |
| **G1 — Execution authorized** | User-approved bounded execution instruction: branch, base, paths, providers, credentials, fixtures, stop and QA handoff | Only work in this exact scope; no spontaneous cloud/feature/test expansion |
| **G2 — PR ready** | Accurate new exact head/parent, scope + secrets checks, repeatable commands, risk and provenance, original decision links | Execution STOP and handoff; never merge automatically |
| **G3 — Independent QA review** | QA checks same SHA/environment/synthetic-vs-provider split; reproduces positives/negative and verifies no P0/P1 | QA `PARTIAL/FAIL` → remediation; QA `PASS` at bounded stage **not** global acceptance |
| **G4 — Design accepted** | Design separately evaluates independent QA and signs exact scope/SHA disposition | No implicit merge; unverified POC storage/device L2-L3 cannot be waived |
| **G5 — Merge authorized** | Explicit merge authorization after latest `main` drift review; if rebase/head changes, scope/secret checks and fresh independent exact-SHA QA | Only then permitted to merge. A merged commit needs separately verified final head |
| **G6 — Live provider/device access** | Separately approved real-account/device authorization (Nutstore **ACCESS-02** for real WebDAV), secret route, test account, scope/budget/cleanup, and prior local independent QA | No real request, Zotero login, app launch or PDF until this distinct gate |
| **G7 — Release/deployment** | Supplier, domain, region/privacy and TCO revalidated; approved auth/session store and storage atomicity/backup; end-to-end/accessibility QA and incident/rollback; explicit production authorization | No production deployment or actual user data from any prior design approval |

**Current states:** D007-A9 = **DESIGN APPROVED ONLY**; Module 002 = **FROZEN DESIGN, 26 NOT RUN**; POC-001 = **LOCAL_STAGE PARTIAL / REMEDIATION**, overall **BLOCKED_REAL_SERVICE**, PR #2 unmerged; D007-A8 device matrix **NOT RUN**, no real account authority.

## 8. Deferred decisions and next design item

This framework is not a CI pipeline, test harness, implementation schedule, mandatory new QA scope for PR #2 or a deployment architecture change. The following remain deferred: fixture file format/location, toolchain and test runner, seed recording implementation, representative actual device models, real identity provider, stable session store, data-retention numeric policy, real Nutstore compatibility, release budget/domain, backend transaction/restore implementation.

**Next proposed independent design decision: D007-A10 — gated implementation work-package slicing and sequencing** (risk-first vertical slices, strict freeze boundaries and QA handoff plan, with *no* code-start authorization). User to choose approach before publication.

**DISPOSITION: D007-A9 OPTION B APPROVED — DESIGN DOCUMENTS ONLY. NO CODE, REAL ACCOUNT, TEST EXECUTION, UI CHANGE, POC SCOPE EXPANSION OR DEPLOYMENT.**
