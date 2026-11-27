<!-- BUS from=QA to=DESIGN seq=22 re=MANAGEMENT_TO_EXECUTION.md@50 status=DONE updated=2026-11-27T14:02+01:00 -->
# QA → Design

## P0-STORE Phase 1 R2 targeted G3 — **PASS** @ `b6fec8e3b0ec217b142b428080454588e6866744`

- **PR #9** `exec/P0STORE-nutstore-probe-r1` → `main`: OPEN / non-draft / 4 commits; Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`; R2 start `88e1bd76…`.
- **New PR #9 comment: [#7220233158](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7220233158)** — A86 DEC-27 itemized P1/group/audit/personality/mutant/byte table.
- Authority: Management seq 50 / DEC-38=A, A94 §4, `R2_VERDICT_FIX.md` §5.

## Preflight / byte scope

- **First and only** `ls-remote refs/pull/9/head` → exit 0, stderr empty, exact `b6fec8e…	refs/pull/9/head` (`13:36:03.451Z–13:36:05.068Z`); no retry.
- Fresh full clone, `core.autocrlf=false`, detached, clean; Base ancestor; B..HEAD **4 single-parent commits, 0 merges**; **29 additions / 0 M-D**; Base 275 / HEAD 304; Execution `4032187` evidence not reused.
- **8/8 freeze paths byte-identical to `88e1bd7`**: gate/plan/secret/trace/runner/oracle/support/plans (`git diff --quiet` exit 0); `PHASE1_LIVE_ENABLED = false`. **P1-03 diff = 4 added / 2 removed lines**: exactly two `PARTIAL→INCONCLUSIVE` assertions + two R2 comments.

## Environment

Windows 10.0.19045 x64; Node **v22.23.5 x64** full path, non-elevated; A59 offline proof `13:38:27Z`; every group pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP no-error not counted. Linux **NOT_RUN**. No real Nutstore host/account/credential.

## Eight groups (all PASS)

| # | group | actual |
| --- | --- | --- |
| 1 | syntax | **25/25** `.mjs` |
| 2 | full suite | **65/65**; P1-01..14 present; zero fail/skip/todo/cancelled |
| 3 | QA-strict upstream | WP-01 **67/67**, WP-02 **44/44** nested 67, WP-03 **103/103**, WP-04 **91/91** |
| 4 | audit | positive + count-neutral negatives **7/7** |
| 5 | QA personality matrix | **11/11** verdict + root-cause-first reasons |
| 6 | egress | 5/5 zero-transport combos; static clean; canary absent |
| 7 | mutants | committed **16/16**; QA R2 **3/3** by intended assertions |
| 8 | byte proof | **8/8** freeze paths; P1-03 exactly 2 assertions + 2 comments |

- Audit: AUD-01 `UNEXPECTED_ADDED_PATH`; AUD-02 full `UNEXPECTED_ADDED_PATH: README.md` + dedicated `BASE_PATH_CHANGED_AT_HEAD`; AUD-03 `PROTECTED_HEAD_BLOB_CHANGED`; AUD-04 `UNEXPECTED_WORKTREE_PATH`; AUD-05 `BASE_PATH_MODE_CHANGED_AT_HEAD`; AUD-06 `HEAD_TREE_NON_REGULAR_MODE (120000)`.
- Personality: strong GO; weak PARTIAL `WEAK_VALIDATOR@L3`; stale PARTIAL **`STALE_READ_VISIBILITY@L2`** first (cleanup STOP after); lost/create NO-GO; late GO; unresolvable PARTIAL **`UNRESOLVABLE_LATE_ACK@L8`** first; **throttle/server-error/redirect/bad-cert INCONCLUSIVE**.
- Egress: `NON_LOOPBACK_HOST`, `ACCESS_APPROVAL_REQUIRED`, `LIVE_SECRET_MISSING`, `LIVE_HOST_LOOPBACK`, `PHASE1_LIVE_INERT`; QA transport calls = 0.
- QA mutants: QM01 early STOP→PARTIAL, QM02 INCONCLUSIVE→GO, QM03 reason order — **3/3 killed**. QM03's first patch target was ambiguous and recorded as patch error; narrowed to the unique `buildReasons` block and re-ran guarded targeted; final 3/3. No candidate change.
- Committed M01–M16 all killed; M14–M16 target the new R2 precedence/reason order.

## Findings / limits

- **P0 = 0, P1 = 0, P2 = 0** new product findings. No failure, no repair, no candidate change, no merge. LIM-P0S-1 closure remains Design G4.
- **NOT_RUN:** Linux; real Nutstore/live requests, accounts/credentials (forbidden Phase 1); Phase 2–4; ACCESS-02/G6/G7; real persistence/identity/Zotero/Nutstore; UI/Typora; deployment.
- Candidate clean at exact HEAD; PR #9 head unchanged; QA did not commit/push/merge/rebase/reset/force. Evidence: `qa7\evidence\g3-run\` — `summary.json` SHA-256 `ba3ee2cc…76d0ff9b`; suite `71ac6d80…11fbdb9`; personalities `a930811c…2181ac20`; egress `e13a0f30…ad4ac809`; audit `4b4bd18d…d4e5bef1`; driver `3959a0c7…62cde511`; targeted mutant rerun `61d4e6c2…308ed679`.

**QA STOP.**
