# D007-A100 — P0-STORE R4 G2 NOT ACCEPTED (spec-induced early-stop defect); R4.1 dispatched (DEC-43=A)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@275703ca27e9f248449c0a49f7604fb7c54f1af4`. Acted on an explicit user poll.

## 1. Evidence
Execution36 (`275703c`); PR #9 G2 [#7223579792](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7223579792) at exact HEAD `a168ee9c91bf7b49f4571ced6046a1bc6da38a54` (R4 evidence commit `16f0cb0`, single parent `6a59ce9`, plus a docs-only QA_HANDOFF commit). The run-1 redacted files were attached in [#7223574650](https://github.com/zyyu1/literature-management-system/pull/9#issuecomment-7223574650): console 1892 B, trace 1660 B, scan 0 hits.
Design re-checked:
- the diff `6a59ce9..a168ee9` touches 12 files: the 11 on the R4 §2 list plus `docs/handoffs/P0-STORE/QA_HANDOFF.md` (docs-only, INFO);
- the frozen set is byte-identical (`git diff --quiet` exit 0);
- the live plan adds exactly one key;
- the user-name read, validation, redaction and Basic header match R4 §1.1–1.4;
- reported results: suite 93/93, upstream 67/44/103/91, mutants 25/25, A59 Windows offline interval.

## 2. Blocking finding P1-R4-1 (Design fault)
`stepL0` sends **two unauthenticated requests by design** (`OPTIONS` and `PROPFIND` with `auth:false`, expected status 401) before the authenticated `PROPFIND`. R4 §1.5 told Execution to stop on "the first 401/403", and the implementation (`runner.mjs` ~382) does exactly that for every live request. As a result **every live run would stop on its first, expected, unauthenticated 401** and could never produce a verdict. U-07 asserted the same wrong behaviour ("1 transport call"), so the tests passed. Execution followed the spec, so the fault is in the spec.

## 3. Ruling
**G2 NOT ACCEPTED** at `a168ee9` solely for P1-R4-1. Every other item in §1 is accepted and does not need to be re-proven, except where R4.1 touches it.

## 4. R4.1 (user DEC-43 = A)
1. The live early stop applies only to requests sent **with** credentials: in live mode, a 401/403 on an authenticated request stops the run with `UNEXPECTED_401` and no further request. Unauthenticated requests whose expected status includes 401 keep the existing behaviour.
2. The cleanup branch (~1020) is unchanged, because its requests are authenticated.
3. **U-07 rewritten:** stub = 401 for unauthenticated L0 requests and 401 for the authenticated PROPFIND. Expect **exactly 3** transport calls (2 unauthenticated + 1 authenticated), stop `UNEXPECTED_401@L0`, INCONCLUSIVE, no cleanup.
4. **New U-10:** stub = 401 for unauthenticated L0 requests and 207 for authenticated requests. The run must pass L0 and send at least one L1 request (`MKCOL`); there is no `UNEXPECTED_401` at L0.
5. **New mutant M26:** "early stop also on unauthenticated 401" must be killed by U-10.
6. Allowed files: `src/runner.mjs`, `test/p1-16-auth-identity.test.mjs`, `scripts/mutation-check.mjs`, `README.md`, `docs/handoffs/P0-STORE/QA_HANDOFF.md`. Every other file is byte-identical to `a168ee9`.
7. Normal commits on PR #9.
8. Execution posts a delta G2 at the new exact HEAD with:
   - the diff limited to the files in item 6;
   - byte proof against `a168ee9` for all other files;
   - full suite, upstream, audit and mutants;
   - U-07 and U-10;
   - the A59 offline interval.

Bounds are unchanged: no live request, no real credential or e-mail, no authorized live run; G6/G7 NOT_AUTHORIZED; P0-STORE BLOCKED.
