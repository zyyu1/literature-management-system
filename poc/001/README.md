# POC-001 — WebDAV + safe API feasibility (LOCAL MOCK ONLY)

> **Boundary.** Every result in this directory comes from a **loopback in-repo mock WebDAV server** and **synthetic data**. Nothing here contacts Nutstore, Zotero, or any external host. **Real Nutstore: `BLOCKED_REAL_SERVICE` / NOT RUN.** These results show the intended client/API logic works. They do **not** show that a real provider offers the required semantics, especially atomic `If-Match`.

Authorized by [`docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md`](../../docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md) (base `main` `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`). This is not a product, website UI, or deployable server.

## Run

Requires Node ≥ 22.21 and no install step: there are zero third-party dependencies.

```bash
cd poc/001
npm run check      # node --check on all .mjs files
npm test           # node --test "test/*.test.mjs"  (POC-01..07 + REMEDIATION-01/02 regressions)
npm run scan       # heuristic secret / private-endpoint / data-file scan vs the pinned base 1c084e5
npm run mutation   # injects 23 known defects into a temp copy; each must make its suite fail
npm run evidence   # per-area runs + 5 real full-suite repetitions; rewrites evidence/*.txt + results.json
```

## Architecture under test

```text
client process (src/client.mjs)       knows only: API origin + bearer session token
      │ HTTP, 127.0.0.1
      ▼
safe API process(es) (src/safe-api.mjs, src/api-main.mjs)
      │  · bearer auth, Origin check, no CORS, no query params, kind/id allowlist
      │  · schema validation; Operation-Id ledger; conditional writes only
      │  · read-back verification; Unknown → /api/operations/:id verify (observe only)
      │    and POST /api/operations/:id/fence (the only path to a terminal not_committed)
      │  · export bundle (sha256 manifest) / restore into fresh `restore-*` namespace
      ▼
WebDAV adapter (src/webdav-adapter.mjs)   only holder of credentials; loopback-only (default-deny)
      │ HTTP Basic, If-Match / If-None-Match
      ▼
mock WebDAV (src/mock-webdav.mjs)   in-memory; atomic check-and-set in one event-loop turn;
                                    fault injection; request barrier to force real overlaps
```

Storage layout: `/lms-poc/<namespace>/{notes,projects,progress}/<id>.json`, with each file holding a JSON envelope `{schema, kind, id, operationId, dataSha256, data}`. `operationId` in the stored envelope is a **write tag**: a hash of the principal and the client's Operation-Id, so one principal cannot impersonate another principal's operation. Every read decodes strictly: schema, kind/id identity, data digest and the kind's validator. Notes have the five D004 fields. Markdown is an **export** format (`GET /api/records/notes/:id/markdown`). It carries per-field byte length and sha256 markers, so it parses back byte-identical. The literature ID is `lit-<zoteroLibraryId>-<itemKey lower-cased>`; that mapping is one-to-one because Zotero keys are `[A-Z0-9]{8}`. Every fixture is synthetic: library `9000001`, and keys start with `S`.

## Write outcome model

| Upstream result | Adapter outcome | API response | Meaning for UI |
|---|---|---|---|
| 2xx + read-back with same ETag and sha256 | committed | `200 saved` | may show **Saved** |
| 2xx but read-back ETag differs or is unavailable | committed | `202 committed_unverified` | not "Saved" |
| 2xx but read-back bytes differ | committed | `502 verification_failed` | not saved, integrity problem |
| 412 | precondition_failed | `412 conflict` + current revision/record | conflict resolution |
| 401/403/409/423/429 (other 4xx) | rejected | `502/423/503 not_saved` + reason (+ Retry-After) | definite, nothing written, no auto-retry |
| TCP connection never established (any error code) | not_sent | `503 not_saved offline` | definite |
| any error **after** the socket connected, timeout, 3xx, 5xx | **unknown** | `504 unknown` + operationId | **Unknown**: same op blocked |

Before any upstream call, the API requires `If-Match` to be **exactly one strong entity-tag in the POC profile**, or `If-None-Match: *`, never both. Lists, wildcards and malformed values → `400 invalid_if_match`. Weak tags → `400 unsupported_weak_etag`; the `W/` is never stripped. A single quoted tag **containing a comma** is legal under RFC 9110 but refused here with `400 if_match_outside_poc_profile`. This is a deliberate restricted subset, not a claim that such a tag is malformed. A write is reported `saved` only if the PUT returned a **trusted strong** ETag that the read-back returns; otherwise it is `202 committed_unverified` with reason `no_etag`, `untrusted_etag` or `readback_mismatch`.

### Resolving Unknown (REMEDIATION-01 P1-1)

| Step | Result | Terminal? |
|---|---|---|
| `GET /api/operations/:id` finds **our write tag** in the record | `committed` | yes |
| record still at `base` (or still absent for a create) | `not_yet_observed`: the original request **may still commit later** | **no** |
| record changed by someone else | `indeterminate` | no |
| `POST /api/operations/:id/fence` while still at `base` | rewrites the **current bytes** with `If-Match: base`. The result is terminal `not_committed` (fenced) **only if** the fence PUT committed **and** returned a trusted strong ETag **different from `base`** (REMEDIATION-02 P1-R1). Only then, under atomic strong comparison, can a request still in flight with `If-Match: base` never commit | yes |
| fence where the returned ETag is unchanged (content-hash ETags + identical bytes), missing, weak or untrusted, or the fence PUT was itself Unknown | `fence_not_confirmed` with a reason; the operation **stays Unknown** | **no** |
| a second fence while one is running / record externally deleted | `fence_in_progress` / `record_missing` | no |
| fence on a **create-only** operation (`base = *`) | `422 fence_unsupported_for_create`. There is no safe fence without writing a placeholder record, so the op **stays Unknown until observed** | **UNSUPPORTED** |

A replay with the same Operation-Id never re-sends upstream. It returns `operation_in_progress`, `verification_required` or the recorded terminal result. A different payload or target under the same Operation-Id is refused. After `not_committed`, a retry needs a **new** Operation-Id, which means an explicit user action. A fence changes the record's ETag but not its content, so other clients' cached revisions become stale (412 on their next write).

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
5. **Fence correctness depends on provider CAS.** The fence only proves `not_committed` if the provider's `If-Match` check is atomic. If it is not, the fence can be raced exactly like any other write.
6. **Restore target acquisition** relies on `MKCOL` failing atomically when the collection already exists. That holds in the mock and is unproven for Nutstore.
7. **Replay protection is bounded.** Terminal entries evicted from the live ledger become per-principal **tombstones** (`maxTombstonesPerPrincipal`, default 4 × `maxPerPrincipal`). Replaying a tombstoned Operation-Id is refused (`409 operation_expired` plus `priorVerdict`) and never dispatched. **Beyond that window, or after a restart, protection is UNSUPPORTED:** a forgotten Operation-Id is treated as new. Its write is still conditional on its original base revision, so it cannot overwrite newer data (412). It can, however, turn a previously recorded definite `not_saved` into a save if the record is still at that base.
8. **Provenance key portability.** Records carry an HMAC write tag and provenance under a server-held synthetic key (`POC_PROVENANCE_KEY`). Instances must share the key to read each other's records or restore each other's exports; a different key fails closed (`unauthenticated_record`). Key management and rotation are UNSUPPORTED in this POC.
9. **PROPFIND profile.** Elements are matched by namespace URI `DAV:`. `href` must be an absolute *path* inside the adapter base path; absolute-URL hrefs, DTD/entities, CDATA and bodies over 2 MB are refused (fail-closed `export_incomplete`). Real providers may use legal forms outside this profile; that is an ACCESS-02 probe item.
10. **No durable or global idempotency.** The Operation-Id ledger is **per-process memory**: scoped per principal, bounded (`maxLedgerEntries`, default 10 000), and it fails closed (`503 operation_ledger_full`) rather than evicting non-terminal entries. A restart or a second API instance does **not** share it. After a restart, `verify` needs `?kind=&id=&base=`, returns only non-terminal or observation results, and cannot fence. Two API processes **can** each forward the same Operation-Id once. Exactly-once delivery is **not** claimed.
11. **Production concerns that are out of scope here:** real TLS transport (`https:` currently **fails closed**, see P1-4), auth stack, session issuance and expiry, request budget and circuit breaker, per-run remote namespaces, audit logs, browser offline drafts.

## Known limitations of the local evidence

- The mock is the reference implementation of the semantics being tested. Mutation testing shows the tests fail when the API or adapter is broken; it cannot show the mock resembles a real provider.
- The race is forced with a barrier at the mock. Over 50 rounds both writers won some rounds, which shows the overlap was real and ordering was not fixed.
- Late commits are modelled with a `hold` fault: the mock keeps the request un-applied, then applies it after the API has timed out. This covers the QA probe-A scenario. Real network reordering is broader.
- `secret-scan.mjs` is heuristic. It skips its own pattern file and `poc02-security.test.mjs`, which deliberately contains credential-shaped negative-test strings: `user:pw@127.0.0.1` and the example host `dav.example.com`.
- There is no TypeScript and no linter, because the POC has zero dependencies. `node --check` is the only static check.

## Remediation 01 (Design commit `f7e89c4`, QA comment 7088088675)

| Finding | Fix | Regression test (`test/r01-regressions.test.mjs`) | Mutant |
|---|---|---|---|
| P1-1 late commit misclassified | verify is observe-only; `not_yet_observed` is non-terminal; terminal `not_committed` only via fence; create-fence UNSUPPORTED | late release → committed; fence then release → stays not_committed; create fence → 422 | M7 |
| P1-2 same-op TOCTOU | synchronous reservation before first await; target and payload fingerprint; `try/catch` never leaves pending | held upstream + duplicate; slow-body overlap; payload/target mismatch; exceptions before/after send | M8, M3 |
| P1-3 If-Match pass-through | single strong ETag only; `If-None-Match` only `*`; both together → 400 | 10 malformed variants + duplicate header lines → 400, zero upstream PUTs; stale valid tag → 412 | M9 |
| P1-4 https over http | `https:` throws `HTTPS_TRANSPORT_NOT_IMPLEMENTED` before any network | listener sees 0 connections and 0 Authorization headers; `api-main` exits non-zero | M10 |
| P2-5 prototype kinds | `Map`-based `isKind` on every path | records, verify, restore with 5 prototype names → refused, zero upstream | M11 |
| P2-6 restore envelope | strict `decodeEnvelope` with expected kind/id + data digest + validator; duplicates refused | self-hashed arbitrary JSON, wrong id, inner tamper, duplicate → 422 | — |
| P2-7 export omission | unrecognized file, collection or invalid record → `503 export_incomplete` | stray file, stray collection, invalid record | M12 |
| P2-8 ledger scope/bounds/errors | principal-scoped keys and write tags; bounded, fail-closed; exception handling | other token cannot verify, fence or spoof; full ledger → 503 and Unknown entries kept | — |
| P2-9 restore freshness race | in-process lock + storage `MKCOL` acquisition (no PROPFIND-then-MKCOL) | same-process and cross-instance races (MKCOL barrier) → exactly one `restored` | — |
| P2-10 test self-proof | mock `hold` / `strip-etag` / `corrupt-read`; new tests | committed_unverified, verify after restart, corrupt read, late commit | — |
| P2-11 loose validators | own-field allowlists, type checks before regex, plain-object bodies | 8 negative bodies incl. `__proto__` and coerced arrays → 422 | — |
| P2-12 transport classification | `not_sent` only if the socket never connected | closed port → not_sent; accept-then-reset / silent → unknown; 3xx not followed; truncated 2xx not data | M13 |

**Corrected claims.** The original evidence (`e1bb161`) committed **one** full-suite run; the "+5 repeat runs" claim was not backed by committed evidence. `npm run evidence` now commits five real repetitions. The earlier statements "replay never re-sends" and "verify verdicts correct" held only under the old mock fault model, and QA probes A and B refuted them. The current statements are limited to the scenarios tested above. Evidence files are sanitized of the local workspace path. The scan base is pinned to `1c084e5`.

## Remediation 02 (Design commit `f8cddd9`, re-QA comment 7088521226)

| Finding | Fix | Regression (`test/r02-regressions.test.mjs`) | Mutant |
|---|---|---|---|
| **P1-R1** fence terminal on unchanged ETag | terminal `not_committed` only if the fence PUT returned a trusted strong ETag ≠ base; otherwise `fence_not_confirmed` | **content-hash** mock: fence → not confirmed; late commit → `committed`; generation mock, race orders A and B; missing ETag | M14 |
| P2-N1 prefix-bound PROPFIND | `src/dav-xml.mjs`: namespace-URI parser, fail-closed; self/ownership/status checks | `d:` / `D:` / default / `z:` → 2 of 2; 11 malformed fixtures (missing self, foreign, truncated, DOCTYPE, unknown entity, non-DAV, 404 entry, no status, absolute URL, CDATA, > 2 MB) → `export_incomplete` | M15 |
| P2-N2 no absolute deadline | `deadlineMs` (absolute) separate from inactivity `timeoutMs`; bounded response size | byte-trickle PUT → Unknown within the deadline (not pending); trickle GET → 503; 50 kB body over a 10 kB cap → refused | M16 |
| P2-N3 re-dispatch after eviction | per-principal tombstones; `operation_expired` | 429 then evicted → replay refused, 0 PUTs; beyond window or restart → 412 (CAS), documented UNSUPPORTED | M17 |
| P2-N4 unstable principal / forgeable tags | token-derived principal id; HMAC write tag (principal, op, target, base, data) + HMAC provenance verified on read, export and restore; `restore-*` reserved | reversed token order → `indeterminate` (no poisoning); forged envelope → `unauthenticated_record` / 422; other key fails closed | M18, M19 |
| P2-N5 global ledger starvation | per-principal quota checked first (`principal_ledger_full`, before dispatch) | principal A full → 503, B still saves | M20 |
| P2-N6 fence edges | per-operation serialisation; fence Unknown → not confirmed; deleted → `record_missing` | concurrent fence → `fence_in_progress`; held fence timeout; hung fence; deletion | M21 |
| P2-N7 comma in tag | POC profile excludes `,`, distinct error code | `"a,b"` → `if_match_outside_poc_profile`; lists → `invalid_if_match`; 0 upstream | M22 |
| P2-N8 weak ETags | never trusted, never stripped | weak mock: create → `committed_unverified`; update → `unsupported_weak_etag`; strong PUT/GET mismatch → `readback_mismatch` | M23 |

**Mutation-testing honesty.** The first M15 candidate ("unparseable PROPFIND treated as an empty list") **survived**. The export's separate self-entry check still failed closed, so that mutant exercised defence in depth rather than the parser. It was replaced by a mutant that matches elements by the `d:` prefix instead of the `DAV:` URI, which the tests kill.

**Not claimed:** exactly-once across processes or restarts; replay protection beyond the tombstone window; fence safety on a provider without atomic strong `If-Match` and changing ETags; restore authenticity across different provenance keys; any Nutstore behaviour.
