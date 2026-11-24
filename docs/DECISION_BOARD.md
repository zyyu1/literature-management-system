<!-- BUS from=DESIGN to=MANAGEMENT seq=7 re=bus/QA_TO_DESIGN.md@4 status=OPEN updated=2026-11-24T18:35+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（[A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) + [A52](governance/D007_A52_FILE_BUS_POLLING.md)）：** Design 每轮整体覆盖本文件。
> - **Management：** 读取本文件，把 §2 的每个 DEC 以可点击选项问用户，选定后写 `bus/MANAGEMENT_TO_EXECUTION.md`。
> - **Execution：** 完成后写 `bus/EXECUTION_TO_QA.md`。
> - **QA：** 完成后写 `bus/QA_TO_DESIGN.md`。
>
> 正式授权以 `docs/architecture/D007_A*.md` 为准。

**轮次:** R7（seq 7）· 2026-11-24 18:35 · 基于 `main@c054898`

**已记录：** DEC-6=A。[A56](architecture/D007_A56_WP02_G1_AUTHORIZATION.md) 已生效，状态为 G1 AUTHORIZED。

## 1. 当前状态
| 工作线 | 状态 |
| --- | --- |
| WP-01 | 已合入 main |
| **WP-02 Project/文献只读切片** | **G1 已授权，执行中**（`bus/MANAGEMENT_TO_EXECUTION.md` seq 6） |
| POC PR #2 / #4 | 保持 OPEN 存档 |
| 全局 | 不接真实服务、不部署 |

## 2. 待用户决策
无。

## 3. 进行中
- **Execution：** 按 A56 在云端 Linux 会话实现 WP-02，完成后写 `bus/EXECUTION_TO_QA.md`。
- **QA：** 在另开的云端会话中，按 `docs/handoffs/WP-02/QA_INSTRUCTION.md` 测试，完成后写 `bus/QA_TO_DESIGN.md`。
- **Design：** 收到 QA 结果后，在 GitHub 上核对证据并作 G4 裁决。

## 4. 回传方式
Management 写 `bus/MANAGEMENT_TO_EXECUTION.md`（`DEC-6=?`）→ Execution 写 `bus/EXECUTION_TO_QA.md` → QA 写 `bus/QA_TO_DESIGN.md` → Design 进行 G4 裁决。

## 5. 不变的规则
- QA 只在独立的云端 Linux 会话中进行，所有测试都按 A54 隔离网络运行。
- 每次 QA 都针对一个 exact SHA；G4 只由 Design 裁决。
- 不使用任何密钥或真实数据。
- 冻结的 UI 不动。
- 合并、真实服务、部署都必须由用户在某个 DEC 中明确选择。
