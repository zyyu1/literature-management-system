# Module 002 — Decision-to-Acceptance Traceability

**Prepared:** 2026-11-23 · **Original source SHA:** `1fae122ba3effba414ae8dbd05c1a52d6f42918b` · **State:** NOT FROZEN / NO RUNTIME QA. Links: [Canonical Draft](DESIGN_DRAFT.md), [Decision Log](../../governance/DECISION_LOG.md), [Consistency Audit](CONSISTENCY_AUDIT.md).

These are UI-D006 **planned** test templates, not observed results. Actual QA must record implementation SHA, exact OS/browser/device, assistive-tech/input configuration, synthetic fixture, preconditions, reproducible steps, expected and actual state, privacy-safe evidence, P0/P1/P2 classification, and independent conclusion. No live Zotero PDFs, user notes or credentials.

## L1–L4 scenario catalog (26; not executed)

| Scenario | Device/input | Future coverage | Status |
| --- | --- | --- | --- |
| U6-L1-01 | All devices | Project Home card/list, search, totals, focus | NOT RUN |
| U6-L1-02 | Desktop/tablet/phone | Project literature table/cards, tabs, sort/filter, count distinction | NOT RUN |
| U6-L1-03 | All devices | Detail two/one column, long paper metadata, notes and quotes | NOT RUN |
| U6-L1-04 | Phone/tablet | More, batch sheets, long modal, safe area/keyboard access | NOT RUN |
| U6-L1-05 | Keyboard, VoiceOver, TalkBack | Focus, semantics, screen-reader announcements and large text | NOT RUN |
| U6-L2-01 | Desktop/phone | Project create/edit/archive/restore/delete with safe confirm | NOT RUN |
| U6-L2-02 | Desktop/tablet | Zotero manual and one-time Collection import without duplicate | NOT RUN |
| U6-L2-03 | All devices | Global three-state Reading Status, search/filter/sort | NOT RUN |
| U6-L2-04 | Desktop/phone | Per-Project Important star, tabs and honest counts | NOT RUN |
| U6-L2-05 | Phone | Hidden Select, scoped batch confirmation and individual batch result reopen | NOT RUN |
| U6-L2-06 | All devices | Five Markdown fields, edit/preview/autosave/Save Now/export | NOT RUN |
| U6-L2-07 | All devices | Highlight picker, Key Quote, source history and manual Relink | NOT RUN |
| U6-L3-01 | Two clients | Lost/delayed acknowledgment with truthful confirmed state | NOT RUN |
| U6-L3-02 | All devices | Cancel/escape Project delete, unlink and batch with no write | NOT RUN |
| U6-L3-03 | Phone | Overlapping pending batch outcomes independent of filters | NOT RUN |
| U6-L3-04 | Phone | Important Saving/Failed/Unknown during Select and after exit | NOT RUN |
| U6-L3-05 | Two clients | Offline draft, remote conflict, merge/revision recheck | NOT RUN |
| U6-L3-06 | All devices | Relink failed/unknown/stale; old source/history preserved | NOT RUN |
| U6-L3-07 | Desktop/iOS/Android | Zotero error categories and explicit source-open fallback | NOT RUN |
| U6-L3-08 | Touch/IME/AT | Selection, keyboard, dialog scroll, focus and safe dismissal | NOT RUN |
| U6-L4-01 | Two Projects | Global status/note vs local Important/associations | NOT RUN |
| U6-L4-02 | Two devices | Concurrent note/relink writes and conflict protection | NOT RUN |
| U6-L4-03 | Desktop/iOS/iPadOS/Android | Device Zotero deep link and stored vs linked file syncing | NOT RUN |
| U6-L4-04 | Reload/two devices | Truthful draft/unknown-operation recovery or unavailability | NOT RUN |
| U6-L4-05 | Authenticated clients | Credential/permission/privacy boundaries | NOT RUN |
| U6-L4-06 | Workspace + LMS | Read-only Personal Workspace API and approved deep links | NOT RUN |

**Acceptance invariants:** never duplicate a canonical paper/global note; only change Important in its Project; no destructive unlink of Zotero/global records; no false Saved or blind retry of unknown; protect local drafts and source history; all controls operable at safe-area/large-text with screen readers; never assert untested Zotero app/deep-link or WebDAV syncing. P0 data/security issues and P1 blocked critical tasks/accessibility prevent acceptance. P2 purely noncritical presentation issues may be tracked.

## 67 approved UI-D decisions mapped to planned scenarios

| UI decision | Subject | Scenario IDs | Runtime result |
| --- | --- | --- | --- |
| UI-D001 | Projects home layout: APPROVED | U6-L1-01, U6-L2-01 | NOT RUN |
| UI-D002 | Project lifecycle and actions: APPROVED | U6-L1-01, U6-L2-01, U6-L3-02 | NOT RUN |
| UI-D003 | Projects Home information density: APPROVED | U6-L1-01, U6-L2-01 | NOT RUN |
| UI-D004 | Project Literature List responsive layout: APPROVED | U6-L1-02, U6-L2-03 | NOT RUN |
| UI-D004.1 | Project Literature List standard management: APPROVED | U6-L1-02, U6-L2-03, U6-L2-02 | NOT RUN |
| UI-D005 | Literature Detail main responsive layout: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.1 | Research Notes saving: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.2 | Key Quotes manual entry + selective Zotero highlight linking: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D005.1a | Research Notes Markdown editor: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.2a | Zotero highlight picker presentation: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D004.2 | Literature fields and sorting: APPROVED | U6-L1-02, U6-L2-03 | NOT RUN |
| UI-D005.1b | Per-field Markdown Edit / Preview: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.2b | Key Quote source-opening fallback: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03, U6-L3-07 | NOT RUN |
| UI-D004.3 | Project Literature List default sort: APPROVED | U6-L1-02, U6-L2-03 | NOT RUN |
| UI-D004.3a | Project Literature List standard metadata search: APPROVED | U6-L1-02, U6-L2-03 | NOT RUN |
| UI-D004.3b | Graded confirmations and result feedback for import/bulk actions: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3b-R1 | Amendment: selectable Project-unlink scope: APPROVED | U6-L2-05, U6-L3-03, U6-L3-02 | NOT RUN |
| UI-D004.3-R1 | Separate Important Papers section: APPROVED IN PRINCIPLE | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3-R1a | Important Papers tab navigation: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3-R1b | Important flag scoped to each Project: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3-R1c | Important Papers newest-marked-first default order: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D005.1c | Offline draft recovery and field-level note conflict resolution: APPROVED | U6-L2-06, U6-L3-05, U6-L4-02 | NOT RUN |
| UI-D004.3-R1d | Important star shortcut plus Actions menu: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D005.2c | Zotero highlight picker default page order: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D005.2d | Classified Zotero highlight-picker feedback and recovery: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03, U6-L3-07 | NOT RUN |
| UI-D005.2e | Manual reconciliation of changed Zotero source highlights: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D005.2f | Zotero highlight picker grouped by PDF attachment: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D005.2g | Explicit manual source re-link with provenance retention: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03, U6-L4-02 | NOT RUN |
| UI-D004.3-R1e | Tab counts and session-local independent sort preferences: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3c | Phone literature dedicated Select mode: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D005.1d | Standard academic Markdown toolbar: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.1e | Typora-compatible complete-note Markdown export: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.1f | Explicit unsynced Markdown draft recovery dialog: APPROVED | U6-L2-06, U6-L3-05, U6-L4-04 | NOT RUN |
| UI-D005.1g | Explicit choice of Local Draft vs Saved Version for Markdown export: APPROVED | U6-L2-06, U6-L3-05 | NOT RUN |
| UI-D005.1h | Clear only verified-synchronized local draft copies: APPROVED | U6-L2-06, U6-L3-05 | NOT RUN |
| UI-D005.1i | Per-field Markdown selection, caret and scroll restoration: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.1j | Local unsynced draft privacy display and explicit manual discard confirmation: APPROVED | U6-L2-06, U6-L3-05 | NOT RUN |
| UI-D005.1k | Distinct Local Draft and Saved Version Markdown export filenames: APPROVED | U6-L2-06, U6-L3-05 | NOT RUN |
| UI-D004.3-R1f | Fixed unfiltered tab totals and separate filtered result count: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3d | Project-scoped multi-selection persists across tabs and filters: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3-R1g | Fixed Important star shortcut positions with Actions-menu parity: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3-R1h | Confirmed-only Important star updates with Saving/Retry feedback: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3-R1i | Neutral rounded tab-count badges on desktop and phone: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3e | Mobile batch results summary with expandable failures and safe Retry Failed: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3f | Pre-batch confirmation with full and hidden selection counts and expandable papers: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3-R1j | Inline Important-star Saving/success status and per-paper failure with Retry: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3-R1k | Hide per-paper Important star shortcuts while phone Select mode is active: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D005.2h | Expandable chronological Key Quote Source History with honest provenance: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D005.2i | Side-by-side old/new Relink Source confirmation with uncertain original-source warning: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03, U6-L4-02 | NOT RUN |
| UI-D005.2j | Return to the Key Quote and source-focused status after confirmed Relink: APPROVED | U6-L2-07, U6-L3-06, U6-L4-03 | NOT RUN |
| UI-D005.1l | Responsive academic Markdown toolbar with mobile common actions and More menu: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.1m | Per-field accessible focus and keyboard navigation for note conflict and local-draft recovery: APPROVED | U6-L2-06, U6-L3-05, U6-L1-04, U6-L1-05 | NOT RUN |
| UI-D005.1n | Common Markdown formatting shortcuts without browser/assistive-tech conflicts: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D005.1o | Adaptive phone Markdown More menu around the virtual keyboard: APPROVED | U6-L1-03, U6-L2-06 | NOT RUN |
| UI-D004.3-R1l | Hide individual Actions in phone Select mode, preserve ongoing write/error state: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3g | Scrollable phone bottom sheet for pre-batch confirmation: APPROVED | U6-L2-05, U6-L3-03, U6-L1-04 | NOT RUN |
| UI-D004.3h | Subtle highlighting of actual literature search matches on desktop and phone: APPROVED | U6-L1-02, U6-L2-03 | NOT RUN |
| UI-D004.3i | Per-tab sort field and Ascending/Descending controls on desktop and phone: APPROVED | U6-L1-02, U6-L2-03 | NOT RUN |
| UI-D004.3j | Keep Processing and batch results in the same phone confirmation Bottom Sheet: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3-R1m | Visible per-card Important state plus Select-mode summary across hidden papers: APPROVED | U6-L2-04, U6-L3-04 | NOT RUN |
| UI-D004.3k | Allow closing unresolved batch results while preserving Project-level verification entry: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3l | Dedicated Project Literature header status bar for unresolved batch verification: APPROVED | U6-L2-05, U6-L3-03 | NOT RUN |
| UI-D004.3m | Multi-batch Pending verification header: APPROVED (Option B) | U6-L2-05, U6-L3-03, U6-L4-04 | NOT RUN |
| UI-D004.3-R1n | Compact phone Select-mode Important summary, accessible announcements and focus: APPROVED (Option B) | U6-L2-04, U6-L3-04, U6-L1-05 | NOT RUN |
| UI-D005.1p | Visible-viewport adaptive Markdown More and full-screen phone conflict/recovery dialog: APPROVED (Option B) | U6-L1-03, U6-L2-06, U6-L1-04, U6-L1-05, U6-L3-08 | NOT RUN |
| UI-D005.2k | Adaptive phone Relink Source comparison, in-place errors and safe source-open recovery: APPROVED (Option B) | U6-L2-07, U6-L3-06, U6-L4-03, U6-L1-04, U6-L4-04 | NOT RUN |
| UI-D006 | Layered responsive, accessible and cross-device UI acceptance matrix: APPROVED (Option B) | U6-L1-05, U6-L2-05, U6-L3-05, U6-L4-02 | NOT RUN |

## Gate

Future execution/independent QA must expand these scenarios into deterministic steps and expected output with variants for success, definite failure, unknown/lost ack, cancellation, conflict, inaccessible source, reload and mobile keyboard/screen readers. No QA PASS, app launch, second Nutstore POC-001 success, durable cross-device offline draft or batch ledger is claimed. Product **D006** read-only Workspace API is distinct from **UI-D006** acceptance design. Explicit Design freeze and bounded execution authorization are separate.
