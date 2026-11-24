# D007-A48 — R10 read-only independent QA on cloud Linux host (LIGHT tier)

**User approval:** 2026-11-24 16:11 Europe/Berlin, user selected **A** ("R10 只读 QA") in the Design chat. Recorded here per [D007-A47 R1](../governance/D007_A47_PROCESS_SIMPLIFICATION.md) (no separate receipt commit). Observed parent `main@0dc1650a6a902a02c17d5699e9e13458e8b9434a`.
**Type:** QA_DISPATCH_ONLY. No G1, no Execution, no change to PR #2 content. G3 NOT_RUN at publication; G4 NOT_REVIEWED.

## 1. Fixed identity (verified by Design via GitHub REST at publication)
- [PR #2](https://github.com/zyyu1/literature-management-system/pull/2) OPEN/unmerged, branch `exec/POC-001-webdav-feasibility`, HEAD **`a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`**, immutable Base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, latest comment [QA #7133028128](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7133028128).
- PR #4 untouched.

## 2. Relation to earlier authority
Reactivates the stopped [A43 read-only Linux QA](D007_A43_R10_LINUX_READ_ONLY_QA_AUTHORIZATION.md) / [work order](../handoffs/POC-001/R10_LINUX_READ_ONLY_QA_WORK_ORDER.md) on the same exact SHA, with these A47 changes:
- **Host (A47 R4):** a separately user-opened Claude cloud session (Linux x86_64, Node v22.23.5). Not the Design, Management or Execution session.
- **LIGHT tier (A47 R3):** the DOC bytes (B09||S||B10) and first-attempt preflight already PASSED at this exact SHA ([A42](D007_A42_R10_DOC_ONLY_G4_PARTIAL_DISPOSITION.md)); QA only needs to confirm the head and diff are unchanged, not repeat the raw-byte proof. The 17 individual suite runs and the 62-probe two-writer recorder are **not** required again. Full suite ×5 is retained because the open gate (REG-01) involves a timing flake.

## 3. Required QA checks
1. Record `uname -sm`, `node --version` (must be `v22.23.5`), `git --version`. Otherwise ENVIRONMENT_BLOCKED / STOP.
2. First attempted `git ls-remote origin refs/heads/exec/POC-001-webdav-feasibility` exits 0 and equals the exact SHA; else G3_PREFLIGHT_FAILED / STOP.
3. Fresh clone, detached checkout at exact SHA; `git diff --stat 39f34d02e1a982ce7ba4be26c30c09c7a2ed663e a9131ac2521edc50d1c96f90efbf1a987b7bf0d5` shows only `docs/handoffs/POC-001/QA_HANDOFF.md`.
4. From `poc/001`: `node scripts/check.mjs`; `node --test "test/*.test.mjs"` in **five separate processes**, each must be 209/209 exit 0 (record every count and any failing test name).
5. `node scripts/mutation-check.mjs` → 85/85 intended kills; `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` clean; `npm ls --all` no new dependencies.
6. At least one QA-authored mutant of the R10 cleanup guard (`src/util.mjs`), applied in a scratch copy, killed by a named existing assertion.
7. Loopback/synthetic only; zero real-service requests. Working tree clean afterwards.

## 4. Return and STOP
QA posts its own `QA_REPORT` comment on PR #2 citing A48, exact SHA, host facts, preflight, 5 suite counts/exits, mutation, own mutant, secrets/deps, findings (P0/P1/P2/INFO) and verdict (`PASS_LOCAL_CANDIDATE` only if all of §3 pass, else PARTIAL with actual numbers). Then STOP. Management relays comment ID unchanged to Design. Design rules G4 (receipt + ruling in one commit per A47 R1).

## 5. Unchanged
A42 G4 PARTIAL stays in force until the new G4. P2-R09-QA-1 OPEN, P2-R08-QA-1 OPEN/PARTIAL, INFO-1/C9 INFO. Windows results informational (A47 R4). G5 MERGE / G6 ACCESS-02 / G7 DEPLOY NOT_AUTHORIZED; POC BLOCKED_REAL_SERVICE.
