# D007-A47 — Process Simplification / 流程精简（Governance amendment）

**Status:** USER-APPROVED 2026-11-24 Europe/Berlin (user selected **option A — adopt all five rules**; originally drafted as "A46", renumbered A47 after a concurrent Design window published [D007-A46 Windows-first policy](D007_A46_WINDOWS_FIRST_ENVIRONMENT_POLICY.md); user then chose **option B: A47 R4 governs the independent QA host**). Observed parent `main@b4d994a7d9c265f69a54b37a4dbfa46baf65bfb4`.
**Type:** GOVERNANCE / DESIGN_ONLY. No G1, no Execution/QA dispatch, no G4, no risk closure, no change to any execution branch, PR or frozen UI.

## 0. Why

On 2026-11-24 alone, `main` received 29 commits, 11 of which were handoff-only receipts; the canonical Design handoff had 13 stacked multi-hundred-word receipt paragraphs before its first section. Both active workstreams (R10 on PR #2, Q1E-L3 on PR #4) were stopped by the same issue — no supported independent QA host — while process overhead exceeded the risk of the local synthetic/mock work being governed. A47 reduces overhead **without** weakening the independence, exact-SHA or real-service firewalls.

## 1. Rules adopted

### R1 — One commit per decision
- When Design handles a Management return, it still **verifies GitHub evidence first** (PR head, comment IDs, exact SHA, diff). It then writes the **receipt and the Design ruling in the same commit** on `main`.
- A separate evidence-only receipt commit is required **only** when the ruling must wait for a user choice (Design cannot rule yet).
- User approvals are **not** committed separately; the approval (decision ID + chosen option + date) is recorded inside the decision document/commit that acts on it.
- Supersedes the "separate evidence-only commit BEFORE any ruling" requirement of [DESIGN_HANDOFF_CONTINUITY_PROTOCOL §2.B–C](DESIGN_HANDOFF_CONTINUITY_PROTOCOL.md) and [Design handoff §6.3 / §7.3](../handoffs/DESIGN_WINDOW_HANDOFF.md). Verification-before-ruling is retained.

### R2 — Handoff is a snapshot, not a log
- [`DESIGN_WINDOW_HANDOFF.md`](../handoffs/DESIGN_WINDOW_HANDOFF.md) begins with **one "§0 Current status" table that is overwritten** on each update (one row per workstream: PR, exact SHA, G1–G4 state, blocker, next action).
- History lives in the §8 ledger as **one row per event** (evidence key, short result, decision status). Long prose receipts are not added to the top of the file.
- Pre-A47 top receipt paragraphs and §9 historical next-step paragraphs were moved **verbatim** to [`HANDOFF_ARCHIVE.md`](../handoffs/HANDOFF_ARCHIVE.md).

### R3 — Risk-tiered gates
| Tier | Applies to | Required path |
| --- | --- | --- |
| **LIGHT** | Docs-only changes; local synthetic / mock / model code; no real service, credential, user data, deletion of real data or deployment | Design G1 (scope + whitelist + START SHA) → Execution → **one** independent QA on exact SHA → Design G4. Docs-only changes need only byte/diff verification of the changed paths — **no full regression suite rerun**. Code changes need the work item's named tests ×1 green on the standard host plus targeted mutants; ×5 repetition only when the work item is about timing/flakiness. |
| **FULL** | Any real provider (Nutstore/Zotero), credentials/secrets, real user data, destructive operations on real data, merge to production paths, deployment | Existing G1–G7 unchanged. |

- G5 MERGE, G6 ACCESS-02 (real service) and G7 DEPLOY **always** require separate explicit user approval in every tier.
- QA independence is **not** relaxed: QA runs in a separately user-opened session, fresh clone, own probes; Execution self-tests are never G3.
- Existing open findings (P2-R09-QA-1, P2-R08-QA-1, P2-L3-QA-1/2, REG gates) are not closed by A47; future rulings on them may apply the LIGHT tier because both PR #2 and PR #4 are local synthetic/mock only.

### R4 — Standard independent QA host (supersedes D007-A46 Windows-first on this point only)
- Default G3 host: **a separately user-opened Claude cloud session** (Linux x86_64, Node.js v22.23.5). Observed by Design in its own cloud session on 2026-11-24: `node --version` → `v22.23.5`, `uname -sm` → `Linux x86_64`. That observation is environment evidence only, not QA.
- QA reports must start with the observed `node --version`, `uname -sm` and first `git ls-remote` result for the exact SHA.
- Windows results are **informational only** and no longer block a gate. Known Windows-only issues (e.g. R08-TLS-02 absolute ESM import) are tracked as INFO.
- If the cloud host is unavailable, QA reports ENVIRONMENT_BLOCKED; no same-session substitute.
- **Relation to [D007-A46](D007_A46_WINDOWS_FIRST_ENVIRONMENT_POLICY.md):** by user choice B (2026-11-24), A47 R4 overrides A46 for the **independent G3 host**: native Windows is no longer an eligible G3 host for gate purposes; its results are informational. A46 remains in force for **Execution/development** on Windows (exact Node v22.23.5, per-role preflight). The [A46 R10 Windows portability design](../architecture/D007_A46_R10_WINDOWS_PORTABILITY_DESIGN.md) stays DESIGN_ONLY and becomes optional, since the Windows-only R08-TLS-02 failure no longer blocks R10 REG.

### R5 — User-facing output
- Design replies to the user in Chinese, normally **≤ one phone screen**, ending with clickable A/B/C options (§6.9–6.10 of the handoff remain in force).
- XeLaTeX is used **only** for dispatch instructions addressed to Management. Not for status summaries to the user.

## 2. Unchanged
Roles (Design → Management → Execution + independent QA → Management → Design); exact-SHA G3/G4; no secrets/real data in GitHub; frozen Module 002 UI; Q1e UNSUPPORTED_COMPLETENESS / backup NOT_RESTORE_CERTIFIED; POC-001 BLOCKED_REAL_SERVICE; A45 post-withdrawal state of PR #4 (`2757aa664e2c12c80716fb291f3e3149f06fcfdd`, G2 not accepted, G3 not run) and A42 G4 PARTIAL of PR #2 (`a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`).

## 3. Next
A47 itself dispatches nothing. Next Design decision (separate user choice): which workstream to run first under the new rules — R10 read-only QA on PR #2, disposition of PR #4 late push, or WP-01.
