# POC-001 — WebDAV + safe API feasibility (LOCAL MOCK ONLY)

> **Boundary.** Every result in this directory comes from a **loopback in-repo mock WebDAV server** and **synthetic data**. Nothing here contacts Nutstore, Zotero, or any external host. **Real Nutstore: `BLOCKED_REAL_SERVICE` / NOT RUN.** These results show the intended client/API logic works. They do **not** show that a real provider offers the required semantics, especially atomic `If-Match`.

Authorized by [`docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md`](../../docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md) (base `main` `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`). This is not a product, website UI, or deployable server.

## Run

Requires Node ≥ 22.21 and no install step: there are zero third-party dependencies.

```bash
cd poc/001
npm run check      # node --check on all .mjs files
npm test           # node --test "test/*.test.mjs"  (33 tests, POC-01..07)
npm run scan       # heuristic secret / private-endpoint / data-file scan of the change set vs origin/main
npm run mutation   # injects 6 known defects into a temp copy; each must make its suite fail
npm run evidence   # runs all of the above per area, writes evidence/*.txt + evidence/results.json
```

## Architecture under test

```text
client process (src/client.mjs)       knows only: API origin + bearer session token
      │ HTTP, 127.0.0.1
      ▼
safe API process(es) (src/safe-api.mjs, src/api-main.mjs)
      │  · bearer auth, Origin check, no CORS, no query params, kind/id allowlist
      │  · schema validation; Operation-Id ledger; conditional writes only
      │  · read-back verification; Unknown → explicit /api/operations/:id verify
      │  · export bundle (sha256 manifest) / restore into fresh `restore-*` namespace
      ▼
WebDAV adapter (src/webdav-adapter.mjs)   only holder of credentials; loopback-only (default-deny)
      │ HTTP Basic, If-Match / If-None-Match
      ▼
mock WebDAV (src/mock-webdav.mjs)   in-memory; atomic check-and-set in one event-loop turn;
                                    fault injection; request barrier to force real overlaps
```

Storage layout: `/lms-poc/<namespace>/{notes,projects,progress}/<id>.json`, with each file holding a JSON envelope `{schema, kind, id, operationId, data}`. Notes have the five D004 fields. Markdown is an **export** format (`GET /api/records/notes/:id/markdown`). It carries per-field byte length and sha256 markers, so it parses back byte-identical. The literature ID is `lit-<zoteroLibraryId>-<itemKey lower-cased>`; that mapping is one-to-one because Zotero keys are `[A-Z0-9]{8}`. Every fixture is synthetic: library `9000001`, and keys start with `S`.

## Write outcome model

| Upstream result | Adapter outcome | API response | Meaning for UI |
|---|---|---|---|
| 2xx + read-back with same ETag and sha256 | committed | `200 saved` | may show **Saved** |
| 2xx but read-back ETag differs or is unavailable | committed | `202 committed_unverified` | not "Saved" |
| 2xx but read-back bytes differ | committed | `502 verification_failed` | not saved, integrity problem |
| 412 | precondition_failed | `412 conflict` + current revision/record | conflict resolution |
| 401/403/409/423/429 (other 4xx) | rejected | `502/423/503 not_saved` + reason (+ Retry-After) | definite, nothing written, no auto-retry |
| connection refused / DNS | not_sent | `503 not_saved offline` | definite |
| timeout / reset after send / 5xx | **unknown** | `504 unknown` + operationId | **Unknown**: same op blocked until `verify` |

`verify` decides by **operation identity** stored in the record, not by text equality, and returns `committed`, `not_committed`, `indeterminate` or `unavailable`. After `not_committed`, a retry needs a **new** Operation-Id, which means an explicit user action.

## Dependency / reuse decision

Network access to the npm registry was **not available** in the execution environment: `registry.npmjs.org` gave `ENOTFOUND`. None of the three reviewed candidates could therefore be installed or exercised. Under `OPEN_SOURCE_REVIEW.md` ("implement a minimal local stub if safest"), the POC uses only Node built-ins: `node:http`, `node:crypto`, `node:test`, `node:child_process`.

| Candidate | License (per review doc) | Used? | Reason / follow-up |
|---|---|---|---|
| `webdav` (perry-mitchell/webdav-client) | MIT | **No, not installed** | Registry unreachable. The adapter here (~130 lines) needs only GET/PUT/MKCOL/PROPFIND/DELETE with raw conditional headers, which the review flagged as something to verify in that library. Re-evaluate before any real-service phase. |
| `webdav-server` (OpenMarshal) | Unlicense | **No, not installed** | Registry unreachable. The in-repo mock provides the needed fault injection and race barrier, which a general server would not give deterministically. |
| sabre/dav | BSD-3-Clause | **No** | Optional cross-stack check per the review. PHP is present, but Composer packages are unreachable. Not needed for the local phase. |

Installed dependency tree: **empty** (`npm ls --all` → `lms-poc-001-webdav-feasibility@0.0.0-poc`). `npm audit` was **not run**, because it needs network access and there are no dependencies to audit. Runtime: see `evidence/results.json`.

## What this does NOT prove (carried to Design / real-service gate)

1. **Atomic conditional writes on Nutstore.** POC-05 proves the API never overwrites a newer revision *if* the storage enforces `If-Match` atomically. The mock does; whether Nutstore does is untested. This is the backend blocker named in DESIGN_APPROVED §3.
2. **Provider ETag behaviour.** This covers whether ETags are returned on PUT, are strong, and change on identical-byte rewrites. The mock does all three (new ETag per write). If a provider omits the ETag on PUT, the API returns `committed_unverified` rather than `saved`.
3. **Real error semantics, quotas and rate limits** (429/503/507, lock behaviour, PROPFIND shape).
4. **Restore at scale, and across a real network.**
5. **Production concerns that are out of scope here:** auth stack, HTTPS, session issuance and expiry, persistent operation ledger (it is in-memory here, so an API restart loses the ledger; `verify` then needs `kind`/`id`/`base` query parameters), multi-instance ledger sharing, browser offline drafts.

## Known limitations of the local evidence

- The mock is the reference implementation of the semantics being tested. Mutation testing shows the tests fail when the API or adapter is broken; it cannot show the mock resembles a real provider.
- The race is forced with a barrier at the mock. Over 50 rounds both writers won some rounds, which shows the overlap was real and ordering was not fixed.
- `secret-scan.mjs` is heuristic. It skips its own pattern file and `poc02-security.test.mjs`, which deliberately contains credential-shaped negative-test strings: `user:pw@127.0.0.1` and the example host `dav.example.com`.
- There is no TypeScript and no linter, because the POC has zero dependencies. `node --check` is the only static check.
