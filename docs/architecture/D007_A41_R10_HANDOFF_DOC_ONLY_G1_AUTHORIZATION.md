# D007-A41 — POC-001 R10 Historical QA_HANDOFF DOC-ONLY G1 Authorization

**User-approved decision, 2026-11-24 (Europe/Berlin):** D007-A40 option A. Only repair **GATE-R10-DOC-01** from [D007-A40 exact-SHA R10 G4 PARTIAL](D007_A40_R10_EXACT_G4_PARTIAL_DISPOSITION.md). **G1 = AUTHORIZED_DOC_ONLY_HISTORICAL_APPEND**, **G2 NOT_STARTED**, **G3 NOT_RUN**, **new G4 NOT_REVIEWED**. The prior `R10_LOCAL_FIX_EVIDENCED` and `D007-A40 G4 PARTIAL_NOT_ACCEPTED` remain intact; this is **not** authorization for code changes, tests/CI/old instruction edits, any old G4 reconsideration without fresh evidence, merge, cloud/provider access or deployment.

Read alongside [D007-A39 R10 original G1](D007_A39_POC001_REMEDIATION_10_G1_AUTHORIZATION.md), [A40 disposition](D007_A40_R10_EXACT_G4_PARTIAL_DISPOSITION.md), [new DOC-ONLY work order](../handoffs/POC-001/R10_HANDOFF_DOC_ONLY_WORK_ORDER.md), [new independent QA plan](../handoffs/POC-001/R10_HANDOFF_DOC_ONLY_QA_PLAN.md), and unchanged [ACCESS_POLICY](../handoffs/POC-001/ACCESS_POLICY.md). This **newly scoped G1** authorizes one later branch **documentation-only** fast-forward commit; it neither changes the historical A39 G1 nor restarts its code work.

## 1. Immutable repository identities

| Item | Mandatory value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Existing PR and branch | **PR #2 OPEN / NOT MERGED**, `exec/POC-001-webdav-feasibility`, **no new branch or PR** |
| **Original POC immutable merge-base** | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` |
| **DOC-ONLY execution start** | **`39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`** — immutable latest R10 final; NOT `bcc47380`, not latest `main` |
| Historical R09 body source | `docs/handoffs/POC-001/QA_HANDOFF.md` @ `bcc47380deb7c6e48964ca5ca77303a213fade28`, Git blob **`abec8158235443edbd53ed25ad6369c36c080819`** |
| Historical R10 body source | Same file @ **`39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`**, Git blob **`efc915c46f57fc6ca9c835061b169036256c8a88`** |
| R10 code commit | `bb30e1d07ac18412021e5bcb05919ea6d87057cd`, unchanged |
| Design authority | Exact `main` 40-hex SHA that contains THIS G1, both new order/QA plan and latest Design Handoff; Management must pin that SHA, **must NOT merge it into PR #2** |

**Strict preflight**: Management and Execution separately verify `git ls-remote`, GitHub PR REST `head.sha` and local clean HEAD **all equal** exact start; PR open/not merged, old original merge-base unchanged, no merge commits/rebase/force, expected source blobs match. If any mismatch (including other work on PR #2), authentication problem, stale/nonexistent source blob, changed whitelist or dirty tree => `PRECHECK_PENDING / STOP`; do not reset/rebase/cherry-pick or silently self-waive. A concurrent `main` change is inspected and reconciled before handoff/Design docs commit; never force-push.

## 2. Exact incremental execution whitelist (one path)

**Only**:
`docs/handoffs/POC-001/QA_HANDOFF.md`.

**No others, not even evidence files or a test script in PR.** This explicitly excludes all `poc/001/**` code, tests, mutable evidence, packages/locks, CI/`.github/**`, root README, frozen Module 002 UI, original A39/A40 or R01–R10 work orders/QA plans, `ACCESS_POLICY.md`, `docs/architecture/**`, `docs/governance/**`, `docs/handoffs/DESIGN_WINDOW_HANDOFF.md` within the execution branch, PR #4 Q1E-L3, original Zotero/Nutstore systems and any production logic. Execution reports, QA results and generated logs are posted as **new direct PR #2 comments** (or local disposable outputs), **not committed as additional files**. If need any additional path, **STOP** and return to Design; Management cannot enlarge G1.

## 3. Deterministic canonical document normalization

Let:
- `B09` = **entire raw bytes** of `QA_HANDOFF.md` from pinned **R09 SHA `bcc47380…`**, blob `abec8158235443edbd53ed25ad6369c36c080819`.
- `B10` = **entire raw bytes** of `QA_HANDOFF.md` from pinned **R10 SHA `39f34d02…`**, blob `efc915c46f57fc6ca9c835061b169036256c8a88`.
- `S` = a **short, newly authored Markdown separator** between them, documenting R09/R10 headings, full two source SHAs and source blob SHAs, and explicit "historical content retained verbatim; old statements are SHA-scoped and not new approvals". `S` must not contain secrets or fake measurement/QA results.

**REQUIRED FINAL BYTES:** `B_new = B09 || S || B10` (byte-exact prefix and suffix; no truncation, editing, newline/BOM changes **inside B09 or B10**). Use newline insertion **only inside separator S**; ensure S itself marks the transition and has no ambiguity even if B09 lacks a terminal newline. Keep both historical R09 and R10 Markdown intact; no "just link to previous blob" substitution, no copy-paste rephrasing, no editing of dated history to pretend it is current. The source R09 text may contain historical old G4 or QA PENDING statements—these are **preserved as historically true at their exact SHA**, not current status.

A verifier must be able to retrieve raw Git blobs and mechanically check that final bytes begin with B09, end with B10, and the middle S is only the documented separator; record final SHA and new blob SHA. Historical R08 and earlier links already embedded in B09 remain intact. No Git metadata or future commit SHA needs to be embedded into B_new; the **new PR head exact 40-hex SHA** is carried in the Execution report and QA request. **No modification of R09/R10 historical original blobs.**

## 4. Independent G3 QA — mandatory fresh exact-SHA preflight and full regression

The original [R10 QA plan](../handoffs/POC-001/REMEDIATION_10_QA_PLAN.md) requires first-attempt successful `git ls-remote`; **the prior independent QA failed this first invocation** (Windows schannel) and D007-A40 refused to waive. On the **new, as-yet-unknown DOC-ONLY final PR #2 SHA**, a **separately user-opened QA window** (not Management and not Execution/same-session subagent) must:
1. Before doing repository-source QA or treating an old clone as fresh, record the **first attempted** `git ls-remote` exit=0 and exact expected branch SHA; **any initial network/TLS/schannel/credential error ⇒ `G3_PREFLIGHT_FAILED / STOP`**. Neither a later retry nor "first completed" counts as first success. Configure a valid supported QA host/transport **before first attempt**, without using a failed earlier attempt as QA preflight. Historical A28 exception is not reusable.
2. Fresh **full (not shallow)** clone into empty workspace; detach at exact new full PR SHA, clean tree. Independent PR REST check `state=open`, `merged=false`, `head.sha=remote=checkout` at start and end; immutable POC original merge-base, no merges/rebase/force, one DOC-ONLY execution file vs `39f34d02…` and two original source blobs verified.
3. Read `B09`, `B10` and final `B_new` as raw bytes, require strict `startsWith(B09)` and `endsWith(B10)` and only approved transition S in middle. No historical deletions, no unexpected text, no secret in S.
4. Independently inspect **unchanged `poc/001` code/test/fixture blobs** vs `39f34d02…`; QA must **execute** all POC-01–07, R01–R10 individually, `node scripts/check.mjs`, `node --test "test/*.test.mjs"` **five distinct full processes with 209/209 and exit 0 each**, mutation `node scripts/mutation-check.mjs` (baseline **85/85 expected**, actual re-run required; M1–M85 untouched), secret-scan original POC Base, `npm ls --all` empty, changed-file path diff. Node `v22.23.5` is reference baseline; specify actual OS/Node/git/TLS env. A non-green full-suite round is **NOT PASS**; isolated re-runs cannot be described as clean 209/209×5.
5. QA-owned synthetic safety probes (not relying only on Execution self-report): early `PROPFIND` at 0/20, 1/20, 19/20 refused without request/slot/token loss; 20 known DELETE attempts + one final verified, `75+20+1=96`, `79+20+1=100` and #101 refused; 412 residual, 401/429 STOP, lost-ACK UNKNOWN no fake success/retry; preserve INFO-1/C9, no app/network changes. QA's independent mutant (early verification or token burn) must be killed by named assertion.
6. **Environment caveat:** the prior Windows R08-TLS-02 bare-absolute-ESM-import case failed 5/5 at both R10 start and last QA head; a green **verified supported-host** re-run (e.g., suitably configured Linux environment) may establish *that host's* regression baseline but **does not certify Windows portability**. If new QA chooses Windows and same test fails or any flake occurs, record `REGRESSION_NOT_GREEN` and `G4 CANDIDATE NOT MET`; no old-test, CI or dependency edit permitted under A41. If cross-platform certification is later requested, a distinct test-only/compatibility decision is necessary.
7. QA directly publishes **one formal R10-DOC G3 QA_REPORT on PR #2**, referencing this A41 G1 and exact final head, original source blob/prefix/suffix proofs, actual 209/209×5 exits/mutations/secret scans, own probes, all P0/P1/P2/INFO/NOT_RUN/UNSUPPORTED and unchanged other PR. **QA STOP**, Management relays intact to Design. This QA does **not automatically accept G4**, close P2-R09-QA-1/parent or enable provider access.

**NO pre-approved waiver, no "soft PASS" for first-attempt failure or ungreen rounds.** If any check fails, QA stops or accurately reports PARTIAL/FAIL and Management returns to Design. Future exact-SHA Design G4 is separate.

## 5. Gate firewall / next Design

| Gate | State immediately upon publishing this D007-A41 G1 |
| --- | --- |
| **G1 D007-A41** | **`AUTHORIZED_DOC_ONLY_HISTORICAL_APPEND` for one QA_HANDOFF path** |
| G2 | `NOT_STARTED` until separate Management-coordinated Execution |
| G3 | `NOT_RUN` (old R10 G3 stays historical and NOT reusable) |
| G4 | `NOT_REVIEWED` for new SHA; **D007-A40 old G4 PARTIAL_NOT_ACCEPTED@39f34d02 remains** |
| GATE-R10-DOC-01 | `OPEN / REMEDIATION_AUTHORIZED_ONLY`, not closed until new exact-SHA evidence and Design G4 |
| GATE-R10-G3-01 / REG-01 | `OPEN / FRESH_QA_REQUIRED` |
| P2-R09-QA-1 / parent P2-R08-QA-1 | `OPEN / LOCAL_FIX_EVIDENCED` and `OPEN/PARTIAL` |
| INFO-1/C9 | `INFO`, excluded |
| G5/G6/G7 | `MERGE_NOT_AUTHORIZED / ACCESS-02_BLOCKED / DEPLOY_NOT_AUTHORIZED` |
| POC-001 overall | **`BLOCKED_REAL_SERVICE`; Q1e `UNSUPPORTED_COMPLETENESS`, backup `NOT_RESTORE_CERTIFIED`** |

**D007-A41 G1 is limited to synthetic documentation restoration + independent QA coordination.** No code, tests, original instructions, CI, frozen UI, actual data, merge, rebase, cloud, ACCESS-02 or deployment authorized.
