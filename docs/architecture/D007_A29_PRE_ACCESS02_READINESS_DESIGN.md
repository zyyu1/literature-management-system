# D007-A29 — POC-001 Pre-ACCESS-02 Readiness Architecture and Residual-Risk Policy (Option B)

**User decision: D007-A29 Option B APPROVED — 2026-11-24, Europe/Berlin.**
**Classification: DESIGN/POLICY/READINESS CRITERIA ONLY. This document creates NO G1 implementation or local-test authority, NO G5 merge authority, NO G6/POC-001-ACCESS-02 real-provider authorization, and NO G7 deployment authority.**
**Readiness conclusion: DESIGN MATRIX DEFINED / ACCESS02_REQUEST_NOT_READY / G6_BLOCKED / OVERALL POC-001 BLOCKED_REAL_SERVICE.** An approved readiness policy is NOT an observed passing preflight.

## 1. Authority and immutable evidence

- [D007-A28 exact-SHA G4 decision](D007_A28_POC001_G4_LOCAL_DISPOSITION.md): `G4 ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS_SYNTHETIC` only at PR #2 `ace7b1e610529c1f139dc06371d9f531ccf0e28b`. [Independent QA comment #7121490151](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7121490151) verifies `153/153 ×5`, `51/51` repo mutants, `16/16` QA-owned variants, bounded synthetic request proof. Preserve one-time QA-1 credential preflight deviation disclosure and QA-4 same-runtime limitation; neither is precedent to skip future checks.
- Branch `exec/POC-001-webdav-feasibility`, immutable original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; PR #2 OPEN/UNMERGED at A29 preflight; no rebase/main merge/force push or path changes. The newest POC source remains an isolated synthetic proof, **not** a deployable real WebDAV client.
- [ACCESS-01 SECURITY POLICY](../handoffs/POC-001/ACCESS_POLICY.md) is the governing, unchanged real-test ceiling and secret/cleanup policy; [D007-A5](D007_A5_API_CONTRACT.md) defines CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN, [D007-A6](D007_A6_DATA_SCHEMA_RECOVERY.md) defines snapshot/manifest/restore truthfulness, [D007-A11](D007_A11_OPERATIONS_RUNBOOK.md) defines safe operations, [D007-A12](D007_A12_QOS_CAPACITY_BUDGET.md) separates workload hypotheses from observed provider QoS, [D007-A13](D007_A13_ENVIRONMENT_ISOLATION.md) isolates environment and credentials, [D007-A17](D007_A17_KEY_HIERARCHY_BACKUP_ENCRYPTION.md) separates encryption from completeness.
- [Precheck matrix](../handoffs/POC-001/ACCESS02_PRECHECK_MATRIX.md) and [future ACCESS-02 request packet template](../handoffs/POC-001/ACCESS02_REQUEST_PACKET_TEMPLATE.md) are approved design artifacts only. The authoritative original `ACCESS_POLICY.md` and any original Execution/R01–R07 instruction remain unchanged.

## 2. Evidence taxonomy and staged gates — avoid circular proof

**DESIGN_ACCEPTED** = this A29 policy and test specification are approved, no runtime claim.
**PRE_G6_LOCAL_QA_REQUIRED** = must receive a **new, separately authorized G1 local/synthetic execution** (if code/test changes are necessary), a fresh independent G3 on its **exact final SHA**, and separate Design G4 disposition before any ACCESS-02 application. A28's earlier G4 does not prove new TLS/readiness/UNKNOWN-policy controls.
**USER_CONFIGURATION_PENDING** = actual user confirmation that a disposable empty second account, approved host/operator, safe secrets, revocation method and cleanup environment exist; **do not create or connect them by A29**.
**PROVIDER_ONLY_AFTER_G6** = provider-specific ETag/CAS/MKCOL/PROPFIND/quotas, HTTPS peer observation and real failure characteristics may be tested **only after** a future separate, affirmative, narrowly scoped `POC-001-ACCESS-02` grant; cannot require real outcomes as prerequisites for the very permission to run first real probes.
**PRODUCTION_REMAINING_BLOCKER** = separate production-grade consistency, durability, snapshot and backup guarantees cannot be established by this bounded access test or A29.
**HARD STOP:** a missing pre-G6 safety control, changed unreviewed SHA, host/secret ambiguity, unsafe redirect, test budget exceedance, sensitive data, P0/P1, unprotected unknown write, or an unauthorized request means STOP and return to Design; do not grant implied conditional access.

### Pre-ACCESS-02 admission versus post-ACCESS-02 claims

**Before any future real request:** approve exact code/test artifact and safe egress/TLS/host/credentials protocol on independent local evidence; decide Q4/Q5 nonterminal operator policy; obtain approved limited synthetic run plan, count every call including cleanup, and establish a user-confirmed empty dedicated second account. A29 supplies *requirements*, not evidence that these are done.

**After separate G6 authorization only:** the authorized tester may discover true provider behavior within exact operation/budget/host/namespace bounds and independent QA; a failure means STOP and Design review, not silently enabling a different backend or broadening tests. Proof of a first real login is neither a general production-G6 grant nor a deployment gate.

## 3. Binding design policy decisions (A29-P01..P09)

### A29-P01 — Capacity P2-R05-2: truthful bounded mode; no invented paging

- The local `dav-xml.mjs` parser limit is **10,000 XML elements per parsed document**. Minimal synthetic listing formula `8+6*N`: N=1665 has 9,998 elements and was accepted; N=1666 has 10,004 and was rejected by **parser-level** QA. This is not a 1,665-paper universal limit or a real-provider quota. Additional legitimate properties, nesting, pagination or escaped names can change the document shape. **Full export at N=1666 remains NOT_RUN** independently.
- **Design choice:** maintain `BOUNDED_UNCERTIFIED_PROFILE`. On parser/body/response/entry/budget overload or incomplete listing, fail closed with truthful `503 export_incomplete` or appropriate safe refusal and **no partial bundle, no 200 count/completeness certificate**. Preserve confirmed existing data and zero unauthorized writes. No automatic page traversal, truncation, unbounded retries or silent fallback. If limits prevent valid expected data, report availability limitation and STOP; do not raise the limit to achieve a green test.
- To request even a bounded live experiment: produce a **locally QA-tested fixture-specific capacity envelope** with response/body bytes, parser elements/depth, request rate, time, memory peak, expected identities and failure semantics. Separate stress fixture tests from the 20-file live-account cap. Test export-level N=1665/1666 and over-limit/no-bundle/no-GET/no-write locally if a later G1 authorizes it. **Do not attempt 1,665 live records** under the 20-file policy; no production library-size or paging guarantee may be made.
- **Residual stays `P2-R05-2=CAPACITY_POLICY_PENDING`** until an explicit later verified scale policy plus independent exact-SHA evidence. This A29 defines the safe interim rule but does not close the risk or select a numeric production SLO.

### A29-P02 — Q1e: known-fixture enumeration, not arbitrary complete backup

- Root/kind PROPFIND may omit an *unknown* individual record while remaining syntactically valid. No client-side parser can prove the existence of an item the server never reveals. Multi-file read consistency, missing inventory oracle and deletion/rollback witness remain unresolved.
- **Design choice:** only a user-created **known synthetic fixture inventory** under a future authorized isolated run may support `KNOWN_FIXTURE_ENUMERATION_OBSERVED`: enumerate predeclared **fake** item IDs, compare exact identity/count/uniqueness/record hashes and parent references; reject duplicates, missing known entries, foreign IDs, out-of-order or nonrepeatable data if relevant. Quiescent writer control may establish a *test fixture* checkpoint but not universal snapshot atomicity.
- No `COMPLETE_BACKUP`, `RESTORE_CERTIFIED`, all-library exact count, full history, disaster recovery or anti-resurrection claim without an independently verified trusted manifest/snapshot/version fence and restore to a separate isolated destination. If listing omissions or concurrent modifications cannot be detected, `NON_ATOMIC / EXPORT_INCOMPLETE / NOT_RESTORE_CERTIFIED`. Never call a plain successful GET set a certified backup. A backup before a destructive synthetic step must be explicitly labelled non-certified where applicable.
- **Q1e remains `UNSUPPORTED_COMPLETENESS / PRODUCTION_BACKUP_BLOCKED`**. Decide separately whether future read-only provider characterization may use bounded fixture comparison; a universal Q1e solution requires an additional storage/manifest architecture decision, not an ACCESS-02 waiver.

### A29-P03 — Q4: admission, fairness, quota and slow-inbound safety

- Existing per-process operation ledger and quota settings do NOT establish durable exactly-once, a fair global queue or a healthy system under saturation. If `maxLedgerEntries` is smaller than summed principal allowances, contention can strand honest users. A slow incoming body may hold a reservation without completing its intent.
- **Design choice for bounded POC:** explicit finite per-principal AND global reservation budgets and a finite request-body admission/deadline profile (numeric runtime parameters **TBD, not invented**); ensure no unsafe overcommit and deterministic rejection **before dispatch** once capacity is exhausted. Deny excess requests honestly; do not expose private resource state or translate rejection into `CONFIRMED` or `DEFINITE_FAILURE` after dispatch. Avoid unbounded in-memory queues/hidden polling; maintain authenticated origin/scope checks.
- **UNKNOWN consumes its protected reservation until conclusively reconciled or explicitly quarantined by a separately approved recovery procedure**; a timer, process restart, idle-age, fairness pressure or credential rotation alone may not free the fence or replay a possibly committed write. If the bounded test cannot safely continue, **fail closed, isolate run and STOP** rather than claim progress. Fairness / throughput under real quotas remains unproven.
- **Before a future G6 request:** select and document actual per-run admission limits, max active requests, body-byte/time caps and operator STOP policy, and independently test (on new authorized local SHA) two fake principals/clients, saturation, slow inbound body, reused operationId different fingerprint, 429/refusal, network loss and restart semantics. If the control depends on changing `src/**`, it needs a separate new scoped G1 authorization; A29 grants none. `Q4=POLICY_DEFINED_LOCAL_PROOF_PENDING / RESIDUAL_POLICY_REQUIRED`.

### A29-P04 — Q5: nonterminal UNKNOWN and manual operator hold

- Applied-but-unconfirmed `Fence` can remain `indeterminate` even after failed ETag read-back, 5xx or lost acknowledgment; subsequent quota and sibling operations may remain blocked. Strong safety comes before liveness.
- **Design choice:** do not convert `UNKNOWN/indeterminate` to `CONFIRMED`, `CONFLICT` or `DEFINITE_FAILURE` from timeout, matching bytes alone, an in-memory retry token or operator intuition. No automatic re-PUT, overwrite, fence deletion, eviction, ledger reset, auto-poll, ledger-expiration retry or cancellation of the original potentially applied operation.
- **Operator runbook (DESIGN ONLY):** (1) halt the impacted operation and dependent writes, (2) retain original scoped operation ID, expected revision and redacted fence/HTTP evidence, (3) isolate run/namespace and preserve local drafts/last confirmed state, (4) permit only separately authorized **read-only** authoritative verification against a proven durable operation witness and revision oracle; ordinary matching bytes are not conclusive, (5) when no reliable witness exists leave `UNKNOWN_UNRESOLVED` and report blocked, (6) return to Design for any cleanup, ledger reset, retry or fresh-namespace follow-up decision. Restart/re-auth does not silently clear this state.
- **Pre-G6:** independently demonstrate no blind resend, no false Saved/Failed, quota retention, safe refusal under prolonged UNKNOWN, notification/stop evidence and the two-client case under local fault injection. A future bounded real test must have an operator able to STOP immediately; it does not require magically resolving an unreachable provider. `Q5=POLICY_DEFINED_LOCAL_PROOF_PENDING / RESIDUAL_POLICY_REQUIRED`.

### A29-P05 — TLS / endpoint / SSRF and egress containment

- Approved exact upstream must be **HTTPS**, with full certificate chain and hostname verification, fixed approved host, port and base path; no user-controlled URL, no `rejectUnauthorized=false`, no HTTP downgrade, redirect-to-new-origin, DNS/private-IP rebinding, encoded path traversal or credentials forwarded to another host. Exact real Nutstore hostname, transport identity, IP resolution/allowlisting technique, allowed redirects (default **none**) and effective network egress are **UNDECIDED**; DO NOT invent a hostname or port.
- The POC's current runtime is **mock/loopback only and deliberately fails closed for real HTTPS**; therefore no A28 synthetic `PASS` is evidence of usable real TLS. **A separately authorized security/transport-local G1 and independent exact-SHA QA are required before ever submitting an ACCESS-02 request.** A29 does not authorize implementing TLS support, probing external DNS, changing adapters/CI or running even a 'ping' to Nutstore.
- Required local adversarial matrix: valid pinned mock TLS peer/hostname and rejection of wrong CA, hostname mismatch, expired cert, downgrade, injected redirect, alternative host/port, private IP/SSRF, normalized/encoded traversal, cross-run namespace escape, token/header leak and egress misconfiguration. A blocked request must fail before sending credentials/upstream writes and must have redacted observability. If safe HTTPS implementation is missing, **PRE_G6_LOCAL_QA_REQUIRED**, not a hypothetical pass.
- Actual provider server certificate and DNS behavior may be confirmed only in a later, separately approved G6 bounded test; distinguishing local TLS proof from live certificate observation avoids circular authorization.

### A29-P06 — Credential/account and data isolation

- Future access account must be **a separate, disposable, user-controlled and initially empty second Nutstore account**, distinct from the existing Zotero attachment synchronization account. The account must contain no personal research/PDF content. Prefer app/service-specific credential where supported; **do not infer folder-scoped permission** from an app password. Host/username/secret must never be written in chat, Git, shell history, frontend, browser storage, tests, screenshots or logs.
- Future credential acquisition, out-of-band server-side injection, operator identity, secret masking/redaction, incident revocation and audit are all **USER_CONFIGURATION_PENDING** with an explicit later user approval; no account creation or credential entry today. Disallow cross-environment credentials and any CI/shared-runner exposure without separate permission.
- Only a single isolated application-enforced namespace `/LMS-POC-001/<random-disposable-run-id>/` may be touched after G6. No root recursion, cross-run access, broad listing, overwrite of unrelated data, recursive delete or bulk cleanup. Operations initially limited to approved nonrecursive MKCOL, scoped list/stat/read, controlled PUT and individually allowlisted per-file DELETE, with count and identity before/after.
- Real-account separation is not proven until later owner confirms it; credential redaction and path enforcement need authorized local QA first. STOP on ambiguity.

### A29-P07 — Fixed ACCESS-01 resource ceilings and accounting

The current **ACCESS-01 approved future isolated remote-test maxima** are unchanged and **must not be exceeded**:
| Dimension | Maximum |
| --- | --- |
| Files created per run | **20 synthetic files** |
| Payload | **1 MiB per file; 20 MiB total run data** |
| WebDAV requests | **100 in any rolling 30-minute period** (all authentication, metadata, PROPFIND, GET, PUT, DELETE, tests and cleanup count) |
| Writers | **2 independent clients maximum initially** |
| Namespace | **one exact approved disposable run directory** |
| Transport | **approved HTTPS endpoint, validated certificate only** |

These are precautionary test ceilings **not provider quotas, production capacity targets or achieved performance**. Future experiment sheet must calculate a per-step **worst-case operation ledger**, count retries (normally prohibited) and **reserve a cleanup budget before any write**; if remaining budget cannot accommodate authorized read-back and individual cleanup, STOP before doing more writes. Budget exhaustion, 401/429, unexpected rate limit, unauthorized host or ambiguous state ⇒ STOP, not retry-until-green. Cleanup never broadens permissions: do only confidently identified synthetic files within budget, and if identity/commit uncertain **STOP for manual review rather than forcing cleanup**. No request budget is consumed by A29 design.

### A29-P08 — Mandatory independent verification and handoff

- Execution can only implement a later work package upon new explicit user-approved exact base, branch, narrow path allowlist, local environment, fixtures and STOP contract (G1); independent QA runs in a separately opened session/window, fresh clone, own probes/mutants, exact final HEAD and source/path review. Execution coordinates QA and returns the unmodified report to Design; same-Execution-session sub-agent is not a substitute. No source may be changed by Design A29.
- Independent QA must distinguish `DESIGN_ONLY` / `SYNTHETIC_LOCAL_OBSERVED` / `PROVIDER_ONLY_AFTER_G6` / `PRODUCTION_UNSUPPORTED`, record per-command exits and NOT_RUN, refuse invalid preflight/changed SHA, scan secrets and provide process/HTTP evidence. QA PASS does not auto-approve G4 or any later access.
- Post-G6 QA, if separately authorized, must independently review host, request ledger, clean-room identity proof, actual provider responses, strong ETag/CAS conflicts, safe UNKNOWN/quarantine and per-file cleanup; user secrets must never be embedded in QA reports or GitHub comments. Real provider failures do NOT become accepted limitations by fiat; Design decides next steps.

### A29-P09 — No automatic production certification, release, vendor or work package

`POC-001-ACCESS-02` is a **separate future affirmative user G6 decision**, not a scheduled trigger. G5 PR #2 merge is independent and NOT AUTHORIZED; G7 domain/cloud release NOT AUTHORIZED; WP-01 remains separately G1-approved only; frozen Module 002 UI untouched. No Zotero API/PDF action, commercial signup, credentials, CI edit, code or implementation branch is authorized by A29. Provider failure cannot silently select PostgreSQL, another cloud, a durable ledger vendor or a higher budget.

## 4. Required readiness outcomes and hard priority

| Class / item | Current outcome | To qualify for an ACCESS-02 application |
| --- | --- | --- |
| A28 local G4, R06+R07 G3 | `ACCEPTED_EXACT_SHA@ace7b1e610529c1f139dc06371d9f531ccf0e28b` | Recheck exact source/branch/QA without drift; new local tests must be separately authorized and independently QA-reviewed |
| P2-R05-2 XML capacity | `CAPACITY_POLICY_PENDING` | Predeclared bounded synthetic profile, independent export-level failure/no partial report; production paging/scale still excluded |
| Q1e inventory/snapshot | `UNSUPPORTED_COMPLETENESS` | Only scoped known-fixture oracle and truthful non-certified export allowed; no general backup/restore claim |
| Q4 admission / slow body | `POLICY_DEFINED_LOCAL_PROOF_PENDING` | Select operational numbers; local exact-SHA independent resource/quota/slow-body STOP verification |
| Q5 indefinite UNKNOWN | `POLICY_DEFINED_LOCAL_PROOF_PENDING` | Local exact-SHA independent no-retry/quarantine/operator evidence; no forced reconciliation |
| HTTPS/host/redirect/SSRF | `DESIGN_DEFINED_LOCAL_SECURITY_PROOF_PENDING` | Separate approved secure adapter/preflight, certificate and egress tests, redacted non-leak verification |
| Disposable account + credential | `USER_CONFIGURATION_PENDING` | Owner confirms controlled empty account and secret injection/revocation plan out of band; still no credentials in Git/chat |
| Request/file/cleanup budgets | `ACCESS01_CEILINGS_DEFINED / RUN_SHEET_PENDING` | Fully counted scoped 100/30-min, 20 files, 1 MiB each, max two writers, cleanup reservation |
| Real provider ETag/CAS/PROPFIND/MKCOL/quotas | `PROVIDER_ONLY_AFTER_G6` | Specify test oracles/STOP **before** G6; actual results only after explicit authorization |
| Production snapshot/backup/ledger/durability | `PRODUCTION_REMAINING_BLOCKER` | Separate storage/restore architecture and QA; not certified by a bounded 20-file live probe |
| G5/G6/G7 | `NOT_AUTHORIZED` | Individually approved future gates; none implied by this matrix |

A29 states policy and *planned* test criteria, not a claim any new local test has run. The [machine-readable human-review matrix](../handoffs/POC-001/ACCESS02_PRECHECK_MATRIX.md) must be filled with independent evidence refs before a request; the [request packet](../handoffs/POC-001/ACCESS02_REQUEST_PACKET_TEMPLATE.md) is intentionally incomplete.

## 5. Recommended next independent decision (not approved by A29)

**D007-A30:** choose (A) scoped **pre-G6 LOCAL/SYNTHETIC readiness test and secure-transport implementation G1** with own exact starting SHA, new branch or preserved POC branch by explicit decision and strict path whitelist; (B) separate **Q1e manifest/snapshot and backup architecture decision** before any real-storage claim; or (C) advance already authorized **WP-01 synthetic-auth API** on its distinct existing pinned base/branch. No option is implicitly selected.

**D007-A29 FINAL: DESIGN_READY / ACCESS02_NOT_READY / NO NEW EXECUTION OR REAL ACCESS AUTHORIZED.**
