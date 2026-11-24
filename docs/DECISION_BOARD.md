<!-- BUS from=DESIGN to=MANAGEMENT seq=3 re=bus/QA_TO_DESIGN.md@0 status=OPEN updated=2026-11-24T17:12+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（[A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) + [A52](governance/D007_A52_FILE_BUS_POLLING.md)）：** Design 每轮整体覆盖本文件，历史只在 git 里。
> - **Management：** 每 15 分钟读本文件，把 §2 的每个 DEC 以可点击选项问用户。用户选定后，写入 `bus/MANAGEMENT_TO_EXECUTION.md`。
> - **Execution：** 完成后写 `bus/EXECUTION_TO_QA.md`。
> - **QA：** 完成后写 `bus/QA_TO_DESIGN.md`，并在 PR 上评论。
>
> G1/G4 的正式授权以 `docs/architecture/D007_A*.md` 为准。

**轮次:** R3（seq 3）· 2026-11-24 17:12 · 基于 `main@83239e2`

**已记录的上一轮选择**（来自 `bus/MANAGEMENT_TO_EXECUTION.md` seq 1）：
- **DEC-1=A**：开工 WP-01。
- **DEC-2=A**：PR #2 和 PR #4 保持 OPEN，作为证据存档，不合并。

**新阻塞：** Execution 在 `bus/EXECUTION_TO_QA.md` seq 1 中报告 `status=STOP`。
- WP-01 的执行指令要求在 Linux x64 上运行，而 Execution 窗口是 Windows 10，也没有 WSL。
- Execution 停止是正确的，没有改动任何代码。
- 需要用户选择执行主机，见 DEC-3。

## 1. 当前状态
| 工作线 | 对象 | 状态 |
| --- | --- | --- |
| POC-001 R10 | PR #2 `a9131ac` | **G4 PASS_LOCAL**（[A49](architecture/D007_A49_R10_EXACT_G4_PASS_LOCAL.md)），两个 P2 已在本地关闭；按 DEC-2=A 保持 OPEN 存档 |
| Q1E-L3 | PR #4 `2757aa6` | **G4 PASS_MODEL_ONLY**（[A53](architecture/D007_A53_Q1E_L3_EXACT_G4_PASS_MODEL_ONLY.md)），两个 P2 已在模型层面关闭 |
| WP-01 合成认证 API | 未开工 | G1 已授权（[A21](architecture/D007_A21_WP01_G1_DECISION.md)），已派发（DEC-1=A），但 **Execution 因主机不是 Linux 而 STOP** |
| 全局 | — | 合并、真实服务、部署（G5/G6/G7）禁止；物理持久性、备份恢复、真实坚果云均未验证 |

**结论：** 两条 POC 补救线已全部收口。产品主线 WP-01 的执行窗口主机不满足要求，需要先决定换主机（DEC-3）。

## 2. 待用户决策（Management 逐个呈给用户）

### DEC-3：WP-01 在哪里执行？
**背景：** WP-01 指令写明要求 Linux x64 + Node v22.23.5，并且要证明外网被禁止（outbound-deny）。
- Execution 窗口是 Windows，不满足这个要求。
- Claude 云端会话是 Linux x86_64 + Node v22.23.5，正好满足。

| 选项 | 内容 | 派发（选中后由 Management 写入 `bus/MANAGEMENT_TO_EXECUTION.md` seq 2） |
| --- | --- | --- |
| **A（推荐）改用云端 Linux 会话执行** | 指令不改，零新风险 | 请用户新开一个 **Claude 云端会话**作为 Execution 窗口，让它读取 `docs/windows/EXECUTION_WINDOW_START.md` 并设置 15 分钟轮询。<br>派发内容与 seq 1 相同：A21、Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`、新分支 `exec/WP-01-synthetic-auth-api`、白名单、QA 计划，并注明 **Execution 主机为云端 Linux**。<br>原 Windows 的 Execution 窗口停止轮询。<br>QA 窗口必须再另开一个云端会话，不能和 Execution 共用。 |
| B 允许 Windows 执行 WP-01 | 需要 Design 先出一个修订，说明在 Windows 上如何证明外网被禁止 | 本轮不派发；Design 在下一轮出修订方案 |
| C 暂缓 WP-01 | — | 不派发 |

## 3. 进行中
无。

## 4. 回传方式
Management 写 `bus/MANAGEMENT_TO_EXECUTION.md`（含 `DEC-1=?`、`DEC-2=?`）→ Execution 写 `bus/EXECUTION_TO_QA.md`（PR、SHA、QA 计划路径）→ QA 写 `bus/QA_TO_DESIGN.md`（评论 ID、结论）→ Design 核对证据后进行下一轮。

## 5. 不变的规则
- QA 在独立的云端 Linux 会话中进行（Node v22.23.5）。
- 每次 QA 只针对一个 exact SHA；G4 只能由 Design 裁决。
- 不放密钥或真实数据。
- 冻结的 UI 不动。
- 合并、真实服务、部署都只能通过用户明确选择的 DEC 进行。
