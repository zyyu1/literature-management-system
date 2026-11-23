# D007-A5 — Versioned API Contract, Concurrency and Honest Mutation Outcomes

**Decision:** D007-A5 — user-approved **Option B (contract-first)**, 2026-11-23 (Europe/Berlin).  
**Stage:** **DESIGN APPROVED / NOT IMPLEMENTED OR RUNTIME-VERIFIED**.  
**Scope:** versioning, identity and resource boundaries, request/operation identity, conditional mutation and idempotency rules, status/error envelopes, batch reconciliation and separate read-only Personal Workspace.  
**Source decisions:** [D007-A1 architecture](D007_A1_LOGICAL_DEPLOYMENT.md), [D007-A4 authentication/session](D007_A4_AUTH_SESSION_SECURITY.md), [frozen Module 002 UI](../ui/002/DESIGN_APPROVED.md), [POC-001 scope](../handoffs/POC-001/DESIGN_APPROVED.md), [POC-001 access policy](../handoffs/POC-001/ACCESS_POLICY.md).  
**Permission boundary:** **Documentation only.** No backend/API coding, endpoint publication, identity vendor, production database, live Nutstore account, Zotero authorization, cloud deployment, POC-001 execution expansion or QA pass.

## 1. Contract-first rules and version evolution

- **Illustrative logical namespace:** `/api/v1` with media type `application/json`; public deployment hostname, actual API route registration and OpenAPI implementation are **not** selected. Route names below are **proposed resource shapes**, fixed here as semantic design references; implementation can propose an exact mapping only through a scoped review that preserves the frozen decisions. Contract-changing incompatibilities need a new approved version/amendment; no silent reinterpretation of an accepted response.
- **Identity:** a website-owned stable, opaque ID for each Project, canonical paper, association, shared Note, Key Quote, source reference and operation. The canonical Zotero paper maps to the owning Zotero library identifier + item key and is not duplicated across Project associations. IDs exposed to browsers must be scoped to the authenticated principal; they are **not** authorization secrets.
- **Trust:** all requests to private API endpoints require the approved [D007-A4](D007_A4_AUTH_SESSION_SECURITY.md) cookie session, CSRF/Origin for writes, exact credentialed CORS, and server-side per-object/per-operation rights. Fetching a global note through a Project link does **not** make it Project-private. The frontend may include Project context for navigation but the API resolves the authoritative scope.
- **Evolving schemas:** `schemaVersion` and request/response `apiVersion` distinguish client/representation compatibility. On breaking changes, return a defined incompatibility/error instead of parsing unknown fields as privileges. Use stable canonical field names and UTC ISO 8601 timestamps only for display/audit, **not** as compare-and-swap proof. Server-issued opaque revisions may be represented as strong ETags, with stable semantics on reads and writes.
- **No data ownership transfer:** Zotero owns bibliographic metadata, PDFs, attachment synchronization and original annotations. Website owns Projects, associations, global reading status/Note and saved Key Quotes. Do not copy PDFs or store API credentials in browser payloads.

## 2. Resource and authorization matrix

| Logical resource | Scope / canonical ownership | Mutation policy and guard |
| --- | --- | --- |
| `projects` | Website Project under authenticated user/allowed membership | Only own-authorized create/edit/archive/restore/delete; delete is separately confirmed and must not remove global paper/note/quote/Zotero records |
| `projectPaperAssociations` | A specific **Project × canonical paper** pair | Per-Project Important and link/unlink only; unlink requires explicit current Project / all-Projects scope and target enumeration confirmation |
| `papers` | One canonical Zotero library/item identity across Projects | Bibliographic data is read-only Zotero projection; no browser override of Zotero authoritative fields |
| `readingStatus` | **Global per canonical paper**; three-state enum from frozen UI | Server validates exact enum, per-user paper rights, whole-resource revision and confirmed persistence. Changing Project filter does not alter scope |
| `researchNote` | **One global shared Note per canonical paper**, containing the approved **five Markdown source fields** | Whole-note expected revision guard; no per-field blind overwrite; unknown/failed save retains local draft and comparison context |
| `keyQuotes` | Website-owned quote excerpt/comment anchored to canonical paper and source provenance | Quote creation or manual Relink is explicit; preserve excerpt/comment; append source-history only with confirmed atomic active-source update |
| `batchOperations` | A separately identified original request with exact actor, Project, selected IDs, action, scope, item results | No all-or-nothing promise across multiple papers; item-level confirmed/failed/skipped/unknown; preserve each batch identity and no duplicate unsafe replay |
| `operationVerification` | Protected lookup of one writer's scoped request identity, **only if reliable ledger exists** | Read-only authoritative status lookup (not re-execute), never infer success only because target bytes match |
| `workspaceProjection` | A separately authenticated **read-only** Personal Workspace view of authorized Project/paper metadata | Only approved read scopes/deep links; no note edits, source relink, Important/status changes, broad library exports or shared write session |
| `session` | API-issued host-only browser session as defined in D007-A4 | Identity/session lifecycle not implemented here; per-device revoke and auth checks remain separate design gate |

## 3. Proposed endpoint families (conceptual, not live URLs)

| Family | Proposed example route | Method and governing rule |
| --- | --- | --- |
| Projects | `/api/v1/projects`, `/api/v1/projects/{projectId}` | GET/POST and conditional PATCH; lifecycle actions require explicit authorization and confirmation semantics |
| Project paper links + Important | `/api/v1/projects/{projectId}/papers/{paperId}` | GET/PUT or guarded PATCH for association attributes; DELETE only with narrow explicit Project scope; all-Project unlink is a separate protected operation with visible affected scopes |
| Global Reading Status | `/api/v1/papers/{paperId}/reading-status` | GET / conditional PUT; per-Project context cannot move global scope |
| Global Note | `/api/v1/papers/{paperId}/research-note` | GET / conditional PUT for **all five** fields and authoritative full-note version |
| Key Quotes | `/api/v1/papers/{paperId}/key-quotes`, `/api/v1/key-quotes/{quoteId}/source` | Scoped GET/POST and guarded source re-link with original-source history preservation |
| Batch mutation | `/api/v1/projects/{projectId}/batch-operations` | Explicit POST with operation scope, selected canonical IDs and unique operation identity; response **per item** |
| Operation verification (conditional) | `/api/v1/operations/{operationId}` | Only enable if server can provide authoritative durable operation ledger; GET must not retry or perform mutation |
| Separate workspace read client | `/api/v1/workspace-read/projects` (illustrative) | GET-only read projection with separately authorized client identity; must reject POST/PATCH/PUT/DELETE and sensitive fields |

These URL examples are **not a request to implement, register, provision or expose** endpoints. Exact HTTP method/route schema can be frozen during a separately reviewed implementation-spec phase, provided the above authority, guards and error semantics are preserved. No generic arbitrary-webdav-target URL is permitted.

## 4. Mutation request identity, revision checks and idempotency

For each approved mutation, the *client supplies or retains* an opaque unique **`operationId`** (high-entropy ID, not a secret), a declared `scope` and target, expected **resource revision**, and an explicit user-intent payload. `Idempotency-Key` may be used as an HTTP carrier in addition to `operationId`, subject to RFC/draft and runtime implementation checks. This header is still an **IETF Internet-Draft as of November 2026**, not an already-standardized guarantee.

**Required server processing design:**
1. Authenticate, enforce CSRF and authorization, validate target canonical IDs and exact Project/global/quote scope, canonicalize payload and enforce bounded size. Deny access without revealing a private object's existence.
2. Match request identity **scoped to principal + operation type + resource(s)** and a secure payload fingerprint; **same key with different payload is an explicit error**, never an accidental accepted mutation. Concurrent same-key in-flight requests cannot both execute.
3. **For updates:** require a client-read authoritative revision or strong API ETag and compare it **atomically** to the latest stored revision. Conditional `If-Match` is preferred when supported end-to-end; *missing required precondition* → `428 Precondition Required`, stale precondition → `412 Precondition Failed`; semantic business conflict may use `409 Conflict`. For initial creation, `If-None-Match: *` or an equivalent proven create-if-absent primitive may be required. Check prior authorization before disclosing revisions.
4. Persist the new resource revision and, where applicable, operation result and Source History as one consistency-safe unit, **or fail closed**. ETag returned by an adapter, GET→PUT sequencing or a single-process mutex **does not prove atomicity**. If the storage adapter cannot make the required guard atomic, refuse conflicting/dangerous mutation routes rather than silently weaken correctness.
5. Only a verified durable result with the matching request identity, scope and revision may return **CONFIRMED**; any unproven storage outcome stays **UNKNOWN**. Dedupe replay of an already confirmed request is permitted **only if** the server can verify the identity and fingerprint against a reliable durable ledger; do not create another history event. A repeated request with same key while the first is still pending must remain pending/conflict, not execute twice.
6. Retention and scope for operation IDs/idempotency entries are **not decided** and must be validated against device/reload recovery and security requirements. Expiration of an operation record does **not** make an old unknown write safe to replay. If ledger persistence is absent, the UI must not pretend operation lookup or background reconciliation works.

**Explicit fallback:** If POC-001 does not prove atomic revision checks or operation-record durability, the API design records **UNSUPPORTED / UNVERIFIED**, blocks unsupported mutation paths or requires a new Design storage/recovery decision. Do not add a database, KV, queue, global transaction, auto-polling, local backup guarantee or silent vendor choice under D007-A5.

## 5. Unambiguous outcome semantics: HTTP transport versus business persistence

The HTTP response status and application's write outcome are **distinct layers**. An error code alone does not always prove whether a request dispatched before connection failure has committed remotely; the client must keep its saved original `operationId` for safe verification.

| Outcome | Permissible HTTP examples (not exhaustive) | Client-visible required rule |
| --- | --- | --- |
| **CONFIRMED** | `200 OK` / `201 Created` after verifiable authoritative persistence; `204 No Content` only for a confirmed outcome with enough independent metadata | Update saved data/revision, display Saved/Success, record exactly one provenance event. No optimistic false success |
| **CONFLICT** | `412` for failed `If-Match`, `409` for a validated business-level version/scope conflict, `428` for missing required precondition (correctable request error) | Preserve local draft, show latest **authorized and confirmed** remote revision when available, require explicit review/reconfirmation; never overwrite silently |
| **DEFINITE_FAILURE** | `400/401/403/422` for validated rejection **before mutation**, or a server-supported conclusively noncommitted outcome | Show actionable failure, retain unsynced work/context; safe retry only after fresh permission/version/intent checks; never assume every 4xx/5xx always proves absence of a commit |
| **UNKNOWN** | Client timeout, broken connection, lost acknowledgment, proxy `5xx` after possible dispatch, a `202 Accepted` with processing incomplete, or server unable to prove durable result | Do not display Saved or Failed as final; keep operation identity, originally confirmed resource and unsynced edits, offer **Review/Verify** without a blind write retry. A 202 is **not confirmation of persistence** |

**Transport caveat:** a `202 Accepted` only confirms acceptance for processing; a later positively verified result must be fetched through a separately proven operation-state mechanism. A `5xx` often indicates failure but, after a potentially committed write/lost acknowledgment, the **client's safe state is UNKNOWN**, not “definitely failed.” Distinguish `401` session expiry, `403` permission denied and `429` rate limit; do not expose internal credentials or upstream payloads.

For multi-item batch operations, **each item has its own outcome**, even if top-level batch request was accepted or partially completed. An item outcome must be scoped to the original batch and target; the sum of confirmed/failed/skipped/unknown must reconcile to the recorded requested set only where an authoritative batch ledger exists. A new filtered list or tab does not alter past batch scope.

## 6. Illustrative JSON envelope design (NOT implementation output)

**Successful confirmed single-resource response:**

```json
{
  "apiVersion": "v1",
  "operationId": "op_synthetic_01",
  "outcome": "CONFIRMED",
  "resource": {"type": "researchNote", "paperId": "paper_fake_01"},
  "revision": "opaque-rev-42",
  "durability": "authoritative-acknowledged",
  "savedAt": "2026-11-23T12:00:00Z"
}
```

**Conflict / unverified response shape:**

```json
{
  "apiVersion": "v1",
  "operationId": "op_synthetic_01",
  "outcome": "CONFLICT",
  "resource": {"type": "researchNote", "paperId": "paper_fake_01"},
  "error": {"code": "STALE_RESOURCE_REVISION", "message": "Review the latest saved note before retrying."},
  "currentConfirmedRevision": "opaque-rev-43",
  "recovery": {"action": "REVIEW", "mayRetryWrite": false}
}
```

```json
{
  "apiVersion": "v1",
  "operationId": "op_synthetic_02",
  "outcome": "UNKNOWN",
  "resource": {"type": "keyQuoteSource", "quoteId": "quote_fake_01"},
  "error": {"code": "ACKNOWLEDGMENT_UNVERIFIED", "message": "This write may have completed. Verification is required."},
  "recovery": {"action": "VERIFY_WHEN_SUPPORTED", "mayRetryWrite": false}
}
```

These payloads use **fake IDs and synthetic content**. Their strings are contract illustrations, **not** records in a real operation ledger, proof that JSON/Markdown is persisted, or proof of a working verification endpoint. On timeout with no body at all, the client reconstructs UNKNOWN *locally* from its pre-saved request context; it must never invent a response from the server.

**Error envelope and privacy:** machine `error.code` is stable and localizable, `message` is safe for the authorized user, `requestId` supports redacted incident debugging where present. Do not disclose whether unauthorized Project/Quote exists. Sensitive responses set appropriate no-store/no-cache rules, controlled content types and no unsafe JSON/Markdown HTML interpretation.

## 7. Scope invariants and critical multi-device cases

- **Global Reading Status:** one of exactly the UI-approved three values per canonical paper; a confirmed status write is visible in other Project views only after authoritative refresh; Project filters and Important are unrelated.
- **Per-Project Important:** a write targets exactly one Project–paper association. In phone Select mode an Important indicator is read-only; the separate Important write-status summary and unresolved batch header cannot be conflated.
- **Global Research Note:** atomically validate **all five fields** and whole-note revision; autosave/Save Now/field merge cannot overwrite edits from a different browser without version handling. Offline, expired session, lost ack or modal dismissal never erases the local draft.
- **Key Quote Relink:** only user-approved website-owned active source pointer can change, accompanied by **non-destructive Source History** on confirmed persistence; the saved excerpt and personal comment stay unchanged; any unverified source remains last-confirmed old source plus visible status.
- **Batch writes/unlink:** multiple overlapping batches do not overwrite each other's identity; individual success, failed, skipped and unknown items are inspectable from the original Project; no duplicate confirmed write or blind retry. All-Project unlink is explicitly scoped and confirmed, and does **not** delete Zotero/global record.
- **Personal Workspace D006:** a separate principal/client with restricted read projection (`GET` only). No session reuse with writable website, broad personal-note/key-quote disclosure unless separately allowed, no mutating API keys, no cross-user references, no hidden write via GET/redirect/deep link. A click into the main website still requires destination user authentication and resource authorization.

## 8. Planned contract acceptance matrix (QA NOT RUN)

| ID | Future check | Expected proof / blocker |
| --- | --- | --- |
| **A5-01** | Exact Principal/Project/canonical-paper scope and unauthorized lookups | Cross-user/cross-Project mutations and existence leaks denied; P0 if rights bypass |
| **A5-02** | Missing/stale `If-Match`, creation collision and two independent stale writers | `428/412/409` as appropriate; never allow lost updates; P0 if silent overwrite |
| **A5-03** | Same operationId + same payload replay, different payload reuse and in-flight concurrent duplicates | No double apply/history; reject key misuse; if no durable dedupe, mark unsupported (not PASS) |
| **A5-04** | `200/201/204` only after confirmed durable save; `202` never labeled Saved | No false UI confirmation, no duplicate note/source history |
| **A5-05** | Timeout, lost ack, 5xx after dispatch, offline and reauth | Preserve local draft/operation identity and UNKNOWN until authoritative verification; no blind retry |
| **A5-06** | Global status vs per-Project Important across two Projects/devices | Exactly one global status/Note and correct local association scope |
| **A5-07** | Whole-note five-field conflicts and quote-source Relink with source-history race | Preserve both versions, local draft, excerpt and proven original provenance |
| **A5-08** | Overlapping partial batches + filtered/hidden papers + multiple unresolved batches | Per-item and per-batch outcomes honest, no scope leakage or replay |
| **A5-09** | Operation verification authorization, ledger loss/expiration, reload and access revocation | No forged verified state, public lookup or unproven durable recovery |
| **A5-10** | Personal Workspace read-only, CSRF/session/CORS, cache/error privacy | Read-only scope only; unauthorized writes impossible and no token/PII leakage |

These are **new design-only acceptance criteria**, not an expansion of already frozen Module 002 QA results. Execution and independent QA require a separately bounded instruction and exact PR SHA; actual provider storage/operation ledger capabilities remain blocked pending POC-001 and ACCESS-02.

## 9. POC-001 dependency ledger and STOP rules

| Ability | D007-A5 design stance | Proof still required |
| --- | --- | --- |
| Remote atomic `If-Match`/CAS | **REQUIRED / NOT PROVEN** | Local synthetic race + independently authorized real Nutstore protocol test across processes/clients |
| Durable idempotency/operation identity ledger | **CONDITIONAL / NOT PROVEN** | Atomic “record and apply” or equivalent durable recovery semantics, cross-device and reload tests; POC-001 may need separately scoped extension |
| Whole-note and quote-pointer/history atomicity | **REQUIRED / NOT PROVEN** | Storage model/design and real persistence proof; no assumption that multi-file WebDAV supports transactions |
| Background polling/recovery | **NOT AUTHORIZED OR PROVEN** | Separate design+execution approval, privacy and rate limits if later proposed |
| Secure authorization, session and permissions | **DESIGNED D007-A4 / NOT IMPLEMENTED** | Later identity/session architecture choice, security and API tests |
| Independent QA | **NOT RUN** | Exact code SHA and independent QA evidence; no design-approved document can be labeled runtime PASS |

If any core requirement cannot be guaranteed by candidate storage, **STOP** and return for a D007 storage/capability decision; do not silently downgrade to last-write-wins, infer durable dedupe from HTTP methods, mint “verified” ETags from cache, add a database, or broaden current POC permissions.

## 10. Standards reference (checked 2026-11-23)

- HTTP Semantics **RFC 9110** (status 202, 409, 412; conditional requests): https://www.rfc-editor.org/rfc/rfc9110.html
- HTTP Precondition Required **RFC 6585 §3** (428): https://www.rfc-editor.org/rfc/rfc6585.html
- `Idempotency-Key` **IETF Internet-Draft -09** (Nov 2026; not final RFC): https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
- OWASP API authorization guidance: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
