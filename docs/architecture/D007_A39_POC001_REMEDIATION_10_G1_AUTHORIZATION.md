# D007-A39 — POC-001 REMEDIATION-10 Single-P2 Local Synthetic G1 Authorization

**User decision:** APPROVED R10 minimal fix, 2026-11-24 (Europe/Berlin), based only on [D007-A33 R09 independent G3 / G4 PARTIAL](D007_A33_R09_G4_PARTIAL_DISPOSITION.md) and exact [independent QA report #7127423472](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7127423472). **D007-A39 G1=AUTHORIZED_LOCAL_SYNTHETIC_P2_R09_QA_1_ONLY**, **R10 G2=NOT_STARTED, independent G3=NOT_RUN, G4=NOT_REVIEWED**. This is neither an approval of R09 G4 nor R10 test evidence, production logic, a new technology/storage architecture, real WebDAV access, code merge, or deployment.

**Only authorized finding:** `P2-R09-QA-1`: a premature own-parent `PROPFIND` after `beginCleanup()` consumes the one final verification before all known own-file conditional DELETE attempts, blocking the DELETEs and leaving 20 synthetic files. QA independently reproduced this at PR #2 `bcc47380deb7c6e48964ca5ca77303a213fade28`. Existing `poc/001/src/util.mjs` `admitDispatch()` checks the PROPFIND scope and `verified` but not the completion/accounting of the known own-file DELETE-attempt set.

## 1. Git identity, authorized transmission and STOP preflight

| Field | Binding exact value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| PR | **#2**, `OPEN / NOT MERGED`, unchanged original POC PR |
| Working branch | **`exec/POC-001-webdav-feasibility`** (no new branch) |
| Original immutable POC Base / merge-base | **`1c084e5f14e4af8018ef5fe99710be7205cfbdf4`** (not floating `main`) |
| **Mandatory R10 START** | **`bcc47380deb7c6e48964ca5ca77303a213fade28`** (current R09 final) |
| R09 prior start | `49ad24e82f5895f4b6e5f30cb84b3294229df012`; historical audit only, not R10 start |
| Prior R09 work commits | `8d9929b5ad9d52ce6f4a29956ac640af932feaac`, `bcc47380deb7c6e48964ca5ca77303a213fade28` |
| **R10 Design authority** | Exact 40-character future `main` SHA committing THIS document and [R10 Work Order](../handoffs/POC-001/REMEDIATION_10.md) and [R10 G3 QA Plan](../handoffs/POC-001/REMEDIATION_10_QA_PLAN.md); Management must pin it, **never merge/cherry-pick it onto PR #2** |
| Change audit | Diff **`bcc47380deb7c6e48964ca5ca77303a213fade28..R10_FINAL_HEAD`** for R10 incremental files; compare original POC base for cumulative original scope; zero merge commits |

**Management preflight before dispatch and Execution before editing:** `git ls-remote` branch head, GitHub PR REST head and clean local checkout HEAD must each match the **full 40-character R10 start**. Check PR open/unmerged, original exact merge-base, 0 merge commits, intended owner, unchanged A32/A33/A39 authority, all historic POC scope. If mismatched, inaccessible, dirty, unrecognized extra commit, or inability to verify authority => `PRECHECK_PENDING / STOP`. Recover access legitimately and redo the complete preflight; no historical A28 waiver, reset, rebase, force push, merge, cherry-pick or short-SHA-only acceptance. Management routes results to Design; cannot independently relax this G1.

## 2. Rigid R10 INCREMENTAL whitelist only

**Changes are allowed only to these paths relative to R10 START:**

1. `poc/001/src/util.mjs` — **minimal local POC-001 synthetic cleanup admission / request-budget helper**, nothing outside `createRequestBudget` cleanup-finalization check as needed. This is not production application logic.
2. `poc/001/test/r10-regressions.test.mjs` — **new** deterministic local synthetic test only.
3. `poc/001/scripts/mutation-check.mjs` — append **new meaningful early-PROPFIND mutant** only; preserve M1–M82 definitions and their named reasons, and preserve all historical benign test code.
4. `poc/001/evidence/R10-*` — **new R10-named synthetic evidence files only**, no overwrite/delete/rename of any R01–R09/R08 evidence.
5. `poc/001/README.md` — a narrow R10 outcome + retained limitations/status, no rewriting earlier measured evidence.
6. `docs/handoffs/POC-001/QA_HANDOFF.md` — append exact SHA, executed cases/limits and QA request information; preserve source history.

**Hard READ-ONLY:** `poc/001/src/webdav-adapter.mjs`, `safe-api.mjs` and all other source, all previous test files including `r09-regressions.test.mjs`, `api-main.mjs`, any historical scripts except the allowed mutation driver, fixtures, packages/locks/dependencies, root README, `.github/**` / CI, frozen Module 002 UI, all actual application code, `docs/architecture/**`, `docs/governance/**`, `ACCESS_POLICY.md`, original R01–R09/A32 work orders and QA plans, independent L3 PR #4/branch and all other paths. **No tests or product fixes outside the whitelist**. If implementation appears to require an adapter change, helper API redesign or a new dependency, **STOP and return to Design**—no conditional adapter permission by this G1.

## 3. Narrow repair contract — R10-CLEAN-01 (no policy enlargement)

`beginCleanup()` remains irreversible. In `admitDispatch({method:'PROPFIND', path: OWN_PARENT})` during cleanup:
- Until **every known authorized own-file conditional DELETE attempt has been admitted/accounted**, **refuse** the exact own-parent PROPFIND **before upstream network dispatch**. Rejection must **not** count any server/budget request, must **not** consume the 21st cleanup reserve slot, must **not** set `verified`, and must **not** put the budget into STOP. At 0/20, 1/20 and 19/20 attempted DELETEs, final-verification admission is forbidden.
- After all **20 own-file conditional DELETE attempts** are accounted for, permit **at most one** scoped final verification PROPFIND *only if no higher-priority STOP* applies, charge exactly one cleanup request slot and set verified only on successful **admission**. A second verification must be refused with no dispatch/slot.
- **"Attempted" does NOT mean successful.** A 412 wrong If-Match consumes the one file-attempt opportunity under existing R09 policy; **do not allow retry** or suppress residual. A lost-ACK UNKNOWN cannot be reclassified or blindly retried/deleted; maintain truthful residual/quarantine and distinguish an in-flight/uncertain operation from completed confirmed cleanup. If evidence cannot show final verification is safe while an attempt is still in flight, report `UNSUPPORTED / STOP` rather than asserting cleanup complete or adding asynchronous writer-handling changes.
- Do **not** turn a direct `admitRequest('cleanup')` invocation into a new authorization path, bypass or new policy. **INFO-1 stays INFO** (direct helper misuse can deplete reserve; adapter cannot source untrusted cleanup label), no G1 to redesign that helper or amend old arithmetic tests. **C9 survivor stays INFO**, no test/return-code redesign. Preserve old method/path guard and no ordinary PUT/GET/MKCOL/foreign or recursive DELETE after cleanup transition. All denied requests are denied before dispatch.
- Keep hard request budget **100 total per rolling 30 minutes including cleanup**, ≤20 synthetic files, ≤1 MiB per file, ≤20 MiB aggregate, ≤2 writers, 79 ordinary + 21 cleanup = 100 legacy bound and 101st denied; 401/429 hard STOP prevents cleanup and verification, no replay or hidden retry. Preserve in-flight/UNKNOWN semantics, no fake 0 residual guarantee under STOP, wrong ETag or lost ACK. **No real service, credentials, actual physical deletes or production behavior**.

**Implementation guidance not mandatory:** the existing `cleaned` set records admitted own-file DELETEs; a minimal "all initially authorized own file attempts accounted" guard may use this and `files` without inventing a new budget or touching adapter. Verify actual asynchronous behavior; if true finality cannot be shown with allowed scope, STOP.

## 4. Required positive/negative regression and mutation

New named in-repo `R10-CLEAN-01` test must show:
1. Two writers, **20 own fake files**, 75 ordinary requests before cleanup. Early matching own-parent PROPFIND before any DELETE is **not_sent/unavailable**, 0 upstream PROPFIND, no STOP, `verified=false`, cleanupUsed and overall usage unchanged. Also repeat after 1 and 19 admitted own-file DELETE attempts.
2. Attempt 10 queued/concurrent straggler PUTs after cleanup: 0 upstream PUT, no reserve consumption. Run the 20 authorized **conditional DELETEs once each**, then one final exact-parent verification. Expect total **75 + 20 DELETE + 1 verification = 96** server requests, **0 synthetic files left in the all-success fixture**, verified count 1. Subsequent repeat PROPFIND/DELETE forbidden, no spare cleanup token consumed on early requests.
3. Legacy profile `79 + 20 DELETE + 1 verify = 100`, 101st request refused; **at 79** the original ordinary limit STOP is not permission to admit extra work. Maintain no false `COMPLETE` where a 412, lost ACK, 401/429 or uncertain in-flight write leaves residuals: blocked/safe verification according to already-approved STOP and UNKNOWN policy, report actual residual IDs and no uncontrolled retry.
4. Foreign/recursive/unconditional methods remain blocked; exact 114-byte own-scope PROPFIND payload and R08/R09 TLS/SSRF/capacity/absolute-body-deadline, B5 regression and unchanged tests remain intact.
5. **At least one new mutation** (disposable copy only) deliberately removes the premature-verification guard or sets `verified` early; the new R10 **named assertion must kill it for early-propfind/no upstream/no budget/no token**, not a syntax error, test setup failure, generic mutation arithmetic or timeout. Existing **M1–M82** definitions and correct kills unchanged; report actual mutation count rather than assume new count.

**No SLO claim**; Node v22.23.5 baseline, loopback only, no networking except local fake stand-in. Preserve all historic test assertions **unchanged**. Existing R09 QA `202/202 ×5` and `82/82` are baseline, **not R10 results**.

## 5. Execution/independent G3/Design G4

**Execution must:** after full verified preflight, modify only R10 whitelist on PR #2 original branch with fast-forward commits, preserve original merge-base, check every new JS with `node --check`, run individual POC01–07/R01–R10 suites, `node scripts/check.mjs`, **5 separate full suite processes** when reporting ×5, `node scripts/mutation-check.mjs`, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `npm ls --all`, strict diff path/old source blob/no-network check. Save sanitized R10-only evidence; push without rebase/merge, verify final exact SHA and full file list, post Execution direct PR #2 report, update allowed QA_HANDOFF, send QA_REQUEST with exact SHA, then **EXECUTION STOP**.

**Management coordinates** a user-opened independent QA window (not same Execution session/subagent), fresh complete clone at final PR #2 R10 SHA, own two-writer early/mid/final schedule, own mock, own mutation and actual request traces, original policy/INFO/UNKNOWN/401/429 audit, full regression independently, direct **QA comment on PR #2**, QA STOP. **G3_INDEPENDENCE VERIFIED only after actual session/clone/proof**. QA may recommend `PASS_LOCAL_CANDIDATE_FOR_FUTURE_R10_G4` if all authorized gates pass, never self-decide G4 or close risks. Management returns full unedited QA text, comment IDs/URLs, final SHA, P0/P1/P2/INFO/NOT_RUN/UNSUPPORTED to Design.

**Design alone** later decides new exact-SHA R10 G4 (separate decision), considering P2-R09-QA-1 and parent P2-R08-QA-1 cleanup; R09 G4 at `bcc47380` remains historical PARTIAL. B5/Q4b closures remain historical exact-SHA and do not transfer without regression evidence. **No automatic risk closure or subsequent remediation**.

## 6. Security and final gate firewall

`G1_R10=AUTHORIZED_LOCAL_SYNTHETIC_SINGLE_P2`; `G2 NOT_STARTED`; `G3 NOT_RUN`; `G4 NOT_REVIEWED`; `G5 MERGE NOT_AUTHORIZED`; `G6 ACCESS-02 BLOCKED`; `G7 DEPLOYMENT NOT_AUTHORIZED`; `OVERALL POC-001 BLOCKED_REAL_SERVICE`. `P2-R09-QA-1 OPEN` until future independent G4; `P2-R08-QA-1 OPEN/PARTIAL`; `P2-R08-QA-2/3 CLOSED_LOCAL_TEST_GAP@bcc47380`; `INFO-1/C9 remain INFO`, Q1e UNSUPPORTED_COMPLETENESS, capacity policy PENDING, physical backup NOT_CERTIFIED. Independent L3 PR #4 remains separate `MODEL_ONLY G4 PARTIAL_NOT_ACCEPTED`, not an R10 dependency.

**D007-A39 user-approved G1 only, NO implementation code or independent QA executed by Design, no production change, no merge, no real provider or deployment.**