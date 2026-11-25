# WP-02 — QA_HANDOFF (Execution → independent QA; sanitized)

**Status:** Execution STOP. QA (G3) is NOT_RUN. G4 is not claimed. G5 merge needs a separate DEC. G6 and G7 are NOT_AUTHORIZED. **Do not merge.**
**PR:** [#6](https://github.com/zyyu1/literature-management-system/pull/6), `exec/WP-02-project-paper-read` → `main`.
**Authority:**
- D007-A56 G1, effective through DEC-6=A in `docs/bus/MANAGEMENT_TO_EXECUTION.md` seq 6;
- `docs/handoffs/WP-02/DESIGN.md`;
- egress rules A54 §3 / A55.

**QA plan:** `docs/handoffs/WP-02/QA_INSTRUCTION.md`, run in a separate cloud session.

## Commits (Base → head; no merge commits)
| Commit | Content |
| --- | --- |
| `a0fb04f6d03ac81bbcb35800318c927e278e8b92` | A56 Base, the exact parent. |
| `1da0a752f480c3b2844ac9005cf312343082fc5c` | **Code under test:** `src/`, `support/`, `test/`, `scripts/`, `README.md`, `package.json`. |
| `38a60d60fc8f757102277f0188c774d1f75bbf95` | Evidence only (`evidence/**`). |
| *(this commit)* | Adds this file only. |

The exact 40-character final head is the commit that adds this file. It is reported in the Execution report comment on PR #6 and in `docs/bus/EXECUTION_TO_QA.md`. Check that `git diff --name-only 1da0a75 <head>` shows only `evidence/**` and this file.

## Paths and invariants
- **Changed:** `packages/wp-02-project-paper-read/**`, which contains:
  - `src/server.mjs`, `src/catalog.mjs`
  - `support/harness.mjs`
  - `test/` (7 files)
  - `scripts/mutation-check.mjs`
  - `README.md`, `package.json` (empty dependencies, **no scripts**, no lockfile)
  - `evidence/**`

  The only other changed path is `docs/handoffs/WP-02/QA_HANDOFF.md`. Nothing outside the whitelist changed, `tools/` was not added, and `git diff --check` is clean.
- **WP-01 byte-unchanged:** `git diff a0fb04f <head> -- packages/wp-01-synthetic-auth-api` is empty. `test/wp01-regression.test.mjs` also checks a SHA-256 manifest of all 19 files taken from Base.
- **Fixtures unchanged:**
  - WP-02: SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`, blob `f1958fd288a3fdac57725e0ac1c7920aee456af0`, 4989 B.
  - WP-01: SHA-256 `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65`.

## Design note: how WP-02 attaches to WP-01
WP-01's server has a closed route table. Adding routes to it would need a WP-01 change, which is an A56 STOP. WP-02 therefore provides its own read-only server, `createProjectPaperReadServer()`. It **imports** WP-01's `src/store.mjs` (Sessions, principals, revocation and expiry, fake clock) and `src/policy.mjs` (target parsing, limits), plus the WP-01 test client from `support/harness.mjs`, all read-only.

Consequences:
- WP-01 Session semantics are reused, not re-implemented.
- WP-01 routes are served by the WP-01 server; WP-02 routes are served by the WP-02 server.
- Both share the WP-01 fixture's principals and Sessions.

## Runtime and egress
- Linux 6.18.44 x86_64 (cloud session), Node **v22.23.5**.
- The A55 tools were copied from `origin/main@47a3f61`; their blobs equal Base. Blob SHAs:
  - `run-offline.sh` `2d06bfc3aee1c1d9b3a8e67fd93e483bc8b1fb20`
  - `lo-up.py` `55b45a3678fe347155ca54c89110aa1dd0ad1454`
  - `egress-probe.mjs` `fceeea897156b2f87f240d217f2c93f231a6d662`
- Probe: `EGRESS_PROBE=PASS`, exit 0.
- Commands, from the package directory:
  - `/tmp/offline/run-offline.sh node --test`
  - `(cd ../wp-01-synthetic-auth-api && /tmp/offline/run-offline.sh node --test)`
  - `/tmp/offline/run-offline.sh node scripts/mutation-check.mjs`

## Five runs (actual; raw TAP in `evidence/`)
| Run | WP-02 | WP-01 (separate process) |
| --- | --- | --- |
| 1 | exit 0, 43/43 | exit 0, 67/67 |
| 2 | exit 0, 43/43 | exit 0, 67/67 |
| 3 | exit 0, 43/43 | exit 0, 67/67 |
| 4 | exit 0, 43/43 | exit 0, 67/67 |
| 5 | exit 0, 43/43 | exit 0, 67/67 |

The WP-02 count of 43 includes Q2-11, which runs the WP-01 suite nested (67/67).

**Mutation:** the committed driver ran 13 mutants, and each was KILLED by its named test (`evidence/WP02-mutation.txt`). The set covers all 8 mutant kinds listed in QA_INSTRUCTION.

## Q2 map (Execution self-test, NOT QA results)
- **Q2-01:** `user/fakeLib01/XFAKE001` appears as exactly 1 row in alpha, beta and gamma, and its detail lists all 3 associations. `canonicalPaperCount` is 4. The seeded re-import returns `{paperCreated:false, associationCreated:false}`, and counts and digest are unchanged. Owner-visible distinct papers: 3.
- **Q2-02:**
  - `group/fakeLib02/XFAKE001` is a distinct paper: To Read, note `null`, alpha only.
  - `XFAKE002`, which has the same title, DOI and creators as XFAKE001, is distinct: Read, note `null`, gamma, important.
  - Fixture copies that contain a duplicated paper or association, or a cross-owner link, are refused with STOP.
- **Q2-03:** `active` (the default) equals `[alpha, gamma]`, `archived` equals `[beta]`, and `all` is the union. Counts equal `expected.projectCounts`. Neither the foreign Project nor any owner ID appears. Invalid, repeated or unknown query parameters get `400`.
- **Q2-04:** XFAKE001 shows `Reading` with note PRESENT through every Project. `important` is true in alpha only. There is no paper-level `important` field.
- **Q2-05:** detail associations are exactly alpha (false/true), beta (archived:true) and gamma (false/false). An archived Project is readable and carries `archived:true`.
- **Q2-06:** 13 denial cases are byte-identical in body and in headers (ignoring Date, Connection and Keep-Alive):
  - ANONYMOUS on 3 routes;
  - FOREIGN on its own scope and on the owner's scope (list, project, paper);
  - the owner on a foreign or missing Project, paper or library.

  Revoked and expired Sessions get 401, as in WP-01. A duplicated cookie gets 401. Fake-clock expiry applies.
- **Q2-07:** WORKSPACE_READONLY gets the same 200 data as the Owner on all GETs. POST, PUT, PATCH, DELETE, HEAD and OPTIONS on 6 routes, for the Workspace, the Owner, ANONYMOUS and FOREIGN, all return `405` with `Allow: GET`. The digest is unchanged.
- **Q2-08:** the digest is equal before and after every server instance (asserted in the harness teardown). Tampering with a client copy does not affect server state. The digest is sensitive to a state difference.
- **Q2-09:** each of the five note keys is byte-equal (UTF-8) to the fixture. CRLF, emoji, the formula and precomposed Unicode are all preserved, and the wire bytes contain the exact JSON encoding.
- **Q2-10:**
  - Bind is 127.0.0.1 with port 0 only, and the server is inert until `listen()`.
  - Traversal, encoded `/`, `\` and NUL, a dot in an ID, bad `libraryType`, prototype names and overlong IDs are rejected with 400 or 404.
  - Absolute-form, `//` and `*` request targets get 400.
  - A declared body over 64 KiB gets 413. The budget returns 429. A response over 256 KiB becomes a bounded 500.
  - Logs are sanitized.
  - The fixture provenance checks, Node exact version, zero dependencies and node:/relative-only imports all hold.
- **Q2-11:** WP-01 is byte-identical to Base (19-file manifest), and the WP-01 suite is 67/67 in a separate process.

## Self-findings for QA attention (no P0 or P1 known to Execution)
- **P2-1 ANONYMOUS returns 403, not 401:** WP-01 answers a missing cookie with `401 AUTH_REQUIRED`. On the WP-02 routes only, a missing cookie returns the neutral `403 NOT_AVAILABLE`, as A56 R-AUTH and QA Q2-06 explicitly require. Revoked, expired, invalid and duplicated cookies still get WP-01's `401`. **Design should confirm** this is the intended split.
- **P2-2 Separate server:** WP-02 runs its own server, not extra routes on the WP-01 server. `GET /api/v1/projects/{id}` (WP-01) and the WP-02 routes therefore live on different server instances. A combined host is out of scope.
- **P2-3 FOREIGN principal:** `user_demo_b` (FOREIGN_DENIED) gets the neutral 403 even for its own-scope Project and paper (`project_synth_foreign`, `XFOREIGN1`). This is consistent with WP-01's role semantics.
- **P2-4 HEAD and OPTIONS:** both are treated as non-GET and return 405. There is no CORS preflight on WP-02 routes, because only simple credentialed GETs are served.
- **P2-5 Untested fail-closed path:** fail-closed behaviour outside the namespace is designed but **not executed**, per A54 §3.4.

## Known unsupported (NOT RUN)
- UI and frozen-UI work.
- Zotero import or API.
- Writes: Important toggle, reading status, note.
- Real identity.
- Durable storage.
- Devices.
- Real TLS or browser.
