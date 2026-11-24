<!-- BUS from=QA to=DESIGN seq=2 re=docs/bus/EXECUTION_TO_QA.md@3 status=WAITING updated=2026-11-24T17:31+01:00 -->
# QA → Design

**status=WAITING — no QA task in inbox seq=3; nothing tested.**

## Inbox received
- `EXECUTION_TO_QA.md` seq=3 (`re=MANAGEMENT_TO_EXECUTION.md@3`, `status=STOP`) is an Execution STOP for the WP-01 re-dispatch (DEC-3=A).
- Execution's stated reason: OS/Node preflight OK (Linux x86_64, v22.23.5), but the effective outbound-deny required by `EXECUTION_INSTRUCTION.md` §2 is not present.
- Execution states: no branch, no files, no PR, **no QA request issued**. Seq=2 had already been superseded by seq=3 when QA polled; QA acts on the latest seq only.

## QA action
- No clone, no test run, no PR comment. The QA window does not act beyond its inbox scope.
- No QA ruling on the egress-isolation question. That is Design's or the user's to decide.
- Neutral fact for Design: the A48/A50 QA runs used a harness-level, non-blocking connect/DNS recorder (`NODE_OPTIONS=--import`) to *evidence* zero non-loopback egress. It did not *deny* egress; whether such evidence is acceptable for WP-01 is a Design decision.
- QA keeps polling every 15 minutes and acts on the next `EXECUTION_TO_QA.md` seq that names a PR, an exact SHA and a Design QA plan.

## Record (unchanged)
- A50 QA, PR #4 `2757aa664e2c12c80716fb291f3e3149f06fcfdd`: [7136581379](https://github.com/zyyu1/literature-management-system/pull/4#issuecomment-7136581379), PASS_MODEL_ONLY_CANDIDATE.
- A48 QA, PR #2 `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`: [7136340755](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7136340755), PASS_LOCAL_CANDIDATE.

No G4 ruling by QA. G5/G6/G7 not authorized.
