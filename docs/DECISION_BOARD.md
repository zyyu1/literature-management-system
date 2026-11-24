<!-- BUS from=DESIGN to=MANAGEMENT seq=4 re=bus/QA_TO_DESIGN.md@0 status=OPEN updated=2026-11-24T17:30+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（[A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) + [A52](governance/D007_A52_FILE_BUS_POLLING.md)）：** Design 每轮整体覆盖本文件，历史只在 git 里。
> - **Management：** 每 15 分钟读本文件，把 §2 的每个 DEC 以可点击选项问用户。用户选定后，写入 `bus/MANAGEMENT_TO_EXECUTION.md`。
> - **Execution：** 完成后写 `bus/EXECUTION_TO_QA.md`。
> - **QA：** 完成后写 `bus/QA_TO_DESIGN.md`，并在 PR 上评论。
>
> G1/G4 的正式授权以 `docs/architecture/D007_A*.md` 为准。

**轮次:** R4（seq 4）· 2026-11-24 17:30 · 基于 `main@0676c891`

**已记录：** DEC-1=A、DEC-2=A、DEC-3=A（改用云端 Linux 执行）。

**上一轮的 STOP（Design 的错误）：** 我在 seq 3 中说云端会话"正好满足"要求。
- OS 和 Node 版本确实满足。
- 但云端会话**可以访问外网**，不满足 WP-01 §2 的"出站拒绝"，所以 Execution 停下是对的。

**修正：** [A54](architecture/D007_A54_WP01_EGRESS_BOUNDARY_AMENDMENT.md) 规定，在云端会话里所有测试都用 Design 提供的 `tools/offline/run-offline.sh` 运行。
- 这个脚本让命令在内核级的独立网络命名空间里执行，只有本机回环可用，外网全部不可达。
- 它只用系统自带的 `unshare` 和 Python 标准库，不安装任何东西。
- Design 已在自己的云端会话实测：在命名空间外能连上 1.1.1.1:443；在命名空间内全部返回 ENETUNREACH，探针结果 PASS。
- 这项修正没有放宽要求，反而比原要求更严。

## 1. 当前状态
| 工作线 | 对象 | 状态 |
| --- | --- | --- |
| POC-001 R10 | PR #2 `a9131ac` | **G4 PASS_LOCAL**（[A49](architecture/D007_A49_R10_EXACT_G4_PASS_LOCAL.md)），两个 P2 已在本地关闭；按 DEC-2=A 保持 OPEN 存档 |
| Q1E-L3 | PR #4 `2757aa6` | **G4 PASS_MODEL_ONLY**（[A53](architecture/D007_A53_Q1E_L3_EXACT_G4_PASS_MODEL_ONLY.md)），两个 P2 已在模型层面关闭 |
| WP-01 合成认证 API | 未开工 | G1 已授权（[A21](architecture/D007_A21_WP01_G1_DECISION.md)）；云端 Linux 执行因出网 STOP，已由 [A54](architecture/D007_A54_WP01_EGRESS_BOUNDARY_AMENDMENT.md) 修正，**待 Management 重派** |
| 全局 | — | 合并、真实服务、部署（G5/G6/G7）禁止；物理持久性、备份恢复、真实坚果云均未验证 |

**结论：** 两条 POC 补救线已全部收口；WP-01 等 Management 重派后开始执行。

## 2. 待用户决策
无。DEC-3=A 已由 A54 落实，不需要新的选择。

## 3. 进行中：Management 直接执行（无需再问用户）
**任务：重派 WP-01。** 写入 `bus/MANAGEMENT_TO_EXECUTION.md` seq 4，`re=DECISION_BOARD.md@4`。

**派发内容：**
- 与 seq 3 相同：A21、Base `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`、新分支 `exec/WP-01-synthetic-auth-api`、白名单、QA 计划 `docs/handoffs/WP-01/QA_INSTRUCTION.md`。
- 新增：**按 [A54](architecture/D007_A54_WP01_EGRESS_BOUNDARY_AMENDMENT.md) §3 执行**。
  - 先跑出站探针，结果必须是 PASS。
  - 所有测试和服务器命令都要通过 `run-offline.sh` 运行。
  - git 命令在命名空间外执行。
  - 不得把 `tools/` 加到 WP-01 分支。

**执行与 QA 的窗口：**
- 执行窗口沿用当前的云端 Execution 会话。
- QA 必须另开一个云端会话，同样按 A54 运行。

## 4. 回传方式
Management 写 `bus/MANAGEMENT_TO_EXECUTION.md`（含 `DEC-1=?`、`DEC-2=?`）→ Execution 写 `bus/EXECUTION_TO_QA.md`（PR、SHA、QA 计划路径）→ QA 写 `bus/QA_TO_DESIGN.md`（评论 ID、结论）→ Design 核对证据后进行下一轮。

## 5. 不变的规则
- QA 在独立的云端 Linux 会话中进行（Node v22.23.5）。
- 每次 QA 只针对一个 exact SHA；G4 只能由 Design 裁决。
- 不放密钥或真实数据。
- 冻结的 UI 不动。
- 合并、真实服务、部署都只能通过用户明确选择的 DEC 进行。
