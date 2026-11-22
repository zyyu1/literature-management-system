# Module 002 — Web UI & Interaction Design Draft

**Design stage:** IN PROGRESS / NOT FROZEN  
**Owner:** Design Window  
**Updated:** 2026-11-22 (Europe/Berlin)  
**Product baseline:** [LMS Requirements & Architecture v0.1](../../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md)  
**Code status:** NOT AUTHORIZED. This document records UI decisions; it is neither `DESIGN_APPROVED.md` nor `EXECUTION_INSTRUCTION.md`.

## Scope of Module 002

1. **Projects Home** — overview, navigation, create/edit/manage Projects and summary of literature progress.
2. **Project Literature List** — show project-linked Zotero items, manual and one-off Collection import, global reading state, search and filter.
3. **Literature Detail** — Zotero metadata, one global structured research note and Zotero-linked Key Quotes, actions to open PDF in the current device's Zotero app where supported.
4. Responsive desktop/tablet/mobile states; loading/empty/error/conflict and accessibility flows to be designed.

## Approved decisions

### UI-D001 — Projects home layout: APPROVED

User selected **Option C: hybrid Cards / List switchable view** on 2026-11-22.

- Default view is a Project card grid; provide a visible way to switch to a compact Project list view.
- Both views represent the **same** Projects and actions, with no duplicated Project identities or data.
- Responsive mobile presentation adapts to a single-column layout.
- Card/list information density and progress display are now approved in UI-D003; no demo numbers are actual library counts.
- Selection persistence, sort order, available quick actions and error-state details are **not yet decided**.

### UI-D002 — Project lifecycle and actions: APPROVED

User selected **Option B: Create / Edit / Archive / Restore / Permanently Delete with a second explicit confirmation** on 2026-11-22.

- **Create:** provide a New Project action and fields for Project name (required) and description (optional). Create a new Project identity; does not copy or create Zotero items.
- **Edit:** allow changing Project name and description without replacing the Project identity or modifying paper data.
- **Archive:** keep the Project and its membership records for later recovery; distinguish archived from active in navigation (precise filtering / placement in UI-D003).
- **Restore:** reverse archive without creating a new Project identity.
- **Permanent delete:** must include a separate, explicit confirmation that names the affected Project and discloses the irreversible removal of **Project and its Project–Literature associations**. Never treat archive as permanent deletion.
- **Critical D001 preservation:** permanent Project deletion removes neither canonical Zotero items nor the globally shared reading state, global research notes, Key Quotes, original Zotero annotations or source PDFs, even when a Project is the sole one referencing a paper. In particular, paper records must not be cascade-deleted by Project deletion.
- Confirmations, archive discovery, field-level validation and optimistic-state behavior will be specified later with responsive/error UI; no code is authorized by this partial decision.

### UI-D003 — Projects Home information density: APPROVED

User selected **Option B: Standard** on 2026-11-22.

- In both the Card and List views, display **Project name**, **optional description** (if present), **total number of linked literature items**, counts of **To Read / Reading / Read** and a visible **reading progress bar**.
- Show functional **Project search**, **sorting controls**, and a way to **view archived Projects**. Both layout modes operate on the same Project records and global reading-state counts.
- In list mode, present the same core information in compact row/column form; mobile adapts to a single-column presentation as decided in UI-D001.
- Reading progress refers to the proportion of items in the Read state out of the project's linked item total. An empty Project must show an honest zero/empty state, not invented progress.
- Archived Projects must remain discoverable and restorable under UI-D002; their archival state must not affect the underlying linked literature's global reading status or note.
- Specific sort keys, default ordering, search matching fields, view-preference persistence, number formatting and empty-state copy are **still design details to settle**, not implicitly approved.
- Any previous example Project names and paper counts are dummy UI data, not actual user statistics.

### UI-D004 — Project Literature List responsive layout: APPROVED

The user selected **Option B: responsive table on desktop / compact paper cards on phone / adaptive tablet** on 2026-11-22.

- **Desktop:** the Project Literature page uses a table/list with structured bibliographic fields and reading status. Clicking a paper opens the single global Literature Detail record (D001), not a Project-specific duplicate.
- **Phone:** switch to compact literature cards with readable title, core metadata and reading-state access; no forced horizontal table scroll for normal reading.
- **Tablet:** adapt table density or switch to compact cards according to available width and legibility; the breakpoint and exact responsive rules remain to be designed.
- Table and mobile cards display the same underlying Project-to-literature associations and globally shared reading statuses. A status change in one Project must be reflected in every Project containing the same paper.
- Previous sample papers, years, authors and reading states are illustrative UI fixtures, not actual Zotero records.
- Search, reading-state filtering, sorting, one-off Zotero import, multi-select and bounded batch management are approved in **UI-D004.1**. Table column fields and sorting are approved in UI-D004.2; default order, interaction-state details and precise mobile action placement remain to be refined.

### UI-D004.1 — Project Literature List standard management: APPROVED

The user chose **Option B: Standard Management** on 2026-11-22.

- **Search:** search within the current Project's linked literature.
- **Filter:** filter by the three approved global reading states: To Read / Reading / Read, with an All view.
- **Sort:** provide sorting control; the exact sort keys and default ordering remain to be specified.
- **Add Papers via Zotero:** (1) search the user's Zotero library and select one or multiple paper items; (2) select a Zotero Collection for a **one-time** batch import. Re-importing an existing Zotero item does not create a duplicate global literature identity or duplicate Project association. No continuous Collection-to-Project synchronization.
- **Multi-select:** select multiple literature rows/cards to operate on a batch within the current Project.
- **Bulk change reading state:** update the *single global* reading status for the selected canonical papers, and make the scope clear to the user: the changed states will appear in **all** Projects containing those papers, not just the current Project.
- **Remove Project associations (amended by UI-D004.3b-R1):** for one or multiple selected papers, provide two explicitly labeled unlink scopes: **Current Project only** (default, existing behavior) or **All Projects including the current Project** (remove every Project–Literature link for each selected canonical paper). Neither scope deletes the Zotero item, PDFs, Zotero annotations, global reading status, global Research Note or Key Quotes. The all-Projects operation is global *unlinking*, **not global literature deletion**.
- **No advanced bulk features in this approved scope:** do not infer bulk links to other Projects, bulk tag editing or complex faceted filters.

### Still to detail after UI-D004.1

Bibliographic fields and four sorting criteria are approved in UI-D004.2, and the default descending Project-added sort in UI-D004.3. Search fields and scope are approved in UI-D004.3a; exact matching semantics, bulk action placement on mobile, exact scope confirmation wording, uncertain-outcome and import loading/error/permission state presentations remain pending; graded confirmations and result counts are approved in UI-D004.3b. No live Zotero integration has been tested by this design approval.

### UI-D005 — Literature Detail main responsive layout: APPROVED

The user selected **Option B: two columns on desktop / a single column on mobile** on 2026-11-22.

- The desktop Literature Detail page has a **left column for the structured Research Notes** and a **right column for Zotero-linked Key Quotes and bibliographic metadata**.
- Mobile displays the content in **one readable vertical column**, not a compressed two-column layout; tablet responsive behavior adapts to usable width and is yet to be specified precisely.
- Literature title, authors and other Zotero metadata remain **source-attributed**; do not imply the website edits original Zotero metadata.
- Show an **Open in Zotero** entry point for the same canonical paper; precise deep-link support, annotation-focused navigation and fallbacks require device-level verification and later interaction design.
- Research Note fields remain globally unique per canonical Zotero item (D001), including research question, arguments/content, theories/methods, innovations/contributions, and limitations. Key Quotes are source-linked excerpts of the same global paper rather than copies per Project.
- **Still to refine:** Markdown toolbar/export refinements and per-field preview focus behavior; concrete draft/error/conflict UI details, quote-linking refinements/sorting, mobile stacking order, edit affordances and exact responsive breakpoints. Autosave + Save Now was approved separately in UI-D005.1.
- This is the **layout decision only**; do not expand its scope into unapproved UI-D005.1 / UI-D006 save behavior or implement code.

### UI-D005.1 — Research Notes saving: APPROVED

The user selected **Option C: Autosave + Save Now** on 2026-11-22. This decision governs the **saving experience**; the Markdown editing format is now independently approved in UI-D005.1a.

- While editing the five global Research Note fields, offer **automatic saving** after an appropriate pause in input, as well as an explicit **Save Now** action. The precise debounce duration is an implementation detail subject to QA and a practical UX review.
- Display **unambiguous save status**: at minimum `Unsaved changes`, `Saving`, `Saved`, `Offline/local draft`, `Save failed` and `Conflict` when relevant. Do not claim `Saved` from a local cache or optimistic UI alone: only a confirmed remote write may show it.
- **Network interruption:** protect edits as recoverable drafts rather than silently dropping text. Clearly disclose if a draft is only local or has not yet reached the remote store. Offline draft recovery and field-level conflict comparison are approved in UI-D005.1c. The exact local persistence mechanism, encryption/privacy behavior and device/browser limits require technical security review; do not promise cross-device availability of an unsynced draft.
- **Reconnection:** safely retry saves after network recovery only with concurrency checks, or require review when a conflict is detected. Never silently overwrite a newer edit from another device.
- **Multi-device safety:** detect stale revisions/ETag or equivalent version conflicts, block destructive overwrite, and offer a visible path to preserve and resolve both versions. Do not assume Nutstore WebDAV supports a particular conditional-write mechanism until **POC-001** demonstrates it.
- **Save Now:** requests the same safe write pathway; it must not bypass revision checking or force the user into overwriting another device's changes.
- One canonical Research Note is shared across Projects as required by D001; saving from one Project must not create separate Project-specific note copies.
- Saved-state UI, conflict examples and error handling require independent QA after implementation. Approval of this UI behavior does **not** prove WebDAV feasibility or grant any live provider credentials.

### UI-D005.2 — Key Quotes manual entry + selective Zotero highlight linking: APPROVED

On 2026-11-22 the user chose **Option B: manual Key Quotes plus selective attachment of existing Zotero highlights**.

- **Manual entry:** Add a Key Quote by entering the excerpt text, optional original PDF page number, optional source/annotation link, and optional user-written commentary. Retain a stable local quote identity.
- **Selective highlight import:** Offer a user-invoked picker of **existing highlights/annotations from the current canonical Zotero paper**; users choose which specific highlights become Key Quotes. Preserve source linkage (Zotero item/attachment and annotation identity where available), exact text and PDF page/position data where the Zotero API provides them. Show clear source attribution.
- **No blanket sync:** Do **not** automatically import every Zotero highlight, watch Zotero annotations in the background, or silently create new Key Quotes on subsequent page loads. The Zotero annotation library remains Zotero's source of truth.
- **No duplication:** Selecting the same Zotero annotation again must not silently create duplicate Key Quotes for that global paper. Multiple manually authored quotes may share text; text equality alone is not a reliable annotation deduplication key.
- **Optional personal commentary:** A Key Quote may include an independent personal research comment. Do not modify the source Zotero highlight when the user edits this website's comment or decides to remove a Key Quote.
- **Open Source:** Provide an action to open the original item/annotation in Zotero where supported, with a visible fallback when the device cannot deep-link precisely. Do **not** claim exact-page/highlight navigation is proven before cross-device testing.
- **Global ownership:** Quotes belong to the canonical literature record across all Projects (D001). Removing a paper from a Project, or deleting the Project, must not delete its Key Quotes.
- **Feasibility gate:** Zotero Web API highlight retrieval, annotation identity fields, pagination/permissions, attachment and cross-device deep links need a separate integration check. User approval of this UI flow is not an assertion those checks have passed.

**Picker presentation is now approved as UI-D005.2a.** Page-order sorting is approved in UI-D005.2c; changed/removed Zotero annotations and retry/error states remain UI-D005.2d/UI-D006 refinements; source-link fallback is approved in UI-D005.2b. No automatic synchronization is authorized.

### UI-D005.1a — Research Notes Markdown editor: APPROVED

On 2026-11-22 the user selected **Option B: five independent Markdown fields with a toolbar, preview and Markdown export**.

- Exactly five separately editable Markdown sections: **Research Question**, **Arguments & Content**, **Theories & Methods**, **Contributions & Innovations**, and **Limitations**.
- Each section accepts Markdown text and provides simple editing controls for common formatting (such as headings, bold, italics, lists and links). The controls must affect the section currently being edited, not another field.
- Provide a preview of the rendered Markdown without changing the source. It must safely render untrusted Markdown, without executing embedded HTML/scripts or unsafe links.
- Provide an **Export Markdown** action for the complete structured research note, with labeled section headings and existing content preserved; the export must be suitable for opening in Typora. Export must truthfully distinguish locally unsynced text from remotely saved text and must not be misrepresented as a cloud backup.
- Preserve each field as part of **one global Research Note per canonical Zotero item** (D001); do not create separate notes for each Project or overwrite other sections when editing one.
- Inherit **UI-D005.1** autosave + Save Now, offline local draft, remote-acknowledged Saved and safe multi-device conflict detection. An editor change must not silently bypass conflict handling or drop Markdown source formatting.
- The exact toolbar icons, edit/preview toggle design, export filename and file metadata are UI refinements. No rich-text/Notion-style editor or word-processor document formats are implied.
- The planned second Nutstore WebDAV storage remains conditional on POC-001; this UI approval does not authorize live integration.

### UI-D005.2a — Zotero highlight picker presentation: APPROVED

The user selected **Option B: desktop right-side panel, mobile full-screen picker, with search, multi-select and original-text preview** on 2026-11-22.

- **Desktop:** Add from Zotero opens a side panel on the right of Literature Detail, preserving visible reading/note context where practical. The side panel is transient and does not replace or duplicate the paper detail page.
- **Phone:** use a full-screen picker optimized for touch, with a clear Back/Close affordance returning to the same paper. Tablet presentation adapts to available width.
- **Selection workflow:** load available highlights associated with the current canonical Zotero paper on demand, search among available highlights, preview their quoted text and available page/source details, select multiple items, then invoke an explicit **Add Selected** action to create Key Quotes.
- **Already linked:** mark an existing linked annotation clearly (ideally not selectable for duplicate import). Dedupe by source annotation identity where available, **not by excerpt-text equality alone**.
- **Review/cancel:** closing without Add Selected must not create Key Quotes. Preserve pending selections during temporary panel viewing where appropriate, but do not imply a committed import.
- **No full-library sync:** keep the prior UI-D005.2 rule: select highlights deliberately, no auto-import-all, no background listener or edit of original Zotero annotations.
- **Technical qualifications:** exact annotation retrieval and source-link navigation require separate Zotero API/mobile-deep-link verification; if the API or a device does not support precise source jump, provide an honest fallback rather than asserting an unsupported action.

**Highlight default page order is approved in UI-D005.2c.** Classified empty/loading/permission/error states are approved in UI-D005.2d. Still pending: detailed detection/relink policy for changed Zotero annotations, exact fallback copy, keyboard/focus restoration and mobile safe-area behavior. The progressive source-open fallback is approved as UI-D005.2b; track picker sorting, source changes and accessibility under UI-D005.2c/UI-D006.

### UI-D004.2 — Literature fields and sorting: APPROVED

On 2026-11-22, the user selected **Option B: standard bibliography table/card density and four sorting criteria**.

- **Desktop table:** display **paper Title**, **Authors**, **Publication Year**, **global Reading Status** and a per-paper **Actions menu**. Keep UI-D004.1 selection checkboxes/actions available without sacrificing title readability.
- **Mobile compact cards:** display the essential paper information (title, author summary, year and global reading status) in a touch-friendly compact layout, with access to the Actions menu and selection/batch operations. Do not force horizontal scrolling to expose normal actions.
- **Tablet:** adapt the desktop table or mobile card density as dictated by usable width (UI-D004), while keeping the same data identities and permissions.
- **Sorting controls must include:** **Publication Year**, **Title**, **Reading Status**, and **Date Added to the Current Project**. Project-added time refers to the Project–Literature association timestamp, **not** Zotero's library-added or last-modified timestamp.
- **Source of truth:** metadata fields originate in Zotero; reading status is the one global status across Projects. The Actions menu must offer the UI-D004.3b-R1 unlink scope choice (current Project only or all Projects) and **never erase** a canonical paper, PDF, shared note or Key Quote.
- **No custom column editor** or extra mandatory columns for journal, DOI or citation metrics are approved under this standard-density choice.
- **Default sort is approved in UI-D004.3:** current-Project association created time descending. Remaining: alternate sort direction/null-year behavior, search matching, mobile bulk-selection affordances and confirmation/loading/error states.

### UI-D005.1b — Per-field Markdown Edit / Preview: APPROVED

On 2026-11-22, the user chose **Option A: independent Edit / Preview toggle for each of the five research note fields**.

- Each of the five existing Markdown sections has its own **Edit** and **Preview** modes. Switching one field must not change the mode or contents of the other four fields.
- **Edit** is the default mode; the field's Markdown toolbar remains usable for common formatting in Edit. **Preview** renders the field's current Markdown safely and read-only, without altering or replacing its underlying source text.
- Returning to Edit restores the same source text and current draft, including text that has not yet been remotely saved; mode switching must not discard or silently submit edits.
- Existing **autosave + Save Now** and the remote-acknowledged Saved rule from UI-D005.1 continue regardless of Edit/Preview mode. A preview render or toggle is not equivalent to confirmed persistence.
- Full-note Markdown export (UI-D005.1a) remains supported and must export the five labeled fields without mutating them.
- The switch must be keyboard accessible and discoverable on desktop, tablet and phone.
- Exact toolbar design, focus/caret restoration, local draft persistence, conflict resolution and export filename are **still pending implementation/UX refinements**. UI approval does not verify Nutstore WebDAV feasibility or authorize code.

### UI-D005.2b — Key Quote source-opening fallback: APPROVED

On 2026-11-22 the user selected **Option B: progressive fallback (precise highlight → paper/PDF with page hint → copy excerpt), retaining the Key Quote even if the source is unavailable**.

- The Key Quote **Open Source** affordance prefers a validated device-supported link to the original Zotero annotation/highlight **when supported**. Do not imply every desktop/tablet/phone platform can navigate to an exact highlight.
- If a precise destination is unavailable, provide a usable **Open Paper / Open in Zotero** alternative (and original PDF if accessible through the supported Zotero application) with the recorded page number where present, so the user can locate it manually. Do not host or duplicate the Zotero PDF as a workaround.
- If even the original paper/attachment cannot be reached, keep the stored Key Quote, original excerpt, available citation/page metadata, and independent personal comment visible, provide **Copy Excerpt**, and show a truthful **Source unavailable / link not supported** message.
- If the upstream Zotero annotation is removed or inaccessible, **never cascade-delete or silently clear** the local Key Quote. Mark its source-link availability and allow normal review and local management of the excerpt/comment. If Zotero metadata changes, do not claim the source highlight is still current without checking.
- **Crucial browser constraint:** initiating an external Zotero/app deep link does not prove the target app opened or focused the correct annotation. Do not silently auto-launch a chain of fallback apps/URLs in response to guessed success/failure. Present clear **user-selectable fallback actions** when success cannot be observed reliably.
- Preserve the previously approved UI-D005.2 rule: the Zotero annotation is never modified by website Key Quote editing/removal; no automatic import of all highlights.
- Exact URL patterns, supported device combinations, annotation retrieval/error codes, actual link capability, and fallback phrasing require Zotero integration and multi-device verification; this UI choice is **not** evidence of that compatibility.

**UI-D005.2c approves PDF-page-ascending default ordering.** Classified loading/empty/permission/error states are approved in UI-D005.2d. User-reviewed changes are approved by UI-D005.2e; removed-source re-link, multi-attachment and uncertain-source details remain UI-D005.2f/UI-D006.

### UI-D004.3 — Project Literature List default sort: APPROVED

On 2026-11-22 the user chose **Option A: Date Added to the Current Project, newest first**.

- On initial load of a Project's Literature List, the **default ordering** is the Project–Literature association's **date/time created descending** (most recently added to this Project first). This is distinct from Zotero library import time, Zotero metadata modification time and publication year.
- All four previously approved sorting criteria remain available: **Date Added to this Project**, **Publication Year**, **Title** and **Global Reading Status**. A user may change sorting with the Sort control.
- Date Added sorting concerns the **current Project**; the same canonical Zotero item can have different association timestamps in different Projects, without changing its global reading status or note.
- Where item association times are equal, use a deterministic stable tie-breaker to avoid visible reordering across reloads; the exact tie-break rule remains an implementation/detail refinement.
- Search scope and fields are now approved in UI-D004.3a. Graded import/batch confirmations and partial result feedback are approved in UI-D004.3b. Sort-direction controls for alternate keys, unavailable metadata and view-preference persistence remain pending under UI-D004.3c/UI-D006.
- Approval applies to UX specification only; no feature implementation is authorized.

### UI-D004.3a — Project Literature List standard metadata search: APPROVED

On 2026-11-22 the user selected **Option B: search Title, Authors, Publication Year and DOI of papers already linked to the current Project; combine with reading-state filters**.

- **Scope:** the Project Literature List search only matches literature items associated with the **currently open Project**, not all Zotero library items or other Projects. The separate **Add Papers from Zotero** picker retains its own library-wide search flow under D002/UI-D004.1.
- **Searchable fields:** Zotero-owned **Title**, **Authors**, **Publication Year**, and **DOI**. DOI may be searchable even though it is not a default visible column in UI-D004.2.
- **Combined filtering:** a query may be combined with the existing **All / To Read / Reading / Read** filter; both criteria are applied together to the current Project's literature rows/cards. Reading status remains global to each canonical Zotero paper.
- **Consistency:** desktop table, phone cards, and adaptive tablet must show the same result set for equivalent input and filters. Sorting remains applied to the filtered result set; default is Project-added time descending (UI-D004.3).
- **Out of scope:** searching the Markdown Research Notes, Key Quote excerpt/comment text, full PDF contents, or all Projects from this input is not approved in this MVP decision. Do not index private note content under the guise of simple metadata search.
- **No-match experience:** clearly distinguish a Project with no linked papers from a populated Project with no papers matching the active query/filter; offer a visible way to clear the active search or filter.
- **Still to specify:** query tokenization, case/diacritic normalization, partial DOI matching, Year matching semantics, request/debounce behavior for large libraries and inaccessible Zotero fields. These details cannot be claimed as decided by Option B alone.

### UI-D004.3b — Graded confirmations and result feedback for import/bulk actions: APPROVED

On 2026-11-22 the user selected **Option B: graded confirmations and result feedback**.

- **Add from Zotero (manual item selection or one-time Collection import):** show the selected/import-eligible item count before initiating the import; do not add unnecessary second confirmation for ordinary import. On completion, report **newly linked, already linked/skipped, failed** (and any other explicitly distinguishable results) accurately; do not treat skipped duplicates as errors or create duplicate canonical papers/Project links. The selected Collection is not subscribed for ongoing background sync.
- **Bulk change global Reading Status:** before applying, present a clear confirmation containing the selected paper count and intended destination status, explicitly stating that **the single global status changes across all Projects containing these papers**, not just the current Project. A user must affirm before mutation.
- **Bulk unlink with chosen scope (amended by UI-D004.3b-R1):** before applying, present a confirmation identifying the selected paper count, the chosen scope (**Current Project only**, default; or **All Projects including current**), and the specific non-destructive data semantics. For Current Project only, name the current Project. For All Projects, emphasize that *all* Project–Literature links for the selected papers will be removed, preferably show affected Project names/link counts when available, and require an especially unambiguous second confirmation. Both operations preserve Zotero items, PDFs, global notes, Key Quotes, annotations and reading statuses. Neither deletes a Project; Project permanent deletion in UI-D002 is separate.
- **Partial success:** show accurate per-operation totals (succeeded, failed, and skipped where applicable) and retain enough information to identify/retry **only genuinely failed items** without reapplying successful operations or duplicating links. Acknowledging the UI result must not erase unresolved failures.
- **Uncertain outcome:** do not claim success or blindly retry if a request timed out after a possible remote write. Reconcile against authoritative state or use an idempotent/revision-safe method before offering retry. Global status changes must not overwrite concurrent updates silently.
- **Progress, errors and cancellation:** show a visible in-progress state and clear completion/failure feedback. Do not imply that closing a dialog cancels a server-side action unless cancellation is actually guaranteed.
- **Cross-device consistency:** batch actions follow the same canonical-literature and many-to-many Project association rules as D001/UI-D004.1, including on mobile.
- **Feasibility gate:** batch retry safety, Zotero API rate limits, partial persistence, secure credential handling and concurrency semantics must be validated during implementation/QA and are **not** deemed proven by this UI approval.

**Still pending:** exact wording/layout of confirmation modals and result summaries, accessible focus behavior, alternate sort directions, detail-level search matching and loading/permission/empty-state variants. Track under UI-D004.3c/UI-D006.

### UI-D004.3b-R1 — Amendment: selectable Project-unlink scope: APPROVED

The user amended the previously approved removal workflow on 2026-11-22 to allow **two scope choices** for removing literature associations.

1. **Remove from this Project only (default).** Unlink each selected canonical Zotero paper from the current Project; other Project links remain untouched.
2. **Remove from all Projects (including this Project).** Unlink each selected canonical Zotero paper from **every** Project that currently references it, including the current Project. Show that the action affects other Projects; the paper may subsequently belong to **zero** Projects.

- This scope selector applies to **per-paper removal** and **multi-selected/bulk unlink** from the Project Literature view. Do not interpret it as a feature for deleting Projects themselves.
- Neither action deletes the underlying Zotero paper, attachment/PDF, Zotero annotation, globally shared reading status, single global structured Research Note or Key Quotes. Orphaned globally owned records must be preserved and accessible again when the paper is re-linked from Zotero; do not cascade-delete them.
- **Safety:** default to Current Project only. Before any unlink, explicitly confirm chosen scope and selected paper count. For All Projects, use a stronger warning, including affected Project names/counts when known and a separately affirmative confirmation. Never present All Projects as an innocuous synonym for Remove from current Project.
- **Reliability:** perform idempotent/revision-safe link changes, report actual success/failure/skipped outcomes, handle partial completion and only retry links proved not removed; never silently hide partial failures or retry blindly after an ambiguous timeout.
- Respect UI-D002: archiving/restoring/deleting a Project is a separate lifecycle operation with its original non-cascading constraints.
- **Terminology:** to remove ambiguity, the all-Projects choice in this design explicitly **includes the current Project**. If the intended scope was instead “only other Projects, preserve the current Project”, it needs a subsequent explicit amendment; that interpretation is not silently inferred.

### UI-D004.3-R1 — Separate Important Papers section: APPROVED IN PRINCIPLE

On 2026-11-22 the user requested a distinct **Important Papers / 重点文献** area in each Project's Literature List, while retaining the existing **newest-linked-first** default sorting for ordinary literature.

- **Project Literature hierarchy:** provide a distinct Important Papers view alongside All Papers. **UI-D004.3-R1a approves tab navigation**: show only one tab at a time, not an always-visible pinned section. All standard list/search/filter/sort/Add Papers/bulk features remain available.
- **Mark/unmark:** allow a paper linked to the current Project to be marked **Important** and subsequently unmarked through the Project Literature UI. Do not conflate Important with any of the three global reading statuses.
- **Scope approved by UI-D004.3-R1b:** Important is a **per-Project, per-paper association property** (e.g., isImportant on the Project–Literature link), not a global property of the canonical Zotero paper. A paper can be Important for Project A and not Project B; do not alter global statuses or notes.
- **Both tab defaults approved:** All Papers sorts by time linked to the current Project descending (UI-D004.3); Important Papers sorts by the per-Project time marked Important descending (UI-D004.3-R1c). Marking Important never rewrites the Project-added timestamp.
- **Retention/deletion:** unmarking Important never removes the Project–Literature link; unlinking the paper from one Project also removes that Project-specific Important designation, but never deletes global paper/status/notes/quotes. Unlinking from all Projects removes all their associations and associated Important designations, leaving global paper data intact.
- **Tab layout approved in UI-D004.3-R1a:** All Papers contains all project links (including important papers); Important Papers contains the important subset. Important-tab default sort is approved by UI-D004.3-R1c; mark/unmark placement and mobile/empty-state refinements remain.
- **Baseline protection:** this addition does not alter Zotero metadata ownership, one global research note per canonical Zotero item, one global reading status, or UI-D004.3b-R1 scoped unlink safety. No code is authorized by this Design addition.

### UI-D004.3-R1a — Important Papers tab navigation: APPROVED

On 2026-11-22 the user selected **Option C: two switchable tabs, All Papers / Important Papers**, rather than a permanently pinned section or a duplicated shortcut list.

- The Project Literature page offers **All Papers** and **Important Papers** tabs, sharing the same responsive desktop-table/mobile-card layout under UI-D004, and displaying only one tab at a time.
- **All Papers** contains **every paper linked to the current Project**, including papers marked Important; default order remains **newest Project association first** (UI-D004.3).
- **Important Papers** shows **only the subset marked Important for the current Project** (the per-Project Important data model is approved in UI-D004.3-R1b). Papers are not copied or re-created when changing tabs.
- Mark and unmark Important from the available Project paper actions. Important remains **independent of global reading status**, global Research Notes and Key Quotes; switching tabs must not mutate any paper or association.
- Standard Project-scoped search (Title, Authors, Year, DOI), reading-state filters and approved sort choices remain available in both tabs, working on the respective tab subset. Specific persistence of search/filter when switching tabs remains an implementation/UI detail to validate.
- Empty Important Papers tab provides a clear call to action to mark a paper Important from All Papers; it is not equivalent to having no literature in the Project.
- No separate always-visible Important section at the top of All Papers. No mandatory duplication of the same paper within a single rendered tab.
- **Important-tab default ordering is approved in UI-D004.3-R1c.** Still open: preference persistence, mobile tab accessibility, mark/unmark shortcut, and count badges. Track these separately without claiming user approved them through selecting the navigation style.

### UI-D004.3-R1b — Important flag scoped to each Project: APPROVED

On 2026-11-22 the user selected **Option A: per-Project Important marking**, rather than a globally shared Important flag.

- **Ownership:** each **Project–Literature association** owns its own Important boolean (or equivalent persistent association-level marker). The canonical Zotero literature item does **not** own a global Important flag.
- A canonical paper can be Important in Project A and not Important in Project B, regardless of its one globally shared reading status and single global Research Note/Key Quotes.
- **Mark / unmark:** marking a paper Important in the current Project makes it eligible for this Project's **Important Papers** tab, without changing other Projects. Unmarking removes it from this Important tab only; it remains in **All Papers** and its Project association remains intact.
- **All Papers** remains a complete listing of all papers linked to this Project, Important or not, default ordered by newest **Project association** as approved in UI-D004.3.
- **Association removal:** unlinking a paper from the current Project also removes that Project's Important marker; unlinking it from all Projects (UI-D004.3b-R1) removes all association-level Important markers, while retaining the canonical item, global reading state, Research Note, Key Quotes, and Zotero source.
- **Project archiving/restore:** association-level Important markers are retained through archive/restore. Permanent Project deletion removes the Project and its associations (including markers) but never cascades to global paper/note data.
- **Important-tab default ordering is approved in UI-D004.3-R1c.** Precise mark/unmark placement, any bulk Important management, count badges and tab preference persistence remain separate refinements.

### UI-D004.3-R1c — Important Papers newest-marked-first default order: APPROVED

On 2026-11-22, the user chose **Option A: most recently marked Important first**.

- **Important Papers:** sort by the time a paper was most recently marked Important **in the current Project**, descending. The most recently marked paper appears first.
- Each Project–Literature association must record its **Important marked-at timestamp** (or equivalent stable ordering key), independently of Zotero metadata and the Project link creation time.
- **All Papers** retains its existing default: time added to the current Project descending (UI-D004.3). Marking or unmarking Important does **not** change that timestamp or reorder All Papers.
- A first-time Important mark sets the association's marked-at time. Unmarking removes the paper from Important Papers but keeps it in All Papers. Marking it again sets the new marked-at time, placing it among the most recently marked papers.
- Marking in Project A does not change any Important marker or marked-at timestamp in Project B. The one global reading status, global Research Note and Key Quotes are unchanged.
- The approved sorting menu remains available; alternate sort selection never changes the stored marked-at time. Equal timestamps should have a stable deterministic tie-break.
- Star and menu mark/unmark entry points are approved in UI-D004.3-R1d; exact control placement, count badges, tab preference persistence and mobile access details remain in UI-D004.3-R1e/UI-D006.

### UI-D005.1c — Offline draft recovery and field-level note conflict resolution: APPROVED

On 2026-11-22 the user selected **Option B: recover offline drafts, compare local/remote versions per Markdown field, choose a version or merge manually, then save safely**.

- **Recoverability:** after a network interruption, keep the user's unsynced edits as a **recoverable local draft**, identify the canonical Zotero paper and the five-field global Research Note, and clearly label the draft as **not yet remotely saved**. When the app is reopened, offer an explicit recovery path if that local draft still exists. Never treat local storage as a guaranteed cross-device or permanent backup; browser storage can be unavailable or cleared.
- **Conflict detection:** compare the editor's last known remote note revision to the current remote revision before commit, using a verified optimistic-concurrency mechanism (ETag/version/precondition or an equivalent tested server-side solution). If a stale-write conflict exists, **do not overwrite** the newer remote note automatically; show a conflict interface and keep the full local draft intact.
- **Five independent fields:** display the **local draft and remote version** for each of the five structured Markdown fields. Identify which fields differ, enabling the user to review unaffected fields and conflicting edits separately. Provide a side-by-side comparison on sufficiently wide screens and a readable sequential alternative on phones.
- **Resolution options:** for each differing field, allow **Use Local**, **Use Remote**, or **Manual Merge** while retaining the ability to review/copy both originals. A manually merged result edits the same Markdown source format; do not destroy formatting or silently pick one version.
- **Whole-note safety:** even with field-level visual choices, the note is **one globally shared record**. Saving the resolved five-field result must recheck the latest remote document revision **atomically**, or reenter comparison if another device has saved in the meantime. Never treat independent fields as permission to race or blindly overwrite unrelated fields.
- **Status and Save Now:** respect UI-D005.1: distinguish Unsaved, Saving, Saved, Offline/local draft, Save failed and Conflict; only show Saved after an acknowledged remote commit. Save Now uses the same revision guard and cannot force-overwrite newer changes.
- **No historical timeline requirement:** this option does not approve complete version history or multi-snapshot restore. It approves recoverable offline drafts and a current local-vs-remote conflict comparison.
- **POC-001 technical gate:** persistence, recovery after refresh/relaunch, WebDAV conditional writes, simultaneous editor races, partial network failures, privacy and safe local storage must be validated before implementation claims. The UI decision alone does not prove Nutstore WebDAV can satisfy these guarantees.

**Still pending:** exact Markdown toolbar/export filename, fine-grained focus restoration, local-draft privacy/expiration and recovery prompts, conflict resolution copy, accessible focus and mobile handling (UI-D005.1d/UI-D006).

### UI-D004.3-R1d — Important star shortcut plus Actions menu: APPROVED

On 2026-11-22 the user selected **Option B: a star control on each desktop literature row and mobile paper card, with the same mark/unmark command in the Actions menu**.

- **Desktop and mobile:** every paper linked to the currently open Project has a clearly identifiable, keyboard- and touch-accessible **Mark Important / Unmark Important** star control on its table row or compact card. The paper's Actions (`···`) menu offers the same command.
- **One state, two entry points:** the star and menu reflect the **same per-Project Project–Literature Important flag** (UI-D004.3-R1b) and must stay consistent after a successful update. Active/inactive appearance and a meaningful accessible label communicate the current state; color alone is insufficient.
- **Immediate scope:** toggling the star in Project A changes **only Project A's** Important flag. It does not change the same canonical Zotero paper's Important state in Project B, nor its global reading status, Research Note, Key Quotes or Zotero annotations.
- **Tab behavior:** All Papers always retains the paper. Once marked it becomes eligible for Important Papers; when unmarked from Important Papers it disappears from that subset but remains in All Papers. Its Project-added timestamp does not change. Marking again refreshes its Project-specific marked-at timestamp and the Important Papers default order (UI-D004.3-R1c).
- **Feedback:** do not present the remote change as completed until its authoritative write has succeeded; show an actionable error and retain/restore the verified state if the write fails. Avoid duplicate or racing updates from rapid taps and preserve the original state on unconfirmed changes. Exact visual feedback is a UI-D006 refinement.
- **No bulk-marking authorization:** this selection approves the single-paper star shortcut plus menu access only, **not** a new mass Mark Important / Unmark Important action. Existing separate batch actions retain their approved behavior.
- **Layout:** touch target and keyboard focus must work without forcing mobile horizontal scrolling or conflicting with row navigation/selection. Precise placement, count badges and preference persistence remain for UI-D004.3-R1e/UI-D006.

### UI-D005.2c — Zotero highlight picker default page order: APPROVED

On 2026-11-22 the user selected **Option A: default ordering by PDF page from beginning to end**, instead of latest-created-first or a mandatory sort-mode switch.

- When the user opens the existing **Zotero highlight picker** for a paper, list source highlights **in ascending PDF page order** (earlier pages first), wherever reliable page-position metadata is available.
- Preserve every eligible original highlight for selective review, including **multiple highlights on the same page**; give same-page items a deterministic stable secondary order without arbitrarily discarding or merging them.
- **Unknown / unusable page positions:** keep those highlights accessible and clearly labeled as lacking a reliably sortable page, rather than fabricating page numbers or hiding them. Present them after reliably positioned highlights by default, with a stable fallback order.
- **Zotero metadata caveat:** printed page labels, PDF viewer page indices, annotation position details and multiple attached PDFs may differ. The mapping and cross-attachment ordering must be investigated using actual Zotero API data and tested before claiming precise page-order support; the UI must degrade honestly if unavailable.
- **Scope unchanged:** selecting an original highlight for a Key Quote remains manual and explicit with multi-select and Add Selected (UI-D005.2a); already-linked state/dedup remain in place; no automatic import of all highlights and no mutation of original Zotero annotations.
- **Sort controls:** this decision defines the **default** page order; it does not approve a mandatory latest-created sort toggle or new feature. Additional controls can be considered separately.
- **Classified loading/empty/permission/error and retry states are approved in UI-D005.2d.** Changed original annotations are handled by user-reviewed comparison in UI-D005.2e; removed/uncertain source re-link and multi-attachment presentation remain UI-D005.2f; mobile focus/safe-area details remain UI-D006.

### UI-D005.2d — Classified Zotero highlight-picker feedback and recovery: APPROVED

On 2026-11-22 the user selected **Option B: distinguish loading, no highlights, no search matches, network failure, insufficient access and missing/unavailable original annotations, with targeted recovery actions**.

- **Loading:** show progress/skeleton or a clear loading indicator while fetching this paper's available Zotero PDF annotations. Do not claim the list is empty until loading has actually finished. Keep the selection action disabled when the relevant data is not ready; avoid clearing prior confirmed Key Quotes.
- **No highlights:** when a successful authenticated read finds no eligible annotations for the paper/attachment, show **No highlights found**; suggest opening the source in Zotero or adding a Key Quote manually. Do not display a network-error message.
- **No search matches:** when available highlights exist but the picker query matches none, show **No matching highlights** and a **Clear search** action. Preserve the existing search input and other available results.
- **Network/transient failure:** show **Unable to load highlights** with an explicit **Retry** control and, where appropriate, the manual Key Quote route. A failed request must not be mislabeled as an empty annotation collection, and previously saved Key Quotes must remain visible elsewhere.
- **Permission/authentication issue:** show **Zotero access required / permission insufficient** and offer an appropriate **Reconnect / Review permissions** user-controlled action when supported. Do not display or log credentials, invent a successful reauthorization, silently modify access scopes, or classify permission failure as no highlights.
- **Source annotation unavailable/removed:** if a previously linked original Zotero annotation is not retrievable, clearly indicate **Original highlight unavailable**; allow opening the paper/page (where possible) or copying the stored excerpt as approved in UI-D005.2b. **Never delete or overwrite** a previously saved Key Quote or its manually added comment. Do not assume temporary failure proves upstream deletion.
- **Recoverable picker state:** preserve chosen highlights and in-progress local text whenever reasonably possible during retry/reconnect; never silently submit selections. The **Add Selected** action remains explicit; deduplicate by source annotation identity as in UI-D005.2/UI-D005.2a.
- **Device layout/accessibility:** the same six states and appropriate actions must work in the desktop right-hand panel and phone full-screen picker. Present accessible status text, focusable actions and clear recovery paths; exact focus behavior belongs to UI-D006.
- **Technical verification:** Zotero API availability, returned response codes, authorization/permission handling, multi-PDF distinctions, and the ability to distinguish missing annotations from transient errors require integration validation. No error classification may falsely assert a confirmed upstream deletion.

**UI-D005.2e approves user-reviewed comparison/retention or explicit excerpt update for a confirmed changed original annotation.** Missing-source protection remains; optional re-link after removal, uncertain source versions, multi-attachment presentation, focus management and styling remain UI-D005.2f/UI-D006 details.

### UI-D005.2e — Manual reconciliation of changed Zotero source highlights: APPROVED

On 2026-11-22 the user selected **Option B: retain the saved Key Quote, compare it with the latest Zotero highlight, and let the user explicitly keep or update the excerpt while preserving personal comments**.

- **Authority and preservation:** the website-owned **Key Quote excerpt is a saved research artifact**, not a live mirror of Zotero's original annotation. Zotero continues to own its original annotation. When upstream highlighted text changes, **do not silently alter or replace** the saved Key Quote, source identity or personal comment.
- **Comparison:** when a **reliable, user-initiated source check** (e.g. opening/rechecking the source or highlight picker) retrieves a changed annotation for the **same confirmed Zotero annotation identity**, show **Saved Key Quote** and **Current Zotero Highlight** in a side-by-side comparison on wide screens or an accessible sequential view on phones. Identify that the source text differs and avoid presenting the quote as verified current until reviewed.
- **Explicit choices:** offer **Keep Saved Quote** and **Update Quote from Zotero**. Keeping retains the previously saved excerpt; updating replaces **only the user-approved excerpt text**, after a successful, revision-safe write. Both choices leave the user's existing comment intact, and neither writes back to Zotero. No automatic overwrite or unapproved background mirroring.
- **Identity and metadata:** use a stable annotation ID/reference where available to distinguish an **edited original** from a different highlight with similar text. Do not guess identity from quote text alone. Retain source/page metadata unless verified and explicitly included in a separately understood update; never invent new precise source links or page numbers.
- **Missing/deleted originals:** if the original annotation is not retrievable, preserve the saved quote, any original source reference, page information and comment. Show **Source unavailable** with fallback actions (open paper/page where supported; copy excerpt) per UI-D005.2b/UI-D005.2d. A transient network/auth failure is **not proof of deletion**; do not auto-unlink or auto-reassign to a different annotation.
- **Saving and concurrency:** respect the previously approved confirmed remote-save and no-silent-overwrite rules for website-owned data (UI-D005.1/UI-D005.1c). If a concurrent edit or an uncertain outcome occurs, retain the user's local decision/draft and require reconciliation rather than reporting Saved.
- **No continuous synchronization implied:** change comparison occurs when valid current Zotero source data is fetched in an intentional user flow, not as an automatic all-annotations monitor. There is no requirement for comprehensive version history.
- **Technical verification required:** Zotero annotation IDs, revision/modified timestamps, text/position fields, attachment identity and the ability to detect text edits reliably need actual API validation. If a safe comparison cannot be established, show a truthful **Cannot verify source update** state and keep the saved Key Quote.

**Remaining UI-D005.2f refinements:** multiple-PDF attachment grouping, source-version uncertainty and optional re-link choice when the original source was removed, wording/copy for Keep/Update, and mobile focus/return handling. Re-linking to another highlight must never be automatic or confused with updating the original one.

## Pending decisions

- **UI-D004.3-R1e (refinement):** Exact star position/feedback, count badges, per-tab sort preference persistence and mobile accessibility.
- **UI-D004.3c (refinement):** Exact confirmation/error copy and result display, alternate sort directions, query-match details and mobile bulk-selection affordances.
- **UI-D005.1d (refinement):** Markdown toolbar/export filename, focus/caret restoration, offline-draft privacy/recovery prompt and accessible conflict resolution details.
- **UI-D005.2f (refinement):** Multi-attachment grouping, optional explicit re-link for removed annotations, uncertain source-version handling, exact copy and cross-device focus.
- **UI-D006:** Responsive interaction, accessibility, save/error/conflict and cross-device behaviors.
- Final UI acceptance matrix and independent design freeze.

## Constraints inherited from approved product baseline

- D001: One canonical Zotero item, global reading status and global note, with many-to-many Project links.
- D002: Zotero Collection import is one-time, not ongoing background binding.
- D003: Exactly three reading states (To Read / Reading / Read).
- D005: No PDF copy or separate browser PDF reader as a required product feature.
- D006: Personal Workspace uses read-only API plus deep links.
- D007: Second Nutstore account for JSON/Markdown is **conditional** on POC-001; UI cannot assume it already works.

## Gate

`UI-D001` through `UI-D005.2` (including UI-D004.1 and UI-D005.1a) are approved so far; UI-D004.3-R1e, UI-D004.3c, UI-D005.1d, UI-D005.2f and UI-D006 remain pending. **Do not start implementation, publish a code-start authorization, or imply independent QA passed.** Continue Design review one decision at a time, then publish frozen `DESIGN_APPROVED.md` and a separate scoped execution authorization only when explicitly approved.
