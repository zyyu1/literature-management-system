# POC-001 — Execution → QA Handoff · REMEDIATION-10 / D007-A39 (LOCAL / SYNTHETIC ONLY)

**From:** Execution Window · 2026-11-24 (Europe/Berlin)

**Bus:** answers DESIGN DISPATCH [#7128212608](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7128212608) on PR #2, which itself responds to R09 QA [#7127423472](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7127423472).

**Authority,** read at Design `main` @ `65ef66a712196962773c7b1fa1b5d7901203e106`:
- [D007-A39 G1](https://github.com/zyyu1/literature-management-system/blob/65ef66a712196962773c7b1fa1b5d7901203e106/docs/architecture/D007_A39_POC001_REMEDIATION_10_G1_AUTHORIZATION.md)
- [A33 R09 G4 PARTIAL](https://github.com/zyyu1/literature-management-system/blob/65ef66a712196962773c7b1fa1b5d7901203e106/docs/architecture/D007_A33_R09_G4_PARTIAL_DISPOSITION.md)
- [REMEDIATION_10](https://github.com/zyyu1/literature-management-system/blob/65ef66a712196962773c7b1fa1b5d7901203e106/docs/handoffs/POC-001/REMEDIATION_10.md) (the only work order)
- [R10 QA plan](https://github.com/zyyu1/literature-management-system/blob/65ef66a712196962773c7b1fa1b5d7901203e106/docs/handoffs/POC-001/REMEDIATION_10_QA_PLAN.md)
- [ACCESS_POLICY](https://github.com/zyyu1/literature-management-system/blob/65ef66a712196962773c7b1fa1b5d7901203e106/docs/handoffs/POC-001/ACCESS_POLICY.md)

**Scope:** **P2-R09-QA-1 only.**

**Status:** Execution evidence only; no G3/G4 claim and no risk closure. A33 (R09 G4 PARTIAL @ `bcc4738`) and all earlier dispositions are historical. INFO-1 and C9 stay INFO.

**Gates:** G5 NOT_AUTHORIZED · G6 ACCESS-02 BLOCKED · G7 NOT_AUTHORIZED · OVERALL `BLOCKED_REAL_SERVICE`.

**History:** previous handoff [QA_HANDOFF.md @ bcc4738](https://github.com/zyyu1/literature-management-system/blob/bcc47380deb7c6e48964ca5ca77303a213fade28/docs/handoffs/POC-001/QA_HANDOFF.md) (R09); earlier handoffs are linked from there. Q1E-L3 (PR #4) is separate and untouched.

## 1. Provenance

| Field | Value |
|---|---|
| R10 start (preflight) | `bcc47380deb7c6e48964ca5ca77303a213fade28`. Before any edit, `ls-remote` = PR REST = local HEAD; clean tree; merge-base `1c084e5`; 0 merges |
| Lineage | `bcc4738 → bb30e1d (R10 code) → (this evidence + docs commit)`. Fast-forward only; no rebase, no merge of `main`, no force-push |
| Code commit | `bb30e1d07ac18412021e5bcb05919ea6d87057cd` |
| Evidence | Generated on a clean tree at `bb30e1d` (`evidence/R10-results.json`) |
| **Final head** | the commit adding this file; its **true 40-char SHA is in the EXEC_REPORT and QA_REQUEST** |

**Changed paths from `bcc4738`:**
- `poc/001/src/util.mjs` (blob `2616c393d1c9 → f395f695192a`)
- new `poc/001/test/r10-regressions.test.mjs`
- `poc/001/scripts/mutation-check.mjs` (M83–M85 added; **0 lines removed**; M1–M82 unchanged)
- `poc/001/README.md`
- 28 new `poc/001/evidence/R10-*` files
- this file

**Unchanged** (blobs identical to `bcc4738`):
- `webdav-adapter` `bf71c10c64a5`
- `safe-api` `ef4d0528404f`
- `api-main`, `client`, `dav-xml`, `mock-webdav`, `note-codec`
- every earlier test, including `r09-regressions`; prior tests changed: **0**
- all earlier evidence, packages and CI

No dependency was added.

## 2. Results at `bb30e1d` (Execution run; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node scripts/check.mjs` | 0 | 34 files, 0 failures |
| POC-01…07 (each) | 0 | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| R01…R08 (each) | 0 | 21 / 21 / 26 / 17 / 20 / 11 / 4 / 38 |
| R09 `r09-regressions` (unedited) | 0 | 11 / 11 |
| **R10** `r10-regressions` | 0 | **7 / 7** |
| `node --test "test/*.test.mjs"` × **5 separate runs** | 0 ×5 | **209 / 209** each |
| `node scripts/mutation-check.mjs` | 0 | **85 / 85 killed**; all 38 `expect` mutants killed on their named assertion (M10, M73, M78 reasons unchanged) |
| `node scripts/secret-scan.mjs 1c084e5…` | 0 | 0 findings |
| `npm ls --all` | 0 | `(empty)` |

R09's 202/202 ×5 and 82/82 are baseline only.

## 3. The fix and its evidence

**Fix (`util.mjs` `admitDispatch`, cleanup phase only).** After the existing used-token and scope checks, a verification PROPFIND is refused with **`CLEANUP_VERIFICATION_PREMATURE`** while any own file has not yet had its one conditional DELETE attempt.
- The refusal happens **before dispatch**: no request, no slot, token kept (`verified=false`), no STOP, and later DELETEs stay admissible.
- A 412 counts as attempted, not as success.
- After all attempts, exactly one final verification is admitted; a second one gets `CLEANUP_VERIFICATION_ALREADY_USED`.
- Hard limits (401/429 STOP, the 100 cap) are still reported first.

**R10 tests:**

| Test | Observed |
|---|---|
| R10-CLEAN-01 unit | Premature PROPFIND at **0, 1 and 19 of 20** DELETE attempts is refused, with requests, reserve, `verified` and `stopped` unchanged. After 20 attempts, one final PROPFIND is admitted and a second is refused. Total budget 41 (20 PUT + 20 DELETE + 1) |
| R10-CLEAN-01/02 e2e (2 writers) | Cleanup starts at 75. Early PROPFIND at 0/20 is refused (0 sent); 10 straggler PUTs are refused (0 PUT); early PROPFIND at 1/20 and at 19/20 is refused (0 sent). The 20th DELETE goes through, then the **one final verification** (114-byte body). Total **96** server requests, **0** own files. A second verification and a repeated DELETE send nothing |
| R10-CLEAN-02 legacy | 79 ordinary requests, then an early PROPFIND (refused), 20 DELETEs and 1 verification = **100**; request 101 is refused. ACCESS-01 values are unchanged |
| R10-SAFE 412 | A wrong If-Match gives 412, which counts as an attempt. The final verification is allowed and **lists the residual**; no retry |
| R10-SAFE 401 / 429 | Hard STOP: the next DELETE and the verification are refused with `UPSTREAM_*`; 1 DELETE was sent; 3 residual files are reported |
| R10-SAFE lost ACK | A stored-but-unacknowledged own write cannot be claimed by a conditional DELETE. The final verification **stays refused** (finality cannot be asserted) and the residual is left for operator quarantine. No retry and no false "clean" |

**Mutants (killed by their named R10 assertion):**

| Mutant | Change |
|---|---|
| **M83** | premature verification admitted |
| **M84** | refusal burns the token |
| **M85** | refusal takes a slot |

M75–M82 (R09) remain killed.

## 4. Residuals, NOT_RUN, UNSUPPORTED

**Execution-observed P0/P1:** none in the tested scope.

**Residuals and INFO:**
- INFO-1: helper misuse via `admitRequest('cleanup')`; unchanged, as directed.
- C9: refusal code comes from a lower layer.
- INFO-2/3: a wrong If-Match spends that file's attempt; Unknown writes and 401/429 leave files for operator quarantine.
- An Unknown own write blocks the final verification by design: finality cannot be asserted without an adapter/settlement change, which is **not** authorized.

**NOT_RUN / UNSUPPORTED:**
- real Nutstore, WebDAV, TLS, DNS, quota, 401/429;
- Q1e;
- production budget, paging and capacity;
- concurrent in-flight DELETE settlement at verification time (the budget tracks admission, not settlement; only sequential schedules were tested).

## 5. QA instructions (R10 QA plan)

1. **Preflight.** Use the separately user-opened QA window. Run `git ls-remote` (exit 0 and the final SHA from the QA_REQUEST), make a fresh clone and detach there with a clean tree. Verify:
   - PR #2 is OPEN and not merged;
   - merge-base `1c084e5`;
   - `bcc4738` is an ancestor;
   - 0 merges;
   - the R10 whitelist and the unchanged blobs above;
   - the M1–M82 definitions.
2. **Run** each POC-01…07 and R01…R10 suite, `check.mjs`, the full suite ×5 separately, `mutation-check.mjs` (about 13 min), the secret scan against `1c084e5`, and `npm ls --all`.
3. **Build your own** two-writer mock, then test:
   - early, middle and final PROPFIND (0/1/19 of 20);
   - 10 stragglers;
   - wrong ETag (412);
   - 401/429;
   - an Unknown write;
   - your own early-verification mutant.
4. **Post one** `kind=QA_REPORT` to DESIGN on PR #2 with `R10 LOCAL_STAGE=PASS / PARTIAL / FAIL`, `G3_INDEPENDENCE=VERIFIED / PENDING` and `OVERALL POC-001=BLOCKED_REAL_SERVICE`. Then QA STOP.

**EXECUTION STOP. PR #2 OPEN / NOT MERGED.**
