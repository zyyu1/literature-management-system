# WP-01 — EXECUTION_INSTRUCTION (D007-A21 G1, LOCAL SYNTHETIC ONLY)

**NEW INDEPENDENT G1 AUTHORIZATION:** User approved **D007-A21 Option B** on 2026-11-23 (Europe/Berlin), conditional on this **fully pinned and bounded instruction**. All fixed parameters now appear below; G1 authorizes **only this one package**. **NOT** a request to execute it inside the Design Window, and NOT an authorization for a later WP, merge, remote service, CI, cloud, live account, external PDF, original Module 002 UI or release.

**Repository:** `zyyu1/literature-management-system` (PRIVATE).
**EXACT AUTHORIZED EXECUTION BASE, FULL 40-CHAR:** `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`.
**Base source:** [A21 design+immutable fixture commit](https://github.com/zyyu1/literature-management-system/commit/9cfc1d7375f81ab35921a02eebf1a1c9d941476a); exact parent of the separately posted G1 instruction commit. **This is the branch start SHA**; do not use moving `main` as a substitute, merge it into the branch, cherry-pick unrelated changes or rebase.
**Branch to create only in Execution Window:** `exec/WP-01-synthetic-auth-api`.
**Approved design:** [D007-A21 decision](../../architecture/D007_A21_WP01_G1_DECISION.md), [DESIGN_APPROVED.md](DESIGN_APPROVED.md), [QA_INSTRUCTION.md](QA_INSTRUCTION.md) and original [A20 preflight](../../architecture/D007_A20_WP01_PREFLIGHT.md).
**Fixture:** `docs/handoffs/WP-01/fixtures/wp01.v1.json` from **exact approved base**; SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`; git blob `0965c45e3af482f4074845e1c7558901963f224f`; size 4573 B, fixed seed 21001, UTC fake clock `2030-01-02T03:04:05.000Z`. DO NOT EDIT FIXTURE.

## 1. Exact path allowlist (Git diff from full approved base)

**May create/change ONLY:**
1. `packages/wp-01-synthetic-auth-api/**` — isolated synthetic server/test source, local-only package metadata, sanitized locally reproducible evidence if needed.
2. `docs/handoffs/WP-01/QA_HANDOFF.md` — one sanitized Execution handoff at stop.

**No other paths**, including `poc/001/**`, `docs/handoffs/POC-001/**`, `docs/ui/002/**`, `docs/handoffs/002/**`, `docs/baseline/**`, `docs/architecture/**`, `docs/governance/**`, frozen WP-01 source design/fixture/instruction/QA instruction, `.github/**`, root README, root package/lockfile, secrets, CI and deployment config. No PR #2 modification or rebase. New dependency or path needed? **STOP and request new Design approval; do not implement a workaround outside allowlist.**

## 2. Runtime / network / fixture fail-closed preflight

- Environment **Linux x64**, **Node.js EXACT `v22.23.5`**. Verify `node --version`, `uname -s` = Linux, `uname -m` = x86_64. No `npm install`, package registry, Docker image pull, curl/wget downloads, alternate version, framework, upstream library or dev dependency. Use Node builtins `node:http`, `node:test`, `node:assert/strict`, `node:crypto` and test-only `node:fs` as needed.
- Host and network **local synthetic only**. Server may listen on `127.0.0.1` with ephemeral port **0**; no listening on `0.0.0.0`, public interfaces or external hosts. Tests may call loopback only; reject/never send all non-loopback requests (including redirect/DNS). Verify/test egress isolation (e.g., a preexisting offline/network-denied execution sandbox; **do not install or provision one**). If effective outbound-deny is unavailable or an unexpected connection occurs, **STOP before execution** and report. Simulated `https://app.wp01.invalid` / `https://api.wp01.invalid` are header strings only; no live TLS or DNS request.
- No real tokens, owner credentials, cookie secrets, WebDAV/Zotero host/API, MFA key, private research data, logs/backup, PDF or annotation source; no environment-wide secret injection. Do not read `.env` or unrelated process environment secrets; use fixed fake data only.
- Before work validate clean checkout and fixture hash from the **approved base** using `git status --short`, `git rev-parse HEAD`, `git show 9cfc1d7375f81ab35921a02eebf1a1c9d941476a:docs/handoffs/WP-01/fixtures/wp01.v1.json | sha256sum`, and `sha256sum docs/handoffs/WP-01/fixtures/wp01.v1.json`; both must equal the approved digest above. Any mismatch → STOP.
- Synthetic bounds: cap inbound request body at **64 KiB**, response body at **256 KiB**, and **5000 total local requests per documented test run**; reject over-limit safely and record no passwords/headers/body contents in logs. These are **WP-01 test limits**, not D007 production SLOs or ACCESS-02 limits.
- Fixture fake clock/seed are deterministic; real Session duration, R2 freshness policy, durable Owner store, MFA provider and system SLO thresholds remain undecided and unimplemented. Synthetic timeouts are deterministic test controls only.

## 3. Required code/output, exclusively fake/mocked

Inside `packages/wp-01-synthetic-auth-api/`:
- `src/server.mjs` (importable server factory that is inert until invoked by local tests, defaults to deny unsafe config). Node-only loopback; server instance close/cleanup; no automatic start on module import.
- Optional `src/*.mjs` helpers for **server-only** fake Owner/Session/resource ACL, origin/CSRF/CORS policy, fake Step-up *deny*, privacy-safe errors, fake outcome injection and UNKNOWN state. All storage is ephemeral **test-only**; no database, WebDAV adapter or durable replay claim.
- `test/auth-contract.test.mjs`, `test/session-revocation.test.mjs`, `test/origin-csrf.test.mjs`, `test/scope-workspace.test.mjs`, `test/outcome-unknown.test.mjs`, `test/transport-negative.test.mjs` — six independent test files. Tests must exercise **Q01–Q10** from [QA_INSTRUCTION.md](QA_INSTRUCTION.md), the canonical 13 adversarial fixture cases and both authorized/denied flows.
- `README.md` documenting mocks and limitations, exact commands, status semantics and no production suitability. `package.json` only if needed, with **empty** dependencies/devDependencies and no lifecycle/install scripts; **no generated lockfile required when nothing is installed**. No frontend UI, actual login page, original Zotero data, private note or production API.
- Optional `evidence/**` sanitised local test outputs: no secrets/private data/absolute home paths/raw Cookie values. Write only within package allowlist.

**A4/A14:** server-side synthetic Session, origin/cookie *contract headers*, CSRF, exact allowlisted credentialed CORS/Vary, reject foreign resource ID, revoked and expired sessions; `__Host-` Cookie assertion is *syntactic* only on HTTP loopback and not a real browser/HTTPS success.
**A5:** fake injected `CONFIRMED / CONFLICT / DEFINITE_FAILURE / UNKNOWN`; 202 never Saved; 504 post-dispatch retains UNKNOWN/operation ID and local fake draft; no blind replay/cross-process exactly-once; no real durable write.
**A15/A16:** no first-visitor bootstrap, no MFA or new UI; R2/R3 action missing qualifying Step-up returns distinct `STEP_UP_REQUIRED` without side effect. **Permanent Project Delete, All Unlink and all real mutations must remain DISABLED.**
**A13/A18:** isolation, no external network/dep/secret, clear source SHA/fixture, no CI modification and no provenance claims beyond observed evidence. An A18 report compares three candidate framework repos but selected **zero new dependencies**; do not import their code.

## 4. Exact local test and handoff procedure

Execution preflight (run after separately retrieving this instruction from GitHub main, but check out the **fixed base SHA**):
```bash
git fetch origin
git checkout --detach 9cfc1d7375f81ab35921a02eebf1a1c9d941476a
git status --short
git rev-parse HEAD
git show 9cfc1d7375f81ab35921a02eebf1a1c9d941476a:docs/handoffs/WP-01/fixtures/wp01.v1.json | sha256sum
sha256sum docs/handoffs/WP-01/fixtures/wp01.v1.json
node --version
uname -s
uname -m
# STOP on any mismatch; only then:
git switch -c exec/WP-01-synthetic-auth-api
```

After writing only allowed code/test files and while in `packages/wp-01-synthetic-auth-api`:
```bash
node --check src/server.mjs
node --test
```

Run `node --test` **5 independent times**, preserving all five actual outcomes, exit codes and case counts if 5× stability is claimed; tests should cover at minimum all Q01–Q10 and the 13 negative fixture cases. An empty discovered suite or no external-egress check cannot be a PASS. Commands are for Execution on its authorized local sandbox, **not to be run by Design or QA yet**.

Commit **only allowed files** to the execution branch; audit `git diff --name-only 9cfc1d7375f81ab35921a02eebf1a1c9d941476a HEAD`, `git diff --check 9cfc1d7375f81ab35921a02eebf1a1c9d941476a HEAD`, test exits, no third-party dependencies, secret/PII/host scans, exact fixture unmodified and zero real network contact. Create **a PR targeting main** but **do not merge**; do not alter PR #2. Upload sanitized `QA_HANDOFF.md` listing full **40-char new PR head SHA**, parent/base, changed paths, 6 test file cases, QA Q01–Q10 map, 5 test outputs and exits, runtime/OS, fixture SHA-256, network isolation evidence, known unsupported cases, P0/P1/P2 findings, and link to PR. If handoff changed HEAD, update handoff/PR to the **actual final SHA** and STOP.

**Execution STOP → Independent QA G3:** QA must fresh-checkout the exact handed-off PR head and independently reproduce; a locally green suite/mergeability does not auto-accept G4 or merge G5. G6 real Nutstore/Zotero/device and G7 cloud/staging/prod all require **separate user decisions** and are not granted.

## 5. Immutable historical POC-001 firewall

`exec/POC-001-webdav-feasibility`, base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`, existing path allowlist, no rebase, PR #2 head `74d00f2bf6d6be5a55f43b359a416437e7e3e0c3` **must remain untouched**. Latest independent REMEDIATION-02 QA on that SHA = **LOCAL_STAGE PARTIAL** (Q1 certified export residual, Q2 ETag read-back, Q3 claim wording). No POC repair/ACCESS-02, merge, real TLS/WebDAV/CAS, cloud or production authority follows from this WP-01.

**FINAL G1:** **WP-01 AUTHORIZED_LOCAL_SYNTHETIC ONLY under the above exact base + allowlist + fixture + no-network controls. NOT STARTED / QA NOT_RUN / MERGE NOT_AUTHORIZED / REAL_ACCESS BLOCKED / RELEASE NOT_AUTHORIZED.**
