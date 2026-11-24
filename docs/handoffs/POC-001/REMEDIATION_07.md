# POC-001 REMEDIATION-07 — D007-A27 Option B, strict adjacent-207 TEST-ONLY

**G1 status: AUTHORIZED by user (D007-A27 Option B, 2026-11-24 Europe/Berlin).** Scope: three sibling malformed HTTP 207 return branches in `propfind()`: foreign href, non-2xx response entry, duplicate normalized href. Correct current runtime behavior; fix missing regression/mutation adequacy only. **No production source or runtime changes.**

## Authority and immutable identity

Read Design [D007-A27](../../architecture/D007_A27_POC001_R07_TEST_ONLY_AUTHORIZATION.md), [R07 independent QA plan](REMEDIATION_07_QA_PLAN.md), [R06 QA plan](REMEDIATION_06_QA_PLAN.md), [risk register](POST_G4_RISK_REGISTER.md), [ACCESS_POLICY](ACCESS_POLICY.md), [Execution R06 #7119832091](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7119832091) and [limited QA #7120465999](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7120465999). Read Design docs directly from pinned main D007-A27 commit (do not merge main into execution branch).

- Repository: `zyyu1/literature-management-system`; PR #2 must stay OPEN/NOT MERGED.
- Existing execution branch: `exec/POC-001-webdav-feasibility`.
- Immutable original base: `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`.
- Mandatory exact R07 start PR HEAD: `5ab47090f1100fbe0c9defd39930fcf715dbab38`.
- Preserve original cumulative allowed paths `poc/001/**`, `docs/handoffs/POC-001/QA_HANDOFF.md`; R07 incremental whitelist below is **much narrower**.
- Preflight fresh clean worktree, remote branch equals PR HEAD equals exact start, original merge-base unchanged and no merge commits. If not, **STOP**. No rebase, main merge/cherry-pick, force-push, PR base change.

## R07 incremental write list (exact)

```text
poc/001/test/r07-regressions.test.mjs
poc/001/test/r06-regressions.test.mjs          # only if narrowly necessary; prefer new R07 file
poc/001/scripts/mutation-check.mjs
poc/001/evidence/**                         # sanitized R07 evidence only
docs/handoffs/POC-001/QA_HANDOFF.md
```

No other file may be changed, including `poc/001/src/**`, `poc/001/src/mock-webdav.mjs`, README, other tests/scripts, package/lockfiles, frozen UI, Design/governance/ACCESS policy, original execution instructions, app/root/CI. No new dependencies, deployment, or real provider access.

## Required R07 regression proof

Use only in-repository synthetic loopback mock capabilities (e.g. `propfindOverride`) **without editing mock source**. Construct well-formed and parseable 207 multistatus responses that reach **each distinct post-parse malformed branch** rather than the parsing `catch`:

1. **R07-FH-01 foreign href:** a listed response contains an href outside adapter base.
2. **R07-STATUS-02 non-2xx entry:** a response entry is valid XML but not accepted (non-2xx) by adapter.
3. **R07-DUP-03 duplicate href:** two response entries normalize to the same href (including a trailing slash variant where appropriate).

Exercise root and kind listing for each, and at least one valid positive 207 control. For each negative fixture, after setup writes, capture actual mock requestLog and an immutable storage snapshot. Demand:

- `503 export_incomplete`, **no bundle**; 0 record GET, 0 PUT/MKCOL/DELETE, unchanged files/collections/locks/ETags.
- **Exactly ONE PROPFIND for the failing listing path** (total export may include prior successful path requests); verify exact expected PROPFIND path sequence.
- Every PROPFIND body **exactly equals** `PROPFIND_RESOURCETYPE_BODY` (114 bytes), proper `Content-Length: 114`, `Content-Type: application/xml; charset=utf-8`, expected `Depth`; no second bodyless/`allprop` request or other unauthorized fallback.
- The fixture really exercises its intended post-parse branch, not a generic XML parsing failure or a transport/non-207 error. Include adapter-level controls where needed to establish that.
- Existing R06 malformed catch-path QM1 protection and all R01–R06 regressions must remain effective.

## Mutation adequacy

In `poc/001/scripts/mutation-check.mjs` add **three new, distinct mutants** (illustratively M49, M50, M51), one each for foreign href, non-2xx entry and duplicate href. Each must uniquely patch only a **temporary copy** of `src/webdav-adapter.mjs`, adding an additional bodyless `request('PROPFIND', path, { headers: { Depth: depth } })` just before its specific malformed return while **preserving that return**. Do not alter real source. Have new R07 tests kill all three because the extra request changes expected count/body; detect and reject mutation setup errors, survivors, unrelated failures, and ambiguous source-match patterns. Preserve M1–M48 and the old R06 M48 assertion. Counts shown in reports must be real observed counts, not predicted.

## Execution and integrity

Record Node, OS, npm versions and no dependencies. Run `node scripts/check.mjs`; individual POC01–07, R01–R07; new R07 tests; full suite in **five separate runs** if claiming 5x stability; `node scripts/mutation-check.mjs` with actual mutant totals; `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; `npm ls --all`; and appropriate resource probes (NOT_RUN if not run). Preserve evidence with exact gitHead provenance and per-command exits; do not reuse old counts as new.

Check `git diff --name-only 1c084e5f14e4af8018ef5fe99710be7205cfbdf4 HEAD` against original cumulative allowlist and `git diff --name-only 5ab47090f1100fbe0c9defd39930fcf715dbab38 HEAD` against R07 strict list. Independently compare **all eight** `poc/001/src/**` blob SHAs against start SHA; **all identical**. No source/runtime/CI/deps/README changes. Scan all output for private paths, credentials, real PDF/library content. External test traffic only to `127.0.0.1`; only GitHub for normal fetch/push/comment.

Publish only allowlisted changes on original PR #2 branch by fast-forward; update existing `QA_HANDOFF.md` with run-specific evidence, actual changed paths/parent/base, and the true final **40-character** PR HEAD (if handoff updates the HEAD, verify the final after that). Post one clear R07 Execution report on PR #2 with exact SHA, proofs, remaining risks and **EXECUTION STOP**. No self-certified QA/G4 closure.

**Not authorized:** G5 merge, G6/ACCESS-02, real Nutstore/Zotero/WebDAV/TLS, G7 deploy, WP-01, frozen UI, code/CI, rebase/main merge/force push.

**Next:** a **separately opened independent QA session/window**, not an Execution-started sub-agent, reviews R06+R07 on **new exact final SHA** using its own probes/mutants and posts an independent report. Only then D007-A28 Design G4 may be proposed; no automatic next gate.
