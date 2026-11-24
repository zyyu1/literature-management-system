<!-- BUS from=EXECUTION to=QA seq=1 re=MANAGEMENT_TO_EXECUTION.md@1 status=STOP updated=2026-11-24T17:03+01:00 -->
# Execution → QA

**status=STOP — WP-01 not started: the execution-environment preflight cannot be satisfied on this host.**

## Task received

- inbox `MANAGEMENT_TO_EXECUTION.md` seq=1 (`re=DECISION_BOARD.md@2`): **DEC-1=A**, implement WP-01 per `docs/architecture/D007_A21_WP01_G1_DECISION.md` and `docs/handoffs/WP-01/EXECUTION_INSTRUCTION.md`.
- Fixed values from the dispatch: Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`; new branch `exec/WP-01-synthetic-auth-api`; whitelist `packages/wp-01-synthetic-auth-api/**` + `docs/handoffs/WP-01/QA_HANDOFF.md`; QA plan `docs/handoffs/WP-01/QA_INSTRUCTION.md`.

## Stop reason (environment mismatch, before any code work)

`EXECUTION_INSTRUCTION.md` §2 requires: **Linux x64**, Node.js exact **v22.23.5**, and explicitly `uname -s` = `Linux`, `uname -m` = `x86_64`; it also says "Any mismatch → STOP."

| Check | Required | Observed (2026-11-24 17:03 Europe/Berlin) |
| --- | --- | --- |
| OS | Linux x64 | **Microsoft Windows 10.0.19045 x64** |
| `uname -s` | `Linux` | no `uname` executable on this host |
| `uname -m` | `x86_64` | not available |
| Linux host / WSL | available | **none** — `wsl.exe --list` only prints the install help; no distribution is installed |
| Node runtime | v22.23.5 | portable Node **v22.23.5** is present (npm 10.9.9) — runtime matches, OS preflight does not |
| Base commit | `9cfc1d7375f81ab35921a02eebf1a1c9d941476a` | exists and is an ancestor of current `main` (`a381ee67…`) |
| Branch `exec/WP-01-synthetic-auth-api` | absent before creation | does not exist |

**Governance reading:** A46 §1 keeps a stricter subject-specific OS requirement binding until a separate Design amendment; WP-01's instruction mandates Linux x64 explicitly, and no Design amendment allowing native-Windows execution for WP-01 was found on `main` (A46/A47 permit Windows only for work packages that do not mandate an OS; A47 R4 defines the independent G3 host as cloud Linux). WP-01 additionally requires evidence of an outbound-deny execution boundary that this host cannot demonstrate as instructed.

## What was NOT done

- No branch created; no file written under `packages/wp-01-synthetic-auth-api/**`; no PR opened; no tests run or claimed.
- WP-01 whitelist untouched; PR #2 (`a9131ac2521edc50d1c96f90efbf1a987b7bf0d5`) and PR #4 (`2757aa664e2c12c80716fb291f3e3149f06fcfdd`) untouched.
- Only this bus file is committed, per A52 §5.

## Requested resolution

1. Publish a Design amendment explicitly allowing **native Windows x64 execution** for WP-01 with Node v22.23.5, including how the instructed outbound-deny / egress verification must be evidenced on this host, **or**
2. Provide a **Linux x64** execution host with Node v22.23.5 (and the required local-only network boundary).

Then re-dispatch via a new `MANAGEMENT_TO_EXECUTION.md` seq; Execution will re-run the full instruction preflight (Base, branch, fixture SHA-256, runtime, network boundary) before starting.

## Recorded environment facts (not a PASS)

- Microsoft Windows 10.0.19045, X64; git 2.49.0.windows.1; portable Node v22.23.5 (npm 10.9.9); no `uname`; no WSL distribution; no Linux host available.
