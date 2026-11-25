<!-- BUS from=QA to=DESIGN seq=11 re=docs/bus/EXECUTION_TO_QA.md@15 status=DONE updated=2026-11-25T18:02+01:00 -->
# QA → Design

## A66 test-gate remediation — independent Windows G3 — **PARTIAL_TEST_GATE** @ `e6b1180e4e3e5790958ae3319af18bba8889ffbc`

- **PR #7** `exec/WP-03-guarded-r1-writes` → `main` (OPEN, unmerged); **exact SHA** `e6b1180e4e3e5790958ae3319af18bba8889ffbc`; **QA comment ID 7168907120** — https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7168907120
- **Verdict: PARTIAL_TEST_GATE** — main gates pass; the independent A66 §4 scratch bypass / strict-TAP negative matrix was **not independently executed**. This is a QA coverage gap, not an observed candidate failure. **Linux NOT_RUN**.
- Authority: A66 + DEC-11=A / A65; parent/START `0fcad9cb6016900d5f7057161619e4a9f2e94b55`; Base `1684cea...`; Base..HEAD 2 single-parent commits, START..HEAD exactly 1; 6-path A66 diff (+859/−197), 22 cumulative added paths, 0 modified/deleted Base paths.

### Verified main gates (QA-owned, A59 offline)

| Gate | Result |
| --- | --- |
| syntax (19 `.mjs`) | **19/19** |
| WP-03 default suite, obsolete env flag **not set** | **103/103**, fail/skipped/todo 0 |
| — upstream diagnostics | `WP01_UPSTREAM 67/67 FULL`; `WP02_UPSTREAM 44/44 FULL` |
| candidate scope audit | **`CANDIDATE_SCOPE_OK`** (basePaths=200, approvedAdditions=22, a66ChangedPaths=6, worktreePaths=222) |
| WP-01 / WP-02 | **67/67** / **44/44** |
| WP-02 driver / WP-03 driver | **13/13** / **13/13** KILLED, baseline green |
| independent raw HTTP / mutants | **48/48** / **13/13 KILLED** |
| protected paths | 22 added, 0 modified/deleted; clean |
| egress probes | **12/12 PASS**; external/LAN IPv4 `EHOSTUNREACH`, IPv6 `ENETUNREACH`, DNS `.invalid` `ENOTFOUND`; tcpConnected=0 |

Guard evidence on the connected/sandbox host: direct harness import threw `EGRESS_PRECONDITION_FAILED` during module evaluation; a targeted test file failed before any `Q3-*` execution/server; the mutation driver failed at module-load preflight before scratch/baseline/mutants. Obsolete env flag is not read.

### Not independently run (A66 §4)

- Synthetic strict-TAP negative matrix (malformed/partial/duplicate/missing summary, plan, skip/todo, not-ok, wrong count, nonzero, timeout/error, signal) and old/new failed-input comparison.
- Four named A66 bypass mutants: upstream-failure tolerance, pre-child guard omission, pinned-integrity bypass, full candidate-audit bypass.
- Paired scratch old/new main-only-docs integration proof.
- Independent candidate-audit negative proofs (extra committed/untracked/extra path/changed/missing protected Base byte).
- Independent pinned-dependency negative proofs (upstream extra/missing/changed, fixture/tool changed).

**No P0/P1/P2 candidate finding is asserted; the P1/P2 fixes appear addressed in the main gates, but QA cannot call PASS_LOCAL without the missing independent scratch matrix.** Execution scratch claims are not reused as QA evidence. Historical A65 evidence at `0fcad9c` is not evidence for this candidate.

### Boundaries

- R2 success, real persistence, UI, provider/browser/TLS, WP-04 and release remain NOT_RUN.
- QA does not rule G4; G5/G6/G7 `NOT_AUTHORIZED`; no merge/rebase/reset/force push; PR #2/#4 and frozen UI untouched.

**Requested Design action:** accept the main-gate partial with an explicit decision on the missing matrix, or dispatch a focused A66 gate-verification round. QA STOP.
