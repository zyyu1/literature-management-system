# POC-001 — REMEDIATION-04 Execution Authorization (D007-A23 Option B)

**AUTHORIZED:** one narrow, local/synthetic R04 repair and regression evidence ONLY. [D007-A23 design disposition](../../architecture/D007_A23_POC001_REMEDIATION04_DISPOSITION.md), [R04 independent QA plan](REMEDIATION_04_QA_PLAN.md), [latest independent QA 7090201835](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7090201835) and [A22 R03 instruction](REMEDIATION_03.md) are controlling documents. **Previous LOCAL_STAGE PARTIAL / G4 NOT ACCEPTED**, R04 code and QA NOT YET RUN.
**Branch:** existing `exec/POC-001-webdav-feasibility`, **original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`**, **exact R04 start PR #2 HEAD `4bfa924af2d20cd383c4e49f982f55ac83423a42`**. Preserve all earlier commits and [original PR #2](https://github.com/zyyu1/literature-management-system/pull/2); **NO REBASE/MAIN MERGE/FORCE PUSH**, only fast-forward commits from this exact HEAD. **If HEAD changes before starting, STOP.**
**Path allowlist:** `poc/001/**` and existing `docs/handoffs/POC-001/QA_HANDOFF.md` ONLY. No original docs/authorization/ACCESS policy, app, frozen UI, WP-01, CI, root manifest/lockfile, deployment or new external dependencies.
**Mode:** Node.js v22.23.5 Linux x64, current local offline/127.0.0.1 mock; no real Nutstore/Zotero/WebDAV external provider/credentials/PDF/notes; GitHub read/write for scoped PR is the only allowed non-loopback service.

## Required patch (R04)
1. **R04-1, mandatory Q1c:** `poc/001/src/dav-xml.mjs` / existing `parseMultistatus`: fail closed on a structurally unexpected/misplaced `DAV:response`, `href`, `propstat`, `status` (and other structurally significant DAV elements). Enforce direct-parent rules inside the restricted supported `multistatus` profile. Detect rather than drop hidden responses within another response, `DAV:responsedescription`, foreign wrappers, or a foreign-namespace `response`. Reject unknown DAV root children and response-like unsupported extensions if they could hide an entry; do **not** silently filter them to produce `200 ok`. Error must map to **`503 export_incomplete`**, zero changed remote-mock objects, no bundle. Preserve legal prefix/default-DAV namespace and other previously covered legitimate fixtures. It is a **conservative POC profile**: unsupported well-formed XML extensions may fail closed, not necessarily RFC-illegal.
2. **R04-2, collection INFO:** read `DAV:resourcetype/DAV:collection` **only from a 2xx propstat**, not from a 404/non-2xx status. Avoid erroneously promoting required kinds to collections. Preserve Q1c status conflict checks, Q1a missing kinds, Q1b duplicates, Q1d truthful zero/two-record export and restore.
3. **R04-3, Q5 documentation:** `poc/001/README.md` and final `docs/handoffs/POC-001/QA_HANDOFF.md`: any fence PUT **applied but not confirmed** (missing/weak/ambiguous/false ETag; `readback_*` error, timeout, mismatch; apply-then-503/hang) can cause **indefinite `indeterminate`**, holding the **per-principal ledger quota slot** and possibly stranding sibling Unknown operations. This is P2 liveness, not a safe retry/recovery path. **No redesign or new runtime recovery behavior.**

## Mandatory new regression + mutant coverage
- QA's four synthetic `R03-Q1c` variants: hidden `DAV:response` nested in (i) foreign `x:wrap`, (ii) another `DAV:response`, (iii) `DAV:responsedescription`, (iv) foreign-namespace `x:response`. For each: `503 export_incomplete`, **no bundle**, **zero upstream write effects**.
- Misplaced `DAV:href/propstat/status` and unknown DAV multistatus children; multiple 404/200 propstats and collection marker only under 404 (reject/won't promote); a valid 2xx collection with separate 404 unrelated property stays accepted. Assert direct parser fail-closed and API mapping.
- Keep valid 0/2-record, supported prefix/default namespace/encoded href, Q1e honest UNSUPPORTED individual omission, Q2 post-fence readback/late original, Q3 replay, Q4 quotas, Q5 applied-but-unconfirmed cases; all prior POC-01..07 and R01/R02/R03.
- Add targeted **mutants** to prove parent validation and 2xx-only collection tests would detect a regression. Report true new mutant counts; do not claim a fixed 30 if changed.

## Preflight and test commands
Read this instruction from the latest GitHub Design main, but DO NOT merge/cherry-pick it into the execution branch. Verify clean checkout, remote PR #2 HEAD `4bfa924af2d20cd383c4e49f982f55ac83423a42`, branch `exec/POC-001-webdav-feasibility`, exact original base and ancestor, no rebase and authorized paths.
From `poc/001`:
```bash
node --version
node scripts/check.mjs
node --test "test/*.test.mjs"
# Repeat the full test command five distinct times if claiming five-pass stability.
node scripts/mutation-check.mjs
node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4
```
Use existing local test packages only, no registry/network install. Preserve literal exit codes, actually run each POC-01..07 and R01/R02/R03/new R04 checks, record each independent full-suite run, mutation outcomes, synthetic mock modes, capped time/memory, file/hash/diff and secret scan. Compare cumulative `git diff --name-only 1c084e5f14e4af8018ef5fe99710be7205cfbdf4 HEAD` and incremental `git diff --name-only 4bfa924af2d20cd383c4e49f982f55ac83423a42 HEAD`; only allowlisted paths. No external provider request, PDF or real data.

## Stop and exact QA handoff
Commit code/tests/README/sanitized evidence **only inside POC allowlist**. Update `docs/handoffs/POC-001/QA_HANDOFF.md` with pre-R04 SHA, original base, new final PR head (or place true final SHA in PR comment after handoff commit), parent ancestry, diff inventories, Q1c+2xx collection+Q5 evidence, actual commands/exits, regressions, mutation totals, P0/P1/P2 and remaining provider/ledger UNSUPPORTED; make no fake SHA claim. Keep PR #2 **OPEN / NOT MERGED** and original branch **NO REBASE**.
**EXECUTION STOP → independent G3 exact-HEAD QA** under [R04 QA plan](REMEDIATION_04_QA_PLAN.md). Execution cannot self-certify G4 LOCAL_STAGE PASS. The QA reviewer must independently re-run the four adversarial fixtures and full suite, then STOP for **D007-A24** separate Design G4 decision.
**BLOCKED:** ACCESS-02 real Nutstore/Zotero, AWS/cloud/real TLS/provider, PDF, frozen Module 002 UI, WP-01, root app/CI/deps, rebase/main merge, PR merge, deployment.
