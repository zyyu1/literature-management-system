# WP-03-R1 — Execution QA handoff (LOCAL_SYNTHETIC_ONLY)

**Status: implementation complete; one incremental commit on `exec/WP-03-guarded-r1-writes` and a PR to `main`; Execution offline evidence PASS on the A59 isolated Windows host. Not a QA pass, not a G4 claim.**
This file is sanitized: no Session cookies, CSRF tokens, operationIds, request bodies or note text.
Only route templates, status codes, counts, synthetic fixture facts and commands are recorded.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `1684cea5623c8421e16c328c7f1464e8932d3118` (`bus(management): seq 16`) |
| Branch | `exec/WP-03-guarded-r1-writes` (one incremental commit; new PR to `main`, not merged) |
| Candidate HEAD | the single commit containing this file; exact SHA is recorded in the PR comment and `docs/bus/EXECUTION_TO_QA.md` |
| Runtime | Node `v22.23.5` x64, Windows (`win32`) |
| Authority | `docs/handoffs/WP-03/DESIGN.md` (WP-03-R1), `QA_INSTRUCTION.md`, D007-A65 |
| Package | `packages/wp-03-guarded-r1-writes/` (new, isolated) |
| Allowed writes | `packages/wp-03-guarded-r1-writes/**`, `docs/handoffs/WP-03/QA_HANDOFF.md` |

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

## 3. Exact commands and observed results (development host)

Node executable used: `D:\claude\literature management system\.work\node22\node-v22.23.5-win-x64\node.exe`.

```powershell
# syntax
node --check src/fixtures.mjs
node --check src/strict-json.mjs
node --check src/contract.mjs
node --check src/model.mjs
node --check src/server.mjs
node --check support/harness.mjs
node --check scripts/mutation-check.mjs
```

```powershell
# full new suite (default discovery; includes protected-blob/upstream checks)
cd packages/wp-03-guarded-r1-writes
node --test
```

Observed: `# tests 103`, `# pass 103`, `# fail 0`, `# skipped 0`, `# todo 0` (exit 0). Two upstream
diagnostics are recorded inside the suite: `WP01_UPSTREAM tests=67 pass=66 fail=1
verdict=HOST_PRECONDITION_ONLY` and `WP02_UPSTREAM tests=44 pass=42 fail=2
verdict=HOST_PRECONDITION_ONLY`; see §3/§7 for the host-boundary explanation.

```powershell
# strict isolated-host variant (QA): frozen 67/67 and 44/44 mandatory
$env:WP03_REQUIRE_OFFLINE_UPSTREAM = '1'
node --test
```

```powershell
# WP-03 mutation driver (13 named mutants, each killed by its named test)
node scripts/mutation-check.mjs
```

Observed: `BASELINE exit=0 failing=0`; `M01..M13 KILLED`; `MUTATION_SUMMARY killed=13/13`; exit 0.
Each kill names the intended failing test, for example M01 `Q3-01 owner projections match the frozen
fixture`, M02 `Q3-08 WORKSPACE_READONLY is denied every write route`, M03 `Q3-08 missing or wrong
CSRF token`, M04 `Q3-05 a stale If-Match is 412`, M05 `Q3-06 an exact replay`, M06 `Q3-06 the same
operationId with a changed action`, M07 `Q3-07 202 accepted-not-committed`, M08 `Q3-03 each
ReadingStatus enum value`, M09 `Q3-04 Important toggles only the exact Project association`, M10
`Q3-09 valid Owner permanent Project delete`, M11 `Q3-06 case-fold identity`, M12 `Q3-06 old-runId
replay`, M13 `Q3-07 an unexpected post-dispatch error`.

```powershell
# frozen upstream suites, spawned as separate processes by the suite as well
cd ../wp-01-synthetic-auth-api ; node --test --test-reporter=tap
cd ../wp-02-project-paper-read ; node --test --test-reporter=tap
# frozen WP-02 committed mutation driver (QA isolated host; baseline requires the offline precondition)
node scripts/mutation-check.mjs
```

Observed on the **accepted A59 offline Windows host** (user-controlled offline interval, every group
preceded by a fresh loopback-positive / external-negative probe):

| Group | Result |
| --- | --- |
| syntax (`node --check`, 18 `.mjs`) | 18/18, exit 0 |
| WP-03-R1 suite (`WP03_REQUIRE_OFFLINE_UPSTREAM=1`) | **103/103**, fail 0, exit 0 |
| frozen WP-01 suite | **67/67**, exit 0 |
| frozen WP-02 suite (nests WP-01) | **44/44**, exit 0 |
| frozen WP-02 committed mutation driver | **13/13 KILLED**, baseline green, exit 0 |
| WP-03 mutation driver | **13/13 KILLED**, baseline green, exit 0 |

Egress probe: loopback `CONNECTED`; external/LAN IPv4 TCP `EHOSTUNREACH`; IPv6 `ENETUNREACH`;
`.invalid` DNS `LOOKUP_FAILED`; `blocking-on-usable=0`; `routes-on-usable=0`; `EGRESS_PROBE=PASS`.
These are Execution self-tests, **not** independent QA and **not** G3.

Earlier development runs happened on an online host, where the frozen A59/A62 egress precondition
fails closed (`EGRESS_PRECONDITION_FAILED: ACTIVE_PATH`) and the new suite records
`HOST_PRECONDITION_ONLY` unless `WP03_REQUIRE_OFFLINE_UPSTREAM=1` makes full 67/67 and 44/44
mandatory. No code drift occurred (protected Base blobs are byte-identical).

## 4. Coverage map (Q3-01 … Q3-11)

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
| Q3-11 | `test/upstream-regression.test.mjs` — every Base blob outside the whitelist byte-identical, only the allowed new paths add, WP-01 suite 67 tests, WP-02 suite 44 tests (nested WP-01), strict offline mode |

## 5. Protected paths / whitelist evidence

`git status --porcelain=v1 -uall` from the clone must show only:

```
?? docs/handoffs/WP-03/QA_HANDOFF.md
?? packages/wp-03-guarded-r1-writes/...
```

`git diff --name-only 1684cea5623c8421e16c328c7f1464e8932d3118` must be empty. The suite verifies
both mechanically with `git ls-tree`, `git hash-object` and `git status`; no Base file is modified,
deleted or overlaid.

## 6. Final hosted-run record (A59 offline Windows host)

- WP-03-R1 suite: tests 103, pass 103, fail 0, skipped 0, todo 0 (exit 0).
- WP-01 upstream: 67/67, exit 0.
- WP-02 upstream (nested WP-01 67/67): 44/44, exit 0.
- WP-03 mutation driver: killed 13/13, baseline green, exit 0.
- WP-02 committed mutation driver: killed 13/13, baseline green, exit 0.
- Protected blobs: every Base path outside the whitelist byte-identical; `git status --porcelain`
  shows only the 21 new files (1 QA handoff + 20 package files); `git diff` against Base is empty.
- Delivery: one incremental commit on `exec/WP-03-guarded-r1-writes`, pushed, new PR to `main`
  (open, unmerged). The exact candidate SHA is in the PR comment and `docs/bus/EXECUTION_TO_QA.md`.

## 7. NOT_RUN / limitations

- No real persistence, database, crash recovery or durable replay; the ledger is process memory only.
- No R2 success path, step-up grant, confirmation consumption or permanent delete/unlink.
- No UI, Module 002 change or UI-AMEND.
- No real provider, PDF, Zotero/Nutstore, real identifier or external network.
- No browser/TLS behaviour, no cookie `Secure` behaviour in a real browser.
- No Linux run; no cross-platform claim. No host-level network-isolation claim; the in-process egress
  spy is not an OS boundary. A59/A62 host evidence is a QA prerequisite.
- No load/performance/timing claim.
- `docs/handoffs/WP-03/DESIGN.md` and `QA_INSTRUCTION.md` live outside this execution checkout as
  separate authority (per A65); this package does not copy them.

## 8. Deviation log

1. Development runs on an online host cannot show the frozen 67/67 and 44/44 because of the frozen
   A59/A62 egress precondition; those runs record the exact host-bound failures instead of faking a
   pass. The accepted offline execution run on the isolated Windows host produced full **67/67** and
   **44/44** with the strict `WP03_REQUIRE_OFFLINE_UPSTREAM=1` mode.
2. The frozen WP-02 mutation driver was NOT_RUN on the online development host; it ran green
   (**13/13**) on the accepted offline host (see §6).
3. The WP-03 mutation driver's scratch trees normally live in the OS temp directory; if that is not
   writable (hardened sandbox), it falls back to the clone's parent directory. No repository file is
   written by the driver.
