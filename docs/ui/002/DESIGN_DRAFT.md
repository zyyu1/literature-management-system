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
- Search, filtering, sorting, selection/bulk operations, Zotero import interaction, table columns and mobile action placement are **still pending** as **UI-D004.1**. The user's approval is for layout only.

## Pending decisions

- **UI-D004.1:** Project Literature search/filter/sort, Zotero item selection and one-off Collection import, selection/bulk actions, and table/card information fields.
- **UI-D005:** Literature Detail note sections, Key Quotes and PDF deep-link affordances.
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

Only `UI-D001` through `UI-D004` (layout only) are approved so far. **Do not start implementation, publish a code-start authorization, or imply independent QA passed.** Continue Design review one decision at a time, then publish frozen `DESIGN_APPROVED.md` and a separate scoped execution authorization only when explicitly approved.
