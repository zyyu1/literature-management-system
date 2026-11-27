# D007-A88 — WP-04-R1 G4 PASS_LOCAL; combined G5 task order (DEC-30, DEC-31)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@de4f5fc8e29f817e29079ee41af22a247d82735f`. Acted on explicit user poll. Receipt, ruling and user decisions in one commit (A47 R1).

## 1. Evidence received
- [Management45](https://github.com/zyyu1/literature-management-system/blob/28e158c/docs/bus/MANAGEMENT_TO_EXECUTION.md) dispatched independent G3 exactly per Board R40.
- [QA19](https://github.com/zyyu1/literature-management-system/blob/de4f5fc8e29f817e29079ee41af22a247d82735f/docs/bus/QA_TO_DESIGN.md) (`de4f5fc`, DONE, `re=@45`) and original PR #8 comment [#7214349421](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7214349421) (09:09:38Z, unedited) read in full; they agree.
- First and only `ls-remote refs/pull/8/head` 08:46:12Z (after the Management45 commit 08:45:14Z), exit 0, exact `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`. Fresh full clone, autocrlf false, 2 single-parent commits, 23 additions, 0 M/D, 266 paths, 0 symlinks. Windows offline proof 09:04:16Z, per-group guard+probe, Node v22.23.5 x64. Linux NOT_RUN.
- Groups: syntax 20/20; `node --test` 91/91 (Q4-01..12 present); QA-strict upstream 67/44(nested 67)/103; audit positive + 6 negatives; QA raw HTTP R01–R24 24/24; byte/export oracle B01–B08 8/8 (export equals an independently built DESIGN §5 body); committed mutants 14/14; QA mutants Q01–Q06 (NFC, CRLF→LF, partial write, saved-on-UNKNOWN, cross-library note, export mutates revision) 6/6 by intended assertions. Itemized table per DEC-27 complete. P0/P1/P2 = 0.
- INFO-1 recorded: empty-metadata export 131 B, SHA-256 `7bce7e56…77f5`, observed bytes after the H1 given exactly.
- Three earlier attempts of this round failed on QA-harness defects only; preserved, not counted (A79/A81 precedent). Their offline status is not separately stated — INFO.

## 2. Design check of the audit negatives
`verifyWhitelist` compares the set of **all** changed paths to the 23 approved additions before the per-status check. AUD-02 (modified Base path) and AUD-03 (modified protected blob) therefore fail with `CUMULATIVE_ADDITION_COUNT: 24`; the dedicated checks `BASE_PATH_MODIFIED_OR_DELETED`, `BASE_PATH_CHANGED_AT_HEAD` and `PROTECTED_HEAD_BLOB_CHANGED` were not individually demonstrated (AUD-05 was isolated via `verifyBaseTree`; AUD-06 via `readTree`). Outcome is fail-closed and Design independently verified the real diff (23 A, 72/72 protected blobs). This is an unproven redundant layer of the candidate-scope tool, not product behaviour.

**DEC-30 (user, Design window): accept as a recorded limitation (LIM-WP04-AUD-1).** Design rule for all future QA instructions: each audit negative must be **count-neutral** (or call the targeted function directly) so that its own dedicated check is the one that fires.

## 3. Ruling
**G2 ACCEPTED (A87), G3 VERIFIED, G4 PASS_LOCAL at exact `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`** for WP-04-R1 LOCAL_SYNTHETIC_ONLY global five-field Research Note (whole-note CAS, byte fidelity, saved-version export). Limitations: LIM-WP04-AUD-1; INFO-1; Linux NOT_RUN; Typora rendering, UI, local drafts, real storage/identity/Zotero, deployment out of scope. P0-STORE blocked; G6/G7 NOT_AUTHORIZED; A70/A71 suspended.

## 4. DEC-31 — combined G5 (A86 DEC-27 form), user selected
Design pre-checked at `de4f5fc8e29f817e29079ee41af22a247d82735f`: PR #8 OPEN, non-draft, mergeable clean, head exact; Base is an ancestor of main; `Base..main` changes only `docs/` and none of the 23 candidate paths.

**Step 1 — Management merge.** Merge only PR #8 at exact `f951f71…` into main with a normal merge commit. No squash/rebase/force/branch deletion/code change/other PR. Immediately before merging re-verify: live head exact; OPEN/non-draft/mergeable; Base ancestor of main; `Base..main` still touches no non-docs path and none of the 23 paths; no STOP. Any drift → STOP. Record the merge SHA M on the Management bus.

**Step 2 — independent QA post-merge regression** (after M is on main; separate QA session, fresh full clone): first and only `ls-remote refs/heads/main` → S_main. Preconditions: M ancestor of S_main; `M..S_main` only `docs/`; the 23 WP-04 paths at S_main equal `f951f71`; WP-03 22 paths equal `c40e927`. Offline (A59 or A54/A55; Node v22.23.5 x64; per-group guard+probe), one run each:
- WP-01 `node --test` 67/67; WP-02 44/44 (nested 67); WP-03 103/103; WP-04 91/91 (includes Q4-12 strict upstream and pinned 72-blob inventory).
- Excluded by design: both candidate-scope audit scripts (pinned to PR histories, expected to reject main), mutation drivers, Linux unless available.
- Itemized report per DEC-27 as a new PR #8 comment; QA bus next seq; STOP. Any failure → report, no fix; merge stays in history; Design rules.

**Step 3 — Design** verifies merge parents (main tip, `f951f71`), that `main-tip..M` adds exactly the 23 paths with HEAD blobs, protected inventory equal Base, and the regression evidence, in one ruling (G5 VERIFIED + post-merge PASS_LOCAL), then starts DEC-26 storage-route design.

No other authority: no WP-04-R2, WP-05, R2, P0-STORE, real persistence, frozen-UI change, G6/G7; PR #2/#4 untouched.
