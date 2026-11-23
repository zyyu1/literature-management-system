# Handoff Index

| Work item | Scope | Design | Implementation | QA |
| --- | --- | --- | --- | --- |
| [BOOTSTRAP-000](000/STATUS.md) | Establish independent repository and docs/handoffs | APPROVED PROCESS | DOCS PUBLISHED ON MAIN (verify exact SHA) | NOT STARTED |
| [Module 001](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md) | Product requirements baseline | APPROVED PRODUCT REQUIREMENTS | NO CODE AUTHORIZATION | NOT STARTED |
| [Module 002](002/STATUS.md) | Web UI and interactions | UI-FREEZE-01 DESIGN_APPROVED / FROZEN; [canonical spec](../ui/002/DESIGN_APPROVED.md) | NOT AUTHORIZED | NOT STARTED |
| [POC-001](POC-001/STATUS.md) | Bounded synthetic WebDAV + secure API feasibility; [scope](POC-001/DESIGN_APPROVED.md), [execution instruction](POC-001/EXECUTION_INSTRUCTION.md) | POC-001-SCOPE-01 + [ACCESS-01 security policy](POC-001/ACCESS_POLICY.md) APPROVED; **REAL ACCOUNT ACCESS BLOCKED** pending ACCESS-02 | **LOCAL MOCK/SYNTHETIC ONLY EXECUTION AUTHORIZED**, NO CODE STARTED | NOT STARTED |

| [D007 architecture](../architecture/STATUS.md) | Static frontend + independent lightweight safe API | D007-A1/A2/A3 approved; **D007-A4 [session/security design](../architecture/D007_A4_AUTH_SESSION_SECURITY.md) APPROVED**, D007-A5 API contract PENDING; FINAL SUPPLIER NOT SELECTED | NO CLOUD OR APPLICATION CODE AUTHORIZATION | NOT STARTED |

Module 002: [canonical draft](../ui/002/DESIGN_DRAFT.md), [consistency audit](../ui/002/CONSISTENCY_AUDIT.md), [acceptance traceability](../ui/002/ACCEPTANCE_TRACEABILITY.md). Canonical [DESIGN_APPROVED.md](../ui/002/DESIGN_APPROVED.md) is **approved as frozen UI design only**. The independent **POC-001 local-only scope/start instruction remains APPROVED**. The new [ACCESS_POLICY.md](POC-001/ACCESS_POLICY.md) fixes future security requirements **without permitting live Nutstore login**, widening the running execution scope or asserting QA. **Module 002 application implementation is NOT AUTHORIZED; independent QA remains NOT STARTED**.

D007-A2 prices/scores and D007-A3's Render-first preference are **design assumptions/conditional validation priorities**, not supplier procurement, live service access, a verified EU-wide data-residency claim, actual hosting bill, POC-001 result or cloud runtime QA. D007-A4 authentication/session contract is **APPROVED AS DESIGN ONLY**, with identity vendor and session store unresolved; browser/domain compatibility, API code and QA remain unexecuted. D007-A5 API response/write contract is next.

This record is not evidence that functional tests or CI have passed.
