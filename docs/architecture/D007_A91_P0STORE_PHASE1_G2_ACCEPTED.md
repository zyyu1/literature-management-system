# D007-A91 — P0-STORE Phase 1 probe: G2 ACCEPTED (G3 release pending user decision)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@b63f67af1ba78ecdac7e6d5ba5d22234294cb1a1`. Acted on the user-requested 10-minute poll.

## 1. Evidence received
- [Execution30](https://github.com/zyyu1/literature-management-system/blob/b63f67af1ba78ecdac7e6d5ba5d22234294cb1a1/docs/bus/EXECUTION_TO_QA.md) (`b63f67a`, STOP, `re=@47`).
- [PR #9](https://github.com/zyyu1/literature-management-system/pull/9): OPEN, non-draft, mergeable clean, 2 commits, exact HEAD **`88e1bd76dc94fc38876fa28c975d317b1c1573c2`** (`9e772e6` implementation/evidence + docs-only `QA_HANDOFF.md`). G2 report [#7217070751](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7217070751) read in full; itemized per DEC-27.
- Reported (Windows offline 11:18:20Z–11:24:15Z, probes 5/5, Node v22.23.5 x64, at `9e772e6`): suite 50/50 with P1-01..P1-13; strict upstream 67/44(nested 67)/103/91; 94/94 protected blobs; audit OK (re-run git-only at final head); mutants M01–M13 13/13 by named assertions; syntax 24/24 static (outside interval, NOT_RECORDED isolation). QA-owned items NOT_RUN as required.

## 2. Design independent checks (static, remote Git)
- Base `663556b` → `9e772e6` → `88e1bd7`, single-parent; exactly 28 added paths (27 under `packages/p0store-nutstore-probe/` + `docs/handoffs/P0-STORE/QA_HANDOFF.md`); no modification/deletion; `9e772e6..88e1bd7` = `QA_HANDOFF.md` only; only executable is Base's `tools/offline/run-offline.sh`.
- **Live mode inert by construction**: `export const PHASE1_LIVE_ENABLED = false` and `authorizeLiveRun` returns `PHASE1_LIVE_INERT` before any other check; P1-12 asserts the constant and the source text.
- **No real host literal**: search for provider host patterns finds none in code or plans; the forbidden-token list in P1-12 is built by string joining. Example plan host is `127.0.0.1`, `accessApprovalId: null`, budget 100/12 reserve, ≤20 files, ≤2 writers.
- TLS: single transport option `rejectUnauthorized: true`; no other occurrence.
- Credential: read only via `loadSecret(plan, env)` from the plan-named variable; harness sets only a canary and restores it; trace writer fails closed on credential/host material (P1-05).
- Egress guard `assertPlatformEgressPrecondition()` at module load in `support/harness.mjs` (imported by all 13 test files, under a file lock), in P1-13 and in the mutation driver.
- Plan estimates: L0–L11 = 81 (≤ 88), L12 cleanup 8 within the 12-slot reserve; strong-run observed 81 normal + 6 cleanup.

## 3. Findings (non-blocking)
- INFO-1: L9 estimate 4 vs A90 table 3 (A90 counted local refusals that send nothing); within budget.
- INFO-2: full evidence ran at `9e772e6`; final head differs only by `QA_HANDOFF.md` (audit re-run there). Independent G3 must run at the exact final head.
- INFO-3: syntax group outside the offline interval (static). Linux NOT_RUN.

## 4. Ruling
**G2 ACCEPTED at exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2`.** Independent G3 per [QA_INSTRUCTION](../handoffs/P0-STORE/QA_INSTRUCTION.md) is released only on the user's decision (DEC-34). Phases 2–4, ACCESS-02/G6, G7 NOT_AUTHORIZED; P0-STORE BLOCKED; A70/A71 suspended.
