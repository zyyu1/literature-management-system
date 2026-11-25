# WP-03-R1 — guarded routine writes (synthetic contract double)

**Status: LOCAL_SYNTHETIC_ONLY, MEMORY_ONLY, FAKE_ONLY. Not production-suitable. Not a real API and
not a datastore.**
Authority: D007-A65, `docs/handoffs/WP-03/DESIGN.md` (WP-03-R1) and
`docs/handoffs/WP-03/QA_INSTRUCTION.md`, executed on Base
`1684cea5623c8421e16c328c7f1464e8932d3118`, branch `exec/WP-03-guarded-r1-writes`.
R1 is the first WP-03 slice; it is not full WP-03, not R2, and not a UI acceptance.

This package is isolated: it adds routes only on its **own** server factory and never edits
`packages/wp-01-synthetic-auth-api/**`, `packages/wp-02-project-paper-read/**`, the fixtures, the
helpers, the manifests, the tools or any other path. The only other allowed write is
`docs/handoffs/WP-03/QA_HANDOFF.md`.

## Frozen inputs

| Fixture | Bytes | SHA-256 |
| --- | --- | --- |
| `docs/handoffs/WP-01/fixtures/wp01.v1.json` | 4573 | `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` |
| `docs/handoffs/WP-02/fixtures/wp02.v1.json` | 4989 | `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888` |

Both are accepted only as raw bytes matching that byte length and digest, verified **before**
`JSON.parse`; anything else throws `UNSAFE_CONFIG` before a model exists. The parsed data is cloned
into one in-memory WP-03 model. Fixture files are never written.

## Composition by read-only import

- `wp-01-synthetic-auth-api/src/store.mjs` — fake principals, Sessions, revocation/expiry, CSRF
  primitive and fake clock. WP-01's fake mutation backend and its separate fake Project state are
  **not used**.
- `wp-01-synthetic-auth-api/src/policy.mjs` — limits, `Denial`/`OUTCOME`, `OP_ID_RE`, path parsing,
  prototype-key guard, fingerprint helper.
- `wp-02-project-paper-read/src/catalog.mjs` — canonical `(ownerScope, libraryType, libraryId,
  itemKey)` tuple and the frozen-fixture validation gate. Its immutable objects are cloned into the
  one mutable WP-03 model.

`wp-03`'s own `src/model.mjs` is the only authoritative Project/Paper/association state.

## Routes (`/api/v1`, 127.0.0.1, ephemeral port)

| Route | Meaning |
| --- | --- |
| `GET /health` | `LOCAL_SYNTHETIC_ONLY`, `FAKE_ONLY`, `MEMORY_ONLY`, `productionSuitable:false`, `r2MutationEnabled:false`, `runId` |
| `GET /projects?state=active\|archived\|all` | WP-02 owner/workspace projection on the new state + `runId` and scoped revisions |
| `GET /projects/{projectId}/papers` | WP-02 projection + `readingStatusRevision` / `importantRevision` per row |
| `GET /papers/{libraryType}/{libraryId}/{itemKey}` | WP-02 canonical paper + readable associations, exact note bytes, status/important revisions |
| `POST /projects` | Create an empty active Project (`If-None-Match: *`) |
| `PATCH /projects/{projectId}` | One intent: `RENAME` (name), `ARCHIVE`, `RESTORE` (`If-Match`) |
| `PATCH /papers/{libraryType}/{libraryId}/{itemKey}/reading-status` | Global `SET_READING_STATUS` over `To Read` / `Reading` / `Read` (`If-Match`) |
| `PATCH /projects/{projectId}/papers/{libraryType}/{libraryId}/{itemKey}/important` | Per-association `SET_IMPORTANT` boolean (`If-Match`); archived Project → `409 PROJECT_ARCHIVED` |
| `DELETE /projects/{projectId}` | R2, negative-only: `403 STEP_UP_REQUIRED` |
| `DELETE /projects/{projectId}/papers/{libraryType}/{libraryId}/{itemKey}` | R2 Current unlink, negative-only |
| `POST /papers/{libraryType}/{libraryId}/{itemKey}/unlink-all` | R2 All unlink, negative-only |

Request bodies are closed objects carrying `operationId`, `modelRunId`, an explicit `scope`
(`PROJECT` / `GLOBAL_PAPER` / `PROJECT_ASSOCIATION`), the exact `action`, and only the action's
value (`name` for create/rename, `value` for status/important). Unknown or duplicate fields,
client `ownerId`/`role`/`revision`/step-up/risk/fault overrides are rejected before dispatch.
A name must be non-blank, free of C0/C1/DEL control characters, at most 256 UTF-8 bytes, well-formed
Unicode (no lone surrogates), and is stored/returned byte-exactly (no trim, no NFC, no case fold).
Scope mismatch is `400`; invalid enum/type is `422`.

Preconditions are exact: one strong quoted opaque `If-Match` matching the resource-specific
revision for updates (`428` when missing, `400` when malformed/weak/multiple/wildcard/unexpected,
`412` when stale after authorization), and exactly `If-None-Match: *` for create. A create collision
is the same byte-identical `412` for an own or foreign existing ID; it never reveals ownership.

## Guards, outcomes and idempotency

- Every instance has an opaque `runId`; every Project, every global ReadingStatus and every
  association Important has its own opaque revision derived from `runId + frozen identity +
  generation` — never a client value and never a clock. All 14 initial revisions are distinct.
- Project create/rename/archive/restore never touches associations, ReadingStatus, notes or other
  Projects. ReadingStatus is global per canonical paper and visible through every linked Project
  (including archived ones) with no Important/note change. Important is per association only and
  never creates a link.
- The ledger is keyed by authenticated principal + `operationId` and binds runId, route, action,
  scope, target, canonical payload and the raw precondition fingerprint. An exact replay returns
  the original simulated outcome/revision with `dispatched:false`, `saved:false`, `durable:false`,
  `outcomeBasis:"MODEL_ONLY"` and never dispatches again. A changed fingerprint under the same ID is
  `409 OPERATION_ID_REUSE`. Cross-principal reuse is denied neutrally. A fresh instance rejects old
  runIds (`409 STALE_MODEL_RUN`) and old revisions (`412`) before dispatch.
- Authorization is revalidated at the synchronous commit boundary, together with model
  compare/apply and the ledger write: there is no `await` between the checks and the commit, so two
  writers holding one revision cannot both commit.
- Outcomes: `200/201 CONFIRMED` (`outcomeBasis:MODEL_ONLY`, `saved:false`, `durable:false`,
  `simulated:true`); `412/409/428 CONFLICT` with `dispatched:false`; `202` accepted-not-committed
  `UNKNOWN`; `504` lost-ack-after-commit `UNKNOWN` (state actually committed); a real socket drop
  after commit leaves the client `UNKNOWN`; an unexpected post-dispatch error or an oversized
  confirmed response becomes conservative `UNKNOWN`, never a fabricated definite failure. An
  unresolved-UNKNOWN target is quarantined (`409 TARGET_QUARANTINED` for new operations) until the
  instance ends; unrelated targets still work. No reconciliation, durable replay or crash recovery
  is claimed.
- Test-only controls exist only on the in-process object (`control.setNextFault`,
  `setGateDelayMs`, `beforeCommit`, `snapshot`, `stateDigest`, …). They are never reachable over
  HTTP; fault names are never returned.
- R2 remains disabled: after authentication/scope, a valid Owner target gets
  `403 STEP_UP_REQUIRED` with `mutationEnabled:false` and `dispatched:false`; forged step-up,
  confirmation or risk fields cannot enable it; foreign/missing targets stay neutral. There is no
  global delete/unlink route and nothing is deleted or unlinked.

## Limits and safety

127.0.0.1 port `0` only (other host/port refused before a socket exists); inert until `listen()`.
WP-01 limits: 64 KiB request, 256 KiB response, 2048-byte path, 5000 requests, bounded headers and
timeouts, non-loopback sockets destroyed. Exact origin allowlist with `Vary: Origin`; no wildcard
CORS; Fetch Metadata required; `application/json` only; strict UTF-8; closed schema with duplicate
key detection; unsupported methods/queries, absolute-form/protocol-relative targets, encoded
separators, traversal, NUL and prototype keys fail closed; no redirects or proxying. `GET` and
unknown routes never mutate. Logs contain only time, method, route template, status and code — no
cookies, CSRF tokens, bodies, notes, operation IDs or resource IDs.

## Exact commands

Node exactly `v22.23.5` x64. Windows development path used here:
`D:\claude\literature management system\.work\node22\node-v22.23.5-win-x64\node.exe`.

```powershell
cd packages/wp-03-guarded-r1-writes
node --check src/fixtures.mjs
node --check src/strict-json.mjs
node --check src/contract.mjs
node --check src/model.mjs
node --check src/server.mjs
node --check support/harness.mjs
node --check scripts/mutation-check.mjs
node --test                                  # full suite, default discovery
node scripts/mutation-check.mjs              # 13 named mutants, each killed by its named test
```

On the accepted isolated QA host (offline/A59-A62 boundary) run the suite with the strict upstream
verification enabled:

```powershell
$env:WP03_REQUIRE_OFFLINE_UPSTREAM = '1'
node --test
```

Without that variable, a development host that is online records the frozen egress-precondition
failure explicitly (`HOST_PRECONDITION_ONLY`) and still fails on any other upstream regression. The
suite also spawns the frozen suites itself: WP-01 67 tests, WP-02 44 tests (which nest WP-01). The
protected-blob check proves every Base path outside the whitelist is byte-identical.

The frozen WP-02 committed mutation driver must be run on the isolated QA host:

```powershell
cd ../wp-02-project-paper-read
node scripts/mutation-check.mjs
```

## Tests

| File | Covers |
| --- | --- |
| `test/fixture-identity.test.mjs` | Q3-01 |
| `test/project-writes.test.mjs` | Q3-02 |
| `test/reading-status.test.mjs` | Q3-03 |
| `test/important.test.mjs` | Q3-04 |
| `test/preconditions.test.mjs` | Q3-05 |
| `test/operation-ledger.test.mjs` | Q3-06 |
| `test/faults.test.mjs` | Q3-07 |
| `test/auth-negative.test.mjs` | Q3-08 |
| `test/r2-negative.test.mjs` | Q3-09 |
| `test/transport.test.mjs` | Q3-10 |
| `test/upstream-regression.test.mjs` | Q3-11 |

The suite uses its own loopback-only client plus the WP-01 fake client by read-only import and
contains no skips/todos. The in-process egress spy is not an OS isolation claim.

## Mutation driver

`scripts/mutation-check.mjs` copies this package plus the frozen dependencies and fixtures into a
scratch tree **outside the repository** (OS temp when writable, otherwise the clone's parent
directory), applies one exact mutation per mutant, runs the relevant behavioural test files, and
requires a named failing test — not a crash or timeout. Mutants: drop owner scope; allow Workspace
write; skip CSRF; bypass revision compare; duplicate operation dispatch; accept changed fingerprint;
false CONFIRMED/saved on UNKNOWN; make ReadingStatus Project-local; make Important global; allow R2
destructive dispatch; case-fold identity; accept an old runId; fake DEFINITE_FAILURE after a
possible dispatch. All 13 are killed; `MUTATION_SUMMARY killed=13/13`.

## Not covered (NOT_COVERED)

No real identity/provider, database, durable persistence, cross-process CAS, crash recovery,
reconciliation, backup/restore or durable replay. No R2 success path, step-up grant, confirmation
consumption, permanent Project delete, Current/All unlink success, note editing, import, batch,
quotes, export or UI change. No PDF/Zotero/Nutstore, no real identifiers, no external network, no
browser/TLS behaviour, no performance or timing claim, no Linux run and no host-level isolation
claim. WP-03 overall is **not** complete because R1 passes; A16 R2 and P0-STORE remain deferred.

See `docs/handoffs/WP-03/QA_HANDOFF.md` for the execution command record, upstream results and the
NOT_RUN list.
