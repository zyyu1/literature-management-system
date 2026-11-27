<!-- BUS from=QA to=DESIGN seq=24 re=MANAGEMENT_TO_EXECUTION.md@63 status=DONE updated=2026-11-27T19:24+01:00 -->
# QA → Design

## P0-STORE R4/R4.1 targeted G3 — **PASS** @ `b2b008295736dc09829e5272638c19aedc9c1442`

- **PR #9** `exec/P0STORE-nutstore-probe-r1` → `main`: OPEN / non-draft / 10 commits; Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`; R4.1 base `a168ee9…`.
- **New PR #9 comment: [#7225443033](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7225443033)** — A86 DEC-27 itemized P1/group/audit/auth/early/byte/mutant table.
- Authority: Management seq 63 / DEC-47=A, A104 §4.

## Preflight / environment

- **First and only** `ls-remote refs/pull/9/head` → exit 0, stderr empty, exact `b2b0082…	refs/pull/9/head` (`18:05:59.897Z–18:06:01.545Z`); no retry.
- Fresh full clone, `core.autocrlf=false`, detached, clean; Base ancestor; B..HEAD **10 single-parent commits, 0 merges**; **32 additions / 0 M-D**; Base 275 / HEAD 307.
- Windows 10.0.19045 x64; Node **v22.23.5 x64** full path, non-elevated; A59 offline proof `18:08:26Z`; every group pre/post guard+probe PASS; external IPv4/LAN `EHOSTUNREACH`, IPv6 `ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; UDP no-error not counted. Linux **NOT_RUN**. No live request; no real credential/e-mail.

## Seven groups

| # | group | actual |
| --- | --- | --- |
| 1 | syntax | **27/27** `.mjs` |
| 2 | full suite | **94/94**; P1-01..16 present; P1-13 green in-suite |
| 3 | upstream direct `--test-concurrency=1` | WP-01 **67/67**, WP-02 **44/44** nested 67, WP-03 **103/103**, WP-04 **91/91** |
| 4 | audit | positive + count-neutral negatives **7/7** |
| 5 | QA auth + early-stop | **16/16** |
| 6 | byte/carry | **6/6** |
| 7 | mutants | committed **26/26**; QA **3/3** |

## Auth identity / early stop (QA-written)

- AUTH-01..08: missing/empty user → `CREDENTIAL_USER_MISSING`; `:`/space/no-`@`/control/255 chars → `CREDENTIAL_USER_MALFORMED`; live plan without `credentialUserEnvVar` → `PLAN_REJECTED`. Every case: **0 transport**, empty trace, poisoned password getter never read.
- EARLY-01: unauth 401 + auth 401 → exactly **3 calls** `[false,false,true]`, `UNEXPECTED_401@L0`, INCONCLUSIVE, cleanup 0.
- EARLY-02: unauth 401 + auth 207 → L0 PASS and **L1 MKCOL** reached.
- EARLY-03: unauth 401 + auth 403 → 3 calls, stop `UNEXPECTED_401@L0`.
- EARLY-04: local/mock still uses `probe:<password>`; unauth 401 does not early-stop.
- CANARY: live header decodes exactly `<synthetic user>:<password>`; user/password absent from trace/preflight/result/console/error in clear, pair, base64 and Basic forms.
- R3-01..03: wrong host / missing approval / Node mismatch still refused with zero transport.

## Byte / carry proof

- vs `6a59ce9`: gate/trace/oracle/verdict/support/example-plan **6/6** unchanged; `secret/plan/runner` are allowed R4 changes (secret is not frozen across R3→R4).
- vs `a168ee9`: all 7 incl. `secret` **7/7** unchanged.
- `16f0cb0..HEAD`: exactly 5 allowed paths (`QA_HANDOFF`, README, mutation-check, runner, p1-16); P1-13 + frozen guard + support unchanged.
- live plan vs `6a59ce9`: exactly one added key `credentialUserEnvVar`; no changed/removed.
- Suite 94/94 and direct upstream 67/44/103/91 independently green; A103 carry proof re-established.

## Mutants

- Committed M01–M26 all killed; M23 hard-coded `probe` user, M24 no user redaction, M25 no first-401 stop, M26 unauth early stop.
- QA QM01 missing/empty user accepted, QM02 malformed user accepted, QM03 unauth early stop — **3/3 killed** (QM01/QM02 by poisoned password read before user validation; QM03 by EARLY-02).
- `MUTATION_SUMMARY killed=26/26`; `QA_MUTANTS9 killed=3/3`.

## Findings / limits

- **P0 = 0, P1 = 0, P2 = 0** new product findings. No candidate change, no merge, no repair; no live request.
- **NOT_RUN:** Linux; real Nutstore/live request/account/credential (next needs G4 + runbook rev 3 + new DEC/approval); Phase 3/ACCESS-02/G6; G7; real persistence/identity/UI/Typora/deployment.
- LIM-P0S-2 remains recorded; this run had P1-13 green in-suite and upstream direct green.
- Candidate clean at exact HEAD; PR #9 head unchanged; QA did not commit/push/merge/rebase/reset/force. Evidence: `qa9\evidence\g3-run\` — `summary.json` SHA-256 `7b1165e4…16119834`; suite `19ec0cd9…b13b7dca1`; auth `4720072d…7a4248ec`; audit `4b4bd18d…d4e5bef1`; driver `e1b25ef6…3e0db32`.

**QA STOP.**
