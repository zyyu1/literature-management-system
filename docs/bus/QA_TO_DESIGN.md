<!-- BUS from=QA to=DESIGN seq=8 re=docs/bus/EXECUTION_TO_QA.md@12 status=DONE updated=2026-11-25T15:37+01:00 -->
# QA → Design

## A62 fail-closed remediation — independent Windows G3 PASS_LOCAL @ `ab4a37c8905ebc9d3f889164c2f8164c9286051d`

- **PR #6** `exec/WP-02-project-paper-read` → `main` (OPEN, unmerged); **exact SHA** `ab4a37c8905ebc9d3f889164c2f8164c9286051d`; **QA comment ID 7165559694** — https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7165559694
- **Verdict: PASS_LOCAL** on Windows x64, **no P0/P1/P2 findings**. **Linux runtime NOT_RUN**; no dual-platform certification.
- Authority: **A60 (DEC-9=A) + A61 + A62 §4**; parent/new exact START `59df257abddfbbb49ed10b1ddd188bfc0c686278`; previous START `222763d...`; immutable Base `a0fb04f...`.
- Preflight: first remote ref read exit 0 at the exact SHA; fresh full non-shallow detached clone, `core.autocrlf=false`; one incremental commit; 0 merges; exactly **2 paths** (+155/−87); old helper absent; clean tree.

### Key numbers (all QA-owned, inside the A59 offline interval)

| Gate | Result |
| --- | --- |
| `node --check` (5 files) | 5/5, exit 0 |
| WP-01 default discovery | **67/67**, fail 0, skipped 0, todo 0 |
| WP-02 default discovery | **43/43**, fail 0, skipped 0, todo 0; nested Q2-11 **67/67** |
| committed mutation driver | **13/13 KILLED**, baseline green |
| A62 policy matrix | **46/46** |
| old/new oracle | old A60 accepts 5 representative negatives; A62 rejects 5/5 |
| WP-01 manifest | Base 19 → candidate 20; other **17 byte-identical**; overlay 3; helper SHA-256 `ac4ee082...da70500` |
| Q2-11 integrity negatives | extra file / missing file / unauthorized byte / authorized byte without overlay update: **4/4 detected** |
| named mutants | A60 six + A62 five: **11/11 killed** |
| egress probe | **12/12 EGRESS_PROBE=PASS**; loopback positive; external/LAN IPv4 `EHOSTUNREACH`; IPv6 `ENETUNREACH`; DNS `.invalid` `ENOTFOUND`; tcpConnected=0 |
| real offline inventory | candidate helper accepted: 16 adapters; `{Disconnected\|Disconnected:4, Disconnected\|Unknown:5, Not Present\|Unknown:4, Up\|Connected:3}`; pseudoNonIp=3; loopbackIndex=1 (127.0.0.1 + IPv4 Connected + MTU sentinel); 1 stale default route on a Disconnected adapter; 0 usable non-loopback |
| connected zero-traffic guard | independent probe and candidate helper both rejected; candidate reason `ACTIVE_PATH`; `ONLINE_GUARD=PASS` |
| final hygiene | clean tree; 2-path diff; 1 commit; 0 merges |

Environment: Windows 10.0.19045 x64, Node exactly **v22.23.5** win32/x64, user-controlled offline interval (A59 §2 option 1). No machine network/firewall/elevation change by QA. `TEMP`/`TMP` redirected to a QA scratch dir because the host `%TEMP%` is not writable for the restricted child token; no candidate/isolation/count impact.

### A62 five findings — independently verified fixed

1. **P2-A60-QA-1** — non-numeric/empty/multiple/IPv4 zones rejected; numeric IPv6 zone handled; malformed-zone inventory `INVENTORY_MALFORMED`.
2. **P2-A60-QA-2** — unknown adapter state rejected with/without stale address; only explicitly observed unavailable pairs accepted.
3. **P2-A60-QA-3** — both contradiction directions, mixed rows, active-without-rows and active LAN without address/route rejected (`INVENTORY_INCONSISTENT` / `ACTIVE_WITHOUT_IP_ROWS` / `ACTIVE_PATH`).
4. **P2-A60-QA-4** — positive loopback identity requires real loopback index + IPv4 127.0.0.1 Connected + sentinel MTU + absence from `Get-NetAdapter`; missing/mismatch/multiple rejected.
5. **P2-A60-DESIGN-1** — missing/null required collections rejected; explicit empty `defaultRoutes` accepted; pure-classifier vs `readWindowsInventory` paths distinguished (`INVENTORY_MALFORMED` vs `QUERY_INCOMPLETE`).

Adjacent linkage (address/route family, orphan IP rows, route on loopback, stale-route proof, malformed/missing collections) independently exercised. No new P0/P1/P2 observed. Narrow unavailable-state allowlist is intentional and fails closed on other Windows shapes.

### Boundaries / next

- A58/QM12, the 44-test continuation and `identity.test.mjs` are **not in A62 scope**; `P2-WP02-QA-1` remains `OPEN_NON_BLOCKING`.
- Linux runtime **NOT_RUN**; no dual-platform certification.
- QA does **not** rule G4. Design may rule exact-SHA G4 at `ab4a37c...`; if accepted, proceed with the A58 continuation on the newly accepted exact START under existing DEC-8=A, with fresh dispatch and independent QA/G4.
- G5/G6/G7 `NOT_AUTHORIZED`; no merge/rebase/reset/force push; PR #2/#4 and frozen UI untouched.

QA STOP. Awaiting Design G4 / next dispatch.
