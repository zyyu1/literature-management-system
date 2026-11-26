# D007-A81 — WP-03-R1 exact-SHA G4 PASS_LOCAL; DEC-21 G5 decision

**Design ruling — 2026-11-26 Europe/Berlin.** Observed parent `main@b64fbfcbd973abdef8037db2a6cfdc38a6bd86b7`. New Design window (handoff `55b4cdc9519d761bd7c1b6fa4e6b1e2805a1646a`) acted on an explicit user poll. Receipt and ruling are one commit (A47 R1, A64 precedent). G5 merge requires a separate explicit user DEC.

## 1. Verified evidence

- Since handoff `55b4cdc`, main changed only `docs/bus/MANAGEMENT_TO_EXECUTION.md` ([Management38](https://github.com/zyyu1/literature-management-system/blob/b64fbfcbd973abdef8037db2a6cfdc38a6bd86b7/docs/bus/MANAGEMENT_TO_EXECUTION.md), commit `43cf886645f280907c8f5f710efdc8a33e8c13a5`, 19:12 +01) and `docs/bus/QA_TO_DESIGN.md` ([QA17](https://github.com/zyyu1/literature-management-system/blob/b64fbfcbd973abdef8037db2a6cfdc38a6bd86b7/docs/bus/QA_TO_DESIGN.md), commit `b64fbfcbd973abdef8037db2a6cfdc38a6bd86b7`, 19:22 +01). Execution bus stays 25 (STOP); no Execution task issued.
- Management38 records **DEC-20 = A** (user choice) and authorizes only the nine A80 §2 categories, same exact SHA, zero candidate change, no full G3 repeat. Git order: Management38 commit precedes QA's first subject read (`18:13:58.813Z` = 19:13:58 +01) and QA comment.
- Original [QA17 #7200384830](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7200384830) (18:22:24Z, unedited) read in full; bus summary matches it. Cites QA15 #7199636809, QA16 #7199809939 and A80.
- Live PR #7: OPEN, unmerged, non-draft, 3 commits, exact HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`, mergeable `clean`, base `main`; no newer PR comment, review or review comment.

## 2. Check against A80 §2

QA reports Windows 10.0.19045 x64, Node v22.23.5 x64, git 2.49.0; first and only subject read exit 0, stderr empty, exact SHA, no retry; fresh full non-shallow detached clone, `core.autocrlf=false`, 222 tracked, B..HEAD 3 single-parent commits, Base 200 unchanged, modes 100644/100755 only, 0 symlinks; static audit `CANDIDATE_SCOPE_OK`. A59 offline proof `18:20:24Z`, G0/G1 pre/post guard+probe PASS, children ended before reconnect; UDP no-error not counted.

1. **Symlink — ACCEPTED (committed-mode proof).** Real Git `120000` tree entry, actual candidate `readTree` → `SYMLINK_TREE_NON_REGULAR_MODE: link-to-readme (120000)`. A80 forbids elevation and allows this route; QA states privilege was not assumed rather than demonstrating its absence. Worktree/filesystem symlink proof (`walkWorktree`) **NOT_RUN** — residual INFO, not a blocker: committed type/mode is rejected, the candidate has 0 symlinks, and the worktree path is additionally guarded by clean-checkout and worktree=HEAD checks.
2. **Existing unauthorized S-added path — ACCEPTED.** `packages/wp-03-guarded-r1-writes/src/model.mjs` (in S−B, outside the three A72 paths) byte-change only: full audit rejects (`A72_CHANGED_PATH_COUNT: 4`, masking explained); actual extracted `verifyStartTreeScope` control passes and negative hits `A72_PATH_CHANGED_OUTSIDE_SCOPE`.
3. **M4 same-input bypass — ACCEPTED (full-audit proof).** Same forbidden extra test path; real audit rejects; eight named edits all limited to extra-path/count/scope enforcement make the patched full audit accept (`CANDIDATE_SCOPE_OK`, 223 worktree paths); history, expected A66/A72 paths, Base bytes, clean checkout, worktree=HEAD and mode checks retained; independent `S..HEAD` diff expectation kills it.
4. **Nested duplicate — ACCEPTED.** Actual `assertTapTestOk`, real `2 !== 1`; only the two count equalities relaxed; mutant accepts; independent expectation kills.
5. **Duplicate header — ACCEPTED.** Actual `parseTapSummary`, second `TAP version 13` before plan rejected; mutant only skips that line; other malformed lines still fail; killed.
6. **Timeout — ACCEPTED.** `ETIMEDOUT` object with green stdout rejected before summary; same stdout without error → `FULL`.
7. **Failed nested proof — ACCEPTED.** Helper `0 !== 1` and strict pipeline failing-record rejection; distinguished from missing/duplicate.
8. **Flag set/unset — ACCEPTED.** Old `0fcad9c` relaxed helper unset accepts `HOST_PRECONDITION_ONLY` (contrast); current path rejects with flag unset and `=1`; no waiver; env restored; no candidate flag.
9. **Case variants — ACCEPTED.** Upper/mixed bailout, `NOT OK`/`Not Ok`, `# SkIp`/`# TODO`/`# SKIP` rejected by actual parser; diagnostic merely mentioning the words accepted.

Attempt-1 of this round (8/9; QA harness wrote a patched file inside the disposable repo, tripping its own clean-checkout control) is preserved separately and not counted, consistent with the A79 treatment of QA15 attempt-1. Its offline status is not separately recorded; it is not evidence and involved only local synthetic inputs — INFO only. Design reviewed report-level evidence and remote Git facts; local raw logs (`summary.json` `af8f398f…89e88`, `targeted.json` `0a43bc72…82d6`) were not directly accessible to Design.

## 3. Design independent checks for G4/G5

- B `1684cea5623c8421e16c328c7f1464e8932d3118` is an ancestor of main; B..HEAD = exactly 22 added paths (§5), no modifications or deletions.
- The 63 main commits since B touch no `packages/`, `tools/` or protected fixture path; the only WP-03 docs changed on main (`docs/handoffs/WP-03/DESIGN.md`, `QA_INSTRUCTION.md`) are distinct from the candidate's `docs/handoffs/WP-03/QA_HANDOFF.md`.
- Q3-11 at HEAD pins an explicit `PROTECTED_INVENTORY` (WP-01/WP-02 packages, both fixtures, `tools/offline`) and states it tolerates unrelated main-only docs; the full candidate scope audit is `scripts/verify-candidate-scope.mjs`, outside `node --test` discovery. This is the separation A66 required for P2.

## 4. Ruling

Combining same-SHA evidence: A74/A76 G2 (A78), QA15 main gates (A79), QA16 records (A80) and QA17 nine categories now cover the full A72 §3 matrix with no actual FAIL and no new P0/P1/P2.

**G2 ACCEPTED, G3 VERIFIED, G4 PASS_LOCAL at exact SHA `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`** for WP-03-R1 LOCAL_SYNTHETIC_ONLY guarded routine writes and its approved test-only infrastructure.

- **P1-WP03-DESIGN-1 CLOSED_LOCAL**: the default relaxed upstream path is gone; strict upstream WP-01 67/67 and WP-02 44/44 (QA15), M2 guard (A78/QA15) and both flag states rejecting (QA17 #8). The historical A66 online/unguarded runs remain a recorded deviation and are not erased.
- **P2-WP03-DESIGN-2 CLOSED_LOCAL at source/design level** (§3). A real post-merge test run on main is NOT_RUN; any failure after merge reopens it.
- Residual INFO: Linux runtime NOT_RUN (Windows offline host only, no dual-platform certification); filesystem symlink proof NOT_RUN; report-level review; attempt-1 offline status not recorded.
- No claim of real storage, R2, P0-STORE, durable writes, real identity/TLS/browser/device, UI/U6 completion, real Zotero/Nutstore, real services or deployment. G5/G6/G7 NOT_AUTHORIZED. A70/A71 remain suspended (Node 24 migration not needed for this gate).

## 5. DEC-21 — optional exact-SHA G5 merge, no automatic merge

**A (recommended):** authorize Management to merge **only PR #7 at exact tested HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`** into main with a normal merge commit, preserving ancestry and history. No squash, rebase, force-push, branch deletion, code change, other PR, deployment or real service. At dispatch and immediately before merging, verify: live HEAD still exact, OPEN/unmerged/non-draft, mergeable, B ancestor of main, no STOP/withdrawal, and main since B still touches none of the paths below or the protected inventory; any drift → STOP. Management returns the merge commit SHA via its bus; Design then verifies G5 by checking that the merge parents are (main tip, `c40e927…`) and that all 22 blobs and the protected inventory at the merge commit equal HEAD/B. No post-merge test run is authorized by A; that stays a separate choice.

**B:** defer; keep PR #7 OPEN at the accepted HEAD (like PR #2/#4), no branch edits, no G5.

Neither choice authorizes WP-04, R2, P0-STORE, real persistence, frozen UI change, G6/G7, or touching PR #2/#4.

Cumulative exact paths (B..HEAD; all must be preserved, no new path allowed):
- `docs/handoffs/WP-03/QA_HANDOFF.md`
- `packages/wp-03-guarded-r1-writes/README.md`
- `packages/wp-03-guarded-r1-writes/package.json`
- `packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs`
- `packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs`
- `packages/wp-03-guarded-r1-writes/src/contract.mjs`
- `packages/wp-03-guarded-r1-writes/src/fixtures.mjs`
- `packages/wp-03-guarded-r1-writes/src/model.mjs`
- `packages/wp-03-guarded-r1-writes/src/server.mjs`
- `packages/wp-03-guarded-r1-writes/src/strict-json.mjs`
- `packages/wp-03-guarded-r1-writes/support/harness.mjs`
- `packages/wp-03-guarded-r1-writes/test/auth-negative.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/faults.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/fixture-identity.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/important.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/operation-ledger.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/preconditions.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/project-writes.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/r2-negative.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/reading-status.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/transport.test.mjs`
- `packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs`

## 6. Next

Management presents DEC-21 to the user and records it (A51). A: fresh Management seq39 with merge-only instructions; merge proof returned; Design verifies G5 and only then drafts the next design scope for a new user decision. B: no dispatch. No QA or Execution task is opened by this ruling. This commit changes design/governance docs only.

**Design STOP — WAITING FOR DEC-21 (G5).**
