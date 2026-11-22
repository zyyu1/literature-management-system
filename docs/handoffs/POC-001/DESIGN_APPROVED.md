# POC-001 — DESIGN_APPROVED: Bounded WebDAV + Secure API Feasibility

**Decision:** POC-001-SCOPE-01, **Option B APPROVED by user on 2026-11-23 (Europe/Berlin)**.  
**Stage:** DESIGN_APPROVED; **LIMITED LOCAL/SYNTHETIC EXECUTION AUTHORIZED** by the explicit user decision.  
**Upstream `main` at decision:** `2f7fc0a4fbd517c6600f36ec23bd1bb3fe9be556`.  
**Implementation authorization:** **POC-001 only**, per [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md). Not the Module 002 website, UI, Zotero integration or deployment.  
**Independent QA:** NOT RUN; Design approval does not imply a valid storage solution.  
**References:** [Module 001 conditional D007 baseline](../../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md), [frozen UI design](../../ui/002/DESIGN_APPROVED.md), [Three-Window Protocol](../../governance/THREE_WINDOW_PROTOCOL.md), [open-source comparison](OPEN_SOURCE_REVIEW.md).

## 1. Decision and hard scope boundary

User authorizes an isolated, narrow technical POC proving—or failing to prove—the feasibility of storing **website-owned synthetic JSON/Markdown records** through a credential-isolating **server-side safe API** to a **candidate separate Nutstore WebDAV account**. Local mock WebDAV and synthetic test clients may begin now on an isolated execution branch. The user has **NOT authorized connecting any real Nutstore account yet**: that requires a **separate affirmative approval of secure account configuration/access**. Until then, remote-Nutstore-specific scenarios are BLOCKED/NOT RUN, and the overall POC cannot be declared PASS.

The POC is allowed to build only a minimal runnable safe API/protocol adapter, synthetic fixture generator, mock WebDAV, fault-injection/concurrency harness, export/restore proof and documentation/tests necessary for this decision. It does **not** authorize implementing Projects Home, Literature List, Markdown UI, Key Quotes, Zotero login/API access, mobile Zotero app links, production backend, cloud hosting, database migration or a personal workspace. The frozen Module 002 behavior and D001–D007 product rules remain unchanged.

**Real account hold:** Never request, insert or transmit a password, API key, app password, WebDAV URL with embedded credentials or sensitive secret in code, Git, chat, PR, screenshot or CI logs. Future approved real-service work must use a separate least-privilege, server-side environment secret flow after Design explicitly reviews the access procedure. A document containing credentials is never acceptable as authorization.

## 2. The seven acceptance areas and exact gates

| ID | Goal and scenario | Evidence for a LOCAL/SYNTHETIC PASS | Additional REAL-NUTSTORE evidence required before overall POC PASS |
| --- | --- | --- | --- |
| POC-01 | WebDAV protocol CRUD | Create/read/update/delete isolated synthetic files, verify exact payload and status codes via local mock | Approved test account authentication and repeatable remote CRUD under dedicated test directory |
| POC-02 | Secure server-side API boundary | Browser-like mock client talks only to local API; credentials confined to server stub; input path/target allowlist, auth/permission check, redacted logs and no arbitrary target URL/SSRF | Approved secure account config and negative tests proving no credential exposure in request/response/client bundle or log |
| POC-03 | JSON/Markdown round trip | Five synthetic Markdown fields plus metadata encode/decode without corruption; key/identity uniqueness, Unicode/Chinese, code/math, export byte-level checks | Equivalent remote persistence/retrieval using only synthetic data |
| POC-04 | Multi-client consistency | Two simulated independent clients observe previously acknowledged committed revision after explicit read/refresh; no claim of push/live sync | Desktop/tablet/phone or two independent clients observing a real approved test-account write across sessions |
| POC-05 | Concurrent safe writes | Deterministic race of two stale writers: exactly one may update a version under atomic protection; other receives conflict (e.g. `412 Precondition Failed`) with original content intact; validate semantics not just headers | Verify actual provider `ETag`/`If-Match` or equivalent truly atomic cross-process guard. GET+PUT check or single-process mutex is **NOT sufficient** |
| POC-06 | Network, auth and failure recovery | Inject timeout, lost acknowledgment, retry, offline, 401/403, 409/412, 423, 429, 5xx; record definite versus unknown, no blind repeat, no false Saved/partial cleanup | Prove actual provider error/limit behavior and safe recovery under approved account, without harming other files |
| POC-07 | Export, backup and restore | Export a synthetic dataset, restore to a **fresh isolated** namespace, compare hashes/counts/identities and repeat safely; verify no delete cascade | Approved remote test-directory export/restore and integrity evidence |

An additional **privacy/credential and dependency-safety gate** applies to each area: no real user notes, Zotero records, PDFs, personal library exports, credentials, private WebDAV URL, unrestricted proxy, production origin or live public hosting. Use disposable generated IDs and a fixed synthetic namespace. No claim of durable browser offline draft/reconciliation without proof.

## 3. Fatal conditions and decisions on failure

- **STOP / P0:** credential or private data exposure; unrestricted SSRF target, unauthorized file mutation, data loss, incorrect rollback; a "Saved" assertion without authoritative remote confirmation; stale concurrent writer overwrites a newer record; unverified retry duplicates destructive operations.
- **STOP for full provider acceptance:** remote provider lacks reliable atomic compare-and-swap or equivalent durable conflict control, quota/limits block required workload, auth cannot be secured behind API, or export/restore is not reliable. Mock success cannot waive this stop.
- **Uncertain outcomes:** preserve latest confirmed revision, original pending operation identity and verification-needed status. Do not convert timeout to a failure/success, retry blindly, infer reconciliation from current text equality, or promise cross-device durable local backup.
- **On failed POC core criterion:** independent QA labels FAIL/BLOCKED/PARTIAL as evidence warrants. Design separately considers minimum alternate storage under D007; Execution must not autonomously select PostgreSQL/another provider or widen product scope.

## 4. Workflow and precise stage separation

1. **Now authorized:** Execution checks out current accepted `main`, reads this handoff and frozen UI, confirms clean worktree/upstream SHA, creates `exec/POC-001-webdav-feasibility` from accepted `main`, and performs only local synthetic/code-level POC tests. Review three candidate libraries and license/dependency risks; pin actual installed versions, document why chosen.
2. **Not yet authorized:** connecting the second real Nutstore account, live WebDAV requests, user secrets, real research data, public deployment, full website UI, Zotero integration or any widened POC scope. Place a STOP checkpoint and request an explicit later Design approval for **secure test-account access**; do not accept hidden/silent opt-in.
3. **Handoff:** Execution opens PR from its isolated branch (no direct merge), publishes exact test code SHA, commands, exit statuses, scoped path diff, non-sensitive synthetic fixtures, fault-injection results, negative security tests, known blockers, limitations, and safe client/server protocol logs. Clearly label LOCAL MOCK results and REAL SERVICE NOT RUN.
4. **Independent QA:** checks out the exact PR head SHA, reproduces tests and security review, evaluates POC-01..07 with individual PASS/FAIL/BLOCKED/NOT RUN (not blanket PASS), reports any P0/P1/P2 issue and upstream service capability gaps, then stops.
5. **Design disposition:** separately reviews QA and account-access gate, determines local-stage acceptance/next experiments, possible backend change or bounded future phase. QA PASS does not authorize merge or production. Design approval of POC is **not** deployment authorization.

## 5. Code and network boundaries

Allowed in Execution PR: **`poc/001/**`** containing an isolated `package.json`, lockfile, local-only API, narrow WebDAV adapter, mock server, synthetic data/fault/race tests, README and sanitized evidence. Additional isolated tests under **`tests/poc/001/**`** only if required. Do not change `src/**`, `app/**`, website UI, existing frozen docs, root workflow/dependencies or unrelated baselines without new approval. Do not push POC source to `main` until separate Design merge disposition.

Local tests may listen only on loopback (`127.0.0.1`), with no open reverse proxy, real Nutstore calls, external telemetry or unsigned automatic dependency execution. Any intentional external dependency download requires normal dependency/license review but is not permission to use user cloud credentials. A static proof of API isolation is not proof of provider auth/security. QA uses synthetic records only.

## 6. Completion definition

**POC synthetic-phase complete** requires documented repeatable synthetic CRUD, API boundary, Unicode Markdown round trip, two-client race/conflict test, fault injection and export/restore with independent QA verdict at an exact PR SHA. **Overall POC-001 complete** additionally requires separately authorized and evidenced **real Nutstore** read/write/concurrency/failure/backup behavior, which is currently **BLOCKED**, and a further Design acceptance decision. No production backend may be chosen until all hard requirements pass.
