# P0-STORE Phase 1 — Execution QA handoff (offline evidence recorded)

**Status: evidence recorded for candidate commit `9e772e65cb2a3438ceb590d89c839cfb1c73d47c` on the A59 Windows offline interval. This handoff file itself is added by a later docs-only commit on the same branch; implementation, tests, plans and scripts were not changed after the evidence run.** Sanitized: no credentials, real hosts, real account data or machine-local absolute paths. QA-owned rows remain `NOT_RUN` until G3.

## 0. Authoritative documents are not present in Base

`docs/handoffs/P0-STORE/DESIGN.md` and `docs/handoffs/P0-STORE/QA_INSTRUCTION.md` were added later on `main`; they are **not** in Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. `docs/architecture/D007_A90_P0_STORE_NUTSTORE_WEBDAV_ROUTE_DESIGN.md` **is** present at Base. QA/Design must read the two handoff documents from `main` (or a later docs-only main), read-only. This candidate adds only `packages/p0store-nutstore-probe/**` and this `QA_HANDOFF.md`.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `663556bc68dc0472f2f392f09ca4bee7c668d2f5` |
| Branch | `exec/P0STORE-nutstore-probe-r1` |
| Evidence commit SHA | `9e772e65cb2a3438ceb590d89c839cfb1c73d47c` |
| Commit shape | one single-parent commit above Base; 28 whitelisted additions / +6518 |
| Base tree → HEAD tree | 275 → 303 paths; 94 pinned protected Base blobs unchanged |
| Runtime | Node `v22.23.5` x64 (`node.exe` SHA-256 `247e9693d316da9857e44990e5e11709f596f18112251b8026ec6eed80bdf38a`) |
| Authority | `D007_A90` §3 Phase 1/§9, P0-STORE `DESIGN.md`, `QA_INSTRUCTION.md` (DESIGN/QA read from main) |
| Package | `packages/p0store-nutstore-probe/` (new, isolated, LOCAL_MOCK_ONLY) |

Frozen inputs: WP-01 fixture 4573 B `86c47a5a…be65`; WP-02 fixture 4989 B `c4fc68af…f888` (guarded before parsing). No real host, account or credential exists anywhere in code or plans; the frozen example plan uses `127.0.0.1` only.

## 2. A59 offline interval and probe map (manual user-controlled)

- User started the run manually and disconnected Wi-Fi; `OFFLINE_PROVEN` at `2026-11-27T11:18:20Z`; last probe after all children `2026-11-27T11:24:15Z`; user reconnected afterwards (reconnect time not recorded by the script; all children had exited before it).
- Independent probe `EGRESS_PROBE=PASS` **5/5** (`11:18:20`, `11:20:14`, `11:20:20`, `11:24:11`, `11:24:15`Z): classifier `OFFLINE_PROVEN`; loopback bind/connect/echo PASS; external IPv4 TCP `EHOSTUNREACH`, IPv6 `ENETUNREACH`, LAN `EHOSTUNREACH`, `.invalid` DNS `ENOTFOUND`; no proxy/credential variables in child environments.
- The mock WebDAV server binds loopback HTTPS only; TLS material is generated test-time with the host openssl CLI (TEST-ONLY, never trusted outside tests). No real provider endpoint was contacted at any point.

## 3. Observed commands and results

`node` below means the pinned Node `v22.23.5` x64.

| Item | Command | Observed |
| --- | --- | --- |
| Syntax (24 package `.mjs`) | `node --check` per file | **PASS 24/24**, exit 0. Static check executed outside the offline interval (no socket/child network capability); offline boundary `NOT_RECORDED` for this static check only |
| P0-STORE suite | `node --test` (cwd `packages/p0store-nutstore-probe`) | **PASS 50/50**, `# pass 50 / # fail 0 / cancelled 0 / skipped 0 / todo 0`, 109 677 ms, exit 0 |
| P1-01..P1-13 named tests | same suite | all **PASS** |
| Strict upstream (P1-13) | spawned `node --test --test-reporter=tap --test-concurrency=1` | **PASS** WP-01 67/67, WP-02 44/44 (nested WP-01 67/67), WP-03 103/103, WP-04 91/91 — all strict stateful TAP |
| Protected inventory (P1-13) | `git hash-object --no-filters` on 94 pinned paths | **PASS 94/94** Base blob IDs |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | **PASS** `CANDIDATE_SCOPE_OK base=663556b… head=9e772e6… commits=1 basePaths=275 approvedAdditions=28 protectedPaths=94 headPaths=303 worktreePaths=303`, exit 0 |
| Mutation driver | `node scripts/mutation-check.mjs` | **PASS** `MUTATION_SUMMARY killed=13/13`; each mutant killed by its intended named assertion, exit 1, no crash/timeout |

## 4. QA-owned rows (still NOT_RUN before G3)

| QA item | Status |
| --- | --- |
| Count-neutral audit negatives (extra path replacing an approved one, modified Base path, modified protected blob, untracked file, mode change, symlink type), each with its own dedicated reason | `NOT_RUN` (QA-owned scratch proofs) |
| QA-written mock personality matrix (all 11 personalities, independent harness/verdict assertions) | `NOT_RUN` (QA-owned) |
| QA egress proof (live-mode preconditions in each combination, non-loopback placeholder, zero socket attempts, static host-literal scan, secret canary scan) | `NOT_RUN` (QA-owned) |
| QA independent mutants (≥6) | `NOT_RUN` (QA-owned scratch tree) |
| Linux x86_64 run (A54/A55) | `NOT_RUN` |

## 5. NOT_RUN / limitations

- Phase 1 only: no live request, no real Nutstore/WebDAV host, no account, no credential, no persistence.
- Phases 2–4 (user preparation, one bounded live run, verdict) are **not authorized**; ACCESS-02/G6/G7 not authorized; P0-STORE remains BLOCKED.
- No UI, no deployment, no performance/SLA claim; Linux `NOT_RUN`.
- Gate caps/verbs are probe-only and make no claim about provider behaviour; the mock's personalities are test behaviour, not provider facts.

## 6. Fill-in rules

1. Record only observed results; a failed/skipped/timed-out/host-precondition-failed group is a failure, not `PASS`.
2. Keep values sanitized (route templates, statuses, counts, digests only); never record credentials or real hosts.
3. The evidence commit above is the exact SHA for the G2 report; any later docs-only change on the branch must be disclosed as such.
