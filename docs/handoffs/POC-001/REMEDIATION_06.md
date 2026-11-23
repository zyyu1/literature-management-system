# POC-001 REMEDIATION-06 — D007-A26 Option B, strict TEST-AND-DOCS ONLY

**Authorization:** D007-A26 Option B **APPROVED**. One narrow G1 **LOCAL/SYNTHETIC TEST-AND-DOCS ONLY** correction of R05 repository mutation coverage, plus P2-R05-2 README capacity disclosure. **No production/runtime/source implementation changes whatsoever**.
**Controlling docs:** [A26 Design](../../architecture/D007_A26_POC001_REMEDIATION06_DISPOSITION.md), [R06 independent QA plan](REMEDIATION_06_QA_PLAN.md), [R05 QA #7103304755](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7103304755), [A25 R05 original authorization](REMEDIATION_05.md), [A24 prior G4 accepted local](../../architecture/D007_A24_POC001_G4_LOCAL_ACCEPTANCE.md), [post-G4 risk register](POST_G4_RISK_REGISTER.md), [ACCESS POLICY](ACCESS_POLICY.md). Read directly on GitHub main at pinned A26 authorization; **never merge/cherry-pick main into POC branch**.
**Branch/base/start:** existing `exec/POC-001-webdav-feasibility`, **original immutable base** `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, exact new authorized start PR #2 HEAD `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f`. Keep PR #2 OPEN, **no rebase, no merge of main, no force push**. Stop if remote head differs at start. The moving main Design SHA does not substitute for the original POC base.
**Original overall cumulative allowlist:** `poc/001/**` + `docs/handoffs/POC-001/QA_HANDOFF.md`. **STRONGER R06 INCREMENTAL WRITE LIST (exact):**
```
poc/001/test/r05-regressions.test.mjs
poc/001/test/r06-regressions.test.mjs        # optional new file
poc/001/scripts/mutation-check.mjs
poc/001/README.md
poc/001/evidence/**                        # sanitized R06 evidence only
docs/handoffs/POC-001/QA_HANDOFF.md
```
**Forbidden irrespective of old broad POC allowlist:** `poc/001/src/**` (including production `webdav-adapter.mjs` and mock `mock-webdav.mjs`), all other scripts/tests and package/lockfiles, Design/governance/ACCESS policy/old instruction, frozen UI, apps, CI, root files/deps/cloud. **No production logic, transport fallback or retry behavior may change.** Record source blob SHAs pre/post, all must be identical.

## Required R06 test correction

The independent QA at `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f` observed correct runtime behavior and 47/47 built-in mutants killed, but a QA-owned mutant **QM1** replacing the `propfind` **malformed-207 catch path** with a second **empty-body/allprop request** survives the existing repository suite (138/138). QA's own network probe catches 16 fallback requests. Existing mutant M47 tests the **non-207** path, not malformed-207. New local test/mutant must close exactly this gap.

1. In existing R05 regression tests (or one new R06 test file), use current in-repo loopback mock's `propfindOverride` and `ignorePropSelection`; **do not edit the mock source**. Reproduce:
   - (a) returned **207** with malformed/truncated XML;
   - (b) returned **207** with well-formed but unsupported/unexpected nested DAV property/href;
   - (c) fake server ignores selected `resourcetype` and responds allprop, with and without lock.
   Each must return **503 export_incomplete**, no bundle, 0 extra upstream write effects, unchanged stored data.
2. For each case snapshot the actual mock `requestLog` **after setup writes**, then assert **exactly ONE PROPFIND for the failing listing**; verify its actual XML body equals `PROPFIND_RESOURCETYPE_BODY` (114 bytes), correct `Content-Length`, `Content-Type: application/xml; charset=utf-8`, and `Depth`. Assert **no second empty/allprop PROPFIND**, independent of HTTP outcome. Existing non-207 paths (400/403/415/500) must remain one request as previously proven.
3. Add **one new distinct mutant (e.g. M48)** in `poc/001/scripts/mutation-check.mjs` that **specifically** changes the adapter's `catch` for `parseMultistatus(r.body)` so it performs an **extra bodyless `request('PROPFIND', path, {headers:{Depth:depth}})`**, then otherwise returns the existing malformed result. The mutation script is authorized to modify a **temporary copied file** `src/webdav-adapter.mjs` when executing tests; it must **not commit or modify source files in the working repository**. Require valid mutation setup and deterministic kill by R06 test(s) because request count/body differs. A surviving mutant or setup error is FAIL, not an acceptable 47/47 or "passed" claim.
4. Keep M1–M47 effective; no new implementation feature and no new production code.

## Required P2-R05-2 documentation only

Update `poc/001/README.md` and the final `QA_HANDOFF.md` to describe: the already-fixed **MAX_ELEMENTS=10,000** means a single **synthetic minimal kind listing** with `8 + 6*N` XML elements supports **N<=1665** and **N>=1666** returns **503 export_incomplete before any GET**, no partial `200`; legal extra properties can reduce this ceiling, so it is not a universal real-provider or entire-library count. Record limitation as **P2-R05-2 CAPACITY_POLICY_PENDING**, not "fixed"; no paging, pagination, splitting, change to element cap, source semantics or data shape. ACCESS-02 disposable <=20 files does not prove production-scale compatibility. Preserve Q1e, Q4/Q5, TLS/strong CAS/ETag/credential limits and real provider UNSUPPORTED.

## Execution checklist and evidence

Preflight `git fetch origin`; clean branch/worktree, exact HEAD `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f`, original merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, 0 merge commits. Record starting source blob SHAs. Runtime: Node v22.23.5 Linux x64 if available, in-repo synthetic loopback **127.0.0.1 only** and **zero third-party dependencies**. GitHub PR read/write for evidence allowed; no real Nutstore/Zotero credentials, WebDAV, external host, PDF, CI or cloud.
Run new R06 tests + R05, individual POC01..07 and R01–R04, `node scripts/check.mjs`, `node --test "test/*.test.mjs"` **five genuinely distinct runs** if claiming stability, `node scripts/mutation-check.mjs` real new count/kill, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `npm ls --all`. Preserve resource-safety probes as applicable; if unrun, mark NOT_RUN, do not recycle A25 119 runs or 138/138x5 and 47/47 as new. Do not claim new fixed count.
Check `git diff --name-only 1c084e5f14e4af8018ef5fe99710be7205cfbdf4 HEAD` against original POC allowlist and `git diff --name-only 811d5c0fdcd740e5f6e6334d99cd2908cfeada8f HEAD` against **narrow R06 allowlist**; no rebase/merge and **all `poc/001/src/**` blob SHA identical** to `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f`. Scan sanitized evidence, no personal data/private paths/secrets.
Commit only approved files, update existing `docs/handoffs/POC-001/QA_HANDOFF.md`; publish **true final 40-character PR #2 HEAD** in PR comment if QA handoff commit changes it, with exact parent/base/path inventory, request logs, 207 negative cases, M48 killed evidence, README cap disclosure, full exit counts, privacy and source unchanged audit. **EXECUTION STOP for independent G3 QA** on new exact HEAD. Never self-certify closure of P2-R04-2/P2-R05-1 or new G4 acceptance.

**BLOCKED:** G5 merge, G6/POC-001-ACCESS-02, real Nutstore/Zotero/WebDAV, app/CI/frozen UI, other WP, rebase/main merge/force push, and G7 deploy. **Next: independent D007-A27 only after actual QA**, not automatically triggered by green self-tests.
