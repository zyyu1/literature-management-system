# POC-001 — Execution → QA Handoff · REMEDIATION-03 / D007-A22 (LOCAL MOCK ONLY)

**From:** Execution Window · 2026-11-23 (Europe/Berlin)
**Authority:** [REMEDIATION_03.md @ `28f988b`](https://github.com/zyyu1/literature-management-system/blob/28f988bd9cbf8583234b12bdc4900a3afa57174e/docs/handoffs/POC-001/REMEDIATION_03.md), [A22 disposition](https://github.com/zyyu1/literature-management-system/blob/28f988bd9cbf8583234b12bdc4900a3afa57174e/docs/architecture/D007_A22_POC001_REMEDIATION03_DISPOSITION.md), [A22 QA plan](https://github.com/zyyu1/literature-management-system/blob/28f988bd9cbf8583234b12bdc4900a3afa57174e/docs/handoffs/POC-001/REMEDIATION_03_QA_PLAN.md). These sit within REMEDIATION-01/02 and the original [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md).
**Boundary:** in-repo loopback mocks and **synthetic data only**. **No real Nutstore or Zotero access, no external WebDAV, no credentials, no PDFs or notes.** **Real Nutstore: `BLOCKED_REAL_SERVICE`. OVERALL POC-001 cannot PASS.** Execution does **not** self-certify `LOCAL_STAGE PASS`.
**History (preserved):** handoffs [v1 @ 65e14af](https://github.com/zyyu1/literature-management-system/blob/65e14afc81e6de37ba5fac90c2937a27876c5614/docs/handoffs/POC-001/QA_HANDOFF.md), [R01 @ 2806d9d](https://github.com/zyyu1/literature-management-system/blob/2806d9d08dcec78e974703a82a38a696ae76d132/docs/handoffs/POC-001/QA_HANDOFF.md), [R02 @ 74d00f2](https://github.com/zyyu1/literature-management-system/blob/74d00f2bf6d6be5a55f43b359a416437e7e3e0c3/docs/handoffs/POC-001/QA_HANDOFF.md). QA reports [7088088675](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675), [7088521226](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088521226), [7089087597](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597).

## 1. Provenance, ancestry and no-rebase proof

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (existing) |
| Original authorized base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. `git merge-base HEAD 1c084e5…` returns `1c084e5…` |
| Approved start HEAD | `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3`. Preflight confirmed it equalled local HEAD and the PR #2 head before any edit; the working tree was clean |
| Ancestry | `74d00f2 → 3cd4da9 → a815a20 → (this handoff commit)`; fast-forward only; **no rebase, no merge of `main`, no force-push** |
| R03 code commit | `3cd4da90d880fdb072b6102002ca68fb556aaf6d` |
| R03 evidence commit | `a815a20fc4899cd780382b085807e75735262d23`, generated on a clean tree at `3cd4da9` (`results.json`: `gitHead=3cd4da9…`, `gitDirtyPaths=(clean)`) |
| **Final PR head** | the commit that adds this file (parent `a815a20`). **Its exact 40-char SHA is stated in the PR #2 update comment**; this file cannot contain its own hash. |
| `main` observed | `28f988bd9cbf8583234b12bdc4900a3afa57174e` (A22). `git merge-tree --write-tree` reported no conflict at that moment; not a claim about future `main` |
| Runtime | Node v22.23.5, npm 10.9.9, Linux x64 |
| Dependencies | **none added**. `npm ls --all` is empty; `package.json` and `package-lock.json` are unchanged since `74d00f2` |

**Cumulative scope** (`git diff --name-only 1c084e5…HEAD`): 49 paths, all `poc/001/**` plus this file.

**Incremental scope** (`74d00f2…HEAD`): `poc/001/{README.md, scripts/mutation-check.mjs, scripts/run-evidence.mjs, src/dav-xml.mjs, src/mock-webdav.mjs, src/safe-api.mjs, src/webdav-adapter.mjs, test/r03-regressions.test.mjs}`, 20 files under `poc/001/evidence/`, and this file. There are no changes to `docs/architecture|governance|ui/**`, `docs/handoffs/{002,WP-01}/**`, `REMEDIATION_02.md`, `EXECUTION_INSTRUCTION.md`, `ACCESS_POLICY.md`, `.github/**`, `app/**`, `src/**`, root package files or deployment config.

## 2. NEW results at `3cd4da9` (Execution run; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node --version` | 0 | v22.23.5 |
| `node scripts/check.mjs` | 0 | 24 files, 0 failures |
| `node --test test/poc0N-*.test.mjs` (N = 1…7) | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| `node --test test/r01-regressions.test.mjs` | 0 | 21 / 21 |
| `node --test test/r02-regressions.test.mjs` | 0 | 21 / 21 |
| `node --test test/r03-regressions.test.mjs` | 0 | **26 / 26** |
| `node --test "test/*.test.mjs"` × **5 separately executed, committed runs** | 0 ×5 | **101 / 101** each |
| `node scripts/mutation-check.mjs` | 0 | **30 / 30 killed** (M24–M30 new; M14 pattern updated) |
| `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings over 46 files *at `3cd4da9`*; the count changes as evidence and handoff commits are added; heuristic |
| `npm ls --all` | 0 | `(empty)`, path sanitized |

POC-05 in this run: A won 23 rounds and B won 27 over 50 forced-overlap rounds. The evidence was checked: no workspace paths and no synthetic credentials or keys.

**Synthetic servers and ETag modes:** the in-repo mock in `generation` (default), `content-hash` and `weak` modes. The new R03 faults are `skip` (target the n-th request), a dishonest PUT ETag (`bogus-etag`), a mismatched or weakened GET ETag, `stale-body` (older authentic bytes served under the current ETag) and `propfindOverride` listings. **No independent alternative server is used by Execution**; QA should bring its own.

**Historical — NOT re-claimed for this SHA:** QA at `74d00f2` observed 75/75 × 5, 23/23 mutants and R02 21/21.

## 3. Q1 / Q2 / Q3 changes and regression evidence

| Item | Change | New tests (`r03`) | Mutants |
|---|---|---|---|
| **Q1** export integrity | `listRecords` requires: the namespace root exists (`namespace_absent` otherwise); exactly one root self entry; **exactly one collection per canonical kind** (`missing_kind_collection` otherwise); duplicate kind or record → fail; exactly one kind self entry; only well-named non-collection files. The adapter rejects duplicate hrefs after decoding and trailing-slash normalisation. The parser rejects a response-level status together with propstat, and a propstat without exactly one status. All failures → **`503 export_incomplete`** | omitted `projects` (project present) and omitted empty `progress`; duplicate root kind (incl. no-trailing-slash), duplicate record (incl. `%6C` encoded), duplicate kind self; status conflict (200/404 and 200/200), non-2xx propstat; nested collection; root stray file; kind as a file; absent namespace; valid **0-record** and **2-record** export → one-time byte-identical restore; adapter-level duplicates | M24 missing kind · M25 adapter duplicate · M26 status/propstat · M27 absent namespace |
| **Q2** fence read-back | After a fence PUT with a trusted strong ETag ≠ base, a **fresh GET** must give: `ok`; a valid, authenticated envelope for this target; none of our own writes (if present → `committed`); a trusted strong ETag **equal to the PUT ETag** and **≠ base**; and **identical bytes**. Otherwise `fence_not_confirmed` with reason `readback_*` (or `record_missing`). The original Unknown is retained and nothing is re-sent | **QA R1l** (content-hash storage + dishonest fence PUT ETag → non-terminal → release late original → `committed`); dishonest PUT ETag on generation; generation race orders A/B (terminal revision = read-back ETag, bytes unchanged); content-hash identical bytes; read-back 500 / hang / weak / mismatched / corrupt / **older authentic bytes** / 404; third-party overwrite between PUT and GET; fence PUT 503 / no ETag / weak | M28 no read-back · M29 no PUT=GET ETag check · M30 no byte check |
| **Q3** README | Replay contract bounded to this process's live ledger plus tombstones; beyond that (eviction, restart, other instance) the ID is forgotten: saved → normally 412, rejected → **can save** if the base is still valid; no exactly-once. Defaults `maxPerPrincipal = 1000`, global `= 1000 × principals`; `principal_ledger_full` vs `operation_ledger_full`. HMAC write tag and provenance described accurately; cross-key, rotation and rollback UNSUPPORTED | `R03-Q3a` pins "forgotten rejected op re-sent and saved" | — |

**Defence-in-depth note:** several Q1 guards overlap, so each guard got a test that reaches it directly (the adapter-level duplicate test and the `stale-body` read-back test). This is why M25 and M30 are killed rather than masked by another guard.

## 4. Q4 / Q5 — documented residual P2 limitations (behaviour unchanged)

| Id | Limitation | Pinned by |
|---|---|---|
| Q4a | A principal whose quota is saturated with **Unknown** operations stays blocked (`principal_ledger_full`) until they resolve or the process restarts; there is no guaranteed recovery | `R03-Q4` |
| Q4b | `maxLedgerEntries` below the sum of per-principal quotas → cross-principal starvation (`operation_ledger_full`) | `R03-Q4` |
| Q4c | A slowly uploaded request body keeps the reservation `pending` until Node's server request timeout | `R03-Q4` (slow body) |
| Q5 | A fence PUT that is Unknown and applies later leaves the operation `indeterminate`, possibly indefinitely. It is never converted into `saved` or `not_committed`, and there is no certified safe resolution | `R03-Q5` |

## 5. Findings, unsupported features and boundaries

- **Execution-observed P0/P1:** none in the tested scope. This is not a claim that none exist.
- **Residual P2 (declared):** Q4a–c and Q5 above.
- **UNSUPPORTED / not claimed:**
  - provider-side completeness of a well-formed listing (a silently omitted record is undetectable: `R03-Q1e` INFO);
  - consistent multi-file snapshot;
  - the provider's PUT/GET ETag consistency, atomic strong `If-Match`, ETag change on identical bytes and `MKCOL` atomicity on Nutstore;
  - create-only fence;
  - durable or cross-instance or global exactly-once;
  - cross-key restore, key rotation and storage-rollback detection;
  - real TLS (`https:` fails closed).
- **Confirmed:** no real Nutstore or Zotero access, no external network test, no credentials, PDFs or real notes; GitHub was used only for governance (fetch, push, PR comment).

## 6. QA instructions (per A22 QA plan)

1. Take the exact final head from the PR #2 update comment. Run a fresh checkout, `git rev-parse HEAD`, and confirm `git status --short` is clean. Check `git merge-base HEAD 1c084e5…` = `1c084e5…` and `git merge-base --is-ancestor 74d00f2bf6d6be5a55f43b359a416437e7e3e0c3 HEAD`.
2. Check both path inventories (§1) against the allowlist.
3. In `poc/001`, run `check.mjs`; POC-01..07; R01/R02/R03; the full suite × 5; `secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; `mutation-check.mjs` (about 8 min). Do **not** run `npm run evidence` in the checkout.
4. Using an **independent** loopback WebDAV double, cover R03-Q1a–e, R03-Q2a–c (including R1l and the dishonest-PUT-ETag variants), R03-Q3a/b, R03-Q4 and R03-Q5, plus the earlier probes.
5. Report `LOCAL_STAGE PASS/PARTIAL/FAIL`, per-area status, residual P0/P1/P2, UNSUPPORTED, and `OVERALL POC-001: BLOCKED_REAL_SERVICE` in PR #2. Do not modify code. STOP for Design (G4).

**EXECUTION STOP — HAND OFF TO INDEPENDENT QA. No merge, no rebase, no ACCESS-02, no deployment.**
