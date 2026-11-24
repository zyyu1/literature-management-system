# WP-01 — QA_HANDOFF (Execution → independent QA; sanitized)

**Status:** Execution STOP. QA (G3) NOT_RUN. G4, G5, G6 and G7 are not claimed. **Do not merge.**
**PR:** [#5](https://github.com/zyyu1/literature-management-system/pull/5), branch `exec/WP-01-synthetic-auth-api` → `main`.
**Authority:** D007-A21 G1, `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`, D007-A54 §3 (egress). Dispatched by `docs/bus/MANAGEMENT_TO_EXECUTION.md` seq 4 on `main@60e312764f54697742f5d0e842ea1d6282a233f6`.
**QA plan:** `docs/handoffs/WP-01/QA_INSTRUCTION.md`. QA runs in a separate cloud session and also follows A54.

## Commits (base → head)
| Commit | Content |
| --- | --- |
| `9cfc1d7375f81ab35921a02eebf1a1c9d941476a` | Approved Base, used as the exact parent of the first commit. |
| `15f78baa941c96b70dc16e1e2d833040a2939eef` | **Code under test:** `src/`, `support/`, `test/`, `README.md` and `package.json`. |
| `5ee20f1298db45fcd04e84b7aa40d7a605259d96` | Evidence only (`evidence/**`). |
| *(this commit)* | Adds this `QA_HANDOFF.md` only. |

The **exact 40-character final PR head SHA** is the commit that adds this file. It is reported in the Execution report comment on PR #5 and in `docs/bus/EXECUTION_TO_QA.md`, because a file cannot name its own commit. No source or test file changed after `15f78ba`. QA should check this with `git diff --name-only 15f78ba <head>`.

## Changed paths (`git diff --name-only 9cfc1d7… <head>`)
- `packages/wp-01-synthetic-auth-api/`:
  - `README.md`
  - `package.json` (empty `dependencies` and `devDependencies`, no lifecycle scripts, no lockfile)
  - `src/server.mjs`, `src/store.mjs`, `src/policy.mjs`
  - `support/harness.mjs` (test support: fixture SHA guard, loopback fake client, A5 local-draft model; kept outside `test/` so Node does not auto-run it as a test)
  - `test/auth-contract.test.mjs`, `test/session-revocation.test.mjs`, `test/origin-csrf.test.mjs`, `test/scope-workspace.test.mjs`, `test/outcome-unknown.test.mjs`, `test/transport-negative.test.mjs`
  - `evidence/WP01-SUMMARY.md`, `evidence/WP01-egress-probe.txt`, `evidence/WP01-node-test-run{1..5}.tap`
- `docs/handoffs/WP-01/QA_HANDOFF.md`

No path outside the allowlist was touched. `tools/offline/**` was **not** added to the branch. `git diff --check` is clean. The fixture is unchanged.

## Runtime, fixture, egress
- Linux 6.18.44 x86_64 (cloud session), Node **v22.23.5**, zero npm installs.
- Fixture SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` from both the Base `git show` and the working tree. Blob `0965c45e…`, 4573 B, seed 21001, clock `2030-01-02T03:04:05.000Z`.
- **A54 wrapper**, copied from `main@60e3127` to `/tmp/offline`. Blob SHAs:
  - `run-offline.sh` `d39af1194bbb05e458416184c1c66b0d9983bccd`
  - `lo-up.py` `55b45a3678fe347155ca54c89110aa1dd0ad1454`
  - `egress-probe.mjs` `fceeea897156b2f87f240d217f2c93f231a6d662`
- **Probe inside the namespace:** loopback CONNECTED; 1.1.1.1:443, 8.8.8.8:53 and 140.82.112.3:443 ENETUNREACH; DNS EAI_AGAIN; `EGRESS_PROBE=PASS`, exit 0.
- **Test command, run 5 times from the package directory:**
  `/tmp/offline/run-offline.sh env -i PATH=/opt/node22/bin:/usr/bin:/bin HOME=/tmp LANG=C.UTF-8 node --test`.
  The empty environment means no host tokens or proxy variables reach the tests. The test `egress precondition` asserts that `os.networkInterfaces()` returns exactly `['lo']` and that no proxy variables are set, so the suite fails outside the namespace without sending anything.

## Five runs (actual; raw TAP in `evidence/`)
| Run | Exit | Tests / Pass / Fail | Wall ms |
| --- | --- | --- | --- |
| 1 | 0 | 67 / 67 / 0 | 907 |
| 2 | 0 | 67 / 67 / 0 | 847 |
| 3 | 0 | 67 / 67 / 0 | 875 |
| 4 | 0 | 67 / 67 / 0 | 965 |
| 5 | 0 | 67 / 67 / 0 | 956 |

`node --check src/server.mjs` exited 0. Each run made about 150 local requests, under the 5000 cap.

## Six test files
| File | Tests | Q | Fixture cases |
| --- | --- | --- | --- |
| `auth-contract` | 10 | Q01, Q10 | AUTH-01, AUTH-02 |
| `session-revocation` | 9 | Q03, Q05 | SESS-01, SESS-02 |
| `origin-csrf` | 11 | Q04 | ORIGIN-01, CSRF-01 |
| `scope-workspace` | 8 | Q02, Q07 | AUTH-03, AUTH-04, STEPUP-01 |
| `outcome-unknown` | 12 | Q06, Q09 | OUTCOME-01, OUTCOME-02 |
| `transport-negative` | 17 | Q08 | PATH-01, REDIRECT-01 |

## Q01–Q10 map (Execution self-test, NOT QA results)
- **Q01:**
  - The Owner reads its own Project with an ETag.
  - The guest gets 401.
  - The foreign principal gets a byte-identical `403 NOT_AVAILABLE` for an existing, a missing and a foreign-owned resource, so existence is not leaked.
- **Q02:**
  - The Workspace principal gets a projection of `{id, archived}` only, with no revision or ETag.
  - The Workspace's full read is 403.
  - Workspace mutation, DELETE, unlink, factors, revoke-other and export all return `WORKSPACE_READ_ONLY`, with zero dispatch and no side effect.
- **Q03:**
  - Revoked and expired Sessions get 401 with distinct codes.
  - The fixture `advanceMs` sequence expires owner_a exactly at +1 h.
  - Revoking or logging out one Session leaves the other Sessions active.
  - Renewal rotates the token and CSRF token, kills the old token, and keeps the absolute expiry.
  - Fixated, duplicate or fixture-ID cookies are rejected.
- **Q04:**
  - Exact credentialed ACAO is sent, plus `Vary: Origin` on all responses.
  - No wildcard and no reflected Origin.
  - Preflight is exact, and a denied preflight gets no ACAO.
  - Origin is checked before Fetch Metadata, which is checked before CSRF.
  - A missing, null, lookalike or http Origin, a cross-site, `none` or absent `Sec-Fetch-Site`, and a missing, wrong or foreign CSRF token are each denied before dispatch.
  - There is no state-changing GET.
- **Q05:**
  - `Set-Cookie` attributes are exactly `Path=/; Secure; HttpOnly; SameSite=Lax`, with no `Domain`.
  - The logout cookie carries `Max-Age=0`.
  - **This is syntactic only, with no browser proof.**
- **Q06:**
  - CONFIRMED is the only outcome with `saved:true`, a new revision and a cleared draft.
  - 202 is UNKNOWN and never Saved, with no ETag.
  - 504 and a dropped connection after dispatch are UNKNOWN, and the client keeps its draft and `operationId`.
  - A local second save is refused, and a raw resend of the same op gets 409 `OPERATION_ID_REUSED` with no second dispatch.
  - 412, 428 and a stale `If-Match` give CONFLICT.
  - `fake_not_dispatched` gives DEFINITE_FAILURE with zero dispatch.
  - All four outcomes map one-to-one onto the fixture table.
- **Q07:**
  - `PROJECT_DELETE` by the Owner without step-up returns `403 STEP_UP_REQUIRED`, with `dispatched:false` and `mutationEnabled:false`.
  - Client step-up or MFA headers are ignored for DELETE, All Unlink and revoke-other.
  - Authorization is checked before step-up.
  - Factors and export return `FEATURE_DISABLED`.
  - There are no UI files.
- **Q08:**
  - Bind to anything other than 127.0.0.1, or to a non-zero port, is refused.
  - The client refuses non-loopback destinations with zero `connect` calls.
  - REDIRECT-01: the server returns DENY_OUTBOUND, and the client never follows a 302 (exactly one loopback connect).
  - PATH-01 `__proto__` and other prototype names, traversal and encodings, NUL, overlong paths, absolute-form and `*` targets are all refused.
  - Prototype-pollution JSON keys are refused.
  - Limits: 64 KiB request body (declared and chunked, 413), 256 KiB response (bounded 500), request budget (429; tests may only lower it).
  - Logs contain no cookies, tokens, bodies, IDs or headers.
- **Q09:**
  - The same `operationId` with a different fingerprint gets 409 with no context echoed.
  - A foreign principal cannot see or reuse the op (neutral 403, identical to a random op).
  - When the Session is revoked during UNKNOWN, the 401 does not cancel the op, the draft and op are kept, and re-authentication reads the same UNKNOWN context, with the original `expectedRevision`, zero replay and a single attempt.
- **Q10:**
  - The fixture SHA, size, schema, seed and clock match.
  - Node is v22.23.5 on linux/x64.
  - The manifest has zero dependencies, no install scripts, no `node_modules` and no lockfile.
  - Imports are `node:` or relative only.
  - The server source contains no forbidden hosts, no `0.0.0.0`, no `process.env` and no listen at module top level.

## Self-findings for QA attention (no P0 or P1 known to Execution)
- **P2-1 Fetch Metadata policy:** an absent `Sec-Fetch-Site` on an unsafe request is **denied** (fail-closed). A14 asks for a documented policy; this choice may reject legacy clients and needs Design confirmation.
- **P2-2 STEP_UP_REQUIRED status:** it is returned as HTTP 403 with a distinct `error.code`. A16 leaves the exact status to A5/UI-AMEND.
- **P2-3 Operation ledger:** the ledger is per-process and ephemeral (`authoritative:false`). Any reuse of an op ID, including one that was CONFIRMED, returns 409 rather than a deduplicated replay. This is intentional: there is no durable-ledger claim.
- **P2-4 Test-only control seam:** fresh fake Sessions, including the one for `user_demo_b`, who has no fixture Session, are issued through an in-process test-control API, **not** over HTTP. No first-visitor bootstrap is exposed, and ANONYMOUS principals are refused.
- **P2-5 Request cap:** the 5000-request cap is enforced per server instance, and the per-run total is shown by a tally (about 150). Tests prove the 429 path with a lowered budget of 5, so a run never needs 5000 requests.
- **P2-6 Untested fail-closed path:** the suite's fail-closed behaviour outside the namespace is designed but was **not executed**, because A54 §3.4 forbids it.
- **Execution mutation spot-check:** 14 of 14 hand mutants were KILLED (list in `evidence/WP01-SUMMARY.md`). It is out-of-repo and not independent. QA should write its own probes.

## Known unsupported (NOT RUN)
- Real TLS, browser or cookie jar (A14 B14-M*).
- Real identity provider, MFA or step-up UX.
- Durable storage, operation verification or backup.
- Cross-instance revocation or idempotency.
- Zotero, Nutstore or WebDAV.
- The original 26 U6 / 60 A4–A8 system cases.

These must never be generalized to PASS_PROVIDER or release.
