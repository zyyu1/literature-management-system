# P0-STORE Phase 3 — live run runbook (rev 3, A105; run 2 executes only after the user approves DEC-48)

Authority: [A105](../../architecture/D007_A105_P0STORE_R4_R41_G4_PASS_LOCAL.md), A90 §4–§6, A99, A104. Rev 1/2 belonged to run 1 (approval `P0STORE-ACCESS-02-20261127-6a59ce9`, **consumed**). **Until the user selects the DEC-48 approval option in the Design window, nobody runs this.**

## 0. Fixed parameters
| Item | Value |
| --- | --- |
| Probe code | PR #9 exact `b2b008295736dc09829e5272638c19aedc9c1442` (R4/R4.1 G4 PASS_LOCAL) |
| Approval id | `P0STORE-ACCESS-02-20261127-b2b0082` (valid only for this SHA and one run) |
| Host / port | `dav.jianguoyun.com:443`, system trust store, strict TLS, no redirects |
| Namespace | `/dav/LMS-P0STORE/<random 32-hex runId>/` (generated at run time) |
| Budget | ≤ 88 planned requests + 12 reserved per 30 min; synthetic files only; 2 writers |
| Operator | **the user**, A59 Windows, non-elevated PowerShell, pinned Node v22.23.5 x64 by full path |
| Account | the same empty disposable test account; a **newly generated** app password (the run-1 one must already be revoked) |

## Before you start
- In Nutstore web → Account info → Security options → Third-party application management: make sure the run-1 app password is **deleted**, then **generate a new one** (any name, e.g. `lms-p0store-2`). Keep it only on screen or in your password manager.
- You need: the **account e-mail** (the Nutstore login of the test account) and the **new app password**. Neither is ever typed into any Claude window.

## 1–2. Prepare and run — ONE PowerShell window, ONE line at a time
> Paste one numbered line, press Enter, check the output, then the next. Do not close or switch windows.

**Prepare (nothing secret yet):**
```powershell
# 1
git clone https://github.com/zyyu1/literature-management-system.git C:\lms-p0store-live2
# 2
cd C:\lms-p0store-live2
# 3
git fetch origin pull/9/head
# 4
git checkout --detach b2b008295736dc09829e5272638c19aedc9c1442
# 5  must print exactly b2b008295736dc09829e5272638c19aedc9c1442
git rev-parse HEAD
# 6  must print nothing
git status --porcelain
# 7  replace with the real full path of the pinned v22.23.5 node.exe
$node = "C:\FULL\PATH\TO\node-v22.23.5-win-x64\node.exe"
# 8  True
Test-Path $node
# 9  v22.23.5
& $node -v
# 10 x64
& $node -p "process.arch"
# 11 starts 247E9693, ends BDF38A
(Get-FileHash $node -Algorithm SHA256).Hash
# 12
cd C:\lms-p0store-live2\packages\p0store-nutstore-probe
```
If 5/6/8/9/10/11 differ → stop and tell Design.

**Run (the only time the credentials exist):**
```powershell
# 13 type the test account's login e-mail, press Enter
$env:P0STORE_WEBDAV_USER = Read-Host "Nutstore account e-mail"
# 14 masked prompt: type the NEW app password, press Enter
$s = Read-Host "WebDAV app password" -AsSecureString
# 15
$env:P0STORE_WEBDAV_PASSWORD = [System.Net.NetworkCredential]::new("", $s).Password
# 16
Remove-Variable s
# 17 the run itself (one line)
& $node src/runner.mjs --plan plans/live-nutstore-plan.json --trace C:\lms-p0store-live2\p0store-live-trace.jsonl --live --approval P0STORE-ACCESS-02-20261127-b2b0082 *> C:\lms-p0store-live2\p0store-live-console.txt
# 18 IMMEDIATELY after 17
$code = $LASTEXITCODE
# 19
Remove-Item Env:P0STORE_WEBDAV_PASSWORD
# 20
Remove-Item Env:P0STORE_WEBDAV_USER
# 21
"exit=$code"
```
- Line 17 is the one live run. **Never run it twice.** Exit 4 = refused before any request (copy the `REFUSED:` line). Exit 1 = NO-GO. Exit 0 = GO / PARTIAL / INCONCLUSIVE (JSON at the end of the console file). Other = runner error.
- If any of 13–16 errors: run 19 and 20 (errors there are fine), close the window, tell Design — line 17 has not run, approval not used.
- Close the window afterwards.

## 3. Immediately after
1. **Revoke** the new app password in Nutstore.
2. In the Nutstore web UI look at `/LMS-P0STORE/`: note whether a run folder remains and what is in it. Do not delete by hand unless Design asks.
3. Open both files and search for your password **and your e-mail**; neither may appear. If one does → do not share; tell Design.
4. Tell the Design window: exit code, the verdict line, file locations. Execution then attaches the redacted files to PR #9 and independent QA re-derives the verdict offline.

## 4. Abort conditions
SHA/Node/hash mismatch; elevated PowerShell; any prompt other than lines 13/14; certificate warning; host other than `dav.jianguoyun.com` in the console; run longer than ~10 minutes.
