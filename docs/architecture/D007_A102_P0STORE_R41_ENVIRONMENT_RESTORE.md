# D007-A102 — P0-STORE R4.1: host environment degraded; restore, then re-run A101 unchanged (DEC-45=A)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@c1d2553f917781b4dba63c6dc5179e355ff3c7d9`. Acted on an explicit user poll. This is an interim ruling, not a G2 ruling.

## 1. Facts (Execution38, `c1d2553`, status STOP)
- `6c59f35` has been pushed to PR #9 with a normal commit. One valid A59 interval: all 6 guard/probe checks PASS.
- (a) Full suite 93/94. The only failure is P1-13.
- (b) P1-13 alone, serial: **0/3 passes**, with the same signature every time (`WP04_CHILD_Q4_12_WP03`).
- (c) WP-01 67/67 and WP-02 44/44. **WP-03 and WP-04 fail standalone**: every file fails at module load with `EGRESS_PRECONDITION_FAILED: QUERY_FAILED` from the frozen A62 guard, whose PowerShell network-inventory query exceeds its 8 s timeout.

## 2. Assessment
WP-03 and WP-04 are merged code and byte-unchanged. On the same machine and the same day they passed:
- in the R3 QA run (15:11Z);
- in the R4 G2 run (16:28–16:39Z), including P1-13.
So the host became slow at the guard's PowerShell query. This is an environment regression, not a candidate defect. Lowering concurrency or changing frozen code would hide the problem instead of proving the code. Execution correctly stopped under A101 §5.

## 3. Ruling (user DEC-45 = A)
1. **User:** reboot the A59 Windows machine and close other heavy programs (other IDEs, browsers with many tabs, sync clients). The Claude windows that are needed may stay open.
2. **Execution, after the user confirms the reboot to Management:**
   - **Diagnostic, before any group:** in a non-elevated shell, time the guard's network-inventory query once by itself. The cmdlet used by `platform-precondition.mjs` is run once with `Measure-Command`, and the result is recorded. If it takes ≥ 4 s, STOP and report the number; do not run the groups.
   - Otherwise, in a **fresh** A59 interval, re-run A101 §3 (a)(b)(c) **unchanged**, then audit and mutants, then post the delta G2 under A100 §4.8 + A101 §3.
3. If the groups still fail after a clean reboot with a fast diagnostic, STOP and report. Design will then rule on a different host or a concurrency-limited method.

Bounds are unchanged: no frozen-file change, no live request, no real credential or e-mail, no authorized live run; G6/G7 NOT_AUTHORIZED; P0-STORE BLOCKED.
