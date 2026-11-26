# WP-04-R1 — Execution QA handoff (TEMPLATE; EVIDENCE NOT_RECORDED)

**Status: TEMPLATE ONLY. No offline run of this candidate has been recorded. This file is not
evidence, does not claim any PASS, and must be filled only after the later independent/offline run
actually happens. Every row below is deliberately `NOT_RECORDED` or `NOT_RUN`.**

This template is sanitized: it contains no Session cookies, CSRF tokens, operationIds, request
bodies, note text, timings, invented test results or invented evidence hashes. Machine-local
absolute paths are omitted. The fixture byte lengths and SHA-256 values in §1 are specification
inputs copied from DESIGN §2, not observed results.

## 0. Authoritative design documents are not present in Base

Authoritative design documents are **not** present in Base `bcc4eaad5183c923f782da0475eea1751be2de3b`
(they were added later on `main` as docs-only commits). The candidate adds only the whitelisted
package plus this `QA_HANDOFF.md`. QA/Design must read
`docs/handoffs/WP-04/DESIGN.md`, `docs/handoffs/WP-04/QA_INSTRUCTION.md` and
`docs/architecture/D007_A85_WP04_R1_G1_DRAFT.md` from `main` at
`b04ba32d009d7731f2c8ca797f87c735cd779e25` (or a later docs-only main). This execution package
does not copy, move or modify those authorities, and no test depends on their presence in the
candidate checkout.

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `bcc4eaad5183c923f782da0475eea1751be2de3b` |
| Branch | `exec/WP-04-research-notes-r1` |
| Candidate commit SHA | `NOT_RECORDED` (record after the Execution commit) |
| Candidate tree | `NOT_RECORDED` |
| Runtime | Node `v22.23.5` x64 (pinned by the environment) |
| Authority | WP-04 `DESIGN.md`, `QA_INSTRUCTION.md`, D007-A85 (read from `main@b04ba32d…`) |
| Package | `packages/wp-04-research-notes-r1/` (new, isolated) |

Frozen inputs (raw-byte guards enforced before parsing):

| Fixture | Bytes | SHA-256 |
| --- | --- | --- |
| `docs/handoffs/WP-01/fixtures/wp01.v1.json` | 4573 | `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` |
| `docs/handoffs/WP-02/fixtures/wp02.v1.json` | 4989 | `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888` |

These fixture facts are copied from DESIGN §2 as specification inputs, not as observed test results.

## 2. Exact commands for the later offline run

`node` below means Node exactly `v22.23.5` x64 from the pinned environment.

```powershell
cd packages/wp-04-research-notes-r1
node --check src/fixtures.mjs
node --check src/strict-json.mjs
node --check src/model.mjs
node --check src/export.mjs
node --check src/server.mjs
node --check support/harness.mjs
node --check scripts/mutation-check.mjs
node --check scripts/verify-candidate-scope.mjs
Get-ChildItem -Recurse -Filter *.mjs | ForEach-Object { node --check $_.FullName }
node --test
node scripts/mutation-check.mjs
node scripts/verify-candidate-scope.mjs
```

The suite of record must be run with a fresh loopback-positive / external-negative egress probe
before and after each command group, on the accepted isolated host (A59/A62 Windows or A54/A55
Linux). A connected-host run fails closed with `EGRESS_PRECONDITION_FAILED: <reason>` before any
socket or upstream child and is not a suite result.

## 3. Evidence table (fill after the later offline run)

Every row starts unrecorded. Replace a cell only with an actual observed command, count, exit code
and sanitized fact. Aggregate PASS without per-item input/assertion/exit is incomplete (A86 DEC-27).

| Item | Command / method | Result |
| --- | --- | --- |
| Egress probe before groups | loopback positive / external, LAN, IPv6, UDP, DNS negatives | NOT_RECORDED |
| Syntax (`node --check`, all 20 package `.mjs`) | per-file `node --check` | NOT_RECORDED |
| WP-04 suite (all Q4-01..Q4-12 present; all must pass) | `node --test` | NOT_RECORDED |
| Q4-01 fixture bytes, initial note only on XFAKE001, absent notes, fresh runId/revisions | `test/q4-01-fixture-initial-note.test.mjs` | NOT_RECORDED |
| Q4-02 create with `If-None-Match: *`, second create 412, owner from Session | `test/q4-02-create.test.mjs` | NOT_RECORDED |
| Q4-03 whole-note update, new revision, 422 schema matrix, no partial write | `test/q4-03-update-schema.test.mjs` | NOT_RECORDED |
| Q4-04 CAS race, stale/missing/weak/wildcard/multiple/malformed preconditions | `test/q4-04-preconditions-cas.test.mjs` | NOT_RECORDED |
| Q4-05 byte fidelity and lone-surrogate/NUL/size rejections | `test/q4-05-byte-fidelity.test.mjs` | NOT_RECORDED |
| Q4-06 ledger replay, changed fingerprint, cross-principal, old runId | `test/q4-06-operation-ledger.test.mjs` | NOT_RECORDED |
| Q4-07 fault/outcome matrix, quarantine, socket drop | `test/q4-07-faults.test.mjs` | NOT_RECORDED |
| Q4-08 auth/CSRF/Origin/media/Workspace/neutral 403 | `test/q4-08-auth-negative.test.mjs` | NOT_RECORDED |
| Q4-09 scope isolation, no cascade, Project independence | `test/q4-09-scope-isolation.test.mjs` | NOT_RECORDED |
| Q4-10 export template, filename, 409, repeatability, no mutation | `test/q4-10-export.test.mjs` | NOT_RECORDED |
| Q4-11 transport limits, targets, methods, redacted logs | `test/q4-11-transport.test.mjs` | NOT_RECORDED |
| Q4-12 strict upstream TAP | WP-01 67/67 | NOT_RECORDED |
| Q4-12 strict upstream TAP | WP-02 44/44 incl. nested WP-01 67/67 | NOT_RECORDED |
| Q4-12 strict upstream TAP | WP-03 103/103 | NOT_RECORDED |
| Q4-12 pinned protected inventory (72 files, literal Base blob IDs) | `git hash-object --no-filters` in the Q4-12 test | NOT_RECORDED |
| Mutation driver (14 named mutants, named failing test required) | `node scripts/mutation-check.mjs` | NOT_RECORDED |
| Candidate scope audit (Base/commits/whitelist/protected/clean/worktree-equal-HEAD) | `node scripts/verify-candidate-scope.mjs` | NOT_RECORDED |
| Audit negatives: extra path, modified Base path, modified protected blob, untracked file, mode change, symlink | QA-owned scratch proofs | NOT_RECORDED |
| Independent QA raw HTTP probes (owner/Workspace/foreign/anonymous, CAS race, replay race, real socket drop, neutral 403 identity, log scan) | QA-owned client | NOT_RECORDED |
| Independent byte-fidelity oracle (QA-derived expected export, per-field and export SHA-256) | QA-owned oracle | NOT_RECORDED |
| Independent QA scratch mutants (≥6, incl. NFC, CRLF→LF, partial write, saved-on-UNKNOWN, cross-library, export-mutates-revision) | QA-owned scratch tree | NOT_RECORDED |
| Linux x86_64 run (A54/A55) | same groups on Linux | NOT_RUN |

## 4. NOT_RUN / limitations (unchanged from scope)

- No real persistence, database, crash recovery, cross-process CAS or durable replay; the ledger is
  process memory only.
- No local unsynced drafts, recovery dialog, per-field comparison/merge UI, autosave or Export Local
  Draft.
- No UI change, no Typora rendering certification, no Key Quotes (WP-05), no Zotero API (WP-06).
- No real identity/provider, PDF, Nutstore/Zotero identifiers or external network.
- No browser/TLS behaviour, no performance/timing claim, no host-level network-isolation claim.
- Linux is `NOT_RUN` unless the later QA actually exercises it; no cross-platform claim is made here.

## 5. Fill-in rules

1. Do not record a result that was not observed on the isolated host.
2. Record the exact command, exit code, actual test counts and any named failing test for mutants.
3. Keep all values sanitized: no cookies, CSRF tokens, operationIds, note bodies or machine-local
   absolute paths. Use route templates, statuses, counts and digests only.
4. Record the candidate commit SHA/tree after the Execution commit; do not invent it.
5. A failed, skipped, timed-out or host-precondition-failed group is a failure, not `PASS`.
