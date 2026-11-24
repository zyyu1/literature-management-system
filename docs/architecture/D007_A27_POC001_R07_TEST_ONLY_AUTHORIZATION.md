# D007-A27 — POC-001 R06 limited-independence QA disposition; R07 sibling-207 test-only authorization

**Decision:** User **APPROVED Option B** on **2026-11-24 (Europe/Berlin)**. Recognize the technical results of R06 QA sub-agent report [PR #2 comment 7120465999](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7120465999) as **PASS_LOCAL_CANDIDATE technical evidence only**; **DO NOT count it as the mandated independent G3** because the reviewer was launched by Execution within its same session and the report was relayed by Execution. Record **G3_INDEPENDENCE_PENDING / G4_NOT_ACCEPTED_FOR_R06_SHA**. Register new **P2-R06-1 F-1** sibling malformed-207 request-count/body mutation-adequacy gap. Authorize **one narrow REMEDIATION-07 (R07) G1 TEST-ONLY LOCAL/SYNTHETIC** on the unchanged original branch/base and exact R06 final HEAD. **No new source/runtime/CI/UI/provider access authorization.**

**Normative evidence:** [R06 Execution #7119832091](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7119832091), [R06 sub-agent QA #7120465999](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7120465999), [A26 G4/authorization](D007_A26_POC001_REMEDIATION06_DISPOSITION.md), [R06 QA plan](../handoffs/POC-001/REMEDIATION_06_QA_PLAN.md), [R07 instruction](../handoffs/POC-001/REMEDIATION_07.md), [R07 independent QA plan](../handoffs/POC-001/REMEDIATION_07_QA_PLAN.md), [risk register](../handoffs/POC-001/POST_G4_RISK_REGISTER.md), [ACCESS POLICY](../handoffs/POC-001/ACCESS_POLICY.md).

## 1. Evidence, technical result, and governance split

- PR #2 **OPEN/NOT MERGED**. Exact reviewed R06 PR head: `5ab47090f1100fbe0c9defd39930fcf715dbab38`; R06 start: `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f`; original immutable base: `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; original execution branch: `exec/POC-001-webdav-feasibility`. R06 had 32 incremental and 61 cumulative allowlisted changed paths, unchanged eight `poc/001/src/**` Git blobs by reported QA and Design read-only comparison of the incremental paths.
- Execution reported 11/11 new R06 cases, 149/149 complete suite on five separate runs, 48/48 built-in mutants, 0 secrets/dependencies; the QA sub-agent independently reran these and used its own recording proxy and QA-owned mutants. Four QM1-style variants (explicit allprop, bodyless fallback, unawaited fallback, Depth-0 duplicate) were killed on request-count assertions by R06 tests, while the previous 138-test suite and R05 20-test file did not detect the original gap. No observed P0/P1 in the limited synthetic scope.
- Sub-agent used a clean new clone and its own probes/mutants, but was **invoked in the Execution session** and did not publish a separate independent QA report. It is useful technical evidence, **NOT the approved independent G3 governance separation**. No blanket waiver or retrospective G3/G4 acceptance. On the exact R06 SHA, QA stage is `QA_EVIDENCE_PASS_LOCAL_CANDIDATE / G3_INDEPENDENCE_PENDING`. Preserve A24 historically accepted local G4 at `22dd9bd30900d9c7ca205a36c675fd47b2569feb` and A26 exact-SHA `P2-R04-1=CLOSED_LOCAL_SYNTHETIC@811d5c0fdcd740e5f6e6334d99cd2908cfeada8f` without extending either automatically to new R06/R07 SHAs.
- QA independently verified the parser fixture ceiling only: 10,000 XML elements, `8+6*N`, N=1665 accepted at 9,998, N=1666 rejected at 10,004. Export-level N=1666 was NOT_RUN by this sub-agent; execution evidence does not substitute for independent verification. `P2-R05-2=CAPACITY_POLICY_PENDING`.

## 2. New risk and F-1 disposition

**P2-R06-1 / F-1 (P2, OPEN_TEST_GAP / HARD_PRE_ACCESS):** In `poc/001/src/webdav-adapter.mjs` `propfind()` the successful XML parse is followed by three different malformed-207 returns:
- foreign href outside adapter base: `return { outcome: 'malformed', reason: 'foreign href' }`;
- non-2xx response entry: `return { outcome: 'malformed', reason: 'non-2xx response entry' }`;
- duplicate normalized href: `return { outcome: 'malformed', reason: 'duplicate href' }`.

Actual code at exact R06 SHA sends **one** 114-byte explicit resourcetype-only PROPFIND and fails closed. No existing production defect has been found. However QA-owned QM2/QM3 inserting a bodyless retry in the first two branches **survived all repository tests**; the duplicate branch has analogous unpinned request-count/body risk (no QA mutant attempted). This is a *distinct* adjacent coverage gap, not proof that the R06 catch-path QM1 is unfixed. **R07 must pin all three distinct branches, including duplicate.** No source patch warranted or authorized.

F-2 (lock=true fixture fails at root), F-3 (M48 message-string matching), and F-4 (README item 9b follows item 13) remain **INFO only** and **outside R07 writes**. Any later INFO work needs a separate decision; do not quietly expand scope.

## 3. Authorized next step: R07 G1, TEST-ONLY

**Fixed start:** PR #2 branch `exec/POC-001-webdav-feasibility`, immutable original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, exact mandatory R07 start HEAD `5ab47090f1100fbe0c9defd39930fcf715dbab38`. If PR head differs at start, **STOP for Design**. Preserve fast-forward lineage only; no rebase, merge main, force push, or changes to PR base.

**Original cumulative allowlist:** `poc/001/**` plus `docs/handoffs/POC-001/QA_HANDOFF.md`.

**STRICT R07 incremental write allowlist ONLY:**
- `poc/001/test/r07-regressions.test.mjs` (new targeted tests);
- `poc/001/test/r06-regressions.test.mjs` (only if needed for narrow shared assertions; prefer not to touch);
- `poc/001/scripts/mutation-check.mjs` (three meaningful new per-branch mutants; preserve M1–M48);
- `poc/001/evidence/**` (sanitized freshly generated R07 evidence);
- `docs/handoffs/POC-001/QA_HANDOFF.md` (new exact-SHA QA handoff).

**FORBIDDEN:** all `poc/001/src/**` including mock/adapter, all other tests/scripts, README (F-4 excluded), package/lockfiles, original POC/R01–R06 execution instructions, Design/governance/ACCESS policy, frozen Module 002 UI, app/dependency/root, GitHub Actions/CI, credentials, real service, PDF or cloud. No production logic, retry/fallback, transport or provider semantic change. Compare all eight source Git blob SHAs against R07 start, byte for byte.

R07 must independently exercise each of foreign-href, non-2xx-entry, duplicate-href malformed **HTTP 207** scenarios on root and kind listing, using a valid parsed multistatus that reaches the appropriate post-parse branch (not merely the earlier `parseMultistatus` catch). Assert failing listing exactly one PROPFIND, actual 114-byte selected resourcetype body and CL/CT/Depth, no second empty/allprop retry, `503 export_incomplete`, no bundle/GET/writes, unchanged mock store. Add meaningful distinct temporary-copy mutants for all three branches (e.g. M49–M51) that add an extra bodyless `PROPFIND` just before the original malformed return; repository R07 tests must kill each *for request-level assertion failure*, not crash/setup error. Keep M1–M48 fully functional. Preserve valid 207, non-207 and R06 QM1 regressions. Observe actual counts, do not assert unrun values.

Require full tests/check/secret scan/zero third-party dependencies, five genuinely separate full suite runs if stability claimed, mutation checks with setup/reason validation, exact parent/ancestry/path/source SHA audits, local 127.0.0.1 only, sanitized evidence. Commit only strict allowlist to original PR #2 branch, verify **true final 40-character HEAD**, post execution report/comment and **EXECUTION STOP**. The Execution window may not certify G3/G4 or close risks.

## 4. Independence rule and subsequent gate

After R07 final HEAD, **a separately opened Independent QA session/window** must fresh-clone and use QA-owned probes/mutants, review both **R06 and R07** on the exact final SHA and independently confirm QM1a–d plus new adjacent QM2/QM3/duplicate coverage. A sub-agent launched inside Execution again does **not** satisfy formal G3 under this decision. If this independence cannot be provided, STOP with `G3_INDEPENDENCE_PENDING`; do not silently waive it.

Only after independent G3 may Design propose **D007-A28** for an exact-SHA **G4 local/synthetic disposition**, and only then consider closing `P2-R04-2`, `P2-R05-1` and `P2-R06-1` in their bounded local scope. No risk self-closure by Execution/QA and no automatic G4 acceptance. `P2-R05-2` remains a capacity policy residual; Q1e, Q4/Q5, real provider/TLS/CAS/ETag/MKCOL/ledger are NOT_RUN or UNSUPPORTED.

**G5 PR merge = NOT_AUTHORIZED. G6 ACCESS-02 = BLOCKED / NOT_AUTHORIZED. G7 deployment = NOT_AUTHORIZED. OVERALL POC-001 = BLOCKED_REAL_SERVICE.** WP-01 and frozen UI remain separate and unchanged.

**D007-A27 FINAL:** **APPROVED Option B / R07 G1 LOCAL_SYNTHETIC_TEST_ONLY AUTHORIZED**, not an R06 or R07 G4 acceptance. Separate next Design item is **D007-A28, ONLY AFTER independent exact-SHA G3**.
