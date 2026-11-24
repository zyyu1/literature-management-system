# POC-001 R10-HANDOFF-01 — DOC-ONLY Management → Execution Work Order (D007-A41)

**Only approved task:** historical R09 body verbatim retained + R10 body appended in **one file**, then fresh independent G3. Authority: [D007-A41 narrow G1](../../architecture/D007_A41_R10_HANDOFF_DOC_ONLY_G1_AUTHORIZATION.md), [A40 G4 partial](../../architecture/D007_A40_R10_EXACT_G4_PARTIAL_DISPOSITION.md), [DOC-ONLY QA plan](R10_HANDOFF_DOC_ONLY_QA_PLAN.md). Read at **exact new Design authority `main` SHA** returned to Management, not floating main. Original A39 and R10 instructions remain historical and **read-only**.

## 1. Fixed identity, STOP preflight

- Repo `zyyu1/literature-management-system`; **existing PR #2** `OPEN/NOT MERGED`, existing branch `exec/POC-001-webdav-feasibility`; immutable original POC merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`.
- **ONLY START** `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`. R09 historical body at `bcc47380deb7c6e48964ca5ca77303a213fade28`, blob `abec8158235443edbd53ed25ad6369c36c080819`; R10 current body at start, blob `efc915c46f57fc6ca9c835061b169036256c8a88`.
- Management confirms and Execution independently confirms `git ls-remote` branch SHA = PR REST head = clean checkout HEAD = 40-digit START. Check source blob hashes and original merge-base, no merge commits; **if any mismatch/unknown commit/auth error ⇒ STOP** and report Design, no reset/rebase/force-push/merge main/cherry-pick.

## 2. EXACT one-file whitelist and deterministic bytes

**Only allowed changed path:** `docs/handoffs/POC-001/QA_HANDOFF.md`. **No new evidence, script, readme, CI or code files.**

Construct `new bytes = exact original R09 bytes B09 + small Markdown transition S + exact existing R10 bytes B10`. Fetch original blobs from immutable commits, **not copied from screenshots/QA report**. All historical bytes unchanged, including line endings, UTF-8/Unicode, Markdown, old QA status history. S must include full 40-char R09 and R10 source SHAs + source blob SHA and explain old statements are SHA-scoped history, not live G4 approval. Only S may contain newly authored text; ensure Markdown headings and delimiter parse without accidentally editing a source text body.

On temporary/generated artifact, assert:
- `B_new.slice(0,B09.length)===B09` raw byte equality.
- `B_new.slice(-B10.length)===B10` raw byte equality.
- `B_new.length===B09.length+S.length+B10.length`; only S is new.
- Markdown remains text-readable; no secret/private PDF/data; Git status lists **only the one path**.
- Old R09 R08 history links retained; new R10 current excerpt remains historically accurate at its source SHA.
- No future SHA guessed inside document; PR post-commit SHA in PR comments and QA request only.

If unable to retrieve source blobs or preserve exact prefix/suffix ⇒ `STOP / DESIGN` (not "link-only" fallback).

## 3. Execution verification and PR publication

Use the existing code unchanged, Node v22.23.5 reference. Execution reruns syntactic check, individual POC01–07/R01–R10 regressions, five genuinely separate `node --test "test/*.test.mjs"` processes **with actual counts/exits**, mutation check `node scripts/mutation-check.mjs`, secret scan original Base, empty dependencies, and strict unchanged code/test/CI blob audit. Record actual OS/host and any failure honestly; this does not imply real provider validation.

One fast-forward DOC-ONLY commit onto PR #2 existing branch (no new PR, no new base), **diff start..final exactly this one file**. Push without rebase, merge, reset, force push. Verify final full 40-char SHA, original merge-base/PR open/unchanged protected code. Post **direct PR #2 Execution report and QA_REQUEST** with exact final SHA, old/new file blob, raw prefix/suffix equality proof (without publishing secrets) and real regression/mutation results; **EXECUTION STOP**.

Management then arranges the **new user-opened independent QA** per separate plan; must not impersonate that QA or self-approve G4. Report failures as `PENDING / STOP`, not auto waive.

## 4. Strict no-go and handback

- PR branch code/tests/package/CI, earlier execution order/QA plans, frozen UI, Design main, L3 PR #4, real service, credentials and user data: **READ_ONLY**.
- First-attempt `ls-remote` independent G3 is **mandatory on new final SHA**, old QA #7130241308 does not qualify; 209/209×5 independent clean runs required for full supported-host regression, no cross-platform universal claim.
- Q1e UNSUPPORTED_COMPLETENESS, provider NOT_RUN, `G5 MERGE NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 DEPLOY NOT_AUTHORIZED / POC BLOCKED_REAL_SERVICE`.

Management sends Design one exact-SHA report: Design authority; PR URL+head+original Base; DOC-ONLY Execution commit; one-path diff; source/new blob SHAs; QA report comment URL/ID and independent preflight; 5 actual full suite rounds; mutation/probes; P0/P1/P2/INFO/NOT_RUN/UNSUPPORTED; **EXECUTION / QA / MANAGEMENT STOP**. Design alone decides a separate future exact G4.
