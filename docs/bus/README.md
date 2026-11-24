# File bus (D007-A52)

There are four one-writer files, each overwritten whole. Every window polls its inbox every 15 minutes. See [A52](../governance/D007_A52_FILE_BUS_POLLING.md).

| Window | Polls (inbox) | Writes (outbox) | Start prompt |
| --- | --- | --- | --- |
| Design | `bus/QA_TO_DESIGN.md` | `DECISION_BOARD.md` | [DESIGN](../windows/DESIGN_WINDOW_START.md) |
| Management | `DECISION_BOARD.md` | `bus/MANAGEMENT_TO_EXECUTION.md` | [MANAGEMENT](../windows/MANAGEMENT_WINDOW_START.md) |
| Execution | `bus/MANAGEMENT_TO_EXECUTION.md` | `bus/EXECUTION_TO_QA.md` | [EXECUTION](../windows/EXECUTION_WINDOW_START.md) |
| QA | `bus/EXECUTION_TO_QA.md` | `bus/QA_TO_DESIGN.md` | [QA](../windows/QA_WINDOW_START.md) |
