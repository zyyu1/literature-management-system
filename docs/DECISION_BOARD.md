<!-- BUS from=DESIGN to=MANAGEMENT seq=2 re=bus/QA_TO_DESIGN.md@0 status=OPEN updated=2026-11-24T17:00+01:00 -->
# 决策板 / Decision Board — 每轮整体覆盖

> **用法（[A51](governance/D007_A51_DECISION_BOARD_WORKFLOW.md) + [A52](governance/D007_A52_FILE_BUS_POLLING.md)）：** Design 每轮整体覆盖本文件，历史只在 git 里。
> - **Management：** 每 15 分钟读本文件，把 §2 的每个 DEC 以可点击选项问用户。用户选定后，写入 `bus/MANAGEMENT_TO_EXECUTION.md`。
> - **Execution：** 完成后写 `bus/EXECUTION_TO_QA.md`。
> - **QA：** 完成后写 `bus/QA_TO_DESIGN.md`，并在 PR 上评论。
>
> G1/G4 的正式授权以 `docs/architecture/D007_A*.md` 为准。

**轮次:** R2（seq 2）· 2026-11-24 · 基于 `main@affd46a`
注：本轮的 QA 结果是 Management 在聊天里转来的，`bus/QA_TO_DESIGN.md` 仍为 seq 0。下一轮起请 QA 写入该文件。

## 1. 当前状态
| 工作线 | 对象 | 状态 |
| --- | --- | --- |
| POC-001 R10 | PR #2 `a9131ac` | **G4 PASS_LOCAL**（[A49](architecture/D007_A49_R10_EXACT_G4_PASS_LOCAL.md)），两个 P2 已在本地关闭 |
| Q1E-L3 | PR #4 `2757aa6` | **G4 PASS_MODEL_ONLY**（[A53](architecture/D007_A53_Q1E_L3_EXACT_G4_PASS_MODEL_ONLY.md)），两个 P2 已在模型层面关闭 |
| WP-01 合成认证 API | 未开工 | G1 已授权（[A21](architecture/D007_A21_WP01_G1_DECISION.md)） |
| 全局 | — | 合并、真实服务、部署（G5/G6/G7）禁止；物理持久性、备份恢复、真实坚果云均未验证 |

**结论：** 两条 POC 补救线已全部收口，目前没有任何在等待中的 QA。项目可以转入产品主线。

## 2. 待用户决策（Management 逐个呈给用户）

### DEC-1：开工 WP-01（第一个产品切片）
**背景：** 本地合成数据的认证与会话 API，只用 Node 内置模块，不接任何真实服务。

| 选项 | 内容 | 派发（选中后由 Management 写入 `bus/MANAGEMENT_TO_EXECUTION.md`） |
| --- | --- | --- |
| **A（推荐）现在开工** | 按 A21 G1 执行 | **授权：** [A21](architecture/D007_A21_WP01_G1_DECISION.md) + [EXECUTION_INSTRUCTION](handoffs/WP-01/EXECUTION_INSTRUCTION.md)<br>**Base：** `9cfc1d7375f81ab35921a02eebf1a1c9d941476a`<br>**新分支：** `exec/WP-01-synthetic-auth-api`<br>**白名单：** `packages/wp-01-synthetic-auth-api/**`、`docs/handoffs/WP-01/QA_HANDOFF.md`<br>**QA 计划：** [WP-01 QA_INSTRUCTION](handoffs/WP-01/QA_INSTRUCTION.md)，在云端 Linux 会话中运行，Node v22.23.5 |
| B 暂缓 | 先做其他规划 | 不派发 |

### DEC-2：两个 POC PR 怎么处理
**背景：** PR #2 和 PR #4 都已通过本地或模型层面的 G4。它们只是可行性证据，不是产品代码。

| 选项 | 内容 | 派发 |
| --- | --- | --- |
| **A（推荐）保留不合并** | 两个 PR 保持 OPEN，作为证据存档；产品代码在 WP 系列中重写 | 不派发，Design 在下一轮记录 |
| B 合并进 main（G5） | 把 POC 代码并入 `main` | Design 会先在下一轮出合并方案（G5 专项），本轮不派发 |
| C 关闭 PR | 关闭但保留分支 | Management 直接关闭 PR #2 和 #4，不删除分支 |

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
