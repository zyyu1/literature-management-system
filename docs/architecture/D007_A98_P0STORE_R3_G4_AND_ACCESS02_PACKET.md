# D007-A98 — P0-STORE R3 G4 PASS_LOCAL; ACCESS-02 request ready (DEC-41 pending)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@cc2abe8fd9254d7b7c2902e3d41ad8292c2f83d5`. Acted on explicit user poll.

## 1. Evidence received
- Management52 dispatched QA only per Board R50. [QA23](https://github.com/zyyu1/literature-management-system/blob/cc2abe8fd9254d7b7c2902e3d41ad8292c2f83d5/docs/bus/QA_TO_DESIGN.md) (`cc2abe8`) and PR #9 comment [#7222172332](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7222172332) read in full.
- First and only `ls-remote refs/pull/9/head` 15:02:17Z (after Management52 15:00:38Z), exit 0, exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`; all evidence at final head; Windows offline 15:11:36Z; Node v22.23.5 x64 full path, non-elevated; no credential set; Linux NOT_RUN.
- 8 groups PASS: syntax 26/26; suite 85/85 (P1-01..15); QA-strict upstream 67/44(nested 67)/103/91; audit positive + count-neutral negatives 7/7; **QA live-gating matrix 14/14** (missing flag, plan mode, four wrong-host variants incl. uppercase and IP, wrong port, prefix escape, self-authorized plan, missing/malformed approval, supplied runId, Node mismatch — each zero transport calls, empty trace, poisoned-env proof of no secret read; satisfied case with QA stub transport targets `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runId>/…`, canary absent); static proof 4/4 (`PHASE1_LIVE_ENABLED` dead only; host literal 2 files ×1; live plan nulls); byte proof 7/7 vs `b6fec8e`; mutants 22/22 + QA QM01–QM03. P0/P1/P2 = 0. QA disclosed a path-separator bug in its own static check, fixed and re-run; candidate untouched.

## 2. Findings
- INFO-1: QA's own matrix omitted the "credential env missing" case; the committed P1-12 covers it and ran in QA's suite. Not blocking.
- INFO-2: Linux NOT_RUN.

## 3. Ruling
**G2 ACCEPTED (A97), G3 VERIFIED, G4 PASS_LOCAL at exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`.** Status **`ACCESS02_REQUEST_READY`**: probe, Phase 2 preparation and the [Phase 3 runbook](../handoffs/P0-STORE/PHASE3_RUNBOOK.md) are complete. Still **not authorized** until the user approves DEC-41.

## 4. ACCESS-02 request (DEC-41) and A90 adjustment
- Exact SHA `6a59ce9`; host `dav.jianguoyun.com:443`; namespace `/dav/LMS-P0STORE/<runtime runId>/`; approval id `P0STORE-ACCESS-02-20261127-6a59ce9`; budget per A90 §4; one run only.
- **Operator change from A90 §3:** the **user runs** the command per the runbook; no Claude window ever holds or injects the credential. Execution only attaches the redacted trace/console files to PR #9; independent QA re-derives the verdict offline from the trace. The A90 idea of a second QA live re-run is dropped (one live run only, budget preserved).
- Afterwards the user revokes the app password; Design rules GO / PARTIAL / INCONCLUSIVE / NO-GO per A90 §6/§10.
G6 for anything beyond this single run, and G7, remain NOT_AUTHORIZED; P0-STORE BLOCKED until the Design verdict.

## 5. DEC-41 outcome (2026-11-27, user, clickable in the Design window)
**User approved: "批准，我来运行".** ACCESS-02 approval `P0STORE-ACCESS-02-20261127-6a59ce9` is valid for **one** live run of exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef` against `dav.jianguoyun.com:443` under `/dav/LMS-P0STORE/<runtime runId>/`, operator = the user, per [PHASE3_RUNBOOK](../handoffs/P0-STORE/PHASE3_RUNBOOK.md). No retry, no second run, no other host or SHA. The credential stays with the user only; no Claude window receives it. After the run: the user revokes the app password and reports exit code + verdict line to Design; Design then issues the attach/offline-QA task order. G6 beyond this run and G7 remain NOT_AUTHORIZED; the P0-STORE route verdict is pending.

## 6. Incident: first attempt never started; runbook rev 2 (2026-11-27)
Management54 (`596ae53`) reported the user's raw PowerShell errors: a line merge (`"exit=$code"$s = …`), `ArgumentNullException` in `SecureStringToBSTR`, `$node` undefined in that window so `& $node …` failed as `BadExpression`, and `Env:` removal of a variable that was never set. **The runner never started:** no request, no credential set, no trace. **Design fault:** runbook rev 1 used `Marshal.PtrToStringAuth`, which does not exist in .NET, and did not warn that every line must run one at a time in the same window that defines `$node`.
**Ruling:** this does not count as the run. Approval `P0STORE-ACCESS-02-20261127-6a59ce9` is **not consumed** and is still valid for exactly one run of the same SHA, host and namespace, with the user as operator. [Runbook rev 2](../handoffs/P0-STORE/PHASE3_RUNBOOK.md) numbers every line, converts the secret with `[System.Net.NetworkCredential]::new("", $s).Password` (works in Windows PowerShell 5.1 and PowerShell 7), checks `Test-Path $node`, and says what to do if a pre-run line fails. All other §5 bounds are unchanged.
