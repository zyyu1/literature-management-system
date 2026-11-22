# BOOTSTRAP-000 — Execution Instruction (Documentation Only)

**Authority:** Only publication/review of initial repository docs. Not authority to implement any app feature.

## Preflight

1. Verify `zyyu1/literature-management-system` is PRIVATE and separate from `personal-workspace`.
2. Read latest main and record exact SHA. Verify clean tree and expected docs-only content.
3. Read [approved design](DESIGN_APPROVED.md), [requirements](../../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md) and [three-window rules](../../governance/THREE_WINDOW_PROTOCOL.md).

## Bounded work

- Confirm README, `.gitignore`, baseline, governance, windows guides, Bootstrap-000 docs and UI-002 pending status are published.
- Verify Markdown links; run secret/PDF/user-data check. Publish exact revision and change summary.
- Send the QA window a `QA_HANDOFF.md` or pull-request comment containing source SHA, inventory, validation commands/results, known limitations.
- STOP and request independent QA. Never claim successful CI that has not run.

## Not permitted

Application scaffold, functionality, live Zotero/WebDAV credentials, real PDFs, remote hosting, CI deployment, editing Personal Workspace, starting UI-002 code, or merging future feature branches.

## QA handoff format

```text
Repository / branch:
Exact commit SHA:
Modified paths:
Repository and privacy preflight:
Markdown links:
Sensitive-file scan:
Known limitations:
Outstanding approvals:
```
