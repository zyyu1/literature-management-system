# D007-A86 — Process streamlining and post-WP-04-R1 roadmap (user decisions)

**2026-11-26 ~20:16 Europe/Berlin.** Observed parent `main@917d5221c8e8d874fc5d7ceb2b792d90cbadf85b`. The user decided the following via clickable options in the Design window (workflow of 20:11: decisions in Design → Board task order → Management → Execution/QA). Recorded as **DEC-26**, **DEC-27**, **DEC-28**.

## DEC-26 — Roadmap after WP-04-R1: storage route first (design only)
After WP-04-R1 reaches its G4 ruling, the next Design work is a **P0-STORE storage-route design**: candidate backends and transaction envelopes, how whole-note CAS and multi-object consistency (A5/A6/A10 §5) would be proven on real storage, and whether/how to request ACCESS-02. Design-only; it authorizes no account, provider contact, real data, persistence or spending. Further synthetic feature slices (WP-04-R2, WP-05) and frontend work wait until the user decides on that design. WP-04-R1 itself continues unchanged.

## DEC-27 — Moderate acceptance streamlining (applies to new dispatches from now on)
Gates G1–G7, QA independence, exact SHA, isolation and STOP rules are **unchanged**. Changes:
1. **Itemized first-pass reporting.** Every Execution G2 report and every independent G3 report must list **each** required matrix item / test ID / mutant / audit negative from the governing QA instruction individually with one of `PASS` (with the actual input, assertion and exit), `FAIL`, `NOT_RUN` or `NOT_RECORDED`. An aggregate PASS without the per-item table is an incomplete report and is returned for completion of the table only, not treated as a new test round. Goal: no separate "records-only" rounds such as A79→A80.
2. **Combined G5.** A G5 decision option now includes, in one step: Management merges the exact tested HEAD (normal merge commit, pre-merge checks as in A81 §5), then independent QA runs the post-merge offline regression on the exact main containing the merge (as in A83), and Design verifies merge bytes and regression together in one ruling. If the regression fails, the merge stays in history and Design rules STOP/revert options; no auto-revert.
3. Design reviews G2 scope for each new PR before G3 release, as before; it does not demand repeats of evidence already itemized as PASS for the same SHA.

For WP-04-R1 the already dispatched Execution task (Management43) is unchanged; rule 1 applies to its G2 report and to the later G3 report via the QA instruction note.

## DEC-28 — Polling
The Design window keeps polling every 10 minutes in this session until the user stops it. No background execution is claimed for other windows.

## Unchanged boundaries
P0-STORE blocked; G6/G7 NOT_AUTHORIZED; A70/A71 suspended; frozen UI; PR #2/#4 untouched.
