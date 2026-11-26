# WP-04-R1 — Global five-field Research Note, whole-note CAS and saved-version export (LOCAL_SYNTHETIC_ONLY)

**G0 / G1 DRAFT, NOT_AUTHORIZED until DEC-25=A.** Governing record: [A85](../../architecture/D007_A85_WP04_R1_G1_DRAFT.md). A10 WP-04, A5 §§2–7 (research-note route, whole-note revision, four outcomes), A6 §§3–4 (one global Note per canonical paper, five exact keys, lossless Markdown), A7 (no cascade), UI-D005.1/1e (frozen UI: five fixed headings, Typora-compatible export) and A20 govern. R1 is the first WP-04 slice, not full WP-04 and not UI acceptance. Real persistence remains blocked by P0-STORE.

## 0. Lessons carried in from WP-03 (binding from the first commit)

- **No relaxed default or waiver flag** (P1-WP03-DESIGN-1): every upstream regression is strict by default; no environment variable may weaken any check.
- **Strict TAP grammar from day one** (A72 F1–F3): reject bailout, failing/non-canonical/indented status records, SKIP/TODO, duplicate header/plan, trailing content and case variants; nested proofs must appear exactly once and pass.
- **Pinned protected inventory, not a repository walk** (P2-WP03-DESIGN-2): ordinary tests pin explicit Base blobs of the frozen paths only and tolerate unrelated main-only docs; the full candidate audit is a separate script outside `node --test` discovery.
- **Isolation guard before any socket or child** (A62): the frozen egress precondition runs before servers, scratch trees or child processes.

## 1. Base, branch and whitelist

- Exact immutable execution Base: **`bcc4eaad5183c923f782da0475eea1751be2de3b`** (main containing WP-03 merge `6cc8e2a`, regression-verified in A84). Do not rebase or merge from moving main.
- New branch `exec/WP-04-research-notes-r1`, new PR to `main`.
- Whitelist only: `packages/wp-04-research-notes-r1/**` and `docs/handoffs/WP-04/QA_HANDOFF.md`.
- Frozen read-only: `packages/wp-01-*`, `packages/wp-02-*`, `packages/wp-03-*`, both fixtures, `tools/**`, all docs and every other path. Read-only ES imports of exported WP-01/02/03 modules are allowed; any need to edit or hook them is STOP.
- No dependencies, no `npm install`, no lockfile, no CI, no UI, no provider, no network or system setting change. Node exactly v22.23.5 x64.

## 2. Inputs and immutable oracle

- WP-01 fixture `docs/handoffs/WP-01/fixtures/wp01.v1.json` (4573 B, SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`) and WP-02 fixture `docs/handoffs/WP-02/fixtures/wp02.v1.json` (4989 B, SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`): validate raw bytes before parsing; reject wrong provenance/schema/dependencies.
- Initial notes come only from the WP-02 fixture: paper `user/fakeLib01/XFAKE001` has one note with all five keys (CJK, `$…$`/`\sum` LaTeX, emoji, an embedded CRLF); the other three papers have `note: null` (no confirmed note).
- Clone into memory; no fixture change, disk write, real data or external service. Reuse WP-01 fake Session store/policy and WP-02 canonical tuple validation read-only, as WP-03 did. WP-04 has its own model instance; it does not read or mutate WP-03 state, and Reading Status / Important are out of scope.
- Per instance: opaque `runId`; opaque server-generated whole-note revision per existing note, derived from frozen identity + generation (not clock or client). Absent notes have no revision.

## 3. Five-field schema (exact)

Keys and order (A6 §4): `researchQuestion`, `argumentsAndContent`, `theoriesAndMethods`, `contributionsAndInnovations`, `limitations`. Headings (frozen UI): **Research Question**, **Arguments & Content**, **Theories & Methods**, **Contributions & Innovations**, **Limitations**.

- Every write carries **all five keys**, each a JSON string (empty allowed). Missing, extra, duplicate, non-string or null key → 422; no per-field PATCH, no partial merge.
- Values are stored and returned **byte-identical** after JSON decoding: no Unicode normalization, trimming, newline conversion (CRLF/LF/CR kept as sent), tab expansion, HTML conversion or default text.
- Reject only: lone surrogates / invalid UTF-8 (422 INVALID_TEXT), U+0000 (422), any field > 16 KiB UTF-8 or the five together > 48 KiB (413/422). All other control characters used in Markdown (TAB, LF, CR) are preserved; document any other rejection explicitly in the README — none is approved here.

## 4. Routes (new server, 127.0.0.1 ephemeral port only, inert until explicit listen)

- `GET /api/v1/health`: `LOCAL_SYNTHETIC_ONLY`, `FAKE_ONLY`, `MEMORY_ONLY`, `productionSuitable:false`, `runId`.
- `GET /api/v1/papers/{libraryType}/{libraryId}/{itemKey}/research-note`: exact case-sensitive canonical tuple in the owner's scope. Existing note → `{exists:true, fields:{…five…}, revision, runId}` with strong ETag. Absent note → `{exists:false, runId}`, no revision, no invented text. Same response whichever Project the user came from (no Project in the URL).
- `PUT /api/v1/papers/{…}/research-note`: whole-note write.
  - Create (no confirmed note): `If-None-Match: *` required; if a note now exists → 412 with no dispatch.
  - Update: `If-Match` with exactly one strong quoted current revision; stale → 412 STALE_RESOURCE_REVISION with the authorized current revision, `dispatched:false`; missing → 428; weak/wildcard/multiple/malformed → 400.
  - Body: closed object `{operationId, modelRunId, scope:"GLOBAL_PAPER", fields:{five keys}}`; no ownerId/role/revision/fault/riskTier or other key.
- `GET /api/v1/papers/{…}/research-note/export`: **saved version only** (server cannot see a local draft; local-draft export is a frontend R2 item). No mutation, no ledger entry. Absent note → 409 NO_SAVED_NOTE (no empty file pretending to be saved).
- No DELETE, PATCH, batch, quote, Project, status, Important, import, reconcile or provider route; unsupported methods 405, unknown routes 404, foreign/missing tuples neutral 403 with identical bytes and headers (as WP-02/03).

## 5. Saved-version export format (UI-D005.1e)

- `Content-Type: text/markdown; charset=utf-8`; `Content-Disposition: attachment; filename="<ascii-fallback>"; filename*=UTF-8''<percent-encoded>`; `Cache-Control: no-store`.
- Filename: `<safe-title>_<itemKey>.md`. Safe title: replace path separators, `:*?"<>|`, control characters and leading dots with `_`; collapse runs of `_`/whitespace; trim trailing dots/spaces; map Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`, case-insensitive) to `_<name>`; cap at 120 UTF-8 bytes without splitting a code point. Empty or missing title → `research-note_<itemKey>.md`. No claim that itemKey is globally unique.
- Body, exactly (LF separators added by the exporter; field bytes inserted verbatim):

```
# <escaped title>

- **Authors:** <escaped creators joined by "; ">
- **Year:** <year>
- **DOI:** <escaped doi>

## Research Question

<researchQuestion verbatim>

## Arguments & Content

<argumentsAndContent verbatim>

## Theories & Methods

<theoriesAndMethods verbatim>

## Contributions & Innovations

<contributionsAndInnovations verbatim>

## Limitations

<limitations verbatim>
```

- Metadata lines with no value are omitted (no placeholders). Title/creators/DOI escaping: backslash-escape `\ ` `` ` `` `*` `_` `[` `]` `<` `>` `#` `|` and leading `-`/`+`/digit-dot; strip control characters. Field text is never escaped, wrapped or altered; an empty field yields the heading followed by an empty line. Output ends with exactly one LF after the last field. Same paper → byte-identical export regardless of which Project initiated it; export never changes revision or ledger.
- Typora rendering is not certified by this slice (no Typora run); the test proves byte layout and verbatim LaTeX/Unicode/CRLF retention only.

## 6. Security, transport and outcome model

Same envelope as WP-03-R1 (DESIGN §3–4): loopback only, WP-01 size/time/request limits (64 KiB request is the hard cap), exact Origin, Fetch Metadata, `application/json` for PUT, Session validity, CSRF, owner role and exact scope **before** any revision or ledger disclosure; Workspace principal is read-only (GET only, no export unless separately approved — R1 denies export to Workspace with neutral 403).

Operation ledger keyed by principal + `operationId`, binding runId, tuple, precondition and a fingerprint of the five fields; same id with any change → 409 OPERATION_ID_REUSE, no dispatch; exact replay never dispatches twice. Four A5 outcomes via test-only injection (no runtime flag): model commit → 200/201 CONFIRMED with `outcomeBasis:"MODEL_ONLY"`, `durable:false`, `saved:false`, `simulated:true`; conflict 412/428 with `dispatched:false`; definite pre-dispatch failure, state unchanged; 202 accepted-not-committed UNKNOWN, 504 lost-ack-after-commit UNKNOWN, socket drop after commit (client UNKNOWN). UNKNOWN is never shown as saved or definitely failed; the target note is quarantined (new write 409 until resolved by read), unrelated notes unaffected.

## 7. Invariants and non-goals

- One global note per canonical tuple: same title/DOI (`XFAKE002`) or same key in another library (`group/fakeLib02/XFAKE001`) is a different note; writing one never changes another.
- Writing a note never changes Projects, associations, Important, Reading Status, metadata, other notes or WP-01/02/03 state. No cascade or delete path exists.
- Byte fidelity round-trip: fixture note → GET → PUT same bytes (new revision) → GET → export: every field byte-identical, including `\r\n`, emoji and LaTeX.
- Logs/evidence sanitized: no cookies, CSRF tokens, note bodies or full request bodies; only route templates, status, code and digests.
- **Out of scope for R1 (later slices, separate DEC):** local unsynced drafts, recovery dialog, per-field comparison/merge UI, autosave, Export Local Draft, Key Quotes (WP-05), Zotero API (WP-06), real storage (P0-STORE), real identity, UI changes, Typora certification.

## 8. Required tests (named; actual counts reported, no fixed count)

| ID | Coverage |
| --- | --- |
| Q4-01 | Fixture bytes/hashes; initial note exists only for `user/fakeLib01/XFAKE001`; byte-exact five fields; absent notes `exists:false`, no revision; runId fresh per instance |
| Q4-02 | Create with `If-None-Match: *` on absent note; second create 412, no overwrite; owner derived from Session |
| Q4-03 | Whole-note update with correct revision; new revision; all five fields replaced together; missing/extra/null/non-string/duplicate key 422, no partial write |
| Q4-04 | Two clients same revision → exactly one commit, the other 412 with current revision; stale/missing/weak/wildcard/multiple/malformed preconditions |
| Q4-05 | Byte fidelity: CJK, combining characters (no NFC/NFD change), emoji, `$…$`, `$$…$$`, `\(…\)`, fenced code, tabs, CRLF/CR/LF, trailing spaces, empty strings; lone surrogate, U+0000, size limits rejected |
| Q4-06 | Operation ledger: exact replay no second dispatch; changed fields/tuple/precondition/scope under same id rejected; concurrent same key one dispatch; cross-principal replay denied without disclosure; old runId rejected |
| Q4-07 | Fault matrix: commit, conflict, no-dispatch failure, 202, 504-after-commit, socket drop; UNKNOWN quarantine; never saved/definitely failed; unrelated note writable |
| Q4-08 | Auth/CSRF/Origin/Fetch Metadata/media type/role/Workspace read-only and export denial; neutral 403 for foreign and missing tuples (same bytes and headers); no revision/ledger leak |
| Q4-09 | Scope isolation: `XFAKE002`, `group/fakeLib02/XFAKE001`, foreign paper unaffected; no change to Projects/associations/Important/status/metadata; note identical through every Project context |
| Q4-10 | Export: exact template bytes, verbatim fields, omitted missing metadata, escaping, filename sanitization incl. reserved names/long titles/missing title, `filename*`, no mutation, absent note 409, byte-identical repeated export |
| Q4-11 | Transport: loopback only, size/route/method/prototype/encoded traversal, GET never writes, redacted logs |
| Q4-12 | Strict upstream regression: WP-01 67/67, WP-02 44/44 (nested 67), WP-03 103/103 with strict TAP; pinned protected inventory of WP-01/02/03 packages, both fixtures and `tools/offline` against Base; tolerate unrelated docs |

Mutation driver (scratch tree outside the repo, after the egress precondition, ≥ 12 named mutants, each killed by its intended assertion, not crash/timeout): allow per-field partial write; skip revision compare; normalize Unicode (NFC); convert CRLF to LF; trim field whitespace; drop owner scope; allow Workspace write; skip CSRF; duplicate dispatch on replay; accept changed fingerprint; report saved on UNKNOWN; share one note across libraries by itemKey; export a local/unsaved body or mutate revision on export; omit an empty section in export.

## 9. Deliverables

New `packages/wp-04-research-notes-r1/`: README (commands, scope, limits), `package.json` (private, `type: module`, engines node 22.23.5, empty dependencies, `"test": "node --test"`), `src/` model/server/export, `support/` harness with the A62 guard, `test/*.test.mjs`, `scripts/mutation-check.mjs`, `scripts/verify-candidate-scope.mjs` (Base/whitelist/protected audit, not test-discovered). `docs/handoffs/WP-04/QA_HANDOFF.md` with exact SHA and sanitized facts. Anything broader → STOP.
