# P0-STORE Phase 1 — Execution QA handoff (template, no evidence recorded)

**Status: TEMPLATE_ONLY. No offline run, mutation result, audit result or upstream count is recorded
in this file yet.** Every evidence cell below is `NOT_RECORDED` and must be replaced only with an
observed value from the later authorized offline interval. Nothing here is a prediction or a claim.

## 0. Authoritative documents are not present in Base

`docs/handoffs/P0-STORE/DESIGN.md` and `docs/handoffs/P0-STORE/QA_INSTRUCTION.md` were added later on
`main`; they are **not** in Base `663556bc68dc0472f2f392f09ca4bee7c668d2f5`. The same holds for the
A90 route design added on `main`. QA/Design must read all three from `main` (or a later docs-only
commit on `main`), read-only. This candidate adds only `packages/p0store-nutstore-probe/**` and this
handoff file; it does not copy, move or restate those authorities.

## 1. Execution point (facts fixed before the run)

| Field | Value |
| --- | --- |
| Repository | `zyyu1/literature-management-system` |
| Base | `663556bc68dc0472f2f392f09ca4bee7c668d2f5` |
| Branch | `exec/P0STORE-nutstore-probe-r1` |
| Candidate commit SHA | `NOT_RECORDED` (no commit was created in the execution step that authored these files) |
| Commit shape | `NOT_RECORDED` |
| Base tree → HEAD tree | expected 275 → 303 paths; `NOT_RECORDED` until the audit runs |
| Runtime | Node exactly `v22.23.5` x64; executable digest `NOT_RECORDED` |
| Authority | A90 §3 Phase 1/§4/§5/§6, P0-STORE `DESIGN.md`, `QA_INSTRUCTION.md` (read from `main`) |
| Package | `packages/p0store-nutstore-probe/` (new, isolated) |
| Mode | `LOCAL_MOCK_ONLY`: loopback HTTPS mock only; no real host, account, credential, data or live request |

## 2. Offline interval and egress proof (fill in only from the authorized run)

| Item | Value |
| --- | --- |
| Offline interval start/end (UTC) | `NOT_RECORDED` |
| A62 egress precondition result | `NOT_RECORDED` |
| Independent egress probe result | `NOT_RECORDED` |
| All children terminated inside the interval | `NOT_RECORDED` |
| Loopback-only proof (mock binds 127.0.0.1, zero socket attempts on every live refusal) | `NOT_RECORDED` |

## 3. Exact command list (run inside the offline interval, from the package directory)

`node` means the pinned Node `v22.23.5` x64 executable. Replace the placeholder paths only with the
actual checkout paths used for the evidence run.

```powershell
cd <checkout>/packages/p0store-nutstore-probe
Get-ChildItem -Recurse -Filter *.mjs | ForEach-Object { node --check $_.FullName }
node --test
node scripts/mutation-check.mjs
node scripts/verify-candidate-scope.mjs
```

Do not run `node --test`, the mutation driver or the audit online: the frozen A62 guard fails closed
with `EGRESS_PRECONDITION_FAILED` and that is not a suite result.

## 4. Evidence table (all NOT_RECORDED until the authorized run)

| Item | Command | Observed |
| --- | --- | --- |
| Syntax (all package `.mjs`) | `node --check` per file | `NOT_RECORDED` |
| Package suite | `node --test` | `NOT_RECORDED` |
| P1-01 plan loader | same suite | `NOT_RECORDED` |
| P1-02 gate pinning/verbs/canonical/zero egress | same suite | `NOT_RECORDED` |
| P1-03 TLS wrong CA/CN/expired + redirect STOP | same suite | `NOT_RECORDED` |
| P1-04 budget window/reserve/caps/writers | same suite | `NOT_RECORDED` |
| P1-05 secret isolation and missing-secret refusal | same suite | `NOT_RECORDED` |
| P1-06 strong → full L0–L12 GO, budget, empty namespace | same suite | `NOT_RECORDED` |
| P1-07 lost-update/create-overwrite → NO-GO + STOP | same suite | `NOT_RECORDED` |
| P1-08 weak-etag/stale-read → PARTIAL | same suite | `NOT_RECORDED` |
| P1-09 late-ack 3/3; unresolvable → PARTIAL, no retry | same suite | `NOT_RECORDED` |
| P1-10 throttle/5xx/unexpected 401 STOP, uncertain cleanup | same suite | `NOT_RECORDED` |
| P1-11 cross-process race: two PIDs, 5 rounds, one winner | same suite | `NOT_RECORDED` |
| P1-12 live inertness, zero socket attempts, no real host literal | same suite | `NOT_RECORDED` |
| P1-13 strict upstream WP-01 67/67 | spawned `node --test --test-reporter=tap` | `NOT_RECORDED` |
| P1-13 strict upstream WP-02 44/44 (nested WP-01 67/67) | spawned `node --test --test-reporter=tap` | `NOT_RECORDED` |
| P1-13 strict upstream WP-03 103/103 | spawned `node --test --test-reporter=tap` | `NOT_RECORDED` |
| P1-13 strict upstream WP-04 91/91 | spawned `node --test --test-reporter=tap` | `NOT_RECORDED` |
| P1-13 protected inventory 94/94 Base blobs | `git hash-object --no-filters` | `NOT_RECORDED` |
| Mutation driver | `node scripts/mutation-check.mjs` | `NOT_RECORDED` |
| Candidate audit | `node scripts/verify-candidate-scope.mjs` | `NOT_RECORDED` |

## 5. QA-owned rows (independent; still NOT_RUN before G3)

| QA item | Status |
| --- | --- |
| QA-written mock personality matrix and independent verdict/STOP assertions | `NOT_RUN` |
| QA-written strict TAP parser over the four upstream suites | `NOT_RUN` |
| Candidate audit negatives: extra path replacing an approved path, modified Base path, modified protected blob, untracked file, mode change, symlink | `NOT_RUN` (QA-owned scratch proofs) |
| QA egress proof: every missing live precondition and a non-loopback host, zero socket attempts | `NOT_RUN` |
| QA secret-canary scan of traces, logs and errors | `NOT_RUN` |
| QA independent mutants (≥6) | `NOT_RUN` |
| Linux x86_64 run (A54/A55) | `NOT_RUN` |

## 6. Audit-negative rule (binding for the evidence record)

Audit negatives are **count-neutral**. Every per-path check runs before any count check and each
negative fails with its own dedicated reason code (`BASE_PATH_MODIFIED_OR_DELETED`,
`UNEXPECTED_ADDED_PATH`, `PATH_OUTSIDE_WHITELIST`, `MISSING_APPROVED_ADDITION`, `PROTECTED_*`,
`UNEXPECTED_WORKTREE_PATH`, `WORKTREE_MISSING_HEAD_PATH`, `BASE_PATH_MODE_CHANGED_AT_HEAD`,
`WORKTREE_NON_REGULAR_PATH`, `CLEAN_CHECKOUT`). A negative must never be reported as a generic
path-count mismatch. Plan and gate negatives follow the same rule: one dedicated code per condition.

## 7. Fill-in rules

1. Record only observed results. A failed, skipped, timed-out or precondition-failed group is a
   failure, not `PASS`.
2. Keep values sanitized: counts, statuses, template paths, digests and reason codes only. Never
   record a credential, a real host, a real account name, a concrete path containing machine-local
   detail or a response body.
3. The evidence commit SHA is the exact SHA for the G2 report; any later docs-only change on the
   branch must be disclosed as docs-only and must not change the package.
4. Do not record a live/provider result in Phase 1; those rows are always `NOT_RUN` here.
