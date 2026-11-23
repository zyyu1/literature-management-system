# D007-A8 — Zotero Web API, Source Provenance and Cross-Device Open-in-Zotero Contract

**Decision:** **D007-A8 Option B APPROVED**, user authorization dated **2026-11-23 (Europe/Berlin)**.  
**Stage:** **INTEGRATION DESIGN ONLY / NO USER-ACCOUNT ACCESS / NO IMPLEMENTATION / NO DEVICE QA**.  
**Authoritative inputs:** [Module 002 frozen UX](../ui/002/DESIGN_APPROVED.md) and [approved interaction details](../ui/002/DESIGN_DRAFT.md); [D007-A4 server-side authentication](D007_A4_AUTH_SESSION_SECURITY.md); [D007-A5 API revision/outcome contract](D007_A5_API_CONTRACT.md); [D007-A6 canonical data/provenance](D007_A6_DATA_SCHEMA_RECOVERY.md); [D007-A7 privacy/lifecycle](D007_A7_DATA_LIFECYCLE_PRIVACY.md).  
**Separate running work:** [POC-001-REMEDIATION-01](../handoffs/POC-001/REMEDIATION_01.md) retains its original local/synthetic implementation branch, path allowlist and no-rebase direction. [ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md) still blocks all real Nutstore tests pending separate user-approved ACCESS-02.  
**Authority boundary:** no personal Zotero API key/OAuth consent request, Zotero Web API call, real PDF/annotation retrieval, app deep-link launch, remote file request, download/copy of PDF, UI amendment, code, provider account/paid service or deployment approved by D007-A8.

## 1. Responsibility and trust topology

```text
Windows/macOS/iOS/iPadOS/Android browser
  -> static website: Project/Literature/Research Note/Key Quotes
  -> separately authenticated safe API (D007-A4)
       -> narrowly scoped read-only Zotero Web API adapter (not connected)
            /users/{userId} or /groups/{groupId} ONLY when permitted
            -> parent bibliographic item + child attachment item(s)
            -> attachment child annotation item(s) IF readable
       -> website-owned storage adapter (D007-A5/A6, POC-gated)
            canonical paper, per-Project Association, global Note,
            manually saved Key Quotes, confirmed SourceHistory
  -> explicit user gesture: validated destination app URI (if supported)
       -> Zotero installation on SAME device
       -> Zotero's own attachment/file sync or on-demand download
       -> user-selectable fallback on unknown/unavailable launch
```

**Zotero stays authoritative** for bibliographic metadata, library/collection membership, original PDFs, stored/linked attachment records and native annotations. The website **does not replace Zotero or the Zotero file-sync mechanism**, does not download/republish/host cached PDFs, and does not mutate Zotero annotations. The proposed *second* Nutstore WebDAV for website-owned JSON/Markdown Notes is separate and conditional on POC-001; it does **not** become Zotero's attachment backend.

Neither a successful Web API metadata response nor an API-generated launch URI establishes that the device's Zotero app opened, that a PDF was downloaded, or that a particular source highlight was focused. Treat these as different observed capability levels.

## 2. Least-privilege identity and read-only API boundary

1. **User authorization is deferred:** when separately approved, use the smallest Zotero API credential scope allowing **read** of the selected personal library and explicitly permitted group libraries. Do not request edit/write/delete or full-account access as a convenience. Zotero Web API v3 is the intended interface, not a direct browser-to-WebDAV tunnel or unrestricted `localhost:23119` proxy. Zotero's **desktop local API** and its local read/write permissions are separate from the hosted Web API and must not be conflated.
2. Credentials and OAuth exchanges, if any, belong in an approved **server-side** secret store/adapter. The identity/authorization mechanism (e.g. user-created scoped key versus supported delegated authorization), consent text, rotation and revocation procedure require a **later explicit decision and test**. Never include Zotero API key, OAuth secret, Nutstore app password or Session Cookie in static assets, `zotero://` URLs, query parameters, browser local storage, repo, QA evidence or logs.
3. **Web API documented hosted read prefixes:** `/users/{userID}` and `/groups/{groupID}`. IDs must be verified from the correctly authorized library context; username, personal user ID and group ID are **not equivalent**. Enforce server-side allowlisted account, library type/id, item key, endpoint, method, response and output projection; **no arbitrary upstream proxy, provider URL or SSRF vector**. Public group visibility is not permission to disclose a private user's website-owned Note/Quote data.
4. **Read-only methods:** design GET-only upstream Zotero reads for selected metadata, Collection selection, child attachments and selected annotation discovery. Do **not** send Zotero write methods (POST/PATCH/PUT/DELETE), upload files, delete highlights, add tags, alter Collection membership or continuously sync the full library. *Website-owned* Project links, Reading Status, Notes and Quotes may be written only via their independently authorized, version-guarded D007-A5 interface.
5. **Runtime privilege check:** `/keys/current` can report privileges of a provided Web API credential; test it only under a later, distinct credential approval. A revoked/expired/insufficient credential must produce a distinguished auth/permission state, never be mislabeled no papers/no highlights. Scope every requested item and returned child to the authenticated owner/library and canonical paper.
6. **Minimal data retention:** only cache validated, authorized metadata/source identities as necessary; avoid indiscriminate annotation harvesting, Zotero attachment raw bytes, whole-library snapshots, third-party telemetry and unapproved data sharing. Site-created Note/Key Quote provenance is separately private and remains scoped per D007-A6/A7.

**Public references (not a live request):** Zotero Web API v3 basics, API keys, `/keys/current` and child routes: https://www.zotero.org/support/dev/web_api/v3/basics ; API sync/versioning: https://www.zotero.org/support/dev/web_api/v3/syncing .

## 3. Stable library, item, attachment and annotation identity map

| Logical identity | Candidate grounded Zotero source | Invariants and unresolved verification |
| --- | --- | --- |
| `CanonicalPaper` | **`(libraryType, libraryId, parentItemKey)`** from user/group library; stable internal `paperId` scoped to website owner | Title, DOI, PDF filename and collection are **not** canonical IDs. Library ID/type distinguish user/group; same Zotero item in multiple Projects still has one website global status and five-field Note |
| Zotero bibliographic parent | `/users/{userId}/items/{itemKey}` or `/groups/{groupId}/items/{itemKey}` | Zotero remains authoritative for title/authors/year/DOI and version; do not overwrite Zotero metadata through website |
| Collection (one-time import only) | `.../collections/{collectionKey}/items` or documented `.../items/top` variants | User-initiated, count, de-duplicate canonical papers, create only explicit Project Associations; no automatic monitoring or periodic Collection import |
| Attachment | Child item of parent from `.../items/{parentKey}/children`; **attachment's own Zotero itemKey** distinct from parent paper key | Handle **zero, one or multiple attachments**; classify MIME type and `linkMode` for stored/linked/web-link cases when fields available. Do not assume first child is PDF or parentKey is PDF deep-link key |
| Native annotation / highlight | Readable annotation records linked to the **specific attachment item**, potentially exposed from its `.../items/{attachmentKey}/children` endpoint; exact fields depend on Zotero API/client version | Preserve scoped `(libraryType, libraryId, attachmentItemKey, annotationItemKey)` when present, plus optional source version, `annotationText`, `annotationComment`, `annotationPageLabel`, `annotationSortIndex`, `annotationPosition` **only after field-level fixture/API verification**. Do not invent absent IDs/page data |
| Website Key Quote | Unique website `quoteId` + parent `paperId`, saved excerpt/comment and active `SourceReference` | Manual entry or **explicit user-selected highlight import** only; identical excerpt text is **not** identity and may occur legitimately |
| Source History | Ordered **confirmed website-side** source-link events for one Key Quote | Relink preserves quoteId, excerpt and user comment; history appended only with authority/revision-safe confirmed write (D007-A5/A6). Missing/deleted upstream highlight does not erase original saved Quote |

**Important API caution:** official Zotero Web API read documentation confirms children routes, while the exact PDF annotation representation, reader-specific position semantics and availability may vary; source annotation fields above are **candidate fields from documented/forum examples, not a proven guaranteed payload**. Collect *only synthetic/redacted schema examples* after separately authorized integration QA. A native Zotero Annotation and a website Key Quote remain distinct records even when linked.

**Cross-PDF page ordering:** annotation page label (e.g. printed `iv`) is not necessarily the PDF viewer's zero-based page index; `annotationPosition` and `annotationSortIndex` should not be treated as universal or directly transferable to a mobile URI. Group annotations by validated **attachment identity**, sort only within an attachment when a trustworthy sort order exists, otherwise label ordering/position unknown. User may select an attachment explicitly; no silent “pick first PDF” for ambiguous sources.

## 4. Bounded API request, pagination, cache/version and error contract

| Concern | Zotero public behavior / contract-first decision |
| --- | --- |
| Routes | Read selected `/users/{id}/items`, `/groups/{id}/items`, `.../items/{key}`, `.../items/{key}/children` and relevant Collection items, only after granted library/permission check |
| Pagination | Hosted Web API multi-object `limit` documented **1–100**, default **25**; use `Link: rel="next"` and `Total-Results`, bound client-requested pages and accumulated results. Do **not** treat one page as complete. The dynamic `next` URL must be checked against allowed exact Zotero host/library scope before following; never pass arbitrary returned URLs through a generic proxy |
| Cache & versions | Partition by owner, Zotero library type/id and authorized credential scope; use `Last-Modified-Version` / `If-Modified-Since-Version` for **multi-object** conditional reads as documented; `since` and `format=versions` are candidates for authorized incremental reads. A cached library version is not a revision for **website-owned** Note writes. Zotero desktop local API uses distinct versions and must not corrupt hosted Web API cache |
| Rate limiting | Honor `Backoff` on any response; on `429` honor `Retry-After` and reduce demand/concurrency. Official guidance recommends generally **no more than four concurrent requests**. No aggressive retry/poll; interactive import/highlight picker fetches are request-budgeted and stoppable |
| HTTP outcome | Distinguish 200 data, 304 not modified, 401/403 permissions/auth when actually observed, 404 missing item/annotation, 429 backoff, 5xx/timeout/offline. A 404 should not automatically imply a saved Key Quote or Source History is invalid or deletable; insufficient permission is not “empty library” |
| External writes | Zotero version headers and website D007-A5 `If-Match`/operation IDs belong to **different authorities**. Do not interpret Zotero `Last-Modified-Version` as proof that the separate website-owned WebDAV storage supports atomic writes |
| Cache privacy | Avoid storing Zotero keys as public access tokens; never cache private annotated text into public CDN or search indexes, leak via referrer/log, or serve stale private data across logout/owner/library changes. Cache lifetime and storage product remain **UNSELECTED** |

**No active background Zotero polling or full-library mirror is approved** by A8. Each manual item picker, Collection import and annotation picker must be a user-triggered, scoped read; if rate-limited or offline, retain previously confirmed user-written notes and quotes without pretending data was refreshed.

## 5. Stored vs linked attachments and the existing file-sync authority

1. **Stored attachments:** Zotero-managed copies can participate in Zotero's own configured **Zotero Storage or WebDAV file synchronization**, including supported mobile apps where the *same* file-sync configuration/account permits availability. Zotero's library item/annotation data sync is distinct from binary attachment file sync; downloading the PDF onto a device is performed by **the Zotero app** (sometimes on demand), not the website.
2. **Linked attachments:** Zotero holds a desktop filesystem link and does **not** synchronize that linked file via Zotero file syncing. They are **not supported as a remotely downloaded PDF** in Zotero iOS/Android solely by selecting WebDAV. Mark as `linked_attachment_mobile_unavailable`/equivalent truthful capability instead of promising one-tap PDF access; potential conversion to stored files is a **manual Zotero-owner action outside this website**, not a website job.
3. **Already established user's Zotero attachment sync:** continue respecting its *existing* Nutstore WebDAV provider, without connecting the literature-management server to that file account, deriving or reusing its password, or copying PDF bytes. The possible **second** Nutstore account stores only proposed website-owned JSON/Markdown and remains blocked by POC-001 ACCESS-02.
4. **Each mobile device requires its own correct Zotero app file-sync setup**, including matching account/supported WebDAV method, network and file entitlement. Item metadata visibility is not evidence the PDF file actually exists/is downloadable on that device; a missing/offline/locked PDF is a separate observed outcome.
5. **Group library caveat:** group library file storage and rights can differ from personal-library WebDAV file-sync behavior; do not assume a personal WebDAV configuration automatically carries group attachments. Test with a separately approved synthetic/demo group or mark unsupported.
6. **No web PDF hosting:** no S3/object-storage mirror, browser `blob:` PDF preview, raw Zotero file endpoint download, server cache, temporary PDF copy or bulk upload. Browser actions only launch Zotero/website metadata/navigation or copy the user's saved excerpt. PDF and original annotation content remain controlled by Zotero.

Official references: https://www.zotero.org/support/attaching_files ; https://www.zotero.org/support/sync ; https://www.zotero.org/support/kb/files_not_syncing .

## 6. User-initiated Open in Zotero and fallback hierarchy

**Three capabilities must be scored separately:**
- `L1 APP_HANDOFF`: a real Zotero app on the **same device** visibly launches under an explicit user gesture.
- `L2 ATTACHMENT_OPEN`: the intended **specific PDF attachment** opens (including download/permission if required).
- `L3 PRECISE_SOURCE_FOCUS`: the correct **original annotation/highlight** becomes selected or focused; a page hint alone is **not** L3.

A `zotero://` URI **being emitted or clicked is not evidence of any of these**. App-installed checks, callback visibility, mobile browser prompts and in-app behavior differ. Do not silently auto-launch alternative URLs or infer success from timers / absence of an error. Preserve user choice, accessible buttons and non-automatic fallbacks already frozen in UI-D005.2b.

### 6.1 Candidate link research — never mark as passed without device proof

- **iOS/iPadOS:** A Zotero Team forum response dated **2025-02-26** says the same `zotero://` links should work on iOS and gives examples:
  - `zotero://select/library/items/{key}`
  - `zotero://open-pdf/library/items/{key}`
  The `{key}` **needs the correct native target key (normally PDF attachment for open-pdf), not blindly the parent bibliographic item key**. Group-library path forms, specific annotation/page query syntax, app version behavior and browser dispatch must be **verified rather than synthesized**.
- **Windows/macOS:** Desktop Zotero has custom URI handoff examples, but actual launch and PDF/annotation focusing from supported browsers require explicit test at pinned Zotero/browser versions. Distinguish app selection from PDF opening. Local API is **not** the default integration path.
- **Android:** Forum reports dated **2026-06-25** (with a further report 2026-09-06) indicate `zotero://open-pdf` or `zotero://select` was **not reliably supported**. Label Android native deep link as **UNVERIFIED / MAY BE UNSUPPORTED**, not a promised capability. A website's web-library fallback is a separate user choice; do not claim it always opens in the Android app.
- **Exact source focus:** no general cross-platform guarantee for passing annotation ID, page label or position in an app URI. Store source keys/page hints as metadata only; enable `PRECISE_SOURCE_FOCUS` only after a measured test proves the intended annotation, not merely the paper, opened.
- **Multiple PDFs:** prefer the verified `attachmentItemKey` already associated with the Key Quote's source. If no specific attachment mapping exists, request explicit selection or show an honest ambiguous-source fallback rather than redirect to an arbitrary child.

**Platform exception handling:** absent app, browser refusing scheme, blocked OS handler, unconfigured file syncing, missing file, lost permission, modified/deleted highlight, app successfully opening wrong item, and offline PDF must be independently classified. Avoid security-sensitive automatic redirects. A user-initiated `https://www.zotero.org/...` **web-library URL** may be presented only when derived from a known authorized item identity and correct target path; no invented URL shape or leaked API key.

### 6.2 Frozen progressive fallback for Paper and Key Quote

| Ordered user-selectable action | Preconditions | Honest displayed promise |
| --- | --- | --- |
| **1. Open Original Highlight** | Verified device/browser/app support + correct authorized library, attachment and original annotation ID + successful end-to-end precise-focus QA | Opens that native highlight **only on tested combinations**; otherwise never claim precise focus |
| **2. Open PDF / Paper with Page Hint** | Verified per-device attachment/path scheme and stored file sync; if annotation focus is absent, a page label may be displayed as an **unverified hint**, not silently converted to exact PDF page index | Attempts same-device Zotero PDF/paper open; actual device outcome remains unverified unless witnessed. For missing/linked PDF, expose appropriate limitation |
| **3. Copy Saved Excerpt / Show Source Unavailable** | Quote saved by website and authorized for current user, even if Zotero annotation has disappeared | Preserve original excerpt, personal comment and confirmed SourceHistory; copying excerpt requires deliberate user action and never edits Zotero |

Fallback controls must remain available after failed/unknown launch attempts. **Do not automatically step through a chain of deep links and web redirects**, especially on mobile, and do not assert exact annotation navigation from a `zotero://open-pdf` link alone. For bibliography-only papers without PDF, offer the validated generic item selection or authorized web library option where supported; never display “Open PDF” as if a PDF is known.

## 7. Key Quote picker, source failure and confirmed history semantics

- **Explicit picker only:** on demand for **one canonical paper**, traverse its authorized PDF attachment(s), fetch eligible native annotations *if exposed by the selected API* and present searchable, attachment-grouped options. Preview available text, comments/page/positions as provided; differentiate `LOADING`, `EMPTY_CONFIRMED`, `NO_MATCH`, `FORBIDDEN`, `OFFLINE`, `SOURCE_MISSING` and `UNSUPPORTED_FIELDS`. No background import-all or mirror of the user's annotation database.
- **Dedup by provenance:** link to a uniquely identified Zotero annotation only when full library+attachment+annotation identity matches; never dedup solely by text. A manually typed identical excerpt is still a different user quote unless explicitly selected.
- **Add Selected:** create website Key Quotes only after user's affirmative selection and confirmed D007-A5 revision-safe persistence. Picker dismissal, failed API refresh and page navigation cannot create Quotes. No write to Zotero.
- **Original changed/deleted:** distinguish missing from temporary API failure; preserve website excerpt/comment and last-confirmed source, show appropriate source availability and manual Relink. Do not silently replace with a fuzzy-matched highlight.
- **Manual Relink:** validate new candidate source in current authorized library/attachment, require user confirmation, preserve quote identity/excerpt/comment, and atomically update active source + ordered SourceHistory **only if website storage proves it can safely commit this logical transition**. POC-001 and D007-A6 transaction gates remain unresolved. On `CONFLICT`/`UNKNOWN`, preserve last-confirmed source and reversible local intention, no invented history entry.
- **Page-order precision:** if `annotationPageLabel`, sort index and display-page mapping are incomplete, group by attachment and present unknown/page-label instead of fabricating a single global page sequence across multiple PDFs.

## 8. Explicit cross-device/browser QA matrix (DESIGN ONLY)

Every target must be recorded by **OS version, physical device, browser/version, Zotero app/version, library scope, attachment `stored/linked` type, Zotero file-sync mode and online/offline condition**. For real credentials/notes/PDFs, separate user approval is mandatory; prefer user-controlled synthetic/throwaway Zotero fixtures. **This matrix is neither permission to execute tests nor a claim they have passed.**

| Matrix ID | Device / browser combinations to test | L1 app | L2 exact PDF | L3 original annotation | Fallback and sync checks |
| --- | --- | --- | --- | --- | --- |
| **M1 — Windows** | Windows desktop: Chrome + Edge + Firefox, installed Zotero desktop | **NOT RUN** | **NOT RUN** | **NOT RUN** | `select` vs `open-pdf` item/attachment keys; app absent, wrong profile, app open/closed |
| **M2 — macOS** | macOS desktop: Safari + Chrome + Firefox, installed Zotero desktop | **NOT RUN** | **NOT RUN** | **NOT RUN** | user gesture, browser permission prompt, group-library keys, multiple PDFs |
| **M3 — iPhone** | iPhone iOS Safari + one installed secondary browser, Zotero iOS | **NOT RUN** | **NOT RUN** | **NOT RUN** | stored PDF downloaded/not downloaded; WebDAV configured, offline, 2025 team URI examples |
| **M4 — iPad** | iPad iPadOS Safari + secondary browser, Zotero iPadOS | **NOT RUN** | **NOT RUN** | **NOT RUN** | same-device app launch, page hint vs exact highlight, PDF unavailable, annotation changed |
| **M5 — Android** | Android phone Chrome + Firefox where available, Zotero Android | **NOT RUN / SUSPECT UNSUPPORTED** | **NOT RUN** | **NOT RUN** | no URI scheme handler, fallback to Zotero web library/manual search, stored/linked distinction |
| **M6 — Android tablet** | Android tablet Chrome + browser alternative, Zotero Android | **NOT RUN / SUSPECT UNSUPPORTED** | **NOT RUN** | **NOT RUN** | WebDAV per-device config and on-demand retrieval, permissions, attachment choice |
| **M7 — permission/sync** | One supported platform per personal/group library, stored/linked/no PDF, no WebDAV vs wrong WebDAV setup | **NOT RUN** | **NOT RUN** | **NOT RUN** | permissions must not be shown as empty/no highlights; group file syncing is independent |
| **M8 — resilience** | Each supported mobile platform: app missing, browser blocks URI, offline, changed original annotation, two PDFs | **NOT RUN** | **NOT RUN** | **NOT RUN** | explicit page/paper fallback and Copy Excerpt, no data loss or automatic fallback chain |

**Exit criteria for a particular platform:** show independent reproduction of the **right target**, not just `window.location`/URI dispatch; record screen-visible outcome without exposing real content. Platform confidence labels: `PROVEN_L3`, `PROVEN_L2`, `PROVEN_L1`, `ATTEMPTED_UNVERIFIED`, `UNSUPPORTED`, `NOT_RUN`. Cross-platform “works everywhere” needs every required platform independently measured; do not generalize an iPad result to Android.

## 9. Planned requirements-to-tests register (A8-01..A8-16; all NOT RUN)

| ID | Future synthetic / separately authorized validation | Acceptance boundary |
| --- | --- | --- |
| **A8-01** | User/group libraries with identical item keys and multiple Project associations | Full scoped canonical key; only one global status/Note per correct paper, no cross-user leakage |
| **A8-02** | Read-only Zotero API key with insufficient library/group permission and later revocation | Reject unauthorized data, distinguish forbidden from empty, no frontend credential |
| **A8-03** | Malicious upstream URL/redirect/pagination link, unknown library ID and item-key injection | Strict upstream host/library/path allowlist, no SSRF or out-of-scope follow |
| **A8-04** | One-time Collection import with >100 items, page limits, `Link`, `Total-Results` | Complete bounded pagination and no duplicated global paper/notes |
| **A8-05** | `Last-Modified-Version`, 304, `since`, cache owner switch | No cross-account cached private data, no wrong empty result, no Zotero→website revision conflation |
| **A8-06** | `Backoff` and 429 / Retry-After plus offline/5xx | Bounded adaptive requests; no aggressive retry or silent Import/Picker failure |
| **A8-07** | Parent + zero/one/multiple stored PDF attachments and HTML/link-only children | Correct per-attachment identity, explicit source choice, never first-child blind PDF assumption |
| **A8-08** | Stored vs linked attachment on each mobile device with correct/incorrect WebDAV file-sync config | Only available stored files claimed downloadable; website never handles PDF bytes |
| **A8-09** | Annotation identity+field variability / page label vs viewer page index / missing position | No invented exact location or cross-PDF sort; preserve available hints |
| **A8-10** | Explicit highlight picker import, repeated annotation selection, Cancel | Only user-selected new Key Quotes, no blanket sync, no text-only dedup, no Zotero mutation |
| **A8-11** | Original annotation changed, removed or inaccessible | Website excerpt/comment and last confirmed SourceHistory remain intact; manual reviewed fallback |
| **A8-12** | Relink with concurrency, lost acknowledgment and backend without atomic source-history update | No false success/history; `UNKNOWN` and safe stop under POC unresolved |
| **A8-13** | Windows/macOS Chrome/Edge/Safari/Firefox where supported; app installed/missing | L1/L2/L3 distinguished; right paper/attachment and user-selectable fallback |
| **A8-14** | iPhone/iPad Safari + alternate browser; same-device Zotero mobile with WebDAV file sync | Native handoff and exact PDF tested separately; page/annotation focus not inferred |
| **A8-15** | Android phone/tablet with current app/browser and absent URI handler | No universal deep-link promise; clear manual/web-library/copy-excerpt fallback |
| **A8-16** | Group-library scope, offline, multiple PDFs, privacy/log/credential scan and read-only workspace client | No cross-user access, PDFs/credentials in website, automatic redirect chains or writable Zotero paths |

**QA requirements:** later independent execution must pin exact PR SHA, device/OS/browser/app versions, fake library/attachment IDs or separately approved throwaway fixtures, user-visible outcomes and sanitized evidence. All 16 A8 scenarios and M1–M8 matrices are **DESIGN-ONLY / NOT RUN**, separate from the frozen Module 002 26 scenarios and current POC-001 repair QA.

## 10. Real-credential and device-test gates / STOP

- **Design → Execution:** A8 approval creates no execution job. Future limited integration POC requires a fresh approved scope, separate branch, synthetic/throwaway library, minimum API scopes, safe secret injection and revocation, exact Web API methods, test devices, affected services and explicit STOP. Never reuse or expand the current POC-001 repair work/PR #2.
- **Real Nutstore:** still forbidden without separate POC-001 ACCESS-02. A8 does not ask for, receive or test any Nutstore password. Per-device personal Zotero WebDAV attachment configuration is **Zotero-client-owned**, not website-managed.
- **Explicit P0 STOP:** private Zotero library leakage, privilege bypass, API key/Session Cookie or WebDAV credential in frontend/URL/logs, cross-user note/quote disclosure, accidental PDF copy, unintended original-annotation changes, silent data loss or history corruption.
- **Accuracy STOP:** if exact attachment identity, page/annotation URI routing, mobile app launch or source mapping cannot be proven, label **UNSUPPORTED/UNVERIFIED** and expose the frozen fallback. If a product goal requires universal Android one-tap opening, return for **new Design decision**, not a fabricated PASS.
- **User controls:** no unsolicited Zotero login prompt, new API token registration, real app opening, cloud account setup, library export or silent device testing under D007-A8.

## 11. Source verification register (public docs/forums checked 2026-11-23; not private data)

1. [Zotero Web API v3 — Basics](https://www.zotero.org/support/dev/web_api/v3/basics): user/group library prefixes, parent/children requests, pagination limit/default and Link/Total-Results, auth header, rate limits/backoff, 304/cache and hosted/local distinction.
2. [Zotero Web API v3 — Syncing](https://www.zotero.org/support/dev/web_api/v3/syncing): library/object versions and `If-Modified-Since-Version`, `since` and permission inspection.
3. [Zotero — Adding Files](https://www.zotero.org/support/attaching_files): stored vs linked attachment and lack of linked-mobile support.
4. [Zotero — Syncing](https://www.zotero.org/support/sync): data sync separate from Zotero Storage/WebDAV attachment file sync.
5. [Zotero — Files Not Syncing](https://www.zotero.org/support/kb/files_not_syncing): file config mismatches and missing attachments.
6. [Zotero Team — iOS/iPadOS URI examples, Feb 26 2025](https://forums.zotero.org/discussion/122162/ios-ipados-link): `zotero://select/library/items/{key}` and `zotero://open-pdf/library/items/{key}` should work on iOS; not proof of every browser/app/version.
7. [Android `zotero://` support reports, Jun 25 2026](https://forums.zotero.org/discussion/132385/zotero-links-on-android): `open-pdf` apparently not supported; anecdotal, not an all-device final verdict.
8. [Android `zotero://` bug reports, 2024–Sep 2026](https://forums.zotero.org/discussion/119585/android-bug-zotero-uri-zotero-open-pdf-or-zotero-select-do-not-work): additional uncertainty.
9. [Annotation fields/children API discussion](https://forums.zotero.org/discussion/90753/zotero-beta-integration-with-external-note-taking-tools): example that annotations may be exposed as attachment children; exact schema and access need proof.
10. [Annotation API creation feature request, Jun 2026](https://forums.zotero.org/discussion/132273/feature-request-expose-api-for-programmatic-pdf-annotation-creation-highlights-notes): underscores why **read-only** annotation feasibility must be separately verified and write capabilities must not be assumed.

**Next independently actionable DESIGN decision (proposal only):** **D007-A9 — end-to-end synthetic integration fixture catalog, cross-module evidence traceability and independent QA gates**, combining D007-A4..A8 architecture contracts with existing frozen UI scenarios *without running tests or expanding POC-001*.

**Final state:** **D007-A8 APPROVED OPTION B AS DOCUMENTATION ONLY.** **NO WEB API LOGIN; NO PRIVATE PDF/ANNOTATIONS; NO DEEP-LINK TEST RUN; NO APP/CLOUD CODE OR DEPLOYMENT; POC-001 REMEDIATION UNCHANGED.**
