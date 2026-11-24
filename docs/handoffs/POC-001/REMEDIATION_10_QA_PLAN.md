# POC-001 REMEDIATION-10 — Independent G3 QA Plan (D007-A39; NOT_RUN)

**PLAN ONLY; all R10 tests currently NOT_RUN.** User-approved **D007-A39 G1** for exactly `P2-R09-QA-1`. Binding [R10 G1](../../architecture/D007_A39_POC001_REMEDIATION_10_G1_AUTHORIZATION.md), [R10 work order](REMEDIATION_10.md), [R09 D007-A33 PARTIAL](../../architecture/D007_A33_R09_G4_PARTIAL_DISPOSITION.md), [QA R09 #7127423472](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7127423472), [A32 predecessor QA plan](REMEDIATION_09_QA_PLAN.md), unchanged [ACCESS_POLICY](ACCESS_POLICY.md). The prior R09 QA is **not** reusable G3 for any new R10 SHA. INFO-1 and C9 stay INFO, not a remediation authorization. No current QA result or risk closure is asserted.

## 1. Exact authority, independence and preflight

- PR **#2**, branch `exec/POC-001-webdav-feasibility`, immutable original base/merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, **R10 start `bcc47380deb7c6e48964ca5ca77303a213fade28`**, Execution final SHA **unknown until execution**. Design authority is the full 40-character main SHA containing A39 and both R10 docs; QA must read pinned authority without merging main.
- Management arranges a **separately user-opened QA window**, not the Execution session/subagent; QA uses fresh complete clone in an empty workspace, `git ls-remote` succeeds on **first attempt** and equals the **new final R10 PR HEAD**, then detached clean checkout and PR REST confirm identical exact SHA. Prior A28 once-only exception cannot be reused. Recheck PR head after probes.
- Independently check no merge/rebase/force, R10 start parent ancestry and original unchanged merge-base, **all R10 incremental paths** within the exact `A39` whitelist. In particular `poc/001/src/webdav-adapter.mjs` and `safe-api.mjs`, all previous tests, scripts (except the mutation runner), package/CI/Ui/frozen governance and original R09 work orders **unchanged vs R10 start**. No user-provided real data, PDF, credentials or real DNS/TLS/WebDAV external request.
- Build **QA-owned** 2-writer local stand-in, synthetic own-file map, clock/request-budget and independent request recorder; not Execution's mock or reported counts alone. QA and Management must never edit PR code or extend G1. If preflight fails => `G3_INDEPENDENCE_PENDING / STOP`, post truthful failure; no self-issued waiver.

## 2. R10 core independent adversarial probes

| Case | Independent input/control | Required observed and reported result |
| --- | --- | --- |
| **R10-CLEAN-01 early** | 20 own fake files, 75 ordinary requests, cleanup entered; own-parent PROPFIND **before any DELETE** | Refused **before dispatch**; 0 request increase, 0 cleanup reserve increase, `verified=false`; STOP unchanged; 20 own DELETE opportunities preserved |
| **R10-CLEAN-02 midway** | After **1/20 and 19/20** admitted conditional own-file DELETEs, send own-parent PROPFIND | Both refused without consuming budget/sole verification token; remaining DELETEs still accepted; no false exhausted phase |
| **R10-CLEAN-03 final** | After all 20 **attempts accounted**, send exact scoped PROPFIND once | One accepted, 114-byte resourcetype-only body / Depth 1, no repeat verification, cap respected; **75 + 20 + 1 = 96** server requests; 0 fake residual only in all-success fixture |
| **R10-CLEAN-04 legacy** | At 79 ordinary requests, try 20 DELETE attempts + one final PROPFIND, then 101st | 79+21=100 permitted, 101st denied; 100/rolling30min and 20 files/size/writers ceilings unchanged |
| **R10-CLEAN-05 two-writer stragglers** | 10 queued straggler PUTs at cleanup, plus invalid GET/MKCOL/foreign/recursive/unconditional DELETE/PROPFIND | 0 extra upstream, 0 reserve borrowing; own-file DELETE only conditional and once |
| **R10-CLEAN-06 safety residual** | One known own-file DELETE wrong If-Match 412; one in-flight/lost-ACK UNKNOWN; 401 or 429 during cleanup | No fabricated success/erasure, no unauthorized retry, correct remaining files and STOP/UNKNOWN; verification only when permitted and safe, otherwise report unsupported; residual quarantine |
| **R10-CLEAN-07 helper INFO isolation** | Direct `admitRequest('cleanup')` misuse after `beginCleanup()` and inherited C9 bypass mutant | **INFO-1/C9 unchanged, not falsely fixed nor promoted**; adapter never accepts caller label, report observable helper/budget behavior without expanding work; no waived regression |
| **R10-MUT-01 meaningful kill** | QA-owned disposable mutation omits early-verification guard or consumes `verified` before DELETE set complete | New **repository `R10-CLEAN-01/02` named assertion** kills mutant for wrong dispatch/budget/token outcome, not setup error, generic timeout or unrelated test |
| **R10-REG-01 heritage** | R09 tests, B5a/B5b and Q4b, 401/429 STOP, 114-byte PROPFIND, N1665/1666, TLS/SSRF and historic mutation suite | No regression, no edited earlier test; status at exact R10 SHA only, no real provider claim |

**Do not equate "DELETE attempted" with "DELETE committed":** a 412 consumes existing one-attempt slot and remains residual; an already-dispatched UNKNOWN remains uncertain and should not be forced to success or retried. Distinguish request **admission** from **upstream outcome**. If an in-flight delete can still change after verification, report `UNSUPPORTED/PARTIAL` rather than assume a safely completed final inventory; an unauthorized adapter change is prohibited. **Failure of an independent early/mid PROPFIND scenario ⇒ P2 / LOCAL_G4_BLOCKER**, even if old 202 tests remain green.

## 3. Independent regressions, mutants and evidence

From `poc/001` run `node scripts/check.mjs`, each POC01–07/R01–R10 separately, `node --test "test/*.test.mjs"` **five genuinely separate processes** if claimed, `node scripts/mutation-check.mjs` with **M1–M82 prior mutant definitions unchanged + at least one new meaningful R10 mutant**, `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `npm ls --all`, syntax of changed JS, and exact original-base cumulative path and R10 incremental diff. QA owns at least one disposable outside-repo early-verification mutant (and R09 B5/Q4b controls where practicable); report actual kill/survivor/wrong-reason/not-run totals and **which named assertion killed each mutant**.

Observe external-socket trap and count **actual** HTTP/PUT/DELETE/PROPFIND at local loopback mock only; no real credentials, shared data or remote provider. Record Node/OS, independent session/clone, SHA, source blobs, fixture digest, request accounting 75/79/96/100, early/mid requests, unknown/401/429, 412 residual and STOP, outputs/exits and exact negative reasons. Historical R09 202/202×5 and 82/82 are **comparison**, not direct evidence of a new R10 result. Mark P0/P1/P2/INFO and NOT_RUN/UNSUPPORTED explicitly, no undocumented waiver.

## 4. Direct PR QA report and gates

QA directly posts the **formal G3 QA_REPORT comment to PR #2** after new final SHA is frozen and no drift. Report:
- `R10_LOCAL_STAGE=PASS / PARTIAL / FAIL`, `G3_INDEPENDENCE=VERIFIED / PENDING`, `OVERALL_POC001=BLOCKED_REAL_SERVICE`.
- Exact 40-char SHA, original base, R10 starting SHA, increment files/blobs, R10-CLEAN-01..07/MUT-01/REG-01 observed, QA-owned mutation and independent exits, residual/UNKNOWN/STOP evidence, full NOT_RUN/UNSUPPORTED and P0/P1/P2/INFO.
- Only when all authorized scenarios pass, recommendation `PASS_LOCAL_CANDIDATE_FOR_FUTURE_R10_G4`, **not G4 acceptance or provider-certified cleanup**.
- Execution and Management relay the full **unaltered** original QA comment URL/ID and complete results to Design, then each STOP. No self-issued G4 and no automatic closure of P2-R09-QA-1 or P2-R08-QA-1.

**Gate firewall:** R10 G1 `AUTHORIZED_LOCAL_SYNTHETIC_SINGLE_P2`, G2 NOT_STARTED, G3 NOT_RUN, G4 NOT_REVIEWED; G5 MERGE NOT_AUTHORIZED; G6 ACCESS-02 BLOCKED; G7 DEPLOY NOT_AUTHORIZED; `OVERALL_POC001=BLOCKED_REAL_SERVICE`. INFO-1 and C9 unchanged. Q1e general completeness and real provider/backup remain UNSUPPORTED; separate L3 PR #4 unaffected.