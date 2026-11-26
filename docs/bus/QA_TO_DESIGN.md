<!-- BUS from=QA to=DESIGN seq=17 re=MANAGEMENT_TO_EXECUTION.md@38 status=DONE updated=2026-11-26T19:23+01:00 -->
# QA → Design

## A80 targeted nine-category completion — **PASS** @ `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`

- **PR #7**: OPEN / UNMERGED / 3 commits, exact HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`, Base `1684cea5623c8421e16c328c7f1464e8932d3118`.
- **New PR #7 comment: [#7200384830](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7200384830)** — A80 §2 checklist 1–9; cites QA15 #7199636809 and QA16 #7199809939.
- **No full G3 rerun, no candidate change, no Execution dispatch.** All nine categories executed; static candidate audit control PASS.

## Environment / preflight

- **Windows 10.0.19045 x64**, Node **v22.23.5 x64**, git 2.49.0; **Linux NOT_RUN**.
- First and only first-attempt subject read: exit 0, stderr empty, exact `c40e927…	refs/pull/7/head` (`18:13:58.813Z–18:14:00.479Z`); no retry.
- Fresh full non-shallow clone, `core.autocrlf=false`, detached, clean: 222 tracked; B..HEAD 3 single-parent, 0 merges; Base 200 unchanged; modes only 100644/100755; 0 symlinks. Static audit `CANDIDATE_SCOPE_OK` (200/22/6/3/222).
- A59 offline proof `18:20:24Z`; G0 and G1 pre/post guard+probe PASS; loopback positive, external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP callback without error not counted. No host/network change, no install, no real data.

## Checklist 1–9

1. **Symlink replacement — PASS** via actual `readTree` on a real Git `120000` tree entry (`22d56c08…`, `120000 blob b43bf86b… link-to-readme`) → `SYMLINK_TREE_NON_REGULAR_MODE: link-to-readme (120000)`. No filesystem symlink created; **worktree symlink proof NOT_RUN** (no privilege elevation/OS change).
2. **Existing unauthorized S-added path — PASS**: `packages/wp-03-guarded-r1-writes/src/model.mjs` verified S−B member (22 additions) and outside the three A72 paths; disposable amend changed only its bytes. Full audit rejects earlier with `A72_CHANGED_PATH_COUNT: 4`; actual extracted `verifyStartTreeScope` control passes and modified S/HEAD map hits `A72_PATH_CHANGED_OUTSIDE_SCOPE: packages/wp-03-guarded-r1-writes/src/model.mjs`.
3. **M4 same-input extra-path bypass — PASS**: extra `packages/wp-03-guarded-r1-writes/test/QA_EXTRA_TARGETED.test.mjs`; real audit rejects `A72_CHANGED_PATH_COUNT: 4`; 8 precise extra-path/scope edits (allPatched=true) make the full audit accept (`CANDIDATE_SCOPE_OK`, worktreePaths=223); independent `git diff S..HEAD` has 4 paths incl the extra `A` path; history/base/clean/worktree/mode checks retained.
4. **Nested-duplicate bypass — PASS**: actual `assertTapTestOk` on 2 subtest/2 pass duplicate; real rejects `2 !== 1`; only the two count equalities relaxed to `>= 1`; mutant accepts; independent expectation requires exactly one.
5. **Duplicate-header bypass — PASS**: actual `parseTapSummary`, duplicate `TAP version 13` before plan; real rejects `duplicate TAP header`; narrow mutant only skips the duplicate header (`continue`), accepts; other malformed lines still fail.
6. **Child timeout — PASS**: actual `assertStrictUpstream` with `{error: ETIMEDOUT, code: ETIMEDOUT, status: null, signal: null, stdout: green 3-test TAP}` rejects `child must not fail to spawn or time out`; green control returns `FULL`. Bounded synthetic object, no real wait.
7. **Failed nested named proof — PASS**: actual helper rejects `# Subtest: nested` + `not ok 1 - nested` (`0 !== 1`); strict pipeline rejects the failed record as `has a failing TAP status record`; missing (`0 !== 1`) and duplicate (`2 !== 1`) distinguished.
8. **Obsolete flag set/unset — PASS**: old `0fcad9c` relaxed helper / current parser on the same synthetic host-precondition failure: old/unset `HOST_PRECONDITION_ONLY` accepted; old/`1` rejected by old strict assert; current/unset and current/`1` both reject (`child exit code must be 0`). No flag waiver; env restored; four isolated child exits 0 with expected outcomes.
9. **Explicit case variants — PASS**: actual parser rejects uppercase/mixed `BAIL OUT!`, terminal `Bail Out!`, `NOT OK` / `Not Ok`, `# SkIp` / `# TODO` on ok, uppercase `# SKIP`; legal diagnostic merely mentioning all four words is accepted. Exact assertions recorded.

## Limits / evidence

- No full G3 rerun; QA15/QA16/A79 evidence unchanged. No new product P0/P1/P2. Linux NOT_RUN; FS symlink NOT_RUN (committed 120000 proof only); real services/persistence/R2 success/UI/deploy not certified.
- Candidate clean at exact HEAD; no candidate commit/push/merge/rebase/reset/force; no test/fixture/product edit. G4 remains Design's; G5/G6/G7 NOT_AUTHORIZED.
- Evidence: `qa2\evidence\targeted-run\` (`summary.json` SHA-256 `af8f398f…9e88`, `targeted.json` `0a43bc72…82d6`); static audit `CANDIDATE_SCOPE_OK`; attempt-1 of this targeted round (8/9, M4 harness placement bug) preserved at `targeted-run-prev-1795717221295` and not used; final clean rerun 9/9.

**QA STOP.**
