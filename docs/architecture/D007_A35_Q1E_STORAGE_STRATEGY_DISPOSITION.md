# D007-A35 — Q1e Trust/Transaction Storage Strategy and Conditional Architecture Disposition

**User decision: APPROVED D007-A35 Option B (2026-11-24, Europe/Berlin).** **CLASSIFICATION: DESIGN/COMPARATIVE TECHNICAL DECISION ONLY.** This is an independent follow-up to [A34](D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md), NOT a backend/provider/deployment selection, no executable storage migration, no implementation/work-package G1, no test/QA G3 or G4, no real Nutstore/Zotero/WebDAV ACCESS-02. [D007-A33 remains reserved](D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md) for R09 QA/G4. **Q1e remains UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED; G5 NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 NOT_AUTHORIZED / OVERALL POC-001 BLOCKED_REAL_SERVICE.**

## 1. Authoritative evidence, terminology and decision dimensions

Examined at pinned Design parent `main@63a0e93329dd7dd75f9268b36977229b4d500895`: [A34 conditional Q1e architecture](D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md), [A34 20-scenario QA traceability](D007_A34_Q1E_TRACEABILITY_QA_MATRIX.md), [A6 scoped logical data and snapshot/manifest](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 lifecycle/tombstones](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A11 safe incident recovery](D007_A11_OPERATIONS_RUNBOOK.md), [A17 backup encryption and independent key domains](D007_A17_KEY_HIERARCHY_BACKUP_ENCRYPTION.md), [A29 provider pre-access policy](D007_A29_PRE_ACCESS02_READINESS_DESIGN.md), [A32 R09 precise G1](D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md). No original decision is amended.

**Record authority** = where the canonical confirmed identity, content revision, relationship graph, confirmed operation outcome, complete inventory, and protected deletion high-watermark are committed. **Backup witness** = a trusted, independently protected current checkpoint sufficient to reject a valid but stale archive. These are distinct. Physical storage may be an embedded transactional engine, a standalone transactional service, a provider-specific object store or something else; **NONE chosen by A35**.

**Required A34 proofs:** (I) trusted complete independent logical inventory, (S) common confirmed cross-object snapshot, (R) externally rollback-resistant latest deletion witness, (K) independent authentic/recoverable backup keys and manifest, (V) isolated full restore validation and explicit atomic-or-fenced cutover. A future production claim needs **all I+S+R+K+V**; satisfying I+S alone does not certify restore.

**Website-only ownership:** Projects, associations/per-Project Important, scoped canonical Zotero references, shared ReadingStatus and whole five-field ResearchNote, KeyQuotes/source history. Original Zotero data, PDFs, stored attachment sync, WebDAV credentials, browser drafts and frozen UI are **not transferred, mirrored or deleted**. A7 permanent Project deletion may not cascade onto the global Note/Quote. A5 `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN` must not change meaning.

## 2. Four candidate capability patterns (comparative, NO final selection)

### L0 — DAV PROPFIND listing + per-file checksum Manifest (BASELINE; REJECT FOR CERTIFICATION)

Inventory generated from one untrusted PROPFIND can be internally self-consistent even after a **well-formed 207 silently omitted an unknown record** (A29/Q1e). GET/hash do not ensure all records or common snapshot; separate PUTs for manifest+record+marker are not atomic, nor does ETag guarantee cross-file transactions. **Not eligible to claim I, S or R.** Easy reuse and lowest initial code complexity but unsafe to upgrade to `COMPLETE_BACKUP`. May remain a bounded non-certified synthetic export or known-fixture characterization only.

### L1 — Application-controlled single writer + fenced append-only commit log/immutable objects on DAV (CONDITIONAL RESEARCH ALTERNATIVE)

Use only a **verified exclusive writer/fencing-token boundary covering every API instance and device**. Proposed mechanism (not implemented): immutable versioned record payloads, a monotonic protected commit sequence/catalog with complete IDs and revisions, a manifest bound to that commit, explicitly pending/intended vs committed operations, and separately protected newest deletion checkpoint. Reader snapshots follow a committed catalog version, not the raw directory; durable tokens/ordering must prevent delayed prior writer, process restart or rogue out-of-band WebDAV writer from publishing an old commit. Crash before/after payload/log/catalog publish and lost ACK require authoritative re-identification, never blind retry, false rollback or garbage collection. This is **not guaranteed by merely serializing HTTP requests in one Node.js process** or by a WebDAV LOCK/If-Match whose vendor semantics have not been independently proven.

**Advantages:** greatest direct reuse of POC HTTP/DAV parsing/ETag and fault tests; potentially isolated external sync-like storage. **Costs:** high protocol complexity (fence durability, write intent, commit marker atomicity, marker coverage, crash recovery, compaction, capacity/pagination, quota), substantial QA burden and unknown vendor dependencies. **Hard STOP:** no demonstrated durable linearizable commit/CAS/witness across crashes/two writers/out-of-band changes; no authoritative inventory or latest deletion checkpoint. DO NOT call this a proven production route or pick it by default.

### L2 — Transactional authoritative catalog + separately stored immutable record blobs (CONDITIONAL HYBRID)

A transaction-capable catalog owns complete committed IDs, revisions, parent links, tombstones, operation witnesses and an authorized snapshot/checkpoint. Large payloads could remain immutable version-addressed objects in an external store, but **database transaction + remote object PUT is NOT one atomic commit**. Required publish order: write and independently verify immutable blob, then transactionally publish a catalog pointer; no in-place mutation of already committed referenced blobs, no wrong-version alias, no GC before a proven safe retention/checkpoint fence. Missing blob during read/export means **NOT_RESTORE_CERTIFIED**, even if catalog transaction committed. Orphan blobs are a controlled cleanup question, never evidence of a completed write. Staged restore and archive manifest remain separate.

**Advantages:** clearer identity/relational catalog than L1, potential reuse of POC blob transport. **Costs:** highest coordination/consistency/GC and dual-store migration risk; cross-store disaster recovery, outage/replay and backup-key scope must be proven. **Hard STOP:** cannot prove durable blob availability/integrity at catalog commit or cannot isolate GC from reader snapshot.

### L3 — Single transactional authoritative data layer for website-owned confirmed records (PREFERRED CAPABILITY REFERENCE; PRODUCT UNSELECTED)

As a **conditional architecture target**, place website-owned canonical record state, relationship links, revision/CAS, operation identity/fence evidence, inventory, minimal confirmed deletion metadata and durable checkpoint in **one well-defined transaction boundary**. A sufficiently capable transaction engine can commit multi-record changes atomically and supply an internally consistent read snapshot; archive generation must bind manifest to a transactionally observed catalog/revision/witness. High-risk writer races need isolation appropriate to the invariants, not merely assuming any “Repeatable Read” transaction prevents write skew; test serialization conflicts and retries without blind replay of `UNKNOWN`. This is a **capability criterion**, not automatic selection of SQLite/PostgreSQL, a hosting platform, a region, a database-as-a-service or a new application architecture.

**Advantages:** strongest direct route to I+S and consistent Project+Association/delete/sourceHistory semantics; reduces invention of distributed DAV transaction protocol. **Costs:** changing website-owned record persistence from the POC DAV proof may need a new abstraction/adapter, schema mapping, operational backup, isolation, backup export and deployment work. **NOT solved:** an attacker/incident can roll back the whole transaction store and its internal deletion log; R still needs independent protected checkpoint/witness. K needs separate BACKUP key custody, V a verified isolated restore/cutover, and production durability depends on the chosen engine, filesystem and operations.

**Illustrative official engineering constraints, not an A35 product recommendation:** SQLite documents one writer and WAL snapshot readers; WAL is not a multi-machine shared network filesystem transaction solution. SQLite Online Backup API can snapshot one DB, not all separate upstream objects by itself. PostgreSQL documents Repeatable Read snapshots, but Serializable can reject write-skew transactions; isolation must be chosen for each invariant. These are external technical examples below, not deployments/tests in this repository.

## 3. Binding Design decision A35-D01..D07

**A35-D01 — Prioritize L3 as the future feasibility reference, NOT as an implementation authorization.** L0 disqualified for certified completeness; L1 and L2 retained only as contingent alternatives with explicit proofs. Do not silently abandon WebDAV or change D007-A3 conditional hosting/provider preference; neither a database nor cloud service is selected.

**A35-D02 — Contract-first storage neutrality:** A6 canonical Zotero owner/library/type/item mapping, one global five-field Note and three-state status, per-Project Important, KeyQuote+SourceHistory atomicity, revision/CAS and A5 UNKNOWN/durable operationId remain stable independent of persistence engine; use a storage-neutral adapter and migration evidence in a future separately approved G1, not current POC-001 R09.

**A35-D03 — Critical atomic boundaries:** at minimum Project permanent deletion plus exact associations+protected marker, multi-object confirmed Quote Relink+history, catalog+record publishing and operation outcome must have a proven transaction/fence; rollback or crash must not misreport a partial state as CONFIRMED. A transaction engine alone cannot atomically update an external manifest, key registry, remote blob or downloaded export. File counts/ETags are not a substitute for a commit witness.

**A35-D04 — Independently protected latest witness:** protect high-watermark/deletion checkpoint in a trust+rollback domain independent of the **backup archive being restored**; distinguish full engine rollback from invalid archive, validate identity, version monotonicity, protection against stale/absent checkpoint and A7 deletion policy. Physical custody, durable ordering, rollback protection and retention are future choices. A WAL/SQL commit sequence *inside the same rollback-able backup* is not sufficient proof of global latest.

**A35-D05 — Strict backup/restore gate:** A17 authenticated encrypted owner-bound manifest with independently recoverable backup-key domain, selected deterministic byte canonicalization and full graph/revision verification plus isolated dry-run restore; A11 separately authorized safe active cutover. A successful DB backup primitive or snapshot read is **not** RESTORE_CERTIFIED until independent anti-resurrection and recovery/key tests pass.

**A35-D06 — Evidence before design promotion:** future local comparative G1 (separate from R09) must specify exact branch/base/paths, controlled synthetic multiple writers, crash/late ACK, partial commit and rollback fixtures, full inventory oracle, exact source/byte hashes and independent QA/Design G4. No capability is marked `PROVEN` or new G1 granted by A35; [A35 decision/testing matrix](D007_A35_Q1E_OPTION_DECISION_MATRIX.md) lists mandatory discriminating cases.

**A35-D07 — No implied cost, UX, provider or data erasure change:** engineering complexity estimates are **comparative qualitative judgments, not benchmarks or quotes**; ongoing DB host, storage, backup/key custodial expense and GDPR/retention remain unpriced/undecided. No cloud vendor, datacenter, data region, live account, key, CI/workflow, UI amendment, retention days, RPO/RTO, real RESTORE or provider test is authorized.

## 4. Condition-based scorecard (relative, not measured)

| Criterion | L0 list+manifest | L1 DAV fenced log | L2 txn catalog+blobs | L3 unified txn authority |
| --- | --- | --- | --- | --- |
| I independent trusted inventory | **No** | **Conditional/high proof** | **Conditional** | **Strong candidate inside authority** |
| S cross-object snapshot | **No** | **Conditional/high proof** | **Conditional if blob immutable/verified** | **Strong candidate inside transaction** |
| R latest deletion anti-rollback | **No** | **Needs external witness** | **Needs external witness** | **Needs external witness** |
| K authenticated recoverable backup | **No intrinsic proof** | **Needs separate A17 design** | **Needs separate A17 design** | **Needs separate A17 design** |
| V isolated restore/cutover | **Not certified** | **Hard multi-object protocol** | **Hard cross-store protocol** | **Still separate proof/approval** |
| Existing POC DAV source reuse | **High** | **High** | **Medium** | **Low for persistence; high for tests/contracts** |
| New engineering effort | **Low initial, unacceptable proof gap** | **High to very high** | **High** | **Medium to high** |
| Operational/infrastructure cost | **Not verified** | **Unknown; provider quota dependent** | **Unknown; two stores** | **Unknown; one authoritative store, ops/backup** |
| Migration and rollback risk | **Low code, high data risk** | **High (custom protocol)** | **High (dual-store)** | **Medium-high (persistence migration)** |
| Current Design disposition | **Reject for certified backup** | **Conditional fallback** | **Conditional alternative** | **Preferred *capability* study, NOT selected** |

**Scoring caveat:** a chosen relational engine with a correctly implemented single transaction can improve I/S **inside that engine only**; it does not magically certify remote Zotero, original PDFs, browser drafts, backup-key escrow, real SaaS durability, exact-once across client outages or latest deletion truth after whole-system rollback.

## 5. Next explicit independent decisions (all currently NOT AUTHORIZED)

1. **D007-A36 (preferred):** approve *DESIGN-ONLY* feasibility gate/criteria for one **synthetic storage-neutral transaction/inventory prototype** comparing L1 vs L3, without touching R09 or actual provider; define exact boundary and measurable proof before a separate G1.
2. **D007-A33:** assess already authorized R09 code/independent QA on its exact SHA, if formal results exist; A35 neither expands nor supersedes R09 G1.
3. **Separate D007 deployment/retention/key decision:** after demonstrated options, user can select actual backend technology/storage/custody and backup policy in a later explicit decision, still independent G1/G3/G4 and G5/G6/G7.

## 6. External technical verification (references; not implementation evidence)

- IETF RFC 4918 WebDAV `9.1 PROPFIND / conditional requests: https://datatracker.ietf.org/doc/rfc4918/
- SQLite transactional isolation/WAL (one writer, snapshot readers): https://sqlite.org/isolation.html ; https://www.sqlite.org/fileformat2.html
- SQLite Online Backup API (database-level snapshot primitive): https://www.sqlite.org/backup.html
- PostgreSQL transaction isolation (snapshot vs serializable/write-skew): https://www.postgresql.org/docs/18/transaction-iso.html

**Evidence status:** external normative/engine descriptions support the *capability comparisons*, not a claim that any specific provider implementation has been tested/selected. A34 Q1E-01..20 remain NOT_RUN; no independent Q1e G3 or G4 has occurred.

**D007-A35 FINAL: DESIGN ACCEPTED (CONDITIONAL L3 PREFERENCE, NO PHYSICAL BACKEND SELECTED), Q1e UNSUPPORTED_COMPLETENESS, BACKUP NOT_RESTORE_CERTIFIED, R09 unchanged, G5/G6/G7 NOT_AUTHORIZED, POC BLOCKED_REAL_SERVICE.**