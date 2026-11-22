# GitHub Operations — Literature Management System

**Repository:** [zyyu1/literature-management-system](https://github.com/zyyu1/literature-management-system) (**PRIVATE; verified 2026-11-22**).

**Important:** The empty-repository initialization has already been performed. **Do not run `git init` or `git push -f` again.** The current working baseline is `main` in this existing repository. Keep the separate Personal Workspace repository untouched.

## Execution / QA initial checkout — PowerShell (Windows)

```powershell
git clone https://github.com/zyyu1/literature-management-system.git
Set-Location literature-management-system
git remote -v
git fetch origin main
git status --short
git rev-parse origin/main
git show origin/main:docs/handoffs/INDEX.md
git show origin/main:docs/governance/THREE_WINDOW_PROTOCOL.md
```

If a clone already exists, run `git fetch origin main` there; do not overwrite local changes.

## Read the frozen documentation

```powershell
git show origin/main:docs/baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md
git show origin/main:docs/governance/DECISION_LOG.md
git show origin/main:docs/handoffs/000/DESIGN_APPROVED.md
git show origin/main:docs/handoffs/000/EXECUTION_INSTRUCTION.md
git show origin/main:docs/handoffs/000/QA_INSTRUCTION.md
git show origin/main:docs/handoffs/000/STATUS.md
```

## Review exactly one immutable commit

Use the exact SHA provided in the corresponding QA handoff or Design Window, not an assumed current `main`.

```powershell
$sha = "<VERIFIED_FULL_COMMIT_SHA>"
git fetch origin main
git checkout --detach $sha
git rev-parse HEAD
git status --short
git ls-tree -r --name-only HEAD
git diff-tree --no-commit-id --name-only -r HEAD
```

Replace the placeholder with a real 40-character SHA; do not literally paste brackets.

## Future feature development — only after explicit Design authorization

```powershell
git fetch origin main
git switch main
git pull --ff-only origin main
git status --short
# Only on a clean tree and with an approved frozen module + code-start authorization:
git switch -c exec/<MODULE-ID>-<SHORT-SCOPE>
```

Do not create feature branches until a specific module is authorized. Execution submits a PR and `QA_HANDOFF.md`; QA independently checks the exact PR head. **Neither Execution nor QA may merge without an explicit Design decision.**

## Safety

Do not store GitHub tokens, Zotero API credentials, Nutstore/WebDAV app passwords, actual PDF files, user notes, Zotero SQLite or personal bibliographic exports in the repository. POC-001 remains unexecuted and not authorized until Design publishes a bounded test scope.
