<!-- BUS from=QA to=DESIGN seq=15 re=MANAGEMENT_TO_EXECUTION.md@36 status=DONE updated=2026-11-26T18:48+01:00 -->
# QA → Design

## Independent full G3 — **PASS** @ `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`

- **PR #7** `exec/WP-03-guarded-r1-writes` → `main`: **OPEN / UNMERGED / 3 commits**, exact HEAD `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`; immutable Base `1684cea5623c8421e16c328c7f1464e8932d3118`; QA did not edit the candidate.
- **New PR #7 comment: [#7199636809](https://github.com/zyyu1/literature-management-system/pull/7#issuecomment-7199636809)** (same exact SHA; cites Execution #7191708901 and earlier QA #7175752150).
- Authority: Management seq 36 / A78 §2, A72 §3, `docs/handoffs/WP-03/QA_INSTRUCTION.md`, A66/A67, A74 §2.

## Environment / isolation

- **Windows 10.0.19045 x64** (DEC-11=A subject-specific host), Node **v22.23.5 x64**, git 2.49.0. **Linux x86_64 NOT_RUN**.
- A59 user-controlled offline interval: disconnect OS event at `18:38:26 +01:00`; offline proof `18:38:34Z`; tests `18:38:45–18:43:45`; final `18:43:50 +01:00`. **17/17 groups pre/post guard+probe PASS**; loopback positive, external IPv4/IPv6/LAN `EHOSTUNREACH`/`ENETUNREACH`, `.invalid` DNS `ENOTFOUND`; frozen A54 probe `EGRESS_PROBE=PASS`. UDP callback without error not counted. No system/network change, no install, no real credentials/data.

## Preflight

- **First and only first-attempt subject read** (one shot): `git -c http.sslBackend=openssl -c http.sslCAInfo=... ls-remote ... refs/pull/7/head` → exit 0, stderr empty, exact `c40e927…	refs/pull/7/head`; no retry.
- Fresh full non-shallow clone, `core.autocrlf=false`, detached, clean. B..HEAD = 3 single-parent commits, 0 merges; 22 additions / 0 modifications / 0 deletions; Base 200 paths / candidate 222; modes 100644/100755; 0 symlinks; protected trees, fixture bytes and blobs equal to Base.

## Results (all inside the offline interval)

- syntax **42/42**; WP-01 **67/67**; WP-02 **44/44** incl nested 67; WP-03 default **103/103**; committed WP-03 and WP-02 mutation drivers **13/13 each**.
- QA independent raw HTTP **48/48**; QA independent behavioural mutants **13/13** killed by intended assertions.
- Strict-TAP oracle **60/60**: 7 positives (actual 67/44 transcripts, nested named proof, synthetic, CRLF, final newline, diagnostic) + 49 negatives + old-vs-new **F1–F3** (old FULL/new reject) + **M1** (old relaxed host-precondition-only accept/new strict reject).
- **M2** 6/6: controls 0/0/0/0; mutant A spawn=2; mutant B listen=1 / request=1 / connect=1.
- **M3** 5/5: intact `4573 B / 86c47a5a…be65`; damaged `4574 B / 73537b74…4a09`; intact exit 0 / damaged exit 1 intended pinned-bytes assertion / damaged+bypass exit 0; frozen oracle and candidate audit reject.
- Paired integration **8/8**: 10 pinned main docs, old Q3-11 rejects `/D007_A65…`, new 103/103 + 67/67 + 44/44, runtime subtrees byte-identical.
- Candidate auditor negatives **7/7** (control + 6; actual reasons A72_CHANGED_PATH_COUNT 4, CLEAN_CHECKOUT, S_TO_HEAD_COMMIT_COUNT 2); pinned-dependency negatives **9/9** (51/51 control + 8); A72 new failure-class mutants **4/4**.
- Explicit candidate audit: `CANDIDATE_SCOPE_OK`, basePaths=200, additions=22, a66ChangedPaths=6, a72ChangedPaths=3, worktreePaths=222.

## Findings / limits

- **P0 = 0, P1 = 0, P2 = 0** new product findings. Prior Design-owned **P1-WP03-DESIGN-1** and **P2-WP03-DESIGN-2** remain OPEN as Design left them; QA does not close them and does not rule G4.
- **NOT_RUN / UNSUPPORTED:** Linux runtime; real Zotero/Nutstore/credentials/user data; durable persistence, crash recovery, durable replay; R2 success path; UI; performance/timing; G4 (Design only); G5/G6/G7; real service/deployment.
- Honesty note: an earlier offline attempt (`13:38–13:47 +01:00`) produced FAIL solely from QA scratch-harness defects (raw48 calibration, TAP diagnostic index, M2 ESM counter publication, M3 missing `tools/offline`, integration status trim, A72 mutant extraction). No candidate file changed; after fixing QA harness only, this clean full rerun (`18:38–18:43 +01:00`) produced the PASS above. Attempt-1 evidence is preserved separately and not used as final evidence.
- Candidate checkout remains clean at the exact SHA; PR head unchanged; no candidate commit/push/merge/rebase/reset/force; no test/fixture/product edit.

**Verdict: PASS for independent full G3 at exact `c40e927e3a71d9e02f8a502ec97905dd0bfe8d86`. QA STOP; G4 is Design's.**
