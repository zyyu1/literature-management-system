# D007-A49 — POC-001 R10 exact-SHA G4: PASS_LOCAL

**Design ruling, 2026-11-24 Europe/Berlin.** Receipt and ruling are in one commit, per [D007-A47 R1](../governance/D007_A47_PROCESS_SIMPLIFICATION.md). Observed parent `main@d122c163ec2d6f3223f085bce38fb17695498d6e`.

## 1. Evidence verified by Design (GitHub REST, independently read)
- [PR #2](https://github.com/zyyu1/literature-management-system/pull/2) is OPEN and unmerged. Its HEAD is **`a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`**, unchanged since [A48](D007_A48_R10_CLOUD_LINUX_READ_ONLY_QA_AUTHORIZATION.md). The PR has 34 comments; the newest is the QA report.
- [QA_REPORT #7136340755](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7136340755), posted 2026-11-24T15:37:31Z, cites A48 at `d122c163` and the exact SHA. It was relayed by Management; the relayed summary matches the original comment.
- **Host:** `Linux x86_64`, Node `v22.23.5`, git 2.43.0. QA ran in a separately user-opened cloud session, so A47 R4 is met.
- **Preflight:** the first remote `ls-remote` exited 0 and returned the exact SHA. QA then made a fresh full clone, checked out the exact SHA detached, and confirmed a clean tree before and after.
- **Diff:** the diff `39f34d02..a9131ac` touches only `QA_HANDOFF.md` (+187). The history has no merge commits, and the merge-base equals the Base.
- **Tests:** `check.mjs` checked 34 files with 0 failures. The full suite passed **209/209 in 5 of 5 separate processes**, each with exit 0.
- **Mutation:** the mutation check ran **85 mutants and killed all 85**, including the R10 guard mutants M83–M85.
- **Supply chain:** secret-scan found 0 issues; `npm ls` shows no dependencies.
- **QA-authored mutants:** QA-M1 (`.some` → `.every`) and QA-M2 (off-by-one) were each killed by a named R10-CLEAN-01 assertion. QA-M3 survived; QA reports it as INFO-2, because no difference is observable at dispatch.
- **Network:** a recorder logged 93,086 network events. All of them were loopback; there were 0 real-service requests.
- **Findings:** QA reported no P0, P1 or new P2. Verdict: `PASS_LOCAL_CANDIDATE`.

## 2. Ruling
| Gate / risk | Before | A49 disposition @ `a9131ac` |
| --- | --- | --- |
| GATE-R10-G3-01 (first-attempt preflight) | PASS (A42) | PASS, confirmed again by A48 |
| GATE-R10-DOC-01 | PASS (A42) | PASS (unchanged diff confirmed) |
| **GATE-R10-REG-01** | OPEN (Windows 208/209) | **PASS — Linux 209/209 ×5** (A47 R4 standard host) |
| **R10 local stage** | A42 G4 PARTIAL_NOT_ACCEPTED | **G4 PASS_LOCAL** (supersedes A40/A42 PARTIAL for this SHA) |
| **P2-R09-QA-1** (early PROPFIND strands 20 files) | OPEN, fix evidenced | **CLOSED_LOCAL @ a9131ac**: fix independently demonstrated (A40 7/7, 62 probes; A48 named kills, 85/85) |
| **P2-R08-QA-1** (cleanup invariant; straggler PUT fixed in R09) | OPEN/PARTIAL | **CLOSED_LOCAL @ a9131ac**: final cleanup invariant now independently accepted |
| INFO-1 (A48 preflight disclosure) | — | INFO, accepted: the earlier command was local only, and the first *remote* attempt still passed |
| INFO-2 (QA-M3 survivor) | — | INFO, accepted. Optional future test: assert the refusal code under 401/429/cap STOP. Not a gate |
| INFO-3 / Windows R08-TLS-02 ESM, R09-Q4B-04 timing | REG blocker | INFO. Windows portability NOT_CERTIFIED (informational per A47 R4). The [A46 portability design](D007_A46_R10_WINDOWS_PORTABILITY_DESIGN.md) is optional |
| INFO-1/C9 (R09 helper) | INFO | INFO, unchanged |

**`CLOSED_LOCAL` scope:** these risks are closed for the local synthetic mock at this exact SHA only. That is not real-provider (Nutstore) evidence. In-flight concurrent DELETE settlement remains **UNSUPPORTED**.

## 3. Unchanged
- **Gates:** G5 MERGE NOT_AUTHORIZED, G6 ACCESS-02 BLOCKED and G7 DEPLOY NOT_AUTHORIZED. Overall POC-001 remains **BLOCKED_REAL_SERVICE**.
- **Backup / Q1e:** Q1e remains UNSUPPORTED_COMPLETENESS and backup remains NOT_RESTORE_CERTIFIED.
- **PR #4 / A45:** the state is unchanged.
- **Frozen UI:** unchanged.

A49 grants no G1 and does not authorize a merge.
