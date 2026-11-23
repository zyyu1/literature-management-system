# D007-A10 — Risk-Gated Vertical-Slice Implementation Work Packages and Dependency Plan

**Decision:** **D007-A10 Option B APPROVED**, user approval 2026-11-23 (Europe/Berlin).  
**Classification:** **SEQUENCING DESIGN ONLY — NO NEW EXECUTION / MERGE / DEVICE TEST / CLOUD ACCESS / DEPLOYMENT AUTHORIZATION**.  
**Source of truth:** [D007-A1 logical separation](D007_A1_LOGICAL_DEPLOYMENT.md), [A3 conditional provider preference](D007_A3_CONDITIONAL_PROVIDER_PREFERENCE.md), [A4 auth/session](D007_A4_AUTH_SESSION_SECURITY.md), [A5 API and outcome semantics](D007_A5_API_CONTRACT.md), [A6 data/backup](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 lifecycle/privacy](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A8 Zotero/device](D007_A8_ZOTERO_INTEGRATION.md), [A9 cross-module QA and release gates](D007_A9_QA_FRAMEWORK.md) and [A9 synthetic fixtures/crosswalk](D007_A9_TRACEABILITY_FIXTURES.md).  
**Frozen UI authority:** [Module 002 DESIGN_APPROVED](../ui/002/DESIGN_APPROVED.md) and [its original 26 U6 scenarios](../ui/002/ACCEPTANCE_TRACEABILITY.md) are **unchanged / NOT RUN**. A10 does not create UI amendment or claim any UI implementation.
**Existing work authority:** [POC-001 local REMEDIATION-01](../handoffs/POC-001/REMEDIATION_01.md), original [EXECUTION_INSTRUCTION](../handoffs/POC-001/EXECUTION_INSTRUCTION.md), independent [QA comment 7088088675](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675), original reviewed PR head `65e14afc81e6de37ba5fac90c2937a27876c5614`. **LOCAL_STAGE PARTIAL, OVERALL BLOCKED / real service NOT RUN.** This work continues under its **existing branch, original base, exact path allowlist and no-rebase instruction**, without A10 changes.
**No POC-001-ACCESS-02:** [ACCESS_POLICY.md](../handoffs/POC-001/ACCESS_POLICY.md) is approved security design **only**; real Nutstore remains **BLOCKED** until user separately authorizes ACCESS-02 and its prerequisites. No real Zotero key, user note/PDF, browser device tests, deployment account, domain or paid service.

## 1. Decision: risk-first vertical slices, not full-front-end or all-backend big bang

Approve **planning order and dependency gates**; implement each end-to-end thin slice only after a **separate future execution approval**. A slice joins an authorized fake-data browser interaction, independently authenticated safe-API boundary, provider-neutral logical data contract, failure behavior and an independent exact-SHA QA handoff. Planning does **not** bundle in a backend technology or fully expose the web UI.

Rules:
- **Risk before breadth:** storage atomicity, revision guard, UNKNOWN write outcomes, authorization/session isolation and restore integrity are potential P0 blockers. No production persistence or false Saved UX while they remain unproven.
- **Two explicitly different tracks:** a later user-authorized **synthetic-only thin slice** can exercise contracts using mock adapters without proving real Nutstore, Zotero or native app links; any **real-data/provider** track needs separate permissions and provider/device-specific evidence. Synthetic `PASS_LOCAL` cannot satisfy a real provider gate.
- **Narrow handoffs:** every future work package has its own approved branch/base/full SHA, allowed paths, ownership, fixture set, targeted U6/A4–A8/E9/F9 cases, commands, risk/STOP criteria and independent QA reviewer. **The paths below are conceptual module boundaries, NOT executable file path allowlists.**
- **Never change frozen UI implicitly:** 67 approved UI-D decisions and 26 U6-L1..L4 scenarios remain canonical; if a slice needs changed user behavior, STOP and seek a separate user-approved `UI-AMEND`, then revise traceability independently.
- **No automatic promotion:** a completed package is not authorization for the next. Independent QA PASS at one stage is not Design acceptance, PR merge authority, real-service permission or release permission.

## 2. Dependency graph — planning topology (no jobs started)

```text
                     [WP-00 EXISTING POC LOCAL REMEDIATION]
                         | new exact PR SHA, independent re-QA
                         v
                   [GATE P0-LOCAL: Design acceptance]
                         |
                         +--> [Separate ACCESS-02 decision?] --NO AUTO-AUTH-->
                         |            |
                         |            v
                         |    [Bounded real Nutstore protocol proof]
                         |            |
                         |            v
                         |    [P0-STORE: storage go/no-go or D007 amendment]
                         |            |
 [A4–A9 FROZEN DESIGN] --+------------+------------------------------+
         |               |                                           |
         v               |                                           |
 [WP-01 Auth + safe API mock] -- [WP-02 Project/Paper fake read]     |
         |                                 |                           |
         |                                 v                           |
         +------------------------ [WP-03 Status/Important guarded] <--+
                                      |                                |
                                      v                                |
                             [WP-04 5-field Notes] <------------------+
                                      |                                |
                                      v                                |
                         [WP-05 Key Quotes/History] <------------------+
                                      |                     
                          [WP-06 Zotero API adapter]
                                      |
                         [WP-07 Device app/PDF handoff]
                                      |
                         [WP-08 Cross-module/accessibility QA]
                                      |
                         [WP-09 Hosting / release readiness]

 ALL future WP-01..WP-09 transitions require a new scoped Design
 authorization; each can STOP at MOCK-ONLY if real-provider proof
 is absent; no implicit execution, external access, merge or launch.
```

**Ordering interpretation:** the graph shows *evaluation priorities and logical prerequisites*, not an automatic linear project calendar or mandatory single branch. WP-01/02 can be **planned and, only with a separate future approval, tested in synthetic isolation while real storage is blocked**. Their mock success does not unlock persistent writes in WP-03/04/05. A real WebDAV denial may require an explicit **D007 storage amendment** and dependency re-baseline; it does not trigger an unapproved switch to PostgreSQL, Workers KV, Redis, SQLite or other new backend.

## 3. Work-package contract table: input → output → QA → STOP

Every row is **NOT AUTHORIZED FOR NEW EXECUTION** except WP-00's **already authorized local remediation**. Proposed output is an *expected future artifact*, not something already created. “QA exit” is a future gate, not a PASS.

| Work package / current authority | Preconditions and key inputs | Deliverables **after separately approved execution** | Independent QA proof and STOP condition |
| --- | --- | --- | --- |
| **WP-00 — Existing POC-001 local repair**: **EXECUTION ALREADY AUTHORIZED, strictly unchanged** | Original branch `exec/POC-001-webdav-feasibility`, base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, existing allowed paths, PR #2 and QA comment; `REMEDIATION_01` fixes P1-1..4 and P2 items | Corrected local synthetic code/evidence in **same PR**, a new **full** exact HEAD SHA, updated sanitized QA handoff; no rebase or merge | Fresh independent full POC-01..07 and targeted QA re-probes at **new exact SHA**, classify LOCAL PASS/PARTIAL/FAIL; **STOP before merge or real requests**. Existing QA is LOCAL PARTIAL and never overwritten |
| **WP-00A — ACCESS-02 / real storage protocol POC**: **NOT AUTHORIZED** | Design accepts local QA separately; [ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md) prerequisites, isolated disposable second Nutstore account, verified actual TLS/host/path/redirect safety and explicit **new user ACCESS-02 approval** | Only later approved bounded real ETag/If-Match/concurrency/late-ack/backup and cleanup evidence; no website app | Independent exact-SHA QA of real provider and limit compliance. **STOP** on 401/429, unsafe auth, stale overwrite, false Saved or unsupported CAS. If failure: separate storage architecture decision |
| **WP-01 — Auth/session + safe API mock vertical core**: **NOT AUTHORIZED** | A1 split, A4 Cookie/CSRF/CORS/session/authZ contract; A5 outcome/operation identity; A9 fake principals; session store/identity mechanism still undecided | When approved: fake-user login/session/revoke and origin-safe mock API, cross-scope protection and synthetic authoritative outcome responses; no actual provider credential | A4-01..08; A5-01/04/05/10; E9-10/11, F9-10; **STOP** on IDOR, session leak, unavailable revocation, false confirmed write. No real identity vendor chosen automatically |
| **WP-02 — Projects/Literature + canonical paper thin read slice**: **NOT AUTHORIZED** | WP-01 synthetic auth boundary **approved after independent QA**; frozen Projects Home/List/Detail; A6 canonical multi-library ID; synthetic Zotero item fixtures | When approved: one Project and one paper read/navigation path, 3 fake Projects × 1 paper ID de-duped, scoped Associations displayed, archived Project behavior preview; fake metadata only | U6-L1-01..03, U6-L2-01/02, U6-L4-01; A6-01/02; E9-01/02/03; **STOP** on cross-scope leak or duplicated global paper. No real Collection import |
| **WP-03 — Guarded Project/status/Important writes**: **NOT AUTHORIZED** | WP-01/02 synthetic QA accepted; A5 per-resource CAS/Unknown and A6 association vs global invariants; **real persistence path additionally requires P0-STORE GO** | When approved: narrowly scoped synthetic Project lifecycle, Current/All unlink, per-Project Important, global 3-state Reading Status with confirm/conflict/unknown truthfulness and error feedback | U6-L2-03..05, U6-L3-02..04, U6-L4-01; A5-02/06/08, A7-01..04, E9-01/02/06, F9-06/08; **STOP** on false Deleted/Saved, unsafe scope or stale overwrite |
| **WP-04 — Five-field Research Notes, unsynced drafts and export**: **NOT AUTHORIZED** | WP-01/02 security+identity; WP-03 versioned writes QA accepted or a separately approved minimal aggregate write gate; D007-A5 whole-note CAS, A6 lossless 5-field schema, A7 frozen discard; real provider requires P0-STORE GO | When approved: edit/preview, guarded Save Now/autosave, status-aware local draft/recovery, explicit Typora-compatible Saved vs Local Draft export; only supported storage capabilities | U6-L2-06, U6-L3-01/05, U6-L4-02/04; A5-02..05/07, A6-03/04, A7-05..07, E9-04/07; **STOP** on lost edits, false Saved, or unguarded 2-client merge |
| **WP-05 — Key Quotes, source provenance and manual Relink**: **NOT AUTHORIZED** | WP-04 stabilized quote/session/version and canonical paper contracts; A6 source identity and **confirmed source+history atomicity**; provider ability separately proved or feature held mock-only; A8 picker spec | When approved: fake quote excerpt/comment creation, unmodified source history, explicit fake annotation picker/Relink with guarded atomic logical transition, no real Zotero annotation write | U6-L2-07, U6-L3-06, U6-L4-02; A5-07, A6-05, A8-09..12, E9-05, F9-07; **STOP** if two-object history transaction unproven or annotation/quote edited unexpectedly |
| **WP-06 — Read-only Zotero Web API integration adapter**: **NOT AUTHORIZED** | WP-01 credential boundary and WP-02 canonical IDs; A8 read-only user/group/attachment/annotation mapping, pagination, Backoff, file-sync separation; user-approved **separate Zotero credential/test scope** before any live API call | When approved: synthetic API adapter fixture tests first, then only later authorized isolated real Zotero library tests; no PDF ingestion, no original annotation mutation | U6-L2-02/07; A8-01..12/16, E9-03/05/10, F9-11; **STOP** on secret in browser/log, unsafe next URL, uncontrolled 429 retries, library privilege leak or PDF copy |
| **WP-07 — Native device Zotero handoff and fallback**: **NOT AUTHORIZED** | WP-06 proven attachment mapping or separately approved fake URI-only data; D007-A8 L1/L2/L3 separated and app-file-sync setup; **separate consent for physical device tests** | When approved: per-OS/browser explicit Open in Zotero actions with user-selectable fallback; later real tests record exact installed app and stored vs linked PDF behavior | U6-L3-07, U6-L4-03; A8-13..16 / M1..M8, E9-09, F9-12; **STOP** on wrong PDF/annotation or false Android one-tap promise; URI constructed ≠ app opened |
| **WP-08 — Cross-module, accessibility and recovery release-candidate QA**: **NOT AUTHORIZED** | All intended feature slices have independent accepted synthetic/provider QA for supported scope, A9 fixture/traceability plan, UI freeze preserved | When approved: separate release-candidate PR/test SHA, executable synthetic E9/F9 runs, 26 frozen U6 tests, complete 60 A4–A8 tests **as applicable**, independent device coverage, defect ledger, rollback evidence; no automatic supplier purchase | QA reports exact SHA/OS/browser/device, fixture and sanitized logs; P0/P1 closed or explicit STOP, P2 reviewed by Design; **no claim 26/60 already PASS** |
| **WP-09 — Deployability and operations release gate**: **NOT AUTHORIZED** | WP-08 independent QA+Design acceptance; D007-A3 provider choice separately finalized, A4 actual session store/identity provider, A6 trusted backup/restore, A7 retention/legal requirements, EU region/TCO/secret plans, D007-A9 G6/G7 | When approved: selected vendor account+region/domain/secret/observability configuration, security/incident/backup/rollback proof and deployment *only if separately authorized* | Provider/cloud/security QA plus Design final decision/merge/release gate; **STOP** on unproven data residency, real Nutstore atomicity, unsafe auth, unrecoverable backups or unpaid/unapproved billing |

**Critical distinction:** the *thin slice description is NOT an execution instruction*. It does not authorize editing UI or backend files, create even free cloud resources, import libraries, run device tests or perform real network calls. No timetable, milestone date or budget is approved here.

## 4. Formal work-package state model and authorization checklist

**Statuses are separate fields, not one ambiguous “Done”:**

| Field | Allowed states | Meaning |
| --- | --- | --- |
| `designStatus` | `PROPOSED / APPROVED / NEEDS_AMENDMENT` | A10 approves **sequence architecture** only; future package-specific requirements/design may remain pending |
| `executionStatus` | `NOT_AUTHORIZED / AUTHORIZED_LOCAL_SYNTHETIC / AUTHORIZED_BOUNDED_REAL / RUNNING / STOPPED` | Only explicit scoped Design/user permission can advance a package beyond NOT_AUTHORIZED |
| `qaStatus` | `NOT_RUN / PARTIAL / FAIL / PASS_LOCAL / PASS_BOUNDED_PROVIDER` | Independent reviewer at actual exact PR head; PASS_LOCAL **not** PASS_PROVIDER |
| `mergeStatus` | `NOT_AUTHORIZED / APPROVED_FOR_EXACT_SHA / MERGED_VERIFIED` | A10 selects no merge; rebases invalidate prior QA until re-QA |
| `releaseStatus` | `NOT_AUTHORIZED / DEPLOYMENT_TEST_APPROVED / PRODUCTION_APPROVED` | No deployment, real user access or cloud procurement follows automatically |

**Any future execution request must specify ALL:** package ID and objective; exact approved baseline SHA/parent; owned branch and path allowlist; whether fake-only, disposable test-account or personal-data access (default **none**); fixed fixture IDs/version, external host/network allowlist, explicit secret path, request budgets and STOP; expected files/output; dependencies and specific P0/P1 coverage; exact reproducible test commands and independent QA handoff. If multiple PRs are dependent, explicitly name commit relationships and QA subject; do not quietly rebase POC branch on newest main.

**Execution STOP/QA:** After work, Execution uploads PR and records full 40-character head SHA, real command exits, scope/secret scan, fake-data provenance, dependency/licensing delta, known open risks; **STOP**. Independent QA reproduces at exact SHA, returns PASS/PARTIAL/FAIL and P0/P1/P2. Design must **separately** disposition acceptance, merge and any next package. A green CI, SHA from the wrong branch, altered head or documentation-only pass is insufficient.

**Base drift:** new `main` design commits do not automatically change the authorized original base, scope or tests of a running branch. At actual merge approval, compare the then-current main, check merge-tree conflict, rerun scope/secret audits and independent QA if rebase/merge changes tested head. No premature rebase of PR #2.

## 5. Hard gates that cannot be silently “passed” by sequencing

| Gate / dependency | Hard STOP and route to Design |
| --- | --- |
| **P0-LOCAL** existing POC | P1-1 late commit misclassification, P1-2 duplicate Operation-Id, P1-3 malformed ETag and P1-4 HTTPS/HTTP credential hazard must be corrected and **independently re-QA'd**; original QA LOCAL PARTIAL. Local success alone does not authorize real account or merge |
| **ACCESS-02** / provider data | Prior local stage accepted by Design; **separate** user approval, disposable account+app password handling, verified TLS/no redirects, safe namespace and 100 requests rolling 30 min, max 20 files×1 MiB, per-file cleanup and redacted audit; otherwise NO real Nutstore |
| **P0-STORE** storage validity | Real provider `If-Match` or equivalent atomic guard, unknown-ack behavior, cross-process writers and restore/backup safety *proved* or return for D007 storage amendment; **never** claim two-object transactions from WebDAV or change storage automatically |
| **AUTH** | API-only secrets, opaque Cookie session/revocation across instances, CSRF/CORS+Origin, per-resource authZ, private Zotero library segregation; if provider/session store is unselected or unsafe, block live accounts |
| **CONSISTENCY** | No `Saved`/`Deleted` until authoritative confirmation; unknown remains unknown; Note five-field aggregate and Quote source-history atomicity not assumed; no blind replay |
| **ZOTERO** | Only later user-approved minimum read scopes/isolated synthetic library; no original PDF/annotation mutation, no PDF hosted on website, no cross-user leakage, bounded 429 and pagination |
| **DEVICE** | Real physical-device/browser/app proof for L1 app handoff, L2 correct PDF, L3 source focus independently; iOS statement or Android forum report cannot replace device QA |
| **QA/RELEASE** | No pass claims for frozen U6 26 or A4–A8 60 until independent exact SHA evidence; P0/P1 block advancement; Cloudflare Pages+Render Frankfurt is **conditional favorite only**, never already purchased, production-ready or region-compliance certified |

**Outcome if storage POC fails:** stop real-persistence paths; preserve possible future synthetic read-only/demo work **only under separate approval**; decide a revised storage backend/transaction envelope first. Do not delete old user data, promise migration, or substitute an unapproved database. This is a decision boundary, not permission to proceed with partial production data handling.

## 6. Existing status ledger and planned responsibilities

| Work item | Design | Execution | Independent QA | Merge / real service |
| --- | --- | --- | --- | --- |
| **POC-001 local remediation (existing)** | **APPROVED narrow existing remediation** | **ALREADY AUTHORIZED in old scope**; new handoff pending | Old head `65e14af...`: **LOCAL_STAGE PARTIAL**; re-QA of corrected head pending | PR #2 unmerged; ACCESS-02 BLOCKED |
| **WP-00A ACCESS-02 real provider** | Security preflight design only | **NOT AUTHORIZED** | NOT RUN (provider) | NO live account, NO merge |
| **WP-01..WP-09** | **A10 planning/sequencing APPROVED** | **ALL NOT AUTHORIZED** | **NOT RUN** for those future package implementations | NO merges, accounts, procurement, deployment |
| **Module 002 full UI** | 67 decisions FROZEN and 26 U6 scenarios documented | **NOT AUTHORIZED** | **26 NOT RUN** | No full UI merge/deployment |
| **D007-A4..A8 plans** | Design contracts APPROVED | Not executable instructions | **60 test designs NOT RUN** | No implicit system-wide acceptance |

Future Execution and independent QA are separate roles/windows; a QA Window must not silently implement fixes while certifying its own changes. All three-window handoffs must preserve exact artifacts and never infer proof from this schedule.

## 7. Exit / defer decisions and next independent design item

- **A10 is a project sequencing document**, not a sprint kickoff, personnel assignment, delivery timeline, capacity estimate or cloud infrastructure action. Individual package scope, implementation branch/path allowlist, identity provider, real storage, provider billing and device availability remain undecided.
- **Next proposed independent decision:** **D007-A11 — provider-neutral observability, incident response and safe operations runbook design** (privacy-redacted diagnostics, failure severity/alerts, credential leak response, backup/restore drills, rollback/STOP criteria and operator checklists). This may be designed now without waiting for POC-001, selecting a vendor, opening accounts, implementing services or using actual user data.
- If POC-001 re-QA evidence arrives while A11 is being considered, handle it as a **separate exact-SHA QA/Design disposition**; do not auto-pass POC or alter A10 planning.

**FINAL DISPOSITION: D007-A10 Option B APPROVED AS DESIGN ONLY. Existing POC-001 local remediation authority unchanged. WP-00A and WP-01..09 execution NOT AUTHORIZED. NO NEW CODE, CLOUD, DEVICE TEST, REAL ZOTERO/NUTSTORE, MERGE OR DEPLOYMENT.**
