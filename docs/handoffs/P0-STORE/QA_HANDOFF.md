# P0-STORE — Execution QA handoff (Phase 1 + R2 + R3 offline evidence recorded)

**Status: R3 evidence recorded for candidate commit `ba4351947528cfd3881d3f64601dbaa63b4242ff` on the A59 Windows offline interval; this handoff file itself is added by a later docs-only commit on the same branch. Phase-1 and R2 evidence are retained below as history.** Sanitized: no credentials, real account data or machine-local absolute paths. QA-owned rows remain `NOT_RUN` until the targeted G3.

## 0. Authoritative documents are not present in Base

`docs/handoffs/P0-STORE/DESIGN.md`, `QA_INSTRUCTION.md`, `R2_VERDICT_FIX.md` and `R3_LIVE_READINESS.md` were added later on `main`; they are **not** in Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. QA/Design read them from `main`, read-only. This candidate adds only `packages/p0store-nutstore-probe/**` and this `QA_HANDOFF.md`.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `663556bc68dc0472f2f392f09ca4bee7c668d2f5` |
| Branch | `exec/P0STORE-nutstore-probe-r1` (PR #9) |
| R3 evidence commit | `ba4351947528cfd3881d3f64601dbaa63b4242ff` (single parent = `b6fec8e…`) |
| Commits above Base | 5 (`9e772e6` Phase 1, `88e1bd7` handoff docs, `4032187` R2, `b6fec8e` R2 handoff docs, `ba43519` R3) |
| Base tree → HEAD tree | 275 → 306 paths; 94 pinned protected Base blobs unchanged |
| Additions | 31 whitelisted paths (29 + `plans/live-nutstore-plan.json` + `test/p1-15-live-gating.test.mjs`) |
| Runtime | Node `v22.23.5` x64 (`node.exe` SHA-256 `247e9693…bdf38a`), non-elevated |
| Authority | A90 §3–§6/§10, A96 + `R3_LIVE_READINESS.md` (DEC-39=A) |

## 2. R3 offline interval and probe map (manual user-controlled)

- `OFFLINE_PROVEN` at `2026-11-27T14:39:18Z`; last probe after all children at `2026-11-27T14:49:50Z`; user reconnected afterwards (script does not touch the network).
- Probe `EGRESS_PROBE=PASS` **5/5** (`14:39:18`, `14:41:17`, `14:41:23`, `14:49:46`, `14:49:50`Z): classifier `OFFLINE_PROVEN`; loopback bind/connect/echo PASS; external IPv4 TCP `EHOSTUNREACH`, IPv6 `ENETUNREACH`, LAN `EHOSTUNREACH`, `.invalid` DNS `ENOTFOUND`; no proxy/credential variables in child envs.
- No real host was contacted; no credential was set. The live plan and tests are offline only.

## 3. R3 observed commands and results

| Item | Command | Observed |
| --- | --- | --- |
| Syntax (26 package `.mjs`) | `node --check` per file | **PASS 26/26**, exit 0. Static check outside the offline interval (no socket/child network capability); boundary `NOT_RECORDED` for this static check only |
| P0-STORE suite | `node --test` (cwd `packages/p0store-nutstore-probe`) | **PASS 85/85**, `# pass 85 / # fail 0 / cancelled 0 / skipped 0 / todo 0`, 115 318 ms |
| P1-01..P1-15 named tests | same suite | all **PASS**; P1-15 contributes 8 live-gating tests |
| Strict upstream (P1-13) | spawned `node --test --test-reporter=tap --test-concurrency=1` | **PASS** WP-01 67/67, WP-02 44/44 (nested 67/67), WP-03 103/103, WP-04 91/91 |
| Protected inventory (P1-13) | `git hash-object --no-filters` on 94 pinned paths | **PASS 94/94** Base blob IDs |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | **PASS** `CANDIDATE_SCOPE_OK base=663556b… head=ba43519… commits=5 basePaths=275 approvedAdditions=31 protectedPaths=94 headPaths=306 worktreePaths=306` |
| Mutation driver | `node scripts/mutation-check.mjs` | **PASS** `MUTATION_SUMMARY killed=22/22` (M01–M16 retained; M17 missing approval, M18 malformed approval, M19 different host, M20 prefix outside parent, M21 skip Node check, M22 secret-before-auth) |

R3 live gating observed/verified: all seven authorization checks (`LIVE_FLAG_REQUIRED`, plan-field codes incl. `LIVE_HOST_MISMATCH`/`LIVE_PORT_MISMATCH`/`LIVE_PATH_PREFIX_MISMATCH`/`LIVE_PINNED_CA_FORBIDDEN`, `LIVE_PLAN_SELF_AUTHORIZED`/`LIVE_APPROVAL_REQUIRED`/`LIVE_APPROVAL_INVALID`, `LIVE_RUN_ID_SUPPLIED`, `LIVE_CREDENTIAL_MISSING`, `NODE_RUNTIME_MISMATCH`) refuse before gate/socket/child with **zero transport calls**, and checks 1–4 never read the credential value (poisoned-env proof). With all conditions satisfied and an injected stub transport (no socket), the first request targets exactly `https://dav.jianguoyun.com:443/dav/LMS-P0STORE/<runtime-runId>/…`; the canary never appears in trace/log/error; the approved real-host literal appears exactly twice (live plan + one pinned constant in `src/plan.mjs`).

Frozen paths are byte-identical to `b6fec8e`: `src/gate.mjs`, `src/secret.mjs`, `src/trace.mjs`, `src/oracle.mjs`, `src/verdict.mjs`, `support/**`, `plans/example-plan.json` — `git diff --quiet` exits 0. `PHASE1_LIVE_ENABLED` remains only as a dead compatibility export required by the frozen `support/harness.mjs` re-export; no live code consults it (removing the export would break the byte-identical requirement).

## 4. Historical Phase-1 / R2 evidence (retained)

- Phase 1 at `9e772e6`: suite 50/50; upstream 67/44/103/91; audit 28 additions/303 paths/94 protected, `commits=1`; mutation 13/13; probes 5/5 over `11:18:20–11:24:15Z`; G2 accepted in A91.
- R2 at `4032187`: suite 65/65 (P1-14 = 15 tests); audit 29 additions/304 paths/94 protected, `commits=3`; mutation 16/16; probes 5/5 over `13:20:24–13:30:29Z`; G2 accepted in A94, G4 PASS_LOCAL in A95; LIM-P0S-1 closed.

## 5. QA-owned rows (still NOT_RUN before the targeted G3)

| QA item | Status |
| --- | --- |
| QA-written live-gating matrix (each of the 7 conditions, wrong-host variants) with QA-instrumented zero transport calls and secret-not-read proof | `NOT_RUN` (QA-owned) |
| QA stub-transport target-URL proof and canary scan | `NOT_RUN` (QA-owned) |
| Count-neutral audit negative (at least one modified path) | `NOT_RUN` (QA-owned) |
| Byte proof of frozen files vs `b6fec8e` (QA re-check) | `NOT_RUN` (Execution local proof passes) |
| Committed 22 mutants + ≥3 QA mutants on the gating rules | `NOT_RUN` (QA-owned, beyond the committed 22) |
| Linux x86_64 (A54/A55) | `NOT_RUN` |

## 6. NOT_RUN / limitations

- R3 only: no live request, no real Nutstore/WebDAV host, no account, no credential, no real data; Phase 3 / ACCESS-02 / G6/G7 not authorized; P0-STORE remains BLOCKED.
- No live-mode execution was attempted; only offline gating and stub-transport proofs.
- No UI, no deployment, no performance/SLA claim; Linux `NOT_RUN`.

## 7. Fill-in rules

1. Record only observed results; a failed/skipped/timed-out/host-precondition-failed group is a failure, not `PASS`.
2. Keep values sanitized (route templates, statuses, counts, digests only); never record credentials or real hosts beyond the two authorized live-plan/constant occurrences.
3. The R3 evidence commit above is the exact SHA for the G2 report; any later docs-only change on the branch must be disclosed as such.
