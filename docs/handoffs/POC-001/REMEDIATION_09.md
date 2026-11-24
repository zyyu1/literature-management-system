# POC-001 REMEDIATION-09 — Design → Execution Work Order (D007-A32 Option A)

**Status:** Already APPROVED R09 `G1 LOCAL_SYNTHETIC` by user in D007-A32; Execution NOT_STARTED, QA NOT_RUN. This document is the sole current R09 work order; **do not edit A30/R08 or other existing execution instructions**. Pin the future exact `main` commit publishing [A32 G1](../../architecture/D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md), and read [A31 partial disposition](../../architecture/D007_A31_POC001_R08_G4_PARTIAL_DISPOSITION.md) plus [QA #7123738287](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7123738287), [R09 independent QA plan](REMEDIATION_09_QA_PLAN.md) and unchanged [ACCESS-01 policy](ACCESS_POLICY.md). Do not merge `main` into POC branch.

## 1. Exact identity and preflight

- Repository `zyyu1/literature-management-system`, PR #2 OPEN/unmerged, **existing branch** `exec/POC-001-webdav-feasibility`.
- Original immutable base/merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; **new R09 mandatory starting PR/remote/local HEAD** `49ad24e82f5895f4b6e5f30cb84b3294229df012`, not the older `ace7b1e` and not floating `main`.
- Before any edit: remote `git ls-remote`, PR REST SHA, local `git rev-parse HEAD` all equal `49ad24e82f5895f4b6e5f30cb84b3294229df012`; clean worktree, original base ancestor/merge-base, 0 merge commits, no rebase/force push/merge or main cherry-pick. If precheck cannot complete, **PENDING/STOP**, obtain legitimate access and restart FULL preflight; no A28 one-time QA-1 exception.
- Original cumulative path allowance `poc/001/**` plus `docs/handoffs/POC-001/QA_HANDOFF.md` is intact. R09 incremental whitelist is stricter.

## 2. R09 ONLY incremental write paths

`poc/001/src/util.mjs`
`poc/001/src/webdav-adapter.mjs` (OPTIONAL, only necessary minimal method/path admission wiring)
`poc/001/test/r09-regressions.test.mjs`
`poc/001/scripts/mutation-check.mjs`
`poc/001/evidence/**` (new sanitized `R09-*` ONLY; preserve historic files)
`poc/001/README.md`
`docs/handoffs/POC-001/QA_HANDOFF.md`

NO modifications to `src/safe-api.mjs` (Q4b is a TEST GAP), `src/api-main.mjs`, mock, DAV XML, client, note-codec, previous test files or helpers, packages/lock/dependencies, CI, frozen UI, original instruction files or ACCESS_POLICY, GitHub main/source outside the specified whitelist. Mutants affecting immutable `safe-api.mjs` MUST be applied only in disposable out-of-repository test copies by the mutation runner/QA. If more files or a new production algorithm are required, STOP and return to Design.

## 3. Exact minimum deliverables and fail-safe proof

**R09-CLEAN-01 (P2-R08-QA-1):** Make `beginCleanup()` an irreversible per-run synthetic budget phase. At actual adapter dispatch prevent any new ordinary write/`PUT`, `MKCOL`, `GET`, extra `PROPFIND`, etc.; *do not convert them to cleanup requests*. Only individually authorized **conditional per-file DELETE** of known own fake files and **one** scoped final verification PROPFIND may use the reserve. Reject straggler writers **before upstream dispatch**; 0 additional PUT, 0 consumed cleanup slots, no unintended deletion. Do not retroactively classify in-flight/possibly applied operations as unsent or clear UNKNOWN. Preserve the R08 **direct unit-fixture** `admitRequest('cleanup')` calls (before `beginCleanup` following an ordinary cap STOP); this is a legacy arithmetic assertion, **not permission** for adapter network dispatch to bypass phase/method/path checks. If strict validation cannot be achieved without breaking the old tests, STOP and return to Design rather than edit old tests.

**R09-CLEAN-02 (race):** In a disposable two-writer local stand-in, create 20 own fake files; start cleanup **at 75 ordinary requests before the 79 normal STOP**; schedule/attempt 10 ordinary straggler PUTs after phase transition, assert every one refused, storage unchanged, exactly 0 extra PUT and 0 cleanup reserve consumption. Perform 20 allowlisted per-file DELETEs plus one verification PROPFIND within unchanged request budget, assert 0 own fake files, and report actual counts. Also rerun the old 79 ordinary + 21 cleanup = 100 and refuse 101st. If an upstream request actually dispatched/UNKNOWN, do NOT falsely guarantee cleanup; STOP/quarantine for later Design.

**R09-B5-03 (P2-R08-QA-2):** Change `README.md` and mutation driver documentation: B5 is **NOT equivalent**. Add a new deterministic in-repo R09 regression and actual mutation driver case where an adapter ignores a denied write admission; a synthetic PUT must then be observable at the stand-in and mutation **KILLED for the named refused-write/unchanged-storage assertion** (not a setup failure). Cover refusal even when `beginCleanup` was entered early with remaining budget. Preserve existing M1–M74 unchanged and killed; no hidden surviving mutant labelled equivalent.

**R09-Q4B-04 (P2-R08-QA-3):** New R09 test using synthetic raw/chunked inbound HTTP trickle: send a byte/chunk **more often than the inactivity timeout** for longer than the configured 1000ms absolute `bodyDeadlineMs`; assert 408 `body_deadline_exceeded` near routing deadline, no late PUT/late commit, safe release only before dispatch. Add *disposable-copy* Q4b mutation replacing absolute with resetting idle timeout and show new R09 test kills Q4b for that timing assertion. Preserve original `src/safe-api.mjs` byte-for-byte, ordinary default and Q5 UNKNOWN semantics.

**R09-SAFE-05 (regression):** 401/429 hard STOP continues to block cleanup; no blanket cancellation of already dispatched UNKNOWN, forced evictions, new retries/queues, root/recursive delete or alternate origin. Keep ACCESS-01 ceiling `100 requests / rolling 30 min` including cleanup, ≤20 fake files, ≤1MiB/file/20MiB total, ≤2 writers. No change to R08 TLS/SSRF or exact 114-byte resourcetype-only PROPFIND, valid 207 or N1665/1666 capacity bounds, no real DNS/host/credentials. Maintain Q1e and real provider as UNSUPPORTED/NOT_RUN.

## 4. Tests, evidence and Execution STOP

- Node v22.23.5 baseline, zero new dependencies; run individual POC01–07, R01–R09 suites, `node scripts/check.mjs`, five separately launched full suites if claimed, `node scripts/mutation-check.mjs` (M1–M74 preserved + meaningful new B5/Q4b/cleanup mutants), `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `npm ls --all`. Report actual R09/full/mutant counts, elapsed times, command exit codes, exact negative and positive request traces; current R08 191/191×5 and 74/74 are historical, NOT new evidence.
- Save R09-only sanitized evidence, no real credentials, private keys or personal PDF/library content. Commit only R09 whitelist on original branch/PR #2 fast-forward, verify exact complete final 40-char SHA and modified paths/blobs; publish factual Execution PR #2 comment plus updated authorized QA_HANDOFF. **EXECUTION STOP**.
- Execution coordinates a genuinely **separately user-opened independent QA window** to run [R09 QA plan](REMEDIATION_09_QA_PLAN.md), on fresh cloned exact final SHA using QA-owned 2-writer/cleanup/trickle probes and mutants; QA directly posts PR #2 G3 report then QA STOP; Execution passes full unaltered QA result, comment URL, P0/P1/P2/INFO and NOT_RUN to Design. A same-session sub-agent is not G3. QA failure or unavailable session => PENDING/PARTIAL/FAIL and STOP.
- **NO automatic G4 or risk closure**: D007-A33 is future separate Design exact-SHA G4; R08 A31 PARTIAL at `49ad24e82f5895f4b6e5f30cb84b3294229df012` and R07 A28 old G4 remain unchanged. No follow-on code without another Design authorization.

**R09 G1 AUTHORIZED_LOCAL_SYNTHETIC / EXECUTION NOT_STARTED / INDEPENDENT G3 NOT_RUN / G4 NOT_REVIEWED. G5 NOT_AUTHORIZED, G6 ACCESS-02 BLOCKED, G7 NOT_AUTHORIZED, OVERALL BLOCKED_REAL_SERVICE.**