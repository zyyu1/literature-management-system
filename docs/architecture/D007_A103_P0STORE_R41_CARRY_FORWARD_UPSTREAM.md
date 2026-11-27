# D007-A103 — P0-STORE R4.1: carry forward byte-identical upstream evidence (DEC-46=A)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@e37531d5660ee6b6fd33eefee472a59411d9050c`. Acted on an explicit user poll. This is an interim ruling, not a G2 ruling.

## 1. Facts
- Execution39 (`e37531d`) stopped under A102 step 1. The host had just rebooted (boot at 18:34:48+01:00).
- One timing of the frozen guard's PowerShell inventory query: **3738 ms** for the query alone, 4016 ms in total with Node start-up.
- At that speed, the 11–12 concurrent test files of WP-03/WP-04 will exceed the guard's 8 s timeout.
- A102 meant the query body; read that way the measurement passes (3738 ms < 4 s), but only just. Execution read it as the total, which was the stricter reading and a correct one to take.

## 2. Design verification at exact SHAs
`git diff --stat 16f0cb0 6c59f35` changes only 5 files:
- `src/runner.mjs`
- `test/p1-16-auth-identity.test.mjs`
- `scripts/mutation-check.mjs`
- `README.md`
- `docs/handoffs/P0-STORE/QA_HANDOFF.md`

So P1-13, every upstream package (WP-01…WP-04), the frozen A62 guard and `support/*` are **byte-identical** between `16f0cb0` and `6c59f35`. At `16f0cb0`, a valid A59 interval (16:28:30Z–16:39:19Z) recorded:
- suite 93/93 including P1-13;
- upstream 67/44/103/91;
- protected blobs 94/94.

The R4.1 runner change is exactly `classify(..., authenticated)` with `request.auth !== false`, and it gates the live early stop on `authenticated === true`, as A100 §4.1 requires.

## 3. Ruling (user DEC-46 = A)
1. **Carry forward.** The P1-13 result and the upstream results from `16f0cb0` stand for `6c59f35`. The grounds: byte identity of every file they depend on, plus the R4.1 diff touching none of them. Execution re-proves that byte identity in the G2 with `git diff --quiet 16f0cb0 <final HEAD> --` over P1-13, `packages/` other than the R4.1-allowed files, and the guard.
2. **Current-run evidence** at the final exact HEAD, in one fresh A59 interval:
   - full suite once, recorded exactly as it comes out; failures limited to P1-13 with the known guard signature are acceptable;
   - the four upstream suites run directly with `--test-concurrency=1` (a CLI flag only, no code change), each recorded; this is a sanity check, and a guard-timeout failure here is recorded but does not block;
   - P1-16 in full (U-01…U-10);
   - audit;
   - mutants including M26.
3. **LIM-P0S-2** recorded: the frozen A62 guard's PowerShell query is timing-sensitive under concurrency on the A59 host, so P1-13 is carried forward by byte identity while the host is slow.
4. Execution posts the delta G2 under A100 §4.8. Targeted G3 later applies the same carry-forward rule.

Bounds are unchanged: no frozen-file change, no live request, no real credential or e-mail, no authorized live run; G6/G7 NOT_AUTHORIZED; P0-STORE BLOCKED.
