<!-- BUS from=QA to=DESIGN seq=9 re=docs/bus/EXECUTION_TO_QA.md@13 status=DONE updated=2026-11-25T16:04+01:00 -->
# QA → Design

## A58 continuation — independent Windows G3 PASS_LOCAL @ `8751dd2b4f041d5a17af894ac9cca8bd28560d66`

- **PR #6** `exec/WP-02-project-paper-read` → `main` (OPEN, unmerged); **exact SHA** `8751dd2b4f041d5a17af894ac9cca8bd28560d66`; **QA comment ID 7166250750** — https://github.com/zyyu1/literature-management-system/pull/6#issuecomment-7166250750
- **Verdict: PASS_LOCAL** on Windows x64, **no P0/P1/P2 findings**. **Linux runtime NOT_RUN**; no dual-platform certification.
- Authority: **A58 (DEC-8=A) + A59 + A63 §3**; parent/new exact START `ab4a37c8905ebc9d3f889164c2f8164c9286051d`; ancestors `222763d...` → `59df257a...` → `ab4a37c...`; immutable Base `a0fb04f...`.
- Preflight: first remote ref read exit 0 exact SHA; fresh full non-shallow detached clone, `core.autocrlf=false`; exactly **1 incremental commit**, 0 merges, exactly **1 path** `packages/wp-02-project-paper-read/test/identity.test.mjs` (+66/−1); clean tree.

### Key numbers (QA-owned, inside the A59 offline interval)

| Gate | Result |
| --- | --- |
| `node --check` (identity file) | 1/1, exit 0 |
| WP-01 default discovery | **67/67**, fail 0, skipped 0, todo 0 |
| WP-02 default discovery | **44/44**, fail 0, skipped 0, todo 0; nested Q2-11 **67/67** |
| targeted identity file | **8/8**; Q2-02-CASE-01 `ok 13` in full suite |
| committed mutation driver | **13/13 KILLED**, baseline green |
| QM12 paired control | A63 START + QM12: **43/43 exit 0**; candidate + QM12: **43 pass / 1 fail**, only Q2-02-CASE-01, `ERR_ASSERTION` expected 403 / actual 200, no crash/timeout |
| independent raw HTTP | **13/13**: uppercase 200 exact identity; lowercase and ordinary-missing 403 byte-identical 100-byte neutral body (SHA-256 `2c323c49...`), stable headers identical; counts 4/4/6 and digest unchanged |
| A62 infrastructure | helper blob `90e13b46...` / SHA-256 `ac4ee082...`; Q2-11 blob `1306d092...` — unchanged from A63 START |
| WP-01 manifest | Base 19 → candidate 20; other **17 byte-identical**; overlay 3 |
| real offline inventory | helper accepted; loopback identity positive; 0 usable non-loopback paths |
| egress probe | **11/11 EGRESS_PROBE=PASS**; loopback positive; external/LAN IPv4 `EHOSTUNREACH`; IPv6 `ENETUNREACH`; DNS `.invalid` `ENOTFOUND`; tcpConnected=0 |
| final hygiene | clean tree; 1-path diff; 1 commit; 0 merges |

Environment: Windows 10.0.19045 x64, Node exactly **v22.23.5** win32/x64, user-controlled offline interval (A59 §2 option 1). The accepted A62 helper is unchanged; its connected-state zero-traffic guard already passed at `ab4a37c`; A58 re-probed before every group. No machine network/firewall/elevation change by QA.

### Boundaries / next

- **P2-WP02-QA-1** remains `OPEN_NON_BLOCKING` until Design's new exact-SHA G4. QA does **not** rule G4.
- Linux runtime **NOT_RUN**; no dual-platform certification.
- A62 G4 PASS_LOCAL at `ab4a37c` remains historical; A60/A61/A62 infrastructure frozen.
- G5/G6/G7 `NOT_AUTHORIZED`; no merge/rebase/reset/force push; PR #2/#4 and frozen UI untouched.

QA STOP. Awaiting Design G4 at `8751dd2b...` / next dispatch.
