# Q1E-L3 — Execution → QA Handoff · D007-A37 (LOCAL / SYNTHETIC / MODEL_ONLY)

**From:** Execution Window · 2026-11-24 (Europe/Berlin).

**Bus:** DISPATCH = issue #3 "BUS: Q1E-L3" body. The bus moves to the new L3 PR once it exists. PR #2 / R09 is **not touched**.

**Authority,** read directly at Design `main` @ `968dd0fe55170a84699dca683ef4194e8d11a093` (never merged into this branch):
- [D007-A37 G1](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/architecture/D007_A37_Q1E_L3_SYNTHETIC_G1_AUTHORIZATION.md)
- [A36 design](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/architecture/D007_A36_Q1E_LOCAL_FEASIBILITY_DESIGN.md)
- [A36 QA matrix](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/architecture/D007_A36_Q1E_L1_L3_INDEPENDENT_QA_MATRIX.md)
- [A35](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/architecture/D007_A35_Q1E_STORAGE_STRATEGY_DISPOSITION.md)
- [A34](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/architecture/D007_A34_Q1E_MANIFEST_SNAPSHOT_RECOVERY_DESIGN.md)
- [EXECUTION_WORK_ORDER](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/handoffs/Q1E-L3/EXECUTION_WORK_ORDER.md) (the only work order)
- [INDEPENDENT_G3_QA_PLAN](https://github.com/zyyu1/literature-management-system/blob/968dd0fe55170a84699dca683ef4194e8d11a093/docs/handoffs/Q1E-L3/INDEPENDENT_G3_QA_PLAN.md)

**Labels that apply to every result here:**

| Label | Meaning |
|---|---|
| `MODEL_ONLY` | The results cover only the in-memory logical model |
| `PHYSICAL_DURABILITY_UNPROVEN` | There is no fsync, WAL, power-loss or multi-process proof |
| `UNSUPPORTED_COMPLETENESS` | Q1e stays open; only known-fixture omissions are detectable |
| `NOT_RESTORE_CERTIFIED` / `BACKUP_NOT_RESTORE_CERTIFIED` | No backup or restore certification |

**Status:** Execution evidence only. **No G3 or G4 claim.**
- G4 is Design-only (D007-A38).
- G5 merge NOT_AUTHORIZED · G6 ACCESS-02 BLOCKED · G7 deployment NOT_AUTHORIZED.
- OVERALL POC-001 `BLOCKED_REAL_SERVICE`.

## 1. Provenance and preflight

| Field | Value |
|---|---|
| Immutable base | `1dd8b51f84921d23dc0112e4056fa7220bbb73e8`, an ancestor of `main` (`968dd0f` is 1 commit ahead) |
| Branch | `exec/Q1E-L3-synthetic-transaction-feasibility`. Before creation, `ls-remote` showed no such branch and no PR for it; created at exactly `1dd8b51` in a fresh worktree |
| Lineage | `1dd8b51 → 2cfc4ba (code) → (this evidence + handoff commit)`. Fast-forward only; **0 merge commits**; no rebase, force-push or cherry-pick of `main` |
| Code commit | `2cfc4ba6c1269264a7370a4681725a3111e7c60a` |
| Evidence | Generated on a clean tree at `2cfc4ba` (`evidence/L3-results.json`: `gitDirty=(clean)`) |
| **Final head** | The commit adding this file; **its exact 40-char SHA is in the EXEC_REPORT and QA_REQUEST on the new L3 PR** |
| PR #2 (read-only) | OPEN, not merged, at `bcc47380deb7c6e48964ca5ca77303a213fade28`. The work order recorded `49ad24e…`; it has since advanced through the separate R09 handoff. **Not modified by this job** |
| Runtime | Node **v22.23.5**, Linux 6.18 x64, 2 vCPU Intel Xeon @ 2.10 GHz |
| Dependencies | Built-ins only. No `package.json`, no `node_modules`, no install, no CI change |

**Changed paths from `1dd8b51`:** all are new files on the A37 whitelist.
- `poc/q1e-l3/README.md`
- `poc/q1e-l3/src/{model,snapshot,recovery}.mjs`
- `poc/q1e-l3/test/l3-{contract,faults}.test.mjs`
- `poc/q1e-l3/scripts/{check,mutation-check}.mjs`
- `poc/q1e-l3/evidence/L3-*`
- this file

**No pre-existing file is modified,** including `poc/001/**`, `docs/handoffs/POC-001/**`, `docs/governance/**`, Design/A1–A37, the Module 002 UI, package files, CI and the root README.

## 2. Results at `2cfc4ba` (Execution run; NOT independent QA)

| Command (repo root) | Exit | Result |
|---|---:|---|
| `node --check` on each of the 7 new `.mjs` files | 0 ×7 | ok |
| `node --test poc/q1e-l3/test/l3-contract.test.mjs poc/q1e-l3/test/l3-faults.test.mjs` × **5 separate processes** | 0 ×5 | **27 / 27** each (26 case tests + 1 barrier-list sanity test); 215–258 ms; runner peak RSS about 47 MiB |
| `node poc/q1e-l3/scripts/check.mjs` | 0 | all checks pass: 26 cases mapped (3–11 assertions each), built-in-only imports, no network API, no dependency, no key/PDF, README labels, whitelist (8 paths at `2cfc4ba`), 0 merges |
| `node poc/q1e-l3/scripts/mutation-check.mjs` | 0 | **12 executed, 12 KILLED_BY_INTENDED_ORACLE, 0 survivors, 0 wrong-reason, 0 not-run** |

**Notes on the measurements:**
- RSS is the parent test-runner process; `node --test` runs each file in a child process.
- The prototype makes 0 socket/DNS/TLS attempts. Both test files install a trap on `net.Socket#connect`, `dns.lookup` and `tls.connect`, and assert that it recorded zero attempts (C12, T07).

## 3. The 26 A36 cases

Every case has a positive control and a fail-closed negative, and emits a structured record (`evidence/L3-cases.json`).

| Case | Observed (model level) |
|---|---|
| C01 | Listing missing a known id fails with `KNOWN_ID_OMITTED`, no bundle; the export enumerates every predeclared id; an oracle id that was never written fails closed |
| **C02** | **`UNSUPPORTED_COMPLETENESS`**: an omission absent from both the listing and a self-derived catalog is undetectable. Only the predeclared catalog catches it, as the contrast control shows. Never a success claim |
| C03 | The same itemKey in a different library or owner gets a distinct compound id. Each of these is a `DEFINITE_FAILURE` with nothing published: cross-owner reference, dangling reference, normalised duplicate id, compound-identity mismatch |
| C04 | Two writers update the whole Note and ReadingStatus: one `CONFIRMED`, one `CONFLICT`; the whole note comes from one writer. A partial note and a fourth reading state are refused |
| C05 | Relink + history and Project deletion + own Associations each commit together. Global Note, Quote, Paper and Status, and another project's Important, are kept. Deleting a project without its associations, and relinking without history, are refused |
| C06 | A crash before publish gives UNKNOWN, then reconciles to `DEFINITE_FAILURE`. A crash after publish but before ACK gives UNKNOWN, then reconciles to `CONFIRMED`. Same opId is a replay; other intent is a `CONFLICT`; no auto retry |
| C07 | Export pinned at K while a writer commits K+1 matches the K oracle. A K+1 cut against the K oracle gives `MIXED_OR_WRONG_REVISION` |
| C08 | A valid old archive is blocked with `RESTORE_BLOCKED_STALE_DELETION_STATE` by the newer witness (deletion at 2, archive at 1). Globals are kept. A post-deletion archive stages |
| C09 | Missing witness, a witness in the same trust domain as the archive, a rolled-back witness, and a witness lacking a confirmed deletion all give `DELETION_WITNESS_UNVERIFIABLE` |
| C10 | A recomputed plain checksum, owner/AAD mismatch and a wrong key give `ARCHIVE_AUTHENTICATION_FAILED`. A lost key gives `KEY_UNAVAILABLE`, never treated as an empty note |
| C11 | Staging restores the five-field UTF-8 Note byte-exactly into a fresh namespace. Half-restore, path-traversal id, bad schema and foreign owner all fail. `cutover()` is refused. The active digest is unchanged |
| C12 | No network, process or fs import in `src`; no key, token or PDF bytes; local drafts are never exported; egress trap = 0. The git whitelist is checked by `check.mjs` |
| T01 | A crash at each of the four barriers leaves records, catalog and witness either all visible or none. The commit is visible only after the publish barrier |
| T02 | A crash after durable commit but before ACK gives UNKNOWN, then the witness shows `CONFIRMED`. Same opId with a different fingerprint gives `CONFLICT`. An identical replay causes no duplicate write |
| T03 | Write skew (Project delete vs a new Association) is aborted in both orders; the other order gives `CONFLICT`. Independent Relink and Note commits are serial-equivalent |
| T04 | Export pinned at K, with three writers committing K+1..K+3 mid-export, is byte-identical to a quiet export of K |
| T05 | An engine rollback to K=1 is detected by the outside witness (`STORE_ROLLBACK_DETECTED`). The internal log alone is refused as T3 |
| T06 | A conflict is a definite `CONFLICT`, even with a crash hook armed. A new intent may proceed. An ambiguous ACK is reconciled, never re-sent |
| T07 | An external manifest failure after a good internal commit gives `MANIFEST_WRITE_FAILED`; data stays intact and the result is `NOT_RESTORE_CERTIFIED`. A successful fixture manifest is still not a certificate |
| R01 | A stale archive is blocked; shared Note, Quote, history and Status are kept; active is unchanged |
| R02 | A removed or replayed witness, and a joint store + witness replay, are caught through the last-seen sequence and give `UNVERIFIABLE`. An intact witness exposes the store rollback |
| R03 | A crash between deletion and witness, in either order, is never `CONFIRMED`; the intent is quarantined and restore gives `RECONCILIATION_PENDING` |
| R04 | Staging gives exact count, revisions and bytes, and ordered history. Missing linked history gives `INVALID`; active is unchanged |
| R05 | Wrong key version and lost key give `KEY_UNAVAILABLE`; wrong owner gives `AUTH`; a stale but valid manifest gives `STALE`. No key-regeneration export exists |
| R06 | A crash at staged record 7 gives `STAGE_FAILED`. Concurrent restores use separate namespaces. There is no cutover and no active write |
| R07 | An erasure request without a decided policy gives `POLICY_DECISION_PENDING`. There is no numeric retention period in the model |

## 4. Mutation (disposable copies under `os.tmpdir()`; tracked files unchanged)

| Mutant | Class | Intended oracle (kill reason) |
|---|---|---|
| M-INV | known inventory omission accepted | A36-C01 known omitted ID detected |
| M-COMMIT | split record / catalog + witness publish | A36-T01 no partial publish at barrier |
| M-HISTORY | Relink published without history | A36-C05 relink without history rejected |
| M-CAS | read-set / write-skew check removed | A36-T03 write skew aborted |
| M-SNAP | export reads K+1 into K | A36-C07 / T04 pinned export |
| M-ACK | false CONFIRMED / DEFINITE_FAILURE on lost ACK | A36-C06 / T02 UNKNOWN |
| M-DELETE | newer deletion watermark ignored | A36-C08 / R01 stale archive blocked |
| M-STAGE | restore writes the active store | A36-C11 separate namespace / active unchanged |
| M-OWNER | cross-owner reference accepted | A36-C03 cross rejected |
| M-NOTE | partial Note accepted | A36-C04 partial note rejected |
| M-HASH | recomputed checksum accepted | A36-C10 recomputed checksum is not authentication |
| M-GLOBAL | deletion cascades into the global Note | A36-C05 / T03 global retained |

All 12 are `KILLED_BY_INTENDED_ORACLE`.

**Note on M-COMMIT:** it publishes a records-only state at every commit, so it also breaks many other cases (15 failing tests). Its declared intended oracle is the T01 assertion, which is observed.

## 5. Limits, NOT_RUN, UNSUPPORTED

- **Physical:** physical durability, a real engine's isolation, multi-process and multi-host behaviour, and power loss are all **UNPROVEN**. Only the deterministic schedules in the tests were exercised; this is not exhaustive interleaving.
- **Completeness:** **Q1e stays `UNSUPPORTED_COMPLETENESS`.** The trusted inventory is a test fixture, and no trustworthy production catalog is shown.
- **Witness:**
  - The witness is a separate *logical* mock domain. It is not an independent store or custody.
  - A store + witness replay is detectable only through an operator-recorded last-seen witness sequence.
  - There is no cross-store atomicity between deletion and witness. R03 shows the safe outcome: quarantine, not `CONFIRMED`.
- **Fixture-only:** the HMAC tag, key ring and deterministic encoding are fixture-only, not a production signature, KMS or canonical profile.
- **Not run:**
  - A36-L01..L09 (L1 route; out of A37 scope)
  - real WebDAV, Nutstore, Zotero, TLS or DNS
  - any database product
  - cutover
  - retention policy
- **Execution-observed P0/P1:** none in the tested scope.

## 6. QA instructions (INDEPENDENT_G3_QA_PLAN)

1. **Preflight.** Use a separately user-opened QA window, not a sub-agent of this session.
   - Fresh clone; `git ls-remote` must exit 0 and return the final SHA from the QA_REQUEST; detach there.
   - Verify: base `1dd8b51` is an ancestor; 0 merges; the new PR is OPEN and not merged; **every changed path is on the A37 whitelist**; PR #2 is untouched.
   - A first-access failure gives `G3_INDEPENDENCE_PENDING`, then STOP.
2. **Run** `node --check` on every new JS file, `node --test poc/q1e-l3/test/*.test.mjs` (×5 as separate processes if claiming ×5), `check.mjs` and `mutation-check.mjs`, from the repo root.
3. **Build your own** fixture and expected inventory, barriers and schedules, and your own **8+ mutants** (M-INV, M-COMMIT, M-HISTORY, M-CAS, M-SNAP, M-ACK, M-DELETE, M-STAGE) in disposable copies. Also verify zero prototype sockets.
4. **Post the QA_REPORT on the new L3 PR**, with:
   - `Q1E-L3 LOCAL_MODEL_STAGE = PASS / PARTIAL / FAIL`
   - `G3_INDEPENDENCE = VERIFIED / PENDING`
   - all 26 cases accounted for individually
   - `MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN / Q1e UNSUPPORTED_COMPLETENESS / BACKUP_NOT_RESTORE_CERTIFIED`
   - at most `PASS_MODEL_ONLY_CANDIDATE_FOR_D007_A38`

   Then QA STOP.

**EXECUTION STOP. New L3 PR OPEN / NOT MERGED. PR #2 untouched.**


## 7. A44 minimal remediation — measured Execution evidence (2026-11-24 · LOCAL / SYNTHETIC / MODEL_ONLY)

**Authority:** D007-A45 at Design `main` @ `281c6b9e819d8642ae266f08fb2564b8d7098a17`, binding A44 design/source `684121fcf92adac48e0f0b68d0c319ed1fb2551b`, plus the A45 work order and independent QA plan. This section is appended; every earlier byte above is retained unchanged.

| Field | Value |
|---|---|
| PR / branch | **#4**, `OPEN / NOT MERGED`, `exec/Q1E-L3-synthetic-transaction-feasibility` |
| Immutable original base | `1dd8b51f84921d23dc0112e4056fa7220bbb73e8` |
| A44 remediation START | `49cb8d264fa7c9d76705e03161421149a4557167` |
| Final head | carried in the PR #4 EXEC_REPORT and QA_REQUEST — deliberately **not** embedded here (no self-referential guess) |
| PR #2 | untouched at `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5` |
| Runtime | **Node v22.23.5**, Windows 10.0.19045 x64, git 2.49.0; built-ins only, zero dependencies |

**Changed paths vs START (whitelist only):** `poc/q1e-l3/src/recovery.mjs`, `poc/q1e-l3/test/l3-contract.test.mjs`, `poc/q1e-l3/test/l3-faults.test.mjs`, `poc/q1e-l3/scripts/mutation-check.mjs`, `poc/q1e-l3/README.md`, new `poc/q1e-l3/evidence/A44-*`, and this append-only file.

**Protected blobs unchanged:** `snapshot.mjs` `b2d6c0dbfaab6edc0cb8ffcd85883803f7090fbf`, `model.mjs` `8ba2572ef4fe725a926b774e6c6520d6f7f8b21f`, `scripts/check.mjs` `a58135dd28813e0d61906862086793ac8bc25be0`; the previous QA_HANDOFF blob `38de9db72e9bf7c0bb93158ce8718250ce5d8643` is preserved as the exact raw prefix of this file.

**Measured results:**

| Command | Exit | Result |
|---|---:|---|
| `node --test poc/q1e-l3/test/*.test.mjs` × **5 separate processes** | 0 ×5 | **30 / 30** each (prior 27 preserved + 3 additive A44 tests) |
| `node poc/q1e-l3/scripts/check.mjs` | 0 | 26/26 A36 cases mapped, whitelisted paths only, 0 merges, 0 secrets, 0 dependencies |
| `node poc/q1e-l3/scripts/mutation-check.mjs` | 0 | **14 executed, 14 killed by intended assertion, 0 survivors, 0 wrong-reason, 0 not-run** (original 12 unchanged; new `M-ANCHOR-BYPASS`, `M-SNAP-HEAD`) |
| `node --check` on the four changed JS files | 0 ×4 | syntax clean |

- `P2-L3-QA-1`: `stageRestore` now requires an explicit non-negative safe-integer `minWitnessSeq`; absent/invalid anchors return `DELETION_WITNESS_UNVERIFIABLE` / `ROLLBACK_RESISTANCE_UNVERIFIED` / `stage:null` before reconciliation, rollback comparison and staging, with zero staging callbacks and no active/witness mutation.
- `P2-L3-QA-2`: no `snapshot.mjs` change; additive `A44-C07-HISTORICAL-K` verifies a K1 export after K2/K3 commits against a predeclared owner-scoped oracle, byte-exactly and without later-state leakage.
- Evidence files: `evidence/A44-results.json`, `A44-check.txt`, `A44-mutation.txt`, `A44-full-suite-run1..5.txt`.

**Known limits:** an explicit numeric floor does not prove operator origin or latest-deletion freshness; `MODEL_ONLY` / `PHYSICAL_DURABILITY_UNPROVEN` / `UNSUPPORTED_COMPLETENESS` / `NOT_RESTORE_CERTIFIED`; no real T3, no cutover, no cross-platform claim, no G4.

**EXECUTION STOP — awaiting the separately user-opened independent G3 on the exact final PR #4 SHA. PR #4 OPEN / NOT MERGED; PR #2 untouched.**
