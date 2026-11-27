# P0-STORE Phase 1 R2 — INCONCLUSIVE verdict and root-cause-first reasons (LOCAL_MOCK_ONLY)

**G1 APPROVED by DEC-37=A (user, Design window, 2026-11-27).** Governing: [A93](../../architecture/D007_A93_P0STORE_R2_VERDICT_FIX_G1.md), A92 LIM-P0S-1, A90 §6/§10. Closes LIM-P0S-1 only. No network, account, credential or live mode change.

## 1. Branch and scope
- Continue the **same branch** `exec/P0STORE-nutstore-probe-r1` (PR #9) on top of exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2`; new single-parent commit(s) only; Base stays `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. No rebase, no merge from main, no force-push.
- May change only: `packages/p0store-nutstore-probe/src/verdict.mjs`, `src/oracle.mjs` (only if needed for reason ordering), the P1-06..P1-11 test files, one new `test/p1-14-inconclusive.test.mjs`, `scripts/mutation-check.mjs`, `scripts/verify-candidate-scope.mjs` (approved-path list only), `README.md`, `docs/handoffs/P0-STORE/QA_HANDOFF.md`. Gate, plan, secret, trace, runner live-mode code and `PHASE1_LIVE_ENABLED = false` must stay byte-identical; any need to touch them → STOP.

## 2. Required behaviour
- `VERDICTS = ['GO', 'PARTIAL', 'INCONCLUSIVE', 'NO-GO']`.
- Precedence: (1) any NO-GO evidence → `NO-GO`; (2) STOP or unresolvable outcome **before L6 completed all 5 rounds** → `INCONCLUSIVE`; (3) all of L2, L5, L6 (5/5), L7 passed but a limiting condition or later STOP exists → `PARTIAL`; (4) everything passed → `GO`.
- `reasons` list the **first failing or limiting step's own reason first** (e.g. `STALE_READ_VISIBILITY@L3` before `STOP_CLEANUP_UNVERIFIED@L12`); `rule` names the deciding clause.
- Expected matrix: strong GO; weak-etag PARTIAL (`WEAK_VALIDATOR` first); stale-read PARTIAL (`STALE_READ_VISIBILITY` first, cleanup STOP after); lost-update NO-GO; create-overwrite NO-GO; late-ack GO; unresolvable-ack PARTIAL (L8 after L6 complete; `UNRESOLVABLE_LATE_ACK` first); throttle / server-error / redirect / bad-cert **INCONCLUSIVE** (STOP at L0).

## 3. Tests and mutants
- Update P1-06..P1-11 expectations; new **P1-14**: full 11-personality verdict matrix incl. reason order, plus synthetic step sets: STOP at L6 round 3 → INCONCLUSIVE; STOP at L12 after all passes → PARTIAL; NO-GO + later STOP → NO-GO.
- Add ≥ 3 named mutants: early STOP mapped to PARTIAL; INCONCLUSIVE mapped to GO; later STOP reason placed before root cause. All earlier M01–M13 must still be killed.
- P1-13 strict upstream and protected inventory unchanged.

## 4. Evidence and delivery
Same environment rules (Node v22.23.5 x64, A59 offline or A54/A55 Linux, guard+probe, no real host). Full suite, upstream, audit, mutation driver at the **final** head. Itemized G2 report (A86) as a new PR #9 comment; Execution bus next seq; STOP.

## 5. Targeted independent G3 (after Design G2)
At the new exact head: syntax; full `node --test`; QA-strict upstream 67/44/103/91; audit positive + count-neutral negative for one modified path; **QA-written 11-personality verdict matrix with reason order**; zero-egress re-check (5 combinations) and canary scan; committed mutants all killed + ≥ 3 QA mutants on the new rule; diff proof that gate/plan/secret/trace/live-mode files are byte-identical to `88e1bd7`.
