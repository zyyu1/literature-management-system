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
- **UI-D004.1 APPROVED (STANDARD MANAGEMENT):** Current-Project search and status filters, sort controls, Zotero library item selection plus one-time Collection import, multi-select, bulk global reading-state updates, and bulk Project-association removal with canonical paper and note preservation.
- **UI-D005 APPROVED (LAYOUT ONLY):** Desktop two columns (left: structured Research Notes; right: Key Quotes + Zotero metadata); mobile single column; tablet adaptive. One global note per canonical paper.
- **UI-D005.1 APPROVED (SAVE BEHAVIOR):** Autosave plus Save Now, remote-acknowledged Saved state, explicit local-draft/offline/failure/conflict states and no silent multi-device overwrite; WebDAV support requires POC-001.
- **UI-D005.2 APPROVED:** Key Quotes can be entered manually or created by selectively choosing existing Zotero highlights; preserve annotation/page reference when available; no bulk automatic synchronization or source-edit side effects.
- **UI-D005.1a APPROVED:** Five independent Markdown note fields, common formatting toolbar, safe preview and Typora-compatible full-note Markdown export; retains autosave/Save Now and concurrency rules.
- **UI-D005.2a APPROVED:** Right-hand highlight picker panel on desktop, full-screen selection UI on phone, with search, multi-select, source-text preview, and already-linked marking; no automatic all-highlight sync.
- **UI-D004.2 APPROVED:** Title, authors, publication year, global reading status and Actions menu on desktop; essential title/authors/year/status plus reachable actions on mobile; sort by year, title, reading status or date added to current Project.
- **UI-D005.1b APPROVED:** Each of the five Markdown fields independently switches between Edit and Preview, defaulting to Edit; switching preserves source/draft and never bypasses safe saving.
- **UI-D004.3 / UI-D005.1c / UI-D005.2b / UI-D006:** PENDING. Default sort and list error states, detailed Markdown toolbar/export/draft/conflict UI, highlight fallback states and accessibility need further design.

See [DESIGN_DRAFT.md](DESIGN_DRAFT.md) for the current non-frozen design. This is a partial decision, not a final UI specification and not permission to implement.

**BOOTSTRAP-000 QA:** Pending; do not claim approval without independently published evidence.

**Next Design decision:** UI-D005.2b — Zotero source-link fallback and upstream annotation failure/deletion handling.
