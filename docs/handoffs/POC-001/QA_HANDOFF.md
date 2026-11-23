# POC-001 — Execution → QA Handoff · REMEDIATION-01 (LOCAL MOCK ONLY)

**From:** Execution Window · 2026-11-23 (Europe/Berlin)
**Authority:** [REMEDIATION_01.md @ `f7e89c4`](https://github.com/zyyu1/literature-management-system/blob/f7e89c4d438fc30b54546ec0f27823604df7aaa2/docs/handoffs/POC-001/REMEDIATION_01.md) within the original [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md) (POC-001-SCOPE-01 Option B).
**Boundary:** every result below comes from the **in-repo loopback mock WebDAV** with **synthetic data**. **Real Nutstore: `BLOCKED_REAL_SERVICE` / NOT RUN.** **OVERALL POC-001 cannot PASS.** Execution does **not** claim QA PASS.
**Previous handoff:** the first version, for head `65e14af`, is preserved in Git history: [QA_HANDOFF.md @ 65e14af](https://github.com/zyyu1/literature-management-system/blob/65e14afc81e6de37ba5fac90c2937a27876c5614/docs/handoffs/POC-001/QA_HANDOFF.md). The independent QA report on it is [PR #2 comment 7088088675](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675).

## 1. Provenance and no-rebase proof

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (unchanged) |
| Authorized base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. `git merge-base HEAD 1c084e5` returns `1c084e5` |
| History | fast-forward from previously reviewed head `65e14af` (`git merge-base --is-ancestor 65e14af HEAD` exits 0); **no rebase, no force-push** |
| Remediation code commits | `726da2388d34295496925c401dd8c1bc153a4f06` (fixes + tests) → `bf6d65eef634a307697234a527e5e48130232df7` (evidence runner records git state before regenerating) |
| Evidence commit | `7de17e1cd6e24a82f916cddd03764b548feb5c99`, generated on a clean tree at `bf6d65e` (`results.json → gitDirtyPaths: (clean)`) |
| **PR head** | the commit adding this file. **Use the exact head SHA in the PR #2 update comment.** |
| `main` observed at handoff | `8463f795749b99e3bfa5088ab41b2ce126203ed1`. `git merge-tree --write-tree origin/main HEAD` reported no conflict at that moment. This is not a claim about future `main`. |
| Runtime | Node v22.23.5, npm 10.9.9, Linux x64. Dependencies: none (`npm ls --all` → empty) |
| Commit identity | `LMS Execution Window <execution-window@users.noreply.github.com>` |

**Scope:** `git diff --name-only 1c084e5…HEAD`. Every path is under `poc/001/**`, plus this file. No `main` change, root file, workflow, other doc, `src/**` or `app/**`.

## 2. Commands and exit codes (Execution run at `bf6d65e`)

All from `cd poc/001`; raw output is in `evidence/*.txt` and `evidence/results.json`.

| Step | Command | Exit | Result |
|---|---|---:|---|
| syntax | `node scripts/check.mjs` | 0 | 21 files, 0 failures |
| POC-01…07 | `node --test test/poc0N-*.test.mjs` | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 pass |
| REMEDIATION-01 | `node --test test/r01-regressions.test.mjs` | 0 | 21 / 21 pass |
| full suite ×5 | `node --test "test/*.test.mjs"` (five **real** runs, each logged separately) | 0 ×5 | 54 / 54 each |
| secret scan | `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings (heuristic) |
| mutation | `node scripts/mutation-check.mjs` | 0 | 13 / 13 killed (M1–M6 original, M7–M13 one per remediation) |
| deps | `npm ls --all` | 0 | empty (path sanitized as `<poc/001>`) |

POC-05: in this run, A won 26 rounds and B won 24 over 50 forced-overlap rounds.

## 3. Finding disposition (before → after)

| Finding | Before (QA @ 65e14af) | Fix | Evidence | Status claimed |
|---|---|---|---|---|
| **P1-1** late commit after timeout | verify returned a terminal `not_committed` that a late commit then contradicted | Verify only observes: `not_yet_observed` is **non-terminal**. A terminal `not_committed` comes only from `POST /operations/:id/fence`, which rewrites the current bytes with `If-Match: base`, so the stale in-flight request then fails CAS. | `r01`: late release → `committed` (terminal), replay `saved`, no extra PUT; fence then release → storage rejects the late request, verdict stays `not_committed`; POC-06 ×3 not-applied cases → non-terminal, then fence | **FIXED locally.** Fence correctness depends on provider atomic CAS (unproven). **Create-only Unknown fence: UNSUPPORTED**: returns 422 and stays Unknown until observed. |
| **P1-2** same-op TOCTOU | 2 upstream PUTs for one Operation-Id | Synchronous reservation before the first `await`; target + payload fingerprint; `try/catch` (sent → Unknown, not sent → released) | `r01`: held upstream + duplicate → 409 `operation_in_progress`, 1 PUT; slow-body overlap → 409; different payload or target → 422; exceptions before and after send | **FIXED within one API instance.** Cross-instance exactly-once is **NOT claimed** (see §4). |
| **P1-3** If-Match pass-through | lists, weak and `*` lists forwarded | Exactly one strong ETag (`"…"`, %x21/%x23-7E, ≤128); `If-None-Match` only `*`; both → 400 | `r01`: 10 malformed variants + duplicate header lines → 400, **0 upstream PUTs**; stale valid tag → 412 | **FIXED** |
| **P1-4** https sent as http | Basic credentials in cleartext | `https:` → `HTTPS_TRANSPORT_NOT_IMPLEMENTED` before any network; `api-main` refuses to start | `r01`: local listener sees **0 connections and 0 Authorization headers** | **FIXED (fail closed).** Real TLS transport is **not** implemented or authorized. |
| P2-5 prototype kinds | `constructor` reached upstream | `Map`-based `isKind` on every path | `r01`: 5 prototype names across records, verify and restore → refused, 0 upstream | FIXED |
| P2-6 restore envelope | arbitrary self-hashed bytes restorable | strict `decodeEnvelope(expected kind/id)` + inner data digest + validator; duplicate records refused | `r01`: forged, wrong-id, inner-tamper and duplicate bundles → 422, 0 PUTs | FIXED. A hash does not prove an archive's **authenticity** (not claimed). |
| P2-7 silent export omission | `ok` with a short count | unrecognized file or collection, or invalid record → `503 export_incomplete` | `r01`: stray file, stray collection, invalid record | FIXED |
| P2-8 ledger scope/bounds/errors | global, unbounded, stuck pending | principal-scoped keys **and** principal-bound write tags; bounded, fail-closed (`503 operation_ledger_full`, Unknown never evicted); exception handling | `r01`: another token cannot verify, fence or spoof; full ledger; exception cases | FIXED for one in-memory instance (see §4) |
| P2-9 restore freshness race | PROPFIND-then-MKCOL | in-process lock + storage-level `MKCOL` acquisition | `r01`: same-process race and cross-instance race (MKCOL barrier) → exactly one `restored` | FIXED locally. Provider `MKCOL` atomicity is unproven. |
| P2-10 test self-proof | no late-apply, restart, committed_unverified or corrupt-read tests | mock `hold` / `strip-etag` / `corrupt-read`; envelope digest on every read | `r01`: committed_unverified 202; verify after restart (non-terminal, no fence); corrupt read → 502 | FIXED (tests added) |
| P2-11 loose validators | extra fields, coerced ids | own-field allowlists, plain-object bodies, type check before regex | `r01`: 8 negative bodies incl. `__proto__` and nested arrays → 422 | FIXED |
| P2-12 transport classification | `not_sent` decided by error code | `not_sent` **only** if the socket never connected; everything after connect → Unknown; 3xx → Unknown (not followed) | `r01`: closed port → not_sent; accept-then-reset and silent → unknown; redirect not followed; truncated 2xx not returned as data | FIXED |

## 4. Explicitly unresolved / unsupported / not claimed

1. **Provider semantics (BLOCKED_REAL_SERVICE):** these remain unproven: atomic `If-Match` on Nutstore, strong ETag on PUT, a new ETag for identical bytes, atomic `MKCOL`, real error, quota and lock behaviour. Fence, race and restore guarantees all depend on them.
2. **Create-only Unknown resolution:** UNSUPPORTED. A create stays Unknown until our write tag is observed. A placeholder-writing fence was deliberately not implemented.
3. **Durability and multi-instance:** the ledger is **per-process memory**. A restart loses it: verify then needs `?kind=&id=&base=`, is never terminal, and cannot fence. Two API processes can each forward the same Operation-Id once. **No exactly-once, no durable replay, no global idempotency is claimed.**
4. **Fence side effect:** a fence changes the record ETag without changing content, so other clients' next write with the old revision gets 412.
5. **Static checks:** only `node --check`; no linter or type-checker (zero-dependency POC). The secret scan is heuristic and skips `scripts/secret-scan.mjs` and `test/poc02-security.test.mjs`, which deliberately contain credential-shaped negative strings. QA should review those two by eye.
6. **ACCESS-02 prerequisites are not started:** TLS transport, request budget and circuit breaker, per-run remote namespace and per-file cleanup, redacted audit log, provider probe plan.

## 5. Corrected claims (per REMEDIATION-01 §3)

- The original evidence (`e1bb161`) committed **one** full-suite run. The earlier "+5 repeat runs" was an uncommitted Execution observation; QA independently ran five. This handoff's five runs are **committed** (`evidence/full-suite-run1..5.txt`).
- The earlier claims "replay never re-sends" and "verify verdicts correct" held only under the old mock fault model, and QA probes A and B refuted them. Current claims are limited to the scenarios in §3.
- `evidence/deps-tree.txt` and all evidence are path-sanitized (`<poc/001>`), and the evidence was checked for synthetic credentials and workspace paths.
- The secret scan default base is pinned to `1c084e5`, not `origin/main`.

## 6. QA instructions

1. Take the exact PR head SHA from the PR #2 update comment: `git checkout --detach <SHA>`, then check `git rev-parse HEAD` and that `git status --short` is clean. Verify there was no rebase: `git merge-base HEAD 1c084e5…` = `1c084e5…` and `git merge-base --is-ancestor 65e14af HEAD`.
2. Scope: `git diff --name-only 1c084e5f14e4af8018ef5fe99710be7205cfbdf4 HEAD | grep -vE '^(poc/001/|docs/handoffs/POC-001/QA_HANDOFF\.md$)'` should print nothing.
3. In `poc/001`, run: `node --version`, `npm ls --all`, `node scripts/check.mjs`, each `test/poc0N-*.test.mjs`, `test/r01-regressions.test.mjs`, the full suite ×5, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` and `node scripts/mutation-check.mjs`. Do **not** run `npm run evidence` inside the checkout, because it rewrites committed files.
4. Re-run QA's own **probes A–G** against the new SHA, plus your own new probes, especially: fence racing a late release, verify/fence across two API instances, and ledger behaviour under restart.
5. Report **LOCAL_STAGE PASS/PARTIAL/FAIL**, per-area PASS_LOCAL/PARTIAL/BLOCKED, residual P0/P1/P2, and **OVERALL POC-001: BLOCKED (REAL SERVICE NOT RUN)** in PR #2. Do not modify code. STOP for Design.

**EXECUTION STOP — awaiting independent re-QA at the new exact head and a separate Design disposition. No merge, no rebase, no live Nutstore, no credentials requested.**
