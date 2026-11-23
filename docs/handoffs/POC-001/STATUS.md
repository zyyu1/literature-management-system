# POC-001 — Current Governance Status (D007-A25 overlay; A24 G4 preserved)

**Updated:** 2026-11-23 (Europe/Berlin).

**D007-A25 current overlay:** **Option B APPROVED — REMEDIATION-05 G1 AUTHORIZED_LOCAL_SYNTHETIC ONLY** ([A25 Design](../../architecture/D007_A25_POC001_REMEDIATION05_DISPOSITION.md), [R05 Execution](REMEDIATION_05.md), [independent G3 plan](REMEDIATION_05_QA_PLAN.md)). Preserve original branch `exec/POC-001-webdav-feasibility`, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, exact pre-R05 start PR #2 HEAD `22dd9bd30900d9c7ca205a36c675fd47b2569feb`; changed paths only `poc/001/**` plus `docs/handoffs/POC-001/QA_HANDOFF.md`, **NO REBASE, NO MERGE MAIN, NO FORCE PUSH**. Scope is P2-R04-1 parser depth/element/namespace/attribute resource limits and P2-R04-2 minimal explicit `resourcetype` PROPFIND with tests/README and independent QA, **NOT broader WebDAV features**. **R05 Execution NOT_STARTED by Design; new R05 G3 QA NOT_RUN; P2-R04-1/2 STILL OPEN hard ACCESS-02 blockers.** Historical A24 G4 **ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS SYNTHETIC ONLY** at `22dd9bd30900d9c7ca205a36c675fd47b2569feb` stays intact; **OVERALL POC BLOCKED_REAL_SERVICE**, G5 merge/G6 ACCESS-02/G7 cloud remain not authorized. The A24 table below is an immutable historical snapshot unless explicitly updated here; its old "NO R05 authorized" row is superseded by this A25 overlay.

 **This is the current consolidated status; earlier A22/A23 status documents and approval records are historical at their respective SHAs and remain valid as history, not current execution state.**

## Current exact-SHA state

| Field | Current |
| --- | --- |
| Design decision | **D007-A24 Option B APPROVED** — [G4 bounded local acceptance](../../architecture/D007_A24_POC001_G4_LOCAL_ACCEPTANCE.md) |
| Source PR | [POC-001 PR #2](https://github.com/zyyu1/literature-management-system/pull/2), **OPEN / NOT MERGED** at acceptance verification |
| Branch | `exec/POC-001-webdav-feasibility`; **NO REBASE, NO MERGE MAIN, NO FORCE PUSH** |
| Original approved execution base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` (immutable) |
| Exact accepted POC head | `22dd9bd30900d9c7ca205a36c675fd47b2569feb` (distinct from moving `main` Design docs) |
| Cumulative allowlist | `poc/001/**` and `docs/handoffs/POC-001/QA_HANDOFF.md` only — independently checked 51 paths |
| Execution status | **REMEDIATION-04 COMPLETED / EXECUTION STOP**; **NO REMEDIATION-05 authorized** |
| G3 QA | **PASS_LOCAL** independently observed on `22dd9bd30900d9c7ca205a36c675fd47b2569feb`: [QA #7092575362](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7092575362) |
| G4 Design | **ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS (SYNTHETIC ONLY)** by user's D007-A24 Option B |
| Overall POC | **BLOCKED_REAL_SERVICE** — real provider, TLS, application and production evidence NOT_RUN |
| P2-R04-1 / P2-R04-2 | **OPEN HARD PRE-ACCESS-02 BLOCKERS**, not waivable by this G4 acceptance |
| G5 merge | **NOT_AUTHORIZED**, no PR merge |
| G6 ACCESS-02 | **BLOCKED / NEVER AUTHORIZED**, no Nutstore/Zotero/real WebDAV account or credentials |
| G7 staging/production | **NOT_AUTHORIZED** |

## Accepted local test proof and limitations

The independent QA used a fresh checkout and its own local `qadav4` double; **25 checked files**, original POC-01..07 **2/4/3/1/3/17/3**, R01 **21/21**, R02 **21/21**, R03 **26/26**, R04 **17/17**, complete suite **118/118 × five separate runs**, **37/37** mutants killed, **123 PASS / 14 INFO / zero FAIL** independent probes plus 160 XML placement cells, and **51 changed files / 0 secret-scan findings**. No P0/P1 observed within test scope. Execution handoff's earlier scan count is historical before final evidence commits, not a discrepancy. All observed proof is **synthetic/loopback**; no provider/production conclusions.

**Accepted as residuals for G4 local ONLY, not real readiness:** [risk register](POST_G4_RISK_REGISTER.md) — **P2-R04-1** parser depth/namespace copy CPU/OOM (442 KB → ~1.9 GB, 396 KB / 2 GB heap exit 134) and **P2-R04-2** valid DAV lockdiscovery/current-user-principal `href` 503 due to allprop conservative profile; both MUST CLOSE before any ACCESS-02 approval. **R03-Q1e** unknown record omitted by apparently legal kind listing and lack of consistent multi-file snapshot, **Q4** ledger/quota/inbound slow request, **Q5** applied-but-unconfirmed Fence indefinite `indeterminate` with held quota, provider atomic `If-Match`/PUT-GET-CAS ETag semantics, MKCOL, HTTPS, cross-instance durable ledger, credential/key handling and other provider UNSUPPORTED/NOT_RUN remain unproven.

## History — not today's stage status

- [REMEDIATION-02 QA #7089087597](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7089087597) at `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3`: PARTIAL, Q1/Q2/Q3 remediation needed.
- [REMEDIATION-03 QA #7090201835](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7090201835) at `4bfa924af2d20cd383c4e49f982f55ac83423a42`: PARTIAL, nested DAV response and broadened Q5 disclosure needed.
- [REMEDIATION-04 QA #7092575362](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7092575362) at `22dd9bd30900d9c7ca205a36c675fd47b2569feb`: **PASS_LOCAL**; D007-A24 independently accepted the bounded G4 stage with explicit P2 risks. Earlier [A22](REMEDIATION_03.md), [A23](REMEDIATION_04.md) and original [EXECUTION_INSTRUCTION](EXECUTION_INSTRUCTION.md) are preserved unchanged.

## Authorization firewall and next separate decision

**No** R05 fix or fresh G1 permission, merge, rebase, ACCESS-02, real Nutstore/Zotero requests/PDF, app or frozen Module 002 UI edits, CI, cloud, staging or deployment authority. **Separate WP-01 D007-A21** branch/base/G1 stays independent.

**Next recommended independent item: D007-A25 Option B (PROPOSED ONLY)** — scoped local/synthetic R05 repair of the two access blockers, with exact base/head/allowlist and fresh independent QA. The user must separately decide whether to authorize it. If approved later, any Execution-window instructions must be supplied as **complete LaTeX**; this A24 G4 decision is **NOT** an Execution instruction.
