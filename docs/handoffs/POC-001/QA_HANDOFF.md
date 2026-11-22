# POC-001 — Execution → QA Handoff (LOCAL MOCK ONLY)

**From:** Execution Window · 2026-11-23 (Europe/Berlin)
**Authority:** [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md), Option B, which authorizes the local/synthetic phase only.
**Boundary:** every result below was produced against an **in-repo loopback mock WebDAV** with **synthetic data**. **Real Nutstore: `BLOCKED_REAL_SERVICE` / NOT RUN.** Overall POC-001 therefore **cannot PASS** at this stage. Execution does **not** claim QA PASS.

## Provenance

| Field | Value |
|---|---|
| Repository | `zyyu1/literature-management-system` (private) |
| Branch | `exec/POC-001-webdav-feasibility` |
| Base (accepted `main`) | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` |
| Code commit | `f3e7b4702ca65db9db253c7d7c3cd4fa04ee86c0` (poc/001 source, tests, scripts) |
| Evidence commit | `e1bb161` (adds `poc/001/evidence/**` only; generated on a clean tree at the code commit) |
| PR head | the commit adding this file. **Use the exact head SHA stated in the PR description.** |
| Commit identity | `LMS Execution Window <execution-window@users.noreply.github.com>` |
| Runtime | Node `v22.23.5`, npm `10.9.9`, Linux 6.18 x64 |
| Provider kind | `MOCK` (`poc/001/src/mock-webdav.mjs`) |

## Changed paths (vs base)

All paths are inside the allowlist: `poc/001/**` (37 files: `src/` 7, `test/` 9, `scripts/` 4, `evidence/` 14, `README.md`, `package.json`, `package-lock.json`) plus this file. There are no changes to `main`, root files, existing docs, `src/**`, `app/**`, workflows or UI.

```bash
git diff --name-only 1c084e5f14e4af8018ef5fe99710be7205cfbdf4 <PR_HEAD> | grep -vE '^(poc/001/|docs/handoffs/POC-001/QA_HANDOFF\.md$)' || echo "scope OK"
```

## Dependencies

- **Zero third-party packages.** `npm ls --all` lists `(empty)`, and the lockfile holds only the root package. The POC uses Node built-ins only: `http`, `crypto`, `test`, `child_process`, `net`, `fs`.
- **None of the three reviewed candidates was installed** (webdav-client MIT, npm-WebDAV-Server Unlicense, sabre/dav BSD-3). The npm registry was unreachable (`getaddrinfo ENOTFOUND registry.npmjs.org`). `OPEN_SOURCE_REVIEW.md` permits a minimal local stub. Rationale: [`poc/001/README.md`](../../../poc/001/README.md#dependency--reuse-decision).
- `npm audit`: **NOT RUN** (needs network; no dependencies to audit).

## Commands, exit codes and results (Execution run at the code commit)

| Step | Command (cwd `poc/001`) | Exit | Result |
|---|---|---:|---|
| syntax | `node scripts/check.mjs` | 0 | 20 files, 0 failures |
| POC-01 | `node --test test/poc01-crud.test.mjs` | 0 | 2/2 pass |
| POC-02 | `node --test test/poc02-security.test.mjs` | 0 | 4/4 pass |
| POC-03 | `node --test test/poc03-roundtrip.test.mjs` | 0 | 3/3 pass |
| POC-04 | `node --test test/poc04-multiclient.test.mjs` | 0 | 1/1 pass |
| POC-05 | `node --test test/poc05-race.test.mjs` | 0 | 3/3 pass (50 forced-overlap rounds; A won 28, B won 22) |
| POC-06 | `node --test test/poc06-faults.test.mjs` | 0 | 17/17 pass |
| POC-07 | `node --test test/poc07-backup.test.mjs` | 0 | 3/3 pass |
| full | `node --test "test/*.test.mjs"` | 0 | 33/33 pass; also 5 consecutive extra runs, all 33/33 |
| scan | `node scripts/secret-scan.mjs` | 0 | 0 findings (heuristic) |
| mutation | `node scripts/mutation-check.mjs` | 0 | 6/6 injected defects killed |
| deps | `npm ls --all` | 0 | `(empty)` |

Raw output is in `poc/001/evidence/*.txt` and `poc/001/evidence/results.json`. To reproduce everything at once, run `cd poc/001 && npm run evidence`. Note that this rewrites `evidence/`, so compare the results rather than committing them.

## Acceptance matrix — Execution self-assessment (NOT independent QA)

| ID | Local synthetic evidence | Execution status | Real Nutstore |
|---|---|---|---|
| POC-01 CRUD | Adapter create (201) / read (byte-exact sha256) / update (204, new ETag, no ABA on identical bytes) / conditional delete (stale → 412, current → 204, then 404); unconditional writes and deletes refused; missing parent → 409; API create/read/update; API exposes no DELETE (405) | `PASS_LOCAL` | `BLOCKED_REAL_SERVICE` |
| POC-02 API boundary | Bearer auth (no, wrong, Basic and query tokens all → 401); 428 without precondition; 400 without Operation-Id; 415, 413, 422 (smuggled `target`, identity mismatch); traversal/encoded/backslash/uppercase/long IDs, `__proto__`/unknown kinds, absolute-form request lines, `?url=`, Host spoof, foreign Origin all refused with no CORS headers; upstream traffic only to the configured mock and namespace; credentials, Basic header and upstream URL absent from responses, headers, logs, serialized adapter and client source; session token absent from logs; non-loopback upstream/bind and URL-embedded credentials refused (`REAL_SERVICE_BLOCKED`) | `PASS_LOCAL` | `BLOCKED_REAL_SERVICE` |
| POC-03 JSON/Markdown | Five fields with Chinese, emoji, LaTeX, code fences, CRLF, tabs, NFD (no normalization), zero-width, RTL, surrogate pairs, a marker look-alike and >15 kB text; Markdown export parses back byte-identical and is deterministic; tampering detected; stored bytes equal the API-hashed bytes; Zotero identity mapping is unique and validated; duplicate create → 412; duplicate Project association and a 4th status → 422 | `PASS_LOCAL` | `BLOCKED_REAL_SERVICE` |
| POC-04 multi-client | Two client **processes**, each behind its own API **process**, share one storage. B sees A's confirmed revision only after an explicit refresh (no push claimed); a definite failed write (423) never becomes visible | `PASS_LOCAL` | `BLOCKED_REAL_SERVICE` (desktop/tablet/phone) |
| POC-05 concurrent writes | 50 rounds where both stale PUTs are held in flight at storage (barrier) via different API processes: exactly one `saved`, the other 412 with the winning revision and content; storage holds the winner; every upstream write is conditional; create-only race behaves the same; **negative control**: naive GET + unconditional PUT reports both "committed" and silently loses one | `PASS_LOCAL` (logic only) | **`BLOCKED_REAL_SERVICE`** — Nutstore atomic `If-Match` unproven; this is the backend blocker |
| POC-06 faults | 401/403/409/423/429 (Retry-After surfaced) → definite `not_saved`, one attempt, data intact; 412 → conflict; hang/500/503 (not applied) and commit-then-drop/hang/502 (applied) → `unknown`, same op blocked (`verification_required`) and not re-sent; verify gives the correct `committed` / `not_committed`; replay never re-sends; a retry needs a new op id; another writer changed the record → `indeterminate`; identical text is **not** treated as proof; corrupt bytes → `verification_failed`; offline → `not_saved/offline`, reads 503, verify `unavailable` and Unknown preserved; read-path 401/429/500 → 503, not "not found" | `PASS_LOCAL` | `BLOCKED_REAL_SERVICE` |
| POC-07 export/restore | 19 synthetic records exported with sha256 manifest; restored into fresh `restore-*` namespace, byte-identical; source bytes and ETags untouched; repeat into same target → 409; repeat into another fresh target OK; tampered or truncated bundle, active namespace, non-`restore-*`/traversal targets refused before any write; export during outage → `export_incomplete` with no partial bundle; restore write failure → `restore_incomplete`; zero DELETE requests overall | `PASS_LOCAL` | `BLOCKED_REAL_SERVICE` |
| Privacy/credential | Only synthetic data (library `9000001`, keys `S…`); per-run random synthetic credentials, never written to disk; no real URLs, PDFs, Zotero data or notes; evidence contains no synthetic credentials | `PASS_LOCAL` (heuristic scan) | n/a |

## Known limitations and risks

1. **The mock is the reference for the semantics it tests.** Local passes cannot show that Nutstore supports atomic `If-Match`, strong ETags on PUT, PROPFIND shape, lock/quota/429 behaviour, or acceptable latency. DESIGN_APPROVED §3 makes a missing atomic CAS a **STOP for provider acceptance**.
2. **The operation ledger is in memory and per API process.** After a restart, `verify` needs `?kind=&id=&base=`. Multi-instance deployments would need a shared durable ledger. Not production-ready.
3. **ETag dependence.** If a provider omits the ETag on a PUT response, the API returns `committed_unverified` (202), not `saved`. This is correct but would degrade the UX.
4. **The secret scan is heuristic** and skips two files that deliberately contain credential-shaped negative-test strings: `secret-scan.mjs` and `poc02-security.test.mjs`. QA should review those two by eye.
5. **No linter or type-checker**, because the POC has zero dependencies. `node --check` is the only static check.
6. **The race uses a mock barrier** to guarantee overlap. Real-network interleavings were not exercised.
7. The evidence was produced by Execution. QA must regenerate it independently.

## Outstanding approvals (Design)

- **Real Nutstore test-account access:** NOT AUTHORIZED. Execution has stopped here and requests **no** credentials. A separate Design-reviewed, least-privilege, server-side secret procedure is required first.
- Local-stage acceptance, any merge, and the next scope are decided by Design only.

## QA instructions

1. Check out the **exact PR head SHA** from the PR description: `git checkout --detach <SHA>`, then confirm with `git rev-parse HEAD` and a clean `git status --short`.
2. Run the scope check above. Then in `poc/001`: `node --version` (≥ 22.21), `npm ls --all`, `node scripts/check.mjs`, each `node --test test/pocNN-*.test.mjs`, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `node scripts/mutation-check.mjs`.
3. Review the source independently: credential isolation, the allowlist, the outcome classification, ledger/verify logic, restore safety, and the mock's atomicity claims.
4. Report **LOCAL_STAGE PASS/PARTIAL/FAIL** per POC-01..07 and **OVERALL POC-001: BLOCKED (REAL SERVICE NOT RUN)**, with P0/P1/P2 findings, in the PR. Do not modify the code. STOP for Design.

**EXECUTION STOP — awaiting independent QA and Design disposition.**
