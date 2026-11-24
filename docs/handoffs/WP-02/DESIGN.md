# WP-02 — Project / Paper read slice (synthetic) — Design

**Status:** DESIGN, pending user approval DEC-6 (board seq 6). Source: user choice DEC-5=A (bus `MANAGEMENT_TO_EXECUTION.md` seq 5). Builds on WP-01, which is merged to `main` at `11b5f172dde7c0cb3e0665a8da2949df958d9986` ([A55](../../architecture/D007_A55_WP01_EXACT_G4_PASS_LOCAL.md)).
**Traceability:** [A10](../../architecture/D007_A10_IMPLEMENTATION_WORKPACKAGES.md) WP-02 row; A6-01, A6-02; E9-01, E9-02; and the U6-L1-01..03 and U6-L4-01 *data contracts* only. The frozen UI is not implemented here. Import (U6-L2-02) and writes are out of scope.

## 1. Scope
This package is **read-only**. It is a synthetic HTTP API layered on the WP-01 auth/session boundary and adds three GET routes:

| Route | Returns |
| --- | --- |
| `GET /api/v1/projects?state=active\|archived\|all` (default `active`) | For each Project the caller may read: `id`, `name`, `archived`, `revision`, `paperCount`, `importantCount`. |
| `GET /api/v1/projects/{projectId}/papers` | One row per association. Each row has the paper identity (`libraryType`, `libraryId`, `itemKey`) and its metadata (`title`, `creators`, `year`, `doi`). It also has the **global** `readingStatus`, the **global** `noteState` (`PRESENT`/`EMPTY`), and the **project-local** `important`. Archived Projects are readable and carry `archived:true`. |
| `GET /api/v1/papers/{libraryType}/{libraryId}/{itemKey}` | The canonical paper: metadata, global `readingStatus`, the five-field `note` (or `null`), and `associations` (`projectId`, `archived`, `important`). Associations are limited to Projects the caller may read. |

## 2. Rules
- **R-ID** — paper identity is the tuple `(ownerScope, libraryType, libraryId, itemKey)`.
  - The same tuple linked to N Projects is still **one** canonical paper (A6-01).
  - The same `itemKey` in a different library is a different paper (A6-02).
  - Identical title or DOI **never** merges papers.
  - Re-importing an existing tuple (fixture `importAttempts`) creates no second record. This is modelled as a test-only seeding call, not as an import API.
- **R-SCOPE** — `readingStatus` and the note are global per paper. `important` is per association (D001/A6).
- **R-AUTH** — the WP-01 Session/Origin rules apply unchanged.
  - **OWNER** reads its own data.
  - **WORKSPACE_READONLY** may call all three GETs (D006 read-only).
  - **FOREIGN**, **ANONYMOUS**, a foreign resource and a non-existent resource all get the **byte-identical** neutral `403 NOT_AVAILABLE`, exactly as in WP-01.
- **R-RO** — any non-GET method on a WP-02 route returns `405 METHOD_NOT_ALLOWED`, with no dispatch and no state change. A state digest taken before and after the full test run must be equal.
- **R-BYTES** — note text is returned byte-identical to the fixture: Unicode, formulas, emoji and the escaped `\r\n`.
- **R-LIMITS / transport** — the WP-01 limits, loopback-only binding and A54 network-namespace execution all apply. There are no new dependencies.
- **STOP** (A10) — any of the following stops the work package:
  - a cross-scope leak (a foreign paper or Project is visible, or its existence is distinguishable);
  - a duplicated global paper.

## 3. Fixture
[`fixtures/wp02.v1.json`](fixtures/wp02.v1.json) is written by Design and must not be edited.
- SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`, git blob `f1958fd288a3fdac57725e0ac1c7920aee456af0`, 4989 B.
- It reuses the WP-01 principals and sessions by reference.
- Its `expected` block is Design's oracle.

## 4. Not covered
UI, Zotero import or API, writes (Important toggle, status, note), real identity, durable storage, devices.
