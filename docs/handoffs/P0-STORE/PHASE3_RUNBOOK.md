# P0-STORE Phase 3 — live run runbook (DRAFT; executes only after an explicit user ACCESS-02 approval)

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

## 1. Prepare (online is fine; nothing secret yet)
1. Open a **normal (non-admin)** PowerShell.
2. Fresh checkout of the exact commit into a new empty folder, e.g.:
   ```powershell
   git clone https://github.com/zyyu1/literature-management-system.git C:\lms-p0store-live
   cd C:\lms-p0store-live
   git checkout --detach 6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef
   git rev-parse HEAD   # must print exactly 6a59ce94a20ef59de545e1dc53fbd9d22dbc32ef
   git status --porcelain   # must print nothing
   ```
3. Locate the pinned Node binary used by Execution/QA and verify it:
   ```powershell
   $node = "<full path to the v22.23.5 node.exe>"
   & $node -v                                  # v22.23.5
   & $node -p "process.arch"                   # x64
   (Get-FileHash $node -Algorithm SHA256).Hash # must start 247E9693 and end BDF38A
   ```
   If any check differs → stop and tell Design.

## 2. Run (online; the only time the secret exists)
```powershell
cd C:\lms-p0store-live\packages\p0store-nutstore-probe
$s = Read-Host "WebDAV app password" -AsSecureString
$env:P0STORE_WEBDAV_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuth([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
Remove-Variable s
& $node src/runner.mjs --plan plans/live-nutstore-plan.json --trace C:\lms-p0store-live\p0store-live-trace.jsonl --live --approval P0STORE-ACCESS-02-20261127-6a59ce9 *> C:\lms-p0store-live\p0store-live-console.txt
$code = $LASTEXITCODE
Remove-Item Env:P0STORE_WEBDAV_PASSWORD
"exit=$code"
```
- Do **not** retry automatically. Exit 4 = refused before any request (report the `REFUSED:` code). Exit 1 = NO-GO. Exit 0 = GO / PARTIAL / INCONCLUSIVE (see the JSON in the console file). Any other code = runner error; stop.
- Close the PowerShell window afterwards.

## 3. Immediately after
1. **Revoke** the app password in the test account (Account info → Security options → delete the application) — U6.
2. In the Nutstore web UI, look at `/LMS-P0STORE/`: note whether the run folder is empty (cleanup ok) or which files remain (cleanup STOP). Do not delete anything by hand unless Design asks.
3. Check that neither `p0store-live-trace.jsonl` nor `p0store-live-console.txt` contains the password (open them and search for it; it must not appear). If it does → do not share; tell Design (P0 incident).
4. Tell the Design window: exit code, the verdict line, and where the two files are. Execution then attaches them to PR #9 (redacted files only) and independent QA re-derives the verdict offline from the trace.

## 4. Abort conditions (stop and tell Design)
Any SHA/Node/hash mismatch; PowerShell is elevated; a prompt asks for anything except the app password; any browser or certificate warning; the console shows a host other than `dav.jianguoyun.com`; the run exceeds ~10 minutes.
