# D007-A64 — WP-02 final exact-SHA G4 PASS_LOCAL; G5 decision

**Design ruling — 2026-11-25 Europe/Berlin.** Observed parent `main@c95906ff613dfb646638b35d45e34507bc95bfb0`. User standing instruction (A62) read/verify/rule/publish next task directly within authority. This receipt and ruling are one commit (A47 R1). G5 merge requires separate explicit user DEC.

## 1. Verified evidence

PR #6 OPEN/UNMERGED, mergeable reported, exact HEAD `8751dd2b4f041d5a17af894ac9cca8bd28560d66`; A63 START `ab4a37c8905ebc9d3f889164c2f8164c9286051d`; immutable A56 Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`. Management seq 15, Execution seq 13, QA seq 9 DONE. Read original [Execution report #7165782458](https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7165782458) and [independent QA report #7166250750](https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7166250750). Design independently verified actual parent, one incremental commit and exactly one path (+66/-1), read old and new identity test: original tests/assertions retained; adds only one named Q2-02-CASE-01 and in-file raw HTTP helper/imports. QA verified identity blob `48a6b38f9adbffb12fcc202653e1264df4701915`, SHA-256 `6e764d3bbab500e59e7fba7cc7f087ffe873a6e7424f808868fc1b2f0ba6303e`, frozen fixtures, A62 helper and Q2-11 blobs, Base 19 + overlay = 20 WP-01 files, other 17 unchanged. All other A63 files unchanged by exact one-path diff. No product-source changes in this continuation.

QA reported Windows 10.0.19045 x64, Node v22.23.5, fresh full detached clone, first remote exact SHA success, A59 user-controlled offline interval, independent probes 11/11 PASS, no usable external path, no machine changes, clean allowlisted env, disclosed TEMP/TMP scratch workaround. Syntax 1/1, WP-02 44/44, WP-01 67/67 including nested, identity 8/8, original driver 13/13, all exit 0/no skips/todos. QM12 paired control: START + same constrained case-insensitive fallback 43/43 exit 0; candidate + QM12 43 pass / 1 fail, only Q2-02-CASE-01, ERR_ASSERTION expected 403 actual 200, uppercase 200 retained. QA-owned raw HTTP 13/13: exact identity, both absent tuples 403 with identical 100-byte neutral JSON and stable headers; counts 4/4/6 and digest unchanged. No P0/P1/P2. Linux runtime NOT_RUN. A60/A61/A62 G4 at A63 START remains historical and infrastructure unchanged. One deterministic run per A47 LIGHT; no five-run claim on this SHA.

Minor metadata discrepancy: Management seq 15 header says 15:50, Execution seq 13 header 15:47. Actual main Git history establishes ordering: Management commit `51864e6fc7d181531efadade97ae091a84ad69b1` precedes Execution `92eef999c4f02e85506c8e14072b96c551ba307b`, followed by QA `c95906ff613dfb646638b35d45e34507bc95bfb0`. Treat header times as informational; no evidence of unauthorized dispatch order in Git history.

## 2. Ruling

**G2 ACCEPTED, G3 VERIFIED, G4 PASS_LOCAL at exact SHA `8751dd2b4f041d5a17af894ac9cca8bd28560d66`** for WP-02 synthetic read-only Project/Paper slice and its approved test-only infrastructure. **P2-WP02-QA-1 CLOSED_LOCAL** (QM12 targeted coverage and independent paired evidence). Five platform findings remain CLOSED_LOCAL under A63; no open P0/P1/P2 reported for this candidate. Prior A57/A63 dispositions stay historical. Windows runtime verified only for tested offline host; Linux new-SHA runtime NOT_RUN, no dual-platform certification. No claim of real provider, durable storage, real identity/TLS/browser/device, deployed frontend, write capability or completion of frozen U6 scenarios. G5 remains NOT_AUTHORIZED pending DEC-10; G6/G7 NOT_AUTHORIZED. WP-03 requires separate G1 design and approval; original P2 prerequisite now satisfied but no automatic write authorization.

## 3. DEC-10 — optional exact-SHA G5 merge, no automatic merge

A (recommended): authorize Management to merge **only PR #6 exact tested HEAD `8751dd2b4f041d5a17af894ac9cca8bd28560d66`** into main using a normal merge commit, preserving ancestry and historical evidence. No squash/rebase/force-push or branch deletion; no code changes, no other PRs, no deployment or real service. The cumulative Base..HEAD diff is six commits / 30 paths: original A56 27 WP-02 paths + three WP-01 test-infrastructure paths authorized by A60/A61/A62. WP-02 path changes include A58 and the approved Q2-11/transport overlay. Design verified cumulative authorized paths and disjoint current Base..main changes (docs only). PR description is original historical scope; A60/A61/A62/A63/A64 are authoritative overlays. At dispatch and immediately before merge verify latest exact remote HEAD, OPEN/unmerged/non-draft, mergeable, immutable Base ancestor, no STOP/withdrawal, and current main changes since Base do not alter tested files or introduce a conflicting/runtime-affecting change. Recheck actual full path list and required GitHub checks/branch protection; no bypass. Use merge API with exact expected head SHA; if stale, conflict, unknown check, unexpected scope or required integration validation missing, STOP; no automatic resolution. After merge verify actual merge commit has tested head as parent/ancestor, exact tested file blobs on merged main, pre-merge main history and docs preserved, actual merged diff confined to allowed paths, fixtures and protected bytes unchanged, PR state merged; report SHA and evidence. If main changed concurrently, report actual state, do not claim verification without proof, do not reset/revert automatically. If runtime-affecting integration change discovered, Design requests fresh exact-SHA QA rather than merging unverified code.

B: defer merge; keep PR #6 open at accepted HEAD, no branch edits, no G5. No further scope authorized. Both choices leave G6/G7 blocked, PR #2/#4 archive state and frozen UI untouched.

Cumulative exact paths (Base..HEAD; all must be preserved and no new path allowed):
- `docs/handoffs/WP-02/QA_HANDOFF.md`
- `packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs`
- `packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs`
- `packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs`
- `packages/wp-02-project-paper-read/README.md`
- `packages/wp-02-project-paper-read/evidence/WP01-regression-run1.tap`
- `packages/wp-02-project-paper-read/evidence/WP01-regression-run2.tap`
- `packages/wp-02-project-paper-read/evidence/WP01-regression-run3.tap`
- `packages/wp-02-project-paper-read/evidence/WP01-regression-run4.tap`
- `packages/wp-02-project-paper-read/evidence/WP01-regression-run5.tap`
- `packages/wp-02-project-paper-read/evidence/WP02-SUMMARY.md`
- `packages/wp-02-project-paper-read/evidence/WP02-egress-probe.txt`
- `packages/wp-02-project-paper-read/evidence/WP02-mutation.txt`
- `packages/wp-02-project-paper-read/evidence/WP02-node-test-run1.tap`
- `packages/wp-02-project-paper-read/evidence/WP02-node-test-run2.tap`
- `packages/wp-02-project-paper-read/evidence/WP02-node-test-run3.tap`
- `packages/wp-02-project-paper-read/evidence/WP02-node-test-run4.tap`
- `packages/wp-02-project-paper-read/evidence/WP02-node-test-run5.tap`
- `packages/wp-02-project-paper-read/package.json`
- `packages/wp-02-project-paper-read/scripts/mutation-check.mjs`
- `packages/wp-02-project-paper-read/src/catalog.mjs`
- `packages/wp-02-project-paper-read/src/server.mjs`
- `packages/wp-02-project-paper-read/support/harness.mjs`
- `packages/wp-02-project-paper-read/test/auth-neutral.test.mjs`
- `packages/wp-02-project-paper-read/test/identity.test.mjs`
- `packages/wp-02-project-paper-read/test/projects-list.test.mjs`
- `packages/wp-02-project-paper-read/test/readonly.test.mjs`
- `packages/wp-02-project-paper-read/test/scope-associations.test.mjs`
- `packages/wp-02-project-paper-read/test/transport.test.mjs`
- `packages/wp-02-project-paper-read/test/wp01-regression.test.mjs`

## 4. Next

Management presents/records explicit DEC-10 in its window (A51). If A, returns merge proof via file bus; Design verifies and publishes next WP-03 synthetic guarded-write G1 design/decision, or reports blocker. If B, keep open and consider independent next design scope only. No WP-03 source work until new authority. Real P0-STORE gate remains blocked for durable writes; local synthetic success is not storage GO. G5 approval here does not cover other packages, G6/G7 or release. This commit changes design docs only.

**Design STOP — WAITING FOR DEC-10 (G5).**
