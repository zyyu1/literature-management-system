# POC-001 R10-HANDOFF-01 — Independent G3 QA Acceptance Plan (D007-A41, NOT_RUN)

**PLAN ONLY.** After new **DOC-ONLY** Execution final PR #2 SHA is published, Management must coordinate a **separately user-opened independent QA window**, never Execution subagent or Management own test masquerading as G3. Authority [A41 DOC-ONLY G1](../../architecture/D007_A41_R10_HANDOFF_DOC_ONLY_G1_AUTHORIZATION.md), [DOC-ONLY work order](R10_HANDOFF_DOC_ONLY_WORK_ORDER.md), [A40 G4 PARTIAL](../../architecture/D007_A40_R10_EXACT_G4_PARTIAL_DISPOSITION.md), [A39 previous G1](../../architecture/D007_A39_POC001_REMEDIATION_10_G1_AUTHORIZATION.md), [old R10 QA plan](REMEDIATION_10_QA_PLAN.md). **A41 supersedes only the new doc-only task; no changes to A39 or earlier Execution/QA results.**

## 0. First-attempt preflight HARD STOP

**First attempted** `git ls-remote` of `refs/heads/exec/POC-001-webdav-feasibility` **must EXIT 0 and equal the new final full 40-char head**. Before this first call, QA can prepare a working host and known Git/OpenSSL configuration; do NOT execute an exploratory failed `ls-remote` and silently re-label a later successful response as the "first" attempt. Any first-attempt schannel/TLS/credentials/prompt/timeout failure, short SHA, different SHA or ambiguous reply ⇒ **`G3_PREFLIGHT_FAILED / STOP`**, post truthful STOP, request a **new separately authorized QA process** if necessary. **No legacy A28 once-only waiver and no self-granted retry exception.**

Then independently:
1. Fresh **complete** clone in new empty path (not shallow), clean checkout detached at exact final R10-DOC SHA. REST metadata confirms PR #2 OPEN/unmerged, head==remote==checkout before and after tests. Original POC merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` unchanged; R10-doc START `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e` ancestor, no merge, only exact one file touched in START..HEAD. PR #4 unchanged.
2. Independently retrieve historic `QA_HANDOFF.md` blob B09 `abec8158235443edbd53ed25ad6369c36c080819` from `bcc47380deb7c6e48964ca5ca77303a213fade28` and B10 `efc915c46f57fc6ca9c835061b169036256c8a88` from `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`. Parse new raw bytes with invariant `B_new = B09 || S || B10`. Validate exact prefix/suffix original bytes, S provenance metadata/no unrelated alterations, complete old history, no accidental truncation/newline/BOM mutation. Confirm protected old code/test/CI/doc files byte identical vs R10-doc START, no new dependencies or secrets.
3. QA independently run from `poc/001` **all 17 POC+remediation suites individually** (POC-01..POC-07 and R01..R10), `node scripts/check.mjs`, `node --test "test/*.test.mjs"` **5 distinct processes, 209/209 and exit 0 each**. Actual Node v22.23.5 reference, record host/OS/versions/exits, full errors and flaky reruns separately; isolated rerun != full clean run. If any full process fails or Windows `R08-TLS-02` ESM-path error recurs ⇒ **`GATE-R10-REG-01 NOT_CLOSED` / no PASS_LOCAL candidate**. Historical Windows platform incompatibility stays visibly NOT_CERTIFIED; a green supported-host run doesn't prove Windows. No old test/CI script edit to obtain green.
4. Independently run `node scripts/mutation-check.mjs` (R10 baseline expected **85/85** meaningful kills, no wrong-reason kills), secret-scan with original Base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, `npm ls --all`, code syntax, no unexpected network. R10 last Execution + QA numbers are **comparison only, not substitute**.
5. QA-owned local 2-writer fake DAV request-trace tests: premature own-parent `PROPFIND` 0/20, 1/20, 19/20 denied before dispatch with zero request/budget/token loss; 20 conditional own-file DELETE attempts + exactly one final verification; 75+21=96, 79+21=100 and request 101 denied; 10 straggler PUT denied, foreign/recursive/nonconditional operations refused, 412 residual truthful, 401/429 STOP and UNKNOWN never faked or retried, at least one QA-created meaningful mutant killed by intended named R10 assertion. In-flight unsettled DELETE finalization remains `UNSUPPORTED` unless separately evidenced; no new code or provider testing.
6. Directly post a formal **G3 QA_REPORT comment on PR #2** tied to exact new DOC-only SHA, stating (`first ls-remote attempt exit/status/sha`, fresh clone, one-file path audit, raw bytes prefix/suffix, individual suites, five 209/209 process counts, 85/85 mutants, independent probes, P0/P1/P2/INFO, NOT_RUN/UNSUPPORTED). QA may recommend `PASS_LOCAL_CANDIDATE_FOR_FUTURE_R10_DOC_G4` **only if** all mandatory gates hold, but cannot grant G4 or close P2. Then **QA STOP**.

## Scope and formal gate outcomes

| Gate | Formal behavior |
| --- | --- |
| First git remote attempt != success | `G3_PREFLIGHT_FAILED / STOP`, never use old or later attempt as new first |
| Historic bytes are not prefix/suffix | `GATE-R10-DOC-01 OPEN / FAIL` |
| Any incremental path besides QA_HANDOFF | `G1_SCOPE_VIOLATION / STOP` |
| Full regression on claimed supported host not 209/209×5 | `GATE-R10-REG-01 OPEN / PARTIAL`, not clean QA PASS |
| All target gates and exact SHA validated | QA can **recommend** candidate, Design still decides G4 |
| Live provider, data, backup/restore, deployment | `NOT_RUN / BLOCKED` |

**No implicit repair authorization.** Original A40 exact G4 PARTIAL remains historical until a distinct Design decision on the fresh exact HEAD. G5 merge NOT_AUTHORIZED; G6 ACCESS-02 BLOCKED; G7 deployment NOT_AUTHORIZED; Q1e UNSUPPORTED_COMPLETENESS; POC-001 BLOCKED_REAL_SERVICE. INFO-1/C9 INFO.
