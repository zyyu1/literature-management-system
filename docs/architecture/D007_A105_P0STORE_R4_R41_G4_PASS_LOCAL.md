# D007-A105 — P0-STORE R4/R4.1 G4 PASS_LOCAL; runbook rev 3; live run 2 request (DEC-48 pending)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@8f2d58eab7254473a530429e50cf9596dbcf39d8`. Acted on a scheduled poll.

## 1. Evidence
QA24 (`8f2d58e`) and PR #9 [#7225443033](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7225443033) at exact `b2b008295736dc09829e5272638c19aedc9c1442`, read in full.
- **Preflight:**
  - first and only `ls-remote` at 18:05:59.897Z, after Management63 was committed at 18:05:09Z; exact SHA;
  - 10 single-parent commits; Base 275 → HEAD 307;
  - A59 offline interval with guard + probe around every group; Node v22.23.5 x64 by full path, non-elevated.
- **Seven groups, all PASS:**
  - syntax 27/27;
  - suite **94/94** (P1-01..16, with P1-13 green in the suite);
  - upstream run directly 67/44/103/91;
  - audit positive + count-neutral negatives 7/7;
  - QA auth-identity matrix **8/8**: zero transport and an empty trace in every case, and the poisoned password getter was never read;
  - QA early-stop matrix **4/4**: auth 401 → 3 calls; auth 207 → reaches L1; auth 403 → 3 calls; mock mode unchanged;
  - canary and Authorization PASS;
  - the R3 gate negatives are still refused;
  - byte/carry proof 6/6 against `6a59ce9`, `a168ee9` and `16f0cb0`, including the one-key live-plan proof;
  - mutants 26/26 + QA QM01–QM03.
- P0/P1/P2 = 0. Linux NOT_RUN.

## 2. Ruling
**G3 VERIFIED, G4 PASS_LOCAL at exact `b2b008295736dc09829e5272638c19aedc9c1442`** for R4 + R4.1. LIM-P0S-2 remains recorded. Status: **`ACCESS02_RUN2_REQUEST_READY`**.

## 3. Live run 2 request (DEC-48)
- [Runbook rev 3](../handoffs/P0-STORE/PHASE3_RUNBOOK.md): exact `b2b008295736dc09829e5272638c19aedc9c1442`, `dav.jianguoyun.com:443`, `/dav/LMS-P0STORE/<runtime runId>/`.
- Approval id `P0STORE-ACCESS-02-20261127-b2b0082`; operator = user; **one run only**.
- New app password before the run, revoked after; the e-mail and password are entered only in the run window.
- Outcome handling as in A98 §4: Execution attaches the redacted files, independent QA re-derives the verdict offline, Design rules per A90 §6/§10.
- A 401 on the authenticated request now ends after 3 requests and points to a wrong e-mail or app password. No retry under the same approval.

G6 beyond this run and G7 remain NOT_AUTHORIZED; P0-STORE stays BLOCKED until the Design verdict.
