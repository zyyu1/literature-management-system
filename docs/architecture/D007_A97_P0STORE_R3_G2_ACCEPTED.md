# D007-A97 — P0-STORE R3 live-readiness slice G2 ACCEPTED

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@8c671600870437e47bbf457324edb38268bcc366`. Acted on explicit user poll.

## 1. Evidence received
- Management51 dispatched R3 exactly per Board R49 / [R3_LIVE_READINESS](../handoffs/P0-STORE/R3_LIVE_READINESS.md). Execution33 was only the "not involved" ack for seq50.
- [Execution34](https://github.com/zyyu1/literature-management-system/blob/8c671600870437e47bbf457324edb38268bcc366/docs/bus/EXECUTION_TO_QA.md) (`8c67160`, STOP, `re=@51`) and PR #9 comment [#7221313989](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7221313989) read in full; itemized per DEC-27.
- PR #9 now 6 commits; R3 evidence **`ba4351947528cfd3881d3f64601dbaa63b4242ff`** (parent `b6fec8e`), final exact HEAD **`6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`** (`QA_HANDOFF.md` only).
- Reported at `ba43519` (Windows offline 14:39:18Z–14:49:50Z, probes 5/5, Node v22.23.5 x64 full path, non-elevated; no real host, no credential): suite 85/85 (P1-12 rewritten as 7-condition matrix, new P1-15 8 tests); upstream 67/44(nested 67)/103/91; 94/94 protected; audit OK (31 additions, re-run at final head); mutants 22/22 (M17–M22: missing/malformed approval, other host, prefix escape, skipped Node check, secret read before authorization).

## 2. Design independent checks
- R3 delta `b6fec8e..ba43519` = 9 files exactly within R3 §1 (plan.mjs, runner.mjs, new live plan, P1-01, P1-12, new P1-15, mutation driver, audit list, README). `Base..6a59ce9` = 31 added paths only.
- `src/gate.mjs`, `secret.mjs`, `trace.mjs`, `oracle.mjs`, `verdict.mjs`, `support/`, `plans/example-plan.json`: **byte-identical** to `b6fec8e`.
- `dav.jianguoyun.com` appears only in `plans/live-nutstore-plan.json` and `src/plan.mjs` `LIVE_HOST`; tests contain only the wrong-host variant `jianguoyun.com` as negative input.
- Committed live plan: `mode live`, `https:`, `dav.jianguoyun.com:443`, `/dav/LMS-P0STORE/{runId}/`, `runId null`, `accessApprovalId null`, `pinnedCaFile null`, credential env `P0STORE_WEBDAV_PASSWORD` — it cannot self-authorize.
- `authorizeLiveRun` order: flag → plan checks → approval required/format → runId not supplied → credential presence → Node v22.23.5/x64; `loadSecret` only after authorization; runId from `crypto.randomBytes(16)`.

## 3. Findings (non-blocking)
- INFO-1: `PHASE1_LIVE_ENABLED = false` remains as a dead export required by the byte-frozen `support/harness.mjs` re-export; no live code reads it. G3 must confirm no consultation.
- INFO-2: syntax group static, outside the interval; Linux NOT_RUN.

## 4. Ruling
**G2 ACCEPTED at exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`.** Targeted independent G3 per R3 §5 released only on the user's decision (DEC-40). No live request authorized; Phase 3/ACCESS-02/G6, G7 NOT_AUTHORIZED; P0-STORE BLOCKED.

## 5. DEC-40 record
2026-11-27: the user selected **DEC-40 = A (release targeted independent G3)** in the Design window. Board R50 is the task order (QA only, exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`, fully offline, no real host or credential).
