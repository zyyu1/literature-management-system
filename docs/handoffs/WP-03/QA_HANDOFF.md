# WP-03-R1 — Execution QA handoff (LOCAL_SYNTHETIC_ONLY)

**Status: D007-A66 bounded remediation committed as the single incremental commit on `exec/WP-03-guarded-r1-writes` (exactly six writable paths) and validated on the accepted A59 offline Windows host. No new G4/G5 claim. The historical A65 offline evidence at `0fcad9c` is retained in §3 as history and does not certify the corrected code.**
This file is sanitized: no Session cookies, CSRF tokens, operationIds, request bodies or note text.
Only route templates, status codes, counts, synthetic fixture facts and commands are recorded.
Machine-local absolute paths are replaced by the explicit marker `[machine-local path redacted]`.

## 0. D007-A66 correction (2026-11-25)

A66 correction point (START): `0fcad9cb6016900d5f7057161619e4a9f2e94b55`, the required parent of the
single incremental correction commit. Original immutable Base
`1684cea5623c8421e16c328c7f1464e8932d3118` remains an ancestor. Branch
`exec/WP-03-guarded-r1-writes`.

Only the six A66 paths are writable: this handoff, the package `README.md`,
`test/upstream-regression.test.mjs`, `support/harness.mjs`, `scripts/mutation-check.mjs` (preflight
guard only; the 13 mutants, their edits, `expect` assertions and verdict rules are unchanged) and the
new `scripts/verify-candidate-scope.mjs`. No `src`, behavioural test, `package.json`, fixture, helper,
upstream driver, `tools/`, UI, CI or dependency file is modified.

What changed:

1. **Unconditional test gate (A66 §3a).** The frozen WP-01 `support/platform-precondition.mjs` is
   imported read-only. `support/harness.mjs` calls it during module evaluation, so every
   network-capable WP-03 test file (all ten behavioural files import the harness) fails closed before
   any test body, server or socket. `test/upstream-regression.test.mjs` calls the same guard at
   module load, before any upstream child process; `scripts/mutation-check.mjs` calls it before
   scratch-tree creation, baseline work, mutation work or any child spawn. The former
   `HOST_PRECONDITION_ONLY` relaxed success and `WP03_REQUIRE_OFFLINE_UPSTREAM` opt-in are removed;
   the flag is not read and setting it or not setting it has no effect.
2. **Strict upstream TAP (A66 §3a).** Q3-11 requires exactly 67 WP-01 tests and 44 WP-02 tests,
   `pass == expected`, `fail == 0`, `skipped == 0`, `todo == 0`, `cancelled == 0`, exit 0, no
   signal/error/timeout, exactly one matching plan, every `ok` line, and no missing, malformed,
   duplicated or partial summary line. The WP-02 run must contain its nested WP-01 67/67 test. A
   host-precondition failure now fails the test instead of being tolerated.
3. **Separate candidate scope (A66 §3b).** The ordinary Q3-11 no longer walks the whole repository
   against Base. It pins the actual original Base Git blob IDs and exact inventories of both whole
   upstream packages (including evidence files), the two frozen fixtures and `tools/offline/`
   (51 files, explicit paths, no wildcard or exclusion inside the protected sets). Unrelated approved
   main-only docs and new package paths are tolerated by the ordinary regression. The full candidate
   audit is the separate, read-only local Git `scripts/verify-candidate-scope.mjs` (not a test file,
   not discovered by `node --test`): Base tree, exactly enumerated cumulative additions, no
   modified/deleted Base path, no extra/untracked path, single-parent history with START as the parent
   of the newest incremental commit, exactly the six A66 paths relative to START, clean checkout and
   worktree equal to HEAD.

The corrected code has **not** been run on an isolated host. Section 3 is historical pre-A66 evidence
only; section 4 is connected-development-host evidence and is explicitly **not gate evidence**.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `1684cea5623c8421e16c328c7f1464e8932d3118` (`bus(management): seq 16`) |
| A66 START | `0fcad9cb6016900d5f7057161619e4a9f2e94b55` (existing single commit on the branch) |
| Branch | `exec/WP-03-guarded-r1-writes` |
| Candidate | START + one required incremental correction commit; this corrected handoff is included in it. Exact commit SHA is recorded in the PR comment / `docs/bus/EXECUTION_TO_QA.md` after the commit. |
| Runtime | Node `v22.23.5` x64, Windows (`win32`) for development evidence |
| Authority | `docs/handoffs/WP-03/DESIGN.md` (WP-03-R1), `QA_INSTRUCTION.md`, D007-A65 and D007-A66 |
| Package | `packages/wp-03-guarded-r1-writes/` (new, isolated) |
| Allowed writes | the six A66 paths only |

Frozen inputs (raw-byte guards enforced before parsing):

| Fixture | Bytes | SHA-256 |
| --- | --- | --- |
| `docs/handoffs/WP-01/fixtures/wp01.v1.json` | 4573 | `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` |
| `docs/handoffs/WP-02/fixtures/wp02.v1.json` | 4989 | `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888` |

Baseline fixture facts exercised: 4 Projects / 4 canonical papers / 6 associations; owner
`user_demo_a` sees 3 Projects and 3 distinct papers; alpha/beta/gamma share
`user/fakeLib01/XFAKE001` with Important true/false/false; `group/fakeLib02/XFAKE001` is a distinct
paper with ReadingStatus `To Read` and a null note; `user/fakeLib01/XFAKE002` shares title+DOI with
XFAKE001 but is a distinct paper with ReadingStatus `Read`; the foreign owner's records stay
untouched.

## 2. What was built

- One WP-03 in-memory model (`src/model.mjs`) cloned from the frozen fixture after raw-byte
  verification. It is the sole authoritative Project/Paper/association state; WP-01's fake
  mutation backend and separate fake Project state are never used.
- Per-instance opaque `runId`; distinct opaque revisions for every Project, every global
  ReadingStatus and every association Important, derived from `runId + frozen identity +
  generation` (never client input, never a clock).
- New HTTP server on `127.0.0.1:0` only, `/api/v1`, inert until `listen()`; the three WP-02 GET
  projections on the same state plus the R1 writes and negative-only R2 routes.
- WP-01 Session store + policy primitives imported read-only; WP-02 canonical tuple and catalog
  validation imported read-only.
- Operation ledger keyed by principal + operationId binding runId/route/action/scope/target/
  payload/precondition fingerprint; exact replay never dispatches again; changed fingerprint is
  `409 OPERATION_ID_REUSE`; authorization is revalidated at the synchronous commit boundary.
- Test-only fault controls (never HTTP): `not_dispatched`, `accepted_not_committed`,
  `lost_ack_after_commit`, `socket_drop_after_commit`, `error_after_dispatch`, a gate delay, a
  one-shot synchronous before-commit hook, a lower-only response budget and state snapshots.
- R2 stays negative-only: permanent Project delete, Current unlink and All unlink return
  `403 STEP_UP_REQUIRED`, `mutationEnabled:false`, `dispatched:false` for a valid Owner target and
  neutral denials otherwise. Nothing is deleted or unlinked; no grant/confirmation path exists.
- A66 added the unconditional shared egress guard, strict upstream TAP validation, the pinned
  51-path protected-dependency proof and the separate explicit candidate audit; the 103 original
  tests are retained (only Q3-11 titles/scope were corrected).

## 3. Historical A65 execution evidence at START `0fcad9c` (pre-A66; retained, not evidence for the corrected code)

This section preserves the original Execution record. The relaxed `HOST_PRECONDITION_ONLY` mode and
the `WP03_REQUIRE_OFFLINE_UPSTREAM` opt-in described here **no longer exist** in the corrected code.

Node executable: Node `v22.23.5` x64 (`[machine-local path redacted]`).

```powershell
# syntax (18 .mjs files)
node --check src/fixtures.mjs
node --check src/strict-json.mjs
node --check src/contract.mjs
node --check src/model.mjs
node --check src/server.mjs
node --check support/harness.mjs
node --check scripts/mutation-check.mjs
```

```powershell
# full new suite at 0fcad9c (default discovery)
cd packages/wp-03-guarded-r1-writes
node --test
```

Historical observed result at `0fcad9c`: `# tests 103`, `# pass 103`, `# fail 0`, `# skipped 0`,
`# todo 0` (exit 0), with diagnostics `WP01_UPSTREAM tests=67 pass=66 fail=1
verdict=HOST_PRECONDITION_ONLY` and `WP02_UPSTREAM tests=44 pass=42 fail=2
verdict=HOST_PRECONDITION_ONLY`. Those relaxed diagnostics are the exact defect A66 corrects and are
not a current-state result.

```powershell
# historical strict isolated-host variant (flag removed by A66; do not use)
$env:WP03_REQUIRE_OFFLINE_UPSTREAM = '1'
node --test
```

```powershell
# WP-03 mutation driver (13 named mutants)
node scripts/mutation-check.mjs
```

Historical observed: `BASELINE exit=0 failing=0`; `M01..M13 KILLED`; `MUTATION_SUMMARY killed=13/13`;
exit 0. Named kills include M01 `Q3-01 owner projections match the frozen fixture`, M02 `Q3-08
WORKSPACE_READONLY is denied every write route`, M03 `Q3-08 missing or wrong CSRF token`, M04 `Q3-05
a stale If-Match is 412`, M05 `Q3-06 an exact replay`, M06 `Q3-06 the same operationId with a changed
action`, M07 `Q3-07 202 accepted-not-committed`, M08 `Q3-03 each ReadingStatus enum value`, M09
`Q3-04 Important toggles only the exact Project association`, M10 `Q3-09 valid Owner permanent
Project delete`, M11 `Q3-06 case-fold identity`, M12 `Q3-06 old-runId replay`, M13 `Q3-07 an
unexpected post-dispatch error`.

Historical accepted A59 offline Windows host record at `0fcad9c` (every group preceded by a fresh
loopback-positive / external-negative probe):

| Group | Result |
| --- | --- |
| syntax (18 `.mjs`) | 18/18, exit 0 |
| WP-03-R1 suite (`WP03_REQUIRE_OFFLINE_UPSTREAM=1`) | 103/103, fail 0, exit 0 |
| frozen WP-01 suite | 67/67, exit 0 |
| frozen WP-02 suite (nests WP-01) | 44/44, exit 0 |
| frozen WP-02 committed mutation driver | 13/13 KILLED, baseline green, exit 0 |
| WP-03 mutation driver | 13/13 KILLED, baseline green, exit 0 |

Egress probe at that time: loopback `CONNECTED`; external/LAN IPv4 TCP `EHOSTUNREACH`; IPv6
`ENETUNREACH`; `.invalid` DNS `LOOKUP_FAILED`; `blocking-on-usable=0`; `routes-on-usable=0`;
`EGRESS_PROBE=PASS`.

These results are A65 Execution self-tests, not independent QA and not G3, and they must not be used
to claim the corrected code is green.

## 4. A66 development evidence on the connected development host (NOT gate evidence)

Node `v22.23.5` x64 (`[machine-local path redacted]`), Windows `win32 x64`. Scratch work is outside
the repository in `wp03b-scratch/` (never committed). No full online suite was run; every command
below either fails at the unconditional guard before sockets/children or exercises synthetic TAP /
disposable scratch trees.

```powershell
# changed/added-file syntax checks
node --check support/harness.mjs
node --check scripts/mutation-check.mjs
node --check scripts/verify-candidate-scope.mjs
node --check test/upstream-regression.test.mjs
```

Observed: 4/4 exit 0. A full package sweep also checked all 19 `.mjs` files (18 original +
`scripts/verify-candidate-scope.mjs`): 19/19 exit 0. The 51 literal protected-inventory IDs were
cross-checked against `git ls-tree -r 1684cea5623c8421e16c328c7f1464e8932d3118` for the four
protected sets: 51/51 identical.

```powershell
# guard-only rejection (direct import of the shared harness)
node 01-guard-only.mjs
```

Observed on this connected host:

```
GUARD_ONLY flag=<absent> exit=7 HARNESS_IMPORT_THREW: EGRESS_PRECONDITION_FAILED: ACTIVE_PATH
GUARD_ONLY flag=1 exit=7 HARNESS_IMPORT_THREW: EGRESS_PRECONDITION_FAILED: ACTIVE_PATH
OLD_VS_NEW_GUARD old=IMPORTED_WITHOUT_GUARD new=EGRESS_PRECONDITION_FAILED: ACTIVE_PATH exit=0
TARGETED_Q3_11_GUARD_ONLY exit=1 file_failure=1 upstream_tap_spawned=0
MUTATION_DRIVER_PREFLIGHT exit=1 scratch_or_baseline_started=0
GUARD_ONLY_REJECTION_OK no_socket_no_upstream_child
```

The same rejection occurs whether the obsolete flag is absent or set to `1`; no test server/socket
and no upstream child TAP is produced.

```powershell
# default discovery on the connected host (expected fail-fast; not a suite result)
cd packages/wp-03-guarded-r1-writes
node --test
```

Observed: exit 1; 11 file-level failures (`auth-negative`, `faults`, `fixture-identity`, `important`,
`operation-ledger`, `preconditions`, `project-writes`, `r2-negative`, `reading-status`, `transport`,
`upstream-regression`); TAP summary `# tests 11`, `# pass 0`, `# fail 11`; every failure is
`EGRESS_PRECONDITION_FAILED: ACTIVE_PATH`; zero `Q3-*` test executions.

```powershell
# mutation driver preflight (expected fail-closed; not a driver result)
node scripts/mutation-check.mjs
```

Observed: exit 1 with `EGRESS_PRECONDITION_FAILED: ACTIVE_PATH` before any scratch tree, baseline or
mutant.

```powershell
# explicit candidate audit on the uncommitted development working tree
node scripts/verify-candidate-scope.mjs
```

Observed: exit 1, `CANDIDATE_SCOPE_FAILED: NO_INCREMENTAL_COMMIT_SINCE_START: HEAD equals START`.
This is correct: the audit requires the committed, clean candidate and was verified positively on a
disposable committed scratch tree (§4.1).

### 4.1 Scratch proofs (disposable trees outside the repository)

| Script | Observed result |
| --- | --- |
| `01-guard-only.mjs` | Both flag states rejected with `EGRESS_PRECONDITION_FAILED: ACTIVE_PATH`; literal START harness imported without a guard in a scratch copy (old behaviour) while the corrected harness throws; targeted Q3-11 produced one file-level failure with no upstream TAP; mutation driver stopped at preflight. |
| `02-integration-old-new.mjs` | Simulated integration tree (A66 candidate + actual main-only docs from local `main`): OLD pre-A66 whole-repository test rejected it with `unexpected new path outside the whitelist` (exit 1); NEW pinned-dependency test accepted it (exit 0). |
| `03-default-integrity-negatives.mjs` | Baseline green. Rejected with named assertions: upstream extra file and missing file (`protected dependency inventory mismatch`), upstream changed byte, fixture changed byte and `tools/offline` changed byte (`protected dependency bytes changed`). Restored baseline green. |
| `04-bypass-mutants.mjs` | `MUTATION_SUMMARY killed=4/4`: B1 upstream-failure tolerance, B2 pre-child guard omission, B3 pinned-integrity bypass, B4 full candidate-audit bypass, each killed by its intended assertion with exit 1, no signal/timeout. |
| `05-strict-tap-negatives.mjs` | Positive real-format TAP accepted; 14 negative inputs rejected (missing/malformed/duplicate summary, missing plan, skipped>0, todo>0, not-ok line, partial TAP, wrong count, nonzero exit, timeout/error, signal, new-default host failure), and the historical old `assertUpstream` accepted the same host-precondition failure as `HOST_PRECONDITION_ONLY`. |
| `06-candidate-audit-proofs.mjs` | Positive commit-scope audit `CANDIDATE_SCOPE_OK` in scratch; rejected extra committed path (`A66_CHANGED_PATH_COUNT: 7`), untracked file (`CLEAN_CHECKOUT`), cumulative extra path (`UNEXPECTED_WORKTREE_PATH`), changed protected Base byte (`BASE_PATH_CHANGED`), missing protected Base path (`BASE_PATH_MISSING`); restored positive audit green. |

The positive candidate-audit result was produced only in a disposable committed scratch copy; the
real uncommitted tree cannot and must not pass the candidate audit. No scratch result is gate
evidence.

## 5. Coverage map (Q3-01 … Q3-11)

| ID | Files / named coverage |
| --- | --- |
| Q3-01 | `test/fixture-identity.test.mjs` — raw-byte SHA guards, 4/4/6, distinct revisions + runId, exact projections, note bytes (CRLF/emoji/CJK), case-sensitive cross-library tuple, identical title+DOI never merge, foreign scope |
| Q3-02 | `test/project-writes.test.mjs` — create with `If-None-Match:*`, collision 412, replay, two-Session create races, rename, archive/restore, invalid transitions, Unicode name bounds, name uniqueness |
| Q3-03 | `test/reading-status.test.mjs` — all three enum values globally, all linked Projects refresh (including archived beta), note/Important untouched, invalid enum/type, foreign/missing/case-variant |
| Q3-04 | `test/important.test.mjs` — per-association only, archived Project 409, no implicit link, boolean typing, independent revisions, foreign/missing |
| Q3-05 | `test/preconditions.test.mjs` — 428/400/412 classes, duplicate If-Match, two-client and truly concurrent CAS with two Sessions, independent resource revisions, Session revocation/expiry revalidated at commit |
| Q3-06 | `test/operation-ledger.test.mjs` — exact replay, UNKNOWN replay, changed action/target/scope/value/precondition/name, concurrent same key, cross-principal neutral, old runId/revision on a fresh instance, case-fold identity |
| Q3-07 | `test/faults.test.mjs` — model ack, stale conflict, pre-dispatch refusal, 202 not committed, 504 committed, real socket drop (client UNKNOWN), quarantine isolation, post-dispatch error, response-size degradation, `saved:false`/`durable:false` everywhere |
| Q3-08 | `test/auth-negative.test.mjs` — workspace writes, Session states, ambiguous cookie, CSRF, Origin/Fetch-Metadata, media type, malformed/duplicate/prototype/non-UTF-8 bodies, forged fields, byte-identical neutral 403, no revision/ledger disclosure |
| Q3-09 | `test/r2-negative.test.mjs` — delete/current-unlink/all-unlink for a valid Owner with `STEP_UP_REQUIRED` and no side effect; forged step-up/confirmation/risk fields; neutral foreign/missing/workspace; no global delete route |
| Q3-10 | `test/transport.test.mjs` — bind/limit configuration, loopback-only clients, absolute/protocol-relative/traversal/prototype targets, methods/queries, 413/429/response budget, no redirects, safe headers, redacted logs, GET never mutates, in-process egress spy (loopback only; no host isolation claim) |
| Q3-11 | `test/upstream-regression.test.mjs` — unconditional module-load egress guard before upstream children; strict TAP 67/67 WP-01 and 44/44 WP-02 (including its nested WP-01 67/67); pinned 51-path protected Base inventory (both whole upstream packages and evidence, both fixtures, `tools/offline`); unrelated main-only docs are not part of this ordinary proof |

## 6. Protected paths / whitelist evidence

Current development working tree (`git status --porcelain=v1 -uall`) must show exactly these six A66
paths and nothing else:

```
 M docs/handoffs/WP-03/QA_HANDOFF.md
 M packages/wp-03-guarded-r1-writes/README.md
 M packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs
 M packages/wp-03-guarded-r1-writes/support/harness.mjs
 M packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs
?? packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs
```

`git diff --name-status 0fcad9cb6016900d5f7057161619e4a9f2e94b55` shows the five tracked
modifications and the new script is the only untracked path. No Base path is modified, deleted or
added outside the approved cumulative additions. After the required single incremental commit, the
explicit audit (`node scripts/verify-candidate-scope.mjs`) proves the full Base tree, the exact
enumerated additions, the six-path A66 diff, single-parent history, clean checkout and worktree-equal
HEAD; the ordinary Q3-11 proves the 51 protected Base blobs byte-for-byte with
`git hash-object --no-filters`.

## 7. Accepted offline evidence for the corrected code

Run on the user-controlled A59 offline Windows host (Node v22.23.5 x64), with the obsolete
`WP03_REQUIRE_OFFLINE_UPSTREAM` flag absent and a fresh loopback-positive/external-negative probe
before every command group (`EGRESS_PROBE=PASS`; external/LAN IPv4 TCP `EHOSTUNREACH`, IPv6
`ENETUNREACH`, `.invalid` DNS failure, `blocking-on-usable=0`, `routes-on-usable=0`):

| Group | Result |
| --- | --- |
| syntax (`node --check`, 19 `.mjs`) | 19/19, exit 0 |
| WP-03-R1 default suite (no opt-in flag) | **103/103**, fail/skipped/todo 0, exit 0 |
| frozen WP-01 suite | **67/67**, exit 0 |
| frozen WP-02 suite (nested WP-01 67/67) | **44/44**, exit 0 |
| frozen WP-02 committed mutation driver | **13/13 killed**, baseline green, exit 0 |
| WP-03 mutation driver | **13/13 killed**, baseline green, exit 0 |
| explicit candidate scope audit | `CANDIDATE_SCOPE_OK` (Base 200 paths, 22 approved additions, six A66 paths, clean checkout), exit 0 |
| scratch integration proof (old vs new) | OLD pre-A66 whole-repo check rejects simulated main-only docs (exit 1); NEW pinned check accepts them (exit 0) |
| scratch default-integrity negatives | upstream extra/missing/changed, fixtures changed, `tools/offline` changed: all rejected |
| scratch A66 bypass mutants | **4/4 killed** (host-failure tolerance, pre-child guard omission, pinned-integrity bypass, candidate-audit bypass) |
| scratch strict-TAP negatives | positive accepted; malformed/partial/duplicate summary, skip/todo, not-ok, wrong count, nonzero, timeout/error, signal all rejected |
| scratch candidate-audit proofs | positive accepted; extra committed path, untracked file, cumulative extra path, changed protected byte, missing protected path all rejected |

The historical §3 results certify START `0fcad9c`, not this correction. No G4/G5 claim is made here.
The exact candidate SHA is recorded in the PR comment and `docs/bus/EXECUTION_TO_QA.md`.

## 8. NOT_RUN / limitations

- No real persistence, database, crash recovery or durable replay; the ledger is process memory only.
- No R2 success path, step-up grant, confirmation consumption or permanent delete/unlink.
- No UI, Module 002 change or UI-AMEND.
- No real provider, PDF, Zotero/Nutstore, real identifier or external network.
- No browser/TLS behaviour, no cookie `Secure` behaviour in a real browser.
- No Linux run; no cross-platform claim. No host-level network-isolation claim; the in-process egress
  spy is not an OS boundary. A59/A62 host evidence is a QA prerequisite.
- No load/performance/timing claim.
- The corrected code ran on the accepted isolated offline host (§7); no full online suite was run.
  Connected-host checks are limited to the guard-only fail-fast proof and scratch integrity proofs.
- `docs/handoffs/WP-03/DESIGN.md` and `QA_INSTRUCTION.md` live outside this execution checkout as
  separate authority (per A65); this package does not copy them.

## 9. Deviation log

1. Earlier A65 development runs on an online host recorded `HOST_PRECONDITION_ONLY` instead of
   failing closed. A66 removes that relaxation completely: the corrected default/targeted commands
   fail with `EGRESS_PRECONDITION_FAILED: ACTIVE_PATH` before any socket or upstream child. The
   historical runs in §3 remain recorded as a deviation and are not current-state evidence.
2. The frozen WP-02 mutation driver was NOT_RUN on the online development host; it ran green
   (13/13) on the historical accepted offline host (§3).
3. The WP-03 mutation driver's scratch trees normally live in the OS temp directory; if that is not
   writable (hardened sandbox), it falls back to the clone's parent directory. No repository file is
   written by the driver.
4. A66 development checks (§4) are connected-host/scratch proofs only. The corrected default suite,
   strict upstream 67/44, both mutation drivers, the explicit candidate audit and the scratch
   integration/bypass/negative proofs were then run green on the accepted isolated offline host
   (§7) and committed as the single incremental A66 commit.
