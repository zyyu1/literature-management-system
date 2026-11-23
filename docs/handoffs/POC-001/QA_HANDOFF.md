# POC-001 — Execution → QA Handoff · REMEDIATION-05 / D007-A25 (LOCAL / SYNTHETIC ONLY)

**From:** Execution Window · 2026-11-23 (Europe/Berlin)
**Authority:** [REMEDIATION_05.md @ `b1e11f9`](https://github.com/zyyu1/literature-management-system/blob/b1e11f9c6eeb7123e9ea03261446df3ab0d5780e/docs/handoffs/POC-001/REMEDIATION_05.md), [A25 disposition](https://github.com/zyyu1/literature-management-system/blob/b1e11f9c6eeb7123e9ea03261446df3ab0d5780e/docs/architecture/D007_A25_POC001_REMEDIATION05_DISPOSITION.md) and the [R05 QA plan](https://github.com/zyyu1/literature-management-system/blob/b1e11f9c6eeb7123e9ea03261446df3ab0d5780e/docs/handoffs/POC-001/REMEDIATION_05_QA_PLAN.md). These sit within the original [EXECUTION_INSTRUCTION.md](EXECUTION_INSTRUCTION.md) and the [ACCESS POLICY](ACCESS_POLICY.md).
**Scope:** exactly two findings, **P2-R04-1** (parser CPU/memory) and **P2-R04-2** (allprop PROPFIND).
**Boundary:** in-repo loopback mock and **synthetic data only**. **No real Nutstore or Zotero, no external WebDAV, no TLS, no credentials, no PDFs or notes.** **Real Nutstore: `BLOCKED_REAL_SERVICE`; OVERALL POC-001 cannot PASS.**
**Status:** A24's G4 acceptance applies **only** to `22dd9bd`. These R05 changes are **not** accepted. Execution does not self-certify G4 or declare P2-R04-1/2 closed; that is D007-A26.
**History (preserved):** handoffs at [65e14af](https://github.com/zyyu1/literature-management-system/blob/65e14afc81e6de37ba5fac90c2937a27876c5614/docs/handoffs/POC-001/QA_HANDOFF.md), [2806d9d](https://github.com/zyyu1/literature-management-system/blob/2806d9d08dcec78e974703a82a38a696ae76d132/docs/handoffs/POC-001/QA_HANDOFF.md), [74d00f2](https://github.com/zyyu1/literature-management-system/blob/74d00f2bf6d6be5a55f43b359a416437e7e3e0c3/docs/handoffs/POC-001/QA_HANDOFF.md), [4bfa924](https://github.com/zyyu1/literature-management-system/blob/4bfa924af2d20cd383c4e49f982f55ac83423a42/docs/handoffs/POC-001/QA_HANDOFF.md) and [22dd9bd](https://github.com/zyyu1/literature-management-system/blob/22dd9bd30900d9c7ca205a36c675fd47b2569feb/docs/handoffs/POC-001/QA_HANDOFF.md). The G3 QA basis is [7092575362](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7092575362).

## 1. Provenance and lineage

| Field | Value |
|---|---|
| Branch | `exec/POC-001-webdav-feasibility` (existing) |
| Original approved base | `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`. `git merge-base HEAD 1c084e5…` returns `1c084e5…` |
| Exact pre-R05 HEAD | `22dd9bd30900d9c7ca205a36c675fd47b2569feb`. Preflight confirmed the local HEAD, the remote branch and the PR #2 head all equalled it, with a clean tree, before any edit |
| Lineage | `22dd9bd → 5749383 (code) → ae547d2 (evidence-path sanitization) → 70f59d6 (evidence) → (this handoff commit)`; fast-forward only; **no rebase, no merge of `main`, no force-push, no Design docs cherry-picked** |
| R05 code commits | `5749383ac617c5cbe9c0d638907a92264c41dfab`; `ae547d2b89ba17c9c9ba2cba337e887b8af4aacc` (the evidence runner maps the temp baseline path to `<tmp>`) |
| R05 evidence commit | `70f59d61d6c231c989494114af0ffcbd89454001`, generated on a clean tree at `ae547d2` (`results.json`: `gitHead=ae547d2…`, `gitDirtyPaths=(clean)`) |
| **Final PR head** | the commit adding this file (parent `70f59d6`). **Its true 40-char SHA is in the PR #2 update comment.** |
| `main` observed | `b1e11f9c6eeb7123e9ea03261446df3ab0d5780e` (A25). `git merge-tree --write-tree` reported no conflict at that moment |
| Runtime | Node **v22.23.5**, npm 10.9.9, Linux 6.18 **x64**, **2 vCPU** (Intel Xeon @ 2.10 GHz), 127.0.0.1 only |
| Dependencies | **none added**. `npm ls --all` → `(empty)`; `poc/001/package.json` and `package-lock.json` unchanged |

**Cumulative paths** (`1c084e5…HEAD`): 56, all `poc/001/**` plus this file.

**Incremental paths** (`22dd9bd…HEAD`):
- `poc/001/{README.md, scripts/mutation-check.mjs, scripts/resource-probe.mjs (new), scripts/resource-probe-child.mjs (new), scripts/run-evidence.mjs, src/dav-xml.mjs, src/mock-webdav.mjs, src/webdav-adapter.mjs, test/r05-regressions.test.mjs (new)}`
- 24 files under `poc/001/evidence/`
- this file.

No earlier authorization file, ACCESS policy, `docs/{architecture,governance,ui}/**`, `docs/handoffs/{002,WP-01}/**`, `.github/**`, `app/**`, `src/**`, root package files or deployment configuration was touched.

## 2. NEW results at `ae547d2` (Execution run; NOT independent QA)

| Step (cwd `poc/001`) | Exit | Result |
|---|---:|---|
| `node --version` | 0 | v22.23.5 |
| `node scripts/check.mjs` | 0 | 28 files, 0 failures |
| POC-01…07 (each file) | 0 each | 2 / 4 / 3 / 1 / 3 / 17 / 3 |
| R01 / R02 / R03 / R04 | 0 each | 21 / 21 · 21 / 21 · 26 / 26 · 17 / 17 |
| **R05** `node --test test/r05-regressions.test.mjs` | 0 | **20 / 20** |
| **R05 isolated resource probe** `node scripts/resource-probe.mjs --baseline <tmp>/…pre-r05.mjs` | 0 | **8 / 8 PASS** (+ 4 INFO baseline rows) |
| `node --test "test/*.test.mjs"` × **5 separately executed, committed runs** | 0 ×5 | **138 / 138** each |
| `node scripts/mutation-check.mjs` | 0 | **47 / 47 killed** (M38–M47 new) |
| `node scripts/secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4` | 0 | 0 findings over 53 files *at `ae547d2`* (heuristic) |
| `npm ls --all` | 0 | `(empty)` |

The isolated resource probe is also invoked from inside the functional suite, again in child processes. POC-05: A won 24 rounds and B won 26 over 50. The evidence was checked: no workspace or temp paths, and no synthetic credentials or keys. **The 118/118 × 5 and 37/37 results at `22dd9bd` are historical (A24) and not re-claimed.**

## 3. R05-1 — bounded XML parser (P2-R04-1)

**Implementation** (`src/dav-xml.mjs`):
- `LIMITS` are enforced **while tokenising, before allocation**: depth ≤ **64** (checked before a new element is created); elements ≤ **10 000**; attributes ≤ **64** per element and ≤ **10 000** in total (counted inside the attribute loop); namespace declarations ≤ **256** per document; input ≤ **2 000 000** bytes (unchanged).
- Namespace scopes are **shared by reference**. A new `Map` is created only on an element that declares a namespace: 5 Maps for a 10 000-element document, versus 10 000 before. This is observable through `parseXml(input, stats).scopeMaps`.
- Tree validation and `textOf` recursion are bounded by the depth gate.
- Multi-colon qnames such as `D:response:x` (a G3 INFO item) are now refused.
- Any violation → `DAV_XML` → `503 export_incomplete`, with no bundle and no writes.

**Isolated hostile-input evidence.** Each row runs in its **own child process** with `--max-old-space-size=256` and a parent-enforced **SIGKILL** timeout at 20 s. Peak RSS is sampled from `/proc/<pid>/status` VmHWM. Wall time includes Node start-up. The fixtures are generated deterministically in memory and are not stored.

| Fixture | bytes | depth | elements | xmlns | mode | exit | wall | peak RSS | outcome |
|---|---:|---:|---:|---:|---|---:|---:|---:|---|
| H1 historical | 434 890 | 60 000 | 60 000 | 1 000 | parser | 0 | 39 ms | 48.7 MB | `DAV_XML` depth > 64 |
| H1 historical | 434 890 | 60 000 | 60 000 | 1 000 | API export | 0 | 94 ms | 63.5 MB | **503 export_incomplete**, no bundle, 0 writes |
| H2 historical | 380 890 | 50 000 | 50 000 | 2 000 | parser | 0 | 32 ms | 47.1 MB | `DAV_XML` depth > 64 |
| H2 historical | 380 890 | 50 000 | 50 000 | 2 000 | API export | 0 | 115 ms | 61.9 MB | **503**, no bundle, 0 writes |
| H3 at all limits | 95 148 | 4 | 10 000 | 256 | parser / API | 0 / 0 | 58 / 115 ms | 52.6 / 67.9 MB | refused (not a DAV multistatus) / 503 |
| H4 2 MB element flood | 1 999 999 | 1 | 499 999 | 0 | parser / API | 0 / 0 | 51 / 119 ms | 52.5 / 76.4 MB | `DAV_XML` > 10 000 elements / 503 |
| *INFO baseline: pre-R05 parser, H1* | | | | | parser | **SIGABRT (134)** | 1 328 ms | 293 MB | **heap limit reached** |
| *INFO baseline: pre-R05 parser, H2* | | | | | parser | **SIGABRT (134)** | 1 417 ms | 294.6 MB | **heap limit reached** |

All current-code rows meet the A25 target: **< 2 s, no `Reached heap limit`, no exit 134, no partial export.** The figures were measured in this environment (2 vCPU, Linux x64, Node 22.23.5). QA's original 442 KB / 396 KB fixtures were not published, so H1 and H2 are re-generated to the same shape. QA should confirm comparability.

**Boundary tests** (parser layer, in-process, small fixtures): depth 64 ✓ / 65 ✗; elements 10 000 ✓ / 10 001 ✗; attributes 64 ✓ / 65 ✗ per element; 10 000 ✓ / 10 001 ✗ in total; xmlns 256 ✓ / 257 ✗; 2 MB; DTD/ENTITY; qname. **Listing-level tests:** depth, element and xmlns violations inside a multistatus → 503 with `detail` "*resource limit*", 0 writes.

## 4. R05-2 — explicit PROPFIND (P2-R04-2)

**Observed outbound request** at the mock, for every listing PROPFIND (root + 3 kinds):

```
PROPFIND <path>
Depth: 1                      (caller-supplied; Depth 0 also verified)
Content-Type: application/xml; charset=utf-8
Content-Length: 120
<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>
```

The request never contains `allprop`, `propname`, `lockdiscovery` or `current-user-principal`, and there is **no fallback**: a PROPFIND answered 400/403/415/500 produces `503` after exactly **one** request.

**Synthetic locked-resource fixtures.** The mock now models `locks`, allprop vs. `<prop>` selection, a non-conforming `ignorePropSelection` mode, and records the raw request.

| Case | Result |
|---|---|
| Locked record + locked collection, conforming mock | export **200, 2 / 2**; restore `restored 2` |
| Same mock answering an empty-body (allprop) PROPFIND | returns `lockdiscovery` + `current-user-principal` with nested `DAV:href` → the parser **refuses** it. This shows why the explicit request matters |
| Non-conforming mock (scope ignored), with and without locks | **503 export_incomplete**, no bundle |
| Nested `DAV:href` inside an unexpected property (`DAV:owner`) | **503** |
| 0- and 2-record export/restore; canonical-kind omission; `D:` / default / `z:` prefixes; R04 hidden response | unchanged behaviour |

**No Nutstore compatibility is claimed.** Whether a real provider honours a `<prop>` PROPFIND is **UNSUPPORTED / NOT_RUN**.

## 5. Mutation (M38–M47 new; all killed)

| Mutant | Covers |
|---|---|
| M38 | depth guard |
| M39 | element guard |
| M40 | per-element attribute guard |
| M41 | total attribute guard |
| M42 | xmlns guard |
| M43 | per-element namespace Map copy restored |
| M44 | multi-colon qname guard |
| M45 | empty-body (allprop) PROPFIND restored |
| M46 | Content-Type dropped |
| M47 | allprop fallback after a non-207 |

## 6. README contract, residuals, UNSUPPORTED

- **README** (`poc/001/README.md` item 9a and the "Remediation 05" section) documents:
  - the explicit resourcetype-only PROPFIND and its no-fallback rule;
  - that the conservative response profile may reject legal allprop-style properties (`lockdiscovery`, `current-user-principal`, `owner`, any property containing `DAV:href`) if a server returns them anyway;
  - the parser limits and the synthetic-only resource evidence.

  Earlier honest limitations are preserved: Q1e, snapshot consistency, Q4/Q5 liveness, bounded replay and tombstones, no cross-instance exactly-once, provider CAS/ETag, and real TLS/Nutstore not tested.
- **Execution-observed P0/P1:** none in the tested scope. This is not a claim that none exist.
- **Residual P2 (declared):**
  - Q4a–c;
  - Q5 (applied-but-unconfirmed fence liveness);
  - the conservative profile rejecting legal extension shapes from non-conforming servers.
- **UNSUPPORTED:**
  - all real-provider semantics (`<prop>` honouring, atomic `If-Match`, PUT = GET = CAS validator, identical-bytes ETag change, `MKCOL` atomicity, real PROPFIND shapes, listing completeness);
  - Q1e;
  - snapshot consistency;
  - create-only fence;
  - durable or global exactly-once;
  - key rotation, cross-key restore and rollback detection;
  - real TLS;
  - performance on hardware other than the recorded reference.
- **Confirmed:** zero real-service access. GitHub was used only for fetch, push and the PR comment.

## 7. QA instructions (per R05 QA plan)

1. Take the true final head from the PR #2 update comment. Run a fresh clone, `git rev-parse HEAD`, and confirm `git status --short` is clean. Check that `git merge-base HEAD 1c084e5…` returns `1c084e5…` and that `git merge-base --is-ancestor 22dd9bd30900d9c7ca205a36c675fd47b2569feb HEAD` succeeds. Check both path inventories, and that there are no dependency or merge commits.
2. In `poc/001`, run:
   - `check.mjs`;
   - POC-01..07 and R01–R05;
   - the full suite ×5;
   - `mutation-check.mjs` (about 9 min);
   - `secret-scan.mjs 1c084e5f14e4af8018ef5fe99710be7205cfbdf4`;
   - `npm ls --all`;
   - `node scripts/resource-probe.mjs`. For a baseline, use `--baseline` with `git show 22dd9bd30900d9c7ca205a36c675fd47b2569feb:poc/001/src/dav-xml.mjs > <tmp file>`.

   Do **not** run `npm run evidence` in the checkout.
3. Using **independent** hostile fixtures in resource-limited child processes, and an **independent** loopback DAV double, inspect the actual outbound PROPFIND. Cover the locked/allprop, non-conforming, no-fallback and error paths, and all R05 QA plan cases.
4. Report `REMEDIATION-05 LOCAL_STAGE: PASS/PARTIAL/FAIL` and `OVERALL POC-001: BLOCKED_REAL_SERVICE`, with residuals, in PR #2. Do not modify code. STOP for D007-A26.

**EXECUTION STOP — HAND OFF TO INDEPENDENT G3 QA. PR #2 OPEN / NOT MERGED; no rebase, no ACCESS-02, no deployment.**
