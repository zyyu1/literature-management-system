# WP-01 — Independent QA Instructions (Design Only, NOT RUN)

**Source:** [D007-A21 design](../../architecture/D007_A21_WP01_G1_DECISION.md), [A9 QA contract](../../architecture/D007_A9_QA_FRAMEWORK.md), [A20 gates](../../architecture/D007_A20_WORKPACKAGE_GATES.md).
**Do not start G3 until** a bounded WP-01 Execution PR and exact 40-character head SHA + QA_HANDOFF exist. QA MUST use independent checkout and independent negative probes; do not edit implementation, self-certify, pull live data or update frozen UI.

## Fixture and toolchain
- Canonical unchanged `fixtures/wp01.v1.json` raw SHA-256: `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`, size 4573 bytes, schema `WP01-SYNTHETIC-v1.0.0`, seed 21001 and UTC fake clock `2030-01-02T03:04:05.000Z`.
- Runtime **Node.js v22.23.5, Linux x64**, built-in modules only; `node --version` must match; no `npm install`, no test frameworks downloaded, no cloud, Zotero, Nutstore or external browsing from test executor. If any required runner or egress restriction is missing: STOP/report.
- QA material: reviewed execution base full SHA, PR head + parent, branch, `git status --short`, ancestry, allowlist diff, package manifest (no direct/transitive deps), fixture SHA, no secrets/privacy leak, local listen `127.0.0.1:0` only, negative external-host attempts that create **zero outbound connections**. Origin `https://app.wp01.invalid` is a **simulated header**, not a live TLS/browser test.

## Required independent case matrix (all NOT RUN until G3)
| ID | Independent expected observation | Applicable trace |
| --- | --- | --- |
| Q01 | fake Owner permitted scoped read; foreign/guest denied without resource-existence disclosure | A4-05, A5-01, E9-10; AUTH-01/02 |
| Q02 | Workspace read-only scoped projection works, every mutation and factor/export attempt denied | A4-05, A5-10, E9-11; AUTH-03/04 |
| Q03 | session-expired and revoked variants are denied; other fake active session unaffected; fixation/renewal stubs safely bounded | A4-06/07, F9-10; SESS-01/02 |
| Q04 | allowed vs untrusted Origin: exact credentialed CORS/Vary, no wildcard; CSRF and Fetch Metadata failure deny before dispatch | A4-01/02/04/08, F9-10; ORIGIN-01/CSRF-01 |
| Q05 | inspect `__Host-` Cookie policy in fake response headers (HttpOnly/Secure/Path/no Domain/SameSite), **NO real browser proof** | A4-01/03/08, A14 |
| Q06 | A5 fake outcome contract distinguishes CONFIRMED, CONFLICT, DEFINITE_FAILURE, UNKNOWN; `202` is not Saved; lost ACK never blindly replayed | A5-04/05, F9-10; OUTCOME-01/02 |
| Q07 | missing R2 Step-up returns distinct denied status, never an R2 mutation; frozen UI untouched | A16; STEPUP-01 |
| Q08 | malicious path/`__proto__`, unsafe URL/redirect/destination, non-loopback bind/fetch fail closed; sanitized logs | A4-08, A11/A13/A18, F9-10; PATH-01/REDIRECT-01 |
| Q09 | fake same-operation retry/foreign-principal denial and revoked-during-unknown preserve original operation/draft context | A5-05; FIX-RACE/FIX-DRAFT synthetic subset |
| Q10 | correct fixture SHA, Node exact version, no additions outside allowlist, no secret or remote requests, no new dependencies/CI | A9/A13/A18 provenance |

**Recommended implementation test layout**, inside approved package only: `test/auth-contract.test.mjs`, `test/session-revocation.test.mjs`, `test/origin-csrf.test.mjs`, `test/scope-workspace.test.mjs`, `test/outcome-unknown.test.mjs`, `test/transport-negative.test.mjs`. Do not count Q01–Q10 as existing tests; these are G3 acceptance requirements only.

## Reproducible command contract (future, package cwd)

```bash
node --version
node --check src/server.mjs
node --test
# Rerun node --test 5 independent times if claiming five-pass stability;
# record five distinct outputs, timings and exit codes; no merely copied output.
```

**Before tests:** verify exact Node version and OS/architecture, fixture with `sha256sum docs/handoffs/WP-01/fixtures/wp01.v1.json` from repo root; confirm isolated local-only egress policy and all directories. Readability of the approved fixture is mandatory and it must stay unmodified. If any command cannot be run as specified, stop or explicitly record NOT_RUN rather than asserting PASS.

## Reporting contract
PR comment or separately authorized `QA_REPORT`: exact PR HEAD SHA and reviewed instruction/blob, base/parent, OS/Node, fixture hash and seed/clock, actual commands and exits, ten Q01–Q10 outcomes, independent probes, redacted logs, scope/secret/dependency scan caveats, P0/P1/P2 and any unsupported/excluded proof. State **PASS_LOCAL / PARTIAL / FAIL** for *this synthetic WP only*. Real TLS/browser/identity, provider/backup/durable storage and original 26 U6/60 A4–A8 are **NOT RUN**; never generalize to PASS_PROVIDER or release. After QA: **STOP for independent Design disposition**; no merge or ACCESS-02.
