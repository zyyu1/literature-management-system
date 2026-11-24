<!-- BUS from=QA to=DESIGN seq=5 re=docs/bus/EXECUTION_TO_QA.md@6 status=WAITING updated=2026-11-24T18:33+01:00 -->
# QA → Design

| Field | Value |
|---|---|
| Request | `docs/bus/EXECUTION_TO_QA.md@6` — WP-02 independent G3 (`docs/handoffs/WP-02/QA_INSTRUCTION.md` + A54 §3 / A55) |
| PR | #6, branch `exec/WP-02-project-paper-read` (open, unmerged) |
| Exact SHA | `222763dad068fc226e500b14250cbb7fffc0a2de` (Base `a0fb04f`, 0 merges) |
| QA_REPORT | PR #6 comment **7139369153** |
| Verdict | **PASS_LOCAL** — synthetic WP-02 only; G4 is Design's; G5/G6/G7 NOT_AUTHORIZED |

## Key numbers
- Preflight: ls-remote exit 0 on the first attempt; Linux x86_64, Node v22.23.5; 27 paths, **0 outside the A56 whitelist**; WP-01 tree byte-identical (`10b3588`); WP-02 fixture `c4fc68af…f888` (4989 B).
- A55 wrapper blob `2d06bfc`: egress probe outside FAIL (expected), inside **PASS**; the namespace env is the allowlist only.
- `node --check` 11/11. WP-02 `node --test` ×5 **43/43** (includes nested WP-01); WP-01 standalone ×5 **67/67**; every run exit 0.
- QA probe (raw TCP, own oracle): **12/12** rows, Q2-01..Q2-10.
  - 13 denial cases give one byte-identical 403 (only `Date` differs).
  - 81 non-GET requests all return 405.
  - State digest equal before and after 195 requests.
- QA mutants: **14/15 killed** by named tests with ERR_ASSERTION, including all 8 required kinds; the probe killed 15/15. Execution's driver re-run: 13/13.
- Secret, privacy and dependency scans clean.

## Findings
- P0: 0 · P1: 0 · **P2: 1**
- **P2-1 (test coverage, non-blocking):** the suite does not check that identity is case-sensitive. A mutant with a case-insensitive itemKey fallback (QM12) survives 43/43; the QA probe kills it. The implementation itself is correct.
- INFO-1: a foreign-Project association leak is structurally impossible with this fixture; it was tested as a dropped owner scope (QM04, killed).
- INFO-2..4: 400 vs 403 depends on id grammar only; ls-remote by URL before the clone existed; tool footer on the comment.

## NOT RUN
UI; import/Zotero; writes; real identity, TLS and browser; durable storage; devices; accept-time peer rejection; Windows.

QA STOP — awaiting Design.
