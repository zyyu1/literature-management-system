# WP-01 — DESIGN APPROVED (D007-A21 Option B)

- **Canonical architecture decision:** [D007-A21](../../architecture/D007_A21_WP01_G1_DECISION.md).
- **Fixed fixture:** [wp01.v1.json](fixtures/wp01.v1.json), raw SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`, Git blob `0965c45e3af482f4074845e1c7558901963f224f` (single UTF-8 JSON line plus LF).
- **Authorized only by separately published exact-base [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md)** after the preflight design tree is committed. No execution starts from this page alone.
- **Future Execution path set:** `packages/wp-01-synthetic-auth-api/**` and `docs/handoffs/WP-01/QA_HANDOFF.md` ONLY. Future branch `exec/WP-01-synthetic-auth-api`.
- **Scope:** Node 22.23.5 Linux x64 loopback-only synthetic Auth/Session/safe-API contract; no npm install or dependencies, no actual browser/native application or real persistence/identity. A4/A5/A9/A11–A18 constraints apply.
- **Blocked:** unrelated code/CI, frozen Module 002 UI, original POC-001 branch/base/allowlist, real Zotero/Nutstore/PDF, ACCESS-02, cloud, P0-STORE assertion, device, QA self-promotion, merge, deployment.
- **QA source:** [QA_INSTRUCTION.md](QA_INSTRUCTION.md); independent exact-PR-SHA testing is required and currently **NOT RUN**.
- **Data-safety:** all fixture IDs are invented; any unapproved network, credentials, real data or unsupported persistence promise is an immediate STOP.
