# Module 002 — UI and Interaction Design Status

**Date:** 2026-11-22 (Europe/Berlin)  
**Owner:** Design Window  
**Stage:** DESIGN IN PROGRESS / NOT FROZEN  
**Code implementation:** NOT AUTHORIZED / NOT STARTED  
**Independent QA:** NOT STARTED

## Design decisions

- **UI-D001 APPROVED:** Projects Home uses Cards / List switchable hybrid, cards as default and responsive single-column mobile presentation.
- **UI-D002 APPROVED:** Project create/edit/archive/restore and permanent delete with a distinct second confirmation; permanent deletion removes only Project and its associations, never global papers, reading states, notes, quotes or Zotero content.
- **UI-D003 APPROVED:** Standard Home display with Project name/description, literature total, three-state counts, reading progress bar, search, sorting and archive browsing in both Cards/List views.
- **UI-D004 APPROVED (LAYOUT ONLY):** Desktop literature table; compact phone literature cards; tablet responds to available width. All views share global literature identity/status and Project associations.
- **UI-D004.1 APPROVED (STANDARD MANAGEMENT; UNLINK SCOPE AMENDED):** Current-Project search/status filtering, sorting, Zotero selection/one-time Collection import, multi-select, bulk global reading-state updates, and scope-selectable unlinking (current Project only or all Projects), always preserving the canonical literature record and notes.
- **UI-D005 APPROVED (LAYOUT ONLY):** Desktop two columns (left: structured Research Notes; right: Key Quotes + Zotero metadata); mobile single column; tablet adaptive. One global note per canonical paper.
- **UI-D005.1 APPROVED (SAVE BEHAVIOR):** Autosave plus Save Now, remote-acknowledged Saved state, explicit local-draft/offline/failure/conflict states and no silent multi-device overwrite; WebDAV support requires POC-001.
- **UI-D005.2 APPROVED:** Key Quotes can be entered manually or created by selectively choosing existing Zotero highlights; preserve annotation/page reference when available; no bulk automatic synchronization or source-edit side effects.
- **UI-D005.1a APPROVED:** Five independent Markdown note fields, common formatting toolbar, safe preview and Typora-compatible full-note Markdown export; retains autosave/Save Now and concurrency rules.
- **UI-D005.2a APPROVED:** Right-hand highlight picker panel on desktop, full-screen selection UI on phone, with search, multi-select, source-text preview, and already-linked marking; no automatic all-highlight sync.
- **UI-D004.2 APPROVED:** Title, authors, publication year, global reading status and Actions menu on desktop; essential title/authors/year/status plus reachable actions on mobile; sort by year, title, reading status or date added to current Project.
- **UI-D005.1b APPROVED:** Each of the five Markdown fields independently switches between Edit and Preview, defaulting to Edit; switching preserves source/draft and never bypasses safe saving.
- **UI-D005.2b APPROVED:** Progressive Zotero source-open fallback: precise highlight if supported, then paper/PDF with page hint, then copy excerpt; retain Key Quote/comment even if source unavailable. External navigation success cannot be assumed.
- **UI-D004.3 APPROVED:** Default Project Literature sorting is Date Added to the Current Project descending (newest project association first); other approved sort choices remain available.
- **UI-D004.3a APPROVED:** Search only literature linked to the current Project, matching Zotero Title, Authors, Publication Year and DOI; compose with the existing global reading-state filter and current sort.
- **UI-D004.3b APPROVED (AMENDED):** Graded import/batch confirmation and partial-result feedback; before unlink confirm chosen scope, protecting Zotero/global notes, and support failed-only safe retry.
- **UI-D004.3b-R1 APPROVED:** Per-item/bulk unlink selector: default Current Project only or All Projects including current. Global unlink needs a stronger explicit confirmation; no canonical paper/status/note/quote deletion.
- **UI-D004.3-R1 APPROVED IN PRINCIPLE:** Distinct Important Papers view; UI-D004.3-R1a confirms tabs instead of a pinned section; association-level Important scope is now approved in UI-D004.3-R1b.
- **UI-D004.3-R1a APPROVED:** All Papers / Important Papers tabs, All includes all Project papers (including Important); Important shows the marked subset, without copying records. All Papers remains newest-linked-first.
- **UI-D004.3-R1b APPROVED:** Important is Project–Literature association-specific; marking/unmarking affects only the current Project's Important tab and never the global status/notes.
- **UI-D004.3-R1c APPROVED:** Important Papers sorts by the most recent per-Project Important marking timestamp descending; All Papers keeps newest linked first.
- **UI-D005.1c APPROVED:** Recover offline Markdown drafts; compare local vs remote across five fields, choose local/remote or manually merge per field; version-check the entire globally shared note again before saving, never overwrite silently.
- **UI-D004.3-R1d APPROVED:** Single-paper Mark/Unmark Important star button on desktop rows and mobile cards; equivalent Actions-menu command; Project-scoped state, no bulk-star operation authorized.
- **UI-D005.2c APPROVED:** Highlight picker defaults to PDF page order ascending; same-page highlights remain distinct and missing/unreliable page metadata must be represented honestly.
- **UI-D005.2d APPROVED:** Classified highlight-picker UI for loading, no highlights, no search matches, network failure, access/permission failure and missing upstream source, each with truthful targeted recovery actions and Key Quote preservation.
- **UI-D004.3-R1e / UI-D004.3c / UI-D005.1d / UI-D005.2e / UI-D006:** PENDING. Important count/persistence/feedback, list confirmation/search/errors, Markdown toolbar/export and draft privacy, source annotation reconciliation and accessibility.

See [DESIGN_DRAFT.md](DESIGN_DRAFT.md) for the current non-frozen design. This is a partial decision, not a final UI specification and not permission to implement.

**BOOTSTRAP-000 QA:** Pending; do not claim approval without independently published evidence.

**Next Design decision:** UI-D005.2e — handling changed/removed linked Zotero annotations (then UI-D004.3-R1e).
