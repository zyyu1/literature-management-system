# D007-A17 — Provider-Neutral Data Encryption, Key Hierarchy and Backup Recovery

**Decision:** **D007-A17 Option B APPROVED**, 2026-11-23 (Europe/Berlin).  
**Authority:** **SECURITY/DATA ARCHITECTURE DESIGN ONLY — NO CRYPTOGRAPHIC IMPLEMENTATION, KEY/ACCOUNT GENERATION, DATA ENCRYPTION, BACKUP/RESTORE RUN, REAL PDF, TEST, CLOUD OR DEPLOYMENT.**
**Intent:** separate website-owned sensitive-data encryption from API authentication/Session/CSRF secrets, external Zotero/WebDAV credentials and independently recoverable backup keys; specify trust and encryption boundaries, metadata/nonce integrity, key custody, staged rotation, safe recovery/anti-resurrection and independent exact-SHA QA.
**Source contracts:** [D007-A4 authenticated API/opaque Sessions and CSRF](D007_A4_AUTH_SESSION_SECURITY.md), [A5 version/CAS and UNKNOWN](D007_A5_API_CONTRACT.md), [A6 schema/export/consistent restore](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 privacy, retention and conditional tombstones](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A8 Zotero data ownership](D007_A8_ZOTERO_INTEGRATION.md), [A9 QA/fixtures](D007_A9_QA_FRAMEWORK.md), [A10 separate implementation gates](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [A11 incident/backup drills](D007_A11_OPERATIONS_RUNBOOK.md), [A12 capacity/QoS](D007_A12_QOS_CAPACITY_BUDGET.md), [A13 environment separation/secret promotion](D007_A13_ENVIRONMENT_ISOLATION.md), [A14 Host-only Cookie/HTTPS/CORS](D007_A14_ORIGIN_COOKIE_TOPOLOGY.md), [A15 one-Owner identity and MFA recovery](D007_A15_OWNER_IDENTITY_RECOVERY.md), [A16 sensitive action step-up/consent](D007_A16_SENSITIVE_ACTION_AUTHORIZATION.md).
**Frozen UI:** [Module 002 DESIGN_APPROVED](../ui/002/DESIGN_APPROVED.md) **67 UI decisions / 26 U6 tests NOT RUN**; no new user screen, deletion/export action or login method. [POC-001 REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md) remains on original branch `exec/POC-001-webdav-feasibility`, base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, same allowlist, **NO REBASE**. Second independent QA of `2806d9d08dcec78e974703a82a38a696ae76d132`: **LOCAL_STAGE PARTIAL**; real Nutstore ACCESS-02 **BLOCKED**, PR #2 **NOT MERGE AUTHORIZED**.
**Undecided:** exact crypto library/algorithm/key length/nonce scheme and backup format; KMS/HSM/secret manager; ownership/escrow operator; domain/provider; key rotation intervals/retention days; encryption-at-rest physical storage; client-side end-to-end encryption; account recovery credentials; RPO/RTO. This document does **not** claim certified encryption or recovery.

## 1. Security goals, limits and storage ownership

**Protect:** confidentiality and integrity of website-owned Projects, Project–Paper associations/Important, global ReadingStatus, five-field ResearchNotes (Markdown), KeyQuotes (excerpt/comment), SourceReferences/SourceHistory, authorized internal mappings, backup manifests/snapshots and sensitive session/operation metadata appropriate to their threat profile.

**Retain original ownership:** Zotero remains authoritative for bibliography, PDF bytes, original annotations and its already-running attachment sync. The website **never mirrors/copies PDFs** into website storage or into its backups. Website Key Quote excerpts and user comments are website-owned and require protection even if an original annotation is public. External Zotero key/second WebDAV password is a **credential** managed separately, not an encryption key for the website corpus; the existing Zotero attachment WebDAV password is not available for website reuse.

**Threat boundaries and what encryption cannot assert:**
- **At-rest storage encryption** protects against disclosure of certain copied disks/remote objects/backups **only if key access remains separate**. A secure API that decrypts plaintext for authorized rendering **can still see content**, so this is **not E2EE, zero knowledge or proof against a compromised live API**. Authentication and per-record authorization remain mandatory.
- **TLS in transit** remains required for approved browser/API and later provider connections. TLS does not encrypt browser drafts at rest, protect against a malicious API or prove an upstream write became durable.
- **AEAD authenticity** detects alteration of protected ciphertext *with correct key and metadata binding*; it does not prove cross-object snapshot atomicity, latest valid version, actual authorized user intent, durability or anti-resurrection. A valid **older** encrypted record may still be a rollback attack.
- **Client/downloaded exports** are explicitly selected single-note Typora-compatible Markdown in frozen UI and may be plaintext **after user export**. A17 must not silently encrypt them into a new incompatible format or assert that files outside the website can be remotely destroyed. Browser local unsynced drafts are device-controlled and may remain recoverable but **not guaranteed encrypted** by the server; a separate local-storage encryption/UX trade-off and user permission is needed before changing their behavior.
- **Encryption is not deletion.** Old ciphertext, plaintext debug copies, snapshots, search/cache indexes, user-downloaded documents, browser drafts and escrowed keys can survive nominal key removal. Without proved inventory and irrecoverability, no cryptographic-erasure claim.

## 2. Logical key taxonomy and hierarchy (conceptual, no keys created)

```text
APPROVED FUTURE SECRET CUSTODY (provider / KMS not selected)
 |
 +-- AUTHN: password-verification KDF or external IdP/WebAuthn proof
 |     (verifiers and authenticators; NEVER reuse as a data encryption key)
 +-- SESS: session signing/encryption/revocation protection (if applicable)
 +-- CSRF: Session-bound anti-CSRF token signing/MAC secret (if chosen)
 +-- INTENT/LEDGER: A16 high-risk consent provenance HMAC / op auth
 |     (distinct purpose, distinct version and revocation policy)
 +-- DATA-KEK-vN: wraps DATA-DEK-vN, per environment/owner domain
 |          |
 |          +-- DATA-DEK-vN: AEAD for confirmed website records
 |                  (per-record/per-aggregate vs tenant granularity TBD)
 |
 +-- BACKUP-KEK-vN: separate recovery custody, wraps BACKUP-DEK-vN
 |          |
 |          +-- BACKUP-DEK-vN: AEAD for authenticated backup contents
 |                  and protected manifest/checkpoint
 |
 +-- EXTERNAL-CREDENTIALS (not data keys):
       Zotero read-only API credential, future isolated Nutstore
       app-specific WebDAV password and their independent revocations
```

| Purpose / logical material | Custody, operation and minimum separation | Revocation/availability implication |
| --- | --- | --- |
| **Owner authentication verifiers and factors** | Password verifier or external IdP/WebAuthn public-key credential record under A15; password is **not** a DEK. WebAuthn private key belongs to authenticator, not server | Password reset/Passkey loss changes authentication and API access but must **not silently destroy/decrypt** DATA/BACKUP keys; account recovery does not automatically restore independent cryptographic escrow |
| **Opaque Session / CSRF** | Session ID is a bearer **handle**, not necessarily a signing key. If Session authentication or CSRF uses MAC/crypto secrets, purpose-separated versioned server custody under A4/A14 | Rotating Session keys can invalidate or rebind Sessions/tokens without altering stored Notes; preserve in-flight A5 UNKNOWN and unsynced drafts |
| **Intent/operation-ledger integrity** | Distinct server-held MAC/HMAC signing identity for A16 one-use consent and any proven durable operation provenance; never reuse DEK/Session key | Changing it can invalidate old grants/operation evidence: preserve safe UNKNOWN and do not claim exactly once across key rotation without a verified durable ledger |
| **DATA-KEK** | Environment/owner-separated key-encryption key, ideally not exported as plaintext from later approved protected custody; may wrap encrypted DEKs using authenticated key wrapping | Compromise warrants STOP and rotation; cannot just discard old KEK while old data/backup references it |
| **DATA-DEK** | Cryptographically independent data-encryption key for *confirmed website record domain*, bound to owner, environment, data type, ID/revision by authenticated metadata; exact granularity not selected | Re-encryption/rewrap plan must preserve the complete five-field Note, Quote/History and associations; credential recovery cannot recreate a lost random DEK |
| **BACKUP-KEK / BACKUP-DEK** | **Separate cryptographic purpose and recovery authority from active DATA KEK**, independently recoverable under later approved policy. A backup DEK must remain recoverable for retained snapshots, not accidentally tied to a current Session/MFA key | A backup key leak is a backup confidentiality incident even if API keys rotate; backup-key loss may make every protected snapshot undecryptable |
| **External Zotero/WebDAV credentials** | Server-side least-privilege read key and separately authorized WebDAV app password in distinct provider-specific credential references and audit scope; never frontend/log/deep link | Revoke upstream credentials individually; **does not cryptographically erase** existing website Notes or already exposed upstream data |
| **TLS/service/CI secrets** | Environment-specific credentials and deploy attestations, not DATA/backup keys by default; A13 secret promotion forbids moving secret values from QA to prod | TLS cert rotation does not constitute data-key rotation. Compromised CI/build pipeline still threatens plaintext runtime if deployed |

**Environment rule:** Local Synthetic and Independent QA may later use **explicit test-only synthetic keys**, but no production key IDs, plaintext, wrapped keys, user Note or actual PDF may enter fixture, log, source map, PR or CI artifact. Staging and Production must use distinct cryptographic key domains, owner IDs and backup namespaces. Do not infer isolation from a `NODE_ENV` label alone.

**Granularity trade-off deferred:** per-owner/per-data-class DEK minimizes key inventory but has larger blast radius; per-aggregate/per-record DEKs reduce some collateral exposure but increase key/cost/restore/rotation complexity and may require per-record metadata. The chosen unit must permit a stable five-field Note aggregate write and Quote+SourceHistory consistency, with tested availability/latency (A12) and provider safety (POC). No separate physical folder/database/key service is chosen.

## 3. Encryption boundary and future envelope record

A future **authenticated encryption with associated data (AEAD)** scheme is a design candidate, using a **vetted maintained crypto library** and independently reviewed nonce/IV allocation across concurrent API instances. AES-GCM and ChaCha20-Poly1305 family are **candidates, not a chosen algorithm or assurance certification**. Raw passwords, deterministic plaintext hashes, unauthenticated stream ciphers, custom crypto and reusable fixed IVs are not acceptable substitutions.

**Illustrative *schema fields* (no actual encryption output):**

```json
{
  "formatVersion": 1,
  "environment": "SYNTHETIC_ONLY",
  "ownerScope": "fake-owner-a",
  "entityType": "ResearchNote",
  "entityId": "fake-paper-001",
  "recordRevision": "fake-rev-2",
  "algorithmSuite": "UNSELECTED",
  "dataKeyVersion": "fake-data-dek-v2",
  "wrappedDataKeyRef": "fake-wrapped-key-reference",
  "nonce": "NOT_GENERATED",
  "ciphertext": "NOT_GENERATED",
  "authTag": "NOT_GENERATED",
  "associatedDataSchema": "UNSELECTED"
}
```

- **Authenticated associated data (AAD)** must bind canonical environment/owner namespace, entity type and ID, schema/version, revision/operation semantics, required source-reference mapping or key scope where needed. Protected metadata that affects permissions or Restore/SourceHistory scope cannot be freely altered without rejecting the object. Fields that change during legitimate migration need a deliberately versioned re-encryption/reauthentication plan, not unverified AAD rewriting.
- **Nonce/IV uniqueness:** enforce algorithm-specific uniqueness for every encryption under a DEK even across simultaneous writers, retries, process crashes and key rotations; reject on key/nonce reuse or counter-state ambiguity. Ciphertext must be produced for **new confirmed revisions** only under a valid A5 operation boundary; the same successful operation must not be fabricated twice after an UNKNOWN timeout.
- **Authenticated envelope:** each ciphertext carries suite/version/key-ID, random nonce (if chosen algorithm requires one), encrypted data and authentication tag. A public key identifier is **not itself a secret**, but revealing owner, record names, titles, lookup keys, provenance or detailed schema in plaintext may still leak sensitive metadata; minimize or encrypt metadata according to the threat model. Key version and record binding must be validated before decryption and cross-tenant routing.
- **No authenticated-encryption claim for hash-only records:** SHA-256 checksums can detect certain accidental changes but without a keyed MAC, authenticated manifest or signature cannot prove provenance against an attacker who can rewrite both payload and checksum. AEAD also cannot prove “latest snapshot”; anti-rollback requires a trusted **monotonic checkpoint/version witness outside the attacker-controlled backup set**, with its own protected custody and proven update consistency.
- **Runtime read/write:** API authorizes owner and object **before** requesting decryption, validates tag/AAD/allowed suite/revocation/version, handles failure as `INTEGRITY_FAILURE/UNAVAILABLE`, does not show a corrupted object as empty Note or overwrite it. AEAD encrypt/decrypt does not replace `If-Match`/revision CAS for multi-device writes or prove WebDAV transactional writes.
- **Plaintext exposure budget:** authorized server processing and user-facing browser edit/preview necessarily expose Markdown plaintext in their trusted runtime. Avoid plaintext in frontend telemetry, browser URLs, CDN/private caches, provider logs, crash reports, snapshots, staging fixtures and temporary exported server files. Memory zeroization and crash-dump controls require later runtime-specific validation; do not promise them in JS or generic container hosts.

**Separate browser-local drafts:** A13 prohibits production-note fixture leakage; A7 guarantees local draft preservation until confirmed save/manual discard. Browser private/incognito storage or device eviction can erase drafts regardless of encryption. Adding a browser encryption key may break offline recovery or background save unless a separate UX/custody decision is approved; **A17 does not change frozen Note editor/Typora export or promise browser-draft end-to-end confidentiality**.

## 4. Key custody, least-privilege access and rotation states

**Future key registry (only an abstract access policy):** `purpose`, `environment`, `ownerScope`, `keyId`, `version`, `state`, `createdAt`, `approvedRole`, `wrap/unwrap policy`, `referencesByBackupAndRecord`, `lastVerifiedRecoverability`, and `auditProvenance`; registry is **not** a source of plaintext key bytes. The Key Management Service, HSM, protected host environment, hardware or offline escrow mechanism remains UNSELECTED.

| State | Permitted action | STOP / retirement condition |
| --- | --- | --- |
| **PROPOSED / PENDING_APPROVAL** | Record design/reason and cryptographic usage policy | No generation, import, registration or provider access from A17 |
| **ACTIVE_FOR_NEW_ENCRYPTION** | Later authorized server role may wrap/unwrap and encrypt with approved suite, bounded scope and environment | If compromise/nonce collision/unknown key owner, halt new encryption immediately |
| **DECRYPT_ONLY / RETIRING** | Read old confirmed records and retained snapshots during a verified dual-read migration | Never use old key for new encryptions; no revocation until every intended retained object and backup restore path is verified |
| **COMPROMISED / QUARANTINED** | Contain, restrict decrypt/unwrap, preserve safe evidence, plan key replacement and exposure response | Must not silently treat rewrapping as erasing previously stolen plaintext or copies |
| **REVOKED_FOR_ENCRYPTION / ARCHIVED_FOR_RECOVERY** | Allow strictly controlled recovery-only access where independently approved and secure; not general app read | Conflicting compromise or retention need must be resolved by separate Design decision |
| **DESTROYED / UNAVAILABLE** | No use possible; record **key material unavailability**, not success | Declare affected data/snapshot `UNRECOVERABLE` if no authorized independent copy/key exists; no “magic recovery” from password reset |

**Rotation/rekey/rewrap algorithm — approved plan only, NOT EXECUTED:**
1. Authorize **exact key domain**, purpose, owner, environment, reason (routine/suspicion/confirmed compromise), affected dataset, snapshots and operations, key custody, isolation and rollback. Separate storage/app/QA execution approval; identify already lost keys up front.
2. Establish an independently protected **consistent** checkpoint under A6/A7, including schema IDs, key versions, source-history and anti-resurrection witnesses, verified access to **all** necessary old and new key material. If consistent snapshot unavailable, **STOP**; do not let rekey hide a concurrent WebDAV race.
3. Create a newly approved version in future credential custody (not GitHub); for **KEK rotation**, authenticated *rewrap* of each DEK may avoid rewriting data ciphertext, but does not eliminate a compromised DEK or already exposed plaintext; for **DEK rotation**, decrypt+reencrypt with unique nonce and authenticated AAD under authorized atomic version/CAS and new key. Record per-object progress with crash-safe checkpoint and honest `UNKNOWN` outcomes.
4. Support bounded **dual-read** of confirmed old+new key versions only while protected by explicit access policy; new encryptions use the approved active version. Avoid race with device write, Quote+SourceHistory update, Project deletion, backup creation and restoring old snapshots; preserve original A5 `operationId`/rev.
5. Verify cryptographic authentication and logical content equivalence (five Markdown fields byte-for-byte, canonical paper identity, Quote excerpt/comment + provenance, per-Project Important, tombstones) against **the same confirmed snapshots**. Check backup manifest coverage and whether older backups still require prior keys. A hash alone cannot establish current cross-object consistency.
6. Test isolated recovery (fake data), key-loss/old-key-offline negative conditions, rollback/cutover, and exact SHA under independent QA. Retire/destroy old material **only after separately approved** expiry/retention, complete reference inventory, recovered backup validation and anti-resurrection proof; any unresolved UNKNOWN or stale replica key ⇒ **BLOCK**.
7. If suspected compromise, rotate/disable secrets appropriate to scope but **report exposure**. Rekeyed new ciphertext cannot retroactively hide stolen old backup ciphertext together with stolen old keys. Distinguish breach containment from cryptographic erasure.

**Do not set numeric cryptoperiods, algorithm parameters, key-copy counts, KMS costs or rotation intervals** without a future decision and actual crypto/runtime provider evidence. Automatic key rotation, rewrap jobs and key destruction are NOT authorized.

## 5. Independent encrypted backup design and restore/recovery boundaries

**Backup separation goals:**
- A backup may include **only website-owned confirmed** records and protected minimal deletion markers after A6/A7 consistency tests; no Zotero PDFs/annotations, unrelated user exports, raw Session secrets or long-lived upstream Zotero/WebDAV passwords by default. Restore of identity/session/credential metadata needs its own separate security decision, not a hidden component of generic corpus backup.
- **Independent BACKUP-KEK custody** must make a retained backup restorable **even if the live DATA-KEK/Session/MFA credential is rotated or unavailable**, under future separately approved recovery proofs. Independent recovery ≠ an unrestricted public “forgot password, download all Notes” bypass. It requires strong Owner authorization and A16 step-up/recovery protection plus multi-role or offline escrow when explicitly selected.
- **Portable protected archive:** versioned schema, owner/namespace binding, authenticated encrypted payloads and manifest, key-wrapping metadata for the recipient/recovery authority, canonical IDs, record revisions/counts/reference closure, source history, snapshot witness, expiry/tombstone policy and verified integrity. The future exact archive format/recipient keys/escrow remains undecided; a plaintext Typora single-note export from frozen UI is not a system encrypted backup.
- **A backup key without ciphertext / ciphertext without any recoverable key is not a restorable backup.** Verify read/unwrap/AEAD against isolated synthetic destination, logical field bytes and provenance, and collect independent evidence. Live API account recovery and backup-key recovery are deliberately **separate powers**; deleting an identity Session must not erase a recoverable backup by accident.
- **Old snapshot and delete-marker safety:** an old valid encrypted Project may be logically deleted now. Encrypted archive integrity does not make restoration of that object safe. Compare a **trusted newest deletion ledger/checkpoint** not under sole rollback-able backup control, enforce marker coverage and owner/namespace/revision fence, and fail closed if consistency/marker provenance cannot be verified. Marker is conditional A7 design, not a currently durable implemented tombstone.
- **WebDAV reality check:** separate PUTs for ciphertext+manifest+key-version metadata+deletion marker are **not an atomic transaction**; successful encrypted PUT does not prove CAS, crash-safe backup snapshot, authenticated manifest commit, cross-process idempotency or restore cutover. If active/backup capabilities cannot meet A5/A6/A7 invariants, STOP and request D007 storage amendment rather than silently inventing a database or assuming Nutstore semantics.
- **Restore proposal (NOT RUN):** authorize disposable fake dataset, verify trusted checkpoint and owner/namespace/backup key, decrypt to isolated staging memory/destination only after full integrity/consistency checks, map and inspect exact logical records and anti-resurrection, simulate restore commit with separately proven fence/atomic cutover, never overwrite last confirmed active dataset when proof absent. Real backup restores, key escrow disclosure and production cutover require distinct user approvals.
- **Recovery states:** `BACKUP_UNVERIFIED`, `KEY_UNAVAILABLE`, `AUTHENTICATION_FAILED`, `MANIFEST_INCOMPLETE`, `SNAPSHOT_INCONSISTENT`, `RESTORE_BLOCKED_STALE_DELETION_STATE`, `UNRECOVERABLE`, `RESTORE_CERTIFIED_SYNTHETIC`, and only later evidence-backed `RESTORE_CERTIFIED_PROVIDER`. These are distinct from API write `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN`. No false green recovery state after a decrypt-only smoke test.
- **Retention not invented:** no days/number of backup versions or destroyed-key clock chosen. Key lifetime must account for *all retained backups and user export copies*, including revocation inability outside the website. Cryptographic erasure requires evidence all decrypting key copies and accessible plaintext/ciphertext pathways are controlled; no such evidence exists.

**Failure handling:** missing key/manifest, unauthenticated record, unknown snapshot atomics or deletion checkpoint ⇒ **STOP active restore**; preserve last-confirmed data and any unsynced browser drafts, limit access to safe read-only, do not auto-reencrypt, regenerate an encryption key as if identical, bulk-delete or send an UNKNOWN write again.

## 6. Threat model and privacy boundaries

| Threat / failed assumption | Boundary and required fail-safe action |
| --- | --- |
| Compromised storage provider / stolen WebDAV files | Ciphertext may protect contents **only while KEK/DEK absent from provider**, with authenticated metadata and approved suite. Directory structure/size/timing may leak even when content is encrypted |
| Compromised API process / log exporter | Server-side decryption enables plaintext exposure; no E2EE claims. STOP, isolate runtime, rotate scoped keys where possible, assess past decrypt/log access and prevent new writes |
| CI/QA secret exfiltration or cross-environment key collision | A13 separate secret references and environments; Local/QA must not call real vault or provider or decrypt Production data; redact artifacts and build/source maps |
| Nonce reuse, key/algorithm downgrade or AAD substitution | Reject wrong key/version/tenant/owner/type/revision, replayed nonce or malformed AEAD; block instead of showing an empty object or attempting fallback insecure crypto |
| Incomplete/corrupted backup or forged manifest | Require authenticated manifest+record integrity, reference closure, trusted consistent snapshot and negative tests; checksum file list alone not a proof |
| Encrypted old-backup rollback and deleted Project resurrection | Require independent monotonic deletion/checkpoint witness; no restore/cutover if marker provenance unavailable; encryption alone not anti-rollback |
| Lost DATA-KEK, BACKUP-KEK or all escrow shares | Declare affected records/backups `KEY_UNAVAILABLE/UNRECOVERABLE` when no trusted independent recovery; credential reset or MFA step-up cannot recreate a missing random key |
| Backup key or recovery-proof leak | Treat as P0 for confidentiality/takeover risk, contain key use, block unsafe restore/export and implement independently authorized rekey/notification; cannot rescind already leaked plaintext |
| Untrusted browser / stolen device | Authorized edit reveals Note plaintext in browser and device caches; Host-only Session, CSRF and API encryption do not protect against all device malware; no guarantee local draft survives device loss |
| Forged “save succeeded” during encryption/rotation | A5 durable operation identity and CAS remain mandatory; timeout after dispatch `UNKNOWN`, no blind replay or duplicate destructive action |
| Operational key erasure used as account-delete shortcut | A7 legal/privacy, backup copy and retention policy, frozen delete scope, protected exports and A16 consent apply; never delete all DEKs for Project-only delete |

**Security incident classes:** **P0 immediate STOP** on actual key leak, cross-owner decrypt, forbidden PDF/annotation copy, nonce/key reuse detected, false Saved/Deleted, confirmed data loss, unauthorized decrypt/export or restoring deleted Project. **P1 BLOCK** on unverifiable key custody/version, non-atomic recovery protocol, missing usable backup key, untested rewrap/rollback, unreconciled UNKNOWN or irrecoverable single-point-of-failure key design. **P2 REVIEW** for minor documentation/performance/audit gaps with no confidentiality/integrity consequences. A11 handles incident containment and design-controlled resumption.

## 7. Minimal key-use audit, no secret material

**Only future separately authorized coarse events:** UTC timestamp, environment, synthetic/proven system stage, key **purpose** and non-sensitive version alias (not raw secret), operation class `WRAP/UNWRAP/DECRYPT/ROTATE/REVOKE/RESTORE_ATTEMPT`, protected pseudonymous actor, test fixture or trusted backup checkpoint reference, result classification, build SHA, broad failure reason and independent QA/Design decision. **Do not include** raw key bytes, derived password, passkey credential secret, OTP/recovery code, Session ID, CSRF token, external WebDAV/Zotero password, Note/Quote text, paper title, PDF/annotation, unredacted AAD identifying data, cloud KMS response or backup plaintext.

Server authorization to unwrap a key is not the same as permission to delete, decrypt every record, issue new Owner access or promote a restore. Log access and retention still require A7/A11 approvals; no telemetry service/retention days specified. **An audit record cannot prove a mutation committed or that a snapshot is durable/complete**.

## 8. Independent synthetic QA plan — 22 design-only cases, ALL NOT RUN

| ID | Later separately approved tests and required negative result |
| --- | --- |
| **A17-01** | Distinct Authn/Session/CSRF/Intent/DATA-KEK/DATA-DEK/BACKUP-KEK/BACKUP-DEK/external credential purposes; fake cross-use rejected |
| **A17-02** | Local Synthetic / Independent QA key references cannot resolve Production keys or decrypt any production fixture |
| **A17-03** | Vetted AEAD synthetic round trip verifies five-field Markdown exact bytes, Unicode/LaTeX, Key Quote excerpt/comment/SourceHistory and per-Project Important |
| **A17-04** | Tamper ciphertext/tag/AAD owner/environment/type/entity/revision ⇒ authenticated failure, no empty Note or unauthorized fallback |
| **A17-05** | Nonce/IV uniqueness under synthetic concurrent process/retry/crash schedule, suite downgrade and nonce reuse rejected |
| **A17-06** | Stale encrypted record with valid tag cannot replace a confirmed newer revision; storage CAS independently checked |
| **A17-07** | Stolen ciphertext/manifest and public key IDs alone reveal no protected plaintext in approved synthetic test assumptions; metadata/size leakage documented |
| **A17-08** | Server-side secure unwrap role and resource authZ; foreign Principal / read-only Workspace cannot decrypt other data or access key custody |
| **A17-09** | DATA-KEK rewrap retains same DEK/ciphertext if specified; old-key retirement blocked while still referenced |
| **A17-10** | DATA-DEK re-encrypt uses new unique nonce/version and preserves 100% confirmed logical records; interrupted job remains resumable/UNKNOWN |
| **A17-11** | Simulated key compromise revocation/report distinguishes security containment from prior ciphertext/plaintext leak; old backups audited |
| **A17-12** | Rotation during two-client concurrent Note Save / Quote SourceHistory Relink preserves CAS, no double history and truthful UNKNOWN |
| **A17-13** | Password/Session/Passkey rotation does not alter confirmed Note encryption or silently make independent backup keys unusable |
| **A17-14** | Separate BACKUP key enables approved synthetic isolated restore after live DATA key loss only when designed independent escrow actually proved |
| **A17-15** | Simulated loss of **both** data and backup recovery material ⇒ KEY_UNAVAILABLE/UNRECOVERABLE, no fabricated master-recovery |
| **A17-16** | Forged/plaintext/truncated manifest, record omission, wrong owner/namespace and wrong key version ⇒ RESTORE BLOCKED |
| **A17-17** | Old encrypted backup containing deleted Project fails anti-resurrection when trusted newest tombstone/checkpoint unavailable |
| **A17-18** | Simulated WebDAV crash between ciphertext, manifest and marker PUTs cannot claim atomic snapshot or safe cutover |
| **A17-19** | Typora Saved/Local Draft single-note plaintext export remains frozen behavior, no silent PDF inclusion or format change |
| **A17-20** | Browser unsynced drafts after logout/MFA/reset/rotation/offline UNKNOWN never silently discarded or falsely marked encrypted/confirmed |
| **A17-21** | Secrets/key plaintext absent from mock logs, build artifacts, QA screenshots, headers, URLs, backups and PR scope scan; safe synthetic key refs only |
| **A17-22** | Independent QA pins exact full SHA, fixture hash, crypto suite/profile/provenance, command/exits and P0/P1/P2; POC-001 REMEDIATION-02/Frozen UI hashes unchanged and no real provider contacted |

**Evidence maturity:** `DESIGN_ONLY` → later authorized `SYNTHETIC_LOCAL_OBSERVED` → `INDEPENDENT_QA_ACCEPTED_FOR_EXACT_SHA` → separately approved `PROVIDER_OBSERVED` → Design release decision, **never automatic promotion**. Algorithm/library and implementation mode must be specified before any executable crypto tests; a mock test does not establish actual key isolation, secure erase, hardware custody, backup RPO/RTO, real storage CAS, or mobile/browser interoperability. These **22 proposed A17 scenarios are NOT RUN** and do not alter Module 002's 26 frozen U6 tests or existing POC-001 QA obligations.

## 9. External security references and deferred implementation choices

Public design references (consulted 2026-11-23; not proof of system compliance):
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) — use vetted authenticated cryptography, unique IV/nonce, key lifetime and correct data boundary.
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) — key purpose/custody separation, rotation, compromise recovery and bounded cryptographic-erasure claims.
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — distinct secret storage, env-specific access and envelope-encryption custody.
- [NIST SP 800-57 Part 1 Rev. 5 — Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) — key inventory, operational and recovery key material, archive and compromise recovery.
- [OWASP Authentication/Session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — no reusing Session privileges as storage decryption authorization.

**Future decisions:** crypto primitive and validated library; deployment key ownership/KMS/HSM/escrow model; whether/how browser-local drafts use client-held encryption; per-object/per-owner DEK granularity; exact backup/manifest format, trusted monotonic witness and retention; measurable recovery objectives; key recovery proof and independent operator access; physical storage/provider reliability, including Nutstore CAS/PROPFIND/real ETag; compliance/legal data-region/notification and cost. No actual keys, credentials or accounts have been created.

## 10. Next independently scoped design decision

**D007-A18 candidate — Software supply-chain and build-artifact integrity governance:** dependency provenance, vetted license/OSS reuse, lockfile integrity, SBOM, patch/vulnerability response, CI secret permission constraints, isolated/reproducible builds and release provenance, exact SHA/build digest and independent QA/STOP. This is **design-only**, may be considered separately without selecting CI/provider, adding workflow/dependencies, touching POC-001 code or authorizing a deployment.

**FINAL DISPOSITION: D007-A17 OPTION B APPROVED AS PROVIDER-NEUTRAL DATA/BACKUP ENCRYPTION AND KEY-LIFECYCLE DESIGN ONLY; 22 A17 TESTS NOT RUN; KEY ESCROW/RESTORE NOT PROVEN; NO KEYS, REAL DATA, CODE, TESTS, CLOUD ACCOUNT, MERGE, ACCESS-02 OR DEPLOYMENT.**
