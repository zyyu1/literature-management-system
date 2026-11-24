# POC-001 — Execution → QA Handoff · REMEDIATION-08 / D007-A30 Option A (LOCAL / SYNTHETIC ONLY)

**From:** Execution Window · 2026-11-24 (Europe/Berlin)

**Authority** (read at the pinned Design commit `e3b65fa630cda6407ec21274b177ad228ea2b651`):
- [D007-A30](https://github.com/zyyu1/literature-management-system/blob/e3b65fa630cda6407ec21274b177ad228ea2b651/docs/architecture/D007_A30_R08_LOCAL_READINESS_G1_AUTHORIZATION.md)
- [REMEDIATION_08.md](https://github.com/zyyu1/literature-management-system/blob/e3b65fa630cda6407ec21274b177ad228ea2b651/docs/handoffs/POC-001/REMEDIATION_08.md)
- [R08 independent QA plan](https://github.com/zyyu1/literature-management-system/blob/e3b65fa630cda6407ec21274b177ad228ea2b651/docs/handoffs/POC-001/REMEDIATION_08_QA_PLAN.md)
- [ACCESS-02 precheck matrix](https://github.com/zyyu1/literature-management-system/blob/e3b65fa630cda6407ec21274b177ad228ea2b651/docs/handoffs/POC-001/ACCESS02_PRECHECK_MATRIX.md)
- [ACCESS policy](https://github.com/zyyu1/literature-management-system/blob/e3b65fa630cda6407ec21274b177ad228ea2b651/docs/handoffs/POC-001/ACCESS_POLICY.md)

**Scope:** R08 local security readiness:
- loopback-only strict HTTPS test mode;
- SSRF and path denial;
- Q4 admission and absolute body deadline;
- Q5 non-terminal regression;
- export capacity at N = 1665/1666;
- a test-only ACCESS-01 budget dry run.

**Boundary:** every socket is 127.0.0.1 (plus an untouched 127.0.0.2 trap). All data and credentials are synthetic; TLS material is ephemeral and kept in memory only. **No real Nutstore, Zotero, external WebDAV, real TLS endpoint, DNS to an external host, credentials, PDFs or library records. This is not ACCESS-02.**

**Status:** Execution evidence only. **No G3 or G4 claim, and no risk closure.**
- A28 `G4 ACCEPTED_EXACT_SHA LOCAL_SYNTHETIC@ace7b1e610529c1f139dc06371d9f531ccf0e28b` stays historical and does **not** cover this SHA.
- Risk states are unchanged until D007-A31:
  - P2-R05-2: `CAPACITY_POLICY_PENDING`
  - Q1e: `UNSUPPORTED_COMPLETENESS`
  - Q4/Q5: `RESIDUAL_POLICY_REQUIRED / LOCAL_PROOF_PENDING`
  - TLS/SSRF: `LOCAL_PROOF_PENDING`
- **G5 NOT_AUTHORIZED · G6 ACCESS-02 BLOCKED · G7 NOT_AUTHORIZED · OVERALL `BLOCKED_REAL_SERVICE`.**

**History:** the previous handoff is [QA_HANDOFF.md @ ace7b1e](https://github.com/zyyu1/literature-management-system/blob/ace7b1e610529c1f139dc06371d9f531ccf0e28b/docs/handoffs/POC-001/QA_HANDOFF.md); earlier versions are linked from there. The A28 G3 basis is [#7121490151](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7121490151).

## 1. Provenance

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (existing; PR #2 OPEN, not merged) |
| Original base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. `git merge-base HEAD 1c084e5…` returns `1c084e5…` |
| R08 start (preflight) | `ace7b1e610529c1f139dc06371d9f531ccf0e28b`. Local, remote and PR head were all equal to it, the tree was clean and there were 0 merge commits before any edit |
| Lineage | `ace7b1e → 9128c61 (R08 code) → c95fe06 (fix: legacy M10 effective again) → (this evidence + docs commit)`. Fast-forward only. **No rebase, no merge of `main`, no force-push, no Design docs cherry-picked** |
| Code commits | `9128c611c16e34a5638bceb4bfcd487703620bb1`, `c95fe067a1b95c928e52fca5cf31665dc9b94acf` |
| Evidence | Generated on a **clean tree at `c95fe06`** (`evidence/R08-results.json`: `gitHead=c95fe06…`, `gitDirtyPaths=(clean)`) |
| **Final PR head** | The commit adding this file. **Its true 40-char SHA is in the PR #2 Execution report comment.** |
| Runtime | Node **v22.23.5**, Linux x64, **2 vCPU** Intel Xeon @ 2.10 GHz. OpenSSL CLI 3.0.13 (fixture generation only); Node's bundled OpenSSL is 3.5.9 |
| Dependencies | **None added.** `npm ls --all` → `(empty)`; package files unchanged |

**Incremental paths from `ace7b1e`** (all on the A30 whitelist):
- `poc/001/src/{webdav-adapter,util,safe-api}.mjs`
- `poc/001/test/r08-readiness.test.mjs` (new)
- `poc/001/test/r08-local-tls-fixtures.mjs` (new)
- `poc/001/scripts/mutation-check.mjs`
- `poc/001/README.md`
- `poc/001/evidence/R08-*` (new files only; the historical evidence is untouched)
- this file

The cumulative paths from `1c084e5` stay within `poc/001/**` plus this file.

**Source blobs, `ace7b1e` → `c95fe06`:**

| Status | Files |
|---|---|
| Unchanged | `api-main` `1498d4901a1b`, `client` `fa9b98d170b0`, `dav-xml` `3d182adf4e46`, `mock-webdav` `1d44839d9e6f`, `note-codec` `6f91c2c5a650` |
| Changed (allowed) | `safe-api` `96400cc81d7f → ef4d0528404f`, `util` `1f583c1f6065 → 7762e4b51cab`, `webdav-adapter` `1adfe97c82cd → fd6325a7ddb0` |

**Pre-R08 tests changed: 0.** `run-evidence.mjs`, `secret-scan.mjs`, `check.mjs` and `resource-probe*.mjs` are unchanged. They are not on the whitelist, so the R08 evidence was produced by a runner kept outside the repo, with the same sanitisation.

## 2. Results at `c95fe06` (Execution run; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node scripts/check.mjs` | 0 | 32 files, 0 failures |
| POC-01…07 (each file) | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| R01…R07 (each file) | 0 each | 21 / 21 / 26 / 17 / 20 / 11 / 4 (**153 historical tests, unedited**) |
| **R08** `node --test test/r08-readiness.test.mjs` | 0 | **38 / 38** |
| `node --test "test/*.test.mjs"` × **5 separate runs** | 0 ×5 | **191 / 191** each |
| `node scripts/mutation-check.mjs` | 0 | **74 / 74 killed** (M1–M51 legacy + M52–M74 R08). All 27 `expect` mutants (M48–M74) were killed on their named assertion |
| `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings (heuristic) |
| `npm ls --all` | 0 | `(empty)` |

**Transparency note on M10.** The first mutation run at `9128c61` had **M10 surviving** (`evidence/R08-mutation-first-run-9128c61.txt`). Its pattern `if (base.protocol === 'https:') {` had moved from the R01 fail-closed guard onto the new TLS block. `c95fe06` restores the original guard line and moves the TLS configuration inside it, so M10 is again killed by `R01 P1-4`. No behaviour changed, and no legacy mutant definition was edited.

**One equivalent mutant is documented and not counted:** "adapter ignores a refused write admission". The refusal STOPs the budget, so the next request admission refuses with the same code before dispatch.

## 3. What changed and the evidence per QA case

### R08-TLS-01 — local HTTPS works

**How it works:** `createWebDavAdapter({ baseUrl: 'https://127.0.0.1:<port>/…', localTls: { ca } })`.
- Only the given test CA is trusted.
- `rejectUnauthorized: true` and `checkServerIdentity` are set explicitly; minimum TLS 1.2.

**Evidence:**
- Save, read-back, export (4 explicit 114-byte PROPFINDs) and restore all work through a TLS front with an IP SAN, and also by name (`localhost` with a DNS SAN).
- Plain-HTTP loopback works as before, and https without `localTls` still fails with `HTTPS_TRANSPORT_NOT_IMPLEMENTED`.

### R08-TLS-02 — invalid peers fail closed

Five invalid peers were tested: wrong CA, self-signed, expired (2020), SAN mismatch, and a valid certificate while the client trusts a different CA.

| Check | Result |
|---|---|
| Refusal code | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` / `DEPTH_ZERO_SELF_SIGNED_CERT` / `CERT_HAS_EXPIRED` / `ERR_TLS_CERT_ALTNAME_INVALID` |
| TCP connections at the front | 3 (a handshake is attempted) |
| Completed handshakes | 0 |
| **Decrypted application bytes** | **0** — no request line, no `Authorization` |
| Backend requests | **0** |
| Write classification | `not_sent`; the API answers a definite `503 not_saved`, never Unknown |

Other refusals:
- **Insecure overrides:** `rejectUnauthorized`, `checkServerIdentity`, `secureOptions`, a missing or invalid CA, and `localTls` on an `http:` URL are all refused at construction.
- **Environment variable:** `NODE_TLS_REJECT_UNAUTHORIZED=0`, tested in a separate process, cannot weaken verification.
- **Redirects:** a 307 to `http:` (downgrade), to another host, or to another path is never followed; exactly one request is made per call.
- **Non-loopback hosts:** TLS mode never unlocks one (`REAL_SERVICE_BLOCKED`).

### R08-NET-03 — non-loopback and dangerous targets refused

**Refused at construction, with no socket opened:**
- private, public and link-local IPv4/IPv6 addresses, arbitrary host names, `0.0.0.0`, `127.0.0.2`, `::ffff:127.0.0.1`;
- obfuscated hosts (`127.1`, `0x7f.0.0.1`, `2130706433`);
- an implicit or zero port, or `:080`;
- URL userinfo;
- `ftp:` and `file:`.

**Resolution check:**
- A name is resolved and **every** returned address must be `127.0.0.1` or `::1`.
- Injected resolver answers of `127.0.0.2`, `0.0.0.0`, a mixed list and `::ffff:127.0.0.1` were each tested in both synchronous and asynchronous form. All are refused with `REAL_SERVICE_BLOCKED` and classified `not_sent`, and the 127.0.0.2 trap receives 0 connections.

**Source fix (found by this test):** a socket destroyed before the `socket` event, such as after a synchronous resolver refusal, used to be counted as connected (`unknown`). It is now `not_sent` (mutant M74).

### R08-PATH-04 — canonical paths only

- Request paths must be plain segments. `..`, `.`, `//`, `%2e`, `%252e`, `%2F`, `\`, `?`, `#`, whitespace, NUL, a hidden leading `.`, a relative path and `/` are all refused before any request (0 server requests).
- Base paths with the same defects are refused at construction.
- At the API, encoded traversal, cross-kind paths and cross-namespace restore targets get 400/404 with 0 writes and storage unchanged. Valid note paths still work.

### R08-Q4-05 — body deadline and admission

**Fixture:** 2 principals, `maxPerPrincipal = 2`, `maxLedgerEntries = 4`, `bodyDeadlineMs = 1000`, `MAX_BODY` 1 000 000.

| Case | Result |
|---|---|
| Stalled body | **408** `body_deadline_exceeded` at ~1003 ms, 0 PUT |
| Late chunks sent after the deadline | Never read, 0 PUT, nothing stored; the reservation is released and both slots are reusable |
| 4 stalled bodies across the 2 principals | Third write refused `principal_ledger_full` for each principal; all four released by the deadline |
| Aborted upload | Released, 0 PUT |
| Upstream stall past the body deadline after dispatch | Stays **504 Unknown**, still holds its slot; the same opId is never re-dispatched |
| Body over 1 MB | 413, released |
| Reuse while pending | 409 `operation_in_progress` |
| Fingerprint mismatch | 422 |
| Upstream 429 | 503 `rate_limited`, exactly 1 PUT |

The deadline is unset by default, which keeps the pre-R08 behaviour. The values above are fixture values, not production defaults.

### R08-Q5-06 — Unknown stays non-terminal (no source change)

| Case | Result |
|---|---|
| Applied-but-unacknowledged fence (`commit-then-drop`) | `fence_not_confirmed`, ledger still `unknown`, exactly 1 fence PUT. Verify then gives `indeterminate`; a second fence call makes no PUT |
| Missing, weak or bogus fence ETag; failed GET read-back | `fence_not_confirmed` (`no_etag` / `untrusted_etag` / `readback_etag_mismatch` / `readback_error`); Unknown kept; 1 PUT |
| Restart | Verify is non-terminal; fence returns 404; an applied write observed after restart is `committed` but `terminal: false`; no replay |
| Quota pressure | Two Unknowns hold both slots; new work gets `principal_ledger_full`; the Unknowns are not evicted |
| Sibling write | CAS decides; the Unknown becomes `indeterminate`, is not terminal, and no fence PUT is made |

### R08-CAP-07 — export capacity (minimal synthetic fixture)

| N | Listing elements (independent count) | Listing bytes | Export | PROPFIND / GET / writes | Export time | Response bytes |
|---:|---:|---:|---|---|---:|---:|
| 1665 | **9 998** | 299 981 | **200**, count 1665 | 4 / 1665 / 0 | 1072 ms | 1 079 657 |
| 1666 | **10 004** | 300 161 | **503** `export_incomplete` at `/poc-ns-r08/progress` (resource limit); no bundle | 4 / **0** / **0** | 29 ms | 149 |

- Every PROPFIND is the explicit 114-byte request, and the store is unchanged.
- Peak test-process RSS was about 150 MB (one process for the whole suite).
- **This is not a universal, provider or library limit, and nothing promises paging.** P2-R05-2 stays pending.

### R08-BUD-08 — budget dry run (test-only)

**Arithmetic**, using `createRequestBudget()` with ACCESS-01 values:
- 100 requests per rolling 30 minutes, inclusive.
- 21 slots reserved for cleanup. Ordinary request 80 is refused with `BUDGET_CLEANUP_RESERVE` (STOP); cleanup then uses requests 80–100; request 101 is refused with `BUDGET_REQUESTS`.
- The window is pinned at 29:59.999 versus 30:00.
- 20 files × 1 MiB is allowed; file 21, 1 MiB + 1 byte, and more than 20 MiB across rewrites are refused.
- 2 writers are allowed; a third is refused.
- 401 or 429 STOPs the run, including cleanup.

**End-to-end against the mock** (adapter admission checked before dispatch):
- 2 writers wrote 20 files (4 MKCOL + 20 × (PUT + read-back)); then an export.
- Ordinary work stopped at request 80, which never reached the server, and new files were refused after the STOP.
- Cleanup: 20 DELETEs plus 1 verification listing confirmed the namespace was empty.
- **Exactly 100 server requests**; request 101 refused.
- File cap, oversize file and 429 STOP: 0 extra requests.

**No provider call.** This is not a production budget.

### R08-SCOPE-10

- A malformed 207 over TLS gets exactly 1 explicit PROPFIND for the failing path, a 503, and no GET or write.
- The PROPFIND body is byte-identical (114 bytes).
- The API and upstream URLs are loopback.
- Certificate metadata contains no key material.
- `host: 0.0.0.0` is still refused.

**Secret-scan note:** the negative test for URL-embedded credentials builds the URL with `URL` setters. `secret-scan.mjs` is not on the whitelist and allow-lists only `poc02-security.test.mjs`.

## 4. Residuals, NOT_RUN, UNSUPPORTED

**Execution-observed P0/P1:** none in the tested scope. This is not a claim that none exist.

**Residuals (unchanged until A31):**
- P2-R05-2 capacity policy;
- Q1e arbitrary omission and snapshot;
- Q4 durable or cross-instance fairness (in-memory ledger only);
- Q5 liveness (an applied-but-unconfirmed fence can still strand an operation indefinitely);
- INFO-R05-1 text/entity amplification;
- A28 INFO items F-2, F-3 and F-4.

**NOT_RUN / UNSUPPORTED:**
- real Nutstore, WebDAV or TLS endpoint, external DNS, provider CAS/ETag/MKCOL, real quotas or 401/429 behaviour, real PROPFIND shapes;
- production budget enforcement;
- IPv6 loopback serving (`::1` is checked by the constructor only);
- the A25 119-run resource campaign (not rerun; historical);
- hardware other than the recorded reference.

**Real-service access: zero.** GitHub was used only to fetch, push and comment.

## 5. QA instructions (per the R08 QA plan)

1. **Session and preflight.** Use a **separately opened QA window**, not a sub-agent of this Execution session. Make a fresh clone, then `git checkout --detach <final SHA from the PR #2 Execution report>`, and confirm `git status --short` is empty. If the remote, authentication or preflight fails, STOP with `G3_INDEPENDENCE_PENDING` and restart the full preflight once access is available. The A28 QA-1 exception does not carry over.
2. **Git audit.** Verify:
   - the merge-base is `1c084e5`;
   - `ace7b1e` is an ancestor;
   - there are 0 merge commits;
   - the incremental paths match the A30 whitelist exactly;
   - only the `src/webdav-adapter|util|safe-api.mjs` blobs differ from `ace7b1e`;
   - pre-R08 tests, the mock, `api-main`, package files and CI are unchanged.
3. **Regression.** In `poc/001`, run:
   - `check.mjs`;
   - each POC-01…07 and R01…R08 file;
   - the full suite ×5 if claiming ×5;
   - `mutation-check.mjs` (about 12 min);
   - `secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`;
   - `npm ls --all`.

   Do **not** run `npm run evidence` in the checkout.
4. **Independent probes.** Build **your own** probes:
   - a temporary CA and HTTPS stand-in, plus a recording proxy;
   - TLS negatives (do **not** claim zero TCP/TLS packets; check for zero application requests and no `Authorization`);
   - SSRF and resolver probes **without any non-loopback egress**;
   - path, Q4 slow-body and Q5 fault injections;
   - the N = 1665/1666 export;
   - budget accounting.

   **Mutate in a disposable copy outside the repo:** disable TLS verification, bypass the host or target check, bypass the Q4 deadline or allow a late PUT, make Q5 falsely terminal or replay, and allow an over-cap partial export.
5. **Report.** Post one direct PR #2 comment with:
   - `R08 LOCAL_STAGE: PASS / PARTIAL / FAIL`;
   - `G3 INDEPENDENCE: VERIFIED / PENDING`;
   - `OVERALL POC-001: BLOCKED_REAL_SERVICE`.

   Recommend `PASS_LOCAL_CANDIDATE_FOR_D007_A31` only if everything passes. Then **QA STOP**.

**EXECUTION STOP — hand off to an independent, separately opened QA window. PR #2 OPEN / NOT MERGED; no rebase, no ACCESS-02, no deployment.**
