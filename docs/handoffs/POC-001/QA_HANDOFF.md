# POC-001 — Execution → QA Handoff · REMEDIATION-04 / D007-A23 (LOCAL MOCK ONLY)

**From:** Execution Window · 2026-11-23 (Europe/Berlin)
**Authority:** [REMEDIATION_04.md @ `489c450`](https://github.com/zyyu1/literature-management-system/blob/489c4508c4c059c1f7f9829961a08faa3d6b2ab1/docs/handoffs/POC-001/REMEDIATION_04.md), [A23 disposition](https://github.com/zyyu1/literature-management-system/blob/489c4508c4c059c1f7f9829961a08faa3d6b2ab1/docs/architecture/D007_A23_POC001_REMEDIATION04_DISPOSITION.md) and the [R04 QA plan](https://github.com/zyyu1/literature-management-system/blob/489c4508c4c059c1f7f9829961a08faa3d6b2ab1/docs/handoffs/POC-001/REMEDIATION_04_QA_PLAN.md). These sit within the R03/R02/R01 authorizations and the original [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md).
**Boundary:** in-repo loopback mock and **synthetic data only**. **No real Nutstore or Zotero, no external WebDAV, no credentials, no PDFs or notes.** **Real Nutstore: `BLOCKED_REAL_SERVICE`; OVERALL POC-001 cannot PASS.** Execution does **not** self-certify `LOCAL_STAGE PASS`; G4 is Design's decision (D007-A24).
**History (preserved):** handoffs at [65e14af](https://github.com/zyyu1/literature-management-system/blob/65e14afc81e6de37ba5fac90c2937a27876c5614/docs/handoffs/POC-001/QA_HANDOFF.md), [2806d9d](https://github.com/zyyu1/literature-management-system/blob/2806d9d08dcec78e974703a82a38a696ae76d132/docs/handoffs/POC-001/QA_HANDOFF.md), [74d00f2](https://github.com/zyyu1/literature-management-system/blob/74d00f2bf6d6be5a55f43b359a416437e7e3e0c3/docs/handoffs/POC-001/QA_HANDOFF.md) and [4bfa924](https://github.com/zyyu1/literature-management-system/blob/4bfa924af2d20cd383c4e49f982f55ac83423a42/docs/handoffs/POC-001/QA_HANDOFF.md). The latest independent QA is [7090201835](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7090201835) (PARTIAL at `4bfa924`; Q1c).

## 1. Provenance and lineage

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (existing) |
| Original authorized base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. `git merge-base HEAD 1c084e5…` returns `1c084e5…` |
| Pre-R04 HEAD | `4bfa924af2d20cd383c4e49f982f55ac83423a42`. Preflight confirmed the local HEAD, the remote branch and the PR #2 head all equalled it, with a clean tree, before any edit |
| Lineage | `4bfa924 → 1b37268 (code) → 698660d (evidence) → (this handoff commit)`; fast-forward only; **no rebase, no merge of `main`, no force-push, no cherry-pick of Design docs** |
| R04 code commit | `1b372681c07e6e3e02ab7f2d1c642e01ee317197` |
| R04 evidence commit | `698660d1bd71cea67dcfef70b0983a6be18eeab8`, generated on a clean tree at `1b37268` (`results.json`: `gitHead=1b37268…`, `gitDirtyPaths=(clean)`) |
| **Final PR head** | the commit adding this file (parent `698660d`). **Its true 40-char SHA is in the PR #2 update comment**; no self-referential hash is claimed here. |
| `main` observed | `489c4508c4c059c1f7f9829961a08faa3d6b2ab1` (A23). `git merge-tree --write-tree` reported no conflict at that moment |
| Runtime | Node v22.23.5, npm 10.9.9, Linux x64, 127.0.0.1 only |
| Dependencies | **none added**. `npm ls --all` is empty; `poc/001/package.json` and `package-lock.json` are unchanged |

**Cumulative paths** (`1c084e5…HEAD`): 51, all `poc/001/**` plus this file.

**Incremental paths** (`4bfa924…HEAD`):
- `poc/001/{README.md, scripts/mutation-check.mjs, scripts/run-evidence.mjs, src/dav-xml.mjs, src/webdav-adapter.mjs, test/r04-regressions.test.mjs}`
- 22 files under `poc/001/evidence/`
- this file.

No earlier authorization file, ACCESS policy, `docs/{architecture,governance,ui}/**`, `docs/handoffs/{002,WP-01}/**`, `.github/**`, `app/**`, `src/**`, root package files or deployment configuration was touched.

## 2. NEW results at `1b37268` (Execution run; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node --version` | 0 | v22.23.5 |
| `node scripts/check.mjs` | 0 | 25 files, 0 failures |
| POC-01…07 (each file) | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| R01 / R02 / R03 | 0 each | 21 / 21 · 21 / 21 · 26 / 26 |
| **R04** `node --test test/r04-regressions.test.mjs` | 0 | **17 / 17** |
| `node --test "test/*.test.mjs"` × **5 separately executed, committed runs** | 0 ×5 | **118 / 118** each |
| `node scripts/mutation-check.mjs` | 0 | **37 / 37 killed** (M31–M37 new) |
| `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings over 48 files *at `1b37268`* (heuristic; the count grows with the evidence and handoff commits) |
| `npm ls --all` | 0 | `(empty)`, path sanitized |

POC-05: A won 26 rounds and B won 24 over 50. The evidence was checked: no workspace paths and no synthetic credentials or keys. **Mock modes:** generation (default); content-hash and weak; `propfindOverride` fixtures for every R04 listing case; fault injection as in R02/R03. **The 101/101 and 30/30 results at `4bfa924` are historical and not re-claimed.**

## 3. R04-1 — XML hierarchy repair (mandatory Q1c gate)

`parseMultistatus` now calls `validateStructure` over the **whole parsed tree**:
- Every DAV structural element must sit under its direct-parent rule: `response`→`multistatus`; `href`/`propstat`→`response`; `status`→`response|propstat`; `prop`→`propstat`; `resourcetype`→`prop`; `collection`→`resourcetype`; `responsedescription`→`multistatus|response|propstat`.
- Child allowlists apply to `multistatus` (`response`, `responsedescription`), `response` (`href`, `status`, `propstat`, `responsedescription`) and `propstat` (`prop`, `status`, `responsedescription`).
- `href`, `status` and `responsedescription` must be text-only.
- A foreign-namespace `multistatus`/`response`/`propstat`/`href` is refused anywhere.

Existing size limits, DTD/entity refusal, namespace-URI matching, href validation and duplicate detection are unchanged. This is a **conservative POC profile**: some rejected shapes are legal RFC 4918 extensions, and rejecting them does not claim they are invalid.

**QA's four variants** — each run on 3 actually stored records (2 notes + 1 project), with the fixture XML printed into `evidence/R04-regressions.txt`:

| Case | Parser | API | Bundle | Upstream writes / storage |
|---|---|---|---|---|
| R04-Q1c-01 foreign `x:wrap` around a `DAV:response` | throws | **503 export_incomplete** (`malformed_listing`) | none | 0 / snapshot unchanged |
| R04-Q1c-02 `DAV:response` nested in `DAV:response` | throws | **503** | none | 0 / unchanged |
| R04-Q1c-03 `DAV:response` inside `DAV:responsedescription` | throws | **503** | none | 0 / unchanged |
| R04-Q1c-04 foreign-namespace `x:response` | throws | **503** | none | 0 / unchanged |

**R04-Q1c-05**, 14 further shapes, each → parser throws and 503 with zero write effects:
- `href` in `propstat`;
- `propstat` under `multistatus`;
- `status` in `prop`;
- `prop` under `response`;
- `resourcetype` under `propstat`;
- `collection` under `prop`;
- `multistatus` in `prop`;
- unknown DAV root child (`sync-token`);
- foreign root wrapper;
- foreign child of `response`;
- foreign child of `propstat`;
- foreign `response` inside a property;
- an element inside `href`;
- stray text in `multistatus`.

## 4. R04-2 — collection status

- The parser now reads `resourcetype/collection` **only from propstats whose own status is 2xx**.
- **Found during R04:** the adapter also treated any href ending in `/` as a collection, which would have let a 404-only marker pass indirectly. That fallback is removed (mutant M37).

| Case | Result |
|---|---|
| COL-01: `notes/` collection marker only in a 404 propstat | parser `collection:false` → `503 export_incomplete` (required kind not a collection) |
| COL-02: 2xx collection plus a separate 404 for unrelated `displayname` | accepted, `200 count 3` |
| COL-03: response-level status together with propstat | still rejected |

## 5. R04-3 — Q5 limitation (documentation only)

README item 12 now states that **any fence that was applied but not authoritatively confirmed** can strand the original operation as `indeterminate, terminal:false`, possibly indefinitely. This covers a missing, weak or untrusted PUT ETag; a misleading PUT ETag; a read-back error, timeout or ETag/byte mismatch; apply-then-503; and apply-then-hang. Its ledger entry **keeps occupying the principal's quota slot**, and **sibling Unknown operations on the same record** become unresolvable. It is a **P2 liveness and availability limitation**. No recovery mechanism was added, no slot is freed, and no definite verdict is fabricated. Pinned by `R04-Q5-01` ×7 classes plus the sibling case (INFO tests).

## 6. Non-regression and findings

- **Non-regression:** `R04-POS-01` accepts `responsedescription` text at three levels, a foreign *property* inside `DAV:prop`, and the `D:` / default / `q:` prefixes; export → fresh restore → `restored 3`. All R03 cases (Q1a/b/d/e, Q2, Q3, Q4, Q5), R02, R01 and POC-01..07 still pass.
- **Execution-observed P0/P1:** none in the tested scope. This is not a claim that none exist.
- **Residual P2 (declared):** Q4a–c and Q5 (widened).
- **UNSUPPORTED / not claimed:**
  - omission of a record by an otherwise well-formed listing (Q1e);
  - multi-file snapshot consistency;
  - the provider's PUT/GET/`If-Match` validator agreement, atomic `If-Match`, ETag change on identical bytes, `MKCOL` atomicity and real PROPFIND shapes;
  - durable or global exactly-once;
  - cross-key restore, key rotation and rollback detection;
  - real TLS.
- **Confirmed:** no real-service testing of any kind. GitHub was used only for fetch, push and the PR comment.

## 7. QA instructions (per R04 QA plan)

1. Take the true final head from the PR #2 update comment. Run a fresh clone, `git rev-parse HEAD`, and confirm `git status --short` is clean. Check that `git merge-base HEAD 1c084e5…` returns `1c084e5…` and that `git merge-base --is-ancestor 4bfa924af2d20cd383c4e49f982f55ac83423a42 HEAD` succeeds. Check both path inventories.
2. In `poc/001`, run:
   - `check.mjs`;
   - POC-01..07 and R01–R04;
   - the full suite ×5;
   - `mutation-check.mjs` (about 9 min);
   - `secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`.

   Do **not** run `npm run evidence` in the checkout.
3. With an **independent** loopback double, cover R04-Q1c-01..05, R04-COL-01/02, R04-POS-01, R04-Q5-01 and R04-MUT-01, plus the R04-REGRESSION matrix.
4. Report `LOCAL_STAGE PASS/PARTIAL/FAIL`, per-area status, P0/P1/P2, UNSUPPORTED and `OVERALL POC-001: BLOCKED_REAL_SERVICE` in PR #2. Do not modify code. STOP for D007-A24.

**EXECUTION STOP — HAND OFF TO INDEPENDENT G3 QA. PR #2 OPEN / NOT MERGED; no rebase, no ACCESS-02, no deployment.**
