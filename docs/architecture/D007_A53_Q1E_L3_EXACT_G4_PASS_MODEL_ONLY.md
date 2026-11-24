# D007-A53 — Q1E-L3 A45 two-P2 exact-SHA G4: PASS_MODEL_ONLY

**Design ruling, 2026-11-24 Europe/Berlin.** The receipt and the ruling are recorded in one commit, per A47 R1. Observed parent `main@affd46a`. QA was relayed by Management in the Design chat; the QA session did not write `bus/QA_TO_DESIGN.md`, which is still at seq 0. Design read the original comment directly.

## 1. Evidence verified by Design (GitHub REST)
### 1.1 PR state and report provenance
- [PR #4](https://github.com/zyyu1/literature-management-system/pull/4) is OPEN and unmerged. HEAD is **`2757aa664e2c12c80716fb291f3e3149f06fcfdd`**, unchanged since [A50](D007_A50_Q1E_L3_ADOPT_2757AA6_CLOUD_QA.md).
- [QA_REPORT #7136581379](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7136581379) was posted at 2026-11-24T15:46:12Z. It cites A50 at `75cc51e` and the exact SHA, and it matches the relayed summary.

### 1.2 QA environment and preflight
- QA ran on a separate cloud session: Linux x86_64, Node v22.23.5.
- The first `ls-remote` attempt exited 0.
- QA used a fresh, clean clone.

### 1.3 Repository state
- **Diff:** exactly 14 paths changed. Base and START are ancestors, and there are no merge commits.
- **Protected blobs:** `snapshot`, `model` and `check` are identical at START and HEAD.
- **QA_HANDOFF:** append-only. The old 13,765 bytes are an exact prefix of the new file (SHA-256 match), and only 3,252 bytes were added.

### 1.4 Tests and mutation
- **Full suite:** 30/30 tests pass, in 5 of 5 separate processes.
- **Mutation:** 14/14 mutants are killed by their intended assertions, with no survivors and no wrong-reason kills.
  - The original 12 mutants are all still killed.
  - `M-ANCHOR-BYPASS` is killed by `A44-ANCHOR-01/02`.
  - `M-SNAP-HEAD` is killed by `A44-C07-HISTORICAL-K`.

### 1.5 QA-owned probes and mutants
- The A44 core probes passed 6/6. All 20 invalid or omitted floor values are refused before staging, with no callback and with active and witness state unchanged.
- Historical K1 export after K3 is digest-identical to the K1 export taken before K2.
- All 26 A36 case IDs were accounted for; C02 is still `UNSUPPORTED_COMPLETENESS`.
- QA wrote 4 mutants (head substitution, anchor bypass, floor coercion, negative floor). All 4 were killed by named assertions.

### 1.6 Network, secrets and findings
- Zero network events, no secrets and no dependencies were found.
- There are no P0, P1 or new P2 findings.
- Verdict: `PASS_MODEL_ONLY_CANDIDATE`.

## 2. Ruling
| Item | A53 disposition @ `2757aa6` |
| --- | --- |
| A45 G2 candidate (adopted by A50) | Accepted as the tested final SHA |
| A45 G3 | VERIFIED (independent cloud QA) |
| **Q1E-L3 G4** | **PASS_MODEL_ONLY.** This supersedes the A38 MODEL_ONLY G4 PARTIAL for this SHA. |
| **P2-L3-QA-1** (unanchored floor permits staging after a joint rollback) | **CLOSED_MODEL_ONLY.** The fail-closed floor is independently demonstrated: R02 omitted floor gives `ROLLBACK_RESISTANCE_UNVERIFIED` with stage null. |
| **P2-L3-QA-2** (M-SNAP historical K test gap) | **CLOSED_MODEL_ONLY.** Both the repository head-substitution mutant and the QA head-substitution mutant are killed. |
| INFO-1 (floor origin and freshness are outside the model) | INFO. This carries forward as a design requirement for any real implementation: an authenticated, operator-held, monotonic floor source. |
| INFO-A50-1 (push after STOP) | INFO. Closed with no scope impact. |

## 3. Unchanged
The following remain open or blocked. Nothing in this ruling changes them.
- **Durability:** remains MODEL_ONLY. Physical durability, a real database, the T3 witness and key custody are all unproven.
- **Completeness and restore:** Q1e remains `UNSUPPORTED_COMPLETENESS`, and backup remains `NOT_RESTORE_CERTIFIED`.
- **Merge, access and deployment:** G5 MERGE, G6 ACCESS-02 and G7 DEPLOY are still not authorized. No G1 is issued by this ruling.
