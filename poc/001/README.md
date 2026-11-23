# POC-001 — WebDAV + safe API feasibility (LOCAL MOCK ONLY)

> **Boundary.** Every result in this directory comes from a **loopback in-repo mock WebDAV server** and **synthetic data**. Nothing here contacts Nutstore, Zotero, or any external host. **Real Nutstore: `BLOCKED_REAL_SERVICE` / NOT RUN.** These results show the intended client/API logic works. They do **not** show that a real provider offers the required semantics, especially atomic `If-Match`.

Authorized by [`docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md`](../../docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md) (base `main` `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`). This is not a product, website UI, or deployable server.

## Run

Requires Node ≥ 22.21 and no install step: there are zero third-party dependencies.

```bash
cd poc/001
npm run check      # node --check on all .mjs files
npm test           # node --test "test/*.test.mjs"  (POC-01..07 + REMEDIATION-01..05 regressions)
npm run scan       # heuristic secret / private-endpoint / data-file scan vs the pinned base 1c084e5
npm run mutation   # injects 47 known defects into a temp copy; each must make its suite fail
node scripts/resource-probe.mjs [--baseline <old dav-xml.mjs>]
                   # R05: hostile XML in isolated child processes (256 MB heap, SIGKILL timeout, peak RSS)
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

Storage layout: `/lms-poc/<namespace>/{notes,projects,progress}/<id>.json`, with each file holding a JSON envelope `{schema, kind, id, operationId, dataSha256, provenance, data}`. The stored `operationId` is a **write tag**: an **HMAC under a server-held synthetic key** (`POC_PROVENANCE_KEY`). Its input is the stable principal id (derived from the token), the client's Operation-Id, kind, id, base revision and data digest. `provenance` is a second HMAC under the same key, over kind, id, write tag and data digest. Neither is a public hash, and neither can be produced without the key. Every read decodes strictly: schema, kind/id identity, data digest, the kind's validator and the provenance HMAC. A record that fails any of these is `corrupt_record` or `unauthenticated_record`, never data. Notes have the five D004 fields. Markdown is an **export** format (`GET /api/records/notes/:id/markdown`). It carries per-field byte length and sha256 markers, so it parses back byte-identical. The literature ID is `lit-<zoteroLibraryId>-<itemKey lower-cased>`; that mapping is one-to-one because Zotero keys are `[A-Z0-9]{8}`. Every fixture is synthetic: library `9000001`, and keys start with `S`.

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
| `POST /api/operations/:id/fence` while still at `base` | rewrites the **current bytes** with `If-Match: base`. The result is terminal `not_committed` (fenced) **only if** all of the following hold (REMEDIATION-02 P1-R1 + REMEDIATION-03 Q2): the fence PUT committed; it returned a trusted strong ETag ≠ `base`; a **fresh GET** of the same path returns a trusted strong ETag **equal** to the PUT's and ≠ `base`; the read-back bytes are **identical** to the fence payload; the envelope is valid and authenticated for this target; and the read-back carries no trace of our own write. Only then, under atomic strong comparison at the storage, can a request still in flight with `If-Match: base` never commit. The read-back is necessary, **not** a proof of provider CAS | yes |
| fence where the PUT ETag is unchanged (content-hash ETags + identical bytes), missing, weak or untrusted; the fence PUT was itself Unknown; or the read-back is in error, timed out, weak, has a different ETag (a dishonest PUT response), different bytes, or an invalid or unauthenticated envelope | `fence_not_confirmed` with a reason (`etag_unchanged`, `no_etag`, `untrusted_etag`, `fence_unknown`, `readback_*`); the operation **stays Unknown** | **no** |
| a second fence while one is running / record externally deleted | `fence_in_progress` / `record_missing` | no |
| fence on a **create-only** operation (`base = *`) | `422 fence_unsupported_for_create`. There is no safe fence without writing a placeholder record, so the op **stays Unknown until observed** | **UNSUPPORTED** |

**Replay protection is bounded (REMEDIATION-03 Q3).** While an Operation-Id is in **this process's live ledger, or among its retained tombstones**, a replay is not re-sent upstream. It returns `operation_in_progress`, `verification_required`, the recorded terminal result, or `409 operation_expired`. A different payload or target under the same Operation-Id is refused. Outside that window the Operation-Id is **forgotten**:
- after tombstone eviction, an API restart, or on a different API instance (instances do not share a ledger);
- a forgotten operation is dispatched again as new. A previously **saved** operation then normally gets `412 conflict`, because its base revision is stale. A previously **rejected** operation (e.g. 429 `not_saved`) **can now save** if the record is still at that base (pinned by test `R03-Q3a`);
- **no durable, cross-instance or global exactly-once guarantee is claimed.**
 After `not_committed`, a retry needs a **new** Operation-Id, which means an explicit user action. A fence changes the record's ETag but not its content, so other clients' cached revisions become stale (412 on their next write).

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
7. **Replay protection is bounded.** Terminal entries evicted from the live ledger become per-principal **tombstones** (`maxTombstonesPerPrincipal`, default 4 × `maxPerPrincipal` = 4000). Replaying a tombstoned Operation-Id is refused (`409 operation_expired` plus `priorVerdict`) and never dispatched. **Beyond that window, or after a restart, protection is UNSUPPORTED:** a forgotten Operation-Id is treated as new. Its write is still conditional on its original base revision, so it cannot overwrite newer data (412). It can, however, turn a previously recorded definite `not_saved` into a save if the record is still at that base.
8. **Provenance key portability.** Records carry an HMAC write tag and provenance under a server-held synthetic key (`POC_PROVENANCE_KEY`). Instances must share the key to read each other's records or restore each other's exports; a different key fails closed (`unauthenticated_record`). Cross-key restore portability, key management and production key rotation are UNSUPPORTED. Durable operation identity and storage-rollback protection are **not** proven (an attacker or provider restoring an older authentic version is not detected).
9. **Export completeness (REMEDIATION-03 Q1).** An export is `200` only if all of these hold: the namespace root exists with exactly one self entry; it lists **exactly one collection for each canonical kind** (`notes`, `projects`, `progress`; a missing kind is never read as empty) and nothing else; each kind listing has exactly one self entry and only well-named, non-collection record files; there is no duplicate after decoding and trailing-slash normalisation; no response carries both a response-level status and propstat; and every record decodes and authenticates. Otherwise the result is `503 export_incomplete` with a reason (`namespace_absent`, `missing_kind_collection`, `malformed_listing`, `unrecognized_entry`, `invalid_record`, `unauthenticated_record`, …). **UNSUPPORTED / provider integrity dependency:** a record silently omitted by an otherwise well-formed kind listing cannot be detected (pinned by `R03-Q1e`), and no consistent multi-file snapshot is claimed.
9a. **PROPFIND request and response profile.** **Request (REMEDIATION-05 R05-2):** every listing is a PROPFIND with an explicit body asking for **only `DAV:resourcetype`** (`<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>`), with `Content-Type: application/xml; charset=utf-8`, the exact `Content-Length` and the caller's `Depth`. It is never an empty-body (allprop) request, and there is **no fallback** to allprop after a 4xx, 5xx or unexpected response. A server that honours the request therefore never sends `DAV:lockdiscovery` or `DAV:current-user-principal`, so locked records export normally. Those properties legally contain a nested `DAV:href`, and this POC profile refuses that structure. If a server **ignores** the requested scope and returns them anyway, the export fails closed (`503 export_incomplete`). The conservative profile can therefore reject legal allprop-style responses (`lockdiscovery`, `current-user-principal`, `owner`, any property carrying a `DAV:href`). Real-provider response compatibility is **UNSUPPORTED / NOT_RUN** (synthetic mock evidence only). **Parser resource bounds (R05-1)** are enforced while parsing, before allocation: depth ≤ 64, elements ≤ 10 000, attributes ≤ 64 per element and ≤ 10 000 in total, namespace declarations ≤ 256, input ≤ 2 000 000 bytes. Inherited namespace scopes are shared, and a Map is copied only on a declaring element. Exceeding any bound gives `DAV_XML` → `503 export_incomplete`. Isolated evidence (`scripts/resource-probe.mjs`, 256 MB heap) covers the historical 442 KB / 60 000-deep and 396 KB / 50 000-deep fixtures, which now fail closed in tens of milliseconds; the pre-R05 parser exhausts its heap on them. Elements are matched by namespace URI `DAV:`. **Structure (REMEDIATION-04 R04-1)** is validated over the **whole tree**, so no subtree is skipped:
    - Every structurally significant DAV element must sit under its expected direct parent: `response` under `multistatus`; `href` and `propstat` under `response`; `status` under `response` or `propstat`; `prop` under `propstat`; `resourcetype` under `prop`; `collection` under `resourcetype`; `responsedescription` under `multistatus`, `response` or `propstat`.
    - Only allowlisted DAV children may appear in each container: `multistatus` → `response` and `responsedescription`; `response` → `href`, `status`, `propstat` and `responsedescription`; `propstat` → `prop`, `status` and `responsedescription`.
    - `href`, `status` and `responsedescription` must contain text only.
    - A `multistatus`, `response`, `propstat` or `href` element in a **foreign** namespace is refused anywhere.

    So a response hidden in a foreign wrapper, nested in another response, placed in `responsedescription`, or written as a foreign-namespace `response` makes the export fail closed (`503 export_incomplete`) instead of being silently dropped. Foreign *properties* inside `DAV:prop` stay allowed. This is a **conservative POC profile**: some rejected shapes (e.g. `DAV:sync-token`, `DAV:error`, `DAV:location`, foreign extension elements) are legal RFC 4918 extensions. Refusing them does not claim they are invalid WebDAV. **(R04-2)** A `DAV:collection` marker counts only inside a propstat whose own status is 2xx; a 404 propstat never makes an entry a collection, and neither does a trailing slash on the href.

    Further profile limits: `href` must be an absolute *path* inside the adapter base path; absolute-URL hrefs, DTD/entities, CDATA and bodies over 2 MB are refused (fail-closed `export_incomplete`). Real providers may use legal forms outside this profile; that is an ACCESS-02 probe item.
10. **No durable or global idempotency.** The Operation-Id ledger is **per-process memory**, scoped per principal and bounded. Defaults: `maxPerPrincipal = 1000`; global cap `maxLedgerEntries` defaults to `maxPerPrincipal × number of principals` (**not** a fixed 10 000). A principal at its own quota gets `503 not_saved principal_ledger_full`. When the global cap is reached, the response is `503 not_saved operation_ledger_full`. Both are returned **before** any upstream dispatch, so the outcome is definite. Only terminal entries are evicted (into tombstones); pending and Unknown entries never are. A restart or a second API instance does **not** share it. After a restart, `verify` needs `?kind=&id=&base=`, returns only non-terminal or observation results, and cannot fence. Two API processes **can** each forward the same Operation-Id once. Exactly-once delivery is **not** claimed.
11. **Residual P2 operational limitations (REMEDIATION-03 Q4, documented, not fixed):**
    - A principal whose quota is saturated with **Unknown** operations stays blocked (`principal_ledger_full`). It is unblocked only if those operations are resolved (observed or fenced) or the process restarts. No guaranteed recovery procedure is provided.
    - Configuring `maxLedgerEntries` **below the sum** of the per-principal quotas re-introduces cross-principal starvation (`operation_ledger_full` for an innocent principal; pinned by `R03-Q4`).
    - A client that uploads its request body slowly keeps its Operation-Id reservation `pending` until Node's server-side request timeout applies.
12. **Fence liveness and availability limitation — P2 (REMEDIATION-03 Q5, widened by REMEDIATION-04 R04-3; documented, not fixed).** **Any fence that was applied at the storage but not authoritatively confirmed** can strand the original operation in a non-terminal state indefinitely. This is not only the "timed out, then applied later" case. It includes a fence PUT whose response:
    - has no ETag;
    - has a weak or otherwise untrusted ETag;
    - has a misleading or ambiguous ETag;
    - is followed by a read-back GET that errors, times out, or returns a mismatched ETag or different bytes;
    - returned 503 after applying;
    - hung after applying.

    In each case the stored revision has moved away from `base` without confirmation, so `verify` and further fences return `outcome: indeterminate, terminal: false`. Consequences:
    - the operation may stay unresolved indefinitely;
    - its ledger entry **keeps occupying the principal's quota slot**, which can contribute to `principal_ledger_full` (see item 11);
    - **sibling Unknown operations on the same record** (same `base`) become unresolvable too.

    No recovery mechanism is provided. The slot is not freed automatically, because that could enable an unsafe replay. The API never reports `saved` or `not_committed` without authoritative evidence. Pinned by `R03-Q5` and the seven `R04-Q5-01` cases plus the sibling case.
13. **Production concerns that are out of scope here:** real TLS transport (`https:` currently **fails closed**, see P1-4), auth stack, session issuance and expiry, request budget and circuit breaker, per-run remote namespaces, audit logs, browser offline drafts.

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

## Remediation 03 (D007-A22, Design commit `28f988b`, re-QA comment 7089087597)

| Item | Change | Regression (`test/r03-regressions.test.mjs`) | Mutant |
|---|---|---|---|
| **Q1** export completeness | `listRecords`: root must exist (`namespace_absent`); exactly one collection per canonical kind (`missing_kind_collection`); duplicate kind or record → fail; kind self entry exactly once. Adapter rejects duplicate normalized hrefs; parser rejects a response-level status together with propstat, and propstat without exactly one status | omitted `projects` (record present); omitted empty `progress`; duplicate root kind (incl. trailing-slash variant), duplicate record (incl. percent-encoded), duplicate kind self; status conflict and non-2xx propstat; nested collection; root stray file; kind as file; absent namespace; valid 0-record and 2-record export + one-time restore; adapter-level duplicates; **Q1e omitted record: INFO / UNSUPPORTED** | M24–M27 |
| **Q2** fence read-back | terminal `not_committed` additionally requires a fresh GET with the equal trusted strong ETag ≠ base, identical bytes, an authenticated envelope and none of our own writes | **QA R1l** dishonest PUT ETag on content-hash storage, then late commit → `committed`; same on generation; generation both race orders; content-hash same bytes; read-back 500, timeout, weak, mismatched ETag, corrupt body, **older authentic bytes**, deletion, third-party overwrite; fence PUT 503, missing and weak ETag | M28–M30 |
| **Q3** README | replay contract bounded (ledger + tombstones, one process); defaults `1000 × principals`; `principal_ledger_full` vs `operation_ledger_full`; HMAC write tag and provenance; cross-key, rotation and rollback UNSUPPORTED | `R03-Q3a` (forgotten rejected op re-sent and saved) | — |
| **Q4 / Q5** | documented as residual P2 limitations (items 11–12 above); behaviour unchanged | `R03-Q4` ×2, `R03-Q5` (informational, pin current behaviour) | — |

**Defence in depth and mutation testing.** Several Q1 guards overlap: the adapter's duplicate-href check, `listRecords`' own duplicate checks and its self-entry checks. A mutant that removes only one of them could survive through another. Each guard therefore has a test that reaches it directly; for example, the adapter-level duplicate test and the `stale-body` fixture for the read-back byte comparison. Mutants M14, M24–M30 were then killed. M14's pattern was updated because the Q2 change rewrote the line it targets.

**Not claimed:** any Nutstore behaviour (atomic `If-Match`, PUT/GET ETag consistency, complete PROPFIND listings, snapshot consistency); global or durable exactly-once; recovery from Q4 and Q5 situations.

## Remediation 04 (D007-A23, Design commit `489c450`, re-QA comment 7090201835)

| Item | Change | Regression (`test/r04-regressions.test.mjs`) | Mutant |
|---|---|---|---|
| **R04-1** hidden / misplaced DAV structure (P2-R03-1, Q1c) | `validateStructure` walks the whole parsed tree: direct-parent rules for DAV structural elements, child allowlists for `multistatus` / `response` / `propstat`, text-only `href` / `status` / `responsedescription`, foreign response-shaped elements refused | QA's 4 variants (foreign wrapper, nested response, inside `responsedescription`, foreign-namespace `response`): 3 stored records → 503, no bundle, zero write effects, storage snapshot unchanged; 14 misplaced or unsupported shapes (incl. foreign response inside a property, element in `href`, unknown DAV root child, stray text) | M31 (silent-ignore restored), M32 parent rule, M33 child allowlists, M34 foreign response-shaped, M35 text-only |
| **R04-2** collection only from 2xx propstat | parser reads `resourcetype/collection` only from 2xx propstats; **adapter no longer treats a trailing-slash href as a collection** (found during R04: that fallback would have let a 404 marker pass) | COL-01 404-only marker → not a collection → 503; COL-02 2xx collection plus an unrelated 404 property → accepted; COL-03 status/propstat conflict still rejected | M36, M37 |
| **R04-3** Q5 disclosure | README item 12 widened to every applied-but-unconfirmed fence path, quota slot retention and sibling stranding | `R04-Q5-01` × 7 classes + sibling case (INFO) | — |
| Non-regression | — | `R04-POS-01`: `responsedescription` text, foreign properties, `D:` / default / other prefixes, export → restore | — |

**Not claimed:** RFC-invalidity of rejected extensions; completeness of a well-formed listing that silently omits a record (Q1e, still UNSUPPORTED); any Nutstore behaviour; recovery from Q4 and Q5 situations.

## Remediation 05 (D007-A25, Design commit `b1e11f9`, G3 QA comment 7092575362)

| Item | Change | Regression (`test/r05-regressions.test.mjs`) and evidence | Mutant |
|---|---|---|---|
| **R05-1** P2-R04-1 parser CPU/memory exhaustion | `LIMITS` (depth 64, elements 10 000, attrs 64 per element / 10 000 total, xmlns 256, 2 MB) checked while parsing, before allocation; namespace scopes shared by reference (copied only on declaring elements); multi-colon qnames refused; `parseXml(input, stats)` exposes counters | boundaries 64/65, 10 000/10 001, 64/65, 10 000/10 001, 256/257; scope sharing (`scopeMaps` = 5 for 10 000 elements); 2 MB, DTD and qname; listing-level depth, element and xmlns violations → 503 with `detail` *resource limit*, 0 writes; **isolated child-process probe** with the historical H1/H2 plus an at-limits document and a 2 MB flood (parser + API export), each < 2 s, no heap-limit abort, peak RSS recorded | M38–M44 |
| **R05-2** P2-R04-2 allprop compatibility | adapter `propfind` sends the explicit resourcetype-only body with Content-Type; no allprop fallback | exact body, Content-Type, Content-Length and Depth (0 and 1) observed at the mock; locked record and collection on a conforming mock → export 2/2 + restore; the same mock's allprop answer (lockdiscovery + current-user-principal) is refused by the parser; non-conforming mock (scope ignored) → 503 with and without locks; nested `DAV:href` in an unexpected property → 503; PROPFIND 400/403/415/500 → 503 with exactly one request; canonical-kind checks, 0- and 2-record export/restore, `D:` / default / `z:` prefixes; R04 hidden-response still 503 | M45–M47 |

**Mock additions (synthetic only):** `locks` (synthetic DAV locks, visible only via allprop `lockdiscovery`), allprop vs. `<prop>`-selected responses, the `ignorePropSelection` non-conforming mode, and the raw PROPFIND request (headers + body) in `requestLog`.

**Not claimed:** any Nutstore behaviour, including whether it honours a `<prop>` PROPFIND; performance on hardware other than the recorded 2 vCPU Linux x64 reference; parser completeness beyond the restricted profile. Earlier limitations (Q1e, snapshot consistency, Q4/Q5 liveness, bounded replay, no exactly-once, provider CAS/ETag, TLS) are unchanged.
