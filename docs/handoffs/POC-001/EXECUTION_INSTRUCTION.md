# POC-001 — EXECUTION_INSTRUCTION (LIMITED START AUTHORIZED)

**Decision:** POC-001-SCOPE-01 Option B, user-authorized 2026-11-23.  
**Scope:** **LOCAL/ISOLATED synthetic WebDAV and safe API feasibility ONLY**.  
**Status:** **EXECUTION_AUTHORIZED** for the narrow local phase. **No live Nutstore access authorization**.  
**Required reads:** [DESIGN_APPROVED.md](DESIGN_APPROVED.md), [OPEN_SOURCE_REVIEW.md](OPEN_SOURCE_REVIEW.md), [STATUS.md](STATUS.md), [frozen UI/interaction boundary](../../ui/002/DESIGN_APPROVED.md), [Three-Window Protocol](../../governance/THREE_WINDOW_PROTOCOL.md).  
**Base branch:** accepted current `main` as of the published POC handoff; record exact SHA in PR. The previously frozen UI source remains separate and unchanged.

## EXECUTION WINDOW: mandatory preflight

1. Fetch GitHub latest `main`, verify correct repository `zyyu1/literature-management-system`, clean `git status --short`, branch/origin and exact SHA. Read these handoff documents and the no-secrets rules. If base changed after reading, re-fetch and stop to reconcile.
2. Create isolated branch **`exec/POC-001-webdav-feasibility`** from accepted `main`; never develop on or push code directly to `main`.
3. Review the **three GitHub candidates** on five factors (Stars/current update/license/stack/deployment), licensing and lockfile risks per `OPEN_SOURCE_REVIEW.md`; select only justifiable dependencies or implement a minimal local stub if safest. Record pinned versions and reuse rationale in PR.
4. Use only **synthetic JSON/Markdown** test records: five note fields, fake IDs, Unicode, math and long text. Never load Zotero data, real paper PDFs, research notes, browser sync exports, passwords, Nutstore app credentials or personal URLs.
5. Develop a *minimal* loopback (`127.0.0.1`) safe API + WebDAV adapter/mock in `poc/001/**`, optional isolated `tests/poc/001/**`. Do **not** build full website UI, authentication production stack, deployment, Zotero authorization, persistent job queue or new cloud account integration. Keep all real account networking disabled/default-deny.
6. Execute deterministic **POC-01..07** in local mode, including negative security tests; for each record command, exit code, expected/actual, fixture identity, provider kind `MOCK`, and evidence. Provide separate statuses `PASS_LOCAL`, `FAIL`, `BLOCKED_REAL_SERVICE`, `NOT_RUN` as appropriate, **not** `POC PASS`.
7. Explicitly probe atomic read-modify-write: stale two-writer race, `If-Match`/ETag/HTTP 412 semantics or an actually safe alternative under multiple independent processes. **Do not** assert that a local mutex, serial queue, WebDAV library feature or mock server proves safe provider-wide concurrency.
8. Test timeouts after remote may have committed, 401/403/409/412/423/429/5xx, corrupt write, stale source, dedup/retry and restoration from export in separate synthetic namespace. Unknown acknowledgment → **Unknown**, no implicit retry, never display false Saved.
9. STOP before any real Nutstore account login, credentials, external WebDAV URL, user cloud data, hosting or production integration. Request a **separate user approval of secure account configuration and access**. An unapproved live credential in local environment or CI also violates scope.
10. Run relevant isolated lint/typecheck/tests and dependency/security checks. Audit changed paths and artifacts for secrets/private content. Open a PR, publish an exact SHA **QA_HANDOFF** summary with command output/exit codes, test matrix, threat/security observations, known failures and explicitly blocked real-service cases. **STOP**, do not merge or claim QA PASS.

## Execution path allowlist

**Allowed for future execution PR only:** `poc/001/**` (separate package manifest/lockfile, local tests/docs/fixtures/adapter) and `tests/poc/001/**` if test separation is needed; QA handoff documentation at `docs/handoffs/POC-001/QA_HANDOFF.md` only when actual execution is ready. No root `package.json` or global workflow modifications, no `app/**`, `src/**`, existing site behavior, UI freeze, requirements baseline, authentication providers, external deploy configuration, Git secrets or permanent migration. If dependency wiring demands other paths, stop and seek new scoped approval before editing.

**Explicitly disallowed:** real Nutstore WebDAV requests/config, new real account setup, real paper/note/PDF data, Zotero API login/annotation modification, third-party automatic telemetry, direct `main` merge, replacing D007 storage option, shipping any server. Local mock listener must bind loopback only, avoid production secrets and arbitrary URL fetch SSRF.

## Test matrix / artifacts

| Area | Mandatory synthetic proof | Stop/failure evidence |
| --- | --- | --- |
| POC-01 | CRUD exact round trip | Unexpected overwrite, loss or HTTP errors |
| POC-02 | Server-side credential boundary, URL/path allowlist, forbidden client secrets | Exposed secret/SSRF/unauthorized access is P0 |
| POC-03 | JSON/Markdown Unicode, 5 fields, integrity/digest | Source corruption, invalid roundtrip |
| POC-04 | Two independent mock clients, read after confirmed save | Incorrect last-confirmed state |
| POC-05 | Deterministic concurrent stale writers; no lost update | Any unauthorized overwrite is P0; missing atomic primitive is backend blocker |
| POC-06 | 401/403/409/412/423/429/5xx, timeout and lost acknowledgment | False `Saved`, blind retry, lost context |
| POC-07 | Export, restore fresh namespace, compare hashes/IDs | Missing or invalid restoration |
| Real Nutstore | **BLOCKED** pending separate user secure-account approval | Do not perform |

Before QA, publish a test evidence summary with exact commit SHA, dependencies and versions, OS/Node runtime, commands/exit codes and a clear `LOCAL MOCK ONLY` boundary. Follow [Three-Window Protocol](../../governance/THREE_WINDOW_PROTOCOL.md).

## QA HANDOFF and STOP

QA must independently read exact PR SHA and `DESIGN_APPROVED.md`, reproduce at least POC-01..07 local scenarios and inspect negative/security paths, race correctness, license/lockfile and source scope. QA reports **LOCAL_STAGE PASS/PARTIAL/FAIL** and **OVERALL POC-001 BLOCKED (REAL SERVICE NOT RUN)** unless the later separate live account gate has been approved and executed. QA may not modify code while claiming independence. Design alone makes later acceptance and merge decision; no automatic continuation after PR or QA.
