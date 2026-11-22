# D007 — Hosting and Deployment Design Status

**Last updated:** 2026-11-23 (Europe/Berlin)  
**D007-A1:** **APPROVED — Option B: static frontend + independently deployable lightweight secure API**, with explicit credential isolation, authenticated server-only writes and replaceable conditional storage adapter.  
**D007-A2:** **APPROVED — Option B assessment only**: Cloudflare Pages+Workers, Cloudflare Pages+Render API and Cloudflare Pages+Hetzner VPS compared on current official pricing, EU regional/data caveats, authentication/secrets, WebDAV runtime limitations, three modeled monthly/yearly TCO scenarios and weighted risk rubric. [Evaluation](D007_A2_PROVIDER_COST_EVALUATION.md); **NO provider selected**.  
**D007-A3:** PENDING — later conditional supplier-selection decision, subject to hard security/region/POC evidence and explicit no-procurement gate.
**Provisional shortlist:** CF-R (Render Frankfurt API) first by heuristic score (4.10/5), CF-W (Workers) second (3.90/5), CF-H (Hetzner DE VPS) third (3.75/5); **NOT A BINDING SELECTED PROVIDER**.
**Actual frontend/API hosting provider:** NOT SELECTED.  
**Domain, hosting region, cloud account, billing and deployment:** NOT SELECTED / NOT AUTHORIZED.  
**Candidate website-owned storage:** Separate Nutstore WebDAV account only if POC-001 core acceptance later passes.  
**POC-001 local execution:** AUTHORIZED by POC-001-SCOPE-01, unchanged; independent QA not run.  
**POC-001 real Nutstore account access:** BLOCKED pending separately approved ACCESS-02.  
**Frozen Module 002 UI:** UNCHANGED ([DESIGN_APPROVED.md](../ui/002/DESIGN_APPROVED.md)).  
**Application implementation/production deployment:** NOT AUTHORIZED.

See [D007-A1 logical architecture](D007_A1_LOGICAL_DEPLOYMENT.md), [D007-A2 cost/risk evaluation](D007_A2_PROVIDER_COST_EVALUATION.md), [Module 001 baseline](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md), [Decision Log](../governance/DECISION_LOG.md) and [Handoff Index](../handoffs/INDEX.md).

**Next design decision:** D007-A3 — decide whether to conditionally designate a preferred supplier for a later proof-of-deployment, or defer selection until POC-001 evidence; no account registration, purchase, deployment or implementation authorization.
