# D007-A6 — Storage-Neutral Data Schema, Serialization, Export, Backup and Safe Migration

**Decision:** D007-A6, **Option B**, explicitly approved by user on **2026-11-23 (Europe/Berlin)**.  
**Stage:** **DATA-CONTRACT DESIGN APPROVED — NOT IMPLEMENTED / NOT VALIDATED**.  
**Authority:** [D007-A5 API/outcomes](D007_A5_API_CONTRACT.md), [D007-A4 authentication/authorization](D007_A4_AUTH_SESSION_SECURITY.md), [Module 002 frozen UI](../ui/002/DESIGN_APPROVED.md), [conditional product D007](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md), [POC-001 limits](../handoffs/POC-001/DESIGN_APPROVED.md), [POC-001 ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md).  
**Scope:** conceptual website-owned entity relationships, immutable/canonical identifiers, logical revisions, schema versions, serialization compatibility, reference integrity, reproducible export, consistency-safe backup/restore and migration conditions.  
**Not authorized:** choosing a database or WebDAV file layout, implementing APIs/website/storage, amending frozen UI, adding live Zotero/WebDAV access, cloud deployment, changing POC-001 branch/files/QA or claiming actual atomic multi-object transactions.

## 1. Non-negotiable ownership and separation

- Zotero **owns** bibliographic metadata, the original annotation records, attachment references, PDFs and Zotero file synchronization. Our website stores **identifiers/references**, not copies of PDFs, original attachment bytes or a second authoritative metadata library. Zotero's own stored versus linked attachments have different device-sync behavior.
- The website **owns** Project definitions, paper↔Project associations, **one globally shared three-state Reading Status per canonical Zotero paper**, **one globally shared five-field Research Note per canonical paper**, saved Key Quotes, the user's comments and website-side source/link history. **Important** is strictly an attribute of the **Project–Paper Association**, never the canonical Paper.
- A source excerpt copied into a user-saved **Key Quote** is website-owned user data; it does not turn an original Zotero highlight into website-owned mutable annotation. Its original citation/annotation identity remains a reference.
- Browser-local *unconfirmed drafts* and unverified mutation intents are **not** interchangeable with remotely confirmed records. Server-side operation ledger, durable browser backup, offline sync, synchronous cross-device updates and multi-object atomicity remain conditional/unproved (D007-A5 and POC-001). This design **must not** represent them as built capabilities.
- Data owner scope must be resolved by authenticated user/approved Zotero-library permissions; canonical global sharing means **across that authorized user's Projects**, **not** a promise of public or cross-user notes. Explicitly avoid leaking cross-library data or guessing IDs for authorization.

## 2. Logical entity relationship (backend-neutral)

```text
Authorized owner / library scope
          |
          +---- Project (projectId, revision, lifecycle)
          |        |
          |        +---- ProjectPaperAssociation (projectId, paperId, important)
          |                                       |
          +---- CanonicalPaper (paperId, zoteroLibraryIdentity + itemKey)
                   |
                   +---- ReadingStatus (paperId, 3-state, revision)     0..1
                   +---- ResearchNote (paperId, 5 fields, revision)     0..1
                   +---- KeyQuote (quoteId, paperId, excerpt, comment) 0..N
                            |
                            +---- SourceReference / ActiveSource
                            +---- SourceHistory (ordered confirmed events only)
                   |
                   +---- Optional OperationRecord / BatchItemResult
                         [ONLY IF a reliable durable ledger is proven]

Separate export/backup manifest → snapshot of website-owned confirmed records
  + identifiers/revision/source mapping + integrity checks
  (not original Zotero files, PDF bytes, account credentials or unsent drafts)
```

| Entity | Identity / uniqueness | Owned fields and invariants |
| --- | --- | --- |
| **CanonicalPaper** | Stable internal opaque `paperId`; **unique key** `(ownerScope, zoteroLibraryType, zoteroLibraryId, zoteroItemKey)` | Only minimal external reference/provenance, optional last-observed read-only Zotero version; no PDF bytes, no mutable authoritative bibliographic copy. A library type is part of identity to avoid conflating user/group libraries |
| **Project** | Stable opaque `projectId` unique within authorized owner scope | Name/description/order/lifecycle and opaque `revision`; archive/restore semantics obey approved UI, not automatic deletion of global paper data |
| **ProjectPaperAssociation** | Unique pair `(projectId, paperId)` within authorized scope | Per-Project `important: boolean`, link provenance and `revision`; repeated import is de-duplicated. Unlink only changes approved association scope, never deletes CanonicalPaper/Note/KeyQuote |
| **ReadingStatus** | Unique `paperId` within authorized owner scope | The **approved exact three-state enum** from frozen UI, revision, confirmedAt where known; avoid inventing a fourth semantic state. Pending/Unknown is a **write-outcome state**, not an extra persisted reading-status enum |
| **ResearchNote** | Unique `paperId` within authorized owner scope | Five named Markdown source fields in approved order and **one whole-note revision**; confirmed content only. Field edit modes, caret/IME, pending offline draft and per-device recovery status are not fields of a confirmed shared Note |
| **KeyQuote** | Unique stable opaque `quoteId` and parent `paperId` | Saved `excerpt`, editable authorized `comment`, optional source-location/hint, active source reference, quote `revision`, ordered confirmed `sourceHistory`. Text/comment preserved on manual Relink |
| **SourceReference** | Scoped opaque `sourceRefId` and referenced Zotero library/item/annotation keys where available | Explicit kind (annotation / paper / page hint / copied excerpt fallback), original external ID, last verified source revision when available; unsupported exact-highlight navigation remains marked unverified |
| **OperationRecord** (conditional) | Uniquely scoped `(principal, operationId, operationType, targetSet)`, validated payload fingerprint | Authoritative result/revision **only when atomic durable operation tracking has been proven**; cannot infer it from API header/idempotency keys |
| **BatchItemResult** (conditional) | `(batchId, canonical targetId)` per original attempted item | `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN/SKIPPED` as appropriate and approved UI result mapping; no record implies completion unless supported by authoritative ledger |

**Cardinality:** Project ↔ CanonicalPaper is many-to-many exclusively through Association; ReadingStatus and ResearchNote are one-per-Paper, KeyQuote is one-to-many. Never create a second global Note merely because the same Paper is added to a new Project. No delete cascade from Project/Association to Zotero or globally shared website-owned data. Specific deletion/archive lifecycle and retention periods are a **future data-lifecycle decision**, not silently set here.

## 3. Canonical Zotero identity and referential integrity

1. **External compound identity:** `(zoteroLibraryType, zoteroLibraryId, zoteroItemKey)` is the authority-bound *identity key*. Preserve Zotero item key case and library type; do not rely on title/DOI/URL as the unique identifier. A distinct library may have the same item key. Treat missing/ambiguous library identity as an unresolved import—not a new arbitrary canonical record.
2. **Internal IDs:** use stable opaque `paperId`, `projectId`, `quoteId` and `associationId` for internal references. IDs are independent of filenames, display titles, export paths and hosting provider. Do not reuse a deleted ID to mean a different external object. An internal ID is not an access token.
3. **Re-import / Collection import:** one-time manual imports may create missing Associations but must *find or confirm* existing canonical paper identities first; duplicate import does not duplicate global ReadingStatus/Note or lose per-Project Important. Collection membership is not continuously synchronized; stored optional import provenance is not a binding remote sync.
4. **References:** before accepting an Association/Note/Quote, validate the referenced parent exists and is in the authorized scope. If a Zotero item/annotation is moved, missing or inaccessible, **preserve** confirmed site-owned quote/note and source history with a source-availability status; never silently guess a replacement or hard-delete data.
5. **Referential consistency:** the logical write boundary must prevent dangling confirmed Association and Quote references, and prevent confirmed source-pointer/history divergence. Whether a physical backend can atomically enforce these relationships across multiple files/objects is **UNPROVEN**; if not, fail closed or seek a new design/POC decision. Do not promise database foreign-key enforcement when no database has been approved.
6. **Stable revision:** each mutable confirmed entity has a server-authoritative opaque revision, not a timestamp or client-invented increment. Whole-note CAS protects all five fields; association/global status and quote/source changes get appropriately scoped guards. An API ETag is authoritative **only if** backed by proven atomic conflict control.

## 4. Exact five-field note and confirmed-versus-draft distinction

The five Markdown fields have these **canonical display names and order from frozen UI**:

| Order | Canonical logical field key (design proposal) | Frozen UI title |
| ---: | --- | --- |
| 1 | `researchQuestion` | **Research Question** |
| 2 | `argumentsAndContent` | **Arguments & Content** |
| 3 | `theoriesAndMethods` | **Theories & Methods** |
| 4 | `contributionsAndInnovations` | **Contributions & Innovations** |
| 5 | `limitations` | **Limitations** |

The machine keys are **design-level serialization suggestions**, not a silent renaming of an already implemented format. All five values are literal UTF-8 Markdown source text, may be empty strings, and preserve user newlines, code fences, inline/display LaTeX, Unicode and original editorial whitespace. Never apply lossy Markdown→HTML→Markdown transformations, Unicode normalization that changes user input, or invented default text.

A confirmed Note is versioned **as one aggregate**, while per-field edit mode, caret, selection, scroll and unsynced draft behavior belong to the frontend recovery state. A local draft's cached/savedAt metadata does not prove a backend save; a cross-device stale note must be compared and deliberately merged with a refreshed authorized remote version. **No automatic per-field remote merge** follows from having five separate keys.

## 5. Key Quote source and non-destructive history

- `KeyQuote` keeps the **saved excerpt and user comment** distinct from source identity. Active source may reference a real Zotero annotation identity/version, Zotero paper, page hint or the approved copied-excerpt fallback; a missing exact annotation cannot be reimagined as a verified deep link.
- `sourceHistory` records **previous confirmed source mappings and the latest confirmed transition**, with ordered event IDs, from/to references, source authority, operation/actor scope and time **where reliable**. Order must come from an authoritative sequence/revision, **not** from user clocks alone. User-confirmed manual Relink preserves the quoteId and text/comment.
- A proposed Relink is a **proposal**, not history: a definite failure or unknown outcome leaves the *last confirmed source* and independent visible recovery intent. History append + active-source revision update must appear atomic; no two-step best-effort write may falsely claim that property.
- The website may store a **minimal non-sensitive source locator**, but never original PDF contents, credentials or a mirrored complete Zotero highlight database. Zotero Web API annotation field availability and device-level `zotero://` navigation remain subject to independent verification.

## 6. Versioned serialization contract (not physical storage layout)

**Contract requirements:** explicit `schemaVersion` (data representation), stable `entityType`, owner/auth scope reference, immutable logical identity, opaque `revision` for confirmed records, expected `paperId/projectId` relation, payload with validated fields, and optional `confirmedAt` (for diagnostics only). `schemaVersion` is distinct from HTTP `apiVersion`, Zotero metadata version and backup-manifest version.

**Synthetic illustration — one confirmed Note (NOT data written or an API response):**

```json
{
  "schemaVersion": 1,
  "entityType": "researchNote",
  "paperId": "paper_fake_001",
  "ownerScopeId": "owner_fake_001",
  "revision": "opaque-confirmed-rev-17",
  "fields": {
    "researchQuestion": "What is the robot learning task?",
    "argumentsAndContent": "Example text only.\n\n- Synthetic point",
    "theoriesAndMethods": "Example: \\(x^2\\), not a real research note.",
    "contributionsAndInnovations": "",
    "limitations": ""
  }
}
```

`schemaVersion: 1` and the field key names above are **proposed conceptual representation**, not an already deployed on-disk schema, database table, JSON schema validator or binding storage-path decision. Actual schema descriptors, validation code and byte-level golden test files require later authorized implementation and QA.

**Deterministic safe serialization:** require UTF-8, an explicitly chosen and documented deterministic encoding for exported *metadata* and sorted key order, normalized representation of dates/integers/booleans, stable JSON escaping and no binary PDF embedding. Preserve Markdown bytes/content **losslessly**; do not reorder user text or trim whitespace. The exact canonical JSON hashing profile, binary packaging and content-addressed naming are **not chosen**; a later implementation must select a published or fully specified byte-level encoding before hashes are compared across devices. Strong checksums detect accidental corruption but are **not proof of authenticity** without a separately managed trusted signature/MAC.

## 7. Export and backup manifest: consistency before file count

- **Export scope:** owner-authorized website-owned records: Project, Association, CanonicalPaper identity/provenance, global ReadingStatus, global ResearchNote source text, Key Quote/comment and confirmed SourceHistory; include minimal source refs and import provenance only where authorized. Explicitly **exclude PDFs, Zotero database, original attachment content, Zotero/WebDAV credentials, session cookies, CSRF tokens, unrelated logs, raw password material and unconfirmed local drafts** by default. Draft export is a separate explicit user-controlled local workflow from frozen UI, not silently part of a server snapshot.
- **Manifest metadata:** `exportFormatVersion`, `schemaVersion` per record, export/snapshot ID, authorized owner scope, counts by entity type, stable canonical and parent-child mapping, known confirmed revisions, exported-at timestamp (diagnostic only), per-record SHA-256 bytes checksum under a specified encoding, total record count and any explicitly flagged missing/unverified data. No credential or full private excerpt is to appear in an unprotected manifest.
- **Atomic snapshot honesty:** a set of successful individual GET/read responses or matching hashes is **not** a guaranteed point-in-time consistent snapshot if Project, Note, Association and Key Quote changed while exporting. Require a **proven coordinated read snapshot** or a separately approved quiescent/fenced checkpoint with independent consistency verification and no unresolved writes. Without this ability, label the bundle **NON-ATOMIC / EXPORT INCOMPLETE — NOT RESTORE-CERTIFIED**, and block automatic restore/claim of complete safe backup.
- **Completeness proofs:** count and verify all referenced parent IDs, uniqueness rules, source history continuity, expected revisions, canonical Zotero mapping and confirmed batches only where ledger is durable. Every record must match its declared bytes hash; partial/incomplete read, stale file list, ambiguous write or snapshot race is a failed backup acceptance.
- **Privacy and encryption:** research notes and quote excerpts are private user-authored content. Exports/backups need **authorized user initiation/access, encryption in transit and at rest under a separately approved secure key lifecycle**, appropriate access control, and independent restore test. Do not upload private exports, real annotations or keys to GitHub/QA logs, nor assume the candidate WebDAV backend provides adequate at-rest encryption or integrity.
- **Retention, rotation and geographic backup placement** remain an explicit later data-lifecycle/operations decision. Do not silently set retention durations, automatic backups, third-party regions or undeletable archives in this schema approval. A backup is valid only after a restore proof, not because a manifest exists.

## 8. Safe restore, rollback and backend migration

**Restore is a potentially destructive operation and requires its own explicit authenticated, scoped confirmation and later runtime authorization.** It cannot overwrite a live dataset as a side effect of choosing Option B.

1. **Stage to a fresh isolated namespace** only after validating archive encryption/authenticity where available, manifest version, all record hashes, parser/size limits, ownership and required feature support. Treat backup text and paths as untrusted, prohibit traversal/zip-slip, arbitrary URLs, executable payloads, unrestricted Markdown script rendering and zip bombs.
2. **Dry-run validation** must prove unique canonical Zotero keys, no duplicate Notes/Association pairs, correct Quote/SourceHistory links, authorized identity mapping, revision continuity, referential closure and expected entity counts. Report unknown/unresolved references as conflicts; no silent deletion or placeholder identity remapping.
3. **Conflict policy:** do not blindly replace a newer confirmed note/quote with a stale backup or merge external source history automatically. Present explicit **restore new isolated copy** versus **review conflicts**. Restoring into a live canonical namespace needs a further approved safe cutover strategy, authoritative revision fencing and tested rollback—not an automatic `PUT` loop.
4. **Commit/cutover gate:** only an independently proven atomic snapshot swap or an equally verified staged/paused read-write boundary may change the active dataset. If POC-001 cannot establish safe cross-object commit or a compatible alternate storage scheme, **STOP** and request a new storage/restore design; never call a partially copied directory “Restored”.
5. **Post-restore:** compare canonical IDs, counts, hashes, source-history ordering, expected revisions and a sample of five-field Markdown. Run deliberate failpoint/rollback tests with synthetic data; report a **separate observed QA result**. Successful record hashes without full cross-entity consistency or encryption/key access do not equal data recovery.
6. **Migration:** export a consistent versioned logical dataset, validate against target schema, trial-restore to isolated target adapter, compare all invariants, verify authoritative old→new identity/revision mapping, plan read/write freeze or dual-write only **if independently proven safe** (not silently assumed), then use a separately authorized cutover and fallback plan. Do not replace Nutstore with a database/new provider or select a physical file layout without a user-approved D007 amendment. Preserve original readable backups until new storage acceptance and safe cleanup authorization.
7. **Schema evolution:** each version transition must have compatibility matrix, validation, representative synthetic fixtures, explicit transforms and reversibility/rollback feasibility. Unknown future schema versions are rejected safely rather than truncated/overwritten; preserve unknown historical data when read-only inspection is possible, but never silently write it back under an older schema.

## 9. POC dependency, evidence gate and STOP matrix

| Design invariant / capability | Approved requirement | Actual evidence state and stop boundary |
| --- | --- | --- |
| Per-object atomic compare-and-swap `If-Match` or equivalent | Required for mutable confirmed records | **NOT PROVEN**; mock tests are not Nutstore validation, real account blocked until ACCESS-02. No silent last-write-wins |
| Cross-object referentially consistent Project/Association/Note/Quote updates | Required to claim confirmed consistent state | **NOT PROVEN**; WebDAV may not support multi-object transactions. If unprovable, redesign aggregate/commit protocol under separate D007 amendment; don't claim transactional filesystem |
| Key Quote active-source + SourceHistory consistency | Required atomic logical transition | **NOT PROVEN**; two-file writes are not atomic. Must fail closed on unsafe Relink implementation |
| One global five-field Note and stable canonical identity | Approved logical schema | **DESIGN ONLY**; implement and verify with authorized synthetic/real tests later |
| Durable operation ledger and batch state | Conditional; not guaranteed by `operationId` alone | **NOT PROVEN**; no claimed automatic verification, cross-reload recovery or dedupe without reliable ledger |
| Complete point-in-time export and safe restore/cutover | Required for calling backup/restore verified | **NOT PROVEN**; per-file hashes alone cannot prove consistency. No live dataset cutover |
| Live WebDAV, secrets and actual provider storage | Test only with explicit ACCESS-02 and approved safe configuration | **BLOCKED** now; POC-001 local synthetic execution continues unchanged |
| Independent QA and application deployment | Exact code SHA/PR and separate acceptance/authorization | **NOT RUN / NOT AUTHORIZED** for D007-A6; no API, UI, hosting, database or migration code approved |

A critical integrity, privacy or restore failure is a **P0 STOP**. User-visible blocked recovery/essential access is P1. An honest inability to guarantee a transaction must remain an explicit unsupported capability and a new decision—never be hidden by a green mock test or a hash-match result.

## 10. Planned D007-A6 acceptance scenarios — NOT RUN

| ID | Synthetic future verification and expected result |
| --- | --- |
| **A6-01** | Identical Zotero library+item imported into three Projects → exactly one CanonicalPaper/ReadingStatus/ResearchNote; distinct per-Project Important |
| **A6-02** | Same itemKey under different Zotero library/type → distinct CanonicalPaper identities; DOI/title collisions do not merge records |
| **A6-03** | Five-field Markdown round-trip preserves order, Unicode, LaTeX, newlines, trailing whitespace and empty fields byte-for-byte after documented encoding |
| **A6-04** | Concurrent whole-note writes return guarded conflict or proven confirmation; draft and last-confirmed remote revision retained |
| **A6-05** | Key Quote manual Relink failure/unknown/concurrent writer preserves excerpt/comment, active confirmed source and history order; no orphan event |
| **A6-06** | Unlink one/all Projects removes only approved Associations; no canonical/Zotero/global note/source cascade |
| **A6-07** | Backup snapshot while writes occur: either prove fenced/consistent snapshot or label non-atomic/incomplete; per-file hashes alone not PASS |
| **A6-08** | Repeated export to protected synthetic fixture validates manifest schema, parent closure, record SHA-256, counts, no PDF/credential content |
| **A6-09** | Restoring corrupt/missing/foreign-owner/unsupported-version archive into fresh namespace fails before any live mutation |
| **A6-10** | Migration under synthetic dual revisions with crash/failure injection has reversible staging/rollback proof or stops without partial cutover |
| **A6-11** | Revoked/expired/unauthorized user cannot export, restore, move or read another user's notes/source history; no leaked manifest details |
| **A6-12** | Operation ledger absent / stale record / unknown remote response is marked unverified; restore does not invent persistence or batch history |

**Evidence required later:** separately authorized code change scope, exact implementation/PR SHA, synthetic fixtures, target provider behavior, before/after checks, deterministic failures, sanitized logs, independent QA review and explicit Design decision. **All twelve scenarios are planned, not executed.** They do **not** amend or assert PASS for the 26 frozen Module 002 UI scenarios or the seven separately scoped POC-001 checks.

## 11. Deferred design and next decision

- **Not chosen:** database, file/directory partitioning, JSON canonical hash profile, encryption/KMS provider, archive format/filename convention, quota, timestamp granularity, live session store, retention intervals, lifecycle deletion rules, physical transaction strategy, deployment, paid plans or EU region.
- This decision does **not** make append-only history, a durable event ledger, atomic multi-file backup, automatic retention or cloud storage an already implemented feature. Revisit any such feature after POC-001 real-provider evidence and a separate explicit authority/architecture amendment.
- **Next independent architecture decision:** **D007-A7 — data lifecycle, retention/deletion, privacy and export rights**, to specify what user data is retained, archive/delete/recovery rights and privacy/safety rules before actual backend selection. Still **design-only**.

**Disposition:** **D007-A6 APPROVED (STORAGE-NEUTRAL DATA CONTRACT)**. **POC-001 local test permission unchanged. REAL NUTSTORE BLOCKED. UI FROZEN. CODE/DEPLOYMENT NOT AUTHORIZED. RUNTIME QA NOT RUN.**
