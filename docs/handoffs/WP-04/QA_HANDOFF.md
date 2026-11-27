# WP-04-R1 — Execution QA handoff (offline evidence recorded)

**Status: evidence recorded for candidate commit `6056b591e719796d40b8806f5b35ad1d498a57f7` on the A59 Windows offline interval. This handoff file itself is added by a later docs-only commit on the same branch; the implementation was not changed after the evidence run.** Sanitized: no cookies, CSRF tokens, operationIds, request bodies, note text or machine-local absolute paths. Independent-QA-owned rows remain `NOT_RUN` until G3.

## 0. Authoritative design documents are not present in Base

Authoritative design documents are **not** present in Base `bcc4eaad5183c923f782da0475eea1751be2de3b` (they were added later on `main` as docs-only commits). The candidate adds only the whitelisted package plus this `QA_HANDOFF.md`. QA/Design must read `docs/handoffs/WP-04/DESIGN.md`, `docs/handoffs/WP-04/QA_INSTRUCTION.md` and `docs/architecture/D007_A85_WP04_R1_G1_DRAFT.md` from `main` at `b04ba32d009d7731f2c8ca797f87c735cd779e25` (or a later docs-only main).

## 1. Immutable execution point

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `bcc4eaad5183c923f782da0475eea1751be2de3b` |
| Branch | `exec/WP-04-research-notes-r1` |
| Evidence commit SHA | `6056b591e719796d40b8806f5b35ad1d498a57f7` |
| Commit shape | one single-parent commit above Base; 23 whitelisted additions / +5140 |
| Base tree → HEAD tree | 243 → 266 paths; protected inventory 72/72 Base blobs unchanged |
| Runtime | Node `v22.23.5` x64, `node.exe` SHA-256 `247e9693d316da9857e44990e5e11709f596f18112251b8026ec6eed80bdf38a` |
| Authority | WP-04 `DESIGN.md`, `QA_INSTRUCTION.md`, D007-A85 (read from `main@b04ba32d…`) |
| Package | `packages/wp-04-research-notes-r1/` (new, isolated) |

Frozen inputs (raw-byte guards enforced before parsing):

| Fixture | Bytes | SHA-256 |
| --- | --- | --- |
| `docs/handoffs/WP-01/fixtures/wp01.v1.json` | 4573 | `86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65` |
| `docs/handoffs/WP-02/fixtures/wp02.v1.json` | 4989 | `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888` |

## 2. A59 offline interval and probe map

- User-authorized automated interval: WLAN profile temporarily `connectionmode=manual`, Wi-Fi disconnected `2026-11-26T20:11:04Z`, profile restored to `auto` and Wi-Fi reconnected `2026-11-26T20:12:58Z`.
- Independent probe `EGRESS_PROBE=PASS` **5/5** (`20:11:08`, `20:11:43`, `20:11:51`, `20:12:49`, `20:12:54`Z): classifier `OFFLINE_PROVEN`; loopback bind/connect/echo PASS; external IPv4 TCP `EHOSTUNREACH`, IPv6 `ENETUNREACH`, LAN `EHOSTUNREACH`, `.invalid` DNS `ENOTFOUND`; no proxy/credential variables in child environments. UDP send produced no callback error (recorded, not treated as proof).
- All suite/audit/mutation children ran and terminated inside the interval; network was restored only after the last probe and after every child exited.

## 3. Observed commands and results

`node` below means the pinned Node `v22.23.5` x64.

| Item | Command | Observed |
| --- | --- | --- |
| Syntax (20 package `.mjs`) | `node --check` per file | **PASS 20/20**, exit 0. Static check executed outside the offline interval (no socket/child network capability); offline boundary `NOT_RECORDED` for this static check only |
| WP-04 suite | `node --test` (cwd `packages/wp-04-research-notes-r1`) | **PASS 91/91**, `# pass 91 / # fail 0 / cancelled 0 / skipped 0 / todo 0`, 28 880 ms, exit 0 |
| Q4-01..Q4-12 named tests | same suite | all **PASS** (4/4/4/7/4/9/10/7/5/9/13/4 named Q4 tests + 11 per-file budget tallies = 91) |
| Strict upstream (Q4-12) | spawned `node --test --test-reporter=tap` | **PASS** WP-01 67/67, WP-02 44/44 (nested WP-01 67/67), WP-03 103/103, strict stateful TAP |
| Protected inventory (Q4-12) | `git hash-object --no-filters` on 72 pinned paths | **PASS 72/72** Base blob IDs |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | **PASS** `CANDIDATE_SCOPE_OK base=bcc4eaa… head=6056b59… commits=1 basePaths=243 approvedAdditions=23 protectedPaths=72 headPaths=266 worktreePaths=266`, exit 0 |
| Mutation driver | `node scripts/mutation-check.mjs` | **PASS** `BASELINE exit=0 failing=0`; `MUTATION_SUMMARY killed=14/14`; each mutant killed by its intended named assertion, exit 1, no crash/timeout |

## 4. QA-owned rows (still NOT_RUN before G3)

| QA item | Status |
| --- | --- |
| Audit negatives (extra path, modified Base path, modified protected blob, untracked file, mode change, symlink) | `NOT_RUN` (QA-owned scratch proofs) |
| Independent raw HTTP probes (owner/Workspace/foreign/anonymous, CAS race, replay race, real socket drop, neutral 403 identity, log scan) | `NOT_RUN` (QA-owned client) |
| Independent byte-fidelity oracle (QA-derived expected export, per-field/export SHA-256) | `NOT_RUN` (QA-owned oracle) |
| Independent QA scratch mutants (≥6) | `NOT_RUN` (QA-owned scratch tree) |
| Linux x86_64 run (A54/A55) | `NOT_RUN` |

## 5. NOT_RUN / limitations

- No real persistence/durability, no cross-process CAS or crash recovery; ledger is process memory only.
- No local unsaved drafts, recovery dialog, per-field merge UI, autosave or Export Local Draft.
- No UI change, no Typora rendering certification, no Key Quotes (WP-05), no Zotero API (WP-06).
- No real identity/provider, PDF, Nutstore/Zotero identifiers or external network.
- No browser/TLS behaviour, no performance claim; Linux `NOT_RUN`.

## 6. Fill-in rules

1. Record only observed results; a failed/skipped/timed-out/host-precondition-failed group is a failure, not `PASS`.
2. Keep values sanitized (route templates, statuses, counts, digests only).
3. The evidence commit above is the exact SHA for the G2 report; any later docs-only change on the branch must be disclosed as such.
