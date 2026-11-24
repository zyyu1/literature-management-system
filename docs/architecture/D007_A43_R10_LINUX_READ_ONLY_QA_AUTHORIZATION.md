# D007-A43 — POC-001 R10 supported Linux read-only independent G3 authorization

**User-approved option A, 2026-11-24 Europe/Berlin.** Predecision user approval and clickable-choice rule recorded separately at main `b5b90b8f4529eced3a830e712bf7bf74e10e55f5`. Binding [A42 §6](D007_A42_R10_DOC_ONLY_G4_PARTIAL_DISPOSITION.md) and [A41 QA plan](../handoffs/POC-001/R10_HANDOFF_DOC_ONLY_QA_PLAN.md). **QA_DISPATCH=AUTHORIZED_READ_ONLY_SUPPORTED_LINUX_EXACT_SHA; new G3 NOT_RUN; new G4 NOT_REVIEWED.** No new implementation G1, no Execution task or G2. A42 G4 PARTIAL_NOT_ACCEPTED remains the operative exact-SHA decision until separate Design adjudication.

## 1. Immutable subject and authority

- Repository zyyu1/literature-management-system; [PR #2](https://github.com/zyyu1/literature-management-system/pull/2) OPEN / NOT MERGED; existing branch `exec/POC-001-webdav-feasibility`; original immutable merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`.
- Test exactly `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`; A41 DOC-only START `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`; R09 historic SHA `bcc47380deb7c6e48964ca5ca77303a213fade28`. PR #4 remains independent, exact observed head `49cb8d264fa7c9d76705e03161421149a4557167`.
- Historical [QA #7133028128](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7133028128) is comparison evidence only: first-attempt and DOC gates passed, Windows full suites 208/208/207/208/208, exit 1 each. Supported Linux NOT_RUN. No waiver, no retroactive green claim.

## 2. Authorized work

Management coordinates ONE separately user-opened independent QA session on a verified supported Linux host with Node **v22.23.5**. No Execution window required; Management self-tests or same-session subagents do not qualify. Follow [work order](../handoffs/POC-001/R10_LINUX_READ_ONLY_QA_WORK_ORDER.md) and unchanged A41 QA plan, with fixed existing SHA rather than a new commit. Verify host before first remote attempt. If unavailable, ENVIRONMENT_BLOCKED / NOT_RUN / STOP. The first attempted git ls-remote must exit 0 and return the exact full branch SHA; otherwise G3_PREFLIGHT_FAILED / STOP, no retry waiver. Fresh complete non-shallow clone, detached clean checkout; verify original Base, A41 one-path delta and PR HEAD before/after. No branch or repository content changes. Local temporary copies for probes/mutation allowed only outside the clean checkout, with no push; only remote write permitted is the independently authored direct PR #2 QA_REPORT (or STOP report). No new issue/PR, branch, merge/rebase/reset, CI change, secrets or real-provider access.

## 3. Mandatory evidence and thresholds

All 17 POC/remediation suites individually, syntax/check script, five distinct full processes each exactly 209/209 and exit 0, 85/85 intended mutation kills, secret scan and dependency check, QA-owned R10 loopback safety probes/mutants, independently verified raw B09||S||B10 byte integrity and unchanged code/test blobs. Record every process/exit/error, NOT_RUN and UNSUPPORTED. A failed full run cannot be substituted by isolated success, rerun selection or a modified harness. Linux success does not certify Windows portability. Only if all required gates hold may QA recommend PASS_LOCAL_CANDIDATE; Design alone decides new exact-SHA G4 after verified Management return and separate Handoff-only evidence receipt.

## 4. Preserved decisions

GATE-R10-DOC-01 and GATE-R10-G3-01 historic exact-SHA PASS remain recorded; GATE-R10-REG-01 OPEN; P2-R09-QA-1 OPEN/LOCAL_FIX_EVIDENCED, P2-R08-QA-1 OPEN/PARTIAL; B5/Q4b historical closures only at R09; INFO-1/C9 INFO; concurrent in-flight DELETE settlement UNSUPPORTED. Q1e UNSUPPORTED_COMPLETENESS, BACKUP_NOT_RESTORE_CERTIFIED; L3 untouched. **G5 MERGE NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 DEPLOY NOT_AUTHORIZED / POC-001 BLOCKED_REAL_SERVICE.** No automatic risk closure or further authorization. Management returns original report and STOP; further changes require separate approval.
