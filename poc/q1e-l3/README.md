# Q1E-L3 — synthetic transaction reference model (D007-A37) · LOCAL / SYNTHETIC / MODEL_ONLY

**What this is:** a deterministic, in-memory, storage-neutral **reference transaction model**. It shows which logical invariants an L3 "authoritative transaction" design must keep, and it checks them against the 26 L3-applicable A36 cases.

**What this is NOT:**
- not a database;
- not a selected product;
- no fsync, WAL, power-loss or multi-process durability;
- not SQL isolation;
- no real key custody;
- not a production manifest or serialization profile;
- not a backup or restore certificate;
- not Q1e closure;
- not ACCESS-02.

| Label | Meaning here |
|---|---|
| `MODEL_ONLY` | Every PASS refers only to the modelled logical behaviour under the tested schedules |
| `PHYSICAL_DURABILITY_UNPROVEN` | A "crash"/"restart" discards in-flight work and keeps the explicitly modelled published state; it simulates a durability boundary, it does not prove one |
| `UNSUPPORTED_COMPLETENESS` | An omission absent from every source (A36-C02) cannot be detected; only a **known** omission against a **predeclared test fixture** can (A36-C01) |
| `NOT_RESTORE_CERTIFIED` | No export, manifest or staged restore here is a backup certificate |

**Authority:** D007-A37 (`main` @ `968dd0fe55170a84699dca683ef4194e8d11a093`); A36 matrix; A34/A35; `docs/handoffs/Q1E-L3/EXECUTION_WORK_ORDER.md`.
- **Branch:** `exec/Q1E-L3-synthetic-transaction-feasibility`, created from the immutable base `1dd8b51f84921d23dc0112e4056fa7220bbb73e8`.
- **Runtime:** Node v22.23.5, built-ins only (`node:test`, `node:assert/strict`, `node:crypto`; the scripts also use `node:fs`/`node:child_process` to read files and spawn `node`). No dependency, no install, no network.

## Layout (the A37 whitelist; nothing else is touched)

| Path | Role |
|---|---|
| `src/model.mjs` | Copy-on-write engine. One published state = records + authoritative catalog + operation witnesses + confirmed Project-deletion log, published at **one** explicit commit barrier. It provides: optimistic SERIALIZABLE checks (read set incl. type scans, and write set); `CONFIRMED / CONFLICT / DEFINITE_FAILURE / UNKNOWN`; crash barriers `after-validate`, `after-build`, `before-publish`, `after-publish-before-ack`; `reconcile(opId)` from the published witness; never a retry. Its domain operations are whole five-field Note, three-state ReadingStatus, Quote Relink + SourceHistory, and Project deletion (only the Project and its own Associations). |
| `src/snapshot.mjs` | Predeclared synthetic inventory (`trustedInventory`), DAV-like listing check, export pinned at one checkpoint K, external-manifest write (T07), fixture-only deterministic encoding and digest, and the synthetic fixture **F0**: two owners; the same Zotero itemKey in two library scopes and another owner's library; Projects alpha/beta/gamma; Important Associations; a UTF-8/CRLF/emoji/combining-mark Markdown Note; a KeyQuote with history; an unconfirmed local draft that must never be exported. |
| `src/recovery.mjs` | Logically separate deletion high-watermark witness, a FIXTURE_ONLY HMAC-tagged archive with a random per-test key, and **isolated stage-only** restore. Its gates, in order: authenticity → witness present/independent → pending deletion reconciliation → store rollback → witness replay/lag → stale deletion state → retention policy → fresh namespace → validation. There is **no cutover** (`cutover()` throws `CUTOVER_NOT_AUTHORIZED`). |
| `test/l3-contract.test.mjs` | A36-C01..C12 and A36-R01..R07. |
| `test/l3-faults.test.mjs` | A36-T01..T07 (every barrier, two-writer schedules, rollback). |
| `scripts/check.mjs` | Syntax, 26-case mapping, built-in-only imports, no network API, no dependency, secret/PDF scan, README labels, and the git whitelist versus the base. |
| `scripts/mutation-check.mjs` | 12 mutants (the 8 A37 classes + owner, Note, hash, global cascade), each in a disposable copy under `os.tmpdir()`; KILLED only by the intended named assertion. |
| `evidence/` | Sanitized synthetic run output (`L3-*`). |

Each test emits `L3-CASE {json}` lines (case_id, fixture digest, oracle, barrier, expected/observed status, deletion checkpoints). Every positive control has a fail-closed negative in the same case.

## Commands (from the repository root)

```
node --test poc/q1e-l3/test/*.test.mjs
node poc/q1e-l3/scripts/check.mjs
node poc/q1e-l3/scripts/mutation-check.mjs
```

## Honest limits (read before using any result)

- **Durability:** in-memory only, so physical durability, crash consistency, isolation of a real engine, multi-process and multi-host behaviour are **UNPROVEN**. The tested schedules are the deterministic ones in the tests; this is not a proof over all interleavings.
- **Completeness:** the "trusted" inventory is a test fixture. No trustworthy production catalog is shown to exist; **Q1e stays `UNSUPPORTED_COMPLETENESS`**.
- **Witness:** the deletion witness is a separate *logical* mock domain. It demonstrates why external anti-rollback evidence is needed; it is not an independent store, hardware root or production custody.
  - A witness replayed together with the store is caught only through the operator-recorded last-seen witness sequence (`minWitnessSeq`). Without such an anchor it would be undetectable.
- **Deletion and witness are not atomic:** confirming a deletion takes a store commit plus a witness advance, with no atomicity between the two. A crash between them is never reported CONFIRMED; it leaves a quarantined intent that blocks restore (R03).
- **Authentication and encoding are fixture-only:** the HMAC tag and the deterministic encoding are test fixtures, not an approved signature, key custody or canonical serialization. Lost keys are reported `KEY_UNAVAILABLE` and never regenerated.
- **Retention:** no retention period is invented. A privacy erasure request without a decided policy gives `POLICY_DECISION_PENDING`.
- **L1 is out of scope:** A36-L01..L09 are not implemented and not run.

**Status:** `A37 G1 AUTHORIZED_LOCAL_SYNTHETIC_MODEL_ONLY`; independent G3 NOT_RUN; G4 is Design-only (D007-A38). G5 merge NOT_AUTHORIZED · G6 ACCESS-02 BLOCKED · G7 NOT_AUTHORIZED · OVERALL POC-001 BLOCKED_REAL_SERVICE.
