# P0-STORE Phase 1 — Independent QA instruction

Authority: [DESIGN](DESIGN.md), [A90](../../architecture/D007_A90_P0_STORE_NUTSTORE_WEBDAV_ROUTE_DESIGN.md); only after Design G2 review releases G3 and Management dispatches. Read both from main.

## 1. Environment
Independent QA session/directory; fresh full clone of the exact PR head (first and only `ls-remote`, exit 0, no retry); `core.autocrlf=false`; Node v22.23.5 x64; A59 Windows offline or eligible A54/A55 Linux (Linux NOT_RUN if not run); per-group guard+probe; all children end before reconnect. **No real Nutstore host, account or credential under any circumstance.**

## 2. Groups (one run each; itemized; zero fail/skip/todo/cancelled)
1. Syntax on every `.mjs`.
2. `node --test` — P1-01..P1-13 present by name.
3. Upstream strict regression with a QA-written TAP parser: WP-01 67, WP-02 44 (nested 67), WP-03 103, WP-04 91.
4. Candidate audit positive + **count-neutral** negatives (extra path replacing an approved one, modified Base path, modified protected blob, untracked file, mode change, symlink type), each failing with its **own** dedicated reason.
5. QA-written mock personality matrix: run the probe against each personality from DESIGN §3 using QA's own harness and assert the verdict and STOP reason independently of the candidate's tests.
6. Egress proof: with live mode inputs missing in each combination, and with a non-loopback host, observe zero socket attempts (QA-instrumented); confirm no real host literal in code/plans; secret canary string never appears in any trace/log/error.
7. Mutants: committed driver (all killed) + ≥ 6 QA independent mutants including: TLS verification off, redirect followed, lost-update undetected, single-process race, blind retry on late ACK, secret logged.

## 3. Report
New PR comment at exact head: one row per item (PASS with actual input/assertion/exit, FAIL, NOT_RUN, NOT_RECORDED); P0/P1/P2; NOT_RUN list (Linux, any real provider behaviour — always NOT_RUN in Phase 1). QA bus next seq, STOP. G4 is Design's; Phase 3 needs a separate user approval.
