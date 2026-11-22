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
- **Bulk remove from Project:** remove only the selected Project–Literature associations in the current Project. **Do not delete** the canonical Zotero items, Zotero PDF/annotations, globally shared notes, quotes, or reading statuses. Do not imply this operation is a global deletion.
- **No advanced bulk features in this approved scope:** do not infer bulk links to other Projects, bulk tag editing or complex faceted filters.

### Still to detail after UI-D004.1

Bibliographic fields and four sorting criteria are now approved in UI-D004.2. Search matching details, default sort, bulk action placement on mobile, confirmation text/undo policy, import loading/error/permission states and count display remain pending. No live Zotero integration has been tested by this design approval.

### UI-D005 — Literature Detail main responsive layout: APPROVED

The user selected **Option B: two columns on desktop / a single column on mobile** on 2026-11-22.

- The desktop Literature Detail page has a **left column for the structured Research Notes** and a **right column for Zotero-linked Key Quotes and bibliographic metadata**.
- Mobile displays the content in **one readable vertical column**, not a compressed two-column layout; tablet responsive behavior adapts to usable width and is yet to be specified precisely.
- Literature title, authors and other Zotero metadata remain **source-attributed**; do not imply the website edits original Zotero metadata.
- Show an **Open in Zotero** entry point for the same canonical paper; precise deep-link support, annotation-focused navigation and fallbacks require device-level verification and later interaction design.
- Research Note fields remain globally unique per canonical Zotero item (D001), including research question, arguments/content, theories/methods, innovations/contributions, and limitations. Key Quotes are source-linked excerpts of the same global paper rather than copies per Project.
- **Still to refine:** Markdown editor toolbar/preview/export refinements; concrete draft/error/conflict UI details, quote-linking refinements/sorting, mobile stacking order, edit affordances and exact responsive breakpoints. Autosave + Save Now was approved separately in UI-D005.1.
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

**Details still pending:** sort order for highlights, empty/loading/permission/error states, what happens if a linked Zotero annotation is deleted or edited upstream, exact source-link fallback copy, and keyboard/focus restoration and mobile safe-area behavior. Track these under UI-D005.2b/UI-D006, not as assumed approved behavior.

### UI-D004.2 — Literature fields and sorting: APPROVED

On 2026-11-22, the user selected **Option B: standard bibliography table/card density and four sorting criteria**.

- **Desktop table:** display **paper Title**, **Authors**, **Publication Year**, **global Reading Status** and a per-paper **Actions menu**. Keep UI-D004.1 selection checkboxes/actions available without sacrificing title readability.
- **Mobile compact cards:** display the essential paper information (title, author summary, year and global reading status) in a touch-friendly compact layout, with access to the Actions menu and selection/batch operations. Do not force horizontal scrolling to expose normal actions.
- **Tablet:** adapt the desktop table or mobile card density as dictated by usable width (UI-D004), while keeping the same data identities and permissions.
- **Sorting controls must include:** **Publication Year**, **Title**, **Reading Status**, and **Date Added to the Current Project**. Project-added time refers to the Project–Literature association timestamp, **not** Zotero's library-added or last-modified timestamp.
- **Source of truth:** metadata fields originate in Zotero; reading status is the one global status across Projects. The Actions menu must respect UI-D004.1: removing an item from this Project only removes its association and never erases the paper, PDF, shared notes or quotes.
- **No custom column editor** or extra mandatory columns for journal, DOI or citation metrics are approved under this standard-density choice.
- **Still pending:** default sort, ascending/descending control and null-year behavior, detailed search matching, mobile bulk-selection affordances, confirmation and loading/error states; resolve these later in UI-D006 or implementation acceptance specification without inventing defaults.

## Pending decisions

- **UI-D004.3 (refinement):** Default ordering and sorting direction, search matching, import/batch confirmation and empty/loading/error states.
- **UI-D005.1b (refinement):** Specific Markdown toolbar/preview presentation, safe export details, offline-draft and conflict-resolution interaction states.
- **UI-D005.2b (refinement):** Highlight sort/order, picker empty/loading/error states, source/deep-link fallback wording and changed/removed annotation behavior.
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

`UI-D001` through `UI-D005.2` (including UI-D004.1 and UI-D005.1a) are approved so far; UI-D004.3, UI-D005.1b, UI-D005.2b and UI-D006 remain pending. **Do not start implementation, publish a code-start authorization, or imply independent QA passed.** Continue Design review one decision at a time, then publish frozen `DESIGN_APPROVED.md` and a separate scoped execution authorization only when explicitly approved.
