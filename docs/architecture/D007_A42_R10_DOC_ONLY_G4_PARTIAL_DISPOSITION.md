# D007-A42 — POC-001 R10 DOC-ONLY independent G3 / exact-SHA Design G4 PARTIAL disposition

**Design decision — 2026-11-24 Europe/Berlin.** Test subject: **[PR #2](https://github.com/zyyu1/literature-management-system/pull/2)**, branch `exec/POC-001-webdav-feasibility`, immutable original POC merge-base `1c084e5f14e4af8018ef5fe99710be7205cfbdf4`; DOC-ONLY G1 start `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`; **exact final tested SHA `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`**. **G3_INDEPENDENCE=VERIFIED, FIRST_ATTEMPT_PREFLIGHT=PASS, DOCUMENT_BYTES_GATE=PASS; GATE-R10-REG-01=OPEN/NOT_CLOSED; G4 = PARTIAL_NOT_ACCEPTED@a9131ac2521edc50d1c96f90efbf1a987b7bf0d5.** QA's `G4_CANDIDATE=NOT_MET` is upheld. **This is not G4 PASS_LOCAL and does not automatically close P2-R09-QA-1/parent, approve G5 merge, G6 ACCESS-02 or G7 deploy.**

## 1. Authority and independently verified provenance

- Binding [D007-A41 strict single-document G1](D007_A41_R10_HANDOFF_DOC_ONLY_G1_AUTHORIZATION.md), [Execution order](../handoffs/POC-001/R10_HANDOFF_DOC_ONLY_WORK_ORDER.md), [independent QA plan](../handoffs/POC-001/R10_HANDOFF_DOC_ONLY_QA_PLAN.md), and [D007-A40 historical exact-SHA G4 PARTIAL](D007_A40_R10_EXACT_G4_PARTIAL_DISPOSITION.md). A41 Design authority was `main@6a20b1de85492486950103ba03612abfc46a79ac`; the historical G4 A40 was on `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e`.
- [Execution comment #7132496168](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7132496168), [QA request #7132496682](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7132496682), and **[formal separate-window independent QA #7133028128](https://github.com/zyyu1/literature-management-system/pull/2#issuecomment-7133028128)** independently read from GitHub; all refer to exactly `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`, not the earlier R10 `39f34d02`. QA reports first attempted `git ls-remote` exit=0 returning exact SHA, configured host before first call, fresh full clone/detached clean tree, independent document-byte extraction, QA-owned 62 probes and two mutation variants. This **satisfies the A41 first-attempt G3 preflight requirement based on the independent QA's explicit observed report**; no A28 exception/retroactive waiver, no claim of raw external terminal transcript beyond QA's formal GitHub evidence.
- Verified GitHub PR metadata: `OPEN / NOT MERGED`; DOC-ONLY `39f34d02..a9131ac` = **one fast-forward commit, one path, +187/−0**: `docs/handoffs/POC-001/QA_HANDOFF.md` (mode 100644). No `poc/001/**` source/test/fixture/evidence, dependency, CI, historic instruction, frozen Module 002 UI, governance or independent L3 PR #4 change. `poc/001` tree remains `3bd9a2d2f590aa46036b2c110206b44ef22af7f3` on both endpoints as independently reported in formal QA. No source-code remediation is authorized under this G1.

## 2. Independent raw-byte evidence — GATE-R10-DOC-01 exact-SHA PASS

Design directly fetched the **GitHub file content as Base64**, decoded original bytes, and confirmed all of the following, separately from Execution/QA prose:

| Segment | Immutable exact source | Git blob SHA | Raw bytes |
| --- | --- | --- | ---: |
| `B09` original full R09 handoff | `bcc47380deb7c6e48964ca5ca77303a213fade28` | `abec8158235443edbd53ed25ad6369c36c080819` | **11,546** |
| `S` new Markdown history/provenance separator | only in `a9131ac` DOC-only commit | middle span (not separate blob) | **1,200** |
| `B10` full R10 handoff | `39f34d02e1a982ce7ba4be26c30c09c7a2ed663e` | `efc915c46f57fc6ca9c835061b169036256c8a88` | **8,226** |
| **`B_new`** final combined handoff | **`a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`** | **`b50b33478ba5a155068a27054dc34cb2794f295f`** | **20,972** |

**Proven:** `20,972 = 11,546 + 1,200 + 8,226`; final byte array begins **exactly** with all B09 bytes, ends **exactly** with all B10 bytes; only the 1,200-byte middle `S` is new, references both full source commit SHA and blob SHA and contains no future final SHA. R09/R10 historical data, line endings, Unicode and traceability retained. No link-only substitution or altered earlier evidence. **Design adjudicates `GATE-R10-DOC-01=PASS_VERIFIED_EXACT_SHA / CLOSED_LOCAL_DOCUMENT_GAP@a9131ac`.** This closes **only** the narrow document-compliance gate, **not** the parent cleanup risk or G4.

## 3. Independent G3 preflight — gate addressed, with honest scope

Independently user-opened QA reports its **first attempted** branch `ls-remote` succeeded with exit 0/exact full SHA and had **no failed preceding attempts**; configuration occurred before that attempt. New fresh complete clone was non-shallow/clean and confirmed PR REST SHA at beginning/end. **Design adjudicates `GATE-R10-G3-01=PASS_AT_EXACT_SHA / CLOSED_LOCAL_FIRST_ATTEMPT_GAP@a9131ac`**, subject to the formal original QA evidence, with no retroactive compliance claim for the **earlier** failed preflight at `39f34d02`. `G3_INDEPENDENCE=VERIFIED` for this QA session. Neither this gate nor DOC-only PASS means a full G3 `PASS_LOCAL_CANDIDATE` when other mandatory test gates fail.

## 4. Independent full regression **NOT GREEN** — sole current G4 blocker

Independent QA used **Windows 10.0.19045 x64**, **Node v22.23.5**, git 2.49.0/OpenSSL, from the unchanged `poc/001` tree:
- `check.mjs`: 34 files/0 errors; individual POC01–07 and R01–R07 all green; **R08 37/38, exit 1**; R09 11/11, R10 7/7.
- Five independent full-suite processes each contain 209 cases: **208/208/207/208/208**, **exit 1 ×5**. **Never** claim 209/209 ×5 from this report. A one-off isolated re-run is not equivalent to a fully clean process.
- R08-TLS-02 bare Windows absolute-path ESM import has `ERR_UNSUPPORTED_ESM_URL_SCHEME` **5/5**, also reproduced in unchanged START tree 37/38. One run additionally failed inherited R09-Q4B-04 timer with 408-vs-reset; isolated R09 re-run 11/11. These are **credible host/harness/old test portability issues, not evidence that the doc-only commit introduced a code regression**, because no code/test source blob changed. They still fail the **strict G3 regression acceptance threshold**.
- `mutation-check`: **85/85 killed**, intended assertions; `secret-scan`: 153 files, zero findings; `npm ls --all` empty. QA's **62/62 own local probes**, two independent mutants killed. Preserved model-level R10-CLEAN-01 early PROPFIND refusal at 0/20,1/20,19/20; `75+20+1=96` and `79+20+1=100`, 101st denied, 412 residual/401/429 STOP/UNKNOWN non-retry observed.
- The **required supported Linux Node v22.23.5 independent clean 209/209×5 proof is NOT_RUN**, not implicitly PASS. **Windows portability is NOT_CERTIFIED**; a later green supported-Linux result would only certify that environment, not fix Windows ESM-case portability.

**Design adjudicates `GATE-R10-REG-01=OPEN / REGRESSION_NOT_GREEN / LOCAL_G4_HARD_BLOCKER`; `G4_CANDIDATE=NOT_MET`**. Neither a no-code-change proof nor a shared node version can waive this explicit gate. Full green run is a further evidence dependency, not automatically authorized code/test change.

## 5. Precise risk/gate disposition and non-expansion

| Gate / risk | D007-A42 ruling |
| --- | --- |
| **A41 DOC-only G1** | Historical **`AUTHORIZED_DOC_ONLY_HISTORICAL_APPEND`**, single change completed/Execution STOP; **no additional edit is authorized** |
| **G3 independence / first-attempt** | **`VERIFIED / PASS_VERIFIED_EXACT_SHA`** for the separate new QA on `a9131ac`; prior `39f34d02` preflight remains historical nonconformance |
| **GATE-R10-DOC-01** | **`CLOSED_LOCAL_DOCUMENT_GAP@a9131ac`**; byte-perfect R09+separator+R10 history verified |
| **GATE-R10-G3-01** | **`CLOSED_LOCAL_FIRST_ATTEMPT_GAP@a9131ac`**; no retrospective waiver |
| **GATE-R10-REG-01** | **`OPEN / INDEPENDENT_5x209_NOT_GREEN`**, current G4 blocker |
| **A42 G4** | **`PARTIAL_NOT_ACCEPTED@a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`**; not unconditional PASS_LOCAL |
| **P2-R09-QA-1** | **`OPEN / LOCAL_FIX_EVIDENCED_AT_PRIOR_R10_SHA_AND_UNCHANGED_CODE / NOT_G4_CLOSED`**; no new product defect alleged |
| **P2-R08-QA-1** | **`OPEN / PARTIALLY_REMEDIATED`**; parent cleanup gate not globally closed |
| **P2-R08-QA-2 B5 / P2-R08-QA-3 Q4b** | Historical `CLOSED_LOCAL_TEST_GAP@bcc47380` only; old scopes retained |
| **INFO-1 / C9** | **INFO**, excluded from any new repair |
| **Concurrent in-flight DELETE finality** | **`UNSUPPORTED`**, only sequential loopback schedules observed |
| Q1e / backup / live provider / ACCESS-02 | **`UNSUPPORTED_COMPLETENESS / NOT_RESTORE_CERTIFIED / NOT_RUN / BLOCKED`** |
| G5 / G6 / G7 | **`MERGE_NOT_AUTHORIZED / ACCESS-02_BLOCKED / DEPLOYMENT_NOT_AUTHORIZED`** |
| Overall | **`POC-001=BLOCKED_REAL_SERVICE`**; PR #2 and independent PR #4 stay OPEN / NOT MERGED |

**P0/P1/P2:** QA found none **within new DOC-only delta**; do not infer all historic P2s closed or all production risks absent.

## 6. Next independent choice, **NOT authorized by A42**

**Preferred option, subject to user approval:** assign Management a **READ-ONLY new user-opened independent QA on the same exact PR #2 SHA `a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`** using a verifiably supported **Linux + Node v22.23.5** host. Fresh window, first attempted remote `ls-remote` succeeds with exact head, fresh full clone, no repository writes; independently run 17 suites, five separate **209/209 exit-0** full suites, 85 intended mutations, secrets/dependency checks, QA-owned R10 probes and document history byte integrity. Document host/Node configuration and all NOT_RUN. Direct new PR #2 QA_REPORT; Management returns to Design, Design first commits a new verified Handoff receipt then performs a **separate exact-SHA G4**. No branch/PR/content amendment, no new code G1 required for a purely read-only QA check, but user must approve the separate QA dispatch before Management starts. If Linux host is unavailable, report `ENVIRONMENT_BLOCKED / NOT_RUN`, do not relax 209/209 requirement.
 
**Alternative separate design task:** investigate Windows ESM-path portability/testing policy; **requires distinct user-approved scope** before altering earlier tests/CI (not part of A41). Or defer R10 with G4 PARTIAL while moving to independent L3-design work.

**A42 FINAL: two narrow documentation/preflight gates satisfied on exact SHA, regression still not green, new G4 PARTIAL_NOT_ACCEPTED, P2 open, no G5/G6/G7 or new code/document G1.**