# D007-A58 — WP-02 minimal P2 test-only remediation G1 DRAFT

**Status: G1 DRAFT / NOT_AUTHORIZED.** 2026-11-25 Europe/Berlin. Source: user DEC-7=B, recorded in Management→Execution seq 8 at observed parent `main@7965457075fe991e3cd0e27bb19a39b42843e798`; board seq 8 and [A57](D007_A57_WP02_EXACT_G4_DISPOSITION.md). DEC-7=B approves design only. **Only a new user DEC-8=A recorded by Management against board seq 9 activates this exact G1 under A51.** Before that: no Execution, QA, branch edits or merge. A57 PASS_LOCAL remains historical at the unchanged tested head; P2-WP02-QA-1 OPEN_NON_BLOCKING.

## 1. Exact scope and immutable references

| Item | Value |
| --- | --- |
| Tier | LIGHT (A47 R3) |
| PR / branch | [#6](https://github.com/zyyu1/literature-management-system/pull/6), existing `exec/WP-02-project-paper-read`, OPEN/UNMERGED |
| Original immutable Base | `a0fb04f6d03ac81bbcb35800318c927e278e8b92` |
| Exact incremental START | `222763dad068fc226e500b14250cbb7fffc0a2de` (A57 accepted candidate) |
| **Only writable tracked path** | **`packages/wp-02-project-paper-read/test/identity.test.mjs`** |
| Allowed change | Add exactly one named node:test regression Q2-02-CASE-01, minimal imports/local helper if needed; preserve every existing test and assertion |
| Evidence | Execution and independent QA comments directly on PR #6, plus normal bus file returns on main by each role; no new evidence files or changes to existing QA_HANDOFF on PR |
| Runtime | Separate Execution and independently user-opened QA cloud Linux x86_64, Node v22.23.5; A54 §3/A55 egress wrapper, probe PASS before each test/probe/server command group, all runs inside namespace |

All other paths read-only, including src, support, scripts/mutation-check.mjs (M01..M13 unchanged), frozen fixtures, WP-01, original evidence/QA_HANDOFF, package/CI, tools, UI. No new dependency, source fix, fixture modification, merge/rebase/reset/force push, or real service. Scratch copies outside clone may be modified solely for mutant proof and discarded; never push a mutant. One incremental test commit, no merge commits.

## 2. Required new named regression

Name: `Q2-02-CASE-01 itemKey is case-sensitive; absent case variant has neutral 403` (exact stable prefix Q2-02-CASE-01).

Use unmodified synthetic fixture and existing startServer harness, OWNER session, same Origin and GET route. Assert:
1. Existing `user/fakeLib01/XFAKE001`: 200 and exact identity (libraryType, libraryId, itemKey).
2. Missing case variant `user/fakeLib01/xfake001`: 403, neutral body `{"apiVersion":"v1","error":{"code":"NOT_AVAILABLE"},"outcome":"DEFINITE_FAILURE","dispatched":false}`. Assert fixture lacks that tuple and ordinary absent comparator; do not create a case-variant record.
3. Ordinary missing `user/fakeLib01/XNOPE999`: 403; byte-identical response body and equivalent headers to case variant except documented per-request Date/connection noise. Existing get harness parses body and does not expose raw bytes; a minimal local node:http helper inside this same file may capture raw bodies/headers for the two denial responses, or reuse equivalent in-file test-only mechanism; no shared harness edits. Do not normalize returned bytes.
4. Unchanged state digest and counts; existing startServer teardown checks digest, do not enable allowSeedChange. No new route or source fix.

Do not add unrelated library/Unicode/case normalization policies; this fixes the reported QM12 itemKey gap only.

## 3. Execution work order (inactive until DEC-8=A)

- Verify latest authority, PR still OPEN, first remote ref read returns exact START, clean checkout, immutable Base ancestor, no merges, original fixtures and A55 wrapper blob. STOP on mismatch. Use the existing branch at START, no rebase or merge from moving main.
- Implement the one named regression. Check syntax, targeted test, then WP-02 full suite **44/44** and standalone WP-01 **67/67**, each exit 0. Run existing committed mutation driver **13/13** unchanged.
- In scratch copy only, reproduce QM12: on paper detail exact tuple miss, add a case-insensitive itemKey fallback constrained to same ownerScope/libraryType/libraryId, such that lowercase request returns the existing uppercase paper. Keep all other behavior unchanged. Record exact scratch patch and command. New named test must fail by ERR_ASSERTION on the 403 expectation (actual 200), not a parse/startup/timeout failure; unmutated targeted test must pass. Prefer demonstrate old test suite survives same QM12 at START (43/43) to corroborate prior QA; independent QA is required to do this paired comparison. Restore/remove scratch, recheck tracked diff and clean status after committing.
- Push one test-only commit to same PR; post exact HEAD, START, diff, counts/exit codes, wrapper/probe, named mutant assertion and sanitized evidence in PR comment. Write Execution→QA next sequence citing A58 and exact HEAD. STOP.

## 4. Independent G3 QA plan (inactive until Execution return)

Separate user-opened cloud session, first remote ref read success at exact new candidate, fresh full detached clone. Verify original Base and START ancestors, exactly one incremental commit and one modified tracked file, no merges; inspect diff: only new test/minimal local test support; source, fixture, WP-01, mutation driver, historic evidence and original tests unchanged. A55 wrapper and egress probe, runtime recorded, no network outside loopback for test/probe/server. In scratch only:
- Unmutated: syntax check, named test green, WP-02 full suite 44/44 and standalone WP-01 67/67, exit 0; original M01..M13 13/13.
- Independently reproduce QM12 case-insensitive fallback, same scope and exact miss. At START full old suite remains green 43/43 (otherwise STOP and report mismatch to historical finding). On candidate new named regression fails with ERR_ASSERTION on expected 403 vs actual 200; confirm uppercase request still succeeds and no incidental startup/transport failure. Capture exact patch and named assertion; scratch only. Distinguish original driver M12 (re-import) from QA QM12 (case fallback).
- QA-owned raw HTTP probe verifies exact uppercase 200, lowercase and ordinary missing byte-identical neutral 403 (headers identical apart from documented per-request noise), unchanged digest/counts. Run baseline and mutated probe as appropriate; ensure meaningful mutant changes response, not merely internal source.
- Privacy/secret/dependency scan and clean tree. Report P0/P1/P2, command exits, exact SHA and changed paths. Report PASS_LOCAL only when all mandatory checks hold. A47 LIGHT uses one full run each, because this is deterministic test-only, not timing/flakiness; prior A57 five-run evidence remains historical at START, not claimed for candidate.
- QA posts report on PR, writes QA→Design next sequence, then STOP. No code edits on PR branch.

## 5. Gates and STOP

STOP on head/Base/fixture/egress mismatch, unauthorized diff, existing test alteration, original test/driver regression, source needing modification, QM12 survives or fails for wrong reason, real data, scope leak, or independent QA unavailable. Do not relax requirements or fix outside scope. G2/G3/new G4 NOT_RUN/NOT_REVIEWED until approved and evidenced. Only a new Design exact-SHA G4 may close P2-WP02-QA-1. G5 merge separately authorized; WP-03 writes not authorized and P2 must close first; G6/G7 blocked. PR #2/#4 remain OPEN archives, frozen UI unchanged. No provider/durable storage proof.

**Activation:** DEC-8=A in Management seq referencing board seq 9 and this exact START; dispatch only this file's scope. DEC-8=B defers; no execution.
