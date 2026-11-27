# P0-STORE — Execution QA handoff (Phase 1 + R2 + R3 + R4 offline evidence recorded)

**Status: R4 evidence recorded for candidate commit `16f0cb0af8d1622067a7b57b05be0acaa97039c6` on the A59 Windows offline interval; this handoff file itself is added by a later docs-only commit on the same branch. Earlier Phase-1/R2/R3 evidence is retained below as history.** Sanitized: no credentials, real e-mail addresses, account data or machine-local absolute paths. QA-owned rows remain `NOT_RUN` until the targeted G3.

## 0. Authoritative documents are not present in Base

`docs/handoffs/P0-STORE/DESIGN.md`, `QA_INSTRUCTION.md`, `R2_VERDICT_FIX.md`, `R3_LIVE_READINESS.md` and `R4_AUTH_IDENTITY.md` were added later on `main`; they are **not** in Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. QA/Design read them from `main`, read-only. This candidate adds only `packages/p0store-nutstore-probe/**` and this `QA_HANDOFF.md`.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `663556bc68dc0472f2f392f09ca4bee7c668d2f5` |
| Branch | `exec/P0STORE-nutstore-probe-r1` (PR #9) |
| R4 evidence commit | `16f0cb0af8d1622067a7b57b05be0acaa97039c6` (single parent = `6a59ce9…`) |
| Commits above Base | 7 (`9e772e6`, `88e1bd7`, `4032187`, `b6fec8e`, `ba43519`, `6a59ce9`, `16f0cb0`) |
| Base tree → HEAD tree | 275 → 307 paths; 94 pinned protected Base blobs unchanged |
| Additions | 32 whitelisted paths (31 + `test/p1-16-auth-identity.test.mjs`) |
| Runtime | Node `v22.23.5` x64 (`node.exe` SHA-256 `247e9693…bdf38a`), non-elevated |
| Authority | A99 §5, `R4_AUTH_IDENTITY.md` (DEC-42=A); R3/A96 unchanged |

## 2. R4 offline interval and probe map (manual user-controlled)

- `OFFLINE_PROVEN` at `2026-11-27T16:28:30Z`; last probe after all children at `2026-11-27T16:39:19Z`; user reconnected afterwards (script does not touch the network).
- Probe `EGRESS_PROBE=PASS` **5/5** (`16:28:30`, `16:30:33`, `16:30:39`, `16:39:14`, `16:39:19`Z): classifier `OFFLINE_PROVEN`; loopback bind/connect/echo PASS; external IPv4 TCP `EHOSTUNREACH`, IPv6 `ENETUNREACH`, LAN `EHOSTUNREACH`, `.invalid` DNS `ENOTFOUND`; no proxy/credential variables in child envs.
- No live request, real host contact, real credential or real e-mail address was used in this run.

## 3. R4 observed commands and results

| Item | Command | Observed |
| --- | --- | --- |
| Syntax (27 package `.mjs`) | `node --check` per file | **PASS 27/27**, exit 0. Static check outside the offline interval (no socket/child network capability); boundary `NOT_RECORDED` for this static check only |
| P0-STORE suite | `node --test` (cwd `packages/p0store-nutstore-probe`) | **PASS 93/93**, `# pass 93 / # fail 0 / cancelled 0 / skipped 0 / todo 0`, 119 014 ms |
| P1-01..P1-16 named tests | same suite | all **PASS**; P1-16 contributes 8 auth-identity tests (U-01..U-08) |
| Strict upstream (P1-13) | spawned `node --test --test-reporter=tap --test-concurrency=1` | **PASS** WP-01 67/67, WP-02 44/44 (nested 67/67), WP-03 103/103, WP-04 91/91 |
| Protected inventory (P1-13) | `git hash-object --no-filters` on 94 pinned paths | **PASS 94/94** Base blob IDs |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | **PASS** `CANDIDATE_SCOPE_OK base=663556b… head=16f0cb0… commits=7 basePaths=275 approvedAdditions=32 protectedPaths=94 headPaths=307 worktreePaths=307` |
| Mutation driver | `node scripts/mutation-check.mjs` | **PASS** `MUTATION_SUMMARY killed=25/25` (M01–M22 retained; M23 hard-coded probe user, M24 user not redacted, M25 no first-401 early stop) |

R4 behavior observed/verified offline: live plan requires `credentialUserEnvVar: "P0STORE_WEBDAV_USER"` (missing/wrong → `PLAN_REJECTED` at load); runtime user is validated immediately before the password check (3–254 chars, `^[^\s:@]+@[^\s:@]+\.[^\s:@]+$`, no controls, no `:`) with `CREDENTIAL_USER_MISSING` / `CREDENTIAL_USER_MALFORMED`, zero transport and empty trace, and the credential value is not read before checks 1–4 pass (poisoned-env proof); the user name is redacted like a secret in trace/console/preflight/result/errors (preflight prints only `user=<redacted, N chars>`); live header is `Basic base64(<runtime user>:<password>)` while local/mock stays `probe`; the first live 401/403 stops with exactly one transport call and no cleanup, verdict INCONCLUSIVE. R3's seven gate conditions, pinned host, approval regex, runId, Node pin and budget are unchanged.

Frozen paths are byte-identical to `6a59ce9`: `support/**`, `plans/example-plan.json`, `src/gate.mjs`, `src/oracle.mjs`, `src/verdict.mjs` — `git diff --quiet` exits 0.

Run-1 artifacts (`p0store-live-console.txt` 1892 B, `p0store-live-trace.jsonl` 1660 B) were independently re-scanned before attachment: keyword scan `Authorization|Basic |password|PASSWORD=|secret` = 0 hits and e-mail regex = 0 hits; only synthetic public identifiers (host/prefix/runId/approvalId) and redacted trace fields are present. They are attached to PR #9 in a separate comment.

## 4. Historical Phase-1 / R2 / R3 evidence (retained)

- Phase 1 at `9e772e6`: suite 50/50; upstream 67/44/103/91; audit 28 additions/303 paths/94 protected; mutation 13/13; probes 5/5 over `11:18:20–11:24:15Z`; G2 accepted in A91.
- R2 at `4032187`: suite 65/65 (P1-14 = 15 tests); audit 29/304/94, `commits=3`; mutation 16/16; probes 5/5 over `13:20:24–13:30:29Z`; G2 accepted in A94, G4 PASS_LOCAL in A95.
- R3 at `ba43519`: suite 85/85 (P1-15 = 8 tests); audit 31/306/94, `commits=5`; mutation 22/22; probes 5/5 over `14:39:18–14:49:50Z`; G2 accepted in A97.

## 5. QA-owned rows (still NOT_RUN before the targeted G3)

| QA item | Status |
| --- | --- |
| QA-written auth-identity matrix (U-01…U-07 equivalents, including zero transport and secret-not-read proof) | `NOT_RUN` (QA-owned) |
| QA canary scan (user/password, `user:pass`, base64, Basic) and stub-transport Authorization proof | `NOT_RUN` (QA-owned) |
| Count-neutral audit negative (modified path) | `NOT_RUN` (QA-owned) |
| Byte proof of frozen files vs `6a59ce9` (QA re-check) | `NOT_RUN` (Execution local proof passes) |
| Committed 25 mutants + ≥3 QA mutants on the new rules | `NOT_RUN` (QA-owned, beyond the committed 25) |
| Linux x86_64 (A54/A55) | `NOT_RUN` |

## 6. NOT_RUN / limitations

- R4 only: no live request, no real Nutstore/WebDAV host, no account, no credential, no real e-mail, no real data.
- **No live run is authorized now**: the next real run needs G4, runbook rev 3 (one extra masked user-name line) **and** a new user DEC + new approval id.
- Phase 3 / ACCESS-02 / G6/G7 not authorized; P0-STORE conclusion remains open (live run 1 INCONCLUSIVE / auth defect); P0-STORE remains BLOCKED.
- No UI, no deployment, no performance/SLA claim; Linux `NOT_RUN`.

## 7. Fill-in rules

1. Record only observed results; a failed/skipped/timed-out/host-precondition-failed group is a failure, not `PASS`.
2. Keep values sanitized (route templates, statuses, counts, digests only); never record credentials, real e-mail addresses or real account data.
3. The R4 evidence commit above is the exact SHA for the G2 report; any later docs-only change on the branch must be disclosed as such.
