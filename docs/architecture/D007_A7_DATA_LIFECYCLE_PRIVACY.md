# D007-A7 — Layered Data Lifecycle, Privacy, Deletion and Anti-Resurrection Policy

**Decision:** **D007-A7 Option B APPROVED by user on 2026-11-23 (Europe/Berlin)**.  
**Authority:** **DESIGN ONLY / NOT IMPLEMENTED OR RUNTIME VALIDATED**. Builds on [D007-A6 storage-neutral schema](D007_A6_DATA_SCHEMA_RECOVERY.md), [D007-A5 API result contract](D007_A5_API_CONTRACT.md), [D007-A4 session security](D007_A4_AUTH_SESSION_SECURITY.md) and the [frozen Module 002 UI](../ui/002/DESIGN_APPROVED.md).  
**No change to:** original approved [UI decisions and 26 planned QA scenarios](../ui/002/DESIGN_APPROVED.md), [POC-001 original execution](../handoffs/POC-001/EXECUTION_INSTRUCTION.md), [POC-001 QA-driven remediation](../handoffs/POC-001/REMEDIATION_01.md) or [ACCESS-01 policy](../handoffs/POC-001/ACCESS_POLICY.md).  
**Not authorized:** real data deletion, account connection, app/API code, cloud deployment, external storage access, new UI delete action, new production database, automatic background expiry, schema migration, or assuming WebDAV supports durable tombstones/multi-object transactions.  
**No numeric retention interval is approved here.** Numeric lifetimes and exact storage/crypto techniques require a separate user and design decision.

## 1. Immutable frozen UI semantics

The following are *already approved* and must be preserved without interpretation or UI amendment:

| Existing action | Protected behavior | Frozen reference |
| --- | --- | --- |
| **Archive Project** | Archive retains **Project identity, Project–Paper associations and per-Project Important**; archived Projects remain discoverable and can later be restored to the **same Project ID**. Archive **is not permanent deletion**. | [UI-D002](../ui/002/DESIGN_DRAFT.md), [UI-D004.4a](../ui/002/DESIGN_DRAFT.md) |
| **Restore archived Project** | Restores the same Project and membership records, with no re-imported/duplicated CanonicalPaper, Global Research Note or Zotero item. | UI-D002 / frozen Module 002 |
| **Permanently Delete Project** | After a **separate explicit confirmation naming the Project and irreversible association loss**, delete only that Project and its Project–Paper Associations, including their Important flags. **Never cascade-delete CanonicalPaper, global three-state ReadingStatus, shared ResearchNote, Key Quotes, SourceHistory, original Zotero annotations or PDFs**, even if that Project was the paper's last association. | UI-D002; UI-D004.4a |
| **Unlink — Current Project only** | Default; remove precisely the selected Project–Paper associations and associated Important; preserve all global paper/note/quote/Zotero data. | UI-D004.3b-R1 |
| **Unlink — All Projects including current** | A separate explicitly selected **all-Project scope** with stronger second confirmation and indicated affected Projects/counts, no implicit carryover of scope from another action. Delete only the associations for selected canonical papers. | UI-D004.3b-R1 |
| **Automatically retire redundant local note draft** | Allowed **only** after positively confirmed revision-guarded remote save, verified content/revision equivalence for the *specific draft snapshot*, **no newer unsynced edits** and **no unresolved conflicts**. Other drafts, Zotero records and remote notes must stay untouched. | UI-D005.1h |
| **Manually Discard Local Draft** | Target exact **paper + local draft revision** and warn about unsynced changes; display known modification time/field differences, confirmed remote version status or honest Unknown, offer **Export Local Draft**, with deliberate separate **Confirm Discard**; Cancel/Escape/export/navigation/logout never delete it. Recheck version before deletion. | UI-D005.1j |
| **Markdown export** | Single-paper UTF-8 Typora-compatible file with the exact five global Research Note sections, optional verified Zotero bibliographic fields, safe `<title>_<itemKey>.md` name; clear **LOCAL-DRAFT** versus **SAVED** choice and truthful save state. This export does **not** include Key Quotes, PDF bytes or annotations, and does not perform a save or grant discard consent. | UI-D005.1e/g/k |

If an individual **global ResearchNote, Key Quote, SourceHistory, CanonicalPaper, security-log entry or whole-library account data** needs an independent delete UI or API beyond the already frozen functionality, **A7 does not silently authorize it**. First make a separate **UI amendment/feature and API permission decision**, then authorize code and independent QA. A7 can set safety invariants for such potential future deletion.

## 2. Layered lifecycle/retention matrix

| Layer | Live / archive | Delete or cleanup boundary | Retention decision and privacy risk |
| --- | --- | --- | --- |
| **Project** | Active ↔ Archived is a reversible metadata state; archive preserves ID and associations | Frozen UI permits explicit **permanent** delete of Project plus associations only. Never silently reinterpret permanent delete as a recoverable trash feature | **No timer expiry chosen**; retain archived Projects until user action; post-deletion recovery of deleted Project is **not promised** |
| **ProjectPaperAssociation and Important** | Lives only while the scoped association exists; Important independent for each Project | Unlink/delete target exact pair(s); association Important disappears with its pair, but changing Important does not unlink | No automatic global cleanup for no-longer-associated CanonicalPaper |
| **CanonicalPaper and global ReadingStatus** | Unique per authorized Zotero library/type/item; global ReadingStatus persists independently of Project membership | No Project archive/unlink/delete may alter or erase it | Separate future explicit removal policy if ever needed; never use Zotero item deletion as side effect |
| **Global ResearchNote (five Markdown fields)** | One confirmed aggregate per CanonicalPaper, whole-note revision and explicit Conflict/Unknown states | No Project operation may erase it; independent global note deletion is **unapproved** UI/API scope and needs future specific consent and amendment | Never claim last Project removal makes a note disposable; private research text requires restricted exposure |
| **KeyQuote / SourceReference / SourceHistory** | User-owned excerpt/comment and active confirmed source with historical mappings; preserve original annotation authority | Unlink/Project delete and Relink do not erase excerpt/comment or history; **separate global Quote/History erasure is not authorized yet** | Long-lived provenance is valuable but may contain private excerpt/location data; any later erasure/retention must reconcile privacy and provenance rather than hiding history silently |
| **Local unsynced drafts** | Device/browser-scoped, with per-paper/revision identity and status, not server-confirmed | Only verified-redundant snapshot auto-retire; or approved precise manual discard confirmation | **No timer-based auto-expiration of unsynced/conflicted drafts**. Browser eviction/private browsing and physical erasure limits must be disclosed; cannot promise indefinite local backup |
| **Export files** | User-initiated single-note `_SAVED.md` / `_LOCAL-DRAFT.md` or separately approved full logical backup/export | Site cannot revoke/delete user-downloaded copies; managed server exports need protected scope and separate cleanup rules | User controls downloaded copies. No claim that server account deletion erases user's existing exports |
| **Managed backup/snapshot** | Versioned, complete, encryption/integrity/access-checked when actually implemented | Retain for a **future bounded window**; expire only by a separately decided retention and verifiable cleanup schedule. No silent restore of a known deleted object | **Numeric days, geographic region, snapshot count and key provider remain UNDECIDED**. Availability/integrity of point-in-time backup and cleanup are unproven |
| **Minimal deletion marker / tombstone** | A conditional non-content record to identify explicitly confirmed deletes during later import/restore | Must not contain deleted body text, rich note contents or old credentials; its eventual expiry and purge need separate design and verified safe checkpoint | **NOT IMPLEMENTED, NOT PROVEN ON WEBDAV; retention period UNDECIDED**. If markers cannot be kept reliable, STOP/require new architecture |
| **API Session / identity metadata** | Per-device revocable API-managed opaque session; minimal status/device information | Logout, expiry and targeted/all-device revoke must invalidate server-authoritative session; cannot auto-delete unconfirmed notes or alter last-known write outcome | D007-A4 timeout numbers, session-store backend and security retention **UNDECIDED**; never place tokens in backups or visible logs |
| **Security/audit logs** | Minimum redacted access/security events for diagnosis; authenticated role-based access | Restrict collection, avoid raw body, session cookie, WebDAV/Zotero secrets, full paper excerpt, device fingerprint; securely expire after a separately approved period | No arbitrary forever logs, no fixed TTL yet; legal/privacy requirements depend on actual deployment context and jurisdiction |

**Deletion scope is an authorization boundary**, not a cleanup optimization. Do not infer user intent from an object being archived, Project empty, Zotero source missing, or a session expiring.

## 3. Four distinct operations: archive, unlink, permanent deletion and draft discard

A7 treats these as **different user intents and mutation contracts**:

1. **Archive/restore** changes Project lifecycle metadata only, preserving exact identity, Associations and Important. An archive confirmation does not authorize removal or a search-visible omission of globally shared paper data; accessible archived-Project discovery remains per frozen UI.
2. **Unlink** performs either explicitly selected *Current Project* or *All Projects including current* association removal, never a global paper delete. Server must compute the protected target Project/association set under current authenticated rights and current revisions **before** confirmation, and reject stale/unauthorized requests. All-Projects scope needs stronger confirmation and truthful affected-set preview.
3. **Permanent Project deletion** requires separate confirmation naming the Project and association-loss consequences; deletion may invalidate Project views but not any global paper data. If storage cannot consistently delete Project plus its associations, **do not display “Deleted” for a partially applied operation**; expose item-level uncertainty or a verified safe transactional/fenced protocol.
4. **Local draft retirement/discard** applies only to a stable exact local revision: auto-retire may occur after the frozen full set of confirmed-save equivalence conditions; manual discard requires explicit user confirmation after an export option and a final version check. No logout/modal close/reload/focus switch or successful export counts as permission. Browser storage deletion is not proof of secure physical erasure.

**Outcomes and ambiguous network:** D007-A5's distinct `CONFIRMED / CONFLICT / DEFINITE_FAILURE / UNKNOWN` outcomes govern archive/unlink/delete and any future global deletion. A timeout, 202, upstream 5xx or delayed commit may mean an operation is in flight. Never display final “Deleted” or repeat an irreversible operation unless an authoritative store confirms the exact target operation/scope; do not retry blindly, and retain known-good draft/source state.

## 4. Independent global data deletion boundary (future, not an invented UI action)

- The website's global ReadingStatus, ResearchNote and KeyQuote data remain independent of Project references, even if the paper has zero Project associations. A global record must **not be garbage-collected as an orphan** solely because the last Project link disappears.
- If future requirements introduce a delete action for a global note/quote/history, that operation must have a **separately authorized command and exact global scope confirmation**, per-object revision checking, explicitly stated effect on Key Quote provenance and any surviving references, a narrowly scoped backup/erasure plan and independent QA. Any new screen/button must go through a **UI-AMEND** before implementation; no implicit new delete menu follows from this design.
- Zotero bibliographic data, original PDF attachments, annotations and the user's existing Zotero WebDAV account remain out of website deletion authority. Revoking a website integration token must not change external Zotero records.
- Avoid a blanket “retain all SourceHistory forever” rule: historical provenance can itself contain sensitive user data and requires an independently decided minimization/erasure plan. A real privacy/erasure request must be evaluated separately, not defeated by claiming immutable history.

## 5. Minimal deletion marker (tombstone) — CONDITIONAL proposal, not a live feature

**Purpose:** protect an explicitly confirmed deletion against a later restore/import inadvertently re-creating the deleted Project or association from an older backup. This solves only a logical *anti-resurrection* requirement, not actual provider atomicity.

**Conceptual minimal fields (not deployed schema):**

```json
{
  "markerSchemaVersion": 1,
  "entityType": "project",
  "opaqueEntityId": "project_fake_001",
  "ownerScope": "owner_fake_001",
  "deletionOperationId": "op_fake_001",
  "confirmedRevision": "opaque-rev-fake-20",
  "deletedAt": "2026-11-23T12:00:00Z"
}
```

- Do not record the deleted Project name, Note Markdown, full paper/quote text, credentials, raw personal metadata, or archived document bytes in a deletion marker. A marker containing even opaque IDs remains sensitive linkable data; restrict access and define eventual expiry/erasure in a later retention decision.
- A marker may be authoritative **only if** created consistently with the proven deletion, stored durably and atomically enough to prevent conflicts with restore/cutover. A `DELETE` followed by a separate `PUT marker` has a failure gap; a marker-first write also has failure/revival implications. **Neither order alone is proven safe with multi-file WebDAV**.
- A marker's existence is not proof that content was physically erased from backups, third-party caches, logs or already downloaded exports; a marker's absence is not proof that an old object was never deleted. If marker integrity/coverage is uncertain, **STOP restore and request review**, not silently reintroduce records.
- Marker retention and purge must be coupled to verified backup expiration, completed migrations, restore checkpoint verification and any applicable privacy requirement. **Do not set an invented number of days or claim indefinite metadata retention**. If compliance requires erasure earlier than a safe anti-resurrection window, escalate for a designed safe alternative (e.g. different restore policy) rather than secretly retaining content/IDs forever.
- This proposal does not add an API endpoint, event ledger, background job, key-value store, extra WebDAV folder, admin view or real-account operation.

## 6. Backups, old snapshots and privacy-safe restore

**A deleted object in primary storage may still exist in an older retained backup.** A7 distinguishes `delete in active dataset`, `purge backup copy` and `make old snapshot safe to restore`; they are not equivalent.

1. **Export/backup collection:** include only owner-authorized confirmed website data, with schema/manifest version, canonical Zotero identity, counts, reference closure and byte-level checksums under D007-A6. Do not include PDF bytes, original Zotero annotations, auth secrets, raw Session IDs or unchecked local unsynced drafts. A **single-note Typora export** remains UI-D005.1e and is not misrepresented as full-system backup or a remote save.
2. **Consistent snapshot gate:** partial or multi-object non-atomic exports cannot be certified as complete backups; per-file SHA-256 matching cannot prove cross-object point-in-time consistency. Require a proven checkpoint/fence/snapshot strategy. If not supported, label `NON-ATOMIC / NOT RESTORE-CERTIFIED` and stop automatic restore.
3. **Retention and confidential storage:** use a future bounded policy, least-privilege authorization and separately approved encryption/key lifecycle; region, media, tier, automatic rotation and concrete retention intervals remain undecided. Count copies across application, host, provider and approved third parties; disclose where full erasure guarantees are impossible without saying an incomplete deletion succeeded.
4. **Restore preflight:** stage in a new isolated namespace, authenticate owner and verify every record's schema, checksum and source/history link. Compare with **trusted current deletion state** or a separately proven safe restore checkpoint; if marker coverage is uncertain or the old backup would resurrect explicitly deleted records, present explicit conflict and **REFUSE active-namespace cutover**. Never silently reinstate an erased Project via an old backup.
5. **Safe resolution:** require a fresh user/Design-approved cutover plan for actual production restore, with version fencing, explicit treatment of deleted IDs, replay prevention, authorized conflict review and rollback evidence. A `tombstone` alone cannot make a non-atomic multi-file restore correct.
6. **Backup expiration / erasure:** future procedures must verify the correct backup versions/copies, access to encryption keys, cloud provider deletion conditions, remote cache/replication limits, and any retention restrictions. Where deletion cannot be proven, report `UNKNOWN/INCOMPLETE`, not “completely erased”.
7. **User-downloaded exports:** an export is in user possession after download; the website cannot invalidate that file. A later site deletion cannot promise destruction of every out-of-band copy.

**Restore is never a side effect of reading, account logout or changing Projects.** No real restore, remote cleanup or migration is authorized by this decision.

## 7. Session, audits, minimal data, and access/export rights

- **Sessions:** keep API session identity independent from Notes and Projects. A per-device logout/revoke should prevent new authorized requests; it must not erase another device's confirmed note, declare an in-flight save canceled, or discard its unsynced local draft. Do not confuse a browser cleared Cookie with destruction of server-side state. Number of session days and session-state storage are later D007-A4 implementation decisions.
- **Audit:** log only operation identifiers/hashes (when necessary), redacted outcomes, coarse timestamps and error classes under protected retention controls. Do not log full Markdown, credentials, raw HTTP auth headers, project contents, unsynced field comparisons or broad Zotero exports. Restrict audit access; minimize linkability and sensitive device metadata.
- **Data minimization:** the site stores website-owned Project/Note/Quote content and only the Zotero external identifiers needed for linking. Do not duplicate Zotero PDF/annotation database or turn a source deep link into a credential-bearing link.
- **Exports and portability:** keep already approved single-paper **Export Saved Version** / **Export Local Draft** distinctions and content format unchanged. A potential **full-system owner export** belongs to a separate explicit API/UX/security approval, with a versioned privacy-safe archive and no credentials or unauthorized other-user data; A7 does not add a hidden endpoint or bulk-export UI.
- **Privacy requests:** where applicable, support an accountable procedure for access, correction, export and erasure, including actual active data, archives, backups, historic source references and logs. Whether and how GDPR and its household/private-use exception apply to the final deployed system require an independent legal/context review; this design is **not a legal compliance certification** or permission to ignore applicable obligations.
- **Secrets and revocation:** revoking an API Session or an external Zotero/Nutstore app credential is not the same as deleting all website-owned data. Secret access remains server-only with existing ACCESS-01 rules; no credential is requested for this lifecycle design.

## 8. Unresolved decisions and precise STOP gates

| Topic | A7 rule / current evidence |
| --- | --- |
| Specific retention periods for backup, deletion markers, sessions, logs, archived Project | **UNDECIDED. No number of days, snapshots, or periodic purge is approved.** |
| Archive/delete Project, association Unlink and local draft discard | **Frozen behavior governs**; D007-A7 cannot create or change confirmation UX |
| Global Note/Quote/History deletion and full-system export UX | **NOT CURRENTLY AUTHORIZED**; requires separate UI amendment/API scope when proposed |
| Data ownership and source PDF/annotations | Zotero remains authoritative; website does **not** delete external records |
| Atomic cascade/snapshot/tombstone creation/restore | **UNPROVEN**, independent POC-001 storage evidence and separately authorized implementation needed |
| Reconciliation of `UNKNOWN` delete / lost acknowledgment | Preserve original operation, target scope and last-known-confirmed state; **never** silently retry or display success |
| Backup physically erased / browser draft irrecoverable | **NO GUARANTEE** until independently proven with provider/storage evidence |
| Real second Nutstore access | **BLOCKED** by ACCESS-01 until a separately approved ACCESS-02 after local QA |
| Session/audit retention, encryption/KMS/region choice | **NOT SELECTED**; D007-A4/A3 gates remain |
| Implementation, QA, cloud purchase/production deployment | **NOT AUTHORIZED / NOT RUN** for D007-A7; POC local remediation continues unchanged |

A wrong-scope permanent delete, cross-user leakage, false deletion completion, deletion marker/backup resurrection silently erasing a user's intended privacy boundary, or unsynced draft loss is a **P0 STOP**. If the required atomic consistency/authoritative verification is unavailable, return to Design rather than weakening the protection.

## 9. Planned A7 acceptance tests (DESIGN ONLY — NOT RUN)

| ID | Future synthetic test and expected invariant |
| --- | --- |
| **A7-01** | Archive and restore a Project retain same ID, associations and Important; archived record discoverable |
| **A7-02** | Permanently delete a Project after separate explicit confirmation; remove only Project+associated Important/links, preserve canonical/global Note/Quote/Zotero metadata |
| **A7-03** | Current-Project unlink affects only current association; All-Projects option requires stronger confirmation and affects exact selected associations |
| **A7-04** | Removing last Project link never garbage-collects global Note/ReadingStatus/Quote |
| **A7-05** | Auto-clean redundant local draft only after verified remote save + matching revision and zero newer/conflicting edits; racing edit retains draft |
| **A7-06** | Manual draft discard targets exact paper/revision, shows field differences/last edit/remote confidence and Export Local Draft option; Cancel/Export/Logout never discard |
| **A7-07** | Offline/timeout/delayed commit/conflict/failed deletion preserves `UNKNOWN` where appropriate and never reports Deleted/Saved without authoritative proof |
| **A7-08** | Explicit Quote Relink preserves excerpt/comment and confirmed SourceHistory; future independent global delete cannot be invoked through Project or Unlink |
| **A7-09** | Re-restore older synthetic backup containing previously deleted Project: trusted deletion checkpoint/marker catches resurrection and blocks silent live cutover |
| **A7-10** | Delete→marker or marker→delete fault injection proves consistency or returns NOT SUPPORTED; never falsely claim multi-file WebDAV atomicity |
| **A7-11** | Snapshot/export integrity tests reject incomplete or mixed revisions; clearly separate user single-note Markdown export from complete backup |
| **A7-12** | Read-only workspace/client, unauthorized session and foreign Project cannot export, delete, restore or access another user's records; secrets/logs redacted |
| **A7-13** | Session revoked during in-flight Note write does not invent a failed/confirmed outcome or discard another device's draft |
| **A7-14** | Retention/backup purge simulated with unknown provider copy state reports incomplete; no invented TTL or “all copies erased” confirmation |

**Evidence policy:** these 14 planned scenarios are *not* a new current POC-001 execution requirement or a change to the Module 002 frozen 26 acceptance scenarios. They require separately scoped implementation, exact SHA, independently reproduced privacy/integrity tests and Design acceptance later.

## 10. Next independent design decision

**D007-A8 (PROPOSAL ONLY): Zotero Web API and cross-device “Open in Zotero” integration/verification contract.** Evaluate minimal authorized metadata/annotation reads, stored-versus-linked attachments, iOS/iPadOS `zotero://open-pdf` deep-link behavior, Android uncertain/degraded pathways, paper/Page/annotation source locator fidelity, and exact per-device/browser test matrix **without actual credentials, PDF data or live device testing until separately approved**.

**Final disposition:** **D007-A7 OPTION B APPROVED / LIFECYCLE DESIGN ONLY**. **NO numeric retention periods chosen. NO NEW UI DELETE COMMANDS. POC-001 local REMEDIATION and ACCESS-01 unchanged. NO LIVE NUTSTORE, APP CODE, DELETIONS, DEPLOYMENT OR RUNTIME QA.**
