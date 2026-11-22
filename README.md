# Literature Management System — 文献管理系统

**Status:** Module 002 UI design is **FROZEN / DESIGN_APPROVED**. No application code, deployment, Zotero authorization or Nutstore/WebDAV integration has been executed.

This is an **independent responsive website**, not a Zotero replacement. Zotero manages bibliographic metadata, PDF files, annotations, and PDF reading; the website manages Projects, one global status and research note per literature item, and key-quote associations.

## Read first

1. [Requirements & architecture baseline](docs/baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md)
2. [Three-window protocol](docs/governance/THREE_WINDOW_PROTOCOL.md)
3. [Decision log](docs/governance/DECISION_LOG.md)
4. [Handoff index](docs/handoffs/INDEX.md)
5. [Module 002 UI status](docs/ui/002/STATUS.md)

## Current gate

- **Module 001 product requirements:** approved baseline, but technical feasibility pending.
- **D007 note storage:** second Nutstore account via safe API and JSON/Markdown remains a **conditional proposal**, pending independent POC-001 evidence. **POC-001-SCOPE-01** authorizes only [isolated local/synthetic technical work](docs/handoffs/POC-001/EXECUTION_INSTRUCTION.md); real Nutstore account access is **BLOCKED** until separately approved secure configuration.
- **BOOTSTRAP-000:** *documentation/repository initialization only*. This handoff does **not** authorize application source code, Zotero API credentials, cloud deployment, production data or UI implementation.
- **Module 002:** [frozen UI design](docs/ui/002/DESIGN_APPROVED.md) is approved as specification only (67 UI decisions; 26 planned, unrun scenarios). Implementation is **NOT AUTHORIZED**; separate POC-001 and execution gates are required.
- **QA:** none completed for this repository; no PR or CI pass is implied by these documents.

## Role separation

- **Design window:** approves product scope, freezes instructions, audits QA, and alone releases subsequent phases.
- **Execution window:** works only within approved scope, on a separate branch, provides exact commit/PR and test evidence, then stops for QA.
- **QA window:** pulls the exact GitHub commit and independently validates; never edits implementation during review.

GitHub is the durable handoff channel; messages and agent context are not the authoritative source. No secrets, user PDFs, Zotero SQLite DB, export of personal notes, or real WebDAV credentials belong in the repository.
