# P0-STORE — Execution QA handoff (Phase 1 + R2 + R3 + R4 + R4.1 offline evidence recorded)

**Status: R4.1 evidence recorded for candidate commit `6c59f35ed9e5859709582a9c34eed98a7cb36cd6` on a valid A59 Windows offline interval; this handoff file itself is added by a later docs-only commit on the same branch. Earlier Phase-1/R2/R3/R4 evidence is retained below as history.** Sanitized: no credentials, real e-mail addresses, account data or machine-local absolute paths. QA-owned rows remain `NOT_RUN` until the targeted G3.

## 0. Authoritative documents are not present in Base

`docs/handoffs/P0-STORE/DESIGN.md`, `QA_INSTRUCTION.md`, `R2_VERDICT_FIX.md`, `R3_LIVE_READINESS.md`, `R4_AUTH_IDENTITY.md` and the R4.1 rulings (`D007_A100…`, `A101…`, `A102…`, `A103…`) were added later on `main`; they are **not** in Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. QA/Design read them from `main`, read-only. This candidate adds only `packages/p0store-nutstore-probe/**` and this `QA_HANDOFF.md`.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `663556bc68dc0472f2f392f09ca4bee7c668d2f5` |
| Branch | `exec/P0STORE-nutstore-probe-r1` (PR #9) |
| R4.1 evidence commit | `6c59f35ed9e5859709582a9c34eed98a7cb36cd6` (single parent = `a168ee9…`) |
| Commits above Base | 9 at evidence (`9e772e6`, `88e1bd7`, `4032187`, `b6fec8e`, `ba43519`, `6a59ce9`, `16f0cb0`, `a168ee9`, `6c59f35`) |
| Base tree → HEAD tree | 275 → 307 paths; 94 pinned protected Base blobs unchanged |
| Additions | 32 whitelisted paths |
| Runtime | Node `v22.23.5` x64 (`node.exe` SHA-256 `247e9693…bdf38a`), non-elevated |
| Authority | A100 (R4 G2 not accepted), A101 (isolated method), A102 (host restore), **A103 §3 (carry-forward, DEC-46=A)** |

## 2. A102 guard timing pre-check (one measurement, non-elevated)

- Command: `Measure-Command { node --input-type=module -e "<import frozen platform-precondition; readWindowsInventory() once, timed internally>" }`, ordinary permissions, `2026-11-27 18:37:38–18:37:42 +01:00`.
- Frozen guard's PowerShell network-inventory query body: **3738 ms** (`{"ok":true,"reason":null,"ms":3738}`); `Measure-Command` total: **4016 ms** (≈278 ms Node start-up/import).
- Per A103 §1 this is the query body (<4 s) and the run proceeded; the number is recorded here and in the G2.
- Host state: `LastBootUpTime = 2026-11-27 18:34:48 +01:00` (user restart; heavy programs closed).

## 3. A103 evidence interval and probe map (manual user-controlled)

- `OFFLINE_PROVEN` at `2026-11-27T17:43:47Z`; last probe after every group at `2026-11-27T17:57:38Z` (local 18:43:47–18:57:38); user reconnected afterwards (script does not touch the network).
- Probe `EGRESS_PROBE=PASS` **16/16** — one guard+probe pair before and after each of the 8 groups (full suite; WP-01..WP-04; P1-16; audit; mutants). Classifier `OFFLINE_PROVEN`; loopback positive; external IPv4/IPv6/LAN and `.invalid` DNS negative; no proxy/credential variables in child envs.
- No live request, real host contact, real credential or real e-mail was used.

## 4. R4.1 observed commands and results

| Item | Command | Observed |
| --- | --- | --- |
| Full suite | `node --test` (cwd `packages/p0store-nutstore-probe`) | **PASS 94/94**, `# pass 94 / # fail 0 / cancelled 0 / skipped 0 / todo 0`, 114 836 ms (P1-13 included and green) |
| WP-01 | `node --test --test-concurrency=1` (direct) | **PASS 67/67** |
| WP-02 | `node --test --test-concurrency=1` (direct) | **PASS 44/44** |
| WP-03 | `node --test --test-concurrency=1` (direct) | **PASS 103/103** |
| WP-04 | `node --test --test-concurrency=1` (direct) | **PASS 91/91** |
| P1-16 full | `node --test --test-concurrency=1 test/p1-16-auth-identity.test.mjs` | **PASS 9/9** (U-01..U-08 + U-10; U-09 is mutation coverage) |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | **PASS** `CANDIDATE_SCOPE_OK … commits=9 basePaths=275 approvedAdditions=32 protectedPaths=94 headPaths=307 worktreePaths=307` |
| Mutation driver | `node scripts/mutation-check.mjs` | **PASS** `MUTATION_SUMMARY killed=26/26` (M26 killed by U-10) |

Tooling note: the local evidence runner's acceptance rule initially required >=10 P1-16 TAP tests; P1-16 defines 9 (U-09 is mutation coverage). The verdict was re-derived from the raw logs (all groups green), recorded in `summary-corrected.json` / `CHECKER_CORRECTION.md`; **no command was re-run and no test/artifact changed**.

## 5. R4.1 delta and carry-forward byte proof

- R4.1 functional change (`a168ee9..6c59f35`): 4 allowed files, +75/−21 — `src/runner.mjs` (early stop gated on `request.auth !== false` / `authenticated === true`), `test/p1-16-auth-identity.test.mjs` (U-07 rewritten to 3 calls, U-10 added), `scripts/mutation-check.mjs` (M25 adjusted, M26 added; 26 total), `README.md`. `QA_HANDOFF.md` is docs-only.
- Byte proof vs `16f0cb0` (`git diff --quiet` exit 0): P1-13 test, `packages/` excluding the 4 allowed files, frozen A62 guard `platform-precondition.mjs`, all `support/` trees, and everything outside the 5 allowed/docs paths.
- Therefore the `16f0cb0` results (suite 93/93 including P1-13; upstream 67/44/103/91; protected 94/94) are carried forward to `6c59f35`; the current run independently re-proved all of them green.

## 6. LIM-P0-S2

**LIM-P0-S2** (recorded): the frozen A62 egress guard's PowerShell network-inventory query is timing-sensitive under concurrency on the A59 host (single-query body 3738 ms on 2026-11-27 18:37; 11–12 concurrent test files can exceed its 8 s timeout). P1-13 and the upstream suites are therefore carried forward by byte identity (`16f0cb0 → 6c59f35`) and, where the host allows, re-proved directly; targeted G3 must apply the same carry-forward rule.

## 7. Historical evidence (retained)

- Phase 1 at `9e772e6`: suite 50/50; upstream 67/44/103/91; audit 28/303/94; mutation 13/13; probes 5/5 over `11:18:20–11:24:15Z`.
- R2 at `4032187`: suite 65/65 (P1-14 15 tests); audit 29/304/94; mutation 16/16; probes 5/5 over `13:20:24–13:30:29Z`.
- R3 at `ba43519`: suite 85/85 (P1-15 8 tests); audit 31/306/94; mutation 22/22; probes 5/5 over `14:39:18–14:49:50Z`.
- R4 at `16f0cb0`: suite 93/93 (P1-16 8 tests); audit 32/307/94; mutation 25/25; probes 5/5 over `16:28:30–16:39:19Z`.

## 8. QA-owned rows (still NOT_RUN before the targeted G3)

| QA item | Status |
| --- | --- |
| QA-written auth-identity/live-gating matrix with QA-instrumented zero transport and secret-not-read proof | `NOT_RUN` (QA-owned) |
| QA canary scan and stub-transport Authorization/target proof | `NOT_RUN` (QA-owned) |
| Count-neutral audit negative (modified path) | `NOT_RUN` (QA-owned) |
| QA byte proof (incl. carry-forward) and QA re-run of P1-13 with the isolated method | `NOT_RUN` (QA-owned) |
| Committed 26 mutants + ≥3 QA mutants on the new rules | `NOT_RUN` (QA-owned) |
| Linux x86_64 (A54/A55) | `NOT_RUN` |

## 9. NOT_RUN / limitations

- R4.1 only: no live request, no real Nutstore/WebDAV host, no account, no credential, no real e-mail, no real data.
- **No live run is authorized now**: the next real run needs G4, runbook rev 3 (masked user-name line) **and** a new user DEC + new approval id.
- Phase 3 / ACCESS-02 / G6/G7 not authorized; P0-STORE conclusion remains open (live run 1 INCONCLUSIVE); P0-STORE remains BLOCKED.
- No UI, no deployment, no performance/SLA claim; Linux `NOT_RUN`.

## 10. Fill-in rules

1. Record only observed results; a failed/skipped/timed-out/host-precondition-failed group is a failure, not `PASS`.
2. Keep values sanitized (route templates, statuses, counts, digests only); never record credentials, real e-mail addresses or real account data.
3. The R4.1 evidence commit above is the exact SHA for the G2 report; any later docs-only change on the branch must be disclosed as such, and carried-forward evidence must cite its byte proof.
