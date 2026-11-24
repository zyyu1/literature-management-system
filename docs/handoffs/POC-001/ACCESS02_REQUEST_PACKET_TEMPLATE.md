# POC-001 — Future ACCESS-02 User Authorization Packet Template (D007-A29; NOT SUBMITTED)

**NOT AN EXECUTION INSTRUCTION; NOT A CREDENTIAL REQUEST; NOT APPROVED TO CONNECT.** This is a *blank future application checklist* to be filled only after separate G1 local proof, independent exact-SHA G3 and Design G4. [A29 readiness decision](../../architecture/D007_A29_PRE_ACCESS02_READINESS_DESIGN.md) · [precheck matrix](ACCESS02_PRECHECK_MATRIX.md) · [unchanged ACCESS-01](ACCESS_POLICY.md). Do not copy private usernames, real endpoint query secrets, passwords, tokens, personal files or server-internal host data into GitHub/chat.

## 1. Required identity (UNFILLED / not granted)

| Required entry | Current |
| --- | --- |
| Request ID | `POC-001-ACCESS-02` — **NOT AUTHORIZED** |
| Exact proposed code HEAD at time of application | **TBD after separate local work/QA**; historical local G4 = `ace7b1e610529c1f139dc06371d9f531ccf0e28b`, not automatically current for a new adapter |
| Original execution branch/base | `exec/POC-001-webdav-feasibility` / `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` (no rebase) |
| Final approved host, port, path and identity of authorized operator | **NOT SELECTED / REQUIRE OWNER-PRIVATE CONFIG**; do not write actual secrets |
| Security implementation/local QA proof (HTTPS pin/SSRF/redirect, Q4/Q5, capacity) | **NOT_RUN / independent QA and Design pending** |
| User-confirmed empty second test account and app-password injection/revocation | **NOT CONFIRMED**; no account operation by A29 |
| Scope | One disposable namespace `/LMS-POC-001/<random-disposable-run-id>/`, generated only in future approved session |
| Budget | ≤20 synthetic files, ≤1 MiB each/≤20 MiB total, ≤100 requests per rolling 30 min **including cleanup**, max 2 writers |
| Real provider consent | **NOT REQUESTED / NOT GRANTED** |
| G5 / G7 | **NOT AUTHORIZED** independently of G6 |

## 2. Minimum written run sheet to seek user consent later

1. Evidence refs: independent full exact-SHA QA and Design disposition plus all M29-02..13 pre-G6 rows, with no unreviewed code drift.
2. Purpose: bounded fake-record/PROPFIND/ETag/conditional write/negative response discovery; explicitly exclude global backup completeness, cross-instance durable exactly-once and any production/SLO claim.
3. Environment: approved HTTPS host identity and certificate controls; fixed expected path/canonicalization; isolated runner/private credentials out-of-band; no redirects, DNS rebinding, user-selected targets or CI/public-hosted secret.
4. Plan per step: method, synthetic target ID (redacted), conditional headers (without secret), maximum requests, state oracle, expected and abnormal status, two independent clients only where needed, STOP before unsafe operation.
5. **Accounting:** before each request check rolling budget; include authentication, probes, known-good creation, negative response, read-back, per-item cleanup and failure reserve; never retry blindly or replenish budget by splitting a logical run.
6. Failure handling: unexpected HTTPS/cert/host/redirect, off-namespace path, 401/429, stale overwrite, wrong CAS, unknown fence or inability to verify identity ⇒ STOP and quarantine; do not turn UNKNOWN into failed/success automatically.
7. Cleanup: own synthetic per-file allowlist only after identity validation, never recursive/root DELETE, no deletion when uncertain; record remaining fake items and request count; separate owner-led revocation plan.
8. Independent QA plan: separately opened QA session, exact SHA, observed provider traces vs mock assertions, no personal data/secrets in GitHub, PASS/PARTIAL/FAIL and Design G4; neither QA nor Execution can authorize another live round.
9. Explicit new affirmative **user** approval for the exact host, source HEAD, run namespace, methods, operator, request/file limits and credential injection **before the first live request**. If missing, `ACCESS02_BLOCKED`.

## 3. Distinct stop/go verdicts

- `PRE_G6_LOCAL_READY`: only after new independently verified local work and Design acceptance; still **NO live access**.
- `G6_ACCESS02_REQUEST_READY`: only after account/host/run-sheet/secret review complete; ready to ask for a separately affirmative user decision, not G6 granted.
- `G6_ACCESS02_AUTHORIZED`: only by a later exact-scope explicit user approval; **NOT granted here**.
- `PROVIDER_OBSERVED`: only after bounded authorized requests, independent QA and Design disposition; still not a deployment or full backup guarantee.
- `ACCESS02_BLOCKED`: **CURRENT STATUS**. G5 merger and G7 hosting remain separately NOT AUTHORIZED.

**No current fields may be interpreted as executable commands. Do not implement a real-connection test using this template.**
