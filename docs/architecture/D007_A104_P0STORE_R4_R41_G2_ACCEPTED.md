# D007-A104 — P0-STORE R4 + R4.1 G2 ACCEPTED at exact `b2b0082`; targeted G3 released (DEC-47=A)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@5d9c650df306e6a2cb39d1a9f047a37d46423dd5`. Acted on a scheduled poll; the user decided by clickable choice.

## 1. Evidence
Execution40 (`5d9c650`) and PR #9 delta G2 [#7225015533](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7225015533) at exact HEAD `b2b008295736dc09829e5272638c19aedc9c1442`. That HEAD has a single parent, `6c59f35`, and adds only `QA_HANDOFF.md`.

Design re-checked:
- `a168ee9..6c59f35` changes 4 files (runner, p1-16, mutation-check, README), exactly the A100 §4 list.
- `6c59f35..b2b0082` changes only `QA_HANDOFF.md`.
- The runner gates the live early stop on `authenticated === true` (`request.auth !== false`), as A103 §2 already confirmed.

Reported, in one valid A59 interval with 16/16 probes:
- full suite **94/94** (P1-13 green inside the suite this time);
- upstream run directly with concurrency 1: 67/44/103/91;
- P1-16 9/9: U-07 = 3 calls `[false,false,true]` → `UNEXPECTED_401@L0`; U-10 passes L0 into L1 MKCOL;
- audit 275/32/94/307;
- mutants **26/26** (M26 killed by U-10);
- carry-forward byte proof against `16f0cb0`: all exit 0.

## 2. Findings
- INFO-1: Execution's local checker expected ≥ 10 P1-16 tests; there are 9, because U-09 is covered by mutants. The verdict was re-derived from raw logs, with nothing re-run and nothing changed. Accepted.
- INFO-2: LIM-P0S-2 is recorded as A103 §3.3 specifies.
- INFO-3: Linux NOT_RUN.

## 3. Ruling
**R4 + R4.1 G2 ACCEPTED** at exact `b2b008295736dc09829e5272638c19aedc9c1442`. This includes everything already accepted in A100 §1. **DEC-47 = A: independent targeted G3 released.**

## 4. QA targeted G3 (independent; exact HEAD only)
1. First and only `ls-remote refs/pull/9/head` after the dispatch; it must equal `b2b0082…`. A59 offline interval, pinned Node v22.23.5 x64 by full path, non-elevated, guard + probe around each group.
2. Full suite at least once. P1-13 and upstream follow the A103 carry-forward rule: QA's own byte proof against `16f0cb0` (P1-13, `packages/` minus the R4.1 files, guard, `support/`), plus direct upstream runs with `--test-concurrency=1`. A guard-timeout-only failure of P1-13 is recorded and does not block if the byte proof holds.
3. **QA-written auth-identity matrix** using a QA stub transport and synthetic values only (`*@example.invalid`). Each refusal must show zero transport, an empty trace and a poisoned password env that is never read:
   - user env missing → `CREDENTIAL_USER_MISSING`;
   - user env empty → `CREDENTIAL_USER_MISSING`;
   - `:`, a space, no `@`, a control character, and 255 characters → `CREDENTIAL_USER_MALFORMED`;
   - live plan without `credentialUserEnvVar` → `PLAN_REJECTED`.
4. **QA early-stop matrix:**
   - (i) unauthenticated 401 + authenticated 401 → exactly 3 calls, `UNEXPECTED_401@L0`;
   - (ii) unauthenticated 401 + authenticated 207 → reaches L1;
   - (iii) unauthenticated 401 + authenticated 403 → 3 calls and a stop;
   - (iv) mock/local mode with a 401 → unchanged R3 behaviour.
5. **Canary and Authorization:** canary user and password are absent from trace, console, preflight, result and errors, in clear, `user:pass` and base64 forms. The stub-observed header decodes to exactly `<user>:<password>`. Local/mock mode still uses `probe`.
6. **Byte proof:**
   - all frozen files against `6a59ce9` and `a168ee9`;
   - the live plan differs from `6a59ce9` by the one key only;
   - the 3 R3 gate negatives (wrong host, approval missing, Node mismatch) are still refused.
7. Audit positive plus count-neutral negatives (A88 rule). Committed mutants 26/26, plus at least 3 QA-own mutants.
8. Post the itemized G3 on PR #9; QA bus to Design. No live request, no real credential or e-mail.

Bounds: no authorized live run (the next one needs G4, runbook rev 3, and a new user DEC with a new approval id); G6/G7 NOT_AUTHORIZED; P0-STORE BLOCKED.
