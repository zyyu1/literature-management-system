# POC-001 — Execution → QA Handoff · REMEDIATION-02 (LOCAL MOCK ONLY)

**From:** Execution Window · 2026-11-23 (Europe/Berlin)
**Authority:** [REMEDIATION_02.md @ `f8cddd9`](https://github.com/zyyu1/literature-management-system/blob/f8cddd9cd7811adda28d4a7f2125dc7b5fb071e1/docs/handoffs/POC-001/REMEDIATION_02.md), within [REMEDIATION_01](https://github.com/zyyu1/literature-management-system/blob/f7e89c4d438fc30b54546ec0f27823604df7aaa2/docs/handoffs/POC-001/REMEDIATION_01.md) and the original [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md).
**Boundary:** all results come from **in-repo loopback mocks** with **synthetic data**. **Real Nutstore: `BLOCKED_REAL_SERVICE` / NOT RUN. OVERALL POC-001 cannot PASS.** Execution does **not** claim QA PASS.
**History (preserved):**
- [Handoff v1 @ 65e14af](https://github.com/zyyu1/literature-management-system/blob/65e14afc81e6de37ba5fac90c2937a27876c5614/docs/handoffs/POC-001/QA_HANDOFF.md), [QA 7088088675](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675)
- [Handoff R01 @ 2806d9d](https://github.com/zyyu1/literature-management-system/blob/2806d9d08dcec78e974703a82a38a696ae76d132/docs/handoffs/POC-001/QA_HANDOFF.md), [re-QA 7088521226](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088521226)
- Design dispositions [7088171820](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088171820) and [7088592518](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088592518)

## 1. Provenance and no-rebase proof

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (unchanged) |
| Authorized base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. `git merge-base HEAD 1c084e5…` returns `1c084e5…` |
| History | fast-forward from re-QA'd `2806d9d08dcec78e974703a82a38a696ae76d132` (`git merge-base --is-ancestor 2806d9d HEAD` exits 0); no rebase, no force-push, no merge of `main` |
| R02 code commit | `1255c9e316f9b4f5dcb4e380a57b8f5c406abe30` (parent `2806d9d`) |
| R02 evidence commit | `5a265fd3591c879c616a4fbff9b5738371313dae`, generated on a clean tree at `1255c9e` (`results.json` shows `gitHead=1255c9e…`, `gitDirtyPaths=(clean)`) |
| **PR head** | the commit adding this file (parent `5a265fd`). **Use the exact head SHA in the PR #2 update comment.** |
| `main` observed | `2705b5f1ce676528e65a47caa3f7d211d3a4c1f6`. `git merge-tree --write-tree` reported no conflict at that moment (not a claim about future `main`) |
| Runtime | Node v22.23.5, npm 10.9.9, Linux x64 |
| Dependencies / licence delta | **none**: `npm ls --all` is empty and the lockfile is unchanged. The new XML parser (`src/dav-xml.mjs`) is in-repo and dependency-free. |

**Scope:** `git diff --name-only 1c084e5…HEAD` lists 47 paths: `poc/001/**` (46) plus this file. R02 itself touched `poc/001/**` and this file only. No Design document, `docs/ui/**`, `docs/architecture/**`, ACCESS policy or application code was changed.

## 2. Commands and exit codes (Execution run at `1255c9e`; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node scripts/check.mjs` | 0 | 23 files, 0 failures |
| `node --test test/poc0N-*.test.mjs` (N = 1…7) | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| `node --test test/r01-regressions.test.mjs` | 0 | 21 / 21 |
| `node --test test/r02-regressions.test.mjs` | 0 | **21 / 21** |
| `node --test "test/*.test.mjs"` × **5 committed real runs** | 0 ×5 | **75 / 75** each |
| `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings over 44 files *at `1255c9e`*. The count grows once evidence and this file are added; heuristic. |
| `node scripts/mutation-check.mjs` | 0 | **23 / 23 killed** (M14–M23 are new) |
| `npm ls --all` | 0 | `(empty)`, path sanitized |

POC-05 in this run: A won 20 rounds and B won 30 over 50 forced-overlap rounds. Evidence was checked: no workspace paths and no synthetic credentials or keys.

**Mock configuration** (in `results.json → env.mockDefaults`):
- `etagMode = generation` by default; R02 also runs `content-hash` and `weak`.
- PROPFIND `xmlStyle = d` by default; R02 also runs `D`, default namespace and `z`.
- Adapter: inactivity `timeoutMs` (tests use 250–800 ms); absolute `deadlineMs` = 3 × `timeoutMs` (one test uses 300 / 900 ms); `maxResponseBytes` = 4 MB; PROPFIND parse limit 2 MB.
- Ledger: `maxPerPrincipal` = 1000 by default (tests use 1–3); global bound = `maxPerPrincipal` × number of principals; tombstones = 4 × `maxPerPrincipal` per principal unless set.

**Historical (not re-claimed for this SHA):** the independent re-QA at `2806d9d` observed 54/54 × 5, R01 21/21, 13/13 mutants and 2/4/3/1/3/17/3. Those numbers belong to that SHA only.

## 3. Finding disposition (R02)

| Finding | Required invariant (REMEDIATION-02 §2) | Implementation | Regression proof | Claimed status |
|---|---|---|---|---|
| **P1-R1** | No terminal `not_committed` unless the fence produced a trusted strong ETag ≠ base | Fence returns terminal only when the fence PUT committed with a `STRONG_ETAG_RE` tag ≠ base; otherwise `fence_not_confirmed` (`etag_unchanged` / `no_etag` / `untrusted_etag` / `fence_<outcome>`), and the operation stays Unknown | **content-hash mock**: fence → not confirmed → late commit → verify `committed` terminal, replay `saved`; generation mock race order A (fence → release: terminal holds, late write rejected) and order B (release → fence: `committed`); missing-ETag fence | **FIXED locally.** Still relies on provider atomic strong `If-Match`; this is a hard ACCESS-02 probe. |
| P2-N1 | URI `DAV:`; fail closed | `src/dav-xml.mjs` namespace-aware parser; refuses DOCTYPE/ENTITY/CDATA, unknown entities, unbalanced tags, > 2 MB and absolute-URL hrefs; listing requires the self entry, owned paths and 2xx entries | 4 prefix styles → 2 of 2 records; 11 malformed fixtures → `503 export_incomplete` with no partial bundle; a well-formed empty listing is still accepted | **FIXED** (restricted profile documented) |
| P2-N2 | absolute deadline, bounded buffers, UNKNOWN | `deadlineMs` absolute; `maxResponseBytes`; settle-once; connected → Unknown | trickle PUT → Unknown in < 2.5 s, entry not pending, verify finds the write; trickle GET → 503; oversize body refused | **FIXED** |
| P2-N3 | no unsafe re-dispatch in a declared window | per-principal tombstones → `409 operation_expired` + `priorVerdict`; verify reports `expired` | QA case (429 → evicted → replay): 0 extra PUTs; beyond window or restart → re-dispatch hits 412 (CAS) and newer data is intact | **FIXED within the window; beyond it UNSUPPORTED (declared)** |
| P2-N4 | stable principal, HMAC provenance, `restore-` reserved | principal = hash of the token; write tag = HMAC(principal, op, kind, id, base, dataSha); provenance HMAC verified on read, export and restore; `restore-*` active namespace refused; key ≥ 32 chars | reversed token order → no poisoning (`indeterminate`); forged envelope → `unauthenticated_record`, export incomplete, restore 422; different key fails closed | **FIXED.** Cross-key portability UNSUPPORTED (declared). |
| P2-N5 | per-principal fairness | per-principal quota checked before dispatch (`503 not_saved principal_ledger_full`) | A full → A refused, 0 PUTs; B saves | **FIXED** |
| P2-N6 | serialised fence, Unknown on timeout, clear missing state | `fencing` flag → `fence_in_progress`; fence Unknown → not confirmed; `record_missing` from fence and verify | concurrent fence; held fence beyond timeout; hung fence; deleted record | **FIXED** |
| P2-N7 | unambiguous single tag | profile regex excludes `,` → `if_match_outside_poc_profile` (documented as a restricted subset of RFC 9110) | `"a,b"`, `"a","b"`, `"a", "b"` → 400, 0 upstream | **FIXED (subset)** |
| P2-N8 | weak never trusted or stripped | weak tag → `unsupported_weak_etag`; `saved` requires a trusted strong PUT ETag equal to the read-back | weak mock: create → `committed_unverified`, update → 400, no `If-Match` sent upstream; strong PUT/GET mismatch → `readback_mismatch` | **LOCAL NEGATIVE FIXTURE ONLY.** Nutstore weak/strong ETag behaviour is an ACCESS-02 probe. |

**Mutation honesty:** the first M15 candidate ("unparseable PROPFIND → empty list") **survived**, because the export's independent self-entry check still failed closed. It was replaced by "match elements by the `d:` prefix instead of the `DAV:` URI", which is killed. The run log is not committed; the final 23/23 run is in `evidence/mutation.txt`.

**Test fixes made during R02 (test bugs, not product changes):** two timing assumptions were corrected (the held fence was released before the adapter timeout), and the P1-4 process test now asserts the HTTPS guard message, so a missing env var cannot satisfy it. One **product bug found by a new test** was fixed: the response-size cap previously let a fully buffered body still reach `end`.

## 4. Explicitly unsupported / not claimed

1. All provider semantics: atomic strong `If-Match`, ETag change on identical bytes, strong vs. weak tags, `MKCOL` atomicity, PROPFIND shape/prefix/absolute-URL hrefs, quotas. **BLOCKED_REAL_SERVICE.**
2. Create-only Unknown fence: UNSUPPORTED (stays Unknown).
3. Replay protection beyond the tombstone window, after a restart or across instances: UNSUPPORTED. Conditional writes still prevent overwriting newer data, but a recorded definite `not_saved` can become a save if the record is still at its base.
4. Exactly-once delivery, durable ledger, global idempotency: **not claimed.**
5. Provenance key management, rotation, and cross-key restore: UNSUPPORTED (fails closed).
6. Real TLS: `https:` still fails closed; TLS transport is not implemented.
7. Static analysis: `node --check` only. The secret scan is heuristic and skips `scripts/secret-scan.mjs` and `test/poc02-security.test.mjs`.

## 5. QA instructions

1. Take the exact head from the PR #2 update comment: `git checkout --detach <SHA>`, `git rev-parse HEAD`, and confirm `git status --short` is clean. Check `git merge-base HEAD 1c084e5…` = `1c084e5…` and `git merge-base --is-ancestor 2806d9d HEAD`.
2. Scope: `git diff --name-only 1c084e5f14e4af8018ef5fe99710be7205cfbdf4 HEAD | grep -vE '^(poc/001/|docs/handoffs/POC-001/QA_HANDOFF\.md$)'` should print nothing.
3. In `poc/001`: `node --version`, `npm ls --all`, `node scripts/check.mjs`, each `test/poc0N-*`, `test/r01-*`, `test/r02-*`, the full suite × 5, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `node scripts/mutation-check.mjs`. **Do not** run `npm run evidence` in the checkout.
4. Re-run the earlier probes A1–A6, B1–B6, C, D, E, F, G and N, including your own content-hash `alt-dav` and PROPFIND / streaming / ledger / identity adversarial cases.
5. Report **LOCAL_STAGE PASS/PARTIAL/FAIL**, per-area status, residual P0/P1/P2, the UNSUPPORTED list, and **OVERALL POC-001: BLOCKED (REAL SERVICE NOT RUN)** in PR #2. Do not modify code. STOP for Design.

**EXECUTION STOP — awaiting full independent re-QA at the new exact head and a separate Design disposition. No merge, no rebase, no ACCESS-02, no real data, no credentials.**
