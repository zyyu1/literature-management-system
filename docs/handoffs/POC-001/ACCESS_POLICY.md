# POC-001 — ACCESS_POLICY (Real Nutstore Test Account, Design Only)

**Decision:** POC-001-ACCESS-01, user approved **Option B — two-stage access authorization**, 2026-11-23 (Europe/Berlin).  
**Status:** **SECURITY CONFIGURATION RULES APPROVED / REAL NUTSTORE ACCESS NOT AUTHORIZED**.  
**Effective scope:** POC-001 only; **does not amend** the ongoing [local/synthetic Execution Instruction](EXECUTION_INSTRUCTION.md), broaden its code allowlist, authorize account binding, or start live network tests.  
**Next separate authorization:** **POC-001-ACCESS-02**, only after local POC/independent QA preflight and explicit user approval of a reviewed secure-account configuration.

This is a **policy design document**, **not an access token, live connection approval, network instruction, deployment secret, actual QA result or proof of provider concurrency behavior**. The prior POC-001-SCOPE-01 permission to continue local/mock tests is unchanged. Independently operating Execution and QA windows may read this policy, but **must not connect to real Nutstore in reliance on this document**.

## 1. Two-stage gate and authority

| Stage | Allowed | Explicitly NOT allowed |
| --- | --- | --- |
| **Access design — NOW APPROVED** | Define isolated test-account requirements, secret handling, path limits, request budget, concurrent writes, cleanup and stop checks as future acceptance requirements | Test login, reveal secrets in chat/Git, connect real WebDAV, create an account on behalf of user, store an app password in CI, make a live request, perform cloud read/write/delete |
| **Local synthetic phase — independently already authorized** | Continue loopback mock WebDAV, isolated synthetic five-field Markdown/JSON, local safety API and fault injection on the approved execution branch | A hidden “smoke” request to Nutstore, silently substituting user files, live test-account login, changing the frozen UI/POC implementation scope |
| **Real test-account stage — BLOCKED until POC-001-ACCESS-02** | Only after exact SHA/local-QA evidence and separately approved access procedure may a bounded isolated remote CRUD/concurrency/recovery protocol test be authorized | Implicit activation merely because this policy is approved or a secret is available |

## 2. Separate account and credential isolation

1. Use a **separate, disposable, user-controlled second Nutstore test account**, never the current account syncing Zotero PDF attachments or any personal documents. The test account should contain **no user research content or other valuable files**, even outside the POC directory. Prefer a dedicated service-specific/app-specific WebDAV password where Nutstore currently supports it; **never reuse the interactive/main account password**. Independent app password is **not** proof of folder-scoped access; assume its effective permissions can reach account files until tested.
2. Credential acquisition and configuration require a further explicit user approval. When approved later, inject credentials **out of band** into controlled server-side/local process environment or appropriately scoped secret storage. **Never type credentials into ChatGPT, Git commits, PRs/issues, plaintext config, shell history, URLs, frontend bundles, request query parameters, browser local storage, screenshots or logs.** Avoid shell commands that echo secrets; redact authorization headers and trace fields.
3. WebDAV access terminates at a **server-side safe API**; browser-like test clients are never handed WebDAV username/app password or direct unrestricted upstream URL. Enforce TLS certificate validation and approved domain/endpoint identity; no insecure TLS override, unrestricted proxy, attacker-controlled redirects/target URLs, telemetry to third-party servers or reuse of the account credential for Zotero.
4. Do not expose real accounts to GitHub Actions/shared CI or public-hosted services by this approval. If a later authorized remote test uses a runner or host, its network reachability, auditability, secret boundary, authorized operators, deletion policy and exact SHA must be separately reviewed first.

## 3. Single isolated namespace and least-privilege operations

- Future remote tests may touch **only a dedicated namespace such as `/LMS-POC-001/<random-disposable-run-id>/`**, created after POC-001-ACCESS-02 approval. This is an **application-enforced restriction**, not a claim that Nutstore's app password is folder-limited. The clean test account is an additional safety boundary.
- Safe API and WebDAV adapter must pin an **explicitly approved HTTPS WebDAV host** (defined in access-stage configuration, not assumed here), port/path scope, allowed HTTP verbs and per-run directory. Treat all remote target paths as untrusted: canonicalize/decode once consistently; reject dot traversal, encoded separators/dot segments, absolute path escape, control bytes, foreign host, cross-run references and unsafe redirected targets. Never accept a user-provided arbitrary URL or act as SSRF proxy.
- **Allowlisted operations:** non-recursive test-directory initialization, list/stat/read, controlled create/update and **individual test-file deletion** within the dedicated run directory. Root/account-wide `DELETE`, recursive removal, `MOVE`/rename outside the namespace, broad search, real-file overwrite and mass cleanup are prohibited. Cleanup requires an audited explicit per-file allowlist and identity check; refusal to clean is safer than ambiguous deletion.
- Retain only generated synthetic JSON/Markdown with fake paper IDs and five invented text fields, never real Zotero item keys, PDFs, personal notes, account file listings or a copied real Zotero WebDAV library.

## 4. Remote resource budget (policy safety ceilings, not provider guarantees)

| Control | Initial maximum for a separately approved remote test |
| --- | --- |
| Files created per single test run | **20 synthetic files** |
| File payload size | **1 MiB per file** (and total run data **20 MiB**) |
| WebDAV requests | **100 requests in any rolling 30-minute window**, counting authentication/probes, HEAD/PROPFIND, reads, writes and cleanup; stop rather than exceed |
| Parallel writers | **2 independent clients** initially |
| Data target | Exactly one pre-approved synthetic run subdirectory; no Zotero attachment account |
| Transport | HTTPS only with certificate validation; no unreviewed public server or exposed port |

The limits above are **self-imposed defaults** for risk reduction, not a claim about Nutstore's published account quota or service limits. Future live execution must also respect the then-current actual provider quota and select the *stricter* limit. A lower ceiling, rate-limit event, authorization failure or 429 must halt/reassess rather than aggressively retry. If meaningful coverage requires a higher cap, obtain a separate amendment before increasing it. Budget the cleanup within the same request allowance.

## 5. Atomic concurrency, unknown outcomes and data integrity

- On the real provider, assess whether **ETag plus `If-Match`** or a documented equivalent is genuinely enforced **atomically across independent clients/processes**. Require a deterministic stale-writer race, verified conflict response (for example HTTP 412 where actually supported), preservation of the acknowledged winning revision and negative cases. A returned ETag **alone is insufficient**; mock pass, a read-then-write check, sequential requests or a process-local mutex do **not** prove provider-side atomic writes.
- After a timeout or lost acknowledgment, label the attempt **UNKNOWN — needs authoritative verification**. Do not report failure/success from network silence, blindly retry, or infer success simply because current bytes match. Verify using reliable version/operation evidence if available; otherwise keep UNKNOWN and halt dependent writes.
- Cover 401/403/409/412/423/429/5xx, expired password, connection resets, unsafe redirect, malformed path and backup-restoration failures without destructive operations. **No automatic background retry, polling, service selection or durable multi-device queue** is authorized by this policy.
- Maintain a synthetic backup/export before destructive test steps. Restore only to a **fresh isolated** run directory, validate hashes and fake IDs; never restore into or wipe an existing user's directory.

## 6. Minimal audit, revocation and incident response

- Record exact approved code/PR SHA, run identifier, test timestamp, synthetic target IDs, operation category, *redacted* HTTP status/error class, request-budget counters, before/after synthetic content hashes, test outcome and cleanup result. No credential, Authorization header, private WebDAV endpoint parameters, full account listing, user data or copied file body in logs or PRs.
- At end, inventory generated synthetic files and delete **only the confirmed per-run allowlist** using safe per-file operations, then verify empty run namespace without broad account traversal. If deletion state is ambiguous, **STOP and request manual review**; do not recursively delete to make a green report.
- Revoke the dedicated app password after testing or immediately upon suspected credential leakage, account scope violation, unauthorized host redirect, SSL verification failure or compromised test environment. Rotate/disable any exposed credential by the account owner through an out-of-band process; do not publish it as evidence.
- On a P0-like event (secret exposure, unauthorized file access, overwrite of unrelated data, stale-write loss, missing atomic protection accepted as safe, false confirmation or unbounded retry), **STOP, quarantine the test, document sanitized evidence and escalate to the Design window**. Do not resume or change backend strategy without user approval.

## 7. Mandatory future ACCESS-02 preflight and handoff

**Access-02 cannot be granted merely by finishing local coding.** Prior to any live login, Design must receive:
1. Exact isolated execution PR SHA and **independent local-stage QA** findings for POC-01..07, including negative security tests and any P0/P1 blockers. A local PASS is not a remote PASS.
2. User-confirmed *disposable separate test-account* readiness, an explicit plan for app-specific password generation, approved host identity, secret injection mechanism, operators/test device, storage of no personal files, and revocation path. **Do not send credentials in chat or repository.**
3. A revised, **bounded** remote experiment sheet listing which commands will run, run path, operation/file/size/request budgets, how HTTP statuses and ETags are captured safely, two-client race method, stop conditions and per-file cleanup/restore.
4. A separate affirmative user **POC-001-ACCESS-02** authorization identifying the exact target branch/commit and approved secure connection method, before the **first** real request. Design must publish an explicit narrow instruction/amendment; until then POC-001-SCOPE-01's local-only instruction remains controlling.
5. Independent QA after execution at exact PR SHA with distinct **MOCK / REAL-NUTSTORE** results, plus Design acceptance and separate merge authority; never auto-declare overall POC PASS.

**Status:** POC-001-ACCESS-01 **APPROVED AS POLICY ONLY**. **REAL NUTSTORE CONNECTION: BLOCKED**. **EXISTING LOCAL EXECUTION: UNCHANGED**. **QA: NOT RUN**.
