# WP-01 Execution evidence summary (sanitized, Execution self-test — NOT independent QA)

- **Code commit under test:** `15f78baa941c96b70dc16e1e2d833040a2939eef`, branch `exec/WP-01-synthetic-auth-api`, parent and Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`. This evidence commit and the handoff commit add only files under `evidence/` and `QA_HANDOFF.md`. No `src/`, `support/` or `test/` file changes after `15f78ba`.
- **Host:** cloud Linux session, `Linux 6.18.44 x86_64`, Node `v22.23.5` (`linux x64`), util-linux `unshare` 2.39.3, Python 3.13 (stdlib only, used for `lo-up.py`).
- **Fixture:** `docs/handoffs/WP-01/fixtures/wp01.v1.json`.
  - SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` from both `git show <Base>:…` and the working tree.
  - Blob `0965c45e3af482f4074845e1c7558901963f224f`, 4573 B.
  - Unmodified.
- **Egress (D007-A54):** wrapper files were copied from `origin/main@60e312764f54697742f5d0e842ea1d6282a233f6` into `/tmp/offline` (outside the repo, not committed).
  - Blob SHAs:
    - `run-offline.sh` `d39af1194bbb05e458416184c1c66b0d9983bccd`
    - `lo-up.py` `55b45a3678fe347155ca54c89110aa1dd0ad1454`
    - `egress-probe.mjs` `fceeea897156b2f87f240d217f2c93f231a6d662`
  - Probe: `EGRESS_PROBE=PASS`, exit 0 (see `WP01-egress-probe.txt`).
  - Every `node --test` run used `run-offline.sh env -i PATH=… HOME=/tmp LANG=C.UTF-8`. Inside the namespace, `os.networkInterfaces()` reports only `lo`. `/sys/class/net` still lists the host's interfaces because sysfs is not remounted; this is informational only.
  - Git commands ran outside the namespace. No WP-01 test or server ran outside it.

## Five independent runs (`node --test`, package cwd, inside namespace, clean tree at `15f78ba`)
| Run | Exit | Tests | Pass | Fail | Wall ms | Local requests (sum of server tallies) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 67 | 67 | 0 | 907 | 146 |
| 2 | 0 | 67 | 67 | 0 | 847 | 146 |
| 3 | 0 | 67 | 67 | 0 | 875 | 146 |
| 4 | 0 | 67 | 67 | 0 | 965 | 146 |
| 5 | 0 | 67 | 67 | 0 | 956 | 146 |

Raw TAP: `WP01-node-test-run{1..5}.tap`. These are the actual outputs; no absolute paths, cookies or tokens appear in them.

The request counts exclude 1 request to the redirect-test loopback upstream and 3 raw-socket probes, so each run makes about 150 local requests in total, well under the 5000 cap. `node --check src/server.mjs` exited 0.

## Per-file and per-Q coverage (run 1)
- **Per file:**
  - `auth-contract` 10
  - `session-revocation` 9
  - `origin-csrf` 11
  - `scope-workspace` 8
  - `outcome-unknown` 12
  - `transport-negative` 17
- **Test titles tagged per Q:**
  - Q01 4
  - Q02 3
  - Q03 7
  - Q04 10
  - Q05 1
  - Q06 8
  - Q07 4
  - Q08 15
  - Q09 3
  - Q10 4
- **Untagged:** the health check, the egress precondition, and 6 per-file request-tally checks.
- **Fixture cases:** all 13 are asserted by ID, through `fixtureCase(fixture, '<ID>')` with an `expect` check:
  - AUTH-01 / AUTH-02 (auth-contract)
  - AUTH-03 / AUTH-04 / STEPUP-01 (scope-workspace)
  - SESS-01 / SESS-02 (session-revocation)
  - ORIGIN-01 / CSRF-01 (origin-csrf)
  - OUTCOME-01 / OUTCOME-02 (outcome-unknown)
  - PATH-01 / REDIRECT-01 (transport-negative)

## Execution-side mutation spot-check (out-of-repo scratch copy; not independent; not a G3 claim)
Fourteen hand-made mutants were each run with the full suite inside the namespace. All 14 failed the suite (KILLED):
- origin check removed;
- CSRF check removed;
- CORS reflects any origin;
- `202` counted as Saved;
- reused `operationId` re-dispatched;
- Step-up bypass on DELETE;
- `404` for a missing resource vs `403` for a foreign one (existence leak);
- `0.0.0.0` bind allowed;
- Cookie `Domain` added;
- clock expiry ignored;
- revoked Session accepted;
- body limit removed;
- Workspace may write;
- raw URL logged.

The mutation driver is not committed, because it lives outside the WP-01 deliverable. QA should write its own probes.

## Not run / unsupported
- Real browser, HTTPS or cookie-jar behaviour (Q05 is syntactic only).
- Real identity, MFA or step-up UX.
- Durable storage or operation ledger.
- Cross-instance revocation or idempotency.
- Zotero, Nutstore or WebDAV.
- The original 26 U6 / 60 A4–A8 system cases.
- Fail-closed behaviour of the suite **outside** the namespace is designed but deliberately not executed, because A54 §3.4 forbids running WP-01 tests outside it.
