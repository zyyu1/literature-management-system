# D007-A101 — P0-STORE R4.1: evidence method for the flaky frozen P1-13 (DEC-44=A)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@8531dbae1d11ab7f931ccf6dbeaaf005a771c826`. Acted on an explicit user poll. This is an interim ruling on the evidence method, not a G2 ruling.

## 1. Facts (Execution37, `8531dba`, status STOP)
- R4.1 is implemented in local commit `6c59f35` (single parent `a168ee9`) and has **not been pushed**. Per Execution:
  - the live early stop applies only when `request.auth !== false`;
  - the only files changed are the A100 §4 list;
  - U-07 (3 calls) and U-10 pass;
  - mutants M25 (adjusted) and M26 were added.
- The full suite failed 3 times in a row at **93/94**. Each time the single failure was in the frozen **P1-13** chain: WP-04 child Q4-12 → nested WP-03 strict TAP, exit 1.
- Execution's explanation: deep nesting runs several frozen A62 egress-guard PowerShell queries at once, and their 8 s timeout trips under that load.
- One further attempt was voided because the network was restored too early (`probe post-suite FAIL`). Execution correctly kept it out of the evidence.
- P1-13 passed in the R4 G2 (93/93) and in the R3 QA run.

## 2. Assessment
R4.1 does not touch P1-13 or any upstream package; all of them are byte-frozen. The failure is in the frozen test harness's environment-sensitive guard, not in the candidate. Changing frozen files (option 1) would widen the review surface for a harness problem. Leaving P1-13 entirely to QA (option 3) would leave G2 without upstream evidence.

## 3. Ruling (user DEC-44 = A: run P1-13 separately)
1. Push `6c59f35` to PR #9 with a normal commit; nothing is changed in frozen files.
2. In one A59 offline interval with the pinned Node and guard + probe around each group, run:
   - **(a)** the full suite once, recorded exactly as it comes out;
   - **(b)** P1-13 **alone** as `node --test --test-concurrency=1 test/p1-13-upstream.test.mjs`, up to **3 attempts**, every attempt recorded with raw logs;
   - **(c)** the four upstream packages' own suites directly, each on its own: WP-01, WP-02, WP-03, WP-04, expected 67/44/103/91.
3. Acceptance: (a) has no failure outside P1-13, (b) passes at least once and every failure in (b) is the same guard-timeout signature, and (c) is fully green. G2 is then complete, with **LIM-P0S-2** ("frozen P1-13 nested egress guard is timing-sensitive under concurrency; isolated runs are the evidence") recorded.
4. Otherwise, for example (b) never passes or a different failure appears: STOP and report to Design.
5. Everything else in A100 §4.8 is unchanged: diff limited to the allowed list, byte proof against `a168ee9`, audit, mutants including M26, U-07 and U-10.
6. Targeted G3 later uses the same isolated method for P1-13.

Bounds are unchanged: no live request, no real credential or e-mail, no authorized live run; G6/G7 NOT_AUTHORIZED; P0-STORE BLOCKED.
