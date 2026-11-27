# P0-STORE Phase 3 — live run runbook (rev 2, A98 §6; ACCESS-02 approved by DEC-41)

Authority: [A98](../../architecture/D007_A98_P0STORE_R3_G4_AND_ACCESS02_PACKET.md), A90 §4–§6/§10, [R3_LIVE_READINESS](R3_LIVE_READINESS.md), [PHASE2_USER_PREPARATION](PHASE2_USER_PREPARATION.md). **Until the user selects the ACCESS-02 approval option in the Design window, nobody runs this.**

## 0. Fixed parameters
| Item | Value |
| --- | --- |
| Probe code | PR #9 exact `6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef` (R3 G4 PASS_LOCAL) |
| Approval id | `P0STORE-ACCESS-02-20261127-6a59ce9` (valid only for this SHA and one run) |
| Host / port | `dav.jianguoyun.com:443`, system trust store, strict TLS, no redirects |
| Namespace | `/dav/LMS-P0STORE/<random 32-hex runId>/` (generated at run time) |
| Budget | ≤ 88 planned requests + 12 reserved for cleanup/abort per 30 min; ≤ 14 synthetic files ≤ 4 KiB; 2 writers |
| Operator | **the user**, on the A59 Windows machine, non-elevated PowerShell, pinned Node v22.23.5 x64 by full path |
| Account | the empty disposable test account (U1) with its app password (U2) |

## 1–2. Prepare and run — ONE PowerShell window, type/paste ONE line at a time (corrected, A98 §6)
> Do not paste the whole block. Paste one numbered line, press Enter, check its output, then the next. Do not close or switch windows between lines; `$node` and the folder must stay in the same window.

**Prepare (nothing secret yet):**
```powershell
# 1  (skip clone if C:\lms-p0store-live already exists from the earlier attempt)
git clone https://github.com/zyyu1/literature-management-system.git C:\lms-p0store-live
# 2
cd C:\lms-p0store-live
# 3
git checkout --detach 6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef
# 4  must print exactly 6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef
git rev-parse HEAD
# 5  must print nothing
git status --porcelain
# 6  replace the path with the real full path of the pinned v22.23.5 node.exe
$node = "C:\FULL\PATH\TO\node-v22.23.5-win-x64\node.exe"
# 7  must print: True
Test-Path $node
# 8  must print: v22.23.5
& $node -v
# 9  must print: x64
& $node -p "process.arch"
# 10 must start with 247E9693 and end with BDF38A
(Get-FileHash $node -Algorithm SHA256).Hash
# 11
cd C:\lms-p0store-live\packages\p0store-nutstore-probe
```
If any check in 4/5/7/8/9/10 differs → stop and tell Design.

**Run (the only time the secret exists):**
```powershell
# 12  a masked prompt appears; type the app password, press Enter
$s = Read-Host "WebDAV app password" -AsSecureString
# 13
$env:P0STORE_WEBDAV_PASSWORD = [System.Net.NetworkCredential]::new("", $s).Password
# 14
Remove-Variable s
# 15  the run itself (one line)
& $node src/runner.mjs --plan plans/live-nutstore-plan.json --trace C:\lms-p0store-live\p0store-live-trace.jsonl --live --approval P0STORE-ACCESS-02-20261127-6a59ce9 *> C:\lms-p0store-live\p0store-live-console.txt
# 16  run IMMEDIATELY after 15
$code = $LASTEXITCODE
# 17
Remove-Item Env:P0STORE_WEBDAV_PASSWORD
# 18
"exit=$code"
```
- Line 15 is the one live run. Do **not** run it a second time, whatever happens. Exit 4 = refused before any request (copy the `REFUSED:` line from the console file). Exit 1 = NO-GO. Exit 0 = GO / PARTIAL / INCONCLUSIVE (JSON at the end of the console file). Any other code = runner error; stop.
- If any of lines 12–14 errors, run line 17 (an error there is fine), close the window, and tell Design — line 15 has not run, so the approval is not used.
- Close the PowerShell window afterwards.

## 3. Immediately after
1. **Revoke** the app password in the test account (Account info → Security options → delete the application) — U6.
2. In the Nutstore web UI, look at `/LMS-P0STORE/`: note whether the run folder is empty (cleanup ok) or which files remain (cleanup STOP). Do not delete anything by hand unless Design asks.
3. Check that neither `p0store-live-trace.jsonl` nor `p0store-live-console.txt` contains the password (open them and search for it; it must not appear). If it does → do not share; tell Design (P0 incident).
4. Tell the Design window: exit code, the verdict line, and where the two files are. Execution then attaches them to PR #9 (redacted files only) and independent QA re-derives the verdict offline from the trace.

## 4. Abort conditions (stop and tell Design)
Any SHA/Node/hash mismatch; PowerShell is elevated; a prompt asks for anything except the app password; any browser or certificate warning; the console shows a host other than `dav.jianguoyun.com`; the run exceeds ~10 minutes.
