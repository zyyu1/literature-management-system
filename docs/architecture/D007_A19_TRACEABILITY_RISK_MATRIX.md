# D007-A19 — Requirements → Architecture → UI/API/Data → QA → Work Package / STOP Matrix

**Audit classification:** **D007-A19 Option B**, documentation-only crosswalk, **NOT an independent runtime QA report**.  
**Fixed `main` evidence baseline:** `07eb46ae21b18878b9fe371c8a444df41004b9ec` (2026-11-23); [main audit verdict](D007_A19_ARCHITECTURE_READINESS_AUDIT.md). All cited architecture source paths refer to documents read at that baseline, not any live service. **All Test IDs below are design-only NOT RUN unless POC independent QA evidence and exact SHA are explicitly named.**
**Current separate PR observation:** [PR #2 execution update 7088920931](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088920931) at `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3`, **independent re-QA still PENDING**. Last independently verified QA [7088521226](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088521226) at `2806d9d08dcec78e974703a82a38a696ae76d132`, **LOCAL_STAGE PARTIAL**.

## 1. Explicit evidence vocabulary

| Evidence label | Precise meaning |
| --- | --- |
| `REQ_APPROVED` | Product scope D001–D007 has been approved, but technical goals may remain conditional |
| `DESIGN_APPROVED` | An architecture/UI *document* is approved; no code/API/secret/physical provider state is implied |
| `FREEZE_UI` | 67 Module 002 UI decisions locked to pinned original source, **26 frozen U6 test designs all NOT RUN** |
| `DESIGN_TEST_NOT_RUN` | Test template or synthetic fixture specified, **zero observed passes** |
| `EXECUTION_SELF_REPORTED` | Execution Window ran tests/reported results at exact POC candidate SHA; **not independent QA** |
| `INDEPENDENT_QA_PARTIAL` | Independent reviewer reproduced bounded mock evidence at **old `2806d9d`** and found unresolved P1/P2 |
| `QA_PENDING_NEW_SHA` | New POC head `74d00f2` submitted with no subsequent independently accepted QA |
| `PROVIDER_NOT_PROVEN` | Real Nutstore, live Zotero library/physical apps/hosting, backup atomicity and browser sessions have **not been authorized or measured** |
| `EXEC_NOT_AUTHORIZED` | All future work packages WP-00A/WP-01..09 lack user-scoped authorization; **only existing WP-00 local REMEDIATION-02 is authorized** |
| `RISK_BLOCK` | A future release/implementation must fail closed if named proof unavailable; this is **not** an observed production bug |

No `PASS` evidence is inferred from a document, model price, static code review, generated URI, hypothetical SLO, SBOM, signature or approved work-package name.

## 2. Product decisions D001–D007 full trace to data/API/UI, QA and gates

| Requirement ID / approved user intent | Architecture / data/API owner | Frozen UI / planned acceptance | WP / evidence gate at audit |
| --- | --- | --- | --- |
| **D001** cross-Project canonical paper, ONE global Note and status | [A5 API](D007_A5_API_CONTRACT.md) [A6 schema](D007_A6_DATA_SCHEMA_RECOVERY.md), unique library-qualified Paper identity, Project×Paper Association + per-Project Important | UI-D004.3-R1b, UI-D005.1; **U6-L4-01, U6-L4-02**, A5/A6 planned cases | WP-02/03/04; fake only after separate approval; real P0-STORE remains `RISK_BLOCK` |
| **D002** manual Zotero selection / ONE-TIME Collection import (not persistent sync) | [A8 Zotero](D007_A8_ZOTERO_INTEGRATION.md) read-only API, [A6](D007_A6_DATA_SCHEMA_RECOVERY.md) canonical de-dupe, [A5](D007_A5_API_CONTRACT.md) controlled association writes | UI-D004.1; **U6-L2-02**, A8-01..A8-08 | WP-02/06 fake mocks; separately approved live Zotero integration; **NO continual collection mirroring** |
| **D003** three global ReadingStatus values only | A5/A6 global revisioned state | UI-D004, **U6-L2-03, U6-L4-01** | WP-03 guarded mock write; real provider CAS gate |
| **D004** Zotero bibliographic fields + five user-written research-note fields and Key Quotes | A6 five UTF-8 Markdown fields; A5 whole-Note revision and quote-source-history atomic intent; [A7 lifecycle](D007_A7_DATA_LIFECYCLE_PRIVACY.md) | UI-D005.1/.2; **U6-L2-06, U6-L2-07, U6-L3-05, U6-L3-06**, A5/A6/A7 cases | WP-04/05; save, source history and restore unverified until storage proof |
| **D004-A** annotation/highlight references and precise source jump where supported | A8 library+paper+attachment+annotation identities and per-platform L1/L2/L3; no original annotation mutation | UI-D005.2b, **U6-L3-06, U6-L3-07, U6-L4-03**, A8-09..A8-16/M1..M8 | WP-05/06/07; **PROVIDER_NOT_PROVEN**; precise jump conditional |
| **D005** internet-responsive site, current device's Zotero app/PDF | [A1 deployment](D007_A1_LOGICAL_DEPLOYMENT.md), [A8](D007_A8_ZOTERO_INTEGRATION.md), [A12 QoS](D007_A12_QOS_CAPACITY_BUDGET.md), [A14 origin/Cookie](D007_A14_ORIGIN_COOKIE_TOPOLOGY.md) | UI-D001/D004/D005; **U6-L1-01..05, U6-L3-07/08, U6-L4-03/05** | WP-07/08/09; actual desktop/iOS/iPadOS/Android/browser evidence **NOT RUN** |
| **D005-S** Zotero metadata sync + **existing** Nutstore WebDAV attachment sync; no website PDF copy | A8 stored-vs-linked mapping and read-only metadata; A17 encryption scope excludes PDFs | UI-D005.2; **U6-L4-03**, A8-M1..M8 | WP-06/07; **second** Nutstore candidate is not the existing PDF account |
| **D006** Personal Workspace independent authenticated **read-only** integration + deep links | [A4 auth](D007_A4_AUTH_SESSION_SECURITY.md), A5 read-only projection, [A15 identity](D007_A15_OWNER_IDENTITY_RECOVERY.md), [A16 risk](D007_A16_SENSITIVE_ACTION_AUTHORIZATION.md) | UI-D006 versus **product D006** explicitly distinct; **U6-L4-06**, A4/A5 cases | WP-01/08, synthetic role/projection required; no write, credential or owner permissions from Workspace |
| **D007** safe API, second Nutstore **candidate** JSON/Markdown store, MVP no PostgreSQL unless new choice | A1–A3, A5/A6/A7, A9/A10, A11–A18; A17 crypto and backup not equal transaction safety | UX truthful Unknown, no wrong deletion; **U6-L3-01/05, U6-L4-04/05**, A5/A6/A7/A9 cases | **WP-00 local QA PENDING → separate WP-00A ACCESS-02 → P0-STORE GO/NO-GO**; real storage backend selection conditional, no automatic DB switch |

**Requirement nuance:** D004 five-note-field user-authored text is global per canonical paper; Key Quotes can be multiple and preserve user excerpt/comment and SourceHistory. D007's “no PostgreSQL in MVP” is an **approved conditional direction**, not evidence that an unproven WebDAV provider must be used despite integrity failures. D005's native Zotero App opening is a **goal**, not OS-wide verified behavior.

## 3. D007-A1–A18 architecture conformance and test / gate ledger

| Decision | Architectural responsibility and dependency contract | Existing proposed test evidence | Execution/QA gate and unresolved proof |
| --- | --- | --- | --- |
| **A1** | Static web + independently deployable safe API; isolated secrets, replaceable storage adapter | Conceptual acceptance questions only | No backend/frontend code; WP-01/02 separately approved |
| **A2** | Three provider cost/risk cases and S1/S2/S3 assumed traffic | Mathematical model only | Cost cannot prove region, capacity or provider selection; WP-09 |
| **A3** | Conditional Render Frankfurt then Workers then Hetzner evaluation | Six future supplier-selection hard gates | Final vendor/domain/paid plan/region unselected; WP-09 |
| **A4** | Opaque HttpOnly Session, owner/project authZ, CSRF/Origin, read-only Workspace | **8 proposed A4 cases NOT RUN** | WP-01; identity/Session persistence and browser QA missing |
| **A5** | Versioned API, per-write OperationId/CAS, truthfully separate CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN | **10 proposed A5 cases NOT RUN** | WP-01/03/04/05; cross-process atomicity/ledger P0-STORE |
| **A6** | Stable canonical ID, Project association, single global status/Note, quote+history, manifest/restore | **12 proposed A6 cases NOT RUN** | WP-02/03/04/05, WP-08; multi-object snapshot and referential CAS unknown |
| **A7** | Archive/unlink/delete/draft/retention, conditional tombstone and anti-resurrection | **14 proposed A7 cases NOT RUN** | WP-03/04/08; deletion marker/retention/backup consistency unproven |
| **A8** | Zotero scoped read-only metadata, annotation/attachment mapping, app deep-link fallback | **16 A8 cases + M1..M8 device matrix NOT RUN** | WP-06/07; real account and physical L1/L2/L3 separately authorized |
| **A9** | Cross-module traceability/fixtures and exact-SHA independent QA; G0–G7 | **26 frozen U6 and 60 A4..A8 cases NOT RUN; E9-01..12 / F9-01..12 also NOT RUN** | WP-08, distinct merge/provider/release decisions |
| **A10** | Risk-first WP-00/00A/01..09 dependency graph and synthetic vs provider gates | Execution table **not** a test or runtime acceptance | WP-00 alone has original local remediation; WP-00A/01..09 NOT AUTHORIZED |
| **A11** | Redacted ops signals, P0/P1/P2 incidents, credentials, backup drills and STOP | **16 proposed A11 cases NOT RUN** | WP-08/09 future operations proof; no numeric alerts/retention |
| **A12** | S1/S2/S3 QoS/client/CPU/concurrency/egress and RPO/RTO target-selection method | **16 proposed A12 cases NOT RUN** | No p95, request-cap or RPO/RTO measured; WP-08/09 |
| **A13** | Local/Independent QA/future Staging/Prod environment, secrets and immutable artifact promotion | **16 proposed A13 cases NOT RUN** | WP-01 onward + WP-09; no actual environment or promotion |
| **A14** | HTTPS same-site sibling origins, API-host-only Cookie and independently qualified same-origin fallback | **16 A14 cases + B14-M1..M8 browser groups NOT RUN** | WP-01,07,08/09; browser/Safari, host/proxy/CSRF facts untested |
| **A15** | One Owner private atomic bootstrap, MFA/passkey alternatives, recovery and device revoke | **18 proposed A15 cases NOT RUN** | WP-01/09; actual identity/recovery store unselected |
| **A16** | Risk R0–R4, one-use exact action intent and fresh step-up for destructive/identity operations | **20 proposed A16 cases NOT RUN** | WP-03/08; **R2 UI-AMEND interlock** not resolved |
| **A17** | Purpose-separated Auth/Session/CSRF/Intent/DATA and BACKUP key hierarchies, AEAD, key-loss/anti-resurrection | **22 proposed A17 cases NOT RUN** | WP-04/05/08/09; KMS, real crypto, snapshot/witness/backup restore unproven |
| **A18** | 3 OSS GitHub candidate reviews, lockfile/SCM, SBOM, CI min rights, reproducible artifact/SLSA candidate | **24 proposed A18 cases NOT RUN** | Every new WP + WP-09; no scans, CI, SBOM, signature or real build |

**Count proof:** A4 8 + A5 10 + A6 12 + A7 14 + A8 16 = **60 distinct A4–A8 planned tests NOT RUN**. Separately A11 16 + A12 16 + A13 16 + A14 16 + A15 18 + A16 20 + A17 22 + A18 24 = **148 later proposed design tests NOT RUN**. **A9 E9/F9 = 12+12** distinct proposed cross-module/fault plans, and original U6 = **26** frozen UI cases; **do not add these counts to claim executed coverage**. A10 is a dependency plan, not a new test catalog. A1..A3 are architectural evaluations, not tested code.

## 4. Frozen Module 002: scenario-level forward trace (26/26, all NOT RUN)

These **original U6 IDs and text scopes remain unchanged**. This A19 table is only an auxiliary forward trace, not an amended acceptance suite. Group and action labels come from [frozen traceability](../ui/002/ACCEPTANCE_TRACEABILITY.md).

| Frozen U6 ID | Product/user task mapped to architecture | Planned work-package / blocker |
| --- | --- | --- |
| **U6-L1-01** | D001/D005 Project Home card/list/search/count/focus; A6/A12 | WP-02/08; synthetic only |
| **U6-L1-02** | D001/D003/D005 Literature table/cards/tabs/filter/count; A6/A12 | WP-02/08; no live dataset |
| **U6-L1-03** | D004/D005 Detail, two/one columns, long metadata, Notes/Quotes; A6/A8 | WP-02/04/05/08; mocks only |
| **U6-L1-04** | D005 mobile More, batch sheets/modal, safe area/keyboard; A12/A14 | WP-08; browser NOT RUN |
| **U6-L1-05** | D005 keyboard/VoiceOver/TalkBack/focus and large text; A9/A12 | WP-08; AT/physical NOT RUN |
| **U6-L2-01** | D001 Project create/edit/archive/restore/delete; A5/A7/A16 | WP-03/08; R2 fresh-step-up UI interlock |
| **U6-L2-02** | D002 manual and one-off Collection import/de-dupe; A6/A8 | WP-02/06/08; Zotero real access blocked |
| **U6-L2-03** | D003 three global statuses/search/filter/sort; A5/A6 | WP-03/08; real CAS absent |
| **U6-L2-04** | D001 per-Project Important/tabs/counts; A6/A7 | WP-03/08; per-Project write guard |
| **U6-L2-05** | D001 Current vs All Projects scoped batch/hidden selected/counts; A5/A7/A16 | WP-03/08; R2 Step-up UI interlock and real atomicity unproved |
| **U6-L2-06** | D004 five Markdown fields/preview/autosave/Save Now/export; A5/A6/A7 | WP-04/08; draft/UNKNOWN and CAS |
| **U6-L2-07** | D004-A Key Quote highlight picker/SourceHistory/Relink; A6/A8 | WP-05/06/08; quote+history atomicity unproven |
| **U6-L3-01** | D004 lost/delayed write acknowledgment; A5/A11 | WP-04/08; no false Saved |
| **U6-L3-02** | D001 Cancel/Escape Project Delete/Unlink/batch zero-write; A7/A16 | WP-03/08; no silent R2 bypass |
| **U6-L3-03** | D001 phone overlapping batch/outcomes/filter state; A5/A9 | WP-03/08; no cross-scope mutation |
| **U6-L3-04** | D001 Important Saving/Failed/Unknown in Select; A5/A7 | WP-03/08; status truth |
| **U6-L3-05** | D004 offline draft/remote conflict/merge/revision; A5/A6/A7 | WP-04/08; two-client CAS/UNKNOWN |
| **U6-L3-06** | D004-A Relink failed/unknown/stale history and old source; A5/A6/A8 | WP-05/08; source-history atomicity |
| **U6-L3-07** | D005 Zotero error classification/source-open fallback; A8/A14 | WP-07/08; device L1/L2/L3 absent |
| **U6-L3-08** | D005 touch/IME/accessibility selection/modal focus; A9/A12 | WP-08; browser/AT not tested |
| **U6-L4-01** | D001/D003 global note/status vs local Important/association in 2 Projects; A6 | WP-02/03/08; shared resource correctness |
| **U6-L4-02** | D004 concurrent Note/Relink writes on 2 devices; A5/A6 | WP-04/05/08; real multi-object CAS unknown |
| **U6-L4-03** | D004-A/D005 desktop/iOS/iPadOS/Android Stored vs Linked Zotero app launch; A8 | WP-07/08; real devices not authorized |
| **U6-L4-04** | D004 cross-device reload/draft/UNKNOWN recovery or safe unavailability; A5/A7 | WP-04/08; no durable ledger claim |
| **U6-L4-05** | D006 + D005 authenticated private resource and origin/cookie isolation; A4/A13/A14/A15 | WP-01/08; no real Session |
| **U6-L4-06** | D006 read-only Personal Workspace projection/deep links; A4/A5/A16 | WP-01/08; read-only API mocked only |

## 5. Current operational gates: sources, authority, evidence needed

| Gate/action | Source of authority | Exact current state / required evidence |
| --- | --- | --- |
| `POC-LOCAL` / **WP-00** | Original [scope](../handoffs/POC-001/EXECUTION_INSTRUCTION.md), [REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md), PR #2 comments | Existing local-only correction authorized. New `74d00f2` **Execution self-report 75/75×5 / 23/23**, **QA_PENDING_NEW_SHA**, not PASS. Original `2806d9d` independent LOCAL_STAGE PARTIAL. |
| `POC-ACCESS-02` / **WP-00A** | [ACCESS-01 design policy](../handoffs/POC-001/ACCESS_POLICY.md), *separate future user approval required* | **BLOCKED**. No requests to Nutstore, no credentials. Budget 100 requests/30m, 20 disposable files, 1 MiB/file is conditional **test-only** ceiling |
| `P0-STORE` | A5/A6/A7, A10 WP-03..05 and POC QA | **UNVERIFIED** strong CAS, cross-process protection, durable operation/anti-resurrection ledger, multi-object restore and consistent backup; if real provider fails, must return to separate D007 design |
| `UI-AMEND` | Frozen Module 002 UI-D002/UI-D004.3b-R1 + A16 | **NOT AUTHORIZED**. Required only if R2 fresh Step-up has no compliant approved interaction; cannot alter freeze by A19 |
| `WP-01..WP-09` | A10 per-package **new user/Design permission**, A11–A18 additions | **NOT AUTHORIZED**. WP-01 may be ready to request *mock-only* authorization after updated gates; no runtime or cloud |
| `INDEPENDENT QA` | A9 exact SHA and work-package requirements | **ONLY old POC mock independent evidence PARTIAL**; zero executed UI 26/A4..A8 60/A9 E9/F9/A11..A18 proposals |
| `MERGE / STAGING / RELEASE` | A9 G4/G5/G7 + A13/A18 provenance and separate user authority | **BLOCKED**, even if PR marked mergeable or candidate CI green; region/domain/identity/KMS/backup evidence absent |

**Clarifications required before subsequent execution authorization (not authorized by this document):**
1. Incorporate A11–A18 verification/secret/identity/crypto/release obligations into each A10 WP row and distinguish *synthetic-capable* from *real-provider-blocked* outputs.
2. Reconcile WP-06 arrows in A10 graph (appears after WP-05) with textual WP-06 preconditions (WP-01/02 only), without changing approved product scope.
3. Resolve A16 R2 Step-up versus frozen second confirmations through a **separately approved** UI amendment where interaction is actually needed; do not weaken the backend requirement or invent a new dialog.
4. Get **independent fresh QA at `74d00f2`** then a Design disposition before even considering the separate ACCESS-02 proposal.
5. Define an independent P0-STORE go/no-go and a conditional alternate storage decision path; do not infer production durability from POC mock-only results.

## 6. Source evidence inventory (unchanged reference files)

| Source at fixed main baseline | Git blob SHA at `07eb46ae` |
| --- | --- |
| [A9 QA framework](D007_A9_QA_FRAMEWORK.md) | `d56d81fe00918d91ffcae2550258fdae91e2e79e` |
| [A9 fixtures/traceability](D007_A9_TRACEABILITY_FIXTURES.md) | `ffd1b7e836e94d2e7d4923e75c393c128fb04484` |
| [A10 dependency/work packages](D007_A10_IMPLEMENTATION_WORKPACKAGES.md) | `19bbf77d5399a4909fe76031da5b22fba615a912` |
| [A13 isolation](D007_A13_ENVIRONMENT_ISOLATION.md) | `3a10b3609b842755041a620e3a44ea005486bd3f` |
| [A17 encryption](D007_A17_KEY_HIERARCHY_BACKUP_ENCRYPTION.md) | `9a9cc86955e0d327e059a2488b0822f49a73454c` |
| [A18 supply chain](D007_A18_SOFTWARE_SUPPLY_CHAIN.md) | `646486fa4137db91230314552550f24399577626` |
| [Frozen UI](../ui/002/DESIGN_APPROVED.md) / [26 cases](../ui/002/ACCEPTANCE_TRACEABILITY.md) | `b826a16136944fdafe154d9625a7c88ab8538469` / `dc87a3e87fd2c80ebabf951186d41e34e6ac0a32` |
| [POC REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md) / [POC STATUS](../handoffs/POC-001/STATUS.md) | `ebe0c4cf89617629cf8ca6c3a44322f424d9767c` / `b5780c11c10e834781be68031665494f0bd5619c` |
| [Original POC execution](../handoffs/POC-001/EXECUTION_INSTRUCTION.md) / [ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md) | `afdfbc789a18ad390e6a73b19a28e4c6b977e32b` / `cd9c0c0c8a1d7656c2fd512ebe27aaff40267927` |

**Audit provenance limitation:** Relative hyperlinks follow the docs path, but the **pinned SHA above** (not whichever later `main` version loads from a relative link) defines the evidence reviewed. This is a design/document inspection and GitHub PR metadata check; it does not execute external provider operations.

**FINAL:** **D007-A19 OPTION B AUDIT ONLY. DESIGN CONTRACTS LARGELY ALIGNED WITH EXPLICIT BLOCKERS; NO AUTOMATIC FREEZE, CODE AUTHORIZATION, POC REBASE/MERGE, LIVE ACCESS, OR RELEASE.** For findings/gate priorities and proposed D007-A20, see the [main audit](D007_A19_ARCHITECTURE_READINESS_AUDIT.md).
