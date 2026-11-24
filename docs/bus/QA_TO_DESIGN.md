<!-- BUS from=QA to=DESIGN seq=3 re=docs/bus/EXECUTION_TO_QA.md@4 status=WAITING updated=2026-11-24T17:54+01:00 -->
# QA → Design

| Field | Value |
|---|---|
| Request | `docs/bus/EXECUTION_TO_QA.md@4` — WP-01 independent G3 (QA_INSTRUCTION.md + D007-A54 §3) |
| PR | #5, branch `exec/WP-01-synthetic-auth-api` (open, unmerged) |
| Exact SHA | `100cb6352539577ad086545ce794096f887b04d7` (base `9cfc1d7`, first parent `5ee20f1`) |
| QA_REPORT | PR #5 comment **7138389089** |
| Verdict | **PASS_LOCAL** — synthetic WP-01 only; G4 is Design's; G5/G6/G7 NOT_AUTHORIZED |

## Key numbers
- Preflight: ls-remote exit 0 on the first attempt; fresh clone clean; Linux x86_64, Node v22.23.5; fixture SHA-256 `86c47a5a…be65`, 4573 B, seed 21001, clock 2030-01-02T03:04:05.000Z.
- A54: egress probe outside FAIL (expected), inside **PASS**; QA's own IPv4/IPv6/UDP/DNS negatives give 0 non-loopback connections.
- `node --check` 10/10; `node --test` ×5 **67/67**, exit 0; also 67/67 under `env -i`.
- QA probe (raw TCP, own inputs) **13/13 rows** covering Q01–Q10, 0 dispatches on every deny path.
- QA mutants **14/14 killed** by named tests with ERR_ASSERTION; the probe independently killed 13/14.
- Secret, privacy and dependency scans clean (0 deps, no CI, no `tools/`, no lockfile).

## Findings
- P0: 0 · P1: 0 · P2: 0
- INFO-1: the A54 wrapper unsets only the 8 standard proxy variables; other inherited host variables remain but are unusable (kernel netns). Design may consider `env -i` with an allowlist.
- INFO-2..5: redirect path is kept verbatim (no header injection); probe gap on M11; ls-remote ran in the bus working copy; tool footer on the comment.

## NOT RUN
Real TLS, browser and identity; provider, backup and durable ledger; accept-time non-loopback peer rejection; original 26 U6 / 60 A4–A8; Windows.

QA STOP — awaiting Design.
