# POC-001 — Execution → QA Handoff · REMEDIATION-07 / D007-A27 Option B (LOCAL / SYNTHETIC · TEST-ONLY)

**From:** Execution Window · 2026-11-24 (Europe/Berlin)
**Authority:** [D007-A27](https://github.com/zyyu1/literature-management-system/blob/4ba0cfa73870c88160e6fb073512a73d0ceb1ce6/docs/architecture/D007_A27_POC001_R07_TEST_ONLY_AUTHORIZATION.md), [REMEDIATION_07.md](https://github.com/zyyu1/literature-management-system/blob/4ba0cfa73870c88160e6fb073512a73d0ceb1ce6/docs/handoffs/POC-001/REMEDIATION_07.md) and the [R07 independent QA plan](https://github.com/zyyu1/literature-management-system/blob/4ba0cfa73870c88160e6fb073512a73d0ceb1ce6/docs/handoffs/POC-001/REMEDIATION_07_QA_PLAN.md), read at the pinned Design commit `4ba0cfa73870c88160e6fb073512a73d0ceb1ce6`. Inputs: R06 Execution [#7119832091](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7119832091) and R06 limited-independence QA relay [#7120465999](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7120465999). The relay is technical evidence only, **not** the formal independent G3.
**Scope:** **P2-R06-1 / F-1**: request-count and body pins for the three **post-parse** malformed-207 branches of `propfind()` (foreign href, non-2xx response entry, duplicate normalized href). Tests and mutants only. **No production, runtime, mock, adapter, README, package or CI change.**
**Boundary:** in-repo loopback mock on 127.0.0.1 and synthetic data only. No real Nutstore, Zotero, external WebDAV, TLS, credentials, PDFs or library records. **OVERALL POC-001: `BLOCKED_REAL_SERVICE`.**
**Status:** Execution evidence only. No G3 or G4 claim and no risk closure.
- P2-R04-1: `CLOSED_LOCAL_SYNTHETIC` (`811d5c0` only)
- P2-R04-2: `OPEN_HARD_PRE_ACCESS`
- P2-R05-1: `OPEN_TEST_GAP` (independent G3 pending)
- P2-R05-2: `CAPACITY_POLICY_PENDING`
- P2-R06-1: `OPEN_TEST_GAP`
- R06 QA: `G3_INDEPENDENCE_PENDING`

**History (preserved):** previous handoff (R06) at [5ab4709](https://github.com/zyyu1/literature-management-system/blob/5ab47090f1100fbe0c9defd39930fcf715dbab38/docs/handoffs/POC-001/QA_HANDOFF.md); earlier ones are linked from there.

## 1. Provenance and lineage

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (existing, PR #2) |
| Original immutable base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` (merge-base unchanged; `git rev-list --merges 1c084e5..HEAD` empty) |
| Mandatory R07 start | `5ab47090f1100fbe0c9defd39930fcf715dbab38`. Preflight: local HEAD = remote branch = PR #2 head = `5ab4709…`, PR OPEN/not merged, clean tree; the eight `src` blobs were recorded before any edit |
| Parent chain | `5ab4709 (R06 final) → cf88fc9 (R07 tests + M49–M51) → (this evidence + handoff commit)`; fast-forward only; **no rebase, no merge or cherry-pick of `main`, no force-push** |
| R07 test commit | `cf88fc91b21edc30a6edaeb5beea197d87ddb479` |
| Evidence | runner `scripts/run-evidence.mjs` (unmodified) on a clean tree at `cf88fc9` (`results.json`: `gitHead=cf88fc91b21edc30a6edaeb5beea197d87ddb479`, `gitDirtyPaths=(clean)`), plus `evidence/R07-*.txt` from the same HEAD. The runner deletes and regenerates `evidence/`; the four R06 files (`evidence/R06-*.txt`) were **restored unchanged from `5ab4709`** as historical R06 evidence, not re-run R07 results |
| **Final PR head** | the commit adding this file. **Its true 40-char SHA is in the PR #2 R07 execution comment** |
| Environment | `evidence/R07-environment.txt`: Node **v22.23.5**, npm 10.9.9, Linux 6.18 x86_64, **2 vCPU** (Intel Xeon), about 7.8 GiB RAM, 127.0.0.1 only, **0 third-party dependencies** |

**Runner label note:** `results.json` still carries the runner's hard-coded REMEDIATION-05 `remediation` label. The authoritative identity of this run is `gitHead=cf88fc91b21edc30a6edaeb5beea197d87ddb479`. The runner has no per-area R06 or R07 step, so those individual runs are recorded separately (`evidence/R07-run-r06-regressions.txt`, `evidence/R07-run-r07-regressions.txt`); both test files also run inside each full-suite run via the glob.

## 2. Changed files

**Incremental `5ab4709..HEAD`** (all within the strict R07 allowlist):
- `poc/001/test/r07-regressions.test.mjs` (new, 4 tests)
- `poc/001/scripts/mutation-check.mjs` (M49, M50, M51 added; M1–M48 entries and the R06 `expect` mechanism unchanged)
- `poc/001/evidence/**` (regenerated, plus new `R07-*.txt`; `R06-*.txt` unchanged)
- `docs/handoffs/POC-001/QA_HANDOFF.md`

**Not changed:** `test/r06-regressions.test.mjs`, README (F-4 out of scope), all `src/**`, the mock, other tests and scripts, package/lockfile. The full cumulative (`1c084e5..HEAD`) and incremental path lists, computed on the final HEAD, are in the PR #2 R07 execution comment.

## 3. R07 regression fixtures (`test/r07-regressions.test.mjs`)

Every negative fixture is **well-formed DAV XML that parses**: each asserts `assert.doesNotThrow(() => parseMultistatus(xml))`, so it cannot reach the R06 catch path. Each also has an **adapter-level branch control**: `adapter.propfind(path,'1')` must return exactly `{ outcome:'malformed', reason:<branch> }` after exactly one request of any method.

| Case | Fixtures (listing) | Adapter result |
|---|---|---|
| **R07-FH-01** foreign href | root: extra response `/other-base/notes/`; root: prefix look-alike `/lms-poc-x/…` (not under `/lms-poc/`); notes: record `/elsewhere/notes/x.json` | `malformed` / `foreign href` |
| **R07-STATUS-02** non-2xx entry | root: kind entry with response-level `404`; notes: record whose only propstat is `403`; notes: extra entry with response-level `500` | `malformed` / `non-2xx response entry` |
| **R07-DUP-03** duplicate normalized href | root: `/notes` and `/notes/`; root: self `/ns` and `/ns/`; notes: record plain and `%2E`-encoded; notes: self with and without trailing slash | `malformed` / `duplicate href` |
| **R07 positive control** | the same builders without the bad entry, for root and notes | `ok`; export **200**, count 1, PROPFIND paths root plus 3 kinds, 1 record GET |

**Export assertions for every negative fixture**, read from the mock's actual `requestLog` after the setup write:
- `503 export_incomplete`, no `records` and no `count`;
- **exactly one PROPFIND for the failing path**;
- PROPFIND path sequence exactly `[root]` (root case) or `[root, notes]` (kind case), so a duplicate, Depth-0 or allprop retry would show;
- every PROPFIND body equal to `PROPFIND_RESOURCETYPE_BODY`, 114 bytes, `Content-Length: 114`, `Content-Type: application/xml; charset=utf-8`, `Depth: 1`, no `allprop`/`propname`;
- **0 GET, 0 PUT/MKCOL/DELETE**;
- **files, ETags, collections and locks unchanged**.

Fresh run at `cf88fc9`: **R07 4/4 pass** (exit 0). R06 run individually at the same HEAD: **11/11 pass**. Request-level evidence for every branch (root and notes) and for the positive control is in `evidence/R07-requestlog.txt`. For each it records fixture-parses, the adapter result, the export result, and per request: method, path, Depth, Content-Type, Content-Length, bytes, body hash and `bodyEqualsExplicit`. The probe source is embedded in the file.

## 4. Mutants M49–M51 and mutation results

Each new mutant patches **only a temporary copy** of `src/webdav-adapter.mjs`. The `from` line must occur exactly once (driver uniqueness check). The mutant inserts `await request('PROPFIND', path, { headers: { Depth: depth } });` immediately before the branch's **unchanged** malformed return. It counts as killed only if `test/r07-regressions.test.mjs` exits non-zero **and** the output contains that branch's own assertion: `R07-FH-01 …`, `R07-STATUS-02 …` or `R07-DUP-03 exactly one PROPFIND for the failing listing`.

| Mutant | Branch | Driver result (`evidence/mutation.txt`) | Detail (`evidence/R07-mutant-detail.txt`) |
|---|---|---|---|
| M49 | foreign href | `KILLED (suite exit 1, failing tests 1, expected assertion observed)` | R07: 3 pass, 1 fail (only `R07-FH-01`), on "R07-FH-01 exactly one PROPFIND …"; **pre-R07 suites (13 files, 149 tests) pass 149/149, so the mutant survives without R07** |
| M50 | non-2xx entry | `KILLED (… failing tests 1, expected assertion observed)` | only `R07-STATUS-02` fails, on its own assertion; pre-R07 149/149 pass, so it survives without R07 |
| M51 | duplicate href | `KILLED (… failing tests 1, expected assertion observed)` | only `R07-DUP-03` fails, on its own assertion; pre-R07 149/149 pass, so it survives without R07 |

**Driver run** (`node scripts/mutation-check.mjs`, exit **0**, 510068 ms): **51 mutants run, 51 killed, 0 survived, 0 setup errors, 0 unexpected-reason failures.** M1–M47 are all `KILLED`. R06 **M48** is still `KILLED (suite exit 1, failing tests 5, expected assertion observed)`. These are actual observed counts, not predictions.

## 5. Results at `cf88fc9` (Execution run; NOT independent QA)

| Command | Exit | Pass | Evidence |
|---|---|---|---|
| `node --test --test-reporter=spec test/poc01-crud.test.mjs` | 0 | 2/2 | `evidence/POC-01.txt` |
| `node --test --test-reporter=spec test/poc02-security.test.mjs` | 0 | 4/4 | `evidence/POC-02.txt` |
| `node --test --test-reporter=spec test/poc03-roundtrip.test.mjs` | 0 | 3/3 | `evidence/POC-03.txt` |
| `node --test --test-reporter=spec test/poc04-multiclient.test.mjs` | 0 | 1/1 | `evidence/POC-04.txt` |
| `node --test --test-reporter=spec test/poc05-race.test.mjs` | 0 | 3/3 | `evidence/POC-05.txt` |
| `node --test --test-reporter=spec test/poc06-faults.test.mjs` | 0 | 17/17 | `evidence/POC-06.txt` |
| `node --test --test-reporter=spec test/poc07-backup.test.mjs` | 0 | 3/3 | `evidence/POC-07.txt` |
| `node --test --test-reporter=spec test/r01-regressions.test.mjs` | 0 | 21/21 | `evidence/R01-regressions.txt` |
| `node --test --test-reporter=spec test/r02-regressions.test.mjs` | 0 | 21/21 | `evidence/R02-regressions.txt` |
| `node --test --test-reporter=spec test/r03-regressions.test.mjs` | 0 | 26/26 | `evidence/R03-regressions.txt` |
| `node --test --test-reporter=spec test/r04-regressions.test.mjs` | 0 | 17/17 | `evidence/R04-regressions.txt` |
| `node --test --test-reporter=spec test/r05-regressions.test.mjs` | 0 | 20/20 | `evidence/R05-regressions.txt` |
| `node --test --test-reporter=spec test/r06-regressions.test.mjs` | 0 | 11/11 | `evidence/R07-run-r06-regressions.txt` |
| `node --test --test-reporter=spec test/r07-regressions.test.mjs` | 0 | 4/4 | `evidence/R07-run-r07-regressions.txt` |

`node --version` v22.23.5 · `node scripts/check.mjs` exit 0 (30 files, 0 failures) · `npm ls --all` exit 0 `(empty)` · `node scripts/resource-probe.mjs --baseline <tmp>` exit 0 · `node scripts/secret-scan.mjs 1c084e5…` exit 0, 0 findings.

**Full suite `node --test "test/*.test.mjs"` — five genuinely separate runs:**

| Run | Exit | Pass | Duration |
|---|---|---|---|
| run 1 | 0 | 153/153 | 24019 ms |
| run 2 | 0 | 153/153 | 24223 ms |
| run 3 | 0 | 153/153 | 24551 ms |
| run 4 | 0 | 153/153 | 23841 ms |
| run 5 | 0 | 153/153 | 23916 ms |

153 = 149 (through R06) + 4 (R07). No historical count is reused.

## 6. Source blob identity (`poc/001/src/**`, `5ab4709` → `cf88fc9`)

| File | Blob (unchanged) |
|---|---|
| `poc/001/src/api-main.mjs` | `1498d4901a1bc81324a3614152de5d9a4a7ae5e0` |
| `poc/001/src/client.mjs` | `fa9b98d170b06e579d4f7332ed39be75c04cf563` |
| `poc/001/src/dav-xml.mjs` | `3d182adf4e461d6fe37f45b985c5467a7e13916b` |
| `poc/001/src/mock-webdav.mjs` | `1d44839d9e6fba9cd8049f89732dc5452cdf345d` |
| `poc/001/src/note-codec.mjs` | `6f91c2c5a650e52b47c57f8cd6879bc456ecc80a` |
| `poc/001/src/safe-api.mjs` | `96400cc81d7f211121a8d2a61491757e28553c58` |
| `poc/001/src/util.mjs` | `1f583c1f606535a17b8c84589e4bdc1bfb885a91` |
| `poc/001/src/webdav-adapter.mjs` | `1adfe97c82cd33d998d766c71d6cced8491133db` |

`git diff --exit-code 5ab4709 cf88fc9 -- poc/001/src` exits 0. The final-HEAD comparison is in the PR comment; QA must re-verify.

## 7. Preserved dispositions, residuals, NOT_RUN

- **Capacity (unchanged, P2-R05-2 `CAPACITY_POLICY_PENDING`):** `MAX_ELEMENTS = 10000`; synthetic fixture `8 + 6*N`; N = 1665 gives 9 998 elements, N = 1666 gives 10 004. This is not a universal library-size guarantee. No paging, limit, quota or capacity change in R07. README not touched.
- **INFO F-2, F-3, F-4:** unchanged and out of scope.
- **NOT_RUN:** all real-provider, Nutstore, Zotero, TLS and external tests; the A25 119-run isolated resource campaign (only the standard probe was run); export-level capacity at N = 1666; other hardware.
- **UNSUPPORTED (unchanged):** Q1e, snapshot consistency, Q4/Q5, provider CAS/ETag/MKCOL/PROPFIND shapes, durable exactly-once, real TLS, production paging.
- **Execution-observed P0/P1:** none in the tested scope. This is not a claim that none exist.
- **Privacy:** evidence is sanitized (`<poc/001>`, `<tmp>`); no personal paths, credentials, real records or PDFs. Only GitHub fetch, push and the PR comment were used.

## 8. Independent G3 (REMEDIATION_07_QA_PLAN)

The next reviewer **must be a separately opened independent QA session or window**. An Execution-started sub-agent does **not** satisfy D007-A27. The reviewer must:
- fresh-clone the final exact R07 SHA from the PR comment;
- verify identity and ancestry (`1c084e5` merge-base, `5ab4709` ancestor, 0 merges), paths and all eight blobs;
- run `check.mjs`, POC-01..07, R01–R07, the full suite ×5, `mutation-check.mjs` (about 9 min; observe the actual total), `secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` and `npm ls --all`;
- independently reproduce QM1-style catch-path variants (R06) and **foreign-href, non-2xx-entry and duplicate-href** sibling mutants (R07) with its own probes and recording proxy;
- post an independent G3 comment on PR #2.

Do not run `npm run evidence` in the checkout. **If no separate QA session is available, record `G3_INDEPENDENCE_PENDING`; do not substitute a same-session sub-agent.**

**EXECUTION STOP — PR #2 OPEN / NOT MERGED; no rebase, main merge or force-push. G4/G5/G6/G7 NOT AUTHORIZED. Next Design item: D007-A28, only after independent G3 on the new exact SHA.**
