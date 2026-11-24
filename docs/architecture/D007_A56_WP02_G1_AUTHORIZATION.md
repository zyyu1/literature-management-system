# D007-A56 — WP-02 G1 authorization (DRAFT → effective when the user picks DEC-6=A)

**Status:** DRAFT. Under [A51](../governance/D007_A51_DECISION_BOARD_WORKFLOW.md) rule 4, it becomes **G1 AUTHORIZED** when Management records `DEC-6=A` in `bus/MANAGEMENT_TO_EXECUTION.md`. Until then, nothing may be executed.
**Source:** DEC-5=A. Design: [WP-02 DESIGN](../handoffs/WP-02/DESIGN.md). QA plan: [WP-02 QA_INSTRUCTION](../handoffs/WP-02/QA_INSTRUCTION.md). Tier: LIGHT (A47 R3: local synthetic only).

| Item | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| **Exact Base** | **`a0fb04f6d03ac81bbcb35800318c927e278e8b92`**. This commit contains WP-01, merged, plus the WP-02 design, fixture and QA plan. Do not use the moving `main`. |
| New branch | `exec/WP-02-project-paper-read` |
| PR | A new PR into `main`. It must not be merged without a separate DEC. |
| **Whitelist** | `packages/wp-02-project-paper-read/**` and `docs/handoffs/WP-02/QA_HANDOFF.md`. **Nothing else.** In particular, `packages/wp-01-synthetic-auth-api/**` must stay byte-unchanged. WP-02 may *import* WP-01 modules read-only. If WP-01 needs a change (for example, a route hook), **STOP** and report to Design. |
| Fixture | `docs/handoffs/WP-02/fixtures/wp02.v1.json`, SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`, read-only. WP-01 fixture `86c47a5a…be65` is also read-only. |
| Runtime | Linux x86_64, Node **v22.23.5** exact, Node built-ins only. No `npm install`, lockfile, CI or network. |
| Egress | [A54](D007_A54_WP01_EGRESS_BOUNDARY_AMENDMENT.md) §3. Take `tools/offline/*` from `origin/main` into `/tmp/offline`. The probe must PASS. Run every test and server command through `run-offline.sh`. Never add `tools/` to the branch. |
| Host | Execution runs in a cloud Linux session. QA runs in a **separate** user-opened cloud session. |

## Required output (`packages/wp-02-project-paper-read/`)
- **`src/*.mjs`:** the read-only routes from the DESIGN §1, plus the R-ID, R-SCOPE, R-AUTH, R-RO, R-BYTES and R-LIMITS rules.
- **`test/*.test.mjs`:** cover Q2-01..Q2-11, including the A6-01/A6-02 identity cases, the byte-identical neutral 403, the 405-no-mutation case, the state-digest equality and the WP-01 regression (67/67).
- **`README.md`:** exact commands, limits, what is not covered.
- **Optional:** `package.json` with empty dependencies and no scripts; `evidence/**`, sanitized.
- **Mutation:** a mutation driver, or a documented manual set, of at least 8 intended kills.
- **Handoff:** `docs/handoffs/WP-02/QA_HANDOFF.md`.

## Stop and return
- **STOP conditions:** STOP on any of these:
  - a Base mismatch;
  - a fixture SHA mismatch;
  - the egress probe fails;
  - a path is needed outside the whitelist;
  - a cross-scope leak;
  - a duplicated global paper.
- **Return:** push the branch and open the PR. Post an Execution report with the exact SHA. Write `bus/EXECUTION_TO_QA.md` with the PR, the exact SHA, the report comment ID and the QA plan path `docs/handoffs/WP-02/QA_INSTRUCTION.md`. Then STOP.

## Unchanged
- **Gates:** G5 merge, G6 real service and G7 deploy are NOT_AUTHORIZED.
- **Frozen UI:** stays as is; no UI is implemented.
- **Out of scope:** Zotero, real data and writes.
