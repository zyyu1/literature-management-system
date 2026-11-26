# D007-A83 — Post-merge offline regression on main (DRAFT for user approval)

**Design draft — 2026-11-26 Europe/Berlin.** Observed parent `main@ca47f0ca68040d4239b865382ad9f24ed9d37e26`. [Management40](https://github.com/zyyu1/literature-management-system/blob/ca47f0ca68040d4239b865382ad9f24ed9d37e26/docs/bus/MANAGEMENT_TO_EXECUTION.md) records **DEC-22 = A** and asks Design for this draft. Nothing here is authorized until the user approves it (DEC-23) and Management dispatches. No Execution task; zero code change.

## 1. Purpose
Turn P2-WP03-DESIGN-2 from a source-level closure (A81) into runtime evidence: the ordinary suites of WP-01, WP-02 and WP-03 pass on real main, which carries main-only docs that are absent from Base `1684cea…`. This is a regression check, not a new G3 and not a re-acceptance of WP-03.

## 2. Subject
- Subject = **exact main SHA S_main read by QA's first and only `git ls-remote <repo> refs/heads/main`** (exit 0, command/time/stdout/stderr saved, no retry waiver).
- Preconditions on S_main (read-only): merge `6cc8e2ad1f65f752d9846012531e52d9af647f3b` is an ancestor; `6cc8e2a..S_main` changes only `docs/` paths (no `packages/`, `tools/`, fixtures); the 22 WP-03 blobs equal tested HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`. Any other change → STOP and report.
- Fresh full detached clone at S_main, `core.autocrlf=false`, clean worktree, no shared clone with Management/Execution.

## 3. Environment (same standard as QA15/QA17)
Node exactly v22.23.5 x64; A59 Windows offline host, or already eligible A54/A55 Linux. Linux is optional: if not run, record **Linux NOT_RUN**. Command-local TLS (OpenSSL + existing CA/helper, verification on) for the one ref read and clone only. All test processes and children inside the isolated offline boundary, pre/post guard + probe per group, sanitized OS facts, all children ended before reconnect. No host/network change, install, privilege escalation or real data. Unavailable → STOP.

## 4. Commands (only these)
- G1 WP-01: `cd packages/wp-01-synthetic-auth-api && node --test` → expect **67/67**, exit 0.
- G2 WP-02: `cd packages/wp-02-project-paper-read && node --test` (no npm script; same runner) → expect **44/44** incl. nested WP-01 67/67, exit 0.
- G3 WP-03: `cd packages/wp-03-guarded-r1-writes && node --test` → expect **103/103** incl. Q3-11 (protected inventory 56 blobs, strict upstream 67 and 44), exit 0.
- Each: zero fail/skip/todo/cancelled, raw TAP saved, one run each, no retries counted.

**Excluded by design:** `scripts/verify-candidate-scope.mjs` (candidate-branch audit pinned to the exact PR history and 222 paths; it is expected to reject main and is not a regression signal), both mutation drivers, syntax-only checks, Linux, real services. Do not run them as part of this round.

## 5. Delivery
One new comment on PR #7 (closed, merged) titled as A83 post-merge regression, citing A81/A82 and merge `6cc8e2a`: S_main, precondition results, environment/probe map, per-group command, counts, exit codes, raw TAP digests and limitations. Then overwrite `docs/bus/QA_TO_DESIGN.md` as seq 18 (or latest+1), `re=MANAGEMENT_TO_EXECUTION.md@<dispatch seq>`, commit only that file, QA STOP.

## 6. STOP / outcome rules
- Any failure, skip, count mismatch, timeout or environment gap: report the actual FAIL/NOT_RUN with raw output; **no fix, no retry-as-pass, no code or doc change**. If Q3-11 fails, P2-WP03-DESIGN-2 reopens; a WP-01/WP-02 failure is a new finding for Design.
- If all three groups pass and preconditions hold, Design may record **post-merge regression PASS_LOCAL on S_main** and mark P2 CLOSED_LOCAL with runtime evidence. No other gate changes.

## 7. Boundaries
No G1/new work package, no Execution, no merge/branch/PR edits, no frozen UI, R2, P0-STORE, WP-04, real persistence/services, G6/G7 or deployment. A70/A71 suspended; PR #2/#4 untouched.

**Design WAIT — DEC-23 (approve A83).**
