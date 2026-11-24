# D007-A52 — File bus with 15-minute polling (all four windows)

**User instruction, 2026-11-24 16:51 Europe/Berlin, in the Design chat.** Observed parent `main@17e0471`. GOVERNANCE ONLY. This document extends [A51](D007_A51_DECISION_BOARD_WORKFLOW.md) and replaces the PR-comment transport of [AUTOMATION_BUS](AUTOMATION_BUS.md), which is now historical. Gates are unchanged.

## 1. Loop
```
Design ──DECISION_BOARD.md──▶ Management ──(user decides here)──▶ MANAGEMENT_TO_EXECUTION.md ──▶ Execution
   ▲                                                                                       │
   └──────────── QA_TO_DESIGN.md ◀── QA ◀── EXECUTION_TO_QA.md ◀─────────────────────────────┘
```
| File (on `main`) | Writer (only) | Reader |
| --- | --- | --- |
| [`docs/DECISION_BOARD.md`](../DECISION_BOARD.md) | Design | Management |
| [`docs/bus/MANAGEMENT_TO_EXECUTION.md`](../bus/MANAGEMENT_TO_EXECUTION.md) | Management | Execution (and Design, for the user's choices) |
| [`docs/bus/EXECUTION_TO_QA.md`](../bus/EXECUTION_TO_QA.md) | Execution | QA |
| [`docs/bus/QA_TO_DESIGN.md`](../bus/QA_TO_DESIGN.md) | QA | Design |

## 2. File rules
- Every file starts with one header line. Example:
  `<!-- BUS from=<ROLE> to=<ROLE> seq=<n> re=<inbox file>@<seq> status=<OPEN|WAITING|DONE|STOP> updated=<ISO time> -->`
- **Whole-file overwrite.** Each new message raises `seq` by 1. History lives in git only.
- **Single writer.** A window writes only its own outbox file.
  - Commit message: `bus(<role>): seq <n>`.
  - Push to `main` without force. If the push is rejected, run `git pull --rebase` and retry. This cannot conflict, because the window touches only its own file.
  - Never edit another window's file or any other path on `main`. Execution still commits code only on its work branch.

## 3. Polling (each window sets its own timer)
- **Every 15 minutes:** fetch `main` and read your inbox file.
- **If its `seq` is greater than the `re=` in your own outbox:** handle it, overwrite your outbox with `re=<inbox>@<seq>`, and push.
- **Otherwise:** do nothing and re-arm the timer.
- **Idle cut-off:** stop polling after **8 hours** with no new inbox message, and tell the user. The user restarts the timer by saying "继续轮询".
- **Timers live in each window's own session.** Use a one-shot self-reminder that is re-armed after each run. A fresh-session cron is not used, because it would lose the window's context.
- No background action may go beyond the scope written in the inbox file.

## 4. Role duties
- **Design:** read `QA_TO_DESIGN.md` and verify it against the original PR comment and SHA on GitHub. Then rule G4 in a decision file and overwrite `DECISION_BOARD.md` with the next round: status, DEC-n options with a dispatch for each option, and in-flight tasks.
- **Management:** read `DECISION_BOARD.md` and ask the user each DEC-n as clickable choices. A user who is away is not a choice; keep asking on the next poll. Then write `MANAGEMENT_TO_EXECUTION.md` with:
  - the user's choices (`DEC-n=<letter>`);
  - the authority file;
  - Base, branch and whitelist;
  - the QA plan file.
  Management cannot grant G1 or widen scope.
- **Execution:** act only on `MANAGEMENT_TO_EXECUTION.md`. Work on the named branch, open or update the PR, then write `EXECUTION_TO_QA.md` with:
  - the PR number and exact SHA;
  - the Execution report comment ID;
  - the **QA plan file named by Design**, copied as a path only.

  **Execution does not write QA test content.** This keeps QA independent.
- **QA:** a separately user-opened cloud Linux session with Node v22.23.5 (A47 R4). Act only on `EXECUTION_TO_QA.md`, following the Design QA plan it points to. Post the full QA_REPORT as a PR comment, then write `QA_TO_DESIGN.md` with:
  - the PR, exact SHA and QA comment ID;
  - the verdict;
  - key numbers;
  - P0, P1 and P2 findings.

## 5. Safety
- **Unclear or out-of-scope messages:** if a message is unclear, out of scope or contradicts a gate, the window writes `status=STOP` with a reason in its outbox and tells the user.
- **Unchanged gates:** exact-SHA independent QA; G4 by Design only; G5 merge, G6 real service and G7 deploy each only through an explicit DEC that the user chooses.
- **No sensitive data:** no secrets or real data in any bus file.
