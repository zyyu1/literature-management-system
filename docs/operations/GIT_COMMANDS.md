# GitHub Publication and Read-Only Handoff Commands

**Repo name is only proposed until created:** `zyyu1/literature-management-system` — **private**, separate from `personal-workspace`.

## Initial repository creation

The repository must first be created in GitHub UI (Private, ideally empty without auto-generated README) or through an authorized repository-creation tool. This package cannot create a repository by merely issuing Git commands. Never publish to an unrelated repo as a workaround.

## PowerShell (Windows): initialize an empty new remote

Run from the **root of the extracted package** after the GitHub repository has been created:

```powershell
Get-Location
Get-ChildItem -Force
# Confirm no .env, PDF, SQLite, personal notes or credentials in the package

git init -b main
git remote add origin https://github.com/zyyu1/literature-management-system.git
git add .
git diff --cached --name-only
git diff --cached --check
git status --short
# Inspect exact staged file list, stop if unexpected contents
git commit -m "docs: initialize literature-management design and handoffs"
git push -u origin main
git rev-parse HEAD
```

If `main` already exists remotely, do **not** force-push or overwrite: clone/inspect latest `main`, create a separate branch and PR as specified in the protocol.

## Bash/macOS/Linux: initialize empty new remote

```bash
pwd
find . -maxdepth 2 -type f | sort
git init -b main
git remote add origin https://github.com/zyyu1/literature-management-system.git
git add .
git diff --cached --name-only
git diff --cached --check
git status --short
git commit -m "docs: initialize literature-management design and handoffs"
git push -u origin main
git rev-parse HEAD
```

## Execution / QA window read preflight (PowerShell)

```powershell
git clone https://github.com/zyyu1/literature-management-system.git
Set-Location literature-management-system
git remote -v
git fetch origin main
git status --short
git rev-parse origin/main
git show origin/main:docs/handoffs/INDEX.md
```

## Read an exact PR head (do not guess or use latest after a PR update)

```powershell
git fetch origin pull/<PR_NUMBER>/head:refs/remotes/origin/review-pr-<PR_NUMBER>
git rev-parse refs/remotes/origin/review-pr-<PR_NUMBER>
git checkout --detach refs/remotes/origin/review-pr-<PR_NUMBER>
git status --short
```

Replace `<PR_NUMBER>` with an actual existing PR number only. If GitHub connector APIs are available, the Execution and QA windows may instead read files and exact PR SHAs through the connector.

Do not store access tokens in shell history, a `.env` committed file, Markdown reports, or logs. Never run the live WebDAV POC using personal account credentials until a separately authorized secure test plan exists.
