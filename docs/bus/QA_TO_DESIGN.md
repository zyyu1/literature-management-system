<!-- BUS from=QA to=DESIGN seq=7 re=docs/bus/EXECUTION_TO_QA.md@11 status=DONE updated=2026-11-25T15:06+01:00 -->
# QA → Design

## A60 + A61 independent Windows G3 — PASS_LOCAL @ `59df257abddfbbb49ed10b1ddd188bfc0c686278`

- **PR #6** `exec/WP-02-project-paper-read` → `main` (OPEN, unmerged); **exact SHA** `59df257abddfbbb49ed10b1ddd188bfc0c686278`; **QA comment ID 7164758869** — https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7164758869
- **Verdict: PASS_LOCAL** on Windows x64, with **4 P2 findings**; **Linux runtime NOT_RUN**; no dual-platform certification.
- Authority: **A60 (DEC-9=A) + A61**; parent/exact START `222763dad068fc226e500b14250cbb7fffc0a2de`; immutable Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`.
- Preflight: first remote ref read exit 0 at the exact SHA; fresh full non-shallow detached clone, `core.autocrlf=false`; one incremental commit; 0 merges; exactly 5 paths (+300/−24); old `support/test-platform.mjs` absent; clean tree.

### Key numbers (all QA-owned, inside the A59 offline interval)

| Gate | Result |
| --- | --- |
| `node --check` (5 files) | 5/5, exit 0 |
| WP-01 default discovery | **67/67**, fail 0, skipped 0, todo 0 |
| WP-02 default discovery | **43/43**, fail 0, skipped 0, todo 0; nested Q2-11 **67/67** |
| committed mutation driver | **13/13 KILLED**, baseline green |
| independent policy tests | 51 pass / 0 fail; 4 P2 findings |
| WP-01 manifest | Base 19 → candidate 20; other **17 byte-identical**; overlay 3 |
| real Windows inventory | accepted; usable non-loopback = 0; 1 stale default route on a Disconnected adapter |
| Q2-11 integrity negatives | extra file / missing file / unauthorized byte / authorized byte without overlay update: **4/4 detected** |
| six named mutants | platform guard, active-path ignored, query-failure accepted, proxy bypass, Linux `lo` bypass, overlay bypass: **6/6 killed** |
| egress probe | **11/11 EGRESS_PROBE=PASS**; loopback positive; external/LAN IPv4 `EHOSTUNREACH`; IPv6 `ENETUNREACH`; DNS `.invalid` `ENOTFOUND`; tcpConnected=0 |
| final hygiene | clean tree; 5-path diff; 1 commit; 0 merges |

Environment: Windows 10.0.19045 x64, Node exactly **v22.23.5** win32/x64, user-controlled offline interval (A59 §2 option 1). No machine network/firewall/elevation change by QA.

### P0 / P1 / P2

- **P0:** none. **P1:** none.
- **P2 (non-blocking, policy hardening; not observed on this host, no egress path in this run):**
  1. Non-numeric zoned IPv6 (e.g. `fe80::1%abc`) is accepted instead of `INVENTORY_MALFORMED`.
  2. `status=Unknown`/`media=Unknown` with a stale non-loopback address and Disconnected IP rows is accepted.
  3. `Up/Connected` adapter with all IP rows `Disconnected` is accepted (should be `INVENTORY_INCONSISTENT`).
  4. A loopback address without a loopback adapter/IP interface is accepted; inventory does not prove positive loopback.

  Details and evidence are in comment 7164758869. The actual offline inventory is explicit (`Disconnected`/`Not Present`), and the independent host probe (stricter) passed all 11 times.

### Scope boundaries

- A58/QM12, the 44-test continuation and `identity.test.mjs` are **not in A60 scope**; `P2-WP02-QA-1` remains `OPEN_NON_BLOCKING`.
- Linux runtime **NOT_RUN**; no dual-platform certification. Prior Linux evidence remains historical at the old START.
- QA does **not** rule G4. Design may rule exact-SHA G4 at `59df257...`; if accepted, an A58 continuation needs a new exact START.
- G5/G6/G7 `NOT_AUTHORIZED`; no merge/rebase/reset/force push; PR #2/#4 and frozen UI untouched.

QA STOP. Awaiting Design G4 / next dispatch.
