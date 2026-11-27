<!-- BUS from=QA to=DESIGN seq=23 re=MANAGEMENT_TO_EXECUTION.md@52 status=DONE updated=2026-11-27T16:33+01:00 -->
# QA → Design

## P0-STORE R3 live-readiness targeted G3 — **PASS** @ `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef`

- **PR #9** `exec/P0STORE-nutstore-probe-r1` → `main`: OPEN / non-draft / 6 commits; Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`; R3 start `b6fec8e…`.
- **New PR #9 comment: [#7222172332](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7222172332)** — A86 DEC-27 itemized P1/group/audit/live/mutant/byte table.
- Authority: Management seq 52 / DEC-40=A, A97 §4, `R3_LIVE_READINESS.md` §5.

## Preflight / byte scope

- **First and only** `ls-remote refs/pull/9/head` → exit 0, stderr empty, exact `6a59ce9…	refs/pull/9/head` (`15:02:17.423Z–15:02:19.288Z`); no retry.
- Fresh full clone, `core.autocrlf=false`, detached, clean; Base ancestor; B..HEAD **6 single-parent commits, 0 merges**; **31 additions / 0 M-D**; Base 275 / HEAD 306; Execution `ba43519` results not reused.
- **7/7 freeze paths byte-identical to `b6fec8e`**: gate/secret/trace/oracle/verdict/support/example-plan. Real host exactly **2 files / 2 occurrences**: live plan + `src/plan.mjs::LIVE_HOST`. `PHASE1_LIVE_ENABLED` only dead definition + frozen harness re-export, no live code reads it. Live plan approval/runId/pinnedCa all `null`.

## Environment

Windows 10.0.19045 x64; Node **v22.23.5 x64** full path, non-elevated; A59 offline proof `15:11:36Z`; every group pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP no-error not counted. Linux **NOT_RUN**. No real Nutstore host/account/credential; no credential value set by QA.

## Eight groups

| # | group | actual |
| --- | --- | --- |
| 1 | syntax | **26/26** `.mjs` |
| 2 | full suite | **85/85**; P1-01..15 present; zero fail/skip/todo/cancelled |
| 3 | QA-strict upstream | WP-01 **67/67**, WP-02 **44/44** nested 67, WP-03 **103/103**, WP-04 **91/91** |
| 4 | audit | positive + count-neutral negatives **7/7** |
| 5 | QA live matrix | **14/14** zero-transport / poisoned-env cases |
| 6 | static | **4/4** (corrected path-separator in QA script; see below) |
| 7 | byte proof | **7/7** freeze paths |
| 8 | mutants | committed **22/22**; QA gating **3/3** |

- Audit: extra `UNEXPECTED_ADDED_PATH`; Base path full `UNEXPECTED_ADDED_PATH` + dedicated `BASE_PATH_CHANGED_AT_HEAD`; protected dedicated `PROTECTED_HEAD_BLOB_CHANGED`; untracked `UNEXPECTED_WORKTREE_PATH`; mode `BASE_PATH_MODE_CHANGED_AT_HEAD`; symlink `HEAD_TREE_NON_REGULAR_MODE (120000)`.
- Live matrix: `LIVE_FLAG_REQUIRED`, `LIVE_PLAN_MODE_REQUIRED`, 4× `LIVE_HOST_MISMATCH` (evil/bare/IP/uppercase), `LIVE_PORT_MISMATCH`, `LIVE_PATH_PREFIX_MISMATCH`, `LIVE_PLAN_SELF_AUTHORIZED`, `LIVE_APPROVAL_REQUIRED`, `LIVE_APPROVAL_INVALID`, `LIVE_RUN_ID_SUPPLIED`, `NODE_RUNTIME_MISMATCH`; every refusal trace empty + **0 transport calls**; poisoned env never read.
- All conditions satisfied + QA stub transport: first target exactly `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runId>/…`, L0 `OPTIONS/PROPFIND`, MKCOL dir, first PUT prefix, STOP `THROTTLE`; canary absent from trace/preflight/error; no socket.
- QA mutants: missing approval, wrong host, skip Node check — **3/3** killed by refusal assertions. Committed M17–M22 cover the same gating rules; all M01–M22 killed.
- **G6 correction:** full run initially reported G6 false only because QA path checks used `/` against Windows `\`; the underlying values were correct (2 PHASE1 dead refs, 2 host files, null plan). Checks normalized; guarded targeted G6 rerun **4/4**. No candidate change.

## Findings / limits

- **P0 = 0, P1 = 0, P2 = 0** new product findings. No candidate change, no merge, no repair; no live request.
- **NOT_RUN:** Linux; any real Nutstore/live request/account/credential (forbidden R3); Phase 3 / ACCESS-02 / G6; G7; real persistence/identity/UI/Typora/deployment.
- Candidate clean at exact HEAD; PR #9 head unchanged; QA did not commit/push/merge/rebase/reset/force. Evidence: `qa8\evidence\g3-run\` — `summary.json` SHA-256 `9542aa61…f9536993`; suite `2af17c51…60de3f34`; live `14e29eaf…691f45271`; audit `4b4bd18d…d4e5bef1`; driver `9bd0ab29…459328a`; byte proof `f49d5d2b…68ec37a`; corrected G6 `g6-static-run\summary.json` `aa00136b…0b72605`.

**QA STOP.**
