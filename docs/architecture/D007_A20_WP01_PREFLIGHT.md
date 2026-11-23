# D007-A20 — WP-01 Synthetic-Only Authorization Preflight (NOT A G1 GRANT)

**Decision:** **D007-A20 Option B**, 2026-11-23 (Europe/Berlin).
**Package:** `WP-01 — synthetic Auth/Session and Safe API contract core`.
**State:** `designStatus=PLAN_READY_CANDIDATE`; `executionStatus=NOT_AUTHORIZED`; `qaStatus=NOT_RUN`; `designAcceptance=NOT_REVIEWED`; `mergeStatus=NOT_AUTHORIZED`; `realAccessStatus=BLOCKED`; `releaseStatus=NOT_AUTHORIZED`.
**Design input main (NOT automatically future execution base):** `74879eb8058f899e936b0e08504aebf133efb423`. Future G1 **MUST pin a freshly verified full 40-char SHA**, branch and exact paths in a new execution instruction; this file does not create branch or code.
**Refs:** [A4 auth](D007_A4_AUTH_SESSION_SECURITY.md), [A5 API](D007_A5_API_CONTRACT.md), [A9 QA](D007_A9_QA_FRAMEWORK.md), [A9 fixtures](D007_A9_TRACEABILITY_FIXTURES.md), [A10 packages](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [A20 gates](D007_A20_WORKPACKAGE_GATES.md), [A20 gate ownership](D007_A10_GATE_ADDENDUM_A20.md), A11/A12/A13/A14/A15/A16/A17/A18 and [3-window protocol](../governance/THREE_WINDOW_PROTOCOL.md).

## 1. Objective and positive synthetic-only boundary

A **single, limited, fake-data contract slice**: verify server-side authorization shape for fake Owner, forbidden principal and read-only Workspace; origin-safe Session/Cookie header policy, CSRF/CORS checks, expiry/revoke-deny, resource-level privacy and truthful A5 error/outcome envelopes. Build **no production app, real login, Owner bootstrap, factor registry, MFA, real persisted notes, Zotero client, WebDAV adapter or PDF repository**. If a proposed endpoint implies unsupported real persistence or multi-instance identity, it must fail closed or be a clearly identified fake/injectable contract double.

Allowed mock demonstration proposals (not yet executable):
- Fake principals `user_demo_a`, `user_demo_b`, `workspace_readonly_a`; Session state only in isolated ephemeral synthetic harness, no real credential or token exchange. No public signup/default admin.
- Versioned API-shaped request/response contract with fake Project/Paper/resource IDs; independent per-request authentication/ACL; read-only Workspace projection and denial of all write/factor/export routes.
- Fake session issuance/expiry/revocation, fixation resistance and CSRF/Origin/Fetch Metadata/CORS **contract tests**, including malformed/foreign origin. Cookie contract check may inspect `__Host-`, Secure/HttpOnly/Path/no Domain/SameSite candidate in generated headers, but **loopback HTTP is not HTTPS browser Cookie validation**; no actual real Session, browser compatibility or revocation across production instances claimed.
- Structured `CONFIRMED / CONFLICT / DEFINITE_FAILURE / UNKNOWN` response examples **from explicit fake backend outcome injection only**; `202` not Saved; before-dispatch denial distinguished from after-dispatch Unknown; no blind replay; preserve simulated local draft and operation identity.
- Mock-only Step-up **denial** `STEP_UP_REQUIRED` for R2/R3 absent valid future proof; **no UI amendment, authentication challenge screen, R2 action or destructive mutation implemented**.
- Minimal safe operational redaction, allowlisted local network, typed fail-closed configuration, no incidental external DNS or Secrets Manager calls.

## 2. Candidate G1 envelope — explicit parameters STILL PENDING separate approval

| Field | Proposed bounded value / remaining requirement |
| --- | --- |
| `futureDecision` | **D007-A21 candidate**, **NOT APPROVED** |
| `repository` | `zyyu1/literature-management-system`; current design input main SHA above, **fresh full base required at G1** |
| `branch` | **PROPOSED ONLY** `exec/WP-01-synthetic-auth-api`, NOT CREATED |
| `ownedPaths` | **PROPOSED ONLY** `packages/wp-01-synthetic-auth-api/**` plus `docs/handoffs/WP-01/QA_HANDOFF.md` for later authorized handoff; actual exact allowlist must be confirmed at G1 |
| `forbiddenPaths` | `poc/001/**`, `docs/handoffs/POC-001/**`, `docs/ui/002/**`, `docs/handoffs/002/**`, `docs/baseline/**`, `docs/architecture/**`, `docs/governance/**`, `.github/**`, repository-root dependency/lock/CI files and any unrelated path |
| `network` | **loopback only**, no non-loopback DNS/HTTP, no Nutstore/WebDAV/Zotero/cloud/identity/telemetry/registry calls by default; no external install/scan/CI |
| `secrets` | **NONE**, no actual Session keys, test account passwords, API keys, MFA recovery codes, encryption keys, personal data, production URLs or injected GitHub secrets |
| `fixtures` | A9 fabricated IDs and adversarial cases. **No fixture file or content digest exists yet**; G1 must approve a deterministic schema, file bytes and SHA-256, seeded test clock before code/run |
| `toolchain` | **NOT SELECTED**; propose minimal offline local runtime and built-in test runner; exact language/Node version/dependency lock/OS/commands to be fixed by G1; nothing installed here |
| `dependencies` | Default **zero newly approved** external packages. If needed: prior explicit A18 three-candidate/five-factor OSS and supply-chain gate, full transitive/licensing review and G1 scope update |
| `externalAccess` | **BLOCKED**; WP-00A ACCESS-02, physical-device Zotero, supplier/domain/billing and staging not included |
| `QA` | Separate independent QA on exact implementation PR head/fixture/runtime with redacted, reconstructable evidence; G2 STOP before QA; no self-approved PASS |
| `merge` | **NOT_AUTHORIZED** regardless of local results or GitHub mergeability |

**These proposed path names are planning candidates** and are **not** an authorization to create any directories or files. A21 may adjust a proposed path *only as a fresh explicit new design/permission*, not as spontaneous Execution discretion. The POC-001 original branch/base/path/no-rebase rule remains untouched.

## 3. Planned fixture register (A9 original design, no files built)

| Fixture | WP-01 use | Explicit negative case |
| --- | --- | --- |
| `FIX-PRINCIPAL` | fake Owner / foreign / Workspace, two sessions, revoked+expired variants | foreign Session and cross-owner requests denied with no object existence leak |
| `FIX-SECURITY` | bad Origin, CSRF, bad redirect/host, encoded path, read-only write | no mutation, no credential/header/cache leak |
| `FIX-WORKSPACE` | read-only Project/Paper projection with fake IDs | deny status/Important/Note/Quote writes, factor management and foreign Project |
| `FIX-FAULT` | fake 401/403/409/412/5xx/timeout/ack lost | classify before vs after dispatch, no blind replay/false Saved |
| `FIX-RACE` | same fake operationId in two requests, delayed fake ACK/revoke | honesty within a single fake process; **no durable/global idempotency claim** |
| `FIX-PROJECT` + `FIX-PAPER` | fake resource membership and library-qualified ID collision | scope IDOR fails, no Paper merge across different fake libraries |
| `FIX-DRAFT` | fake unsynced draft on logout or UNKNOWN | draft not silently dropped by Session expiry |

**Preparation gap:** A9 defines the fixture *specification*, but no canonical on-disk fixture byte hash exists. Choose schema/version/seed/test clock and hash **before G1**, then require Execution + QA to use the same exact content. Do not silently borrow a real Zotero record/PDF or POC-001 local evidence.

## 4. Test acceptance mapping — prospective only, not pre-passed

| ID / scope | Candidate synthetic assertion | What cannot be claimed from this WP |
| --- | --- | --- |
| **A4-01/02/04/05** | Cookie header policy, simulated exact-origin CORS and CSRF, IDOR/Workspace denial | Real HTTPS/Safari/browser-host Cookie or real user login |
| **A4-03** | **DEFERRED_BLOCKING for actual browser/provider topology**; maybe simulate cross-site rejection locally | Real cross-site Cookie reliability not tested |
| **A4-06/07/08** | fake Session fixation/expiry/revoke and lost-ack draft preservation, redacted logs, unsafe-redirect rejection | durable multi-instance Session/recovery, actual TLS/device/a11y proof |
| **A5-01/04/05/10** | per-resource denial, explicit mock-only confirmed/unknown semantics, Workspace GET-only | real durable write/ledger/ETag claims |
| **E9-10 / E9-11** | synthetic security and Workspace projection denial subset | no full real browser or inter-module product UI acceptance |
| **F9-10** | revoked in-flight fake Session, malicious Origin/CSRF, cross-user foreign ID and redaction | real account/phone/browser QA |
| **A13–A16 applicable** | fake-environment isolation/config denial, host/CSRF contract, single-owner mapping and Step-up rejection | atomic bootstrap, MFA factors, recovery store and R2 action UI |
| **A11/A12/A17/A18 applicable** | redacted synthetic fault evidence and budget counters; no secret/encryption misuse; review source/dependencies and fake provenance | real backup encryption, real telemetry, numeric SLO, executed SBOM/signature or supply chain certification |

Full Module 002 frozen **26 U6 cases remain NOT RUN**, even if this standalone API slice independently passes subsets of related security invariants; none of the 60 A4–A8 planned scenarios change state before actual G3 evidence at a specific authorized implementation SHA. Later A11–A18 test cases remain design-only.

**G3 future QA must independently:** verify exact full head, parent/base ancestry, path allowlist; compare fixture hash, runtime/toolchain, test command exits and no external egress; probe expired/revoked Sessions, origin/CSRF/CORS, path traversal/IDOR, Workspace write denial, loss/timeout UNKNOWN, no false CONFIRMED, log/header redaction and unapproved-step-up DENY; distinguish TESTED_SYNTHETIC / PARTIAL / NOT_RUN / UNSUPPORTED. A green CI or developer self-test is not a G3 PASS.

## 5. P0/P1 STOPs and unresolved parameters

**Immediate P0 STOP:** foreign Principal/Workspace gains private write/read; fake bootstrap grants arbitrary first visitor; CSRF/Origin bypass produces side effect; simulated timeout emits Saved/Deleted; draft/operation identity silently lost; live secret/real PDF appears; non-loopback egress, GitHub workflow/CI or out-of-scope path modified. No new mutation authority can be inferred from mock A5 outcome examples.

**P1 BLOCK:** broken revoked/expired fake Session deny, misleading source-SHA/fixture report, unreviewed dependency/license or install hook, incoherent Cookie contract, unbounded request/operation simulation, Step-up denial missing for unsupported R2/R3, unsupported cross-instance evidence sold as PASS.

**Parameters explicitly still pending G1:** latest full approved base SHA, finalized branch/path list, toolchain and offline runner/commands, fixture files/schema/version and real digest, synthetic clock/seed, exact mock API contract endpoints, timeout/input bounds and per-case expectations, dependency candidate review if needed, QA assigned scope and evidence recipe. No estimated implementation timeline/budget or production setting is adopted.

**Proof blocker outside WP-01:** POC-001 new independent QA `74d00f2…` is **PARTIAL**, not local acceptance; P0-STORE blocked, ACCESS-02 blocked, real identity Session store unselected, frozen UI `UI-AMEND` for R2 remains unresolved. WP-01 may be **planned independently**, and a **separate A21 G1 decision** could authorize *only* the bounded mock slice once parameters are locked, without granting any of those external capabilities.

## 6. Exact conclusion and proposed next independent decision

**D007-A20 approves preparation of this candidate packet only. NO WP-01 G1 EXECUTION APPROVAL.** This is not executable `EXECUTION_INSTRUCTION.md` and is not a signal for Execution/QA to create files, start tests, install dependencies, open a PR, access accounts or provision staging.

**Next proposed decision:** **D007-A21 — lock the WP-01 synthetic-only G1 packet (full base/paths, fixture hash, offline toolchain/commands, explicit user scope) and independently decide whether to authorize execution.** A21 can be declined or deferred. A **separate POC-001 Design disposition** must address QA P2-Q1/Q2/Q3 before any POC LOCAL PASS or ACCESS-02 consideration; A20 does not grant remediation authority.

**FINAL STATE: PLAN_READY_CANDIDATE / EXECUTION NOT_AUTHORIZED / QA NOT_RUN / NO MERGE, PROVIDER ACCESS OR RELEASE.**
