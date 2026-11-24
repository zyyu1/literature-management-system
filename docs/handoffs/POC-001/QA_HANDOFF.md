# POC-001 — Execution → QA Handoff · REMEDIATION-06 / D007-A26 Option B (LOCAL / SYNTHETIC · TEST-AND-DOCS ONLY)

**From:** Execution Window · 2026-11-24 (Europe/Berlin)
**Authority:** [D007-A26 disposition](https://github.com/zyyu1/literature-management-system/blob/075b48465a46839440b6675739443f9f6c80ec7e/docs/architecture/D007_A26_POC001_REMEDIATION06_DISPOSITION.md), [REMEDIATION_06.md](https://github.com/zyyu1/literature-management-system/blob/075b48465a46839440b6675739443f9f6c80ec7e/docs/handoffs/POC-001/REMEDIATION_06.md) and the [R06 QA plan](https://github.com/zyyu1/literature-management-system/blob/075b48465a46839440b6675739443f9f6c80ec7e/docs/handoffs/POC-001/REMEDIATION_06_QA_PLAN.md), read on `main` at Design SHA `075b48465a46839440b6675739443f9f6c80ec7e`; R05 G3 QA basis [7103304755](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7103304755).
**Scope:** **P2-R05-1** (repository mutation gap / QA QM1) by new tests and one mutant, and the **P2-R05-2** capacity disclosure. **No production, runtime, mock or adapter source change.**
**Boundary:** in-repo loopback mock on 127.0.0.1 and **synthetic data only**. No real Nutstore, Zotero, external WebDAV, TLS, credentials, PDFs or notes. **Real Nutstore: `BLOCKED_REAL_SERVICE`; OVERALL POC-001 cannot PASS.**
**Status:** Execution evidence only. Execution does **not** self-certify R06 G4, and does not close P2-R04-2, P2-R05-1 or P2-R05-2. That is for independent G3 QA and then D007-A27.
**History (preserved):** previous handoff (REMEDIATION-05) at [811d5c0](https://github.com/zyyu1/literature-management-system/blob/811d5c0fdcd740e5f6e6334d99cd2908cfeada8f/docs/handoffs/POC-001/QA_HANDOFF.md); earlier ones are linked from there.

## 1. Provenance and lineage

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (existing, PR #2) |
| Original approved base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; `git merge-base HEAD 1c084e5…` returns `1c084e5…`; `git rev-list --merges 1c084e5..HEAD` is empty |
| Exact R06 start HEAD | `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f`. Preflight confirmed the local HEAD, the remote branch and the PR #2 head all equalled it, with a clean tree, before any edit |
| Lineage | `811d5c0 → afc5b17 (tests + M48 + README) → (this evidence + handoff commit)`; fast-forward only; **no rebase, no merge of `main`, no force-push, no Design docs cherry-picked** |
| R06 code/doc commit | `afc5b17ccfd9f525bff8ebdb06f30473b0d877f0` |
| R06 evidence | generated on a clean tree at `afc5b17` (`results.json`: `gitHead=afc5b17…`, `gitDirtyPaths=(clean)`). The final commit adds only `poc/001/evidence/**` and this file; no test, script, README or src byte changes after the evidence run |
| **Final PR head** | the commit adding this file. **Its true 40-char SHA is in the PR #2 execution comment** (no self-referencing SHA here) |
| Runtime | Node **v22.23.5**, npm 10.9.9, Linux 6.18 **x64**, **2 vCPU**, 127.0.0.1 only |
| Dependencies | **none added**. `npm ls --all` → `(empty)`; `package.json` and `package-lock.json` unchanged |

**Evidence-runner label note:** `scripts/run-evidence.mjs` is outside the R06 write allowlist and was run **unmodified**. Its hard-coded `remediation` field in `results.json` still says REMEDIATION-05. The authoritative identity of this run is `gitHead=afc5b17…`. R06 per-area outputs are in the separate `evidence/R06-*.txt` files, because the unmodified runner has no R06 step; the R06 tests still run inside each full-suite run via the glob.

## 2. Changed files

**Incremental `811d5c0..HEAD`** (all within the R06 incremental allowlist):
- `poc/001/test/r06-regressions.test.mjs` (new)
- `poc/001/scripts/mutation-check.mjs` (M48, `expect` check, uniqueness check, totals line; M1–M47 entries unchanged)
- `poc/001/README.md` (item 9b capacity disclosure, "Remediation 06" section, run-command counts)
- `poc/001/evidence/**` (regenerated, plus new `R06-*.txt`)
- `docs/handoffs/POC-001/QA_HANDOFF.md` (this file)

`poc/001/test/r05-regressions.test.mjs` was **not** changed. The full path inventories (cumulative vs `1c084e5`, incremental vs `811d5c0`) are in the PR #2 execution comment, computed on the final HEAD.

**Source unchanged:** all 8 `poc/001/src/**` blob SHAs at `afc5b17` are identical to `811d5c0` (`git diff --exit-code 811d5c0 HEAD -- poc/001/src` → 0). Table in §7.

## 3. P2-R05-1 — new R06 tests (`test/r06-regressions.test.mjs`, 11 tests)

The tests use only the existing mock options `propfindOverride` and `ignorePropSelection`, its `faults` and its `requestLog`; the mock source is not changed. A shared `assertFailClosed` helper snapshots the requestLog **after the setup write** and asserts:
- `503 export_incomplete`, no `records` and no `count` (no bundle);
- **exactly one PROPFIND for the failing listing**, and the list of PROPFIND paths equals the expected sequence (no retry or fallback);
- every PROPFIND body equals `PROPFIND_RESOURCETYPE_BODY` (**114 bytes**), with `Content-Length: 114`, `Content-Type: application/xml; charset=utf-8` and `Depth: 1`, and contains no `allprop`, `propname`, `lockdiscovery` or `current-user-principal`;
- **0 GET** (fails closed before any record GET), **0** PUT/DELETE/MKCOL, and an unchanged stored mock state (file bytes and ETags, collections, locks).

Each 207 fixture is also asserted to throw from `parseMultistatus`, which proves it exercises the catch path that M48 mutates.

| Required scenario | Test |
|---|---|
| 207 + malformed/truncated XML | `R06-207 malformed/truncated XML (root and kind listing)` — truncated, not-XML and mismatched tags, each at the root and at `notes` |
| 207 + well-formed but unsupported DAV structure | `R06-207 well-formed but unsupported nested DAV property/href` — `owner/href` (root), `lockdiscovery` with `locktoken/href` (notes), `response` nested in `prop` (notes) |
| `ignorePropSelection` allprop **with** locks | `R06-207 non-conforming server answers allprop … (locks=true)` |
| `ignorePropSelection` allprop **without** locks | `… (locks=false)` |
| 400 / 403 / 415 / 500 | `R06 non-207 <status> → 503, exactly one explicit PROPFIND (body/length/type/depth), no GET, no writes` |
| catch path at adapter level | `R06-207 adapter: malformed 207 returns outcome malformed after exactly one explicit PROPFIND (no second request)` — 1 request of any method |
| valid 207 non-regression | `R06 non-regression: valid resourcetype-only 207 exports normally …` — 200, one explicit PROPFIND per listing (root plus 3 kinds), record GET only on success |
| constants | `R06 constants: explicit PROPFIND body is 114 bytes …` |

Result at `afc5b17`: **11/11 pass**, exit 0 (`evidence/R06-regressions.txt`). Request-level evidence for every scenario is in `evidence/R06-requestlog.txt`: for each one, the method, path, Depth, Content-Type, Content-Length, body bytes, body hash, `bodyEqualsExplicit` and the export result. The probe source is embedded in the file.

## 4. M48 and mutation results

- **M48** — `src/webdav-adapter.mjs`: `catch (e) { return { outcome: 'malformed', … } }` after `parseMultistatus(r.body)` becomes `catch (e) { await request('PROPFIND', path, { headers: { Depth: depth } }); return { outcome: 'malformed', … } }`. The original failed return is kept, so the export still ends in 503. It is applied **only in a temporary copy**; the pattern must occur exactly once.
- M48 counts as killed **only** if its suite exits non-zero **and** the output contains `R06 exactly one PROPFIND for the failing listing`. Any other failure is reported as `FAILED_FOR_UNEXPECTED_REASON`.
- **Actual run** (`node scripts/mutation-check.mjs`, exit **0**, 510599 ms): **48 mutants run, 48 killed, 0 survived, 0 setup errors, 0 unexpected-reason failures** (`evidence/mutation.txt`). M48 line: `KILLED (suite exit 1, failing tests 5, expected assertion observed)`. M1–M47 are all `KILLED`.
- **Detail** (`evidence/R06-M48-kill.txt`): with M48 applied, R06 fails exactly 5 tests: malformed/truncated, unsupported structure, `ignorePropSelection` with locks, without locks, and adapter level. All 5 fail on the R06 request-count assertion. The 4 non-207 tests and the valid-207 test still pass, as expected, because the mutant only touches the 207 catch path. Against the same mutant, the **old R05 suite passes 20/20**, which reproduces the gap QA reported.

## 5. P2-R05-2 capacity disclosure (`README.md` item 9b) — CAPACITY_POLICY_PENDING

- `MAX_ELEMENTS = 10000` (`LIMITS.maxElements`, per PROPFIND response).
- **Synthetic minimal kind-listing fixture only:** `elements = 8 + 6*N`. **`N <= 1665` succeeds** (9 998 elements); **`N >= 1666` → `503 export_incomplete`**, fail-closed **before any record GET**, never a partial `200` bundle.
- The boundary applies only to that fixture. Other legal XML properties can lower the maximum. **1665 is not a general library or entry limit.** Real-service capacity and paging compatibility are **unproven**. No pagination, paging, cap increase or data-shape change.
- **Execution re-check** (`evidence/R06-capacity-probe.txt`, probe source embedded):
  - At the listing level, N = 0/1/1664/1665 parse to exactly `8+6N` elements (8/14/9992/9998) with adapter outcome `ok`.
  - N = 1666/1667 are rejected with `resource limit: more than 10000 elements`; the export returns `503 export_incomplete` with **0 GET and 0 writes**.
  - Probe records are bare synthetic files without provenance, so the export at 1 ≤ N ≤ 1665 ends `503` **after** GET, from record authentication. That run re-proves only the listing boundary. Full export success at N = 1665 with authentic records is QA's evidence (#7103304755) and is not re-proven here.

## 6. Results at `afc5b17` (Execution run; NOT independent QA)

| Command | Exit | Pass |
|---|---|---|
| `node --test --test-reporter=spec test/poc01-crud.test.mjs` | 0 | 2/2 |
| `node --test --test-reporter=spec test/poc02-security.test.mjs` | 0 | 4/4 |
| `node --test --test-reporter=spec test/poc03-roundtrip.test.mjs` | 0 | 3/3 |
| `node --test --test-reporter=spec test/poc04-multiclient.test.mjs` | 0 | 1/1 |
| `node --test --test-reporter=spec test/poc05-race.test.mjs` | 0 | 3/3 |
| `node --test --test-reporter=spec test/poc06-faults.test.mjs` | 0 | 17/17 |
| `node --test --test-reporter=spec test/poc07-backup.test.mjs` | 0 | 3/3 |
| `node --test --test-reporter=spec test/r01-regressions.test.mjs` | 0 | 21/21 |
| `node --test --test-reporter=spec test/r02-regressions.test.mjs` | 0 | 21/21 |
| `node --test --test-reporter=spec test/r03-regressions.test.mjs` | 0 | 26/26 |
| `node --test --test-reporter=spec test/r04-regressions.test.mjs` | 0 | 17/17 |
| `node --test --test-reporter=spec test/r05-regressions.test.mjs` | 0 | 20/20 |
| `node --test --test-reporter=spec test/r06-regressions.test.mjs` | 0 | 11/11 |

`node scripts/check.mjs` exit 0 (29 files, 0 failures) · `npm ls --all` exit 0 `(empty)` · `node scripts/resource-probe.mjs --baseline <tmp>` exit 0 · `node scripts/secret-scan.mjs 1c084e5…` exit 0 (54 changed files, 0 findings).

**Full suite `node --test "test/*.test.mjs"` — five genuinely separate runs:**

| Run | Exit | Pass | Duration |
|---|---|---|---|
| run 1 | 0 | 149/149 | 23869 ms |
| run 2 | 0 | 149/149 | 23801 ms |
| run 3 | 0 | 149/149 | 23722 ms |
| run 4 | 0 | 149/149 | 23843 ms |
| run 5 | 0 | 149/149 | 23638 ms |

149 = 138 previous + 11 R06. These are new numbers; no historical 138/138×5 or 47/47 figure is reused.

## 7. Source blob audit (`poc/001/src/**`, `811d5c0` vs `afc5b17`)

| File | Blob (both) |
|---|---|
| `poc/001/src/api-main.mjs` | `1498d4901a1bc81324a3614152de5d9a4a7ae5e0` |
| `poc/001/src/client.mjs` | `fa9b98d170b06e579d4f7332ed39be75c04cf563` |
| `poc/001/src/dav-xml.mjs` | `3d182adf4e461d6fe37f45b985c5467a7e13916b` |
| `poc/001/src/mock-webdav.mjs` | `1d44839d9e6fba9cd8049f89732dc5452cdf345d` |
| `poc/001/src/note-codec.mjs` | `6f91c2c5a650e52b47c57f8cd6879bc456ecc80a` |
| `poc/001/src/safe-api.mjs` | `96400cc81d7f211121a8d2a61491757e28553c58` |
| `poc/001/src/util.mjs` | `1f583c1f606535a17b8c84589e4bdc1bfb885a91` |
| `poc/001/src/webdav-adapter.mjs` | `1adfe97c82cd33d998d766c71d6cced8491133db` |

All 8 are identical; `git diff --exit-code 811d5c0 afc5b17 -- poc/001/src` exits 0. QA must re-verify on the final HEAD.

## 8. Residuals, NOT_RUN, UNSUPPORTED

- **Open, not closed by Execution:** P2-R04-2 (`OPEN_HARD_PRE_ACCESS`), P2-R05-1 (test gap; R06 evidence pending QA), P2-R05-2 (`CAPACITY_POLICY_PENDING`).
- **NOT_RUN:** all real-provider, Nutstore, Zotero, TLS and external WebDAV tests; the A25 119-run isolated resource campaign (only the standard `resource-probe.mjs` run is included); performance on other hardware.
- **UNSUPPORTED (unchanged):** Q1e, snapshot consistency, Q4/Q5 liveness, provider CAS/ETag/MKCOL/PROPFIND shapes, durable exactly-once, key rotation, real TLS, production paging.
- **Execution-observed P0/P1:** none in the tested scope. This is not a claim that none exist.
- **Confirmed:** zero real-service access. GitHub was used only for fetch, push and the PR comment.

## 9. QA instructions (per R06 QA plan)

1. Take the true final HEAD from the PR #2 execution comment. Use a fresh clone and a clean tree. Check `merge-base HEAD 1c084e5…` = `1c084e5…`, that `811d5c0…` is an ancestor, and that there are no merge commits.
2. Compare every `poc/001/src/**` blob against `811d5c0` (R06-SRC-01). Check the cumulative (`1c084e5..HEAD`) and incremental (`811d5c0..HEAD`) path lists.
3. In `poc/001`, run:
   - `check.mjs`;
   - POC-01..07 and R01–R06;
   - the full suite ×5;
   - `mutation-check.mjs` (about 9 min; expect 48);
   - `secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`;
   - `npm ls --all`.

   Do **not** run `npm run evidence` in the checkout.
4. R06-MUT-01: inject a QA-owned QM1-style mutant into the `parseMultistatus` catch and show that the **repository** suite kills it because of the request count or body. Cover R06-M207-01..04 with independent fixtures and the actual outbound PROPFIND, and check the README/QA_HANDOFF capacity wording (R06-CAP-01).
5. Report `R06 LOCAL_STAGE: PASS/PARTIAL/FAIL` and `OVERALL POC-001: BLOCKED_REAL_SERVICE` on the exact SHA in PR #2. Do not modify code. STOP for D007-A27.

**EXECUTION STOP — HAND OFF TO INDEPENDENT G3 QA. PR #2 OPEN / NOT MERGED; no rebase, no main merge, no force-push, no ACCESS-02, no deployment. G5 / G6 / G7 NOT AUTHORIZED.**
