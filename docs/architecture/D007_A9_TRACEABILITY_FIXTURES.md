# D007-A9 — Synthetic Fixture Catalog and Frozen UI Crosswalk

**Approved design:** [D007-A9 Option B independent QA framework](D007_A9_QA_FRAMEWORK.md), 2026-11-23 (Europe/Berlin).  
**State:** **PROPOSED SYNTHETIC FIXTURES AND CROSS-MODULE MAPPINGS ONLY / NOT EXECUTED**. This is neither a dataset upload nor an execution command.  
**Canonical source:** [Module 002 frozen 26 U6-L1..L4 scenarios](../ui/002/ACCEPTANCE_TRACEABILITY.md) and its separate mapping from the **67 UI-D decisions**, both **left unchanged**.  
**QA source:** [POC-001 PR #2 independent QA comment](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675) remains a distinct **LOCAL_STAGE PARTIAL** result for `65e14afc81e6de37ba5fac90c2937a27876c5614`, not a pass or live-provider validation.

## 1. Synthetic-only dataset specification

All IDs, titles, note text, quotes, annotations, accounts and origins **must be fabricated**. Do not derive fixtures from a real Zotero library, PDF, annotation, personal research note, or copied account credential. No GitHub secret or real WebDAV/Zotero request is authorized. Fixture labels below are names for future authorized test designs, **not files now created in the repository**.

| Fixture ID | Minimum synthetic entities / adversarial cases | Cross-module assertions |
| --- | --- | --- |
| **FIX-PRINCIPAL** | `user_demo_a`, `user_demo_b` (unauthorized), `workspace_readonly_a`, two independent fake browser session IDs, revoked/expired token states | AuthN/authZ, principal/project scope, CSRF/CORS, session revocation, workspace GET-only; no valid secrets or real external login |
| **FIX-PROJECT** | `project_synth_alpha`, `project_synth_beta`, `project_synth_gamma`, one archived, one already deleted, scoped membership and confirmed revisions | Archive→restore identity, Project permanent delete affects only associations; no global cascading data loss |
| **FIX-PAPER** | `(user, fakeLib01, XFAKE001)` and `(group, fakeLib02, XFAKE001)` **with intentionally colliding itemKey**, a second distinct synthetic paper | Canonical identity includes library type/id; same paper in three Projects has one global ReadingStatus, Note and Quotes |
| **FIX-ASSOCIATION** | Alpha/Beta/Gamma all link one fake canonical paper; Important true only in Alpha; archived Project keeps its association | Important is Project-scoped and unlink Current vs All targets exact associations; 3-state ReadingStatus is global |
| **FIX-STATUS** | Only three approved enum values `To Read` / `Reading` / `Read`, invalid fourth enum and stale revision | No invented fourth status; API requires authorized authoritative revision for mutation |
| **FIX-DRAFT** | Browser-local unsynced fake Note draft at revision A, confirmed remote revision B, later local keystroke, conflicting edit, local-only export and deliberately canceled discard | Auto-retire only one proven-identical confirmed draft snapshot with no newer edit; never auto-expire uncommitted drafts or treat Export/Logout as discard consent |
| **FIX-NOTE** | One 5-field Note containing `Research Question`, `Arguments & Content`, `Theories & Methods`, `Contributions & Innovations`, `Limitations`; fake Unicode Chinese, LaTeX, multiline Markdown, empty field, trailing whitespace, two divergent revisions | Lossless UTF-8/Typora source, whole-note version guard, local draft vs confirmed backend content, no false Saved or auto-delete on unknown |
| **FIX-MARKDOWN** | Fake title with filename path separators, normal fake Zotero itemKey, literal dollar math, code fence, headings, Unicode, saved versus local-draft variants | Sanitized `_SAVED.md` / `_LOCAL-DRAFT.md` filename, five sections, no PDF/annotation inserted, no web HTML injection |
| **FIX-QUOTE** | Two fake Key Quotes: same excerpt text with distinct quote IDs; one tied to a fake original annotation, one manually written; independent fake user comments | Text equality not dedupe key; manual Relink never overwrites quote text or comment; preserve confirmed source/history |
| **FIX-ANNOTATION** | Two synthetic attachments with fake `stored` and `linked` `linkMode`, child annotation keys, fake printed roman page label `iv`, PDF viewer page index ambiguity, deleted annotation and absent position | Parent/item/attachment/annotation identity distinct; no exact highlight/page claim from label alone; no copied PDF bytes |
| **FIX-ZOTERO** | User+group fake Web API library prefixes, parent item and child attachment keys, fake Collection with two duplicate paper references, revoked read-only credential state, synthetic 304/403/404 | One-time Collection import, stable compound identity, no actual auth/API call, strict scoped read-only adapter and correct error classification |
| **FIX-PAGINATION** | 115 fake Zotero metadata items split across 100+15 responses, bounded `Link` rel=next and `Total-Results`, 304, 401/403, 429+`Backoff`+`Retry-After` | Complete yet bounded manual Collection import, no unsafe follows, no auto-all annotations, permission errors not empty collection |
| **FIX-BATCH** | 5 selected fake paper IDs, two hidden by phone filter, overlapping 2 fake batches with mixed confirmed/conflict/failed/unknown outcomes | Same original selection/scope, per-item result, confirmed-only counts and no blind retry or second write of unresolved item |
| **FIX-RACE** | Clients A/B both start at `"rev-synthetic-01"`, A update commits, B stale; delayed commit after timeout; 2 identical op IDs in flight and mismatched payload reuse | CAS under mock only, operation reservation race, no contradictory terminal verdict, multi-process ledger guarantee explicitly unsupported until proven |
| **FIX-FAULT** | Local-only fake 401/403/409/412/423/429/5xx/timeout/ack lost/restart; malformed `If-Match` wildcard/list/weak tag and prototype keys | Honest Confirmed/Conflict/Definite Failure/Unknown, protected paths, no credentials, no unsafe repeat |
| **FIX-MARKER** | Synthetic confirmed deletion ID, older backup containing the deleted Project, intentionally missing/corrupt/non-durable tombstone, concurrent restore target | No restored deleted records unless separately authorized safe resolution; missing atomicity → STOP/not certified |
| **FIX-BACKUP** | 3 fake Projects, associations, single global Note and Key Quotes, manifest checksums, missing record, duplicate canonical ID, schema mismatch, partial export | Identity closure, hashes **and** consistent snapshot must be verified; export not complete merely because readable files passed hash |
| **FIX-WORKSPACE** | Read-only fake projection for Project and paper references, explicit write-attempt inputs and foreign user ID | No Write in Personal Workspace; no website session/token leaked; deep links require destination authorization |
| **FIX-LINK** | String-only synthetic URI fixture representing `zotero://select/...` or `zotero://open-pdf/...` with **fake identifiers**, unsupported Android and app-missing states | Unit validation of URI construction is **not proof** of app launch/PDF focus; per-device physical verification gated |
| **FIX-STORED / FIX-LINKED** | Metadata-only flags for available stored PDF, offline stored PDF, absent PDF, linked desktop-only local attachment and multiple PDFs | No site PDF mirror; device's own Zotero download/configuration and L1/L2/L3 separately unverified |
| **FIX-SECURITY** | Fake malicious `Origin`, host redirect, path traversal, encoded separators, overlong body, forged CSRF, cross-user association, read-only Workspace write | Fail closed without SSRF/IDOR/secret leak; redacted evidence only |
| **FIX-MOBILE / FIX-A11Y** | Synthetic phone/tablet viewports, virtual keyboard/IME events, screen-reader text/focus state, hidden selection and modal cancel | Tested keyboard/screen-reader focus and safe-area requirements must later be observed on actual supported browsers/devices |

**Fixture schema/version rules:** Assign deterministic `fixtureSchemaVersion`, unique synthetic IDs, fixed random seed/test clock, explicit expected revisions and links, declared intentionally malformed variants and a content hash when saved. Only synthetic JSON/Markdown/opaque attachment *metadata*—**no PDF file or real personal data**. Keep identity collision tests intentionally ambiguous until all library parts are checked. The eventual fixture location and runner remain unselected.

## 2. Frozen Module 002 U6 scenario crosswalk — all original 26 retained (NOT RUN)

This is a **reference view**. Coverage text is copied from the original acceptance traceability for clear mapping; the source file remains the sole authority for acceptance wording and the 67-to-26 UI decision mapping. `A4`.. `A8` are the approved D007-A4..A8 design contracts, not executed tests. `E9` is proposed in the companion strategy document.

| Original U6 ID | Existing frozen coverage | Design dependencies | Proposed fixtures | Future E2E | Original status |
| --- | --- | --- | --- | --- | --- |
| `U6-L1-01` | Project Home card/list, search, totals, focus | A4/A7 | FIX-PROJECT | E9-01 | **NOT RUN (frozen UI)** |
| `U6-L1-02` | Project literature table/cards, tabs, sort/filter, count distinction | A5/A6 | FIX-ASSOCIATION | E9-02 | **NOT RUN (frozen UI)** |
| `U6-L1-03` | Detail two/one column, long paper metadata, notes and quotes | A6/A8 | FIX-NOTE, FIX-QUOTE | E9-04 | **NOT RUN (frozen UI)** |
| `U6-L1-04` | More, batch sheets, long modal, safe area/keyboard access | A4/A5 | FIX-MOBILE | E9-08 | **NOT RUN (frozen UI)** |
| `U6-L1-05` | Focus, semantics, screen-reader announcements and large text | A4/A8 | FIX-A11Y, FIX-MOBILE | E9-08 | **NOT RUN (frozen UI)** |
| `U6-L2-01` | Project create/edit/archive/restore/delete with safe confirm | A5/A7 | FIX-PROJECT, FIX-MARKER | E9-01 | **NOT RUN (frozen UI)** |
| `U6-L2-02` | Zotero manual and one-time Collection import without duplicate | A6/A8 | FIX-ZOTERO, FIX-PAGINATION | E9-03 | **NOT RUN (frozen UI)** |
| `U6-L2-03` | Global three-state Reading Status, search/filter/sort | A5/A6 | FIX-PAPER, FIX-STATUS | E9-02 | **NOT RUN (frozen UI)** |
| `U6-L2-04` | Per-Project Important star, tabs and honest counts | A5/A6 | FIX-ASSOCIATION | E9-02 | **NOT RUN (frozen UI)** |
| `U6-L2-05` | Hidden Select, scoped batch confirmation and individual batch result reopen | A5/A7 | FIX-BATCH, FIX-MOBILE | E9-06 | **NOT RUN (frozen UI)** |
| `U6-L2-06` | Five Markdown fields, edit/preview/autosave/Save Now/export | A5/A6/A7 | FIX-NOTE, FIX-MARKDOWN | E9-04 | **NOT RUN (frozen UI)** |
| `U6-L2-07` | Highlight picker, Key Quote, source history and manual Relink | A5/A6/A8 | FIX-QUOTE, FIX-ANNOTATION | E9-05 | **NOT RUN (frozen UI)** |
| `U6-L3-01` | Lost/delayed acknowledgment with truthful confirmed state | A5/A6 | FIX-RACE, FIX-FAULT | E9-07 | **NOT RUN (frozen UI)** |
| `U6-L3-02` | Cancel/escape Project delete, unlink and batch with no write | A5/A7 | FIX-PROJECT, FIX-BATCH | E9-01, E9-06 | **NOT RUN (frozen UI)** |
| `U6-L3-03` | Overlapping pending batch outcomes independent of filters | A5 | FIX-BATCH, FIX-RACE | E9-06 | **NOT RUN (frozen UI)** |
| `U6-L3-04` | Important Saving/Failed/Unknown during Select and after exit | A5/A6 | FIX-ASSOCIATION, FIX-FAULT | E9-06 | **NOT RUN (frozen UI)** |
| `U6-L3-05` | Offline draft, remote conflict, merge/revision recheck | A5/A6/A7 | FIX-NOTE, FIX-RACE | E9-04, E9-07 | **NOT RUN (frozen UI)** |
| `U6-L3-06` | Relink failed/unknown/stale; old source/history preserved | A5/A6/A8 | FIX-QUOTE, FIX-RACE | E9-05, E9-07 | **NOT RUN (frozen UI)** |
| `U6-L3-07` | Zotero error categories and explicit source-open fallback | A8 | FIX-LINK, FIX-ANNOTATION | E9-09 | **NOT RUN (frozen UI)** |
| `U6-L3-08` | Selection, keyboard, dialog scroll, focus and safe dismissal | A4/A8 | FIX-A11Y, FIX-MOBILE | E9-08 | **NOT RUN (frozen UI)** |
| `U6-L4-01` | Global status/note vs local Important/associations | A5/A6/A7 | FIX-PAPER, FIX-ASSOCIATION | E9-02 | **NOT RUN (frozen UI)** |
| `U6-L4-02` | Concurrent note/relink writes and conflict protection | A5/A6 | FIX-RACE, FIX-NOTE, FIX-QUOTE | E9-07 | **NOT RUN (frozen UI)** |
| `U6-L4-03` | Device Zotero deep link and stored vs linked file syncing | A8 | FIX-LINK, FIX-STORED, FIX-LINKED | E9-09 | **NOT RUN (frozen UI)** |
| `U6-L4-04` | Truthful draft/unknown-operation recovery or unavailability | A5/A7 | FIX-DRAFT, FIX-FAULT | E9-07 | **NOT RUN (frozen UI)** |
| `U6-L4-05` | Credential/permission/privacy boundaries | A4/A7/A8 | FIX-SECURITY, FIX-PRINCIPAL | E9-10 | **NOT RUN (frozen UI)** |
| `U6-L4-06` | Read-only Personal Workspace API and approved deep links | A4/A5 | FIX-WORKSPACE, FIX-PRINCIPAL | E9-11 | **NOT RUN (frozen UI)** |

**Audit:** exactly **26 unique original IDs** appear in this table (L1: 5, L2: 7, L3: 8, L4: 6). **No ID, name, test status or requirement is amended.** The canonical 67 UI-D decisions remain individually mapped in the original [ACCEPTANCE_TRACEABILITY.md](../ui/002/ACCEPTANCE_TRACEABILITY.md); this table adds architecture dependencies without inventing a new UI freeze.

## 3. Crosswalk for D007-A4..A8 native test registers (60 planned, NOT RUN)

| Source register | Original IDs (count) | Proposed E9 linkage | Principal necessary synthetic fixtures |
| --- | --- | --- | --- |
| [A4 Auth/Session](D007_A4_AUTH_SESSION_SECURITY.md) | `A4-01..A4-08` (**8**) | E9-08/10/11 | FIX-PRINCIPAL, FIX-SECURITY, FIX-MOBILE, FIX-WORKSPACE |
| [A5 API/Outcomes](D007_A5_API_CONTRACT.md) | `A5-01..A5-10` (**10**) | E9-01/02/04/05/06/07/10/11/12 | FIX-RACE, FIX-BATCH, FIX-NOTE, FIX-PROJECT |
| [A6 Data/Restore](D007_A6_DATA_SCHEMA_RECOVERY.md) | `A6-01..A6-12` (**12**) | E9-01/02/04/05/07/12 | FIX-PAPER, FIX-ASSOCIATION, FIX-MARKDOWN, FIX-BACKUP |
| [A7 Lifecycle/Privacy](D007_A7_DATA_LIFECYCLE_PRIVACY.md) | `A7-01..A7-14` (**14**) | E9-01/02/04/06/10/12 | FIX-MARKER, FIX-BACKUP, FIX-PRINCIPAL, FIX-NOTE |
| [A8 Zotero/Device](D007_A8_ZOTERO_INTEGRATION.md) | `A8-01..A8-16` (**16**) | E9-03/05/09/10 | FIX-ANNOTATION, FIX-PAGINATION, FIX-LINK, FIX-STORED/FIX-LINKED |
| **Total** | **60 planned design tests** | E9-01..E9-12 are **additional proposal IDs, not replacements** | No fixture physically created |

**POC-001** has its own POC-01..07 criteria and historic independent QA. Do not fold its 33 local mock tests into any of the above 60/26 counts or claim the remote provider portion of POC-01..07 passed.

## 4. Device/environment evidence field contract (M1..M8 remain unrun)

| Target | Required device/browser observations and evidence |
| --- | --- |
| **Windows** | OS build, Chrome/Edge/Firefox versions, Zotero desktop version/installed handler, two-origins auth behavior, mouse/keyboard focus, observed L1/L2/L3 result |
| **macOS** | OS version, Safari/Chrome/Firefox version, Zotero desktop version, permission prompt, app profile and correct attachment/annotation |
| **iPhone iOS** | Device model/OS, Safari + alternate browser, Zotero iOS version, stored vs linked file, configured storage, page hint, L1/L2/L3 separately |
| **iPad iPadOS** | Device model/OS, Safari + alternate browser, Zotero iPadOS version, keyboard/IME/safe area, same-device launch and native PDF availability |
| **Android phone/tablet** | Device/OS, Chrome + available alternative browser, Zotero Android app version, installed URI handler yes/no, L1/L2/L3 and explicit fallback. No universal link support assumed |
| **Shared cross-device controls** | Physical/simulator distinction, keyboard + VoiceOver/TalkBack as applicable, accessibility zoom/large text, online/offline state, WebDAV app sync setting (without credentials), personal vs group scope |
| **Privacy-safe capture** | Sanitized fake titles/IDs, no actual PDF content, username, real notes, tokens or Authorization/Cookie header; screenshots/video require separate device-test consent |

**Per-device results:** `PROVEN_L1`, `PROVEN_L2`, `PROVEN_L3`, `ATTEMPTED_UNVERIFIED`, `UNSUPPORTED`, `NOT_RUN`. L3 requires actually focusing the correct original annotation on that exact device/browser/app, not just opening a PDF or producing a URI. If browser cannot observe app outcome, the evidence must reflect that limitation.

## 5. Source preservation and next execution gate

- No tests have been run under D007-A9, no fixture files created and no QA labels changed.
- Frozen U6 cases may only be changed with separately user-approved `UI-AMEND` and a fresh traceability update. The present document references them without silently extending the 26-case acceptance into new POC requirements.
- Any future D007 QA run requires an exact scope/branch/path authorization, synthetic dataset creation permission, safe identity model, independent reviewer and exact SHA. Personal Zotero/PDF and real Nutstore access remain explicitly out of scope.
- POC-001 PR #2 independently reviewed head `65e14afc81e6de37ba5fac90c2937a27876c5614` remains **LOCAL_STAGE PARTIAL**, with four reproduced P1 and multiple P2, subject to its own [Design remediation](../handoffs/POC-001/REMEDIATION_01.md) and future exact-SHA re-QA. Nothing in A9 can mark its remediation done or authorize merge.

**Status: A9 TRACEABILITY AND FIXTURE CATALOG APPROVED AS DESIGN ONLY.**
