# P0-STORE Phase 1 — Execution QA handoff (Phase-1 + R2 offline evidence recorded)

**Status: R2 evidence recorded for candidate commit `403218797ffb2fc2aafa3b681d8b461159e09aba` on the A59 Windows offline interval; this handoff file itself is added by a later docs-only commit on the same branch. Phase-1 evidence at `9e772e6`/`88e1bd7` is retained below as history.** Sanitized: no credentials, real hosts, account data or machine-local absolute paths. QA-owned rows remain `NOT_RUN` until G3.

## 0. Authoritative documents are not present in Base

`docs/handoffs/P0-STORE/DESIGN.md`, `QA_INSTRUCTION.md` and `R2_VERDICT_FIX.md` were added later on `main`; they are **not** in Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. `docs/architecture/D007_A90_…` is present at Base. QA/Design read the handoff documents from `main`, read-only. This candidate adds only `packages/p0store-nutstore-probe/**` and this `QA_HANDOFF.md`.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `663556bc68dc0472f2f392f09ca4bee7c668d2f5` |
| Branch | `exec/P0STORE-nutstore-probe-r1` (PR #9) |
| R2 evidence commit | `403218797ffb2fc2aafa3b681d8b461159e09aba` (single parent = `88e1bd76…`) |
| Commits above Base | 3 (`9e772e6` Phase 1, `88e1bd7` Phase-1 handoff docs, `4032187` R2) |
| Base tree → HEAD tree | 275 → 304 paths; 94 pinned protected Base blobs unchanged |
| Additions | 29 whitelisted paths (28 + `test/p1-14-inconclusive.test.mjs`) |
| Runtime | Node `v22.23.5` x64 (`node.exe` SHA-256 `247e9693…bdf38a`) |
| Authority | A90 §3/§9, P0-STORE DESIGN/QA_INSTRUCTION, A93 + `R2_VERDICT_FIX.md` (DEC-37=A) |

## 2. R2 offline interval and probe map (manual user-controlled)

- `OFFLINE_PROVEN` at `2026-11-27T13:20:24Z`; last probe after all children at `2026-11-27T13:30:29Z`; user reconnected afterwards (script does not touch the network).
- Probe `EGRESS_PROBE=PASS` **5/5** (`13:20:24`, `13:22:22`, `13:22:28`, `13:30:25`, `13:30:29`Z): classifier `OFFLINE_PROVEN`; loopback bind/connect/echo PASS; external IPv4 TCP `EHOSTUNREACH`, IPv6 `ENETUNREACH`, LAN `EHOSTUNREACH`, `.invalid` DNS `ENOTFOUND`; no proxy/credential variables in child environments.
- Loopback HTTPS mock only; TLS material generated test-time with the host openssl CLI (TEST-ONLY). No real provider host/account/credential was contacted or needed.

## 3. R2 observed commands and results

| Item | Command | Observed |
| --- | --- | --- |
| Syntax (25 package `.mjs`) | `node --check` per file | **PASS 25/25**, exit 0. Static check outside the offline interval (no socket/child network capability); boundary `NOT_RECORDED` for this static check only |
| P0-STORE suite | `node --test` (cwd `packages/p0store-nutstore-probe`) | **PASS 65/65**, `# pass 65 / # fail 0 / cancelled 0 / skipped 0 / todo 0`, 114 472 ms |
| P1-01..P1-14 named tests | same suite | all **PASS** (P1-14 contributes 15 tests: 11-personality matrix, reason order, 3 synthetic precedence cases) |
| Strict upstream (P1-13) | spawned `node --test --test-reporter=tap --test-concurrency=1` | **PASS** WP-01 67/67, WP-02 44/44 (nested 67/67), WP-03 103/103, WP-04 91/91 |
| Protected inventory (P1-13) | `git hash-object --no-filters` on 94 pinned paths | **PASS 94/94** Base blob IDs |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | **PASS** `CANDIDATE_SCOPE_OK base=663556b… head=4032187… commits=3 basePaths=275 approvedAdditions=29 protectedPaths=94 headPaths=304 worktreePaths=304` |
| Mutation driver | `node scripts/mutation-check.mjs` | **PASS** `MUTATION_SUMMARY killed=16/16` (M01–M13 plus M14 early STOP→PARTIAL, M15 INCONCLUSIVE→GO, M16 reversed reason order); each killed by its intended named assertion, exit 1, no crash/timeout |

R2 behavior observed: `VERDICTS = ['GO','PARTIAL','INCONCLUSIVE','NO-GO']`; `strong` GO (`GO_ALL_CRITERIA_PASSED`); `weak-etag` PARTIAL `WEAK_VALIDATOR@L3`; `stale-read` PARTIAL `STALE_READ_VISIBILITY@L2` (earliest read-back observation; `STOP_CLEANUP_UNVERIFIED@L12` follows); `lost-update`/`create-overwrite` NO-GO (`NO_GO_EVIDENCE`); `late-ack` GO; `unresolvable-ack` PARTIAL `UNRESOLVABLE_LATE_ACK@L8`; `throttle`/`server-error`/`redirect`/`bad-cert` INCONCLUSIVE (`INCONCLUSIVE_BEFORE_L6_COMPLETE`). The only whitelist exception authorized by the user: two verdict assertions in `test/p1-03-tls-redirect-stop.test.mjs` changed `PARTIAL` → `INCONCLUSIVE` (each with a one-line R2 note).

## 4. Phase-1 historical evidence (retained)

- At `9e772e6` (Phase 1): suite 50/50; upstream 67/44/103/91; audit `commits=1 basePaths=275 approvedAdditions=28 protectedPaths=94 headPaths=303`; mutation `killed=13/13`; probes 5/5 over `2026-11-27T11:18:20Z–11:24:15Z`.
- `88e1bd7` added only this handoff file (Phase-1 evidence). G2 for Phase 1 was accepted in A91.

## 5. QA-owned rows (still NOT_RUN before the targeted G3)

| QA item | Status |
| --- | --- |
| Count-neutral audit negatives (one modified path; extra path replacing an approved one; modified Base path; modified protected blob; untracked; mode; symlink) | `NOT_RUN` (QA-owned) |
| QA-written 11-personality verdict matrix incl. reason order on the new rule | `NOT_RUN` (QA-owned) |
| Zero-egress re-check (5 combinations) and canary scan | `NOT_RUN` (QA-owned) |
| Committed-mutants verification + ≥3 QA mutants on the new rule | `NOT_RUN` (QA-owned, beyond the committed 16) |
| Byte-identical proof that gate/plan/secret/trace/live-mode are unchanged vs `88e1bd7` | **PASS locally** (`git diff --quiet` over those paths exits 0); QA re-check `NOT_RUN` |
| Linux x86_64 (A54/A55) | `NOT_RUN` |

## 6. NOT_RUN / limitations

- Phase 1 + R2 only: no live request, no real Nutstore/WebDAV host, no account, no credential, no persistence.
- Phases 2–4 (user preparation, one bounded live run, verdict) are **not authorized**; ACCESS-02/G6/G7 not authorized; P0-STORE remains BLOCKED.
- No UI, no deployment, no performance/SLA claim; Linux `NOT_RUN`.
- The R2 `@L2` stale-read step reflects this mock's earliest observation; the ordering property (root cause before later cleanup STOP) is what the fix guarantees.

## 7. Fill-in rules

1. Record only observed results; a failed/skipped/timed-out/host-precondition-failed group is a failure, not `PASS`.
2. Keep values sanitized (route templates, statuses, counts, digests only); never record credentials or real hosts.
3. The R2 evidence commit above is the exact SHA for the G2 report; any later docs-only change on the branch must be disclosed as such.
