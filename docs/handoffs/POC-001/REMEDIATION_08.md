# POC-001 REMEDIATION-08 — G1 Design-to-Execution Instruction

**Authority:** User-approved D007-A30 Option A. Read [A30](../../architecture/D007_A30_R08_LOCAL_READINESS_G1_AUTHORIZATION.md), [A29 matrix](ACCESS02_PRECHECK_MATRIX.md), [R08 independent QA plan](REMEDIATION_08_QA_PLAN.md), [ACCESS-01](ACCESS_POLICY.md). Execution must pin the **actual full A30 main Design SHA** before implementing; never merge main into the POC branch. **LOCAL/SYNTHETIC ONLY.**

## Git preflight and STOP

- Repository `zyyu1/literature-management-system`; PR #2 OPEN/not merged, original branch `exec/POC-001-webdav-feasibility`; immutable original base/merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`.
- Exact starting local/remote/PR HEAD `ace7b1e610529c1f139dc06371d9f531ccf0e28b`; clean worktree, no merge commits/rebase/force-push, start is descendant of original base. Mismatch or unavailable GitHub auth ⇒ STOP, obtain access legitimately, **restart preflight**, never inherit A28's one-time QA-1 exception.
- Original cumulative allowlist `poc/001/**` and `docs/handoffs/POC-001/QA_HANDOFF.md`. Current R08 incremental whitelist below only.

## Exact write allowlist

`poc/001/src/webdav-adapter.mjs`
`poc/001/src/util.mjs`
`poc/001/src/safe-api.mjs`
`poc/001/test/r08-readiness.test.mjs`
`poc/001/test/r08-local-tls-fixtures.mjs` (optional)
`poc/001/scripts/mutation-check.mjs`
`poc/001/evidence/**`
`poc/001/README.md`
`docs/handoffs/POC-001/QA_HANDOFF.md`

Do not touch `src/api-main.mjs`, mock, dav-xml, client, note-codec, all pre-R08 tests, package/dependencies, CI, frozen UI, Design/governance, ACCESS policy or old instructions. Any need to expand: STOP and ask Design.

## Narrow deliverables

1. Local-only `https:` to **synthetic loopback** test server with test-only ephemeral CA and strict peer/hostname/expiry validation. No live upstream host or external DNS/socket; non-loopback denied. Old `http:` loopback regressions preserved; no redirect following or insecure TLS override. No cert private keys or secrets in repository/evidence.
2. SSRF/foreign-host/unsafe-port/encoded path/cross-namespace refusal before application request/Authorization. Preserve exact 114-byte explicit `resourcetype` PROPFIND, retry count, ETag and transport UNKNOWN safety.
3. Q4 fixture (two fake principals; quota 2 each/global 4; 1,000 ms absolute inbound-body deadline; 1,000,000-byte cap), pre-dispatch refusal and reservation release on stalled/aborted body; no late write. No general production values. Q5 regression and manual STOP/quarantine ONLY: no automatic UNKNOWN resolution/retries/evictions.
4. Full synthetic export at N1665 (9998 XML elements) and N1666 (10004), with precise 200/503 expectations, data preservation, requests/time/RSS/body-size evidence, no record GET on invalid list. No parser limit increase or pagination promise.
5. Test-only ACCESS-01 budget arithmetic dry run: ≤100 requests/rolling30min incl cleanup, ≤20 synthetic files, ≤1 MiB each/20 MiB total, ≤2 writers, reserve cleanup; no live operation.
6. New R08 security-specific mutations for TLS bypass, host/path escape, Q4 timeout/late write, Q5 false terminal/retry, partial export. Legacy M1–M51 must all remain meaningful. No dependency/CI change.

## Execute, prove, stop

- Verify Node v22.23.5 benchmark environment; if disposable local cert fixture generation needs a missing CLI, STOP, do not install dependencies or skip security cases. All traffic must be loopback.
- Test POC01–07, R01–R08 independently, `node scripts/check.mjs`, `node --test "test/*.test.mjs"` (5 separate runs if claimed), `node scripts/mutation-check.mjs`, `npm ls --all`, original-base `secret-scan`, temporary cert/key containment and measured denial of outside egress. Record actual counts and exits; historical 153/153 is a baseline, not a future result.
- Commit only strict whitelist files; preserve original base, branch and fast-forward PR #2; report exact 40-character final SHA and all changed paths, source blob hashes, observed regressions, NOT_RUN, 0 real service, budget and QA handoff. **EXECUTION STOP**.
- Coordinate a **separately opened independent QA window** using R08 QA plan on final SHA. QA fresh clone, own TLS proxy/CA/faults/mutants, direct PR QA comment, QA STOP. Execution passes the **original unmodified** full report/URL back to Design. Same-session sub-agent does NOT satisfy G3.
- No new code after QA except a **new Design-approved remediation**; no R08 self G3/G4, no risk closure, no merge, ACCESS-02 or deploy.

**R08 G1 AUTHORIZED_LOCAL_SYNTHETIC; Execution NOT_STARTED; QA NOT_RUN; G4 NOT_REVIEWED. G5/G6/G7 NOT_AUTHORIZED. OVERALL BLOCKED_REAL_SERVICE.**