# D007-A36 — Q1e L1-vs-L3 Future Independent QA and Synthetic Feasibility Gate Matrix

**DESIGN ONLY / ALL TESTS NOT_RUN / NO G1 AUTHORIZED.** Governing [A36 feasibility protocol](D007_A36_Q1E_LOCAL_FEASIBILITY_DESIGN.md), [A34 Q1e record/manifest/restore design](D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md), [A34 Q1E-01..20](D007_A34_Q1E_TRACEABILITY_QA_MATRIX.md), [A35 L0–L3 comparison](D007_A35_Q1E_STORAGE_STRATEGY_DISPOSITION.md), [A35 F01..F18](D007_A35_Q1E_OPTION_DECISION_MATRIX.md). A6/A7/A11/A17 and A5 mutation outcomes remain authoritative. **Current: L3 preferred reference UNPROVEN, L1 conditional UNPROVEN, Q1e UNSUPPORTED_COMPLETENESS, no implemented catalog, no live backup, OVERALL POC-001 BLOCKED_REAL_SERVICE.**

## A. Reproducible fixture and evidence schema (future only)

**Independent oracle F0:** predeclared test-only complete graph not reconstructed from the system-under-test listing; includes two owners, deliberate Zotero library-scope collision for itemKey, two Projects with only one confirmed deleted, 3+ associations and per-project Important, shared globally scoped whole five-field Markdown Note and ReadingStatus, KeyQuote Relink and confirmed history, an unconfirmed local draft excluded, concurrent writers, one UNKNOWN outcome, synthetic deletion checkpoint. Fixture digest canonicalized **only after** a future separately approved byte profile; do not silently claim A34 already approved a JSON canonicalization algorithm.

**Independent inputs and logs:** expected ID/revision graph, steps/fault barriers, original and final opaque commit/epoch IDs, owner/scope, exact snapshot cut, writer activity, callback response, operation state, request/transaction log, negative side effects, key/manifest status, previous and latest monotonic witness, restore stage and active store diff. QA independently authors at least one blind omission and stale archive, plus one wrong-reason mutant per critical stage. Report exact SHA, hashes, exit status and measuring environment. No real users, credentials, provider, PDF or personal research.

**Four explicit verdict levels:**
- `DESIGN_DEFINED/NOT_RUN` **CURRENT**: proposed oracle only, no G1 or test.
- `INDEPENDENT_SYNTHETIC_PASS_CANDIDATE` only after future scoped Execution G2 + separate-window G3, observed expected non-violations and *adversarial fail-closed* evidence; Design G4 still pending.
- `PARTIAL/UNSUPPORTED` when a dependency cannot be proven even with valid fixture (e.g., real DAV linearizability, independent anti-rollback trust), or only known-fixture enumeration is demonstrated.
- `FAIL/STOP` when wrong-side effect, false terminal mutation, fabricated backup certificate, leaked/cross-owner data, stale writer commit or resurrection is demonstrated.

## B. Cross-route mandatory cases — A36-C01..C12 (ALL NOT_RUN)

| Case | Future controlled injection/control | Exact pass oracle / mandatory fail |
| --- | --- | --- |
| **A36-C01** | Authorized complete fake ID catalog vs successful syntactically valid 207 with **known omitted ID** | detect missing ID, stop certificate; no partial 200 or count proof derived from malformedly incomplete listing |
| **A36-C02** | Unknown ID absent from both raw listing and self-derived catalog | demonstrate lack of independent oracle ⇒ `UNSUPPORTED_COMPLETENESS`, never a success claim |
| **A36-C03** | Duplicate normalized IDs, foreign owner, same Zotero itemKey in different library scopes and dangling Associations | no cross-owner/cross-library collision, correct canonical compound key, orphan rejects |
| **A36-C04** | Concurrent whole-Note 5-field CAS/ReadingStatus and ProjectAssociation updates | one valid confirmed revision graph or explicit conflict, no fieldwise partial and no silent lost update |
| **A36-C05** | Concurrent Quote Relink + SourceHistory append and Project deletion + own Associations/Important | paired mutations committed together (or neither), global Note/Quote/Paper retained |
| **A36-C06** | Crash before write commit, after write commit before ACK, lost network ACK, restart | every result accurately maps to durable operation evidence; if ambiguous `UNKNOWN`, no blind replay/false failure |
| **A36-C07** | Interleaved export GETs and second writer revisions | every included ID/revision from one committed cut, no cross-object mixed snapshot or certified incomplete bundle |
| **A36-C08** | Valid signed/hash-consistent old backup, fake store rolled back while external latest deletion witness remains newer | old Project must not resurrect, `RESTORE_BLOCKED_STALE_DELETION_STATE`; global Note/Quote unaffected |
| **A36-C09** | Latest witness missing/rolled back alongside archive, or witness not independent of archive | `DELETION_WITNESS_UNVERIFIABLE`/STOP; never self-certify staleness check |
| **A36-C10** | Backup manifest tampered/recomputed plain checksum, owner/key/AAD mismatch, key-loss | reject authentication/missing independent backup key; SHA alone not authentication, no manufactured key |
| **A36-C11** | Fresh isolated staging of exact UTF-8 5-field Note/Quote history then inject half-restore, foreign owner, path traversal, bad schema | active original unchanged, staging fails, no live cutover; byte-for-byte verified data only if uncorrupted |
| **A36-C12** | Scope/secret scan, original POC/R09 branch/CI/UI invariants, unauthorized outbound socket trap | zero forbidden writes, no real credentials/PDF, fail/STOP on any unapproved file/egress |

## C. L3 authoritative transaction-specific cases — A36-T01..T07 (ALL NOT_RUN)

| Case | Adversarial schedule | PASS condition; otherwise STOP |
| --- | --- | --- |
| **A36-T01** | One logical transaction creates confirmed website record+catalog ID+revision+checkpoint, process kill at every precommit step | uncommitted graph invisible, no partial manifest, exact post-commit identity |
| **A36-T02** | Crash after durable commit but before response/ACK; attempt same operationId with different fingerprint | authoritative operation witness prevents false terminalization/duplicate writes, conflict or UNKNOWN safe |
| **A36-T03** | Concurrent Project delete / Quote Relink / Note update causing write skew or referential race | isolation/constraints produce serial-equivalent valid history or abort, no lost global Note/Quote |
| **A36-T04** | Read snapshot pinned at commit K; writer commits K+1 during export | export matches exactly K ID/revision graph, no mixed Note/SourceHistory/Project version |
| **A36-T05** | Full engine rollback and separately retained authenticated newest deletion checkpoint | archive/current rollback rejected; no claim database-internal log alone is independent T3 |
| **A36-T06** | Vary transaction isolation/fault priority; cross-object constraint conflict and failed SERIALIZABLE commit where supported | original operation not falsely retried after ambiguous ACK; abort/conditional new intent distinguished from blind replay |
| **A36-T07** | External manifest/key write fails after internal successful transaction | internal data remains intact, backup `NOT_RESTORE_CERTIFIED` and no unsupported cross-store atomicity claim |

## D. L1 DAV single-writer/fenced log-specific cases — A36-L01..L09 (ALL NOT_RUN)

| Case | Adversarial schedule | PASS condition; otherwise STOP |
| --- | --- | --- |
| **A36-L01** | Two fake API instances share one scope; writer epoch 1 expired then writer epoch 2 begins | all later epoch-1 authoritative commits rejected, not only by a local process mutex |
| **A36-L02** | Old writer delays network PUT/ACK past fencing rollover and sends it later | no accepted stale commit or head reversion; if storage lacks true fence, `L1_UNQUALIFIED` |
| **A36-L03** | Crash between immutable record payload publish and log intent/commit publish | orphan payload never certified/visible as committed; catalog remains complete |
| **A36-L04** | Crash after intent but before authoritative commit/head publish or after committed head before ACK | no partial confirmed object; operation UNKNOWN until authenticated durable commit identity can reconcile |
| **A36-L05** | Well-formed DAV 207 listing omits a committed catalog member | committed independent ID-list detects discrepancy; no exported certified partial bundle |
| **A36-L06** | Two readers pin committed K while writer publishes K+1 and deletes unreferenced objects | K reads immutable versioned objects intact, safe no GC of referenced versions |
| **A36-L07** | Out-of-band writer not subject to app mutex changes DAV object/log/catalog | prevented by verified server boundary or reliably detected + fail-closed, otherwise L1 remains UNSUPPORTED for certified backup |
| **A36-L08** | Lease expires/restarts twice; delayed delete marker/old archive rollback and log compaction | monotonic deletion state and authenticated commit ordering preserved; no rollback/resurrection or unsafe eviction |
| **A36-L09** | Ideal CAS mock succeeds but simulated provider gives ambiguous/incorrect ETag, non-atomic rename or delayed consistency | class `MOCK_ONLY / PROVIDER_DEPENDENT_NOT_PROVEN`; do not treat mock pass as WebDAV provider certification |

## E. Deletion/high-watermark, backup and restore cases — A36-R01..R07 (ALL NOT_RUN)

| Case | Independent logical trust boundary attack | Acceptance / STOP |
| --- | --- | --- |
| **A36-R01** | Old authentically signed archive includes Project deleted at newer checkpoint | outside-archive T3 witness blocks Project restore and preserves shared global records |
| **A36-R02** | Remove/tamper newest T3 witness, replay older T3 or replay both T1/T2 and T3 | unavailable trust => STOP, no false rollback resistance |
| **A36-R03** | Crash between confirmed deletion and protected witness advancement in either order | no `CONFIRMED`/`RESTORE_CERTIFIED` without coherent ordering/reconciliation; orphan intent quarantined |
| **A36-R04** | Compare scoped catalog/manifest count and canonical UTF-8 Note/KeyQuote SourceHistory bytes during stage restore | exact identities+links+hashes+revisions restored in fresh namespace or fail without touching active state |
| **A36-R05** | Wrong backup-key version, lost BACKUP-KEK/DEK, wrong owner/AAD, valid but stale manifest | KEY_UNAVAILABLE/UNRECOVERABLE or stale STOP; do not regenerate key from password reset |
| **A36-R06** | Crash staging half-way, concurrent restore and invalid cutover or fallback to partial object copy | safe staging failure, no active writes; live cutover requires distinct future authorization |
| **A36-R07** | Privacy/retention conflict: old backup retains confirmed deletion state after requested privacy erasure | no invented retention days or auto-erase policy; `POLICY_DECISION_PENDING`/STOP until user/Design decides |

## F. Acceptance accounting and cross-references

**Mandatory proposed total = 35 cases:** 12 common (C01..12), 7 L3 (T01..07), 9 L1 (L01..09), 7 recovery (R01..07). A future **L3-only** scoped trial needs C01..12 + T01..07 + R01..07 (**26 cases**); **L1-only** needs C01..12 + L01..09 + R01..07 (**28 cases**); true **head-to-head** needs all **35 cases**, with paired independent evidence where the case applies to both routes. The values are **test-design counts, not run counts or a claim of passed cases**, and may change only after another Design-approved scoped G1 revision. Complement A34's 20 and A35's 18 prior proposed cases; do not double-count an overlap as two executed trials.

**Evidence columns required for each case:** `case_id`; `route`; `fixture_digest`; `independent_oracle`; `fault_barrier`; `expected_operation_status`; `expected_commit_and_snapshot`; `observed_actual_requests_or_transactions`; `expected/actual deletion_checkpoint`; `negative_mutant_killed_for_reason`; `actual_exit_and_timing`; `recorded_NOT_RUN`; `QA_author_and_direct_PR_link`; `final_SHA`; `risk_disposition_recommendation`. All are **UNFILLED** by A36.

**Severity/STOP:** forged CONFIRMED/Deleted/Restore success, cross-owner corruption, leaked secrets/PDF, resurrected deletion, unauthorized writes/real provider calls => P0/P1 STOP pending Design; a meaningful isolated test assertion gap => P2/PARTIAL; unavailable source-of-truth/witness or unsupported physical storage property => `UNSUPPORTED/PARTIAL` (never substitute ideal mock); environment/tooling failure => `NOT_RUN`. QA is separately user-opened, independent from Execution, uses fresh clone of exact SHA and own failure fixtures, posts direct GitHub PR QA comment; Execution relays original. Only Design may accept G4 or close Q1e/risk.

## G. Future G1 submission shape — UNFILLED and NOT AUTHORIZED

Before any test/implementation, user must separately approve: single vs both routes; a **new** branch and exact base SHA, narrow allowed paths, location for synthetic-only data/fixtures, dependency/license constraints, HTTP egress denial, resource bounds, CI restrictions, secrets/key exclusions, list of required cases with documented deterministic fault barriers, expected stop/pending artifacts, and formal Execution→separately opened QA→Design G3/G4 workflow. **No default branch/base/whitelist is selected by A36**, and this plan is **not** permission to alter PR #2 / R09, old tests, Access Policy, frozen Module 002 UI, package/CI or to contact Nutstore. Any needed scope change returns to Design.

**Gate summary:** `A36 DESIGN_APPROVED, ALL 35 TEST CASES NOT_RUN; NO Q1e G1; Q1e UNSUPPORTED_COMPLETENESS; L3 preferred study but not certified, L1 conditional, BACKUP_NOT_RESTORE_CERTIFIED; G5 NOT_AUTHORIZED / G6 ACCESS-02 BLOCKED / G7 NOT_AUTHORIZED / OVERALL POC-001 BLOCKED_REAL_SERVICE`.