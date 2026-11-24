# Design Continuity / Management Handoff-First Protocol — 2026-11-24

**User-approved governance amendment (Design-window continuity only).** Canonical working register: [`docs/handoffs/DESIGN_WINDOW_HANDOFF.md`](../handoffs/DESIGN_WINDOW_HANDOFF.md). This protocol adds **Management as the coordination layer** to the historical [Three-Window Protocol](THREE_WINDOW_PROTOCOL.md) and [Automation Bus](AUTOMATION_BUS.md). It supersedes their *current routing descriptions only when conflicting*; their historical G1–G7, independence, STOP and exact-SHA rules remain binding. It **does not** create unattended timers, connected cross-chat automation, source code authority, user account access or deployment.

> **Amended by [D007-A47](D007_A47_PROCESS_SIMPLIFICATION.md) (2026-11-24):** §2.B–C separate evidence-only commit is now required only when the ruling awaits a user choice; otherwise receipt + ruling go in one commit after verification. Independent QA host and LIGHT/FULL gate tiers per A47. A47 governs on conflict.

## 1. Responsibility and communication

`User → Design (decisions) → Management (dispatch / coordination) → Execution + separately user-opened Independent QA → Management (evidence relay) → Design (G4/risk/next G1 user-approved)`.

- **Design** owns decisions and their evidence-based scope; only an explicit user/Design G1 may authorize new code; Design independently decides G4 after formal G3. A QA PASS is not automatic G4, nor is G4 automatic G5.
- **Management** may dispatch an already-approved exact-SHA G1, coordinate isolated Execution and independently opened QA, track PR/status/comment provenance, report STOP and relay **unchanged** reports; may not change Base, whitelist, CI/UI, code, QA result or authorization.
- **Execution** is confined to its own branch, exact start/base and whitelist, posts exact SHA/report to its work PR and STOPS.
- **QA** uses its own **separately user-opened window**, fresh clone and independently authored probes/mutants, comments directly on that work's PR then STOPS. Same-session Execution subagents and Management self-checks are not G3.
- Existing `LMS-BUS` headers and GitHub comment IDs remain audit/transport conventions; Design currently receives instructions from Management **in chat**, verifies original GitHub evidence itself, and dispatches **Management-only copyable XeLaTeX**. No legacy bus comment independently grants authority.

## 2. Mandatory HANDOFF-FIRST sequence on **every** Management-forwarded message

**Precondition:** actually receive a Management message in the Design chat. Not a background task.

**A. Verify (no adjudication yet).** Fetch latest GitHub `main`, this handoff, work PR metadata, original Execution/QA comments and exact immutable full SHA, Design G1/QA plan, actual changed-file list and risk state. Check source comment IDs, repeat/contradiction, repository rights, allowlist, scope and G3 independence. Distinguish reported facts, directly verified evidence, PENDING and NOT_RUN.

**B. Persist inbound evidence *first*.** Append unique key `(work ID, PR, comment ID, tested SHA)` in the handoff §8 receipt ledger. Update the handoff's verified current status and pending items; **do not decide G4, close risks or create a new implementation G1 in this predecision update**. Commit this **evidence-only handoff update on `main`** via non-force CAS against the observed expected head. Verify resulting main SHA, commit parent and **only changed path** `docs/handoffs/DESIGN_WINDOW_HANDOFF.md`. If source evidence is incomplete, record `PENDING_SOURCE_VERIFICATION` without inventing acceptance; if impossible to safely verify/persist, report **HANDOFF_UPDATE_PENDING/STOP** rather than claim success.

**C. Only after B succeeds:** provide Design adjudication/decision based on authorized scope. A user request approving a G1 does not make missing QA evidence pass; risk closures require separately authored decision docs at exact QA SHA. If a new Design decision is published, **update the handoff *again*** in that decision's governance commit (or a verified immediate follow-up), linking decision ID, exact commit and delta in gates, risks and next allowed action. Verify SHA, path list and unmodified historical authority. If Design simply reports PENDING, B is the sufficient completed handoff.

**D. Return** to user a concise Chinese evidence/gate disposition, links to current handoff and any specific decision, GitHub SHA, then options. When implementation has an approved G1, issue one complete **Design→Management** XeLaTeX command; Management coordinates Execution/QA. No direct unapproved Execution tasks or auto merge/deploy.

**Idempotency:** if the same exact Management report/QA SHA already has a verified receipt, re-read and affirm the handoff without duplicating records. If a new comment claims the same SHA but different tests, record the new evidence key and distinguish updates. Preserve append-only history; update the summary table but never erase prior risk evidence or mislabel a local mock as provider proof.

**Concurrent main updates:** a CAS failure or unexpected changed protected file is a STOP. Re-fetch and reconcile concurrent Design/governance changes; do not `force=true`, rebase or reset unrelated windows. Avoid self-referential handoff commit IDs: store verified *observed parent* and report resultant commit SHA outside the file or in a later checked update.

## 3. Permanent safety and authority firewall

- `main` Design handoff/status edit **never modifies Execution branch**, frozen Module 002 UI, original G1 instructions, old QA reports or existing PR's target SHA. It is not authority to change code or original task white lists.
- `G1` scoped/explicit; `G2` implementation evidence; `G3` independent QA on exact SHA; `G4` Design ruling; `G5` merge separately; `G6 ACCESS-02` real service separately; `G7` deployment separately. All blocks remain unless their own explicit approvals are verified.
- Never disclose/upload actual Zotero or Nutstore credentials, personal PDF/notes, private research excerpts, token/key/session material, or operational secrets. Use synthetic fixtures only unless a distinct explicit real-data/real-provider gate is approved.
- The handoff and this policy are **navigation + a workflow rule**, not a proof of completed tests or blanket authorization. Existing newer subject-specific approved documents and exact tested SHA control contradictions; update the handoff to note such contradiction, don't silently overrule.
- No automated monitoring or background work is created here. This process is executed **in the current conversation** whenever Management sends a report and Design has working GitHub access.

**Status at adoption:** `D007-A39 R10 G1 AUTHORIZED`, R10 G2/G3 NOT_RUN/G4 NOT_REVIEWED; R09 G4 PARTIAL at PR #2 SHA `bcc47380deb7c6e48964ca5ca77303a213fade28`; Q1E-L3 model G4 PARTIAL at PR #4 SHA `49cb8d264fa7c9d76705e03161421149a4557167`; `Q1e UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED`; `G5 NOT_AUTHORIZED / G6 BLOCKED / G7 NOT_AUTHORIZED`.
