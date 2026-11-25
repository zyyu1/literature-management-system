<!-- BUS from=QA to=DESIGN seq=12 re=docs/bus/EXECUTION_TO_QA.md@16 status=STOP updated=2026-11-25T18:00:00+01:00 -->
# QA → Design

## A67 independent Linux G3 preflight — STOP

- **PR:** #7 `exec/WP-03-guarded-r1-writes` → `main`; expected OPEN/unmerged from the execution bus.
- **Exact SHA:** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`.
- **Parent:** `0fcad9cb6016900d5f7057161619e4a9f2e94b55`.
- **Immutable Base:** `1684cea5623c8421e16c328c7f1464e8932d3118`.
- **Increment:** 2 commits Base..HEAD; the task's candidate increment START..HEAD is 1 commit. Fresh full clone detached exactly at the requested SHA; working tree clean at stop.
- **Changed paths:** preflight listing showed 22 added paths relative to Base; full whitelist/protected-byte review was not completed because the mandatory Node gate failed.
- **First remote read:** `git ls-remote refs/heads/exec/WP-03-guarded-r1-writes` returned the exact SHA with exit 0 on the first attempt.
- **Host facts:** Linux x86_64; kernel 6.18.57; Node `v24.22.3`; Git 2.56.1.
- **Isolation:** no test/server/probe/mutation command was run. A54/A55 namespace probe count: 0; result: NOT_RUN.
- **Blocking failure:** A67/A54 task requires Node `v22.23.5`; this host provides `v24.22.3`. Therefore **G3_PREFLIGHT_FAILED / STOP**. No version bypass, installation, system change, or test execution was attempted.
- **QA comment ID:** NOT_CREATED because the mandatory preflight failed before QA execution/reporting.

### Command counts and exits

| Command group | Actual result |
| --- | --- |
| First exact branch ref read | 1 command, exit 0, exact SHA |
| Fresh full clone / detached checkout | completed, exit 0 |
| Environment fact collection | completed, exit 0 |
| Required Node-version gate | **FAIL: v24.22.3 != v22.23.5** |
| A54/A55 egress probe | 0 runs, NOT_RUN |
| Tests | 0, NOT_RUN |
| Independent strict-TAP matrix | 0, NOT_RUN |
| Named bypass mutants | 0, NOT_RUN |
| Candidate-audit negative cases | 0, NOT_RUN |
| Pinned-dependency negative cases | 0, NOT_RUN |

### Findings

- **P0:** none observed; execution was blocked before testing.
- **P1:** none observed; execution was blocked before testing.
- **P2:** none observed; execution was blocked before testing.
- **NOT_RUN:** all A67 §3 matrices, all test suites, all mutants, candidate auditor negatives, pinned-dependency negatives, PR-state verification, protected-byte verification, and Linux egress namespace probe.
- **UNSUPPORTED:** none; this is an environment preflight failure, not an unsupported-test claim.

### Verdict

**G3_PREFLIGHT_FAILED / STOP**

No PASS_LOCAL, PARTIAL, or G4 ruling is issued. **Linux 已实测（仅环境事实）；另一平台 NOT_RUN。** A67 QA execution must be redispatched to a host with exact Node `v22.23.5`.
