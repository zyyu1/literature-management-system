# POC-001 — REMEDIATION-03 Independent QA Plan (D007-A22, NOT RUN)

**Approved scope:** [A22 design](../../architecture/D007_A22_POC001_REMEDIATION03_DISPOSITION.md) + [REMEDIATION-03 handoff](REMEDIATION_03.md); **independent QA is required, NOT YET RUN**. Fresh QA must check the **new actual PR #2 HEAD** reported by Execution; do not reuse or call the prior `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3` QA a fresh test.
**Historical QA baseline:** [QA 7089087597](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597) reviewed `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3`, 75/75 ×5, 23/23 mutants, N1 export PARTIAL, and Q2/Q3 gaps; no P0/P1 observed within bounded test.
**Immutable lineage:** branch `exec/POC-001-webdav-feasibility`; original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; PRE-REPAIR HEAD `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3`. No rebase, no merge main. QA must verify new head **descends** from the exact pre-repair HEAD, then compare both incremental and original-base path diffs.
**Path allowlist:** `poc/001/**`, `docs/handoffs/POC-001/QA_HANDOFF.md` only. No actual external Nutstore/Zotero, no CI/workflow, no new dependencies or environment secrets.

## 1. Independent test requirements

| Case | Fresh QA adversarial proof | Required disposition |
| --- | --- | --- |
| **R03-Q1a** | Existing namespace with all three synthetic kind collections and records in projects+notes: root well-formed PROPFIND omits one *known* kind | **503 export_incomplete**, zero `200 ok` bundle; missing empty kind also rejected unless explicit proof |
| **R03-Q1b** | Duplicate root kind href; duplicate per-kind record href; duplicate response; different normalized strings same path | **503 export_incomplete**; no silent dedupe or overcount |
| **R03-Q1c** | Conflicting response-level and propstat 2xx/4xx statuses, malformed/foreign collection, unexpected nested entries | **503 export_incomplete**; preserve namespace URI parsing and bounded parser |
| **R03-Q1d** | Valid empty and two-record namespace; normal collection listings all present once; export→fresh restore with hashes and uniqueness | Correct `count:0/2`, stable manifest, byte parity and one-time restore, no false duplicate |
| **R03-Q1e** | Known individual record omitted by a *well-formed* kind listing under an independent QA oracle | Do not claim universally certified completeness without a trusted manifest/snapshot; mark `UNSUPPORTED/provider integrity dependency` if undetectable, and distinguish test fixture from actual provider proof |
| **R03-Q2a** | Fence PUT responds with a different strong validator but storage retains original content-hash/base ETag, then original delayed PUT is released (QA R1l) | Fence **non-terminal**; after late original commit, QA never observes stale terminal `not_committed` |
| **R03-Q2b** | Conforming generation ETags: fence before late original, original before fence, both held/released; source bytes unchanged after fence | Terminal permitted only after **matching trusted PUT+GET strong ETags != base and identical bytes**; no later contradiction under synthetic atomic CAS |
| **R03-Q2c** | Same-content hash ETag; weak/missing/comma/ambiguous PUT or GET, changed bytes, failing GET, timeout, 5xx, third-party overwrite, external deletion | Non-terminal/explicit fail-closed; no unsafe replay, false Saved or false not_committed |
| **R03-Q3a** | README replay wording vs live-ledger, tombstone, beyond-window and restart cases: simulate prior saved and prior rejected op replays | No blanket "never resends"; declare saved→412, rejected→save risk after retention loss, no durable/global exactly-once |
| **R03-Q3b** | README quota default/codes and key provenance vs source; Q4/Q5 explicit observed limitations | Actual config match: `1000 × principals` default, per-principal quota, HMAC provenance, safe but possibly non-live `indeterminate` |
| **R03-Q4** | Global quota < sum per-principal quota, pending slow inbound request, saturated UNKNOWN slots | Record honest **P2 residual/UNSUPPORTED**; no false blanket fairness/liveness |
| **R03-Q5** | UNKNOWN Fence PUT late applies; verification remains indeterminate | Record **non-terminal** and liveness limitation; no unauthorized re-dispatch |

**Retain all earlier regression probes:** original POC-01..07 + R01/R02 suites, P1-R1 alternate strong content-hash behavior and both race orders, malformed/DAV namespaced PROPFIND, deadlines/trickle, bounded tombstones, HMAC provenance and cross-principal, per-principal fairness, weak/no ETags, SSRF/injection, privacy and safe restore. QA should use a **fresh independent loopback WebDAV double**, not only developer-provided fixtures; if no independent alt-server is available, mark those cases NOT_RUN rather than passing them.

## 2. Reproduction and evidence

- Before test: record full 40-char new PR HEAD, parent chain, original-base ancestry, original 47 known paths vs changed head, `git status --short`, Node/OS, zero-dependency state, exact fixture mode. Do not conflate moving PR base `main` with original authorized POC base.
- In `poc/001`: `node scripts/check.mjs`; individual POC-01..07 suites; `node --test "test/*.test.mjs"` **five separately executed times** with actual exits and counts; `node scripts/mutation-check.mjs` with reported **actual** totals; `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; independent QA adversarial scripts/test observations. Never count previously committed 75/75 or 23/23 as new evidence.
- Compare provider double **generation/strong content-hash/weak/missing/misleading PUT ETag**, XML prefix, duplicate listing/status, late ACK and after-dispatch UNKNOWN. For every asserted fail-closed gate show HTTP status/body and no dropped/upstream duplicated write.
- Confirm no unauthorized paths, dependencies, raw credentials, real Zotero item/PDF, live Nutstore requests, cloud/CI/config, app/UI mutations; preserve evidence sanitization and rollback/fail-closed.
- Report each case PASS_LOCAL / PARTIAL / FAIL / NOT_RUN / UNSUPPORTED at **exact tested SHA**, P0/P1/P2 severities, Q4/Q5 residuals, and separately all POC-01..07 area outcomes.
- **QA disposition:** LOCAL_STAGE PASS only if Q1 known-kind/duplicates/export-restore, Q2 safe terminal, Q3 truthful contracts and all relevant P0/P1 safety cases pass independently. **Any unresolved required Q1 or Q2 ⇒ PARTIAL/FAIL**, never silent waive or auto-close. Global completeness/atomic snapshot and real-provider behavior remain **UNSUPPORTED/NOT_RUN** even for local PASS. `OVERALL POC-001 BLOCKED_REAL_SERVICE` persists. QA window STOP and send exact-SHA report to Design; **NO QA edits to code, NO automatic G4/G5/G6/G7**.

## 3. G6 ACCESS-02 future gate — NOT REQUESTED, NOT GRANTED

Before a separate access decision, still require independent G4 local acceptance and actual HTTPS TLS certificate + exact host/path/redirect guard, request budget **100/rolling 30 min**, **20 files**, **1 MiB/file**, isolated disposable `/LMS-POC-001/<run-id>/` with identity-checked per-file cleanup, no personal data, audited redaction, cross-process CAS/ETag strong GET/PUT plus PUT==GET, identical-byte rewrite, MKCOL, full PROPFIND listing behavior and durable ledger design. **Do not execute or authorize those probes here.**

**QA STATUS: NOT RUN (REMEDIATION-03). Previous LOCAL_STAGE PARTIAL and PR OPEN/NOT MERGED.**
