# D007-A87 — WP-04-R1 G2 ACCEPTED; independent G3 released (DEC-29=A)

**Design ruling — 2026-11-27 Europe/Berlin.** Observed parent `main@852039cb9cd9b62ef5cdf3a1717942599af7fb4c`. Acted on explicit user poll (polling resumed 09:42). Receipt, ruling and user decision in one commit (A47 R1).

## 1. Evidence received
- [Execution28](https://github.com/zyyu1/literature-management-system/blob/f99dec2/docs/bus/EXECUTION_TO_QA.md) (`f99dec2`) and [Execution29](https://github.com/zyyu1/literature-management-system/blob/852039cb9cd9b62ef5cdf3a1717942599af7fb4c/docs/bus/EXECUTION_TO_QA.md) (`852039c`), both `re=MANAGEMENT_TO_EXECUTION.md@44`, STOP, no QA dispatch.
- [PR #8](https://github.com/zyyu1/literature-management-system/pull/8): OPEN, non-draft, mergeable clean, 2 commits, final exact HEAD **`f951f717f7c833fdd00ffbe602bbd6d08ed5a390`**. G2 report [#7202444023](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7202444023) (evidence at `6056b591e719796d40b8806f5b35ad1d498a57f7`) and addendum [#7213804565](https://github.com/zyyu1/literature-management-system/pull/8#issuecomment-7213804565) (full offline rerun at `f951f71`), both read in full, unedited.
- Reported at `f951f71` (A59 Windows offline 08:38:41Z–08:40:18Z, probes 5/5, Node v22.23.5 x64): WP-04 suite 91/91; strict upstream WP-01 67/67, WP-02 44/44 (nested 67), WP-03 103/103; audit `CANDIDATE_SCOPE_OK` (commits 2, approvedAdditions 23, protectedPaths 72); mutation `killed=14/14` (M01–M14 by named assertions). **DEC-27 itemized table present**: groups 1–8, Q4-01..Q4-12, M01–M14, traceability rows each labelled; QA-owned items NOT_RUN as required.

## 2. Design independent G2 checks (static, remote Git)
- Base `bcc4eaad5183c923f782da0475eea1751be2de3b` → `6056b59` → `f951f71`, single-parent chain. `Base..HEAD` = exactly 23 added paths: 22 under `packages/wp-04-research-notes-r1/` + `docs/handoffs/WP-04/QA_HANDOFF.md`; no modification or deletion. `6056b59..f951f71` changes only `QA_HANDOFF.md`.
- HEAD 266 paths; only executable is Base's `tools/offline/run-offline.sh`; no symlink.
- Q4-12 pins **72 file blobs** (WP-01 20, WP-02 26, WP-03 21, `tools/offline` 3, two fixtures) plus 4 directory names; all 72 equal Base.
- `package.json`: private, module, engines 22.23.5, empty dependencies, `"test": "node --test"`; audit and mutation scripts in `scripts/` (outside test discovery).
- No environment-variable waiver: `process.env` appears only for child env copy and a proxy-absence assertion.
- Egress guard `assertPlatformEgressPrecondition()` runs at module load in `support/harness.mjs` (imported by all Q4-01..Q4-11 files), in Q4-12 and in the mutation driver before scratch/child work.
- No `normalize`/field `trim`/newline rewrite in `src/`; `trim` only on metadata emptiness and header parsing. Export implements DESIGN §5 order, verbatim field insertion, single trailing LF, `filename*`, reserved names and 120-byte cap.

## 3. Findings (non-blocking)
- INFO-1: when a paper has no title/authors/year/DOI lines, the export emits one extra blank line after the H1 (DESIGN §5 does not define that case). Not a defect; G3 should record the observed bytes.
- INFO-2: syntax group ran outside the offline interval (static only, labelled NOT_RECORDED for isolation) — accepted.
- INFO-3: design documents are absent from Base by construction; QA reads them from main. `QA_HANDOFF.md` describes evidence commit `6056b59`; the addendum covers `f951f71`.
- Linux NOT_RUN.

## 4. Ruling and user decision
**G2 ACCEPTED at exact `f951f717f7c833fdd00ffbe602bbd6d08ed5a390`.** User selected **DEC-29 = A (release independent G3)** in the Design window (2026-11-27). Board R40 is the task order. G4 remains Design-only; G5 needs a separate decision (combined form per A86 DEC-27). P0-STORE blocked; G6/G7 NOT_AUTHORIZED; A70/A71 suspended.
