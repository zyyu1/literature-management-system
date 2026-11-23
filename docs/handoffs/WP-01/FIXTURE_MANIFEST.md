# WP-01 — Immutable Synthetic Fixture Manifest

- Filename: [fixtures/wp01.v1.json](fixtures/wp01.v1.json).
- Canonical raw UTF-8 JSON; one minified line sorted by key, terminated by exactly one LF.
- **Raw SHA-256:** `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`.
- **Size:** 4573 bytes.
- **Git blob SHA-1:** `0965c45e3af482f4074845e1c7558901963f224f`.
- Schema: `WP01-SYNTHETIC-v1.0.0`; random seed `21001`; deterministic fake time `2030-01-02T03:04:05.000Z`.
- Principals: fake Owner, foreign, read-only Workspace, guest. Fake projects/associations and deliberate library-qualified itemKey collision. Fake session-revoke/expiry cases, outcome faults, hostile-origin/CSRF/Step-up/path/redirect negative cases.
- Real identities/PDFs/Zotero credentials/annotation bytes/production tokens: **NONE**.
- This is **fixture design**, not an executed test, durable store or external service.
- Check with `sha256sum docs/handoffs/WP-01/fixtures/wp01.v1.json` and `node -e "JSON.parse(require('node:fs').readFileSync('docs/handoffs/WP-01/fixtures/wp01.v1.json', 'utf8'))"` before first authorized G1 work. Source byte discrepancy → STOP; re-approval required before editing fixture.
