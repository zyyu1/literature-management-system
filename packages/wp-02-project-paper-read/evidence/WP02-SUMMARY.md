# WP-02 Execution evidence summary (sanitized; Execution self-test — NOT independent QA)

- **Code commit under test:** `1da0a752f480c3b2844ac9005cf312343082fc5c` on `exec/WP-02-project-paper-read`. Its parent is Base `a0fb04f6d03ac81bbcb35800318c927e278e8b92`. Later commits add only `evidence/**` and `docs/handoffs/WP-02/QA_HANDOFF.md`.
- **Host:** cloud Linux session (Linux 6.18.44 x86_64), Node `v22.23.5` (linux/x64).
- **Fixtures:** both read-only and unchanged.
  - `wp02.v1.json`: SHA-256 `c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888`, blob `f1958fd2…af0`, 4989 B. The SHA was checked both from Base and from the working tree.
  - `wp01.v1.json`: SHA-256 `86c47a5a…be65`.
- **WP-01:** `packages/wp-01-synthetic-auth-api/**` is byte-identical to Base. `git diff` against Base is empty, and `test/wp01-regression.test.mjs` checks a SHA-256 manifest of all 19 files.
- **Egress (A54/A55):** the tools were taken from `origin/main@47a3f617e0656832791138bd7f3183bb5f61746f`, and their blobs equal Base.
  - Blob SHAs: `run-offline.sh` `2d06bfc3aee1c1d9b3a8e67fd93e483bc8b1fb20` (A55-hardened `env -i`), `lo-up.py` `55b45a36…1454`, `egress-probe.mjs` `fceeea89…d662`.
  - Probe: `EGRESS_PROBE=PASS`, exit 0 (`WP02-egress-probe.txt`).
  - Every suite and the mutation driver ran inside `run-offline.sh`. Git ran outside the namespace.

## Five independent runs (clean tree at `1da0a75`; separate processes)
| Run | WP-02 exit | WP-02 tests/pass/fail | ms | WP-01 exit | WP-01 tests/pass/fail | ms |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 43/43/0 | 1763 | 0 | 67/67/0 | 808 |
| 2 | 0 | 43/43/0 | 1869 | 0 | 67/67/0 | 849 |
| 3 | 0 | 43/43/0 | 1800 | 0 | 67/67/0 | 902 |
| 4 | 0 | 43/43/0 | 1779 | 0 | 67/67/0 | 1001 |
| 5 | 0 | 43/43/0 | 1914 | 0 | 67/67/0 | 838 |

- The WP-02 suite also contains a nested WP-01 67/67 run (Q2-11). The WP-01 suite was additionally run on its own in each of the five runs.
- Raw TAP: `WP02-node-test-run{1..5}.tap` and `WP01-regression-run{1..5}.tap`.
- `node --check src/server.mjs` exited 0.
- Local requests per WP-02 run: 195, plus the nested WP-01 run (about 150). Both are under the 5000 cap.

## Coverage (run 1)
- **Tests per file:**
  - auth-neutral 6
  - identity 7
  - projects-list 6
  - readonly 5
  - scope-associations 7
  - transport 10
  - wp01-regression 2
- **Titles per Q:**
  - Q2-01 3
  - Q2-02 3
  - Q2-03 5
  - Q2-04 3
  - Q2-05 2
  - Q2-06 4
  - Q2-07 3
  - Q2-08 2
  - Q2-09 1
  - Q2-10 7
  - Q2-11 2

  Q2-08 is also enforced by the harness, which asserts digest equality on teardown for **every** server instance.

## Mutation (committed driver `scripts/mutation-check.mjs`; 13 mutants; `WP02-mutation.txt`)
The unmutated baseline passed. Every mutant was KILLED **by its named test**, for 13/13:
- **M01:** title/DOI merge
- **M02:** itemKey-only identity
- **M03:** `important` made global
- **M04:** foreign Project leaked
- **M05:** archived hidden from detail
- **M06:** 404 for missing versus 403 for foreign
- **M07:** DELETE mutates state
- **M08:** CRLF→LF + trim on the note
- **M09:** 401 for ANONYMOUS
- **M10:** the active filter includes archived Projects
- **M11:** Workspace denied
- **M12:** re-import duplicates a link
- **M13:** dot allowed in `libraryId`

This includes all 8 mutant kinds named in QA_INSTRUCTION. It is Execution-side and not independent; QA writes its own mutants.

## Not run / unsupported
- UI, Zotero import or API, writes, real identity, durable storage, devices, real TLS or browser.
- Fail-closed behaviour outside the namespace is designed but deliberately not executed (A54 §3.4).
