# D007-A21 — WP-01 Bounded Synthetic G1 Decision and Fixed Design Envelope

**Choice:** **D007-A21 Option B approved by user, 2026-11-23 (Europe/Berlin)**. This is an **independent narrow G1 authorization decision** for **WP-01 LOCAL/SYNTHETIC ONLY** once the matching [execution instruction](../handoffs/WP-01/EXECUTION_INSTRUCTION.md) is published with the **full pinned base SHA** and checked fixture digest. Prior A20 was planning-only; it did **not** authorize code.
**Input main for this design:** `52f862af47b7f05a72a10aec82a8461f998cbd33` ([A20 commit](https://github.com/zyyu1/literature-management-system/commit/52f862af47b7f05a72a10aec82a8461f998cbd33)).
**Canonical design/gate sources:** [A20 unified gates](D007_A20_WORKPACKAGE_GATES.md), [A20 preflight](D007_A20_WP01_PREFLIGHT.md), [A10 addendum](D007_A10_GATE_ADDENDUM_A20.md), [A9 QA](D007_A9_QA_FRAMEWORK.md), [A9 fixtures](D007_A9_TRACEABILITY_FIXTURES.md), [A4](D007_A4_AUTH_SESSION_SECURITY.md), [A5](D007_A5_API_CONTRACT.md), [A13](D007_A13_ENVIRONMENT_ISOLATION.md), [A14](D007_A14_ORIGIN_COOKIE_TOPOLOGY.md), [A15](D007_A15_OWNER_IDENTITY_RECOVERY.md), [A16](D007_A16_SENSITIVE_ACTION_AUTHORIZATION.md), [A18](D007_A18_SOFTWARE_SUPPLY_CHAIN.md), [Three-window protocol](../governance/THREE_WINDOW_PROTOCOL.md).
**A21 design commit:** this file and fixture are preparatory artifacts; final G1 starts **only** upon publishing a complete instruction pinned to this preparation commit. QA remains NOT RUN until implementation PR exists.

## 1. Narrow choice and environmental guarantees

**Only permit:** an isolated Node.js **22.23.5** Linux x64 loopback API contract double, fake principals, fake ephemeral Sessions, server-authoritative denial stubs, fake outcome injection and synthetic security/fault tests. **No real API, durable identity, cloud, native-app handoff, browser-certified Cookie, WebDAV/Zotero connection, database, PDF or real notes.** Node.js 22.23.5 is officially released and within 22.x Maintenance LTS on 2026-11-23; pin the **exact** runtime; if absent, **STOP and return to Design, no automatic downloads or substitutions**. Use Node core `node:http`, `node:test`, `node:assert/strict`, `node:crypto`; zero npm package installs, zero new external dependencies and no global root package rewrite. This is a reproducible local contract target, **not** an endorsement of long-term production runtime.

**Network:** bind **127.0.0.1 with ephemeral port 0** only; `.invalid` HTTPS origins are **string/header fixtures, not DNS destinations**. Forbid all non-loopback resolution and outbound requests, including real Zotero/Nutstore, package registry, external CI/scanner/telemetry/IdP, cloud DNS/API and even externally hosted test services. Tests must use an execution environment with verifiable outbound-deny and endpoint checks; if a runnable host cannot enforce the required local-only boundary, STOP and report rather than claim fully gated execution. Never generate, import, read or echo real credentials, Session secrets, crypto keys or real user records.

**Fixture:** [frozen canonical JSON](../handoffs/WP-01/fixtures/wp01.v1.json) `WP01-SYNTHETIC-v1.0.0`, **SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`** over raw UTF-8 file bytes, 4573 bytes (one minified line plus LF), seed `21001`, clock `2030-01-02T03:04:05.000Z`; fixture is intentionally *fake*, not a real user. Execution/QA MUST verify SHA-256 before tests and never mutate this fixture file. Its Git blob SHA-1 is `0965c45e3af482f4074845e1c7558901963f224f` for independent transport integrity.

## 2. Work boundary / definite exclusions

**Prospective exact execution path allowlist (enforced in G1 instruction):**
- `packages/wp-01-synthetic-auth-api/**` — only synthetic source, local-only tests, deterministic sanitized evidence and local package metadata **without third-party dependencies**.
- `docs/handoffs/WP-01/QA_HANDOFF.md` — exact-SHA Execution handoff created **after** PR head evidence.

**All other paths expressly forbidden**, including `docs/architecture/**`, `docs/governance/**`, `docs/ui/002/**`, `docs/handoffs/002/**`, `docs/handoffs/POC-001/**`, existing WP-01 G1 design/fixture/instruction, `poc/001/**`, `.github/**`, root lockfiles/CI, and baseline/handoff history. The future execution branch is **proposed** `exec/WP-01-synthetic-auth-api`; creation is by Execution only after G1 instruction publication and base verification, never by Design now. No automatic PR merge.

**Allowed semantics:** fake resource-level Owner and Workspace ACL; simulated `__Host-` Cookie attribute policy / exact-origin credentialed CORS / CSRF / Fetch Metadata responses **as headers on loopback**, not real HTTPS/browser proof; fake session issue/expire/revoke in one local process, explicit denial for foreign and workspace writers; no first-visitor bootstrap; fake `STEP_UP_REQUIRED` *denial* for R2; artificial `CONFIRMED/CONFLICT/DEFINITE_FAILURE/UNKNOWN` outcomes **only from injected fake backend**, with `202` not Saved. No production API route, MFA challenge/credential, UI or destructive Project implementation. On a post-dispatch fake lost ACK preserve `UNKNOWN`, simulated draft and operationId, no blind replay. No real cross-instance revocation or durable idempotency claim.

**Blocked capability ledger:** real identity provider/session store/MFA/recovery; atomic single Owner Bootstrap; actual Cookie domain/Safari/mobile; A16 R2 fresh-auth UX and UI-AMEND; real protected mutations; persisted Note/Quote/history; full Module 002 UI (67 frozen decisions); true storage CAS/anti-resurrection; backup/key lifecycle; real Zotero metadata/token/PDF, WebDAV, Android deep links; full system staging/release. Any of these needs a distinct user/Design work item.

## 3. A18 five-factor open-source triage before selecting a dependency

**GitHub repository snapshots observed 2026-11-23 (stars approximate and time-varying; no external code fetched or installed):**

| Candidate / URL | Stars / last push (UTC) | SPDX / technology | Reuse/fork estimate | Deployment / maintenance & risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| [Express](https://github.com/expressjs/express) | 69,773 / 2026-11-19 | MIT / JavaScript Node | Easy HTTP reuse, medium contract-hardening work | Additional middleware/transitives + npm install and explicit CSRF/route hardening | **DEFER, not adopted** |
| [Fastify](https://github.com/fastify/fastify) | 37,455 / 2026-11-21 | MIT / JavaScript Node | Good schema-based API, medium migration later | Plugin/transitive supply chain, runtime adaptation, no need for local stub | **DEFER, not adopted** |
| [Hono](https://github.com/honojs/hono) | 33,023 / 2026-11-22 | MIT / TypeScript Web Standards | Good future multi-runtime fit, medium adapter/stack change | Runtime adapters + packages, not validated for selected final hosting | **DEFER, not adopted** |

**Decision for WP-01 only:** **no third-party framework**. Use pinned Node core for minimal zero-dependency synthetic stub; these stars/license metadata are **preliminary**, not license/compliance or vulnerability certification and do not grant code reuse. Any later adoption requires new A18 exact release/SHA, transitive/license/vulnerability/maintainer/install-hook/build review and an explicit scoped Design amendment. Do not copy sample source/licenses into repo by this decision.

## 4. Mandatory G2→G3→G4 safety and QA trace

At least: A4-01/02/04/05/06/07/08 **synthetic contract subsets** (A4-03 and real TLS/browser portions DEFERRED), A5-01/04/05/10, E9-10/11 subset, F9-10, applicable A11/A13/A14/A15/A16/A18 negative cases. `FIX-PRINCIPAL`, `FIX-SECURITY`, `FIX-WORKSPACE`, `FIX-FAULT`, `FIX-RACE` from the A9 catalog are realized by the exact new JSON fixture; all native planned UI 26 and A4–A8 60 remain **NOT RUN** as system-level execution claims.

**Priority P0 STOP:** foreign scope, CSRF-origin write, secret / real-PDF leakage, non-loopback network, R2 write without step-up, false saved/confirmed after lost ACK or `202`, loss of draft/operationId, unapproved paths/deps/CI. **P1 BLOCK:** fake revoke denied late or not denied when expired, misleading evidence/fixture SHA, absent origin allowlist, omitted required negative probes, unauthorized package install, fraudulent cross-process guarantee. QA must independently reproduce at **exact 40-character PR HEAD SHA** with fixture SHA-256 and real exit codes; developer self-tests and green CI are not independent acceptance.

**No auto-promotion:** G1 authorizes only the bounded synthetic development + local test run and PR handoff. G2 Execution STOP; G3 independent QA; G4 Design acceptance **separate**; G5 merge **separate**; G6 real provider/device access and G7 release **blocked**.

## 5. Separate POC-001 and next design item

POC-001 remains on `exec/POC-001-webdav-feasibility`, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, original path allowlist / **no rebase**. PR #2 head `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3` independently re-QA'd [7089087597](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597) **LOCAL_STAGE PARTIAL** with Q1 incomplete/duplicate PROPFIND export, Q2 fence read-back and Q3 claim hygiene; no further POC remedial authority, ACCESS-02/merge/real requests blocked. **A21 does not adjudicate or alter POC.**

**Next recommended independent design decision after WP-01 G1 publication: D007-A22 — a separate narrow POC-001 residual-Q1/Q2/Q3 Design disposition (possible REMEDIATION-03, no automatic authorization), while WP-01 Execution and QA remain independently governed.** A22 may be prepared without changing the WP-01 branch. A21 requires no extra “shall we proceed?” question.

**FINAL: D007-A21 OPTION B is local/synthetic WP-01 G1 ONLY after exact instruction is committed and verified. No auto-start in this Design window, no real service, no UI change, no merge, no deploy.**
