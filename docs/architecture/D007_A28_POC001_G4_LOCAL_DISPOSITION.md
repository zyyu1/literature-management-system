# D007-A28 — POC-001 R06+R07 exact-SHA G4 LOCAL/SYNTHETIC disposition

**User decision: D007-A28 Option B APPROVED — 2026-11-24 (Europe/Berlin).** Independently accept [G3 QA #7121490151](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7121490151) for local/synthetic R06+R07 at **exact PR #2 HEAD `ace7b1e610529c1f139dc06371d9f531ccf0e28b`**, with an explicit limited procedural disposition of QA-1 and QA-4 below. **G4 ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS_SYNTHETIC ONLY**. This is NOT live Nutstore/Zotero WebDAV verification, a production application acceptance, a merge approval or access authorization. **OVERALL POC-001 = BLOCKED_REAL_SERVICE**.

**Authority/evidence:** [D007-A27](D007_A27_POC001_R07_TEST_ONLY_AUTHORIZATION.md), [A26 R05 partial acceptance](D007_A26_POC001_REMEDIATION06_DISPOSITION.md), [A24 historical local acceptance](D007_A24_POC001_G4_LOCAL_ACCEPTANCE.md), [R06+R07 QA plan](../handoffs/POC-001/REMEDIATION_07_QA_PLAN.md), [R07 Execution #7120921765](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7120921765), [independent G3 QA #7121490151](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7121490151), [risk register](../handoffs/POC-001/POST_G4_RISK_REGISTER.md), [current POC status](../handoffs/POC-001/STATUS.md), [ACCESS POLICY](../handoffs/POC-001/ACCESS_POLICY.md).

## 1. Immutable scope and independently reviewed facts

- Repository `zyyu1/literature-management-system`; PR #2 **OPEN/NOT MERGED** on original branch `exec/POC-001-webdav-feasibility`, original immutable execution base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. Reviewed exact R07 final PR HEAD `ace7b1e610529c1f139dc06371d9f531ccf0e28b`; R06 final/R07 start `5ab47090f1100fbe0c9defd39930fcf715dbab38`, R07 test commit `cf88fc91b21edc30a6edaeb5beea197d87ddb479`, final evidence+handoff commit `ace7b1e610529c1f139dc06371d9f531ccf0e28b`. Merge-base = original base, 0 merge commits, no rebase, main merge, or force push.
- Independent QA was conducted in a **separately user-opened QA session** with a fresh full clone and its own out-of-repository fixtures, WebDAV stand-in and mutants; unlike R06's prior same-Execution-session sub-agent, this meets the A27 independent-session requirement. Same Node/kernel/CPU profile alone is not contrary evidence.
- QA independently confirmed **67 cumulative and 32 R07 incremental changed paths**, both within their respective allowlists; all **eight `poc/001/src/**` blobs identical across R07 start/final; no README, CI or dependency changes.
- QA observed syntax/check 30 files with 0 failures; **153/153 full-suite tests on five independent executions**; separate POC01–07 and R01–R07 suites all pass; **51/51** built-in mutants killed and **16/16 independently QA-created** (four QM1 and twelve sibling return-path mutations) killed for intended request-count assertions; 0 new observed P0/P1/P2 within bounded scope, 0 secret-scan findings, `npm ls --all` empty.
- The QA-owned loopback stand-in observed **29/29 negative scenarios plus valid-207 positive control**, root/notes/progress, correct `503 export_incomplete` without bundle, no GET or mutation on failure, unchanged store, **exactly one** explicit `resourcetype`-only `PROPFIND` per failing path with a **114-byte** body and correct Content-Length/Type/Depth, no allprop/bodyless/Depth-0 retry. Repo mutants are also verified against independent proxy.
- Capacity QA was **parser-level only**: the minimal fixture contains `8+6*N` elements, N=1665 → 9998 accepted, N=1666 → 10004 rejected (`LIMITS.maxElements = 10000`). **Export-level N=1666 NOT_RUN**, real-provider capacity UNSUPPORTED.

## 2. Procedural QA findings — expressly adjudicated, not concealed

| Finding | Observed evidence | G4 disposition |
| --- | --- | --- |
| **QA-1 — first `git ls-remote` exit 128** | Fresh QA session initially lacked GitHub credentials (terminal prompts disabled), **not** wrong SHA, DNS/network failure or test failure. After the user attached repository access, **the same command exited 0**, returned the intended R07 head; QA then fresh-cloned, independently rechecked branch/PR SHA at start/end, and executed tests. The first failure and remediation remain visible in QA comment. | **PREFLIGHT_CREDENTIAL_FAILURE_RECOVERED / ACCEPTED_ONE_TIME_NONMATERIAL_PROCEDURAL_DEVIATION** for this G3 review **only**. The literal initial STOP preflight was not followed immediately; do not retroactively say it succeeded. No evidence of a bypassed SHA gate or tests conducted before verified access. Future sessions must halt on a failed preflight, obtain access and explicitly restart preflight before proceeding; this adjudication is not a blanket waiver. |
| **QA-4 — runtime profile matches Execution** | Node v22.23.5, Linux x64 6.18, 2 vCPU; no proof of physically distinct hardware/image. Separate user-opened QA session, fresh clone, independent probes/mutants and report were recorded. | **G3_INDEPENDENCE_VERIFIED**. A27 requires separate session/actor/workspace/testing, **not a different hardware image**. Cross-hardware portability remains **NOT_RUN**. |
| **QA-2, QA-3** | Repository R07 mutant kill assertions fail first at root; independent QA stand-in also killed retry variants on notes/progress. Repo R07 targets notes kind; QA expanded progress. | **INFO ACCEPTED**, no additional test/remediation authority. |
| **F-2, F-3, F-4** | Prior lock fixture coverage, M48 matching regex, README numbering remain INFO; no newly observed defect. | **INFO REMAINS**, no R08/README/code changes authorized. |

**G3 Design adjudication for exact `ace7b1e610529c1f139dc06371d9f531ccf0e28b`:** **G3 INDEPENDENCE VERIFIED / R06+R07 LOCAL_STAGE PASS**, with the above one-time QA-1 procedural deviation documented; **not** an unconditional claim that every procedural preflight initially passed.

## 3. D007-A28 exact-SHA G4 and risk dispositions

| Risk | D007-A28 disposition | Important limitation |
| --- | --- | --- |
| **P2-R04-1: XML CPU/OOM** | **PRESERVE `CLOSED_LOCAL_SYNTHETIC@811d5c0fdcd740e5f6e6334d99cd2908cfeada8f` as prior A26 exact-SHA adjudication**. No fresh closure campaign on R07; the current R07 local acceptance relies on prior parser proof plus unchanged eight source blobs, without asserting renewed 119-run evidence. | QA did NOT rerun A25 isolated 119-case campaign, resource-probe or other hardware. Do not extrapolate resource/availability proof across hardware or real provider. |
| **P2-R04-2: DAV compatibility/PROPFIND behavior** | **CLOSED_LOCAL_SYNTHETIC@`ace7b1e610529c1f139dc06371d9f531ccf0e28b`**, limited to currently demonstrated synthetic explicit `resourcetype`-only PROPFIND compatibility and fail-closed no fallback/duplicate handling, R06+R07 independent mutations. The specific **local** mutation gate blocking this closure is satisfied. | **PROVIDER_UNVERIFIED / G6_NOT_AUTHORIZED**: no claim that a live Nutstore server honors the property request or implements necessary ETag/CAS. Retain real-PROPFIND profile as future provider test dependency under separate G6. |
| **P2-R05-1: parse-catch QM1 missing mutation adequacy** | **CLOSED_LOCAL_TEST_GAP@`ace7b1e610529c1f139dc06371d9f531ccf0e28b`**. Four QA-owned QM1 retry/duplicate variants killed by repository R06 tests because count/body pins fail, not unrelated errors; regressions pass. | Future test/source changes require new exact-SHA QA. |
| **P2-R06-1: sibling malformed-207 F-1 gap** | **CLOSED_LOCAL_TEST_GAP@`ace7b1e610529c1f139dc06371d9f531ccf0e28b`**. Three post-parse branches FH, non-2xx, duplicate, each QA-owned bodyless/allprop/unawaited/Depth-0 variants killed, whereas bodyless versions survive the 149 pre-R07 tests. Independent negative path coverage root/notes/progress. | Local only, not a universal WebDAV compatibility certificate. |
| **P2-R05-2: per-listing XML elements/capacity** | **CAPACITY_POLICY_PENDING / OPEN**. Correct synthetic disclosure, not a universal library-size limit or production paging proof. | N=1666 full export and real provider size/rate/pagination policy NOT_RUN/UNDECIDED. |

**G4 result: `ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS_SYNTHETIC` at `ace7b1e610529c1f139dc06371d9f531ccf0e28b`**. This is compatible with the narrower historical A24 G4 at `22dd9bd30900d9c7ca205a36c675fd47b2569feb` and A26 P2-R04-1 closure at `811d5c0fdcd740e5f6e6334d99cd2908cfeada8f`; preserve old decisions as history, do not silently transfer all their exact-SHA proof.

## 4. Mandatory unverified capabilities and hard pre-access holds

- **Q1e**: missing unknown individual items in apparently valid listing; no trusted manifest/consistent multi-file snapshot; **globally certified complete export and restore unsupported**.
- **Q4**: bounded in-memory ledger, slow inbound body reservation, fairness/admission under quota saturation; need explicit operator/capacity/liveness policy before G6.
- **Q5**: `indeterminate` Fence applied-but-unconfirmed may indefinitely block quota and siblings; no auto terminal conversion, blind retry or unsafe eviction. Operator/UNKNOWN recovery policy required before G6.
- **P2-R05-2**: 10k XML element per-listing bounds; no production-scale policy/pagination, full N=1666 export not independently run.
- **Provider/TLS**: actual host/certificate/redirect safety, secret isolation, legitimate DAV PROPFIND semantics, atomic cross-process If-Match, strong PUT/GET ETags/CAS, MKCOL, true provider capacities and quotas **NOT_RUN**. No real credentials, files, PDFs or Zotero library accessed.
- **Durability/backup**: ledger cross-instance idempotency, anti-resurrection, complete snapshots, independently recovered backups, global atomicity and RPO/RTO unverified.
- Independent QA did **NOT_RUN** `npm run evidence`, isolated resource-probe/A25 119-case campaign, other hardware/OS, or provider experiments. Mark all as NOT_RUN, not PASS.

## 5. Release and scope firewall

| Gate | D007-A28 state |
| --- | --- |
| G0 Design / G1 R07 | R07 test-only authorized and completed historically; no additional implementation G1 from A28 |
| G2 R07 | Execution STOP, final exact PR/evidence handoff recorded |
| G3 R06+R07 | **PASS_LOCAL / INDEPENDENCE_VERIFIED** with QA-1 recorded exception |
| G4 Design | **ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS_SYNTHETIC@`ace7b1e610529c1f139dc06371d9f531ccf0e28b`** |
| G5 PR #2 merge | **NOT_AUTHORIZED; OPEN/UNMERGED** |
| G6 ACCESS-02 | **BLOCKED/NOT_AUTHORIZED**; earlier ACCESS-01 is policy only |
| G7 deploy | **NOT_AUTHORIZED** |
| Overall POC | **BLOCKED_REAL_SERVICE** |

Preserve original POC branch `exec/POC-001-webdav-feasibility`, immutable base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` and cumulative path allowlist `poc/001/**` plus `docs/handoffs/POC-001/QA_HANDOFF.md`. **No rebase, main merge, force-push, code/UI/CI/old instruction change**. This Design-only governance commit does not change PR head or authorise supplier, real network, CI, creds, provider or release. WP-01 G1 and Module 002 frozen 67 UI decisions stay separately governed.

## 6. Next independent proposal — D007-A29, DESIGN ONLY

Recommend next user decision **D007-A29 PRE-ACCESS-02 CAPACITY + Q4/Q5 LIVENESS + TLS/HOST PREFLIGHT POLICY**: decide explicit safe capacity availability behavior (not universal N), resource envelopes, quota admission and operator handling for indefinitely UNKNOWN/indeterminate fences, host/certificate/redirect/refusal and disposable test-account plan. Evaluate whether remaining blockers require additional isolated local proof **before requesting** a separate future ACCESS-02 grant. **A28 does NOT approve D007-A29, run another remediation, choose storage vendor, authorize any real connection, merge or deploy.**

**D007-A28 FINAL (user-approved Option B): G3 VERIFIED / G4 ACCEPTED_EXACT_SHA LOCAL_SYNTHETIC; P2-R04-2, P2-R05-1 and P2-R06-1 locally closed at exact R07 head; P2-R05-2 pending; Q1e/Q4/Q5/provider unverified; G5/G6/G7 NOT_AUTHORIZED / OVERALL BLOCKED_REAL_SERVICE.**
