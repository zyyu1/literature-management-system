# D007-A11 — Provider-Neutral Safe Operations, Incident Response and Recovery Runbook

**Decision:** **D007-A11 Option B APPROVED**, user approval **2026-11-23 (Europe/Berlin)**.  
**Authority:** **ARCHITECTURE / OPERATIONS DESIGN ONLY. NOT IMPLEMENTED, NOT OBSERVED, NOT EXERCISED**.  
**Scope:** API and storage observability, privacy-preserving diagnostic data, write-result/UNKNOWN alerts, P0/P1/P2 incidents, credential exposure and session revocation, backup/restore drills, schema/deployment rollback and STOP/resume governance.  
**Upstream contracts:** [D007-A4 Session/Auth](D007_A4_AUTH_SESSION_SECURITY.md), [D007-A5 API/outcomes](D007_A5_API_CONTRACT.md), [D007-A6 schema/backup/restore](D007_A6_DATA_SCHEMA_RECOVERY.md), [D007-A7 privacy and retention](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [D007-A8 Zotero/file/deep link](D007_A8_ZOTERO_INTEGRATION.md), [D007-A9 independent QA](D007_A9_QA_FRAMEWORK.md), [D007-A10 work-package gates](D007_A10_IMPLEMENTATION_WORKPACKAGES.md).  
**Frozen UI:** [Module 002 UI-D decisions](../ui/002/DESIGN_APPROVED.md), including its 26 frozen U6 acceptance scenarios, **unchanged and NOT RUN**.  
**POC authority:** [POC-001 REMEDIATION-01](../handoffs/POC-001/REMEDIATION_01.md) retains branch `exec/POC-001-webdav-feasibility`, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, path allowlist and **no rebase** direction. Independent original QA at `65e14afc81e6de37ba5fac90c2937a27876c5614` concluded **LOCAL_STAGE PARTIAL**, not PASS. [ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md) does **NOT** authorize real Nutstore; ACCESS-02 is blocked pending separate user permission.
**Not authorized:** deploying dashboards/alert rules, logging production data, creating telemetry accounts, sending emails/webhooks/notifications, setting real credentials, exporting a real Zotero library/PDF, modifying API/UI/POC code or running restore/incident drills on any live account.

## 1. Operating principles and failure-state language

1. **Protect confirmed data and unsynced work before restoring availability.** A previously confirmed global Research Note, Project Association, Important, Reading Status, Key Quote and Source History may not be overwritten or discarded for convenience. Browser drafts and their exact last-edit snapshot are distinct from authoritative remote records (A5–A7).
2. **Persistence truth is four-state:** `CONFIRMED`, `CONFLICT`, `DEFINITE_FAILURE`, `UNKNOWN`. A `202 Accepted`, client timeout, dropped response or upstream 5xx after dispatch **is not proof of a durable save or a definite failure**. Never emit a misleading success metric or tell the user “Saved/Deleted” without a confirmed authoritative operation.
3. **Unknown never auto-replays.** Preserve original `operationId`/scope, resource revision, local draft and last confirmed value; a later read of matching bytes alone cannot prove the same in-flight operation finished, and a remote read of old bytes cannot prove it will never commit late.
4. **Runbook STOP is not data deletion.** A suspected consistency failure can require halting new mutations and allowing safe read-only access where authorization and safe reads remain proven; freeze or disable questionable paths, not silently wipe pending browser drafts. If even reads may leak/return inconsistent private data, stop those reads too.
5. **No vendor choice.** Cloudflare Pages + Render Frankfurt is only a D007-A3 conditional validation candidate, Workers alternative and Hetzner Germany VPS fallback. This document assumes no service, region, monitoring vendor, specific alert destination, identity system, backup product or paid plan is selected.
6. **Separate evidence gates.** “Designed”, “synthetic fixture tested”, “local mock observed”, “independently QA reviewed”, “real provider proven” and “production available” are **different statuses** and require exact SHA and authorized environment evidence.

## 2. Provider-neutral signal inventory — definitions, not configured monitors

Metrics must be aggregated, redacted, bounded in cardinality and segmented by **approved environment** (`synthetic`, `later-authorized-test`, `later-authorized-production`), API operation family and outcome. No user name, email, Zotero item key, Project name, quote text, PDF path, raw IP, Session ID or Authorization header in a metric label.

| Signal family / possible metric name | What it is intended to detect | Guard and quality caveat |
| --- | --- | --- |
| API request volume `api_requests_total` | By endpoint family, authorized HTTP method and outcome; sudden spikes/rate-limits | Bucket route templates (never raw `/papers/{id}` path). 200/202 alone not `CONFIRMED` |
| API duration `api_request_duration` | Latency distribution for authenticated read/write and authorization | Split network waiting from actual CPU where possible; actual p95/p99/SLO thresholds **UNDECIDED** |
| Confirmed mutation `writes_confirmed_total` | Only authoritative persisted acknowledged writes | Count by protected operation kind, not whole-note content; never count `202` or “request sent” as confirmed |
| Conflict/Unknown `writes_conflict_total`, `writes_unknown_total` | CAS conflict, lost ack, in-flight ambiguity and user recovery pressure | Track `UNKNOWN` **distinctly** from definite fail; dedupe by internal protected correlation where proven, avoid user/resource label leakage |
| Reconciliation `operation_verification_results` | Confirmed after verification, still unknown, unsupported due to absent durable ledger | Must not exist as a “verified” success counter until provider-backed operation evidence/ledger proven; no blind retries |
| Outbound Zotero `zotero_read_requests` | 401/403/revoked credentials, `429`+`Backoff`, pagination faults, 5xx and HTTP timeouts | Server-only read scope; do not capture raw upstream annotation body or auth header; avoid continuous polling |
| Candidate WebDAV `storage_ops` | CRUD/ETag/If-Match outcomes, 401/429, connection/tls, timeouts, ambiguous commit and per-run request-budget exhaustion | No real data collection before ACCESS-02; backend atomicity **NOT PROVEN**; redact remote file paths |
| Session/authZ `auth_denied`, `session_revocations` | Revoked/expired session refusal, CSRF rejection, foreign-Project IDOR attempts, unexpected privilege failures | Security-sensitive coarse counters only; no raw tokens, full IP/device fingerprint, request body or user identifiable labels |
| Backup/restore `backup_certification_state`, `restore_drill_state` | Manifest/hash/reference-closure and **consistent snapshot** certification, drill pass/fail | A successful file hash is **not** evidence of an atomic snapshot or restorable backup. Mark `UNVERIFIED` until separately observed |
| Deployment/schema `build_revision`, `schema_compatibility` | Which exact release SHA/schema version is serving traffic and whether clients can read/rollback safely | Allow only bounded build/version labels; no secrets; schema migration must not be downgraded silently |
| Client integration `device_handoff_status` | L1 Zotero App launch, L2 correct PDF, L3 correct annotation, fallback usage | **Only actual independently authorized physical-device observations** can claim L1–L3. JS URI construction is not evidence |

**Future service-level objectives and alert thresholds:** define failure-window, ratio/rate, consecutive error count, retention and escalation contact only after an independently approved **D007 quality/capacity parameter decision** using synthetic and permitted runtime evidence. **No numeric SLO, RTO, RPO, log days, polling interval or budget threshold** is fixed by A11. P0 integrity/security STOP is immediate on credible evidence, independent of aggregate error-rate thresholds.

## 3. Safe structured logs, traces and access restrictions

**Proposed bounded record** (schema illustration only; these records are not present in any running system):

```json
{
  "schemaVersion": 1,
  "timeUtc": "2026-11-23T12:00:00Z",
  "environment": "SYNTHETIC",
  "serviceComponent": "safe-api",
  "routeTemplate": "/api/v1/papers/{paperId}/research-note",
  "event": "WRITE_ACK_UNVERIFIED",
  "outcome": "UNKNOWN",
  "traceCorrelationId": "fake-correlation-001",
  "operationKind": "researchNote",
  "severity": "P1",
  "providerKind": "MOCK",
  "evidenceState": "NOT_RUN"
}
```

- **Allowed, only if necessary:** UTC event time, component, **route template**, coarse status/class, `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN`, version/build SHA, bounded correlation (an internally generated random diagnostic ID not reused as an authentication secret) and a classified `MOCK/REAL_UNDER_SEPARATE_AUTH` environment flag. Correlation IDs and operation IDs must be protected from cross-user enumeration; use keyed/pseudonymous correlation when necessary, not raw user/Project/item keys in broadly accessible logs.
- **Forbidden by default:** Authorization, Cookie, `Set-Cookie`, CSRF token, Zotero API key, Nutstore WebDAV app password or Basic header, raw query strings/unredacted URLs, personal email/login, paper title, PDF contents/URLs, Markdown fields, quote excerpt/comment, original annotation text/position, file-system path, unmasked request/response body and exported backups.
- **Collection boundaries:** never ship private notes to third-party hosted dashboards under a default “capture everything” option. Structured logging and any future telemetry exporter must have fail-closed redaction, explicit access scope, HTTPS, restricted recipients, controlled retention and approved EU/data-flow/privacy review; do not infer regional compliance from a Frankfurt API deployment alone.
- **Known unsafe controls:** no debug mode that logs raw upstream responses, no long-lived unrestricted public error endpoint, no telemetry leak through `Referer`, browser console or frontend analytics. Token/credential-rotation events may be audited as metadata **without** logging old/new secret values.
- **Logs are not a transaction ledger or backup.** An `operationId` seen in logs, a 200 logged by a proxy, or a “PUT completed” message does **not** alone establish atomic durable persistence or safe idempotent replay. If operation/backup proof is absent, report `UNKNOWN/UNVERIFIED` and STOP the unsafe workflow.
- **Deferred:** concrete log/tracing backend, retention days, cross-region replication, pager/notification destination, actor identity policy and export auditing. A user-held export cannot be remotely revoked by deleting a website log.

## 4. Severity classification and first-action matrix

| Severity | Concrete trigger | Immediately required safe operator action | Recovery/acceptance owner |
| --- | --- | --- | --- |
| **P0 — SECURITY/INTEGRITY STOP** | Credential/Session leak; cross-user read/write; false Saved/Deleted; lost draft; confirmed stale overwrite; uncontrolled two-client writes; unauthorized PDF copy/annotation mutation; destructive restore; privacy-resurrecting previously deleted data; actual password sent over plaintext | **STOP new affected writes or all access if needed**, protect known-good data/drafts, block unsafe credential/network path, isolate evidence, revoke/rotate compromised credentials as safely possible, notify Design and independent QA; no silent repair or production restore | **Design** records explicit incident disposition after separate independent verification. No automatic restart, merge or deploy |
| **P1 — BLOCK STAGE** | Reproducible critical workflow outage; non-durable operation ledger used as “verified”, untrusted TLS/If-Match, broken essential session revoke, repeated `UNKNOWN` state without safe recovery path, corrupted backup *test* | Isolate affected operation, disable affected mutations where unsafe, keep draft and last confirmed revision, preserve scoped redacted evidence, file reproducible remediation + independent QA | QA reproduces fixed exact SHA; Design separately accepts. Escalate to P0 if actual loss/leak/false confirmation emerges |
| **P2 — REVIEW AND TRACK** | Low-impact polish, non-sensitive logging omission, contained minor monitoring gaps, noncritical hint/fallback issue without data integrity implications | Record scope, owner and reproducible evidence; continue **only** under previously authorized task if Design confirms risk contained | Design explicitly reviews residual P2 before stage acceptance; no automatic waiver |
| **UNVERIFIED/UNKNOWN** | No trustworthy evidence whether an operation committed, snapshot was consistent or mobile PDF opened | Do **not** convert uncertainty into P0/P1/P2 outcome or PASS without evidence; represent the uncertainty and follow the relevant safety STOP/verify path | Design/QA classify after a separately authorized safe test |

**P0 is evidence/risk-based, not an alert count.** Missing, unreliable or silenced telemetry must never be interpreted as a healthy service. Do not collect production security incidents or send alerts before an implementation is separately approved.

## 5. Incident state machine and role-specific runbook

```text
DETECT / USER REPORT
      ↓
TRIAGE: event identity, severity and affected owner/resource scope
      ↓
CONTAIN: stop unsafe writes, preserve drafts, restrict suspect credentials
      ↓
PRESERVE: sanitized immutable evidence, last known confirmed versions,
          exact deployed/tested code SHA, observed provider and timestamp
      ↓
DIAGNOSE: separate confirmed state from UNKNOWN; do not blind-retry
      ↓
REMEDIATE: ONLY with newly bounded and approved implementation scope
      ↓
INDEPENDENT QA: same exact remediation SHA + negative/failure tests
      ↓
DESIGN DISPOSITION: accept fix and exact restoration path or keep BLOCKED
      ↓
AUTHORIZED RESTORE / RESUME (separate approval and evidence)
      ↓
POST-INCIDENT REVIEW + controlled corrective work backlog
```

**Operator first five questions:** (1) Was any actual user data/credential exposed? (2) Which exact operation IDs and known revisions were affected? (3) Does the last response prove `CONFIRMED`, `CONFLICT`, `DEFINITE_FAILURE` or `UNKNOWN`? (4) Are two clients/writers, delayed requests, revoked sessions or stale backups involved? (5) Can traffic be safely restricted to validated read-only operations without losing drafts or disclosing private data?

**Example scenario response:**

| Event | Containment first | Must not do | Future proof to resume |
| --- | --- | --- | --- |
| Lost write acknowledgment / late commit | Record protected operation identity; freeze unsafe write/retry path; preserve browser draft and last-confirmed revision | Classify unchanged ETag immediately as `not_committed`, retry PUT, mark Failed/Saved | Fence or authoritative durable identity-aware verification across delayed writer; otherwise remain UNKNOWN and escalate |
| Two same-operation writes / weak ETag | Stop affected mutation endpoint; preserve revision/scope; examine sanitized request count and unique op IDs | Claim a per-process `Map` proves cross-process exactly once; accept weak/list tags or last-write-wins | Independent race test and real provider CAS proof when separately authorized |
| Wrong scope/unlink/Project delete | Stop destructive commands, preserve last-known confirmed global Note/Quote and Project association set | Replay all-Project Delete or assume one HTTP 200 covers all child links | Proven scoped, revision-safe commit and complete affected-target reconciliation |
| API/session credential leak | Disable affected credential paths, revoke/rotate only through approved account administrative procedures and smallest valid scope; isolate logs/exports and identify propagation | Print leaked token, paste it into GitHub/QA, assume browser sign-out revokes upstream secrets, blindly purge data | Verified rotation/revocation, least-privilege restoration, independent negative authZ and secret scan |
| Zotero credential revoked / `429` | Stop excess upstream requests, honor `Backoff`/`Retry-After`, label API metadata stale/inaccessible | Delete existing website Key Quotes because source lookup failed, flood retries or copy PDFs | Verified approved credentials, bounded request and authorization checks; original Zotero records unchanged |
| Backup invalid or deletes resurrect on restore | Quarantine export, keep active confirmed dataset unchanged, isolate old snapshot and tombstone/checkpoint evidence | “Restore” through best-effort bulk PUT, overwrite newer revisions or claim full erasure of backup copies | Independently certified consistent snapshot + verified deletion-state check + trial restore/rollback proof |
| New schema/API deployment mismatch | Stop incompatible writers, preserve old readable data and plan a compatibility-safe change under later release gate | Roll back schema blindly across irreversible migration, re-run operations with unknown ack | Tested version/feature compatibility, reversible transform and exact deployment provenance |

**Duty segregation:** Design classifies/approves scope and recovery; Execution may implement only in a separately authorized branch/path; independent QA validates the exact immutable implementation SHA and provider/device conditions; authorized operator actions on a real service require a future explicit production/incident response delegation. **This runbook does not itself delegate access to any account or production environment.**

## 6. Credential leak response, rotation and audit boundaries

1. **Detect/contain:** when a secret may have reached logs, browser, PR, analytics, copied URI, third-party tool or HTTP plaintext, treat the secret as potentially compromised and flag a P0 until triaged. Stop the affected integration path before further requests; preserve only sanitized evidence and where it may have propagated.
2. **Revoke/rotate only under actual holder authorization:** in a later authorized environment, revoke the exposed Nutstore application-specific WebDAV password, Zotero scoped key and/or invalid API Session as applicable; each system has distinct control and cannot be remotely managed by A11. Prefer smallest blast radius and prevent fallback credentials. Do **not** request, display, paste, log or commit actual secrets during design/QA.
3. **Check downstream exposure:** inspect authorized log/alert recipients and stale account access; remove leaked content only using valid deletion policy and separately approved permissions. Git history or user-downloaded exports may retain previous secret material even after an edit; credential rotation is the primary containment, not a mistaken assertion that editing a file deleted copies.
4. **Prove re-establishment:** independent synthetic/authorized integration checks of new privilege boundary, secret log redaction, session revocation, 401/403 failure behavior and absence of unauthorized rights. No silent real-account login or token issuance.
5. **Keep user work safe:** credential revocation can leave note writes `UNKNOWN`, never interpret as canceled, and must not delete drafts or auto-retry with new credentials.

No real incident or credential rotation has been executed or requested by D007-A11.

## 7. Backup/restore drills, deletion markers and recovery objectives

**Drill lifecycle — future synthetic-only first; all are NOT RUN:**
1. **Plan and scope:** separate user/Design execution approval, exact fixture and version, isolated namespace, no real personal PDF/note, no original account credentials. Define restoration target and observed expected canonical IDs, three Project Associations, one global five-field Note, Key Quotes and confirmed SourceHistory, with a previously deleted Project as anti-resurrection test.
2. **Create/inspect consistent source checkpoint:** require a proven cross-object snapshot/quiet-fence strategy and manifest counts, SHA-256 checksums **under a specified canonical byte encoding**, schema version and reference closure. Missing/partial export or unresolved writer ⇒ `NOT_RESTORE_CERTIFIED`, **STOP**.
3. **Inject adverse cases:** omitted/duplicate record, corrupt hash, foreign-owner ID, unsupported schema, delayed write, stale source revision, canceled backup job, removed/expired tombstone, old backup of a deleted Project and concurrent restoration into the same target. No best-effort overwrites.
4. **Restore to isolated destination only:** verify archive input paths and parsing, identity mapping, permissions, source-history ordering, whole-note Markdown losslessness, quote/source pointers and deletion anti-resurrection checkpoint; run *read-only dry-run validation* first. Mark restoration `PARTIAL/UNKNOWN` if target or operation result cannot be confirmed.
5. **Cutover/rollback rehearsal:** simulate a version-fenced pause and reversible transition, verify reads and referential integrity, then simulate rollback to the last confirmed release and data revision. If provider cannot guarantee atomic cutover/multi-object integrity, **STOP** and request D007 storage amendment; no in-place live restore authorized.
6. **Record independently:** same exact code SHA, synthetic fixture version, captured before/after counts and hashes, failure-injection traces, observed outcome, outstanding uncertain writes, reviewer and Design approval. A manifest without test restore ≠ proven backup.
7. **Retention/erasure:** D007-A7 defers numeric retention for backups, deletion markers, local drafts, sessions and security logs. A11 does **not** invent durations. User-downloaded exports cannot be revoked by the website. Tombstone retention and expiration require proven anti-resurrection protection and separate privacy/legal review.

**Recovery objectives:** `RPO` (maximum tolerable lost confirmed data) and `RTO` (restoration time) are **UNDECIDED target parameters**, not achieved measurements. Do not imply zero data loss, automatic self-healing or 24/7 staffed on-call, especially for a one-person deployment.

## 8. Safe schema and deployment rollback decision table

| Change / rollback case | Design requirement and failure action |
| --- | --- |
| API code hotfix with no persisted schema change | Pin old/new exact SHA; keep compatible API contract, auth and operation handling. Independent QA confirms read/write semantics. A release roll back only after explicit approval and a safe handling plan for in-flight/UNKNOWN writes |
| Forward-compatible additive schema | Document readers/writers compatibility and transform fixtures. A new client may not erase unknown records merely because it uses an older serializer |
| Irreversible or lossy schema migration | **STOP automatic rollback**; plan immutable protected pre-migration consistent snapshot, trial conversion, source/version mapping, compare counts/notes/history and separately approved operator decision |
| Storage adapter/provider change | Real Nutstore POC-001 CAS, ledger and backup proof still required or a separate storage amendment. Validate isolation, migration checkpoint, rollback and exact content/ownership; no automatic choice of database or region |
| Auth/session changes | Preserve separate revoked-session state; do not downgrade to insecure long-lived browser bearer tokens, broaden CORS or leak secrets to make rollback easier |
| Zotero/deep link regression | Preserve user Key Quote, source history and optional copy-excerpt fallback; do not claim app opened or trigger uncontrolled browser relaunch |
| Failed recovery | Return to containment, preserve last known confirmed state and drafts, label `UNKNOWN/NOT_RESTORE_CERTIFIED`, notify Design and wait for independent evidence; do not keep retrying destructive restore |

A production deployment or rollback may itself be a mutation of system behavior/data and requires a **new explicit authorization** specifying exact artifacts, backup state and rollback route, not merely a previously approved plan.

## 9. Operations checklist and explicit STOP / resumption conditions

| Time | Future operator checklist (not run) | Failure/STOP |
| --- | --- | --- |
| **Before a separately authorized synthetic QA run** | Pin execution scope/branch/path/base/HEAD and fixture hash; verify no live endpoint, fake credentials, redaction tests, deterministic late-write/concurrency cases, targeted permissions and test commands | Any real account/PDF touched, unsafe HTTP auth, outside-allowlist file or missing scope ⇒ STOP |
| **Before any real provider/device test** | Confirm independent local QA + Design disposition and **separately approved ACCESS-02 or Zotero/device test decision**; verify TLS, host allowlist, request/file budgets, cleanup and incident contact; no accidental data sync | No permission, unsafe host, 401/429 or unexpected unauthorized write ⇒ STOP/contain |
| **Before production release (G7)** | Finalize supplier, region/DPA, credentials and revocation, session store, environment isolation, cost/alert budget, SLO/retention parameters, real storage CAS, consistent backup+restore proof, independent cross-module/device/a11 QA, safe rollback, explicit Design release approval | Any P0/P1, unknown critical storage proof, unverified backup, unauthorized billing/region or missing owner ⇒ NO DEPLOY |
| **During hypothetical operation** | Inspect coarse API outcomes/unknown and auth failures with privacy-safe logs, react to 401/429, honor upstream quotas, monitor backup certification only where proven | Do not treat missing telemetry as healthy; repeated or unresolvable UNKNOWN ⇒ isolate writes and escalate |
| **After incident / before resuming** | Confirm contained risk, protected last-confirmed data/drafts, working scoped credentials, proven durable outcomes, exact remediated SHA, independent negative tests, approved rollback/restore and explicit Design acceptance | QA only LOCAL/mock, pending ambiguous write, secret rotation unverified or false success risk ⇒ REMAIN BLOCKED |
| **After recovery** | Record sanitized post-incident summary, controls that actually worked, limits and newly discovered risks, linked exact QA artifacts and separately authorized corrective backlog | Never silently wipe logs/exports, claim all copies deleted or run unapproved automation |

**Resumption gate:** only after (a) a known-credible root-cause fix or isolation, (b) safety of data/permissions established and outstanding UNKNOWN operations reconciled *or explicitly safely quarantined*, (c) separately authorized implementation and independent QA on **the exact immutable SHA and approved environment**, and (d) an explicit Design disposition appropriate to the stage. **An alert clearing is not a PASS, and a mock PASS is not a production recovery pass**.

## 10. Planned A11 validation register — all NOT RUN

| ID | Future separately authorized synthetic/QA verification |
| --- | --- |
| **A11-01** | API request/latency counters use route templates and bounded cardinality, no user/project/title labels |
| **A11-02** | Confirmed/Conflict/Definite Failure/Unknown emitted separately; 202 or proxy 200 does not increment persisted-confirmed |
| **A11-03** | Delayed upstream commit after timeout still `UNKNOWN` while unfenced; no false terminal failure, no retry PUT |
| **A11-04** | Log/trace negative secrets scan: Cookie, CSRF, Zotero key, WebDAV Basic, query URI, full Note/Quote/PDF never captured |
| **A11-05** | Synthetic simulated credential leak leads to STOP, rotation/revocation *plan* and unaffected drafts (no actual credential test) |
| **A11-06** | Unauthorized/expired Session and foreign Project attempt triggers scoped rejection without metadata/identity leakage |
| **A11-07** | Synthetic 429/Backoff/Retry-After and API 5xx do not cause unbounded requests or mislabel missing source as deleted |
| **A11-08** | P0/P1/P2 evidence classification and STOP→independent QA→Design acceptance do not auto-merge/auto-resume |
| **A11-09** | Mixed-revision export, missing record and corrupt hash produce NOT_RESTORE_CERTIFIED, not success |
| **A11-10** | Isolated restore of older backup with deleted Project blocks resurrection when marker coverage cannot be proved |
| **A11-11** | Rollback of irreversible schema change is blocked; compatible API release rollback retains operation identity and drafts |
| **A11-12** | Cloud-provider-agnostic runbook on mock environment; no Render/Workers/Hetzner account or paid monitoring created |
| **A11-13** | Mobile Zotero L1/L2/L3 status remains NOT_RUN without physical-device proof; no PDF/log copied |
| **A11-14** | Clean alert vs authoritative persistence distinction: alert resolved cannot silently mark an ambiguous operation confirmed |
| **A11-15** | Independent QA report pins full tested SHA/environment, literal commands, actual outcome, redacted evidence and risk/resume gate |
| **A11-16** | Current POC-001 branch/base/REMEDIATION unchanged; prior LOCAL_STAGE PARTIAL remains and ACCESS-02 still BLOCKED |

These are **16 proposed future A11 tests**, independent from Module 002's **26 frozen U6 tests (NOT RUN)**, D007-A4..A8's **60 planned tests (NOT RUN)**, and existing POC-001 QA on its original SHA (**LOCAL_STAGE PARTIAL**). They do **not** amend current POC-001 regression obligations or authorize test code, monitoring installation, real credential handling, device tests or cloud service deployment.

## 11. Deferred operational decisions and next design gate

**Not selected:** alert provider or destination, log/trace storage, privacy/retention days, notification cadence, downtime budget, cost cap, p95/p99/SLO/SLI numerical thresholds, RPO/RTO targets, escalation roster/on-call obligations, backup version count, encryption/KMS product, domain, EU subprocessor certification, paid account or implementation workflow. These require separate decisions and real-world evidence before release.

**Next proposed independent design decision: D007-A12 — quality-of-service, performance and capacity budget design**, using three documented synthetic load scenarios and explicit thresholds-to-be-decided for latency, concurrent sessions, request/egress quotas, availability assumptions, RPO/RTO and cost alerts. This is **design-only** and may be drafted without running load tests, selecting a provider, or changing POC-001 execution.

**FINAL DISPOSITION: D007-A11 OPTION B APPROVED AS SECURITY/OPERATIONS DESIGN ONLY; NO ACTUAL MONITORS, INCIDENT ACTIONS, SECRETS, BACKUPS, RESTORES, CODE, CLOUD SERVICES OR DEPLOYMENT RUN.**
