# POC-001 — DESIGN DISPOSITION 01 / LOCAL REMEDIATION HANDOFF

**Decision:** POC-001-REMEDIATION-01, Design Window disposition on **2026-11-23 (Europe/Berlin)** following independent QA.  
**State:** **LOCAL_STAGE = PARTIAL → REMEDIATION**; **OVERALL POC-001 = BLOCKED (REAL SERVICE NOT RUN)**.  
**Evidence:** [PR #2](https://github.com/zyyu1/literature-management-system/pull/2) remains **OPEN / NOT MERGED**; [independent QA report comment 7088088675](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7088088675) reviewed **exact head `65e14afc81e6de37ba5fac90c2937a27876c5614`**.  
**Original explicitly user-authorized execution scope:** [POC-001-SCOPE-01 Option B](EXECUTION_INSTRUCTION.md), bounded local/synthetic tests only, authorized branch `exec/POC-001-webdav-feasibility`, path allowlist `poc/001/**` plus execution QA handoff `docs/handoffs/POC-001/QA_HANDOFF.md`.  
**Current Design main reference at disposition:** `21dc23cb3f4ed11b2976e51da298b2b4861d25c3`. Design-only commits since original execution base do **not** expand implementation scope.  
**Authority:** This is a **narrow remediation instruction WITHIN the user's prior local/synthetic code-start authorization**, not a new feature, access approval or waiver of QA. **No production/live HTTPS/Nutstore connectivity is authorized.**

## 1. QA finding acceptance and current verdict

Independent QA reports 33/33 local tests passing on each of **five independently executed runs** (2/4/3/1/3/17/3 for POC-01..07), 6/6 synthetic mutations detected, 0 heuristic secret scan findings and 38 changed files inside the original POC paths. **This is not a PASS**: extra QA probes reproduced four P1 and multiple P2 issues not covered by Execution's mock tests.

| Area | Design disposition | Reason |
| --- | --- | --- |
| POC-01 CRUD | **PASS_LOCAL observed**, subject to unchanged-scope regression | No real provider claims |
| POC-02 API boundary | **PASS_LOCAL observed with latent gate defects** | P1-4 plaintext transport hazard; P2-5 prototype kind bypass |
| POC-03 JSON/Markdown | **PASS_LOCAL observed** | Fixture-only roundtrip |
| POC-04 independent clients | **PASS_LOCAL observed** | Explicit refresh, mock only |
| POC-05 conditional writer race | **PASS_LOCAL logic only**, **P1-3 remediation mandatory** | Mock CAS does not prove Nutstore `If-Match` |
| POC-06 faults / Unknown / verification | **PARTIAL, NOT ACCEPTED** | P1-1 late commit misclassified; P1-2 duplicate same-operation forwarding |
| POC-07 export/restore | **PASS_LOCAL fixture scenario only, integrity defects need remediation** | P2-6/7/9 can misrepresent completeness or safety |
| Overall POC-001 | **BLOCKED_REAL_SERVICE** | ACCESS-02 unapproved; no real Nutstore tests or production suitability evidence |

**No P0 observed** is an observation within this test set, not a guarantee that there are no P0 risks. No merging, deployment, production data, actual credentials, user Zotero/PDF exports, real WebDAV requests or QA PASS claims.

## 2. Remediation authorization and exact fix priority

The Execution Window may **resume only the already authorized local/synthetic POC on the SAME branch and SAME allowlisted paths**, applying the defect corrections below and synthetic-only regression tests. No new external runtime/dependency, cloud account, Zotero integration, main-branch code, WebDAV provider connection or application UI.

### MUST FIX BEFORE RE-QA LOCAL STAGE

| Finding | Required code-level behavior | Required reproducible regression |
| --- | --- | --- |
| **P1-1** delayed late commit | After timeout, unchanged ETag/base **cannot prove `not_committed`** while original upstream request may still commit. Maintain `unknown`/`not_yet_observed` until safe fencing/authoritative operation evidence proves finality. Never cache and replay an irreversible false-negative; a later confirmed commit must not contradict a stored terminal verdict | Delayed mock PUT held beyond API timeout, verify before release, then release late commit, re-verify and same-operation replay. Must show no final false negative and no unsafe blind retry |
| **P1-2** same-operation ledger TOCTOU | Reserve scoped `operationId` **synchronously before first await** (or equivalently atomic) and protect pending registration and payload/target/revision fingerprint. Concurrent same-key requests must not create duplicate upstream PUTs **within the same API instance**; same key+different payload returns explicit error; replays agree with actual confirmed result. Avoid permanent pending on exceptions | Two requests with identical op ID and overlapping request-body arrival; count upstream PUTs; same key/different payload; exception after reservation |
| **P1-3** unsafe `If-Match` pass-through | Accept exactly one **strong** entity-tag (safe quoted form and bounded length). Reject lists, wildcard, weak `W/` tags, combined `*, "x"`, CR/LF and malformed values **before upstream forwarding**. Keep create-if-absent `If-None-Match: *` distinct and mutually exclusive | Verify malformed/header list/weak/wildcard variants never reach WebDAV and stale valid ETag gets 412 under mock CAS |
| **P1-4** HTTPS-as-HTTP credential leak | **For current local-only branch**, fail closed for `https:` base URLs until an actually correct `node:https` path is separately reviewed; must not dispatch `Basic` credentials using `node:http` for an HTTPS URL. Rejection-only fix is **not permission to enable real HTTPS remote use** | Local HTTP listener captures zero HTTP requests/Authorization when configured with fake `https://127.0.0.1:<http-port>`; HTTPS rejected before network call |

### Mandatory integrity/safety hygiene in the same local pass

| Finding | Correction or safe explicit evidence |
| --- | --- |
| **P2-5** prototype keys | Use own-property/Set/Map whitelist at **every** kind lookup including `verify` and `restore`; reject `constructor`, `__proto__`, `toString` and malformed kinds before upstream GET/PUT |
| **P2-6** restore envelope validation | Verify actual decoded record envelope/schema/type/id and parent scope match declared manifest path, bytes hash and expected record; do not call self-hashed arbitrary JSON a verified restore. Keep restoration isolated and conditional; archive *authenticity* is not proven by hash alone |
| **P2-7** silent export omission | Unknown/malformed namespace entries must cause clear `export_incomplete`/non-certified status (or explicit separately reviewed exclusions), never `200 ok` for a silently incomplete snapshot |
| **P2-8** ledger errors and scope | Ensure exceptions do not strand entries as permanently `pending`; prevent another independent API token/principal from verifying or replaying a different client's operation. Bound ephemeral in-memory state or fail closed if retention exceeded, and clearly disclose that process restart / multiple API instances **do not provide durable or global idempotency** |
| **P2-9** restore target freshness race | Deterministically reject concurrent restoration into same target or preserve explicit incomplete/conflict state without a false “restored” result. Verify the actual safety of target acquisition rather than assuming `PROPFIND` then `MKCOL` is atomic |
| **P2-10** test self-proof | Extend mock to permit delayed *apply after timeout*, same-op concurrent submissions, strong/weak/list ETag variants, `committed_unverified`, verify after restart, corrupt read, invalid prototype keys and export incomplete; preserve meaningful negative mutation tests |
| **P2-11** loose validators | Reject unexpected fields and non-string identifiers before regex/type coercion; add negative tests. No silent widening of private API data model |
| **P2-12** uncertain transport classification | Review early `EHOSTUNREACH`/`ENETUNREACH` classification if any request bytes could have been sent. If definitively not-sent cannot be proven, report **UNKNOWN** rather than a final failure; document and test the safe boundary |

Any of the above that cannot be safely solved **within** existing mock/POC constraints must be explicitly marked **BLOCKED/UNSUPPORTED**, with a new Design review, **not** auto-resolved using new storage, external hosting or expanded scope. Re-QA cannot give full LOCAL PASS while a local-stage integrity or authorization blocker remains.

**Multi-instance caveat:** A per-process `Map` reservation **cannot** guarantee that the same `operationId` is sent only once across two independent API processes. The local POC may truthfully demonstrate same-instance reservation and safe conditional writes at a mock, while documenting the **unproven cross-process durable ledger**; it must **not** claim global exactly-once semantics, cross-restart durable recovery, real provider CAS or safe production restore.

## 3. Evidence/description corrections required

- Replace or qualify Execution claims “+5 repeat runs” (only one was committed as original execution evidence; QA independently did five), “replay never re-sends”, “verify verdicts correct” and “all pass” with results **specific to the new mock and tested scenarios**.
- Strip local absolute workspace path from `poc/001/evidence/deps-tree.txt` or deliberately label it unsanitized and exclude it from claimed portable artifacts. Do not include user paths/secrets in new evidence.
- Make source-scope/secret-scan baseline explicitly `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, not a floating `origin/main`; update the PR description's stale main SHA with a fresh observed value when reporting (do not guess its future state).
- Preserve original QA comment and previous Execution evidence in Git history; add **new** code/evidence SHA and new QA handoff describing changed paths, test commands, actual exit codes and corrected claim boundaries.
- Avoid reusing `65e14af` as the target SHA after remediation. A new exact PR head requires **independent full re-QA**, not a delta-only acknowledgement.

## 4. Base-drift disposition: do NOT rebase now

**Decision:** **KEEP** authorized base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4` for this remediation and preserve same branch `exec/POC-001-webdav-feasibility`. No automatic rebase/merge of `main` while implementing or re-reviewing local tests. The current `main` at this decision is `21dc23cb3f4ed11b2976e51da298b2b4861d25c3`; its new D007-A4/A5/A6 documentation is **design-only** and should not be silently imported as implementation requirements into the already bounded POC. Previous QA compared docs changes through `6f7d68b`, not all later `main` commits. Do **not** assert the final merge is conflict-free on current HEAD without a fresh merge-tree/compare.

If a future **separate** Design decision authorizes merging PR #2, first reconcile up-to-date `main` and verify mergeability. If changing PR head via rebase/merge is required, repeat changed-path allowlist/secret checks and **independent exact-SHA QA** on the resulting new commit. Do not merge PR #2 or close the open QA review now.

## 5. Independent re-QA acceptance and explicit STOP

Execution's next handoff must include:
1. New exact branch/PR SHA, parent, original base, no-rebase proof and scope diff, changed files limited to `poc/001/**` and `docs/handoffs/POC-001/QA_HANDOFF.md` only.
2. `node --check`, POC-01..07 and full-suite tests including new targeted QA probes, **five real repeated runs if claiming five**, mutation/security checks and dependency/licensing review, with actual exits. Record corrected evidence and no user/private cloud data.
3. Local mock-only typed outcome matrix, before/after findings disposition **P1-1..P1-4 and P2-5..P2-12**, explicit unresolved issues, no credential or real-provider logs.
4. A documented STOP and independent QA review at **new exact PR HEAD**; QA reproduces prior Probe A–G and new regressions. QA must report **LOCAL_STAGE PASS/PARTIAL/FAIL**, per-area PASS_LOCAL/PARTIAL/BLOCKED, P0/P1/P2 residuals, plus **OVERALL POC-001 BLOCKED (REAL SERVICE NOT RUN)**.
5. Design subsequently **separately** accepts or requests further remediation. A QA PASS does **not** authorize merge or POC-001-ACCESS-02.

## 6. ACCESS-02 prerequisites remain outside this remediation authorization

The security policy still requires, after independent local-stage QA: a real verified **HTTPS** transport with certificate validation and pinned approved host/port; redirect refusal; a strict **100 requests/rolling 30 min, 20 files, 1 MiB/file** budget, halt-on-401/429; per-run `/LMS-POC-001/<run-id>/` isolation, controlled per-file allowlisted cleanup, redacted audit logs, remote provider `If-Match`/ETag probe plan, and an explicitly bounded or durable ledger strategy. These are **future scoped preflight criteria**, **not new permission for live requests**. User must separately approve **POC-001-ACCESS-02** and safe disposable account configuration. Do not request/use/share real credentials now.

**DISPOSITION:** **REMEDIATION AUTHORIZED WITHIN EXISTING LOCAL POC SCOPE; BRANCH UNCHANGED; NO REBASE; RE-QA REQUIRED; NO MERGE; NO LIVE NUTSTORE; NO APP IMPLEMENTATION.**
