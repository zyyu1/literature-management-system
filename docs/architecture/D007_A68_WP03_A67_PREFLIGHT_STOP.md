# D007-A68 — WP-03 A67 independent QA preflight STOP and next-host decision

2026-11-25 Europe/Berlin. Observed main parent `47298807aa0a8685274e1a51fe2bdd01e99d4f5e`. User-confirmed workflow in canonical handoff: Design proposes, Management obtains user decision, then dispatches. No new execution authority in this document.

## Verified receipt and ruling
QA bus seq12 re=Execution@16 STOP, [immutable bus evidence](https://github.com/zyyu1/literature-management-system/blob/47298807aa0a8685274e1a51fe2bdd01e99d4f5e/docs/bus/QA_TO_DESIGN.md). Its introducing commit changes only QA_TO_DESIGN. GitHub PR #7 independently confirmed OPEN/unmerged exact HEAD `e6b1180e4e3e5790958ae3319af18bba8889ffbc`. Execution relay seq16 and [historical Execution comment #7168708378](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7168708378) match target. [QA seq11 original comment #7168907120](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7168907120) remains PARTIAL_TEST_GATE evidence. Seq12 explicitly has no new PR comment; accept bus as reported preflight STOP only, not verified new runtime QA. QA reports first remote check exit 0, fresh detached clean checkout, Linux x86_64, Node v24.22.3 instead of required v22.23.5. No tests, egress probes, mutants, full protected-path verification; no independent test evidence gained. Design did not execute tests. Reported timestamp precedes upstream dispatch timestamp; sequence and immutable commit order establish receipt order, clock chronology not certified. No candidate code failure established.

A67 attempt G3_PREFLIGHT_FAILED / STOP. Existing G3/G4 PARTIAL_TEST_GATE at unchanged exact SHA retained; P1-WP03-DESIGN-1 and P2-WP03-DESIGN-2 OPEN. Linux preflight reported only; Linux runtime NOT_RUN. No version waiver, no installation or system change. G5/G6/G7 NOT_AUTHORIZED; R2/P0-STORE/WP04 blocked.

## DEC-12 — Management must obtain user choice
A (recommended): separately user-opened independent eligible QA session with existing exact Node v22.23.5 x64 and verifiable A59 offline Windows boundary (as in seq11); Linux not required under A67/DEC-11. 
B: separately user-opened Linux x86_64 QA session with already available exact Node v22.23.5 and A54/A55 namespace proof; do not use current wrong runtime or install anything under this choice.
C: defer A67 and retain PARTIAL_TEST_GATE.

A/B after user decision only: fresh Management dispatch referencing A65/A66/A67/A68 and DEC-12, Execution read-only relay at unchanged SHA; fresh independent QA preflight and all five A67 §3 matrices including full simulated integration 103/103; retain seq11 same-SHA valid main gates only. No tracked changes, no automatic machine changes, no networked test suite, no real service, no merge. Recheck exact head, if any mismatch STOP. Publish original QA PR comment and next QA bus; Design re-verifies before new G4. C: no dispatch. PR2/4, frozen UI untouched.

Design STOP — WAIT_USER_DECISION via Management.
