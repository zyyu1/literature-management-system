# D007-A30 — POC-001 REMEDIATION-08 Local Security Readiness G1 Authorization

**Decision:** User APPROVED Option A, 2026-11-24 (Europe/Berlin). One narrowly bounded **G1 LOCAL_SYNTHETIC** execution is authorized: R08 loopback-only HTTPS/TLS validation, SSRF/path denial, Q4 admission/slow-body handling, Q5 UNKNOWN/fence regression, P2-R05-2 export capacity proof, and test-only ACCESS-01 budget accounting. **Execution NOT_STARTED; QA NOT_RUN; no G4 for R08.** Read [D007-A29](D007_A29_PRE_ACCESS02_READINESS_DESIGN.md), [D007-A28](D007_A28_POC001_G4_LOCAL_DISPOSITION.md), [ACCESS-01](../handoffs/POC-001/ACCESS_POLICY.md), [R08 instruction](../handoffs/POC-001/REMEDIATION_08.md), [independent QA plan](../handoffs/POC-001/REMEDIATION_08_QA_PLAN.md).

## Immutable Git and scope
- Repository `zyyu1/literature-management-system`; PR #2 OPEN/unmerged; existing branch `exec/POC-001-webdav-feasibility`.
- Original immutable merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, **not floating main/PR target**; mandatory exact R08 starting PR/remote/local HEAD `ace7b1e610529c1f139dc06371d9f531ccf0e28b`. STOP if any SHA differs, worktree dirty, missing ancestor, merge commit or branch changed. No rebase, main merge/cherry-pick, force-push or new branch. Read A30 governance at its final pinned Design commit without merging it into PR.
- Cumulative original allowlist `poc/001/**` and `docs/handoffs/POC-001/QA_HANDOFF.md`; R08 incremental whitelist below is **strictly narrower**.

## Strict R08 incremental write whitelist
`poc/001/src/webdav-adapter.mjs`
`poc/001/src/util.mjs`
`poc/001/src/safe-api.mjs`
`poc/001/test/r08-readiness.test.mjs`
`poc/001/test/r08-local-tls-fixtures.mjs` (optional)
`poc/001/scripts/mutation-check.mjs`
`poc/001/evidence/**`
`poc/001/README.md`
`docs/handoffs/POC-001/QA_HANDOFF.md`

**Forbidden:** `src/api-main.mjs`, `src/mock-webdav.mjs`, `src/dav-xml.mjs`, `src/client.mjs`, `src/note-codec.mjs`, all previous POC/R01–R07 tests, helpers/other scripts, package/lock/dependencies, CI, frozen UI, main governance, old instructions, ACCESS_POLICY, credentials, real PDFs or bibliographic records. Any other edit: STOP/Design.

## Accepted bounded requirements
1. **TLS:** permit strict `https:` only for a verified loopback synthetic HTTPS fixture, with test-only CA/cert material held ephemerally outside repo. Maintain `http:` loopback regressions. Validate certificate and peer name; reject wrong CA, SAN, expired cert, redirects and insecure trust overrides. Every non-loopback target remains blocked before application request/Authorization. No real upstream enablement, DNS to external host, provider test or secret. Retain exact 114-byte explicit `resourcetype` PROPFIND/no fallback.
2. **SSRF/path:** reject user-supplied arbitrary hosts, unexpected port/path/origin, embedded URL credentials, non-loopback/dangerous resolution, foreign or encoded traversal/cross-namespace targets. Preserve old scope and authentic write classification.
3. **Q4 local profile only:** two synthetic principals with `maxPerPrincipal=2`, `maxLedgerEntries=4` and 1,000ms absolute inbound-body deadline; existing `MAX_BODY=1_000_000`. Ensure an incomplete/aborted upload **before dispatch** leaves no pending reservation, delayed chunks cannot later write, and no upstream PUT occurs. If dispatch is uncertain, preserve UNKNOWN. These parameters are QA fixture values, not production SLA/defaults. Do not edit historical tests or invent durable ledger/queue.
4. **Q5:** prove UNKNOWN and `indeterminate` stay nonterminal after applied-but-unconfirmed Fence, missing/mismatched ETag, lost acknowledgment or failed readback. Keep quota/fence holds and manual STOP/quarantine; **no auto replay, forced terminalization, TTL eviction, blind fence retry or liveness algorithm**.
5. **Capacity:** end-to-end local export using specific minimal `8+6*N` listing: N=1665 (9998 elements) versus 1666 (10004). Observe full status/count/bundle, no 200 partial result, zero record GET/write when listing fails, time/RSS/response bytes. Keep 10,000 XML element cap; no invented universal library limit or paging. Q1e unknown omission remains UNSUPPORTED.
6. **Budget:** demonstrate synthetic dry-run accounting for ACCESS-01's unchanged max **100 requests/rolling30min inclusive cleanup; 20 files/run; 1MiB/file and 20MiB total; 2 writers**, STOP before cleanup budget exhaustion. Not a real or production budget implementation.

## QA and gate
- Mandatory cases: `R08-TLS-01/02`, `R08-NET-03`, `R08-PATH-04`, `R08-Q4-05`, `R08-Q5-06`, `R08-CAP-07`, `R08-BUD-08`, `R08-REG-09`, `R08-SCOPE-10`. Actual case names and independent probes are in R08 QA plan.
- Keep **all 153 historical POC/R01–R07 tests** passing without edits. Run expanded full suite five distinct times if claiming x5. Preserve effectiveness of **M1–M51**; add meaningful R08 mutants killed by correct assertions. Check/secret scan/zero npm dependencies. No fixed projected new test/mutant count.
- Execution commits only allowlist to same PR #2 via fast-forward; post exact final SHA, source/path audit, sanitized evidence and QA handoff, then **EXECUTION STOP**.
- Execution coordinates a **separately user-opened QA window**, not a same-Execution-session sub-agent. Independent QA fresh-clones exact final head, writes own temp fixture/mutants, posts direct QA PR comment and STOP; Execution relays original report to Design. No self-certification. Only future independent **D007-A31 G4** may adjudicate R08.
- Preserve D007-A28 historical `G4 ACCEPTED_EXACT_SHA LOCAL_SYNTHETIC@ace7b1e610529c1f139dc06371d9f531ccf0e28b`. R08 changed SHA is **NOT** automatically accepted.

**G5 MERGE NOT_AUTHORIZED; G6 ACCESS-02 BLOCKED; G7 DEPLOY NOT_AUTHORIZED; OVERALL BLOCKED_REAL_SERVICE.** R08 local authorization is NOT a live HTTP/TLS/credentials/provider approval.