<!-- BUS from=QA to=DESIGN seq=21 re=MANAGEMENT_TO_EXECUTION.md@48 status=DONE updated=2026-11-27T13:35+01:00 -->
# QA → Design

## P0-STORE Phase 1 independent G3 — **PASS** @ `88e1bd76dc94fc38876fa28c975d317b1c1573c2`

- **PR #9** `exec/P0STORE-nutstore-probe-r1` → `main`: OPEN / non-draft / 2 commits; exact HEAD `88e1bd76dc94fc38876fa28c975d317b1c1573c2`; Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`.
- **New PR #9 comment: [#7218403149](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7218403149)** — A86 DEC-27 itemized P1 / group / audit / personality / mutant / traceability table.
- Authority: Management seq 48 / DEC-34=A, A91 §4, P0-STORE QA_INSTRUCTION + DESIGN (both read from main).

## Preflight / environment

- **First and only** `ls-remote refs/pull/9/head` → exit 0, stderr empty, exact `88e1bd7…	refs/pull/9/head` (`12:00:41.327Z–12:00:43.146Z`); no retry.
- Fresh full clone, `core.autocrlf=false`, detached, clean; Base ancestor; B..HEAD **2 single-parent commits, 0 merges**; **28 additions / 0 M-D**; Base 275 / HEAD 303; 0 symlinks; `9e772e6..88e1bd7` only QA_HANDOFF. All G3 evidence at final head; Execution's `9e772e6` result not reused.
- Windows 10.0.19045 x64; Node **v22.23.5 x64**; A59 offline proof `12:22:12Z`; every group pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP no-error not counted. Linux **NOT_RUN**. No real Nutstore host/account/credential.

## Seven groups (all PASS)

| # | group | actual |
| --- | --- | --- |
| 1 | syntax | **24/24** `.mjs` |
| 2 | P0-STORE `node --test` | **50/50**; P1-01..13 present; zero fail/skip/todo/cancelled |
| 3 | QA-strict upstream | WP-01 **67/67**, WP-02 **44/44** nested 67, WP-03 **103/103**, WP-04 **91/91** |
| 4 | candidate audit | positive + **6 count-neutral negatives**; 7/7 dedicated checks |
| 5 | QA personality matrix | **11/11** independent verdict/STOP assertions |
| 6 | QA egress proof | 5/5 missing live combos **zero transport calls**; static host scan clean; canary absent |
| 7 | mutants | committed **13/13**; QA independent **6/6** killed by named assertions |

- Audit actual: AUD-01 `UNEXPECTED_ADDED_PATH`; AUD-02 full `UNEXPECTED_ADDED_PATH: README.md` + dedicated **`BASE_PATH_CHANGED_AT_HEAD`** via count-neutral `verifyBaseTree`; AUD-03 dedicated **`PROTECTED_HEAD_BLOB_CHANGED`**; AUD-04 `UNEXPECTED_WORKTREE_PATH`; AUD-05 `BASE_PATH_MODE_CHANGED_AT_HEAD`; AUD-06 `HEAD_TREE_NON_REGULAR_MODE (120000)`.
- Personalities: strong **GO**; weak/stale **PARTIAL**; lost-update/create-overwrite **NO-GO** (STOP L5/L2); late-ack **GO** resolved 3/3; unresolvable **PARTIAL**; throttle/server-error/redirect/bad-cert **STOP** at L0.
- Egress codes: `NON_LOOPBACK_HOST`, `ACCESS_APPROVAL_REQUIRED`, `LIVE_SECRET_MISSING`, `LIVE_HOST_LOOPBACK`, `PHASE1_LIVE_INERT`; transport calls 0; trace empty/gateStats null.
- QA mutants: QM01 TLS off, QM02 follow redirect, QM03 lost-write undetected, QM04 single-process race, QM05 blind late-ACK retry, QM06 credential logging — 6/6 killed by the intended QA assertions.

## Findings / limits

- **P0 = 0, P1 = 0, P2 = 0** new product findings. No failure, no repair, no candidate change, no merge.
- **NOT_RUN:** Linux; real Nutstore/live requests, accounts/credentials (forbidden in Phase 1); Phases 2–4; ACCESS-02/G6/G7; real persistence/identity/Zotero/Nutstore; UI/Typora; deployment.
- One earlier full offline run also reached 7/7 PASS, but two QA mutant assertions crashed before their named check (QM01 null-stop TypeError; QM04 verdict instead of PID). Assertions were hardened; the final clean run above is the evidence. No candidate/test/fixture was touched by QA.
- Candidate clean at exact HEAD; PR #9 head unchanged; QA did not commit/push/merge/rebase/reset/force. Evidence: `qa6\evidence\g3-run\` — `summary.json` SHA-256 `00849e95…4b0fefa`; suite `d8d3f23b…4d8fb02`; audit `4b4bd18d…d4e5bef1`; personalities `b6502c34…b0d42f0`; egress `25211bf8…f26c344950`; mutants `0a75cff9…34728389`.

**QA STOP.**
