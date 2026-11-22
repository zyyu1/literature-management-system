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

| UI-D004.3 | Default Project Literature List sort uses the Project–Literature association creation time descending (newest linked to this Project first), distinct from Zotero import timestamp; all four sort criteria remain selectable | APPROVED 2026-11-22 |

| UI-D004.3a | Search current Project literature metadata only (Zotero title, authors, publication year, DOI), combined with global three-state reading filter and current sorting; note, quote and PDF content excluded | APPROVED 2026-11-22 |

| UI-D004.3b | Graded import/bulk action confirmations: show Zotero import count/results without superfluous confirm; explicit global-impact confirmation for bulk reading-status change and scope-aware unlink confirmation for current or all Projects; partial successes and safe failed-item retry | APPROVED 2026-11-22; AMENDED BY UI-D004.3b-R1; CONCURRENCY/RETRY TECHNICAL VALIDATION PENDING |
| UI-D004.3b-R1 | Per-paper and bulk unlink scope chooser: default remove links from current Project only, or remove all links from every Project including current; stronger explicit cross-Project confirmation; preserve Zotero source, global reading status, Research Notes, Key Quotes and annotations | APPROVED 2026-11-22; UI SCOPE AMENDMENT |

| UI-D004.3-R1 | Separate Important Papers view on each Project Literature page while default All Papers sorting remains newest-project-linked-first; Important is proposed per Project-literature membership, not a global reading state or Zotero mutation | APPROVED IN PRINCIPLE 2026-11-22; TAB LAYOUT APPROVED IN UI-D004.3-R1a |
| UI-D004.3-R1a | Switchable All Papers / Important Papers tabs; All includes Important papers, Important filters subset without copying records; no permanently pinned panel; All preserves newest-project-linked-first default | APPROVED 2026-11-22; FLAG SCOPE/IMPORTANT SORT PENDING |

| UI-D004.3-R1b | Important marker is stored per Project–Literature association, not as global literature metadata; each Project can independently mark the same paper; marking/unmarking never changes global reading state or notes; all-Project unlink removes association markers only | APPROVED 2026-11-22 |

| UI-D004.3-R1c | Important Papers defaults to most-recently-marked-Important-in-current-Project first; All Papers remains newest-Project-linked-first; re-marking refreshes per-Project mark timestamp without changing global notes/status | APPROVED 2026-11-22 |

| UI-D005.1c | Recover unsynced offline drafts; compare five Markdown fields local vs remote; per-field use local/use remote/manual merge; revalidate whole-note remote revision atomically before confirmed save; never silently overwrite, full version history not required | APPROVED 2026-11-22; POC-001 CONCURRENCY/DRAFT FEASIBILITY PENDING |

| UI-D004.3-R1d | Per-paper Important star button on desktop list row and phone card, same mark/unmark action in per-paper Actions menu; Project-specific only, not global state, no bulk marking; confirm authoritative write before claiming persistence | APPROVED 2026-11-22 |

| UI-D005.2c | Zotero highlight picker defaults to ascending PDF page order; preserve multiple highlights on a page; retain and identify missing-page highlights without inventing positions; mapping and multiple attachments require verification | APPROVED 2026-11-22; ZOTERO PAGE METADATA VALIDATION PENDING |

| UI-D005.2d | Classify highlight-picker loading, no highlights, no search matches, network failures, permission/access issues and unavailable original annotations; provide targeted retry/clear/reconnect/manual alternatives; never delete existing Key Quotes or silently submit selections | APPROVED 2026-11-22; API RESPONSE VALIDATION PENDING |

| UI-D005.2e | Retain saved Key Quote after upstream Zotero highlight text changes; when same annotation can be verified, compare saved vs latest and offer explicit Keep Saved Quote or Update Quote from Zotero; preserve personal comments, never auto-sync, never infer deletion from access failure | APPROVED 2026-11-22; ZOTERO ANNOTATION ID/REVISION VERIFICATION PENDING |

| UI-D005.2f | Highlight picker groups annotations by originating Zotero PDF attachment, labels each group, supports expand/collapse and per-attachment ascending PDF page order; selections and exact attachment/annotation identity remain intact | APPROVED 2026-11-22; MULTI-ATTACHMENT API VALIDATION PENDING |

| UI-D005.2g | User-initiated replacement Zotero annotation linking for unavailable original Key Quote source, explicitly confirmed; keep Key Quote excerpt/comment unchanged and old attachment/annotation/page provenance inspectable, no similarity auto-link; remote/version safety required | APPROVED 2026-11-22; SOURCE HISTORY AND CONCURRENCY VALIDATION PENDING |

| UI-D004.3-R1e | Show per-Project All Papers and Important Papers counts; maintain separate user-selected sorts for both tabs while switching in the current open page; fresh page visit can restore All newest-linked and Important newest-marked defaults; no persistent or cross-device sort preference | APPROVED 2026-11-22; EXACT FILTERED COUNT BADGE SEMANTICS PENDING |

| UI-D004.3c | Phone literature uses visible Select entry to a dedicated checkbox multi-select mode with selected-count bottom batch bar and exit action; bar supports only approved global reading-status and scoped Project-unlink operations with their confirmations | APPROVED 2026-11-22; MOBILE SELECTION PERSISTENCE/A11Y DETAILS PENDING |

| UI-D005.1d | Standard academic Markdown source-edit toolbar for the five independent note fields: headings, bold, italic, lists, blockquotes, code, links and math insertion; safe preview, autosave and Typora-compatible export preserved; no rich-text editor or image upload | APPROVED 2026-11-22; RENDERING/CARET VALIDATION PENDING |

| UI-D005.1e | Export one Typora-compatible UTF-8 .md per canonical global Research Note, filename based on sanitized paper title plus Zotero item key; include available Zotero title/authors/year/DOI metadata and all five Markdown sections verbatim; distinguish unsynced draft vs remotely saved content; exclude PDF/Key Quotes | APPROVED 2026-11-22; TYPORA/EXPORT EDGE-CASE VALIDATION PENDING |

| UI-D005.1f | On reopening a note with recoverable unsynced local edits, display an explicit dialog showing available local/remote statuses, timestamps and changed fields; Review & Recover opens five-field comparison; Not Now/close preserves local draft; never overwrite or mark Saved before version-guarded acknowledged remote commit | APPROVED 2026-11-22; LOCAL DRAFT PRIVACY/POC-001 VALIDATION PENDING |

| UI-D005.1g | When unsynced research-note edits exist, the user explicitly chooses Export Local Draft or Export Saved Version; local draft is labeled unsynced and saved export requires a confirmed/candidly cached revision, both preserve five-field Typora Markdown, and neither triggers remote save or draft deletion | APPROVED 2026-11-22; OFFLINE CACHE/DOWNLOAD VERIFICATION PENDING |

| UI-D005.1h | Auto-clean only the exact local draft copy whose remote save is acknowledged and content/version verified with no newer edits or unresolved conflicts; retain offline/failed/unsynced/conflicting drafts; manual discard needs explicit user confirmation; no time-based expiration | APPROVED 2026-11-22; STORAGE PRIVACY/POC-001 RACE VALIDATION PENDING |

| UI-D005.1i | Markdown source toolbar wraps active selection or inserts at caret; per-field caret/selection and edit scroll restored after Edit/Preview toggle across five independent fields; stale ranges never overwrite drafts, no cross-page/cross-device cursor sync | APPROVED 2026-11-22; CARET/IME/A11Y QA PENDING |

## Guardrails

- Zotero remains authoritative for bibliographic metadata, PDF content and original annotations. Existing Nutstore WebDAV remains the Zotero attachment-sync backend.
- Website owns Projects, global reading status, manually written research notes and quote associations; the second Nutstore service is **not technically verified**.
- Secure server-side credentials, data recovery, safe multi-device concurrency and mobile Zotero PDF opening must be tested before claiming completion.
- No personal Zotero library export, passwords, real research notes, token, PDF or Zotero database may be committed to GitHub.

[Canonical requirements](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md).
