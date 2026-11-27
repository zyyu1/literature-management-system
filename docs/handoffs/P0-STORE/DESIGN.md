# P0-STORE Phase 1 — Nutstore WebDAV probe runner, local only (LOCAL_MOCK_ONLY)

**G1 APPROVED by DEC-33=A (user, Design window, 2026-11-27).** Governing record: [A90](../../architecture/D007_A90_P0_STORE_NUTSTORE_WEBDAV_ROUTE_DESIGN.md) §3 Phase 1 and §9. This slice builds a probe tool and proves it against loopback mocks only. **No real host, account, credential, live request or Phase 3 authority.**

## 1. Base, branch, whitelist
- Exact immutable Base **`663556bc68dc0472f2f392f09ca4bee7c668d2f5`**; new branch `exec/P0STORE-nutstore-probe-r1`; new PR to `main`. No rebase/merge from moving main.
- Whitelist only: `packages/p0store-nutstore-probe/**` and `docs/handoffs/P0-STORE/QA_HANDOFF.md`. Everything else frozen (WP-01..04 packages, fixtures, `tools/**`, docs). Read-only import of the frozen WP-01 egress precondition is allowed; any other edit or hook → STOP.
- Node exactly v22.23.5 x64; built-ins only; no dependencies, `npm install`, lockfile, CI or UI.

## 2. Components
- `src/plan.mjs`: strict loader for a frozen JSON run plan (A90 §4 steps L0–L12; closed schema; per-step method, synthetic target ID, expected oracle, request estimate). Unknown keys, extra steps or budgets above caps → reject.
- `src/gate.mjs`: the **only** path to the network. Enforces: `https:` only; pinned host + port + path prefix from the plan; allowed verbs `PROPFIND` (Depth 0/1 only), `GET`, `HEAD`, `PUT`, `OPTIONS`, `MKCOL` (run directory only), per-file `DELETE`; canonical path (reject `..`, encoded separators/dots, control bytes, double-decoding, absolute escape); no redirects followed; strict TLS (system or plan-pinned CA, never `rejectUnauthorized:false`); rolling 30-min budget ≤100 with **12 pre-reserved cleanup/abort slots**; ≤20 files, ≤1 MiB/file, ≤20 MiB total, ≤2 writers. A refused request produces **zero egress**.
- `src/secret.mjs`: credential read only at runtime from one environment variable named in the plan; never logged, never in traces, URLs or errors; redaction test-proven.
- `src/runner.mjs`: executes steps; L6 race uses **two separate OS processes** (child_process) released by a local barrier; L8 aborts the socket after the body is sent, then resolves by authoritative read.
- `src/oracle.mjs` + `src/verdict.mjs`: per-step PASS/FAIL/UNRESOLVABLE and the A90 §6 verdict (GO / PARTIAL / NO-GO), plus STOP handling (§5): abort → per-file cleanup only for certain identities → quarantine record.
- `src/trace.mjs`: redacted JSONL trace (method, path template + synthetic ID, status, validator hash prefix, body SHA-256, timing, budget counters).
- **Live mode exists but is inert in Phase 1**: it requires `--live`, a plan whose host is not loopback, an `accessApprovalId` field and the credential variable. Phase 1 tests must prove that with any of these missing the tool refuses before any socket, and that tests never set them. No real host literal appears in code or committed plans.

## 3. Mock server (`support/mock-webdav.mjs`, loopback HTTPS only)
Test-only CA/cert generated at test time with the host `openssl` CLI into a temp dir, or committed under `test/fixtures/` clearly marked TEST-ONLY (never trusted outside tests). Personalities (selected per test, no runtime flag in `src/`):
`strong` (correct strong ETag, If-Match/If-None-Match, 412), `weak-etag` (`W/` validators only), `lost-update` (ignores If-Match), `create-overwrite` (ignores If-None-Match), `stale-read` (read-after-write delayed), `late-ack` (commits then drops the connection), `unresolvable-ack` (drops connection and hides outcome), `throttle` (429), `server-error` (5xx), `redirect` (3xx to foreign host), `bad-cert` (wrong CA/CN/expired).

## 4. Required tests (named; actual counts reported)
| ID | Coverage |
| --- | --- |
| P1-01 | Plan loader: valid frozen plan; unknown key/extra step/over-cap budget/forbidden verb rejected |
| P1-02 | Gate: host/port/prefix pinning, verb allowlist, canonical-path negatives, zero egress on refusal (counted by mock) |
| P1-03 | TLS: wrong CA, wrong CN, expired, redirect to foreign host → STOP before credential is sent |
| P1-04 | Budget: rolling window, reserved cleanup slots, refuse before exceeding; file/size/writer caps |
| P1-05 | Secret: never in trace/log/error/URL; redaction of Authorization; missing secret → refuse |
| P1-06 | `strong` → full run L0–L12 verdict **GO**; budget ≤ 88 + cleanup; namespace empty after cleanup |
| P1-07 | `lost-update` → L5/L6 detect lost update → **NO-GO** + STOP; `create-overwrite` → L2 **NO-GO** |
| P1-08 | `weak-etag` and `stale-read` → **PARTIAL** with the specific reason |
| P1-09 | `late-ack` → L8 resolved 3/3; `unresolvable-ack` → `UNRESOLVABLE` → PARTIAL; never blind retry |
| P1-10 | `throttle`/`server-error`/unexpected 401 → immediate STOP, no retry, cleanup only for certain identities |
| P1-11 | Race is cross-process (two PIDs recorded) and barrier-synchronized; 5 rounds; exactly-one-winner oracle |
| P1-12 | Live-mode inertness: missing `--live`/approval id/secret/non-loopback host → refusal before socket; tests never enable live mode |
| P1-13 | Strict upstream regression: WP-01 67, WP-02 44 (nested 67), WP-03 103, WP-04 91 with strict TAP; pinned protected inventory (all WP-01..04 package blobs, both fixtures, `tools/offline`) against Base; unrelated docs tolerated |

Mutation driver (scratch outside repo, after the egress guard, ≥ 12 named mutants killed by intended assertions): skip host pin; follow redirect; disable TLS verification; allow recursive/root DELETE; skip budget reserve; log secret; treat 412 as success; treat missing 412 as success (lost-update undetected); blind retry on late ACK; treat UNRESOLVABLE as GO; single-process race; verdict GO despite one lost round; cleanup of uncertain identity.

Lessons binding (A86/A88): no waiver flag; strict TAP; pinned inventory, no repo walk; scope audit script outside `node --test`; egress guard before any socket/child; itemized reports; **audit negatives must be count-neutral**.

## 5. Deliverables
README (purpose, Phase-1-only status, how Phase 3 would be separately authorized), `package.json` (private, module, engines 22.23.5, empty deps, `"test": "node --test"`), `src/`, `support/`, `test/`, `scripts/mutation-check.mjs`, `scripts/verify-candidate-scope.mjs`, a frozen example plan with a **loopback placeholder host only**, and `docs/handoffs/P0-STORE/QA_HANDOFF.md`.
