# D007-A55 — WP-01 exact-SHA G4: PASS_LOCAL

**Design ruling, 2026-11-24 18:00 Europe/Berlin.** The receipt and the ruling are in one commit (A47 R1). Observed parent `main@9f75183`. The input came over the bus: `bus/QA_TO_DESIGN.md` seq 3 and `bus/EXECUTION_TO_QA.md` seq 4.

## 1. Evidence verified by Design (GitHub REST)
### PR and branch
- [PR #5](https://github.com/zyyu1/literature-management-system/pull/5) is OPEN and unmerged.
- HEAD is **`100cb6352539577ad086545ce794096f887b04d7`**, on branch `exec/WP-01-synthetic-auth-api`.
- Base is `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`.
- The PR changes 20 files. Design checked every one against the [A21 whitelist](D007_A21_WP01_G1_DECISION.md): none falls outside `packages/wp-01-synthetic-auth-api/**` and `docs/handoffs/WP-01/QA_HANDOFF.md`.

### QA report
- [QA_REPORT #7138389089](https://github.com/zyyu1/literature-management-system/pull/5#issuecomment-7138389089) was posted at 2026-11-24T16:54:23Z by an independent cloud session.
- The report matches the bus summary.

### What QA did
- **Preflight:** the first remote attempt (`ls-remote`) exited 0.
- **Clean environment:** QA used a fresh clone. The host was Linux x86_64 with Node v22.23.5.
- **Fixture:** the fixture SHA-256 matched.
- **Egress check (A54):** the egress probe FAILED outside the sandbox, as expected, and PASSED inside it. QA's own IPv4, IPv6, UDP and DNS negative tests made 0 non-loopback connections.
- **Tests:** 67/67 tests passed in each of 5 runs, with exit code 0. They also passed under `env -i`.
- **QA's own probe:** QA ran its own raw-TCP probe. It passed all 13 rows covering Q01–Q10, with 0 dispatches on any deny path.
- **QA's own mutants:** QA wrote 14 mutants, and the named tests killed all 14.
- **Scans:** secret, privacy and dependency scans were clean. The package has 0 dependencies, no CI and no lockfile.
- **Findings:** P0, P1 and P2 are all 0. There are 5 INFO items.

## 2. Ruling
| Item | Disposition @ `100cb63` |
| --- | --- |
| WP-01 G2 | Accepted as the tested final SHA |
| WP-01 G3 | VERIFIED |
| **WP-01 G4** | **PASS_LOCAL** — synthetic auth/session/safe-API slice only |
| INFO-1 (wrapper keeps inherited env) | **Addressed now.** `tools/offline/run-offline.sh` now uses `env -i` with an allowlist: PATH, HOME, LANG, TZ, TMPDIR. Design re-ran the probe after the change: PASS. Future runs must record the new blob SHA. |
| INFO-2..5 | INFO only. Accepted. No action required. |

**Not proven:** real TLS, a real browser, a real identity provider, a durable session store, the Owner bootstrap, the original 26 U6 cases, the A4–A8 60-case plans, and Windows.

## 3. Unchanged
- **Gates:** G5 merge (PR #5 is offered as DEC-4 on the board), G6 real service and G7 deploy remain NOT_AUTHORIZED.
- **Next work package:** WP-02 is not authorized yet; it is offered as DEC-5.
