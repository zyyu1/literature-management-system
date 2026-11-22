# Three-Window Protocol — Design / Execution / QA

**Approved collaboration model** · 2026-11-22 · Applies to the independent Literature Management System repository.

## Authority and roles

| Window | May do | Must not do |
|---|---|---|
| Design | Decide requirements and architecture, publish frozen design and bounded execution task, review QA evidence, explicitly accept/reject and authorize merge | Claim unrun tests passed; treat a draft as approval |
| Execution | Read latest `main` + approved handoff, develop on isolated branch, run authorized tests, open PR, publish immutable commit evidence | Self-authorize scope changes; merge into `main` without a separate Design decision; store secrets or real PDF data |
| QA | Check out *exact* PR head SHA, independently review tests, provenance, diff and risks; publish PASS/PARTIAL/FAIL with evidence | Edit implementation while claiming independent review; accept unverified behavior |

GitHub directories are a **process convention**, not enforceable role permissions. Use protected branches and required reviews when supported; do not claim protection has already been configured.

## Authoritative state machine

`DRAFT → DESIGN_APPROVED → EXECUTION_AUTHORIZED → IN_PROGRESS → PR_READY → QA_REVIEW → DESIGN_ACCEPTED / REMEDIATION → MERGE_AUTHORIZED → MERGED`.

Every transition requires evidence. `DESIGN_APPROVED` by itself does not authorize coding; a scoped `EXECUTION_INSTRUCTION.md` plus an explicit start gate must be present. `QA PASS` does not itself authorize merge.

## Per-work-item handoff files

```
docs/handoffs/NNN/
  DESIGN_APPROVED.md          # Frozen scope, no silent edits
  EXECUTION_INSTRUCTION.md    # Specific authorized work and exclusions
  STATUS.md                   # Live stage and exact pointers
  QA_HANDOFF.md               # Execution publishes after PR
  QA_REPORT.md                # QA publishes after independent review
```

For pre-development administrative initialization, work item `000` is used. For the UI phase use `002` after Design approval. Missing `QA_HANDOFF.md` and `QA_REPORT.md` indicate **not performed**, not a documentation error.

## Rules

1. `main` contains only design-approved baseline documentation and separately accepted changes. For code changes, Execution must create `exec/<work-id>-<short-scope>` from the current accepted `main` and open a PR.
2. Execution preflight: fetch latest remote, inspect `git status --short`, branch, HEAD SHA, origin and current frozen scope. If mismatch, STOP and report it.
3. No changes to approved feature scope, identity model, Zotero sync rules, storage/security boundaries or personal-workspace read-only contract without Design amendment.
4. For every PR, Execution provides changed paths, exact HEAD SHA, commands executed and exit codes, test results, known failures, data-safety assessment and QA acceptance matrix.
5. QA verifies exact PR SHA (not a stale checkout), independently checks criteria, and files evidence in PR comment or `QA_REPORT.md`; a status of PASS must distinguish observed results from planned tests.
6. Design reviews QA and independently announces disposition; do not merge before explicit Design merge authorization.
7. Preserve previous reports and frozen decisions. Add amendment files for changes. Never silently rewrite history.
8. Never push Zotero API keys, Nutstore/WebDAV credentials, private PDF files, personal bibliographic exports or real research notes.
9. QA/dev windows do not autonomously start unrelated work, trigger background jobs, deploy, or bind live cloud accounts without explicit authorization.

## STOP conditions

- Missing or inconsistent approved design / exact target repository / upstream SHA.
- No start authorization for implementation, or request to exceed the bounded scope.
- Secrets or personal Zotero/Nutstore content detected in proposed commit.
- POC-001 not passing while code assumes secure, conflict-free, always-available WebDAV storage.
- An OS/platform deep-link or PDF on-demand behavior is claimed as verified without a device test.
- Unknown test outcome or failed test presented as PASS.
