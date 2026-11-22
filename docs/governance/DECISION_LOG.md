# Literature Management System — Decision Log

**Baseline date:** 2026-11-22 (Europe/Berlin). Technical hypotheses are NOT proof of integration.

| ID | Confirmed decision | Status |
| --- | --- | --- |
| D001 | Multiple Projects can reference the same Zotero item; only ONE global reading status and ONE research note per item | APPROVED |
| D002 | Search/select Zotero items manually, or ONE-TIME batch import of a Zotero Collection (no continuous Collection binding) | APPROVED |
| D003 | Reading statuses limited to To Read / Reading / Read | APPROVED |
| D004 | Zotero title/authors, manual research question, argument/content, theories/methods, innovations, limitations, multiple source-linked quotations | APPROVED |
| D004-A | Zotero PDF annotation and highlight association; aim for direct source jump where platform permits | APPROVED GOAL; TECHNICAL CHECK PENDING |
| D005 | Internet-accessible responsive site; use current device's Zotero desktop/mobile app for PDF launch | APPROVED GOAL; CROSS-DEVICE VALIDATION PENDING |
| D005-S | Existing Zotero metadata sync and Nutstore WebDAV attachment sync; website never duplicates PDFs | CONFIRMED ENVIRONMENT |
| D006 | Independent Personal Workspace reads authenticated read-only API and opens deep links; writing stays in literature site | APPROVED |
| D007 | Lightweight standalone web site; second Nutstore account for JSON/Markdown notes behind secure API; MVP no PostgreSQL | CONDITIONALLY APPROVED, SUBJECT TO POC-001 |
| OSS | Review Notero (MIT), Better Notes (AGPL), PaperPilot (MIT) for selective reuse | REFERENCE STRATEGY APPROVED; CODE COPYING NOT AUTHORIZED |
| D007-A | Hosting/provider, domain, authentication method | UNDECIDED |
| UI-002 | Detailed desktop/mobile UI interaction design | IN DESIGN; NOT FROZEN |
| UI-D001 | Projects landing page uses switchable Cards / List layout; default cards; mobile single-column responsive layout | APPROVED 2026-11-22 |
| UI-D002 | Project create/edit/archive/restore/permanent delete with independent second confirmation; delete Project and links only, retain globally shared Zotero items, statuses, notes and quotes | APPROVED 2026-11-22 |
| UI-D003 | Projects Home Standard view: name, optional description, total literature, three-state counts, reading-progress bar; search, sorting and archived browsing; same data in Cards/List | APPROVED 2026-11-22 |
| UI-D004 | Project Literature List responsive layout: desktop table; mobile compact cards; tablet adaptive; shared global paper identity/status | APPROVED 2026-11-22; UI-D004.1 STANDARD MANAGEMENT APPROVED, DETAILED CONTROLS PENDING |

| UI-D004.1 | Standard list management: current-Project search/filter/sort; Zotero single/multi selection and one-off Collection import; bulk global reading-state update; bulk removal only of Project-paper links; no duplicate canonical Zotero items or loss of global notes | APPROVED 2026-11-22 |
| UI-D005 | Literature Detail layout: desktop two columns (Research Notes left; Key Quotes/Zotero metadata right), mobile single column and adaptive tablet; global note identity unchanged | APPROVED 2026-11-22; NOTES FORMAT AND QUOTE DETAILS PENDING |
| UI-D005.1 | Research Notes autosave plus Save Now; offline recoverable local draft and clearly marked sync status; Saved only after remote acknowledgement; multi-device revision conflict detection with no silent overwrite, conditional on POC-001 | APPROVED 2026-11-22; IMPLEMENTATION FEASIBILITY PENDING |
| UI-D005.2 | Manually add Key Quotes OR selectively link/import Zotero highlights from the current canonical paper; keep source annotation and page references where available; no automatic all-highlight sync | APPROVED 2026-11-22; ZOTERO API/DEEP LINK VALIDATION PENDING |
| UI-D005.1a | Research Notes uses five independent Markdown sections with common formatting toolbar, preview and Typora-compatible Markdown export, subject to UI-D005.1 safe saving and conflict handling | APPROVED 2026-11-22 |
| UI-D005.2a | Zotero highlight picker is right-side desktop panel and full-screen mobile picker, supporting on-demand search, multi-select, excerpt preview and linked-state marking; source jump remains technically unverified | APPROVED 2026-11-22 |

| UI-D004.2 | Standard Literature List: title, authors, publication year, global reading status and Actions menu; mobile essentials; sort by year, title, status or date linked to current Project (not Zotero added date) | APPROVED 2026-11-22 |

| UI-D005.1b | Each of five Markdown note fields independently toggles Edit/Preview (default Edit), safely renders source without mutation and preserves local edits; autosave/Save Now and remote Saved acknowledgement stay mandatory | APPROVED 2026-11-22 |

| UI-D005.2b | Progressive Key Quote source navigation: try precise Zotero annotation when supported, offer paper/PDF + recorded page fallback, then copy excerpt when unavailable; preserve global Key Quote/comment despite missing upstream source; never falsely infer app-launch success | APPROVED 2026-11-22; CROSS-DEVICE VALIDATION PENDING |

## Guardrails

- Zotero remains authoritative for bibliographic metadata, PDF content and original annotations. Existing Nutstore WebDAV remains the Zotero attachment-sync backend.
- Website owns Projects, global reading status, manually written research notes and quote associations; the second Nutstore service is **not technically verified**.
- Secure server-side credentials, data recovery, safe multi-device concurrency and mobile Zotero PDF opening must be tested before claiming completion.
- No personal Zotero library export, passwords, real research notes, token, PDF or Zotero database may be committed to GitHub.

[Canonical requirements](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md).
