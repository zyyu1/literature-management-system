# POC-001 REMEDIATION-09 — Independent G3 QA Plan (D007-A32; NOT_RUN)

**Status:** QA plan only, no test result; [A32 R09 exact G1](../../architecture/D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md), [R09 Execution work order](REMEDIATION_09.md), [A31 R08 partial / three P2](../../architecture/D007_A31_POC001_R08_G4_PARTIAL_DISPOSITION.md), [independent R08 QA #7123738287](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7123738287). **R09 LOCAL/SYNTHETIC ONLY, G3 NOT_RUN, G4 NOT_REVIEWED.** QA is called/collected by Execution; Design does not contact QA directly.

## 1. G3 independence and exact SHA preflight

- Independently **user-opened QA window/session** distinct from Execution; fresh full clone, clean detached checkout at the **new final R09 PR #2 HEAD**, own synthetic stand-in, two-writer scheduling, fake file inventory, raw-body trickle, independent temporary mutants/faults outside repo. Cannot rely on Execution-run tests or same-session sub-agent. QA may publish its direct PR #2 QA comment; no code commit/merge or live host.
- First network precheck `git ls-remote` must return exit 0 and the expected new final SHA. On failed preflight, post truthful `G3_INDEPENDENCE_PENDING` and STOP; restore valid access and **restart all preflight** (no A28 exception).
- Assert remote branch, PR API and local HEAD same; PR #2 OPEN/unmerged; original POC base/merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, R09 required start `49ad24e82f5895f4b6e5f30cb84b3294229df012` ancestor; 0 merge commits, no rebase/force push. Confirm all cumulative paths within `poc/001/**` + `docs/handoffs/POC-001/QA_HANDOFF.md`, R09 incremental only `src/util.mjs`, optional `src/webdav-adapter.mjs`, `test/r09-regressions.test.mjs`, `scripts/mutation-check.mjs`, new `evidence/R09-*`, `README.md`, `QA_HANDOFF.md`. All other src blobs, R08 and previous tests/evidence, scripts/packages, CI/UI and Design docs identical to `49ad24e82f5895f4b6e5f30cb84b3294229df012`. A diff mismatch means immediate FAIL/STOP.
- History and source: compare both optional modified source blob SHAs with start, prove `src/safe-api.mjs` **unchanged**; verify prior 191 test/M1–M74 source definitions preserved.

## 2. Independently owned test cases

| Case | Required observed PASS evidence |
| --- | --- |
| **R09-CLEAN-01** | Switch to cleanup **at 75 ordinary requests** (prior to 79 reserve STOP), with 20 known fake files and 2 writers. Ten post-transition ordinary PUT attempts return `not_sent` with **0 additional upstream PUT, 0 cleanup budget consumption**; also reject MKCOL, GET, extra/non-final PROPFIND and foreign/recursive DELETE, even if caller labels them cleanup. Track server request log and resource snapshots. |
| **R09-CLEAN-02** | After early stop, exactly the approved 20 conditional per-file DELETEs plus one final scoped verification PROPFIND are possible, under hard 100 and unchanged 21-slot reserve; prove own fake namespace empty. Also preserve historical 79 ordinary + 21 cleanup = 100, 101st refused, and verify post-transition category spoofing cannot borrow reserve. Distinguish rejected pre-dispatch work from already-dispatched uncertain writes. |
| **R09-B5-03** | Build own mutation bypassing `admitWrite` refused result. It MUST cause a real unauthorized synthetic PUT in the mutation, and the new repository R09 test MUST kill it by **no-UPSTREAM-PUT/unchanged-store assertion**. Verify script and README no longer call B5 equivalent. Report valid kill reason/exit, no setup failures, no survivor exclusion. |
| **R09-Q4B-04** | Independently send raw/HTTP chunked request with a byte/chunk every ~100–150ms, crossing a 1000ms absolute-from-routing deadline, while network idle timeout would not fire. On original code, observe approx 1000ms 408 `body_deadline_exceeded` (QA records tolerances/actual), 0 upstream PUT/late write; reservation released only pre-dispatch. A QA-owned mutant resetting timeout on every chunk must be killed by the NEW repository test for the absolute-time assertion. `safe-api.mjs` must remain unchanged. |
| **R09-SAFE-05** | 401/429 continue hard STOP (even for cleanup), no unsafe orphan deletion, replay or UNKNOWN reclassification, no quota reset/counter forgery. Old R08 loopback TLS/SSRF/path/protocol and explicit 114-byte PROPFIND remain; compare no external socket egress. Preserve synthetic N1665/1666 capacity behavior, 20-file/1MiB/20MiB/two-writer/100-per-30-min ceilings. |
| **R09-REG-06** | POC01–07, R01–R09 independent suites, syntax/check, complete suite five truly separate processes if claimed, legacy mutation **M1–M74 all killed**, new meaningful B5/Q4b/cleanup mutants killed with right reason, secret scan original base, `npm ls --all` empty, no credentials/certs and 0 unauthorized file changes. Report actual totals; `191/191` and `74/74` are only the old R08 baseline. |

**Compatibility requirement:** old R08 synthetic *unit arithmetic* fixture directly calls `admitRequest('cleanup')` without prior `beginCleanup()` following a reserved-budget STOP. QA must ensure that historical test remains passing, but this unit helper call cannot bypass the adapter's **actual** cleanup phase method/path dispatch guard. Do NOT fix by editing old tests or relaxing negative runtime guard.

**Adversarial cases:** two concurrent principals, beginCleanup while other writer has queued not-yet-dispatched PUT, forged `cleanup` category, stray GET/MKCOL, repeated/fake verification PROPFIND, path outside own fake inventory, unknown write with lost ACK, upstream 401/429, invalid DELETE If-Match; reject/STOP truthfully. *Already dispatched unknown writes may require quarantine; they cannot be assumed rolled back.* If no safe cleanup oracle exists, FAIL/PARTIAL and return to Design.

**Independent mutation distinction:** repository driver is expected to preserve M1–M74 (definition and kill reason); new R09 B5/Q4b/cleanup mutants should be killed by the named R09 assertions. Independently construct a minimal B5 and Q4b mutation in a disposable copy; kill due to the specific adverse network/timing result, not a syntax error, timeout of the test harness, or unrelated legacy assertion. If a mutation is infeasible, mark NOT_RUN—not equivalent by assumption.

## 3. QA evidence, report and STOP

Require final full SHA, exact parent chain/allowlist, source blob comparison, independent session identity, environment, own synthetic 2-writer/clock/trickle/recorder traces, unchanged secret/CI packages, actual case verdicts and mutation killed/survived/wrong reason counts. Report P0/P1/P2/INFO, NOT_RUN/UNSUPPORTED, any residual 5-file cleanup risk and slow-body deadline timing. No private credentials/cert keys, personal data or actual Nutstore/Zotero host. G4 may not infer future provider compatibility or production backup/scale.

The required verbatim status fields:
`R09 LOCAL_STAGE=PASS / PARTIAL / FAIL`,
`G3_INDEPENDENCE=VERIFIED / PENDING`,
`OVERALL POC-001=BLOCKED_REAL_SERVICE`.
A fully passing local QA may recommend `PASS_LOCAL_CANDIDATE_FOR_D007_A33`, **not** G4 itself. Only new independent Design D007-A33 may adjudicate QA and decide whether P2-R08-QA-1/2/3 close **locally at the new exact SHA**. Prior A31/R08 PARTIAL and A28 local G4 statuses remain historical. No merge/ACCESS-02/deployment automatic promotion.

QA directly posts its report to PR #2 at exact final SHA and **QA STOP**. Execution receives and forwards the unedited original QA conclusion/comment URL/ID back to Design; if QA not accessible, `G3_INDEPENDENCE_PENDING` and STOP. Neither Execution nor QA self-closes risks or starts a further remediation.

**G5 NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 NOT_AUTHORIZED / OVERALL BLOCKED_REAL_SERVICE.**