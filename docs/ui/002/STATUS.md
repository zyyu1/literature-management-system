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
- **UI-D004.2 / UI-D005.1 / UI-D005.2 / UI-D006:** NOT YET DECIDED. Exact list details, editor and saving behavior, quotes/deep links and accessibility need design review.

See [DESIGN_DRAFT.md](DESIGN_DRAFT.md) for the current non-frozen design. This is a partial decision, not a final UI specification and not permission to implement.

**BOOTSTRAP-000 QA:** Pending; do not claim approval without independently published evidence.

**Next Design decision:** UI-D005.1 — Research Notes editor and save interaction (followed by Key Quotes/deep link).
