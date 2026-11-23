# D007-A24 — POC-001 G4 Local Synthetic Acceptance (Option B)

**User decision:** **D007-A24 Option B APPROVED**, 2026-11-23 (Europe/Berlin): **G4 ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS**, *only for the bounded synthetic POC-001 contract and reviewed exact code SHA*. The user explicitly withheld REMEDIATION-05 execution, PR merge, rebase, ACCESS-02, all real Nutstore/Zotero services, frozen UI, app/CI changes, hosting and deployment. **This is a Design disposition/acceptance document, not a new Execution or network instruction.**
**Design publication parent on main:** `489c4508c4c059c1f7f9829961a08faa3d6b2ab1`. This docs-only Design commit **does not alter** the original POC branch/base or PR head.
**Accepted immutable POC code/evidence HEAD:** `22dd9bd30900d9c7ca205a36c675fd47b2569feb` ([PR #2](https://github.com/zyyu1/literature-management-system/pull/2), OPEN/NOT MERGED at decision verification).
**Original execution base:** `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; **original branch:** `exec/POC-001-webdav-feasibility`; **cumulative allowlist:** `poc/001/**` and `docs/handoffs/POC-001/QA_HANDOFF.md` ONLY. QA independently confirmed unchanged merge-base, no rebase/main merge, 51 allowlisted cumulative paths, 29 incremental R04 paths, zero new dependencies, single-parent commits `4bfa924 -> 1b37268 -> 698660d -> 22dd9bd`.
**Normative evidence:** [Independent fresh G3 QA comment #7092575362](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7092575362), 2026-11-23, exact `22dd9bd30900d9c7ca205a36c675fd47b2569feb`; [Execution evidence/update](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7090739565); [R04 QA plan](../handoffs/POC-001/REMEDIATION_04_QA_PLAN.md), [A23 exact authorization](D007_A23_POC001_REMEDIATION04_DISPOSITION.md), [A20 G0–G7 semantics](D007_A20_WORKPACKAGE_GATES.md), [ACCESS-01 policy](../handoffs/POC-001/ACCESS_POLICY.md), [post-G4 risk ledger](../handoffs/POC-001/POST_G4_RISK_REGISTER.md).

## 1. Independently observed facts, strictly local

| G3 evidence / control | Observed on exact `22dd9bd30900d9c7ca205a36c675fd47b2569feb` |
| --- | --- |
| Environment/source of proof | Fresh independent QA checkout, Linux x64, Node v22.23.5, no third-party deps; new QA-written `qadav4` loopback-only WebDAV double and synthetic data |
| Syntax/tests | `node scripts/check.mjs` **25** files; original POC-01..07 separately **2/4/3/1/3/17/3** pass; R01 21/21; R02 21/21; R03 26/26; R04 17/17 |
| Stability | `node --test "test/*.test.mjs"`: **118/118, five separate runs**; all exits 0, no failed test |
| Mutations | **37/37 killed** by independently checked R04 test/mutation suite; QA's own separate targeted mutants killed |
| Independent edge probes | **123 PASS, 14 INFO, 0 FAIL**; 160 XML placement cells, 0 unexpected accepts |
| R04-Q1c mandatory gate | Hidden/nested response variants, foreign wrappers and namespace response, misplaced `href/propstat/status`, Q1c expected `503 export_incomplete` with no bundle/side effects; source records preserved |
| R04-COL | Only **2xx** propstat collection marker accepted; non-2xx not silently promoted; valid 2xx+unrelated 404 shapes preserved |
| R04-Q5 docs and earlier required controls | Applied-but-unconfirmed fence nonterminal/held quota accurately disclosed; earlier R03 Q1a/b/d, Q2 read-back, Q3 replay/HMAC, P1-R1 race, SSRF, privacy, authenticated restore all pass *in local synthetic mode* |
| Scope/secret gate | Original-base diff: **51** allowlisted files; incremental R04 diff: **29** allowlisted files; independent secret scan **51 files / zero findings**; 0 dependency change |
| P0/P1 | **None observed within this particular QA's bounded test set**; not an assurance that none exist |
| Real provider / TLS / staging / application / production | **NOT RUN / NOT AUTHORIZED / NOT VERIFIED** |

**Important interpretation:** the independent G3 `LOCAL_STAGE: PASS` is accepted at G4 **only for this SHA, source scope, Node/runtime and synthetic profile**. G3's `OVERALL POC-001: BLOCKED_REAL_SERVICE` is unchanged. Neither G3 nor G4 establishes actual Nutstore semantics, a complete provider listing, multi-file snapshot, durable exactly-once or access/deployment safety. Any future POC code modification requires new exact-SHA review; it does not retroactively invalidate the historical acceptance of `22dd9bd30900d9c7ca205a36c675fd47b2569feb`, but it is **not automatically accepted**.

## 2. G4 Design disposition and explicitly accepted exceptions

**G4 decision: ACCEPT_BOUNDED_LOCAL_SYNTHETIC at exact `22dd9bd30900d9c7ca205a36c675fd47b2569feb`; not ACCEPT_REAL_PROVIDER.** The required A23/R04 and earlier non-waivable local functional/security invariants passed independent QA. Two new P2 observations are **accepted only as disclosed LOCAL_STAGE residual risks**; **both are independent NON-WAIVABLE G6 / ACCESS-02 PRE-ACCESS BLOCKERS**, not waived for live data.

1. **P2-R04-1 — XML parser resource exhaustion, HARD PRE-ACCESS BLOCKER.** Prior pre-existing `parseXml` lacks depth/element/namespace budgets and copies namespace maps on every element; QA reported a ~442 KB input costing 6.1–6.4 s synchronous and ~1.9 GB RSS, a ~396 KB input costing ~3.1 GB and one 2 GB capped run aborting with Node OOM **exit 134**. Integrity fail-closed (`503`) does not mitigate CPU denial-of-service or OOM. Before any external/provider request, a separately authorized local remediation must add explicit bounded work/memory, depth and node limits, efficient namespace inheritance and independent hostile-fixture QA. Do not silently downgrade this just because it is P2 rather than P1.
2. **P2-R04-2 — over-rejection of common legal DAV properties, HARD PRE-ACCESS BLOCKER.** Adapter currently sends an empty-body/allprop PROPFIND; `DAV:lockdiscovery` / `DAV:current-user-principal` can legally contain `DAV:href` outside the POC response path, which this conservative XML profile fails closed with `503`. No false data export was observed; interoperability is unproven and README property guarantee incomplete. Before external provider testing, separately authorize and independently verify a minimal explicit `resourcetype` PROPFIND request profile and honest compatibility/unsupported documentation, with negative lock/allprop and positive expected collection/listing tests. If provider semantics still require wider support, return to Design; do not invent an RFC-invalidity claim or blindly loosen structural filtering.

Other registered residuals:
- **R03-Q1e:** a well-formed upstream PROPFIND listing that silently omits an individual record can still pass; without a trusted manifest/snapshot oracle it is **UNSUPPORTED** to certify arbitrary provider completeness. **No consistent multi-file export/restore snapshot proven.** G4 accepts only the explicitly observed local checks, not universal completeness.
- **Q4:** bounded per-process ledger/Unknown quota saturation, global capacity below sum of quotas permitting starvation, slow inbound request retaining reservation; no guaranteed safe recovery; operator policy/durable-ledger disposition required before G6.
- **Q5:** any applied-but-unconfirmed Fence PUT (including missing/untrusted ETag, failed GET readback, after-apply 5xx/hang) can leave indefinite nonterminal `indeterminate`, keep a quota slot and strand sibling Unknown operations. No automatic recovery/unsafe replay approved.
- **Provider-dependent UNSUPPORTED:** true atomic cross-process `If-Match`, **PUT ETag == GET ETag == actual CAS validator**, ETag change on identical bytes, strong vs weak validators, MKCOL-exists atomicity, real PROPFIND nesting/encoding/duplicates/complete listing, quotas, provider account behavior; HTTPS/TLS transport (currently fails closed), durable/cross-instance idempotency, create-only fence, provenance key lifecycle/rotation/cross-key restore, storage rollback detection, heuristic nature of secret scan. Real provider probes are themselves BLOCKED until separate ACCESS-02.
- **No Zotero PDFs copied to this POC; no actual user documents/credentials or remote account accessed.**

The [risk register](../handoffs/POC-001/POST_G4_RISK_REGISTER.md) is the authoritative A24 register of severities, evidence, owners, remediation/pre-access tests and independent approvals. It does not itself authorize those actions.

## 3. Authority/status matrix after this G4 decision

| Gate/field | Current approved outcome | Not implied |
| --- | --- | --- |
| G0 Design | Approved bounded synthetic POC design, separate from WP-01 | No architecture freeze |
| G1 R04 Execution | Historical R04 limited local/synthetic authority exercised, STOP | **No R05 or real-service execution authority** |
| G2 R04 Evidence handoff | PR #2 final head, allowed paths, evidence verified | No merge |
| G3 QA | **PASS_LOCAL at `22dd9bd30900d9c7ca205a36c675fd47b2569feb`** independently observed | No real-provider PASS |
| **G4 Design acceptance** | **ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS (SYNTHETIC ONLY)**, with explicit P2/Q1e/Q4/Q5 residuals | No G5/G6/G7 |
| G5 PR merge | **NOT AUTHORIZED**; PR #2 remains OPEN/NOT MERGED | Do not merge/rebase main |
| G6 ACCESS-02 | **BLOCKED, NOT AUTHORIZED**; P2-R04-1/2 must be closed under new independent QA before a separate application for ACCESS-02 | Do not touch Nutstore/Zotero or any real WebDAV service |
| G7 Deployment | **NOT AUTHORIZED** | No domain/hosting/staging/production/billing |
| Other WP-01 / frozen UI | WP-01's A21 separate G1 stands on its independent branch/base; Module 002 frozen UI unchanged and U6 not run | No cross-WP code authority |

**Source SHA discipline:** `22dd9bd30900d9c7ca205a36c675fd47b2569feb` is the *G4 accepted POC SHA*, not the SHA of this new governance document on `main`. The latter is only a design-publication marker. No Design commit changes POC code or PR head.

## 4. Pending future decisions (no execution granted here)

**Recommended D007-A25 — Option B (proposal only):** ask user for a fresh, separate **REMEDIATION-05 G1 LOCAL/SYNTHETIC ONLY** authorization, same original branch `exec/POC-001-webdav-feasibility`, original base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, starting from existing G4-accepted exact HEAD `22dd9bd30900d9c7ca205a36c675fd47b2569feb` **if it is still current at A25**, unchanged allowlist and no rebase. Strictly target **P2-R04-1** resource/depth/element/namespace caps + efficient parser and **P2-R04-2** explicit resourcetype-only PROPFIND and honest compatibility docs, with independent resource-bounded QA/negative lock and prefix fixtures, exact-SHA QA and STOP. Suggested candidate limits for deliberation, **NOT fixed here**: depth ≤64, elements ≤10,000, bounded attrs/ns declarations, response/body/time/memory limits; QA should choose safe thresholds after evidence and verify no legitimate fixture breakage. No R05 Execution permitted by A24.

After any independently verified A25/R05 closure, a further separate Design decision must assess **G6 preflight** (TLS host/certificate/path + redirects refused, requests **≤100/rolling 30 min**, files **≤20**, bytes **≤1 MiB/file**, clean isolated `/LMS-POC-001/<run-id>/`, audit-redacted per-file identity-checked cleanup, and Q4/Q5 ledger policy) before anyone may request **POC-001-ACCESS-02**. **Real provider semantics can only be confirmed during a later separately authorized bounded G6 test**, not during this G4/A25 local work.

**Final D007-A24 status: G4 ACCEPTED_EXACT_SHA / LOCAL_STAGE PASS SYNTHETIC ONLY; P2-R04-1/2 OPEN HARD PRE-ACCESS BLOCKERS; OVERALL POC-001 BLOCKED_REAL_SERVICE; NO R05 G1 / G5 / G6 / G7.**
