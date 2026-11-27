# WP-04-R1 — global five-field Research Note, whole-note CAS and saved-version export (synthetic contract double)

**Status: LOCAL_SYNTHETIC_ONLY, MEMORY_ONLY, FAKE_ONLY. Not production-suitable. Not a real API and
not a datastore.**
Authority: D007-A85 and the companion `DESIGN.md` / `QA_INSTRUCTION.md` for WP-04-R1, executed on the
immutable Base `bcc4eaad5183c923f782da0475eea1751be2de3b`, branch
`exec/WP-04-research-notes-r1`. R1 is the first WP-04 slice; it is not full WP-04, not UI acceptance,
not a Typora certification and not a persistence claim. P0-STORE remains blocked.

Authoritative design documents (read-only; not copied into this package):

- DESIGN: `https://github.com/zyyu1/literature-management-system/blob/b04ba32d009d7731f2c8ca797f87c735cd779e25/docs/handoffs/WP-04/DESIGN.md`
- QA instruction: `https://github.com/zyyu1/literature-management-system/blob/b04ba32d009d7731f2c8ca797f87c735cd779e25/docs/handoffs/WP-04/QA_INSTRUCTION.md`
- G1 authorization: `https://github.com/zyyu1/literature-management-system/blob/b04ba32d009d7731f2c8ca797f87c735cd779e25/docs/architecture/D007_A85_WP04_R1_G1_DRAFT.md`

**Checkout note:** the immutable Base predates the docs-only WP-04 design commits. The three
documents above are not present in the Base tree of this execution checkout; they are authoritative
on `main@b04ba32d009d7731f2c8ca797f87c735cd779e25` and were read from there. This candidate adds only
the whitelisted package and `docs/handoffs/WP-04/QA_HANDOFF.md`; it does not add, move or copy those
authorities, and every relative import/test in this package is independent of their presence.

This package is isolated: it adds routes only on its **own** server factory and never edits
`packages/wp-01-synthetic-auth-api/**`, `packages/wp-02-project-paper-read/**`,
`packages/wp-03-guarded-r1-writes/**`, either fixture, `tools/**` or any other path.

## Frozen inputs

| Fixture | Bytes | SHA-256 |
| --- | --- | --- |
| `docs/handoffs/WP-01/fixtures/wp01.v1.json` | 4573 | `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` |
| `docs/handoffs/WP-02/fixtures/wp02.v1.json` | 4989 | `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888` |

Both are accepted only as raw bytes matching that byte length and digest, verified **before**
`JSON.parse`; anything else throws `UNSAFE_CONFIG` before a model exists. The WP-02 fixture is also
validated to carry exactly one initial note, on `user/fakeLib01/XFAKE001`, with all five string
fields; the other three papers carry `note: null`. The parsed data is cloned into one in-memory
WP-04 model. Fixture files are never written.

## Composition by read-only import

- `wp-01-synthetic-auth-api/src/store.mjs` — fake principals, Sessions, revocation/expiry, CSRF
  primitive and fake clock.
- `wp-01-synthetic-auth-api/src/policy.mjs` — limits, `Denial`/`OUTCOME`, `OP_ID_RE`, path parsing,
  prototype-key guard, fingerprint helper.
- `wp-02-project-paper-read/src/catalog.mjs` — canonical
  `(ownerScope, libraryType, libraryId, itemKey)` tuple, the five note keys and the frozen-fixture
  validation gate. Its immutable metadata objects are cloned into the one mutable WP-04 model.
- `wp-03-guarded-r1-writes/**` — read-only pattern source only. No WP-03 module is imported or
  modified, and WP-04 never reads or mutates WP-03 state.

`wp-04`'s own `src/model.mjs` is the only authoritative note state. Project, association, Important,
Reading Status and metadata are **not** mutable WP-04 state: WP-04-R1 has no cascade path.

## Model invariants

- One global note per canonical paper tuple. There is no Project component in the URL: the same note
  is returned whichever Project the user came from.
- Absent notes have no revision and no invented text. Present notes always carry all five fields and
  one opaque whole-note revision.
- Per instance: one opaque `runId`; every initial note revision is derived from `runId + canonical
  identity + generation`, never from a client value, a clock or a fixture literal. A write replaces
  all five fields and increments the generation, producing a new opaque revision.
- No DELETE, PATCH, batch, Project, status, Important, import, quote or provider route exists.

## Five-field schema (exact order)

`researchQuestion`, `argumentsAndContent`, `theoriesAndMethods`, `contributionsAndInnovations`,
`limitations`. Every write carries all five keys and each value is a JSON string (empty allowed).
Values are stored and returned **byte-identically** after JSON decoding: no Unicode normalization,
trimming, newline conversion, tab expansion, HTML conversion or default text. TAB, LF and CR are
preserved, as are Markdown control characters that are not explicitly rejected below.

Rejections (documented explicitly):

| Condition | Result |
| --- | --- |
| missing, extra, null or non-string five-field key | `422 INVALID_FIELDS` / `422 INVALID_FIELD` |
| duplicate key anywhere in the JSON body | `422 DUPLICATE_FIELD` (DESIGN §3 requires 422 for duplicate five-field keys) |
| lone surrogate in a field value | `422 INVALID_TEXT` |
| invalid UTF-8 request bytes | `422 INVALID_TEXT` |
| U+0000 in a field value | `422 INVALID_TEXT` |
| one field over 16 KiB UTF-8 | `413 TEXT_TOO_LARGE` |
| all five fields together over 48 KiB UTF-8 | `413 TEXT_TOO_LARGE` |
| request body over 64 KiB | `413 BODY_TOO_LARGE` |
| any other control character (for example `U+0001`) | preserved verbatim; not rejected |

## Routes (`/api/v1`, 127.0.0.1, ephemeral port)

| Route | Meaning |
| --- | --- |
| `GET /health` | `LOCAL_SYNTHETIC_ONLY`, `FAKE_ONLY`, `MEMORY_ONLY`, `productionSuitable:false`, `runId` |
| `GET /papers/{libraryType}/{libraryId}/{itemKey}/research-note` | Owner **and** Workspace read. Existing note → `{exists:true, fields:{…five…}, revision, runId}` with a strong ETag; absent → `{exists:false, runId}` with no revision and no ETag |
| `PUT /papers/{libraryType}/{libraryId}/{itemKey}/research-note` | Owner-only whole-note write. Create requires `If-None-Match: *`; update requires exactly one strong quoted `If-Match` |
| `GET /papers/{libraryType}/{libraryId}/{itemKey}/research-note/export` | Owner-only saved-version Markdown export. Absent note → `409 NO_SAVED_NOTE`; never an empty file |

Unsupported methods are `405` with `Allow`; unknown routes are `404`; a non-empty query string is
`400 INVALID_QUERY`. Foreign and missing tuples receive the same neutral `403 NOT_AVAILABLE` bytes
and stable headers. Workspace is read-only: note GET is allowed; every write is `403
WORKSPACE_READ_ONLY`; export is the same neutral `403 NOT_AVAILABLE` as a missing target.

### Body schema

Closed object: `{operationId, modelRunId, scope:"GLOBAL_PAPER", fields:{five exact keys}}`. Unknown
top-level or field keys (`ownerId`, `role`, `revision`, `fault`, `saved`, `durable`, `stepUp`, …) are
rejected before any ledger read or dispatch. `operationId` must match the WP-01 opaque format;
`modelRunId` must be the current per-instance `runId`, otherwise `409 STALE_MODEL_RUN`.

### Preconditions

- Create (note absent): exactly `If-None-Match: *`. Missing → `428 PRECONDITION_REQUIRED`; any other
  value → `400 INVALID_PRECONDITION`; if the note already exists → `412 NOTE_EXISTS` with no
  dispatch and no overwrite (no current revision is disclosed on this collision).
- Update (note present): exactly one strong quoted `If-Match` equal to the current revision. Missing
  → `428`; weak/wildcard/multiple/malformed → `400 INVALID_PRECONDITION`; stale → `412
  STALE_RESOURCE_REVISION` with `currentRevision` and `dispatched:false`.
- Both conditional headers at once, or an unexpected conditional header
  (`If-Modified-Since`, `If-Unmodified-Since`, `If-Range`) → `400 UNEXPECTED_CONDITIONAL`.
- An `If-Match` against an absent note is `412 STALE_RESOURCE_REVISION` with `currentRevision:null`.

## Operation ledger, outcomes and quarantine

- The ledger is keyed by authenticated principal + `operationId` and binds runId, route, mode
  (create/update), target canonical tuple, `scope`, the canonical five-field payload, the raw
  precondition and a SHA-256 fingerprint. An exact replay returns the original simulated outcome and
  revision with `dispatched:false`, `replayed:true`, `saved:false`, `durable:false`,
  `outcomeBasis:"MODEL_ONLY"` and never dispatches again. A changed fingerprint under the same ID is
  `409 OPERATION_ID_REUSE`, before any dispatch. Cross-principal reuse is denied neutrally without
  ledger/revision disclosure. A fresh instance rejects old runIds (`409 STALE_MODEL_RUN`) and old
  revisions (`412`) before dispatch.
- Authorization, canonical target resolution, model compare/apply and the ledger write happen in one
  synchronous block with no `await` in between, so two writers holding one revision cannot both
  commit. Session revocation/expiry is revalidated at that boundary.
- Test-only fault controls exist only on the in-process control object (`control.setNextFault`,
  `setGateDelayMs`, `beforeCommit`, `snapshot`, `stateDigest`, …). They are never reachable over HTTP
  and fault names are never returned. Outcomes: `200/201 CONFIRMED` (`outcomeBasis:MODEL_ONLY`,
  `saved:false`, `durable:false`, `simulated:true`); `412/409/428 CONFLICT` with `dispatched:false`;
  `403 MODEL_REJECTED` definite pre-dispatch failure with state unchanged; `202
  ACCEPTED_NOT_COMMITTED` UNKNOWN; `504 LOST_ACK_AFTER_COMMIT` UNKNOWN with the state actually
  committed; a real socket drop after commit leaves the client UNKNOWN; an unexpected post-dispatch
  error or an oversized confirmed response degrades to conservative UNKNOWN, never a fabricated
  definite failure.
- An unresolved-UNKNOWN target is quarantined: new writes to that note are `409 TARGET_QUARANTINED`,
  an exact replay is still served from the ledger, and unrelated notes remain writable. The
  quarantine is resolved by an authorized `GET research-note` (which returns the actual current
  state); the export route does not resolve it and never mutates anything.
- No successful path ever reports `saved:true` or `durable:true`. The ledger is process memory only.

## Saved-version export format (DESIGN §5)

`GET …/research-note/export` renders the saved note only. A local/unsaved draft cannot influence it,
and export never changes a revision or writes a ledger entry.

Headers: `Content-Type: text/markdown; charset=utf-8`; `Content-Disposition: attachment;
filename="<ascii-fallback>"; filename*=UTF-8''<percent-encoded>`; `Cache-Control: no-store`.

Body: fixed H1, the metadata bullets that have a value (`Authors`, `Year`, `DOI`; lines with no value
are omitted, no placeholders), then the five frozen headings with the field text inserted verbatim.
Escaping applies only to title/creators/DOI: backslash-escape ``\ ` * _ [ ] < > # |``, escape a
leading `-`/`+`/`digit.`, and strip control characters. Field text is never escaped, wrapped or
normalized. Output ends with exactly one LF after the last field. When every metadata line is
omitted, the title's blank line and the metadata block's closing blank line both remain, exactly as
the DESIGN §5 template does.

Filename: `<safe-title>_<itemKey>.md`. The safe title replaces path separators, `:*?"<>|`, control
characters and leading dots with `_`; collapses runs of `_`/whitespace; trims trailing dots/spaces;
maps Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`,
case-insensitive) to `_<name>`; and caps the title at 120 UTF-8 bytes without splitting a code point.
An empty or missing title yields `research-note_<itemKey>.md`. No global uniqueness of `itemKey` is
claimed.

## Limits and safety

127.0.0.1 port `0` only (other host/port refused before a socket exists); inert until `listen()`.
WP-01 limits: 64 KiB request, 256 KiB response, 2048-byte path, 5000 requests, bounded headers and
timeouts, non-loopback sockets destroyed. Exact origin allowlist with `Vary: Origin`; no wildcard
CORS; Fetch Metadata required; `application/json` only; strict UTF-8; closed schema with duplicate-key
detection; unsupported methods/queries, absolute-form/protocol-relative targets, encoded separators,
traversal, NUL and prototype keys fail closed; no redirects or proxying. `GET`, export and unknown
routes never mutate note state or the ledger. Logs contain only time, method, route template, status
and code — no cookies, CSRF tokens, bodies, note text, operation IDs or resource IDs.

## Exact commands

Node exactly `v22.23.5` x64 (the execution environment's pinned Node; `node` below means that
executable). Run inside the accepted isolated host boundary (A59/A62 or A54/A55).

```powershell
cd packages/wp-04-research-notes-r1
node --check src/fixtures.mjs
node --check src/strict-json.mjs
node --check src/model.mjs
node --check src/export.mjs
node --check src/server.mjs
node --check support/harness.mjs
node --check scripts/mutation-check.mjs
node --check scripts/verify-candidate-scope.mjs
Get-ChildItem -Recurse -Filter *.mjs | ForEach-Object { node --check $_.FullName }  # every package .mjs
node --test                                  # fail-closed gate + full suite on the isolated host
node scripts/mutation-check.mjs              # preflight guard then 14 named mutants
node scripts/verify-candidate-scope.mjs      # explicit read-only candidate audit (G2/G3/G5)
```

On a normal connected development host the guard-only check fails fast with
`EGRESS_PRECONDITION_FAILED: ACTIVE_PATH`; that is expected and is not a suite result. The suite
itself spawns the frozen suites: WP-01 67/67, WP-02 44/44 (nested WP-01 67/67) and WP-03 103/103. No
full online suite is an acceptable gate.

## Tests

| File | Covers |
| --- | --- |
| `test/q4-01-fixture-initial-note.test.mjs` | Q4-01 |
| `test/q4-02-create.test.mjs` | Q4-02 |
| `test/q4-03-update-schema.test.mjs` | Q4-03 |
| `test/q4-04-preconditions-cas.test.mjs` | Q4-04 |
| `test/q4-05-byte-fidelity.test.mjs` | Q4-05 |
| `test/q4-06-operation-ledger.test.mjs` | Q4-06 |
| `test/q4-07-faults.test.mjs` | Q4-07 |
| `test/q4-08-auth-negative.test.mjs` | Q4-08 |
| `test/q4-09-scope-isolation.test.mjs` | Q4-09 |
| `test/q4-10-export.test.mjs` | Q4-10 |
| `test/q4-11-transport.test.mjs` | Q4-11 |
| `test/q4-12-upstream-regression.test.mjs` | Q4-12 strict upstream TAP and pinned protected inventory |

Every network-capable test file imports `support/harness.mjs`, whose module-load A62 egress guard is
the shared fail-closed entry point for default discovery, targeted runs and scratch mutant copies.
`test/q4-12-upstream-regression.test.mjs` calls the same guard at module load before any upstream
child, and pins the literal Base blob IDs of all 72 protected files (WP-01/WP-02/WP-03 packages
including evidence, both fixtures, `tools/offline`) with `git hash-object --no-filters`. It tolerates
unrelated main-only docs and the new WP-04 package paths because only the pinned sets are checked.

## Mutation driver

`scripts/mutation-check.mjs` first runs the frozen A62 egress precondition (before any scratch tree,
baseline or child) and then copies this package plus the frozen dependencies and fixtures into a
scratch tree **outside the repository** (OS temp when writable, otherwise the clone's parent
directory), applies one exact mutation per mutant, runs the relevant behavioural test files, and
requires a named failing test — not a crash or timeout. Fourteen named mutants cover the DESIGN §8
list: per-field partial write; skipped revision compare; NFC normalization; CRLF→LF; field trimming;
dropped owner scope; Workspace write; skipped CSRF; duplicate dispatch on replay; accepted changed
fingerprint; saved/CONFIRMED on UNKNOWN; one note shared across libraries by itemKey; export
mutating the revision; omitted empty export section. The driver prints
`MUTATION_SUMMARY killed=N/N` and exits non-zero unless every mutant is killed by its intended
assertion.

## Candidate scope

`scripts/verify-candidate-scope.mjs` is the separate explicit candidate audit (not a test file and
not discovered by `node --test`). It proves the immutable Base `bcc4eaad…`, one or more
single-parent commits with no merge, exactly the 23 enumerated additions (22 package paths plus
`docs/handoffs/WP-04/QA_HANDOFF.md`), no modified/deleted Base path, no extra or untracked path, 243
Base paths + 23 additions = 266 tracked paths, every Base path byte- and mode-identical at HEAD, the
72-file protected inventory unchanged, a clean checkout and a worktree equal to HEAD. It accepts no
argument or switch that re-targets or relaxes the scope and prints `CANDIDATE_SCOPE_OK`.

## Not covered (NOT_COVERED)

No real identity/provider, database, durable persistence, cross-process CAS, crash recovery,
reconciliation, backup/restore or durable replay. No local unsynced drafts, recovery dialog,
per-field comparison/merge UI, autosave, Export Local Draft, Key Quotes (WP-05) or Zotero API
(WP-06). No real storage (P0-STORE), real identity, UI change, Typora rendering certification,
browser/TLS behaviour, PDF/Nutstore/Zotero identifiers, external network, performance/timing claim,
Linux run or host-level isolation claim. WP-04 overall is **not** complete because R1 is only the
first slice; later DECs are required for drafts, quotes, Zotero, real storage and UI acceptance.

See `docs/handoffs/WP-04/QA_HANDOFF.md` for the execution command record template; no offline result
is recorded until the later independent run.
