# Module 002 — DESIGN APPROVED (Frozen UI/Interaction Specification)

**Decision:** UI-FREEZE-01, user-approved **Option B**, 2026-11-23 (Europe/Berlin).  
**Stage:** **DESIGN_APPROVED / FROZEN**.  
**Implementation:** **NOT AUTHORIZED / NOT STARTED**.  
**POC-001:** **NOT AUTHORIZED / NOT RUN**.  
**Independent runtime QA:** **NOT STARTED**.  
**Pinned pre-freeze source:** `d79eb0aa406b1596d04441d12e9f8f5ce0aff517` on `main`.

## 1. Freeze authority and unchangeable scope

This is the one authoritative, immutable-by-policy **Module 002 UI and interaction specification**. All **67** approved individual UI-D decisions and **26** *planned* L1–L4 acceptance scenarios are incorporated by reference to the exact Git commit and blob identifiers below. These pinned files, not future mutable `main`, define the frozen behavior. A historical early “pending” statement is superseded by the explicitly named later APPROVED refinement **only within its stated scope**. The recorded [Consistency Audit](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/CONSISTENCY_AUDIT.md) explains editorial normalization.

**This design approval is not code-start permission, an implementation, POC-001 proof, deployed service, actual device test or QA PASS.** Product D006 = the Personal Workspace read-only API; UI-D006 = the planned cross-device UI acceptance design.

### Normative source manifest

| Pinned source | Git blob SHA | Meaning |
| --- | --- | --- |
| [`docs/ui/002/DESIGN_DRAFT.md`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md) | `b4dec96952a342db3d2fb5d20203bb234aa7f31e` | Complete operative UI design |
| [`docs/ui/002/ACCEPTANCE_TRACEABILITY.md`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md) | `dc87a3e87fd2c80ebabf951186d41e34e6ac0a32` | 67-ID to 26-scenario mapping |
| [`docs/ui/002/CONSISTENCY_AUDIT.md`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/CONSISTENCY_AUDIT.md) | `6cf7da5425c1bcc3310966dd3a4ad69e1417c568` | Pre-freeze editorial audit |
| [`docs/governance/DECISION_LOG.md`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/governance/DECISION_LOG.md) | `0b490588638eb09765a3d3e487e8e00c0aac05f4` | 67 UI-D approvals |

## 2. Mandatory safety and UX boundaries

- **Canonical data:** one Zotero paper may belong to multiple Projects, but has **one globally shared three-state Reading Status** and **one global five-field Markdown Research Note**. Important flags and associations are per Project.
- **Destructive scope:** Project deletion and current/all-Project unlink never erase the canonical Zotero item, PDF, annotations, global Reading Status, notes, Key Quotes or source provenance. Confirm exact scope before any write. No unapproved bulk Important action.
- **Notes:** Edit/Preview, Typora-compatible export, local draft and five-field conflict recovery must preserve text, field-scoped selection, IME, accessible focus and revision-safe whole-note writes. Never label Saved before reliable remote acknowledgment; Never discard on modal close or keyboard changes.
- **Batches and Important:** individual batch identity, scope and confirmed/unknown outcomes remain distinct. Current-Project Pending verification header does not merge with the Select-mode Important Saving/Failed/Unknown summary; unknown is never silently reclassified or blindly retried.
- **Key Quotes/Zotero:** user-saved excerpt and personal comment remain intact during Relink Source. Provenance history advances only after confirmed protected persistence. Zotero owns original metadata, PDFs and annotations; the website does not copy PDFs or auto-reassign/delete original highlights. The source opening fallback is explicitly selected (supported annotation → paper/PDF with page hint → copy saved excerpt).
- **Responsive and accessibility:** desktop tables/two-column Detail, phone cards/one-column Detail, adaptive tablet; phone selection, keyboard-aware Markdown More, scrollable modal/sheet, safe areas, zoom/large text and keyboard/VoiceOver/TalkBack affordances. Dynamic feedback has noncolor labels and safe focus restoration.

## 3. All 67 frozen approved UI decisions

Each row links to the **exact source line at the frozen revision**. The full original section is incorporated as binding approved design.

| UI decision | Subject | Design approval |
| --- | --- | --- |
| [`UI-D001`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L34) | Projects home layout: APPROVED | APPROVED |
| [`UI-D002`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L44) | Project lifecycle and actions: APPROVED | APPROVED |
| [`UI-D003`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L56) | Projects Home information density: APPROVED | APPROVED |
| [`UI-D004`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L68) | Project Literature List responsive layout: APPROVED | APPROVED |
| [`UI-D004.1`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L79) | Project Literature List standard management: APPROVED | APPROVED |
| [`UI-D005`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L96) | Literature Detail main responsive layout: APPROVED | APPROVED |
| [`UI-D005.1`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L108) | Research Notes saving: APPROVED | APPROVED |
| [`UI-D005.2`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L121) | Key Quotes manual entry + selective Zotero highlight linking: APPROVED | APPROVED |
| [`UI-D005.1a`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L136) | Research Notes Markdown editor: APPROVED | APPROVED |
| [`UI-D005.2a`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L149) | Zotero highlight picker presentation: APPROVED | APPROVED |
| [`UI-D004.2`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L163) | Literature fields and sorting: APPROVED | APPROVED |
| [`UI-D005.1b`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L175) | Per-field Markdown Edit / Preview: APPROVED | APPROVED |
| [`UI-D005.2b`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L187) | Key Quote source-opening fallback: APPROVED | APPROVED |
| [`UI-D004.3`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L201) | Project Literature List default sort: APPROVED | APPROVED |
| [`UI-D004.3a`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L212) | Project Literature List standard metadata search: APPROVED | APPROVED |
| [`UI-D004.3b`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L224) | Graded confirmations and result feedback for import/bulk actions: APPROVED | APPROVED |
| [`UI-D004.3b-R1`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L239) | Amendment: selectable Project-unlink scope: APPROVED | APPROVED |
| [`UI-D004.3-R1`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L253) | Separate Important Papers section: APPROVED IN PRINCIPLE | APPROVED |
| [`UI-D004.3-R1a`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L265) | Important Papers tab navigation: APPROVED | APPROVED |
| [`UI-D004.3-R1b`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L278) | Important flag scoped to each Project: APPROVED | APPROVED |
| [`UI-D004.3-R1c`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L290) | Important Papers newest-marked-first default order: APPROVED | APPROVED |
| [`UI-D005.1c`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L302) | Offline draft recovery and field-level note conflict resolution: APPROVED | APPROVED |
| [`UI-D004.3-R1d`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L317) | Important star shortcut plus Actions menu: APPROVED | APPROVED |
| [`UI-D005.2c`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L329) | Zotero highlight picker default page order: APPROVED | APPROVED |
| [`UI-D005.2d`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L341) | Classified Zotero highlight-picker feedback and recovery: APPROVED | APPROVED |
| [`UI-D005.2e`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L357) | Manual reconciliation of changed Zotero source highlights: APPROVED | APPROVED |
| [`UI-D005.2f`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L372) | Zotero highlight picker grouped by PDF attachment: APPROVED | APPROVED |
| [`UI-D005.2g`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L387) | Explicit manual source re-link with provenance retention: APPROVED | APPROVED |
| [`UI-D004.3-R1e`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L402) | Tab counts and session-local independent sort preferences: APPROVED | APPROVED |
| [`UI-D004.3c`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L413) | Phone literature dedicated Select mode: APPROVED | APPROVED |
| [`UI-D005.1d`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L426) | Standard academic Markdown toolbar: APPROVED | APPROVED |
| [`UI-D005.1e`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L439) | Typora-compatible complete-note Markdown export: APPROVED | APPROVED |
| [`UI-D005.1f`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L452) | Explicit unsynced Markdown draft recovery dialog: APPROVED | APPROVED |
| [`UI-D005.1g`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L467) | Explicit choice of Local Draft vs Saved Version for Markdown export: APPROVED | APPROVED |
| [`UI-D005.1h`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L482) | Clear only verified-synchronized local draft copies: APPROVED | APPROVED |
| [`UI-D005.1i`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L497) | Per-field Markdown selection, caret and scroll restoration: APPROVED | APPROVED |
| [`UI-D005.1j`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L512) | Local unsynced draft privacy display and explicit manual discard confirmation: APPROVED | APPROVED |
| [`UI-D005.1k`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L527) | Distinct Local Draft and Saved Version Markdown export filenames: APPROVED | APPROVED |
| [`UI-D004.3-R1f`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L541) | Fixed unfiltered tab totals and separate filtered result count: APPROVED | APPROVED |
| [`UI-D004.3d`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L555) | Project-scoped multi-selection persists across tabs and filters: APPROVED | APPROVED |
| [`UI-D004.3-R1g`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L568) | Fixed Important star shortcut positions with Actions-menu parity: APPROVED | APPROVED |
| [`UI-D004.3-R1h`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L582) | Confirmed-only Important star updates with Saving/Retry feedback: APPROVED | APPROVED |
| [`UI-D004.3-R1i`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L597) | Neutral rounded tab-count badges on desktop and phone: APPROVED | APPROVED |
| [`UI-D004.3e`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L611) | Mobile batch results summary with expandable failures and safe Retry Failed: APPROVED | APPROVED |
| [`UI-D004.3f`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L627) | Pre-batch confirmation with full and hidden selection counts and expandable papers: APPROVED | APPROVED |
| [`UI-D004.3-R1j`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L643) | Inline Important-star Saving/success status and per-paper failure with Retry: APPROVED | APPROVED |
| [`UI-D004.3-R1k`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L657) | Hide per-paper Important star shortcuts while phone Select mode is active: APPROVED | APPROVED |
| [`UI-D005.2h`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L671) | Expandable chronological Key Quote Source History with honest provenance: APPROVED | APPROVED |
| [`UI-D005.2i`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L686) | Side-by-side old/new Relink Source confirmation with uncertain original-source warning: APPROVED | APPROVED |
| [`UI-D005.2j`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L702) | Return to the Key Quote and source-focused status after confirmed Relink: APPROVED | APPROVED |
| [`UI-D005.1l`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L717) | Responsive academic Markdown toolbar with mobile common actions and More menu: APPROVED | APPROVED |
| [`UI-D005.1m`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L732) | Per-field accessible focus and keyboard navigation for note conflict and local-draft recovery: APPROVED | APPROVED |
| [`UI-D005.1n`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L747) | Common Markdown formatting shortcuts without browser/assistive-tech conflicts: APPROVED | APPROVED |
| [`UI-D005.1o`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L761) | Adaptive phone Markdown More menu around the virtual keyboard: APPROVED | APPROVED |
| [`UI-D004.3-R1l`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L776) | Hide individual Actions in phone Select mode, preserve ongoing write/error state: APPROVED | APPROVED |
| [`UI-D004.3g`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L791) | Scrollable phone bottom sheet for pre-batch confirmation: APPROVED | APPROVED |
| [`UI-D004.3h`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L806) | Subtle highlighting of actual literature search matches on desktop and phone: APPROVED | APPROVED |
| [`UI-D004.3i`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L820) | Per-tab sort field and Ascending/Descending controls on desktop and phone: APPROVED | APPROVED |
| [`UI-D004.3j`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L835) | Keep Processing and batch results in the same phone confirmation Bottom Sheet: APPROVED | APPROVED |
| [`UI-D004.3-R1m`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L851) | Visible per-card Important state plus Select-mode summary across hidden papers: APPROVED | APPROVED |
| [`UI-D004.3k`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L866) | Allow closing unresolved batch results while preserving Project-level verification entry: APPROVED | APPROVED |
| [`UI-D004.3l`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L881) | Dedicated Project Literature header status bar for unresolved batch verification: APPROVED | APPROVED |
| [`UI-D004.3m`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L897) | Multi-batch Pending verification header: APPROVED (Option B) | APPROVED |
| [`UI-D004.3-R1n`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L914) | Compact phone Select-mode Important summary, accessible announcements and focus: APPROVED (Option B) | APPROVED |
| [`UI-D005.1p`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L931) | Visible-viewport adaptive Markdown More and full-screen phone conflict/recovery dialog: APPROVED (Option B) | APPROVED |
| [`UI-D005.2k`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L947) | Adaptive phone Relink Source comparison, in-place errors and safe source-open recovery: APPROVED (Option B) | APPROVED |
| [`UI-D006`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/DESIGN_DRAFT.md#L961) | Layered responsive, accessible and cross-device UI acceptance matrix: APPROVED (Option B) | APPROVED |

## 4. All 26 planned acceptance scenarios — NOT RUN

UI-D006 Option B defines **L1 responsive/accessibility**, **L2 user workflows**, **L3 failure/recovery**, **L4 cross-device integrity**. These scenarios are future QA instructions, not tested outcomes.

| Scenario | Target/input | Planned coverage | Runtime QA |
| --- | --- | --- | --- |
| [`U6-L1-01`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L11) | All devices | Project Home card/list, search, totals, focus | NOT RUN |
| [`U6-L1-02`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L12) | Desktop/tablet/phone | Project literature table/cards, tabs, sort/filter, count distinction | NOT RUN |
| [`U6-L1-03`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L13) | All devices | Detail two/one column, long paper metadata, notes and quotes | NOT RUN |
| [`U6-L1-04`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L14) | Phone/tablet | More, batch sheets, long modal, safe area/keyboard access | NOT RUN |
| [`U6-L1-05`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L15) | Keyboard, VoiceOver, TalkBack | Focus, semantics, screen-reader announcements and large text | NOT RUN |
| [`U6-L2-01`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L16) | Desktop/phone | Project create/edit/archive/restore/delete with safe confirm | NOT RUN |
| [`U6-L2-02`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L17) | Desktop/tablet | Zotero manual and one-time Collection import without duplicate | NOT RUN |
| [`U6-L2-03`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L18) | All devices | Global three-state Reading Status, search/filter/sort | NOT RUN |
| [`U6-L2-04`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L19) | Desktop/phone | Per-Project Important star, tabs and honest counts | NOT RUN |
| [`U6-L2-05`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L20) | Phone | Hidden Select, scoped batch confirmation and individual batch result reopen | NOT RUN |
| [`U6-L2-06`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L21) | All devices | Five Markdown fields, edit/preview/autosave/Save Now/export | NOT RUN |
| [`U6-L2-07`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L22) | All devices | Highlight picker, Key Quote, source history and manual Relink | NOT RUN |
| [`U6-L3-01`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L23) | Two clients | Lost/delayed acknowledgment with truthful confirmed state | NOT RUN |
| [`U6-L3-02`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L24) | All devices | Cancel/escape Project delete, unlink and batch with no write | NOT RUN |
| [`U6-L3-03`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L25) | Phone | Overlapping pending batch outcomes independent of filters | NOT RUN |
| [`U6-L3-04`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L26) | Phone | Important Saving/Failed/Unknown during Select and after exit | NOT RUN |
| [`U6-L3-05`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L27) | Two clients | Offline draft, remote conflict, merge/revision recheck | NOT RUN |
| [`U6-L3-06`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L28) | All devices | Relink failed/unknown/stale; old source/history preserved | NOT RUN |
| [`U6-L3-07`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L29) | Desktop/iOS/Android | Zotero error categories and explicit source-open fallback | NOT RUN |
| [`U6-L3-08`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L30) | Touch/IME/AT | Selection, keyboard, dialog scroll, focus and safe dismissal | NOT RUN |
| [`U6-L4-01`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L31) | Two Projects | Global status/note vs local Important/associations | NOT RUN |
| [`U6-L4-02`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L32) | Two devices | Concurrent note/relink writes and conflict protection | NOT RUN |
| [`U6-L4-03`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L33) | Desktop/iOS/iPadOS/Android | Device Zotero deep link and stored vs linked file syncing | NOT RUN |
| [`U6-L4-04`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L34) | Reload/two devices | Truthful draft/unknown-operation recovery or unavailability | NOT RUN |
| [`U6-L4-05`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L35) | Authenticated clients | Credential/permission/privacy boundaries | NOT RUN |
| [`U6-L4-06`](https://github.com/zyyu1/literature-management-system/blob/d79eb0aa406b1596d04441d12e9f8f5ce0aff517/docs/ui/002/ACCEPTANCE_TRACEABILITY.md#L36) | Workspace + LMS | Read-only Personal Workspace API and approved deep links | NOT RUN |

**Risk gates:** P0 (data loss, unauthorized/destructive writes, false remote confirmation, leaked secrets) and P1 (critical path, recovery, accessibility or device operability failure) **block actual acceptance**. P2 is strictly noncritical polish that may be logged with justification. No scenario has run; no PASS/FAIL evidence exists. Later independent QA must record target code SHA, exact device/OS/browser/keyboard/assistive tech, synthetic fixtures, reproducible steps, expected vs actual, privacy-safe evidence and disposition.

## 5. Technical feasibility that this freeze does NOT prove

| Unverified dependency | No unsupported claims | Required later gate |
| --- | --- | --- |
| **POC-001 — second Nutstore account + JSON/Markdown storage** | Not a proven backend; no assured secure WebDAV CRUD, conditional writes, multi-device consistency, offline recovery or backup | Separate bounded POC authorization, safe authenticated API and synthetic-only tests for CRUD, conflict prevention, failure handling, export and recovery |
| **Zotero Web API/annotation identity** | No guaranteed permission, identity, pagination/source revision API or exact highlight locator | Independent API integration verification with no real library export or credentials in Git |
| **Zotero device handoff** | Browser deep-link attempt does not prove current-device Zotero app, correct PDF/page or annotation opened; Android compatibility and iOS/iPadOS behavior may differ | Device/browser tests, truthful manual fallbacks; stored attachments and linked files differ on WebDAV mobile sync |
| **Pending outcomes and local draft durability** | No promise of background polling, reload-safe multi-device batch/Relink ledger or permanent browser drafts | POC-001/integration tests, authoritative read-only reconciliation, honest unavailable/unknown state |
| **Deployment/privacy** | No cloud credentials, live user data, hosting provider, shared token, PDF copy or production service authorized | Later architecture/security/deployment decisions and authorized tests |
| **Runtime QA and code implementation** | NOT STARTED and NOT AUTHORIZED; the 26 scenarios remain NOT RUN | Separate explicit `EXECUTION_INSTRUCTION.md` and start gate, isolated execution PR, independent exact-SHA QA, Design merge disposition |

If the second Nutstore account fails secure storage/concurrency acceptance, STOP and return for a new storage decision. Do not silently substitute a database, WebDAV job queue or different hosting provider; UI behaviors stay frozen until amended.

## 6. Amendments and authority boundaries

1. The frozen requirements are the normative snapshot pinned at `d79eb0aa406b1596d04441d12e9f8f5ce0aff517`, together with this UI-FREEZE-01 publication. Subsequent edits on `main` never silently amend them.
2. Any requirement change requires a separate user-approved `UI-AMEND-...` design decision and versioned amendment document, with explicit effects on the 67 decision register and 26-scenario traceability. Preserve Git history; never silently rewrite this approval.
3. Three-Window Protocol applies: Design decides/finalizes requirements and later separately authorizes bounded execution; Execution works only after a scoped start instruction, on isolated branch; independent QA tests exact head SHA; Design separately authorizes acceptance and merge.
4. **Next decision proposal:** `POC-001-SCOPE-01`, a *separate* narrow feasibility-scope and execution-start authorization. UI-FREEZE-01 grants **no** implementation or POC start permission.

**Disposition: UI-FREEZE-01 APPROVED / MODULE 002 DESIGN FROZEN. POC-001 NOT RUN. INDEPENDENT QA NOT RUN. IMPLEMENTATION NOT AUTHORIZED.**
