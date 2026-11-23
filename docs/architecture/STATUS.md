# D007 — Hosting and Deployment Design Status

**Last updated:** 2026-11-23 (Europe/Berlin)  
**D007-A1:** **APPROVED — Option B: static frontend + independently deployable lightweight secure API**, with explicit credential isolation, authenticated server-only writes and replaceable conditional storage adapter.  
**D007-A2:** **APPROVED — Option B assessment only**: Cloudflare Pages+Workers, Cloudflare Pages+Render API and Cloudflare Pages+Hetzner VPS compared on current official pricing, EU regional/data caveats, authentication/secrets, WebDAV runtime limitations, three modeled monthly/yearly TCO scenarios and weighted risk rubric. [Evaluation](D007_A2_PROVIDER_COST_EVALUATION.md); **NO provider selected**.  
**D007-A3:** **APPROVED Option B — CONDITIONAL PLATFORM PREFERENCE ONLY**: Cloudflare Pages + Render Frankfurt API first validation candidate, Cloudflare Pages + Workers alternative, Cloudflare Pages + Hetzner Germany VPS fallback; [gated selection record](D007_A3_CONDITIONAL_PROVIDER_PREFERENCE.md). **Final supplier NOT SELECTED / no purchase or deployment authorized**.
**Conditional ranking:** CF-R (Render Frankfurt API) **priority 1**, CF-W (Workers) **alternative**, CF-H (Hetzner Germany VPS) **fallback**, based on D007-A2 provisional scores 4.10/5, 3.90/5, 3.75/5. Blocking gates: **POC-001, API/runtime fit, EU/privacy region, session/secrets security, TCO/budget and independent exact-SHA QA**.
**Actual frontend/API hosting provider:** NOT SELECTED.  
**Domain, hosting region, cloud account, billing and deployment:** NOT SELECTED / NOT AUTHORIZED.  
**Candidate website-owned storage:** Separate Nutstore WebDAV account only if POC-001 core acceptance later passes.  
**POC-001 local execution:** AUTHORIZED by POC-001-SCOPE-01, unchanged; independent QA not run.  
**POC-001 real Nutstore account access:** BLOCKED pending separately approved ACCESS-02.  
**Frozen Module 002 UI:** UNCHANGED ([DESIGN_APPROVED.md](../ui/002/DESIGN_APPROVED.md)).  
**Application implementation/production deployment:** NOT AUTHORIZED.

See [D007-A1 logical architecture](D007_A1_LOGICAL_DEPLOYMENT.md), [D007-A2 cost/risk evaluation](D007_A2_PROVIDER_COST_EVALUATION.md), [D007-A3 conditional preference](D007_A3_CONDITIONAL_PROVIDER_PREFERENCE.md), [Module 001 baseline](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md), [Decision Log](../governance/DECISION_LOG.md) and [Handoff Index](../handoffs/INDEX.md).

**Next design decision:** D007-A4 — provider-neutral identity, session, CSRF/CORS and static-frontend↔secure-API security contract. No provider procurement, deployment or new POC implementation authorization.
