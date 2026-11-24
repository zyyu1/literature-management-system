# D007-A35 — Q1e Storage Strategy Options, Decision Evidence and Future QA Matrix

**TYPE: TECHNICAL DESIGN / RELATIVE ENGINEERING ASSESSMENT / NO G1 / ALL TESTS NOT_RUN.** Normative [A35 strategy decision](D007_A35_Q1E_STORAGE_STRATEGY_DISPOSITION.md), [A34 Q1e proof contract](D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md), [A34 synthetic Q1E-01..20 matrix](D007_A34_Q1E_TRACEABILITY_QA_MATRIX.md). This complements, not replaces, [A6](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A11](D007_A11_OPERATIONS_RUNBOOK.md), [A17](D007_A17_KEY_HIERARCHY_BACKUP_ENCRYPTION.md), and [A32 R09](D007_A32_POC001_R09_MINIMAL_G1_AUTHORIZATION.md). No real provider, keys, code, frozen UI, CI or implementation authority. **Q1e UNSUPPORTED_COMPLETENESS / OVERALL POC-001 BLOCKED_REAL_SERVICE.**

## 1. Comparison inputs and confidence disclosure

| Dimension | Required proof | External evidence type | Unsatisfied risk |
| --- | --- | --- | --- |
| Complete confirmed inventory | All committed opaque IDs, global one-per-paper Notes, scoped Zotero identities, associations, confirmed deletions | Storage-neutral design constraint A6/A34; no observed physical engine | Incomplete DAV 207 may omit unknown record |
| Multi-object point-in-time snapshot | One authoritative checkpoint/revision graph; consistent note/association/quote/history | SQL snapshot capability examples from official engine documentation, NOT current project tests | Mixed versions, non-atomic DAV files |
| Durable mutation outcome | Crash/late ACK outcome under verified commit and operation identity | A5/A11 design constraint, current R09 local proof is separate | False CONFIRMED or bad UNKNOWN retry |
| Deletion freshness and rollback | Monotonic newest witnessed delete state outside old archive rollback | A7/A17/A34 design constraint; not supplied by SQL automatically | Restored Project resurrects while Note remains global |
| Backup authenticity and key recovery | Protected manifest and independently recoverable BACKUP-KEK/DEK, key-loss negatives | A17 design; no keys selected | A hash-authentic old archive may still be stale |
| Isolated restore/cutover | Full synthetic restored graph, rollback and protected active namespace | A6/A11/A34; all Q1E scenarios NOT_RUN | Partial PUT-loop advertised as complete |

**Confidence:** L0's inadequacy follows from the existing independent Q1e omission counterexample; L1/L2/L3 benefits and cost rankings are **engineering inference**, not experimentally proven. External WebDAV RFC/SQLite/PostgreSQL docs confirm only the cited single-product capabilities in their documented conditions, NOT Nutstore or this POC. No inferred pricing, capacity, SLO or vendor endorsement.

## 2. Option-specific hard requirement and exit decision

| Option | Minimal credible implementation requirements before claiming I/S | Reuse / new work | Disqualifying failpoint |
| --- | --- | --- | --- |
| `L0 DAV listing+manifest` | Impossible to prove arbitrary unknown omissions without independent oracle; no transaction | Reuse HTTP/WebDAV adapter, parser, fixture tests | Valid 207 silently missing unknown ID remains invisible ⇒ no certified export |
| `L1 DAV single-writer fenced immutable log` | Durable scope-wide writer token, authoritative append-only commit with atomic publish, readers pin committed checkpoint, no stale writer/hidden out-of-band mutation; independently protected witness | Reuse POC WebDAV negative fixtures/ETag tests; build fenced log, owner catalog, crash recovery, compaction and backup proof | Process restart/lease expiry/delayed old writer or split catalog/object commit causes false confirmation |
| `L2 transactional catalog + immutable blobs` | Trusted catalog transaction with complete IDs/links/tombstones, immutable versioned blob write+verified read before transactional pointer publish, safe orphan/GC, consistent backup across stores | Reuse POC blob adapter; new transactional catalog, cross-store staging/GC and recovery | Catalog points to absent/overwritten blob; GC deletes referenced version; two-store backup inconsistent |
| `L3 single transactional authority (preferred reference)` | One transaction commits website-owned content+catalog+relationships+operation witness+confirmed tombstone; snapshot isolation/appropriate serialization, separate rollback witness and backup key | New persistence adapter/migration, reuse A6 schema/API/R08-R09 race tests; backend/engine TBD | A multi-record transaction/serializability anomaly, invalid snapshot, whole-store rollback, missing independent deletion witness |

## 3. Future differentiating synthetic QA (A35-F01..F18; ALL NOT_RUN)

| ID | Cross-cutting adversarial test / pass-or-stop oracle |
| --- | --- |
| A35-F01 | Independent fixture inventory vs incomplete valid 207, known record missing; L0 must explicitly fail completeness certification |
| A35-F02 | Unknown record omitted from both listing and self-derived manifest; demonstrate impossibility without independently authoritative catalog, no invented oracle |
| A35-F03 | Two simultaneous owners/scopes and Zotero itemKey reused in distinct libraries; no cross-owner or cross-library canonical collision |
| A35-F04 | Two writers concurrently update one 5-field Note and shared 3-state ReadingStatus; revisions/CAS preserve confirmed aggregate and conflict |
| A35-F05 | Project permanent delete plus exactly its Associations/Important, no deletion of global Note/Quote; crash between constituent writes must be atomic or not CONFIRMED |
| A35-F06 | Quote Relink active source and confirmed SourceHistory append crash/interleave; cannot half-commit or duplicate event |
| A35-F07 | Writer crash after immutable payload but before catalog log commit; uncommitted payload invisible, no false complete inventory or unsafe GC |
| A35-F08 | Writer crash after catalog commit but before ACK, then restart; authoritative operationId/commit yields UNKNOWN pending/reconcile, never blind duplicate writes |
| A35-F09 | L1 expired lock, delayed old writer, two API instances, out-of-band DAV writer; stale writer denied at storage commit/witness or L1 not qualified |
| A35-F10 | L2 catalog points at blob deleted/corrupted/unavailable; EXPORT_INCOMPLETE and safe read refusal, no phantom backed-up entry |
| A35-F11 | L2 orphan blob and rollback/GC race; must never erase a referenced immutable version or consume unbounded cleanup without budget |
| A35-F12 | L3 read-only snapshot during Note/Association/Quote writes; consistent snapshot ID and no cross-record version mixing |
| A35-F13 | L3 isolation anomaly/write skew under concurrent Project delete and Relink; choose adequate constraints/isolation, not default READ COMMITTED assumption |
| A35-F14 | Full store+backup rolled back to a previously valid signature; **independent** monotonic latest deletion/high-watermark witness blocks old Project resurrection |
| A35-F15 | Authenticated encrypted backup manifest + separate backup key; lost DATA key/Session may allow approved recovery, lost BACKUP key ⇒ KEY_UNAVAILABLE |
| A35-F16 | Isolated full restore of exact 5 Markdown fields/UTF-8/LaTeX and canonical identities, counts, parent closure, Quote/source history; absent record/foreign owner stops |
| A35-F17 | Crash during staging and later cutover; no active namespace partial changes; RPO/RTO and rollback only with separately proven fenced/swap operation |
| A35-F18 | Exact immutable SHA, fresh separate QA window, own fault/negative mutants and GitHub QA comment, independent Design G4; no R09/CI/UI/ACCESS modifications |

**All F01..F18 are proposed design gates, not a runnable plan or permission to modify the repo.** Any *future* QA must be coordinated by Execution under a newly user-approved precise G1 (branch/base/path/fixtures), and be independently conducted in a separate user-opened window, with exact SHA source/paths, command exits and negative reasons. Q1E-01..20 A34 original matrix still applies; A35 cases add discriminating *option* tests only.

## 4. Migration/reuse and cost due diligence (relative, no invented euro quotes)

| Axis | Preferred L3 research questions | L1 alternative research questions | STOP |
| --- | --- | --- | --- |
| Logical schema and compatibility | Preserve A6 canonical Zotero compound identity, whole Note, status, KeyQuote source history and A5 optimistic revisions | Same, ensure explicit log envelope versions/ID keys | Lossy Markdown/relational mapping or missing provenance |
| POC source reuse | Reuse synthetic WebDAV denial/CRLF/TLS/SSRF tests and API semantics, not assume present POC DAV source is new DB implementation | Reuse more DAV request adapter code, but cannot infer transaction from it | Hidden existing POC behavior changed outside new G1 |
| Resource cost | Embedded/hosted service deployment, backup, filesystem reliability, encryption and restore ops still to quantify | Request quotas, log amplification, manifest/cas writes, compaction and cleanup still to quantify | Unsupported real provider or unapproved payment/access |
| Data migration | Export only known consistent website-owned state, stage/verify, preserve old source until distinct cutover approval | Same plus log/fence version translation and crash recovery | Direct in-place rewrite, cross-library identity confusion, deletion resurrection |
| Operational fault tolerance | How to recover snapshots, backups and independent trust witness after entire data store rollback? | How to distinguish old lock owner/late commit and ensure catalog atomicity? | No durable operation/deletion witness |
| Owner trust/key | BACKUP-KEK distinct from DATA-KEK and Session, no original Zotero PDFs copied | Same | Real keys/credentials in tests or repository |
| Licensing, provider and budget | Product/license/architecture under later explicit study; no actual cloud/database selected | Real WebDAV vendor compatibility after separate G6 only | Any deployment, paid plan or live probe now |

**No production speed or price number has been measured.** “Lower/higher” engineering effort in A35 is a design estimate to compare conceptual paths. Future legal/retention, geographic region, backup count and RPO/RTO need separate user decisions.

## 5. Decision gates and current status

**Design preference:** `L3 PREFERRED_REFERENCE_CAPABILITY / PHYSICAL_STORE_UNSELECTED`. `L1 CONDITIONALLY_RETAINED`, `L2 CONDITIONALLY_RETAINED`, `L0 NOT_CERTIFIABLE`. No preflight data was generated, no transactional engine or backup tested and **not** a migration direction that Execution can act on.

- **Next design gate A36** can specify neutral feasibility criteria and a later exact-scope local test work package **only after independent approval**, with no R09 overlap.
- **A33** remains separately reserved for the R09 exact-SHA G4 upon independently completed QA; keep all A31 three P2 OPEN until then.
- **Production G5/G6/G7** remain independently not authorized: no merge, ACCESS-02 real service or deployment.
- **Overall:** `Q1e UNSUPPORTED_COMPLETENESS / BACKUP NOT_RESTORE_CERTIFIED / POC BLOCKED_REAL_SERVICE`.

## 6. Public technical sources (descriptive examples only)

- IETF WebDAV RFC4918: https://datatracker.ietf.org/doc/rfc4918/
- SQLite Isolation, WAL snapshots: https://sqlite.org/isolation.html
- SQLite Database File Format (WAL shared-memory/network filesystem caution): https://www.sqlite.org/fileformat2.html
- SQLite Online Backup: https://www.sqlite.org/backup.html
- PostgreSQL Transaction Isolation: https://www.postgresql.org/docs/18/transaction-iso.html

**Q1e design only / ALL A35-F01..18 NOT_RUN / NO G1-G4 evidence; G5/G6/G7 BLOCKED.**