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

| UI-D005.1j | Display Local Draft / Not Synced with verified last local edit time and affected Markdown fields; before a specifically targeted manual discard show possible loss, remote saved-version status and Export Local Draft alternative; cancel/export never deletes, explicit confirm required; no independent draft manager | APPROVED 2026-11-22; STORAGE PRIVACY/STALE DISCARD QA PENDING |

| UI-D005.1k | Export Local Draft named `<safe-title>_<zotero-key>_LOCAL-DRAFT.md` and Export Saved Version named `<safe-title>_<zotero-key>_SAVED.md`; suffix reflects actual selected draft/confirmed-saved content, cached saved revisions disclosed honestly, no save/cleanup side effects | APPROVED 2026-11-22; FILENAME/CACHED-REVISION QA PENDING |

| UI-D004.3-R1f | All Papers and Important Papers badges always show unfiltered, distinct per-Project totals; active search or reading-state filter shows a separate matching N results count within the current tab list; sort cannot change counts, no fake zero or stale numbers presented as live | APPROVED 2026-11-22; COUNT/FILTER RESPONSIVE QA PENDING |

| UI-D004.3d | Keep current Project phone Select-mode selections across All/Important tabs, search and reading-status filters even when rows are hidden; show full selected total and warn batch effects include hidden entries; clear on leaving Project or explicit Exit without writing, no cross-Project carryover; revalidate before scoped/global bulk actions | APPROVED 2026-11-22; MOBILE SELECTION AND HIDDEN-ITEM QA PENDING |

| UI-D004.3-R1g | Important shortcut star at the right of each desktop literature row and top-right of each phone literature card; keep equivalent Actions-menu Mark/Unmark per paper, scoped to this Project link; do not conflate with card navigation or mobile Select checkbox | APPROVED 2026-11-22; WRITE FEEDBACK/BADGE AND RESPONSIVE QA PENDING |

| UI-D004.3-R1h | Show Saving and suppress duplicate Important mark/unmark requests for the Project–paper association; update star state and Important count only after confirmed remote success; failed writes keep previous confirmed state with Retry; ambiguous/stale outcomes require remote reconciliation | APPROVED 2026-11-22; WRITE-STATE/CONCURRENT-UPDATE QA PENDING |

| UI-D004.3-R1i | Desktop and phone All Papers / Important Papers tabs use subtle neutral-gray rounded numeric pills immediately beside tab labels, showing verified unfiltered Project-scoped totals only; active filtered N results shown separately in list; no colorful status styling or fabricated zeros | APPROVED 2026-11-22; RESPONSIVE BADGE/A11Y QA PENDING |

| UI-D004.3e | Phone batch operations show Succeeded/Failed/Skipped summary with expandable failed-paper list and available reasons; Retry Failed only applies to failed records still eligible after authoritative revalidation, never confirmed successes; uncertain acknowledgments require verification before retry | APPROVED 2026-11-22; PARTIAL-FAILURE/IDEMPOTENCY QA PENDING |

| UI-D004.3f | Before mobile bulk apply, show distinct total selected and hidden selected counts, target action and scope, and expandable full selected-paper list including hidden entries; global reading-status effect clear; all-Project unlink retains stronger affirmative confirmation; cancel never writes | APPROVED 2026-11-22; COPY/RESPONSIVE CONFIRMATION QA PENDING |

| UI-D004.3-R1j | Beside each Important star show Saving and brief post-acknowledgment success feedback; on definite failure show that paper row/card's reason and Retry; accessible status announcements and safe focus, no false optimistic state, duplicate write or blind retry on unknown outcomes | APPROVED 2026-11-22; INLINE FEEDBACK/A11Y QA PENDING |

| UI-D004.3-R1k | On phone paper cards, entering Select mode hides the top-right Important star shortcut and presents the selection checkbox there; exit restores the current confirmed per-Project star. Checkbox only changes temporary Project selection, no accidental Important toggle; in-flight write states remain protected | APPROVED 2026-11-22; PHONE MODE SWITCH/A11Y QA PENDING |

| UI-D005.2h | Show Current Source for each Key Quote and expandable chronological Source History with original/previous/current Zotero PDF, page and highlight identifiers and reliable re-link timestamps; explicitly mark missing/unverified source metadata, preserve prior provenance and saved quote/comments, no automatic re-link | APPROVED 2026-11-22; PROVENANCE STORAGE/SOURCE-VERSION QA PENDING |

| UI-D005.2i | Before manual Relink Source, show Existing/Current vs New PDF/page/annotation provenance and warn that unreachable old highlight may not be deleted; explicit Cancel/Confirm; confirmed save updates only active source and append-only history while preserving saved quote/comment; concurrency- and uncertainty-safe | APPROVED 2026-11-22; RELINK CONFIRMATION/CONFLICT QA PENDING |

| UI-D005.2j | After confirmed remote Relink write, dismiss confirmation, return to the original Key Quote, update Current Source and show brief success, retain accessible expandable Source History and restore focus to source region; cancel or uncertain/failed writes never claim success or mutate confirmed quote/provenance | APPROVED 2026-11-22; FOCUS/ACK-LOSS AND MOBILE QA PENDING |

| UI-D005.1l | On phone Edit fields show Bold/Italic/Heading/List plus More for remaining academic Markdown commands; desktop keeps full toolbar; all commands preserve the current field's valid caret/selection across toolbar/Menu focus and are keyboard/screen-reader accessible; opening More causes no write | APPROVED 2026-11-22; MOBILE TOOLBAR/IME/A11Y QA PENDING |

| UI-D005.1m | Local-draft recovery and multi-device conflict dialogs use accessible per-field keyboard navigation across the five fixed Markdown fields; focus enters dialog, follows comparison field and returns to initiating editor/caret or safe fallback. Focus, tabbing, Cancel/Escape and Not Now never save, merge or delete drafts; version-guarded remote confirmation remains required | APPROVED 2026-11-22; DIALOG-FOCUS/SCREEN-READER QA PENDING |

| UI-D005.1n | In focused Research Note Markdown Edit fields, enable Ctrl/Cmd+B bold, Ctrl/Cmd+I italic and Ctrl/Cmd+K link insertion while preserving valid per-field selection/caret; defer to OS/browser/assistive-tech reserved shortcuts, prevent unsafe IME/repeat handling, retain toolbar/More access for all formatting | APPROVED 2026-11-23; PLATFORM SHORTCUT/IME QA PENDING |

| UI-D005.1o | Phone More menu adapts from a button-anchored popover when room allows to a compact keyboard-aware bottom action panel when virtual keyboard constrains space; same full Markdown commands, preserve active field selection/IME/focus, accessible touch/keyboard/screen-reader access and no write on menu open/close/layout switch | APPROVED 2026-11-23; MOBILE VIEWPORT/KEYBOARD QA PENDING |

| UI-D004.3-R1l | In phone Select mode hide individual Actions menus and Important star shortcuts; only checkbox selection and the bottom approved batch-action bar act on papers, with normal menus/star restored on exit. Preserve ongoing per-paper Saving, failure and unknown states through transition; expose truthful read-only status in Select mode and restore recovery/Retry after exit, never fabricate success | APPROVED 2026-11-23; MOBILE MODE-TRANSITION/STATUS A11Y QA PENDING |

## Guardrails

- Zotero remains authoritative for bibliographic metadata, PDF content and original annotations. Existing Nutstore WebDAV remains the Zotero attachment-sync backend.
- Website owns Projects, global reading status, manually written research notes and quote associations; the second Nutstore service is **not technically verified**.
- Secure server-side credentials, data recovery, safe multi-device concurrency and mobile Zotero PDF opening must be tested before claiming completion.
- No personal Zotero library export, passwords, real research notes, token, PDF or Zotero database may be committed to GitHub.

[Canonical requirements](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md).
