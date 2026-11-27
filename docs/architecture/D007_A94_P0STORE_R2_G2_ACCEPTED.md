# D007-A94 — P0-STORE Phase 1 R2 (INCONCLUSIVE verdict) G2 ACCEPTED

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@3c6d040407cdc062e262b5fbd748c7dc8aecd581`. Acted on explicit user poll.

## 1. Evidence received
- Management49 dispatched R2 exactly per Board R46 / [R2_VERDICT_FIX](../handoffs/P0-STORE/R2_VERDICT_FIX.md).
- [Execution32](https://github.com/zyyu1/literature-management-system/blob/3c6d040407cdc062e262b5fbd748c7dc8aecd581/docs/bus/EXECUTION_TO_QA.md) (`3c6d040`, STOP, `re=@49`) and PR #9 comment [#7219591478](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7219591478) read in full; itemized per DEC-27.
- PR #9 now 4 commits: `9e772e6` → `88e1bd7` (A92 G4) → **`403218797ffb2fc2aafa3b681d8b461159e09aba`** (R2 evidence) → final exact HEAD **`b6fec8e3b0ec217b142b428080454588e6866744`** (`QA_HANDOFF.md` only).
- Reported at `4032187` (Windows offline 13:20:24Z–13:30:29Z, probes 5/5, Node v22.23.5 x64): suite 65/65 incl. new P1-14 (15 tests); upstream 67/44(nested 67)/103/91; 94/94 protected; audit OK (re-run at final head, commits 4, 29 additions); mutants 16/16 (M01–M13 + M14 early-STOP→PARTIAL, M15 INCONCLUSIVE→GO, M16 reason order). Verdict matrix: strong GO; weak-etag PARTIAL (`WEAK_VALIDATOR@L3` first); stale-read PARTIAL (`STALE_READ_VISIBILITY@L2` first, cleanup STOP after); lost-update/create-overwrite NO-GO; late-ack GO; unresolvable-ack PARTIAL (`UNRESOLVABLE_LATE_ACK@L8` first); throttle/server-error/redirect/bad-cert **INCONCLUSIVE**.

## 2. Design independent checks
- Single-parent chain on top of `88e1bd7`; `Base..b6fec8e` = 29 added paths only; `4032187..b6fec8e` = `QA_HANDOFF.md` only.
- R2 delta `88e1bd7..4032187` = 12 files: `src/verdict.mjs`, P1-06..P1-11, new P1-14, mutation driver, audit list, README — **plus `test/p1-03-tls-redirect-stop.test.mjs`**.
- `src/gate.mjs`, `plan.mjs`, `secret.mjs`, `trace.mjs`, `runner.mjs`, `oracle.mjs`, `support/`, `plans/`: **byte-identical** to `88e1bd7`; `PHASE1_LIVE_ENABLED = false` unchanged.
- `verdict.mjs`: `VERDICTS = ['GO','PARTIAL','INCONCLUSIVE','NO-GO']`, `INCONCLUSIVE_BEFORE_L6_COMPLETE`, L6 five-round completion as the evidence threshold — matches A90 §10.

## 3. Findings
- **P1-03 whitelist exception (Design spec omission):** R2_VERDICT_FIX §1 did not list P1-03 although its two bad-cert/redirect assertions necessarily change. The diff is exactly those two `PARTIAL`→`INCONCLUSIVE` assertions plus one comment line each. Execution reports the user authorized it in the Execution window; Design records it here and accepts it as within the intent of DEC-37. Future specs must list every test whose expectations a rule change affects.
- INFO: stale-read root cause is reported at L2 (earliest read-back), consistent with "first limiting step".
- INFO: syntax group static, outside interval; Linux NOT_RUN.

## 4. Ruling
**G2 ACCEPTED at exact `b6fec8e3b0ec217b142b428080454588e6866744`.** Targeted independent G3 per R2_VERDICT_FIX §5 released only on the user's decision (DEC-38). LIM-P0S-1 closes at Design G4 after G3. Phase 3/ACCESS-02/G6, G7 NOT_AUTHORIZED; P0-STORE BLOCKED.

## 5. DEC-38 record
2026-11-27: the user selected **DEC-38 = A (release targeted independent G3)** in the Design window. Board R47 is the task order (QA only, exact `b6fec8e3b0ec217b142b428080454588e6866744`).
