# D007-A96 — P0-STORE R3 live-readiness slice G1 (DEC-39)

**Design decision record — 2026-11-27 Europe/Berlin.** Observed parent `main@02df1648475f51786ee7c54dabefcd0db97829b3`.

The user selected **DEC-39 = A** in the Design window: approve the R3 readiness slice identified in A95 §4. **R3 G1 APPROVED** exactly per [R3_LIVE_READINESS](../handoffs/P0-STORE/R3_LIVE_READINESS.md): same PR #9 branch on top of `b6fec8e`; live mode only with all seven run-time conditions (`--live`, pinned host `dav.jianguoyun.com:443` and prefix `/dav/LMS-P0STORE/<runId>/`, run-time approval id, run-time random runId, credential env, Node v22.23.5 x64); committed live plan can never self-authorize; gate/secret/trace/oracle/verdict/support byte-identical; offline tests with stub transport; ≥ 5 new mutants; targeted independent G3.

R3 authorizes **no** live request and no credential use. After R3 G4, Design completes the ACCESS-02 packet and runbook, and the user separately approves (or not) the single live run at R3's exact SHA. Board R49 is the task order (Execution only now). P0-STORE BLOCKED; G6/G7 NOT_AUTHORIZED; A70/A71 suspended; PR #2/#4 untouched.
