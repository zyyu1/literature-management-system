# D007-A10 — A20 Planning-Only Gate Addendum for A11–A18

**Decision:** **D007-A20 Option B APPROVED, 2026-11-23** — reconciliation **without modifying** the original [A10 work-package plan](D007_A10_IMPLEMENTATION_WORKPACKAGES.md). This is a planning overlay, **not an A10 execution instruction**.
**Input:** pinned `main` `74879eb8058f899e936b0e08504aebf133efb423` and [A19 audit](D007_A19_ARCHITECTURE_READINESS_AUDIT.md); newer [independent POC REMEDIATION-02 QA](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597) is LOCAL_STAGE **PARTIAL**, not PASS.
**Fixed restrictions:** Module 002 UI (67 decisions) FROZEN, its 26 U6 **NOT RUN**; A4–A8 60 tests **NOT RUN**; A11–A18 148 design tests **NOT RUN**. All WP-01..09 **NOT_AUTHORIZED**, POC original branch/base/allowlist/no rebase unchanged, ACCESS-02 BLOCKED.

## 1. Precedence / interpretation

- A9's **G0–G7** are the sole gate names. [A20 gates](D007_A20_WORKPACKAGE_GATES.md) reconciles their distinct statuses; this addendum allocates obligations to A10 work packages. Neither document overwrites A9/A10 or a frozen UI decision.
- **Safety over sequence:** A11 incident redaction, A12 measurement/budget boundaries, A13 environment isolation, A14 host/Origin/CSRF, A15 atomic Owner + recovery, A16 risk-tier Step-up, A17 backup keys/restoration and A18 supply chain are required where relevant **before each independently granted implementation**.
- `REQUIRED` = G1 packet must define implementable fake/real test and STOP. `DEFERRED_BLOCKING` = may not claim/live-enable the relevant capability. `NOT_APPLICABLE_WITH_REASON` = justified for a narrower WP, not a PASS. A plan-only requirement is never test-observed.
- The A19 audit and this document cannot retrospectively alter the sole existing POC-001 local execution authority or turn GitHub `mergeable:true` into merge permission.

## 2. Corrected dependency topology — planning only

`WP-01 synthetic Auth/API boundary` → `WP-02 synthetic Paper/Project read` → `WP-03 guarded Project/status writes` → `WP-04 Note/drafts` → `WP-05 Quote/source history`.

**WP-06 is a parallel synthetic read-only Zotero metadata adapter**, conditional on the *QA-accepted applicable contract* of WP-01 and WP-02, **not an unconditional dependency on completed WP-05**. WP-05 quote picker/Relink may rely on fake A8 annotation mappings for testing; integration with WP-06 can occur via an independently scoped future integration gate. **Real WP-06** calls require their own least-privilege Zotero-account/token and G6 permission; WP-06 does not imply WP-05's multi-object transaction readiness.

`WP-07` requires the appropriate WP-06 attachment mapping or a separately approved URI-only fake path; real L1/L2/L3 app/PDF/annotation tests require G6 per device. `WP-08` only independently QA's **authorized and available** scopes without inventing success for omitted features; `WP-09` cannot choose a vendor or deploy until separate G7. Real mutable WP-03..05 storage remains **P0-STORE BLOCKED** until proven provider atomicity/restore or a newly approved D007 storage amendment. Synthetic WP-01/02 does not depend on ACCESS-02 but cannot certify real identity/storage.

## 3. A11–A18 per-package ownership and STOP crosswalk

Each row names the expected G1 planning obligation, **not evidence of an implementation or a grant**.

| WP | A11 Operations / A12 QoS | A13 Env / A14 Origin | A15 Owner / A16 Step-up | A17 Crypto/Backup / A18 Supply chain | Blocking proof/STOP |
| --- | --- | --- | --- | --- | --- |
| **WP-00 POC local** | Existing fault/Unknown and bounded mock testing only; **do not retrofit new authority** | Original loopback-only and path restrictions | Fake principal; no real bootstrap | No real KMS/backup; original dependency rules | Current exact-SHA independent QA PARTIAL; non-waivable N1 export certification gap; STOP before merge or real WebDAV |
| **WP-00A provider POC** | Request ceilings, cleanup, 401/429 STOP, safe logs | Actual verified HTTPS host/port/no redirect, separately isolated environment | Disposable account only as separately approved | External credential isolation, provider/provenance evidence | **DEFERRED_BLOCKING** until Design accepts LOCAL stage and user grants ACCESS-02; real CAS/ETag/protocol otherwise unknown |
| **WP-01 synthetic Auth/API** | Redacted fault evidence and outcome/latency definitions; no numeric production SLO | **REQUIRED** loopback and fail-closed config, simulated exact Origin/CORS/CSRF/Cookie headers; real browser behavior DEFERRED | **REQUIRED** fake Owner/foreign/read-only principals and denied stale step-up; durable cross-instance Owner and MFA DEFERRED | No real keys/backup; **REQUIRED** dependency/license/lock and no secrets | P0 STOP on mock cross-scope/CSRF/unknown misreport; no live Session/provider claim |
| **WP-02 synthetic reads** | Read/error privacy, fixture boundedness | Isolated fake resource ACL and origin contract | Owner/Workspace least-privilege reads | No PDFs/backups; approved dependencies and provenance | U6 read cases remain NOT_RUN until implemented/tested; no real Zotero fetch |
| **WP-03 guarded mutations** | UNKNOWN/conflict/restore safety, resource budgets | Separate write scopes and auth CSRF | R2 Project delete and All unlink **Step-up/UI-AMEND interlock** | Delete anti-resurrection, durable store and reviewed writes | **P0-STORE and UI-AMEND DEFERRED_BLOCKING for real/high-risk paths**; never false Deleted |
| **WP-04 Notes/drafts** | No false Saved, protect unknown drafts, recovery | Session-expiry and local-draft separation | Owner authorization; no unapproved bulk export | Whole-note CAS, encrypted data/backups and secure dependency choices | Real durability/P0-STORE blocked; no silent draft loss |
| **WP-05 Quotes/Relink** | History/UNKNOWN diagnostics, bounded annotation mapping | Server-side source authorization | No implicit global destructive operation | **Atomic** source+history consistency, recoverable backups, dependencies | Provider multi-object transaction unproven; keep mock-only if separately authorized |
| **WP-06 Zotero adapter** | Backoff/429 and page budgets, redacted URLs | Server-only token and egress/redirect isolation | Per-library read-only permissions | External credential separation, reviewed HTTP/XML/parser dependencies | Real token/account **G6 BLOCKED**; metadata is not PDF and not app launch |
| **WP-07 device handoff** | Fallback/availability and device observability limits | Browser Origin/Session and app handoff tested individually | Authorized user action; no cross-session focus | No PDF copied, dependency/URI security | iOS/iPadOS/Android L1/L2/L3 **NOT_RUN**, G6 device approval required |
| **WP-08 independent QA** | A11/A12 synthetic and real coverage distinctly tracked | Isolation, actual browser topology, provenance | A15/A16 negative controls and outstanding UI-AMEND | A17 backup proofs and A18 lock/SBOM/build digest as applicable | 26 U6 + 60 A4–A8 + later A11–A18 cases **not pre-passed**; separate exact-SHA QA |
| **WP-09 operations/release** | Runbook, measured budgets/alerts, RPO/RTO | Staging/Prod isolation, origin, certs, rollback | Durable identity, fresh auth, factor recovery | Verified encryption/backup/deletion witness and vetted SBOM/provenance | Provider/billing/region/domain selection and G7 **not approved** |

## 4. A16 vs frozen UI — non-negotiable implementation interlock

- Frozen Module 002 already requires separate confirmations for **Project Permanent Delete**, **Current Project Unlink**, **All Projects Unlink** and explicit **Local Draft Discard**. These preserve exact affected target IDs/Project counts, hidden selection, local revision and cancellation behavior.
- A16 additionally requires **server-verified fresh qualifying Step-up** and an intent bound to Session/environment/action/resource/scope/revision for its R2 operations. An ordinary confirmation dialog is **not** fresh authentication. R3 factor/recovery actions remain separately gated, not invented app pages.
- If frozen UI cannot supply compliant Step-up and matching exact intent, **STOP** and request user-approved **`UI-AMEND` as a separate design item before enabling R2**. Do not secretly insert UI, downgrade A16, skip second confirmation, pretend Session age proves Step-up or generate a password/MFA screen by inference.
- **WP-01 may simulate negative `STEP_UP_REQUIRED` responses only**; it must NOT perform any real R2 deletion/unlink, create new UI or select authentication providers. WP-03's high-risk mutation remains blocked unless both UX and durable store proof gates are separately met.

## 5. Provider/data integrity/QA interlocks retained from A19

**Storage:** strong cross-process conditional writes, identical-byte ETag, late ACK/Unknown resolution, operation identity, quote+history atomicity, consistent encrypted backup, independent trusted deletion witness and restore anti-resurrection remain unproved. A mock local green build is not P0-STORE GO and does not select a fallback database.

**Identity:** A15's single Owner requires proven atomic bootstrap and durable multi-instance Sessions/revoke/recovery; a `Map`, local in-process token or mock response cannot be certified real identity. A14 same-site sibling-origin Cookie parameters are candidates, not browser QA.

**Supply chain:** before a WP adds external dependencies, record **three GitHub candidates when relevant**, stars, latest maintenance, license, stack/compatibility and reuse/refactor/deploy cost; check exact dependency/lock/transitives/install hooks and minimal privilege. No A18 scanner, SBOM, CI action, build attestation or SLSA level has been executed/achieved.

**Current POC:** QA at `74d00f2…` **PARTIAL**; Q1 remains a non-waivable certified-export integrity gap, Q2 read-back and Q3 claim correction remain. A20 does not independently authorize remediation-03, rebase or provider test. [Latest QA report](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597).

## 6. A20 acceptance and next action

A20 design closure means (a) **one A9 G0–G7 vocabulary** and per-field evidence model, (b) A11–A18 gate ownership allocated, (c) WP-06 synthetic sequencing clarified, (d) A16 `UI-AMEND` interlock documented without changing frozen UI, (e) separate [WP-01 synthetic preflight](D007_A20_WP01_PREFLIGHT.md) prepared. **It does not satisfy G1.**

Next independent **D007-A21** candidate: specific **WP-01 G1 bounded synthetic execution authorization**, with frozen baseline/allowlist/fixture hash/toolchain/testing locked *after* a fresh main inspection. The separate POC QA residual findings require their **own** new Design disposition, not an addendum to WP-01.

**FINAL: A10 ORIGINAL UNMODIFIED. A20 PLANNING-ONLY ADDENDUM; NO CODE, NEW WORK PACKAGE AUTHORIZATION, QA PASS, REAL SERVICE, CI, MERGE OR RELEASE.**
