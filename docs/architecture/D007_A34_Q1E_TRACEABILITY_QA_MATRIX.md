# D007-A34 — Q1e Trusted Manifest/Snapshot/Restore Traceability and Independent QA Gate Matrix

**Classification: DESIGN-ONLY / ALL TESTS NOT_RUN / NO G1.** Normative [A34 Q1e architecture](D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md); earlier [A6](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A11](D007_A11_OPERATIONS_RUNBOOK.md), [A17](D007_A17_KEY_HIERARCHY_BACKUP_ENCRYPTION.md), [A29](D007_A29_PRE_ACCESS02_READINESS_DESIGN.md) and [A32 R09 G1](D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md) remain unchanged and binding. **This matrix is not an Execution instruction or authorization.** Real provider and production results are UNSUPPORTED/NOT_RUN. `Q1e=UNSUPPORTED_COMPLETENESS` and `OVERALL POC-001=BLOCKED_REAL_SERVICE`.

## 1. Source → decision → proof → STOP traceability

| Prior source / constraint | A34 requirement | What would constitute independent evidence; failure |
| --- | --- | --- |
| A6 canonical owner/library identity, one global Note/status, many-to-many Associations | Q01/Q03/Q06: trusted complete record graph and opaque revisions | Full trusted ID/revision roster and reference closure; foreign owner/duplicate/dangling link → FAIL |
| A6 export consistency, canonical bytes, manifest SHA | Q02/Q03: common checkpoint, lossless byte profile and authenticated inventory | Mixed revisions, missing known record, tampered hash or changed text → NOT_RESTORE_CERTIFIED |
| A7 archive/unlink/deletion distinction, conditional tombstone | Q04: protect global data and latest confirmed deletion marker | Old valid backup resurrects deleted Project, marker missing/invalid → BLOCK |
| A11 UNKNOWN never auto-replay and isolated rollback | Q02/Q06/Q07: witness all writer outcomes, stage only, separate cutover | Late commit/UNKNOWN, partial restore or unapproved active PUT → STOP |
| A17 backup-key separation and AEAD not latest | Q03/Q05: authenticated owner-bound archive with independent backup key and anti-rollback trust | No backup key, forged authenticated context, stale old signed archive → BLOCK |
| A29 valid 207 can omit unknown item | Q01: trusted external inventory, never self-certify raw PROPFIND | Unknown omission cannot be detected without independent manifest authority → UNSUPPORTED |
| A32 R09 G1 limited cleanup/mutation repair | Q08 firewall: new Q1e work requires separate user G1 | Any R09 path/QA change via A34 → FORBIDDEN |
| A5 four write outcomes / A11 STOP | Q02/Q07 truthful states | Any auto-CONFIRMED from matching bytes, auto-replay UNKNOWN or false Deleted/Restored → P0/P1 STOP |

## 2. Future synthetic fixture (proposed, NOT BUILT)

An independent QA-authored fake owner namespace would include: two Projects (one later explicitly permanently deleted), at least three ProjectPaperAssociations and per-project Important, two canonical Zotero-paper compound IDs across at least two library scopes sharing a possible itemKey, one global three-state ReadingStatus and a whole five-field ResearchNote with byte-sensitive UTF-8/Markdown, two KeyQuotes with active SourceReference and ordered confirmed SourceHistory, one unconfirmed browser draft excluded from backup, one in-flight UNKNOWN, and a second concurrent writer. The fixture must contain independent **expected** inventory identities not discoverable only via the same WebDAV listing and separate intentionally stale snapshots/tombstone state. No real PDFs, personal Notes, titles, annotations, accounts or credentials.

**Key design blocker before executable QA:** this fixture's independent expected list is a QA oracle, not a proven production catalog transaction. Later architecture decision must identify how catalog mutation, checkpoint and delete witness remain durable/atomic with real confirmed writes. If no mechanism, tests can prove only *bounded known-fixture enumeration*, not full backup.

## 3. Planned independent Q1E scenarios — all NOT_RUN

| Case | Independent probe / expected fail-closed oracle | Current |
| --- | --- | --- |
| **Q1E-01** | Correct owner-scoped predeclared synthetic inventory vs root/kind listing, exact IDs/counts/revisions, parent closure; label **KNOWN_FIXTURE_ENUMERATION_OBSERVED only** | NOT_RUN |
| **Q1E-02** | Well-formed DAV 207 silently omits a *known* ID; trusted fixture/inventory oracle detects omission, no 200 “complete backup” | NOT_RUN |
| **Q1E-03** | Well-formed DAV 207 omits an *unknown* ID absent from any trusted external inventory; demonstrate no conclusive test exists and **UNSUPPORTED**, no false PASS | NOT_RUN |
| **Q1E-04** | Duplicate ID, same Zotero itemKey in two distinct library scopes, foreign owner, dangling Association/Quote/source reference, history event gap → reject | NOT_RUN |
| **Q1E-05** | Two writers edit Note/Project/Quote between individual GETs; mixed revision and non-atomic history → NOT_RESTORE_CERTIFIED | NOT_RUN |
| **Q1E-06** | Lost ACK, delayed commit or unresolved A5 UNKNOWN while freezing writers → no false snapshot/commit/rollback, quarantine and STOP | NOT_RUN |
| **Q1E-07** | Crash between record PUT and catalog/manifest PUT in either order; no assertion of durable atomic inventory unless separately proven | NOT_RUN |
| **Q1E-08** | UTF-8/Markdown five-field Note byte-for-byte, LaTeX/code fences and Unicode; per-record hash/length and deterministic canonical-encoding profile, no lossy text | NOT_RUN |
| **Q1E-09** | Tampered/missing/reordered manifest entry and a forged recomputed plain SHA list; authenticity absent until independently trusted MAC/signature/AEAD auth is proven | NOT_RUN |
| **Q1E-10** | Wrong owner/key/suite/nonce/tag/AAD or destroyed BACKUP-KEK/DEK; auth fails or KEY_UNAVAILABLE, no fake decryption/account-reset recovery | NOT_RUN |
| **Q1E-11** | Backup key independent from Session/DATA-key rotation only if proven; no automatic key creation or escrow assumptions | NOT_RUN |
| **Q1E-12** | Old but correctly encrypted backup contains a later **confirmed deleted Project**; newest outside-archive checkpoint/deletion witness blocks resurrection; global Notes/Quotes preserved | NOT_RUN |
| **Q1E-13** | Delete→marker and marker→delete crash/ACK races; missing, rolled-back or stale marker/unknown deletion ⇒ RESTORE_BLOCKED_STALE_DELETION_STATE | NOT_RUN |
| **Q1E-14** | Unverified/latest checkpoint absent or attacker rolls back both backup and internal manifest; an externally trusted monotonic witness is necessary, else STOP | NOT_RUN |
| **Q1E-15** | Restore to fresh isolated namespace, verify exact record counts/parent/source links/revisions, refuse duplicate, path traversal/zip-slip, oversized/unknown schema, foreign scope | NOT_RUN |
| **Q1E-16** | Failure during partial staging and two concurrent restores: active dataset and unsent drafts unchanged; no best-effort live PUT falsely called Restored | NOT_RUN |
| **Q1E-17** | Simulated fenced/atomic cutover and rollback with newest deletion witness; if backend cannot guarantee it, STORAGE_ARCHITECTURE_AMENDMENT_REQUIRED | NOT_RUN |
| **Q1E-18** | Negative scope scan: PDF/annotation/credential/token/local unconfirmed draft excluded; metadata/encrypted manifest not leaked to logs, PR or fixture | NOT_RUN |
| **Q1E-19** | Retention and tombstone expiry conflict simulated: no silent indefinite metadata retention, numeric days, production legal certification or automatic deletion | NOT_RUN |
| **Q1E-20** | Fresh separately user-opened QA session, exact implementation SHA, fixture digest, own mutants/faults, independent evidence/STOP and direct PR QA comment; Design alone decides G4 | NOT_RUN |

**Expected mutations in later separately authorized QA:** drop an inventory entry but keep valid DAV 207; swap one record revision; forge a content SHA; remove a deletion marker; roll back an old yet authenticated checkpoint; bypass foreign-owner check; inject raw zip path; silently clear an UNKNOWN; restore stale deleted Project; skip one of five Note fields. Each should be killed by the intended assertion rather than syntax/setup crash. If trust anchor is unavailable, record **UNSUPPORTED**, not a fabricated mutation kill.

## 4. Proof and admission stages

| Stage | Required evidence and forbidden inference |
| --- | --- |
| `DESIGN_ONLY_Q1E` | **Current**, A34 architecture and matrix; no code, QA or keys |
| `KNOWN_FIXTURE_ENUMERATION_OBSERVED` | Future G1 + separate-window independent G3 and Design G4; proves only predeclared fake IDs, not arbitrary items |
| `SNAPSHOT_CERTIFIED_SYNTHETIC` | Future proven atomic/fenced inventory+checkpoint, two-writer/UNKNOWN failpoints, exact immutable SHA QA |
| `RESTORE_CERTIFIED_SYNTHETIC` | Future authenticated isolated trial restore, deletion anti-rollback witness, full negative tests and separate G4 |
| `PROVIDER_OBSERVED` | Only after explicit G6 ACCESS-02 authorization and controlled independent provider test; not automatically full correctness |
| `PRODUCTION_RESTORE_CERTIFIED` | Separate physical backend/keys/retention/operations/cutover proof and Design release gate; **NOT CURRENTLY AVAILABLE** |

**Hard STOP:** missing trusted catalog authority, unresolved UNKNOWN/late commit, absent marker/monotonic external witness, mismatch of schema/hash/owner/keys, stale deleted ID, unauthorized live cutover, exposing a PDF/secret/real note, unexpected path or violating R09 scope. All run/restore work requires **new user-approved G1, bounded exact branch/base/paths, Execution coordination, separate independent G3 and later Design G4**. No automatic promotion.

**Unresolved architecture parameters (independent future choices):** trustworthy inventory transaction/storage, source of monotonic checkpoint, atomic writer fence or snapshot cutover, manifest canonical serialization/hash suite, authenticated key/backup format, tombstone privacy/retention, numeric backup cadence/version count/RPO/RTO/provider/region and future operations. No storage vendor is selected by A34. A33 R09 QA/G4 remains separately reserved and must never infer a Q1e outcome from R09 tests.

**Overall: Q1e UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED / G5-G6-G7 NOT_AUTHORIZED / OVERALL BLOCKED_REAL_SERVICE.**