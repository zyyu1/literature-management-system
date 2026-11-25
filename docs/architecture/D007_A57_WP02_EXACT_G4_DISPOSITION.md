# D007-A57 — WP-02 Exact-SHA G4 Disposition: PASS_LOCAL

**Design ruling, 2026-11-25 Europe/Berlin.** User requested the formal G4 disposition in the Design window. Receipt and ruling in one commit under A47 R1. Observed parent `main@82bf48412a100a6f5668757491e987a13a0c4b54`. Governing authority [A56](D007_A56_WP02_G1_AUTHORIZATION.md), [WP-02 DESIGN](../handoffs/WP-02/DESIGN.md), [independent QA plan](../handoffs/WP-02/QA_INSTRUCTION.md), A54 §3/A55 egress, A47 LIGHT, A51/A52 board/file bus. Input: Execution→QA seq 6 and QA→Design seq 5; DEC-6=A was recorded previously.

## 1. Exact evidence verified by Design

- [PR #6](https://github.com/zyyu1/literature-management-system/pull/6), OPEN, UNMERGED, branch `exec/WP-02-project-paper-read`, exact HEAD **`222763dad068fc226e500b14250cbb7fffc0a2de`**. Immutable authorized Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`. GitHub compare confirms 3 ahead, merge-base = Base, 27 changed paths, zero outside the A56 whitelist. Raw git commits confirm single-parent chain Base → 1da0a75 → 38a60d6 → 222763d (zero merges). No WP-01, fixture, tools, CI or frozen UI paths changed.
- Original [Execution report #7139096327](https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7139096327) and [Independent QA report #7139369153](https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7139369153) read directly; both match exact SHA and bus. QA describes fresh independent cloud session/full detached clone, clean tree, Linux x86_64 / Node v22.23.5, first ls-remote against origin URL exit 0. Using the origin URL before cloning is accepted as equivalent remote/ref verification, not a waiver of first-attempt success.
- QA reports WP-01 tree identical, frozen fixture SHA-256 c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888 (4989 B), QA plan unchanged, A55 wrapper blob 2d06bfc3aee1c1d9b3a8e67fd93e483bc8b1fb20, outside probe FAIL expected, inside PASS, allowlisted environment only, zero non-loopback connections.
- QA reports 11/11 syntax checks; WP-02 43/43 ×5 and standalone WP-01 67/67 ×5, all exit 0. Q2-01..11 PASS; own raw TCP probe 12/12 rows; 13 neutral 403 denials byte-identical except Date; 81 non-GET 405; state and observable digest unchanged after 195 requests. Notes byte-exact. Execution mutation driver independently re-run 13/13; QA authored 15 mutants, 14/15 killed by named repo tests, all 8 required kinds covered, QA probe kills 15/15. QA explains QM04 as the observable owner-scope drop surrogate because foreign association is structurally impossible in this fixture; accepted as bounded fixture evidence, not real-world association proof. Scans clean; no P0/P1.
- Design inspected exact catalog.mjs, server.mjs and identity.test.mjs: paperKey preserves case, detail uses exact tuple Map.get, no case-folding fallback. Existing identity tests lack the case-variant negative. This independently corroborates the scope of QM12. All runtime results above are QA-reported; Design did not run G3 or execute tests.

## 2. Ruling at exact SHA

| Item | Disposition |
| --- | --- |
| G1 | A56 AUTHORIZED (historical) |
| G2 | ACCEPTED at exact tested SHA; Execution STOP |
| G3 | VERIFIED independent cloud QA, PASS_LOCAL |
| **G4** | **PASS_LOCAL** — synthetic read-only Project/Paper slice only |
| P2-WP02-QA-1 (QA P2-1 / QM12) | **OPEN_NON_BLOCKING** — existing implementation is case-sensitive; named repository suite lacks the negative case. QA independent probe killed the mutant; no functional failure observed. |
| INFO-1..4 | Recorded, nonblocking within synthetic fixture; no further action authorized. |
| G5 | NOT_AUTHORIZED; separate DEC-7 required |
| G6 / G7 | NOT_AUTHORIZED |

P2-WP02-QA-1 must remain open until an authorized test-only change and fresh exact-SHA independent QA establish a named regression killing QM12 by assertion (not a crash). Expected: the exact existing tuple returns 200; case-variant absent tuple returns the same neutral 403 as other unavailable resources. Preserve fixture and source behavior, WP-01 bytes, egress and prior tests. **Before WP-03 write implementation G1, resolve this P2.** This is a Design sequencing/risk disposition, not new G1 or permission to edit code. DEC-7 offers merge with tracked P2 followed by separate remediation, or test-only remediation design before merge (recommended), or defer. No option is selected here.

## 3. Unchanged boundaries

WP-01 remains merged. POC PR #2 and L3 PR #4 remain OPEN evidence archives (DEC-2); A49/A53 unchanged. No real service, real data, keys, Zotero, imports, writes, durable storage, real TLS/browser, devices, accept-time non-loopback peer rejection or Windows certified. Module 002 frozen UI, 26 U6 scenarios NOT_RUN; Q1e UNSUPPORTED_COMPLETENESS, backup NOT_RESTORE_CERTIFIED, physical durability UNPROVEN, POC BLOCKED_REAL_SERVICE. WP-03+ implementation NOT_AUTHORIZED. No merge, branch changes, new dispatch or deployment by A57.
