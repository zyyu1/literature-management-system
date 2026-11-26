# WP-04-R1 — Independent QA instruction (DRAFT)

Authority: [A85](../../architecture/D007_A85_WP04_R1_G1_DRAFT.md) and [DESIGN.md](DESIGN.md), only after DEC-25=A, a fresh Management dispatch, Execution's PR and a Design G2 scope review that releases G3. Not before.

## 1. Environment and preflight (same standard as WP-03 QA15/QA17)

- Independently opened QA session and directory; never a shared clone with Management or Execution. Windows x64 (A59) or eligible Linux x86_64 (A54/A55); Node exactly v22.23.5 x64. Linux NOT_RUN if not exercised.
- First and only exact remote ref read of the PR head: exit 0, command/time/stdout/stderr saved, no retry waiver. Command-local TLS (OpenSSL + existing CA/helper, verification on).
- Fresh full detached clone, `core.autocrlf=false`, clean. Base `bcc4eaad5183c923f782da0475eea1751be2de3b` is an ancestor; Base..HEAD has single-parent commits only, no merges; changed paths only within the DESIGN §1 whitelist, all added; Base blobs outside the whitelist unchanged; fixture bytes and SHA-256 exact.
- Imports: Node builtins, the package's own relative files and read-only exported WP-01/02/03 modules only. Zero new dependencies, no lockfile, no credentials or real data.
- Offline boundary: loopback positive; external/LAN IPv4, IPv6, UDP and DNS negatives with OS evidence before and after every group; all descendants inside; all children end before reconnect. No host/network change, install or privilege escalation. Unavailable → STOP.

## 2. Groups (one deterministic run each; actual counts reported; zero fail/skip/todo/cancelled)

1. Syntax: `node --check` on every `.mjs` in the package.
2. WP-04 suite: `cd packages/wp-04-research-notes-r1 && node --test` — all Q4-01..Q4-12 present by name and passing.
3. Upstream strict regression: WP-01 67/67, WP-02 44/44 (nested 67), WP-03 103/103, independently parsed with a QA-authored strict TAP oracle (not only the candidate's parser).
4. Candidate audit: `node scripts/verify-candidate-scope.mjs` → OK on the clean clone; plus at least: extra path, modified Base path, modified protected blob, untracked file, mode change and symlink-type negatives each rejected with the intended reason.
5. Independent raw HTTP probes (QA-written client): owner with two Sessions, Workspace, foreign owner, anonymous; two-client CAS race; replay race; real socket drop → client UNKNOWN; neutral 403 byte/header identity; no note text in logs.
6. Byte-fidelity oracle (QA-derived from the frozen fixture, not Execution's expectations): fixture note GET bytes; PUT/GET/export round-trip of a QA vector containing CJK, combining marks, emoji, `$…$`, `$$…$$`, `\(…\)`, fenced code, TAB, CRLF, lone CR, trailing spaces and empty fields; compare SHA-256 of each field and of the export body against an independently built expected export per DESIGN §5.
7. Mutants: run the committed driver (all named mutants killed) **and** at least six independent QA scratch mutants from DESIGN §8 (must include NFC normalization, CRLF→LF, per-field partial write, saved-on-UNKNOWN, cross-library note sharing, export-mutates-revision); each killed by its intended assertion; patch, command and exit recorded; no mutant committed.

## 3. Traceability

A5-02..05/07, A6-03/04, A7 non-cascade, E9-04/07 and U6-L2-06, U6-L3-01/05, U6-L4-02/04 at contract level only (no UI, no draft recovery, no Typora run). Report by actual test IDs; list NOT_RUN items explicitly (Linux if not run, local drafts, UI, Typora, real storage).

## 4. Report

New PR comment at the exact head: environment and probe map, per-group commands/counts/exits, raw TAP digests, mutant table, P0/P1/P2 findings, NOT_RUN list. Then QA bus next seq (or latest+1) and STOP. Any cross-scope leak, partial/merged field write, byte change, stale overwrite, duplicate dispatch, false Saved, UNKNOWN treated as definite, export side effect, protected diff, failed upstream suite, unsafe network or missing mandatory group → FAIL/STOP. No candidate change by QA. G4 is Design only; G5 needs a separate DEC.

## 5. Itemized reporting (A86 DEC-27, binding)
The PR comment must contain one row per item: each Q4-01..Q4-12 test name, each group in §2, each audit negative, each committed and QA mutant, each traceability ID claimed — with `PASS` (actual input/assertion/exit), `FAIL`, `NOT_RUN` or `NOT_RECORDED`. Aggregate PASS alone is incomplete and will be returned for the table only.
