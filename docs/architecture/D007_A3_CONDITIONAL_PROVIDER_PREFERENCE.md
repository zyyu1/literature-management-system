# D007-A3 — Conditional Cloud Platform Preference (APPROVED Option B)

**Decision:** D007-A3, approved by user on **2026-11-23 (Europe/Berlin)**, **Option B**.  
**Status:** **CONDITIONAL PREFERRED CANDIDATE ONLY — NOT FINAL PROVIDER SELECTION**.  
**Approval type:** Architecture/selection priority *on paper*, not cloud account, procurement, paid plan, DNS, hosting, deployment, code implementation, production or POC execution authorization.  
**Prior decisions:** [D007-A1 logical separation](D007_A1_LOGICAL_DEPLOYMENT.md), [D007-A2 provider and TCO comparison](D007_A2_PROVIDER_COST_EVALUATION.md), [Module 002 frozen UI](../ui/002/DESIGN_APPROVED.md).  
**POC-001:** Existing [local synthetic execution instruction](../handoffs/POC-001/EXECUTION_INSTRUCTION.md) and [ACCESS-01 policy](../handoffs/POC-001/ACCESS_POLICY.md) stay **unchanged**. Real Nutstore account access requires independently approved ACCESS-02.

## 1. Conditional priority (not a procurement decision)

| Priority | Platform pairing | Intended decision use | Mandatory conditions / switch trigger |
| --- | --- | --- | --- |
| **1 — Conditional primary** | **Cloudflare Pages (static frontend) + Render Frankfurt (independently deployable secure Node.js API)** | Default *candidate to validate first* when an authorized deployment-feasibility task is separately approved | POC-001 storage safety, full Node.js/WebDAV HTTP behavior, Frankfurt API placement, secret isolation, API session/CSRF/CORS safeguards, expected resource headroom, billing/egress and QA gates all independently evidenced; otherwise do not commit |
| **2 — Alternative** | **Cloudflare Pages + Cloudflare Workers** | Lower modeled direct cost / simpler managed operations if compatible | Require adapter/runtime and HTTP conditional request proof, CPU/memory/budget fit, explicitly accepted Workers code/secret execution and data residency behavior; do not assume EU-only by default |
| **3 — Fallback** | **Cloudflare Pages + Hetzner Germany VPS** | More conventional Linux/Node runtime and geographic compute control if managed candidates fail | Explicit owner acceptance of Linux hardening, patches, firewall, TLS/secret rotation, monitoring, off-site application-consistent backups, incident handling, cost of administration and capacity; no VPS procurement yet |

The preliminary D007-A2 weighted scores were **Render 4.10/5, Workers 3.90/5, Hetzner 3.75/5** on subjective pre-test assumptions (30% security, 25% API compatibility, 20% cash costs, 15% operations, 10% regional/portability). Their ranking **does not outrank security, atomic write, regional-compliance, cost or independent QA hard gates** and may be revised on proof. Pages and the API remain **independently deployable components** under D007-A1; no requirement to choose different cloud vendors merely to be logically separate.

## 2. Six blocking evidence gates before any FINAL supplier choice

Each gate must have a documented PASS or explicit design-approved exception **before** a later provider-commitment decision. A plan or synthetic local test is not a provider runtime PASS.

| Gate | Mandatory evidence | Block condition |
| --- | --- | --- |
| **G1 — POC-001 storage feasibility** | POC-01..07 local synthetic PR + independent exact-SHA QA; separately approved ACCESS-02 and tested real Nutstore/WebDAV if that storage option remains preferred; atomic compare-and-swap/equivalent independent-writer safety, unknown-ack handling, export/restore and negative security checks | Real account not authorized; remote compare-and-swap unsupported/unproven; false Saved, uncontrolled retries or lost notes; synthetic QA cannot be relabeled remote PASS |
| **G2 — API runtime and interoperability** | Later separately scoped *test authorization* and evidence for representative Node.js WebDAV adapter on actual Render Frankfurt tier; TLS and upstream host allowlists, `ETag`/`If-Match`, PROPFIND/HTTP 4xx-5xx, redirects, cancellation/timeouts, 512 MiB memory, concurrency/idle/cold-start, outbound routing and API-to-static-site contract | Required outbound protocol, runtime/memory or safe failure behavior cannot work within approved limits; no live provider test may run under this design-only decision |
| **G3 — EU privacy and regional/data flow** | Explicit data inventory and data-flow map across Cloudflare Pages/CDN, Render Frankfurt compute, logs, secrets, Zotero API, Nutstore WebDAV, backups and any auth service; provider DPA/regions and legal/privacy requirements reviewed before live personal data | Unknown or unacceptable data/control-plane residency and subprocessor behavior; Frankfurt compute alone is **not** a whole-system EU-only guarantee |
| **G4 — Authentication and secret security** | Separately approved and tested session/identity model; server-side authZ on every object/Project; HTTPS, CSRF/CORS defenses, cookie flags or alternative token lifecycle, secret rotation, least-privilege API credentials, SSRF/path restrictions, negative security test and sanitized logs | Browser receives Nutstore app password/Zotero sensitive token; static bundle leaks secrets; public writable API; missing authZ, unrestricted proxy or hidden live credential |
| **G5 — Total cost and operations** | Refresh official billable quotes/plan limits at time of selection; bound monthly API calls/CPU/egress with actual evidence, external service subscriptions, logs/backups, domain, regional features, VAT/FX/billing, alert budgets and expected admin/incident hours in a monthly/annual model | Budget unknown or unaffordable, unexpected overage/capacity/region cost or operational burden; A2 sample $/€ numbers are illustrative only |
| **G6 — Independent QA and governance** | Exact PR/test SHA, reproducible synthetic and later separately authorized provider test steps, observed results, P0/P1 closure, independent QA report and Design disposition; explicit provider/purchase/deployment authorization separate from this file | QA not run or not independent; failed/unknown outcome misrepresented as PASS; missing authorization to deploy, register cloud account or pay |

**G1 dependency matters:** If WebDAV storage fails its mandatory concurrency or safety tests, return to a separately approved **D007 storage amendment**. Do not silently treat Render, Workers or VPS as a fix for an unsafe shared backing store, and do not automatically migrate to a hosted database. A supplier ranking cannot resolve storage architecture failure.

## 3. Preferred validation order and exit criteria (future, not yet authorized)

1. **First**, finish POC-001 local/synthetic phase and independent QA. Any real Nutstore test requires a separate **POC-001-ACCESS-02**, secure configuration and explicit remote request scope; this A3 does not grant it.
2. **Only after a new execution-scope decision**, validate a *synthetic-only* API contract and adapter in an appropriately isolated Render test environment. Determine concrete service region, Node version, instance resources, outbound WebDAV/Zotero endpoints without live user credentials, log/redaction behavior and API ↔ Pages authentication. **No account creation, free-trial deployment or billing is authorized now.**
3. **If Render has a blocking requirement**, compare Workers at the **same synthetic workload and security criteria**, including region/secret caveats and Worker HTTP semantics. If Workers also fails, consider Hetzner under an owner-maintenance and security/backup assessment; **no automatic failover, code port or supplier change** is authorized.
4. Before finalizing a supplier, obtain up-to-date quotes, acceptable data-processing/region findings, selected auth scheme, expected monthly + annual TCO, tested backup and incident plan, independent QA evidence, and a **separate explicit Design approval** identifying provider, scope, exact accounts/resources and any payment cap.
5. Actual website feature implementation remains governed by the [frozen UI spec](../ui/002/DESIGN_APPROVED.md) and its own explicit execution handoff. This A3 **does not authorize any app code, POC scope expansion, deployment, secrets, cloud setup or PR merge**.

## 4. Cost and lock-in boundaries carried from D007-A2

- **Prices are comparative snapshots, not a purchase:** Cloudflare Workers Paid starting $5/mo in the A2 model; Render Starter $7/mo and higher $25 tier where assumed; Hetzner Germany CX23 €5.49/mo base before IPv4 and VM backup. Traffic, tax/VAT, exchange rates, second Nutstore account, auth, logs and real maintenance may change totals; reference [full A2 assumptions](D007_A2_PROVIDER_COST_EVALUATION.md).
- **Portability:** frontend static build and independently deployable secure API with documented versioned contracts and no client secrets; storage adapter must enforce expected revision/atomic semantics. Avoid tying canonical identity/notes/quote provenance to host-specific storage APIs; choose Render only as an initial platform-validation target, **not** as a permanent lock-in.
- **Data residency:** Render's Frankfurt compute is a useful regional option, but Cloudflare CDN/Workers operations, upstream Zotero/Nutstore WebDAV and log/backup services require separate review. Cloudflare Workers global default execution and Workers secret/code distribution cannot be advertised as an EU-only guarantee. Hetzner Germany API compute likewise does not control other providers' data flows.
- **No cost cap is a purchase authorization:** A2 models are illustrative, not budget approvals. A subsequent cloud account/paid-plan decision needs clear ceilings and approved payment responsibility.

## 5. Current final disposition and next unrelated design task

**D007-A3 = APPROVED Option B / CONDITIONAL FIRST-VALIDATION PREFERENCE.**  
**Final API supplier = NOT SELECTED. Cloud resources = NONE APPROVED. Deployment = NOT AUTHORIZED.**  
**POC-001 current local execution = UNCHANGED; remote Nutstore = BLOCKED until ACCESS-02. Independent runtime QA = NOT RUN.**

**Next independently actionable design decision:** **D007-A4 — provider-neutral authentication/session and cross-origin security contract** for static frontend ↔ separately deployed API, including minimal identity model, cookie/CSRF/CORS choices, read-only Personal Workspace client boundary, and no vendor selection or code authorization.
