# D007-A20 — Unified Work-Package Gates and Evidence Semantics

**Decision:** D007-A20 **Option B APPROVED** by user, 2026-11-23 (Europe/Berlin).
**Authority:** **PLANNING / GOVERNANCE DOCUMENTATION ONLY.** This is **NOT** an execution instruction, a G1 grant, architecture freeze, QA acceptance, merge approval, real-account/device authorization, provider choice, CI/build run or deployment approval.
**Pinned input main:** `74879eb8058f899e936b0e08504aebf133efb423` (A19 docs-only descendant of independently audited `07eb46ae21b18878b9fe371c8a444df41004b9ec`).
**Normative upstream:** [A9 QA framework](D007_A9_QA_FRAMEWORK.md), [A10 work packages](D007_A10_IMPLEMENTATION_WORKPACKAGES.md), [A19 audit](D007_A19_ARCHITECTURE_READINESS_AUDIT.md), [A19 traceability matrix](D007_A19_TRACEABILITY_RISK_MATRIX.md), [Three-Window Protocol](../governance/THREE_WINDOW_PROTOCOL.md), [A11–A18 addendum](D007_A10_GATE_ADDENDUM_A20.md), [WP-01 preflight](D007_A20_WP01_PREFLIGHT.md).
**Frozen assets:** [Module 002 67 UI decisions and 26 U6 cases](../ui/002/DESIGN_APPROVED.md) are UNCHANGED, U6 **NOT RUN**. Original A4–A8 60 test cases, A9 E9/F9 cases and later A11–A18 148 designed cases have **NOT RUN** as application QA.
**POC track untouched:** PR [#2](https://github.com/zyyu1/literature-management-system/pull/2), original branch `exec/POC-001-webdav-feasibility`, original authorized base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, exact original path allowlist, **NO REBASE**, no merge; `ACCESS-02` BLOCKED.

## 1. Reconciled evidence snapshot (newer than A19 audit snapshot)

The A19 audit was an immutable evidence snapshot: it described `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3` as Execution-only / independent QA pending *at audit time*. New [independent REMEDIATION-02 re-QA comment 7089087597](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597) evaluated **that exact head** subsequently, without changing repo files: **LOCAL_STAGE PARTIAL / OVERALL BLOCKED_REAL_SERVICE**; 75/75 tests ×5 and 23/23 mutation checks independently reproduced; P1-R1 fixed locally, but **P2-Q1** non-waivable certified export completeness / duplicate PROPFIND href remained, plus **P2-Q2** fence PUT ETag without GET read-back, **P2-Q3** inaccurate README claims and Q4/Q5 lower-priority liveness/quota policy. No P0/P1 observed within that QA scope. **There is no subsequent Design acceptance/remediation-03 authority as of this document.** No real Nutstore/TLS/provider requests occurred.

A19 findings remain historical evidence, not silently edited; new review supersedes **only the temporal POC QA_PENDING observation**, not A19 architecture risks or the unchanged POC instructions. No A20 sentence accepts POC LOCAL PASS, grants an additional POC fix, permits real access or weakens the non-waivable N1 certified-export requirement.

## 2. One gate vocabulary — A9 G0–G7 remains canonical

| Gate | Prerequisite and independently recorded evidence | Meaning / hard non-implication |
| --- | --- | --- |
| **G0 DESIGN_BASELINE / PLAN_READY** | Approved product/architecture/UX boundaries, per-WP scope, dependency/trace/test/fixture/STOP design, source SHAs | Ready to **request** separate execution approval; **not** architecture freeze or implementation authority |
| **G1 EXECUTION_AUTHORIZED** | **New explicit user/Design permission** naming WP, exact full 40-char **base**, independent branch, exact path allowlist, environment/network/secret/fixture limits, test/QA instructions and STOP | Only the granted work; A20 does **not** satisfy G1 |
| **G2 PR_READY / EXECUTION_STOP** | Execution records exact PR head/parent, compare-to-approved-base paths, commands/real exits, fixture digest, dependency/OSS delta, secrets scan and failure ledger, then **STOP** | Self-tests, green CI and mergeable GitHub metadata are not QA |
| **G3 INDEPENDENT_QA** | QA independently checks out the same head SHA, reproduces applicable positive, negative, fault and provenance tests, reports observed vs NOT_RUN vs UNSUPPORTED; independent review actor | QA PASS_LOCAL does not prove provider, runtime deployment or user-accepted Design |
| **G4 DESIGN_DISPOSITION** | Design separately reviews exact-SHA independent QA, P0/P1/P2/UNKNOWN, limits and scopes; ACCEPT / REMEDIATE / REJECT / HOLD | QA report or docs approval alone does not confer this |
| **G5 MERGE_AUTHORIZATION** | **Separate** user/Design authorization for reviewed exact candidate, drift/merge-tree, dependency/secret/path recheck and any required re-QA | No merge from G4 alone; do not rebase POC; merge commit/target independently verified |
| **G6 REAL_ACCESS_AUTHORIZATION** | **Separate, service/device-specific** user grant (for real Nutstore: `ACCESS-02` with all ACCESS-01 prerequisites); scoped credentials/hosts, request limits, cleanup, privacy and evidence | Independent gate; **not automatically inherited** from G5 or any synthetic QA; G6 may belong to a distinct POC track |
| **G7 DEPLOYMENT_RELEASE_AUTHORIZATION** | Separate provider/domain/region/privacy/budget, durable identity/storage/backup/recovery, supply chain and final independent runtime QA plus explicit release approval | No cloud account, staging, DNS, production, billing or release from any earlier gate |

**Gate ordering note:** G0–G5 describe one work package's delivery sequence, while G6 is a **separate capability-specific access grant**, not a mandatory or automatically successive consequence of merge; G7 is a separate deployment/release decision. A required provider proof can take place in another independently authorized work item, and failed proof returns to Design rather than silently expanding a synthetic WP.

## 3. Orthogonal status fields and proof types

Persist **separate fields**, never collapse them into one "Done" badge:

| Field | Allowed reporting terms | Current WP-01 |
| --- | --- | --- |
| `designStatus` | PROPOSED / APPROVED_PLANNING / PLAN_READY / NEEDS_AMENDMENT | **PLAN_READY_CANDIDATE** (per A20; conditional on G1 preflight) |
| `executionStatus` | NOT_AUTHORIZED / AUTHORIZED_LOCAL_SYNTHETIC / AUTHORIZED_BOUNDED_REAL / RUNNING / STOPPED | **NOT_AUTHORIZED** |
| `qaStatus` | NOT_RUN / PASS_LOCAL / PARTIAL / FAIL / PASS_BOUNDED_PROVIDER / UNSUPPORTED | **NOT_RUN** |
| `designAcceptance` | NOT_REVIEWED / ACCEPTED_EXACT_SHA / REMEDIATION / REJECTED / HOLD | **NOT_REVIEWED** |
| `mergeStatus` | NOT_AUTHORIZED / APPROVED_FOR_EXACT_SHA / MERGED_VERIFIED | **NOT_AUTHORIZED** |
| `realAccessStatus` | BLOCKED / SPECIFIC_SCOPE_AUTHORIZED / VERIFIED_WITH_LIMITS | **BLOCKED** |
| `releaseStatus` | NOT_AUTHORIZED / DEPLOYMENT_TEST_APPROVED / PRODUCTION_APPROVED | **NOT_AUTHORIZED** |

Evidence levels: `DESIGN_ONLY`, `EXECUTION_SELF_REPORT`, `QA_OBSERVED_SYNTHETIC`, `DESIGN_ACCEPTED_LOCAL`, `QA_OBSERVED_PROVIDER` and `PRODUCTION_VERIFIED` are non-interchangeable; use `NOT_ASSESSED` where evidence is absent. A test status is scoped by **exact SHA + artifact digest + environment + fixture digest + tested capability**, not generalized to an entire system. Never upgrade a documented `UNSUPPORTED` capability to "PASS" by changing labels.

**Severity:** P0 safety breach = immediate STOP and containment; P1 acceptance blocker = no gate advance; P2 = explicit Design disposition with clear non-waivable requirements (N1 completeness cannot be silently waived for certified export); unassessed and unsupported cannot become PASS. `UNKNOWN` is a legitimate A5 write result, **not** a terminal storage success/failure or a QA PASS.

## 4. Mandatory per-WP authorization packet (G1 requires a NEW decision)

1. Unique WP and **independent** decision ID, exact user-granted objective, approved source/design refs and frozen UI IDs; pin current main as full **40-char base SHA** at authorization time and audit drift from planning snapshot.
2. Dedicated branch, owned changed-path **allowlist**, explicit disallowlist, source/PR relation, allowed toolchain/runtime/OS, dependency introduction review, execution/test commands and expected exits. A10's conceptual folders are **not** an executable allowlist.
3. Exact **synthetic fixture schema/version/content hash**, seed/clock, fake data provenance and cases; no private library/Note/Quote/PDF, real password, external Zotero/WebDAV, cloud credential, backup key or personal-device grant by default.
4. Local network policy (default **loopback only**), denied egress, denied environmental secrets and privileged CI, positive/negative host/Origin/CSRF test endpoints; separately approved limits for any later real network.
5. Per-WP crosswalk to A4/A5/A9 and A11–A18 (`REQUIRED`, `DEFERRED_BLOCKING`, `NOT_APPLICABLE_WITH_REASON`), P0/P1 STOP conditions, future QA reviewer independence, exact SHA and evidence/redaction format.
6. Per-WP proof limitations (mock vs actual durable storage, sessions, physical-device deep links, backup/key custody), current unresolved POC and UI-AMEND blockers; **no incidental authorization** to progress other tracks.
7. STOP on drift, unapproved paths/deps/network, real identifiers/credentials, misconnection, foreign-scope access, CSRF bypass, false Saved/Deleted, dropped draft or source history, unproven cross-process idempotency, undeclared G6 activity or wrong-SHA QA.

Execution may publish a PR/handoff **only after** G1. G2 requires independent G3; G3 PASS requires G4 Design acceptance; G5, G6 and G7 remain separately held. Changes to branch head, runtime material, security dependencies or test fixture invalidate the affected approval/evidence as stated in A9/A13/A18.

## 5. Explicit current work-item gate ledger

| Work item | Design | Execution | Independent QA and acceptance | Real access / merge / release |
| --- | --- | --- | --- | --- |
| **WP-00 / POC-001** | Original local scope + REMEDIATION-02 approved unchanged | Prior **LOCAL_SYNTHETIC authorization only**; newer head `74d00f2…` | Latest QA **PARTIAL** at exact head; **new Design disposition still required** | ACCESS-02 BLOCKED; PR #2 OPEN/unmerged; no release |
| **WP-00A** | ACCESS-01 policy design only | **NOT_AUTHORIZED** | Real provider NOT_RUN | **NO ACCESS-02** |
| **WP-01** | **PLAN_READY_CANDIDATE** under A20 | **NOT_AUTHORIZED** | **NOT_RUN**, no app mock created | BLOCKED / NOT_AUTHORIZED |
| **WP-02..WP-09** | A10 sequence planning approved; A20 gate addendum only | **ALL NOT_AUTHORIZED** | Application/physical-device QA **NOT_RUN** | BLOCKED / NOT_AUTHORIZED |
| **Module 002 UI** | 67 decisions FROZEN | No full-UI execution authorized | Original 26 U6 **NOT_RUN** | No UI amendment/merge/release |

Nothing in this ledger overwrites [POC-001 STATUS](../handoffs/POC-001/STATUS.md) historical content or modifies its original Execution/REMEDIATION instructions. The newest independently observed state is cited above and retained as a separate overlay.

## 6. A20 STOP and future decisions

**A20 document commit scope only:** these three new architecture/planning Markdown files plus `docs/architecture/STATUS.md` and `docs/governance/DECISION_LOG.md`. No edit of D007-A10 original, frozen UI, any POC-001 file/branch/base/path, existing instructions, application code, tests, lockfile, workflow or CI; no PR #2 rebase/merge; no ACCESS-02, provider/device test, architecture freeze, staging or deployment.

**Next independent design candidate:** **D007-A21 — WP-01 synthetic-only G1 execution-authorization decision**, only after verifying an updated main base, exact future allowlist, deterministic fixture files/hash, no-network harness/toolchain/dependency review and runnable QA commands. This A20 record **does not pre-approve** A21. Independently, QA comment 7089087597 requires a **separate POC-001 residual-finding Design disposition** (potential scoped remediation) before LOCAL PASS; that track is not part of A21 or this approval.

**FINAL:** **A20 OPTION B — GATE/PLAN DOCS APPROVED. WP-01 NOT_AUTHORIZED; ALL NEW EXECUTION, MERGE, LIVE ACCESS AND RELEASE BLOCKED.**
