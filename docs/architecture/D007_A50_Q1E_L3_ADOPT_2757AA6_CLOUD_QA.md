# D007-A50 — Q1E-L3: adopt post-STOP commit `2757aa6` as A45 candidate + independent cloud QA (LIGHT)

**User approval:** 2026-11-24 Europe/Berlin. User clicked "A 处理 PR #4 的 2757aa6". Recorded here per [A47 R1](../governance/D007_A47_PROCESS_SIMPLIFICATION.md). Observed parent `main@e1db277aebc855402d768397ed3790b136a86ab1`.
**Type:** CANDIDATE ADOPTION + QA_DISPATCH. No new G1 and no change to the [A45](D007_A45_Q1E_L3_MINIMAL_REMEDIATION_G1_AUTHORIZATION.md) scope. No further Execution: the branch is frozen at the exact SHA below.

## 1. Verified by Design (GitHub REST)
- [PR #4](https://github.com/zyyu1/literature-management-system/pull/4) is OPEN and unmerged. HEAD **`2757aa664e2c12c80716fb291f3e3149f06fcfdd`**. The PR has 9 comments; the latest is [QA STOP #7135104900](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7135104900). Nothing new since the A45 post-withdrawal receipt.
- Compare `49cb8d26...2757aa66` shows a fast-forward: 1 commit ahead, 0 behind. It touches 14 paths, all inside the A45 whitelist:
  - modified: `src/recovery.mjs`, `test/l3-contract.test.mjs`, `test/l3-faults.test.mjs`, `scripts/mutation-check.mjs`, `README.md`, `docs/handoffs/Q1E-L3/QA_HANDOFF.md`
  - added: 8 files `evidence/A44-*`
- Snapshot, model and check blobs are unchanged (verified in the earlier receipt, `ca8c170`).

## 2. Disposition
- The commit was pushed after Management STOP [#7134957472](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7134957472). That is a **process deviation**, recorded as INFO-A50-1. It is not a scope deviation, because the paths and protected blobs conform.
- By explicit user choice, `2757aa6` is **adopted as the A45 G2 candidate (final tested SHA)**.
- Execution's self-reported evidence (Windows, 30/30×5, 14/14) remains **not G3**. QA request #7135078709 stays void; a fresh QA request is issued under this document.

## 3. Independent QA — LIGHT tier per A47 R3/R4
**Host:** a separately user-opened Claude cloud session (Linux x86_64, Node v22.23.5). It must not be a Design, Management or Execution session.

**Base plan:** the [A45 QA plan](../handoffs/Q1E-L3/A45_INDEPENDENT_G3_QA_PLAN.md), with the following required checks.

### 3.1 Preflight and repository state
1. Record `uname -sm` and `node --version` (must be `v22.23.5`). Otherwise report ENVIRONMENT_BLOCKED and STOP.
2. The first attempted `git ls-remote origin refs/heads/exec/Q1E-L3-synthetic-transaction-feasibility` must exit 0 and return the exact SHA. Otherwise report G3_PREFLIGHT_FAILED and STOP.
3. Make a fresh full clone and a detached clean checkout.
   - Base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8` and START `49cb8d26…` must be ancestors, with no merge commits.
   - The incremental diff must equal the 14 paths above.
   - These blobs must be unchanged: snapshot/model/check `b2d6c0db…`, `8ba2572e…`, `a58135dd…`.
   - The QA_HANDOFF blob `38de9db72e9bf7c0bb93158ce8718250ce5d8643` at START must be an exact byte prefix of the final file.

### 3.2 Tests
4. From `poc/q1e-l3`, run `node scripts/check.mjs`.
5. Run `node --test "test/*.test.mjs"` in five separate processes. Each run needs at least 29 tests, all passing, with exit 0. Record the actual counts.
6. Run `node scripts/mutation-check.mjs`. It needs at least 14 intended kills, and the original 12 must still be killed. The new repository mutants `M-ANCHOR-BYPASS` and `M-SNAP-HEAD` must each be killed by their intended assertion.

### 3.3 QA-owned checks
7. Write QA-owned probes for the A44 matrix core:
   - an omitted or invalid floor is rejected, with no allocation or callback, stage null, and active and witness unchanged;
   - an intact witness/store rollback is rejected;
   - genesis and post-deletion positives pass;
   - a stale negative is rejected;
   - historical K1 is exported after K2/K3 commit and matches the K1 oracle, and K3 is rejected against the K1 oracle.
8. Write at least 3 QA mutants, applied in a scratch copy:
   - whole pinned-head substitution (M-SNAP class);
   - anchor bypass;
   - invalid-floor coercion.
   Each must be killed by a named assertion.
9. Account for all 26 A36 case IDs. C02 must remain UNSUPPORTED_COMPLETENESS.

### 3.4 Network and secrets
10. Run the secret and dependency scan. Record that there were zero non-loopback network targets.

**Not required (LIGHT):** re-creating all 8 historical QA mutant classes individually, and the full per-row expansion beyond item 7.

## 4. Return and STOP
QA posts `QA_REPORT` directly on PR #4. The report cites A50, the exact SHA, and every number above. The verdict may be `PASS_MODEL_ONLY_CANDIDATE` only if all checks hold; otherwise it is PARTIAL with the actual numbers. QA then STOPs, and Management relays the comment ID unchanged. Design rules G4 with receipt and ruling in one commit.

## 5. Unchanged
- P2-L3-QA-1 and P2-L3-QA-2 remain OPEN, and A38 G4 PARTIAL remains, until the new G4.
- MODEL_ONLY: no physical transaction durability or T3 proof. Q1e remains UNSUPPORTED_COMPLETENESS and backup remains NOT_RESTORE_CERTIFIED.
- G5, G6 and G7 remain blocked. No merge, rebase, force-push or new branch. PR #2 is not touched.
