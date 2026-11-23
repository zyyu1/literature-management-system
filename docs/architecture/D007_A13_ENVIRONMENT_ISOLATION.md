# D007-A13 — Provider-Neutral Environment Isolation, Configuration and Artifact Promotion Contract

**Decision:** **D007-A13 Option B APPROVED**, user approval **2026-11-23 (Europe/Berlin)**.  
**Status:** **ENVIRONMENT DESIGN ONLY — NO ENVIRONMENTS, CREDENTIALS, ACCOUNTS, BUILDS, TESTS OR DEPLOYMENTS CREATED**.  
**Scope:** Local Synthetic, Independent QA, later-authorized Staging and later-authorized Production; separation of data, identities, sessions, origins, credentials, runtime configuration and artifact promotion; false-production-connection prevention, independent exact-SHA QA and safe rollback.  
**Governing contracts:** [D007-A1 logical frontend/API separation](D007_A1_LOGICAL_DEPLOYMENT.md), [A3 conditional provider preference](D007_A3_CONDITIONAL_PROVIDER_PREFERENCE.md), [A4 Auth/Session/CSRF/CORS](D007_A4_AUTH_SESSION_SECURITY.md), [A5 write outcomes](D007_A5_API_CONTRACT.md), [A6 storage/backup/schema](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 lifecycle/privacy](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A8 read-only Zotero and deep links](D007_A8_ZOTERO_INTEGRATION.md), [A9 QA/merge gates](D007_A9_QA_FRAMEWORK.md), [A10 work packages](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [A11 operations](D007_A11_OPERATIONS_RUNBOOK.md) and [A12 QoS](D007_A12_QOS_CAPACITY_BUDGET.md).  
**Frozen UI:** [Module 002 approved design](../ui/002/DESIGN_APPROVED.md) and its **26 original U6 tests NOT RUN** remain unchanged.  
**Existing POC:** [POC-001-REMEDIATION-01](../handoffs/POC-001/REMEDIATION_01.md) on **the original execution branch `exec/POC-001-webdav-feasibility`, base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, original path allowlist and no rebase**. Original independent QA reviewed `65e14afc81e6de37ba5fac90c2937a27876c5614`: **LOCAL_STAGE PARTIAL / overall POC BLOCKED**, not PASS. [ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md) is a secure design but **real Nutstore requests are NOT authorized** absent separate ACCESS-02 approval.
**Permission boundary:** A13 does not authorize even a free cloud account, staging deployment, production domain, actual password/secret generation, CI workflow, test execution, live Zotero login, physical device tests, app implementation, PR merge, provider selection or billing.

## 1. Four logical environments are a separation policy, not four live services

```text
Local Synthetic                Independent QA
  fake principals/fixtures  ->    fresh checkout of exact immutable PR SHA
  mock Zotero/WebDAV             synthetic and adversarial evidence
  loopback-only controls         independent reviewer; no real credentials
        |                             |
        +----- new scoped user/Design approvals, evidence gates -----+
                                        |
                                        v
                              Staging (FUTURE; NOT CREATED)
                               isolated owner, secrets & storage
                               disposable data only
                               separately authorized test providers
                                        |
                             independent QA + Design acceptance
                              explicit RELEASE authorization
                                        v
                              Production (FUTURE; NOT CREATED)
                               distinct identities/data/storage
                               distinct secrets, sessions & logs
                               separately approved provider
```

The arrows mean **review decisions**, not free credential/data copy or automatic promotion. Source/build artifacts may be promoted only with verified provenance and explicit grants. **No production data flows backward** into Staging, QA or Local Synthetic. Independent QA can be an isolated clean local CI/checkout using mocks; it is **not** permission to provision a public staging service. POC-001 has its own narrowly authorized local loopback environment/branch and must not be silently retargeted to this architecture.

## 2. Environment separation and mandatory boundaries

| Dimension | Local Synthetic | Independent QA | Staging — future only | Production — future only |
| --- | --- | --- | --- | --- |
| Purpose / execution | Developer-owned authorized mock implementation only for an explicitly scoped work package; **no new A13 coding authorized** | Independent reviewer reproduces approved tests at exact SHA and immutable fixtures | Isolated integration/pre-release validation only after separate explicit provisioning/access authorization | Actual private website available only after independent user-approved release |
| Data | Fabricated Projects/papers/five-field Markdown/Key Quote metadata, no actual PDF or original Zotero annotation | Same synthetic data with stable fixture hash; negative/security cases | **Synthetic/throwaway** user/library records only by default; any real limited test data needs **separate explicit scope/privacy authorization** | Real user-owned website records only after production release authorization |
| Identifiers | Fake library IDs, users, item keys; clearly non-routable provider hosts | Same fake records but separate owner/session/test scope | Distinct Staging namespace for Project IDs, canonical Zotero mapping, API operation IDs and backups | Distinct production namespace; never accept Staging IDs as production targets |
| Authentication / Sessions | Synthetic principals; local non-production-only signing/session secrets if later implemented (fake/unprivileged) | QA-specific fake credentials; independent scoped test users | Independent identity configuration, session signing/encryption keys, revocation namespace, CSRF and Cookie scope | Independent prod identity/session backend, privileged admin and revocation controls |
| Network / origins | **Default deny external egress**, loopback-only mock allowlist | Default deny external egress, no secret-capable real-provider route | Explicit allowed exact hosts, TLS validation, deny redirects for sensitive upstreams; only scoped approved test providers | Explicit allowed real upstreams and domain, region/privacy and egress policy after provider decision |
| Storage / backups | Disposable fake storage only, with no real WebDAV credentials | Isolated per-run scratch and fixture artefacts; cleanup only fake QA data | Distinct storage container/namespace, staging backups and scoped cleanup; not a mirror of production | Distinct persistent data, backup encryption/restore/retention and deletion anti-resurrection boundaries |
| Observability | Synthetic logs, no sensitive text/credentials | Sanitized evidence pinned to exact SHA | Separate protected redacted log/trace/alert sink only if later approved | Separately protected production observability; no forwarding unredacted user text to QA |
| Rights | No billing/deploy/real-account permissions | Read/reproduce only; QA not allowed to alter the subject code while certifying | Only scoped staging deploy/test authority after independent approval | Stronger, separately approved and restricted production promotion/rollback authority |

**Staging is not a synonym for POC-001 real Nutstore test.** POC-001-ACCESS-02 is a distinct gate that only applies to its explicitly bounded disposable test account; A13 grants no such connection to Staging or any other environment. **Production cannot reuse the second Nutstore POC account as its live data store without a new storage/procurement decision.**

**Isolation must be verified on the actual selected platform later.** A folder name, `NODE_ENV=production`, branch prefix or DNS label alone does not provide real tenant/network/secret isolation. A provider may offer stronger primitives (projects/accounts, separate service boundaries) but A13 selects none.

## 3. Minimal configuration contract and validation stages

Every future executable must use a **typed, versioned, environment-aware configuration schema**, validated at startup/build and before any side-effecting request. Keys below are conceptual names, **not real environment variables or code**:

| Config class / conceptual key | Required rule |
| --- | --- |
| `appEnvironment` | Enumerated `LOCAL_SYNTHETIC / INDEPENDENT_QA / STAGING / PRODUCTION`; **no implicit production default** and reject missing/unknown value before attempting network I/O |
| `configurationSchemaVersion` | Explicit supported version; incompatible or unknown config blocks startup rather than guesses or silent fallback |
| `apiBaseOrigin`, `webOrigin` | Absolute HTTPS origins for later Staging/Production; local loopback-only HTTP permitted solely under explicitly allowed synthetic testing. Exact origin/CORS/CSRF and SameSite cookie policy from A4, never `*` with credentials |
| `zoteroApiMode`, `webdavMode` | `MOCK` required for Local/QA; later authorized remote modes selected individually and checked against exact host/scheme/port/path allowlists |
| `libraryAllowlist`, `ownerScope` | Library type/id owner scope verified server-side; no free-form library/remote URL override in browser requests |
| `storageNamespace` | Per-environment distinct prefix/namespace/owner and backup manifest; if collision detected with another environment or production namespace, **STOP before writes** |
| `identityIssuer`, `sessionStoreScope`, `cookieName` | Disjoint per-environment auth/session namespace; environment-bound `HttpOnly` `Secure` Cookie, host-only where possible, CSRF origin verification; no fake or staging session may authorize production |
| `secretRefs` | **References only**, not plaintext, and not logged or exposed to static frontend; separate per-environment key IDs/scopes and explicit injection path chosen later |
| `networkPolicy`, `egressAllowlist` | Local/QA loopback only; later production/staging strict hostname/scheme/port/redirect/IP/SSRF checks, no unrestricted arbitrary WebDAV URL |
| `telemetryMode`, `logRedactionPolicy` | Local/QA no private telemetry; later protected per-environment redacted sinks; no body/header secrets |
| `featureCapabilityFlags` | Default **disabled/fail closed** for unverified real Nutstore writes, cross-process dedupe, background sync, PDF mirroring, unsupported Android native URI, exact annotation focus and irreversible restore |
| `schemaCompatibility` | Explicit allowed data schema/API version range and independently proved rollback path; unknown schema blocks writes |
| `requestBudget` | Explicit separately approved scope/limits for future provider testing; POC-001 ACCESS-01 100 requests/rolling 30 min, 20 files ×1 MiB applies only to its own future **ACCESS-02** authorization, not production quota |

**Validation phases:**
1. **Build/static:** identify environment-agnostic frontend/server artifacts; check no secret literal, private base URL, sensitive service token or production API credential embedded in static frontend bundles/source maps. Public API origin may be needed at build time but must be deliberately reviewed and never contain credentials.
2. **Start/deploy:** validate enum/schema, required fields by mode, host exact-match, TLS, region/data-flow policy, identity issuer/session namespace, storage isolation, read-only Zotero scope, secret reference availability and config hash; missing/ambiguous values **STOP**, not auto-connect to production.
3. **Before each outbound request:** revalidate destination after resolving host/redirect rules, enforce approved method, allowed library/namespace and authorization. **No unexpected HTTP redirect to credentials**, no downgrade to plaintext and no proxy bypass; DNS rebinding/SSRF mitigations to be reviewed in runtime tests.
4. **Before each mutation:** environment-bound authenticated principal, per-resource authorization, CSRF/Origin, matching API/data schema and atomic expected revision, separated write-operation identity; if unproved backend CAS or remote result, report `UNKNOWN` or block operation rather than fail open.
5. **Before promotion/rollback:** re-read target environment config snapshot, secret scopes, data schema compatibility, current production write state and exact build digest; missing proof **STOP**.

No actual `.env` file, encrypted secret, CI variable, domain or production endpoint is created by this contract.

## 4. Secret ownership, injection, rotation and revocation

- **Secrets must be environment-exclusive.** Zotero read-only credential, second Nutstore WebDAV app password if ever approved, API session signing/encryption keys, anti-CSRF secret and operation-ledger credentials are generated/installed only under distinct later authorizations; no reuse from Local/QA → Staging → Production. **Promote code, not secret values**.
- **Static frontend is an untrusted public delivery artifact** and must not include any long-lived Zotero/WebDAV password, service secret, session signing material or log exporter key, whether in source, built JS, HTML, URL parameters, client storage, crash dump, test snapshot, source map or mobile deep link.
- **Future injection design:** secret reference bound to a specific approved account/environment/principal and server runtime, least-privilege read-only Web API rights or isolated WebDAV test rights, service-to-service access limited to necessary operations, no shell `set -x`/stdout exposure. Credential source (provider secret manager, protected host environment or vault) is **NOT SELECTED**.
- **Rotations:** define approved owner, dependencies, revocation window and verification with a fake/nonproduction probe first. Auth session signing key changes must consider old sessions, per-device revocation, CSRF validity and in-flight `UNKNOWN` writes; credential rotation **must not erase drafts or imply a write was canceled**.
- **Leak response:** follow [A11 incident STOP and independent QA](D007_A11_OPERATIONS_RUNBOOK.md): isolate affected path, rotate/revoke under actual holder authority, audit sanitized downstream access, re-QA before resume. A Git history edit cannot guarantee previously exposed secrets are erased; use revocation. This document grants **no account administrative access**.
- **Dual-purpose credential warning:** the user's existing Zotero WebDAV attachment-sync credentials are **not** website storage credentials and must not be copied or reused to simplify environment configuration. The second proposed Nutstore account remains POC-001 gated and not commissioned.

## 5. Data and identity movement prohibitions

| Movement | Default state | Only future permitted exception and evidence |
| --- | --- | --- |
| **Production → Local/Independent QA** | **DENY** for real research notes, keys, identifiers/annotation bodies, PDFs, backups, logs and database dumps | None under A13. If test case truly needs production-derived data, propose a **separate privacy/security decision** with lawful basis, robust synthetic replacement and independently reviewed risk; default remains deny |
| **Production → Staging** | **DENY** real dataset/credential cloning or prod snapshot restores to a test environment | Separate **explicit user approval** and independent privacy/technical controls would be required; the preferred path is isolated fictional fixtures, not sanitized-by-name production copies |
| **Local/QA → Staging** | No automatic data or Session promotion | User-approved synthetic fixture **definitions only** may be reconstructed with distinct environment IDs; no active Session, OperationRecord, credential, local draft or real account pointer copied |
| **Staging → Production** | **DENY data/secret/Session/backup promotion** | Only an independently verified **immutable code/build artifact and approved schema migration plan** may be promoted with a separate production release authorization |
| **Production → external telemetry/CDN/QA logs** | **DENY raw private user content and credentials** | Later expressly approved coarse/aggregated/redacted signals, region/DPA review and retention policy; do not claim Render Frankfurt implies all data stays EU |
| **Any → Zotero/PDF store** | **NO website PDF copies or original-annotation mutations** | A8 permits later **read-only** Zotero metadata/annotation selection under separate real-library authorization; Zotero app manages file sync. This decision grants no external reads |
| **POC-001 → Production** | **DENY** synthetic test files, app passwords, ledger, operation IDs and account auto-promotions | Real POC acceptance may inform a **new storage procurement/migration decision**; not automatic reuse of POC credentials or isolated test namespace |

**No uncontrolled fixture or data synchronization:** staging seed scripts, QA report attachments and migration samples cannot carry production snapshots, user email, Note body, annotation text, raw PDF URL with tokens or secrets. Scrubbing a real PDF title does not convert the PDF into a safe fake fixture. Use fully fabricated records from [A9 fixture catalog](D007_A9_TRACEABILITY_FIXTURES.md).

## 6. Immutable artifact provenance and exact-SHA promotion policy

**Build/promotion record fields (proposed, not a running CI pipeline):**

| Field | Meaning |
| --- | --- |
| `workPackageId`, `designAuthorizationId` | A10 work package and **separately approved execution scope**; A13 is not an execution ID |
| `repository`, `approvedBaseSha`, `sourceHeadSha` | Exact repo and full **40-character** immutable source SHA, branch and parent; floating `main`/tag alone is unacceptable |
| `allowedPathsDigest`, `lockfileDigest` | Reproducible diff/change inventory, dependency/license and secret-scan evidence; no unapproved side-effects |
| `buildArtifactDigest`, `buildRecipeDigest` | Cryptographic digest of the actual immutable deployable frontend and API artifacts and reproducible build recipe/dependencies |
| `fixtureHash`, `qaReportRef`, `qaEnvironment` | Synthetic fixture version, independent QA evidence tied to exact source/artifact digest and environment |
| `dataSchemaVersion`, `apiContractVersion` | Compatible range, backfill/migration proof and rollback limits, not merely package version |
| `targetEnvironment`, `configSchemaVersion`, `configDigest` | Exact target environment and redacted configuration fingerprint, no secret values |
| `securityApproval`, `designDisposition`, `mergeApproval`, `releaseApproval` | **Separate**, explicit signed-off decisions; none inferred from a passing CI check |
| `restoreCheckpoint`, `rollbackArtifactDigest` | Independently validated safe rollback route and last trusted data state (or `UNVERIFIED/BLOCKED`) |

**Promotion gates:**
1. Work package requirements/design and branch/allowed paths approved by user/Design **before code**. Execution builds only in permitted scope and produces PR HEAD full SHA, reproducible commands, changed-path/secret scans and artifact hash.
2. **Independent QA** checks exact immutable tested SHA and build digest, synthetic negative/fault cases and stage-specific requirements; report `PASS/PARTIAL/FAIL`, P0/P1/P2 and no unverified provider claims. QA **does not implement a different artifact while certifying this one**.
3. **Design** separately disposes QA, integration risk, current `main` drift and explicit merge approval. A rebase/new head/build/dependency variation **invalidates old test attachment for the changed artifact** and requires re-auditing and appropriate independent re-QA.
4. **Staging creation/deploy** needs its own user authorization, approved region/data flow/provider, Staging-exclusive identity/session/secret/namespace, permission to use particular disposable accounts and successful independent staging QA. Code promotion does not transfer QA's fake account/session data.
5. **Production release** requires separately approved vendor/region/TCO/identity and SLO decisions, live WebDAV storage safety or D007 storage amendment, consistent backup/restore and migration evidence, current staging/independent QA, precise artifact digest, target config review, explicit **merge and production release decisions**. No automatic staging→production publish.
6. **Rollback** cannot blindly revert schema or re-run unknown writes. A compatible code rollback must preserve all `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN` states and session revocations. Any destructive schema/storage rollback requires pre-approved consistent snapshot, read/write fencing, trial restore and independently verified anti-resurrection; if unproven, **STOP**.

A production deployment artifact must be tied to the approved source/build hash, **not rebuilt with a different dependency lock under the same tag**. Provider-neutral supply-chain signing/attestation tooling is **not chosen**; implementation and actual evidence remain separately gated.

## 7. Misconnection, cross-environment leak and privilege escalation defenses

**Future mandatory negative checks:**
- Running in `LOCAL_SYNTHETIC` or `INDEPENDENT_QA` with a real `https://api.zotero.org` or Nutstore host configured must **STOP before HTTP request**, even if a fake token or developer environment override exists; loopback-only fake WebDAV remains the sole approved POC-001 local mode. The production endpoint address must not be routable through an arbitrary test proxy.
- A build labeled Staging with production storage namespace, production Session issuer, production secret reference or production origin must fail preflight. A production build with `MOCK` secrets cannot silently fall back to insecure non-production cookie behavior.
- If `appEnvironment` is missing or case/enum invalid, fail closed; reject wildcard credentialed CORS, HTTPS→HTTP redirect, header-origin mismatch, cookie Domain overlap or shared signing key. Distinct hostname/registered-site actual cookie behavior and Safari/iOS compatibility still need a separate **origin topology** decision and browser QA.
- No production data copied into QA via database export, log dump, “sample note,” source map, browser screenshot, fixture import or emergency debugging. Secret scanner must evaluate built artifacts, CI logs and source, not only source code; scanners are heuristic and do not certify absence.
- Do not allow a write-capable Personal Workspace token/session on the literature site; separate read-only grant, scope and referrer-safe deep links. A read-only Workspace client cannot bypass environment restrictions by modifying a target API URL.
- The upstream API permission check, library/attachment ID mapping and WebDAV target prefix validation run server-side. Never trust a client-supplied `environment`, upstream host, Project ID or credential to select production.
- Two concurrent writers with separate environments cannot share an operation ledger or version token; cross-environment `operationId` collision must not dedupe or target another dataset. Durable cross-process idempotency and actual backend CAS remain **POC-001-dependent and UNVERIFIED**.

**Any ambiguous target environment, unsupported data schema, session/secret overlap, non-atomic destructive recovery or unproven provider credential handling is a STOP**—not a warning to be ignored for faster rollout.

## 8. Independent QA and staged release gate matrix — design only

| Gate | Separate approval and evidence required | STOP result |
| --- | --- | --- |
| **ENV-0 — Design / policy** | D007-A13 approved; per-work-package exact scope not yet granted | No code starts solely because ENV-0 exists |
| **ENV-1 — Local execution** | A10 specific work package/branch/base/path, fake fixtures, loopback-only network, no real secrets, independent QA handoff | Unauthorized paths, local real-provider host, leaked secret or unexpected HTTP egress |
| **ENV-2 — Independent QA** | Fresh source checkout and artifact digest, exact 40-char SHA, deterministic fixture hash, recorded commands/exits, P0/P1/P2, original U6 and D007 IDs preserved | QA PARTIAL/FAIL or changed HEAD; cannot claim approved |
| **ENV-3 — Staging provisioning** | Explicit **user authorization** for environment/account/provider, approved EU/privacy flows, distinct identity/namespace/secret store and bounded test-only services | Production secret/data reuse, unexpected cloud charge, unapproved Zotero/Nutstore account |
| **ENV-4 — Staging QA / pre-release** | Authorized staging synthetic/provider tests, actual TLS/origin/cookie, backup/restore, concurrent writes, rate limits, artifact provenance and independent acceptance | Real-provider CAS/ledger UNKNOWN, false Saved, cross-tenant leak or unproven restore |
| **ENV-5 — Production release** | Independent QA and Design acceptance at exact artifact SHA, separate merge and release approval, current provider/data region and cost, secure rollback, on-call/incident policy, signed-off real account permissions | No automatic production login, upgrade, domain selection or deployment |
| **ENV-6 — Rollback/recovery** | Severity-led safe STOP; auth and operation truth preserved, checkpoint/Schema compatibility independently verified, explicit restoration authorization | Destructive schema rollback, replay of UNKNOWN, backup resurrecting deleted records |

**Three-window accountability:** Design authorizes scopes and exact approval, Execution implements only within scope, independent QA reviews exact immutable candidate. A deployed or promoted artifact is not “QA passed” if the tested SHA/build digest or relevant configuration differs. `LOCAL PASS` cannot be promoted to `STAGING PASS`, `PROVIDER PASS` or `PRODUCTION READY` without the distinct proof.

## 9. Proposed A13 verification register (ALL NOT RUN)

| ID | Proposed future synthetic/authorized test, not an execution request |
| --- | --- |
| **A13-01** | Missing/invalid environment or config schema rejects startup before outbound network; no production default |
| **A13-02** | Local Synthetic and Independent QA deny all real Zotero/Nutstore hosts and unexpected outbound traffic; loopback-only allowed per separate POC scope |
| **A13-03** | Exact same fake item key in two library/owner scopes stays isolated across environments; no cross-environment Note/Quote visibility |
| **A13-04** | Session issuer/key/cookie/CSRF and Origin separation prevents Staging Session and read-only Workspace grant from authorizing production writes |
| **A13-05** | Negative browser frontend/build/source-map and QA/CI logs inspection contains no real API key, WebDAV password, signing key or session cookie |
| **A13-06** | Staging app configured with prod storage, namespace, account secret or host fails startup/preflight before writes |
| **A13-07** | External target host, port, path, DNS rebinding, redirect/downgrade and credentials leak attempts are denied in the appropriate authorized test environment |
| **A13-08** | Fake fixture/QA evidence cannot accidentally import real Zotero annotation/PDF/Note or prod logs; provenance and data lineage validated |
| **A13-09** | Execution/QA artifact tracks exact full SHA, tree/dependency/build digest, fixture hash, allowed-path scope and independent QA disposition |
| **A13-10** | Rebase, changed HEAD, rebuilt dependency or changed artifact digest rejects stale QA certification and requires new review |
| **A13-11** | Synthetic Staging→Production “promotion” workflow copies only approved immutable build/recipe; never seeds production with fake sessions/operation records or secret values |
| **A13-12** | Auth or secret rotation with in-flight `UNKNOWN` preserves local draft, last-confirmed state and revocation scope; no blind replay |
| **A13-13** | Incompatible Schema migration and stale/deleted-record restore block active cutover; reversible rollback only after proven checkpoint and Design decision |
| **A13-14** | A P0 cross-environment secret/tenant leak halts affected operation and routes to A11 incident playbook; redacted evidence and independent re-QA |
| **A13-15** | Actual browser cross-site Cookie, Safari/iOS/mobile Session/CORS cases remain **NOT RUN** until a separate domain/origin test authorization |
| **A13-16** | Verify design documents cannot alter original POC-001 branch/base/scope or self-authorize ACCESS-02, PR merge, cloud provisioning or deployment |

**Status:** **16 NEW DESIGN-ONLY TEST DEFINITIONS, 0 EXECUTED.** These do not amend frozen Module 002 **26 U6 cases NOT RUN**, D007-A4..A8 **60 cases NOT RUN**, or POC-001 independent QA evidence **LOCAL_STAGE PARTIAL**; they are not a new obligation on the currently running `exec/POC-001-webdav-feasibility` branch.

## 10. Deferred implementation/vendor questions and next design decision

**Not chosen:** Cloudflare/Render/Hetzner tenant/project structure, paid/free accounts, Staging or production hostname, registered domain/DNS, auth provider, password manager/vault/CI secret store, actual Session store, credential TTL, retention days, production data region, logging provider, per-environment billing cap, signing/attestation tool, CI toolchain, actual rollback machinery or authorized live test accounts. No service is provisioned and no config file is created.

**Next separately approachable D007-A14 — browser origin/domain and cookie compatibility architecture:** decide the *logical* URL/origin topology for independently deployed static website and secure API, with same-site custom-subdomain candidate versus cross-site hosted-origin fallback, Cookie `SameSite`/`Secure`/`HttpOnly`, CSRF/CORS, mobile Safari third-party Cookie restrictions and staged device QA. **Design only: no domain purchase, DNS, cloud account, app code or test session.** The specific app-domain name and hosting vendor remain undecided.

**FINAL DISPOSITION: D007-A13 OPTION B APPROVED AS PROVIDER-NEUTRAL ENVIRONMENT/SECRET/PROMOTION DESIGN ONLY. NO ACCOUNTS, REAL DATA, TOKENS, CONFIG DEPLOYMENT, CI/JOBS, APPLICATION CODE, TEST EXECUTION, POC CHANGE, MERGE OR RELEASE.**
