# BOOTSTRAP-000 — Independent QA

**REVIEW ONLY.** Pull exact commit SHA, do not alter application code or approved design.

1. Confirm private repo identity and exact commit SHA from Design.
2. Compare canonical baseline with original provided Markdown; check complete file inventory and all relative Markdown links.
3. Check readme, governance, handoffs, role separation and actual implementation gates for consistency.
4. Scan for API tokens, passwords, PDF files, Zotero SQLite databases, private notes and personal data; no such files may be tracked.
5. Verify current state: docs only, no app implementation, no live Zotero or Nutstore POC, no CI passing claim.
6. Publish explicit PASS/PARTIAL/FAIL result for each check with evidence; STOP for Design evaluation.

| Check | Requirement |
| --- | --- |
| B000-01 | Correct independent private GitHub repo |
| B000-02 | Exact requirements baseline preserved |
| B000-03 | Governance and decision log agree with approved choices |
| B000-04 | Execution scope strictly docs-only |
| B000-05 | No secrets, PDFs, personal notes, database artifacts |
| B000-06 | All Markdown relative paths exist |
| B000-07 | STATUS accurately shows unimplemented UI and no QA |
| B000-08 | Exact commit SHA and source provenance available |
| B000-09 | UI/POC not falsely marked completed |
| B000-10 | Independent reproducible QA proof supplied |

All checks **NOT STARTED** at publication.
