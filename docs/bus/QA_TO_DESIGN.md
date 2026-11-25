<!-- BUS from=QA to=DESIGN seq=10 re=docs/bus/EXECUTION_TO_QA.md@14 status=DONE updated=2026-11-25T17:16+01:00 -->
# QA → Design

## WP-03-R1 guarded routine writes — independent Windows G3 PASS_LOCAL @ `0fcad9cb6016900d5f7057161619e4a9f2e94b55`

- **PR #7** `exec/WP-03-guarded-r1-writes` → `main` (OPEN, unmerged); **exact SHA** `0fcad9cb6016900d5f7057161619e4a9f2e94b55`; **QA comment ID 7167737629** — https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7167737629
- **Verdict: PASS_LOCAL** on Windows x64, **no P0/P1/P2 findings**. **Linux runtime NOT_RUN**; no dual-platform certification.
- Authority: DEC-11=A / A65 + `docs/handoffs/WP-03/DESIGN.md` + `QA_INSTRUCTION.md`; immutable Base `1684cea5623c8421e16c328c7f1464e8932d3118`.
- Preflight: first remote ref read exit 0 exact SHA; fresh full non-shallow detached clone, `core.autocrlf=false`; **1 incremental commit, 0 merges, 21 added paths, +4,878 lines, 0 modified/deleted Base paths**; clean tree.

### Key numbers (QA-owned, inside the A59 offline interval)

| Gate | Result |
| --- | --- |
| syntax (`node --check`, 18 `.mjs`) | 18/18 |
| WP-03-R1 suite, strict `WP03_REQUIRE_OFFLINE_UPSTREAM=1` | **103/103**, fail 0, skipped 0, todo 0 |
| — internal upstream | `WP01_UPSTREAM 67/67 FULL`; `WP02_UPSTREAM 44/44 FULL` |
| frozen WP-01 | **67/67** |
| frozen WP-02 | **44/44** |
| WP-02 committed driver | **13/13 KILLED**, baseline green |
| WP-03 committed driver | **13/13 KILLED**, baseline green |
| independent raw HTTP | **48/48** (Q3-01…Q3-10 representative invariants, CAS/replay, UNKNOWN/socket-drop, neutral denials, R2 negative) |
| independent QA mutants | **13/13 KILLED** by intended named tests |
| protected paths | **21 added, 0 modified/deleted**, clean tree |
| egress probe | **11/11 EGRESS_PROBE=PASS**; loopback positive; external/LAN IPv4 `EHOSTUNREACH`; IPv6 `ENETUNREACH`; DNS `.invalid` `ENOTFOUND`; tcpConnected=0 |

Environment: Windows 10.0.19045 x64, Node exactly **v22.23.5** win32/x64, user-controlled offline interval (A59). Fixtures frozen (`wp01 86c47a5a...`, `wp02 c4fc68af...`); no dependencies; imports only `node:`/relative; no real credentials or data.

### Findings

**P0:** none. **P1:** none. **P2:** none observed in this round.

### Boundaries / limits

- **R2 success paths NOT_RUN by design** (negative-only); no step-up grant/confirmation, no permanent delete/unlink success.
- **No real persistence/durable replay/crash recovery/cross-process CAS; no UI, provider/Zotero/Nutstore/PDF, browser/TLS, or performance claim. WP-03 overall is NOT complete.**
- **Linux runtime NOT_RUN**; no cross-platform claim. A47 LIGHT one deterministic full offline run; no timing claim.
- Traceability by actual Q3-01…Q3-11 suite names + independent Q3 probes; A5/A7/E9/F9/U6 remain contract-level, no full U6 pass.
- QA does **not** rule G4. Design may rule exact-SHA G4 at `0fcad9c...`; G5/G6/G7 `NOT_AUTHORIZED`; no merge/rebase/reset/force push; PR #2/#4 and frozen UI untouched.

QA STOP. Awaiting Design G4 at `0fcad9c...` / next dispatch.
