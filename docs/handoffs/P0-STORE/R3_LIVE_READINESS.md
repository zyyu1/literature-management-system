# P0-STORE R3 — Phase 3 live-readiness slice (offline-tested; NO live request)

**G1 APPROVED by DEC-39=A (user, Design window, 2026-11-27).** Governing: [A96](../../architecture/D007_A96_P0STORE_R3_LIVE_READINESS_G1.md), A95 §4, A90 §3–§6/§10, [PHASE2_USER_PREPARATION](PHASE2_USER_PREPARATION.md). This slice makes a single future live run *possible* under explicit run-time approval. It authorizes **no** live request: every test stays offline/loopback; nobody sets the real credential; no real host is contacted. The live run itself (ACCESS-02/G6) needs a later separate user approval naming R3's exact SHA.

## 1. Branch and allowed changes
- Same branch `exec/P0STORE-nutstore-probe-r1` (PR #9), new single-parent commit(s) on top of exact `b6fec8e3b0ec217b142b428080454588e6866744`; Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`; no rebase/merge/force.
- May change: `src/runner.mjs` (live authorization and run-time checks only), `src/plan.mjs` (accept the pinned live host only for `mode: "live"`), new `plans/live-nutstore-plan.json`, `test/p1-01-plan-loader.test.mjs`, `test/p1-12-live-inert.test.mjs` (rename/rewrite as live gating), new `test/p1-15-live-gating.test.mjs`, `scripts/mutation-check.mjs`, `scripts/verify-candidate-scope.mjs` (approved-path list), `README.md`, `docs/handoffs/P0-STORE/QA_HANDOFF.md`. If another test file's expectations must change, list it in the G2 report and STOP for Design confirmation before committing it.
- **Byte-identical to `b6fec8e`:** `src/gate.mjs`, `src/secret.mjs`, `src/trace.mjs`, `src/oracle.mjs`, `src/verdict.mjs`, `support/`, `plans/example-plan.json`.

## 2. Live authorization (all required, checked before any secret read, gate, socket or child)
1. CLI `--live`.
2. Plan `mode: "live"`, `protocol: "https:"`, `host` **exactly** `dav.jianguoyun.com`, `port` 443, `probeParent` `/dav/LMS-P0STORE/`, `pathPrefix` = `/dav/LMS-P0STORE/<runId>/`; `pinnedCaFile: null` (system trust store, strict TLS, no redirects — unchanged gate).
3. CLI `--approval <id>` where id matches `^P0STORE-ACCESS-02-\d{8}-[A-Za-z0-9]{4,16}$`; the committed live plan has `accessApprovalId: null`, so a committed file can never self-authorize; the CLI id is copied into the trace header (not secret).
4. `runId` generated at run time from 16 random bytes (hex), never reused; refuse if the plan supplies one.
5. Credential env var `P0STORE_WEBDAV_PASSWORD` present and non-empty (value never read before checks 1–4 pass).
6. `process.version === 'v22.23.5'` and `process.arch === 'x64'`; otherwise refuse `NODE_RUNTIME_MISMATCH`.
7. Each failure has its own reason code and produces zero transport calls; the constant `PHASE1_LIVE_ENABLED` is removed or replaced by these checks.
- The only real-host literal allowed anywhere is `dav.jianguoyun.com` in `plans/live-nutstore-plan.json` and one pinned-host constant in `src/plan.mjs`/`src/runner.mjs`; the no-real-host scan in tests must allow exactly these and reject any other.
- Before the first request the runner prints a redacted pre-flight summary (host, port, prefix, run id, approval id, budget, file caps, Node version) and exits non-zero on any mismatch.

## 3. Tests (all offline)
- P1-12/P1-15 live gating matrix: each of the 7 conditions missing or wrong → its reason, zero transport calls, secret not read; wrong host (`dav.jianguoyun.com.evil`, `jianguoyun.com`, IP literal, uppercase variant if not canonicalized), wrong port, prefix outside `/dav/LMS-P0STORE/`, committed approval id non-null, malformed approval id, supplied runId, Node mismatch (stubbed).
- With all conditions satisfied and an injected **counting/stub transport** (no socket), the first planned request targets exactly `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runId>/…` with L0 semantics, and the canary credential never appears in trace/log/error.
- All Phase 1 and R2 tests unchanged in meaning; P1-13 upstream 67/44/103/91 and protected inventory unchanged.
- Mutants (≥ 5 new, named): accept missing approval; accept mismatched/malformed approval; accept a different host; accept prefix outside `/dav/LMS-P0STORE/`; skip Node runtime check; read secret before authorization. All earlier M01–M16 still killed.

## 4. Evidence and delivery
Same offline environment (Node v22.23.5 x64 by full path, non-elevated, A59 interval, guard+probe). Itemized G2 report on PR #9; Execution bus next seq; STOP. No live run, no credential set by anyone.

## 5. Targeted independent G3 (after Design G2)
At the new exact head: syntax; full suite; QA-strict upstream; audit positive + count-neutral negative; QA-written live-gating matrix (each condition, wrong-host variants) with QA-instrumented zero transport calls and secret-not-read proof; stub-transport target-URL proof; canary scan; byte proof of the frozen files vs `b6fec8e`; committed mutants + ≥ 3 QA mutants on the gating rules.
