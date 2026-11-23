# D007-A16 — Risk-Tiered Sensitive-Action Authorization and Step-up Contract

**Decision:** **D007-A16 Option B APPROVED**, **2026-11-23 (Europe/Berlin)**.  
**Status:** **SECURITY / AUTHORIZATION ARCHITECTURE ONLY — NO APP/UI/CODE, IDENTITY ACCOUNT, REAL DATA, DEVICE TEST, DEPLOYMENT OR QA EXECUTED.**  
**Scope:** risk tiers and server-authoritative freshness, intent-bound step-up, exact scoped Project deletion and Current/All Projects unlink, session/device/factor recovery, conditional future global deletion/export boundaries, CSRF/Origin, concurrency and UNKNOWN, privacy-minimized audit and independent QA.
**Normative upstream decisions:** [A4 API-hosted opaque Sessions + CSRF + read-only Workspace](D007_A4_AUTH_SESSION_SECURITY.md), [A5 operation identity/outcome contract](D007_A5_API_CONTRACT.md), [A6 data schema/backup](D007_A6_DATA_SCHEMA_RECOVERY.md), [A7 privacy/lifecycle](D007_A7_DATA_LIFECYCLE_PRIVACY.md), [A9 independent exact-SHA QA](D007_A9_QA_FRAMEWORK.md), [A10 independent work-package authorizations](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [A11 incident STOP](D007_A11_OPERATIONS_RUNBOOK.md), [A13 environment separation](D007_A13_ENVIRONMENT_ISOLATION.md), [A14 HTTPS same-site/API-host `__Host-` Cookie/CSRF/Origin](D007_A14_ORIGIN_COOKIE_TOPOLOGY.md), [A15 single Owner/MFA/recovery](D007_A15_OWNER_IDENTITY_RECOVERY.md).  
**Canonical immutable product UX:** [Module 002 frozen approved decisions](../ui/002/DESIGN_APPROVED.md), [operative UI-D002, UI-D004.3b-R1, UI-D004.3f/g and UI-D005.1h/j rules](../ui/002/DESIGN_DRAFT.md), [26 U6 acceptance scenarios](../ui/002/ACCEPTANCE_TRACEABILITY.md), **all NOT RUN**. A16 may not insert additional dialog, confirmation, account screen, delete button or altered scope into this freeze; any later interaction mismatch requires a separate user-approved `UI-AMEND` **before implementation**.
**Separate POC track:** [POC-001 REMEDIATION-02](../handoffs/POC-001/REMEDIATION_02.md) retains original `exec/POC-001-webdav-feasibility` branch, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, original path allowlist and **NO REBASE**; existing second independent QA for `2806d9d08dcec78e974703a82a38a696ae76d132` = **LOCAL_STAGE PARTIAL**, real provider **ACCESS-02 BLOCKED**, PR #2 **not merge-authorized**.
**Zero execution authority:** no live account, MFA factor, credential, supplier, App UI/API code, host, DNS, proxy, staging, deletion, audit collector, key, real Nutstore/Zotero, or test session may be created by A16.

## 1. Approval semantics: authentication, step-up, confirmation, and persistence are four distinct events

1. **Authentication / Session** proves the current authorized principal at a particular strength and time under A4/A15; possession of a host-only Cookie is not a blank authorization for every destructive operation.
2. **Step-up / fresh reauthentication** proves a recently validated qualifying factor or higher assurance for a **defined risk class**. Its evidence is server-side, environment- and Session-bound, with an issued-at time and assurance provenance. Step-up is **not** the existing product's confirmation dialog and never implies a write occurred.
3. **Intent / scope confirmation** binds exactly *which* Project or selected canonical papers, *which* Current/All scope, and *which* expected revisions/affected count the user confirmed. Frozen second confirmation remains mandatory even when step-up has succeeded.
4. **Mutation result** is independently `CONFIRMED / CONFLICT / DEFINITE_FAILURE / UNKNOWN` under A5, not inferred from a successful authentication, HTTP 202, completed CSRF challenge, dialog close, or one temporary ledger entry. An approved intent **does not** establish durable storage atomicity, cross-instance at-most-once, or backup correctness.

**Fail closed before side effects** when there is no valid Session, no permitted target/scope, stale or unsatisfied step-up, missing required intent confirmation, mismatched revision, wrong environment or invalid CSRF/Origin. Once a mutation **may have been dispatched**, timeout, logout, security revocation or lost acknowledgment cannot truthfully assert noncommit; preserve `UNKNOWN` and never blindly replay.

**Step-up is independent of browser UI selection:** A16 sets a future backend security gate, not a silently added login overlay or replacement confirmation screen. If an action requires a fresh factor but the frozen UI has no approved way to satisfy/communicate the challenge, the action **remains blocked until separate UI-AMEND and execution authorization**; do not degrade to Session-only authorization.

## 2. Risk taxonomy and action matrix (no automatic feature approval)

| Tier | Approved or future operation | Minimum normative authorization and user-intent protection | UI authority / STOP |
| --- | --- | --- | --- |
| **R0 — authorized read** | Own Projects, canonical paper metadata, ReadingStatus/Note/KeyQuote; narrowly projected Workspace reads | Valid server-authoritative environment-bound Session, owner/resource authorization, safe response caching; no implied mutation | Existing read-only UI/API scope, **no new feature** |
| **R1 — versioned routine write** | Create/edit Project, archive/restore, single-paper ReadingStatus, per-Project Important, five-field Note Save Now/autosave, existing Quote save/Relink | Valid Owner Session + CSRF + exact Origin/Fetch Metadata + resource scope + A5 version/CAS, operation identity, verified outcome; any existing UI-specific confirmation retained. Quote Relink preserves source/history atomicity | **Do not impose a surprise reauth on background autosave**; if evidence indicates elevated risk, pause guarded writes and obtain separate UX/design approval |
| **R2 — sensitive irreversible association change** | **Project permanent deletion**, **Current Project Unlink**, **All Projects Unlink** (different target scopes, All requiring stronger approval) | All R1 server checks **plus a separate, sufficiently recent qualifying step-up for risk-sensitive actions as a conditional implementation gate**; exact user-confirmed intent/target/scope/revision binding, one-use guarded execution and no cross-scope replay | Preserve frozen confirmations. Step-up transport / freshness policy not yet finalized; if not integrated in separately approved UX, **BLOCK**, never skip frozen confirmation or silently weaken risk gate |
| **R3 — identity-control / takeover-resistant** | Current/all-device Session revocation (revoking own current Session versus other/all devices distinguished), lost-device authenticator removal, MFA factor add/remove, recovery-address change, password/Passkey change, sensitive recovery completion | Verified trusted Owner and **fresh qualifying independent proof/step-up** (or separately validated recovery proof when all factors unavailable), explicit exact device/credential set; bound to Session, issuer, environment, and time, with atomic revocation and audit | A15 permits **architecture only**: it has not authorized new account-management UI or real identity backend. If no trusted factor or durable store, **STOP**. User self-logout remains A4's already approved behavior, no needless new login screen |
| **R4 — future separately gated capability** | Hypothetical **global** ResearchNote/KeyQuote/SourceHistory/Paper delete, account-wide data export, bulk private Note export, backup re-key/restore, owner replacement | **No executable permission currently exists.** Before any actual implementation: separately approve product intent, UI-AMEND when interface needed, precise global scope, privacy/backup/anti-resurrection policy, R3-class step-up + signed/guarded intent, independent QA and audit | Never infer new feature from a security policy; current **single-paper five-field Typora Markdown Saved/Local Draft export** remains allowed per freeze and is **not** blanket owner/library export |

**Tier boundaries:** the risk level is defined on the **server by operation name and target effect**, not a client-supplied `riskTier`. Current-only Unlink is narrower than All-Projects, but neither is a delete of a canonical Zotero item or global website Note. Project archive is **not** permanent delete. A routine state change cannot be escalated into a destructive action by a malformed method, filter or forged payload.

**Freshness policy deferred:** define `maxReauthAgeByTier`, accepted factor/assurance by action, replay/clock-skew tolerance, single-use authorization lifetime and reauth failure handling in a **separate user/Design implementation parameter decision** informed by approved auth provider and QA. **No numeric seconds/minutes, AAL level or MFA method is committed by A16.** A generic recently valid Session alone is *not* a new factor proof for R3; R2's concrete step-up requirement/UX integration must be resolved and verified before enabling the action.

## 3. Intent-bound authorization envelope — conceptual server contract

**Future one-use authorization grant** is **not a client-minted bearer token** and is not evidence of persistence. A server-verified, protected record may bind fields below (no actual endpoint/record created):

~~~json
{
  "authorizationSchemaVersion": 1,
  "environment": "SYNTHETIC_ONLY",
  "principalId": "owner_synth_01",
  "sessionBinding": "SERVER_ONLY_SESSION_REF",
  "action": "PROJECT_UNLINK_ALL",
  "targetProjectId": "project_synth_alpha",
  "selectedCanonicalPaperIds": ["fake-library-a/X1", "fake-library-a/X2"],
  "affectedProjectIds": ["project_synth_alpha", "project_synth_beta"],
  "scope": "ALL_PROJECTS_INCLUDING_CURRENT",
  "expectedResourceRevisions": ["rev-fake-11", "rev-fake-07"],
  "confirmedTargetDigest": "SERVER_AUTHENTICATED_SYNTHETIC_DIGEST",
  "operationId": "fake-operation-id",
  "stepUpEvidenceRef": "SERVER_ONLY_STEP_UP_RECORD",
  "intentState": "UNUSED",
  "persistenceOutcome": "NOT_DISPATCHED"
}
~~~

- **Capture** a server-authoritative snapshot with exact authenticated principal/ownerId, Session/assurance and environment, action code, canonical library-qualified paper identifiers, selected set and **hidden tab/filter selections**, Current/All target Project IDs, confirmed-preview counts, expected association/global revisions and a stable sorted canonical representation of those target tuples. Client-provided IDs/counts are hints; the API independently resolves every target and ACL.
- **Bind** the intended operation and expected version(s) using a server-side unforgeable intent identifier or keyed authenticated digest/HMAC (algorithm/key selection deferred); do not use a bare client hash as authorization, and do not expose the HMAC key or stored MFA challenge in browser logs. Bind to **exact Session/owner/environment**, action, target and scope, not only to a clicked button or one loosely shared token.
- **Confirm** through the **already frozen** Project-name or Current/All scope UI confirmation. The server accepts consent only for the **exact canonical target snapshot** that the user actually reviewed. For All-Projects Unlink, confirmed affected Projects/count and hidden selection must match; target/counter changes require fresh review and confirmation, not a silently expanded target.
- **Authorize** an R2/R3 sensitive action only if the permitted risk tier has unexpired server-side step-up evidence from an accepted factor **and** a valid one-use intent. Evidence from another device, Session, tenant, environment or action type is not transferable. Step-up success alone cannot make the request execute.
- **Consume and mutate safely:** one-use intent consumption and target revision validation must be atomic relative to permitted dispatch or have a proved durable reservation/fencing protocol. Repeated same `operationId` with different target/payload or re-used consent grants must fail closed. One per-process Map does **not** prove cross-instance replay safety; where durable idempotency/transactionality cannot be established, mark `UNSUPPORTED/BLOCKED` rather than promise atomic all-target deletion.
- **Revalidate at commit:** changed Project associations/Important, changed paper membership, lost permissions, revoked Session, expired step-up or stale revision cause a non-destructive conflict/reconfirmation if **no dispatch happened**. If the write may already have reached storage, return `UNKNOWN` until authoritative reconciliation; do not reassemble a new all-Projects scope and resend automatically.
- **Avoid privilege laundering:** confirmation text can never be modified by background JS to quietly substitute new targets; an R1 action cannot borrow an R3 step-up grant without matching scope/action; cross-device Session revoke cannot piggyback on a note autosave grant.

**No new browser control is approved by this record.** The exact UI/API endpoint, durable operation/intent ledger, intent-snapshot presentation, whether/how step-up happens within existing frozen UI, grant cryptographic format and numeric expiry are future implementation/UX decisions.

## 4. Frozen UI confirmation and protected data boundaries

| Existing action and frozen reference | Immutable confirmation rule | Backend mutation scope and required safeguards |
| --- | --- | --- |
| **Project Archive / Restore** — UI-D002, A7 §1 | Archive ≠ Delete; restore same ID. Preserve existing action and any existing confirmation | Only lifecycle metadata changes; Project ID, Associations and per-Project Important retained. Any code path proposing an association delete under “archive” is denied |
| **Project Permanent Delete** — UI-D002, U6-L2-01/L3-02 | **Separate explicit second confirmation naming the affected Project and irreversible removal of Project + Project–Paper associations**; Cancel/Escape/close ≠ approval | Target only exact Project ID and its associations/Important, revision-guarded and scoped. Never delete canonical paper, global 3-state ReadingStatus, one shared five-field Note, Key Quotes, SourceHistory, Zotero PDF/annotation, even if last Project link |
| **Unlink Current Project** — UI-D004.3b-R1, U6-L2-05/L3-02/L3-03 | **Default** explicitly labeled “Current Project only”; review original selection, including hidden rows/filter, with counts before batch | Remove only selected Project × paper links and their Important state; no associations in other Projects, no global record deletion; original batch identity/results retained |
| **Unlink All Projects** — UI-D004.3b-R1, UI-D004.3f/g, A7 §1 | User must **deliberately select** “All Projects including current”; **stronger second confirmation** with affected Projects and counts, including hidden selection; current-only selection must never be silently widened | All-Project union of exactly the **selected** canonical papers’ links in authorized Projects; keep every global paper/Note/Quote/SourceHistory; use revision-safe item outcomes, no silent all-or-nothing claim or blind retry |
| **Manual Local Draft Discard** — UI-D005.1j | Exact paper and local draft revision, known/unknown sync state, Export Local Draft opportunity and **separate Confirm Discard**, Cancel/Escape does nothing; version recheck before erase | Discard only that exact local revision when still consistent; logout/factor change/navigation/Markdown export do **not** imply discard consent |
| **Single-note Saved/Local Draft Markdown export** — UI-D005.1e/g/k | User explicitly chooses confirmed saved vs local draft version; does not perform backend Save or imply discard | Only authorized five-field Note + approved bibliographic context, safe filename; no Key Quotes/PDF/annotation or bulk account export |

**Existing safety is mandatory independent of A16:** confirmations cannot be bypassed by automation, deep links, server-only “dangerous endpoint”, phone hidden selection, keyboard hotkey or a previously issued step-up. Any attempt to add a new global delete UI or confirmation screen without separate `UI-AMEND` is a **scope STOP**, even if the backend needs it for security.

## 5. High-risk identity and device operations: step-up, revocation and recovery

- **Current device sign-out:** follow A4/A14; Session-bound CSRF and Origin, revoke the **current** server record and clear matching host-only Cookie. A complete active-session listing and revoke-other device function is A15 architecture only; do not invent a new frozen UI screen.
- **Other device / all device Session revocation:** resolve exactly selected Session record IDs with a minimal privacy-safe device label, require Owner rights and **fresh independent factor/step-up** after revalidation. Revoke across API instances and restarts; denied/UNKNOWN revocation must not be reported complete merely because current browser Cookie was cleared.
- **Lost physical device:** distinguish server Session revocation from deleting a synced passkey/security key authenticator; rotate/revoke affected factor after verifying from a separately trusted factor or approved recovery route. On account-compromise risk, revoke all relevant Sessions and untrusted recovery channels, preserving website data.
- **MFA/password/Passkey/recovery-contact change:** require fresh qualifying proof of the **existing** authenticator or separately trusted recovery, bind approval to exact factor/add/remove/address operation and use atomic registry update/replay protection; send notification through future approved out-of-band channel. An expired Session, changed Origin or lost factor cannot be bypassed with email-only login or a default operator key.
- **Recovery during mutation:** session reset/credential rotation may invalidate subsequent requests but **cannot prove the earlier in-flight Save/Delete/Relink failed**. Keep last-confirmed data, source history, the original operation identity and `UNKNOWN`; do not auto-replay after recovery. Device-local draft survives where browser storage remains available; cannot promise recovery after device destruction/eviction.
- **MFA and Session policy source:** A15 remains the source of the one-Owner model and recovery proofs; A16 adds risk-tier authorization for sensitive actions without choosing or generating a factor. A4/A14 remain the source of `__Host-` API-host Cookie, `HttpOnly; Secure; SameSite=Lax` **candidate**, exact credentialed CORS, CSRF and Origin.

## 6. Error contract, privacy-minimized audit and STOP/resume

| Actual security/API situation | Result classification and safe client behavior |
| --- | --- |
| Missing/expired/revoked Session before dispatch | `401` authentication needed, but do not drop drafts or automatically resend previously ambiguous work |
| Authenticated but target/role/Project outside approved scope | `403` and neutral response; do not confirm whether a foreign Project or quote exists |
| Valid Owner Session but step-up too old/missing | **Distinct structured STEP_UP_REQUIRED policy response**, not a claim that operation succeeded or a stealth login UI; exact HTTP status/error schema finalized with A5 contract implementation and UI-AMEND if needed |
| Missing CSRF/unapproved Origin/Fetch Metadata | Server denies before mutation, keeps client draft; CORS alone is not a CSRF defense; no broad `same-site` sibling trust |
| Stale target revision/selected set changed | `409/412/428` according to A5 conflict/precondition contract, explicit target re-review and fresh intent; never perform a newly widened scope |
| Requested after possible dispatch, timeout/5xx/lost ACK/session rotation | `UNKNOWN`, preserve original `operationId`, revision and pending/draft history; no “Deleted”/“Saved” final label or blind replay |
| Resolved and authoritatively persisted same operation | `CONFIRMED` only on reliable backend proof, with exact affected-set results and no duplicated source history |
| No dependable multi-object CAS, grant consume, restore or operation ledger | `UNSUPPORTED/BLOCKED`, do not fake successful single-transaction deletion, globally exactly-once execution or safe recovery |

**Minimal security audit candidate** (logical fields only, not a live logger): event UTC, environment, coarse actor pseudonym/ref with strict access, action type, risk tier, Session/step-up age **bucket** (not raw Session ID), target-kind and *count* but **no list of private targets where unnecessary**, intent digest reference, `operationId` protected correlation, expected-vs-observed outcome, rejection reason category, exact backend build SHA and `MOCK/PROVIDER/NOT_RUN` evidence provenance. Access, minimization and retention remain A7/A11 and **no numeric days are approved**.

**Never log:** Cookie/Session token, authenticator or recovery code, CSRF token, Zotero key/Nutstore app password, Personal Workspace bearer, Note/Quote text, actual selected paper titles/IDs in broad telemetry, PDF/annotation content, full backup or real email. An audit record or HTTP status is **not a durable operation ledger** or backup deletion marker.

**P0 STOP:** authorization bypass, silent mutation of global data, wrong Current/All scope, forged accepted confirmation/step-up, third-party principal act-as-owner, compromised factor replacement, false `Saved/Deleted`, lost draft, or leaked private contents/credentials.  
**P1 BLOCK:** no reliable shared step-up/intent state, irreconcilable `UNKNOWN`, invalidated Session accepted, lack of safe target revalidation or missing UX support for a required fresh-auth challenge.  
**P2 REVIEW:** noncritical diagnostics/wording or benign usability shortcomings that do not alter rights or persistence; **promote** a P2 that impacts privacy/integrity to P0/P1.

**Recovery and release:** Design must authorize exact test/implementation work package, independent QA must reproduce a complete exact 40-char SHA under approved fake/test scope, and Design separately accepts QA and future merge/deploy. No local synthetic PASS allows Nutstore ACCESS-02 or assumes vendor transaction safety.

## 7. Independent A16 QA plan — 20 proposed cases, ALL NOT RUN

| ID | Synthetic proof required in a **separately authorized** future test |
| --- | --- |
| **A16-01** | Server-side R0/R1/R2/R3/R4 classification cannot be downgraded or upgraded via forged client `riskTier` |
| **A16-02** | Valid Session + outdated step-up blocks R2, fresh qualifying bound factor permits **intent creation only**, not silent execution; TTL policy configurable but not chosen |
| **A16-03** | Missing/expired Session, revoked principal, wrong device/issuer/environment step-up rejected; no cross-Session reuse |
| **A16-04** | Intent tampering: change action, Project, paper IDs, Current→All, affected counts, expected revisions or hidden selection ⇒ reject/reconfirm |
| **A16-05** | Frozen Project Delete second confirmation names the Project, Cancel/Escape causes zero writes, global notes/quotes/Zotero unchanged |
| **A16-06** | Archive→restore retains same Project ID/associations/Important and cannot be interpreted as permanent Delete |
| **A16-07** | Current-Project Unlink is default; only exact Project–Paper links and Important removed, other Projects unchanged |
| **A16-08** | All Projects Unlink requires deliberate stronger confirmation and exact affected IDs/counts/hidden rows; no global note/quote delete |
| **A16-09** | Same selected paper and `operationId` with different scope/payload/fingerprint rejected; concurrency cannot double-dispatch if protected ledger proven |
| **A16-10** | Changed Project/association membership between confirmation and execution ⇒ non-destructive conflict/re-review, no widened target |
| **A16-11** | Reauth/step-up completion, consent confirmation and a backend write remain separate: `202` or screen close is not `CONFIRMED` |
| **A16-12** | Lost ack/5xx after possible dispatch during Project Delete or unlink ⇒ `UNKNOWN`, no blind retry, original batch/item outcomes retained |
| **A16-13** | CSRF/Origin/Fetch Metadata hostile sibling site, null Origin, credentialed CORS wildcard attempt rejected for all unsafe operations |
| **A16-14** | R3 changed password/Passkey/MFA/recovery address requires fresh independent proof + exact factor intent, no email-only downgrade |
| **A16-15** | Single-device revoke, revoke-other and all-device semantics isolated across two fake API instances; revoked Session rejected |
| **A16-16** | Lost-device authenticator vs Session distinction, concurrent recovery, no attacker-selected credential or phantom successful revocation |
| **A16-17** | After login/rotation/step-up, five-field Note unsynced draft and `UNKNOWN` with last-confirmed revision remain protected |
| **A16-18** | Workspace read-only grant cannot bootstrap, step up Owner, delete Project, unlink associations, revoke Sessions, bulk export or see MFA secrets |
| **A16-19** | Future global Note/Quote delete and account-wide export remain **UNSUPPORTED/NOT_AUTHORIZED**; existing Saved/Local Draft single-note Markdown export remains available without added global action |
| **A16-20** | Redacted audit contains no credential/paper/Note contents and reports genuine `NOT_RUN`; independent exact-SHA QA and POC-001/frozen UI hash unchanged |

**Acceptance source protection:** original Module 002 **67 frozen UI-D decisions / 26 U6 scenarios all NOT RUN**, D007-A4..A8 **60 design-only tests NOT RUN**, and all additional A9..A15 proposed tests remain independent. A16's **20 proposed cases are not executed**, and do not update POC-001 test obligations, its original scoped branch or independent review result.

## 8. Sources, deferred decisions and next separate design candidate

Security guidance reviewed 2026-11-23:
- [OWASP Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) — protect exact transaction parameters and prevent authorization replay/alteration.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — fresh authentication after risk events.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — Session lifecycle, rotation and revocation.
- [OWASP ASVS 5.0 Session Management V7](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x16-V7-Session-Management.md) — sensitive-operation additional proof.
- [NIST SP 800-63B-4 (2025), Session management](https://pages.nist.gov/800-63-4/sp800-63b/session/) — concept of reauthentication and time bounds; **this project claims no AAL compliance**.

**Deferred:** actual MFA or provider choice, Step-up grant carrier and cryptographic key, fresh-auth age (seconds/minutes), Session/intent database, one-time consume primitive, exact action HTTP status/envelope and UI integration, alerts/retention days, physical browser compatibility, user-account screen, verified hardware factor, global export/deletion UX, real cloud and WebDAV. All need independent design/authorization where relevant.

**Next independent D007-A17 candidate:** **data-encryption key hierarchy, backup encryption and loss/rotation/recovery security design** — provider-neutral key ownership and separation between authentication/session secrets vs website data/backup encryption, no secret creation, export, live restore, cloud purchase or implementation. Proposed as a separate architecture decision, **not preapproved**.

**FINAL DISPOSITION: D007-A16 OPTION B APPROVED — RISK-TIERED ACTION AUTHORIZATION DESIGN ONLY. EXISTING FROZEN CONFIRMATIONS UNCHANGED. ALL A16 QA NOT RUN; NO NEW DELETION/EXPORT/ACCOUNT UI; NO CODE, REAL ACCOUNTS, MERGE, ACCESS-02 OR DEPLOYMENT.**
