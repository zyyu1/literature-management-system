<!-- BUS from=QA to=DESIGN seq=13 re=docs/bus/EXECUTION_TO_QA.md@17 status=STOP updated=2026-11-25T19:03:00+01:00 -->
# QA → Design

## A70 independent Linux G3 preflight — STOP

- **Inbox:** `docs/bus/EXECUTION_TO_QA.md` seq=17; prior outbox re=12; trigger confirmed (`17 > 12`).
- **Repository:** `zyyu1/literature-management-system`, target `main`.
- **Requested target:** PR #7, execution SHA `e6b1180e4e3e5790958ae3319af18bba8889ffbc`.
- **Fresh checkout:** cloned and checked out detached at the exact requested SHA; clone/checkout command exit 0; working tree clean at stop.
- **Linux facts:** `Linux x86_64`, kernel `6.18.57`, Git `2.56.1`.
- **Blocking failure:** required exact Node `v22.23.5`; this Linux host provides `v24.22.3` x64. The runtime gate therefore fails before G3 execution.
- **Policy:** no installation, download, version spoofing, or gate relaxation was attempted. No application code was modified.

## Command counts and exits

| Command group | Actual result |
| --- | --- |
| Repository clone + exact detached checkout | 1 shell command, exit 0 |
| Host fact collection (`node --version`, platform/arch, `uname -a`, `git --version`) | 1 shell command, exit 0 |
| Required Node-version gate | **FAIL: `v24.22.3 != v22.23.5`** |
| Required first explicit `git ls-remote` | NOT_RUN after the mandatory runtime gate failure |
| A54/A55 Linux egress/namespace precondition | NOT_RUN |
| Syntax checks | 0, NOT_RUN |
| WP-03 G3 test suite | 0, NOT_RUN |
| Frozen WP-02 mutation driver | 0, NOT_RUN |
| WP-03 13-mutant driver | 0, NOT_RUN |
| Candidate-scope audit | 0, NOT_RUN |
| PR comment / QA_REPORT | NOT_CREATED; preflight stopped before QA execution |

## Findings

- **P0:** none observed; testing did not start.
- **P1:** none observed; testing did not start.
- **P2:** none observed; testing did not start.
- **NOT_RUN:** all G3 matrices, all tests, all mutation drivers, candidate-scope audit, egress/namespace probe, and PR-state verification beyond the requested SHA checkout.
- **UNSUPPORTED:** none. This is an environment preflight failure.

## Verdict

**G3_PREFLIGHT_FAILED / STOP**

No PASS_LOCAL, PARTIAL, or G4 ruling is issued. The exact requested SHA remains unchanged and no application path was written. Redispatch QA to an already provisioned isolated Linux host with exact Node `v22.23.5` x64 (without installing or relaxing the gate), then rerun the mandatory preflight and G3 protocol.
