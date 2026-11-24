# POC-001 REMEDIATION-10 — D007-A39 Management → Execution Work Order

**User-approved single-P2 local synthetic G1, 2026-11-24.** Management dispatches and audits; Execution implements only the already-authorized scope and coordinates a **separately user-opened independent QA**. **Authority:** [D007-A39](../../architecture/D007_A39_POC001_REMEDIATION_10_G1_AUTHORIZATION.md), [D007-A33 exact-SHA G4 PARTIAL](../../architecture/D007_A33_R09_G4_PARTIAL_DISPOSITION.md), [independent R09 QA #7127423472](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7127423472), [R10 G3 plan](REMEDIATION_10_QA_PLAN.md), original [ACCESS_POLICY](ACCESS_POLICY.md). **NO new production code, DB/provider, CI, UI, old instruction or Q1E-L3 changes.**

## 1. Identity / preflight

- Repository `zyyu1/literature-management-system`; existing PR **#2** OPEN/NOT MERGED; original branch `exec/POC-001-webdav-feasibility`.
- Original immutable POC merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. **R10 MUST START at the full head `bcc47380deb7c6e48964ca5ca77303a213fade28`** (R09 final). **Design authority** is future exact `main` SHA publishing A39/REMEDIATION_10/QA_PLAN; read pinned, do **not** merge main into PR branch.
- Before any edit Management and Execution independently verify `git ls-remote`, PR REST and local clean HEAD all equal R10 start, original merge-base and zero merge commits. If PR #2 has moved even by legitimate parallel work, **STOP** for Design; do not rebase/reset/force-push, do not write code before preflight. No silent first-access retry exceptions.

## 2. Exact R10 changed-file whitelist vs `bcc47380…fade28`

- `poc/001/src/util.mjs` — only cleanup-phase final verification admission invariant (local/mock request budget helper, **not production app**).
- `poc/001/test/r10-regressions.test.mjs` — new R10 tests only.
- `poc/001/scripts/mutation-check.mjs` — add meaningful R10 mutation, keep M1–M82 intact.
- `poc/001/evidence/R10-*` — **new files only**, sanitized.
- `poc/001/README.md` — honest R10 scoped results.
- `docs/handoffs/POC-001/QA_HANDOFF.md` — R10 exact SHA and source/evidence handoff.

**Every other path read-only:** `poc/001/src/webdav-adapter.mjs`, `safe-api.mjs` and all other source, previous tests including `r09-regressions.test.mjs`, existing evidence, scripts (except named mutation checker), CI/`.github/**`, dependencies/locks, root README, Design/A1..A39 documents, `ACCESS_POLICY`, frozen UI, product/application, `docs/governance/**`, original work orders/QA plans, PR #4 Q1E-L3. No rename/deletion of existing files. **STOP if additional path is necessary**, do not ask Execution to improvise a change.

## 3. R10-CLEAN-01 minimal fix and deterministic oracle

**Defect:** `beginCleanup()` followed by a valid own-parent `PROPFIND` BEFORE DELETE attempts incorrectly consumes the sole verification, then `CLEANUP_ALREADY_VERIFIED` refuses all 20 deletes, stranding all fake files. Fix only the admission ordering; retain budget, method/path and uncertainty semantics.

**Required exact assertions:**
1. In 2-writer local synthetic fixture, 20 known own fake files and 75 ordinary server requests, call cleanup then **premature own-parent PROPFIND at delete-attempt 0/20**: rejected **before dispatch**, 0 actual PROPFIND, `verified=false`, 0 budget/reserve impact, no STOP. Repeat mid-cleanup after 1/20 and **19/20** attempts; still refused, preserved ability to complete remaining DELETEs and final verify.
2. Ten ordinary straggler PUTs attempted after cleanup => **0 upstream PUT**, 0 cleanup reserve, no STOP; do not treat already-dispatched UNKNOWN as unsent. Execute 20 own-file **conditional DELETE attempts once each**, then authorize exactly ONE scope-correct final PROPFIND; after all-success local fixture **75+20+1=96 requests / no own files remain**. Second final verification and repeated DELETE refuse with 0 extra sends.
3. At legacy 79 ordinary requests, 20 DELETE + 1 verification reaches 100 and 101st is refused; 100 requests per rolling 30 min including cleanup and files ≤20, ≤1MiB each, ≤20MiB total, ≤2 writers remain fixed. Keep 114-byte PROPFIND body, TLS/SSRF/path and N1665/1666 bounds.
4. Non-successful conditional DELETE (412) **counts as attempted** (existing one-attempt rule), **not** as confirmed success; residual must remain visible if subsequent final verification is permitted. Lost ACK UNKNOWN and 401/429 STOP retain old fail-closed semantics, no uncontrolled retry or false "clean"; identify attempts not yet settled/in-flight as UNKNOWN, no fabricated completion. If the model/adapter lacks sufficient information to assert finality, report STOP/UNSUPPORTED, not an unapproved adapter change.
5. **INFO-1 direct `admitRequest('cleanup')` helper misuse stays INFO**; do not change helper API, older direct arithmetic unit fixture or its semantics. **C9 still INFO** (lower-layer rejection). No fix outside P2-R09-QA-1.
6. Disposable-copy **early-verification mutant** that admits a premature PROPFIND or consumes the unique verification token must be killed by the **new R10 named assertion for exact forbidden request/budget/token effect**. Preserve M1–M82 definition/kill reasons unchanged; no equivalent/circumvented fault.

## 4. Test + evidence

From `poc/001` working directory with Node v22.23.5 baseline, **run and record actual** `node scripts/check.mjs`, each POC01–07 and R01–R10 test suite individually, `node --test "test/*.test.mjs"` in **five separate full processes** if x5 claimed, `node scripts/mutation-check.mjs`, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` and `npm ls --all` (empty). Check `node --check` for new JS. The old 202/202 ×5 and 82/82 are **R09 context** only. Record observed cases/counts, loss-of-ACK/412/401/429, exact upstream request trace, no TLS/DNS/WebDAV real endpoints, no secrets/PDF or new packages, resource timings/exit codes, retained unchanged R09 B5/Q4b tests and meaningful mutations. Do not silently overwrite old R09 evidence.

## 5. Management → Execution → QA → Design

- Management issues one bounded instruction on PR #2 linking A39 **exact Design SHA**; Execution checks frozen R10 start, implements, pushes only allowlist commits fast-forward, verifies final full 40-char SHA + incremental diff/old blobs, posts direct `EXEC_REPORT` on PR #2 with evidence and QA handoff, then `QA_REQUEST` on PR #2 linking exact head and [R10 independent G3 plan](REMEDIATION_10_QA_PLAN.md). **EXECUTION STOP**.
- Management coordinates **separately user-opened independent QA**. Fresh full clone/detached exact new SHA, first `ls-remote` exit 0, own 2-writer mock, early/mid/final PROPFIND, wrong ETag, 401/429, UNKNOWN, own early-verification mutant and full independent regression/mutation. QA directly posts **one formal QA_REPORT** to PR #2, then **QA STOP**. No same-Execution-session subagent or Management self-review passes G3.
- Management transmits **unedited** comment ID/URL, full QA result and actual per-test/mutant counts, P0/P1/P2/INFO, NOT_RUN/UNSUPPORTED, exact SHA and path/commit audit to Design. **Management STOP**.
- Only Design may issue **later independent R10 G4**. A33 R09 G4 PARTIAL and all exact-SHA historical narrow B5/Q4b closures are unchanged until separately assessed at the new head. No merge, ACCESS-02 or deploy.

**R10 G1 AUTHORIZED_LOCAL_SYNTHETIC / G2 NOT_STARTED / G3 NOT_RUN / G4 NOT_REVIEWED / G5 MERGE NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 DEPLOY NOT_AUTHORIZED / OVERALL POC-001 BLOCKED_REAL_SERVICE.**