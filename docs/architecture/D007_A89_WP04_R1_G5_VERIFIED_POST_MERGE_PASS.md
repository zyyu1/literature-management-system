# D007-A89 — WP-04-R1 combined G5 VERIFIED and post-merge regression PASS_LOCAL

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@b98f625a8da6226cc321d1124f9f5b1bf660fa81`. Acted on explicit user poll. Receipt and ruling in one commit (A47 R1). Completes DEC-31 (A88 §4, A86 DEC-27 combined G5).

## 1. Step 1 — merge (Management46, `61df6b1`)
- Merge commit **M = `d7dd4237f04559e1097f8dcfc8155164cd73f1c2`** (10:25:50 +01), parents (`c42174db073ef652e55e96a7ebc7c5a96fba0751` = main tip with A88, `f951f717f7c833fdd00ffbe602bbd6d08ed5a390` = tested HEAD); normal merge, non-force push; PR #8 closed/merged 09:25:59Z; branch retained at `f951f71`.
- Pre-merge checks recorded by Management match A88 §4 / Board R41. The merge commit precedes the Management46 bus record by 20 s (same pattern as A82, INFO).
- **Design verification:** `c42174d..M` = exactly 23 added paths, identical to `Base..f951f71`; all 23 blobs equal `f951f71` (WP-04 tree `74ef86b38c10646fccb8aaf4d863be358d215445`); 72/72 pinned protected blobs equal Base `bcc4eaa`; WP-03 tree `5db097a62f66c98622d6c7e2fbd0971a43f0d34e` equals `c40e927`.

## 2. Step 2 — independent post-merge regression (QA20, `b98f625`, PR #8 comment [#7214763357](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7214763357))
- Both read in full; they agree. First and only `ls-remote refs/heads/main` 09:27:03Z (after the Management46 commit 09:26:10Z), exit 0 → **S_main = `61df6b14dfb8c9c9081af2a5d3217f6855ddbffc`**.
- Preconditions verified independently by Design: M ancestor of S_main; `M..S_main` = `docs/bus/MANAGEMENT_TO_EXECUTION.md` only; WP-04 and WP-03 trees as above; 273 tracked paths.
- Windows offline proof 09:28:24Z, per-group guard+probe, Node v22.23.5 x64. One run each, exit 0, zero fail/skip/todo/cancelled: **WP-01 67/67; WP-02 44/44 (nested 67); WP-03 103/103; WP-04 91/91** (Q4-01..12 present, counts 4/4/4/7/4/9/10/7/5/9/13/4; Q4-12 strict upstream + 72-blob inventory). Itemized per DEC-27. Exclusions (both audit scripts, mutation drivers) respected. P0/P1/P2 = 0.

## 3. Ruling
**G5 VERIFIED** for WP-04-R1 at merge `d7dd4237f04559e1097f8dcfc8155164cd73f1c2` (tested HEAD `f951f717…`, A88 G4 PASS_LOCAL) and **post-merge regression PASS_LOCAL on S_main `61df6b14dfb8c9c9081af2a5d3217f6855ddbffc`**. WP-04-R1 is complete at the local-synthetic level. Limitations unchanged: LIM-WP04-AUD-1, INFO-1, Linux NOT_RUN, no Typora/UI/local drafts/real storage/identity/Zotero/deployment. P0-STORE blocked; G6/G7 NOT_AUTHORIZED; A70/A71 suspended; PR #2/#4 untouched.

## 4. Next
Per **DEC-26** (A86), Design now drafts the P0-STORE storage-route design (design only: no account, provider contact, real data, persistence or spending). No Execution/QA task is open.
