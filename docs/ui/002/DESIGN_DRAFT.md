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
- **Network interruption:** protect edits as recoverable drafts rather than silently dropping text. Clearly disclose if a draft is only local or has not yet reached the remote store. The exact local persistence mechanism, encryption/privacy behavior, device/browser limits and recovery workflow require technical security review; do not promise cross-device availability of an unsynced draft.
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

**Picker presentation is now approved as UI-D005.2a.** Sorting, changed/removed Zotero annotations, retry/error states, and source-link fallback wording remain UI-D005.2b/UI-D006 refinements. No automatic synchronization is authorized.

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

**Details still pending:** sort order for highlights, empty/loading/permission/error states, detailed detection/relink policy for changed Zotero annotations, exact fallback copy, and keyboard/focus restoration and mobile safe-area behavior. The progressive source-open fallback is approved as UI-D005.2b; track picker sorting, source changes and accessibility under UI-D005.2c/UI-D006.

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

**Unresolved UI-D005.2c details:** highlight picker ordering, loading/empty/permission/error states, upstream annotation change detection/relink behavior, and cross-device focus/return handling. Keep under a separate design refinement.

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
- **Scope proposed for the data model:** store Important as a **per-Project, per-paper association property** (e.g., isImportant on the Project–Literature link), not as a global property of the canonical Zotero paper. The same Zotero paper may be Important for Project A and not for Project B. User confirmation of this scope and its representation remains a refinement; do not silently change global statuses or notes.
- **Normal ordering preserved:** default regular literature ordering remains descending by the date the paper was linked to the current Project (UI-D004.3). Moving or marking a paper Important must not rewrite its original Project-added timestamp.
- **Retention/deletion:** unmarking Important never removes the Project–Literature link; unlinking the paper from one Project also removes that Project-specific Important designation, but never deletes global paper/status/notes/quotes. Unlinking from all Projects removes all their associations and associated Important designations, leaving global paper data intact.
- **Tab layout approved in UI-D004.3-R1a:** All Papers contains all project links (including important papers); Important Papers contains the important subset. Remaining: important-tab sort, per-project flag confirmation, mark/unmark and mobile/empty-state refinements.
- **Baseline protection:** this addition does not alter Zotero metadata ownership, one global research note per canonical Zotero item, one global reading status, or UI-D004.3b-R1 scoped unlink safety. No code is authorized by this Design addition.

### UI-D004.3-R1a — Important Papers tab navigation: APPROVED

On 2026-11-22 the user selected **Option C: two switchable tabs, All Papers / Important Papers**, rather than a permanently pinned section or a duplicated shortcut list.

- The Project Literature page offers **All Papers** and **Important Papers** tabs, sharing the same responsive desktop-table/mobile-card layout under UI-D004, and displaying only one tab at a time.
- **All Papers** contains **every paper linked to the current Project**, including papers marked Important; default order remains **newest Project association first** (UI-D004.3).
- **Important Papers** shows **only the subset marked Important for the current Project** (the per-Project Important data model remains a recommended proposal pending final scope confirmation). Papers are not copied or re-created when changing tabs.
- Mark and unmark Important from the available Project paper actions. Important remains **independent of global reading status**, global Research Notes and Key Quotes; switching tabs must not mutate any paper or association.
- Standard Project-scoped search (Title, Authors, Year, DOI), reading-state filters and approved sort choices remain available in both tabs, working on the respective tab subset. Specific persistence of search/filter when switching tabs remains an implementation/UI detail to validate.
- Empty Important Papers tab provides a clear call to action to mark a paper Important from All Papers; it is not equivalent to having no literature in the Project.
- No separate always-visible Important section at the top of All Papers. No mandatory duplication of the same paper within a single rendered tab.
- **Still open:** the exact Important flag ownership (per Project recommended, global not approved), Important-tab default ordering, preference persistence, mobile tab accessibility, mark/unmark shortcut, and count badges. Track these separately without claiming user approved them through selecting the navigation style.

## Pending decisions

- **UI-D004.3-R1b (refinement):** Important mark ownership (per-Project recommended), Important-tab default ordering and mark/unmark actions; tab preference/count details.
- **UI-D004.3c (refinement):** Exact confirmation/error copy and result display, alternate sort directions, query-match details and mobile bulk-selection affordances.
- **UI-D005.1c (refinement):** Markdown toolbar details, focus/caret restoration, safe export filename/content and offline-draft/conflict-resolution UI states.
- **UI-D005.2c (refinement):** Highlight picker order, empty/loading/permission/error states, annotation change/relink handling, and cross-device focus behavior.
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

`UI-D001` through `UI-D005.2` (including UI-D004.1 and UI-D005.1a) are approved so far; UI-D004.3-R1b, UI-D004.3c, UI-D005.1c, UI-D005.2c and UI-D006 remain pending. **Do not start implementation, publish a code-start authorization, or imply independent QA passed.** Continue Design review one decision at a time, then publish frozen `DESIGN_APPROVED.md` and a separate scoped execution authorization only when explicitly approved.
