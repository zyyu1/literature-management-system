# POC-001 REMEDIATION-07 — independent R06 + R07 G3 QA plan (D007-A27; NOT RUN)

**Authority:** User approved D007-A27 Option B; R07 is a narrowly scoped test-only G1. **This document is a test plan, not a QA pass.** Must separately review R06 catch-path QM1 and R07 sibling-return coverage on the final R07 exact 40-character SHA; previous QA sub-agent [#7120465999](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7120465999) is **LIMITED-independence technical evidence only**, not formally accepted as independent G3. [A27 Design](../../architecture/D007_A27_POC001_R07_TEST_ONLY_AUTHORIZATION.md) · [R07 execution](REMEDIATION_07.md) · [A26 R06 QA](REMEDIATION_06_QA_PLAN.md) · [risk register](POST_G4_RISK_REGISTER.md).

## Independence / immutable preflight

- QA must be a **separately opened QA window/session**, not a sub-agent launched by Execution within the Execution session, not a reuse of Execution or earlier QA workspaces/probes. If independent session unavailable: **STOP / G3_INDEPENDENCE_PENDING**, no false designation of G3.
- Fresh-clone PR #2 final R07 HEAD after Execution reports it. The exact R07 final SHA is **UNKNOWN/NOT_RUN at this plan's issuance**; never assume it equals R06 start.
- Original branch `exec/POC-001-webdav-feasibility`, immutable base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, R07 mandatory starting ancestor `5ab47090f1100fbe0c9defd39930fcf715dbab38`. Confirm PR OPEN/unmerged, final remote SHA, clean detached checkout, original merge-base, R07 start ancestor, 0 merge commits, no rebase/main merge/force push.
- Independently compare cumulative changed paths against original `poc/001/**` + `docs/handoffs/POC-001/QA_HANDOFF.md`, R07 incremental against A27 strict allowlist, and every `poc/001/src/**` blob between R07 start and final HEAD. Any production source difference is **FAIL/STOP**.
- QA may create **outside-repo** disposable loopback fixtures, proxy and mutants. GitHub write is **only** its independent PR #2 QA comment; do not commit, push, merge, resolve reviews or change code.

## Required test matrix

| Case | Independent probe | PASS criterion |
| --- | --- | --- |
| R07-FH-01 | Parsed valid XML 207 with foreign href outside adapter base, root and kind | 503 `export_incomplete`, no bundle, no GET/writes, unchanged storage, **one explicit 114-byte PROPFIND per failing path** |
| R07-STATUS-02 | Parsed 207 with non-2xx response entry, root and kind | Same fail-closed and request-level proof; fixture must reach post-parse non-2xx branch |
| R07-DUP-03 | Parsed 207 with duplicate normalized href, root and kind | Same, including normalization/trailing-slash ambiguity |
| R07-BODY-04 | Inspect QA-owned recording proxy and actual request log after setup writes | Exact resourcetype-only XML, length=114, CL=114, CT=`application/xml; charset=utf-8`, correct Depth, no second bodyless/allprop/Depth-0 retry |
| R07-MUT-01 | QA-owned mutation of each of the three sibling malformed returns, in disposable source copy | Repository **R07** suite kills **all three** solely because of extra request count/body, not crash/setup |
| R07-MUT-02 | Re-run repo driver; verify three new meaningful per-branch mutants and M1–M48 still effective | Every actual mutant killed with 0 survivor, setup error or wrong-reason pass; report actual counts |
| R06-REVERIFY | Reproduce R06 QM1 catch path with independent QA-owned explicit-allprop/bodyless/unawaited/Depth-0 variants, 207 malformed and non-207/valid controls | Repository R06 tests kill all relevant retry variants with expected request-count/body failure, no regression |
| R07-SRC-01 | SHA, ancestry, path, source-byte audit | All eight `src/**` blobs unchanged vs R07 start, no forbidden file change, no rebase |
| R07-REGRESSION | Run POC01–07, R01–R07, full suite x5 if claiming 5, check, mutation, secret scan, npm ls | No new P0/P1, actual counts/exits, 0 secret finding, 0 new dependencies |
| R07-CAP-01 | Review unchanged R06 README/handoff and capacity results (if probed anew, identify parser vs export) | `MAX_ELEMENTS=10000` and fixture `8+6*N`, 1665/1666 disclosed precisely; **P2-R05-2 stays pending** |

Each negative listing: root and kind paths separately; make the target condition prove the **post-parse return branch** (not parser catch); total PROPFIND may include successful prior path(s), but the failing **path exactly once**. Verify 503/no partial bundle, 0 GET, 0 upstream write and unchanged data (files, collections, locks, ETags); positive control 207 works normally. Use own QA-created synthetic WebDAV double or recording proxy; avoid relying only on repo's own mock/test results. Temporary QA mutations must never be committed or propagated.

**INFO review:** F-2 locks=true fixture stops at root, F-3 M48 regex string-matching, F-4 README 9b numbering. Verify these are informational unless independently upgraded; **do not expand authorized R07 scope** or silently repair them.

**Regression provenance:** inspect R06+R07 evidence and actual gitHead; distinguish runner's hard-coded R05 label from separate run IDs; avoid reusing old 149/149x5, 48/48 or prior QA 56/56 as fresh results. Check Node/env, source trees, secret-scan on original base, sanitized privacy, no real/provider data, local 127.0.0.1 only. Explicitly mark resource campaign, full capacity exports and real tests NOT_RUN if not rerun.

## Verdict and stop

Report **R07/R06 LOCAL_STAGE PASS / PARTIAL / FAIL** on the **exact final R07 SHA**, and **OVERALL POC-001: BLOCKED_REAL_SERVICE**. Only if ALL R06+R07 mandatory local criteria and independent-session condition pass, recommend **PASS_LOCAL_CANDIDATE_FOR_D007_A28**. If QM1 or sibling mutants survive, source/paths change, or independence fails, report PARTIAL/FAIL or `G3_INDEPENDENCE_PENDING`, retaining all open risks. QA cannot close P2-R04-2, P2-R05-1, P2-R06-1 or P2-R05-2, authorize G4/G5/G6/G7 or real access.

Post the independent QA report as a PR #2 Conversation comment with identity, exact SHA, paths/blobs, independent request and mutant evidence, actual suite counts and NOT_RUN. **QA STOP**. Only Design after the new QA may propose **D007-A28 G4 exact-SHA adjudication**.

**G5 merge, G6 ACCESS-02, G7 deploy and real provider tests remain NOT AUTHORIZED.**
