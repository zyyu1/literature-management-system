# P0-STORE Phase 2 — user preparation checklist and ACCESS-02 request packet (DRAFT, NOT SUBMITTED)

Authority: [A92](../../architecture/D007_A92_P0STORE_PHASE1_G4_AND_PHASE2_PREP.md) DEC-36, [A90](../../architecture/D007_A90_P0_STORE_NUTSTORE_WEBDAV_ROUTE_DESIGN.md) §3 Phase 2, [ACCESS_POLICY](../POC-001/ACCESS_POLICY.md). **This document authorizes nothing.** No account, credential, connection or live request is authorized by it. Phase 3 needs a separate explicit user approval (DEC later) naming the exact SHA, host, namespace and operator.

## 1. What you (the user) prepare — out of band, never in chat or Git
| # | Item | How / rule | Status |
| --- | --- | --- | --- |
| U1 | **Second, disposable Nutstore account** | New account used only for this test; never the account that syncs Zotero attachments; contains no personal files at all | ☐ |
| U2 | **App-specific WebDAV password** for U1 | Created in that account's security settings ("third-party application management"); never reuse the login password; revocable | ☐ |
| U3 | **WebDAV address** shown in U1's settings | Write down the server address exactly as Nutstore shows it; Design will pin exactly what you confirm | ☑ `https://dav.jianguoyun.com/dav/` (user, 2026-11-27 13:59) |
| U4 | **Operator machine** | The Windows machine used for A59 runs, Node v22.23.5 x64; no shared/CI host | ☐ |
| U5 | **Secret injection method** | You set the environment variable `P0STORE_WEBDAV_PASSWORD` yourself in the run shell immediately before the run and clear it after; nobody else types it; it is never pasted anywhere | ☐ |
| U6 | **Revocation plan** | Right after the run (or on any incident) you delete the app password in U1; optionally delete U1 | ☐ |
| U7 | **Quota check** | Note any request/traffic limits Nutstore shows for U1; the stricter of those and ACCESS_POLICY §4 applies | ☐ |

You tell Design only: "U1–U7 done", the WebDAV address (U3, not secret), and the account's login name **only if you choose** (not required). Never the password.

## 2. Request packet (to be completed by Design after your confirmation)
| Field | Value |
| --- | --- |
| Request ID | `P0STORE-ACCESS-02` — **NOT AUTHORIZED** |
| Probe code | PR #9 exact `88e1bd76dc94fc38876fa28c975d317b1c1573c2` (A92 G4 PASS_LOCAL) **plus** the mandatory pre-Phase-3 change §4 (new exact SHA, its own G2/targeted G3) |
| Host / port / path prefix | `dav.jianguoyun.com`, port 443, WebDAV root `/dav/` (U3); run prefix `/dav/LMS-P0STORE/<random-run-id>/` |
| Operator / machine | U4 |
| Credential | env `P0STORE_WEBDAV_PASSWORD`, set by the user only (U5) |
| Plan | A90 §4 L0–L12, ≤ 88 normal requests + 12 reserve, ≤ 14 synthetic files ≤ 4 KiB, 2 writers, A90 §5 STOP rules |
| Evidence | Redacted trace + verdict JSON; PR comment; independent QA re-observation of L6 rounds 1–2 in a separate namespace within remaining budget |
| After run | User revokes app password (U6); Design rules per A90 §6 incl. INCONCLUSIVE |

## 3. Status ladder
`PHASE2_USER_PREP_OPEN` (now; U3 done, U1/U2/U4–U7 pending) → `PHASE2_READY` (U1–U7 confirmed + §4 change accepted) → `ACCESS02_REQUEST_READY` (Design completes §2) → `ACCESS02_AUTHORIZED` (**only** by a later explicit user click naming SHA/host/namespace/operator) → `PROVIDER_OBSERVED` → Design verdict.

## 4. Mandatory change before any live run (A92 DEC-35)
Add verdict `INCONCLUSIVE` to the probe: any STOP or unresolvable outcome **before L6 completes all 5 rounds** without NO-GO evidence must output `INCONCLUSIVE` (not `PARTIAL`); `PARTIAL` only when L2, L5, L6 and L7 passed. Verdict output must also always list the first failing/limiting step's own reason before any later STOP reason. Small Execution slice on the same package, normal G2 + targeted independent G3 (verdict matrix + mutants for the new rule). Until accepted, any tool output `PARTIAL` with `unresolved: true` is read as INCONCLUSIVE.
