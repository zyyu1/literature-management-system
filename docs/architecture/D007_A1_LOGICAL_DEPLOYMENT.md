# D007-A1 — Logical Web Deployment Architecture (APPROVED, Option B)

**Decision:** D007-A1 approved **Option B** by user, 2026-11-23 (Europe/Berlin).  
**Status:** **LOGICAL ARCHITECTURE APPROVED / PROVIDER, DOMAIN, BILLING, HOSTING AND DEPLOYMENT NOT DECIDED OR AUTHORIZED**.  
**Baseline:** [Module 001 D007](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md) remains conditional on POC-001; [Module 002 frozen interaction design](../ui/002/DESIGN_APPROVED.md) is unchanged.  
**POC separation:** [POC-001 synthetic execution](../handoffs/POC-001/EXECUTION_INSTRUCTION.md) and [ACCESS-01 policy](../handoffs/POC-001/ACCESS_POLICY.md) remain unchanged, and **no live Nutstore connection** is authorized.

## 1. Approved logical topology

```text
Desktop / tablet / phone web browsers
              |
       HTTPS + authenticated app session
              |
      Static Web Frontend (separate deployable)
       |  presentation, routing, UI state,
       |  input capture, accessibility
       |
       +---- HTTPS bounded calls to independent lightweight API
                  |
                  +-- authentication/session & authorization
                  +-- input validation, Project/library access scopes
                  +-- authoritative write acknowledgment / version guards
                  +-- rate limits, error classification and safe audit
                  +-- server-side credentials and secret separation
                  +-- storage adapter boundary (candidate D007)
                  |
                  +----> Zotero Web API (metadata/annotations authority;
                  |     exact API scope/permissions still unverified)
                  |
                  +----> Candidate website-owned note data store
                        separate Nutstore/WebDAV account via server-side
                        adapter ONLY IF POC-001 core acceptance later passes

External handoff: user-initiated browser → device Zotero app/deep link
(no website PDF copy; platform-specific support must be tested)

Independent Personal Workspace: authenticated read-only projection/API
+ deep link, never workspace-side mutation (product D006)
```

**Separation means a distinct frontend deployment artifact and independently deployable/secured API service or function,** with an explicit API contract and independent rollbacks. It does **not** mean different vendors are compulsory, nor does it select containers versus functions, a region, an authentication provider, a DNS topology or an always-on machine. Both components may eventually use one vendor while remaining logically and operationally decoupled. A deployed browser can reach only authorized API endpoints; direct browser→Nutstore WebDAV with credentials is prohibited.

## 2. Responsibility and ownership matrix

| Responsibility | Static frontend | Independent safe API | Zotero / proposed storage |
| --- | --- | --- | --- |
| Projects, Literature views, search/filter/sort, Select mode, dialogs, note editing, responsiveness and accessible feedback | Render and collect explicit user intent only; state local UI progress without asserting persistence | Validate authorized operations; return trustworthy outcomes, version and error classification | Zotero owns bibliographic/PDF/annotation authority; website-owned Project/status/note/quote persistence must be proved |
| Authentication | Redirect/sign-in interaction, keep authenticated browser session and explicit logout; no embedded shared secret | Verify session/identity on **every** request, map per-user/private library scopes, enforce rights per object/operation | Upstream accounts are distinct, and credentials never transit the browser or public frontend build |
| Mutation and concurrency | Send scoped intended writes and stable request identities; expose Saving/Unknown/Failed without optimistic confirmed success | Authoritative validation, optimistic concurrency/atomic guard (actual provider capability unproven), idempotency or safe reconciliation where proven; fail closed if absent | Must not assume second Nutstore supports atomic ETag/If-Match; POC-001 is mandatory |
| Metadata, annotations, attachment open | Render permitted data, user-selected handoff/fallback and attribution; no PDFs copied | Broker only necessary authorized upstream requests with server-side secrets where needed; filter outputs | Zotero item/attachment/annotation remains authoritative; stored vs linked attachment and mobile handoff require device test |
| Security and observability | Content-security safeguards, untrusted Markdown sanitization and minimal client telemetry | TLS enforcement, strict host/path allowlists, authentication, authorization/IDOR prevention, rate budgets, redacted logs and secrets management | Secrets kept on protected API/server scope, not HTML/JS, public environment variables, logs or Git |
| Personal Workspace D006 | Deep link / externally obtained read-only access UX only | Expose separately authenticated **read-only** projection scoped to intended client, deny writes | No workspace edit/auto-sync promise |

## 3. API and session design requirements (not a chosen provider)

- The default website must be HTTPS. API calls must use HTTPS, exact authorized destinations and an allowlisted origin policy if cross-origin. **CORS is not an authorization mechanism.** Cookies, if eventually chosen, require `Secure`, `HttpOnly`, suitable `SameSite`, tested CSRF protection and session expiry/rotation. A token-based scheme would require an equally safe, separately reviewed lifecycle. **No session strategy or identity vendor is fixed by D007-A1.**
- Enforce per-object identity and per-Project association authorization on the **server**, regardless of hidden UI controls. Zotero paper identity is stable, with global three-state Reading Status and one shared five-field Note versus per-Project Important and links; the API must reject cross-scope writes rather than trusting browser parameters.
- Define explicit request/response statuses distinguishing acknowledged success, **definite failure**, conflict/stale version and **unknown acknowledgment**. Return resolvable opaque request/correlation identifiers without sensitive diagnostics. Client/network timeout is not a proof of server failure; suppress unsafe blind retry and preserve drafts/source history. Do not promise a durable operation ledger without a proven backend and QA.
- UI autosave/Save Now, batch unlink/status, Key Quote Relink and note changes must receive verifiable write authority/version control from the API layer. A web host's functions, queues or edge runtime cannot be assumed to provide atomic cross-request storage locks merely because it is server-side.
- Treat Zotero metadata, quote excerpts and Markdown as untrusted input; sanitize rendering, restrict outbound hosts, prevent request-forwarding SSRF, limit body sizes and use protected error logs. Minimize data retention, disclosure and exported telemetry.

## 4. Provider-neutral storage adapter contract and its gate

Use a logical interface such as `read(objectId) → {value,revision,source}`, `writeIfRevision(objectId,expectedRevision,payload,requestId) → confirmed|conflict|unknown`, `listAuthorized(scope)`, `export/restore`, `healthCapabilities()`. This is a **design contract, not code or an implemented API schema**. A storage adapter must preserve canonical IDs, atomic write preconditions and source history, immutable original references, backups, and distinguish errors/unknowns. Replacing candidate WebDAV with a database or new provider is **not authorized automatically**; POC-001 results require a distinct D007 storage-amendment decision first.

The second Nutstore account and JSON/Markdown are **conditionally preferred**, never proven. If no actual provider-backed compare-and-swap/equivalent conflict control or trustworthy recovery is available, STOP: do not use a client-side mutex, naive read-then-put, last-write-wins or silent database substitution as a permanent solution. The existing Zotero account/WebDAV PDF sync remains separate and is not repurposed.

## 5. Operational/logical deployment boundaries

- Frontend artifact must build and roll back without bundling API secrets; API must have its own configuration, deployment, resource budgets, observability and rollback plan. Contract compatibility and version negotiation must avoid exposing a write-capable client with an incompatible server. Candidate deployment choices must later assess cold starts/long-lived requests, egress toward Zotero/Nutstore, rate limits, file/object size limits, logs, secret rotation, permitted data regions, TLS, DNS and backup.
- A publicly hosted frontend does **not** mean a publicly unauthenticated writable API. Define origin protections, no public debug endpoints, minimum privilege, isolation for user content, appropriate anti-abuse controls and denial of access when session/token cannot be verified.
- Deployment provider, country/region, domain/subdomain, cost, plan/quotas, billing, IAM/identity provider, uptime promise, cache/CDN, CI/CD, DNS/TLS and real app hosting are **PENDING D007-A2+ design**. Do not infer a production service, provider choice, account setup or subscription.
- **No work authorization follows from this design.** The Execution window stays within its existing **POC-001 local-synthetic branch and file allowlist**. It must not start frontend builds, remote cloud hosting, live Nutstore/Zotero calls, full website implementation or deployment until separately instructed.

## 6. Acceptance and open proof gates

| Requirement | Present status | Future necessary proof |
| --- | --- | --- |
| Independently deployable static frontend + lightweight safe API with clear contract | **APPROVED logical topology only** | Candidate platform feature/limits review, architecture decisions and bounded execution authorization |
| Secure authentication, session handling, keys and audit | **DESIGN REQUIREMENT** | Security threat model, chosen identity strategy, penetration/negative tests, actual secret boundary |
| Conditional storage and concurrency guard | **POC-001 BLOCKED FOR REAL ACCOUNT** | Separately authorized real account tests, independent QA for atomic conflict and recovery |
| Mobile/desktop Zotero API/app handoff | **UNVERIFIED** | Per-platform browser/device tests and safe fallbacks |
| Cost, regions, portability, backup and operational procedures | **NOT SELECTED** | D007-A2 cost/candidate evaluation; D007-A3 actual provider/supplier decision if subsequently approved |

**Next design decision:** D007-A2 — provider candidate shortlist, pricing/limits and TCO evaluation rubric **without supplier commitment**.
