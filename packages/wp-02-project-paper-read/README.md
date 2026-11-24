# WP-02 — synthetic read-only Project / Paper slice

**Status: LOCAL_SYNTHETIC_ONLY, READ-ONLY. Not production-suitable. Not a real API.**
Authority: D007-A56 (G1 via DEC-6=A), `docs/handoffs/WP-02/DESIGN.md`, `docs/handoffs/WP-02/QA_INSTRUCTION.md`, egress D007-A54 §3 / A55.
Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`.

Fixtures, both read-only:
- `docs/handoffs/WP-02/fixtures/wp02.v1.json`: SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`.
- The WP-01 fixture `86c47a5a…be65`.

## How it relates to WP-01 (unchanged)
WP-01's server has a closed route table. To add routes without editing WP-01 (A56 forbids that), WP-02 ships its **own** server factory, `createProjectPaperReadServer()`. It composes the merged WP-01 modules by **read-only import**:
- `wp-01-synthetic-auth-api/src/store.mjs` provides fake principals and Sessions, revocation and expiry, and the fake clock;
- `wp-01-synthetic-auth-api/src/policy.mjs` provides path parsing, limits and constants;
- `wp-01-synthetic-auth-api/support/harness.mjs` provides the loopback-only test client.

`packages/wp-01-synthetic-auth-api/**` is byte-identical to Base. `test/wp01-regression.test.mjs` checks every file against a SHA-256 manifest taken from Base, and re-runs the WP-01 suite (67/67).

## Routes (GET only)
| Route | Returns |
| --- | --- |
| `GET /api/v1/projects?state=active\|archived\|all` (default `active`) | For each readable Project: `id`, `name`, `archived`, `revision`, `paperCount`, `importantCount`. |
| `GET /api/v1/projects/{projectId}/papers` | `project`, `archived`, and one row per association. Each row carries the identity tuple, metadata, the **global** `readingStatus` and `noteState` (`PRESENT`/`EMPTY`), and the **project-local** `important`. |
| `GET /api/v1/papers/{libraryType}/{libraryId}/{itemKey}` | The canonical paper (metadata, global `readingStatus`, five-field `note` or `null`) and its `associations` (`projectId`, `archived`, `important`) in readable Projects only. |
| `GET /api/v1/health` | `LOCAL_SYNTHETIC_ONLY`, `readOnly:true`, `productionSuitable:false`. |

## Rules implemented
- **R-ID:** a paper's identity is `(ownerScope, libraryType, libraryId, itemKey)`.
  - Loading a duplicated tuple or a duplicated association throws `STOP`.
  - Title and DOI never merge papers.
  - The test-only `seedImport()` (fixture `importAttempts`) never creates a second paper or link. It is not an HTTP import API.
- **R-SCOPE:** `readingStatus` and `note` are per paper. `important` lives only on the association.
- **R-AUTH:**
  - The WP-01 Session rules apply: a revoked, expired, invalid or duplicated cookie gets `401`.
  - OWNER and WORKSPACE_READONLY may read their owner's data.
  - FOREIGN, ANONYMOUS (no cookie), a foreign resource and a missing resource all get the **byte-identical** `403 NOT_AVAILABLE`.
- **R-RO:** every non-GET method on a WP-02 route returns `405` with `Allow: GET`. This happens before any auth or processing. Request bodies are never read, and nothing is dispatched. The test harness asserts that the catalog state digest is unchanged after **every** server instance.
- **R-BYTES:** note strings are stored and returned verbatim: no NFC, no trim, no CRLF rewrite.
- **R-LIMITS:**
  - The server binds `127.0.0.1` on port `0` only.
  - Declared request bodies larger than 64 KiB get `413`. Responses larger than 256 KiB become a bounded `500 RESPONSE_LIMIT`. Above 5000 requests per instance, the server answers `429`; tests may lower this budget but never raise it.
  - Strict ID grammar: `libraryType ∈ {user, group}`, `libraryId` `[A-Za-z0-9]{1,64}`, `itemKey` `[A-Za-z0-9]{1,32}`, `projectId` `[a-z][a-z0-9_]{0,63}`.
  - Unknown query parameters get `400`.
  - Logs hold only `t`, `method`, the route template, `status` and `code`.

## Exact commands (A54/A55: git outside the namespace, every test inside it)
```bash
mkdir -p /tmp/offline && for f in run-offline.sh lo-up.py egress-probe.mjs; do git show origin/main:tools/offline/$f > /tmp/offline/$f; done && chmod +x /tmp/offline/run-offline.sh
/tmp/offline/run-offline.sh node /tmp/offline/egress-probe.mjs                 # EGRESS_PROBE=PASS, exit 0
cd packages/wp-02-project-paper-read
node --check src/server.mjs
/tmp/offline/run-offline.sh node --test                                         # WP-02 suite (includes nested WP-01 67/67)
(cd ../wp-01-synthetic-auth-api && /tmp/offline/run-offline.sh node --test)     # WP-01 suite on its own
/tmp/offline/run-offline.sh node scripts/mutation-check.mjs                     # 13 mutants, each must be KILLED by its named test
```
`test/transport.test.mjs` asserts that only `lo` exists and that no proxy variables are set. The suite therefore fails closed outside the namespace.

## Tests
| File | Q |
| --- | --- |
| `identity` | Q2-01, Q2-02 + STOP guards |
| `projects-list` | Q2-03 |
| `scope-associations` | Q2-04, Q2-05, Q2-09 |
| `auth-neutral` | Q2-06, Q2-07 (GET) |
| `readonly` | Q2-07 (non-GET), Q2-08 |
| `transport` | Q2-10 + egress + provenance |
| `wp01-regression` | Q2-11 |

## Not covered
UI, Zotero import or API, writes (Important toggle, reading status, note), real identity, durable storage, devices, real TLS or browser. G5, G6 and G7 are not claimed.
