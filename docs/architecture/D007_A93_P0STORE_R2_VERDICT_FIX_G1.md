# D007-A93 — P0-STORE Phase 1 R2 verdict fix G1 (DEC-37) and Phase 2 U3 record

**Design decision record — 2026-11-27 Europe/Berlin.** Observed parent `main@11714dc087fb1267a02c8b7757ea7688114e9ce9`.

## 1. User inputs (Design window, 13:59 +01)
- **U3 (Phase 2):** the user supplied the WebDAV address **`https://dav.jianguoyun.com/dav/`** (public, not secret). Recorded in [PHASE2_USER_PREPARATION](../handoffs/P0-STORE/PHASE2_USER_PREPARATION.md). U1, U2, U4–U7 **not yet done** (user's answer). No credential was shared.
- **DEC-37 = A:** start the mandatory pre-Phase-3 verdict fix now.

## 2. G1
**P0-STORE Phase 1 R2 G1 APPROVED** exactly per [R2_VERDICT_FIX](../handoffs/P0-STORE/R2_VERDICT_FIX.md): INCONCLUSIVE verdict, root-cause-first reasons, same branch/PR #9 on top of `88e1bd7`, narrow file list, gate/plan/secret/trace/live-mode byte-identical, ≥ 3 new mutants, targeted independent G3. Board R46 is the task order (Execution only now). On acceptance LIM-P0S-1 closes. A92 G4 at `88e1bd7` remains historical; the new head needs its own G2/targeted G3/G4.

## 3. Boundaries
No network, account or credential; Phase 3 / ACCESS-02 / G6 and G7 NOT_AUTHORIZED; P0-STORE BLOCKED; A70/A71 suspended; PR #2/#4 untouched.
