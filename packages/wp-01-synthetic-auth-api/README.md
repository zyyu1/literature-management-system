# WP-01 — synthetic Auth / Session / safe-API contract double

**Status: LOCAL_SYNTHETIC_ONLY. Not production-suitable. Not a real API.**
Authority: D007-A21 (G1), `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`, egress amendment D007-A54.
Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`. Fixture `docs/handoffs/WP-01/fixtures/wp01.v1.json`
(SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`, read-only).

## What this is
An in-process Node.js **v22.23.5** server factory, built only from Node core modules. It binds
**127.0.0.1 port 0** only, and only when a test calls `listen()`. Importing the module starts nothing.
Every principal, Session, Project, outcome and clock value comes from the frozen fake fixture.

| Area | Mocked behaviour | Not proven / not implemented |
| --- | --- | --- |
| Session | Opaque random 256-bit tokens, mapped to fixture Sessions (ACTIVE / REVOKED / EXPIRED). A fake clock (`2030-01-02T03:04:05Z` + advance) drives expiry. Renewal rotates the token and CSRF token, and never extends the absolute expiry. Logout revokes only that Session. | Real Session duration, a durable or cross-instance store, real revocation propagation, identity provider, MFA, recovery |
| Cookie | `Set-Cookie: __Host-lms_session=…; Path=/; Secure; HttpOnly; SameSite=Lax`, with no `Domain` | **Syntactic only** over HTTP loopback. No browser, HTTPS or real cookie-jar proof (A14 B14-M* remain NOT RUN) |
| Origin / CORS / CSRF | For unsafe methods, checks run in this order: exact Origin allowlist (`https://app.wp01.invalid`), then `Sec-Fetch-Site` ∈ {same-origin, same-site} (fail closed when absent), then JSON body ≤ 64 KiB, then Session, then a Session-bound synchronizer CSRF token. Every request gets `Vary: Origin`. Credentialed ACAO is sent only for the exact allowed Origin. Preflight is exact, and a denied preflight gets no ACAO. | Origins are header strings only. No DNS, TLS or browser behaviour |
| Authorization | OWNER reads own Projects. WORKSPACE_READONLY gets a scoped projection only. FOREIGN, ANONYMOUS and missing resources all get the identical neutral `403 NOT_AVAILABLE`. | Real ACL store |
| R2 / Step-up | Project DELETE, All Unlink and revoke-other Sessions always return `403 STEP_UP_REQUIRED` with no dispatch. Client-claimed step-up headers are ignored. MFA enrollment and export return `FEATURE_DISABLED`. | **Permanent Project Delete, All Unlink and every real mutation stay DISABLED.** No MFA, no step-up UX |
| Outcomes (A5) | One fake mutation (`SET_ARCHIVED`) on in-memory state. Its outcome comes from an injected fixture scenario: 200 CONFIRMED (only this one is `saved:true`), 412 CONFLICT, 403 DEFINITE_FAILURE (not dispatched), 504 UNKNOWN (lost ACK, may have committed), 202 UNKNOWN (never Saved). `If-Match` is required: missing gives 428, stale gives 412. | No durable write, ledger, exactly-once or cross-process idempotency |
| Operation ledger | Per-principal, in-memory, `EPHEMERAL_TEST_ONLY`, `authoritative:false`. A reused `operationId` never dispatches again: same fingerprint gives 409 `OPERATION_ID_REUSED` carrying the original context, and a different one gives 409 `OPERATION_FINGERPRINT_MISMATCH`. | Not a verification mechanism for production |
| Transport | The server refuses any non-`127.0.0.1` bind and any non-zero port. It rejects paths that are not origin-form, traversal and encoded separators, and prototype keys. It never redirects off the frontend origin. The test client (`support/harness.mjs`) refuses non-loopback URLs before any socket and never follows redirects. | — |
| Limits (WP-01 test limits, not SLOs) | Request body 64 KiB (413), response body 256 KiB (bounded 500 `RESPONSE_LIMIT`), at most 5000 requests per server instance (429). Tests may lower the request budget, never raise it. | Not D007 production SLOs or ACCESS-02 limits |
| Logs | In-memory only, fields `t, method, route-template, status, code`. Never headers, cookies, tokens, bodies or raw paths. | No real logger or audit trail |

## Layout
- `src/server.mjs`: the server factory `createSyntheticAuthServer({ fixture, … })`.
- `src/store.mjs`: ephemeral fake state, the fake backend and the test control API.
- `src/policy.mjs`: constants and pure validators.
- `support/harness.mjs`: **test support only**. It holds the fixture loader with a SHA guard, the loopback fake client, and the A5 local-draft model. It is kept out of `test/` so that `node --test` does not run it as a test file.
- `test/*.test.mjs`: six independent test files.
  - `auth-contract`: Q01 and Q10.
  - `session-revocation`: Q03 and Q05.
  - `origin-csrf`: Q04.
  - `scope-workspace`: Q02 and Q07.
  - `outcome-unknown`: Q06 and Q09.
  - `transport-negative`: Q08 plus the egress precondition.

All 13 fixture `adversarialCases` are exercised by ID: AUTH-01..04, SESS-01/02, ORIGIN-01, CSRF-01, STEPUP-01, OUTCOME-01/02, PATH-01 and REDIRECT-01.

## Exact commands (D007-A54: every test and server command runs inside the network namespace)
From the repository root (git itself runs outside the namespace):
```bash
mkdir -p /tmp/offline && for f in run-offline.sh lo-up.py egress-probe.mjs; do git show origin/main:tools/offline/$f > /tmp/offline/$f; done && chmod +x /tmp/offline/run-offline.sh
/tmp/offline/run-offline.sh node /tmp/offline/egress-probe.mjs          # must print EGRESS_PROBE=PASS, exit 0
cd packages/wp-01-synthetic-auth-api
node --check src/server.mjs
/tmp/offline/run-offline.sh env -i PATH=/opt/node22/bin:/usr/bin:/bin HOME=/tmp LANG=C.UTF-8 node --test
```
`env -i` gives the tests an empty environment, so no host token or proxy variable is visible to them. Adjust `PATH` so that it resolves Node v22.23.5. `test/transport-negative.test.mjs` fails closed when any interface other than `lo` exists, or when a proxy variable is set. In other words, **the suite fails outside the namespace** rather than touching the network.

## Status semantics
`outcome` is the A5 write outcome and is separate from the HTTP status. `saved:true` appears **only** for an authoritative fake CONFIRMED. `202`, `504`, a dropped connection, and a later `401` leave the client in UNKNOWN: it keeps its draft and `operationId`, and it never replays automatically. Pre-dispatch denials report `outcome: DEFINITE_FAILURE, dispatched: false`.

## Not covered (explicitly unsupported)
- Real TLS, a real browser, or real cookie behaviour.
- A real identity provider, MFA or recovery.
- Durable storage, backup or operation verification.
- Zotero, Nutstore or WebDAV.
- Cross-instance revocation or idempotency.
- Any frontend or UI.
- The original 26 U6 / 60 A4–A8 system cases.

Gates: G4, G5, G6 and G7 are not claimed.
