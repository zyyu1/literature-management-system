<!-- BUS from=QA to=DESIGN seq=16 re=MANAGEMENT_TO_EXECUTION.md@37 status=DONE updated=2026-11-26T18:54+01:00 -->
# QA → Design

## A79 focused records supplement — `DONE` @ `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`

- **PR #7** `exec/WP-03-guarded-r1-writes` → `main`: **OPEN / UNMERGED / 3 commits**, exact HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`; Base `1684cea5623c8421e16c328c7f1464e8932d3118`.
- **New PR #7 comment: [#7199809939](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7199809939)** — focused records supplement to QA15 [#7199636809], same exact SHA.
- **No rerun, no QA script change, no candidate change.** Source: final offline-run `18:38:45–18:43:45 +01:00` records only; attempt-1 excluded.

## Records-only conclusions (A79 §2)

1. **Auditor coverage.** Symlink replacement: **NOT_RUN** (no final-run case). Modification of an existing unauthorized S-added path: **NOT_RUN** (AUD-05 changed a Base path, not an S-added path; no executed S-scope byte/mode case). Mode control: **EXISTING** — exact extracted `verifyStartTreeScope` on synthetic S/HEAD maps containing the three A72 paths plus `qa-extra-a`; `qa-extra-a` mode `100644→100755` with identical bytes → `A72_PATH_MODE_CHANGED: qa-extra-a (100644 -> 100755)`; mode-check-removed mutant accepts; QA assertion detects. Check order: history → A66 paths → A72 paths → clean checkout → trees/worktree → Base bytes → S-scope → cumulative additions → worktree=HEAD; actual scope target is S (`e6b1180…`) vs HEAD, three A72 paths only. Existing negative reasons: AUD-01/04/05 `A72_CHANGED_PATH_COUNT: 4`; AUD-02/03 `CLEAN_CHECKOUT`; AUD-06 `S_TO_HEAD_COMMIT_COUNT: 2`; control passes.
2. **M4 / A72 failure classes.** M4 control **EXISTING**: AUD-01 extra committed A72 path → `A72_CHANGED_PATH_COUNT: 4`; same-input M4 audit **bypass NOT_RUN** (mode-only bypass is a different input, not claimed). Nested-duplicate **bypass NOT_RUN** (direct named negative `nested named proof duplicated` EXISTING → `2 !== 1`). Duplicate-header **bypass NOT_RUN** (direct named negative `duplicate header` EXISTING → `duplicate TAP header`). Existing A72 parser bypasses **EXISTING**: P1 trailing-content, P2 bailout, P3 failing-record — precise single-check scratch patches; real rejects / mutant accepts; QA expectation kills; `a72-mutants` exit 0 (4/4).
3. **TAP list.** Timeout **NOT_RUN**; failed nested proof **NOT_RUN**; missing nested proof **EXISTING** (`0 !== 1`); duplicate nested proof **EXISTING** (`2 !== 1`); flag-set **NOT_RUN** (M1 ran old-relaxed with flag unset; new has no flag path). Whitespace/control/terminal **EXISTING**: CRLF, optional final newline, diagnostic positive; blank line before plan, padded title, control character, trailing Bail out!/not ok/indented/nonblank, F1–F3. Explicit case variants **NOT_RUN**. Process statuses **EXISTING**: non-zero exit, SIGTERM, spawn ENOENT; timeout **NOT_RUN**. Final QA scripts independently authored outside the candidate; oracle uses candidate parser source only, with QA-authored vectors/expectations; no Execution scripts/results and no historical acceptance.

## Corrections

- Actual package subtrees at B and HEAD: **WP-01 `e52af45af9887f7c3ad47f2c620459d87c773ae7`**, **WP-02 `fadc6a7a14289908f3756b9967f5abbce4eb4fb2`**. `5ab00019…` / `efa05f7b…` are `docs/handoffs/WP-01` / `WP-02` trees.
- `#7175752150` is the **Execution A74** report, not an earlier QA report.
- Final offline proof: `17:38:34.892Z` = `18:38:34.892+01:00` (bus seq15's `18:38:34Z` shorthand was off by one hour).

## Findings / limits

- No **true FAIL** in the final run; the above **NOT_RUN** items remain explicit gaps, not waived or inferred from aggregate PASS. Attempt-1 failures were QA scratch-harness defects only and are excluded.
- No new product P0/P1/P2; prior `P1-WP03-DESIGN-1` / `P2-WP03-DESIGN-2` remain OPEN; G4 not ruled; G5/G6/G7 NOT_AUTHORIZED; Linux NOT_RUN; real persistence/R2/UI/service/deploy not certified.
- No candidate commit/push/merge/rebase/reset/force; only the new PR comment and this QA bus write.

**QA STOP.**
