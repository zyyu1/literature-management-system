# D007-A90 — P0-STORE storage route: Nutstore WebDAV only — bounded provider proof design (DRAFT)

**Design proposal — 2026-11-27 Europe/Berlin.** Design only. Authorizes no account creation, credential handling, provider contact, live request, real data, persistence or spending. Builds on [ACCESS_POLICY](../handoffs/POC-001/ACCESS_POLICY.md) (ACCESS-01, approved policy), [ACCESS-02 precheck](../handoffs/POC-001/ACCESS02_PRECHECK_MATRIX.md) (M29-xx), the [request packet template](../handoffs/POC-001/ACCESS02_REQUEST_PACKET_TEMPLATE.md), A10 §P0-STORE and A19-R01.

## 1. Decision recorded
DEC-26 (A86) asked for a storage-route design after WP-04-R1. On 2026-11-27 the user chose, in the Design window, **"only Nutstore WebDAV"** (**DEC-32**): this design covers only proving or disproving Nutstore WebDAV as the primary store. No alternative store is evaluated now. If the proof fails, the outcome is recorded NO-GO and the D007 storage amendment becomes a separate future decision; nothing switches automatically.

## 2. What P0-STORE must prove (A10 row P0-STORE, A20 §Storage, A19-R01)
| Code | Property the app relies on | Used by |
| --- | --- | --- |
| S-CAS | A conditional write with a stale validator is **rejected atomically across independent clients/processes**, and the acknowledged winner's bytes survive | A5 whole-resource CAS (WP-03 status/Important, WP-04 whole note) |
| S-CREATE | Create-only (`If-None-Match: *` or equivalent) never overwrites an existing resource | Project/note creation |
| S-ETAG | Validator is stable and consistent: PUT response = GET = PROPFIND; changes on every content change; known behaviour for identical-byte rewrite; read-after-write visible | Revision model, UNKNOWN resolution |
| S-LATE | After a lost acknowledgement the true outcome can be determined from authoritative state (validator/bytes) without blind retry | A5 UNKNOWN / quarantine (E9-04/07) |
| S-ERR | Status semantics for 404/409/412/423/429/5xx and auth failure are observable and safely classified | Error mapping |
| S-MULTI | Behaviour when two objects must change together (no provider transaction expected) — measured to size the app-level journal | Quote+history, association+status |
| S-BACKUP | Synthetic backup/export and restore into a fresh namespace with hash validation; per-file cleanup verifiable | A20 backup/restore |

A returned ETag alone proves nothing (ACCESS_POLICY §5). Unofficial public reports mention per-account request limits (around 1500 per half hour), monthly transfer caps on free plans and historical per-directory listing limits; these are **not** relied on. The self-imposed ceilings of ACCESS_POLICY §4 (≤100 requests per rolling 30 min, ≤20 files, ≤1 MiB/file, ≤20 MiB, ≤2 writers) are stricter and govern.

## 3. Route — four phases, each separately decided

### Phase 1 — local readiness slice (needs DEC-33; no network)
New isolated package `packages/p0store-nutstore-probe/` on exact current main; **does not reuse the unmerged PR #2 code** (old Base, product-shaped). It is a single-purpose **probe runner**, not product code:
- Bounded experiment engine executing the §4 run sheet from a frozen JSON plan; every request passes one gate enforcing pinned HTTPS host/port/path prefix, allowed verbs (`PROPFIND` depth 0/1, `GET`, `HEAD`, `PUT`, `MKCOL` for the single run directory, per-file `DELETE`), rolling budget with **pre-reserved cleanup slots**, file/size/writer caps, no redirects, strict TLS (no `rejectUnauthorized:false`), credential only from an out-of-band environment variable read at runtime, never logged.
- Two writers are **separate OS processes** coordinated by a local barrier, so S-CAS is cross-process.
- Redacted trace: method, path template + synthetic ID, status, validator hash prefix, body SHA-256, timings; no headers containing secrets, no account listing.
- STOP rules (§5) implemented as hard aborts with cleanup-then-quarantine.
- Local proof against a **loopback HTTPS mock WebDAV server with selectable personalities**: `strong` (correct CAS), `weak-etag`, `lost-update` (ignores If-Match), `stale-read` (delayed visibility), `late-ack` (commits then drops the connection), `429/5xx`. Oracles must classify each personality correctly; the `lost-update` and `stale-read` personalities must yield NO-GO, proving the runner can detect failure. Covers precheck M29-02..07, 09..12 at contract level for the probe.
- Normal gates: Execution G2 (itemized, A86), Design G2 review, independent G3 with count-neutral audit negatives (A88 rule), Design G4. **Readiness verdict `PRE_G6_LOCAL_READY` only; still no live access.** Merge (G5) not needed for a probe: the live run uses the exact accepted SHA.

### Phase 2 — user preparation (out of band, no Claude involvement with secrets)
User creates a **second disposable Nutstore account** (never the Zotero-sync account, no personal files), generates an app-specific WebDAV password, chooses the operator machine, and fills the [request packet](../handoffs/POC-001/ACCESS02_REQUEST_PACKET_TEMPLATE.md) fields except the secret. Credentials are never pasted into any chat, file, commit or URL.

### Phase 3 — one bounded live run (needs a separate explicit user ACCESS-02/G6 approval, DEC later)
Exact probe SHA, exact host, run namespace `/LMS-P0STORE/<random-run-id>/`, run sheet §4, budget counters. Executed once on the approved machine by the Execution window with the user injecting the secret into the process environment. A second independent QA session then re-checks the trace and repeats only S-CAS race rounds 1–2 in a **separate** run namespace within the remaining budget (independent observation, not a re-run of everything). Afterwards the user revokes the app password.

### Phase 4 — Design verdict (G4-style)
Per §6: `P0-STORE GO (single-object)`, `PARTIAL`, or `NO-GO`. A verdict is about this provider's protocol behaviour only, never a production, backup-completeness or SLA claim.

## 4. Live run sheet (fixed request budget; target ≤ 88 of 100, 12 reserved for cleanup/abort)
| Step | Experiment | Requests (est.) | Pass oracle |
| --- | --- | --- | --- |
| L0 | TLS/host identity, unauthenticated `OPTIONS`/`PROPFIND` depth 0 on run root parent → expect 401 without credential, then authenticated depth 0 | 3 | Pinned host, valid chain, no redirect; DAV class header recorded (M29-P01/P02) |
| L1 | `MKCOL` run directory; `PROPFIND` depth 1 shape incl. `getetag`, `getlastmodified`, resourcetype | 2 | Directory created only at run path |
| L2 | S-CREATE: `PUT` file A with `If-None-Match: *` → 201; repeat → must be 412 (or documented conflict) and bytes unchanged | 4 | Second create rejected, GET bytes = first body (M29-P04) |
| L3 | S-ETAG: PUT/GET/PROPFIND validator equality; read-after-write at t=0, 2 s, 10 s; strong vs weak (`W/`) form | 7 | Equal and immediately visible; record form |
| L4 | Identical-byte rewrite with `If-Match` → record whether validator changes | 3 | Behaviour recorded (either is acceptable if consistent and documented) |
| L5 | Conditional update: `If-Match` current → 2xx + new validator; `If-Match` stale → 412, bytes unchanged | 5 | 412 and winner bytes intact (M29-P03) |
| L6 | **Cross-process race ×5 rounds**: two processes read same validator, release together, both `PUT If-Match` with distinct bodies | 5×(2 read + 2 put + 1 verify) = 25 | Every round exactly one 2xx and one 412; final bytes = winner; 0 lost updates |
| L7 | Weak/garbage validator in `If-Match`, `If-Match` on missing file, conditional `DELETE` with stale validator | 5 | 412/404 as specified; nothing deleted on stale |
| L8 | S-LATE ×3: writer sends `PUT If-Match`, aborts socket after body sent; resolver reads validator + bytes | 3×3 = 9 | Outcome determinable each time (committed or not) without retry; else record `UNRESOLVABLE` |
| L9 | S-ERR: PUT into missing collection (409), GET missing (404), oversized-not-sent guard (local refusal), path outside namespace (local refusal, zero egress) | 3 | Observed codes recorded; refusals send nothing |
| L10 | S-MULTI: sequence two files (journal + data) with deliberate abort between → observe partial state | 6 | Expected non-atomic; measure what a journal must cover |
| L11 | S-BACKUP: GET 3 synthetic files, write local manifest (SHA-256), restore them into a fresh sub-namespace (3 PUT), read back 2 | 8 | Hashes equal; fake IDs only |
| L12 | Cleanup: per-file `DELETE` from own allowlist, `PROPFIND` empty check, delete run dir | ≤ 8 (+12 reserve) | Namespace empty; ambiguous → STOP, leave, report |

Files ≤ 14, each ≤ 4 KiB synthetic JSON/Markdown with fake IDs. Any 429 or unexpected 401 stops immediately (no retry).

## 5. STOP conditions (hard abort, then per-file cleanup only if identities are certain)
TLS/host/redirect anomaly; any path outside the run namespace; budget would exceed cap; 401 after successful auth, 429, repeated 5xx; **any stale write accepted (lost update)**; ambiguous file identity; inability to verify cleanup; any secret appearing in a trace. P0-like events follow ACCESS_POLICY §6 (quarantine, revoke, escalate to Design).

## 6. Verdict rules (fixed before any live request)
- **GO (single-object)** ⇔ L2, L5, L6 (5/5 rounds), L7 pass; L3 consistent and read-after-write immediate; L8 determinable in 3/3; L11 hashes equal; no STOP. Consequence: WebDAV may serve as primary store for **single-resource** CAS; multi-resource invariants (S-MULTI) require an app-level journal/manifest design as a separate D007 amendment before WP-03-R2/WP-05 real persistence.
- **PARTIAL** ⇔ CAS correct but L3 visibility delayed, validator weak-only, or L8 sometimes unresolvable → Design specifies compensating rules (read-back fences, quarantine-until-verified) and asks the user.
- **NO-GO** ⇔ any lost update in L5/L6, create-only overwrite in L2, or stale conditional delete in L7 → Nutstore WebDAV cannot be the primary store; record A19-R01 as disproven and offer the D007 storage amendment as a new user decision.

## 7. Explicitly not in scope
Real Zotero data, the user's main account, PDFs, production deployment, background sync, global backup completeness (Q1e), durable cross-instance exactly-once (Q4/Q5 residuals), performance/SLA, PR #2/#4 changes, G6 for anything but this run, G7.

## 8. DEC-33 (to be offered in the Design window)
- **A (recommended):** authorize **Phase 1 only** — the local probe runner + mock personalities, G1 per §3 Phase 1; Management dispatches Execution; no network, no account.
- **B:** revise this design first.
- **C:** pause.
Phase 3 always needs its own later explicit user approval naming the exact SHA, host, namespace and operator.
