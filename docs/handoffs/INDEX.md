# Handoff Index

| Work item | Scope | Design | Implementation | QA |
| --- | --- | --- | --- | --- |
| [BOOTSTRAP-000](000/STATUS.md) | Establish independent repository and docs/handoffs | APPROVED PROCESS | DOCS PUBLISHED ON MAIN (verify exact SHA) | NOT STARTED |
| [Module 001](../baseline/LMS_REQUIREMENTS_ARCHITECTURE_v0.1.md) | Product requirements baseline | APPROVED PRODUCT REQUIREMENTS | NO CODE AUTHORIZATION | NOT STARTED |
| [Module 002](002/STATUS.md) | Web UI and interactions | UI-FREEZE-01 DESIGN_APPROVED / FROZEN; [canonical spec](../ui/002/DESIGN_APPROVED.md) | NOT AUTHORIZED | NOT STARTED |
| [POC-001](POC-001/STATUS.md) | Bounded synthetic WebDAV + secure API feasibility; [scope](POC-001/DESIGN_APPROVED.md), [execution instruction](POC-001/EXECUTION_INSTRUCTION.md) | POC-001-SCOPE-01 + [ACCESS-01 security policy](POC-001/ACCESS_POLICY.md) APPROVED; **REAL ACCOUNT ACCESS BLOCKED** pending ACCESS-02 | **LOCAL MOCK/SYNTHETIC ONLY EXECUTION AUTHORIZED**, NO CODE STARTED | NOT STARTED |

Module 002: [canonical draft](../ui/002/DESIGN_DRAFT.md), [consistency audit](../ui/002/CONSISTENCY_AUDIT.md), [acceptance traceability](../ui/002/ACCEPTANCE_TRACEABILITY.md). Canonical [DESIGN_APPROVED.md](../ui/002/DESIGN_APPROVED.md) is **approved as frozen UI design only**. The independent **POC-001 local-only scope/start instruction remains APPROVED**. The new [ACCESS_POLICY.md](POC-001/ACCESS_POLICY.md) fixes future security requirements **without permitting live Nutstore login**, widening the running execution scope or asserting QA. **Module 002 application implementation is NOT AUTHORIZED; independent QA remains NOT STARTED**.

This record is not evidence that functional tests or CI have passed.
