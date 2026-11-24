# POC-001 — Execution → QA Handoff · REMEDIATION-09 / D007-A32 Option A (LOCAL / SYNTHETIC ONLY)

**From:** Execution Window · 2026-11-24 (Europe/Berlin)
**Transport:** [AUTOMATION_BUS.md](https://github.com/zyyu1/literature-management-system/blob/1653118634302fa0401055e2ca85ac75e76ee112/docs/governance/AUTOMATION_BUS.md) (PROC-BUS-01). This answers DESIGN DISPATCH [#7125862226](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7125862226).

**Authority** (verified on `main` @ `1653118634302fa0401055e2ca85ac75e76ee112` before any edit):
- [D007-A32 R09 G1](https://github.com/zyyu1/literature-management-system/blob/1653118634302fa0401055e2ca85ac75e76ee112/docs/architecture/D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md)
- [REMEDIATION_09.md](https://github.com/zyyu1/literature-management-system/blob/1653118634302fa0401055e2ca85ac75e76ee112/docs/handoffs/POC-001/REMEDIATION_09.md) (sole work order)
- [R09 independent QA plan](https://github.com/zyyu1/literature-management-system/blob/1653118634302fa0401055e2ca85ac75e76ee112/docs/handoffs/POC-001/REMEDIATION_09_QA_PLAN.md)
- The R08 QA report this answers: [#7123738287](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7123738287)

**Scope:** P2-R08-QA-1/2/3 only.

**Boundary:** every socket is 127.0.0.1, and all data and credentials are synthetic. **No real service, credential, PDF or library record.**

**Status:** Execution evidence only. **No G3/G4 claim; no risk closure.** A31 `R08 G4 PARTIAL_NOT_ACCEPTED@49ad24e` and A28 `G4 ACCEPTED_EXACT_SHA LOCAL_SYNTHETIC@ace7b1e` remain historical. P2-R08-QA-1/2/3 stay OPEN until D007-A33.
**G5 NOT_AUTHORIZED · G6 ACCESS-02 BLOCKED · G7 NOT_AUTHORIZED · OVERALL `BLOCKED_REAL_SERVICE`.**

**History:** the previous handoff is [QA_HANDOFF.md @ 49ad24e](https://github.com/zyyu1/literature-management-system/blob/49ad24e82f5895f4b6e5f30cb84b3294229df012/docs/handoffs/POC-001/QA_HANDOFF.md) (R08); earlier handoffs are linked from there.

## 1. Provenance

| Field | Value |
|---|---|
| Branch / PR | `exec/POC-001-webdav-feasibility`, PR #2 OPEN, not merged |
| Original base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` (merge-base) |
| R09 start (preflight) | `49ad24e82f5895f4b6e5f30cb84b3294229df012`. Before any edit, `ls-remote`, the PR REST head and the local HEAD were all equal to it; clean tree; 0 merge commits |
| Lineage | `49ad24e → 8d9929b (R09 code) → (this evidence + docs commit)`. Fast-forward only; **no rebase, no merge of `main`, no force-push** |
| Code commit | `8d9929b5ad9d52ce6f4a29956ac640af932feaac` |
| Evidence | Generated on a **clean tree at `8d9929b`** (`evidence/R09-results.json`: `gitDirtyPaths=(clean)`) |
| **Final PR head** | The commit adding this file. **Its true 40-char SHA is in the EXEC_REPORT and QA_REQUEST bus messages.** |
| Runtime | Node v22.23.5, Linux x64, 2 vCPU. **No new dependency** (`npm ls --all` → `(empty)`) |

**Incremental paths from `49ad24e`**, all on the A32 whitelist:
- `poc/001/src/util.mjs`
- `poc/001/src/webdav-adapter.mjs` (admission wiring only)
- `poc/001/test/r09-regressions.test.mjs` (new)
- `poc/001/scripts/mutation-check.mjs`
- `poc/001/README.md`
- 27 new `poc/001/evidence/R09-*` files (historical evidence untouched)
- this file

**Source blobs, `49ad24e` → `8d9929b`:**

| Status | Files |
|---|---|
| Unchanged | **`safe-api` `ef4d0528404f`**, `api-main` `1498d4901a1b`, `client` `fa9b98d170b0`, `dav-xml` `3d182adf4e46`, `mock-webdav` `1d44839d9e6f`, `note-codec` `6f91c2c5a650` |
| Changed | `util` `7762e4b51cab → 2616c393d1c9`, `webdav-adapter` `fd6325a7ddb0 → bf71c10c64a5` |

- Prior tests changed: **0**. Helpers, package files, CI, `run-evidence.mjs` and `secret-scan.mjs` are unchanged.
- `mutation-check.mjs`: M1–M74 definitions are unchanged. The only removed lines are the two-line R08 comment that wrongly called B5 equivalent.

## 2. Results at `8d9929b` (Execution run; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node scripts/check.mjs` | 0 | 33 files, 0 failures |
| POC-01…07 (each) | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| R01…R07 (each) | 0 each | 21 / 21 / 26 / 17 / 20 / 11 / 4 |
| R08 `r08-readiness` (unedited) | 0 | 38 / 38 |
| **R09** `r09-regressions` | 0 | **11 / 11** |
| `node --test "test/*.test.mjs"` × **5 separate runs** | 0 ×5 | **202 / 202** each (42–44 s) |
| `node scripts/mutation-check.mjs` | 0 | **82 / 82 killed** (793 s). All 35 `expect` mutants were killed on their named assertion. M10 and M73 have the same kill reason as in R08 |
| `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings |
| `npm ls --all` | 0 | `(empty)` |

The R08 191/191×5 and 74/74 are historical and are not re-claimed.

## 3. What changed

### R09-CLEAN-01/02 (P2-R08-QA-1) — cleanup gate

**The fix.** The adapter's `request()` now performs a single admission step before any socket. First `budget.admitDispatch({ method, path, conditional })` decides from the actual method, the canonical path and the phase; the M73 line is unchanged. For a PUT, `budget.admitDispatchWrite(path, bytes)` follows.

**After `beginCleanup()`** (irreversible), only two kinds of request are admitted, each only within the hard cap and only if there is no 401/429 STOP:
- a **conditional** DELETE of an **own** synthetic file (one admitted earlier through write admission), each file **once**;
- **one** PROPFIND of the exact parent collection of an own file.

**Everything else is refused before dispatch, with no slot consumed and no STOP:** PUT, MKCOL, GET, POST, MOVE, COPY, LOCK; a root, foreign or second PROPFIND; and unconditional, foreign or collection DELETEs. Ordinary work is never relabelled as cleanup.

**Compatibility:** the unit-arithmetic helper `admitRequest('cleanup')` (used by the unedited R08 test) remains, but the adapter never calls it. When a request is refused, a hard-cap exhaustion or a 401/429 STOP is reported ahead of the phase rule.

**Measured on the mock (early-cleanup race).** Two writers wrote 20 own files; 68 requests had been used before the extra reads (4 MKCOL, 20 PUT + read-back, an export of 4 PROPFIND + 20 GET), then 7 GETs brought the total to **75**. `beginCleanup()` was called at that point.

| Step | Result |
|---|---|
| **10 straggler PUTs** (both principals, concurrent) | **all 503 `not_saved`** |
| Effect of the stragglers | **0 extra PUT**, storage snapshot unchanged, **0 request slots and 0 cleanup slots used** |
| Adversarial GET, MKCOL, root PROPFIND, foreign DELETE, collection DELETE | all refused; server count stays 75 |
| Cleanup | **20 conditional DELETEs + 1 verification PROPFIND** (114-byte body); namespace empty; a second verification is refused |
| **Server requests** | **96 = 75 + 20 + 1** (budget count = server count) |
| Own files left | **0** |

**Legacy profile kept:** ordinary work STOPs at request 80, so 79 reach the server; 20 DELETEs + 1 verification bring the total to **100**; request 101 is refused with `BUDGET_REQUESTS`. Server count: 100.

### R09-B5-03 (P2-R08-QA-2) — B5 is NOT equivalent

`admitDispatchWrite` is the only file/size gate for a PUT, and it returns the request slot on refusal.

**Test:** the 21st file is refused with `BUDGET_FILES`. It never reaches the store (PUT count 20, snapshot unchanged) and consumes no slot (budget count = server count = 20). With early cleanup and budget left, a new write and an overwrite of an own file are both refused (`CLEANUP_PHASE_ORDINARY_REFUSED`); the store keeps 1 PUT.

**Mutants:**

| Mutant | Change | Killed by |
|---|---|---|
| M80 | adapter ignores a refused write admission | "R09-B5-03 refused write never reaches the store" |
| M82 | the slot is kept on refusal | "refused write consumes no request slot" |

README and the mutation driver now state that the R08 "equivalent" claim is withdrawn.

### R09-Q4B-04 (P2-R08-QA-3) — absolute, not idle, deadline

`safe-api.mjs` is unchanged; this is a test-only change.

| Case | Result |
|---|---|
| Raw PUT trickling 1 byte every 100 ms, with Content-Length | **408 `body_deadline_exceeded` at 1003 ms**, 10 bytes sent, 0 PUT, ledger released |
| Same, chunked | **408 at 1003 ms**, 10 bytes, 0 PUT, released |
| Control: upstream stall after dispatch | **504 Unknown** after more than 1000 ms (adapter 1300 ms), non-terminal |

- **Timing window:** 950–1500 ms.
- **M81** (applied in a disposable copy of `safe-api.mjs` only) makes the timeout reset on every chunk. It is killed by "R09-Q4B-04 absolute deadline fires near 1000 ms despite a continuous trickle".

### R09-SAFE-05 — no unsafe undo or policy bypass

| Case | Result |
|---|---|
| Upstream 401 or 429 on the first cleanup DELETE | `UPSTREAM_<status>` STOP; next DELETE and verification refused; **1 DELETE sent**; **3 residual synthetic files reported, not force-deleted** |
| Write in flight when cleanup begins | stays **Unknown** (ledger `unknown`, verify non-terminal); not retried (2 PUTs total) and not reclassified |
| ACCESS-01 values and 114-byte PROPFIND | unchanged |

**New mutants M75–M82**, all killed on their named assertion:

| Mutant | Change |
|---|---|
| M75 | relabel ordinary work as cleanup |
| M76 | admit any method at dispatch in cleanup |
| M77 | foreign DELETE |
| M78 | verification not single-use |
| M79 | unconditional DELETE |
| M80 | B5 |
| M81 | Q4b |
| M82 | slot kept on refused write |

## 4. Residuals, NOT_RUN, UNSUPPORTED

- **Execution-observed P0/P1:** none in the tested scope.
- **Residuals:**
  - A write already dispatched and Unknown may leave a file that cleanup cannot safely claim; this needs operator quarantine.
  - A 401/429 during cleanup leaves residual synthetic files (reported).
  - The A31 risk states are otherwise unchanged.
- **NOT_RUN / UNSUPPORTED:**
  - real Nutstore, WebDAV, TLS, DNS, quotas and 401/429 behaviour;
  - Q1e;
  - production budget, paging and capacity;
  - other hardware;
  - the A25 resource campaign.
- **Real-service access:** zero.

## 5. QA instructions (R09 QA plan)

1. **Preflight.** Use the separately user-opened QA window. Run `git ls-remote` (exit 0, expected final SHA), make a fresh clone, detach at the final SHA from the QA_REQUEST, and confirm a clean tree. Verify:
   - PR #2 OPEN and not merged;
   - merge-base `1c084e5`;
   - `49ad24e` is an ancestor;
   - 0 merge commits;
   - the A32 whitelist;
   - `safe-api.mjs` and the other unchanged blobs above;
   - the M1–M74 definitions.

   On any failure, report `G3_INDEPENDENCE_PENDING` or FAIL and STOP.
2. **Regression.** Run each POC-01…07 and R01…R09 suite, `check.mjs`, the full suite ×5 separately, `mutation-check.mjs` (about 13 minutes), the secret scan against `1c084e5` and `npm ls --all`.
3. **Own probes.** Build your own two-writer early-cleanup stand-in at 75 requests: 10 stragglers, a forged `cleanup` label, GET/MKCOL/extra PROPFIND/foreign or recursive DELETE, an invalid If-Match, a lost-ACK Unknown, and 401/429. Also run your own raw trickle (100–150 ms) across the 1000 ms deadline, and your own B5 and Q4b mutants in disposable copies.
4. **Report.** Post one bus message `kind=QA_REPORT` to `DESIGN` on PR #2 with `R09 LOCAL_STAGE=PASS / PARTIAL / FAIL`, `G3_INDEPENDENCE=VERIFIED / PENDING` and `OVERALL POC-001=BLOCKED_REAL_SERVICE`. Only `PASS_LOCAL_CANDIDATE_FOR_D007_A33` may be recommended. Then QA STOP.

**EXECUTION STOP — independent G3 by the separately user-opened QA window. PR #2 OPEN / NOT MERGED.**
