# D007-A61 — A60 helper filename correction

**USER APPROVED MINIMAL DESIGN CORRECTION — 2026-11-25 Europe/Berlin.** User instructed “继续” after Design identified A61 as the next required action. Observed parent `main@a0f414b859772176d2907190e57113a4c67f1e0f`. DEC-9=A (board seq 11, approval record seq 12, Management seq 11) remains valid for the same infrastructure task. Management seq 12 STOP and Execution seq 10 WAITING acknowledge Execution seq 9 STOP. No accepted A60 commit; PR #6 OPEN/UNMERGED at `222763dad068fc226e500b14250cbb7fffc0a2de`. A58 remains STOP, P2-WP02-QA-1 OPEN_NON_BLOCKING. Fresh Management dispatch required; no new DEC for this one-for-one filename correction.

## 1. Receipt and root cause

Execution seq 9 reported A59 offline egress PASS, syntax 5/5, WP-01 68/68 (67 original tests plus a discovered helper), WP-02 42/43 (Q2-11 count 68 != 67), driver exit 2 BASELINE_NOT_GREEN. Scratch policy cases 19/19, helper mutants 5/5, three manifest negative cases reportedly passed; overlay mutant inconclusive. No PR push or comment; QA not run. Node v22.23.5 default test discovery matches test-*.mjs even under support/. This is a Design naming error, not evidence of a new product defect. The reported local code/evidence is not accessible as an exact remote candidate and is not accepted. Renaming is expected to remove this specific discovery conflict, not proof of a full green run.

## 2. Sole change to A60 scope

Replace **only** the new helper path `packages/wp-01-synthetic-auth-api/support/test-platform.mjs` with **`packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`** in every normative A60 scope, import and overlay reference. The former filename is no longer writable/allowed in the candidate and must not exist there. All other A60 requirements remain binding, including the read-only fail-closed Windows inventory policy, Linux lo-only guard, original exact runtime, independent QA and the full manifest and mutation evidence.

Exact five tracked paths relative to START:
1. `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs`
2. `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs`
3. `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs` (new)
4. `packages/wp-02-project-paper-read/test/transport.test.mjs`
5. `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs`

Adjust relevant imports and explicit A60 hash overlay to the final path/actual final bytes. The original 19-entry BASE_MANIFEST remains literally unchanged, two authorized existing test hashes replaced only through overlay, exactly one new helper hash, 20 total WP-01 files, other 17 bytes unchanged. Independently derive overlay from candidate Git blobs. No changes to default test discovery, test commands, package.json, nested spawn, existing functional assertions, original harness, driver, src, fixtures, historic evidence, dependency/CI/wrapper/UI. No skips/todos or count waivers. No A58 identity test in this stage.

## 3. Restart, tests and QA

Management must issue next seq 13 referencing board seq 13, original DEC-9=A, A60 and A61, same PR #6 / branch `exec/WP-02-project-paper-read`, original immutable Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`, exact START `222763dad068fc226e500b14250cbb7fffc0a2de`. Prior seq 12 STOP is historical, not restart authority. Recheck latest authorization and exact HEAD before edits/commit/push/QA request. One incremental test-infrastructure-only commit from START, no merge/rebase/reset/force push. Existing scratch work may be reused only after clean START, full five-path diff review and current authority. Do not treat scratch results as acceptance.

Execution and independent Windows QA must rerun A60 §3–5 unchanged after correction: fresh A46/A59 preflight and actual OS isolation/probes, Node v22.23.5 x64, syntax and ordinary default `node --test` discovery, WP-01 exactly 67/67, WP-02 exactly 43/43, nested Q2-11 exact 67/67, committed driver 13/13, all exit 0. Confirm helper not a discovered test and no test skipped. All platform guard cases and named mutations, including prior inconclusive overlay mutant, must be demonstrated afresh; Q2-11 extra file, missing file, changed unapproved byte, and changed approved byte without overlay update all detected. Independently review actual Windows inventory/linkage including active non-loopback paths with no default route; do not accept a disconnected-interface assumption or scratch mock alone as isolation. A60 evidence and exact SHA comments / next bus returns / STOP unchanged. No report of Linux runtime certification unless actually run. All new results pending.

Only Design G4 at new exact SHA can accept A60+A61; A58 restart requires subsequent Design continuation at that accepted START. G5 separately authorized; G6/G7 NOT_AUTHORIZED, WP-03 blocked pending P2 closure, PR #2/#4 and frozen UI unchanged. No product or real service scope expansion.

**Design STOP — WAITING FOR MANAGEMENT REDISPATCH.**
